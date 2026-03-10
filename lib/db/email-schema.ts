import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean
} from 'drizzle-orm/pg-core';
import { users } from '@/lib/db/schema';

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false)
});

export const emailVerifications = pgTable('email_verifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  email: varchar('email', { length: 255 }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at')
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
