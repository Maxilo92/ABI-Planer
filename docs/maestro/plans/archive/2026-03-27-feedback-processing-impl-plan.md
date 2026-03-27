# Implementation Plan: Feedback List Processing (v0.22.00)

## Objective
Address critical bugs and implement requested features from the March 27 feedback export, focusing on teacher voting, feedback visibility, guest permissions, and financial information.

## Key Files & Context
- **Voting:** `src/components/dashboard/TeacherRarityVoting.tsx`, `functions/src/rarity.ts`, `firestore.rules`.
- **Feedback:** `src/app/feedback/page.tsx`, `firestore.rules`.
- **Events:** `src/app/kalender/page.tsx`, `functions/src/index.ts` (creation trigger), `scripts/denormalize-event-creators.js`.
- **Referrals:** `functions/src/referrals.ts`.
- **Finances:** `src/app/finanzen/page.tsx`, `src/app/finanzen/spenden/page.tsx` (new).

## Implementation Steps

### Phase 1: Security & Permissions (Bugs 1, 2, 3)
1.  **Feedback Visibility:**
    - Update `src/app/feedback/page.tsx` to include `planner` and `viewer` in `isAdmin` or equivalent check.
    - Update `firestore.rules` to allow `read` on `feedback` for these roles.
2.  **Teacher Voting (Backend):**
    - Create `voteForTeacher` Cloud Function in `functions/src/rarity.ts`.
    - Function should: 
        - Verify user authentication.
        - Check `rarity_limits` from global settings.
        - Increment teacher rating in `teacher_ratings`.
        - Increment user's `booster_stats` in their profile (securely).
        - Add a log entry.
    - Export function in `functions/src/index.ts`.
3.  **Teacher Voting (Frontend):**
    - Update `TeacherRarityVoting.tsx` to call `voteForTeacher` via HTTPS callable.
    - Remove client-side transaction logic.
    - Only update local state (remove teacher from queue) on success.

### Phase 2: Denormalization & Guests (Bug 6)
1.  **Event Creator Name:**
    - Update `Event` type in `src/types/database.ts` to include `created_by_name`.
    - Update event creation logic (wherever events are created) to include `profile.full_name`.
    - Create `scripts/denormalize-event-creators.js` to backfill existing events by fetching the creator's profile.
2.  **Calendar UI:**
    - Update `src/app/kalender/page.tsx` and detail pages to use `event.created_by_name`.

### Phase 3: Investigations & Small Fixes (Bugs 4, 5, 7)
1.  **Referrals:** Add exhaustive logging to `functions/src/referrals.ts` and verify the `full_name` detection logic.
2.  **Super Danger:** Investigate `functions/src/danger.ts` for why `SYSTEM_TEST_DRY_RUN` isn't firing correctly after 30h.
3.  **Apple Calendar:** 
    - Fix `src/lib/icsGenerator.ts` to ensure compatibility with iOS/Safari. 
    - Use `window.open` with a blob URL or ensure the server-side headers (if applicable) are correct.

### Phase 4: Features (8, 11, 12)
1.  **Lehrerinfos:** 
    - Update `Teacher` type in `src/types/cards.ts` to include `description`.
    - Update `TeacherRarityVoting.tsx` to show the description.
2.  **Spendenseite:**
    - Create `src/app/finanzen/spenden/page.tsx` with content for "Am Max" and "Abikasse".
3.  **Ranking Link:**
    - Add a "Mehr Infos" link/button to the ranking table in `src/app/finanzen/page.tsx` pointing to the new donation page or an info modal.

### Phase 5: Cleanup & Versioning
1.  Update `CHANGELOG.md` with all fixes and features.
2.  Increment version in `VERSION` and `package.json`.

## Verification & Testing
- **Voting:** Verify boosters are awarded and rarity limits are enforced.
- **Feedback:** Login as 'planner'/'viewer' and verify other's non-private feedback is visible.
- **Calendar:** Logout and verify event creator names are visible as a guest.
- **Referrals:** Simulate a referral and check logs/rewards.
- **Donation Page:** Verify link works and content is correct.
