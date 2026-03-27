import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Trophy, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoosterPackVisualProps {
  amount: number;
  color: 'blue' | 'purple' | 'amber';
  className?: string;
}

export const BoosterPackVisual: React.FC<BoosterPackVisualProps> = ({ amount, color, className }) => {
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
  
  // Calculate how many cards to show in the background stack
  // Starter: 1 pack, 0 extra cards
  // Bundle: 1 pack, 4 cards
  // Elite: 1 pack, 8 cards
  const stackSize = amount === 1 ? 0 : amount === 5 ? 3 : 6;

  return (
    <div className={cn("relative flex items-center justify-center h-48 w-full", className)}>
      {/* Background Glow */}
      <div className={cn("absolute inset-0 blur-[60px] opacity-20 rounded-full", colors.primary)} />

      {/* Card Stack (Behind the Pack) */}
      <div className="relative h-full w-full flex items-center justify-center">
        {[...Array(stackSize)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              rotate: (i - stackSize / 2) * 8,
              x: (i - stackSize / 2) * 15,
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
            {/* Holographic shimmer on some cards */}
            {i % 2 === 0 && (
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-30 rounded-xl" />
            )}
          </motion.div>
        ))}

        {/* The Main Booster Pack */}
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
          {/* Pack Textures */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          
          {/* Shiny Edge */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-white/10 flex items-center justify-center">
             <div className="w-full h-[1px] bg-white/20 animate-pulse" />
          </div>

          <div className="h-full w-full flex flex-col items-center justify-center border border-white/20 rounded-[14px] p-4 relative overflow-hidden">
             {/* Icon Circle */}
             <div className={cn("w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3 shadow-inner")}>
                {amount === 1 && <Zap className={cn("w-8 h-8", colors.accent)} />}
                {amount === 5 && <Sparkles className={cn("w-8 h-8", colors.accent)} />}
                {amount === 12 && <Trophy className={cn("w-8 h-8", colors.accent)} />}
             </div>

             <div className="text-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Official</p>
                <p className="text-lg font-black italic text-white leading-none">BOOSTER</p>
                <div className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter mx-auto w-fit", colors.primary, "text-white")}>
                   Series 1
                </div>
             </div>

             {/* Rip Lines (Top/Bottom) */}
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
