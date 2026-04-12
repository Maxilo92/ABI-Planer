import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { CALLABLE_CORS_ORIGINS } from "./constants/cors";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { getCard, getAllCards } from "./constants/cardRegistry";
import { atomicNPUpdate } from "./npSecurity";
import { buildAiOpponentName } from "./constants/aiOpponentName";
import {
  applyAiLearningFromMatch,
  buildAiDeckCandidate,
  buildAttackKey,
  buildDeckSignature,
  chooseAttackIndex,
  chooseSwitchIndex,
  getDifficultyProfile,
  loadAiLearningSnapshot,
  loadAttackStatsForCard,
  loadDeckStatsForSignatures,
  scoreAiDeckCandidate,
} from "./aiCombatLearning";

const AI_BOT_ID = "ai_bot";
const TURN_TIMEOUT_SECONDS = 90;
const MATCH_MAX_DURATION_SECONDS = 30 * 60;
const KNOCKOUTS_TO_WIN = 3;

type MatchResult = 'win' | 'loss' | 'draw';

function getPoints(player: any): number {
  if (typeof player?.points === 'number') return player.points;
  return player?.graveyard?.length || 0;
}

/**
 * Lazy helper to get the Firestore instance.
 */
function getDb() {
  return getFirestore("abi-data");
}

/**
 * Helper to get the best variant from user's teacher variants.
 */
function getBestVariant(variants: any): string {
  if (!variants) return 'normal';
  if (variants.black_shiny_holo) return 'black_shiny_holo';
  if (variants.shiny) return 'shiny';
  if (variants.holo) return 'holo';
  return 'normal';
}

/**
 * Helper to initialize a combat card from a card ID.
 */
function createCombatCard(fullId: string, instanceId: string, variant: string = 'normal') {
  try {
    const card = getCard(fullId);
    if (!card) return null;

    return {
      instanceId,
      cardId: card.fullId,
      name: card.name,
      hp: card.hp || 60,
      maxHp: card.hp || 60,
      attacks: card.attacks || [],
      rarity: card.rarity,
      type: card.type,
      variant: variant || 'normal'
    };
  } catch (e) {
    logger.error(`[Combat] Error creating combat card for ${fullId}:`, e);
    return null;
  }
}

/**
 * Generates an adaptive AI deck based on player ELO.
 */
async function generateAiDeck(elo: number) {
  try {
    const allCards = getAllCards().filter(c => c.type === 'teacher');
    if (allCards.length === 0) return [];
    const getPool = (rarities: string[]) => {
      const pool = allCards.filter(c => rarities.includes(c.rarity));
      return pool.length > 0 ? pool : allCards;
    };

    const profile = getDifficultyProfile(elo);
    const pool = elo < 1000
      ? getPool(['common', 'rare'])
      : elo < 1500
        ? getPool(['rare', 'epic', 'mythic'])
        : getPool(['epic', 'mythic', 'legendary', 'iconic']);

    const db = getDb();
    const cardIds = pool.map(card => card.fullId || card.id).filter((cardId): cardId is string => typeof cardId === 'string');
    const learningSnapshot = await loadAiLearningSnapshot(db, cardIds);
    const candidateCount = Math.max(6, profile.deckBreadth);
    const candidates = Array.from({ length: candidateCount }, () => buildAiDeckCandidate(pool, profile, learningSnapshot.cardStats));
    const signatures = candidates.map(candidate => buildDeckSignature(candidate.map(card => card?.fullId || card?.cardId || '')));
    const deckStats = await loadDeckStatsForSignatures(db, signatures);

    let bestDeck: any[] = [];
    let bestScore = Number.NEGATIVE_INFINITY;

    candidates.forEach((candidate, index) => {
      const signature = signatures[index];
      const score = scoreAiDeckCandidate(candidate, profile, learningSnapshot.cardStats, deckStats[signature]);
      if (score > bestScore) {
        bestScore = score;
        bestDeck = candidate;
      }
    });

    return bestDeck.map((card, index) => createCombatCard(card.fullId, `ai-${index}`)).filter(Boolean);
  } catch (e) {
    logger.error("[Combat] AI Deck generation failed:", e);
    return [];
  }
}

/**
 * Awards coins and ELO after a match ends.
 */
