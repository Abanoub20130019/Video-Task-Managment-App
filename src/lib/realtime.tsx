import React, { useState, useEffect, useCallback } from 'react';
// Pusher import temporarily disabled - install with: npm install pusher-js @types/pusher-js
// import Pusher from 'pusher-js';

// Types for real-time events
interface RealtimeEvent {
  type: string;
  data: any;
  userId: string;
  userName: string;
  timestamp: string;
}

interface TaskUpdateEvent extends RealtimeEvent {
  type: 'task_updated' | 'task_created' | 'task_deleted';
  data: {
    taskId: string;
    projectId: string;
    changes?: any;
    task?: any;
  };
}

interface ProjectUpdateEvent extends RealtimeEvent {
  type: 'project_updated' | 'project_created';
  data: {
    projectId: string;
    changes?: any;
    project?: any;
  };
}

interface UserPresenceEvent extends RealtimeEvent {
  type: 'user_joined' | 'user_left' | 'user_typing';
  data: {
    userId: string;
    userName: string;
    location?: string;
  };
}

interface CommentEvent extends RealtimeEvent {
  type: 'comment_added' | 'comment_updated' | 'comment_deleted';
  data: {
    commentId: string;
    taskId?: string;
    projectId?: string;
    content?: string;
  };
}

// Pusher client setup with fallback when Pusher is not available
class RealtimeClient {
  private pusher: any | null = null;
  private channels: Map<string, any> = new Map();
  private isConnected = false;

  constructor() {
    this.initializePusher();
  }

  private async initializePusher() {
    if (typeof window === 'undefined') return;

    try {
      // Try to dynamically import Pusher
      const PusherModule = await import('pusher-js').catch(() => {
        console.warn('Pusher-js not available, real-time features disabled');
        return null;
      });

      if (!PusherModule) return;

      const Pusher = PusherModule.default;
      
      this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
        encrypted: true,
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });

      this.pusher.connection.bind('connected', () => {
        this.isConnected = true;
        console.log('Pusher connected');
      });

      this.pusher.connection.bind('disconnected', () => {
        this.isConnected = false;
        console.log('Pusher disconnected');
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error('Pusher connection error', error);
      });
    } catch (error) {
      console.error('Failed to initialize Pusher', error);
    }
  }

  subscribeToProject(projectId: string, callbacks: {
    onTaskUpdate?: (event: TaskUpdateEvent) => void;
    onProjectUpdate?: (event: ProjectUpdateEvent) => void;
    onUserPresence?: (event: UserPresenceEvent) => void;
    onComment?: (event: CommentEvent) => void;
  }) {
    if (!this.pusher) return null;

    const channelName = `project-${projectId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.pusher.subscribe(channelName);

    // Bind event handlers
    if (callbacks.onTaskUpdate) {
      channel.bind('task_updated', callbacks.onTaskUpdate);
      channel.bind('task_created', callbacks.onTaskUpdate);
      channel.bind('task_deleted', callbacks.onTaskUpdate);
    }

    if (callbacks.onProjectUpdate) {
      channel.bind('project_updated', callbacks.onProjectUpdate);
    }

    if (callbacks.onUserPresence) {
      channel.bind('user_joined', callbacks.onUserPresence);
      channel.bind('user_left', callbacks.onUserPresence);
      channel.bind('user_typing', callbacks.onUserPresence);
    }

    if (callbacks.onComment) {
      channel.bind('comment_added', callbacks.onComment);
      channel.bind('comment_updated', callbacks.onComment);
      channel.bind('comment_deleted', callbacks.onComment);
    }

    this.channels.set(channelName, channel);
    return channel;
  }

  subscribeToGlobal(callbacks: {
    onNotification?: (event: RealtimeEvent) => void;
    onSystemUpdate?: (event: RealtimeEvent) => void;
  }) {
    if (!this.pusher) return null;

    const channelName = 'global';
    const channel = this.pusher.subscribe(channelName);

    if (callbacks.onNotification) {
      channel.bind('notification', callbacks.onNotification);
    }

    if (callbacks.onSystemUpdate) {
      channel.bind('system_update', callbacks.onSystemUpdate);
    }

    this.channels.set(channelName, channel);
    return channel;
  }

  unsubscribeFromProject(projectId: string) {
    const channelName = `project-${projectId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      this.pusher?.unsubscribe(channelName);
      this.channels.delete(channelName);
    }
  }

  sendUserPresence(projectId: string, action: 'join' | 'leave' | 'typing', location?: string) {
    if (!this.isConnected) return;

    // This would typically be sent to your backend to broadcast
    fetch('/api/realtime/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        action,
        location,
        timestamp: new Date().toISOString(),
      }),
    }).catch(error => {
      console.error('Failed to send presence update', error);
    });
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.channels.clear();
      this.isConnected = false;
    }
  }

  getConnectionState() {
    return {
      isConnected: this.isConnected,
      state: this.pusher?.connection.state,
    };
  }
}

// Global realtime client instance
export const realtimeClient = new RealtimeClient();

