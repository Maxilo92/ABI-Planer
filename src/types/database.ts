export type UserRole = 'viewer' | 'planner' | 'admin';
export type TodoStatus = 'open' | 'in_progress' | 'done';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  is_approved: boolean;
  created_at: string;
}

export interface Settings {
  id: number;
  ball_date: string;
  funding_goal: number;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  created_at: string;
  created_by: string;
}

export interface FinanceEntry {
  id: string;
  amount: number;
  description: string | null;
  entry_date: string;
  created_by: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  created_at: string;
  created_by: string;
}

export interface NewsEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
}

export interface Poll {
  id: string;
  question: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  options?: PollOption[];
  votes?: PollVote[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_id: string;
}
