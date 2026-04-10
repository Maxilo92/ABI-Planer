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
    packId?: string;
    customMessage?: string;
    popupTitle?: string;
    popupBody?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    dismissLabel?: string;
    senderName?: string;
    notificationType?: "popup" | "banner" | "quickmessage";
    notificationIcon?: "gift" | "info" | "star" | "message";
    requestId?: string;
    customPackPresetId?: string;
    customPackName?: string;
    customPackAllowRandomFill?: boolean;
    customPackSlots?: Array<{
        slotIndex: number;
        teacherId: string;
        variant?: "normal" | "holo" | "shiny" | "black_shiny_holo";
    }>;
}

type CustomPackSlot = {
    slotIndex: number;
    teacherId: string;
    variant?: "normal" | "holo" | "shiny" | "black_shiny_holo";
};

const ALLOWED_ORIGINS = [
    "https://abi-planer-27.de",
    "https://dashboard.abi-planer-27.de",
    "https://abi-planer-75319.web.app",
    "https://abi-planer-75319.firebaseapp.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    /\.localhost:3000$/,
];

const isAdminRole = (role: unknown): boolean => {
    return role === "admin" || role === "admin_main" || role === "admin_co";
};

const TEACHER_PACK_ID = "teacher_vol1";
const LEGACY_TEACHER_PACK_ID = "teachers_v1";
const normalizePackId = (packId: string) => packId === LEGACY_TEACHER_PACK_ID ? TEACHER_PACK_ID : packId;

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
        packId,
        customMessage,
        popupTitle,
        popupBody,
        ctaLabel,
        ctaUrl,
        dismissLabel,
        senderName,
        notificationType,
        notificationIcon,
        requestId,
        customPackPresetId,
        customPackName,
        customPackAllowRandomFill,
        customPackSlots,
    } = request.data as GiftBoosterPackData;

    const normalizedPackId = normalizePackId((packId || "").trim());
    const isSupportPack = normalizedPackId === "support_vol_1";

    const message = (customMessage || popupBody || "Du hast ein Geschenk erhalten!").trim();
    const normalizedPopupTitle = (popupTitle || "Neue Pack-Schenkung").trim();
    const normalizedPopupBody = (popupBody || message).trim();
    const normalizedCtaLabel = (ctaLabel || "Zu den Packs").trim();
    const normalizedDismissLabel = (dismissLabel || "Okay").trim();
    const normalizedCtaUrl = (ctaUrl || "/sammelkarten").trim();
    const normalizedSenderName = (senderName || callerProfileData.full_name || "System").trim();
    const normalizedNotificationType = notificationType || "popup";
    const normalizedNotificationIcon = notificationIcon || "gift";
    const normalizedRequestId = (requestId || "").trim();
    const normalizedCustomPackName = (customPackName || "").trim();
    const customSlots = Array.isArray(customPackSlots)
        ? customPackSlots
            .map((slot) => ({
                slotIndex: Math.floor(Number(slot?.slotIndex)),
                teacherId: String(slot?.teacherId || "").trim(),
                variant: slot?.variant,
            }))
            .filter((slot) => Number.isFinite(slot.slotIndex) && slot.slotIndex >= 0 && slot.teacherId.length > 0)
        : [];
    const hasCustomPack = customSlots.length > 0;
    const allowRandomFill = customPackAllowRandomFill !== false;

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

    if (normalizedRequestId.length > 80) {
        throw new HttpsError("invalid-argument", "requestId is too long.");
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

    if (hasCustomPack && safePackCount <= 0) {
        throw new HttpsError("invalid-argument", "custom packs require packCount >= 1.");
    }

    if (customSlots.length > 12) {
        throw new HttpsError("invalid-argument", "customPackSlots supports max 12 entries.");
    }

    if (hasCustomPack) {
        const uniqueSlotIndexes = new Set(customSlots.map((slot) => slot.slotIndex));
        if (uniqueSlotIndexes.size !== customSlots.length) {
            throw new HttpsError("invalid-argument", "customPackSlots cannot contain duplicate slotIndex values.");
        }
    }

    const allowedVariants = new Set(["normal", "holo", "shiny", "black_shiny_holo"]);
    for (const slot of customSlots) {
        if (slot.variant && !allowedVariants.has(slot.variant)) {
            throw new HttpsError("invalid-argument", `Invalid custom card variant for slot ${slot.slotIndex}.`);
        }
    }

    let validatedCustomSlots: CustomPackSlot[] = [];
    if (hasCustomPack) {
        const { getCard } = require("./constants/cardRegistry");
        
        for (const slot of customSlots) {
            const card = getCard(slot.teacherId);
            if (!card) {
                throw new HttpsError("invalid-argument", `Card '${slot.teacherId}' not found in registry.`);
            }
        }

        validatedCustomSlots = customSlots.sort((a, b) => a.slotIndex - b.slotIndex);
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

                    const dedupeDocId = normalizedRequestId ? `gift_${normalizedRequestId}` : undefined;
                    const giftRef = dedupeDocId
                        ? profileRef.collection("unseen_gifts").doc(dedupeDocId)
                        : profileRef.collection("unseen_gifts").doc();

                    if (dedupeDocId) {
                        const existingGift = await transaction.get(giftRef);
                        if (existingGift.exists) {
                            continue;
                        }
                    }

                    if (safePackCount > 0) {
                        const packKey = normalizedPackId || TEACHER_PACK_ID;
                        const incrementField = isSupportPack ? "support_extra_available" : "extra_available";
                        
                        const updates: any = {
                            "booster_stats.updated_at": admin.firestore.FieldValue.serverTimestamp(),
                        };
                        
                        // Legacy support
                        updates[`booster_stats.${incrementField}`] = admin.firestore.FieldValue.increment(safePackCount);
                        
                        // New Scalable Inventory
                        updates[`booster_stats.inventory.${packKey}`] = admin.firestore.FieldValue.increment(safePackCount);

                        transaction.set(profileRef, {
                            booster_stats: updates.booster_stats || {}
                        }, { merge: true });
                        
                        // Update using update for deep nesting safety in transactions
                        transaction.update(profileRef, updates);
                    }

                    if (hasCustomPack) {
                        const queueRef = profileRef.collection("custom_pack_queue").doc();
                        transaction.set(queueRef, {
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            createdBy: request.auth?.uid,
                            createdByName: normalizedSenderName,
                            requestId: normalizedRequestId || null,
                            presetId: customPackPresetId || null,
                            name: normalizedCustomPackName || null,
                            totalPacks: safePackCount,
                            remainingPacks: safePackCount,
                            allowRandomFill,
                            slots: validatedCustomSlots,
                            packId: normalizedPackId || TEACHER_PACK_ID,
                        });
                    }

                    transaction.set(giftRef, {
                        packCount: safePackCount,
                        packId: normalizedPackId || null,
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
                        customPackEnabled: hasCustomPack,
                        customPackName: normalizedCustomPackName || null,
                        customPackPresetId: customPackPresetId || null,
                        customPackAllowRandomFill: hasCustomPack ? allowRandomFill : null,
                        customPackSlots: hasCustomPack ? validatedCustomSlots : [],
                        requestId: normalizedRequestId || null,
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
