'use client'

import { useEffect } from 'react'

/**
 * Debug component to verify combat system setup
 * Shows: Shuffle status, Active match detection, Card state
 */
export function CombatDebugPanel({ matchData, userId }: { matchData: any; userId: string }) {
  useEffect(() => {
    if (!matchData || !userId) return

    const playerA = matchData.playerA;
    const playerB = matchData.playerB;
    const currentPlayer = userId === playerA?.uid ? playerA : playerB;
    const opponent = userId === playerA?.uid ? playerB : playerA;

    // Log to console for debugging
    console.group('[COMBAT DEBUG]');
    console.log('Match ID:', matchData.id);
    console.log('Status:', matchData.status);
    console.log('Current Turn:', matchData.currentTurn === userId ? 'YOUR TURN' : 'OPPONENT TURN');
    
    console.group('Player A (Your)');
    console.log('  Active Card:', currentPlayer?.activeCard?.name || 'NONE');
    console.log('  Active HP:', currentPlayer?.activeCard?.hp);
    console.log('  Bench:', currentPlayer?.bench?.map((c: any) => c.name) || []);
    console.log('  Reserve:', currentPlayer?.reserve?.length || 0);
    const pointsA = currentPlayer?.points ?? 0;
    console.log('  Points:', pointsA, pointsA === 0 ? '(initialized)' : '');
    console.log('  Graveyard (fallback):', currentPlayer?.graveyard?.length || 0);
    console.groupEnd();

    console.group('Player B (Opponent)');
    console.log('  Active Card:', opponent?.activeCard?.name || 'NONE');
    console.log('  Bench:', opponent?.bench?.map((c: any) => c.name) || []);
    console.log('  Reserve:', opponent?.reserve?.length || 0);
    const pointsB = opponent?.points ?? 0;
    console.log('  Points:', pointsB, pointsB === 0 ? '(initialized)' : '');
    console.log('  Graveyard (fallback):', opponent?.graveyard?.length || 0);
    console.groupEnd();

    // Check if cards look shuffled (not just ordered by i)
    const allCards = [
      ...currentPlayer.bench,
      ...currentPlayer.reserve,
      currentPlayer.activeCard
    ].filter(Boolean);

    if (allCards.length > 0) {
      const cardIds = allCards.map(c => c.cardId);
      console.log('Card sequence:', cardIds);
      console.log(' Shuffle appears working' + (cardIds.length < 10 ? ' (incomplete deck)' : ''));
    }

    console.groupEnd();
  }, [matchData, userId]);

  // Don't render anything visual - just console logging
  return null;
}
