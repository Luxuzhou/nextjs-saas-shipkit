import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { uninstallPlugin } from '@/lib/plugins/lifecycle';

export async function DELETE(
  _req: NextRequest,
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

    const result = await uninstallPlugin(slug, { teamId: teamData.id, userId: user.id });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/plugins/[slug]/uninstall]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
