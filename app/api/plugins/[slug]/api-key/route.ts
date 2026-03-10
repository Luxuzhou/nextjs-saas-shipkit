import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { generateApiKey } from '@/lib/plugins/lifecycle';

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

    let scopes: string[] = [];
    let expiresInDays: number | undefined;

    try {
      const body = await req.json() as { scopes?: string[]; expiresInDays?: number };
      scopes = body?.scopes ?? [];
      expiresInDays = body?.expiresInDays;
    } catch {
      // empty body is fine
    }

    const result = await generateApiKey(
      slug,
      { teamId: teamData.id, userId: user.id },
      scopes,
      expiresInDays
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, apiKey: result.apiKey });
  } catch (err) {
    console.error('[POST /api/plugins/[slug]/api-key]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
