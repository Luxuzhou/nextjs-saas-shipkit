import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { installPlugin } from '@/lib/plugins/lifecycle';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamData = await getTeamForUser();
    if (!teamData) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    let config: Record<string, unknown> = {};
    try {
      const body = await req.json();
      config = (body?.config as Record<string, unknown>) ?? {};
    } catch {
      // empty body is fine
    }

    const result = await installPlugin(
      slug,
      { teamId: teamData.id, userId: user.id },
      config
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/plugins/[slug]/install]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
