// FILE: app/api/capstone/submissions/status/[id]/route.ts
// Check if a student has already submitted capstone reviews

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get active period
    const periodResult = await sql`
      SELECT id, period_name FROM capstone_periods 
      WHERE is_active = TRUE 
      ORDER BY id DESC LIMIT 1
    `;

    if (periodResult.rows.length === 0) {
      return NextResponse.json(
        { has_submitted: false, period_open: false },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          }
        }
      );
    }

    const period = periodResult.rows[0];

    // Check submission
    const submissionResult = await sql`
      SELECT id, submitted_at
      FROM capstone_submissions
      WHERE student_id = ${params.id}
        AND capstone_period_id = ${period.id}
    `;

    // If submitted, also fetch their reviews for display
    let reviews: any[] = [];
    if (submissionResult.rows.length > 0) {
      const reviewsResult = await sql`
        SELECT 
          cr.reviewed_id,
          s.name as reviewed_name,
          s.matric_number as reviewed_matric,
          cr.question1_score,
          cr.question2_score,
          cr.question3_score,
          cr.comment
        FROM capstone_reviews cr
        JOIN students s ON cr.reviewed_id = s.id
        WHERE cr.reviewer_id = ${params.id}
          AND cr.capstone_period_id = ${period.id}
        ORDER BY s.name
      `;
      reviews = reviewsResult.rows;
    }

    return NextResponse.json(
      {
        has_submitted: submissionResult.rows.length > 0,
        period_open: true,
        period_name: period.period_name,
        submitted_at: submissionResult.rows[0]?.submitted_at || null,
        reviews: reviews,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error checking capstone submission status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}