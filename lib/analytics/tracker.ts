import { db } from '@/lib/db/drizzle';
import { analyticsEvents } from '@/lib/db/analytics-schema';
import type { NewAnalyticsEvent } from '@/lib/db/analytics-schema';

export async function trackEvent(event: NewAnalyticsEvent): Promise<void> {
  try {
    await db.insert(analyticsEvents).values(event);
  } catch (error) {
    // Gracefully handle missing table or DB errors
    console.warn('[Analytics] Failed to track event:', error);
  }
}

export async function batchInsert(events: NewAnalyticsEvent[]): Promise<void> {
  if (events.length === 0) return;
  try {
    await db.insert(analyticsEvents).values(events);
  } catch (error) {
    console.warn('[Analytics] Failed to batch insert events:', error);
  }
}
