import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { CALLABLE_CORS_ORIGINS } from "./constants/cors";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { CardTrade, CardSelection, TeacherRarity, CardVariant } from "./types/trades";

const MIN_CARDS_FOR_TRADING = 100;
const MAX_TRADES_PER_DAY = 3;
const EXCLUDED_RARITIES: TeacherRarity[] = ['iconic'];
const EXCLUDED_VARIANTS: CardVariant[] = ['black_shiny_holo'];
const ANALYTICS_WINDOW_DAYS = 7;
const ONLINE_STALE_MINUTES = 5;
const MAX_SESSION_MINUTES = 12 * 60;

type AnalyticsSection =
  | 'Dashboard'
  | 'News'
  | 'Todos'
  | 'Kalender'
  | 'Umfragen'
  | 'Gruppen'
  | 'Finanzen'
  | 'Profil'
  | 'Sammelkarten'
  | 'Einstellungen'
  | 'Registrierung'
  | 'Feedback'
  | 'Danger'
  | 'Sonstiges';

function getTimestampDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function toIsoDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatDetails(details: unknown): string {
  if (!details) return '-';
  if (typeof details === 'string') return details;

  try {
    return JSON.stringify(details);
  } catch {
    return 'Details nicht lesbar';
  }
}

function getMostRecentVisitedSection(lastVisited: Record<string, string> | null | undefined): string | null {
  if (!lastVisited) return null;

  const entries = Object.entries(lastVisited)
    .map(([section, timestamp]) => ({ section, timestamp: new Date(timestamp) }))
    .filter(({ timestamp }) => !Number.isNaN(timestamp.getTime()))
    .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime());

  const latest = entries[0];
  if (!latest) return null;

  const normalized = latest.section.toLowerCase();
  if (normalized.includes('dashboard')) return 'Dashboard';
  if (normalized.includes('news')) return 'News';
  if (normalized.includes('todo')) return 'Todos';
  if (normalized.includes('kalender') || normalized.includes('event')) return 'Kalender';
  if (normalized.includes('umfragen') || normalized.includes('poll')) return 'Umfragen';
  if (normalized.includes('gruppen') || normalized.includes('group')) return 'Gruppen';
  if (normalized.includes('finanz')) return 'Finanzen';
  if (normalized.includes('profil')) return 'Profil';
  if (normalized.includes('sammelkarten') || normalized.includes('cards')) return 'Sammelkarten';
  return latest.section;
}

function getSectionFromAction(action: string, details: any): AnalyticsSection {
  const actionMap: Record<string, AnalyticsSection> = {
    ACCOUNT_CREATED: 'Registrierung',
    PROFILE_UPDATED: 'Profil',
    PROFILE_DELETED: 'Profil',
    FEEDBACK_CREATED: 'Feedback',
    FEEDBACK_SUBMIT: 'Feedback',
    FEEDBACK_UPDATED: 'Feedback',
    FEEDBACK_DELETED: 'Feedback',
    VOTE_CAST: 'Umfragen',
    POLL_CREATED: 'Umfragen',
    POLL_EDITED: 'Umfragen',
    POLL_DELETED: 'Umfragen',
    FINANCE_ADDED: 'Finanzen',
    FINANCE_EDITED: 'Finanzen',
    FINANCE_DELETED: 'Finanzen',
    TODO_CREATED: 'Todos',
    SUBTODO_CREATED: 'Todos',
    TODO_EDITED: 'Todos',
    TODO_COMPLETED: 'Todos',
    TODO_DELETED: 'Todos',
    EVENT_CREATED: 'Kalender',
    EVENT_EDITED: 'Kalender',
    EVENT_DELETED: 'Kalender',
    NEWS_CREATED: 'News',
    NEWS_EDITED: 'News',
    NEWS_DELETED: 'News',
    NEWS_REACTION: 'News',
    NEWS_COMMENT: 'News',
    GROUP_MEMBER_ADDED: 'Gruppen',
    GROUP_MEMBER_REMOVED: 'Gruppen',
    GROUP_LEADER_ASSIGNED: 'Gruppen',
    GROUP_MESSAGE_CREATED: 'Gruppen',
    GROUP_MESSAGE_DELETED: 'Gruppen',
    GROUP_MESSAGE_PINNED: 'Gruppen',
    LOOT_TEACHER: 'Sammelkarten',
    LOOT_BOOSTER: 'Sammelkarten',
    LOOT_MASS_BOOSTER: 'Sammelkarten',
    TEACHER_VOTE: 'Sammelkarten',
    TEACHERS_BULK_IMPORT: 'Sammelkarten',
    TEACHERS_RARITY_SYNC: 'Sammelkarten',
    CARDS_MIGRATED: 'Sammelkarten',
    CARDS_BULK_IMPORT: 'Sammelkarten',
    CARDS_SETTINGS_UPDATED: 'Sammelkarten',
    GLOBAL_RARITY_SYNC_TRIGGERED: 'Sammelkarten',
    VALIDATE_AND_FIX_RARITIES: 'Sammelkarten',
    REMOVE_TEACHER_CARDS: 'Sammelkarten',
    CLEANUP_POOL: 'Sammelkarten',
    CLEANUP_INVENTORIES: 'Sammelkarten',
    CLEANUP_LEGACY_TEACHERS_VOTED: 'Sammelkarten',
    SYNC_OPENED_PACKS_TO_INVENTORY: 'Sammelkarten',
    SETTINGS_UPDATED: 'Einstellungen',
    GLOBAL_SETTINGS_UPDATED: 'Einstellungen',
    DANGER_ACTION_QUEUED: 'Danger',
    DANGER_ACTION_CANCELLED: 'Danger',
    DANGER_ACTION_EXECUTED: 'Danger',
    DANGER_ACTION_FAILED: 'Danger',
  };

  if (actionMap[action]) return actionMap[action];

  const inferredSection = details?.section || details?.page || details?.module || details?.source || details?.route;
  if (typeof inferredSection === 'string' && inferredSection.trim()) {
    const normalized = inferredSection.trim().toLowerCase();
    if (normalized.includes('dashboard')) return 'Dashboard';
    if (normalized.includes('news')) return 'News';
    if (normalized.includes('todo')) return 'Todos';
    if (normalized.includes('kalender') || normalized.includes('event')) return 'Kalender';
    if (normalized.includes('poll') || normalized.includes('umfrage')) return 'Umfragen';
    if (normalized.includes('gruppe') || normalized.includes('group')) return 'Gruppen';
    if (normalized.includes('finance') || normalized.includes('finanz')) return 'Finanzen';
    if (normalized.includes('profil') || normalized.includes('profile')) return 'Profil';
    if (normalized.includes('card') || normalized.includes('karte')) return 'Sammelkarten';
    if (normalized.includes('settings') || normalized.includes('einstellung')) return 'Einstellungen';
  }

  return 'Sonstiges';
}

