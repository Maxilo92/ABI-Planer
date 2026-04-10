'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CardData } from '@/types/cards';
import { getCard } from '@/constants/cardRegistry';
import { TeacherCard } from './TeacherCard';
import { SupportLayout } from './templates/SupportLayout';
import { CardBack } from './CardBack';
import { cn } from '@/lib/utils';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';

interface CardRendererProps {
  data: CardData;
  className?: string;
  isFlippedExternally?: boolean;
  isLocked?: boolean;
  interactive?: boolean;
  upgradeInfo?: { oldLevel: number, newLevel: number };
  isCover?: boolean;
  onRemove?: (e: React.MouseEvent) => void;
  onSetCover?: (e: React.MouseEvent) => void;
  showDeckControls?: boolean;
}

/**
 * Main dispatcher for all card types.
 * Handles the 3D flip animation and locked state.
 */
const CardRendererComponent: React.FC<CardRendererProps> = ({
  data,
  className,
  isFlippedExternally,
  isLocked = false,
  interactive = true,
  upgradeInfo,
  isCover,
  onRemove,
  onSetCover,
  showDeckControls
}) => {
  const [isFlippedInternally, setIsFlippedInternally] = useState(isFlippedExternally ?? false);
  const [prevExternal, setPrevExternal] = useState(isFlippedExternally);
  
  useEffect(() => {
    if (isFlippedExternally !== undefined && isFlippedExternally !== prevExternal) {
      setIsFlippedInternally(isFlippedExternally);
      setPrevExternal(isFlippedExternally);
    }
  }, [isFlippedExternally, prevExternal]);

  const isFlipped = isLocked ? false : isFlippedInternally;
  const registryMetadata = getCard(data.fullId || data.id);
  
  // Create metadata from data if not found in registry (fallback for dynamic cards)
  const metadata = registryMetadata || (
    (data.type || data.hp || data.attacks) 
      ? { 
          ...data, 
          type: data.type || (data.hp || data.attacks ? 'teacher' : 'teacher'),
          cardNumber: data.cardNumber || "???",
          color: data.color || "#6366f1"
        } as any
      : null
  );

  const isLoading = !metadata;

  return (
    <BoneyardSkeleton name="card-renderer" loading={isLoading}>
      <div
        className={cn("relative aspect-[2.5/3.5] perspective-1000 @container rounded-xl overflow-hidden isolate", className, interactive && !isLocked && "cursor-pointer")}
        style={{ containerType: 'inline-size' }}
        onClick={() => {
          if (interactive && !isLocked) {
            setIsFlippedInternally(!isFlippedInternally);
          }
        }}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 0 : 180 }}
          initial={{ rotateY: isFlipped ? 0 : 180 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full h-full relative will-change-transform preserve-3d"
        >
          <CardBack isLocked={isLocked} cardNumber={metadata?.cardNumber || "???"} />

          {!isLocked && metadata && (
            <div className="absolute inset-0 backface-hidden" style={{ transform: "translateZ(1px)" }}>
              {metadata.type === 'teacher' ? (
                <TeacherCard
                  data={data}
                  frontOnly
                  upgradeInfo={upgradeInfo}
                  isCover={isCover}
                  onRemove={onRemove}
                  onSetCover={onSetCover}
                  showDeckControls={showDeckControls}
                />
              ) : metadata.type === 'support' ? (
                <SupportLayout
                  data={data}
                  metadata={metadata as any}
                  styleVariant={data.style || 'modern-premium'}
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-800 rounded-xl flex flex-col items-center justify-center text-white p-4 text-center">
                  <p className="font-black uppercase text-[4cqw] mb-2">Unknown Type</p>
                  <p className="text-[3cqw] opacity-50">{(metadata as any).type}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </BoneyardSkeleton>
  );
};

const areRendererPropsEqual = (prev: CardRendererProps, next: CardRendererProps) => {
  return (
    prev.data === next.data &&
    prev.className === next.className &&
    prev.isFlippedExternally === next.isFlippedExternally &&
    prev.isLocked === next.isLocked &&
    prev.interactive === next.interactive &&
    prev.isCover === next.isCover &&
    prev.showDeckControls === next.showDeckControls &&
    prev.upgradeInfo?.oldLevel === next.upgradeInfo?.oldLevel &&
    prev.upgradeInfo?.newLevel === next.upgradeInfo?.newLevel &&
    prev.onRemove === next.onRemove &&
    prev.onSetCover === next.onSetCover
  );
};

CardRendererComponent.displayName = 'CardRenderer';

export const CardRenderer = React.memo(CardRendererComponent, areRendererPropsEqual);
