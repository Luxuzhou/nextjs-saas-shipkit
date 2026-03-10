import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getInvoiceHistory } from '@/lib/billing/invoice-generator';

export async function GET(): Promise<Response> {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const invoices = await getInvoiceHistory(team.id);
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('[billing/invoices] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
