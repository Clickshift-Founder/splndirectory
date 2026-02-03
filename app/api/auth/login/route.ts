import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { matric_number } = await request.json();

    if (!matric_number) {
      return NextResponse.json(
        { error: 'Matric number is required' },
        { status: 400 }
      );
    }

    // Find student by matric number
    const studentResult = await sql`
      SELECT id, name, email, matric_number, group_id
      FROM students
      WHERE matric_number = ${matric_number}
    `;

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid matric number. Please check and try again.' },
        { status: 404 }
      );
    }

    const student = studentResult.rows[0];

    // Get active review period
    const periodResult = await sql`
      SELECT id, period_name
      FROM review_periods
      WHERE is_active = true
      LIMIT 1
    `;

    if (periodResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No active review period. Please contact your administrator.' },
        { status: 400 }
      );
    }

    const period = periodResult.rows[0];

    // Check if student has already submitted for this period
    const submissionCheck = await sql`
      SELECT id
      FROM review_submissions
      WHERE student_id = ${student.id} AND review_period_id = ${period.id}
    `;

    const alreadySubmitted = submissionCheck.rows.length > 0;

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        matric_number: student.matric_number,
        group_id: student.group_id,
      },
      period_name: period.period_name,
      already_submitted: alreadySubmitted,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}