<!-- AGENT_NAV_METADATA -->
<!-- path: docs/maestro/audit-reports/phase1-logic.md -->
<!-- role: planning -->
<!-- read_mode: conditional -->
<!-- token_hint: summary-first -->
<!-- default_action: read if task touches planning, audits, or rollout decisions -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

# Audit Report: TCG Logic & Rarity Core (Phase 1)

**Status**: FINALIZED
**Date**: 2026-03-28
**Scope**: Functional correctness of TCG rarity, booster logic, and core transaction flows.

## 1. Executive Summary
The audit has identified a **CRITICAL security vulnerability** in the core TCG booster opening logic. While the server-side rarity calculation (`rarity.ts`) and shop transactions (`shop.ts`) are implemented correctly, the actual generation of cards and variants is performed on the client-side. This, combined with permissive Firestore security rules, allows authenticated users to manipulate their card collections and bypass booster limits entirely.

## 2. Security Audit (Critical Findings)

### 2.1. Client-Side RNG & Card Generation
The card generation logic in `src/app/sammelkarten/page.tsx` and `src/hooks/useUserTeachers.ts` is executed in the user's browser.
- **RNG Vulnerability**: The `generatePack` and `getRandomVariant` functions rely on `Math.random()` on the client. A malicious user can override these functions in the browser console to guarantee "Legendary" or "Secret Rare" (black_shiny_holo) cards.
- **Limit Bypass**: Daily booster limits are checked on the client before calling a Firestore transaction. A user can manually invoke the `collectMassBoosters` function with any card IDs and bypass the `daily_allowance` check by manipulating the client-side state or the transaction inputs.

### 2.2. Permissive Firestore Rules
The `firestore.rules` file allows authenticated users full write access to their own `user_teachers` document:
```javascript
    match /user_teachers/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
```
**Impact**: Users can directly edit their collections via the Firestore SDK, granting themselves any card variant at any level without ever "opening" a booster or spending currency.

## 3. Functional Logic Audit

### 3.1. Rarity Synchronization Gap (`rarity.ts`)
The `calculateTeacherRarity` Cloud Function recalculates teacher rankings and applies global limits correctly using `applyRarityLimits`. However:
- **Partial Updates**: It only updates the Firestore document for the teacher that *triggered* the calculation.
- **Inconsistency**: If a new rating for "Teacher A" pushes "Teacher B" out of the "Legendary" slot due to a limit of 1, "Teacher B" remains marked as "Legendary" in Firestore until someone rates them.
- **Recommendation**: Implement a periodic cleanup (Cron) or a more comprehensive sync that updates all affected teachers when rankings shift.

### 3.2. Booster Reward Logic (`rarity.ts`)
The `voteForTeacher` function awards boosters at milestones (1, 5, 15, 25...).
- **Logic Correctness**: The math `newRatedCount > 5 && (newRatedCount - 5) % 10 === 0` correctly identifies every 10th vote after the 5th.
- **Integrity**: The function is transactional and verifies if the teacher is a valid "loot candidate," ensuring users cannot farm boosters by voting for non-existent or invalid teachers.

### 3.3. Shop & Transactions (`shop.ts`)
- **Stripe Integration**: Checkout sessions include mandatory legal notices for digital goods and use `client_reference_id` for secure user mapping.
- **Idempotency**: The `stripeWebhook` uses a `stripe_transactions` collection to prevent double-crediting of boosters (confirmed transactional).
- **Demo-Buy**: The `purchaseBoosters` function correctly handles monthly limits and resets them automatically when the month changes.

### 3.4. Rarity Weights & Thresholds
The thresholds in `calculateRarityFromAverage` (0.9, 0.75, 0.5, 0.25) match the design documents. The `applyRarityLimits` function correctly cascades demotions (e.g., Legendary -> Mythic -> Epic) if higher-tier slots are full.

## 4. Maintenance & Configuration

### 4.1. Hardcoded Settings
Currently, `rarity_weights`, `godpack_weights`, and `variant_probabilities` are hardcoded in the frontend (`SammelkartenPage.tsx`).
- **Observation**: The proposed "Admin Suite" plan (`2026-03-25-sammelkarten-admin-suite-impl-plan.md`) addresses this by moving weights to `settings/sammelkarten`, but it **retains the client-side execution logic**, which leaves the security flaws unaddressed.

### 4.2. Drop Rate Transparency
The client-side `ProbabilityInfo` component correctly displays probabilities based on the hardcoded weights. However, moving weights to Firestore will require the info page to fetch them dynamically to remain accurate.

## 5. Summary of Recommendations

| Priority | Category | Action Item |
|----------|----------|-------------|
| **CRITICAL** | Security | **Move card generation logic to a Cloud Function.** The client should only call `openBooster()`, and the server should handle RNG, limit checks, and Firestore updates. |
| **CRITICAL** | Security | **Restrict Firestore rules.** Deny direct write access to `user_teachers` for users; only allow updates via the Admin SDK (Cloud Functions). |
| **MEDIUM** | Consistency | **Implement Full Rarity Sync.** Update all teachers affected by ranking shifts in `calculateTeacherRarity`, not just the triggered one. |
| **LOW** | Clean Code | **Centralize Settings.** Complete the "Admin Suite" migration but ensure the logic is server-side. |

## 6. Confirmation of Correctness
Except for the security-related client-side execution, the mathematical logic for rarity assignment, referral rewards, and booster limits is functionally sound and corresponds to the project requirements.
