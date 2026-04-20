'use client';

import React, { useMemo } from 'react';
import { Zap, Swords, Info, Sparkles, ShieldCheck } from 'lucide-react';
import { CardData, CardStyle } from '@/types/cards';
import { SupportCardConfig } from '@/types/registry';
import { RaritySymbol } from './RaritySymbol';
import { CardEffectOverlay } from './CardEffectOverlay';
import { cn } from '@/lib/utils';

interface SupportSpecCardProps {
  data: CardData;
  metadata: SupportCardConfig & { cardNumber: string; color: string };
  className?: string;
  styleVariant?: CardStyle;
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

export const SupportSpecCard = React.memo(({
  data,
  metadata,
  className,
  styleVariant = 'modern-flat',
  isCombat = false
}: SupportSpecCardProps) => {
  const variant = data?.variant || 'normal';
  const rarity = data?.rarity || 'common';
  
  const isBlckShiny = variant === 'black_shiny_holo';
  const isIconic = rarity === 'iconic';
  const isShiny = variant === 'shiny';
  const isGlass = variant === 'holo';
  const useLightText = isBlckShiny || isIconic || isGlass || isShiny;
  const radiusClass = "rounded-[var(--card-radius,1.2cqw)]";

  // Nutze Raritätsfarbe, wenn Standard-Blau oder keine Farbe vorhanden ist
  const cardColor = useMemo(() => {
    if (isBlckShiny || isIconic) return '#0a0a0a';
    if (!metadata?.color || metadata?.color === '#10b981') {
      return RARITY_COLORS[rarity] || metadata?.color || '#94a3b8';
    }
    return metadata?.color || '#94a3b8';
  }, [metadata?.color, rarity, isBlckShiny, isIconic]);

  const getStyleClasses = () => {
    return {
      card: cn(
        "transition-all",
        radiusClass,
        !isBlckShiny && !isShiny && !isIconic && "border-black shadow-[1.5cqw_1.5cqw_0px_0px_rgba(0,0,0,1)] border-[0.6cqw]",
        isIconic && "border-amber-500/60 shadow-[0_0_15px_rgba(251,191,36,0.4)] border-[1cqw]",
        isShiny && "shadow-[0_0_10px_rgba(255,255,255,0.4)] border-slate-300 border-[0.8cqw]",
        isBlckShiny && "shadow-[0_0_8cqw_rgba(147,51,234,0.5)] border-purple-500/50 border-[0.8cqw]"
      ),
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
  };

  const styleClasses = getStyleClasses();

  // Scaling Logic
  const level = data.level || 1;
  const scalingFactor = 1 + (level - 1) * 0.15;
  const currentDamage = metadata.attack.damage ? Math.round(metadata.attack.damage * scalingFactor) : 0;

  const AttackIcon = metadata.attack.effect === 'pierce' ? Swords : 
                     metadata.attack.effect === 'sleep' ? Sparkles :
                     metadata.attack.effect === 'heal' ? ShieldCheck : Zap;

  return (
    <div
      className={cn("relative aspect-[2.5/3.5] @container overflow-visible isolate", radiusClass, className)}
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

        <div className="relative z-30 h-full w-full p-[6%] flex flex-col space-y-[3%] min-h-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-[3%] w-full border-b-[0.4cqw] border-current pb-[1%]" style={{ color: useLightText ? 'white' : 'black' }}>
            <div className="flex min-w-0 flex-col flex-1">
              <h2
                className={cn(
                  "text-[6.5cqw] font-black uppercase tracking-tighter leading-[0.92] whitespace-normal break-words",
                  styleClasses.text
                )}
              >
                {metadata.name}
              </h2>
              <div className="flex items-center gap-[1cqw] mt-[0.4cqw]">
                <span className="inline-flex w-fit text-[2.6cqw] font-black bg-current/10 px-[1cqw] py-[0.2cqw] rounded-full uppercase tracking-widest opacity-80">
                  Level {level}
                </span>
                <span className="text-[2.2cqw] font-black uppercase opacity-40">Support</span>
              </div>
            </div>
          </div>

          {/* Art Area */}
          <div className="w-full aspect-[2/1] bg-black/5 rounded-[2.5%] flex items-center justify-center border-[0.3cqw] border-current/15 shrink-0 overflow-hidden" style={{ color: useLightText ? 'white' : 'black' }}>
             <AttackIcon className="w-[12cqw] h-[12cqw] opacity-30 animate-pulse" />
          </div>

          {/* Attack Section */}
          <div className="min-h-0 flex-1 space-y-[2%] pt-[1%]">
            <div className="flex flex-col border-b-[0.15cqw] border-current/10 pb-[2.5%]" style={{ color: useLightText ? 'white' : 'black' }}>
              <div className="flex min-w-0 items-start justify-between gap-[2%]">
                <div className="flex min-w-0 flex-1 items-start gap-[1.5%]">
                  <AttackIcon className="w-[4cqw] h-[4cqw] text-blue-500 mt-[0.2cqw]" />
                  <span className="min-w-0 whitespace-normal break-words text-[4.8cqw] font-black uppercase tracking-tight leading-[0.95]">
                    {metadata.attack.name}
                  </span>
                </div>
                <span className="shrink-0 text-[5.5cqw] font-black tracking-tighter leading-none">{currentDamage}</span>
              </div>
              <p className="text-[3.2cqw] leading-tight opacity-70 mt-[0.5%] whitespace-normal break-words">
                {metadata.attack.description}
              </p>
            </div>
          </div>

          {/* Footer Section */}
          <div className="space-y-[3%] mt-auto shrink-0 pt-[1%]">
            {metadata.description && (
              <div
                className={cn(
                  "rounded-[2.5%] p-[3.5%] border-[0.3cqw] border-current/20 italic shadow-inner",
                  useLightText ? "bg-black/30 text-white/90" : "bg-white/40 text-black/90"
                )}
              >
                <p className="text-[3.4cqw] leading-snug line-clamp-2 whitespace-normal break-words font-medium">
                  &quot;{metadata.description}&quot;
                </p>
              </div>
            )}

            <div className="flex justify-between items-end">
              <div className={styleClasses.numberTag}>
                {metadata.cardNumber}
              </div>
              <RaritySymbol
                rarity={rarity}
                variant={variant}
                size={0}
                className="w-[12cqw] h-[12cqw]"
                color={useLightText ? 'white' : 'black'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SupportSpecCard.displayName = 'SupportSpecCard';
