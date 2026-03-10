interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute sliding window
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up every 5 minutes

// Periodic cleanup of stale entries
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow the process to exit without waiting for cleanup
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry) {
    store.set(identifier, { timestamps: [now] });
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      resetMs: WINDOW_MS,
    };
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = WINDOW_MS - (now - oldestInWindow);
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetMs,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    limit,
    resetMs: WINDOW_MS,
  };
}
