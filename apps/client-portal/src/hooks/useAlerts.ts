'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { alertApi, type Alert } from '@/lib/api';

interface UseAlertsOptions {
  projectId?: string;
  onNewAlert?: (alert: Alert) => void;
}

interface UseAlertsReturn {
  alerts: Alert[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAlerts(options: UseAlertsOptions = {}): UseAlertsReturn {
  const { projectId, onNewAlert } = options;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial alerts
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [alertsResponse, countResponse] = await Promise.all([
        alertApi.list({ limit: 50 }),
        alertApi.getUnreadCount(),
      ]);
      setAlerts(alertsResponse.data);
      setUnreadCount(countResponse.count);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const socket = io(`${baseUrl}/alerts`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to project room
      socket.emit('subscribe', { projectId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('newAlert', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setUnreadCount((prev) => prev + 1);
      onNewAlert?.(alert);
    });

    socket.on('unreadCount', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    // Fetch initial data
    fetchAlerts();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, onNewAlert, fetchAlerts]);

  // Mark single alert as read
  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await alertApi.markAsRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, isRead: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  }, []);

  // Mark all alerts as read
  const markAllAsRead = useCallback(async () => {
    try {
      await alertApi.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  }, []);

  return {
    alerts,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchAlerts,
  };
}
