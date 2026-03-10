import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/db/admin-auth';
import { getAllUsers } from '@/lib/db/admin-queries';

export async function GET(request: NextRequest) {
  try {
    await getAdminUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));
  const search = searchParams.get('search') ?? undefined;

  const result = await getAllUsers(page, pageSize, search);

  return NextResponse.json(result);
}
