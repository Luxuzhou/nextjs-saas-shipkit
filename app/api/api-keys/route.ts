import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createApiKey, listKeys, revokeKey } from '@/lib/api-gateway/key-manager';

async function getTeamIdForUser(userId: number): Promise<number | null> {
  const result = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId))
    .limit(1);

  return result[0]?.teamId ?? null;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = await getTeamIdForUser(user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const keys = await listKeys(teamId);
    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error listing API keys:', error);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = await getTeamIdForUser(user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, permissions, rateLimit, expiresAt } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const result = await createApiKey(teamId, name, {
      permissions: permissions ?? ['read'],
      rateLimit: rateLimit ?? 100,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json(
      {
        id: result.id,
        key: result.fullKey,
        prefix: result.prefix,
        message: 'Store this key securely. It will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = await getTeamIdForUser(user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const url = new URL(req.url);
    const keyId = url.searchParams.get('id');
    if (!keyId) {
      return NextResponse.json(
        { error: 'id query param is required' },
        { status: 400 }
      );
    }

    const revoked = await revokeKey(parseInt(keyId, 10), teamId);
    if (!revoked) {
      return NextResponse.json(
        { error: 'API key not found or already revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'API key revoked' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
