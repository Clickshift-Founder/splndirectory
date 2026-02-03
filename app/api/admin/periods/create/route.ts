import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month (must be 1-12)' },
        { status: 400 }
      );
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const periodName = `${monthNames[month - 1]} ${year}`;

    // Create new period (not active by default)
    const result = await sql`
      INSERT INTO review_periods (period_name, month, year, is_active)
      VALUES (${periodName}, ${month}, ${year}, false)
      RETURNING id, period_name, month, year, is_active
    `;

    return NextResponse.json({
      success: true,
      period: result.rows[0],
    });
  } catch (error: any) {
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'A period for this month and year already exists' },
        { status: 400 }
      );
    }
    console.error('Error creating period:', error);
    return NextResponse.json(
      { error: 'Failed to create period' },
      { status: 500 }
    );
  }
}