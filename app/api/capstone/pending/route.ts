// FILE: app/api/capstone/pending/route.ts
// Get students who haven't submitted capstone reviews yet

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('group_id');

    // Get active period
    const periodResult = await sql`
      SELECT id, period_name FROM capstone_periods 
      WHERE is_active = TRUE 
      ORDER BY id DESC LIMIT 1
    `;

    if (periodResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No active capstone period' },
        { status: 400 }
      );
    }

    const periodId = periodResult.rows[0].id;

    let result;

    if (groupId && groupId !== 'all') {
      // Pending in specific group
      result = await sql`
        SELECT 
          s.id,
          s.name,
          s.matric_number,
          s.phone_number,
          cg.name as capstone_group_name
        FROM students s
        INNER JOIN capstone_memberships cm ON s.id = cm.student_id
        INNER JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
        LEFT JOIN capstone_submissions cs ON s.id = cs.student_id 
          AND cs.capstone_period_id = ${periodId}
        WHERE cg.id = ${groupId}
          AND cs.id IS NULL
        ORDER BY s.name
      `;
    } else {
      // All pending across all groups
      result = await sql`
        SELECT 
          s.id,
          s.name,
          s.matric_number,
          s.phone_number,
          cg.name as capstone_group_name
        FROM students s
        INNER JOIN capstone_memberships cm ON s.id = cm.student_id
        INNER JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
        LEFT JOIN capstone_submissions cs ON s.id = cs.student_id 
          AND cs.capstone_period_id = ${periodId}
        WHERE cs.id IS NULL
        ORDER BY cg.name, s.name
      `;
    }

    // Also get submitted count for stats
    const submittedResult = await sql`
      SELECT COUNT(DISTINCT student_id) as submitted_count
      FROM capstone_submissions
      WHERE capstone_period_id = ${periodId}
    `;

    const totalResult = await sql`
      SELECT COUNT(*) as total_count
      FROM capstone_memberships
    `;

    return NextResponse.json({
      period_name: periodResult.rows[0].period_name,
      pending: result.rows,
      pending_count: result.rows.length,
      submitted_count: Number(submittedResult.rows[0].submitted_count),
      total_count: Number(totalResult.rows[0].total_count),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error fetching capstone pending:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending', details: error.message },
      { status: 500 }
    );
  }
}