import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { teamMembers } from '@/lib/db/schema';
import { roles, userRoles } from '@/lib/db/rbac-schema';
import { Resource, Action } from '@/lib/rbac/types';
import { hasPermission } from '@/lib/rbac/check';

export const dynamic = 'force-dynamic';

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
    const { userId: targetUserId, roleId } = body as {
      userId: number;
      roleId: number;
    };

    if (!targetUserId || !roleId) {
      return NextResponse.json(
        { error: 'userId and roleId are required' },
        { status: 400 }
      );
    }

    // Verify the target user is a member of the team
    const targetMembership = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.userId, targetUserId), eq(teamMembers.teamId, teamId))
      )
      .limit(1);

    if (targetMembership.length === 0) {
      return NextResponse.json(
        { error: 'User is not a member of this team' },
        { status: 400 }
      );
    }

    // Verify role belongs to this team
    const [role] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.teamId, teamId)));

    if (!role) {
      return NextResponse.json({ error: 'Role not found in this team' }, { status: 404 });
    }

    // Remove existing role assignment for this user+team
    await db
      .delete(userRoles)
      .where(
        and(eq(userRoles.userId, targetUserId), eq(userRoles.teamId, teamId))
      );

    // Assign new role
    const [assignment] = await db
      .insert(userRoles)
      .values({
        userId: targetUserId,
        teamId,
        roleId,
        assignedBy: user.id,
      })
      .returning();

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('[RBAC] POST /api/rbac/assign error:', error);
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
}
