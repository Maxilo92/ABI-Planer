export type DangerActionStatus = 'pending' | 'completed' | 'failed';

export interface DangerLog {
  id: string;
  action_type: string;
  description: string;
  triggered_by: string; // admin UID
  triggered_by_name: string;
  status: DangerActionStatus;
  error?: string | null;
  executed_at: string;
  payload?: any;
}
