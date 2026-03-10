import { NextResponse } from 'next/server';
import { getAllPlans } from '@/lib/billing/plans';

export async function GET(): Promise<Response> {
  try {
    const plans = getAllPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('[billing/plans] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
