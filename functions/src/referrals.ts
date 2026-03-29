import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Local interface for Profile to avoid shared type issues in Cloud Functions.
 */
interface Profile {
    full_name: string | null;
    class_name?: string | null;
    referred_by: string | null;
    is_referral_claimed?: boolean;
    total_referrals?: number;
    total_referral_boosters?: number;
    booster_stats?: {
        extra_available?: number;
    } | null;
    shop_stats?: {
        month: string;
        counts: Record<string, number>;
    } | null;
}

/**
 * Local interface for Referral to match project convention.
 */
interface Referral {
    referrerId: string;
    referredId: string;
    timestamp: string;
    boostersAwarded: number;
    type: 'standard' | 'milestone';
}

/**
 * Core logic to process a referral reward.
 * Idempotent: checks for existence of referral claim record.
 */
async function processReferralReward(uid: string, after: Profile) {
    const db = getFirestore("abi-data");
    
    if (!after.referred_by) {
        console.log(`[Referral] User ${uid} has no referrer, skipping.`);
        return { success: false, reason: "no_referrer" };
    }

    const referralCode = after.referred_by;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthISO = startOfMonth.toISOString();
    const timestamp = now.toISOString();

    // 0. Find the actual referrer UID from the referral code
    console.log(`[Referral] Looking up referrer for code: ${referralCode}`);
    const referrerQuery = await db.collection("profiles")
        .where("referral_code", "==", referralCode)
        .limit(1)
        .get();

    if (referrerQuery.empty) {
        console.warn(`[Referral] No referrer found with code ${referralCode} for user ${uid}.`);
        return { success: false, reason: "referrer_not_found" };
    }

    const referrerDoc = referrerQuery.docs[0];
    const referrerId = referrerDoc.id;
    const referrerData = referrerDoc.data() as Profile;
    console.log(`[Referral] Found referrer: ${referrerId} (${referrerData.full_name}) for code: ${referralCode}`);

    if (referrerId === uid) {
        console.warn(`[Referral] User ${uid} tried to refer themselves.`);
        return { success: false, reason: "self_referral" };
    }

    // 1. Fetch data for dynamic scaling and caps outside transaction
    console.log(`[Referral] Calculating rewards for referrer ${referrerId}`);
    const [totalCountSnap, monthlyRefsSnap, claimSnap] = await Promise.all([
        db.collection("referral_claims")
            .where("referrer_uid", "==", referrerId)
            .count()
            .get(),
        db.collection("referral_claims")
            .where("referrer_uid", "==", referrerId)
            .where("timestamp", ">=", startOfMonthISO)
            .get(),
        db.collection("referral_claims").doc(uid).get()
    ]);

    if (claimSnap.exists) {
        console.log(`[Referral] Reward already claimed for user ${uid}.`);
        return { success: true, alreadyClaimed: true };
    }

    const totalPastReferrals = totalCountSnap.data().count;
    const currentMonthAwarded = monthlyRefsSnap.docs.reduce((sum, doc) => sum + (doc.data().boosters_awarded_referrer || 0), 0);

    // 2. Calculate rewards
    const baseReward = Math.min(2 + totalPastReferrals, 10);
    const allowedReward = Math.max(0, Math.min(baseReward, 30 - currentMonthAwarded));

    console.log(`[Referral] Stats for ${referrerId}: totalPast=${totalPastReferrals}, currentMonthAwarded=${currentMonthAwarded}, baseReward=${baseReward}, allowedReward=${allowedReward}`);

    // 3. Apply rewards in a transaction
    await db.runTransaction(async (transaction) => {
        const referrerRef = db.collection("profiles").doc(referrerId);
        const referredRef = db.collection("profiles").doc(uid);
        const claimRef = db.collection("referral_claims").doc(uid);
        
        const [referrerSnap, currentClaimSnap] = await Promise.all([
            transaction.get(referrerRef),
            transaction.get(claimRef)
        ]);

        if (!referrerSnap.exists) {
            throw new Error(`Referrer ${referrerId} does not exist.`);
        }

        if (currentClaimSnap.exists) {
            return; // Concurrent request already handled
        }

        // --- Awards ---

        // Referred User
        transaction.set(referredRef, {
            is_referral_claimed: true,
            booster_stats: {
                extra_available: FieldValue.increment(5),
            },
        }, { merge: true });

        const referredGiftRef = referredRef.collection("unseen_gifts").doc();
        transaction.set(referredGiftRef, {
            packCount: 5,
            popupTitle: "Willkommens-Bonus",
            popupBody: "Du hast 5 Packs erhalten, weil du über einen Freunde-Link geworben wurdest!",
            ctaLabel: "Packs öffnen",
            ctaUrl: "/sammelkarten",
            dismissLabel: "Gelesen",
            createdAt: FieldValue.serverTimestamp(),
            createdBy: "system_referral",
        });

        // Referrer
        if (allowedReward > 0) {
            transaction.set(referrerRef, {
                total_referrals: FieldValue.increment(1),
                total_referral_boosters: FieldValue.increment(allowedReward),
                booster_stats: {
                    extra_available: FieldValue.increment(allowedReward),
                },
            }, { merge: true });

            const referrerGiftRef = referrerRef.collection("unseen_gifts").doc();
            transaction.set(referrerGiftRef, {
                packCount: allowedReward,
                popupTitle: "Erfolgreich geworben!",
                popupBody: `Du hast ${allowedReward} Packs erhalten, weil ${after.full_name || 'ein Freund'} deinem Einladungs-Link gefolgt ist!`,
                ctaLabel: "Packs öffnen",
                ctaUrl: "/sammelkarten",
                dismissLabel: "Gelesen",
                createdAt: FieldValue.serverTimestamp(),
                createdBy: "system_referral",
            });
        } else {
            // Still increment referral count even if monthly booster limit reached
            transaction.set(referrerRef, {
                total_referrals: FieldValue.increment(1),
            }, { merge: true });
        }

        // Save claim document (Source of Truth)
        transaction.set(claimRef, {
            referrer_uid: referrerId,
            referred_uid: uid,
            timestamp,
            boosters_awarded_referrer: allowedReward,
            boosters_awarded_referred: 5,
            status: 'claimed'
        });

        // Backward compatibility: also save to legacy referrals collection if needed
        const legacyRef = db.collection("referrals").doc(`std_${uid}`);
        transaction.set(legacyRef, {
            referrerId,
            referredId: uid,
            timestamp,
            boostersAwarded: allowedReward,
            type: 'standard'
        });
    });

    return { success: true };
}

