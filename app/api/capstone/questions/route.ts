// FILE: app/api/capstone/questions/route.ts
// Returns the 4 capstone questions

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, question_number, question_text, max_score, is_comment
      FROM capstone_questions
      ORDER BY question_number
    `;

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching capstone questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}