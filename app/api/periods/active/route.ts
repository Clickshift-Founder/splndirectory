import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, period_name, month, year, is_active
      FROM review_periods
      WHERE is_active = true
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No active review period found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching active period:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active period' },
      { status: 500 }
    );
  }
}