import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams } from './schema';

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
  apiKey: one(apiKeys, {
    fields: [apiRequestLogs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiRequestLog = typeof apiRequestLogs.$inferSelect;
export type NewApiRequestLog = typeof apiRequestLogs.$inferInsert;