/**
 * Triggered when a user completes their profile. (Safety Fallback)
 */
export const awardReferralBoosters = onDocumentWritten({
    document: "profiles/{uid}",
    database: "abi-data",
    region: "europe-west3",
}, async (event) => {
    const uid = event.params.uid;
    const before = event.data?.before.data() as Profile | undefined;
    const after = event.data?.after.data() as Profile | undefined;

    if (!after) return;

    const wasCompleted = before ? (!!before.full_name?.trim() && !!before.class_name?.trim()) : false;
    const isCompleted = (!!after.full_name?.trim() && !!after.class_name?.trim());

    // Only proceed if profile was just completed and not yet claimed
    if (wasCompleted || !isCompleted || after.is_referral_claimed) {
        return;
    }

    try {
        await processReferralReward(uid, after);
    } catch (error) {
        console.error("[Referral] Error in trigger:", error);
    }
});

/**
 * Client-callable function to claim referral reward.
 * Called on login/registration.
 */
export const claimReferral = onCall({
    region: "europe-west3",
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required.");
    }

    const uid = request.auth.uid;
    const db = getFirestore("abi-data");
    const profileSnap = await db.collection("profiles").doc(uid).get();
    
    if (!profileSnap.exists) {
        throw new HttpsError("not-found", "Profile not found.");
    }

    const profile = profileSnap.data() as Profile;
    
    if (profile.is_referral_claimed) {
        return { success: true, alreadyClaimed: true };
    }

    try {
        return await processReferralReward(uid, profile);
    } catch (error: any) {
        console.error("[Referral] Error in onCall:", error);
        throw new HttpsError("internal", error.message || "Failed to process referral.");
    }
});

/**
 * Admin-only function to migrate legacy referrals to the new robust system.
 */
export const adminMigrateReferrals = onCall({
    region: "europe-west3",
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required.");
    }

    const db = getFirestore("abi-data");
    const callerSnap = await db.collection("profiles").doc(request.auth.uid).get();
    const callerData = callerSnap.data();
    
    if (!callerData || !["admin", "admin_main", "admin_co"].includes(callerData.role)) {
        throw new HttpsError("permission-denied", "Admin only.");
    }

    console.log("[Referral Migration] Starting migration...");
    const legacySnapshot = await db.collection("referrals").get();
    console.log(`[Referral Migration] Found ${legacySnapshot.size} legacy records.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const docSnap of legacySnapshot.docs) {
        const data = docSnap.data() as Referral;
        const referredId = data.referredId || docSnap.id.replace('std_', '');
        
        const profileSnap = await db.collection("profiles").doc(referredId).get();
        if (!profileSnap.exists) {
            console.log(`[Referral Migration] Skipping ${referredId}: Profile not found.`);
            skippedCount++;
            continue;
        }

        const profile = profileSnap.data() as Profile;
        const result = await processReferralReward(referredId, profile);
        
        if (result.success) {
            migratedCount++;
        } else {
            console.log(`[Referral Migration] Failed to migrate ${referredId}: ${result.reason}`);
            skippedCount++;
        }
    }

    return { 
        success: true, 
        migratedCount, 
        skippedCount, 
        totalProcessed: legacySnapshot.size 
    };
});
