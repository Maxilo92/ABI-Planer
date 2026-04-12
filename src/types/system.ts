export type FeatureStatus = 'disabled' | 'admins_only' | 'enabled';

export interface SystemFeatures {
  trading_status: FeatureStatus;
  combat_status: FeatureStatus;
  shop_status: FeatureStatus;
  news_status: FeatureStatus;
  calendar_status: FeatureStatus;
  todos_status: FeatureStatus;
  polls_status: FeatureStatus;
  sammelkarten_status: FeatureStatus;
  
  // Legacy support for older builds/components
  is_trading_enabled?: boolean;
  is_combat_enabled?: boolean;
  is_shop_enabled?: boolean;
  is_news_enabled?: boolean;
  is_calendar_enabled?: boolean;
  is_todos_enabled?: boolean;
  is_polls_enabled?: boolean;
  is_sammelkarten_enabled?: boolean;

  maintenance_mode: boolean;
  maintenance_message?: string;
  updated_at?: any;
}

export interface GlobalStats {
  online_users_count: number;
  total_users: number;
  total_cards_count: number;
  active_trades_count: number;
  completed_trades_count: number;
  rarity_distribution?: Record<string, number>;
}

export interface SystemAnalyticsTimelinePoint {
  date: string;
  label: string;
  active_users: number;
  unique_users: number;
  actions: number;
}

export interface SystemAnalyticsActionStat {
  action: string;
  count: number;
}

export interface SystemAnalyticsSectionStat {
  section: string;
  count: number;
}

export interface SystemAnalyticsOnlineUser {
  id: string;
  full_name: string | null;
  email: string | null;
  current_section: string | null;
  online_since: string | null;
  last_online: string | null;
  online_minutes: number;
  last_action: string | null;
  last_action_at: string | null;
}

export interface SystemAnalyticsRecentAction {
  id: string;
  timestamp: string;
  action: string;
  user_id: string;
  user_name: string | null;
  section: string;
  details: string;
}

export interface SystemAnalytics {
  window_days: number;
  generated_at: string;
  total_log_entries: number;
  current_online_users_count: number;
  current_online_users: SystemAnalyticsOnlineUser[];
  activity_timeline: SystemAnalyticsTimelinePoint[];
  top_actions: SystemAnalyticsActionStat[];
  section_usage: SystemAnalyticsSectionStat[];
  recent_actions: SystemAnalyticsRecentAction[];
  average_session_minutes: number;
}
