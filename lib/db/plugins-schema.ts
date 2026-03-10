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
import { teams, users } from './schema';

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

// Relations
export const pluginsRelations = relations(plugins, ({ many }) => ({
  installations: many(pluginInstallations),
  apiKeys: many(pluginApiKeys),
}));

export const pluginInstallationsRelations = relations(
  pluginInstallations,
  ({ one }) => ({
    plugin: one(plugins, {
      fields: [pluginInstallations.pluginId],
      references: [plugins.id],
    }),
    team: one(teams, {
      fields: [pluginInstallations.teamId],
      references: [teams.id],
    }),
    installedByUser: one(users, {
      fields: [pluginInstallations.installedBy],
      references: [users.id],
    }),
  })
);

export const pluginApiKeysRelations = relations(pluginApiKeys, ({ one }) => ({
  plugin: one(plugins, {
    fields: [pluginApiKeys.pluginId],
    references: [plugins.id],
  }),
  team: one(teams, {
    fields: [pluginApiKeys.teamId],
    references: [teams.id],
  }),
}));

// Types
export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;
export type PluginInstallation = typeof pluginInstallations.$inferSelect;
export type NewPluginInstallation = typeof pluginInstallations.$inferInsert;
export type PluginApiKey = typeof pluginApiKeys.$inferSelect;
export type NewPluginApiKey = typeof pluginApiKeys.$inferInsert;
