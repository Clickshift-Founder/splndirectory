import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, period_name, month, year, is_active, created_at
      FROM review_periods
      ORDER BY year DESC, month DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching periods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch periods' },
      { status: 500 }
    );
  }
}