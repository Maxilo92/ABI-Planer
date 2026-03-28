import { Timestamp } from 'firebase/firestore';

export type UserRole = 'viewer' | 'planner' | 'admin' | 'admin_main' | 'admin_co';
export type TodoStatus = 'open' | 'in_progress' | 'done';
export type ClassName = string;
export type DashboardComponentKey = 'funding' | 'news' | 'todos' | 'events' | 'polls' | 'leaderboard' | 'cards';

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
  is_group_leader?: boolean | null;
  easter_egg_unlocked?: boolean;
  is_2fa_enabled?: boolean;
  two_factor_secret_id?: string | null;
  legal_consents?: {
    is_at_least_16: boolean;
    terms_accepted: boolean;
    terms_version: string;
    privacy_accepted: boolean;
    privacy_version: string;
    accepted_at: string;
  };
  created_at: string;
  last_visited?: Record<string, string> | null;
  isOnline: boolean;
  lastOnline: Timestamp | Date;
  rated_teachers?: string[]; // Array of teacher IDs already voted on
  booster_stats?: {
    last_reset: string; // ISO date string (YYYY-MM-DD)
    count: number;      // Open count for that day
    extra_available?: number;
    extra_boosters_claimed?: boolean;
    total_opened?: number;
  } | null;
  referral_code: string;
  referred_by: string | null;
  shop_stats?: {
    month: string;
    counts: Record<string, number>;
  } | null;
}

export interface UserSecret {
  id: string;
  secret: string;
  backup_codes: string[];
  created_at: string;
}

export interface DelayedAction {
  id: string;
  actionType: string;
  description: string;
  payload: any;
  createdAt: string;
  executableAt: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  error?: string;
  triggeredBy: string; // admin UID
  triggeredByName: string;
  completedAt?: string | Timestamp | Date;
}

export interface Teacher {
  id: string;
  name: string;
  avg_rating: number; // 0.0 to 1.0
  vote_count: number;
  description?: string;
}

export interface TeacherRating {
  userId: string;
  teacherId: string;
  rating: number; // 0.0, 0.25, 0.5, 0.75, 1.0
  created_at: string;
  created_by_name?: string | null;
}

export interface GroupMessage {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  author_name: string;
  author_group?: string | null;
  target_group?: string | null;
  group_name: string | 'hub';
  type: 'internal' | 'hub';
  pinned?: boolean;
}

export interface TeacherAttack {
  name: string;
  damage?: number;
  description?: string;
}

export type TeacherRarity = 'common' | 'rare' | 'epic' | 'mythic' | 'legendary';

export interface LootTeacher {
  id: string;
  name: string;
  rarity: TeacherRarity;
  description?: string;
  hp?: number;
  attacks?: TeacherAttack[];
}

export interface CustomPopupMessage {
  id: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  dismissLabel?: string;
  chance?: number;
  enabled?: boolean;
  routes?: string[];
}

export interface Settings {
  id: number;
  ball_date: string;
  funding_goal: number;
  courses?: ClassName[];
  expected_ticket_sales?: number;
  planning_groups?: PlanningGroup[];
  loot_teachers?: LootTeacher[];
  custom_popup_messages?: CustomPopupMessage[];
  rarity_limits?: Record<TeacherRarity, number>;
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
  parentId?: string | null;
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
  location: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  created_by: string;
  created_by_name?: string | null;
  mentioned_user_ids?: string[];
  mentioned_roles?: string[];
  mentioned_groups?: string[];
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
  ratings?: { [uid: string]: 'up' | 'down' };
  comment_count?: number;
  is_small_update?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  author_name: string;
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
  image_url?: string;
  is_anonymous: boolean;
  is_private: boolean;
}

export type CardVariant = 'normal' | 'holo' | 'shiny' | 'black_shiny_holo';

export interface UserTeacher {
  [teacherId: string]: {
    count: number;
    level: number;
    variants?: {
      [key in CardVariant]?: number;
    };
  };
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

export interface NewsImage {
  url: string;
  path: string;
}
