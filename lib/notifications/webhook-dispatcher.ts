import { eq, and, desc } from 'drizzle-orm';
import { createHmac } from 'crypto';
import { db } from '@/lib/db/drizzle';
import {
  webhookEndpoints,
  webhookDeliveries,
  type NewWebhookDelivery,
} from '@/lib/db/notifications-schema';
import type { WebhookEvent, WebhookPayload } from './types';

const MAX_ATTEMPTS = 3;

function getBackoffMs(attempt: number): number {
  // Exponential backoff: 30s, 5min, 1hr
  const delays = [30_000, 300_000, 3_600_000];
  return delays[attempt] ?? 3_600_000;
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export async function dispatchWebhook(
  teamId: number,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Get all active endpoints for this team that subscribe to this event
    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.teamId, teamId),
          eq(webhookEndpoints.isActive, true)
        )
      );

    const subscribedEndpoints = endpoints.filter((ep) => {
      const events = ep.events as string[];
      return events.includes(event) || events.includes('*');
    });

    if (subscribedEndpoints.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      teamId,
      data,
    };

    await Promise.allSettled(
      subscribedEndpoints.map((ep) => deliverWebhook(ep.id, ep.url, ep.secret, event, payload))
    );
  } catch (err) {
    console.error('[webhook] Failed to dispatch webhook:', err);
  }
}

export async function deliverWebhook(
  endpointId: number,
  url: string,
  secret: string,
  event: WebhookEvent,
  payload: WebhookPayload,
  existingDeliveryId?: number
): Promise<void> {
  const payloadStr = JSON.stringify(payload);
  const signature = signPayload(payloadStr, secret);

  let statusCode: number | null = null;
  let responseText: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': event,
        'User-Agent': 'SaaS-Starter-Webhook/1.0',
      },
      body: payloadStr,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    statusCode = response.status;
    responseText = await response.text().catch(() => null);
  } catch (err) {
    statusCode = null;
    responseText = err instanceof Error ? err.message : 'Request failed';
  }

  const succeeded = statusCode !== null && statusCode >= 200 && statusCode < 300;

  try {
    if (existingDeliveryId) {
      // Update existing delivery record
      const existing = await db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.id, existingDeliveryId))
        .limit(1);

      const currentAttempts = (existing[0]?.attempts ?? 0) + 1;
      const nextRetryAt =
        !succeeded && currentAttempts < MAX_ATTEMPTS
          ? new Date(Date.now() + getBackoffMs(currentAttempts))
          : null;

      await db
        .update(webhookDeliveries)
        .set({
          statusCode,
          response: responseText,
          attempts: currentAttempts,
          nextRetryAt,
        })
        .where(eq(webhookDeliveries.id, existingDeliveryId));
    } else {
      // Create new delivery record
      const newDelivery: NewWebhookDelivery = {
        webhookEndpointId: endpointId,
        event,
        payload,
        statusCode,
        response: responseText,
        attempts: 1,
        nextRetryAt:
          !succeeded && 1 < MAX_ATTEMPTS
            ? new Date(Date.now() + getBackoffMs(1))
            : null,
      };

      await db.insert(webhookDeliveries).values(newDelivery);
    }

    // Update the endpoint's lastTriggeredAt
    await db
      .update(webhookEndpoints)
      .set({ lastTriggeredAt: new Date() })
      .where(eq(webhookEndpoints.id, endpointId));
  } catch (err) {
    console.error('[webhook] Failed to record delivery:', err);
  }
}

export async function recordDelivery(
  endpointId: number,
  event: WebhookEvent,
  payload: WebhookPayload,
  statusCode: number | null,
  response: string | null,
  attempts: number
): Promise<number | null> {
  try {
    const nextRetryAt =
      (statusCode === null || statusCode < 200 || statusCode >= 300) &&
      attempts < MAX_ATTEMPTS
        ? new Date(Date.now() + getBackoffMs(attempts))
        : null;

    const result = await db
      .insert(webhookDeliveries)
      .values({
        webhookEndpointId: endpointId,
        event,
        payload,
        statusCode,
        response,
        attempts,
        nextRetryAt,
      })
      .returning({ id: webhookDeliveries.id });

    return result[0]?.id ?? null;
  } catch (err) {
    console.error('[webhook] Failed to record delivery:', err);
    return null;
  }
}

export async function getDeliveryHistory(
  endpointId: number,
  limit = 20
) {
  try {
    return await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookEndpointId, endpointId))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit);
  } catch (err) {
    console.error('[webhook] Failed to get delivery history:', err);
    return [];
  }
}
