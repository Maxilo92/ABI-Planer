'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Zap } from 'lucide-react';
import { CardData, CardStyle } from '@/types/cards';
import { RaritySymbol } from './RaritySymbol';
import { CardEffectOverlay } from './CardEffectOverlay';
import { cn } from '@/lib/utils';

interface TeacherCardProps {
  data: CardData;
  className?: string;
  styleVariant?: CardStyle;
  isFlippedExternally?: boolean;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ 
  data, 
  className, 
  styleVariant = 'soft-glass',
  isFlippedExternally 
}) => {
  const [isFlippedInternally, setIsFlippedInternally] = useState(false);
  const isFlipped = isFlippedExternally !== undefined ? isFlippedExternally : isFlippedInternally;

  const isBlckShiny = data.variant === 'blckshiny';
  const isGlass = data.variant.startsWith('glass-') || data.variant === 'shiny-v2';

  const getStyleClasses = () => {
    switch (styleVariant) {
      case 'modern-flat':
        return {
          card: cn(
            "transition-all rounded-[10cqw]",
            !isGlass && !isBlckShiny && "border-black shadow-[2cqw_2cqw_0px_0px_rgba(0,0,0,1)] hover:shadow-[3cqw_3cqw_0px_0px_rgba(0,0,0,1)] border-[0.8cqw]",
            isBlckShiny && "shadow-[0_0_4cqw_rgba(255,255,255,0.15)] border-white/20 border-[0.8cqw]",
            isGlass && "shadow-[0_4cqw_10cqw_-2cqw_rgba(0,0,0,0.15)] ring-[0.2cqw] ring-white/90"
          ),
          iconWrapper: cn(
            "bg-white border-[0.8cqw] border-black rounded-[4cqw] -rotate-2 shadow-[1cqw_1cqw_0px_0px_rgba(0,0,0,1)] flex items-center justify-center w-[35cqw] h-[35cqw]",
            isBlckShiny && "bg-neutral-800 border-white/20 shadow-none",
            isGlass && "bg-white/40 border-white/30 backdrop-blur-md shadow-none"
          ),
          headerIcon: "w-[18cqw] h-[18cqw]",
          header: (isBlckShiny || isGlass) ? "text-white" : "text-black",
          text: cn(
            "font-sans uppercase font-black tracking-tighter text-[12cqw] leading-[0.85] break-words w-full",
            (isBlckShiny || isGlass) ? "text-white drop-shadow-[0_0_2cqw_rgba(255,255,255,0.4)]" : "text-black"
          ),
          border: "", 
          bgOverlay: isBlckShiny ? "bg-neutral-950" : (isGlass ? "bg-transparent" : "bg-white/5"),
          numberTag: cn(
            "px-[2cqw] py-[0.5cqw] text-[3.5cqw] font-black rounded-[0.5cqw] transform rotate-1 border-[0.3cqw] border-black shadow-[0.5cqw_0.5cqw_0px_0px_rgba(0,0,0,1)]",
            (isBlckShiny || isGlass) ? "bg-white text-black" : "bg-black text-white"
          ),
          numberPos: "bottom-[8cqw] left-[8cqw]",
          rarityPos: "bottom-[8cqw] right-[8cqw]",
          raritySize: "14cqw"
        };
      
      default:
        return {
          card: "border-white/40 shadow-2xl backdrop-blur-xl border-[2cqw] rounded-[10cqw]",
          iconWrapper: "bg-white/30 rounded-full w-[35cqw] h-[35cqw] flex items-center justify-center",
          headerIcon: "w-[18cqw] h-[18cqw]",
          header: "text-white",
          text: "text-white font-sans font-black text-[12cqw]",
          border: "border-[2cqw]",
          bgOverlay: "bg-white/10",
          numberTag: "bg-white/20 text-white px-[2cqw] py-[0.5cqw] text-[3cqw] font-black rounded-full",
          numberPos: "top-[8cqw] right-[8cqw]",
          rarityPos: "bottom-[8cqw] right-[8cqw]",
          raritySize: "14cqw"
        };
    }
  };

  const styleClasses = getStyleClasses();

  return (
    <div 
      className={cn("relative aspect-[2.5/3.5] cursor-pointer perspective-1000 @container", className)}
      onClick={() => setIsFlippedInternally(!isFlippedInternally)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full relative will-change-transform"
      >
        {/* BACK SIDE */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden p-[8cqw] flex flex-col items-center justify-center overflow-hidden rotate-y-180",
            isGlass ? styleClasses.card : "border-[2cqw] border-white/20 bg-neutral-950 rounded-[10cqw]"
          )}
          style={isGlass ? { backgroundColor: `${data.color}99` } : undefined}
        >
          {isGlass && <CardEffectOverlay variant={data.variant} tintColor={data.color} />}
          
          <div className="relative z-10 flex flex-col items-center">
            <Zap className="text-white mb-[4cqw] w-[20cqw] h-[20cqw]" />
            <div className="text-white font-black tracking-[0.3em] text-[4cqw] uppercase opacity-80">
               ABI Planer
            </div>
          </div>
        </div>

        {/* FRONT SIDE */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden p-[7cqw] flex flex-col items-center overflow-hidden transition-all duration-300",
            styleClasses.card
          )}
          style={{ 
            backgroundColor: isBlckShiny ? '#0a0a0a' : (isGlass ? `${data.color}99` : data.color) 
          }}
        >
          <CardEffectOverlay variant={data.variant} tintColor={data.color} />

          <div className={cn("absolute inset-0 pointer-events-none", styleClasses.bgOverlay)} />
          
          <div className={cn("relative z-30 mb-[4cqw] mt-[4cqw]", styleClasses.iconWrapper)}>
            <GraduationCap className={cn(styleClasses.header, styleClasses.headerIcon)} />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center relative z-30 w-full px-[2cqw]">
            <h2 className={cn("drop-shadow-sm", styleClasses.text)}>
              {data.name}
            </h2>
          </div>

          <div className={cn("absolute z-30", styleClasses.numberPos)}>
            <div className={styleClasses.numberTag}>
              {data.cardNumber}
            </div>
          </div>

          <div className={cn("absolute z-30", styleClasses.rarityPos)}>
            <RaritySymbol 
              rarity={data.rarity} 
              variant={data.variant}
              size={0} // Controlled by className in RaritySymbol now
              className={cn("w-[14cqw] h-[14cqw]")}
              color={isBlckShiny ? 'white' : (styleVariant === 'modern-flat' ? 'black' : 'white')} 
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
