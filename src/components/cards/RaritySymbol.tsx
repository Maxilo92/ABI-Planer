import React from 'react';
import { Rarity, CardVariant } from '@/types/cards';
import { cn } from '@/lib/utils';

interface RaritySymbolProps {
  rarity: Rarity;
  variant?: CardVariant;
  color?: string;
  size?: number;
  className?: string;
}

export const RaritySymbol: React.FC<RaritySymbolProps> = ({ 
  rarity, 
  variant = 'normal',
  color = "white",
  size = 32,
  className
}) => {
  const renderShape = () => {
    const isHolo = variant === 'holo';
    const isBlck = variant === 'black_shiny_holo';

    const commonProps = {
      fill: color,
      stroke: isHolo ? "url(#holoGradient)" : (isBlck ? "white" : "white"),
      strokeWidth: isHolo ? "10" : "8",
      strokeLinejoin: "round" as const,
    };

    switch (rarity) {
      case 'common':
        return <circle cx="50" cy="50" r="40" {...commonProps} />;
      
      case 'rare':
        return <polygon points="50,15 90,85 10,85" {...commonProps} />;
      
      case 'epic':
        return <rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" {...commonProps} />;
      
      case 'mythic':
        return <polygon points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30" {...commonProps} />;
      
      case 'legendary':
        return (
          <polygon 
            points="50,5 63,38 98,38 70,59 78,92 50,72 22,92 30,59 2,38 37,38" 
            {...commonProps}
            strokeWidth={isHolo ? "8" : "6"}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg 
        viewBox="0 0 100 100" 
        style={size > 0 ? { width: size, height: size } : undefined}
        className={cn(
          "w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]",
          variant?.includes('shiny') && "drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" // Aura Glow
        )}
      >
        <defs>
          <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" /> {/* Silver */}
            <stop offset="25%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#93c5fd" /> {/* Light Blue */}
            <stop offset="75%" stopColor="#c4b5fd" /> {/* Soft Lavender */}
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
        </defs>
        {renderShape()}
      </svg>
    </div>
  );
};
