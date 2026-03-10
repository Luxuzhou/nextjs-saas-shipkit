import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { requestExport, processExport, getExportHistory } from '@/lib/compliance/data-exporter';
import type { DataExportType } from '@/lib/compliance/types';

const VALID_EXPORT_TYPES: DataExportType[] = [
  'full_export',
  'user_data',
  'team_data',
  'billing_data',
  'activity_data',
];

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { type?: string; teamId?: number };
    const type = body.type as DataExportType;

    if (!type || !VALID_EXPORT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid export type. Must be one of: ${VALID_EXPORT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const { id } = await requestExport({
      userId: user.id,
      teamId: body.teamId,
      type,
    });

    // Process synchronously for now (in production this would be a background job)
    try {
      const fileUrl = await processExport(id);
      return NextResponse.json({ id, status: 'completed', fileUrl }, { status: 201 });
    } catch (processError) {
      console.error('[compliance/export] Processing error:', processError);
      return NextResponse.json({ id, status: 'failed', error: 'Export processing failed' }, { status: 201 });
    }
  } catch (error) {
    console.error('[compliance/export] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const history = await getExportHistory(user.id);
    return NextResponse.json({ exports: history });
  } catch (error) {
    console.error('[compliance/export] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
