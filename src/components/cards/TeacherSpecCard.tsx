'use client';

import React, { useMemo } from 'react';
import { GraduationCap, Heart, Swords } from 'lucide-react';
import { CardData, CardStyle } from '@/types/cards';
import { RaritySymbol } from './RaritySymbol';
import { CardEffectOverlay } from './CardEffectOverlay';
import { cn } from '@/lib/utils';

import { TEACHERS_V1 } from '@/constants/sets/teachers_v1';

// Hilfsfunktion zum Finden des Index im Original-Array (Albumsnummer)
const getAlbumNumber = (id: string) => {
  const index = TEACHERS_V1.findIndex(t => t.id === id);
  if (index !== -1) return index + 1;
  // Fallback: Falls ID das fullId Format hat (setId:cardId)
  if (id.includes(':')) {
    const cardId = id.split(':')[1];
    const idx = TEACHERS_V1.findIndex(t => t.id === cardId);
    return idx !== -1 ? idx + 1 : '??';
  }
  return '??';
};

interface TeacherSpecCardProps {
  data: CardData;
  className?: string;
  styleVariant?: CardStyle;
  hideAttacks?: boolean;
  renderAttacks?: (scaledAttacks: any[]) => React.ReactNode;
  currentHp?: number; // Zeigt den aktuellen HP-Stand auf der Karte an
  isCombat?: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',    // slate-400
  rare: '#10b981',      // emerald-500
  epic: '#a855f7',      // purple-500
  mythic: '#ef4444',    // red-500
  legendary: '#f59e0b', // amber-500
  iconic: '#000000',    // black
};

