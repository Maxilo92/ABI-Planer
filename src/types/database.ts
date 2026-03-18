export type UserRole = 'viewer' | 'planner' | 'admin_co' | 'admin_main' | 'admin';
export type TodoStatus = 'open' | 'in_progress' | 'done';
export type ClassName = string;
export type PlanningGroup = 'Finanzen' | 'Location & Catering' | 'Programm & DJ' | 'Deko & Motto' | 'IT & Kommunikation';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  is_approved: boolean;
  class_name: ClassName | null;
  planning_group: PlanningGroup | null;
  total_contributions: number;
  created_at: string;
}

export interface Settings {
  id: number;
  ball_date: string;
  funding_goal: number;
  courses?: string[];
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  assigned_to_user?: string;
  assigned_to_user_name?: string;
  assigned_to_class?: string;
}

export interface FinanceEntry {
  id: string;
  amount: number;
  description: string | null;
  entry_date: string;
  created_by: string;
  responsible_class?: ClassName;
  responsible_user_name?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
}

export interface NewsEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  author_name?: string;
  view_count: number;
  viewed_by?: string[];
}

export interface Poll {
  id: string;
  question: string;
  is_active: boolean;
  is_anonymous: boolean;
  created_at: string;
  created_by: string;
  created_by_name?: string;
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
  user_name?: string;
  option_id: string;
  created_at: string;
}

export type FeedbackType = 'bug' | 'feature' | 'other';
export type FeedbackStatus = 'new' | 'in_progress' | 'implemented' | 'rejected';

export interface Feedback {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  status: FeedbackStatus;
  created_at: string;
  created_by: string;
  created_by_name?: string;
}
