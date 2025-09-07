'use client';

import { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import { showInfo, showSuccess } from './toast';
import { apiLogger } from './logger';

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

// Pusher client setup
class RealtimeClient {
  private pusher: Pusher | null = null;
  private channels: Map<string, any> = new Map();
  private isConnected = false;

  constructor() {
    this.initializePusher();
  }

  private initializePusher() {
    if (typeof window === 'undefined') return;

    try {
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
        apiLogger.info('Pusher connected');
      });

      this.pusher.connection.bind('disconnected', () => {
        this.isConnected = false;
        apiLogger.warn('Pusher disconnected');
      });

      this.pusher.connection.bind('error', (error: any) => {
        apiLogger.error('Pusher connection error', error);
      });
    } catch (error) {
      apiLogger.error('Failed to initialize Pusher', error);
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
      apiLogger.error('Failed to send presence update', error);
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
        showInfo(`Task "${event.data.task?.title || 'Unknown'}" was updated by ${event.userName}`);
      },
      onProjectUpdate: (event) => {
        setRecentUpdates(prev => [event, ...prev.slice(0, 9)]);
        showInfo(`Project was updated by ${event.userName}`);
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
          showInfo(`New comment by ${event.userName}`);
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
        showInfo(event.data.message || 'New notification');
      },
      onSystemUpdate: (event) => {
        setSystemUpdates(prev => [event, ...prev.slice(0, 9)]); // Keep last 10
        if (event.data.type === 'maintenance') {
          showInfo('System maintenance scheduled');
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

// Real-time presence indicator component
export function PresenceIndicator({ users }: { users: Array<{ userId: string; userName: string }> }) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user, index) => (
          <div
            key={user.userId}
            className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-slate-800 relative"
            title={user.userName}
          >
            {user.userName.charAt(0).toUpperCase()}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-800"></div>
          </div>
        ))}
        {users.length > 3 && (
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-slate-800">
            +{users.length - 3}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-500 dark:text-slate-400">
        {users.length} online
      </span>
    </div>
  );
}

// Typing indicator component
export function TypingIndicator({ users }: { users: Array<{ userName: string }> }) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-slate-400">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>
        {users.length === 1 
          ? `${users[0].userName} is typing...`
          : `${users.length} people are typing...`
        }
      </span>
    </div>
  );
}

// Conflict resolution component
export function ConflictIndicator({ conflicts }: { 
  conflicts: Array<{ field: string; conflictingUsers: string[] }> 
}) {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Editing Conflicts Detected
          </h4>
          <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            {conflicts.map(conflict => (
              <div key={conflict.field}>
                <strong>{conflict.field}:</strong> {conflict.conflictingUsers.join(', ')} are editing
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Server-side Pusher utilities (for API routes)
export class PusherServer {
  private pusher: any = null;

  constructor() {
    if (typeof window === 'undefined') {
      try {
        const Pusher = require('pusher');
        this.pusher = new Pusher({
          appId: process.env.PUSHER_APP_ID,
          key: process.env.PUSHER_KEY,
          secret: process.env.PUSHER_SECRET,
          cluster: process.env.PUSHER_CLUSTER || 'us2',
          useTLS: true,
        });
      } catch (error) {
        apiLogger.error('Failed to initialize Pusher server', error);
      }
    }
  }

  async triggerTaskUpdate(projectId: string, event: TaskUpdateEvent) {
    if (!this.pusher) return;

    try {
      await this.pusher.trigger(`project-${projectId}`, event.type, event);
      apiLogger.info('Task update event triggered', {
        projectId,
        eventType: event.type,
        taskId: event.data.taskId,
      });
    } catch (error) {
      apiLogger.error('Failed to trigger task update event', error);
    }
  }

  async triggerProjectUpdate(projectId: string, event: ProjectUpdateEvent) {
    if (!this.pusher) return;

    try {
      await this.pusher.trigger(`project-${projectId}`, event.type, event);
      apiLogger.info('Project update event triggered', {
        projectId,
        eventType: event.type,
      });
    } catch (error) {
      apiLogger.error('Failed to trigger project update event', error);
    }
  }

  async triggerUserPresence(projectId: string, event: UserPresenceEvent) {
    if (!this.pusher) return;

    try {
      await this.pusher.trigger(`project-${projectId}`, event.type, event);
    } catch (error) {
      apiLogger.error('Failed to trigger presence event', error);
    }
  }

  async triggerComment(projectId: string, event: CommentEvent) {
    if (!this.pusher) return;

    try {
      await this.pusher.trigger(`project-${projectId}`, event.type, event);
      apiLogger.info('Comment event triggered', {
        projectId,
        eventType: event.type,
        commentId: event.data.commentId,
      });
    } catch (error) {
      apiLogger.error('Failed to trigger comment event', error);
    }
  }

  async triggerGlobalNotification(event: RealtimeEvent) {
    if (!this.pusher) return;

    try {
      await this.pusher.trigger('global', 'notification', event);
      apiLogger.info('Global notification triggered', {
        eventType: event.type,
      });
    } catch (error) {
      apiLogger.error('Failed to trigger global notification', error);
    }
  }
}

// Global server instance
export const pusherServer = new PusherServer();

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