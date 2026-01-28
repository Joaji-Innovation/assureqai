'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, X, Clock, Server, Users, Shield } from 'lucide-react';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source: string;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'alert', title: 'Instance Down', message: 'Instance i-006 (DataVerse) failed health check', timestamp: '2026-01-11T15:30:00Z', read: false, source: 'Infrastructure' },
  { id: '2', type: 'warning', title: 'High Usage Alert', message: 'CloudNine Solutions at 83% of audit limit', timestamp: '2026-01-11T14:15:00Z', read: false, source: 'Usage Monitor' },
  { id: '3', type: 'info', title: 'New Client Signup', message: 'DataVerse has completed registration', timestamp: '2026-01-11T10:30:00Z', read: true, source: 'Provisioning' },
  { id: '4', type: 'success', title: 'SSL Certificate Renewed', message: 'Certificate for qa.acme.com renewed successfully', timestamp: '2026-01-10T18:00:00Z', read: true, source: 'Domains' },
  { id: '5', type: 'warning', title: 'SSL Expiring Soon', message: 'Certificate for qa.nexgenlabs.com expires in 30 days', timestamp: '2026-01-10T09:00:00Z', read: true, source: 'Domains' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const isUnreadFilter = filter === 'unread';
      const result = await api.alerts.list({
        unreadOnly: isUnreadFilter,
        limit: 50
      }) as any;

      const alerts = result.data || result;

      // Filtering by type locally for now if API doesn't support type filter directly
      // API supports unreadOnly

      const mappedNotifications = Array.isArray(alerts) ? alerts.map((alert: any) => ({
        id: alert._id || alert.id,
        type: alert.severity || 'info', // Map severity to type
        title: alert.title,
        message: alert.message,
        timestamp: alert.createdAt,
        read: alert.read || false,
        source: alert.source || 'System'
      })) : [];

      // Client side filter for specific types since API might not filter by exact type yet
      const finalNotifications = filter !== 'all' && filter !== 'unread'
        ? mappedNotifications.filter((n: any) => n.type === filter)
        : mappedNotifications;

      setNotifications(finalNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.alerts.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.alerts.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  };

  const dismissNotification = async (id: string) => {
    // Dismiss/Acknowledge
    try {
      // Assuming acknowledge removes it from list or marks processed
      // alertsApi.acknowledge(id) if it exists, or just hide locally
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'alert': return 'border-red-500/30 bg-red-500/5';
      case 'warning': return 'border-amber-500/30 bg-amber-500/5';
      case 'success': return 'border-emerald-500/30 bg-emerald-500/5';
      default: return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'unread', 'alert', 'warning', 'info', 'success'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === f
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted'
              }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${getTypeBg(notification.type)} ${!notification.read ? 'ring-2 ring-primary/20' : ''
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                    <span>{notification.source}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismissNotification(notification.id); }}
                  className="p-1 rounded hover:bg-muted-foreground/10 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
