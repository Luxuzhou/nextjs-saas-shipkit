'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeEvent, UserPresence, PresenceStatus } from '@/lib/realtime/types';

interface UseRealtimeEventsOptions {
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

interface UseRealtimeEventsReturn {
  events: RealtimeEvent[];
  isConnected: boolean;
  onlineMembers: UserPresence[];
}

export function useRealtimeEvents(
  options: UseRealtimeEventsOptions = {}
): UseRealtimeEventsReturn {
  const { reconnectDelay = 3000, heartbeatInterval = 30000 } = options;

  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState<UserPresence[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const updatePresenceFromEvent = useCallback((event: RealtimeEvent) => {
    if (
      event.type === 'presence:update' ||
      event.type === 'presence:heartbeat'
    ) {
      const payload = event.payload as {
        userId: number;
        userName?: string;
        userEmail?: string;
        status: PresenceStatus;
      };

      setOnlineMembers((prev) => {
        const existing = prev.find((m) => m.userId === payload.userId);
        if (existing) {
          return prev.map((m) =>
            m.userId === payload.userId
              ? { ...m, status: payload.status, lastSeen: event.timestamp }
              : m
          );
        } else if (
          payload.userName !== undefined &&
          payload.userEmail !== undefined
        ) {
          // Add new member
          const newMember: UserPresence = {
            userId: payload.userId,
            userName: payload.userName,
            userEmail: payload.userEmail,
            teamId: 0, // Not available from event payload
            status: payload.status,
            lastSeen: event.timestamp,
          };
          return [...prev, newMember];
        }
        return prev;
      });
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch('/api/realtime/heartbeat', { method: 'POST' });
    } catch {
      // Heartbeat failure is non-critical
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/realtime/events');
    eventSourceRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      setIsConnected(true);

      // Start heartbeat
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      heartbeatTimerRef.current = setInterval(sendHeartbeat, heartbeatInterval);

      // Initial heartbeat
      sendHeartbeat();

      // Load initial presence
      fetch('/api/realtime/presence')
        .then((r) => r.json())
        .then((data: { presence?: UserPresence[] }) => {
          if (data.presence && mountedRef.current) {
            setOnlineMembers(data.presence);
          }
        })
        .catch(() => {/* ignore */});
    };

    es.onerror = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }

      // Auto-reconnect
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, reconnectDelay);
    };

    es.onmessage = (e: MessageEvent<string>) => {
      if (!mountedRef.current) return;
      try {
        const event = JSON.parse(e.data) as RealtimeEvent;
        setEvents((prev) => [...prev.slice(-99), event]);
        updatePresenceFromEvent(event);
      } catch {
        // Ignore malformed events
      }
    };

    // Listen to named events
    const eventTypes = [
      'presence:update',
      'presence:heartbeat',
      'notification:new',
      'connection:established',
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e: MessageEvent<string>) => {
        if (!mountedRef.current) return;
        try {
          const event = JSON.parse(e.data) as RealtimeEvent;
          setEvents((prev) => [...prev.slice(-99), event]);
          updatePresenceFromEvent(event);
        } catch {
          // Ignore malformed events
        }
      });
    }
  }, [reconnectDelay, heartbeatInterval, sendHeartbeat, updatePresenceFromEvent]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      // Mark user as offline on disconnect
      fetch('/api/realtime/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'offline' }),
      }).catch(() => {/* ignore */});
    };
  }, [connect]);

  return { events, isConnected, onlineMembers };
}
