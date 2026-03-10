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

// Feature flags table
export const featureFlags = pgTable('feature_flags', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull().default('boolean'),
  // type: 'boolean' | 'percentage' | 'userList' | 'teamList'
  enabled: boolean('enabled').notNull().default(false),
  rolloutPercentage: integer('rollout_percentage').default(0),
  targetUserIds: jsonb('target_user_ids').default([]),
  targetTeamIds: jsonb('target_team_ids').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Types
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;

export type FlagType = 'boolean' | 'percentage' | 'userList' | 'teamList';

export interface FlagEvaluationContext {
  userId?: number;
  teamId?: number;
}
