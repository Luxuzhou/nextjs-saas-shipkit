import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { roles, permissions, rolePermissions, userRoles } from '@/lib/db/rbac-schema';
import { teamMembers } from '@/lib/db/schema';
import { Resource, Action } from './types';
import type { PermissionEntry } from './types';
import { DEFAULT_ROLES } from './constants';

/**
 * Get the user's RBAC role for a given team.
 * Falls back to the teamMembers.role if no RBAC role is assigned.
 */
export async function getUserRole(
  userId: number,
  teamId: number
): Promise<{ roleId: number; roleName: string } | null> {
  try {
    const result = await db
      .select({
        roleId: userRoles.roleId,
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(userRoles.userId, userId), eq(userRoles.teamId, teamId)))
      .limit(1);

    if (result.length > 0) {
      return result[0];
    }

    // Fallback: derive role from teamMembers table
    const member = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
      .limit(1);

    if (member.length > 0) {
      const fallbackRole = member[0].role; // 'owner' or 'member'
      return { roleId: 0, roleName: fallbackRole };
    }

    return null;
  } catch (error) {
    // Tables may not exist yet
    console.warn('[RBAC] getUserRole failed:', error);

    // Try fallback from teamMembers only
    try {
      const member = await db
        .select({ role: teamMembers.role })
        .from(teamMembers)
        .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
        .limit(1);

      if (member.length > 0) {
        return { roleId: 0, roleName: member[0].role };
      }
    } catch {
      // teamMembers also failed
    }

    return null;
  }
}

/**
 * Get all permissions for a user in a given team.
 */
export async function getUserPermissions(
  userId: number,
  teamId: number
): Promise<PermissionEntry[]> {
  try {
    const userRole = await getUserRole(userId, teamId);
    if (!userRole) return [];

    // If using RBAC role (roleId > 0), fetch from DB
    if (userRole.roleId > 0) {
      const result = await db
        .select({
          resource: permissions.resource,
          action: permissions.action,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, userRole.roleId));

      return result.map((r) => ({
        resource: r.resource as Resource,
        action: r.action as Action,
      }));
    }

    // Fallback: use DEFAULT_ROLES definition
    const defaultRole = DEFAULT_ROLES.find((r) => r.name === userRole.roleName);
    return defaultRole?.permissions ?? [];
  } catch (error) {
    console.warn('[RBAC] getUserPermissions failed:', error);
    return [];
  }
}

/**
 * Check if a user has a specific permission on a resource.
 */
export async function hasPermission(
  userId: number,
  teamId: number,
  resource: Resource,
  action: Action
): Promise<boolean> {
  const perms = await getUserPermissions(userId, teamId);

  return perms.some(
    (p) =>
      (p.resource === resource && p.action === action) ||
      (p.resource === resource && p.action === Action.manage)
  );
}

/**
 * Check permission and throw if not authorized.
 */
export async function requirePermission(
  userId: number,
  teamId: number,
  resource: Resource,
  action: Action
): Promise<void> {
  const allowed = await hasPermission(userId, teamId, resource, action);
  if (!allowed) {
    throw new Error(
      `Permission denied: ${action} on ${resource} for user ${userId} in team ${teamId}`
    );
  }
}
