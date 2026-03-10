'use client';

import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Notification } from '@/lib/db/notifications-schema';

interface NotificationListProps {
  initialNotifications: Notification[];
}

export function NotificationList({ initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const markRead = useCallback(async (id: number) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silently ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function getTypeLabel(type: string): string {
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  function getTypeBadgeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (type.includes('fail') || type.includes('exceeded') || type.includes('alert'))
      return 'destructive';
    if (type.includes('warn')) return 'outline';
    return 'secondary';
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={loading}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification items */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-gray-500">
              {filter === 'unread'
                ? "You're all caught up!"
                : 'Notifications will appear here when there is activity.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                notification.isRead
                  ? 'bg-white border-gray-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!notification.isRead && (
                    <span className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                  )}
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {notification.title}
                  </p>
                  <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs flex-shrink-0">
                    {getTypeLabel(notification.type)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{notification.body}</p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => markRead(notification.id)}
                  title="Mark as read"
                >
                  <Check className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">No notifications found.</p>
        </div>
      )}
    </div>
  );
}
