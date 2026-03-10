import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

// --- Email module tables (merged from lib/db/email-schema.ts) ---

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
});

export const emailVerifications = pgTable('email_verifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  email: varchar('email', { length: 255 }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;

// --- AI module tables (merged from lib/db/ai-schema.ts) ---

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .references(() => teams.id),
  model: varchar('model', { length: 100 }).notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  cost: varchar('cost', { length: 50 }).notNull().default('0'),
  endpoint: varchar('endpoint', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const aiQuotas = pgTable('ai_quotas', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .unique()
    .references(() => teams.id),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  monthlyTokenLimit: integer('monthly_token_limit').notNull().default(100000),
  tokensUsed: integer('tokens_used').notNull().default(0),
  resetAt: timestamp('reset_at').notNull(),
});

export type AIUsageLog = typeof aiUsageLogs.$inferSelect;
export type NewAIUsageLog = typeof aiUsageLogs.$inferInsert;
export type AIQuota = typeof aiQuotas.$inferSelect;
export type NewAIQuota = typeof aiQuotas.$inferInsert;

// --- RBAC module tables (merged from lib/db/rbac-schema.ts) ---

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  resource: varchar('resource', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  description: text('description'),
});

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id')
    .notNull()
    .references(() => roles.id),
  permissionId: integer('permission_id')
    .notNull()
    .references(() => permissions.id),
});

export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  roleId: integer('role_id')
    .notNull()
    .references(() => roles.id),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  assignedBy: integer('assigned_by').references(() => users.id),
});

