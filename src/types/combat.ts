import { Timestamp } from 'firebase/firestore';

export type CombatMode = 'ranked' | 'unranked' | 'pve' | 'pve_custom' | 'event';

export interface CombatStats {
  userId: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  totalMatches: number;
  placementMatchesDone: number; // 0-10
  isRanked: boolean; // true after 10 placements
  lastUsedDeckId?: string;
  updatedAt: Timestamp | Date;
}

export interface CombatEvent {
  id: string;
  title: string;
  description: string;
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  type: 'tournament' | 'event' | 'challenge';
  reward?: string;
  bannerUrl?: string;
  isActive: boolean;
}

export interface CombatHistoryMatch {
  id: string;
  mode: CombatMode;
  status: 'active' | 'finished' | 'waiting_for_opponent';
  winner: string | null;
  playerA_uid: string;
  playerB_uid: string;
  playerA?: {
    uid?: string;
    name?: string;
  };
  playerB?: {
    uid?: string;
    name?: string;
  };
  createdAt?: Timestamp | Date;
}
