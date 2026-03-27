# Design Document: Feedback List Processing (v0.22.00)

## Background & Motivation
This update addresses a series of bugs and feature requests reported in the feedback export from March 27, 2026. Key areas include the teacher rarity voting system (currently failing due to permission conflicts), feedback visibility for non-admin roles, guest permissions in the calendar, and the introduction of new financial and shop features.

## Scope & Impact
- **Bugs:** 7 critical and major bugs (Voting, Feedback Visibility, Guest Permissions, Referrals, Danger Actions, Calendar Integration).
- **Features:** 5 new features (Teacher Stats, Buyable Packs, Voting Limits, Donation Page, Ranking Links).
- **Impact:** High. Improves the core engagement loop (voting/cards), fixes broken features (referrals/calendar), and adds monetization/funding paths.

## Proposed Solutions

### 1. Teacher Voting & Rarity Limits (Bugs #2, #3, Feature #10)
- **Problem:** Client-side transactions fail because `booster_stats` is admin-only. UI updates before success.
- **Solution:** 
    - Move reward logic (incrementing `booster_stats`) to a new Cloud Function `voteForTeacher`.
    - Enforce `rarity_limits` within this Cloud Function (checking against `settings/global`).
    - Update `TeacherRarityVoting.tsx` to call the Cloud Function instead of performing a client-side transaction.
    - Only update UI state (remove teacher from queue) AFTER successful function call.

### 2. Feedback Visibility (Bug #1)
- **Problem:** Only 'admin' users see non-private feedback from others. 'planner' and 'viewer' roles should also have access.
- **Solution:** 
    - Update `isAdmin` check in `src/app/feedback/page.tsx` to include roles `planner` and `viewer`.
    - Ensure `firestore.rules` allow `read` for these roles on non-private feedback.

### 3. Guest Permissions & "Unbekannt" (Bug #6)
- **Problem:** Guests cannot read profiles to see the creator's name of an event.
- **Solution:** 
    - Denormalize data: Add `created_by_name` to the `Event` document during creation.
    - Create a migration script `scripts/denormalize-event-creators.js` to backfill existing events.
    - Update `src/app/kalender/page.tsx` and detail pages to display `created_by_name`.

### 4. Referrals (Bug #4)
- **Problem:** `awardReferralBoosters` trigger might not fire or fails silently.
- **Solution:** 
    - Add logging to `functions/src/referrals.ts`.
    - Ensure `onProfileUpdate` correctly detects when `full_name` and `class_name` change from empty to non-empty.
    - Verify database name 'abi-data' matches the active project.

### 5. Apple Calendar (Bug #7)
- **Problem:** "In Apple Kalender öffnen" button is non-functional.
- **Solution:** 
    - Investigate `src/lib/icsGenerator.ts`.
    - Ensure the generated ICS file is served with the correct MIME type (`text/calendar`) and disposition, especially for iOS/Safari which often blocks direct downloads. Use a blob URL or data URI with `window.open`.

### 6. New Features
- **Lehrerinfos (Feature #8):** Add `description` field to `Teacher` type. Display in `TeacherRarityVoting` and any teacher-detail views.
- **Packs zum kaufen (Feature #9):** Add a `buyPack` Cloud Function. Add a UI section in `/sammelkarten/shop` for purchasing specific packs with virtual currency (if applicable) or instructions for real-world purchase (as requested by user "für mehr Einnahmen").
- **Spendenseite (Feature #11):** New page `/finanzen/spenden` detailing donation paths for "Am Max" and "Abikasse".
- **Ranking Link (Feature #12):** Add a help/info link to the ranking table in `/finanzen`.

## Alternatives Considered
- **Client-side Rules Change:** Relaxing Firestore rules for `booster_stats` was rejected as it allows users to give themselves infinite boosters.
- **Dynamic Profile Fetching for Guests:** Rejected due to privacy concerns and complex security rules for the `profiles` collection. Denormalization is the standard Firestore pattern for this.

## Migration & Rollback
- Backfill migration for event creator names.
- Rollback: Revert to previous client-side voting logic and Firestore rules if the Cloud Function introduces latency.

## Questions for the User
1. **Packs zum kaufen:** Should this be an automated shop (using a balance/credits) or just a static page with payment info (e.g., PayPal link)?
2. **Lehrer-Stats:** Which stats specifically should be shown? Average rating, total votes, or rarity distribution?
