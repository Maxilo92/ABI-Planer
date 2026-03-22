import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export * from "./mfa";
export * from "./danger";
export * from "./cron";
export { functions, admin };
