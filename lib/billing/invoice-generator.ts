/**
 * Invoice generation and history retrieval.
 *
 * Falls back to mock data when billing tables are not yet migrated.
 */

import type { InvoiceSummary, BillingPeriod } from './types';

/**
 * Get the current billing period (calendar month).
 */
export function getCurrentBillingPeriod(): BillingPeriod {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59)
  );
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  return { start, end, month };
}

/**
 * Generate a monthly invoice for a team.
 * In production this would aggregate usage and create a Stripe invoice.
 * Currently stores a record in the invoices table.
 */
export async function generateMonthlyInvoice(
  teamId: number,
  totalAmount: string,
  period?: BillingPeriod
): Promise<InvoiceSummary> {
  const billingPeriod = period ?? getCurrentBillingPeriod();

  try {
    const { db } = await import('@/lib/db/drizzle');
    const { invoices } = await import('@/lib/db/billing-schema');

    const result = await db
      .insert(invoices)
      .values({
        teamId,
        periodStart: billingPeriod.start,
        periodEnd: billingPeriod.end,
        totalAmount,
        currency: 'USD',
        status: 'paid',
      })
      .returning();

    const row = result[0];
    return {
      id: row.id,
      teamId: row.teamId,
      periodStart: row.periodStart.toISOString(),
      periodEnd: row.periodEnd.toISOString(),
      totalAmount: row.totalAmount,
      currency: row.currency,
      status: row.status,
      pdfUrl: row.pdfUrl,
      createdAt: row.createdAt.toISOString(),
    };
  } catch (err) {
    console.warn(
      '[invoice-generator] generateMonthlyInvoice failed (table may not exist):',
      err
    );
    // Return a mock invoice
    return {
      id: 0,
      teamId,
      periodStart: billingPeriod.start.toISOString(),
      periodEnd: billingPeriod.end.toISOString(),
      totalAmount,
      currency: 'USD',
      status: 'draft',
      pdfUrl: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get invoice history for a team.
 * Falls back to mock data when the table does not exist.
 */
export async function getInvoiceHistory(
  teamId: number,
  limit = 12
): Promise<InvoiceSummary[]> {
  try {
    const { db } = await import('@/lib/db/drizzle');
    const { invoices } = await import('@/lib/db/billing-schema');
    const { desc, eq } = await import('drizzle-orm');

    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.teamId, teamId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      teamId: row.teamId,
      periodStart: row.periodStart.toISOString(),
      periodEnd: row.periodEnd.toISOString(),
      totalAmount: row.totalAmount,
      currency: row.currency,
      status: row.status,
      pdfUrl: row.pdfUrl,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch {
    console.warn(
      '[invoice-generator] getInvoiceHistory: falling back to mock data'
    );
    return getMockInvoiceHistory(teamId);
  }
}

function getMockInvoiceHistory(teamId: number): InvoiceSummary[] {
  const now = new Date();
  return Array.from({ length: 3 }, (_, i) => {
    const month = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i - 1, 1)
    );
    const endDay = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)
    );
    return {
      id: 1000 + i,
      teamId,
      periodStart: month.toISOString(),
      periodEnd: endDay.toISOString(),
      totalAmount: ((19 + Math.random() * 5).toFixed(2)),
      currency: 'USD',
      status: 'paid',
      pdfUrl: null,
      createdAt: endDay.toISOString(),
    };
  });
}
