"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DiceRoller, { DiceRollerRef } from "./DiceRoller";
import { CardData } from "@/types/cards";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CombatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  supportCard: CardData;
  multiplier: number;
  result: number;
}

const CombatOverlay: React.FC<CombatOverlayProps> = ({
  isOpen,
  onClose,
  supportCard,
  multiplier,
  result,
}) => {
  const diceRef = useRef<DiceRollerRef>(null);
  const [showResult, setShowResult] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowResult(false);
      setIsRolling(true);
      // Small delay before rolling
      const timer = setTimeout(() => {
        diceRef.current?.roll(result).then(() => {
          setIsRolling(false);
          setShowResult(true);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, result]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 text-center border-b border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Support-Karte eingesetzt!
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {supportCard.name}
              </p>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-8 flex flex-col items-center gap-6 sm:gap-8">
              {/* Dice Area */}
              <div className="py-6 sm:py-12">
                <DiceRoller ref={diceRef} />
              </div>

              {/* Result Area */}
              <div className="min-h-24 flex flex-col items-center justify-center px-2">
                <AnimatePresence mode="wait">
                  {isRolling ? (
                    <motion.p
                      key="rolling"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-lg sm:text-xl font-medium text-brand animate-pulse"
                    >
                      Würfeln...
                    </motion.p>
                  ) : showResult ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-3xl font-bold">
                        <span className="text-brand">{result}</span>
                        <span className="text-muted-foreground text-lg sm:text-xl">×</span>
                        <span className="text-primary">{multiplier}</span>
                        <span className="text-muted-foreground text-lg sm:text-xl">=</span>
                        <span className="text-destructive">{result * multiplier} Schaden</span>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground mt-2">
                        Kritischer Treffer!
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 bg-muted/30 flex justify-center">
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Button 
                      onClick={onClose}
                      className="px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:scale-105 transition-transform"
                    >
                      Schließen
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close Icon */}
            {showResult && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CombatOverlay;
