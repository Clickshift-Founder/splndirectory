import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // Deactivate all periods
    await sql`
      UPDATE review_periods
      SET is_active = false
    `;

    return NextResponse.json({
      success: true,
      message: 'All periods deactivated',
    });
  } catch (error) {
    console.error('Error deactivating periods:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate periods' },
      { status: 500 }
    );
  }
}