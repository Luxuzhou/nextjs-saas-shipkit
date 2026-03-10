import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getUserNotifications } from '@/lib/notifications/sender';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

    const result = await getUserNotifications(user.id, page, Math.min(pageSize, 50));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/notifications] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
