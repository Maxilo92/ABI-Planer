'use client';

import React from 'react';
import { GraduationCap, Heart, Swords } from 'lucide-react';
import { CardData, CardStyle } from '@/types/cards';
import { RaritySymbol } from './RaritySymbol';
import { CardEffectOverlay } from './CardEffectOverlay';
import { cn } from '@/lib/utils';

interface TeacherSpecCardProps {
  data: CardData;
  className?: string;
  styleVariant?: CardStyle;
}

export const TeacherSpecCard = React.memo(({ 
  data, 
  className, 
  styleVariant = 'modern-flat'
}: TeacherSpecCardProps) => {
  const isBlckShiny = data.variant === 'black_shiny_holo';
  const isIconic = data.rarity === 'iconic';
  const isShiny = data.variant === 'shiny';
  const isGlass = data.variant === 'holo';
  const useLightText = isBlckShiny || isIconic || isGlass || isShiny;

  const getStyleClasses = () => {
    switch (styleVariant) {
      case 'modern-flat':
        return {
          card: cn(
            "transition-all rounded-xl",
            !isBlckShiny && !isShiny && !isIconic && "border-black shadow-[2cqw_2cqw_0px_0px_rgba(0,0,0,1)] border-[0.8cqw]",
            isIconic && "border-amber-500/60 shadow-[0_0_15px_rgba(251,191,36,0.4)] border-[1.2cqw]",
            isShiny && "shadow-[0_0_10px_rgba(255,255,255,0.4)] border-slate-300 border-[1cqw]",
            isBlckShiny && "shadow-[0_0_8cqw_rgba(147,51,234,0.5)] border-purple-500/50 border-[1cqw]"
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
            "px-[1.5cqw] py-[0.5cqw] text-[3cqw] font-black rounded-[0.5cqw] border-[0.3cqw] border-black",
            useLightText ? "bg-white text-black" : "bg-black text-white"
          ),
        };
      
      default:
        return {
          card: "border-white/40 shadow-2xl backdrop-blur-xl border-[2cqw] rounded-xl",
          header: "text-white",
          text: "text-white font-sans font-black leading-[0.9]",
          bgOverlay: "bg-white/10",
          numberTag: "bg-white/20 text-white px-[1.5cqw] py-[0.5cqw] text-[2.5cqw] font-black rounded-full",
        };
    }
  };

  const styleClasses = getStyleClasses();

  // Scaling logic: 10% increase per level (Level 1 is base stats)
  const level = data.level || 1;
  const scalingFactor = 1 + (level - 1) * 0.1;
  
  const scaledHp = data.hp ? Math.round(data.hp * scalingFactor) : undefined;
  const scaledAttacks = data.attacks?.map(attack => ({
    ...attack,
    damage: attack.damage !== undefined ? Math.round(attack.damage * scalingFactor) : undefined
  }));

  return (
    <div
      className={cn("relative aspect-[2.5/3.5] @container rounded-xl overflow-hidden isolate", className)}
      style={{ containerType: 'inline-size' }}
    >
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center overflow-hidden transition-all duration-300",
          styleClasses.card
        )}
        style={{
          backgroundColor: (isBlckShiny || isIconic) ? '#0a0a0a' : data.color,
        }}
      >
        <CardEffectOverlay variant={data.variant} tintColor={data.color} />
        <div className={cn("absolute inset-0 pointer-events-none", styleClasses.bgOverlay)} />

        <div className="relative z-10 h-full w-full p-[7%] flex flex-col space-y-[2.5%] min-h-0">
          <div className="flex items-start justify-between gap-[3%] w-full border-b-[0.5cqw] border-current pb-[1.5%]" style={{ color: useLightText ? 'white' : 'black' }}>
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
              <div className="flex items-center gap-[1cqw] mt-[0.6cqw]">
                <span className="inline-flex w-fit text-[2.8cqw] font-black bg-current/10 px-[1.2cqw] py-[0.3cqw] rounded-full uppercase tracking-widest opacity-80">
                  Level {level}
                </span>
              </div>
            </div>
            {scaledHp && (
              <div className="flex shrink-0 items-center gap-[1%] pt-[0.2cqw]">
                <span className="text-[3cqw] font-black uppercase opacity-60">HP</span>
                <span className="text-[7cqw] font-black tracking-tighter leading-none">{scaledHp}</span>
                <Heart className="w-[5.5cqw] h-[5.5cqw] fill-current text-red-500" />
              </div>
            )}
          </div>

          <div className="w-full aspect-[2/1] bg-black/10 rounded-[3%] flex items-center justify-center border-[0.4cqw] border-current/20 shrink-0" style={{ color: useLightText ? 'white' : 'black' }}>
            <GraduationCap className="w-[12cqw] h-[12cqw] opacity-30" />
          </div>

          <div className="min-h-0 flex-1 space-y-[2.5%] overflow-hidden pt-[1%]">
            {scaledAttacks?.slice(0, 2).map((attack, idx) => (
              <div key={idx} className="flex flex-col border-b-[0.2cqw] border-current/10 pb-[2%]" style={{ color: useLightText ? 'white' : 'black' }}>
                <div className="flex min-w-0 items-start justify-between gap-[2%]">
                  <div className="flex min-w-0 flex-1 items-start gap-[1.5%]">
                    <Swords className="w-[4cqw] h-[4cqw] text-blue-500" />
                    <span className="min-w-0 whitespace-normal break-words text-[4.5cqw] font-black uppercase tracking-tight leading-[0.95]" style={{ textWrap: 'balance' }}>
                      {attack.name}
                    </span>
                  </div>
                  {attack.damage !== undefined && (
                    <span className="shrink-0 text-[5cqw] font-black tracking-tighter leading-none pt-[0.1cqw]">{attack.damage}</span>
                  )}
                </div>
                {attack.description && (
                  <p className="text-[3cqw] leading-tight opacity-70 line-clamp-2 mt-[0.5%] whitespace-normal break-words">
                    {attack.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-[2.5%] mt-auto shrink-0 pt-[0.5%]">
            {data.description && (
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
                #{data.cardNumber}
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
    prevProps.data.level === nextProps.data.level &&
    prevProps.data.rarity === nextProps.data.rarity &&
    prevProps.data.variant === nextProps.data.variant &&
    prevProps.data.description === nextProps.data.description &&
    prevProps.data.cardNumber === nextProps.data.cardNumber &&
    prevProps.data.color === nextProps.data.color &&
    JSON.stringify(prevProps.data.attacks) === JSON.stringify(nextProps.data.attacks)
  );
});

TeacherSpecCard.displayName = 'TeacherSpecCard';
