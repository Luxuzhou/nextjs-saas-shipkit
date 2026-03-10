import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { markAsRead, markAllRead } from '@/lib/notifications/sender';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { notificationId, all } = body as {
      notificationId?: number;
      all?: boolean;
    };

    if (all) {
      const result = await markAllRead(user.id);
      return NextResponse.json(result);
    }

    if (typeof notificationId !== 'number') {
      return NextResponse.json(
        { error: 'notificationId or all:true required' },
        { status: 400 }
      );
    }

    const result = await markAsRead(notificationId, user.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/notifications/read] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
