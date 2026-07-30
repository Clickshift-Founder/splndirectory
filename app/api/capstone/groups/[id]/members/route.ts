// FILE: app/api/capstone/groups/[id]/members/route.ts
// Returns all members of a specific capstone group

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
        cg.id as capstone_group_id,
        cg.name as capstone_group_name
      FROM students s
      INNER JOIN capstone_memberships cm ON s.id = cm.student_id
      INNER JOIN capstone_groups cg ON cm.capstone_group_id = cg.id
      WHERE cg.id = ${params.id}
      ORDER BY s.name
    `;

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching capstone group members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group members' }, 
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