export function isProfileEffectivelyOnline(profile: any, now: Date): boolean {
  if (!profile?.isOnline) return false;

  const lastOnline = getTimestampDate(profile.lastOnline);
  if (!lastOnline) return true;

  return (now.getTime() - lastOnline.getTime()) <= ONLINE_STALE_MINUTES * 60 * 1000;
}

function getSessionDurationMinutes(profile: any, now: Date): number {
  const sanitizeDuration = (minutes: number): number => {
    if (!Number.isFinite(minutes) || minutes <= 0) return 0;
    if (minutes > MAX_SESSION_MINUTES) return 0;
    return minutes;
  };

  if (isProfileEffectivelyOnline(profile, now)) {
    const onlineSince = getTimestampDate(profile.onlineSince);
    const fallbackLastOnline = getTimestampDate(profile.lastOnline);
    const start = onlineSince || fallbackLastOnline;
    const onlineMinutes = start ? Math.max(0, (now.getTime() - start.getTime()) / 60000) : 0;
    return sanitizeDuration(onlineMinutes);
  }

  const storedDuration = Number(profile?.lastSessionDurationSeconds);
  if (Number.isFinite(storedDuration) && storedDuration > 0) {
    return sanitizeDuration(storedDuration / 60);
  }

  return 0;
}

export function computeAverageSessionMinutes(profiles: any[], now: Date): number {
  const liveDurations = profiles
    .filter((profile) => isProfileEffectivelyOnline(profile, now))
    .map((profile) => getSessionDurationMinutes(profile, now))
    .filter((value) => value > 0);

  if (liveDurations.length > 0) {
    const totalLive = liveDurations.reduce((sum, value) => sum + value, 0);
    return totalLive / liveDurations.length;
  }

  const storedDurations = profiles
    .map((profile) => getSessionDurationMinutes(profile, now))
    .filter((value) => value > 0);

  if (storedDurations.length === 0) return 0;

  const totalStored = storedDurations.reduce((sum, value) => sum + value, 0);
  return totalStored / storedDurations.length;
}

function getHttpStatusFromHttpsErrorCode(code: string): number {
  const map: Record<string, number> = {
    "invalid-argument": 400,
    "unauthenticated": 401,
    "permission-denied": 403,
    "not-found": 404,
    "already-exists": 409,
    "failed-precondition": 412,
    "resource-exhausted": 429,
    "internal": 500,
    "unavailable": 503,
  };
  return map[code] || 500;
}

function extractBearerToken(request: any): string | null {
  const authHeader = request.get("authorization") || request.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}

async function requireAdminUidFromHttpRequest(request: any, db: FirebaseFirestore.Firestore): Promise<string> {
  const idToken = extractBearerToken(request);
  if (!idToken) {
    throw new HttpsError("unauthenticated", "Fehlendes Bearer-Token.");
  }

  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const uid = decodedToken.uid;
  await assertAdminRole(db, uid);
  return uid;
}

async function assertAdminRole(db: FirebaseFirestore.Firestore, uid: string) {
  const callerProfile = await db.collection("profiles").doc(uid).get();
  const role = callerProfile.data()?.role;
  if (role !== "admin" && role !== "admin_main" && role !== "admin_co") {
    throw new HttpsError("permission-denied", "Nur für Admins zugänglich.");
  }
}

