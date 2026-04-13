import { Timestamp } from 'firebase-admin/firestore';

export type TradeStatus = 'pending' | 'countered' | 'accepted' | 'declined' | 'cancelled' | 'completed' | 'expired';

export type CardVariant = 'normal' | 'holo' | 'shiny' | 'black_shiny_holo';
export type TeacherRarity = 'common' | 'rare' | 'epic' | 'mythic' | 'legendary' | 'iconic';

export interface CardSelection {
  teacherId: string;
  variant: CardVariant;
  rarity: TeacherRarity;
  name?: string;
}

export interface CardTrade {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  status: TradeStatus;
  offeredCard: CardSelection;
  requestedCard: CardSelection;
  roundCount: number;
  lastActorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
}
