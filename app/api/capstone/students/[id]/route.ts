// FILE: app/api/capstone/students/[id]/route.ts
// Returns student info + their capstone group

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await sql`
      SELECT 
        s.id, 
        s.name, 
        s.matric_number, 
        s.phone_number,
        cm.capstone_group_id,
        cg.name as capstone_group_name
      FROM students s
      LEFT JOIN capstone_memberships cm ON s.id = cm.student_id
      LEFT JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
      WHERE s.id = ${params.id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' }, 
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          }
        }
      );
    }

    const student = result.rows[0];

    // Check if student has a capstone group assigned
    if (!student.capstone_group_id) {
      return NextResponse.json(
        { 
          error: 'not_assigned',
          message: 'You are not assigned to any capstone group. Please contact admin.',
          student: {
            id: student.id,
            name: student.name,
            matric_number: student.matric_number,
          }
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          }
        }
      );
    }

    return NextResponse.json(student, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching capstone student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        }
      }
    );
  }
}