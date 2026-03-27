import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

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
 * Triggered when a user completes their profile.
 * Awards boosters to both referrer and referred user.
 * Triggered when a user completes their profile.
 * Awards boosters to both referrer and referred user.
 * Referrer gets min(2 + totalPastReferrals, 10) boosters, capped at 30 per month.
 * Referred user always gets 5 boosters.
 */
export const awardReferralBoosters = onDocumentWritten({
    document: "profiles/{uid}",
    database: "abi-data",
    region: "europe-west3",
}, async (event) => {
    const db = getFirestore("abi-data");
    const uid = event.params.uid;

    const before = event.data?.before.data() as Profile | undefined;
    const after = event.data?.after.data() as Profile | undefined;

    // If document was deleted, do nothing
    if (!after) return;

    // Detect when full_name and class_name change from empty to non-empty
    const wasCompleted = before ? (!!before.full_name?.trim() && !!before.class_name?.trim()) : false;
    const isCompleted = (!!after.full_name?.trim() && !!after.class_name?.trim());

    // Only proceed if the profile was just completed and there is a referrer
    if (wasCompleted || !isCompleted || !after.referred_by) {
        return;
    }

    const referrerId = after.referred_by;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthISO = startOfMonth.toISOString();
    const timestamp = now.toISOString();

    try {
        // 1. Fetch data for dynamic scaling and caps outside transaction
        // We query the referrals collection to calculate current month's awarded boosters and total past referrals.
        const [totalCountSnap, monthlyRefsSnap] = await Promise.all([
            db.collection("referrals")
                .where("referrerId", "==", referrerId)
                .count()
                .get(),
            db.collection("referrals")
                .where("referrerId", "==", referrerId)
                .where("timestamp", ">=", startOfMonthISO)
                .get()
        ]);

        const totalPastReferrals = totalCountSnap.data().count;
        const currentMonthAwarded = monthlyRefsSnap.docs.reduce((sum, doc) => sum + ((doc.data() as Referral).boostersAwarded || 0), 0);

        // 2. Calculate rewards
        // Base reward: min(2 + totalPastReferrals, 10)
        const baseReward = Math.min(2 + totalPastReferrals, 10);
        // Monthly cap: max 30 boosters per month
        const allowedReward = Math.max(0, Math.min(baseReward, 30 - currentMonthAwarded));

        // 3. Apply rewards in a transaction
        await db.runTransaction(async (transaction) => {
            const referrerRef = db.collection("profiles").doc(referrerId);
            const referredRef = db.collection("profiles").doc(uid);
            
            // Sentinel document to prevent double-spending/rewarding
            const stdReferralRef = db.collection("referrals").doc(`std_${uid}`);
            
            const [referrerSnap, stdReferralSnap] = await Promise.all([
                transaction.get(referrerRef),
                transaction.get(stdReferralRef)
            ]);

            if (!referrerSnap.exists) {
                console.warn(`Referrer ${referrerId} does not exist for referral by ${uid}.`);
                return;
            }

            if (stdReferralSnap.exists) {
                console.log(`Referral reward already granted for user ${uid}.`);
                return;
            }

            // --- Awards ---

            // Award exactly 5 boosters to the referred user
            transaction.set(referredRef, {
                booster_stats: {
                    extra_available: admin.firestore.FieldValue.increment(5),
                },
            }, { merge: true });

            // Create notification for referred user
            const referredGiftRef = referredRef.collection("unseen_gifts").doc();
            transaction.set(referredGiftRef, {
                packCount: 5,
                popupTitle: "Willkommens-Bonus",
                popupBody: "Du hast 5 Packs erhalten, weil du über einen Freunde-Link geworben wurdest!",
                ctaLabel: "Packs öffnen",
                ctaUrl: "/sammelkarten",
                dismissLabel: "Gelesen",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: "system_referral",
            });

            // Award boosters to referrer based on scaling and monthly cap
            if (allowedReward > 0) {
                transaction.set(referrerRef, {
                    booster_stats: {
                        extra_available: admin.firestore.FieldValue.increment(allowedReward),
                    },
                }, { merge: true });
                console.log(`Awarded ${allowedReward} boosters to referrer ${referrerId}`);

                // Create notification for referrer
                const referrerGiftRef = referrerRef.collection("unseen_gifts").doc();
                transaction.set(referrerGiftRef, {
                    packCount: allowedReward,
                    popupTitle: "Erfolgreich geworben!",
                    popupBody: `Du hast ${allowedReward} Packs erhalten, weil ${after.full_name || 'ein Freund'} deinem Einladungs-Link gefolgt ist!`,
                    ctaLabel: "Packs öffnen",
                    ctaUrl: "/sammelkarten",
                    dismissLabel: "Gelesen",
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdBy: "system_referral",
                });
            } else {
                console.log(`Referrer ${referrerId} has reached monthly booster limit (Awarded: ${currentMonthAwarded}/30).`);
            }

            // Save standard referral document
            transaction.set(stdReferralRef, {
                referrerId,
                referredId: uid,
                timestamp,
                boostersAwarded: allowedReward,
                type: 'standard'
            });
        });

        console.log(`Successfully processed referral for user ${uid} by referrer ${referrerId}`);
    } catch (error) {
        console.error("Error in awardReferralBoosters:", error);
    }
});
