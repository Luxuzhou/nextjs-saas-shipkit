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
import { users, teams } from './schema';

// Notifications table
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

// Webhook endpoints table
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

// Webhook deliveries table
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

// Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [notifications.teamId],
    references: [teams.id],
  }),
}));

export const webhookEndpointsRelations = relations(
  webhookEndpoints,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [webhookEndpoints.teamId],
      references: [teams.id],
    }),
    deliveries: many(webhookDeliveries),
  })
);

export const webhookDeliveriesRelations = relations(
  webhookDeliveries,
  ({ one }) => ({
    webhookEndpoint: one(webhookEndpoints, {
      fields: [webhookDeliveries.webhookEndpointId],
      references: [webhookEndpoints.id],
    }),
  })
);

// Types
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
