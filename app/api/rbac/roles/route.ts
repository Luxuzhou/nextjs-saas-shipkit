import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { teamMembers } from '@/lib/db/schema';
import { roles, rolePermissions, userRoles, permissions } from '@/lib/db/rbac-schema';
import { Resource, Action } from '@/lib/rbac/types';
import { hasPermission } from '@/lib/rbac/check';

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
    const allowed = await hasPermission(user.id, teamId, Resource.admin, Action.read);
    if (!allowed) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const teamRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.teamId, teamId));

    // Get permission count and member count for each role
    const rolesWithCounts = await Promise.all(
      teamRoles.map(async (role) => {
        const [permCount] = await db
          .select({ count: count() })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, role.id));

        const [memberCount] = await db
          .select({ count: count() })
          .from(userRoles)
          .where(eq(userRoles.roleId, role.id));

        return {
          ...role,
          permissionCount: permCount?.count ?? 0,
          memberCount: memberCount?.count ?? 0,
        };
      })
    );

    return NextResponse.json(rolesWithCounts);
  } catch (error) {
    console.error('[RBAC] GET /api/rbac/roles error:', error);
    return NextResponse.json({ roles: [] });
  }
}

export async function POST(req: NextRequest) {
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
    const allowed = await hasPermission(user.id, teamId, Resource.admin, Action.manage);
    if (!allowed) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, permissionIds } = body as {
      name: string;
      description?: string;
      permissionIds?: number[];
    };

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const [newRole] = await db
      .insert(roles)
      .values({
        teamId,
        name: name.trim(),
        description: description ?? null,
        isSystem: false,
      })
      .returning();

    // Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map((permId) => ({
          roleId: newRole.id,
          permissionId: permId,
        }))
      );
    }

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('[RBAC] POST /api/rbac/roles error:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
