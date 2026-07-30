// FILE: app/api/capstone/reviews/submit/route.ts
// Submit capstone reviews (one-time only)

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface CapstoneReviewInput {
  reviewed_id: number;
  question1_score: number;
  question2_score: number;
  question3_score: number;
  comment: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewer_id, capstone_period_id, reviews } = body as {
      reviewer_id: number;
      capstone_period_id: number;
      reviews: CapstoneReviewInput[];
    };

    // Validation
    if (!reviewer_id || !capstone_period_id || !Array.isArray(reviews)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if capstone period is still active
    const periodCheck = await sql`
      SELECT is_active FROM capstone_periods WHERE id = ${capstone_period_id}
    `;

    if (periodCheck.rows.length === 0 || !periodCheck.rows[0].is_active) {
      return NextResponse.json(
        { error: 'Capstone rating period is closed' },
        { status: 400 }
      );
    }

    // Check if student has already submitted (one-time enforcement)
    const alreadySubmitted = await sql`
      SELECT id FROM capstone_submissions 
      WHERE student_id = ${reviewer_id} 
        AND capstone_period_id = ${capstone_period_id}
    `;

    if (alreadySubmitted.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted your capstone ratings. This is a one-time evaluation.' },
        { status: 400 }
      );
    }

    // Validate all reviews have proper scores
    for (const review of reviews) {
      if (
        !review.reviewed_id ||
        !review.question1_score ||
        !review.question2_score ||
        !review.question3_score ||
        review.question1_score < 1 || review.question1_score > 5 ||
        review.question2_score < 1 || review.question2_score > 5 ||
        review.question3_score < 1 || review.question3_score > 5
      ) {
        return NextResponse.json(
          { error: 'Invalid review data - all scores must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Insert all reviews
    for (const review of reviews) {
      await sql`
        INSERT INTO capstone_reviews (
          reviewer_id,
          reviewed_id,
          capstone_period_id,
          question1_score,
          question2_score,
          question3_score,
          comment
        ) VALUES (
          ${reviewer_id},
          ${review.reviewed_id},
          ${capstone_period_id},
          ${review.question1_score},
          ${review.question2_score},
          ${review.question3_score},
          ${review.comment || null}
        )
      `;
    }

    // Record submission
    await sql`
      INSERT INTO capstone_submissions (student_id, capstone_period_id)
      VALUES (${reviewer_id}, ${capstone_period_id})
    `;

    return NextResponse.json(
      { success: true, message: 'Capstone reviews submitted successfully' },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        }
      }
    );
  } catch (error: any) {
    console.error('Error submitting capstone reviews:', error);
    return NextResponse.json(
      { error: 'Failed to submit reviews', details: error.message },
      { status: 500 }
    );
  }
}