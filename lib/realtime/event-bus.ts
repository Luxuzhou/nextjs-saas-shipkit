import { RealtimeEvent } from './types';

type EventCallback = (event: RealtimeEvent) => void;

// Map from channel -> Set of subscriber callbacks
const subscribers = new Map<string, Set<EventCallback>>();

export function subscribe(channel: string, callback: EventCallback): () => void {
  if (!subscribers.has(channel)) {
    subscribers.set(channel, new Set());
  }
  subscribers.get(channel)!.add(callback);

  // Return unsubscribe function
  return () => {
    unsubscribe(channel, callback);
  };
}

export function unsubscribe(channel: string, callback: EventCallback): void {
  const channelSubs = subscribers.get(channel);
  if (channelSubs) {
    channelSubs.delete(callback);
    if (channelSubs.size === 0) {
      subscribers.delete(channel);
    }
  }
}

export function publish(channel: string, event: RealtimeEvent): void {
  const channelSubs = subscribers.get(channel);
  if (channelSubs) {
    for (const callback of channelSubs) {
      try {
        callback(event);
      } catch (err) {
        console.error(`[event-bus] Error in subscriber for channel ${channel}:`, err);
      }
    }
  }
}

export function getSubscriberCount(channel: string): number {
  return subscribers.get(channel)?.size ?? 0;
}

// Helper to generate event IDs
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Channel name helpers
export function presenceChannel(teamId: number): string {
  return `team:${teamId}:presence`;
}

export function notificationsChannel(teamId: number): string {
  return `team:${teamId}:notifications`;
}
