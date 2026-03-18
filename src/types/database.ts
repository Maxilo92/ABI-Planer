export type UserRole = 'viewer' | 'planner' | 'admin' | 'admin_main' | 'admin_co';
export type TodoStatus = 'open' | 'in_progress' | 'done';
export type ClassName = string;

export interface PlanningGroup {
  name: string;
  leader_user_id?: string | null;
  leader_name?: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  planning_group?: string | null;
  class_name?: string | null;
  timeout_until?: string | null;
  timeout_reason?: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Settings {
  id: number;
  ball_date: string;
  funding_goal: number;
  courses?: ClassName[];
  expected_ticket_sales?: number;
  planning_groups?: PlanningGroup[];
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  created_at: string;
  created_by: string;
  created_by_name?: string | null;
  assigned_to_user?: string | null;
  assigned_to_user_name?: string | null;
  assigned_to_class?: ClassName | null;
  assigned_to_group?: string | null;
  deadline_date?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  completed_by_name?: string | null;
}

export interface FinanceEntry {
  id: string;
  amount: number;
  description: string | null;
  responsible_class?: ClassName | null;
  responsible_user_name?: string | null;
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
  author_name?: string | null;
  image_url?: string | null;
  image_path?: string | null;
  image_size_bytes?: number | null;
  image_mime_type?: string | null;
  view_count?: number;
  viewed_by?: string[];
}

export interface Poll {
  id: string;
  question: string;
  is_active: boolean;
  allow_vote_change?: boolean;
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
