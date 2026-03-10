export enum Resource {
  team = 'team',
  member = 'member',
  billing = 'billing',
  admin = 'admin',
  ai_usage = 'ai_usage',
  notifications = 'notifications',
  plugins = 'plugins',
  compliance = 'compliance',
}

export enum Action {
  create = 'create',
  read = 'read',
  update = 'update',
  delete = 'delete',
  manage = 'manage',
}

export interface PermissionEntry {
  resource: Resource;
  action: Action;
}

export interface RoleDefinition {
  name: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionEntry[];
}