async function awardMatchRewards(
  userId: string, 
  result: MatchResult,
  matchId: string, 
  isAiMatch: boolean, 
  playerElo: number, 
  opponentElo: number,
  mode: string = 'ranked'
) {
  const db = getDb();
  const statsRef = db.collection("combat_stats").doc(userId);
  const profileRef = db.collection("profiles").doc(userId);

  // ELO calculation (only for ranked matches)
  let eloDelta = 0;
  if (mode === 'ranked') {
    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const actual = result === 'win' ? 1 : (result === 'draw' ? 0.5 : 0);
    eloDelta = Math.round(K * (actual - expected));

    if (result === 'win' && eloDelta < 5) eloDelta = 5;
    if (result === 'loss' && eloDelta > -5) eloDelta = -5;
  }

  const coins = result === 'win' ? (isAiMatch ? 25 : 50) : 0;
  const xp = result === 'win' ? 100 : (result === 'draw' ? 30 : 10);

  try {
    await db.runTransaction(async (transaction) => {
      const statsSnap = await transaction.get(statsRef);
      const currentStats = statsSnap.exists ? statsSnap.data() : { 
        elo: 1000, 
        wins: 0, 
        losses: 0, 
        draws: 0,
        totalMatches: 0, 
        placementMatchesDone: 0, 
        isRanked: false 
      };

      let newElo = (currentStats?.elo || 1000);
      let newPlacementMatchesDone = (currentStats?.placementMatchesDone || 0);
      let newIsRanked = (currentStats?.isRanked || false);

      if (mode === 'ranked') {
        newElo = Math.max(0, newElo + eloDelta);
        if (!newIsRanked) {
          newPlacementMatchesDone += 1;
          if (newPlacementMatchesDone >= 10) {
            newIsRanked = true;
          }
        }
      }

      const newStats = {
        elo: newElo,
        wins: (currentStats?.wins || 0) + (result === 'win' ? 1 : 0),
        losses: (currentStats?.losses || 0) + (result === 'loss' ? 1 : 0),
        draws: (currentStats?.draws || 0) + (result === 'draw' ? 1 : 0),
        totalMatches: (currentStats?.totalMatches || 0) + 1,
        placementMatchesDone: newPlacementMatchesDone,
        isRanked: newIsRanked,
        lastMatchId: matchId,
        updatedAt: FieldValue.serverTimestamp()
      };

      transaction.set(statsRef, newStats, { merge: true });
      transaction.update(profileRef, {
        xp: FieldValue.increment(xp),
        updated_at: FieldValue.serverTimestamp()
      });
    });

    if (coins > 0) {
      await atomicNPUpdate(userId, coins, "combat_win", { sourceDocId: matchId });
    }
  } catch (error) {
    logger.error(`[Combat] Failed to award rewards for user ${userId}:`, error);
  }
}

function resolveWinnerByPoints(matchData: any): string | null {
  const pointsA = getPoints(matchData?.playerA);
  const pointsB = getPoints(matchData?.playerB);
  if (pointsA > pointsB) return matchData?.playerA?.uid || null;
  if (pointsB > pointsA) return matchData?.playerB?.uid || null;
  return null;
}

function resolveResultForPlayer(uid: string, winnerUid: string | null): MatchResult {
  if (!winnerUid) return 'draw';
  return winnerUid === uid ? 'win' : 'loss';
}

async function awardFinishedMatchRewards(matchData: any, matchId: string, winnerUid: string | null) {
  if (!matchData?.playerA?.uid || !matchData?.playerB?.uid) return;

  const mode = matchData.mode || 'ranked';
  const eloA = matchData.playerA.elo || 1000;
  const eloB = matchData.playerB.elo || 1000;

  await awardMatchRewards(
    matchData.playerA.uid,
    resolveResultForPlayer(matchData.playerA.uid, winnerUid),
    matchId,
    !!matchData.isAiMatch,
    eloA,
    eloB,
    mode
  );

  if (matchData.playerB_uid !== AI_BOT_ID) {
    await awardMatchRewards(
      matchData.playerB.uid,
      resolveResultForPlayer(matchData.playerB.uid, winnerUid),
      matchId,
      !!matchData.isAiMatch,
      eloB,
      eloA,
      mode
    );
  }

  if (matchData?.isAiMatch) {
    await applyAiLearningFromMatch(getDb(), matchId, matchData);
  }
}

/**
 * Matchmaking Trigger: Pairs players when they join the queue.
 */
export const onQueueJoin = onDocumentCreated({
  document: "matchmaking_queue/{userId}",
  region: "europe-west3",
  database: "abi-data",
}, async (event) => {
  const db = getDb();
  const queueRef = db.collection("matchmaking_queue");

  try {
    const newEntry = event.data?.data();
    if (!newEntry) return;
    
    const mode = newEntry.mode || 'unranked';

    const snapshot = await queueRef
      .where("matchId", "==", null)
      .where("mode", "==", mode)
      .orderBy("joinedAt", "asc")
      .limit(20)
      .get();

    if (snapshot.size < 2) return;

    const queueEntries = snapshot.docs.map(doc => ({
      id: doc.id,
      ref: doc.ref,
      ...doc.data()
    } as any));

    let playerADoc: any = null;
    let playerBDoc: any = null;

    // Filter by mode and skill level
    for (let i = 0; i < queueEntries.length; i++) {
      for (let j = i + 1; j < queueEntries.length; j++) {
        const statsA = await db.collection("combat_stats").doc(queueEntries[i].id).get();
        const statsB = await db.collection("combat_stats").doc(queueEntries[j].id).get();
        
        const eloA = statsA.exists ? (statsA.data()?.elo || 1000) : 1000;
        const eloB = statsB.exists ? (statsB.data()?.elo || 1000) : 1000;

        // In ranked, we want close Elo. In unranked, we are more lenient.
        const maxDiff = mode === 'ranked' ? 300 : 1000;

        if (Math.abs(eloA - eloB) <= maxDiff) {
          playerADoc = queueEntries[i];
          playerBDoc = queueEntries[j];
          playerADoc.elo = eloA;
          playerBDoc.elo = eloB;
          break;
        }
      }
      if (playerADoc) break;
    }

    if (!playerADoc || !playerBDoc) return;

    await db.runTransaction(async (transaction) => {
      const docA: any = await transaction.get(playerADoc.ref as any);
      const docB: any = await transaction.get(playerBDoc.ref as any);

      if (!docA.exists || !docB.exists) return null;
      
      const dataA = docA.data() as any;
      const dataB = docB.data() as any;

      if (dataA.matchId || dataB.matchId) {
        return null;
      }

      const deckARef = db.collection("user_decks").doc(dataA.deckId);
      const deckBRef = db.collection("user_decks").doc(dataB.deckId);
      const teachersARef = db.collection("user_teachers").doc(docA.id);
      const teachersBRef = db.collection("user_teachers").doc(docB.id);

      const [deckA, deckB, teachersA, teachersB] = await Promise.all([
        transaction.get(deckARef),
        transaction.get(deckBRef),
        transaction.get(teachersARef),
        transaction.get(teachersBRef)
      ]);

      if (!deckA.exists || !deckB.exists) return null;

      const dataTeachersA = teachersA.exists ? teachersA.data() : {};
      const dataTeachersB = teachersB.exists ? teachersB.data() : {};

      const matchId = db.collection("matches").doc().id;
      const matchRef = db.collection("matches").doc(matchId);

      const cardsA = (deckA.data()?.cardIds || []).map((id: string, i: number) => {
        const teacherData = dataTeachersA?.[id] || {};
        const variant = getBestVariant(teacherData.variants);
        return createCombatCard(id, `a-${i}`, variant);
      }).filter(Boolean);

      const cardsB = (deckB.data()?.cardIds || []).map((id: string, i: number) => {
        const teacherData = dataTeachersB?.[id] || {};
        const variant = getBestVariant(teacherData.variants);
        return createCombatCard(id, `b-${i}`, variant);
      }).filter(Boolean);

      transaction.set(matchRef, {
        id: matchId,
        mode: mode,
        playerA_uid: docA.id,
        playerB_uid: docB.id,
        playerA: {
          uid: docA.id,
          name: dataA.userName || "Spieler A",
          photoUrl: dataA.userPhoto || null,
          elo: playerADoc.elo,
          activeCard: cardsA[0] || null,
          bench: cardsA.slice(1, 4),
          reserve: cardsA.slice(4),
          graveyard: [],
          points: 0,
          status: 'ready'
        },
        playerB: {
          uid: docB.id,
          name: dataB.userName || "Spieler B",
          photoUrl: dataB.userPhoto || null,
          elo: playerBDoc.elo,
          activeCard: cardsB[0] || null,
          bench: cardsB.slice(1, 4),
          reserve: cardsB.slice(4),
          graveyard: [],
          points: 0,
          status: 'ready'
        },
        status: 'active',
        currentTurn: docA.id,
        createdAt: FieldValue.serverTimestamp(),
        turnStartTime: FieldValue.serverTimestamp(),
        actionLog: [{
          type: 'match_start',
          actor: 'system',
          timestamp: new Date().toISOString()
        }]
      });

      transaction.update(docA.ref as any, { matchId });
      transaction.update(docB.ref as any, { matchId });
      return true;
    });
  } catch (error) {
    logger.error("[Combat] Matchmaking failed:", error);
  }
});

