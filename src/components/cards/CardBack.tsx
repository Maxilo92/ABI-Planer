'use client';

import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { CardEffectOverlay } from './CardEffectOverlay';
import { cn } from '@/lib/utils';

interface CardBackProps {
  isLocked?: boolean;
  cardNumber?: string;
}

export const CardBack: React.FC<CardBackProps> = ({ isLocked, cardNumber }) => {
  return (
    <div 
      className={cn(
        "absolute inset-0 backface-hidden p-[8%] flex flex-col items-center justify-center overflow-hidden rounded-xl",
          "absolute inset-0 backface-hidden p-[8%] flex flex-col items-center justify-center overflow-hidden rounded-xl",
        "border-[2cqw] border-white/20 bg-neutral-950 shadow-2xl",
        isLocked ? "grayscale-[0.5] opacity-90" : ""
      )}
      style={{ transform: "rotateY(180deg) translateZ(1px)" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
      <CardEffectOverlay variant="normal" tintColor="#000000" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className={cn(
          "w-[25%] aspect-square flex items-center justify-center mb-[4%]",
          isLocked ? "bg-neutral-900" : ""
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

      {isLocked && cardNumber && (
        <div className="absolute top-[8%] right-[8%] z-30">
          <div className="bg-white/5 text-white/20 px-[2cqw] py-[0.5cqw] text-[3cqw] font-black rounded-full border border-white/5">
            {cardNumber}
          </div>
        </div>
      )}

      {isLocked && (
        <div className="absolute inset-x-0 bottom-[15%] flex flex-col items-center">
           <div className="w-[10cqw] h-[1cqw] bg-white/10 rounded-full mb-2" />
           <div className="text-[2.5cqw] font-bold text-white/20 uppercase tracking-widest">Mystery Card</div>
        </div>
      )}
    </div>
  );
};
