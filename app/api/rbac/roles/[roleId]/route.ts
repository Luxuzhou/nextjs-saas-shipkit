import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { teamMembers } from '@/lib/db/schema';
import { roles, rolePermissions, userRoles } from '@/lib/db/rbac-schema';
import { Resource, Action } from '@/lib/rbac/types';
import { hasPermission } from '@/lib/rbac/check';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId: roleIdStr } = await params;
    const roleId = parseInt(roleIdStr, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

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

    // Verify role belongs to team
    const [existingRole] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.teamId, teamId)));

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, permissionIds } = body as {
      name?: string;
      description?: string;
      permissionIds?: number[];
    };

    // Update role fields
    if (name || description !== undefined) {
      await db
        .update(roles)
        .set({
          ...(name ? { name: name.trim() } : {}),
          ...(description !== undefined ? { description } : {}),
        })
        .where(eq(roles.id, roleId));
    }

    // Update permissions if provided
    if (permissionIds !== undefined) {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      if (permissionIds.length > 0) {
        await db.insert(rolePermissions).values(
          permissionIds.map((permId) => ({
            roleId,
            permissionId: permId,
          }))
        );
      }
    }

    const [updated] = await db.select().from(roles).where(eq(roles.id, roleId));
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[RBAC] PUT /api/rbac/roles/[roleId] error:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId: roleIdStr } = await params;
    const roleId = parseInt(roleIdStr, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

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

    // Verify role belongs to team and is not a system role
    const [existingRole] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.teamId, teamId)));

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 400 }
      );
    }

    // Delete role permissions and user assignments first
    await db.delete(userRoles).where(eq(userRoles.roleId, roleId));
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    await db.delete(roles).where(eq(roles.id, roleId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RBAC] DELETE /api/rbac/roles/[roleId] error:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