async function buildGlobalStats(db: FirebaseFirestore.Firestore) {
  const profilesSnap = await db.collection("profiles").get();
  const now = new Date();
  const profiles = profilesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
  const onlineUsersCount = profiles.filter((profile) => isProfileEffectivelyOnline(profile, now)).length;
  let totalCards = 0;

  const inventoriesSnap = await db.collection("user_teachers").get();
  inventoriesSnap.forEach((doc) => {
    const inv = doc.data();
    Object.values(inv).forEach((card: any) => {
      totalCards += (card.count || 0);
    });
  });

  const activeTradesSnap = await db.collection("card_trades")
    .where("status", "in", ["pending", "countered"])
    .count().get();

  const completedTradesSnap = await db.collection("card_trades")
    .where("status", "==", "completed")
    .count().get();

  return {
    online_users_count: onlineUsersCount,
    total_users: profilesSnap.size,
    total_cards_count: totalCards,
    active_trades_count: activeTradesSnap.data().count,
    completed_trades_count: completedTradesSnap.data().count,
  };
}

async function buildSystemAnalytics(db: FirebaseFirestore.Firestore) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - ANALYTICS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const windowStartTimestamp = Timestamp.fromDate(windowStart);

  const [profilesSnap, logsSnap] = await Promise.all([
    db.collection("profiles").get(),
    db.collection("logs")
      .where("timestamp", ">=", windowStartTimestamp)
      .orderBy("timestamp", "asc")
      .get(),
  ]);

  const profiles = profilesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
  const logs = logsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];

  const currentOnlineUsers = profiles
    .filter((profile) => isProfileEffectivelyOnline(profile, now))
    .map((profile) => {
      const onlineSince = getTimestampDate(profile.onlineSince);
      const lastOnline = getTimestampDate(profile.lastOnline);
      const currentSection = getMostRecentVisitedSection(profile.last_visited);
      const onlineMinutes = getSessionDurationMinutes(profile, now);

      return {
        id: profile.id,
        full_name: profile.full_name || null,
        email: profile.email || null,
        current_section: currentSection,
        online_since: onlineSince ? onlineSince.toISOString() : null,
        last_online: lastOnline ? lastOnline.toISOString() : null,
        online_minutes: Math.round(onlineMinutes * 10) / 10,
        last_action: null,
        last_action_at: null,
      };
    })
    .sort((left, right) => right.online_minutes - left.online_minutes);

  const latestActionByUser = new Map<string, { action: string; timestamp: string }>();
  const activityByDay = new Map<string, { date: string; label: string; actions: number; uniqueUsers: Set<string> }>();
  const sectionUsage = new Map<string, number>();
  const actionUsage = new Map<string, number>();

  logs.forEach((entry) => {
    const timestamp = getTimestampDate(entry.timestamp);
    if (!timestamp) return;

    const section = getSectionFromAction(entry.action, entry.details);
    const dayKey = toIsoDay(timestamp);
    const existingDay = activityByDay.get(dayKey) || {
      date: dayKey,
      label: timestamp.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }),
      actions: 0,
      uniqueUsers: new Set<string>(),
    };

    existingDay.actions += 1;
    existingDay.uniqueUsers.add(entry.user_id);
    activityByDay.set(dayKey, existingDay);

    sectionUsage.set(section, (sectionUsage.get(section) || 0) + 1);
    actionUsage.set(entry.action, (actionUsage.get(entry.action) || 0) + 1);

    const previous = latestActionByUser.get(entry.user_id);
    const currentTimestamp = timestamp.toISOString();
    if (!previous || previous.timestamp < currentTimestamp) {
      latestActionByUser.set(entry.user_id, { action: entry.action, timestamp: currentTimestamp });
    }
  });

  const currentOnlineUsersWithActivity = currentOnlineUsers.map((user) => {
    const latestAction = latestActionByUser.get(user.id);
    return {
      ...user,
      last_action: latestAction?.action || null,
      last_action_at: latestAction?.timestamp || null,
    };
  });

  const activityTimeline = Array.from(activityByDay.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry) => ({
      date: entry.date,
      label: entry.label,
      active_users: entry.uniqueUsers.size,
      unique_users: entry.uniqueUsers.size,
      actions: entry.actions,
    }));

  const topActions = Array.from(actionUsage.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 12);

  const sectionStats = Array.from(sectionUsage.entries())
    .map(([section, count]) => ({ section, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10);

  const recentActions = [...logs]
    .sort((left, right) => {
      const leftTime = getTimestampDate(left.timestamp)?.getTime() || 0;
      const rightTime = getTimestampDate(right.timestamp)?.getTime() || 0;
      return rightTime - leftTime;
    })
    .slice(0, 12)
    .map((entry) => {
      const timestamp = getTimestampDate(entry.timestamp);

      return {
        id: entry.id,
        timestamp: timestamp ? timestamp.toISOString() : new Date().toISOString(),
        action: entry.action,
        user_id: entry.user_id,
        user_name: entry.user_name || null,
        section: getSectionFromAction(entry.action, entry.details),
        details: formatDetails(entry.details),
      };
    });

  return {
    window_days: ANALYTICS_WINDOW_DAYS,
    generated_at: now.toISOString(),
    total_log_entries: logs.length,
    current_online_users_count: currentOnlineUsersWithActivity.length,
    current_online_users: currentOnlineUsersWithActivity,
    activity_timeline: activityTimeline,
    top_actions: topActions,
    section_usage: sectionStats,
    recent_actions: recentActions,
    average_session_minutes: Math.round(computeAverageSessionMinutes(profiles, now) * 10) / 10,
  };
}

async function resetSessionStatisticsInProfiles(db: FirebaseFirestore.Firestore) {
  const batchSize = 400;
  let processedProfiles = 0;
  let resetProfiles = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let query: FirebaseFirestore.Query = db
      .collection("profiles")
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(batchSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((profileDoc) => {
      processedProfiles += 1;
      batch.update(profileDoc.ref, {
        isOnline: false,
        onlineSince: FieldValue.delete(),
        lastOnline: FieldValue.delete(),
        lastSessionDurationSeconds: FieldValue.delete(),
      });
      resetProfiles += 1;
    });

    await batch.commit();
    lastDoc = snap.docs[snap.docs.length - 1];

    if (snap.size < batchSize) break;
  }

  return {
    processed_profiles: processedProfiles,
    reset_profiles: resetProfiles,
    generated_at: new Date().toISOString(),
  };
}

async function getTotalCardsForUser(db: FirebaseFirestore.Firestore, userId: string) {
  const [profileSnap, inventorySnap] = await Promise.all([
    db.collection("profiles").doc(userId).get(),
    db.collection("user_teachers").doc(userId).get(),
  ])

  if (!profileSnap.exists) {
    throw new HttpsError("not-found", "Profil nicht gefunden.")
  }

  const profile = profileSnap.data() as any
  const cachedTotalCards = Number(profile?.booster_stats?.total_cards) || 0

  const inventoryData = inventorySnap.exists ? (inventorySnap.data() as Record<string, any>) : {}
  const inventoryTotalCards = Object.values(inventoryData).reduce((sum, card) => {
    return sum + (Number((card as any)?.count) || 0)
  }, 0)

  return {
    profile,
    totalCards: Math.max(cachedTotalCards, inventoryTotalCards),
    cachedTotalCards,
    inventoryTotalCards,
  }
}

async function ensureUserOwnsCardVariant(
  db: FirebaseFirestore.Firestore,
  userId: string,
  card: CardSelection,
) {
  const inventorySnap = await db.collection("user_teachers").doc(userId).get();
  const inventoryData = inventorySnap.exists ? (inventorySnap.data() as Record<string, any>) : {};
  const cardEntry = inventoryData[card.teacherId];
  const variantCount = Number(cardEntry?.variants?.[card.variant]) || 0;

  if (variantCount <= 0) {
    throw new HttpsError(
      "failed-precondition",
      "Du kannst keine Karte anbieten, die du nicht besitzt."
    );
  }
}

/**
 * Prüft, ob das Trading-System global aktiviert ist.
 */
async function validateTradingEnabled(db: FirebaseFirestore.Firestore) {
  const featuresSnap = await db.collection("settings").doc("features").get();
  const features = featuresSnap.data();
  if (!features?.is_trading_enabled) {
    throw new HttpsError("failed-precondition", "Das Trading-System ist aktuell deaktiviert.");
  }
}

/**
 * Validiert, ob ein Nutzer die Voraussetzungen zum Tauschen erfüllt (z.B. 100 Karten).
 */
async function validateUserEligibility(db: FirebaseFirestore.Firestore, userId: string) {
  const { profile, totalCards, cachedTotalCards, inventoryTotalCards } = await getTotalCardsForUser(db, userId)

  if (totalCards < MIN_CARDS_FOR_TRADING) {
    throw new HttpsError(
      "failed-precondition", 
      `Du benötigst mindestens ${MIN_CARDS_FOR_TRADING} Karten zum Tauschen (aktuell: ${totalCards}).`
    );
  }

  if (inventoryTotalCards > cachedTotalCards) {
    await db.collection("profiles").doc(userId).set({
      booster_stats: {
        ...(profile.booster_stats || {}),
        total_cards: inventoryTotalCards,
      },
    }, { merge: true })
  }

  return profile;
}

/**
 * Prüft, ob zwei Nutzer befreundet sind.
 */
async function validateFriendship(db: FirebaseFirestore.Firestore, userA: string, userB: string) {
  const friendshipId = [userA, userB].sort().join("__");
  const friendshipSnap = await db.collection("friendships").doc(friendshipId).get();
  if (!friendshipSnap.exists) {
    throw new HttpsError("failed-precondition", "Tauschen ist nur mit Freunden möglich.");
  }
}

/**
 * Prüft, ob eine Karte für den Tausch zulässig ist (keine Iconic/Secret Rare).
 */
function validateCardEligibility(card: CardSelection) {
  if (EXCLUDED_RARITIES.includes(card.rarity)) {
    throw new HttpsError(
      "invalid-argument", 
      `Karten der Seltenheit '${card.rarity}' können nicht getauscht werden.`
    );
  }

  if (EXCLUDED_VARIANTS.includes(card.variant)) {
    throw new HttpsError(
      "invalid-argument",
      "Secret Rare (black_shiny_holo) ist vom Tausch ausgeschlossen."
    );
  }
}

/**
 * Startet ein neues Tauschangebot.
 */
export const sendTradeOffer = onCall({ cors: CALLABLE_CORS_ORIGINS }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  }

  const { receiverId, offeredCard, requestedCard } = request.data;
  const senderId = request.auth.uid;
  const db = getFirestore("abi-data");

  await validateTradingEnabled(db);

  if (senderId === receiverId) {
    throw new HttpsError("invalid-argument", "Tausch mit sich selbst ist nicht möglich.");
  }

  // 1. Voraussetzungen prüfen
  const senderProfile = await validateUserEligibility(db, senderId);
  await validateUserEligibility(db, receiverId);
  await validateFriendship(db, senderId, receiverId);

  // 2. Karten prüfen (Rarity/Foil Match)
  validateCardEligibility(offeredCard);
  validateCardEligibility(requestedCard);
  await ensureUserOwnsCardVariant(db, senderId, offeredCard);
  await ensureUserOwnsCardVariant(db, receiverId, requestedCard);

  if (offeredCard.rarity !== requestedCard.rarity) {
    throw new HttpsError("invalid-argument", "Seltenheiten müssen übereinstimmen.");
  }
  if (offeredCard.variant !== requestedCard.variant) {
    throw new HttpsError("invalid-argument", "Folien-Varianten müssen übereinstimmen.");
  }

  // 3. Trade erstellen
  const tradeRef = db.collection("card_trades").doc();
  const receiverProfileSnap = await db.collection("profiles").doc(receiverId).get();
  const receiverProfile = receiverProfileSnap.data();

  const tradeData: CardTrade & { members: string[] } = {
    id: tradeRef.id,
    senderId,
    receiverId,
    members: [senderId, receiverId],
    senderName: senderProfile.full_name || "Unbekannt",
    receiverName: receiverProfile?.full_name || "Unbekannt",
    status: 'pending',
    offeredCard,
    requestedCard,
    roundCount: 0,
    lastActorId: senderId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000) // 48h
  };

  await tradeRef.set(tradeData);

  // 4. Benachrichtigung
  const notificationId = db.collection("notifications").doc().id;
  await db.collection("notifications").doc(receiverId).collection("messages").doc(notificationId).set({
    id: notificationId,
    userId: receiverId,
    type: "new_trade_offer",
    title: "Neues Tauschangebot",
    message: `${senderProfile.full_name} möchte eine Karte mit dir tauschen.`,
    timestamp: FieldValue.serverTimestamp(),
    tradeId: tradeRef.id,
    read: false
  });

  return { success: true, tradeId: tradeRef.id };
});

