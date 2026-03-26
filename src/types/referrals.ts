export interface Referral {
  referrerId: string;
  referredId: string;
  timestamp: string;
  type: 'standard' | 'milestone';
  boostersAwarded: number;
}
