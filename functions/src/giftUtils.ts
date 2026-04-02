import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const isAdminRole = (role: unknown): boolean => {
    return role === "admin" || role === "admin_main" || role === "admin_co";
};

// Nur Packs schenken, kein Popup
export const giftOnlyPacks = onCall({
    cors: true,
    region: "europe-west3",
}, async (request) => {
    if (!request.auth?.uid) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const db = getFirestore("abi-data");
    const callerProfileRef = db.collection("profiles").doc(request.auth.uid);
    const callerProfileDoc = await callerProfileRef.get();

    if (!isAdminRole(callerProfileDoc.data()?.role)) {
        throw new HttpsError(
            "permission-denied",
            "Must be an administrative user to call this function."
        );
    }

    const { userId, userIds, packCount } = request.data as {
        userId?: string;
        userIds?: string[];
        packCount: number;
    };

    const recipients = Array.from(new Set([
        ...(Array.isArray(userIds) ? userIds : []),
        ...(userId ? [userId] : []),
    ]));

    if (recipients.length === 0 || !Number.isFinite(packCount) || packCount <= 0) {
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with valid 'userId' or 'userIds' and 'packCount' > 0."
        );
    }

    const safePackCount = Math.floor(packCount);
    const failedUserIds: string[] = [];
    let giftedCount = 0;
    const chunkSize = 50;

    try {
        for (let i = 0; i < recipients.length; i += chunkSize) {
            const chunk = recipients.slice(i, i + chunkSize);

            await db.runTransaction(async (transaction) => {
                const refs = chunk.map((targetUserId) => db.collection("profiles").doc(targetUserId));
                const docs = await Promise.all(refs.map((ref) => transaction.get(ref)));

                for (let index = 0; index < refs.length; index += 1) {
                    const profileRef = refs[index];
                    const profileDoc = docs[index];
                    const targetUserId = chunk[index];

                    if (!profileDoc.exists) {
                        failedUserIds.push(targetUserId);
                        continue;
                    }

                    transaction.set(profileRef, {
                        booster_stats: {
                            extra_available: admin.firestore.FieldValue.increment(safePackCount),
                        },
                    }, { merge: true });

                    giftedCount += 1;
                }
            });
        }

        return {
            success: true,
            giftedCount,
            failedUserIds,
        };
    } catch (error) {
        console.error("Error gifting packs only:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            "internal",
            "An internal error occurred while gifting packs only."
        );
    }
});

// Nur Popup schicken, keine Packs
export const sendUserPopup = onCall({
    cors: true,
    region: "europe-west3",
}, async (request) => {
    if (!request.auth?.uid) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const db = getFirestore("abi-data");
    const callerProfileRef = db.collection("profiles").doc(request.auth.uid);
    const callerProfileDoc = await callerProfileRef.get();

    if (!isAdminRole(callerProfileDoc.data()?.role)) {
        throw new HttpsError(
            "permission-denied",
            "Must be an administrative user to call this function."
        );
    }

    const { userId, userIds, customMessage, popupTitle, popupBody, ctaLabel, ctaUrl, dismissLabel } = request.data as {
        userId?: string;
        userIds?: string[];
        customMessage?: string;
        popupTitle?: string;
        popupBody?: string;
        ctaLabel?: string;
        ctaUrl?: string;
        dismissLabel?: string;
    };

    const recipients = Array.from(new Set([
        ...(Array.isArray(userIds) ? userIds : []),
        ...(userId ? [userId] : []),
    ]));

    const message = (customMessage || popupBody || "Du hast eine neue Nachricht erhalten!").trim();
    const normalizedPopupTitle = (popupTitle || "Hinweis").trim();
    const normalizedPopupBody = (popupBody || message).trim();
    const normalizedCtaLabel = (ctaLabel || "OK").trim();
    const normalizedDismissLabel = (dismissLabel || "Gelesen").trim();
    const normalizedCtaUrl = (ctaUrl || "/").trim();

    if (
        recipients.length === 0 ||
        message.length === 0 ||
        normalizedPopupTitle.length === 0 ||
        normalizedPopupBody.length === 0 ||
        normalizedCtaLabel.length === 0 ||
        normalizedDismissLabel.length === 0
    ) {
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with valid 'userId' or 'userIds' and popup text values."
        );
    }

    if (!normalizedCtaUrl.startsWith("/")) {
        throw new HttpsError("invalid-argument", "ctaUrl must start with '/'.");
    }

    const failedUserIds: string[] = [];
    let popupCount = 0;
    const chunkSize = 50;

    try {
        for (let i = 0; i < recipients.length; i += chunkSize) {
            const chunk = recipients.slice(i, i + chunkSize);

            await db.runTransaction(async (transaction) => {
                const refs = chunk.map((targetUserId) => db.collection("profiles").doc(targetUserId));
                const docs = await Promise.all(refs.map((ref) => transaction.get(ref)));

                for (let index = 0; index < refs.length; index += 1) {
                    const profileRef = refs[index];
                    const profileDoc = docs[index];
                    const targetUserId = chunk[index];

                    if (!profileDoc.exists) {
                        failedUserIds.push(targetUserId);
                        continue;
                    }

                    const giftRef = profileRef.collection("unseen_gifts").doc();
                    transaction.set(giftRef, {
                        packCount: 0,
                        customMessage: message,
                        popupTitle: normalizedPopupTitle,
                        popupBody: normalizedPopupBody,
                        ctaLabel: normalizedCtaLabel,
                        ctaUrl: normalizedCtaUrl,
                        dismissLabel: normalizedDismissLabel,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdBy: request.auth?.uid,
                    });

                    popupCount += 1;
                }
            });
        }

        return {
            success: true,
            popupCount,
            failedUserIds,
        };
    } catch (error) {
        console.error("Error sending popup only:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            "internal",
            "An internal error occurred while sending popup only."
        );
    }
});
