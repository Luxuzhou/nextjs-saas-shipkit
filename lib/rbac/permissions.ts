import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { roles, permissions, rolePermissions } from '@/lib/db/rbac-schema';
import { SYSTEM_PERMISSIONS, DEFAULT_ROLES } from './constants';

// Re-export constants for backward compatibility
export { SYSTEM_PERMISSIONS, DEFAULT_ROLES };

/**
 * Seed default roles and permissions for a team.
 * Designed to be idempotent - skips if roles already exist.
 */
export async function seedDefaultRoles(teamId: number): Promise<void> {
  try {
    // Check if roles already exist for this team
    const existing = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.teamId, teamId))
      .limit(1);

    if (existing.length > 0) {
      return; // Already seeded
    }

    // Ensure system permissions exist in the permissions table
    const existingPerms = await db.select().from(permissions);
    const existingPermKeys = new Set(
      existingPerms.map((p) => `${p.resource}:${p.action}`)
    );

    const missingPerms = SYSTEM_PERMISSIONS.filter(
      (p) => !existingPermKeys.has(`${p.resource}:${p.action}`)
    );

    if (missingPerms.length > 0) {
      await db.insert(permissions).values(
        missingPerms.map((p) => ({
          resource: p.resource,
          action: p.action,
          description: `${p.action} ${p.resource}`,
        }))
      );
    }

    // Fetch all permissions (including newly inserted)
    const allPerms = await db.select().from(permissions);
    const permMap = new Map(
      allPerms.map((p) => [`${p.resource}:${p.action}`, p.id])
    );

    // Create roles and assign permissions
    for (const roleDef of DEFAULT_ROLES) {
      const [newRole] = await db
        .insert(roles)
        .values({
          teamId,
          name: roleDef.name,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
        })
        .returning({ id: roles.id });

      const permIds = roleDef.permissions
        .map((p) => permMap.get(`${p.resource}:${p.action}`))
        .filter((id): id is number => id !== undefined);

      if (permIds.length > 0) {
        await db.insert(rolePermissions).values(
          permIds.map((permId) => ({
            roleId: newRole.id,
            permissionId: permId,
          }))
        );
      }
    }
  } catch (error) {
    // Tables may not exist yet (pre-migration). Log and continue gracefully.
    console.warn('[RBAC] seedDefaultRoles failed (tables may not exist):', error);
  }
}
