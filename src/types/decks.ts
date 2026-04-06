import { Timestamp } from 'firebase/firestore';

export interface UserDeck {
  id: string;
  userId: string;
  title: string;
  cardIds: string[]; // Exactly 10 unique card IDs
  coverCardId: string; // Must be one of the cardIds
  createdAt: Timestamp;
  isActive: boolean;
}
