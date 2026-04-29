'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { TeacherRarity } from '@/types/cards';

// @ts-ignore
import DefaultTeacherImage from '../../../CardMockUp/teacher_pictures/business-man-illustration-ai-generative-png.webp';

interface ManagerContextType {
  drafts: any[];
  approvedCards: any[];
  loading: boolean;
  saving: boolean;
  setSaving: (v: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  activeDraftId: string | null;
  setActiveDraftId: (id: string | null) => void;
  boosterCount: number;
  setBoosterCount: (v: number) => void;
  cardsPerBooster: number;
  setCardsPerBooster: (v: number) => void;
  godpackCount: number;
  setGodpackCount: (v: number) => void;
  rarityQuotas: any;
  setRarityQuotas: (v: any) => void;
  variantQuotas: any;
  setVariantQuotas: (v: any) => void;
  printStats: any;
  setPrintStats: (v: any) => void;
  calculating: boolean;
  setCalculating: (v: boolean) => void;
  nextAvailableNumber: string;
  singlePrintCardId: string | null;
  setSinglePrintCardId: (id: string | null) => void;
  printQueue: { id: string; variant: string; size: 'full' | 'original' }[];
  setPrintQueue: (queue: { id: string; variant: string; size: 'full' | 'original' }[]) => void;
  currentPrint: { id: string; variant: string; size: 'full' | 'original' } | null;
  setCurrentPrint: (print: { id: string; variant: string; size: 'full' | 'original' } | null) => void;
  reorderCardsByRarity: () => Promise<void>;
}

const DEFAULT_RARITY_QUOTAS = { common: 60, rare: 20, epic: 10, mythic: 6, legendary: 3, iconic: 1 };
const DEFAULT_VARIANT_QUOTAS = { normal: 90, selten: 8, holo: 2 };

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export function SammelkartenManagerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [approvedCards, setApprovedCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [printStats, setPrintStats] = useState<any>(null);
  const [singlePrintCardId, setSinglePrintCardId] = useState<string | null>(null);
  const [printQueue, setPrintQueue] = useState<{ id: string; variant: string; size: 'full' | 'original' }[]>([]);
  const [currentPrint, setCurrentPrint] = useState<{ id: string; variant: string; size: 'full' | 'original' } | null>(null);

  const [nextAvailableNumber, setNextAvailableNumber] = useState('001');

  // Editor State
  const [formData, setFormData] = useState({
    title: 'Herr',
    firstName: '',
    lastName: '',
    cardNumber: '001',
    subjects: '',
    rarity: 'common' as TeacherRarity,
    imageUrl: typeof DefaultTeacherImage === 'string' ? DefaultTeacherImage : DefaultTeacherImage.src,
    imageScale: 1,
    imageX: 0,
    imageY: 0,
    imageRotate: 0,
    quote: '',
    punctuality: '',
    difficulty: 5,
    funFact: '',
    unpopularSubject: '',
    leisure: '',
  });

  // Logistik State
  const [boosterCount, setBoosterCount] = useState(500);
  const [cardsPerBooster, setCardsPerBooster] = useState(5);
  const [godpackCount, setGodpackCount] = useState(2);
  const [rarityQuotas, setRarityQuotas] = useState(DEFAULT_RARITY_QUOTAS);
  const [variantQuotas, setVariantQuotas] = useState(DEFAULT_VARIANT_QUOTAS);

  useEffect(() => {
    if (!user) return;
    const qDrafts = query(collection(db, 'teacher_card_drafts'), orderBy('created_at', 'desc'));
    const unsubDrafts = onSnapshot(qDrafts, (snap) => {
      setDrafts(snap.docs.map(d => ({ dbId: d.id, ...d.data() })));
    });
    const qApproved = query(collection(db, 'custom_card_designs'), orderBy('data.cardNumber', 'asc'));
    const unsubApproved = onSnapshot(qApproved, (snap) => {
      const cards = snap.docs.map(d => ({ dbId: d.id, ...d.data() }));
      setApprovedCards(cards);
      
      // Calculate next available number
      if (cards.length > 0) {
        const nums = cards.map((c: any) => {
          const raw = c.data?.cardNumber;
          if (!raw) return 0;
          const match = raw.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        });
        const maxNum = Math.max(0, ...nums);
        const next = (maxNum + 1).toString().padStart(3, '0');
        setNextAvailableNumber(next);
      } else {
        setNextAvailableNumber('001');
      }
      
      setLoading(false);
    });
    return () => { unsubDrafts(); unsubApproved(); };
  }, [user]);

  const reorderCardsByRarity = async () => {
    if (approvedCards.length === 0) return;
    
    const rarityOrder: TeacherRarity[] = ['iconic', 'legendary', 'mythic', 'epic', 'rare', 'common'];
    
    // Sort logic
    const sorted = [...approvedCards].sort((a, b) => {
      const aRarityIdx = rarityOrder.indexOf(a.data?.rarity || 'common');
      const bRarityIdx = rarityOrder.indexOf(b.data?.rarity || 'common');
      
      if (aRarityIdx !== bRarityIdx) {
        return aRarityIdx - bRarityIdx;
      }
      
      // Secondary sort: last name
      const aName = a.details?.lastName || '';
      const bName = b.details?.lastName || '';
      return aName.localeCompare(bName);
    });

    setSaving(true);
    try {
      // We do this in sequence or chunks to avoid overwhelming Firestore
      for (let i = 0; i < sorted.length; i++) {
        const newNumber = (i + 1).toString().padStart(3, '0');
        if (sorted[i].data.cardNumber !== newNumber) {
          const cardRef = doc(db, 'custom_card_designs', sorted[i].dbId);
          await updateDoc(cardRef, {
            'data.cardNumber': newNumber
          });
        }
      }
    } catch (err) {
      console.error('Error reordering cards:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagerContext.Provider value={{
      drafts, approvedCards, loading, saving, setSaving, formData, setFormData, 
      activeDraftId, setActiveDraftId, boosterCount, setBoosterCount, cardsPerBooster, setCardsPerBooster,
      godpackCount, setGodpackCount, rarityQuotas, setRarityQuotas, variantQuotas, setVariantQuotas,
      printStats, setPrintStats, calculating, setCalculating,
      nextAvailableNumber, singlePrintCardId, setSinglePrintCardId,
      printQueue, setPrintQueue, currentPrint, setCurrentPrint,
      reorderCardsByRarity
    }}>
      {children}
    </ManagerContext.Provider>
  );
}

export function useManager() {
  const context = useContext(ManagerContext);
  if (!context) throw new Error('useManager must be used within SammelkartenManagerProvider');
  return context;
}
