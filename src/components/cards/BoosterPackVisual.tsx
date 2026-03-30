import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Trophy, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoosterPackVisualProps {
  amount: number;
  color: BoosterVisualColor;
  mode?: 'classic' | 'experimental';
  layoutStyle?: BoosterVisualLayout;
  density?: 'normal' | 'dense';
  fanCardCount?: number;
  className?: string;
}

export type BoosterVisualColor = 'blue' | 'purple' | 'amber' | 'emerald' | 'slate' | 'rose';
export type BoosterVisualLayout = 'auto' | 'fan' | 'fan-wide' | 'fan-cascade' | 'fan-ring' | 'tower' | 'crate' | 'double-crate' | 'mountain' | 'pyramid' | 'pile' | 'wall' | 'zigzag';

export const BoosterPackVisual: React.FC<BoosterPackVisualProps> = ({ amount, color, mode = 'classic', layoutStyle = 'auto', density = 'normal', fanCardCount, className }) => {
  const getColors = () => {
    switch (color) {
      case 'purple': return { 
        primary: 'bg-purple-500', 
        secondary: 'bg-purple-600', 
        accent: 'text-purple-300',
        glow: 'shadow-purple-500/20',
        gradient: 'from-purple-600 to-indigo-900'
      };
      case 'amber': return { 
        primary: 'bg-amber-500', 
        secondary: 'bg-amber-600', 
        accent: 'text-amber-200',
        glow: 'shadow-amber-500/20',
        gradient: 'from-amber-600 to-orange-900'
      };
      case 'emerald': return {
        primary: 'bg-emerald-500',
        secondary: 'bg-emerald-600',
        accent: 'text-emerald-200',
        glow: 'shadow-emerald-500/20',
        gradient: 'from-emerald-600 to-teal-900'
      };
      case 'rose': return {
        primary: 'bg-rose-500',
        secondary: 'bg-rose-600',
        accent: 'text-rose-200',
        glow: 'shadow-rose-500/20',
        gradient: 'from-rose-600 to-red-900'
      };
      case 'slate': return {
        primary: 'bg-slate-500',
        secondary: 'bg-slate-600',
        accent: 'text-slate-200',
        glow: 'shadow-slate-500/20',
        gradient: 'from-slate-600 to-zinc-900'
      };
      default: return { 
        primary: 'bg-blue-500', 
        secondary: 'bg-blue-600', 
        accent: 'text-blue-200',
        glow: 'shadow-blue-500/20',
        gradient: 'from-blue-600 to-cyan-900'
      };
    }
  };

  const colors = getColors();

  if (mode === 'classic') {
    let classicStackSize = 0;
    if (amount >= 100) classicStackSize = 12;
    else if (amount >= 50) classicStackSize = 10;
    else if (amount >= 20) classicStackSize = 8;
    else if (amount >= 10) classicStackSize = 6;
    else if (amount >= 5) classicStackSize = 4;
    else if (amount >= 3) classicStackSize = 2;
    else classicStackSize = 0;

    return (
      <div className={cn("relative flex items-center justify-center h-48 w-full overflow-visible px-3", className)}>
        <div className={cn("absolute -inset-8 blur-[60px] opacity-20 rounded-full", colors.primary)} />

        <div className="relative h-full w-full flex items-center justify-center">
          {[...Array(classicStackSize)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: (i - classicStackSize / 2) * 8,
                x: (i - classicStackSize / 2) * 15,
                y: -10 - (i * 2)
              }}
              className={cn(
                "absolute w-24 h-36 rounded-xl border border-white/10 shadow-lg",
                "bg-gradient-to-br from-slate-800 to-slate-950"
              )}
            >
              <div className="absolute inset-1 rounded-[10px] border border-white/5 flex items-center justify-center opacity-20">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              {i % 2 === 0 && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-30 rounded-xl" />
              )}
            </motion.div>
          ))}

          <motion.div
            animate={{
              y: [0, -5, 0],
              rotateY: [0, 5, 0, -5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={cn(
              "relative z-10 w-32 h-44 rounded-2xl p-0.5 shadow-2xl overflow-hidden",
              "bg-gradient-to-b", colors.gradient
            )}
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)]" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

            <div className="absolute top-0 left-0 right-0 h-8 bg-white/10 flex items-center justify-center">
              <div className="w-full h-[1px] bg-white/20 animate-pulse" />
            </div>

            <div className="h-full w-full flex flex-col items-center justify-center border border-white/20 rounded-[14px] p-4 relative overflow-hidden">
              <div className={cn("w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3 shadow-inner")}>
                {amount < 5 && <Zap className={cn("w-8 h-8", colors.accent)} />}
                {amount >= 5 && amount < 20 && <Sparkles className={cn("w-8 h-8", colors.accent)} />}
                {amount >= 20 && amount < 50 && <Trophy className={cn("w-8 h-8", colors.accent)} />}
                {amount >= 50 && <GraduationCap className={cn("w-8 h-8", colors.accent)} />}
              </div>

              <div className="text-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Official</p>
                <p className="text-lg font-black italic text-white leading-none">BOOSTER</p>
                <div className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter mx-auto w-fit", colors.primary, "text-white")}>
                  Series 1
                </div>
              </div>

              <div className="absolute top-1 left-4 right-4 flex justify-between">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 h-2 bg-black/20 rounded-full" />
                ))}
              </div>
              <div className="absolute bottom-1 left-4 right-4 flex justify-between">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 h-2 bg-black/20 rounded-full" />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const densityMultiplier = density === 'dense' ? 1.4 : 1;

  let stackSize = 0;
  if (amount >= 100) stackSize = 16;
  else if (amount >= 50) stackSize = 12;
  else if (amount >= 20) stackSize = 9;
  else if (amount >= 10) stackSize = 7;
  else if (amount >= 5) stackSize = 5;
  else if (amount >= 3) stackSize = 3;
  else stackSize = 1;

  stackSize = Math.max(1, Math.round(stackSize * densityMultiplier));

  const resolvedLayout: BoosterVisualLayout = layoutStyle === 'auto'
    ? amount >= 100
      ? 'pile'
      : amount >= 50
        ? 'mountain'
        : amount >= 20
          ? 'double-crate'
          : amount >= 10
            ? 'tower'
          : amount >= 5
            ? 'fan-wide'
            : 'fan'
    : layoutStyle;

  const resolvedFanCardCount = typeof fanCardCount === 'number'
    ? Math.max(1, Math.floor(fanCardCount))
    : amount;
  const backgroundCardCount = resolvedLayout === 'fan'
    ? Math.max(0, Math.min(7, resolvedFanCardCount - 1))
    : stackSize;
  const isFanLayout = resolvedLayout === 'fan';

  const bgStackTransforms = [...Array(backgroundCardCount)].map((_, i) => {
    if (resolvedLayout === 'fan') {
      // Symmetric fan behind the front card: pair rows (2 + 2 + 2).
      const depth = Math.floor(i / 2);
      const side = i % 2 === 0 ? -1 : 1;
      const spreadBase = 18 + Math.max(0, backgroundCardCount - 2) * 1.5;
      return {
        x: side * (spreadBase + depth * 16),
        y: 14 + depth * 10,
        rotate: side * (13 + depth * 4),
        scale: Math.max(0.86, 1 - depth * 0.06),
      };
    }

    if (resolvedLayout === 'fan-wide') {
      const centered = i - (stackSize - 1) / 2;
      const distance = Math.abs(centered);
      const spread = Math.min(24, 12 + stackSize * 0.7);
      return {
        x: centered * spread,
        y: 14 + distance * 2.3,
        rotate: centered * 11,
        scale: Math.max(0.8, 0.94 - distance * 0.02),
      };
    }

    if (resolvedLayout === 'fan-cascade') {
      const lanes = 3;
      const lane = i % lanes;
      const laneIndex = Math.floor(i / lanes);
      const centered = laneIndex - (Math.ceil(stackSize / lanes) - 1) / 2;
      const laneOffset = (lane - 1) * 7;
      return {
        x: centered * 19 + laneOffset,
        y: 10 + lane * 8 + Math.abs(centered) * 1.6,
        rotate: centered * 9 + laneOffset * 0.35,
        scale: Math.max(0.8, 0.96 - lane * 0.05),
      };
    }

    if (resolvedLayout === 'fan-ring') {
      const t = stackSize <= 1 ? 0.5 : i / (stackSize - 1);
      const angleStart = (-150 * Math.PI) / 180;
      const angleEnd = (-30 * Math.PI) / 180;
      const angle = angleStart + (angleEnd - angleStart) * t;
      const radiusX = 56;
      const radiusY = 28;
      return {
        x: Math.cos(angle) * radiusX,
        y: 30 + Math.sin(angle) * radiusY,
        rotate: (angle * 180) / Math.PI + 90,
        scale: 0.88,
      };
    }

    if (resolvedLayout === 'pile') {
      const ring = Math.max(0, Math.floor(Math.sqrt(i)));
      const base = ring * ring;
      const indexInRing = i - base;
      const countInRing = Math.max(1, (ring + 1) * 2);
      const angle = (indexInRing / countInRing) * Math.PI * 2;
      const radius = 10 + ring * 12;
      return {
        x: Math.cos(angle) * radius,
        y: 18 + Math.sin(angle) * 10 - ring * 3,
        rotate: Math.sin(angle) * 8,
        scale: Math.max(0.82, 1 - ring * 0.05),
      };
    }

    if (resolvedLayout === 'pyramid') {
      const row = Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
      const firstInRow = (row * (row + 1)) / 2;
      const indexInRow = i - firstInRow;
      const cardsInRow = row + 1;
      return {
        x: (indexInRow - (cardsInRow - 1) / 2) * 20,
        y: 30 - row * 15,
        rotate: (indexInRow - (cardsInRow - 1) / 2) * 4,
        scale: 1 - row * 0.04,
      };
    }

    if (resolvedLayout === 'mountain') {
      const row = Math.floor(Math.sqrt(i * 2));
      const indexInRow = i - (row * (row + 1)) / 2;
      const cardsInRow = row + 1;
      return {
        x: (indexInRow - (cardsInRow - 1) / 2) * 16,
        y: 28 - row * 14,
        rotate: (indexInRow - (cardsInRow - 1) / 2) * 3,
        scale: 1 - row * 0.04,
      };
    }

    if (resolvedLayout === 'double-crate') {
      const columns = 3;
      const row = Math.floor(i / (columns * 2));
      const indexInBand = i % (columns * 2);
      const crateSide = indexInBand < columns ? -1 : 1;
      const col = indexInBand % columns;
      return {
        x: crateSide * 42 + (col - 1) * 14,
        y: 16 - row * 14,
        rotate: crateSide * 4 + (col - 1) * 1.5,
        scale: 0.92,
      };
    }

    if (resolvedLayout === 'crate') {
      const columns = 4;
      const row = Math.floor(i / columns);
      const col = i % columns;
      return {
        x: (col - 1.5) * 18,
        y: 16 - row * 14,
        rotate: (col - 1.5) * 2,
        scale: 0.94,
      };
    }

    if (resolvedLayout === 'wall') {
      const columns = 5;
      const row = Math.floor(i / columns);
      const col = i % columns;
      return {
        x: (col - 2) * 17,
        y: 28 - row * 12,
        rotate: row % 2 === 0 ? -1.5 : 1.5,
        scale: 0.9,
      };
    }

    if (resolvedLayout === 'zigzag') {
      const row = Math.floor(i / 2);
      const side = i % 2 === 0 ? -1 : 1;
      return {
        x: side * (20 + row * 2),
        y: 22 - row * 11,
        rotate: side * (6 - Math.min(row, 4)),
        scale: 0.94,
      };
    }

    if (resolvedLayout === 'tower') {
      const lane = i % 3;
      const step = Math.floor(i / 3);
      return {
        x: (lane - 1) * 20,
        y: 20 - step * 12,
        rotate: (lane - 1) * 4,
        scale: 0.96,
      };
    }

    return {
      x: (i - stackSize / 2) * 14,
      y: 8 - i * 2,
      rotate: (i - stackSize / 2) * 6,
      scale: 0.95,
    };
  });

  return (
    <div className={cn("relative flex items-center justify-center h-48 w-full overflow-visible px-3", className)}>
      <div className="absolute -inset-6 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className={cn("absolute -inset-8 blur-[56px] opacity-35 rounded-full", colors.primary)} />
      <div className={cn("absolute bottom-4 left-1/2 -translate-x-1/2 w-44 h-8 rounded-full blur-2xl opacity-25", colors.secondary)} />

      <div className="relative h-full w-full flex items-center justify-center">
        {resolvedLayout === 'crate' && (
          <div className="absolute bottom-4 w-[184px] h-[94px] border border-white/15 rounded-2xl bg-black/15 backdrop-blur-sm shadow-inner" />
        )}
        {resolvedLayout === 'double-crate' && (
          <>
            <div className="absolute bottom-4 -translate-x-10 w-[116px] h-[90px] border border-white/15 rounded-2xl bg-black/15 backdrop-blur-sm shadow-inner" />
            <div className="absolute bottom-4 translate-x-10 w-[116px] h-[90px] border border-white/15 rounded-2xl bg-black/15 backdrop-blur-sm shadow-inner" />
          </>
        )}

        {bgStackTransforms.map((transform, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: transform.scale,
              rotate: transform.rotate,
              x: transform.x,
              y: transform.y
            }}
            transition={{ duration: 0.28, delay: i * 0.03 }}
            className={cn(
              "absolute rounded-xl shadow-lg",
              isFanLayout ? "w-24 h-36 border border-white/20" : "w-20 h-[7.5rem] border border-white/10",
              isFanLayout ? cn("bg-gradient-to-b", colors.gradient) : "bg-gradient-to-br from-slate-800 to-slate-950",
              i % 3 === 0 && "brightness-110"
            )}
          >
            <div className={cn("absolute inset-1 rounded-[10px] flex items-center justify-center", isFanLayout ? "border border-white/10 opacity-25" : "border border-white/5 opacity-20")}>
              <GraduationCap className="w-7 h-7 text-white" />
            </div>

            {i % 2 === 0 && (
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-30 rounded-xl" />
            )}
          </motion.div>
        ))}

        <motion.div
          animate={isFanLayout
            ? {
                y: [6, 4, 6],
                rotate: [0.25, 0, 0.25],
                rotateY: [0, 1.5, 0, -1.5, 0],
              }
            : {
                y: [0, -5, 0],
                rotateY: [0, 5, 0, -5, 0],
              }}
          transition={{
            duration: isFanLayout ? 3.8 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "relative z-10 w-32 h-44 rounded-2xl p-0.5 shadow-2xl overflow-hidden",
            isFanLayout && "scale-[0.99]",
            "bg-gradient-to-b", colors.gradient, colors.glow
          )}
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.22)_45%,transparent_70%)] opacity-60" />

          <div className="absolute top-0 left-0 right-0 h-8 bg-white/10 flex items-center justify-center">
            <div className="w-full h-[1px] bg-white/20 animate-pulse" />
          </div>

          <div className="h-full w-full flex flex-col items-center justify-center border border-white/20 rounded-[14px] p-4 relative overflow-hidden">
            <div className={cn("w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3 shadow-inner")}>
              {amount < 5 && <Zap className={cn("w-8 h-8", colors.accent)} />}
              {amount >= 5 && amount < 20 && <Sparkles className={cn("w-8 h-8", colors.accent)} />}
              {amount >= 20 && amount < 50 && <Trophy className={cn("w-8 h-8", colors.accent)} />}
              {amount >= 50 && <GraduationCap className={cn("w-8 h-8", colors.accent)} />}
            </div>

            <div className="text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Official</p>
              <p className="text-lg font-black italic text-white leading-none">BOOSTER</p>
              <div className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter mx-auto w-fit", colors.primary, "text-white")}>
                Series 1
              </div>
            </div>

            <div className="absolute top-1 left-4 right-4 flex justify-between">
              {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 h-2 bg-black/20 rounded-full" />
              ))}
            </div>
            <div className="absolute bottom-1 left-4 right-4 flex justify-between">
              {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 h-2 bg-black/20 rounded-full" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
