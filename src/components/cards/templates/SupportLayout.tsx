'use client';

import React from 'react';
import { Zap, Swords, Sparkles, ShieldCheck } from 'lucide-react';
import { CardData, CardStyle } from '@/types/cards';
import { SupportCardConfig } from '@/types/registry';
import { RaritySymbol } from '../RaritySymbol';
import { CardEffectOverlay } from '../CardEffectOverlay';
import { cn } from '@/lib/utils';

interface SupportLayoutProps {
  data: CardData;
  metadata: SupportCardConfig & { cardNumber: string; color: string };
  className?: string;
  styleVariant?: CardStyle;
}

export const SupportLayout: React.FC<SupportLayoutProps> = ({
  data,
  metadata,
  className,
  styleVariant = 'modern-premium'
}) => {
  const isIconic = data.rarity === 'iconic';
  const isBlckShiny = data.variant === 'black_shiny_holo';
  
  const getStyleClasses = () => {
    return {
      card: cn(
        "border-white/20 shadow-2xl backdrop-blur-xl border-[1.5cqw] rounded-xl",
        isIconic && "border-amber-500/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]",
        isBlckShiny && "border-purple-500/40 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
      ),
      iconWrapper: "relative bg-gradient-to-b from-white/20 to-transparent rounded-full w-[40cqw] h-[40cqw] flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-700",
      headerIcon: "w-[22cqw] h-[22cqw] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]",
      nameText: "text-white font-sans font-black text-[9.5cqw] leading-[0.85] uppercase tracking-tighter drop-shadow-2xl text-center px-[4%]",
      bgOverlay: "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12)_0%,transparent_75%)]",
      numberTag: "bg-black/40 text-white/60 px-[2cqw] py-[0.5cqw] text-[2.8cqw] font-bold rounded-md border border-white/5",
    };
  };

  const styleClasses = getStyleClasses();
  
  const AttackIcon = metadata.attack.effect === 'pierce' ? Swords : 
                     metadata.attack.effect === 'sleep' ? Sparkles :
                     metadata.attack.effect === 'heal' ? ShieldCheck : Zap;

  return (
    <div
      className={cn(
        "absolute inset-0 p-[7%] flex flex-col items-center justify-between overflow-hidden transition-all duration-300 rounded-[inherit] group",
        styleClasses.card,
        className
      )}
      style={{
        backgroundColor: isBlckShiny ? '#0a0a0a' : metadata.color,
      }}
    >
      <CardEffectOverlay variant={data.variant} tintColor={metadata.color} isIconic={isIconic} />
      <div className={cn("absolute inset-0 pointer-events-none", styleClasses.bgOverlay)} />

      {/* Top Decor */}
      <div className="w-full flex justify-between items-start z-30">
        <div className="bg-white/10 backdrop-blur-md text-white/80 px-[2cqw] py-[0.5cqw] rounded-md border border-white/10">
          <span className="text-[2.5cqw] font-black uppercase tracking-widest">LVL {data.level || 1}</span>
        </div>
        <div className={styleClasses.numberTag}>
          {metadata.cardNumber}
        </div>
      </div>

      {/* Main Art / Icon Area */}
      <div className="relative z-30 flex-1 flex items-center justify-center w-full">
        <div className={styleClasses.iconWrapper}>
          <AttackIcon className={cn("text-white/90", styleClasses.headerIcon)} />
          <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl animate-pulse opacity-50" />
        </div>
      </div>

      {/* Name Section - Minimalistic & Bold */}
      <div className="relative z-30 w-full flex flex-col items-center mb-[8%]">
        <h2 className={styleClasses.nameText}>
          {metadata.name}
        </h2>
        <div className="h-[0.8cqw] w-[15cqw] bg-white/20 rounded-full mt-[3%]" />
      </div>

      {/* Footer info */}
      <div className="w-full flex justify-between items-center z-30 px-[2%]">
        <div className="bg-black/40 backdrop-blur-md text-white/50 px-[3cqw] py-[0.8cqw] text-[2.8cqw] font-black uppercase tracking-[0.3em] rounded-lg border border-white/10">
          SUPPORT
        </div>
        <RaritySymbol
          rarity={metadata.rarity}
          variant={data.variant}
          size={0}
          className="w-[12cqw] h-[12cqw]"
          color="white"
        />
      </div>
    </div>
  );
};
