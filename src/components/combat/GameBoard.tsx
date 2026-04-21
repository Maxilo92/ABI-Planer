'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TeacherSpecCard } from '../cards/TeacherSpecCard';
import { Swords, Zap, X, Loader2, LogOut, Settings, Trophy, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { getCard } from '@/constants/cardRegistry';
import { InitialCardSelection } from './InitialCardSelection';
import { usePopupManager } from '@/modules/popup/usePopupManager';

interface GameBoardProps {
  matchData: any;
  currentUserId: string;
  onExit?: () => void;
}

const RARITY_BUTTON_STYLES: Record<string, { bg: string, border: string, text: string, desc: string, damage: string, shadow: string }> = {
  common: {
    bg: 'bg-slate-900/90',
    border: 'border-slate-500/30',
    text: 'text-slate-100',
    desc: 'text-slate-400',
    damage: 'text-slate-300',
    shadow: 'shadow-slate-900/50'
  },
  rare: {
    bg: 'bg-emerald-950/90',
    border: 'border-emerald-500/40',
    text: 'text-emerald-50',
    desc: 'text-emerald-300/60',
    damage: 'text-emerald-400',
    shadow: 'shadow-emerald-900/50'
  },
  epic: {
    bg: 'bg-purple-950/90',
    border: 'border-purple-500/40',
    text: 'text-purple-50',
    desc: 'text-purple-300/60',
    damage: 'text-purple-400',
    shadow: 'shadow-purple-900/50'
  },
  mythic: {
    bg: 'bg-red-950/90',
    border: 'border-red-500/40',
    text: 'text-red-50',
    desc: 'text-red-300/60',
    damage: 'text-red-400',
    shadow: 'shadow-red-900/50'
  },
  legendary: {
    bg: 'bg-black/95',
    border: 'border-amber-500/50',
    text: 'text-amber-50',
    desc: 'text-amber-200/40',
    damage: 'text-amber-500',
    shadow: 'shadow-amber-950/70'
  },
  iconic: {
    bg: 'bg-zinc-950/98',
    border: 'border-amber-500/60',
    text: 'text-white',
    desc: 'text-zinc-500',
    damage: 'text-amber-400',
    shadow: 'shadow-black'
  }
};

export const GameBoard: React.FC<GameBoardProps> = ({ 
  matchData, 
  currentUserId,
  onExit
}) => {
  const { confirm } = usePopupManager();
  const [focusState, setFocusState] = useState<{ card: any, index?: number, isBench: boolean } | null>(null);
  const [attackAnimation, setAttackAnimation] = useState<{ type: 'player' | 'opponent', damage: number, attackName: string } | null>(null);
  const [floatingDamage, setFloatingDamage] = useState<{ type: 'player' | 'opponent', value: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInitialCardSelection, setShowInitialCardSelection] = useState(false);
  
  const lastActionTimestamp = useRef<string | null>(null);

  const AI_BOT_ID = 'ai_bot';
  const AI_FIRST_NAMES = ['tom', 'mike', 'alex', 'leo', 'noah', 'luca', 'ben', 'jonas', 'felix', 'max', 'nico', 'david', 'sami', 'finn', 'timo'];

  // ── Perspective Guard: don't render if userId is empty (auth refresh) ──
  // Derive player/opponent robustly so transient auth states cannot swap perspectives.
  const isCurrentUserA = Boolean(currentUserId) && matchData.playerA_uid === currentUserId;
  const isCurrentUserB = Boolean(currentUserId) && matchData.playerB_uid === currentUserId;
  const isAiMatch = Boolean(matchData?.isAiMatch) || matchData?.playerA?.uid === AI_BOT_ID || matchData?.playerB?.uid === AI_BOT_ID;

  let player = isCurrentUserA ? matchData.playerA : matchData.playerB;
  let opponent = isCurrentUserA ? matchData.playerB : matchData.playerA;

  if (!isCurrentUserA && !isCurrentUserB && isAiMatch) {
    const playerIsA = matchData?.playerA?.uid !== AI_BOT_ID;
    player = playerIsA ? matchData.playerA : matchData.playerB;
    opponent = playerIsA ? matchData.playerB : matchData.playerA;
  }

  const stableAiDisplayName = useMemo(() => {
    if (opponent?.uid !== AI_BOT_ID) return opponent?.name || 'Gegner';

    const raw = String(opponent?.name || '').trim();
    if (/^ki-[a-z]+( \(ELO \d+\))?$/i.test(raw)) {
      return raw;
    }

    const matchSeed = String(matchData?.id || '0').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const firstName = AI_FIRST_NAMES[matchSeed % AI_FIRST_NAMES.length] || 'tom';
    const elo = typeof opponent?.elo === 'number' ? ` (ELO ${opponent.elo})` : '';
    return `ki-${firstName}${elo}`;
  }, [opponent?.uid, opponent?.name, opponent?.elo, matchData?.id]);

  const isMyTurn = matchData.currentTurn === currentUserId;
  const isFinished = matchData.status === 'finished';
  const winnerId = matchData.winner;
  const isDraw = isFinished && !winnerId;
  const iWon = winnerId === currentUserId;
  const iNeedReplacement = Boolean(player?.pendingReplacement);

  // Handle Action Animations based on actionLog
  useEffect(() => {
    if (!matchData.actionLog || matchData.actionLog.length === 0) return;
    
    const latestAction = matchData.actionLog[matchData.actionLog.length - 1];
    if (latestAction.timestamp === lastActionTimestamp.current) return;
    
    lastActionTimestamp.current = latestAction.timestamp;

    if (latestAction.type === 'attack') {
      const isActorMe = latestAction.actor === currentUserId;
      const animType = isActorMe ? 'player' : 'opponent';
      setAttackAnimation({
        type: animType,
        damage: latestAction.value || 0,
        attackName: latestAction.attackName || 'Angriff'
      });

      // Show floating damage number on the target
      setFloatingDamage({
        type: isActorMe ? 'opponent' : 'player',
        value: latestAction.value || 0,
      });
      
      // Auto-hide animations
      setTimeout(() => setAttackAnimation(null), 1500);
      setTimeout(() => setFloatingDamage(null), 2000);
    }
  }, [matchData.actionLog, currentUserId]);

  // Auto-close focus overlay when it's no longer our turn (prevent blocking AI response view)
  useEffect(() => {
    if (!isMyTurn && focusState && !focusState.isBench) {
      setFocusState(null);
    }
  }, [isMyTurn, focusState]);

  // Show initial card selection on first turn
  useEffect(() => {
    // Only show if it's the player's turn and this is the first action (match just started)
    const isFirstTurn = matchData.actionLog?.length === 1 && matchData.actionLog[0]?.type === 'match_start';
    const isMyTurn = matchData.currentTurn === currentUserId;
    const matchActive = matchData.status === 'active';
    
    setShowInitialCardSelection(isFirstTurn && isMyTurn && matchActive);
  }, [matchData.currentTurn, matchData.status, matchData.actionLog?.length, currentUserId]);

  const handleAction = async (action: any) => {
    if (!isMyTurn || isSubmitting || isFinished) return;

    if (action?.type === 'attack') {
      const attackIndex = action.attackIndex;
      if (typeof attackIndex !== 'number' || attackIndex < 0 || attackIndex >= activeActionAttacks.length) {
        alert('Dieser Angriff ist aktuell nicht verfuegbar.');
        return;
      }
    }
    
    setIsSubmitting(true);
    setFocusState(null);

    try {
      const submitCombatAction = httpsCallable(functions, 'submitCombatAction');
      await submitCombatAction({
        matchId: matchData.id,
        action: action
      });
    } catch (err) {
      console.error("Combat action failed:", err);
      alert("Aktion konnte nicht ausgeführt werden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSurrender = async () => {
    if (isSubmitting || isFinished) return;
    const confirmed = await confirm({
      title: 'Kampf aufgeben?',
      content: 'Möchtest du den Kampf wirklich aufgeben?',
      priority: 'high',
      confirmLabel: 'Aufgeben',
      confirmVariant: 'destructive',
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const submitCombatAction = httpsCallable(functions, 'submitCombatAction');
      await submitCombatAction({
        matchId: matchData.id,
        action: { type: 'surrender' }
      });
      setShowMenu(false);
      onExit?.();
    } catch (err) {
      console.error('Surrender failed:', err);
      alert('Aufgeben konnte nicht ausgefuehrt werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adaptToCardData = (combatCard: any): any => {
    if (!combatCard) return null;
    const registryCard = getCard(combatCard.cardId) as any;
    return {
      ...combatCard,
      ...registryCard,
      id: combatCard.cardId,
      // Behalte die variablen Werte vom Server bei
      hp: combatCard.hp_max || combatCard.maxHp || combatCard.hp || registryCard?.hp,
      level: combatCard.level || registryCard?.level || 1,
      variant: combatCard.variant || registryCard?.variant || 'normal',
    };
  };

  const playerActive = useMemo(() => adaptToCardData(player.activeCard), [player.activeCard]);
  const opponentActive = useMemo(() => adaptToCardData(opponent.activeCard), [opponent.activeCard]);
  const playerPoints = typeof player?.points === 'number' ? player.points : (player?.graveyard?.length || 0);
  const opponentPoints = typeof opponent?.points === 'number' ? opponent.points : (opponent?.graveyard?.length || 0);
  const canPaySwitch = playerPoints > 0;
  const activeActionAttacks = useMemo(() => {
    const attacks = player?.activeCard?.attacks;
    return Array.isArray(attacks) ? attacks.slice(0, 2) : [];
  }, [player?.activeCard?.instanceId, player?.activeCard?.attacks]);
  const isFocusOnCurrentActive = Boolean(
    focusState &&
    !focusState.isBench &&
    focusState.card?.instanceId &&
    player?.activeCard?.instanceId &&
    focusState.card.instanceId === player.activeCard.instanceId
  );

  useEffect(() => {
    if (!iNeedReplacement || !isMyTurn || isFinished || isSubmitting) return;
    if (focusState?.isBench) return;
    const firstBenchCard = player?.bench?.[0];
    if (firstBenchCard) {
      setFocusState({ card: firstBenchCard, index: 0, isBench: true });
    }
  }, [iNeedReplacement, isMyTurn, isFinished, isSubmitting, focusState, player?.bench]);

  // Perspective guard: show loading state if auth is refreshing
  if (!currentUserId) {
    return (
      <div className="relative w-full h-full bg-neutral-950 overflow-hidden flex items-center justify-center rounded-[2rem] xl:rounded-[2.5rem] 2xl:rounded-[3rem] border border-white/5 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Synchronisierung...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-neutral-950 overflow-hidden flex flex-col p-2 sm:p-4 lg:p-5 xl:p-6 2xl:p-8 font-sans select-none rounded-[2rem] xl:rounded-[2.5rem] 2xl:rounded-[3rem] border border-white/5 shadow-2xl">
      {/* Initial Card Selection Modal */}
      <AnimatePresence>
        {showInitialCardSelection && (
          <InitialCardSelection
            matchData={matchData}
            currentUserId={currentUserId}
            onClose={() => setShowInitialCardSelection(false)}
          />
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-500/20 to-transparent" />
        <div className="grid grid-cols-8 h-full w-full opacity-20">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/5" />
          ))}
        </div>
      </div>

      {/* Top Menu Bar */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 xl:top-5 xl:left-6 xl:right-6 2xl:top-6 2xl:left-8 2xl:right-8 z-50 pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          {/* Left: Player Points & Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-3 pointer-events-auto min-w-0">
            <button onClick={() => setShowMenu(true)} className="h-11 w-11 xl:h-12 xl:w-12 2xl:h-14 2xl:w-14 rounded-full bg-black/40 backdrop-blur-md hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors shadow-2xl shrink-0">
              <Settings className="w-5 h-5 xl:w-6 xl:h-6 2xl:w-6 2xl:h-6 text-white/60" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3 xl:gap-4 bg-black/40 backdrop-blur-md px-2.5 sm:px-4 xl:px-5 2xl:px-6 py-2 rounded-2xl border border-white/10 shadow-2xl">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 xl:w-5 xl:h-5 text-amber-500" />
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-white/40 tracking-widest hidden sm:inline">Punkte</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={cn("h-2 w-2 rounded-full", i <= opponentPoints ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/10")} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Opponent Points & Log */}
          <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-3 pointer-events-auto justify-end min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 xl:gap-5 bg-black/40 backdrop-blur-md px-2.5 sm:px-4 xl:px-5 2xl:px-6 py-2 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={cn("h-2 w-2 rounded-full", i <= playerPoints ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-white/10")} />
                  ))}
                </div>
                <span className="text-[9px] font-black uppercase text-white/40 tracking-widest hidden sm:inline">Gegner</span>
              </div>
              <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4 xl:w-5 xl:h-5 text-red-500" />
            </div>
            <button onClick={() => setShowLog(!showLog)} className={cn("h-11 w-11 xl:h-12 xl:w-12 2xl:h-14 2xl:w-14 rounded-full flex items-center justify-center border transition-all shadow-2xl backdrop-blur-md shrink-0", showLog ? "bg-primary text-primary-foreground border-primary" : "bg-black/40 text-white/60 border-white/10")}>
              <ScrollText className="w-5 h-5 xl:w-6 xl:h-6 2xl:w-6 2xl:h-6" />
            </button>
          </div>
        </div>

        {/* Center: Turn Indicator (separate row to avoid overlap) */}
        <div className="mt-2 xl:mt-3 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 sm:gap-4 xl:gap-5 bg-black/60 backdrop-blur-2xl border border-white/10 px-3 sm:px-6 xl:px-7 2xl:px-8 py-2.5 sm:py-3 xl:py-3.5 rounded-2xl shadow-2xl min-w-[220px] sm:min-w-[300px] xl:min-w-[340px] 2xl:min-w-[380px] max-w-[92vw]">
            {isSubmitting ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6 text-primary animate-spin" /> : <Swords className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6 text-primary" />}
            <div className="flex flex-col items-center text-center text-[9px] sm:text-[10px] xl:text-[11px] font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] xl:tracking-[0.24em] text-white/80 truncate">
              {isFinished ? 'Ende' : (
                attackAnimation ? (
                  <>
                    <span className="animate-pulse text-primary">{attackAnimation.type === 'player' ? 'Dein Angriff' : 'Gegnerangriff'}</span>
                    <span className="mt-0.5 text-[8px] sm:text-[9px] xl:text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                      {attackAnimation.attackName} · {attackAnimation.damage} Schaden
                    </span>
                  </>
                ) : isMyTurn ? 'Deine Runde' : (
                  <>
                    <span className="animate-pulse text-red-400">KI denkt nach...</span>
                    <span className="mt-0.5 text-[8px] sm:text-[9px] xl:text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                      Gegner am Zug
                    </span>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Log Panel */}
      <AnimatePresence>
        {showLog && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-16 sm:top-20 xl:top-24 left-2 sm:left-4 xl:left-6 bottom-24 sm:bottom-32 xl:bottom-36 w-[min(16rem,calc(100vw-1rem))] sm:w-64 xl:w-72 2xl:w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl z-40 flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Kampflog</span>
              <X className="w-4 h-4 text-white/40 cursor-pointer" onClick={() => setShowLog(false)} />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {matchData.actionLog?.slice().reverse().map((entry: any, i: number) => (
                <div key={i} className="text-[10px] font-medium text-white/80 leading-snug border-l-2 border-primary/30 pl-3 py-1">
                  <div className="text-primary/60 font-black uppercase text-[8px] mb-0.5">
                    {entry.actor === currentUserId ? 'Du' : (entry.actor === 'system' ? 'System' : 'Gegner')}
                  </div>
                  {entry.type === 'attack' ? (
                    <span>Verwendet <span className="text-white font-bold">{entry.attackName}</span> für <span className="text-red-400 font-bold">{entry.value} Schaden</span>.</span>
                  ) : entry.type === 'switch' ? (
                    <span>Wechselt die aktive Karte.</span>
                  ) : entry.type === 'match_start' ? (
                    <span>Der Kampf beginnt!</span>
                  ) : (
                    <span>{entry.type}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opponent Side */}
      <div className="absolute top-24 sm:top-24 xl:top-28 right-2 sm:right-8 xl:right-12 2xl:right-16 flex flex-col items-end gap-2 sm:gap-4 xl:gap-5 origin-top-right max-w-[52vw] sm:max-w-none">
        <div className="w-32 sm:w-48 xl:w-52 2xl:w-60 space-y-1.5">
          <div className="flex justify-between items-end px-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-red-500">
              {stableAiDisplayName}
              {!isMyTurn && !isFinished && <span className="ml-2 animate-pulse text-[7px] text-red-400">Am Zug...</span>}
            </span>
            <span className="text-sm font-black italic tracking-tighter text-white tabular-nums">{opponent.activeCard?.hp || 0} HP</span>
          </div>
          <div className="h-2 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${(opponent.activeCard?.maxHp || opponent.activeCard?.hp || 1) > 0 ? ((opponent.activeCard?.hp ?? 0) / (opponent.activeCard?.maxHp || opponent.activeCard?.hp || 1)) * 100 : 0}%` }} className="h-full bg-red-600" />
          </div>
        </div>

        <div className="flex gap-2 sm:gap-4 xl:gap-5 items-start">
          <div className="flex -space-x-9 sm:-space-x-12 xl:-space-x-14 2xl:-space-x-16 opacity-60">
            {opponent.bench?.map((_: any, i: number) => (
              <div key={i} className="w-16 sm:w-20 xl:w-24 2xl:w-28 aspect-[2.5/3.5] relative shrink-0 @container" style={{ containerType: 'inline-size' }}>
                <div className="absolute inset-0 rounded-[1cqw] border-2 border-white/10 bg-neutral-900 flex items-center justify-center shadow-inner overflow-hidden">
                   <Zap className="w-[30%] h-[30%] text-white/5" />
                </div>
              </div>            ))}
          </div>
          <div className="w-16 sm:w-20 xl:w-24 2xl:w-28 aspect-[2.5/3.5] relative shrink-0 @container" style={{ containerType: 'inline-size' }}>
            <div className="absolute inset-0 rounded-[1cqw] border-2 border-white/20 bg-neutral-950 flex flex-col items-center justify-center opacity-40 shadow-xl overflow-hidden">
               <span className="text-[12cqw] font-black text-white/20">{opponent.reserve?.length || 0}</span>
               <div className="h-[2cqw] w-[20cqw] bg-white/10 rounded-full mt-1" />
            </div>
          </div>
        </div>

        <motion.div animate={attackAnimation?.type === 'opponent' ? { y: 20, scale: 1.05 } : {}} className={cn("w-32 sm:w-40 xl:w-44 2xl:w-52 transition-all relative", attackAnimation?.type === 'player' && "animate-shake")}>
          {opponentActive && <TeacherSpecCard data={opponentActive} isCombat />}
          {/* Floating damage number on opponent */}
          <AnimatePresence>
            {floatingDamage?.type === 'opponent' && (
              <motion.div
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -40, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl font-black italic text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.7)] pointer-events-none z-50"
              >
                -{floatingDamage.value}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Player Side */}
      <div className="absolute bottom-6 sm:bottom-8 xl:bottom-10 left-2 sm:left-8 xl:left-12 2xl:left-16 flex flex-col items-start gap-2 sm:gap-4 xl:gap-5 origin-bottom-left max-w-[58vw] sm:max-w-none">
        <motion.div 
          whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.12, ease: 'easeOut' } }} 
          onClick={() => !isFinished && !iNeedReplacement && setFocusState({ card: player.activeCard, isBench: false })} 
          animate={attackAnimation?.type === 'player' ? { y: -20, scale: 1.05 } : {}} 
          className={cn(
            "w-32 sm:w-40 xl:w-44 2xl:w-52 cursor-pointer transition-all relative", 
            attackAnimation?.type === 'opponent' && "animate-shake",
            isSubmitting && "opacity-50 grayscale cursor-wait"
          )}
        >
          {playerActive && <TeacherSpecCard data={playerActive} currentHp={playerActive.hp} isCombat />}
          {isMyTurn && !isFinished && (
            <div className="absolute -top-3 -right-3 bg-blue-500 h-6 w-6 rounded-full flex items-center justify-center shadow-lg animate-bounce z-10 border-2 border-white">
              <Zap className="w-3 h-3 text-white" />
            </div>
          )}
          {/* Floating damage number on player */}
          <AnimatePresence>
            {floatingDamage?.type === 'player' && (
              <motion.div
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -40, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl font-black italic text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.7)] pointer-events-none z-50"
              >
                -{floatingDamage.value}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex gap-2 sm:gap-4 xl:gap-5 items-end">
          <div className="w-16 sm:w-20 xl:w-24 2xl:w-28 aspect-[2.5/3.5] relative shrink-0 opacity-40 @container" style={{ containerType: 'inline-size' }}>
            <div className="absolute inset-0 rounded-[1cqw] border-2 border-white/20 bg-neutral-950 flex flex-col items-center justify-center shadow-xl overflow-hidden">
               <span className="text-[12cqw] font-black text-white/20">{player.reserve?.length || 0}</span>
               <div className="h-[2cqw] w-[20cqw] bg-white/10 rounded-full mt-1" />
            </div>
          </div>
          <div className="flex -space-x-7 sm:-space-x-8 xl:-space-x-10 2xl:-space-x-12">
            {player.bench?.map((card: any, i: number) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -2, scale: 1.03, zIndex: 30, transition: { duration: 0.12, ease: 'easeOut' } }} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isFinished && !isSubmitting) {
                    setFocusState({ card: card, index: i, isBench: true });
                  }
                }}
                className={cn(
                  "w-16 sm:w-20 xl:w-24 2xl:w-28 aspect-[2.5/3.5] relative shrink-0 transition-all cursor-pointer",
                  isSubmitting && "opacity-50 grayscale cursor-wait"
                )}
              >
                <TeacherSpecCard data={adaptToCardData(card)} isCombat className="[--card-radius:0.9cqw]" />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="w-48 xl:w-52 2xl:w-60 space-y-1.5">
          <div className="flex justify-between items-end px-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Du</span>
            <span className="text-sm font-black italic tracking-tighter text-white tabular-nums">{player.activeCard?.hp || 0} HP</span>
          </div>
          <div className="h-2 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${(player.activeCard?.maxHp || player.activeCard?.hp || 1) > 0 ? ((player.activeCard?.hp ?? 0) / (player.activeCard?.maxHp || player.activeCard?.hp || 1)) * 100 : 0}%` }} className="h-full bg-blue-600" />
          </div>
        </div>
      </div>

      {/* Win/Loss Screen */}
      <AnimatePresence>
        {isFinished && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
            <div className="text-center space-y-8 max-w-sm px-6">
              <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className={cn("h-32 w-32 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl", isDraw ? "bg-zinc-500 shadow-zinc-500/40" : (iWon ? "bg-blue-500 shadow-blue-500/40" : "bg-red-500 shadow-red-500/40"))}>
                <Trophy className="h-16 w-16 text-white" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white">{isDraw ? 'UNENTSCHIEDEN' : (iWon ? 'SIEG!' : 'NIEDERLAGE')}</h2>
                <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">{isDraw ? 'Keine Seite hatte mehr Punkte.' : (iWon ? 'Du hast den Gegner bezwungen.' : 'Dein Deck wurde besiegt.')}</p>
              </div>
              <Button onClick={onExit} className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl">Zurück zum Menü</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {iNeedReplacement && isMyTurn && !isFinished && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-40 z-[120] px-4 py-2 rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-100 text-[10px] font-black uppercase tracking-[0.2em]">
          Karte besiegt: Wähle eine Handkarte zum Einwechseln
        </div>
      )}

      {/* Surrender Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-neutral-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-xs space-y-6 shadow-2xl">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Menü</h3>
              <div className="space-y-3">
                <Button variant="outline" onClick={() => setShowMenu(false)} className="w-full h-14 rounded-2xl border-white/10 font-black uppercase tracking-widest text-[10px]">Fortsetzen</Button>
                <Button variant="destructive" onClick={handleSurrender} disabled={isSubmitting || isFinished} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3">
                  <LogOut className="w-4 h-4" /> Aufgeben
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Overlay */}
      <AnimatePresence>
        {focusState && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[440px] 2xl:max-w-[520px] flex flex-col items-center gap-6 isolate">
              <div className="w-full">
                <TeacherSpecCard 
                  data={adaptToCardData(focusState.card)}
                  currentHp={focusState.card.hp}
                  isCombat
                  renderAttacks={!focusState.isBench && isFocusOnCurrentActive ? () => (
                    <div className="h-full flex flex-col gap-[3cqw] py-[2cqw] overflow-visible">
                      {activeActionAttacks.map((attack: any, idx: number) => (
                        <motion.button
                          key={idx}
                          whileHover={isMyTurn && !isSubmitting ? { scale: 1.05 } : {}}
                          whileTap={isMyTurn && !isSubmitting ? { scale: 0.95 } : {}}
                          disabled={!isMyTurn || isSubmitting || idx >= activeActionAttacks.length}
                          onClick={() => {
                            if (idx < activeActionAttacks.length) {
                              handleAction({ type: 'attack', attackIndex: idx });
                            }
                          }}
                          className={cn(
                            "h-[18cqw] shrink-0 relative rounded-[3cqw] border transition-all flex flex-col justify-center px-[4cqw] shadow-lg z-[110]",
                            RARITY_BUTTON_STYLES[focusState.card.rarity || 'common'].bg,
                            RARITY_BUTTON_STYLES[focusState.card.rarity || 'common'].border,
                            (!isMyTurn || isSubmitting) && "opacity-50 grayscale cursor-not-allowed"
                          )}
                        >
                          <div className="relative z-10 flex items-center justify-between w-full">
                            <div className="text-left min-w-0 flex-1">
                              <span className="text-[3.5cqw] font-black uppercase italic tracking-tight block text-white truncate">{attack.name}</span>
                              <span className="text-[2.5cqw] text-white/40 block truncate">{attack.description || 'Keine Beschreibung'}</span>
                            </div>
                            <span className="text-[6cqw] font-black italic text-white/80 tabular-nums ml-[4cqw]">{attack.damage}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : undefined}
                />
              </div>

              <div className="w-full space-y-3">
                {focusState.isBench && isMyTurn && !isFinished && (
                  <Button 
                    onClick={() => handleAction({ type: 'switch', benchIndex: focusState.index, freeSwitch: iNeedReplacement })}
                    disabled={isSubmitting || (!iNeedReplacement && !canPaySwitch)}
                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                  >
                    <Zap className="w-5 h-5" />
                    {iNeedReplacement ? 'Pflicht-Einwechseln' : (canPaySwitch ? 'Einwechseln (-1 Punkt)' : 'Kein Wechsel (0 Punkte)')}
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  onClick={() => !iNeedReplacement && setFocusState(null)} 
                  disabled={iNeedReplacement}
                  className="w-full h-12 rounded-xl text-white/40 font-black uppercase tracking-[0.2em] text-[10px] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4 mr-2" /> Schließen
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>


      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-1deg); }
          50% { transform: translateX(5px) rotate(1deg); }
          75% { transform: translateX(-5px) rotate(-1deg); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--primary) / 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};
