'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Sparkles, 
  Trophy,
  Share2,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CardRenderer } from './CardRenderer';
import { TeacherSpecCard } from './TeacherSpecCard';
import { SupportSpecCard } from './SupportSpecCard';
import { ShareResourceButton } from '@/components/ui/share-resource-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CardData, CardVariant as NewCardVariant } from '@/types/cards';
import { TeacherCatalogEntry } from '@/lib/cardCatalog';
import { getBestVariant, mapTeacherCatalogToCardData } from '@/modules/cards/cardData';

interface CardDetailViewProps {
  teacher: TeacherCatalogEntry;
  userData: any;
  onClose?: () => void;
  allCards?: any[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  isStandalone?: boolean;
}

const getNextLevelCount = (level: number): number => Math.pow(level, 2) + 1;
const getPrevLevelCount = (level: number): number => level <= 1 ? 0 : Math.pow(level - 1, 2) + 1;

const getVariantLabel = (variant: string) => {
  switch (variant) {
    case "normal": return "Normal";
    case "holo": return "Holo";
    case "shiny": return "Shiny";
    case "black_shiny_holo": return "Secret Rare";
    default: return variant;
  }
};

export function CardDetailView({
  teacher,
  userData,
  onClose,
  allCards = [],
  currentIndex = -1,
  onNavigate,
  isStandalone = false,
}: CardDetailViewProps) {
  const router = useRouter();
  const isOwned = !!userData;
  const level = userData?.level || 1;
  const count = userData?.count || 0;
  const [displayVariant, setDisplayVariant] = useState<NewCardVariant>(getBestVariant(userData?.variants));
  const [activeCard, setActiveCard] = useState<"visual" | "spec">("visual");
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    setDisplayVariant(getBestVariant(userData?.variants));
  }, [teacher.id, userData]);

  const cardData = useMemo(() => mapTeacherCatalogToCardData(teacher, userData, 0, displayVariant), [teacher, userData, displayVariant]);

  const ownedVariants = useMemo(() => {
    if (!userData?.variants) return ["normal"];
    return Object.keys(userData.variants).filter((v) => userData.variants[v] > 0);
  }, [userData]);

  const handleNext = () => {
    if (onNavigate && currentIndex < allCards.length - 1) {
      setDirection(1);
      onNavigate(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (onNavigate && currentIndex > 0) {
      setDirection(-1);
      onNavigate(currentIndex - 1);
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center space-y-6 w-full max-w-4xl mx-auto",
      isStandalone ? "py-4 sm:py-12" : "py-8 px-4"
    )}>
      {isStandalone && (
        <div className="w-full flex items-center justify-between mb-4 px-4">
          <Button variant="ghost" onClick={() => router.push('/album')} className="text-white/60 hover:text-white gap-2">
            <ArrowLeft className="w-4 h-4" /> Zurück zum Album
          </Button>
          <ShareResourceButton 
            resourcePath={`/album/karte/${teacher.fullId.includes(':') ? teacher.fullId.split(':')[1] : teacher.id}`}
            title={`${teacher.name} - Sammelkarte`}
            variant="outline"
            className="rounded-full bg-white/5 border-white/10 text-white"
          />
        </div>
      )}

      <div className="relative w-full max-w-[300px] sm:max-w-[360px] aspect-[2.5/3.5] mb-4 group">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={teacher.id}
            custom={direction}
            initial={{ x: direction > 0 ? 100 : direction < 0 ? -100 : 0, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: direction > 0 ? -100 : direction < 0 ? 100 : 0, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full h-full cursor-pointer"
            onClick={() => isOwned && setActiveCard(activeCard === "visual" ? "spec" : "visual")}
          >
            <div className="w-full h-full [perspective:1600px]">
              <motion.div
                className="relative w-full h-full preserve-3d"
                animate={{ rotateY: activeCard === "spec" ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="absolute inset-0 backface-hidden">
                  <CardRenderer data={cardData} isFlippedExternally={isOwned} isLocked={!isOwned} interactive={false} />
                </div>
                <div className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(180deg)" }}>
                  {teacher.type === 'support' ? (
                    <SupportSpecCard data={cardData} metadata={teacher as any} className="w-full h-auto" />
                  ) : (
                    <TeacherSpecCard data={cardData} className="w-full h-auto" />
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {onNavigate && (
          <>
            <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={currentIndex <= 0}
              className="absolute left-[-25%] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 disabled:opacity-0 transition-all max-sm:hidden">
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleNext(); }} disabled={currentIndex >= allCards.length - 1}
              className="absolute right-[-25%] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 disabled:opacity-0 transition-all max-sm:hidden">
              <ChevronRight className="h-8 w-8" />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-md px-4">
        <div className="flex gap-2">
          <button onClick={() => setActiveCard("visual")} className={cn("h-1.5 rounded-full transition-all", activeCard === "visual" ? "bg-white w-8" : "bg-white/20 w-4")} />
          {isOwned && <button onClick={() => setActiveCard("spec")} className={cn("h-1.5 rounded-full transition-all", activeCard === "spec" ? "bg-white w-8" : "bg-white/20 w-4")} />}
        </div>

        {!isOwned ? (
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 w-full text-center">
            <Lock className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h4 className="text-sm font-black uppercase text-white mb-2">Karte gesperrt</h4>
            <p className="text-xs text-white/60 italic">{teacher.obtainMessage || 'Sammle diese Karte aus Booster-Packs.'}</p>
          </div>
        ) : (
          <div className="grid gap-4 w-full">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-black uppercase text-white/40 mb-3 tracking-widest">Varianten</p>
              <div className="flex flex-wrap gap-2">
                {["normal", "holo", "shiny", "black_shiny_holo"].map((v) => {
                  const available = ownedVariants.includes(v);
                  return (
                    <button key={v} disabled={!available} onClick={() => setDisplayVariant(v as any)}
                      className={cn("px-3 py-2 rounded-lg text-[10px] font-black uppercase border-2 transition-all",
                        available ? (displayVariant === v ? "bg-white text-black border-white" : "bg-white/5 text-white/60 border-white/10") : "opacity-20 grayscale")}>
                      {getVariantLabel(v)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">Fortschritt</span>
                <Badge variant="outline" className="text-[10px] text-white/70 border-white/20">{count}x gesammelt</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-white/60">
                  <span>Level {level}</span>
                  <span>{count} / {getNextLevelCount(level)}</span>
                </div>
                <Progress value={((count - getPrevLevelCount(level)) / (getNextLevelCount(level) - getPrevLevelCount(level))) * 100} className="h-1.5 bg-white/10" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
