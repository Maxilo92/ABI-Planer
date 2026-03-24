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
      
      case 'shiny-v2': 
        // 03 Premium Crystal Glass: Clean surface without redundant border to prevent corner artifacts
        return "backdrop-blur-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] opacity-100 after:absolute after:inset-0 after:bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.01)_10%,rgba(255,255,255,0.4)_47%,rgba(255,255,255,0.6)_50%,rgba(255,255,255,0.4)_53%,rgba(255,255,255,0.01)_90%,transparent_100%)] after:opacity-95 after:mix-blend-color-dodge before:absolute before:inset-0 before:bg-[url('https://grainy-gradients.vercel.app/noise.svg')] before:opacity-[0.04] before:pointer-events-none";

      case 'blckshiny':
        return "bg-[linear-gradient(45deg,rgba(255,255,255,0.2),transparent,rgba(255,255,255,0.1))] mix-blend-color-dodge shadow-[inset_0_0_30px_rgba(255,255,255,0.2)] opacity-80";

      default:
        return "";
    }
  };

  const isGlass = variant === 'shiny-v2';
  const getTintOpacity = () => '25'; // Vivid tint (approx 15%)

  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none z-20 transition-all duration-500",
        isGlass && "will-change-[backdrop-filter,transform]",
        getOverlayStyles()
      )}
      style={isGlass && tintColor ? { backgroundColor: `${tintColor}${getTintOpacity()}` } : undefined}
    />
  );
  };
