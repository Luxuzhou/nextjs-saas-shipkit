import { Resource, Action } from './types';
import type { PermissionEntry, RoleDefinition } from './types';

/** All possible resource x action combinations */
export const SYSTEM_PERMISSIONS: PermissionEntry[] = Object.values(Resource).flatMap(
  (resource) =>
    Object.values(Action).map((action) => ({
      resource,
      action,
    }))
);

/** Default role definitions */
export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'owner',
    description: 'Full access to all resources',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS, // all permissions
  },
  {
    name: 'admin',
    description: 'All permissions except deleting the team',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter(
      (p) => !(p.resource === Resource.team && p.action === Action.delete)
    ),
  },
  {
    name: 'member',
    description: 'Basic read/write access',
    isSystem: true,
    permissions: [
      { resource: Resource.team, action: Action.read },
      { resource: Resource.member, action: Action.read },
      { resource: Resource.billing, action: Action.read },
      { resource: Resource.ai_usage, action: Action.read },
      { resource: Resource.ai_usage, action: Action.create },
      { resource: Resource.notifications, action: Action.read },
      { resource: Resource.notifications, action: Action.update },
      { resource: Resource.plugins, action: Action.read },
    ],
  },
  {
    name: 'viewer',
    description: 'Read-only access',
    isSystem: true,
    permissions: Object.values(Resource).map((resource) => ({
      resource,
      action: Action.read,
    })),
  },
];
