// React hooks temporarily disabled - move to a separate React component file if needed
// import { useEffect, useState } from 'react';
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
  data?: any;
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
      // Try to import Firebase, but don't fail if not available
      const firebaseApp = await import('firebase/app').catch(() => {
        apiLogger.warn('Firebase app module not available');
        return null;
      });
      
      const firebaseMessaging = await import('firebase/messaging').catch(() => {
        apiLogger.warn('Firebase messaging module not available');
        return null;
      });

      if (!firebaseApp || !firebaseMessaging) {
        apiLogger.warn('Firebase modules not available, push notifications disabled');
        this.isSupported = false;
        return;
      }

      const { initializeApp } = firebaseApp;
      const { getMessaging, getToken, onMessage } = firebaseMessaging;

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
      onMessage(this.messaging, (payload: any) => {
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
      const firebaseMessaging = await import('firebase/messaging').catch(() => null);
      if (!firebaseMessaging) {
        apiLogger.warn('Firebase messaging not available');
        return null;
      }
      
      const { getToken } = firebaseMessaging;
      
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
        data: payload.data,
        tag: payload.data?.type || 'general',
        requireInteraction: payload.data?.priority === 'high',
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (payload.data?.url) {
          window.open(payload.data.url, '_blank');
        } else if (payload.data?.taskId) {
          window.open(`/tasks/${payload.data.taskId}`, '_blank');
        } else if (payload.data?.projectId) {
          window.open(`/projects/${payload.data.projectId}`, '_blank');
        }
        
        notification.close();
      };

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
}

// Global notification manager instance
export const notificationManager = new NotificationManager();

// React hook for push notifications - moved to separate React component file
// This should be moved to a .tsx file to use React hooks properly
export function createPushNotificationHook() {
  return {
    isSupported: notificationManager['isSupported'],
    permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
    requestPermission: () => notificationManager.requestPermission(),
  };
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
      // Firebase admin import temporarily disabled - install with: npm install firebase-admin
      const admin = null; // require('firebase-admin');
      
      if (admin && !admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        this.admin = admin;
        apiLogger.info('Firebase Admin initialized');
      } else {
        apiLogger.warn('Firebase Admin not available');
      }
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
        },
        data: payload.data ? Object.fromEntries(
          Object.entries(payload.data).map(([k, v]) => [k, String(v)])
        ) : {},
      };

      const response = await this.admin.messaging().send(message);
      apiLogger.info('Push notification sent', { messageId: response });
      return true;
    } catch (error) {
      apiLogger.error('Failed to send push notification', error);
      return false;
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

export default notificationManager;