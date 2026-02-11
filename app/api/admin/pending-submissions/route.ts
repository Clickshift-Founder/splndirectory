// Create this file: app/api/admin/pending-submissions/route.ts

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodId = searchParams.get('period_id');
    const groupId = searchParams.get('group_id');

    // Get active period if not specified
    let targetPeriodId = periodId;
    
    if (!targetPeriodId) {
      const activePeriodResult = await sql`
        SELECT id FROM review_periods WHERE is_active = true LIMIT 1
      `;
      
      if (activePeriodResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'No active period found' },
          { status: 404 }
        );
      }
      
      targetPeriodId = activePeriodResult.rows[0].id.toString();
    }

    // Build query based on filters
    let query;
    
    if (groupId) {
      // Filter by specific group
      query = sql`
        SELECT 
          s.id,
          s.name,
          s.matric_number,
          s.email,
          s.phone_number,
          g.name as group_name
        FROM students s
        JOIN groups g ON s.group_id = g.id
        LEFT JOIN review_submissions rs 
          ON s.id = rs.student_id 
          AND rs.review_period_id = ${targetPeriodId}
        WHERE s.group_id = ${groupId}
          AND rs.id IS NULL
        ORDER BY s.name
      `;
    } else {
      // All students across all groups
      query = sql`
        SELECT 
          s.id,
          s.name,
          s.matric_number,
          s.email,
          s.phone_number,
          g.name as group_name
        FROM students s
        JOIN groups g ON s.group_id = g.id
        LEFT JOIN review_submissions rs 
          ON s.id = rs.student_id 
          AND rs.review_period_id = ${targetPeriodId}
        WHERE rs.id IS NULL
        ORDER BY g.name, s.name
      `;
    }

    const result = await query;

    // Get period info
    const periodResult = await sql`
      SELECT period_name FROM review_periods WHERE id = ${targetPeriodId}
    `;

    return NextResponse.json({
      period_name: periodResult.rows[0]?.period_name || 'Unknown',
      total_pending: result.rows.length,
      students: result.rows
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending submissions' },
      { status: 500 }
    );
  }
}