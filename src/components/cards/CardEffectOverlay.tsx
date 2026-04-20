'use client';

import React from 'react';
import { CardVariant } from '@/types/cards';
import { cn } from '@/lib/utils';

export const CardEffectOverlay: React.FC<{ 
  variant: CardVariant; 
  tintColor?: string;
  isIconic?: boolean;
  effectsEnabled?: boolean;
  isCombat?: boolean;
  forceVisible?: boolean;
}> = ({ 
  variant, 
  tintColor,
  isIconic,
  effectsEnabled = true,
  isCombat = false,
  forceVisible = false,
}) => {
  if (!effectsEnabled) return null;
  if (variant === 'normal' && !isIconic && !forceVisible) return null;

  const getOverlayStyles = () => {
    if (variant === 'normal' && forceVisible) {
      return isCombat
        ? cn(
            "bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.1)_20%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0.1)_80%,rgba(255,255,255,0)_100%)]",
            "bg-[length:200%_100%] bg-no-repeat animate-[shimmer_14s_infinite_linear] mix-blend-screen opacity-70",
            "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.14)_0%,transparent_72%)]"
          )
        : "bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.05)_20%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0.05)_80%,rgba(255,255,255,0)_100%)] bg-[length:200%_100%] bg-no-repeat animate-[shimmer_18s_infinite_linear] mix-blend-overlay opacity-55";
    }

    if (isIconic) {
      // Iconic Golden Aura: Premium gold shimmer with particles
      // Fixed: Using a much larger inset and centering to prevent cut-off during rotation
      const iconicBase = isCombat
        ? "bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.35)_0%,transparent_72%)] mix-blend-screen"
        : "bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.25)_0%,transparent_70%)]";
      
      const sunburstClass = isCombat
        ? "after:absolute after:-inset-[100%] after:bg-[repeating-conic-gradient(from_0deg,rgba(251,191,36,0.12)_0deg,rgba(251,191,36,0.12)_10deg,transparent_10deg,transparent_20deg)] after:animate-[spin_12s_linear_infinite] after:opacity-55"
        : "after:absolute after:-inset-[100%] after:bg-[repeating-conic-gradient(from_0deg,rgba(251,191,36,0.1)_0deg,rgba(251,191,36,0.1)_10deg,transparent_10deg,transparent_20deg)] after:animate-[spin_15s_linear_infinite] after:opacity-40";

      return cn(
        iconicBase,
        sunburstClass,
        isCombat ? "shadow-[inset_0_0_110px_rgba(251,191,36,0.4)]" : "shadow-[inset_0_0_80px_rgba(251,191,36,0.3)]"
      );
    }

    switch (variant) {
      case 'holo':
        // 02 Holo Oil-Slick: Combat uses screen blend for dark board visibility
        return isCombat
          ? "bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.7)_0%,transparent_52%),radial-gradient(circle_at_80%_80%,rgba(232,121,249,0.65)_0%,transparent_52%),radial-gradient(circle_at_50%_50%,rgba(163,230,81,0.5)_0%,transparent_72%),radial-gradient(circle_at_10%_90%,rgba(251,191,36,0.52)_0%,transparent_44%)] mix-blend-screen opacity-95 shadow-[inset_0_0_120px_rgba(255,255,255,0.38)] brightness-125 saturate-150 animate-pulse"
          : "bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.6)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(232,121,249,0.6)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(163,230,81,0.5)_0%,transparent_70%),radial-gradient(circle_at_10%_90%,rgba(251,191,36,0.5)_0%,transparent_40%)] mix-blend-color-dodge opacity-100 shadow-[inset_0_0_120px_rgba(255,255,255,0.4)] brightness-125 animate-pulse";
      
      case 'shiny': 
        // 03 Shiny Sparkle: Multi-layered metallic shimmer with moving highlight
        return isCombat
          ? cn(
              "bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_20%,rgba(255,255,255,0.55)_42%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0.55)_58%,rgba(255,255,255,0.2)_80%,rgba(255,255,255,0)_100%)]",
              "bg-[length:200%_100%] bg-no-repeat animate-[shimmer_10s_infinite_linear] mix-blend-screen opacity-95 shadow-[inset_0_0_110px_rgba(255,255,255,0.35)]",
              "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.32)_0%,transparent_72%)]",
              "after:absolute after:inset-0 after:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_3px)] after:opacity-60 after:mix-blend-screen"
            )
          : cn(
              "bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.1)_20%,rgba(255,255,255,0.4)_40%,rgba(255,255,255,0.7)_50%,rgba(255,255,255,0.4)_60%,rgba(255,255,255,0.1)_80%,rgba(255,255,255,0)_100%)]",
              "bg-[length:200%_100%] bg-no-repeat animate-[shimmer_12s_infinite_linear] mix-blend-overlay opacity-100 shadow-[inset_0_0_100px_rgba(255,255,255,0.3)]",
              "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_0%,transparent_70%)]",
              "after:absolute after:inset-0 after:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_3px)] after:opacity-50 after:mix-blend-color-dodge"
            );

      case 'black_shiny_holo':
        // Cosmic Void: Deep space effect for Black Shiny
        return isCombat
          ? "bg-black opacity-95 after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.7)_0%,transparent_72%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.68)_0%,transparent_72%)] after:mix-blend-screen before:absolute before:inset-0 before:bg-[repeating-radial-gradient(circle,rgba(255,255,255,0.18)_0px,rgba(255,255,255,0.18)_1px,transparent_1px,transparent_3px)] before:opacity-45 before:mix-blend-screen after:animate-pulse shadow-[inset_0_0_120px_rgba(255,255,255,0.26)]"
          : "bg-black opacity-90 after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.6)_0%,transparent_70%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.6)_0%,transparent_70%)] after:mix-blend-screen before:absolute before:inset-0 before:bg-[repeating-radial-gradient(circle,rgba(255,255,255,0.15)_0px,rgba(255,255,255,0.15)_1px,transparent_1px,transparent_3px)] before:opacity-30 before:mix-blend-overlay after:animate-pulse shadow-[inset_0_0_100px_rgba(255,255,255,0.2)]";

      default:
        return "";
    }
  };

  const isBlackShiny = variant === 'black_shiny_holo';
  const getTintOpacity = () => isCombat ? '55' : '40';

  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none z-25 transition-all duration-500 will-change-transform rounded-[inherit] [&::before]:rounded-[inherit] [&::after]:rounded-[inherit]",
        getOverlayStyles()
      )}
      style={isBlackShiny && tintColor ? { backgroundColor: `${tintColor}${getTintOpacity()}` } : undefined}
    />
  );
};
