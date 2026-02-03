import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const result = await sql`
      SELECT id, name, matric_number, group_id
      FROM students
      WHERE LOWER(name) LIKE LOWER(${'%' + query + '%'})
      ORDER BY name
      LIMIT 10
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
