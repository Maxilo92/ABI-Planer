'use client';

import React from 'react';
import { Zap, Scroll, Info } from 'lucide-react';
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
  const isShiny = data.variant === 'shiny';
  const isGlass = data.variant === 'holo';

  const getStyleClasses = () => {
    switch (styleVariant) {
      case 'modern-premium':
        return {
          card: cn(
            "border-white/20 shadow-2xl backdrop-blur-xl border-[1.5cqw] rounded-xl",
            isIconic && "border-amber-500/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]",
            isBlckShiny && "border-purple-500/40 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
          ),
          iconWrapper: "bg-white/10 rounded-2xl w-[30cqw] h-[30cqw] flex items-center justify-center border border-white/10 rotate-3 shadow-lg",
          headerIcon: "w-[15cqw] h-[15cqw]",
          header: "text-white",
          nameText: "text-white font-sans font-black text-[9cqw] leading-[0.9] uppercase tracking-tight",
          effectBox: "bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-[4%] mt-[4%] w-full",
          effectText: "text-white/90 font-medium text-[3.5cqw] leading-tight",
          flavorText: "text-white/50 italic text-[2.8cqw] mt-[2%] leading-tight",
          bgOverlay: "bg-gradient-to-br from-white/10 to-transparent",
          numberTag: "bg-white/10 text-white/70 px-[2cqw] py-[0.5cqw] text-[2.8cqw] font-bold rounded-md border border-white/5",
          numberPos: "top-[6cqw] right-[6cqw]",
          rarityPos: "bottom-[6cqw] right-[6cqw]",
        };
      
      case 'soft-glass':
      default:
        return {
          card: "border-white/40 shadow-xl backdrop-blur-md border-[1cqw] rounded-xl",
          iconWrapper: "bg-white/20 rounded-full w-[28cqw] h-[28cqw] flex items-center justify-center",
          headerIcon: "w-[14cqw] h-[14cqw]",
          header: "text-white",
          nameText: "text-white font-sans font-black text-[10cqw] leading-[0.9]",
          effectBox: "bg-white/10 rounded-lg p-[3%] mt-[3%] w-full",
          effectText: "text-white font-medium text-[3.2cqw]",
          flavorText: "text-white/60 italic text-[2.5cqw] mt-[1%]",
          bgOverlay: "bg-white/5",
          numberTag: "bg-white/20 text-white px-[2cqw] py-[0.5cqw] text-[3cqw] font-black rounded-full",
          numberPos: "top-[8cqw] right-[8cqw]",
          rarityPos: "bottom-[8cqw] right-[8cqw]",
        };
    }
  };

  const styleClasses = getStyleClasses();
  const Icon = metadata.effectId?.includes('boost') ? Zap : Scroll;

  // Scaling logic for support cards
  const level = data.level || 1;
  const scalingFactor = 1 + (level - 1) * 0.1;
  const currentMultiplier = metadata.baseMultiplier 
    ? Math.round(metadata.baseMultiplier * scalingFactor * 10) / 10 
    : undefined;

  return (
    <div
      className={cn(
        "absolute inset-0 p-[7%] flex flex-col items-center overflow-hidden transition-all duration-300 rounded-[inherit]",
        styleClasses.card,
        className
      )}
      style={{
        backgroundColor: isBlckShiny ? '#0a0a0a' : metadata.color,
      }}
    >
      <CardEffectOverlay variant={data.variant} tintColor={metadata.color} isIconic={isIconic} />
      <div className={cn("absolute inset-0 pointer-events-none", styleClasses.bgOverlay)} />

      <div className="absolute top-[4%] left-[4%] z-50">
        <div className="bg-black/40 backdrop-blur-md text-white/80 px-[2.5cqw] py-[0.8cqw] rounded-lg flex items-center gap-[1cqw] border border-white/10">
          <span className="text-[2.8cqw] font-black uppercase tracking-widest">LVL {level}</span>
        </div>
      </div>

      <div className={cn("relative z-30 mb-[6%] mt-[2%]", styleClasses.iconWrapper)}>
        <Icon className={cn(styleClasses.header, styleClasses.headerIcon)} />
      </div>

      <div className="relative z-30 w-full text-center px-[2%] mb-[4%]">
        <h2 className={cn("drop-shadow-md", styleClasses.nameText)}>
          {metadata.name}
        </h2>
      </div>

      <div className={cn("relative z-30", styleClasses.effectBox)}>
        <div className="flex items-start gap-[2cqw] mb-[1cqw]">
          <Info className="w-[3.5cqw] h-[3.5cqw] text-white/40 mt-[0.5cqw] shrink-0" />
          <div className="flex flex-col">
            <p className={styleClasses.effectText}>
              {metadata.effect}
            </p>
            {currentMultiplier !== undefined && (
              <div className="mt-[2cqw] flex items-center gap-[1.5cqw]">
                <div className="bg-blue-500/20 text-blue-400 px-[2cqw] py-[0.5cqw] rounded-md border border-blue-500/30 text-[3cqw] font-bold">
                  Multiplier: {currentMultiplier}x
                </div>
              </div>
            )}
          </div>
        </div>
        {metadata.flavorText && (
          <p className={styleClasses.flavorText}>
            "{metadata.flavorText}"
          </p>
        )}
      </div>

      <div className={cn("absolute z-30", styleClasses.numberPos)}>
        <div className={styleClasses.numberTag}>
          {metadata.cardNumber}
        </div>
      </div>

      <div className={cn("absolute z-30", styleClasses.rarityPos)}>
        <RaritySymbol
          rarity={metadata.rarity}
          variant={data.variant}
          size={0}
          className="w-[12cqw] h-[12cqw]"
          color="white"
        />
      </div>

      <div className="absolute bottom-[6cqw] left-[6cqw] z-30">
        <div className="bg-black/40 backdrop-blur-sm text-white/60 px-[2cqw] py-[0.5cqw] text-[2.5cqw] font-black uppercase tracking-widest rounded-sm border border-white/5">
          Support
        </div>
      </div>
    </div>
  );
};