/**
 * Erstellt ein Gegenangebot.
 */
export const counterTradeOffer = onCall({ cors: CALLABLE_CORS_ORIGINS }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  }

  const { tradeId, newOfferedCard, newRequestedCard } = request.data;
  const userId = request.auth.uid;
  const db = getFirestore("abi-data");

  await validateTradingEnabled(db);

  return await db.runTransaction(async (transaction) => {
    const tradeRef = db.collection("card_trades").doc(tradeId);
    const tradeSnap = await transaction.get(tradeRef);

    if (!tradeSnap.exists) {
      throw new HttpsError("not-found", "Tausch nicht gefunden.");
    }

    const trade = tradeSnap.data() as CardTrade;
    if (trade.status !== 'pending' && trade.status !== 'countered') {
      throw new HttpsError("failed-precondition", "Dieser Tausch ist nicht mehr aktiv.");
    }

    if (trade.lastActorId === userId) {
      throw new HttpsError("failed-precondition", "Du musst auf die Reaktion des Partners warten.");
    }

    if (trade.roundCount >= 2) {
      throw new HttpsError("failed-precondition", "Maximale Anzahl an Verhandlungsrunden erreicht.");
    }

    // Karten-Validierung (muss zum ursprünglichen Match passen)
    validateCardEligibility(newOfferedCard);
    validateCardEligibility(newRequestedCard);
    
    if (newOfferedCard.rarity !== newRequestedCard.rarity || 
        newOfferedCard.variant !== newRequestedCard.variant) {
      throw new HttpsError("invalid-argument", "Seltenheit und Folie müssen weiterhin übereinstimmen.");
    }

    // Caller must own the card they are newly offering in this counter.
    if (userId === trade.senderId) {
      await ensureUserOwnsCardVariant(db, userId, newOfferedCard);
      await ensureUserOwnsCardVariant(db, trade.receiverId, newRequestedCard);
    } else {
      await ensureUserOwnsCardVariant(db, userId, newRequestedCard);
      await ensureUserOwnsCardVariant(db, trade.senderId, newOfferedCard);
    }

    const nextRound = trade.roundCount + 1;
    const opponentId = trade.senderId === userId ? trade.receiverId : trade.senderId;

    transaction.update(tradeRef, {
      offeredCard: newOfferedCard,
      requestedCard: newRequestedCard,
      roundCount: nextRound,
      lastActorId: userId,
      status: 'countered',
      updatedAt: Timestamp.now()
    });

    // Benachrichtigung
    const notificationId = db.collection("notifications").doc().id;
    const userProfileSnap = await transaction.get(db.collection("profiles").doc(userId));
    const userName = userProfileSnap.data()?.full_name || "Dein Partner";

    transaction.set(db.collection("notifications").doc(opponentId).collection("messages").doc(notificationId), {
      id: notificationId,
      userId: opponentId,
      type: "counter_trade_offer",
      title: "Gegenangebot erhalten",
      message: `${userName} hat ein Gegenangebot für euren Tausch gemacht.`,
      timestamp: FieldValue.serverTimestamp(),
      tradeId: trade.id,
      read: false
    });

    return { success: true };
  });
});

