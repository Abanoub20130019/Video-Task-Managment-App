'use client';

import { useEffect, useState } from 'react';
import { showSuccess, showError, showInfo } from './toast';
import { apiLogger } from './logger';

// Firebase Cloud Messaging types
interface FCMConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Firebase messaging wrapper
class NotificationManager {
  private messaging: any = null;
  private isSupported = false;
  private isInitialized = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport() {
    this.isSupported = 
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
  }

  async initialize(config: FCMConfig) {
    if (!this.isSupported || this.isInitialized) return;

    try {
      // Dynamic import of Firebase
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

      const app = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });

      this.messaging = getMessaging(app);
      this.isInitialized = true;

      // Handle foreground messages
      onMessage(this.messaging, (payload) => {
        apiLogger.info('Foreground message received', payload);
        this.handleForegroundMessage(payload);
      });

      apiLogger.info('Firebase messaging initialized');
    } catch (error) {
      apiLogger.error('Failed to initialize Firebase messaging', error);
      this.isSupported = false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      showError('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        showSuccess('Push notifications enabled!');
        return true;
      } else if (permission === 'denied') {
        showError('Push notifications were denied. Please enable them in browser settings.');
        return false;
      } else {
        showInfo('Push notification permission is required for real-time updates');
        return false;
      }
    } catch (error) {
      apiLogger.error('Failed to request notification permission', error);
      showError('Failed to request notification permission');
      return false;
    }
  }

  async getRegistrationToken(vapidKey: string): Promise<string | null> {
    if (!this.messaging || !this.isInitialized) return null;

    try {
      const { getToken } = await import('firebase/messaging');
      
      const token = await getToken(this.messaging, {
        vapidKey,
      });

      if (token) {
        apiLogger.info('FCM registration token obtained');
        return token;
      } else {
        apiLogger.warn('No registration token available');
        return null;
      }
    } catch (error) {
      apiLogger.error('Failed to get FCM token', error);
      return null;
    }
  }

  private handleForegroundMessage(payload: any) {
    const { notification, data } = payload;
    
    if (notification) {
      // Show custom notification
      this.showLocalNotification({
        title: notification.title || 'VideoTask Manager',
        body: notification.body || 'New notification',
        icon: notification.icon || '/icons/icon-192x192.png',
        data: data || {},
      });
    }
  }

  showLocalNotification(payload: NotificationPayload) {
    if (!this.isSupported || Notification.permission !== 'granted') return;

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        image: payload.image,
        data: payload.data,
        tag: payload.data?.type || 'general',
        renotify: true,
        requireInteraction: payload.data?.priority === 'high',
        actions: payload.actions,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Handle notification click based on data
        if (payload.data?.url) {
          window.open(payload.data.url, '_blank');
        } else if (payload.data?.taskId) {
          window.open(`/tasks/${payload.data.taskId}`, '_blank');
        } else if (payload.data?.projectId) {
          window.open(`/projects/${payload.data.projectId}`, '_blank');
        }
        
        notification.close();
      };

      // Auto-close after 5 seconds unless high priority
      if (payload.data?.priority !== 'high') {
        setTimeout(() => notification.close(), 5000);
      }

      apiLogger.info('Local notification shown', {
        title: payload.title,
        type: payload.data?.type,
      });
    } catch (error) {
      apiLogger.error('Failed to show local notification', error);
    }
  }

  async subscribeToTopic(topic: string, token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        }),
      });

      if (response.ok) {
        apiLogger.info('Subscribed to notification topic', { topic });
        return true;
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      apiLogger.error('Failed to subscribe to topic', error);
      return false;
    }
  }

  async unsubscribeFromTopic(topic: string, token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        }),
      });

      if (response.ok) {
        apiLogger.info('Unsubscribed from notification topic', { topic });
        return true;
      } else {
        throw new Error('Unsubscription failed');
      }
    } catch (error) {
      apiLogger.error('Failed to unsubscribe from topic', error);
      return false;
    }
  }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();

// React hook for push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSupported(notificationManager['isSupported']);
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await notificationManager.requestPermission();
      setPermission(Notification.permission);
      
      if (granted) {
        // Initialize Firebase and get token
        const config = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
        };

        await notificationManager.initialize(config);
        const fcmToken = await notificationManager.getRegistrationToken(config.vapidKey);
        
        if (fcmToken) {
          setToken(fcmToken);
          
          // Register token with backend
          await fetch('/api/notifications/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: fcmToken }),
          });
        }
      }
      
      return granted;
    } catch (error) {
      showError('Failed to setup push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToProject = async (projectId: string) => {
    if (!token) return false;
    return notificationManager.subscribeToTopic(`project-${projectId}`, token);
  };

  const unsubscribeFromProject = async (projectId: string) => {
    if (!token) return false;
    return notificationManager.unsubscribeFromTopic(`project-${projectId}`, token);
  };

  const showTestNotification = () => {
    notificationManager.showLocalNotification({
      title: 'Test Notification',
      body: 'Push notifications are working correctly!',
      data: { type: 'test' },
    });
  };

  return {
    isSupported,
    permission,
    token,
    isLoading,
    requestPermission,
    subscribeToProject,
    unsubscribeFromProject,
    showTestNotification,
  };
}