/**
 * Start a match against an AI bot.
 */
export const startAiMatch = onCall({
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  const { deckId, mode = 'pve', customElo } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (!deckId) {
    throw new HttpsError("invalid-argument", "deckId required");
  }

  try {
    const db = getDb();
    const [deckSnap, statsSnap, profileSnap, teachersSnap] = await Promise.all([
      db.collection("user_decks").doc(deckId).get(),
      db.collection("combat_stats").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("user_teachers").doc(uid).get()
    ]);

    if (!deckSnap.exists) {
      throw new HttpsError("not-found", "Deck not found");
    }

    const profileData = profileSnap.data();
    const teachersData = teachersSnap.exists ? teachersSnap.data() : {};
    const playerElo = statsSnap.exists ? (statsSnap.data()?.elo || 1000) : 1000;
    
    // AI difficulty selection
    const aiDeckElo = customElo !== undefined ? customElo : playerElo;
    const aiCards = await generateAiDeck(aiDeckElo);
    const playerCards = (deckSnap.data()?.cardIds || []).map((id: string, i: number) => {
      const teacherData = teachersData?.[id] || {};
      const variant = getBestVariant(teacherData.variants);
      return createCombatCard(id, `p-${i}`, variant);
    }).filter(Boolean);

    if (playerCards.length === 0) {
      throw new HttpsError("failed-precondition", "Deck is empty or invalid");
    }

    const matchId = db.collection("matches").doc().id;
    const matchRef = db.collection("matches").doc(matchId);

    const aiOpponentName = buildAiOpponentName(customElo);

    const matchDoc = {
      id: matchId,
      mode: mode,
      playerA_uid: uid,
      playerB_uid: AI_BOT_ID,
      playerA: {
        uid: uid,
        name: profileData?.full_name || "Spieler",
        photoUrl: profileData?.photo_url || null,
        elo: playerElo,
        activeCard: playerCards[0] || null,
        bench: playerCards.slice(1, 4),
        reserve: playerCards.slice(4),
        graveyard: [],
        points: 0,
        status: 'ready'
      },
      playerB: {
        uid: AI_BOT_ID,
        name: aiOpponentName,
        photoUrl: null,
        elo: customElo !== undefined ? customElo : Math.max(800, playerElo - 100),
        activeCard: aiCards[0] || null,
        bench: aiCards.slice(1, 4),
        reserve: aiCards.slice(4),
        graveyard: [],
        points: 0,
        status: 'ready'
      },
      status: 'active',
      currentTurn: uid,
      createdAt: FieldValue.serverTimestamp(),
      turnStartTime: FieldValue.serverTimestamp(),
      isAiMatch: true,
      actionLog: [{
        type: 'match_start',
        actor: 'system',
        timestamp: new Date().toISOString()
      }]
    };

    await matchRef.set(matchDoc);
    return { matchId };
  } catch (error) {
    logger.error("[Combat] Error in startAiMatch:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error instanceof Error ? error.message : "Unknown error");
  }
});

/**
 * Scheduled Timeout Check: Forfeits players who exceed turn time.
 */
export const checkMatchTimeouts = onSchedule({
  schedule: "every 2 minutes",
  region: "europe-west3",
}, async (event) => {
  const db = getDb();
  const now = new Date();
  const timeoutThreshold = new Date(now.getTime() - TURN_TIMEOUT_SECONDS * 1000);
  const maxDurationThreshold = new Date(now.getTime() - MATCH_MAX_DURATION_SECONDS * 1000);
  const processedMatchIds = new Set<string>();

  try {
    const staleMatches = await db.collection("matches")
      .where("status", "==", "active")
      .where("turnStartTime", "<=", timeoutThreshold)
      .limit(50)
      .get();

    logger.info(`[Combat] Checking timeouts. Found ${staleMatches.size} stale matches.`);

    for (const doc of staleMatches.docs) {
      const matchData = doc.data();
      const currentTurnUid = matchData.currentTurn;

      if (currentTurnUid === AI_BOT_ID) continue;

      const winnerUid = matchData.playerA.uid === currentTurnUid ? matchData.playerB.uid : matchData.playerA.uid;

      logger.info(`[Combat] Timing out match ${doc.id}. Winner: ${winnerUid} (timeout by ${currentTurnUid})`);

      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(doc.ref);
        const data = snap.data();

        if (!data || data.status !== 'active') return;

        const logEntry = {
          type: 'timeout',
          actor: 'system',
          timestamp: new Date().toISOString(),
          matchEnded: true,
          timedOutUser: currentTurnUid
        };

        transaction.update(doc.ref, {
          status: 'finished',
          winner: winnerUid,
          actionLog: FieldValue.arrayUnion(logEntry),
          currentTurn: null
        });
      });

      processedMatchIds.add(doc.id);
      const finalSnap = await doc.ref.get();
      const finalData = finalSnap.data();
      if (finalData?.status === 'finished') {
        await awardFinishedMatchRewards(finalData, doc.id, winnerUid);
      }
    }

    const longRunningMatches = await db.collection("matches")
      .where("createdAt", "<=", maxDurationThreshold)
      .limit(50)
      .get();

    logger.info(`[Combat] Checking max duration. Found ${longRunningMatches.size} matches over 30 minutes.`);

    for (const doc of longRunningMatches.docs) {
      if (processedMatchIds.has(doc.id)) continue;
      const preData = doc.data();
      if (!preData || preData.status !== 'active') continue;

      let winnerUid: string | null = null;
      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(doc.ref);
        const data = snap.data();
        if (!data || data.status !== 'active') return;

        winnerUid = resolveWinnerByPoints(data);
        const pointsA = getPoints(data.playerA);
        const pointsB = getPoints(data.playerB);

        const logEntry = {
          type: 'match_timeout',
          actor: 'system',
          timestamp: new Date().toISOString(),
          matchEnded: true,
          reason: 'max_duration_30m',
          pointsA,
          pointsB,
          result: winnerUid ? 'winner' : 'draw'
        };

        transaction.update(doc.ref, {
          status: 'finished',
          winner: winnerUid,
          actionLog: FieldValue.arrayUnion(logEntry),
          currentTurn: null
        });
      });

      const finalSnap = await doc.ref.get();
      const finalData = finalSnap.data();
      if (finalData?.status === 'finished') {
        await awardFinishedMatchRewards(finalData, doc.id, winnerUid);
      }
    }
  } catch (error) {
    logger.error("[Combat] Timeout check failed:", error);
  }
});

