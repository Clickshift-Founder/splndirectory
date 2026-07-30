// FILE: app/api/auth/login-capstone/route.ts
// Capstone-specific login endpoint

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Find student
    const studentResult = await sql`
      SELECT id, name, matric_number
      FROM students
      WHERE UPPER(TRIM(matric_number)) = UPPER(TRIM(${matric_number}))
    `;

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid matric number. Please check and try again.' },
        { status: 404 }
      );
    }

    const student = studentResult.rows[0];

    // Check if student is assigned to a capstone group
    const membershipResult = await sql`
      SELECT cm.capstone_group_id, cg.name as capstone_group_name
      FROM capstone_memberships cm
      JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
      WHERE cm.student_id = ${student.id}
    `;

    if (membershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'You are not assigned to any capstone group. Please contact admin.' },
        { status: 400 }
      );
    }

    // Check if capstone period is active
    const periodResult = await sql`
      SELECT id, period_name, is_active
      FROM capstone_periods
      WHERE is_active = TRUE
      ORDER BY id DESC LIMIT 1
    `;

    if (periodResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Capstone rating is not currently open. Please check with admin.' },
        { status: 400 }
      );
    }

    const period = periodResult.rows[0];

    // Check if already submitted
    const submissionResult = await sql`
      SELECT id FROM capstone_submissions
      WHERE student_id = ${student.id}
        AND capstone_period_id = ${period.id}
    `;

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        matric_number: student.matric_number,
      },
      period_name: period.period_name,
      already_submitted: submissionResult.rows.length > 0,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      }
    });
  } catch (error: any) {
    console.error('Capstone login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.', details: error.message },
      { status: 500 }
    );
  }
}