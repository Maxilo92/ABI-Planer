type LearningOutcome = "win" | "loss" | "draw";

export interface LearningStatDoc {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  totalDamage: number;
  totalKnockouts: number;
  lastMatchId?: string;
  updatedAt?: unknown;
}

export interface AiLearningSnapshot {
  cardStats: Record<string, LearningStatDoc>;
  attackStats: Record<string, LearningStatDoc>;
  deckStats: Record<string, LearningStatDoc>;
}

export interface AiDifficultyProfile {
  normalizedElo: number;
  randomness: number;
  deckBreadth: number;
  switchBias: number;
  attackBias: number;
}

export const AI_LEARNING_GUARD_COLLECTION = "combat_ai_learning_applied";
export const AI_CARD_STATS_COLLECTION = "combat_ai_card_stats";
export const AI_ATTACK_STATS_COLLECTION = "combat_ai_attack_stats";
export const AI_DECK_STATS_COLLECTION = "combat_ai_deck_stats";

const RARITY_SCORE: Record<string, number> = {
  common: 0.7,
  rare: 1,
  epic: 1.2,
  mythic: 1.35,
  legendary: 1.5,
  iconic: 1.7,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeElo(elo: number): number {
  return clamp((safeNumber(elo, 1000) - 500) / 2000, 0, 1);
}

export function getDifficultyProfile(elo: number): AiDifficultyProfile {
  const normalizedElo = normalizeElo(elo);

  return {
    normalizedElo,
    // High randomness at low ELO → AI makes more mistakes
    randomness: clamp(0.45 - normalizedElo * 0.38, 0.02, 0.5),
    deckBreadth: 6 + Math.round(normalizedElo * 8),
    // Reduced switch bias so AI doesn't constantly swap cards
    switchBias: clamp(0.08 + normalizedElo * 0.22, 0.05, 0.35),
    // Attack bias scales with ELO – smarter AI picks better attacks
    attackBias: clamp(0.5 + normalizedElo * 0.45, 0.4, 1.0),
  };
}

export function toLearningDocId(value: string): string {
  return encodeURIComponent(value);
}

export function buildDeckSignature(cardIds: string[]): string {
  return [...cardIds].filter(Boolean).sort().join("|");
}

export function buildAttackKey(cardId: string, attackName: string): string {
  return `${cardId}::${attackName}`;
}

export function collectMatchCardIds(player: any): string[] {
  const cards = [player?.activeCard, ...(player?.bench || []), ...(player?.reserve || []), ...(player?.graveyard || [])];
  return cards.map((card) => card?.cardId || card?.fullId).filter((cardId): cardId is string => typeof cardId === "string" && cardId.length > 0);
}

export function getDeckScore(cardIds: string[], deckStat?: LearningStatDoc): number {
  const matchRate = deckStat && deckStat.matches > 0 ? deckStat.wins / deckStat.matches : 0.5;
  const confidence = deckStat ? clamp(deckStat.matches / 20, 0, 1) : 0;
  const knockoutPressure = deckStat ? clamp(deckStat.totalKnockouts / Math.max(deckStat.matches, 1), 0, 5) : 0;

  return (matchRate - 0.5) * 18 + confidence * 4 + knockoutPressure + Math.min(cardIds.length, 10) * 0.15;
}

export function getAttackScore(
  attack: any,
  attackStat: LearningStatDoc | undefined,
  difficultyProfile: AiDifficultyProfile,
  targetHp?: number,
): number {
  const damage = safeNumber(attack?.damage, 0);
  const matches = attackStat?.matches || 0;
  const winRate = matches > 0 ? attackStat!.wins / matches : 0.5;
  const lossRate = matches > 0 ? attackStat!.losses / matches : 0.5;
  const drawRate = matches > 0 ? attackStat!.draws / matches : 0;
  const confidence = clamp(matches / 15, 0, 1);
  // Massive lethal bonus — AI should always go for the kill when possible
  const lethalBonus = typeof targetHp === "number" && targetHp > 0 && damage >= targetHp ? 30 : 0;
  // Smaller bonus for near-lethal (within 10 HP)
  const nearLethalBonus = typeof targetHp === "number" && targetHp > 0 && damage < targetHp && damage >= targetHp - 10 ? 8 : 0;
  const effectBonus = attack?.effect && attack.effect !== "none" ? 3 : 0;
  // Overkill penalty — don't waste a massive attack on a low-HP target
  const overkillPenalty = typeof targetHp === "number" && targetHp > 0 && damage > targetHp * 2.5 ? -4 : 0;

  return (
    damage * (0.7 + difficultyProfile.attackBias * 0.7)
    + (winRate - 0.5) * 32
    - (lossRate - 0.5) * 10
    + drawRate * 4
    + confidence * 6
    + lethalBonus
    + nearLethalBonus
    + overkillPenalty
    + effectBonus
  );
}

export function getCardScore(
  card: any,
  cardStat: LearningStatDoc | undefined,
  difficultyProfile: AiDifficultyProfile,
  attackStats: Record<string, LearningStatDoc> = {},
): number {
  const hp = safeNumber(card?.hp, safeNumber(card?.maxHp, 60));
  const rarityScore = RARITY_SCORE[String(card?.rarity || "common")] || 0.7;
  const matches = cardStat?.matches || 0;
  const winRate = matches > 0 ? cardStat!.wins / matches : 0.5;
  const confidence = clamp(matches / 20, 0, 1);
  const attackList = Array.isArray(card?.attacks) ? card.attacks : [];
  const attackScores = attackList.map((attack: any) => getAttackScore(attack, attackStats[buildAttackKey(card?.cardId || card?.fullId || "", attack?.name || "")], difficultyProfile));
  const bestAttackScore = attackScores.length > 0 ? Math.max(...attackScores) : 0;
  const averageDamage = attackList.length > 0 ? attackList.reduce((sum: number, attack: any) => sum + safeNumber(attack?.damage, 0), 0) / attackList.length : 0;

  return (
    rarityScore * 2
    + hp / 30 * (1 - difficultyProfile.normalizedElo * 0.2)
    + averageDamage / 12 * (0.9 + difficultyProfile.normalizedElo * 0.6)
    + bestAttackScore / 20
    + (winRate - 0.5) * 22
    + confidence * 5
  );
}

export function pickWeightedIndex(weights: number[], randomFn: () => number = Math.random): number {
  const sanitized = weights.map((weight) => Math.max(0, Number.isFinite(weight) ? weight : 0));
  const total = sanitized.reduce((sum, weight) => sum + weight, 0);

  if (total <= 0) {
    return sanitized.length > 0 ? Math.floor(randomFn() * sanitized.length) : -1;
  }

  let cursor = randomFn() * total;
  for (let index = 0; index < sanitized.length; index++) {
    cursor -= sanitized[index];
    if (cursor <= 0) return index;
  }

  return sanitized.length - 1;
}

export function buildAiDeckCandidate(
  pool: any[],
  difficultyProfile: AiDifficultyProfile,
  cardStats: Record<string, LearningStatDoc>,
  randomFn: () => number = Math.random,
): any[] {
  const selected: any[] = [];
  const available = [...pool];

  while (selected.length < 10 && available.length > 0) {
    const weights = available.map((card) => {
      const cardId = card?.fullId || card?.cardId || "";
      const score = getCardScore(card, cardStats[cardId], difficultyProfile);
      const rarityBias = RARITY_SCORE[String(card?.rarity || "common")] || 0.7;
      return Math.max(0.05, score + rarityBias);
    });

    const chosenIndex = pickWeightedIndex(weights, randomFn);
    if (chosenIndex < 0 || !available[chosenIndex]) break;

    selected.push(available[chosenIndex]);
    available.splice(chosenIndex, 1);
  }

  return selected;
}

export function scoreAiDeckCandidate(
  candidate: any[],
  difficultyProfile: AiDifficultyProfile,
  cardStats: Record<string, LearningStatDoc>,
  deckStat?: LearningStatDoc,
  attackStats: Record<string, LearningStatDoc> = {},
): number {
  const cardScore = candidate.reduce((sum, card) => sum + getCardScore(card, cardStats[card?.fullId || card?.cardId || ""], difficultyProfile, attackStats), 0);
  const deckSignature = buildDeckSignature(candidate.map((card) => card?.fullId || card?.cardId || ""));
  const signatureBonus = deckStat ? getDeckScore([deckSignature], deckStat) : 0;

  return cardScore + signatureBonus;
}

export function chooseAttackIndex(
  activeCard: any,
  opponentCard: any,
  difficultyProfile: AiDifficultyProfile,
  attackStats: Record<string, LearningStatDoc> = {},
  randomFn: () => number = Math.random,
): number {
  const attacks = Array.isArray(activeCard?.attacks) ? activeCard.attacks : [];
  if (attacks.length === 0) return -1;

  const targetHp = safeNumber(opponentCard?.hp, safeNumber(opponentCard?.maxHp, 0));
  const scores = attacks.map((attack: any) => {
    const attackKey = buildAttackKey(activeCard?.cardId || activeCard?.fullId || "", attack?.name || "");
    return getAttackScore(attack, attackStats[attackKey], difficultyProfile, targetHp);
  });

  // At low ELO, AI sometimes picks suboptimal attacks
  const shouldRandomize = randomFn() < difficultyProfile.randomness;
  if (!shouldRandomize) {
    // Smart mode: pick the highest-scoring attack
    return scores.indexOf(Math.max(...scores));
  }

  // Random mode: weighted random, but still biased toward good attacks
  const minScore = Math.min(...scores);
  const shiftedScores = scores.map((score: number) => Math.max(0.05, score - minScore + 0.2));
  return pickWeightedIndex(shiftedScores, randomFn);
}

/**
 * Decides whether the AI should switch its active card, and if so, which bench card to use.
 * Returns -1 if the AI should NOT switch (i.e., keep attacking).
 *
 * The AI only switches when:
 * 1. Active card is forced replacement (no active card) — always switch.
 * 2. Active card HP is critically low (<25%) AND a meaningfully better bench card exists.
 * 3. Never switches if it would cost a point the AI can't afford.
 */
export function chooseSwitchIndex(
  activeCard: any,
  benchCards: any[],
  difficultyProfile: AiDifficultyProfile,
  cardStats: Record<string, LearningStatDoc>,
  attackStats: Record<string, LearningStatDoc> = {},
): number {
  if (!Array.isArray(benchCards) || benchCards.length === 0) return -1;

  // If no active card (forced replacement), pick the best bench card
  if (!activeCard) {
    const scores = benchCards.map((card) => {
      const cardId = card?.fullId || card?.cardId || "";
      const cardStat = cardStats[cardId];
      const score = getCardScore(card, cardStat, difficultyProfile, attackStats);
      const hpBonus = safeNumber(card?.hp, safeNumber(card?.maxHp, 0)) / 10;
      return score + hpBonus;
    });
    return scores.indexOf(Math.max(...scores));
  }

  // Calculate active card health ratio
  const activeHp = safeNumber(activeCard?.hp, 0);
  const activeMaxHp = Math.max(1, safeNumber(activeCard?.maxHp, activeHp || 1));
  const activeRatio = activeHp / activeMaxHp;

  // Only consider switching if HP is critically low
  // Smarter AI (higher ELO) has a slightly lower threshold — hangs on longer
  const criticalThreshold = 0.25 - difficultyProfile.normalizedElo * 0.08;
  if (activeRatio > criticalThreshold) return -1;

  // Calculate active card's combat effectiveness
  const activeCardId = activeCard?.fullId || activeCard?.cardId || "";
  const activeScore = getCardScore(activeCard, cardStats[activeCardId], difficultyProfile, attackStats);
  // Scale score by remaining HP ratio — a nearly dead card is less valuable
  const activeEffectiveness = activeScore * activeRatio;

  // Score each bench card
  const benchScores = benchCards.map((card) => {
    const cardId = card?.fullId || card?.cardId || "";
    const cardStat = cardStats[cardId];
    const score = getCardScore(card, cardStat, difficultyProfile, attackStats);
    const cardHp = safeNumber(card?.hp, safeNumber(card?.maxHp, 0));
    const cardMaxHp = Math.max(1, safeNumber(card?.maxHp, cardHp || 1));
    const hpRatio = cardHp / cardMaxHp;
    return score * hpRatio;
  });

  const bestBenchScore = Math.max(...benchScores);
  const bestBenchIndex = benchScores.indexOf(bestBenchScore);

  // Only switch if bench card is meaningfully better (>30% improvement)
  const improvementThreshold = 1.3;
  if (bestBenchScore > activeEffectiveness * improvementThreshold) {
    return bestBenchIndex;
  }

  return -1;
}

function mergeStat(current: any, outcome: LearningOutcome, damage = 0, knockouts = 0): LearningStatDoc {
  return {
    matches: safeNumber(current?.matches, 0) + 1,
    wins: safeNumber(current?.wins, 0) + (outcome === "win" ? 1 : 0),
    losses: safeNumber(current?.losses, 0) + (outcome === "loss" ? 1 : 0),
    draws: safeNumber(current?.draws, 0) + (outcome === "draw" ? 1 : 0),
    totalDamage: safeNumber(current?.totalDamage, 0) + damage,
    totalKnockouts: safeNumber(current?.totalKnockouts, 0) + knockouts,
  };
}

export async function loadAiLearningSnapshot(db: any, cardIds: string[]): Promise<AiLearningSnapshot> {
  const uniqueCardIds = [...new Set(cardIds.filter(Boolean))];
  const cardDocs = await Promise.all(uniqueCardIds.map((cardId) => db.collection(AI_CARD_STATS_COLLECTION).doc(toLearningDocId(cardId)).get()));
  const cardStats: Record<string, LearningStatDoc> = {};

  cardDocs.forEach((doc: any, index: number) => {
    if (doc.exists) {
      cardStats[uniqueCardIds[index]] = doc.data() as LearningStatDoc;
    }
  });

  return {
    cardStats,
    attackStats: {},
    deckStats: {},
  };
}

export async function loadAttackStatsForCard(db: any, cardId: string, attackNames: string[]): Promise<Record<string, LearningStatDoc>> {
  const uniqueAttackNames = [...new Set(attackNames.filter(Boolean))];
  const docs = await Promise.all(uniqueAttackNames.map((attackName) => db.collection(AI_ATTACK_STATS_COLLECTION).doc(toLearningDocId(buildAttackKey(cardId, attackName))).get()));
  const attackStats: Record<string, LearningStatDoc> = {};

  docs.forEach((doc: any, index: number) => {
    if (doc.exists) {
      attackStats[buildAttackKey(cardId, uniqueAttackNames[index])] = doc.data() as LearningStatDoc;
    }
  });

  return attackStats;
}

export async function loadDeckStatsForSignatures(db: any, signatures: string[]): Promise<Record<string, LearningStatDoc>> {
  const uniqueSignatures = [...new Set(signatures.filter(Boolean))];
  const docs = await Promise.all(uniqueSignatures.map((signature) => db.collection(AI_DECK_STATS_COLLECTION).doc(toLearningDocId(signature)).get()));
  const deckStats: Record<string, LearningStatDoc> = {};

  docs.forEach((doc: any, index: number) => {
    if (doc.exists) {
      deckStats[uniqueSignatures[index]] = doc.data() as LearningStatDoc;
    }
  });

  return deckStats;
}

export async function applyAiLearningFromMatch(db: any, matchId: string, matchData: any): Promise<boolean> {
  if (!matchData?.isAiMatch || !matchData?.playerA || !matchData?.playerB) return false;

  const guardRef = db.collection(AI_LEARNING_GUARD_COLLECTION).doc(matchId);
  const playerAUid = matchData.playerA.uid;
  const playerBUid = matchData.playerB.uid;
  const winnerUid = matchData.winner || null;
  const outcomeA: LearningOutcome = winnerUid ? (winnerUid === playerAUid ? "win" : "loss") : "draw";
  const outcomeB: LearningOutcome = winnerUid ? (winnerUid === playerBUid ? "win" : "loss") : "draw";

  const cardIdsA = collectMatchCardIds(matchData.playerA);
  const cardIdsB = collectMatchCardIds(matchData.playerB);
  const deckSignatureA = buildDeckSignature(cardIdsA);
  const deckSignatureB = buildDeckSignature(cardIdsB);
  const attackActions = Array.isArray(matchData.actionLog) ? matchData.actionLog.filter((entry: any) => entry?.type === "attack" && entry?.attackName && entry?.attackerCardId) : [];

  await db.runTransaction(async (transaction: any) => {
    const guardSnap = await transaction.get(guardRef);
    if (guardSnap.exists) return;

    transaction.set(guardRef, {
      matchId,
      processedAt: new Date().toISOString(),
    });

    const playerCardEntries: Array<{ cardId: string; outcome: LearningOutcome }> = [
      ...cardIdsA.map((cardId) => ({ cardId, outcome: outcomeA })),
      ...cardIdsB.map((cardId) => ({ cardId, outcome: outcomeB })),
    ];

    for (const { cardId, outcome } of playerCardEntries) {
      const ref = db.collection(AI_CARD_STATS_COLLECTION).doc(toLearningDocId(cardId));
      const snap = await transaction.get(ref);
      const updated = mergeStat(snap.exists ? snap.data() : {}, outcome);
      transaction.set(ref, {
        ...updated,
        lastMatchId: matchId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    const deckRefs = [
      { deckSignature: deckSignatureA, outcome: outcomeA },
      { deckSignature: deckSignatureB, outcome: outcomeB },
    ];

    for (const deckEntry of deckRefs) {
      const ref = db.collection(AI_DECK_STATS_COLLECTION).doc(toLearningDocId(deckEntry.deckSignature));
      const snap = await transaction.get(ref);
      const updated = mergeStat(snap.exists ? snap.data() : {}, deckEntry.outcome, 0, deckEntry.outcome === "win" ? 1 : 0);
      transaction.set(ref, {
        ...updated,
        signature: deckEntry.deckSignature,
        lastMatchId: matchId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    for (const action of attackActions) {
      const ownerOutcome = action.actor === playerAUid ? outcomeA : (action.actor === playerBUid ? outcomeB : "draw");
      const attackKey = buildAttackKey(action.attackerCardId, action.attackName);
      const ref = db.collection(AI_ATTACK_STATS_COLLECTION).doc(toLearningDocId(attackKey));
      const snap = await transaction.get(ref);
      const updated = mergeStat(snap.exists ? snap.data() : {}, ownerOutcome, safeNumber(action.value, 0), action.cardDied ? 1 : 0);
      transaction.set(ref, {
        ...updated,
        attackKey,
        lastMatchId: matchId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  });

  return true;
}