export const TeacherSpecCard = React.memo(({ 
  data, 
  className, 
  styleVariant = 'modern-flat',
  hideAttacks = false,
  renderAttacks,
  currentHp,
  isCombat = false,
}: TeacherSpecCardProps) => {
  const isBlckShiny = data.variant === 'black_shiny_holo';
  const isIconic = data.rarity === 'iconic';
  const isShiny = data.variant === 'shiny';
  const isGlass = data.variant === 'holo';
  const useLightText = isBlckShiny || isIconic || isGlass || isShiny;
  const radiusClass = "rounded-[var(--card-radius,1.2cqw)]";

  // Nutze Raritätsfarbe, wenn Standard-Blau oder keine Farbe vorhanden ist
  const cardColor = useMemo(() => {
    if (isBlckShiny || isIconic) return '#0a0a0a';
    if (!data.color || data.color === '#3b82f6') {
      return RARITY_COLORS[data.rarity] || data.color || '#94a3b8';
    }
    return data.color;
  }, [data.color, data.rarity, isBlckShiny, isIconic]);

  const getStyleClasses = () => {
    switch (styleVariant) {
      case 'modern-flat':
        return {
          card: cn(
            "transition-all",
            radiusClass,
            !isBlckShiny && !isShiny && !isIconic && "border-black shadow-[1.5cqw_1.5cqw_0px_0px_rgba(0,0,0,1)] border-[0.6cqw]",
            isIconic && "border-amber-500/60 shadow-[0_0_15px_rgba(251,191,36,0.4)] border-[1cqw]",
            isShiny && "shadow-[0_0_10px_rgba(255,255,255,0.4)] border-slate-300 border-[0.8cqw]",
            isBlckShiny && "shadow-[0_0_8cqw_rgba(147,51,234,0.5)] border-purple-500/50 border-[0.8cqw]"
          ),
          header: useLightText ? (isShiny ? "text-slate-600" : "text-white") : "text-black",
          text: cn(
            "font-sans uppercase font-black tracking-tighter leading-[0.95]",
            isIconic ? "text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" :
            isBlckShiny ? "text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200" : 
            (isShiny ? "text-slate-800" : 
            (isGlass ? "text-white" : "text-black"))
          ),
          bgOverlay: (isBlckShiny || isIconic) ? "bg-black/40" : (isShiny ? "bg-white/30" : (isGlass ? "bg-transparent" : "bg-white/5")),
          numberTag: cn(
            "px-[1.5cqw] py-[0.5cqw] text-[3.2cqw] font-black rounded-[1.4cqw] border-[0.3cqw] border-black",
            useLightText ? "bg-white text-black" : "bg-black text-white"
          ),
        };
      
      default:
        return {
          card: cn("border-white/40 shadow-2xl backdrop-blur-xl border-[1.5cqw]", radiusClass),
          header: "text-white",
          text: "text-white font-sans font-black leading-[0.9]",
          bgOverlay: "bg-white/10",
          numberTag: "bg-white/20 text-white px-[1.5cqw] py-[0.5cqw] text-[2.5cqw] font-black rounded-full",
        };
    }
  };

  const styleClasses = getStyleClasses();

  // Scaling Logik
  const level = data.level || 1;
  const scalingFactor = 1 + (level - 1) * 0.1;
  
  // Zeige Schaden an, falls currentHp übergeben wurde
  const displayHp = currentHp !== undefined ? currentHp : (data.hp ? Math.round(data.hp * scalingFactor) : undefined);
  
  const scaledAttacks = data.attacks?.map(attack => ({
    ...attack,
    damage: attack.damage !== undefined ? Math.round(attack.damage * scalingFactor) : undefined
  }));

  return (
    <div
      className={cn("relative aspect-[2.5/3.5] @container overflow-hidden isolate", radiusClass, className)}
      style={{ containerType: 'inline-size' }}
    >
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center overflow-hidden transition-all duration-300",
          styleClasses.card
        )}
        style={{
          backgroundColor: cardColor,
        }}
      >
        <CardEffectOverlay variant={data.variant} tintColor={cardColor} isIconic={isIconic} isCombat={isCombat} forceVisible={isCombat} />
        <div className={cn("absolute inset-0 pointer-events-none", styleClasses.bgOverlay)} />

        <div className="relative z-30 h-full w-full p-[6%] flex flex-col space-y-[2%] min-h-0">
          <div className="flex items-start justify-between gap-[3%] w-full border-b-[0.4cqw] border-current pb-[1%]" style={{ color: useLightText ? 'white' : 'black' }}>
            <div className="flex min-w-0 flex-col flex-1">
              <h2
                className={cn(
                  "text-[6.5cqw] font-black uppercase tracking-tighter leading-[0.92] whitespace-normal break-words",
                  styleClasses.text
                )}
                style={{ textWrap: 'balance' }}
              >
                {data.name}
              </h2>
              <div className="flex items-center gap-[1cqw] mt-[0.4cqw]">
                <span className="inline-flex w-fit text-[2.6cqw] font-black bg-current/10 px-[1cqw] py-[0.2cqw] rounded-full uppercase tracking-widest opacity-80">
                  Level {level}
                </span>
              </div>
            </div>
            {displayHp !== undefined && (
              <div className="flex shrink-0 items-center gap-[1%] pt-[0.2cqw]">
                <span className="text-[2.8cqw] font-black uppercase opacity-60">HP</span>
                <span className={cn(
                  "text-[7.5cqw] font-black tracking-tighter leading-none transition-colors",
                  currentHp !== undefined && currentHp < (data.hp || 0) * 0.3 ? "text-red-500" : ""
                )}>{displayHp}</span>
              </div>
            )}
          </div>

          <div className="w-full aspect-[2.2/1] bg-black/5 rounded-[2.5%] flex items-center justify-center border-[0.3cqw] border-current/15 shrink-0" style={{ color: useLightText ? 'white' : 'black' }}>
            <GraduationCap className="w-[10cqw] h-[10cqw] opacity-25" />
          </div>

          <div className="min-h-0 flex-1 space-y-[2%] overflow-hidden pt-[0.5%]">
            {renderAttacks ? (
              renderAttacks(scaledAttacks || [])
            ) : (
              !hideAttacks && scaledAttacks?.slice(0, 2).map((attack, idx) => (
                <div key={idx} className="flex flex-col border-b-[0.15cqw] border-current/10 pb-[1.5%]" style={{ color: useLightText ? 'white' : 'black' }}>
                  <div className="flex min-w-0 items-start justify-between gap-[2%]">
                    <div className="flex min-w-0 flex-1 items-start gap-[1.5%]">
                      <Swords className="w-[3.5cqw] h-[3.5cqw] text-blue-500" />
                      <span className="min-w-0 whitespace-normal break-words text-[4.2cqw] font-black uppercase tracking-tight leading-[0.95]" style={{ textWrap: 'balance' }}>
                        {attack.name}
                      </span>
                    </div>
                    {attack.damage !== undefined && (
                      <span className="shrink-0 text-[4.8cqw] font-black tracking-tighter leading-none pt-[0.1cqw]">{attack.damage}</span>
                    )}
                  </div>
                  {attack.description && (
                    <p className="text-[2.8cqw] leading-tight opacity-70 line-clamp-1 mt-[0.2%] whitespace-normal break-words">
                      {attack.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="space-y-[2.5%] mt-auto shrink-0 pt-[0.5%]">
            {/* Flavor Text / Description: Nur anzeigen, wenn NICHT im Angriffs-Modus (renderAttacks) um Platz zu sparen */}
            {data.description && !renderAttacks && (
              <div
                className={cn(
                  "rounded-[2.5%] p-[3%] border-[0.3cqw] border-current/20 italic shadow-inner",
                  useLightText ? "bg-black/30 text-white/90" : "bg-white/40 text-black/90"
                )}
              >
                <p className="text-[3.2cqw] leading-snug line-clamp-3 whitespace-normal break-words">
                  &quot;{data.description}&quot;
                </p>
              </div>
            )}

            <div className="flex justify-between items-end">
              <div className={styleClasses.numberTag}>
                #{getAlbumNumber(data.id)}
              </div>
              <RaritySymbol
                rarity={data.rarity}
                variant={data.variant}
                size={0}
                className="w-[12cqw] h-[12cqw]"
                color={useLightText ? 'white' : (styleVariant === 'modern-flat' ? 'black' : 'white')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.className === nextProps.className &&
    prevProps.styleVariant === nextProps.styleVariant &&
    prevProps.data.id === nextProps.data.id &&
    prevProps.data.name === nextProps.data.name &&
    prevProps.data.hp === nextProps.data.hp &&
    prevProps.currentHp === nextProps.currentHp &&
    prevProps.data.level === nextProps.data.level &&
    prevProps.data.rarity === nextProps.data.rarity &&
    prevProps.data.variant === nextProps.data.variant &&
    prevProps.data.description === nextProps.data.description &&
    prevProps.data.cardNumber === nextProps.data.cardNumber &&
    prevProps.data.color === nextProps.data.color &&
    prevProps.hideAttacks === nextProps.hideAttacks &&
    prevProps.isCombat === nextProps.isCombat &&
    JSON.stringify(prevProps.data.attacks) === JSON.stringify(nextProps.data.attacks)
  );
});

TeacherSpecCard.displayName = 'TeacherSpecCard';
