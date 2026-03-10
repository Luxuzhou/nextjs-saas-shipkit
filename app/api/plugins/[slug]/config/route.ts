import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { updatePluginConfig, enablePlugin, disablePlugin } from '@/lib/plugins/lifecycle';

export async function PUT(
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

    const body = await req.json() as {
      config?: Record<string, unknown>;
      enabled?: boolean;
    };

    const ctx = { teamId: teamData.id, userId: user.id };

    // Handle enable/disable toggle
    if (body.enabled !== undefined) {
      const result = body.enabled
        ? await enablePlugin(slug, ctx)
        : await disablePlugin(slug, ctx);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }

    // Handle config update
    if (body.config !== undefined) {
      const result = await updatePluginConfig(slug, ctx, body.config);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PUT /api/plugins/[slug]/config]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