// Notification preferences component
export function NotificationSettings() {
  const { isSupported, permission, requestPermission, isLoading, showTestNotification } = usePushNotifications();
  const [preferences, setPreferences] = useState({
    taskAssignments: true,
    taskDeadlines: true,
    projectUpdates: true,
    mentions: true,
    systemUpdates: false,
  });

  const handlePreferenceChange = async (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    try {
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      showError('Failed to update notification preferences');
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Push notifications are not supported in this browser. Please use Chrome, Firefox, or Safari for notification features.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">
        Notification Settings
      </h3>

      {/* Permission Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100">
              Push Notifications
            </h4>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Status: {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not enabled'}
            </p>
          </div>
          <div className="flex space-x-2">
            {permission !== 'granted' && (
              <button
                onClick={requestPermission}
                disabled={isLoading}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
              >
                {isLoading ? 'Setting up...' : 'Enable'}
              </button>
            )}
            {permission === 'granted' && (
              <button
                onClick={showTestNotification}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
              >
                Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      {permission === 'granted' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100">
            Notification Types
          </h4>
          
          {Object.entries(preferences).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {getPreferenceDescription(key)}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getPreferenceDescription(key: string): string {
  const descriptions = {
    taskAssignments: 'Get notified when tasks are assigned to you',
    taskDeadlines: 'Get notified about upcoming task deadlines',
    projectUpdates: 'Get notified about project status changes',
    mentions: 'Get notified when someone mentions you',
    systemUpdates: 'Get notified about system maintenance and updates',
  };
  return descriptions[key as keyof typeof descriptions] || '';
}

// Server-side notification utilities
export class ServerNotificationManager {
  private admin: any = null;

  constructor() {
    this.initializeAdmin();
  }

  private async initializeAdmin() {
    if (typeof window !== 'undefined') return;

    try {
      const admin = require('firebase-admin');
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }

      this.admin = admin;
      apiLogger.info('Firebase Admin initialized');
    } catch (error) {
      apiLogger.error('Failed to initialize Firebase Admin', error);
    }
  }

  async sendToToken(token: string, payload: NotificationPayload): Promise<boolean> {
    if (!this.admin) return false;

    try {
      const message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image,
        },
        data: payload.data ? Object.fromEntries(
          Object.entries(payload.data).map(([k, v]) => [k, String(v)])
        ) : {},
        webpush: {
          notification: {
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: payload.badge || '/icons/badge-72x72.png',
            actions: payload.actions,
            requireInteraction: payload.data?.priority === 'high',
          },
        },
      };

      const response = await this.admin.messaging().send(message);
      apiLogger.info('Push notification sent', { messageId: response, token: token.substring(0, 20) + '...' });
      return true;
    } catch (error) {
      apiLogger.error('Failed to send push notification', error);
      return false;
    }
  }

  async sendToTopic(topic: string, payload: NotificationPayload): Promise<boolean> {
    if (!this.admin) return false;

    try {
      const message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ? Object.fromEntries(
          Object.entries(payload.data).map(([k, v]) => [k, String(v)])
        ) : {},
      };

      const response = await this.admin.messaging().send(message);
      apiLogger.info('Topic notification sent', { messageId: response, topic });
      return true;
    } catch (error) {
      apiLogger.error('Failed to send topic notification', error);
      return false;
    }
  }

  async sendToMultipleTokens(tokens: string[], payload: NotificationPayload): Promise<{
    successCount: number;
    failureCount: number;
    responses: any[];
  }> {
    if (!this.admin || tokens.length === 0) {
      return { successCount: 0, failureCount: 0, responses: [] };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ? Object.fromEntries(
          Object.entries(payload.data).map(([k, v]) => [k, String(v)])
        ) : {},
        tokens,
      };

      const response = await this.admin.messaging().sendMulticast(message);
      
      apiLogger.info('Multicast notification sent', {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length,
      });

      return response;
    } catch (error) {
      apiLogger.error('Failed to send multicast notification', error);
      return { successCount: 0, failureCount: tokens.length, responses: [] };
    }
  }
}

// Global server notification manager
export const serverNotificationManager = new ServerNotificationManager();

// Notification types for the app
export const NotificationTypes = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_DUE_SOON: 'task_due_soon',
  TASK_OVERDUE: 'task_overdue',
  TASK_COMPLETED: 'task_completed',
  PROJECT_UPDATED: 'project_updated',
  MENTION: 'mention',
  COMMENT_REPLY: 'comment_reply',
  SYSTEM_UPDATE: 'system_update',
} as const;

// Helper functions for creating notifications
export const NotificationHelpers = {
  taskAssigned: (taskTitle: string, assigneeName: string, projectName: string) => ({
    title: 'New Task Assigned',
    body: `"${taskTitle}" has been assigned to ${assigneeName} in ${projectName}`,
    data: { type: NotificationTypes.TASK_ASSIGNED, priority: 'medium' },
  }),

  taskDueSoon: (taskTitle: string, dueDate: string) => ({
    title: 'Task Due Soon',
    body: `"${taskTitle}" is due ${dueDate}`,
    data: { type: NotificationTypes.TASK_DUE_SOON, priority: 'high' },
  }),

  taskOverdue: (taskTitle: string, daysPastDue: number) => ({
    title: 'Task Overdue',
    body: `"${taskTitle}" is ${daysPastDue} day${daysPastDue > 1 ? 's' : ''} overdue`,
    data: { type: NotificationTypes.TASK_OVERDUE, priority: 'high' },
  }),

  mention: (mentionerName: string, entityType: string, entityTitle: string) => ({
    title: 'You were mentioned',
    body: `${mentionerName} mentioned you in ${entityType}: "${entityTitle}"`,
    data: { type: NotificationTypes.MENTION, priority: 'medium' },
  }),

  projectUpdate: (projectName: string, updateType: string) => ({
    title: 'Project Updated',
    body: `${projectName} has been ${updateType}`,
    data: { type: NotificationTypes.PROJECT_UPDATED, priority: 'low' },
  }),
};

export default notificationManager;