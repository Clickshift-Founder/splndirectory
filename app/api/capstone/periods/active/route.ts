// FILE: app/api/capstone/periods/active/route.ts
// Returns the active capstone period (or null if closed)

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, period_name, is_active, opened_at, closed_at
      FROM capstone_periods
      WHERE is_active = TRUE
      ORDER BY id DESC
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { is_open: false, message: 'Capstone rating is currently closed' },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    return NextResponse.json(
      { is_open: true, ...result.rows[0] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching active capstone period:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active period' },
      { status: 500 }
    );
  }
}