/**
 * Akzeptiert einen Tausch und führt den atomaren Wechsel durch.
 */
export const acceptTradeOffer = onCall({ cors: CALLABLE_CORS_ORIGINS }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  }

  const { tradeId } = request.data;
  const userId = request.auth.uid;
  const db = getFirestore("abi-data");

  await validateTradingEnabled(db);

  return await db.runTransaction(async (transaction) => {
    const tradeRef = db.collection("card_trades").doc(tradeId);
    const tradeSnap = await transaction.get(tradeRef);

    if (!tradeSnap.exists) {
      throw new HttpsError("not-found", "Tausch nicht gefunden.");
    }

    const trade = tradeSnap.data() as CardTrade;
    if (trade.status !== 'pending' && trade.status !== 'countered') {
      throw new HttpsError("failed-precondition", "Dieser Tausch ist nicht mehr aktiv.");
    }

    if (trade.lastActorId === userId) {
      throw new HttpsError("failed-precondition", "Du kannst dein eigenes Angebot nicht annehmen.");
    }

    const opponentId = trade.senderId === userId ? trade.receiverId : trade.senderId;

    // 1. Daily Limit Check
    const userProfileRef = db.collection("profiles").doc(userId);
    const userProfileSnap = await transaction.get(userProfileRef);
    const userProfile = userProfileSnap.data() as any;

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const tradeStats = userProfile.trade_stats || { daily_trades_count: 0, last_trade_date: null };

    if (tradeStats.last_trade_date === today && tradeStats.daily_trades_count >= MAX_TRADES_PER_DAY) {
      throw new HttpsError("failed-precondition", "Du hast dein tägliches Tauschlimit von 3 erreicht.");
    }

    // 2. Inventar-Check (Beide müssen die Karten noch haben)
    const userInventoryRef = db.collection("user_teachers").doc(userId);
    const opponentInventoryRef = db.collection("user_teachers").doc(opponentId);

    const [userInvSnap, oppInvSnap] = await Promise.all([
      transaction.get(userInventoryRef),
      transaction.get(opponentInventoryRef)
    ]);

    const userInv = userInvSnap.data() || {};
    const oppInv = oppInvSnap.data() || {};

    // Wer bietet was?
    // Wenn userId der receiverId ist, bietet er die requestedCard (aus Sicht des senders)
    // Wenn userId der senderId ist, bietet er die offeredCard
    const isUserSender = userId === trade.senderId;
    const userProvidedCard = isUserSender ? trade.offeredCard : trade.requestedCard;
    const oppProvidedCard = isUserSender ? trade.requestedCard : trade.offeredCard;

    // Check user has card
    const userCardEntry = userInv[userProvidedCard.teacherId];
    if (!userCardEntry || (userCardEntry.variants?.[userProvidedCard.variant] || 0) <= 0) {
      throw new HttpsError("failed-precondition", "Du besitzt die angebotene Karte nicht mehr.");
    }

    // Check opponent has card
    const oppCardEntry = oppInv[oppProvidedCard.teacherId];
    if (!oppCardEntry || (oppCardEntry.variants?.[oppProvidedCard.variant] || 0) <= 0) {
      throw new HttpsError("failed-precondition", "Dein Partner besitzt die geforderte Karte nicht mehr.");
    }

    // 3. Atomarer Tausch
    // User gibt Karte ab, erhält Karte vom Gegner
    userInv[userProvidedCard.teacherId].count--;
    userInv[userProvidedCard.teacherId].variants![userProvidedCard.variant]!--;
    
    if (!userInv[oppProvidedCard.teacherId]) {
      userInv[oppProvidedCard.teacherId] = { count: 1, level: 1, variants: { [oppProvidedCard.variant]: 1 } };
    } else {
      userInv[oppProvidedCard.teacherId].count++;
      userInv[oppProvidedCard.teacherId].variants = userInv[oppProvidedCard.teacherId].variants || {};
      userInv[oppProvidedCard.teacherId].variants[oppProvidedCard.variant] = (userInv[oppProvidedCard.teacherId].variants[oppProvidedCard.variant] || 0) + 1;
      userInv[oppProvidedCard.teacherId].level = Math.floor(Math.sqrt(userInv[oppProvidedCard.teacherId].count - 1)) + 1;
    }

    // Gegner gibt Karte ab, erhält Karte vom User
    oppInv[oppProvidedCard.teacherId].count--;
    oppInv[oppProvidedCard.teacherId].variants![oppProvidedCard.variant]!--;

    if (!oppInv[userProvidedCard.teacherId]) {
      oppInv[userProvidedCard.teacherId] = { count: 1, level: 1, variants: { [userProvidedCard.variant]: 1 } };
    } else {
      oppInv[userProvidedCard.teacherId].count++;
      oppInv[userProvidedCard.teacherId].variants = oppInv[userProvidedCard.teacherId].variants || {};
      oppInv[userProvidedCard.teacherId].variants[userProvidedCard.variant] = (oppInv[userProvidedCard.teacherId].variants[userProvidedCard.variant] || 0) + 1;
      oppInv[userProvidedCard.teacherId].level = Math.floor(Math.sqrt(oppInv[userProvidedCard.teacherId].count - 1)) + 1;
    }

    // 4. Updates speichern
    transaction.set(userInventoryRef, userInv);
    transaction.set(opponentInventoryRef, oppInv);

    // Profile Stats Update (Limit + Total Cards bleibt gleich da 1-to-1)
    const newDailyCount = (tradeStats.last_trade_date === today) ? tradeStats.daily_trades_count + 1 : 1;
    transaction.update(userProfileRef, {
      "trade_stats.daily_trades_count": newDailyCount,
      "trade_stats.last_trade_date": today
    });

    // Trade Status abschließen
    transaction.update(tradeRef, {
      status: 'completed',
      updatedAt: Timestamp.now()
    });

    // Benachrichtigung an Gegner
    const notificationId = db.collection("notifications").doc().id;
    transaction.set(db.collection("notifications").doc(opponentId).collection("messages").doc(notificationId), {
      id: notificationId,
      userId: opponentId,
      type: "trade_accepted",
      title: "Tausch erfolgreich!",
      message: `${userProfile.full_name} hat den Tausch angenommen. Deine neue Karte ist da!`,
      timestamp: FieldValue.serverTimestamp(),
      tradeId: trade.id,
      read: false
    });

    return { success: true };
  });
});

