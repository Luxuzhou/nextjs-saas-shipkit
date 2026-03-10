import { UserPresence, PresenceStatus } from './types';

// Key: `${teamId}:${userId}`
const presenceMap = new Map<string, UserPresence>();

const STALE_TIMEOUT_MS = 60_000; // 60 seconds

function presenceKey(teamId: number, userId: number): string {
  return `${teamId}:${userId}`;
}

export function updatePresence(
  userId: number,
  userName: string,
  userEmail: string,
  teamId: number,
  status: PresenceStatus
): UserPresence {
  const key = presenceKey(teamId, userId);
  const presence: UserPresence = {
    userId,
    userName,
    userEmail,
    teamId,
    status,
    lastSeen: Date.now(),
  };
  presenceMap.set(key, presence);
  return presence;
}

export function getTeamPresence(teamId: number): UserPresence[] {
  cleanupStale();
  const result: UserPresence[] = [];
  for (const [, presence] of presenceMap) {
    if (presence.teamId === teamId) {
      result.push(presence);
    }
  }
  return result;
}

export function getOnlineCount(teamId: number): number {
  cleanupStale();
  let count = 0;
  for (const [, presence] of presenceMap) {
    if (presence.teamId === teamId && presence.status === 'online') {
      count++;
    }
  }
  return count;
}

export function heartbeat(teamId: number, userId: number): void {
  const key = presenceKey(teamId, userId);
  const existing = presenceMap.get(key);
  if (existing) {
    existing.lastSeen = Date.now();
    if (existing.status === 'offline') {
      existing.status = 'online';
    }
    presenceMap.set(key, existing);
  }
}

export function removePresence(teamId: number, userId: number): void {
  const key = presenceKey(teamId, userId);
  presenceMap.delete(key);
}

export function cleanupStale(): void {
  const now = Date.now();
  for (const [key, presence] of presenceMap) {
    if (now - presence.lastSeen > STALE_TIMEOUT_MS) {
      presenceMap.delete(key);
    }
  }
}

export function markAway(teamId: number, userId: number): void {
  const key = presenceKey(teamId, userId);
  const existing = presenceMap.get(key);
  if (existing && existing.status === 'online') {
    existing.status = 'away';
    presenceMap.set(key, existing);
  }
}
