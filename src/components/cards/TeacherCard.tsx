'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { GraduationCap, Zap, Star, Lock } from 'lucide-react';
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

const Particle = ({ delay }: { delay: number }) => {
  const angle = Math.random() * Math.PI * 2;
  const distance = 50 + Math.random() * 100;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
      animate={{ 
        x, 
        y, 
        opacity: 0, 
        scale: [0, 1.5, 0.5],
        rotate: [0, 180, 360]
      }}
      transition={{ 
        duration: 1, 
        delay,
        ease: "easeOut" 
      }}
      className="absolute w-[2cqw] h-[2cqw] bg-yellow-400 rounded-full"
    >
       <Star className="w-full h-full fill-current text-yellow-300" />
    </motion.div>
  );
};

export const TeacherCard: React.FC<TeacherCardProps> = ({ 
  data, 
  className, 
  styleVariant = 'soft-glass',
  isFlippedExternally,
  isLocked = false,
  upgradeInfo
}) => {
  const [isFlippedInternally, setIsFlippedInternally] = useState(true);
  const isFlipped = isLocked ? false : (isFlippedExternally !== undefined ? isFlippedExternally : isFlippedInternally);

  const [displayLevel, setDisplayLevel] = useState(upgradeInfo?.oldLevel || 0);
  const [isLevelAnimating, setIsLevelAnimating] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    if (upgradeInfo && isFlipped) {
      setDisplayLevel(upgradeInfo.oldLevel);
      
      const timer = setTimeout(() => {
        setDisplayLevel(upgradeInfo.newLevel);
        setIsLevelAnimating(true);
        setShowBurst(true);
        
        // Full 360-degree horizontal spin
        controls.start({
          rotateY: [0, 360],
          transition: { duration: 0.8, ease: "easeInOut" }
        });

        setTimeout(() => {
          setIsLevelAnimating(false);
          setShowBurst(false);
        }, 1500);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [upgradeInfo, isFlipped, controls]);

  const isBlckShiny = data.variant === 'black_shiny_holo';
  const isShiny = data.variant === 'shiny';
  const isGlass = data.variant === 'holo';

  const getStyleClasses = () => {
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
      onClick={() => !isLocked && setIsFlippedInternally(!isFlippedInternally)}
    >
      <motion.div
        animate={controls}
        className="w-full h-full"
      >
        <motion.div
          initial={{ rotateY: isFlipped ? 0 : 180 }}
          animate={{ rotateY: isFlipped ? 0 : 180 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
          className="w-full h-full relative will-change-transform"
        >
          {/* BACK SIDE (Locked also shows this essentially) */}
          <div 
            className={cn(
              "absolute inset-0 backface-hidden p-[8cqw] flex flex-col items-center justify-center overflow-hidden",
              "border-[2cqw] border-white/20 bg-neutral-950 shadow-2xl rounded-[10cqw]",
              isLocked ? "grayscale-[0.5] opacity-90" : ""
            )}
            style={{ transform: "rotateY(180deg) translateZ(1px)" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
            <CardEffectOverlay variant="normal" tintColor="#000000" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-[25cqw] h-[25cqw] rounded-full flex items-center justify-center mb-[4cqw] border border-white/10",
                isLocked ? "bg-neutral-900" : "bg-white/5"
              )}>
                {isLocked ? (
                  <Lock className="text-white/40 w-[12cqw] h-[12cqw]" />
                ) : (
                  <Zap className="text-white w-[15cqw] h-[15cqw] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                )}
              </div>
              <div className="text-white font-black tracking-[0.3em] text-[4cqw] uppercase opacity-40">
                 {isLocked ? "GESPERRT" : "ABI Planer"}
              </div>
            </div>

            {isLocked && (
              <div className="absolute top-[8cqw] right-[8cqw] z-30">
                <div className="bg-white/5 text-white/20 px-[2cqw] py-[0.5cqw] text-[3cqw] font-black rounded-full border border-white/5">
                  {data.cardNumber}
                </div>
              </div>
            )}

            {isLocked && (
              <div className="absolute inset-x-0 bottom-[15cqw] flex flex-col items-center">                 <div className="w-[10cqw] h-[1cqw] bg-white/10 rounded-full mb-2" />
                 <div className="text-[2.5cqw] font-bold text-white/20 uppercase tracking-widest">Mystery Card</div>
              </div>
            )}
          </div>

          {/* FRONT SIDE */}
          {!isLocked && (
            <div 
              className={cn(
                "absolute inset-0 backface-hidden p-[7cqw] flex flex-col items-center overflow-hidden transition-all duration-300",
                styleClasses.card
              )}
              style={{ 
                backgroundColor: isBlckShiny ? '#0a0a0a' : (isGlass ? data.color : data.color),
                transform: "translateZ(1px)"
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

              {upgradeInfo && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                  <AnimatePresence>
                    {isLevelAnimating && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1.1, opacity: 1, y: -110 }}
                        exit={{ scale: 0.8, opacity: 0, y: -160 }}
                        className="absolute font-black text-white text-[9cqw] drop-shadow-[0_0_15px_rgba(255,255,0,0.8)] z-50 italic flex items-center gap-[2cqw]"
                      >
                        <span className="text-white/60">LVL</span>
                        {upgradeInfo.oldLevel} 
                        <span className="text-yellow-400 animate-pulse">→</span> 
                        {upgradeInfo.newLevel}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {showBurst && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[...Array(24)].map((_, i) => (
                        <Particle key={i} delay={i * 0.015} />
                      ))}
                    </div>
                  )}
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
                  variant={data.variant}
                  size={0} 
                  className="w-[14cqw] h-[14cqw]"
                  color={isBlckShiny ? 'white' : (styleVariant === 'modern-flat' ? 'black' : 'white')} 
                />
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
