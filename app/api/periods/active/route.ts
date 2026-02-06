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

    console.log('📅 Active period query result:', result.rows);

    if (result.rows.length === 0) {
      console.log('⚠️ No active period found');
      return NextResponse.json(
        { error: 'No active review period' },
        { status: 404 }
      );
    }

    const activePeriod = result.rows[0];
    console.log('✅ Active period:', activePeriod);

    return NextResponse.json(activePeriod);
  } catch (error) {
    console.error('❌ Error fetching active period:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active period' },
      { status: 500 }
    );
  }
}