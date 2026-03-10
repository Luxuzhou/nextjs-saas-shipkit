import { db } from '@/lib/db/drizzle';
import { featureFlags } from '@/lib/db/feature-flags-schema';
import { eq } from 'drizzle-orm';
import type { FeatureFlag, FlagEvaluationContext } from '@/lib/db/feature-flags-schema';

// In-memory cache with 60s TTL
interface CacheEntry {
  flags: FeatureFlag[];
  expiresAt: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 60_000;

async function getAllFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.flags;
  }

  try {
    const flags = await db.select().from(featureFlags);
    cache = { flags, expiresAt: now + CACHE_TTL_MS };
    return flags;
  } catch (err) {
    console.warn('[feature-flags] Failed to fetch flags from DB:', err);
    return cache?.flags ?? [];
  }
}

export function invalidateCache(): void {
  cache = null;
}

/**
 * Deterministic hash of (flagKey + userId) for percentage rollout.
 * Uses a simple djb2-like hash that yields a value in [0, 100).
 */
function hashForPercentage(flagKey: string, userId: number): number {
  const input = `${flagKey}:${userId}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash % 100;
}

/**
 * Evaluate a single feature flag for a given context.
 * Returns false if the flag is not found or disabled.
 */
export async function evaluateFlag(
  flagKey: string,
  context: FlagEvaluationContext
): Promise<boolean> {
  const flags = await getAllFlags();
  const flag = flags.find((f) => f.key === flagKey);

  if (!flag || !flag.enabled) {
    return false;
  }

  switch (flag.type) {
    case 'boolean':
      return true;

    case 'percentage': {
      if (context.userId === undefined) return false;
      const pct = flag.rolloutPercentage ?? 0;
      const userHash = hashForPercentage(flagKey, context.userId);
      return userHash < pct;
    }

    case 'userList': {
      if (context.userId === undefined) return false;
      const targetUsers = (flag.targetUserIds ?? []) as number[];
      return targetUsers.includes(context.userId);
    }

    case 'teamList': {
      if (context.teamId === undefined) return false;
      const targetTeams = (flag.targetTeamIds ?? []) as number[];
      return targetTeams.includes(context.teamId);
    }

    default:
      return false;
  }
}

/**
 * Evaluate multiple flags at once. Returns a record of flagKey → boolean.
 */
export async function evaluateFlags(
  flagKeys: string[],
  context: FlagEvaluationContext
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  await Promise.all(
    flagKeys.map(async (key) => {
      results[key] = await evaluateFlag(key, context);
    })
  );
  return results;
}

/**
 * Evaluate ALL flags for a context (used by client-side provider).
 */
export async function evaluateAllFlags(
  context: FlagEvaluationContext
): Promise<Record<string, boolean>> {
  const flags = await getAllFlags();
  const keys = flags.map((f) => f.key);
  return evaluateFlags(keys, context);
}

/**
 * Get a single flag by key directly from DB (bypasses cache — for admin ops).
 */
export async function getFlagByKey(key: string): Promise<FeatureFlag | null> {
  try {
    const rows = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.key, key))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
