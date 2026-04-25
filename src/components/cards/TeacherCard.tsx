'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { GraduationCap, Zap, Star, Lock, Trash2, Image, Check } from 'lucide-react';
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
  interactive?: boolean;
  upgradeInfo?: { oldLevel: number, newLevel: number };
  isCover?: boolean;
  onRemove?: (e: React.MouseEvent) => void;
  onSetCover?: (e: React.MouseEvent) => void;
  showDeckControls?: boolean;
  frontOnly?: boolean;
}

const Particle = React.memo(({ delay }: { delay: number }) => {
  const [randoms, setRandoms] = React.useState<{
    x: number;
    y: number;
    size: number;
    rotation: number;
  } | null>(null);

  React.useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 80;
    setRandoms({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 1 + Math.random() * 2,
      rotation: Math.random() * 360
    });
  }, []);

  if (!randoms) return null;

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
      animate={{ 
        x: randoms.x, 
        y: randoms.y, 
        opacity: 0, 
        scale: [0, 1.5, 0],
        rotate: [0, randoms.rotation]
      }}
      transition={{ 
        duration: 0.8, 
        delay,
        ease: "easeOut" 
      }}
      className="absolute bg-yellow-400 rounded-sm will-change-transform"
      style={{ 
        width: `${2 + randoms.size * 1.4}px`, 
        height: `${2 + randoms.size * 1.4}px`,
        boxShadow: '0 0 10px rgba(255,215,0,0.5)'
      }}
    />
  );
});

Particle.displayName = 'Particle';

const RARITY_COLORS: Record<string, string> = {
  common: '#cbd5e1',    // slate-300
  rare: '#059669',      // emerald-600
  epic: '#7c3aed',      // violet-600
  mythic: '#dc2626',    // red-600
  legendary: '#fbbf24', // amber-400
  iconic: '#1e293b',    // slate-800
};

