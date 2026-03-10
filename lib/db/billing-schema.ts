import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { teams, users } from './schema';

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
  month: varchar('month', { length: 7 }).notNull(), // e.g. '2026-03'
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
