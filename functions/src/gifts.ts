import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

interface GiftBoosterPackData {
    userId?: string;
    userIds?: string[];
    packCount: number;
    customMessage?: string;
    popupTitle?: string;
    popupBody?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    dismissLabel?: string;
    senderName?: string;
    notificationType?: "popup" | "banner" | "quickmessage";
    notificationIcon?: "gift" | "info" | "star" | "message";
}

const isAdminRole = (role: unknown): boolean => {
    return role === "admin" || role === "admin_main" || role === "admin_co";
};

const ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://abi-planer-27.de",
    "https://abi-planer-75319.web.app",
    "https://abi-planer-75319.firebaseapp.com",
];

export const giftBoosterPack = onCall({
    cors: ALLOWED_ORIGINS,
    region: "europe-west3",
}, async (request) => {
    if (!request.auth?.uid) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const db = getFirestore("abi-data");

    const callerProfileRef = db.collection("profiles").doc(request.auth.uid);
    const callerProfileDoc = await callerProfileRef.get();
    const callerProfileData = callerProfileDoc.data() || {};

    if (!isAdminRole(callerProfileData?.role)) {
        throw new HttpsError(
            "permission-denied",
            "Must be an administrative user to call this function.",
        );
    }

    const {
        userId,
        userIds,
        packCount,
        customMessage,
        popupTitle,
        popupBody,
        ctaLabel,
        ctaUrl,
        dismissLabel,
        senderName,
        notificationType,
        notificationIcon,
    } = request.data as GiftBoosterPackData;

    const message = (customMessage || popupBody || "Du hast ein Geschenk erhalten!").trim();
    const normalizedPopupTitle = (popupTitle || "Neue Pack-Schenkung").trim();
    const normalizedPopupBody = (popupBody || message).trim();
    const normalizedCtaLabel = (ctaLabel || "Zu den Packs").trim();
    const normalizedDismissLabel = (dismissLabel || "Okay").trim();
    const normalizedCtaUrl = (ctaUrl || "/sammelkarten").trim();
    const normalizedSenderName = (senderName || callerProfileData.full_name || "System").trim();
    const normalizedNotificationType = notificationType || "popup";
    const normalizedNotificationIcon = notificationIcon || "gift";

    const recipients = Array.from(new Set([
        ...(Array.isArray(userIds) ? userIds : []),
        ...(userId ? [userId] : []),
    ]));

    if (
        recipients.length === 0 ||
        !Number.isFinite(packCount) ||
        packCount < 0 ||
        message.length === 0 ||
        normalizedPopupTitle.length === 0 ||
        normalizedPopupBody.length === 0 ||
        normalizedCtaLabel.length === 0 ||
        normalizedDismissLabel.length === 0 ||
        normalizedSenderName.length === 0
    ) {
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with valid 'userId' or 'userIds', 'packCount', and popup text values.",
        );
    }

    if (!normalizedCtaUrl.startsWith("/")) {
        throw new HttpsError("invalid-argument", "ctaUrl must start with '/'.");
    }

    if (!["popup", "banner", "quickmessage"].includes(normalizedNotificationType)) {
        throw new HttpsError("invalid-argument", "notificationType must be one of: popup, banner, quickmessage.");
    }

    if (!["gift", "info", "star", "message"].includes(normalizedNotificationIcon)) {
        throw new HttpsError("invalid-argument", "notificationIcon must be one of: gift, info, star, message.");
    }

    const safePackCount = Math.floor(packCount);
    if (safePackCount < 0) {
        throw new HttpsError("invalid-argument", "packCount must be at least 0.");
    }

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

                    if (safePackCount > 0) {
                        transaction.set(profileRef, {
                            booster_stats: {
                                extra_available: admin.firestore.FieldValue.increment(safePackCount),
                            },
                        }, { merge: true });
                    }

                    const giftRef = profileRef.collection("unseen_gifts").doc();
                    transaction.set(giftRef, {
                        packCount: safePackCount,
                        customMessage: message,
                        popupTitle: normalizedPopupTitle,
                        popupBody: normalizedPopupBody,
                        ctaLabel: normalizedCtaLabel,
                        ctaUrl: normalizedCtaUrl,
                        dismissLabel: normalizedDismissLabel,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdBy: request.auth?.uid,
                        createdByName: normalizedSenderName,
                        notificationType: normalizedNotificationType,
                        notificationIcon: normalizedNotificationIcon,
                    });

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
        console.error("Error gifting booster pack:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            "internal",
            "An internal error occurred while gifting the booster pack.",
        );
    }
});
