import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface ReviewSubmission {
  reviewed_id: number;
  question1_score: number;
  question2_score: number;
}

interface SubmitPayload {
  reviewer_id: number;
  review_period_id: number;
  reviews: ReviewSubmission[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitPayload = await request.json();
    const { reviewer_id, review_period_id, reviews } = body;

    if (!reviewer_id || !review_period_id || !reviews || reviews.length === 0) {
      return NextResponse.json(
        { error: 'Invalid submission data' },
        { status: 400 }
      );
    }

    // Validate scores are within 1-5 range
    for (const review of reviews) {
      if (
        review.question1_score < 1 || review.question1_score > 5 ||
        review.question2_score < 1 || review.question2_score > 5
      ) {
        return NextResponse.json(
          { error: 'Scores must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Insert all reviews (upsert - update if exists for same period)
    for (const review of reviews) {
      await sql`
        INSERT INTO reviews (reviewer_id, reviewed_id, review_period_id, question1_score, question2_score)
        VALUES (
          ${reviewer_id},
          ${review.reviewed_id},
          ${review_period_id},
          ${review.question1_score},
          ${review.question2_score}
        )
        ON CONFLICT (reviewer_id, reviewed_id, review_period_id)
        DO UPDATE SET
          question1_score = ${review.question1_score},
          question2_score = ${review.question2_score},
          created_at = CURRENT_TIMESTAMP
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Reviews submitted successfully',
      count: reviews.length,
    });
  } catch (error) {
    console.error('Error submitting reviews:', error);
    return NextResponse.json(
      { error: 'Failed to submit reviews' },
      { status: 500 }
    );
  }
}