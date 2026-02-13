export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodId = searchParams.get('period_id');
    const groupId = searchParams.get('group_id');

    if (!periodId) {
      return NextResponse.json(
        { error: 'Period ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching results:', { periodId, groupId: groupId || 'ALL' });

    let result;

    if (groupId) {
      // Specific group
      result = await sql`
        SELECT 
          s.id as student_id,
          s.name as student_name,
          s.matric_number,
          g.name as group_name,
          COALESCE(AVG(r.question1_score), 0) as avg_q1,
          COALESCE(AVG(r.question2_score), 0) as avg_q2,
          COALESCE(AVG((r.question1_score + r.question2_score) / 2.0), 0) as overall_avg,
          COUNT(DISTINCT r.reviewer_id) as review_count
        FROM students s
        JOIN groups g ON s.group_id = g.id
        INNER JOIN reviews r ON s.id = r.reviewed_id 
          AND r.review_period_id = ${periodId}
        WHERE s.group_id = ${groupId}
        GROUP BY s.id, s.name, s.matric_number, g.name
        ORDER BY s.name
      `;
    } else {
      // All groups
      result = await sql`
        SELECT 
          s.id as student_id,
          s.name as student_name,
          s.matric_number,
          g.name as group_name,
          COALESCE(AVG(r.question1_score), 0) as avg_q1,
          COALESCE(AVG(r.question2_score), 0) as avg_q2,
          COALESCE(AVG((r.question1_score + r.question2_score) / 2.0), 0) as overall_avg,
          COUNT(DISTINCT r.reviewer_id) as review_count
        FROM students s
        JOIN groups g ON s.group_id = g.id
        INNER JOIN reviews r ON s.id = r.reviewed_id 
          AND r.review_period_id = ${periodId}
        GROUP BY s.id, s.name, s.matric_number, g.name
        ORDER BY g.name, s.name
      `;
    }

    console.log(`✅ Found ${result.rows.length} students with reviews`);

    const formattedResults = result.rows.map(row => ({
      student_id: Number(row.student_id),
      student_name: String(row.student_name),
      matric_number: String(row.matric_number),
      group_name: String(row.group_name),
      avg_q1: Number(row.avg_q1) || 0,
      avg_q2: Number(row.avg_q2) || 0,
      overall_avg: Number(row.overall_avg) || 0,
      review_count: Number(row.review_count) || 0,
    }));

    return NextResponse.json(formattedResults, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results', details: error.message },
      { status: 500 }
    );
  }
}