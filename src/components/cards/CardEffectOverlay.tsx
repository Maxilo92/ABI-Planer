'use client';

import React from 'react';
import { CardVariant } from '@/types/cards';
import { cn } from '@/lib/utils';

export const CardEffectOverlay: React.FC<{ 
  variant: CardVariant; 
  opacity?: number;
  tintColor?: string;
}> = ({ 
  variant, 
  opacity = 0.3,
  tintColor
}) => {
  if (variant === 'normal') return null;

  const getOverlayStyles = () => {
    switch (variant) {
      case 'holo':
        // 02 Holo Oil-Slick: More intense, complex iridescent oil film
        return "bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.5)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(232,121,249,0.5)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(163,230,81,0.3)_0%,transparent_70%),radial-gradient(circle_at_10%_90%,rgba(251,191,36,0.3)_0%,transparent_40%)] mix-blend-color-dodge opacity-90 shadow-[inset_0_0_100px_rgba(255,255,255,0.2)] brightness-110";
      
      case 'shiny': 
        // Classic Sparkly/Glitter: More traditional "shiny" look
        return "bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-[0.15] mix-blend-overlay after:absolute after:inset-0 after:bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.4),transparent,rgba(255,255,255,0.4),transparent)] after:animate-[spin_4s_linear_infinite] after:mix-blend-overlay after:opacity-60 before:absolute before:inset-0 before:bg-[radial-gradient(circle,white_1px,transparent_1px)] before:bg-[length:15cqw_15cqw] before:opacity-30 before:animate-pulse shadow-[inset_0_0_40px_rgba(255,255,255,0.3)]";

      case 'black_shiny_holo':
        // Cosmic Void: Deep space effect for Black Shiny
        return "bg-black opacity-80 after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.4)_0%,transparent_70%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.4)_0%,transparent_70%)] after:mix-blend-screen before:absolute before:inset-0 before:bg-[url('https://grainy-gradients.vercel.app/noise.svg')] before:opacity-20 before:mix-blend-overlay after:animate-pulse shadow-[inset_0_0_60px_rgba(255,255,255,0.1)]";

      default:
        return "";
    }
  };

  const isBlackShiny = variant === 'black_shiny_holo';
  const getTintOpacity = () => '25'; // Vivid tint (approx 15%)

  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none z-20 transition-all duration-500",
        getOverlayStyles()
      )}
      style={isBlackShiny && tintColor ? { backgroundColor: `${tintColor}${getTintOpacity()}` } : undefined}
    />
  );
};
