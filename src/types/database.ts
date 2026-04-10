import { Timestamp } from 'firebase/firestore';

export type UserRole = 'viewer' | 'planner' | 'admin' | 'admin_main' | 'admin_co';
export type TodoStatus = 'open' | 'in_progress' | 'done';
export type ClassName = string;
export type DashboardComponentKey = 'funding' | 'news' | 'todos' | 'events' | 'polls' | 'leaderboard' | 'cards';

export interface PlanningGroup {
  name: string;
  leader_user_id?: string | null;
  leader_name?: string | null;
  parent_name?: string | null;
  is_parent?: boolean;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  planning_groups: string[];
  led_groups: string[];
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
  onlineSince?: string | Timestamp | Date | null;
  lastSessionDurationSeconds?: number | null;
  booster_stats?: {
    last_reset: string; // ISO date string (YYYY-MM-DD)
    count: number;      // Open count for that day
    extra_available?: number;
    support_extra_available?: number;
    inventory?: Record<string, number>;
    extra_boosters_claimed?: boolean;
    total_opened?: number;
    total_cards?: number;
  } | null;
  trade_stats?: {
    daily_trades_count: number;
    last_trade_date: string | null; // ISO Date YYYY-MM-DD
  } | null;
  referral_code: string;
  referred_by: string | null;
  is_referral_claimed?: boolean;
  total_referrals?: number;
  total_referral_boosters?: number;
  shop_stats?: {
    month: string;
    counts: Record<string, number>;
  } | null;
  currencies?: {
    notepunkte: number; // NP balance, default 0
  };
  subscription?: {
    active: boolean;
    expiry_date?: string; // ISO string
    stripe_subscription_id?: string;
    renewal_count?: number;
  };
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  created_at: string | Timestamp | Date;
  updated_at?: string | Timestamp | Date | null;
  responded_at?: string | Timestamp | Date | null;
  responded_by?: string | null;
  friendship_id?: string | null;
}

export interface Friendship {
  id: string;
  members: string[];
  request_id: string;
  created_by: string;
  created_at: string | Timestamp | Date;
  accepted_at?: string | Timestamp | Date | null;
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
  description?: string;
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
  type: 'internal' | 'hub' | 'role';
  role_access?: UserRole | 'admin' | null;
  pinned?: boolean;
  parent_id?: string | null;
  media_url?: string | null;
  media_type?: 'image' | 'doc' | null;
}

export type AbiBotChatType = 'internal' | 'hub' | 'role' | 'system';

export interface AbiBotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string | Timestamp | Date | null;
}

export interface AbiBotAuditLog {
  id: string;
  request_id: string;
  user_id: string;
  chat_key: string;
  chat_type: AbiBotChatType;
  group_name: string;
  role_access?: string | null;
  status: 'success' | 'error' | 'rate_limited';
  prompt: string;
  response?: string | null;
  error?: string | null;
  latency_ms?: number;
  model?: string;
  rate_limit?: {
    max: number;
    remaining: number;
    reset_at: string;
  };
  created_at: string | Timestamp | Date;
}

export interface ReadStatus {
  userId: string;
  groupId: string;
  lastSeenAt: string | Timestamp | Date;
}

export type AttackEffect = 'none' | 'sleep' | 'poison' | 'stun' | 'heal' | 'pierce';

export interface TeacherAttack {
  name: string;
  damage?: number;
  description?: string;
  effect?: AttackEffect;
}

export type TeacherRarity = 'common' | 'rare' | 'epic' | 'mythic' | 'legendary' | 'iconic';

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
  leaderboard_adjustments?: Record<string, number>;
  expected_ticket_sales?: number;
  planning_groups?: PlanningGroup[];
  loot_teachers?: LootTeacher[];
  custom_popup_messages?: CustomPopupMessage[];
  rarity_limits?: Record<TeacherRarity, number>;
  maintenance?: {
    start: string | null;
    end?: string | null;
    active: boolean;
    message?: string;
  };
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

export interface ShopEarning {
  id: string;
  abi_share_eur: number;
  selected_course: string | null;
  month_key?: string;
  processed_at?: Timestamp | Date | string | null;
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
  assigned_to_group?: string | null;
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
  reactions?: { [emoji: string]: string[] };
  comment_count?: number;
  is_small_update?: boolean;
  is_ai_generated?: boolean;
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
  category?: string;
  importance?: number; // 1-10
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

export interface CardProposal {
  id: string;
  teacher_id: string;
  teacher_name: string;
  hp: number;
  description: string;
  attacks: TeacherAttack[];
  created_at: string;
  created_by: string;
  created_by_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  admin_note?: string;
  reward_claimed?: boolean;
  reward_packs_awarded?: number;
  usage_status?: 'unknown' | 'used' | 'not_used';
  edited_snapshot?: {
    teacher_name: string;
    hp: number;
    description: string;
    attacks: TeacherAttack[];
  };
  moderated_at?: string;
  moderated_by?: string;
  moderated_by_name?: string;
}

export interface NewsImage {
  url: string;
  path: string;
}

export interface RemovedCardInfo {
  teacherId: string;
  teacherName: string;
  rarity: TeacherRarity;
  variants: {
    [key in CardVariant]?: number;
  };
  totalRemoved: number;
  duplicateCount: number;
}

export interface CardRemovalNotification {
  id: string;
  userId: string;
  type: 'card_removal' | 'admin_action';
  title: string;
  message: string;
  timestamp: string;
  removedCards?: RemovedCardInfo[];
  boosterCompensation?: {
    amount: number;
    reason: string;
  };
  read: boolean;
}

export interface CustomPackQueueSlot {
  slotIndex: number;
  teacherId: string;
  variant?: CardVariant;
}

export interface CustomPackQueueEntry {
  id: string;
  packId?: string; // Optional: set specific packId for visuals
  createdAt?: string | Timestamp | Date;
  createdBy?: string | null;
  createdByName?: string | null;
  requestId?: string | null;
  presetId?: string | null;
  name?: string | null;
  totalPacks: number;
  remainingPacks: number;
  allowRandomFill?: boolean;
  slots: CustomPackQueueSlot[];
}