/**
 * Lehnt ein Tauschangebot ab.
 */
export const declineTradeOffer = onCall({ cors: CALLABLE_CORS_ORIGINS }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  const { tradeId } = request.data;
  const db = getFirestore("abi-data");
  const tradeRef = db.collection("card_trades").doc(tradeId);
  await tradeRef.update({ status: 'declined', updatedAt: Timestamp.now() });
  return { success: true };
});

/**
 * Bricht ein eigenes Tauschangebot ab.
 */
export const cancelTradeOffer = onCall({ cors: CALLABLE_CORS_ORIGINS }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  const { tradeId } = request.data;
  const db = getFirestore("abi-data");
  const tradeRef = db.collection("card_trades").doc(tradeId);
  const tradeSnap = await tradeRef.get();
  if (tradeSnap.exists && tradeSnap.data()?.senderId === request.auth.uid) {
    await tradeRef.update({ status: 'cancelled', updatedAt: Timestamp.now() });
  }
  return { success: true };
});

/**
 * Aggregiert globale System-Statistiken für das Admin Dashboard.
 */
export const getGlobalStats = onCall({ cors: CALLABLE_CORS_ORIGINS }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  
  try {
    const db = getFirestore("abi-data");
    await assertAdminRole(db, request.auth.uid);
    return await buildGlobalStats(db);
  } catch (error) {
    logger.error("[getGlobalStats] Error aggregating stats:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Ein interner Fehler ist bei der Stats-Aggregation aufgetreten.");
  }
});

