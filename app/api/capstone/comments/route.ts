// FILE: app/api/capstone/comments/route.ts
// Admin endpoint for viewing all comments/observations

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('group_id');
    const studentId = searchParams.get('student_id');

    let result;

    if (studentId) {
      // Comments about a specific student
      result = await sql`
        SELECT 
          cr.id,
          cr.comment,
          cr.created_at,
          reviewer.name as reviewer_name,
          reviewer.matric_number as reviewer_matric,
          reviewed.name as reviewed_name,
          reviewed.matric_number as reviewed_matric,
          cg.name as capstone_group_name
        FROM capstone_reviews cr
        JOIN students reviewer ON cr.reviewer_id = reviewer.id
        JOIN students reviewed ON cr.reviewed_id = reviewed.id
        JOIN capstone_memberships cm ON reviewed.id = cm.student_id
        JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
        WHERE cr.reviewed_id = ${studentId}
          AND cr.comment IS NOT NULL
          AND cr.comment != ''
        ORDER BY cr.created_at DESC
      `;
    } else if (groupId && groupId !== 'all') {
      // All comments in a group
      result = await sql`
        SELECT 
          cr.id,
          cr.comment,
          cr.created_at,
          reviewer.name as reviewer_name,
          reviewer.matric_number as reviewer_matric,
          reviewed.name as reviewed_name,
          reviewed.matric_number as reviewed_matric,
          cg.name as capstone_group_name
        FROM capstone_reviews cr
        JOIN students reviewer ON cr.reviewer_id = reviewer.id
        JOIN students reviewed ON cr.reviewed_id = reviewed.id
        JOIN capstone_memberships cm ON reviewed.id = cm.student_id
        JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
        WHERE cg.id = ${groupId}
          AND cr.comment IS NOT NULL
          AND cr.comment != ''
        ORDER BY cg.name, reviewed.name, cr.created_at DESC
      `;
    } else {
      // All comments across all groups
      result = await sql`
        SELECT 
          cr.id,
          cr.comment,
          cr.created_at,
          reviewer.name as reviewer_name,
          reviewer.matric_number as reviewer_matric,
          reviewed.name as reviewed_name,
          reviewed.matric_number as reviewed_matric,
          cg.name as capstone_group_name
        FROM capstone_reviews cr
        JOIN students reviewer ON cr.reviewer_id = reviewer.id
        JOIN students reviewed ON cr.reviewed_id = reviewed.id
        JOIN capstone_memberships cm ON reviewed.id = cm.student_id
        JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
        WHERE cr.comment IS NOT NULL
          AND cr.comment != ''
        ORDER BY cg.name, reviewed.name, cr.created_at DESC
      `;
    }

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error fetching capstone comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.message },
      { status: 500 }
    );
  }
}