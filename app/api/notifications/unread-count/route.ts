import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getUnreadCount } from '@/lib/notifications/sender';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await getUnreadCount(user.id);
    return NextResponse.json({ count });
  } catch (err) {
    console.error('[api/notifications/unread-count] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
