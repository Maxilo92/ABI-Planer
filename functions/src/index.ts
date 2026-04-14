import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

// Set global options for all v2 functions
setGlobalOptions({ 
  region: "europe-west3",
  invoker: "public",
});

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export * from "./mfa";
export * from "./danger";
export * from "./cron";
export * from "./logs";
export * from "./gifts";
export * from "./shop";
export * from "./rarity";
export * from "./giftUtils";
export * from "./referrals";
export * from "./users";
export * from "./inventory";
export * from "./cardsManager";
export * from "./trades";
export * from "./groupMessages";
export * from "./npAdmin";
export * from "./combat";
export * from "./feedback";
export * from "./tasks";
