import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, teams } from './schema';

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
