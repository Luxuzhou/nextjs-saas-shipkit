'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count ?? 0);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/dashboard/notifications" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
