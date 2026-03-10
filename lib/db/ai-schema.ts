/**
 * AI Usage Schema
 * New tables for AI usage tracking and billing.
 * These will be merged into the main schema.ts by Lead during integration phase.
 *
 * NOTE: userId references users.id (FK), teamId references teams.id (FK)
 * but we use plain integer here since tables are not yet merged into main schema.
 */

import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * Records each AI API call with token counts and cost.
 * userId: FK → users.id
 * teamId: FK → teams.id
 */
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: serial('id').primaryKey(),
  // FK → users.id
  userId: integer('user_id').notNull(),
  // FK → teams.id (nullable, user may not be in a team)
  teamId: integer('team_id'),
  model: varchar('model', { length: 100 }).notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  // Stored as decimal string to avoid floating point issues, e.g. "0.001234"
  cost: varchar('cost', { length: 50 }).notNull().default('0'),
  // The API endpoint that triggered this usage, e.g. "/api/ai/chat"
  endpoint: varchar('endpoint', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Per-team monthly quota configuration and current usage counter.
 * teamId: FK → teams.id (unique — one quota record per team)
 */
export const aiQuotas = pgTable('ai_quotas', {
  id: serial('id').primaryKey(),
  // FK → teams.id (unique constraint: one row per team)
  teamId: integer('team_id').notNull().unique(),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  // Maximum tokens allowed per billing month
  monthlyTokenLimit: integer('monthly_token_limit').notNull().default(100000),
  // Running total of tokens used in the current billing period
  tokensUsed: integer('tokens_used').notNull().default(0),
  // When the monthly counter resets (start of next billing period)
  resetAt: timestamp('reset_at').notNull(),
});

// Inferred TypeScript types
export type AIUsageLog = typeof aiUsageLogs.$inferSelect;
export type NewAIUsageLog = typeof aiUsageLogs.$inferInsert;
export type AIQuota = typeof aiQuotas.$inferSelect;
export type NewAIQuota = typeof aiQuotas.$inferInsert;
