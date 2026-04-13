import { Rarity, CardVariant } from './cards';

export type TradeStatus = 'pending' | 'countered' | 'accepted' | 'declined' | 'cancelled' | 'completed' | 'expired';

export interface CardSelection {
  teacherId: string;
  variant: CardVariant;
  rarity: Rarity;
  name?: string; // Optional for UI display
}

export interface CardTrade {
  id: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  receiverName?: string;
  status: TradeStatus;
  offeredCard: CardSelection;
  requestedCard: CardSelection;
  roundCount: number; // 0: initial, 1: counter, 2: final action
  lastActorId: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
}

export interface TradeNotification {
  tradeId: string;
  type: 'new_offer' | 'counter_offer' | 'trade_accepted' | 'trade_declined';
  senderName: string;
}