// React hooks for real-time functionality
export function useRealtimeProject(projectId: string) {
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; userName: string; location?: string }>>([]);
  const [recentUpdates, setRecentUpdates] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const channel = realtimeClient.subscribeToProject(projectId, {
      onTaskUpdate: (event) => {
        setRecentUpdates(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 updates
        console.log(`Task "${event.data.task?.title || 'Unknown'}" was updated by ${event.userName}`);
      },
      onProjectUpdate: (event) => {
        setRecentUpdates(prev => [event, ...prev.slice(0, 9)]);
        console.log(`Project was updated by ${event.userName}`);
      },
      onUserPresence: (event) => {
        if (event.type === 'user_joined') {
          setOnlineUsers(prev => [...prev.filter(u => u.userId !== event.userId), {
            userId: event.userId,
            userName: event.userName,
            location: event.data.location,
          }]);
        } else if (event.type === 'user_left') {
          setOnlineUsers(prev => prev.filter(u => u.userId !== event.userId));
        }
      },
      onComment: (event) => {
        if (event.type === 'comment_added') {
          console.log(`New comment by ${event.userName}`);
        }
      },
    });

    // Send join presence
    realtimeClient.sendUserPresence(projectId, 'join', window.location.pathname);

    return () => {
      realtimeClient.sendUserPresence(projectId, 'leave');
      realtimeClient.unsubscribeFromProject(projectId);
    };
  }, [projectId]);

  const sendTypingIndicator = useCallback((location: string) => {
    if (projectId) {
      realtimeClient.sendUserPresence(projectId, 'typing', location);
    }
  }, [projectId]);

  return {
    onlineUsers,
    recentUpdates,
    sendTypingIndicator,
    connectionState: realtimeClient.getConnectionState(),
  };
}

// Hook for global real-time events
export function useRealtimeGlobal() {
  const [notifications, setNotifications] = useState<RealtimeEvent[]>([]);
  const [systemUpdates, setSystemUpdates] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const channel = realtimeClient.subscribeToGlobal({
      onNotification: (event) => {
        setNotifications(prev => [event, ...prev.slice(0, 19)]); // Keep last 20
        console.log(event.data.message || 'New notification');
      },
      onSystemUpdate: (event) => {
        setSystemUpdates(prev => [event, ...prev.slice(0, 9)]); // Keep last 10
        if (event.data.type === 'maintenance') {
          console.log('System maintenance scheduled');
        }
      },
    });

    return () => {
      // Global channel cleanup handled by RealtimeClient
    };
  }, []);

  return {
    notifications,
    systemUpdates,
  };
}

// Collaborative editing hook
export function useCollaborativeEditing(entityId: string, entityType: 'task' | 'project') {
  const [activeEditors, setActiveEditors] = useState<Array<{
    userId: string;
    userName: string;
    field: string;
    timestamp: string;
  }>>([]);

  const [conflicts, setConflicts] = useState<Array<{
    field: string;
    conflictingUsers: string[];
    timestamp: string;
  }>>([]);

  const startEditing = useCallback((field: string, userId: string, userName: string) => {
    // Send editing start event
    fetch('/api/realtime/editing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityId,
        entityType,
        field,
        action: 'start',
        userId,
        userName,
      }),
    });

    // Update local state
    setActiveEditors(prev => [
      ...prev.filter(e => !(e.userId === userId && e.field === field)),
      { userId, userName, field, timestamp: new Date().toISOString() },
    ]);
  }, [entityId, entityType]);

  const stopEditing = useCallback((field: string, userId: string) => {
    // Send editing stop event
    fetch('/api/realtime/editing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityId,
        entityType,
        field,
        action: 'stop',
        userId,
      }),
    });

    // Update local state
    setActiveEditors(prev => prev.filter(e => !(e.userId === userId && e.field === field)));
  }, [entityId, entityType]);

  const checkConflicts = useCallback((field: string) => {
    const editorsForField = activeEditors.filter(e => e.field === field);
    if (editorsForField.length > 1) {
      setConflicts(prev => [
        ...prev.filter(c => c.field !== field),
        {
          field,
          conflictingUsers: editorsForField.map(e => e.userName),
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      setConflicts(prev => prev.filter(c => c.field !== field));
    }
  }, [activeEditors]);

  useEffect(() => {
    // Check for conflicts whenever active editors change
    const fields = [...new Set(activeEditors.map(e => e.field))];
    fields.forEach(checkConflicts);
  }, [activeEditors, checkConflicts]);

  return {
    activeEditors,
    conflicts,
    startEditing,
    stopEditing,
    isFieldBeingEdited: (field: string) => activeEditors.some(e => e.field === field),
    getFieldEditors: (field: string) => activeEditors.filter(e => e.field === field),
  };
}

// Utility functions
export function createTaskUpdateEvent(
  taskId: string,
  projectId: string,
  userId: string,
  userName: string,
  changes?: any,
  task?: any
): TaskUpdateEvent {
  return {
    type: task ? 'task_created' : 'task_updated',
    data: { taskId, projectId, changes, task },
    userId,
    userName,
    timestamp: new Date().toISOString(),
  };
}

export function createCommentEvent(
  commentId: string,
  userId: string,
  userName: string,
  taskId?: string,
  projectId?: string,
  content?: string
): CommentEvent {
  return {
    type: 'comment_added',
    data: { commentId, taskId, projectId, content },
    userId,
    userName,
    timestamp: new Date().toISOString(),
  };
}

export default realtimeClient;