/**
 * AI Turn Trigger: Logic for the AI bot to make moves.
 */
export const onMatchUpdated = onDocumentUpdated({
  document: "matches/{matchId}",
  region: "europe-west3",
  database: "abi-data",
}, async (event) => {
  if (!event.data) return;
  const matchData = event.data.after.data();
  if (!matchData) return;

  if (matchData.status !== 'active' || matchData.currentTurn !== AI_BOT_ID) {
    return;
  }

  const db = getDb();
  const matchRef = event.data.after.ref;

  // Small delay to make it feel more natural
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    await db.runTransaction(async (transaction) => {
      const matchSnap = await transaction.get(matchRef);
      const data = matchSnap.data() as any;

      if (!data || data.currentTurn !== AI_BOT_ID || data.status !== 'active') return;

      const bot = data.playerB;
      const player = data.playerA;

      if (!bot.activeCard) return;

      const playerElo = player.elo || 1000;
      const difficultyProfile = getDifficultyProfile(playerElo);
      const cardIdsForLearning = [bot.activeCard, ...(bot.bench || []), ...(bot.reserve || [])]
        .map((card: any) => card?.cardId || card?.fullId)
        .filter((cardId: unknown): cardId is string => typeof cardId === 'string' && cardId.length > 0);

      const [learningSnapshot, attackStats] = await Promise.all([
        loadAiLearningSnapshot(db, cardIdsForLearning),
        loadAttackStatsForCard(
          db,
          bot.activeCard.cardId || bot.activeCard.fullId || '',
          (bot.activeCard.attacks || []).map((attack: any) => attack?.name || '')
        ),
      ]);

      let action: any;
      const switchIndex = chooseSwitchIndex(bot.activeCard, bot.bench, difficultyProfile, learningSnapshot.cardStats);

      if (switchIndex >= 0 && bot.bench[switchIndex]) {
        action = { type: 'switch', benchIndex: switchIndex };
      }

      if (!action) {
        const attackIndex = chooseAttackIndex(bot.activeCard, player.activeCard, difficultyProfile, attackStats);

        if (attackIndex >= 0) {
          action = { type: 'attack', attackIndex };
        } else if (bot.bench.length > 0) {
          action = { type: 'switch', benchIndex: 0 };
        } else {
          return;
        }
      }

      const logEntry: any = {
        type: action.type,
        actor: AI_BOT_ID,
        timestamp: new Date().toISOString()
      };

      let nextMatchStatus = data.status;
      let winner = data.winner || null;
      let switchKeepsTurn = false;

      if (action.type === 'attack') {
        const attack = bot.activeCard.attacks[action.attackIndex];
        const damage = attack.damage || 0;
        logEntry.attackerCardId = bot.activeCard.cardId || bot.activeCard.fullId || null;
        logEntry.attackKey = buildAttackKey(logEntry.attackerCardId || '', attack.name || '');

        if (player.activeCard) {
          player.activeCard.hp -= damage;
          logEntry.value = damage;
          logEntry.attackName = attack.name;
          logEntry.targetInstanceId = player.activeCard.instanceId;

          if (player.activeCard.hp <= 0) {
            player.activeCard.hp = 0;
            player.graveyard.push(player.activeCard);
            bot.points = getPoints(bot) + 1;
            logEntry.cardDied = player.activeCard.instanceId;
            logEntry.pointsAwardedTo = AI_BOT_ID;
            logEntry.newPoints = bot.points;

            if (bot.points >= KNOCKOUTS_TO_WIN) {
              player.activeCard = null;
              nextMatchStatus = 'finished';
              winner = AI_BOT_ID;
              logEntry.matchEnded = true;
            } else if (player.bench.length > 0) {
              player.activeCard = null;
              player.pendingReplacement = true;
              logEntry.replacementRequired = true;
            } else {
              player.activeCard = null;
              nextMatchStatus = 'finished';
              winner = resolveWinnerByPoints({ playerA: player, playerB: bot });
              logEntry.matchEnded = true;
              logEntry.deckDepleted = true;
            }
          }
        }
      } else if (action.type === 'switch') {
        if (typeof action.benchIndex !== 'number' || action.benchIndex < 0 || action.benchIndex >= bot.bench.length) {
          return;
        }

        if (bot.pendingReplacement) {
          const selected = bot.bench.splice(action.benchIndex, 1)[0];
          bot.activeCard = selected;
          bot.pendingReplacement = false;
          switchKeepsTurn = true;
          logEntry.replacementResolved = true;
          logEntry.newActiveCard = bot.activeCard?.instanceId || null;

          if (bot.reserve.length > 0) {
            const drawnCard = bot.reserve.shift();
            bot.bench.push(drawnCard);
            logEntry.drawnToBench = drawnCard?.instanceId || null;
          }
        } else {
          const oldActive = bot.activeCard;
          bot.activeCard = bot.bench[action.benchIndex];
          bot.bench[action.benchIndex] = oldActive;
          logEntry.newActiveCard = bot.activeCard.instanceId;
          switchKeepsTurn = Boolean(action.freeSwitch);

          if (!switchKeepsTurn) {
            const currentPoints = getPoints(bot);
            if (currentPoints <= 0) {
              return;
            }
            bot.points = currentPoints - 1;
            logEntry.switchCostPaidBy = AI_BOT_ID;
            logEntry.newPoints = bot.points;
          }
        }
      }

      transaction.update(matchRef, {
        playerA: player,
        playerB: bot,
        currentTurn: nextMatchStatus === 'finished' ? null : (action.type === 'switch' ? (switchKeepsTurn ? AI_BOT_ID : player.uid) : player.uid),
        turnStartTime: FieldValue.serverTimestamp(),
        actionLog: FieldValue.arrayUnion(logEntry),
        status: nextMatchStatus,
        winner: winner
      });
    });

    // Award rewards after transaction success
    const finalMatchSnap = await matchRef.get();
    const finalData = finalMatchSnap.data() as any;
    if (finalData?.status === 'finished') {
      await awardFinishedMatchRewards(finalData, event.params.matchId, finalData.winner || null);
    }
  } catch (err) {
    logger.error("[Combat] Error in AI trigger:", err);
  }
});