/**
 * Liefert Analytics-Daten fuer das Admin System Control Center.
 */
export const getSystemAnalytics = onCall({ cors: CALLABLE_CORS_ORIGINS }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");

  try {
    const db = getFirestore("abi-data");
    await assertAdminRole(db, request.auth.uid);
    return await buildSystemAnalytics(db);
  } catch (error) {
    logger.error("[getSystemAnalytics] Error aggregating analytics:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Ein interner Fehler ist bei den Analytics aufgetreten.");
  }
});

/**
 * Setzt Presence-/Session-Felder fuer alle Profile zurueck.
 */
export const resetSessionStatistics = onCall({ cors: CALLABLE_CORS_ORIGINS }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");

  try {
    const db = getFirestore("abi-data");
    await assertAdminRole(db, request.auth.uid);
    return await resetSessionStatisticsInProfiles(db);
  } catch (error) {
    logger.error("[resetSessionStatistics] Error resetting session statistics:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Ein interner Fehler ist beim Zuruecksetzen der Session-Statistiken aufgetreten.");
  }
});

/**
 * HTTP endpoint variant for admin global stats to avoid browser CORS callable constraints in subdomain local setups.
 */
export const getGlobalStatsHttp = onRequest({ cors: CALLABLE_CORS_ORIGINS }, async (request, response) => {
  try {
    const db = getFirestore("abi-data");
    await requireAdminUidFromHttpRequest(request, db);
    const payload = await buildGlobalStats(db);
    response.status(200).json(payload);
  } catch (error: any) {
    logger.error("[getGlobalStatsHttp] Error aggregating stats:", error);
    if (error instanceof HttpsError) {
      response.status(getHttpStatusFromHttpsErrorCode(error.code)).json({ error: error.code, message: error.message });
      return;
    }
    response.status(500).json({ error: "internal", message: "Ein interner Fehler ist bei der Stats-Aggregation aufgetreten." });
  }
});