const lightenColor = (hex: string, amount: number) => {
  const normalized = (hex || '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex;

  const toChannel = (start: number) => parseInt(normalized.slice(start, start + 2), 16);
  const brighten = (value: number) => Math.max(0, Math.min(255, Math.floor(value + (255 - value) * amount)));

  const r = brighten(toChannel(0)).toString(16).padStart(2, '0');
  const g = brighten(toChannel(2)).toString(16).padStart(2, '0');
  const b = brighten(toChannel(4)).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

export const TeacherCard = React.memo(({ 
  data, 
  className, 
  styleVariant = 'soft-glass',
  isFlippedExternally,
  isLocked = false,
  interactive = true,
  upgradeInfo,
  isCover = false,
  onRemove,
  onSetCover,
  showDeckControls = false,
  frontOnly = false
}: TeacherCardProps) => {
  const rarity = data?.rarity || 'common';
  const variant = data?.variant || 'normal';
  const isBlckShiny = variant === 'black_shiny_holo';
  const isIconic = rarity === 'iconic';
  const isShiny = variant === 'shiny';
  const isGlass = variant === 'holo';
  const hasFoilEffects = variant !== 'normal' || isIconic;

  const cardColor = React.useMemo(() => {
    if (isBlckShiny || isIconic) return '#1e293b';
    // Use RARITY_COLORS if color is missing or the default blue
    if (!data?.color || data?.color === '#3b82f6') {
      return RARITY_COLORS[rarity] || data?.color || '#cbd5e1';
    }
    return data?.color;
  }, [data?.color, rarity, isBlckShiny, isIconic]);

  const darkenHexColor = (hex: string, amount: number) => {
    const normalized = (hex || '').trim().replace('#', '')
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '#1f2937'

    const toChannel = (start: number) => parseInt(normalized.slice(start, start + 2), 16)
    const darken = (value: number) => Math.max(0, Math.min(255, Math.floor(value * (1 - amount))))

    const r = darken(toChannel(0)).toString(16).padStart(2, '0')
    const g = darken(toChannel(2)).toString(16).padStart(2, '0')
    const b = darken(toChannel(4)).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }

  const colorLighter = lightenColor(cardColor, 0.4);
  const colorDarker = darkenHexColor(cardColor, 0.3);

  const [isFlippedInternally, setIsFlippedInternally] = useState(isFlippedExternally ?? false);
  const [prevExternal, setPrevExternal] = useState(isFlippedExternally);
  
  useEffect(() => {
    if (isFlippedExternally !== undefined && isFlippedExternally !== prevExternal) {
      setIsFlippedInternally(isFlippedExternally);
      setPrevExternal(isFlippedExternally);
    }
  }, [isFlippedExternally, prevExternal]);

  const isFlipped = isLocked ? false : isFlippedInternally;

  const [displayLevel, setDisplayLevel] = useState(upgradeInfo?.oldLevel || 0);
  const [isLevelAnimating, setIsLevelAnimating] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    // Only trigger if we have an upgrade and the card is flipped to the front
    if (upgradeInfo && (isFlipped || frontOnly) && displayLevel < upgradeInfo.newLevel) {
      const timer = setTimeout(() => {
        setDisplayLevel(upgradeInfo.newLevel);
        setIsLevelAnimating(true);
        setShowBurst(true);
        
        // Determine start and end rotation based on flip state
        const currentRot = isFlipped ? 0 : 180;
        
        // Execute exactly one 360-degree spin
        if (!frontOnly) {
          controls.start({
            rotateY: [currentRot, currentRot + 360],
            transition: { duration: 0.8, ease: "easeInOut" }
          });
        }

        setTimeout(() => {
          setIsLevelAnimating(false);
          setShowBurst(false);
        }, 1500);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (upgradeInfo && !isFlipped && !frontOnly) {
      // Sync display level when card is hidden
      setDisplayLevel(upgradeInfo.oldLevel);
    }
  }, [upgradeInfo?.newLevel, upgradeInfo?.oldLevel, isFlipped, controls, displayLevel, frontOnly]);

  const cardFrontRef = useRef<HTMLDivElement | null>(null);
  const [effectsEnabled, setEffectsEnabled] = useState(!hasFoilEffects);
  const numberStickerBackground = darkenHexColor(cardColor || '#3b82f6', 0.35)
  const numberStickerStyle = isBlckShiny
    ? {
        backgroundColor: 'rgba(52, 24, 74, 0.92)',
        borderColor: 'rgba(196, 132, 252, 0.55)',
        color: '#f5e9ff',
        boxShadow: '0.55cqw 0.55cqw 0px 0px rgba(20, 12, 30, 0.8), 0 0 1.2cqw rgba(147, 51, 234, 0.35)',
      }
    : {
        backgroundColor: numberStickerBackground,
      }

  const getStyleClasses = () => {
    switch (styleVariant) {
      case 'modern-flat':
        return {
          card: cn(
            "transition-all rounded-xl",
            !isBlckShiny && !isShiny && !isIconic && "shadow-[2cqw_2cqw_0px_0px_rgba(0,0,0,1)] hover:shadow-[3cqw_3cqw_0px_0px_rgba(0,0,0,1)]",
            isIconic && "shadow-[0_0_15px_rgba(251,191,36,0.4)]",
            isShiny && "shadow-[0_0_10px_rgba(255,255,255,0.4)]",
            isBlckShiny && "shadow-[0_0_8cqw_rgba(147,51,234,0.5)]"
          ),
          cardBorder: cn(
            "absolute inset-0 rounded-xl pointer-events-none z-[45] border-solid",
            !isBlckShiny && !isShiny && !isIconic && "border-black border-[0.8cqw]",
            isIconic && "border-amber-500/60 border-[1.2cqw]",
            isShiny && "border-slate-300 border-[1cqw]",
            isBlckShiny && "border-purple-500/50 border-[1cqw]"
          ),
          iconWrapper: cn(
            "bg-white border-[0.8cqw] border-black rounded-[4cqw] -rotate-2 shadow-[1cqw_1cqw_0px_0px_rgba(0,0,0,1)] flex items-center justify-center w-[42cqw] aspect-[2/1]",
            isIconic && "bg-neutral-900 border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]",
            isBlckShiny && "bg-neutral-900 border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.3)]",
            isShiny && "bg-slate-100 border-slate-300 shadow-none",
            isGlass && "bg-white/40 border-white/30 backdrop-blur-md shadow-none"
          ),
          headerIcon: "w-[18cqw] h-[18cqw]",
          header: (isBlckShiny || isGlass || isShiny || isIconic) ? (isShiny ? "text-slate-600" : "text-white") : "text-black",
          text: cn(
            "font-sans uppercase font-black tracking-tighter text-[11cqw] leading-[0.95] break-words w-full py-[1cqw]",
            isIconic ? "text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" :
            (isBlckShiny ? "text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 drop-shadow-[0_0_10px_rgba(147,51,234,0.8)]" : 
            (isShiny ? "text-slate-800 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]" : 
            (isGlass ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "text-black")))
          ),
          bgOverlay: (isBlckShiny || isIconic) ? "bg-black/40" : (isShiny ? "bg-white/30" : (isGlass ? "bg-transparent" : "bg-white/5")),
          numberTag: cn(
            "px-[2.4cqw] py-[0.7cqw] text-[3.3cqw] font-black uppercase rounded-[0.7cqw] border-[0.18cqw] border-white/16 text-white",
            "shadow-[0.45cqw_0.45cqw_0px_0px_rgba(0,0,0,0.55)]",
            "-rotate-[7deg] tracking-[0.06em]"
          ),
          numberPos: "bottom-[8cqw] left-[8cqw]",
          rarityPos: "bottom-[8cqw] right-[8cqw]",
          raritySize: "14cqw"
        };
      
      default:
        return {
          card: "shadow-2xl backdrop-blur-xl rounded-xl",
          cardBorder: "absolute inset-0 border-white/40 border-[2cqw] rounded-xl pointer-events-none z-[45]",
          iconWrapper: "bg-white/30 rounded-xl w-[42cqw] aspect-[2/1] flex items-center justify-center",
          headerIcon: "w-[18cqw] h-[18cqw]",
          header: "text-white",
          text: "text-white font-sans font-black text-[11cqw] leading-[0.9]",
          bgOverlay: "bg-white/10",
          numberTag: "px-[2.4cqw] py-[0.7cqw] text-[3.3cqw] font-black uppercase rounded-[0.7cqw] border-[0.18cqw] border-white/16 text-white shadow-[0.45cqw_0.45cqw_0px_0px_rgba(0,0,0,0.55)] -rotate-[7deg] tracking-[0.06em]",
          numberPos: "bottom-[8cqw] left-[8cqw]",
          rarityPos: "bottom-[8cqw] right-[8cqw]",
          raritySize: "14cqw"
        };
    }
  };

  const styleClasses = getStyleClasses();

  useEffect(() => {
    if (!hasFoilEffects) {
      setEffectsEnabled(false);
      return;
    }

    const target = cardFrontRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      setEffectsEnabled(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEffectsEnabled(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '180px 0px',
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasFoilEffects]);

  const frontSide = (
    <div 
      ref={cardFrontRef}
      className={cn(
        "absolute inset-0 backface-hidden p-[7%] flex flex-col items-center overflow-hidden transition-all duration-300",
        styleClasses.card,
        frontOnly && "relative h-full w-full"
      )}
      style={{ 
        backgroundColor: isBlckShiny ? '#0a0a0a' : (isGlass ? cardColor : cardColor),
        transform: frontOnly ? undefined : "translateZ(1px)"
      }}
    >
      {/* Background Patterns for Normal Variants */}
      {!hasFoilEffects && !isGlass && !isShiny && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0" 
            style={{ 
              backgroundImage: `
                radial-gradient(at 0% 0%, ${colorLighter} 0px, transparent 50%),
                radial-gradient(at 100% 0%, ${cardColor} 0px, transparent 50%),
                radial-gradient(at 100% 100%, ${colorDarker} 0px, transparent 50%),
                radial-gradient(at 0% 100%, ${cardColor} 0px, transparent 50%),
                linear-gradient(135deg, ${cardColor} 0%, ${colorDarker} 100%)
              `
            }}
          />
          <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay" 
               style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)` }} 
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,rgba(0,0,0,0.3)_100%)] mix-blend-multiply" />
        </div>
      )}

      {/* Special Background for Iconic (if not using special variant) */}
      {isIconic && variant === 'normal' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0" 
            style={{ 
              backgroundColor: '#0f172a',
              backgroundImage: `
                radial-gradient(at 50% 0%, #1e293b 0%, transparent 70%),
                radial-gradient(at 0% 100%, #1e293b 0%, transparent 50%),
                radial-gradient(at 100% 100%, #020617 0%, transparent 50%)
              `
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.15)_0%,transparent_80%)] mix-blend-screen" />
          <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath fill='%23fbbf24' fill-opacity='1' d='M0 0h20v20H0V0zm10 17.32L18.66 12.32 10 7.32 1.34 12.32 10 17.32zM20 20h20v20H20V20zm10 17.32L38.66 32.32 30 27.32 21.34 32.32 30 17.32z'/%3E%3C/svg%3E")` }} 
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_40%,rgba(0,0,0,0.6)_100%)] mix-blend-multiply" />
        </div>
      )}

      {/* Special Background for Iconic Holo */}
      {isIconic && isGlass && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img 
            src="/images/cards/iconic-holo.jpg" 
            className="w-full h-full object-cover opacity-100"
            alt="Iconic Holo Effect"
          />
          <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
        </div>
      )}

      <CardEffectOverlay
        variant={variant}
        tintColor={cardColor}
        isIconic={isIconic}
        effectsEnabled={effectsEnabled}
      />

      <div className={cn("absolute inset-0 pointer-events-none z-10", styleClasses.bgOverlay)} />
      
      {/* Deck Controls */}
      {showDeckControls && (
        <div className="absolute inset-x-0 top-0 z-50 flex justify-between p-[4%] opacity-100 transition-opacity">
          <div className="flex gap-[1.5cqw]">
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(e);
                }}
                className="bg-red-500/90 hover:bg-red-600 text-white p-[1.5cqw] rounded-xl backdrop-blur-md shadow-lg transition-all active:scale-90"
                title="Aus Deck entfernen"
              >
                <Trash2 className="w-[8cqw] h-[8cqw]" />
              </button>
            )}
            {onSetCover && !isCover && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCover(e);
                }}
                className="bg-blue-500/90 hover:bg-blue-600 text-white p-[1.5cqw] rounded-xl backdrop-blur-md shadow-lg transition-all active:scale-90"
                title="Als Cover setzen"
              >
                <Image className="w-[8cqw] h-[8cqw]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cover Badge */}
      {isCover && (
        <div className="absolute top-[4%] left-[4%] z-50">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-[3cqw] py-[1cqw] rounded-xl flex items-center gap-[1cqw] shadow-[0_4px_12px_rgba(245,158,11,0.4)] border border-amber-400/50 scale-90 origin-top-left">
            <Check className="w-[6cqw] h-[6cqw] stroke-[4px]" />
            <span className="text-[5cqw] font-black uppercase tracking-tight">COVER</span>
          </div>
        </div>
      )}

      <div className={cn("relative z-30 mb-[4%] mt-[4%] overflow-hidden", styleClasses.iconWrapper)}>
        {data.imageUrl ? (
          <img 
            src={data.imageUrl} 
            alt={data.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <GraduationCap className={cn(styleClasses.header, styleClasses.headerIcon)} />
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-30 w-full px-[2%]">
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
              {[...Array(12)].map((_, i) => (
                <Particle key={i} delay={i * 0.02} />
              ))}
            </div>
          )}
        </div>
      )}
      <div className={cn("absolute z-30", styleClasses.numberPos)}>
        <div className={styleClasses.numberTag} style={numberStickerStyle}>
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

      {/* Separate border layer for perfect fit */}
      <div className={styleClasses.cardBorder} />
    </div>
  );

  const wrappedFrontSide = (
    <div
      className={cn("relative aspect-[2.5/3.5] @container rounded-xl overflow-visible isolate", className)}
      style={{ containerType: 'inline-size' }}
    >
      {frontSide}
    </div>
  );

  if (frontOnly) {
    return wrappedFrontSide;
  }

  return (
    <div
      className={cn("relative aspect-[2.5/3.5] perspective-1000 @container rounded-xl overflow-visible isolate", className, interactive && "cursor-pointer")}
      style={{ containerType: 'inline-size' }}
      onClick={() => {
        if (interactive && !isLocked) {
          setIsFlippedInternally(!isFlippedInternally);
        }
      }}
    >
      <motion.div
        animate={isLevelAnimating ? controls : { rotateY: isFlipped ? 0 : 180 }}
        initial={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full h-full relative will-change-transform preserve-3d"
      >
        <div
          className={cn(
            "absolute inset-0 backface-hidden p-[8%] flex flex-col items-center justify-center overflow-hidden rounded-xl",
            "bg-neutral-950 shadow-2xl",
            isLocked ? "grayscale-[0.5] opacity-90" : ""
          )}
          style={{ transform: "rotateY(180deg) translateZ(1px)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] z-10" />
          <CardEffectOverlay variant="normal" tintColor="#000000" />

          <div className="relative z-30 flex flex-col items-center">
            <div className={cn(
              "w-[25%] aspect-square rounded-full flex items-center justify-center mb-[4%] border border-white/10",
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
            <div className="absolute top-[8%] right-[8%] z-30">
              <div className="bg-white/5 text-white/20 px-[2cqw] py-[0.5cqw] text-[3cqw] font-black rounded-full border border-white/5">
                {data.cardNumber}
              </div>
            </div>
          )}

          {isLocked && (
            <div className="absolute inset-x-0 bottom-[15%] flex flex-col items-center">
              <div className="w-[10cqw] h-[1cqw] bg-white/10 rounded-full mb-2" />
              <div className="text-[2.5cqw] font-bold text-white/20 uppercase tracking-widest">Mystery Card</div>
            </div>
          )}

          {/* Separate border layer for card back */}
          <div className="absolute inset-0 border-[2cqw] border-white/20 rounded-xl pointer-events-none z-[45]" />
        </div>

        {!isLocked && frontSide}
      </motion.div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isLocked === nextProps.isLocked &&
    prevProps.isFlippedExternally === nextProps.isFlippedExternally &&
    prevProps.className === nextProps.className &&
    prevProps.styleVariant === nextProps.styleVariant &&
    prevProps.interactive === nextProps.interactive &&
    prevProps.upgradeInfo?.newLevel === nextProps.upgradeInfo?.newLevel &&
    prevProps.data.id === nextProps.data.id &&
    prevProps.data.variant === nextProps.data.variant &&
    prevProps.data.rarity === nextProps.data.rarity &&
    prevProps.data.name === nextProps.data.name &&
    prevProps.data.imageUrl === nextProps.data.imageUrl &&
    prevProps.isCover === nextProps.isCover &&
    prevProps.showDeckControls === nextProps.showDeckControls &&
    prevProps.frontOnly === nextProps.frontOnly
  );
});

TeacherCard.displayName = 'TeacherCard';
