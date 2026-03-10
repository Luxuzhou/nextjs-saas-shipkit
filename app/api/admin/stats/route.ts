import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/db/admin-auth';
import { getUserStats, getSubscriptionStats, getDailySignups } from '@/lib/db/admin-queries';

export async function GET() {
  try {
    await getAdminUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [userStats, subscriptionStats, dailySignups] = await Promise.all([
    getUserStats(),
    getSubscriptionStats(),
    getDailySignups(30),
  ]);

  return NextResponse.json({ userStats, subscriptionStats, dailySignups });
}
