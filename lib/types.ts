export type UserRole = 'player' | 'coordinator' | 'coach';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  team_id: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  institution: string;
  sport: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface CanvasToken {
  id: string;
  user_id: string;
  canvas_base_url: string;
  encrypted_token: string;
  canvas_user_id: number | null;
  canvas_user_name: string | null;
  connected_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  canvas_course_id: number;
  name: string;
  course_code: string | null;
  term: string | null;
  synced_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  course_id: string;
  canvas_assignment_id: number;
  name: string;
  due_at: string | null;
  points_possible: number | null;
  submission_status: string | null;
  assignment_type: string | null;
  synced_at: string;
}
