import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { period_id } = await request.json();

    if (!period_id) {
      return NextResponse.json(
        { error: 'Period ID is required' },
        { status: 400 }
      );
    }

    // Deactivate all periods
    await sql`
      UPDATE review_periods
      SET is_active = false
    `;

    // Activate the selected period
    const result = await sql`
      UPDATE review_periods
      SET is_active = true
      WHERE id = ${period_id}
      RETURNING id, period_name, month, year, is_active
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      period: result.rows[0],
    });
  } catch (error) {
    console.error('Error activating period:', error);
    return NextResponse.json(
      { error: 'Failed to activate period' },
      { status: 500 }
    );
  }
}