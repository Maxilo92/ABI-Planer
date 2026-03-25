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
  isLocked?: boolean;
  upgradeInfo?: { oldLevel: number, newLevel: number };
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ 
  data, 
  className, 
  styleVariant = 'soft-glass',
  isFlippedExternally,
  isLocked = false,
  upgradeInfo
}) => {
  const [isFlippedInternally, setIsFlippedInternally] = useState(false);
  const isFlipped = isFlippedExternally !== undefined ? isFlippedExternally : isFlippedInternally;

  const [displayLevel, setDisplayLevel] = useState(upgradeInfo?.oldLevel || 0);
  const [isLevelAnimating, setIsLevelAnimating] = useState(false);

  useEffect(() => {
    if (upgradeInfo && isFlipped) {
      setDisplayLevel(upgradeInfo.oldLevel);
      
      const timer = setTimeout(() => {
        setDisplayLevel(upgradeInfo.newLevel);
        setIsLevelAnimating(true);
        setTimeout(() => setIsLevelAnimating(false), 1000);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [upgradeInfo, isFlipped]);

  const isBlckShiny = data.variant === 'black_shiny_holo';
  const isShiny = data.variant === 'shiny';
  const isGlass = data.variant === 'holo';

  const getStyleClasses = () => {
    if (isLocked) {
      return {
        card: "border-white/5 shadow-inner rounded-[10cqw]",
        iconWrapper: "bg-white/5 rounded-full w-[35cqw] h-[35cqw] flex items-center justify-center border border-white/10",
        headerIcon: "w-[18cqw] h-[18cqw] opacity-20",
        header: "text-white/20",
        text: "text-white/10 font-sans font-black text-[12cqw] blur-sm select-none",
        border: "border-[2cqw] border-white/5",
        bgOverlay: "bg-black/40",
        numberTag: "bg-white/5 text-white/20 px-[2cqw] py-[0.5cqw] text-[3cqw] font-black rounded-full border border-white/5",
        numberPos: "top-[8cqw] right-[8cqw]",
        rarityPos: "bottom-[8cqw] right-[8cqw]",
        raritySize: "14cqw"
      };
    }

    switch (styleVariant) {
      case 'modern-flat':
        return {
          card: cn(
            "transition-all rounded-[10cqw]",
            !isBlckShiny && !isShiny && "border-black shadow-[2cqw_2cqw_0px_0px_rgba(0,0,0,1)] hover:shadow-[3cqw_3cqw_0px_0px_rgba(0,0,0,1)] border-[0.8cqw]",
            isShiny && "shadow-[0_0_10px_rgba(255,255,255,0.4)] border-slate-300 border-[1cqw]",
            isBlckShiny && "shadow-[0_0_8cqw_rgba(147,51,234,0.5)] border-purple-500/50 border-[1cqw]"
          ),
          iconWrapper: cn(
            "bg-white border-[0.8cqw] border-black rounded-[4cqw] -rotate-2 shadow-[1cqw_1cqw_0px_0px_rgba(0,0,0,1)] flex items-center justify-center w-[35cqw] h-[35cqw]",
            isBlckShiny && "bg-neutral-900 border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.3)]",
            isShiny && "bg-slate-100 border-slate-300 shadow-none",
            isGlass && "bg-white/40 border-white/30 backdrop-blur-md shadow-none"
          ),
          headerIcon: "w-[18cqw] h-[18cqw]",
          header: (isBlckShiny || isGlass || isShiny) ? (isShiny ? "text-slate-600" : "text-white") : "text-black",
          text: cn(
            "font-sans uppercase font-black tracking-tighter text-[12cqw] leading-[0.85] break-words w-full",
            isBlckShiny ? "text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 drop-shadow-[0_0_3cqw_rgba(147,51,234,0.8)]" : 
            (isShiny ? "text-slate-800 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]" : 
            (isGlass ? "text-white drop-shadow-[0_0_2cqw_rgba(255,255,255,0.4)]" : "text-black"))
          ),
          border: "", 
          bgOverlay: isBlckShiny ? "bg-black/40" : (isShiny ? "bg-white/30" : (isGlass ? "bg-transparent" : "bg-white/5")),
          numberTag: cn(
            "px-[2cqw] py-[0.5cqw] text-[3.5cqw] font-black rounded-[0.5cqw] transform rotate-1 border-[0.3cqw] border-black shadow-[0.5cqw_0.5cqw_0px_0px_rgba(0,0,0,1)]",
            (isBlckShiny || isGlass || isShiny) ? "bg-white text-black" : "bg-black text-white"
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
        initial={{ rotateY: isFlipped ? 0 : 180 }}
        animate={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full relative will-change-transform"
      >
        {/* BACK SIDE */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden p-[8cqw] flex flex-col items-center justify-center overflow-hidden rotate-y-180",
            "border-[2cqw] border-white/20 bg-neutral-950 shadow-2xl rounded-[10cqw]"
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
          <CardEffectOverlay variant="normal" tintColor="#000000" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-[25cqw] h-[25cqw] rounded-full bg-white/5 flex items-center justify-center mb-[4cqw] border border-white/10">
              <Zap className="text-white w-[15cqw] h-[15cqw] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            </div>
            <div className="text-white font-black tracking-[0.3em] text-[4cqw] uppercase opacity-40">
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
            backgroundColor: isLocked ? '#0a0a0a' : (isBlckShiny ? '#0a0a0a' : (isGlass ? `${data.color}99` : data.color)) 
          }}
        >
          {isLocked ? (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] opacity-50" />
          ) : (
            <CardEffectOverlay variant={data.variant} tintColor={data.color} />
          )}

          <div className={cn("absolute inset-0 pointer-events-none", styleClasses.bgOverlay)} />
          
          <div className={cn("relative z-30 mb-[4cqw] mt-[4cqw]", styleClasses.iconWrapper)}>
            <GraduationCap className={cn(styleClasses.header, styleClasses.headerIcon)} />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center relative z-30 w-full px-[2cqw]">
            <h2 className={cn("drop-shadow-sm", styleClasses.text)}>
              {data.name}
            </h2>
          </div>

          {upgradeInfo && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="absolute inset-0 blur-[20px] bg-white/40 animate-pulse rounded-full" />
                <motion.div
                  key={displayLevel}
                  initial={{ scale: 1.5, opacity: 0, y: -20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className={cn(
                    "relative bg-black text-white px-[4cqw] py-[1cqw] rounded-[2cqw] border-[1cqw] border-white shadow-2xl font-black text-[10cqw] tracking-tighter flex items-center gap-[1cqw]",
                    isLevelAnimating && "animate-bounce"
                  )}
                >
                  <span className="text-[4cqw] opacity-50">LVL</span>
                  {displayLevel}
                </motion.div>
              </motion.div>
            </div>
          )}

          <div className={cn("absolute z-30", styleClasses.numberPos)}>
            <div className={styleClasses.numberTag}>
              {data.cardNumber}
            </div>
          </div>

          <div className={cn("absolute z-30", styleClasses.rarityPos)}>
            <RaritySymbol 
              rarity={data.rarity} 
              variant={isLocked ? 'normal' : data.variant}
              size={0} 
              className={cn("w-[14cqw] h-[14cqw]", isLocked && "opacity-20 grayscale")}
              color={isLocked ? 'white' : (isBlckShiny ? 'white' : (styleVariant === 'modern-flat' ? 'black' : 'white'))} 
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
