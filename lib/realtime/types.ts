// Realtime presence and event types

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  userId: number;
  userName: string;
  userEmail: string;
  teamId: number;
  status: PresenceStatus;
  lastSeen: number; // Unix timestamp ms
}

export interface RealtimeEvent {
  id: string;
  type: string;
  channel: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface PresenceUpdateEvent extends RealtimeEvent {
  type: 'presence:update';
  payload: {
    userId: number;
    userName: string;
    userEmail: string;
    status: PresenceStatus;
  };
}

export interface NotificationEvent extends RealtimeEvent {
  type: 'notification:new';
  payload: {
    notificationId: number;
    title: string;
    body: string;
    userId: number;
  };
}

export type TeamChannel = `team:${number}:presence` | `team:${number}:notifications`;

export interface SSEMessage {
  event?: string;
  data: string;
  id?: string;
}
