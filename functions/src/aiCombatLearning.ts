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
    randomness: 0.36 - normalizedElo * 0.22,
    deckBreadth: 6 + Math.round(normalizedElo * 8),
    switchBias: 0.18 + normalizedElo * 0.52,
    attackBias: 0.42 + normalizedElo * 0.5,
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
  const lethalBonus = typeof targetHp === "number" && damage >= targetHp ? 14 : 0;
  const effectBonus = attack?.effect && attack.effect !== "none" ? 3 : 0;

  return (
    damage * (0.7 + difficultyProfile.attackBias * 0.7)
    + (winRate - 0.5) * 32
    - (lossRate - 0.5) * 10
    + drawRate * 4
    + confidence * 6
    + lethalBonus
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

  const shouldRandomize = randomFn() < difficultyProfile.randomness;
  if (!shouldRandomize) {
    return scores.indexOf(Math.max(...scores));
  }

  const shiftedScores = scores.map((score: number) => Math.max(0.05, score - Math.min(...scores) + 0.2));
  return pickWeightedIndex(shiftedScores, randomFn);
}

export function chooseSwitchIndex(
  activeCard: any,
  benchCards: any[],
  difficultyProfile: AiDifficultyProfile,
  cardStats: Record<string, LearningStatDoc>,
  attackStats: Record<string, LearningStatDoc> = {},
): number {
  if (!Array.isArray(benchCards) || benchCards.length === 0) return -1;

  const activeHp = safeNumber(activeCard?.hp, safeNumber(activeCard?.maxHp, 0));
  const activeMaxHp = Math.max(1, safeNumber(activeCard?.maxHp, activeHp || 1));
  const activeRatio = activeHp / activeMaxHp;
  const shouldSwitch = activeRatio <= (0.42 - difficultyProfile.normalizedElo * 0.14) || difficultyProfile.switchBias > 0.5;

  if (!shouldSwitch) return -1;

  const scores = benchCards.map((card) => {
    const cardId = card?.fullId || card?.cardId || "";
    const cardStat = cardStats[cardId];
    const score = getCardScore(card, cardStat, difficultyProfile, attackStats);
    const hpScore = safeNumber(card?.hp, safeNumber(card?.maxHp, 0)) / 10;
    return score + hpScore;
  });

  return scores.indexOf(Math.max(...scores));
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
