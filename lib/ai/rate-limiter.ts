/**
 * AI Rate Limiter
 *
 * Provides in-memory per-user request-rate limiting and quota checks.
 * The quota check reads from the database (with graceful fallback).
 */

import { getRemainingQuota } from './usage-tracker';
import type { RemainingQuota } from './types';

// ---------------------------------------------------------------------------
// In-memory rate-limit store
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/** Simple in-memory store — good enough for single-instance deployments. */
const rateLimitStore = new Map<string, RateLimitEntry>();

/** Requests allowed per window per user. */
const RATE_LIMIT_MAX = 20;
/** Window size in milliseconds (1 minute). */
const RATE_LIMIT_WINDOW_MS = 60_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix ms
  reason?: string;
}

/**
 * Check whether a user is within the request-rate limit.
 * Uses a sliding fixed-window algorithm stored in memory.
 */
export function checkRateLimit(userId: number): RateLimitResult {
  const key = `rate:${userId}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // Start a new window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + RATE_LIMIT_WINDOW_MS,
      reason: `Rate limit exceeded. Max ${RATE_LIMIT_MAX} requests per minute.`,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetAt: entry.windowStart + RATE_LIMIT_WINDOW_MS,
  };
}

// ---------------------------------------------------------------------------
// Quota check
// ---------------------------------------------------------------------------

export interface QuotaCheckResult {
  allowed: boolean;
  quota: RemainingQuota;
  reason?: string;
}

/**
 * Check whether the team still has quota available for the current month.
 * Falls back gracefully if the DB table does not yet exist.
 */
export async function checkQuota(teamId: number): Promise<QuotaCheckResult> {
  const quota = await getRemainingQuota(teamId);

  if (!quota.allowed) {
    return {
      allowed: false,
      quota,
      reason: `Monthly token quota of ${quota.monthlyTokenLimit.toLocaleString()} tokens exhausted. Resets on ${quota.resetAt.toLocaleDateString()}.`,
    };
  }

  return { allowed: true, quota };
}
