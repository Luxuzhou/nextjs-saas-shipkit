import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getPlugin } from '@/lib/plugins/registry';
import { getInstalledPlugins } from '@/lib/plugins/lifecycle';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const manifest = getPlugin(slug);
    if (!manifest) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ ...manifest, isInstalled: false, isEnabled: false });
    }

    const teamData = await getTeamForUser();
    if (!teamData) {
      return NextResponse.json({ ...manifest, isInstalled: false, isEnabled: false });
    }

    const installed = await getInstalledPlugins(teamData.id);
    const found = installed.find((p) => p.slug === slug);

    return NextResponse.json(found ?? { ...manifest, isInstalled: false, isEnabled: false });
  } catch (err) {
    console.error('[GET /api/plugins/[slug]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
