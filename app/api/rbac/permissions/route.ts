import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { teamMembers } from '@/lib/db/schema';
import { permissions } from '@/lib/db/rbac-schema';
import { getUserPermissions, getUserRole } from '@/lib/rbac/check';
import { SYSTEM_PERMISSIONS } from '@/lib/rbac/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: 'No team found' }, { status: 403 });
    }

    const teamId = membership[0].teamId;

    const [userPerms, userRole] = await Promise.all([
      getUserPermissions(user.id, teamId),
      getUserRole(user.id, teamId),
    ]);

    // Also fetch all available permissions from DB or defaults
    let allPermissions;
    try {
      allPermissions = await db.select().from(permissions);
    } catch {
      // Tables may not exist, use SYSTEM_PERMISSIONS
      allPermissions = SYSTEM_PERMISSIONS.map((p, i) => ({
        id: i + 1,
        resource: p.resource,
        action: p.action,
        description: `${p.action} ${p.resource}`,
      }));
    }

    return NextResponse.json({
      role: userRole,
      permissions: userPerms,
      allPermissions,
    });
  } catch (error) {
    console.error('[RBAC] GET /api/rbac/permissions error:', error);
    return NextResponse.json({
      role: null,
      permissions: [],
      allPermissions: [],
    });
  }
}
