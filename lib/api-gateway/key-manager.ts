import crypto from 'crypto';
import { db } from '@/lib/db/drizzle';
import { apiKeys } from '@/lib/db/api-gateway-schema';
import { eq, and, isNull, or, gt } from 'drizzle-orm';

const KEY_PREFIX_LENGTH = 8;

export function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const rawKey = crypto.randomBytes(32).toString('hex');
  const prefix = `sk_${rawKey.slice(0, KEY_PREFIX_LENGTH)}`;
  const fullKey = `sk_${rawKey}`;
  const hash = hashKey(fullKey);
  return { fullKey, prefix, hash };
}

export function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function createApiKey(
  teamId: number,
  name: string,
  options?: {
    permissions?: string[];
    rateLimit?: number;
    expiresAt?: Date;
  }
): Promise<{ id: number; fullKey: string; prefix: string }> {
  const { fullKey, prefix, hash } = generateApiKey();

  try {
    const result = await db
      .insert(apiKeys)
      .values({
        teamId,
        name,
        keyHash: hash,
        prefix,
        permissions: options?.permissions ?? ['read'],
        rateLimit: options?.rateLimit ?? 100,
        expiresAt: options?.expiresAt ?? null,
      })
      .returning({ id: apiKeys.id });

    return { id: result[0].id, fullKey, prefix };
  } catch (error) {
    console.error('Failed to create API key:', error);
    throw new Error('Failed to create API key');
  }
}

export async function validateKey(
  key: string
): Promise<{ valid: boolean; teamId?: number; keyId?: number; permissions?: string[]; rateLimit?: number }> {
  const hash = hashKey(key);

  try {
    const result = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyHash, hash),
          or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date()))
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { valid: false };
    }

    const apiKey = result[0];

    // Update last used timestamp (non-blocking)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .then(() => {})
      .catch(() => {});

    return {
      valid: true,
      teamId: apiKey.teamId,
      keyId: apiKey.id,
      permissions: apiKey.permissions as string[],
      rateLimit: apiKey.rateLimit,
    };
  } catch (error) {
    console.error('Failed to validate API key:', error);
    return { valid: false };
  }
}

export async function revokeKey(keyId: number, teamId: number): Promise<boolean> {
  try {
    const result = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.teamId, teamId)))
      .returning({ id: apiKeys.id });

    return result.length > 0;
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return false;
  }
}

export async function listKeys(teamId: number) {
  try {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        permissions: apiKeys.permissions,
        rateLimit: apiKeys.rateLimit,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.teamId, teamId));

    return keys;
  } catch (error) {
    console.error('Failed to list API keys:', error);
    return [];
  }
}