/**
 * HTTP endpoint variant for admin analytics to avoid browser CORS callable constraints in subdomain local setups.
 */
export const getSystemAnalyticsHttp = onRequest({ cors: CALLABLE_CORS_ORIGINS }, async (request, response) => {
  try {
    const db = getFirestore("abi-data");
    await requireAdminUidFromHttpRequest(request, db);
    const payload = await buildSystemAnalytics(db);
    response.status(200).json(payload);
  } catch (error: any) {
    logger.error("[getSystemAnalyticsHttp] Error aggregating analytics:", error);
    if (error instanceof HttpsError) {
      response.status(getHttpStatusFromHttpsErrorCode(error.code)).json({ error: error.code, message: error.message });
      return;
    }
    response.status(500).json({ error: "internal", message: "Ein interner Fehler ist bei den Analytics aufgetreten." });
  }
});

/**
 * HTTP endpoint variant for resetting session statistics globally.
 */
export const resetSessionStatisticsHttp = onRequest({ cors: CALLABLE_CORS_ORIGINS }, async (request, response) => {
  try {
    const db = getFirestore("abi-data");
    const adminUid = await requireAdminUidFromHttpRequest(request, db);
    const payload = await resetSessionStatisticsInProfiles(db);
    logger.info("[resetSessionStatisticsHttp] Session statistics reset completed", {
      adminUid,
      resetProfiles: payload.reset_profiles,
    });
    response.status(200).json(payload);
  } catch (error: any) {
    logger.error("[resetSessionStatisticsHttp] Error resetting session statistics:", error);
    if (error instanceof HttpsError) {
      response.status(getHttpStatusFromHttpsErrorCode(error.code)).json({ error: error.code, message: error.message });
      return;
    }
    response.status(500).json({ error: "internal", message: "Ein interner Fehler ist beim Zuruecksetzen der Session-Statistiken aufgetreten." });
  }
});

/**
 * Öffentliche Kennzahlen für die Landingpage.
 */
export const getLandingStats = onRequest({ cors: CALLABLE_CORS_ORIGINS }, async (_request, response) => {
  const db = getFirestore("abi-data");

  const [profilesSnap, dailyActiveSnap, newsSnap, inventoriesSnap] = await Promise.all([
    db.collection("profiles").count().get(),
    db.collection("profiles").where("last_visited.dashboard", ">=", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).count().get(),
    db.collection("news").count().get(),
    db.collection("user_teachers").get(),
  ]);

  let totalCards = 0;
  inventoriesSnap.forEach((doc) => {
    const inventory = doc.data();
    Object.values(inventory).forEach((card: any) => {
      totalCards += Number(card?.count) || 0;
    });
  });

  response.status(200).json({
    total_users: profilesSnap.data().count,
    daily_active_users: dailyActiveSnap.data().count,
    total_cards_count: totalCards,
    news_count: newsSnap.data().count,
  });
});


/**
 * Findet Freunde, die eine bestimmte Karte besitzen.
 */
export const getFriendsWithCard = onCall({ cors: CALLABLE_CORS_ORIGINS }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  const { teacherId, variant } = request.data;
  const userId = request.auth.uid;
  const db = getFirestore("abi-data");

  await validateTradingEnabled(db);

  // 1. Alle Freundschaften laden
  const friendshipsSnap = await db.collection("friendships").where("members", "array-contains", userId).get();
  const friendIds = friendshipsSnap.docs.map(doc => {
    const members = doc.data().members as string[];
    return members.find(id => id !== userId);
  }).filter(id => !!id) as string[];

  if (friendIds.length === 0) return { friends: [] };

  // 2. Inventare dieser Freunde prüfen
  const owners: Array<{ id: string; name: string }> = [];
  
  // Wir laden die Profile für die Namen und prüfen die Inventare
  const profileSnaps = await Promise.all(friendIds.map(id => db.collection("profiles").doc(id).get()));
  const inventorySnaps = await Promise.all(friendIds.map(id => db.collection("user_teachers").doc(id).get()));

  for (let i = 0; i < friendIds.length; i++) {
    const inv = inventorySnaps[i].data();
    if (inv && inv[teacherId] && (inv[teacherId].variants?.[variant] || 0) > 0) {
      owners.push({
        id: friendIds[i],
        name: profileSnaps[i].data()?.full_name || "Unbekannter Freund"
      });
    }
  }

  return { friends: owners };
});

