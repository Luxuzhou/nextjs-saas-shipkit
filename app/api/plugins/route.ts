import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getInstalledPlugins } from '@/lib/plugins/lifecycle';
import { listPlugins } from '@/lib/plugins/registry';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamData = await getTeamForUser();
    if (!teamData) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const plugins = await getInstalledPlugins(teamData.id);

    return NextResponse.json({ plugins });
  } catch (err) {
    console.error('[GET /api/plugins]', err);
    // Fallback: return registry plugins without installation info
    const plugins = listPlugins().map((m) => ({
      ...m,
      isInstalled: false,
      isEnabled: false,
    }));
    return NextResponse.json({ plugins });
  }
}
