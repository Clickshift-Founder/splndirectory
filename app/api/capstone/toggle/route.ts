// FILE: app/api/capstone/toggle/route.ts
// Admin endpoint to open/close capstone rating period

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET current status
export async function GET() {
  try {
    const result = await sql`
      SELECT id, period_name, is_active, opened_at, closed_at
      FROM capstone_periods
      ORDER BY id DESC LIMIT 1
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { is_open: false, error: 'No capstone period exists' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { is_open: result.rows[0].is_active, period: result.rows[0] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching toggle status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

// POST toggle status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action: 'open' | 'close' };

    if (!action || !['open', 'close'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "open" or "close"' },
        { status: 400 }
      );
    }

    // Get the latest period
    const periodResult = await sql`
      SELECT id FROM capstone_periods ORDER BY id DESC LIMIT 1
    `;

    if (periodResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No capstone period exists' },
        { status: 404 }
      );
    }

    const periodId = periodResult.rows[0].id;

    if (action === 'open') {
      await sql`
        UPDATE capstone_periods 
        SET is_active = TRUE, opened_at = CURRENT_TIMESTAMP, closed_at = NULL
        WHERE id = ${periodId}
      `;
      return NextResponse.json(
        { success: true, is_open: true, message: 'Capstone rating opened for students' },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          }
        }
      );
    } else {
      await sql`
        UPDATE capstone_periods 
        SET is_active = FALSE, closed_at = CURRENT_TIMESTAMP
        WHERE id = ${periodId}
      `;
      return NextResponse.json(
        { success: true, is_open: false, message: 'Capstone rating closed' },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          }
        }
      );
    }
  } catch (error: any) {
    console.error('Error toggling capstone:', error);
    return NextResponse.json(
      { error: 'Failed to toggle', details: error.message },
      { status: 500 }
    );
  }
}