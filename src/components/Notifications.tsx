'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'overdue' | 'due_soon';
  title: string;
  message: string;
  taskId: string;
  projectId: string;
  dueDate: string;
  priority: string;
}

export default function Notifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'bg-red-50 border-red-200';
      case 'due_soon':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!session || loading) {
    return null;
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
        <p className="text-sm text-gray-500">No notifications at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border rounded-lg ${getNotificationColor(notification.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-700 mt-1">
                  {notification.message}
                </p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                    {notification.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-xs text-gray-500">
                    Due: {new Date(notification.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <Link
                  href={`/projects/${notification.projectId}`}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  View Task
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href="/notifications"
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}