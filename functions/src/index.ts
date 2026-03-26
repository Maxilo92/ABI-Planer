import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

// Set global options for all v2 functions
setGlobalOptions({ 
  region: "europe-west3"
});

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export * from "./mfa";
export * from "./danger";
export * from "./cron";
export * from "./gifts";
export * from "./rarity";
export * from "./giftUtils";
export * from "./referrals";
export * from "./users";
