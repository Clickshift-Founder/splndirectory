// UPDATE app/api/results/route.ts

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodId = searchParams.get('period_id');
    const groupId = searchParams.get('group_id'); // May be null for "all groups"

    if (!periodId) {
      return NextResponse.json(
        { error: 'Period ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching results:', { periodId, groupId: groupId || 'ALL' });

    let query;

    if (groupId) {
      // Specific group query
      query = sql`
        SELECT 
          s.id as student_id,
          s.name as student_name,
          s.matric_number,
          g.name as group_name,
          COALESCE(AVG(
            CASE 
              WHEN r.question_number = 1 THEN r.score 
            END
          ), 0) as avg_q1,
          COALESCE(AVG(
            CASE 
              WHEN r.question_number = 2 THEN r.score 
            END
          ), 0) as avg_q2,
          COALESCE(AVG(r.score), 0) as overall_avg,
          COUNT(DISTINCT r.reviewer_id) as review_count
        FROM students s
        JOIN groups g ON s.group_id = g.id
        LEFT JOIN reviews r ON s.id = r.reviewed_student_id 
          AND r.review_period_id = ${periodId}
        WHERE s.group_id = ${groupId}
        GROUP BY s.id, s.name, s.matric_number, g.name
        ORDER BY s.name
      `;
    } else {
      // All groups query
      query = sql`
        SELECT 
          s.id as student_id,
          s.name as student_name,
          s.matric_number,
          g.name as group_name,
          COALESCE(AVG(
            CASE 
              WHEN r.question_number = 1 THEN r.score 
            END
          ), 0) as avg_q1,
          COALESCE(AVG(
            CASE 
              WHEN r.question_number = 2 THEN r.score 
            END
          ), 0) as avg_q2,
          COALESCE(AVG(r.score), 0) as overall_avg,
          COUNT(DISTINCT r.reviewer_id) as review_count
        FROM students s
        JOIN groups g ON s.group_id = g.id
        LEFT JOIN reviews r ON s.id = r.reviewed_student_id 
          AND r.review_period_id = ${periodId}
        GROUP BY s.id, s.name, s.matric_number, g.name
        ORDER BY g.name, s.name
      `;
    }

    const result = await query;

    console.log(`✅ Found ${result.rows.length} students`);

    // Convert numeric values to proper numbers
    const formattedResults = result.rows.map(row => ({
      ...row,
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
  } catch (error) {
    console.error('❌ Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        }
      }
    );
  }
}