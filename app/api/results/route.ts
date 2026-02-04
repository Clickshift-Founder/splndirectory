import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodId = searchParams.get('period_id');
    const groupId = searchParams.get('group_id');

    if (!periodId || !groupId) {
      return NextResponse.json(
        { error: 'period_id and group_id are required' },
        { status: 400 }
      );
    }

    // Get aggregated review results for the specified period and group
    // COALESCE converts NULL to 0
    const result = await sql`
      SELECT 
        s.id as student_id,
        s.name as student_name,
        s.matric_number,
        COALESCE(ROUND(AVG(r.question1_score)::numeric, 2), 0) as avg_q1,
        COALESCE(ROUND(AVG(r.question2_score)::numeric, 2), 0) as avg_q2,
        COALESCE(ROUND(AVG((r.question1_score + r.question2_score) / 2.0)::numeric, 2), 0) as overall_avg,
        COUNT(r.id) as review_count
      FROM students s
      LEFT JOIN reviews r ON s.id = r.reviewed_id AND r.review_period_id = ${periodId}
      WHERE s.group_id = ${groupId}
      GROUP BY s.id, s.name, s.matric_number
      HAVING COUNT(r.id) > 0
      ORDER BY s.name
    `;

    // Additional safety: convert string numbers to actual numbers
    const sanitizedResults = result.rows.map(row => ({
      student_id: row.student_id,
      student_name: row.student_name,
      matric_number: row.matric_number,
      avg_q1: Number(row.avg_q1) || 0,
      avg_q2: Number(row.avg_q2) || 0,
      overall_avg: Number(row.overall_avg) || 0,
      review_count: Number(row.review_count) || 0,
    }));

    return NextResponse.json(sanitizedResults);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}