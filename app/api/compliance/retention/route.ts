import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/db/admin-auth';
import { getRetentionPolicies, setRetentionPolicy } from '@/lib/compliance/retention';

export async function GET(req: NextRequest) {
  try {
    await getAdminUser();

    const { searchParams } = req.nextUrl;
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const policies = await getRetentionPolicies(parseInt(teamId, 10));
    return NextResponse.json({ policies });
  } catch (error) {
    console.error('[compliance/retention] GET error:', error);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await getAdminUser();

    const body = await req.json() as {
      teamId?: number;
      resource?: string;
      retentionDays?: number;
      isActive?: boolean;
    };

    if (!body.teamId || !body.resource || body.retentionDays === undefined) {
      return NextResponse.json(
        { error: 'teamId, resource, and retentionDays are required' },
        { status: 400 }
      );
    }

    if (body.retentionDays < 1 || body.retentionDays > 36500) {
      return NextResponse.json(
        { error: 'retentionDays must be between 1 and 36500' },
        { status: 400 }
      );
    }

    const policy = await setRetentionPolicy({
      teamId: body.teamId,
      resource: body.resource,
      retentionDays: body.retentionDays,
      isActive: body.isActive,
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('[compliance/retention] PUT error:', error);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 401 });
  }
}
