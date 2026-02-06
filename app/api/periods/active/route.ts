import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// CRITICAL: Disable ALL caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Log request for debugging
    console.log('📅 [/api/periods/active] Fetching active period...');
    
    const result = await sql`
      SELECT id, period_name, month, year, is_active
      FROM review_periods
      WHERE is_active = true
      LIMIT 1
    `;

    console.log('📊 Query result:', result.rows);

    if (result.rows.length === 0) {
      console.log('⚠️  No active period found');
      return NextResponse.json(
        { error: 'No active review period', active: false },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    const activePeriod = result.rows[0];
    console.log('✅ Active period:', activePeriod.period_name);

    return NextResponse.json(activePeriod, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('❌ Error fetching active period:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active period' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        }
      }
    );
  }
}