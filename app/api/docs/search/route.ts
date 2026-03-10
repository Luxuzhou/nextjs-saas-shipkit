import { NextRequest, NextResponse } from 'next/server';
import { searchDocs } from '@/lib/docs/search';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';

  try {
    const results = searchDocs(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Docs search error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
