// FILE: app/api/capstone/groups/route.ts
// Returns all capstone groups (for admin dropdown)

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        cg.id,
        cg.name,
        COUNT(cm.id) as member_count
      FROM capstone_groups cg
      LEFT JOIN capstone_memberships cm ON cg.id = cm.capstone_group_id
      GROUP BY cg.id, cg.name
      ORDER BY cg.name
    `;

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching capstone groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capstone groups' },
      { status: 500 }
    );
  }
}