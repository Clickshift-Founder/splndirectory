import { sql } from '@vercel/postgres';

export { sql };

// Database Types
export interface Student {
  id: number;
  name: string;
  matric_number: string;
  group_id: number;
  created_at: Date;
}

export interface Group {
  id: number;
  name: string;
  created_at: Date;
}

export interface Review {
  id: number;
  reviewer_id: number;
  reviewed_id: number;
  question1_score: number;
  question2_score: number;
  created_at: Date;
}

export interface ReviewQuestion {
  id: number;
  question_number: number;
  question_text: string;
  max_score: number;
}