export const rolesRelations = relations(roles, ({ one, many }) => ({
  team: one(teams, { fields: [roles.teamId], references: [teams.id] }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  team: one(teams, { fields: [userRoles.teamId], references: [teams.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
  assignedByUser: one(users, { fields: [userRoles.assignedBy], references: [users.id] }),
}));

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

// --- Billing module tables (merged from lib/db/billing-schema.ts) ---

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  totalAmount: varchar('total_amount', { length: 50 }).notNull().default('0'),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  stripeInvoiceId: text('stripe_invoice_id'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const usageBillingRecords = pgTable('usage_billing_records', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  month: varchar('month', { length: 7 }).notNull(),
  aiTokensUsed: integer('ai_tokens_used').notNull().default(0),
  aiCost: varchar('ai_cost', { length: 50 }).notNull().default('0'),
  apiCallsUsed: integer('api_calls_used').notNull().default(0),
  apiCost: varchar('api_cost', { length: 50 }).notNull().default('0'),
  totalCost: varchar('total_cost', { length: 50 }).notNull().default('0'),
  settledAt: timestamp('settled_at'),
});

export const planChangeLogs = pgTable('plan_change_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  fromPlan: varchar('from_plan', { length: 50 }),
  toPlan: varchar('to_plan', { length: 50 }).notNull(),
  changedBy: integer('changed_by')
    .notNull()
    .references(() => users.id),
  changedAt: timestamp('changed_at').notNull().defaultNow(),
  effectiveAt: timestamp('effective_at').notNull().defaultNow(),
  reason: text('reason'),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type UsageBillingRecord = typeof usageBillingRecords.$inferSelect;
export type NewUsageBillingRecord = typeof usageBillingRecords.$inferInsert;
export type PlanChangeLog = typeof planChangeLogs.$inferSelect;
export type NewPlanChangeLog = typeof planChangeLogs.$inferInsert;

// --- Notifications module tables (merged from lib/db/notifications-schema.ts) ---

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id').references(() => teams.id),
  type: varchar('type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  channel: varchar('channel', { length: 50 }).notNull().default('in_app'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  events: jsonb('events').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastTriggeredAt: timestamp('last_triggered_at'),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: serial('id').primaryKey(),
  webhookEndpointId: integer('webhook_endpoint_id')
    .notNull()
    .references(() => webhookEndpoints.id),
  event: varchar('event', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  statusCode: integer('status_code'),
  response: text('response'),
  attempts: integer('attempts').notNull().default(0),
  nextRetryAt: timestamp('next_retry_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  team: one(teams, { fields: [notifications.teamId], references: [teams.id] }),
}));

export const webhookEndpointsRelations = relations(webhookEndpoints, ({ one, many }) => ({
  team: one(teams, { fields: [webhookEndpoints.teamId], references: [teams.id] }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhookEndpoint: one(webhookEndpoints, { fields: [webhookDeliveries.webhookEndpointId], references: [webhookEndpoints.id] }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// --- Plugins module tables (merged from lib/db/plugins-schema.ts) ---

export const plugins = pgTable('plugins', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description').notNull(),
  author: varchar('author', { length: 200 }).notNull(),
  version: varchar('version', { length: 50 }).notNull().default('1.0.0'),
  iconUrl: varchar('icon_url', { length: 500 }),
  category: varchar('category', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  configSchema: jsonb('config_schema'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pluginInstallations = pgTable('plugin_installations', {
  id: serial('id').primaryKey(),
  pluginId: integer('plugin_id')
    .notNull()
    .references(() => plugins.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  isEnabled: boolean('is_enabled').notNull().default(true),
  config: jsonb('config').default({}),
  installedBy: integer('installed_by')
    .notNull()
    .references(() => users.id),
  installedAt: timestamp('installed_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pluginApiKeys = pgTable('plugin_api_keys', {
  id: serial('id').primaryKey(),
  pluginId: integer('plugin_id')
    .notNull()
    .references(() => plugins.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  scopes: jsonb('scopes').notNull().default([]),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pluginsRelations = relations(plugins, ({ many }) => ({
  installations: many(pluginInstallations),
  apiKeys: many(pluginApiKeys),
}));

export const pluginInstallationsRelations = relations(pluginInstallations, ({ one }) => ({
  plugin: one(plugins, { fields: [pluginInstallations.pluginId], references: [plugins.id] }),
  team: one(teams, { fields: [pluginInstallations.teamId], references: [teams.id] }),
  installedByUser: one(users, { fields: [pluginInstallations.installedBy], references: [users.id] }),
}));

export const pluginApiKeysRelations = relations(pluginApiKeys, ({ one }) => ({
  plugin: one(plugins, { fields: [pluginApiKeys.pluginId], references: [plugins.id] }),
  team: one(teams, { fields: [pluginApiKeys.teamId], references: [teams.id] }),
}));

export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;
export type PluginInstallation = typeof pluginInstallations.$inferSelect;
export type NewPluginInstallation = typeof pluginInstallations.$inferInsert;
export type PluginApiKey = typeof pluginApiKeys.$inferSelect;
export type NewPluginApiKey = typeof pluginApiKeys.$inferInsert;

// --- Compliance module tables (merged from lib/db/compliance-schema.ts) ---

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const dataExportRequests = pgTable('data_export_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id').references(() => teams.id),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  fileUrl: text('file_url'),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
});

export const dataRetentionPolicies = pgTable('data_retention_policies', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  resource: varchar('resource', { length: 100 }).notNull(),
  retentionDays: integer('retention_days').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
  team: one(teams, { fields: [auditLogs.teamId], references: [teams.id] }),
}));

export const dataExportRequestsRelations = relations(dataExportRequests, ({ one }) => ({
  user: one(users, { fields: [dataExportRequests.userId], references: [users.id] }),
  team: one(teams, { fields: [dataExportRequests.teamId], references: [teams.id] }),
}));

export const dataRetentionPoliciesRelations = relations(dataRetentionPolicies, ({ one }) => ({
  team: one(teams, { fields: [dataRetentionPolicies.teamId], references: [teams.id] }),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type DataExportRequest = typeof dataExportRequests.$inferSelect;
export type NewDataExportRequest = typeof dataExportRequests.$inferInsert;
export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type NewDataRetentionPolicy = typeof dataRetentionPolicies.$inferInsert;

// --- OAuth module tables (merged from lib/db/oauth-schema.ts) ---

export const oauthAccounts = pgTable('oauth_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const twoFactorSecrets = pgTable('two_factor_secrets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  secret: text('secret').notNull(),
  enabled: boolean('enabled').notNull().default(false),
  backupCodes: jsonb('backup_codes').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));

export const twoFactorSecretsRelations = relations(twoFactorSecrets, ({ one }) => ({
  user: one(users, { fields: [twoFactorSecrets.userId], references: [users.id] }),
}));

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;
export type TwoFactorSecret = typeof twoFactorSecrets.$inferSelect;
export type NewTwoFactorSecret = typeof twoFactorSecrets.$inferInsert;

// --- API Gateway module tables (merged from lib/db/api-gateway-schema.ts) ---

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: text('key_hash').notNull(),
  prefix: varchar('prefix', { length: 12 }).notNull(),
  permissions: jsonb('permissions').notNull().default([]),
  rateLimit: integer('rate_limit').notNull().default(100),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const apiRequestLogs = pgTable('api_request_logs', {
  id: serial('id').primaryKey(),
  apiKeyId: integer('api_key_id')
    .notNull()
    .references(() => apiKeys.id),
  method: varchar('method', { length: 10 }).notNull(),
  path: varchar('path', { length: 500 }).notNull(),
  statusCode: integer('status_code').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  team: one(teams, { fields: [apiKeys.teamId], references: [teams.id] }),
  requestLogs: many(apiRequestLogs),
}));

export const apiRequestLogsRelations = relations(apiRequestLogs, ({ one }) => ({
  apiKey: one(apiKeys, { fields: [apiRequestLogs.apiKeyId], references: [apiKeys.id] }),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiRequestLog = typeof apiRequestLogs.$inferSelect;
export type NewApiRequestLog = typeof apiRequestLogs.$inferInsert;

// --- Analytics module tables (merged from lib/db/analytics-schema.ts) ---

export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  eventData: jsonb('event_data'),
  sessionId: varchar('session_id', { length: 255 }),
  pageUrl: text('page_url'),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

export const funnels = pgTable('funnels', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 255 }).notNull(),
  steps: jsonb('steps').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  team: one(teams, { fields: [analyticsEvents.teamId], references: [teams.id] }),
  user: one(users, { fields: [analyticsEvents.userId], references: [users.id] }),
}));

export const funnelsRelations = relations(funnels, ({ one }) => ({
  team: one(teams, { fields: [funnels.teamId], references: [teams.id] }),
}));

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type Funnel = typeof funnels.$inferSelect;
export type NewFunnel = typeof funnels.$inferInsert;

// --- Feature Flags module tables (merged from lib/db/feature-flags-schema.ts) ---

export const featureFlags = pgTable('feature_flags', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull().default('boolean'),
  enabled: boolean('enabled').notNull().default(false),
  rolloutPercentage: integer('rollout_percentage').default(0),
  targetUserIds: jsonb('target_user_ids').default([]),
  targetTeamIds: jsonb('target_team_ids').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
