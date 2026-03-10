// JSON Schema subset for plugin config
export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array';
  title?: string;
  description?: string;
  format?: string; // e.g. 'password', 'url', 'email'
  default?: unknown;
  enum?: string[];
  items?: { type: string };
}

export type PluginCategory =
  | 'communication'
  | 'productivity'
  | 'automation'
  | 'analytics'
  | 'developer'
  | 'crm'
  | 'storage'
  | 'security';

export type PluginStatus = 'active' | 'deprecated' | 'coming_soon';

export type PluginScope =
  | 'read:team'
  | 'write:team'
  | 'read:users'
  | 'write:users'
  | 'read:activity'
  | 'write:activity'
  | 'read:billing'
  | 'webhooks';

export interface PluginManifest {
  slug: string;
  name: string;
  description: string;
  author: string;
  version: string;
  iconUrl?: string;
  category: PluginCategory;
  status: PluginStatus;
  configSchema?: JSONSchema;
  requiredScopes?: PluginScope[];
  webhookUrl?: string;
  docsUrl?: string;
}

export type PluginHookName =
  | 'onInstall'
  | 'onUninstall'
  | 'onEnable'
  | 'onDisable'
  | 'onConfigUpdate';

export interface PluginHookContext {
  teamId: number;
  userId: number;
  config?: Record<string, unknown>;
}

export type PluginHook = (ctx: PluginHookContext) => Promise<void>;

export interface PluginWithInstallation extends PluginManifest {
  isInstalled: boolean;
  isEnabled: boolean;
  installedConfig?: Record<string, unknown>;
  installationId?: number;
}