/**
 * Scheduled Queue Cleanup: Removes stale queue entries.
 */
export const cleanupMatchmakingQueue = onSchedule({
  schedule: "every 10 minutes",
  region: "europe-west3",
}, async (event) => {
  const db = getDb();
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000);

  try {
    const staleEntries = await db.collection("matchmaking_queue")
      .where("joinedAt", "<=", staleThreshold)
      .limit(100)
      .get();

    if (staleEntries.empty) return;

    const batch = db.batch();
    staleEntries.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    logger.info(`[Combat] Cleaned up ${staleEntries.size} stale queue entries.`);
  } catch (error) {
    logger.error("[Combat] Queue cleanup failed:", error);
  }
});

/**
 * Combat Action Handler: Validates and processes player moves.
 */
export const submitCombatAction = onCall({
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  const { matchId, action } = request.data;
  const uid = request.auth?.uid;

  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  if (!matchId || !action) throw new HttpsError("invalid-argument", "matchId and action required");

  const db = getDb();
  const matchRef = db.collection("matches").doc(matchId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const matchSnap = await transaction.get(matchRef);
      if (!matchSnap.exists) throw new HttpsError("not-found", "Match not found");

      const data = matchSnap.data() as any;
      const isSurrenderAction = action?.type === 'surrender';
      if (data.status !== 'active') throw new HttpsError("failed-precondition", "Match is not active");
      if (!isSurrenderAction && data.currentTurn !== uid) throw new HttpsError("failed-precondition", "It is not your turn");

      const isPlayerA = uid === data.playerA_uid;
      const player = isPlayerA ? data.playerA : data.playerB;
      const opponent = isPlayerA ? data.playerB : data.playerA;

      const logEntry: any = {
        type: action.type,
        actor: uid,
        timestamp: new Date().toISOString()
      };

      let nextStatus = data.status;
      let winner = data.winner || null;
      let switchKeepsTurn = false;

      if (isSurrenderAction) {
        nextStatus = 'finished';
        winner = opponent.uid;
        logEntry.matchEnded = true;
        logEntry.reason = 'surrender';
      }

      if (action.type === 'attack' && player.pendingReplacement) {
        throw new HttpsError("failed-precondition", "Wähle zuerst eine Ersatzkarte aus deiner Hand aus.");
      }

      if (action.type === 'attack') {
        if (!player.activeCard) throw new HttpsError("failed-precondition", "Keine aktive Karte verfügbar.");
        const attack = player.activeCard.attacks[action.attackIndex];
        if (!attack) throw new HttpsError("invalid-argument", "Invalid attack index");

        if (!opponent.activeCard) throw new HttpsError("failed-precondition", "Gegner hat keine aktive Karte.");
        opponent.activeCard.hp -= attack.damage;
        logEntry.value = attack.damage;
        logEntry.attackName = attack.name;
        logEntry.attackerCardId = player.activeCard.cardId || player.activeCard.fullId || null;
        logEntry.attackKey = buildAttackKey(logEntry.attackerCardId || '', attack.name || '');

        if (opponent.activeCard.hp <= 0) {
          opponent.activeCard.hp = 0;
          opponent.graveyard.push(opponent.activeCard);
          player.points = getPoints(player) + 1;
          logEntry.cardDied = opponent.activeCard.instanceId;
          logEntry.pointsAwardedTo = uid;
          logEntry.newPoints = player.points;
          
          if (player.points >= KNOCKOUTS_TO_WIN) {
            opponent.activeCard = null;
            nextStatus = 'finished';
            winner = uid;
            logEntry.matchEnded = true;
          } else if (opponent.bench.length > 0) {
            opponent.activeCard = null;
            opponent.pendingReplacement = true;
            logEntry.replacementRequired = true;
          } else {
            opponent.activeCard = null;
            nextStatus = 'finished';
            winner = resolveWinnerByPoints({ playerA: isPlayerA ? player : opponent, playerB: isPlayerA ? opponent : player });
            logEntry.matchEnded = true;
            logEntry.deckDepleted = true;
          }
        }
      } else if (action.type === 'switch') {
        if (typeof action.benchIndex !== 'number' || action.benchIndex < 0 || action.benchIndex >= player.bench.length) {
          throw new HttpsError("invalid-argument", "Ungültiger Handkarten-Index.");
        }

        if (player.pendingReplacement) {
          const selected = player.bench.splice(action.benchIndex, 1)[0];
          player.activeCard = selected;
          player.pendingReplacement = false;
          switchKeepsTurn = true;
          logEntry.replacementResolved = true;
          logEntry.newActiveCard = player.activeCard?.instanceId || null;

          if (player.reserve.length > 0) {
            const drawnCard = player.reserve.shift();
            player.bench.push(drawnCard);
            logEntry.drawnToBench = drawnCard?.instanceId || null;
          }
        } else {
          if (!player.activeCard) throw new HttpsError("failed-precondition", "Keine aktive Karte verfügbar.");
          const oldActive = player.activeCard;
          player.activeCard = player.bench[action.benchIndex];
          player.bench[action.benchIndex] = oldActive;
          logEntry.newActiveCard = player.activeCard.instanceId;
          switchKeepsTurn = Boolean(action.freeSwitch);

          if (!switchKeepsTurn) {
            const currentPoints = getPoints(player);
            if (currentPoints <= 0) {
              throw new HttpsError("failed-precondition", "Du hast keine Punkte zum Einwechseln.");
            }
            player.points = currentPoints - 1;
            logEntry.switchCostPaidBy = uid;
            logEntry.newPoints = player.points;
          }
        }
      } else if (action.type !== 'surrender') {
        throw new HttpsError("invalid-argument", "Unknown action type");
      }

      transaction.update(matchRef, {
        playerA: isPlayerA ? player : opponent,
        playerB: isPlayerA ? opponent : player,
        currentTurn: nextStatus === 'finished' ? null : (action.type === 'switch' ? (switchKeepsTurn ? uid : (isPlayerA ? data.playerB_uid : data.playerA_uid)) : (isPlayerA ? data.playerB_uid : data.playerA_uid)),
        turnStartTime: FieldValue.serverTimestamp(),
        actionLog: FieldValue.arrayUnion(logEntry),
        status: nextStatus,
        winner: winner
      });

      return { nextStatus, winner };
    });

    if (result.nextStatus === 'finished') {
      const matchSnap = await matchRef.get();
      const finalData = matchSnap.data();
      if (finalData) {
        await awardFinishedMatchRewards(finalData, matchId, finalData.winner || null);
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("[Combat] Error in submitCombatAction:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Error processing action");
  }
});

