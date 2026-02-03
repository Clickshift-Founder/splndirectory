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
    const result = await sql`
      SELECT 
        s.id as student_id,
        s.name as student_name,
        s.matric_number,
        ROUND(AVG(r.question1_score)::numeric, 2) as avg_q1,
        ROUND(AVG(r.question2_score)::numeric, 2) as avg_q2,
        ROUND(AVG((r.question1_score + r.question2_score) / 2.0)::numeric, 2) as overall_avg,
        COUNT(r.id) as review_count
      FROM students s
      LEFT JOIN reviews r ON s.id = r.reviewed_id AND r.review_period_id = ${periodId}
      WHERE s.group_id = ${groupId}
      GROUP BY s.id, s.name, s.matric_number
      HAVING COUNT(r.id) > 0
      ORDER BY s.name
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}