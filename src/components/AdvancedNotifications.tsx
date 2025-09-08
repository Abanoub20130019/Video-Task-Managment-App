'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { showError, showSuccess } from '@/lib/toast';

interface NotificationItem {
  id: string;
  type: 'task_assigned' | 'task_due' | 'project_update' | 'mention' | 'deadline' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  timestamp: string;
  actionUrl?: string;
  projectId?: string;
  taskId?: string;
  userId?: string;
  metadata?: {
    projectName?: string;
    taskName?: string;
    assignedBy?: string;
    dueDate?: string;
  };
}

interface NotificationFilters {
  types: string[];
  priorities: string[];
  read: boolean | null;
  dateRange: 'today' | 'week' | 'month' | 'all';
}

interface AdvancedNotificationsProps {
  showFilters?: boolean;
  maxItems?: number;
  compact?: boolean;
}

export default function AdvancedNotifications({
  showFilters = true,
  maxItems = 50,
  compact = false
}: AdvancedNotificationsProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NotificationFilters>({
    types: [],
    priorities: [],
    read: null,
    dateRange: 'all'
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      // Set up real-time updates
      const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [notifications, filters]);

  useEffect(() => {
    generateSmartSuggestions();
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/advanced');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Filter by type
    if (filters.types.length > 0) {
      filtered = filtered.filter(n => filters.types.includes(n.type));
    }

    // Filter by priority
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(n => filters.priorities.includes(n.priority));
    }

    // Filter by read status
    if (filters.read !== null) {
      filtered = filtered.filter(n => n.read === filters.read);
    }

    // Filter by date range
    const now = new Date();
    const filterDate = new Date();
    
    switch (filters.dateRange) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      default:
        filterDate.setFullYear(2000); // Show all
    }

    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(n => new Date(n.timestamp) >= filterDate);
    }

    // Sort by priority and timestamp
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setFilteredNotifications(filtered.slice(0, maxItems));
  };

  const generateSmartSuggestions = () => {
    const suggestions: string[] = [];
    const now = new Date();
    
    // Analyze notification patterns
    const unreadUrgent = notifications.filter(n => !n.read && n.priority === 'urgent').length;
    const overdueTasks = notifications.filter(n => 
      n.type === 'task_due' && 
      n.metadata?.dueDate && 
      new Date(n.metadata.dueDate) < now
    ).length;
    
    if (unreadUrgent > 0) {
      suggestions.push(`You have ${unreadUrgent} urgent notification${unreadUrgent > 1 ? 's' : ''} that need immediate attention`);
    }
    
    if (overdueTasks > 0) {
      suggestions.push(`${overdueTasks} task${overdueTasks > 1 ? 's are' : ' is'} overdue and require action`);
    }
    
    const todayNotifications = notifications.filter(n => {
      const notifDate = new Date(n.timestamp);
      return notifDate.toDateString() === now.toDateString();
    }).length;
    
    if (todayNotifications > 10) {
      suggestions.push('Consider enabling digest mode to reduce notification frequency');
    }
    
    setSmartSuggestions(suggestions);
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        showSuccess(`Marked ${notificationIds.length} notification${notificationIds.length > 1 ? 's' : ''} as read`);
      }
    } catch (error) {
      showError('Failed to mark notifications as read');
    }
  };

  const markAllAsRead = () => {
    const unreadIds = filteredNotifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
        setSelectedNotifications([]);
        showSuccess(`Deleted ${notificationIds.length} notification${notificationIds.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      showError('Failed to delete notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      task_assigned: '📋',
      task_due: '⏰',
      project_update: '📊',
      mention: '💬',
      deadline: '🚨',
      system: '⚙️'
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
      high: 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300',
      medium: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300',
      low: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleNotificationSelection = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showFilters && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            )}
            
            <button
              onClick={markAllAsRead}
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Mark all read
            </button>
          </div>
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            {smartSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-blue-800 dark:text-blue-300">{suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                multiple
                value={filters.types}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  types: Array.from(e.target.selectedOptions, option => option.value)
                }))}
                className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="task_assigned">Task Assigned</option>
                <option value="task_due">Task Due</option>
                <option value="project_update">Project Update</option>
                <option value="mention">Mention</option>
                <option value="deadline">Deadline</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                multiple
                value={filters.priorities}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  priorities: Array.from(e.target.selectedOptions, option => option.value)
                }))}
                className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Read Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.read === null ? 'all' : filters.read.toString()}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  read: e.target.value === 'all' ? null : e.target.value === 'true'
                }))}
                className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="all">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: e.target.value as any
                }))}
                className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-800 dark:text-indigo-300">
              {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => markAsRead(selectedNotifications)}
                className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700"
              >
                Mark as Read
              </button>
              <button
                onClick={() => deleteNotifications(selectedNotifications)}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div ref={notificationRef} className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                  !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleNotificationSelection(notification.id)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  
                  <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${
                        !notification.read 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(notification.priority)}`}>
                          {notification.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`mt-1 text-sm ${
                      !notification.read 
                        ? 'text-gray-700 dark:text-gray-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {notification.metadata && (
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        {notification.metadata.projectName && (
                          <span>📁 {notification.metadata.projectName}</span>
                        )}
                        {notification.metadata.taskName && (
                          <span>📋 {notification.metadata.taskName}</span>
                        )}
                        {notification.metadata.assignedBy && (
                          <span>👤 {notification.metadata.assignedBy}</span>
                        )}
                      </div>
                    )}
                    
                    {notification.actionUrl && (
                      <div className="mt-2">
                        <a
                          href={notification.actionUrl}
                          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View Details →
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}