// FILE: app/api/capstone/results/route.ts
// Admin results endpoint for capstone

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('group_id');
    const periodId = searchParams.get('period_id');

    // Get period (defaults to active if not specified)
    let capstonePeriodId: number;
    if (periodId) {
      capstonePeriodId = parseInt(periodId);
    } else {
      const periodResult = await sql`
        SELECT id FROM capstone_periods 
        ORDER BY id DESC LIMIT 1
      `;
      if (periodResult.rows.length === 0) {
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          }
        });
      }
      capstonePeriodId = periodResult.rows[0].id;
    }

    console.log('📊 Fetching capstone results:', { capstonePeriodId, groupId: groupId || 'ALL' });

    let result;

    if (groupId && groupId !== 'all') {
      // Specific capstone group
      result = await sql`
        SELECT 
          s.id as student_id,
          s.name as student_name,
          s.matric_number,
          s.phone_number,
          cg.name as capstone_group_name,
          COALESCE(AVG(cr.question1_score), 0) as avg_q1,
          COALESCE(AVG(cr.question2_score), 0) as avg_q2,
          COALESCE(AVG(cr.question3_score), 0) as avg_q3,
          COALESCE(AVG((cr.question1_score + cr.question2_score + cr.question3_score) / 3.0), 0) as overall_avg,
          COUNT(DISTINCT cr.reviewer_id) as review_count
        FROM students s
        INNER JOIN capstone_memberships cm ON s.id = cm.student_id
        INNER JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
        INNER JOIN capstone_reviews cr ON s.id = cr.reviewed_id 
          AND cr.capstone_period_id = ${capstonePeriodId}
        WHERE cg.id = ${groupId}
        GROUP BY s.id, s.name, s.matric_number, s.phone_number, cg.name
        ORDER BY s.name
      `;
    } else {
      // All capstone groups
      result = await sql`
        SELECT 
          s.id as student_id,
          s.name as student_name,
          s.matric_number,
          s.phone_number,
          cg.name as capstone_group_name,
          COALESCE(AVG(cr.question1_score), 0) as avg_q1,
          COALESCE(AVG(cr.question2_score), 0) as avg_q2,
          COALESCE(AVG(cr.question3_score), 0) as avg_q3,
          COALESCE(AVG((cr.question1_score + cr.question2_score + cr.question3_score) / 3.0), 0) as overall_avg,
          COUNT(DISTINCT cr.reviewer_id) as review_count
        FROM students s
        INNER JOIN capstone_memberships cm ON s.id = cm.student_id
        INNER JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
        INNER JOIN capstone_reviews cr ON s.id = cr.reviewed_id 
          AND cr.capstone_period_id = ${capstonePeriodId}
        GROUP BY s.id, s.name, s.matric_number, s.phone_number, cg.name
        ORDER BY cg.name, s.name
      `;
    }

    console.log(`✅ Found ${result.rows.length} students with capstone reviews`);

    const formattedResults = result.rows.map(row => ({
      student_id: Number(row.student_id),
      student_name: String(row.student_name),
      matric_number: String(row.matric_number),
      phone_number: row.phone_number ? String(row.phone_number) : '',
      capstone_group_name: String(row.capstone_group_name),
      avg_q1: Number(row.avg_q1) || 0,
      avg_q2: Number(row.avg_q2) || 0,
      avg_q3: Number(row.avg_q3) || 0,
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
    console.error('❌ Error fetching capstone results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capstone results', details: error.message },
      { status: 500 }
    );
  }
}