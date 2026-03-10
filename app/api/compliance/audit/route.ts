import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getAdminUser } from '@/lib/db/admin-auth';
import { getAuditLogs } from '@/lib/compliance/audit-logger';
import type { AuditLogFilter } from '@/lib/compliance/types';

export async function GET(req: NextRequest) {
  try {
    // Try admin first, fall back to regular user
    let isAdmin = false;
    try {
      await getAdminUser();
      isAdmin = true;
    } catch {
      const user = await getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { searchParams } = req.nextUrl;

    const filter: AuditLogFilter = {
      page: parseInt(searchParams.get('page') ?? '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') ?? '50', 10),
    };

    // Admins can filter by any user/team; regular users only see their own
    if (isAdmin) {
      const userId = searchParams.get('userId');
      const teamId = searchParams.get('teamId');
      if (userId) filter.userId = parseInt(userId, 10);
      if (teamId) filter.teamId = parseInt(teamId, 10);
    } else {
      const user = await getUser();
      if (user) filter.userId = user.id;
    }

    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);

    const result = await getAuditLogs(filter);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[compliance/audit] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