/**
 * Create a match invitation for a specific friend.
 */
export const createFriendMatch = onCall({
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  const { targetUserId, deckId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (!targetUserId || !deckId) {
    throw new HttpsError("invalid-argument", "targetUserId and deckId required");
  }

  try {
    const db = getDb();
    const [deckSnap, statsSnap, profileSnap, targetProfileSnap, teachersSnap] = await Promise.all([
      db.collection("user_decks").doc(deckId).get(),
      db.collection("combat_stats").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("profiles").doc(targetUserId).get(),
      db.collection("user_teachers").doc(uid).get()
    ]);

    if (!deckSnap.exists) {
      throw new HttpsError("not-found", "Deck not found");
    }

    if (!targetProfileSnap.exists) {
      throw new HttpsError("not-found", "Target user not found");
    }

    const teachersData = teachersSnap.exists ? teachersSnap.data() : {};
    const playerElo = statsSnap.exists ? (statsSnap.data()?.elo || 1200) : 1200;
    const playerCards = (deckSnap.data()?.cardIds || []).map((id: string, i: number) => {
      const teacherData = teachersData?.[id] || {};
      const variant = getBestVariant(teacherData.variants);
      return createCombatCard(id, `p-${i}`, variant);
    }).filter(Boolean);

    if (playerCards.length === 0) {
      throw new HttpsError("failed-precondition", "Deck is empty or invalid");
    }

    const matchId = db.collection("matches").doc().id;
    const matchRef = db.collection("matches").doc(matchId);

    const matchDoc = {
      id: matchId,
      playerA_uid: uid,
      playerB_uid: targetUserId,
      playerA: {
        uid: uid,
        name: profileSnap.data()?.full_name || "Spieler",
        photoUrl: profileSnap.data()?.photo_url || null,
        elo: playerElo,
        activeCard: playerCards[0] || null,
        bench: playerCards.slice(1, 4),
        reserve: playerCards.slice(4),
        graveyard: [],
        points: 0,
        status: 'ready'
      },
      playerB: {
        uid: targetUserId,
        name: targetProfileSnap.data()?.full_name || "Freund",
        photoUrl: targetProfileSnap.data()?.photo_url || null,
        elo: 1200, // Will be updated when they join
        activeCard: null,
        bench: [],
        reserve: [],
        graveyard: [],
        points: 0,
        status: 'waiting'
      },
      status: 'waiting_for_opponent',
      isFriendMatch: true,
      createdAt: FieldValue.serverTimestamp(),
      actionLog: [{
        type: 'invite_sent',
        actor: uid,
        timestamp: new Date().toISOString()
      }]
    };

    await matchRef.set(matchDoc);
    return { matchId };
  } catch (error) {
    logger.error("[Combat] Error in createFriendMatch:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Internal error");
  }
});

/**
 * Create a match and generate an invitation code.
 */
export const createMatchWithCode = onCall({
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  const { deckId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (!deckId) {
    throw new HttpsError("invalid-argument", "deckId required");
  }

  try {
    const db = getDb();
    const [deckSnap, statsSnap, profileSnap, teachersSnap] = await Promise.all([
      db.collection("user_decks").doc(deckId).get(),
      db.collection("combat_stats").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("user_teachers").doc(uid).get()
    ]);

    if (!deckSnap.exists) {
      throw new HttpsError("not-found", "Deck not found");
    }

    const teachersData = teachersSnap.exists ? teachersSnap.data() : {};
    const playerElo = statsSnap.exists ? (statsSnap.data()?.elo || 1200) : 1200;
    const playerCards = (deckSnap.data()?.cardIds || []).map((id: string, i: number) => {
      const teacherData = teachersData?.[id] || {};
      const variant = getBestVariant(teacherData.variants);
      return createCombatCard(id, `p-${i}`, variant);
    }).filter(Boolean);

    if (playerCards.length === 0) {
      throw new HttpsError("failed-precondition", "Deck is empty or invalid");
    }

    // Generate a simple 6-digit code
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();

    const matchId = db.collection("matches").doc().id;
    const matchRef = db.collection("matches").doc(matchId);

    const matchDoc = {
      id: matchId,
      inviteCode,
      playerA_uid: uid,
      playerA: {
        uid: uid,
        name: profileSnap.data()?.full_name || "Spieler",
        photoUrl: profileSnap.data()?.photo_url || null,
        elo: playerElo,
        activeCard: playerCards[0] || null,
        bench: playerCards.slice(1, 4),
        reserve: playerCards.slice(4),
        graveyard: [],
        points: 0,
        status: 'ready'
      },
      status: 'waiting_for_opponent',
      createdAt: FieldValue.serverTimestamp(),
      actionLog: [{
        type: 'match_created_with_code',
        actor: uid,
        timestamp: new Date().toISOString()
      }]
    };

    await matchRef.set(matchDoc);
    return { matchId, inviteCode };
  } catch (error) {
    logger.error("[Combat] Error in createMatchWithCode:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Internal error");
  }
});

/**
 * Join a match using an invitation code.
 */
export const joinMatchByCode = onCall({
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  const { inviteCode, deckId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  if (!inviteCode || !deckId) throw new HttpsError("invalid-argument", "inviteCode and deckId required");

  const db = getDb();
  
  try {
    const q = db.collection("matches")
      .where("inviteCode", "==", inviteCode)
      .where("status", "==", "waiting_for_opponent")
      .limit(1);
    
    const snapshot = await q.get();
    if (snapshot.empty) throw new HttpsError("not-found", "Match not found or already full");

    const matchDoc = snapshot.docs[0];
    const matchId = matchDoc.id;
    const matchData = matchDoc.data() as any;

    if (matchData.playerA_uid === uid) throw new HttpsError("failed-precondition", "You cannot join your own match");

    const [deckSnap, statsSnap, profileSnap, teachersSnap] = await Promise.all([
      db.collection("user_decks").doc(deckId).get(),
      db.collection("combat_stats").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("user_teachers").doc(uid).get()
    ]);

    if (!deckSnap.exists) throw new HttpsError("not-found", "Deck not found");

    const teachersData = teachersSnap.exists ? teachersSnap.data() : {};
    const playerElo = statsSnap.exists ? (statsSnap.data()?.elo || 1000) : 1000;
    const playerCards = (deckSnap.data()?.cardIds || []).map((id: string, i: number) => {
      const teacherData = teachersData?.[id] || {};
      const variant = getBestVariant(teacherData.variants);
      return createCombatCard(id, `p-${i}`, variant);
    }).filter(Boolean);

    if (playerCards.length === 0) throw new HttpsError("failed-precondition", "Deck is empty or invalid");

    const playerB = {
      uid: uid,
      name: profileSnap.data()?.full_name || "Gegner",
      photoUrl: profileSnap.data()?.photo_url || null,
      elo: playerElo,
      activeCard: playerCards[0] || null,
      bench: playerCards.slice(1, 4),
      reserve: playerCards.slice(4),
      graveyard: [],
      points: 0,
      status: 'ready'
    };

    await matchDoc.ref.update({
      playerB_uid: uid,
      playerB,
      status: 'active',
      currentTurn: matchData.playerA_uid,
      turnStartTime: FieldValue.serverTimestamp(),
      actionLog: FieldValue.arrayUnion({
        type: 'match_start_code',
        actor: 'system',
        timestamp: new Date().toISOString()
      })
    });

    return { matchId };
  } catch (error) {
    logger.error("[Combat] Error in joinMatchByCode:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Error joining match");
  }
});

/**
 * Join a specific match by ID (e.g. from a direct invitation).
 */
export const joinMatchById = onCall({
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  const { matchId, deckId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (!matchId || !deckId) {
    throw new HttpsError("invalid-argument", "matchId and deckId required");
  }

  try {
    const db = getDb();
    const matchRef = db.collection("matches").doc(matchId);
    const matchSnap = await matchRef.get();

    if (!matchSnap.exists) {
      throw new HttpsError("not-found", "Match not found");
    }

    const matchData = matchSnap.data() as any;

    if (matchData.status !== 'waiting_for_opponent') {
      throw new HttpsError("failed-precondition", "Match is no longer available");
    }

    if (matchData.playerB_uid !== uid) {
      throw new HttpsError("permission-denied", "You are not invited to this match");
    }

    const [deckSnap, statsSnap, profileSnap, teachersSnap] = await Promise.all([
      db.collection("user_decks").doc(deckId).get(),
      db.collection("combat_stats").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("user_teachers").doc(uid).get()
    ]);

    if (!deckSnap.exists) {
      throw new HttpsError("not-found", "Deck not found");
    }

    const teachersData = teachersSnap.exists ? teachersSnap.data() : {};
    const playerElo = statsSnap.exists ? (statsSnap.data()?.elo || 1200) : 1200;
    const playerCards = (deckSnap.data()?.cardIds || []).map((id: string, i: number) => {
      const teacherData = teachersData?.[id] || {};
      const variant = getBestVariant(teacherData.variants);
      return createCombatCard(id, `p-${i}`, variant);
    }).filter(Boolean);

    if (playerCards.length === 0) {
      throw new HttpsError("failed-precondition", "Deck is empty or invalid");
    }

    const playerB = {
      uid: uid,
      name: profileSnap.data()?.full_name || "Gegner",
      photoUrl: profileSnap.data()?.photo_url || null,
      elo: playerElo,
      activeCard: playerCards[0] || null,
      bench: playerCards.slice(1, 4),
      reserve: playerCards.slice(4),
      graveyard: [],
      points: 0,
      status: 'ready'
    };

    await matchRef.update({
      playerB,
      status: 'active',
      currentTurn: matchData.playerA_uid,
      turnStartTime: FieldValue.serverTimestamp(),
      actionLog: FieldValue.arrayUnion({
        type: 'match_start_invited',
        actor: 'system',
        timestamp: new Date().toISOString()
      })
    });

    return { success: true };
  } catch (error) {
    logger.error("[Combat] Error in joinMatchById:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Internal error");
  }
});

/**
 * Emergency cleanup: ends all open matches for the current user and clears queue entry.
 */
export const endMyOpenMatches = onCall({
  cors: CALLABLE_CORS_ORIGINS,
  region: "europe-west3",
}, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const db = getDb();
  const [asPlayerA, asPlayerB] = await Promise.all([
    db.collection("matches").where("playerA_uid", "==", uid).limit(100).get(),
    db.collection("matches").where("playerB_uid", "==", uid).limit(100).get(),
  ]);

  const byId = new Map<string, any>();
  for (const doc of asPlayerA.docs) byId.set(doc.id, doc);
  for (const doc of asPlayerB.docs) byId.set(doc.id, doc);

  let ended = 0;
  let draws = 0;
  for (const doc of byId.values()) {
    const data = doc.data();
    if (!data || (data.status !== 'active' && data.status !== 'waiting_for_opponent')) continue;

    const winnerUid = data.status === 'active' ? resolveWinnerByPoints(data) : null;
    if (!winnerUid) draws += 1;

    const logEntry = {
      type: 'forced_end',
      actor: 'system',
      timestamp: new Date().toISOString(),
      matchEnded: true,
      reason: 'user_cleanup',
      pointsA: getPoints(data.playerA),
      pointsB: getPoints(data.playerB),
      result: winnerUid ? 'winner' : 'draw'
    };

    await doc.ref.update({
      status: 'finished',
      winner: winnerUid,
      currentTurn: null,
      actionLog: FieldValue.arrayUnion(logEntry)
    });

    const finalSnap = await doc.ref.get();
    const finalData = finalSnap.data();
    if (finalData) {
      await awardFinishedMatchRewards(finalData, doc.id, winnerUid);
    }
    ended += 1;
  }

  await db.collection("matchmaking_queue").doc(uid).delete().catch(() => undefined);
  return { ended, draws };
});


