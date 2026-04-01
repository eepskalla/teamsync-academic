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
