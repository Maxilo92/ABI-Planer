'use client';

import React from 'react';
import { CardVariant } from '@/types/cards';
import { cn } from '@/lib/utils';

export const CardEffectOverlay: React.FC<{ 
  variant: CardVariant; 
  tintColor?: string;
  isIconic?: boolean;
}> = ({ 
  variant, 
  tintColor,
  isIconic
}) => {
  if (variant === 'normal' && !isIconic) return null;

  const getOverlayStyles = () => {
    if (isIconic) {
      // Iconic Golden Aura: Premium gold shimmer with particles
      return "bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.15)_0%,transparent_70%)] after:absolute after:inset-0 after:bg-[repeating-conic-gradient(from_0deg,rgba(251,191,36,0.05)_0deg,rgba(251,191,36,0.05)_10deg,transparent_10deg,transparent_20deg)] after:animate-[spin_20s_linear_infinite] after:opacity-20 shadow-[inset_0_0_80px_rgba(251,191,36,0.2)]";
    }

    switch (variant) {
      case 'holo':
        // 02 Holo Oil-Slick: More intense, complex iridescent oil film
        return "bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.5)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(232,121,249,0.5)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(163,230,81,0.3)_0%,transparent_70%),radial-gradient(circle_at_10%_90%,rgba(251,191,36,0.3)_0%,transparent_40%)] mix-blend-color-dodge opacity-90 shadow-[inset_0_0_100px_rgba(255,255,255,0.2)] brightness-110";
      
      case 'shiny': 
        // 03 Shiny Sparkle: Multi-layered, ultra-soft metallic shimmer
        // Keep the effect fully local (no remote texture fetch) to avoid first-render network latency.
        return cn(
          "bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.05)_20%,rgba(255,255,255,0.2)_40%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0.2)_60%,rgba(255,255,255,0.05)_80%,rgba(255,255,255,0)_100%)]",
          "bg-[length:200%_100%] animate-[shimmer_12s_infinite_linear] mix-blend-overlay opacity-90 shadow-[inset_0_0_100px_rgba(255,255,255,0.2)]",
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_0%,transparent_70%)]",
          "after:absolute after:inset-0 after:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)] after:opacity-30 after:mix-blend-color-dodge"
        );

      case 'black_shiny_holo':
        // Cosmic Void: Deep space effect for Black Shiny
        return "bg-black opacity-80 after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.4)_0%,transparent_70%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.4)_0%,transparent_70%)] after:mix-blend-screen before:absolute before:inset-0 before:bg-[repeating-radial-gradient(circle,rgba(255,255,255,0.09)_0px,rgba(255,255,255,0.09)_1px,transparent_1px,transparent_3px)] before:opacity-20 before:mix-blend-overlay after:animate-pulse shadow-[inset_0_0_60px_rgba(255,255,255,0.1)]";

      default:
        return "";
    }
  };

  const isBlackShiny = variant === 'black_shiny_holo';
  const getTintOpacity = () => '25'; // Vivid tint (approx 15%)

  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none z-20 transition-all duration-500 will-change-transform rounded-[inherit] overflow-hidden",
        getOverlayStyles()
      )}
      style={isBlackShiny && tintColor ? { backgroundColor: `${tintColor}${getTintOpacity()}` } : undefined}
    />
  );
};
