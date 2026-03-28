---
design_depth: deep
task_complexity: complex
topic: v1.0.0 Readiness Fixes
date: 2026-03-28
---

# Design Document: v1.0.0 Readiness Fixes

## 1. Problem Statement
The v1.0.0 Readiness Review identified four critical security and compliance blockers: (1) client-side TCG RNG vulnerabilities, (2) public Firestore read access, (3) permissive write access to user collections, and (4) incomplete GDPR data deletion. Additionally, the Stripe integration and rarity synchronization require refinement for tax compliance and global stability. These issues pose a high risk of exploitation, data exposure, and financial liability for a public launch.

**Rationale**:
- **Zero-Trust Security** — *Closes all public read access and restricts writes to the server-side.* (Traces To: REQ-1)
- **Financial/TCG Integrity** — *Moves card generation and variant selection to a secure, authoritative Cloud Function.* (Traces To: REQ-2)
- **Legal Compliance (GDPR/MOSS)** — *Ensures complete user deletion and accurate tax data collection.* (Traces To: REQ-3, REQ-4)

## 2. Requirements
### Functional Requirements
- **TCG Logic (REQ-1)**: Move card generation and variant selection from the frontend to a secure `Callable Function` (`openBooster`). The frontend should only trigger the endpoint and "reveal" the results.
- **GDPR Cleanup (REQ-2)**: Extend the `onProfileDeleted` trigger to delete all associated records in the `referrals` collection (`std_${userId}`).
- **Rarity Sync (REQ-3)**: Implement a 15-minute `cron` job in `functions/src/cron.ts` to re-calculate all teacher rarities based on global limits (Legendary: 1, Mythic: 3).

### Non-Functional & Quality Requirements
- **Security (REQ-4)**: Replace all `allow read: if true;` in `firestore.rules` with `allow read: if isAuthenticated() && isLernsax();`. Restrict write access to `user_teachers` to the Admin SDK (Cloud Functions only).
- **Compliance (REQ-5)**: Update `functions/src/shop.ts` to enforce `billing_address_collection: "required"` in the Stripe Checkout Session.
- **Anonymization (REQ-6)**: Implement pseudonymization for `stripe_transactions` when a user profile is deleted (keeping transaction history for 10-year GoBD compliance without PII).

## 3. Approach
### Selected Approach: Secure Core (Logic & Rules)
A comprehensive, security-first approach that moves all critical TCG and compliance logic to Cloud Functions and enforces Zero-Trust Firestore rules.

**Architecture**:
- **TCG Logic**: `Callable Function` (`openBooster`) replaces frontend RNG.
- **Security**: `Zero-Trust` Firestore rules restrict all read/write to authenticated `@hgr-web.lernsax.de` users.
- **GDPR**: `onProfileDeleted` extended to `referrals` with pseudonymized financial records.
- **Stability**: 15-minute `cron` job in `functions/src/cron.ts` for global rarity limits.
- **Compliance**: `billing_address_collection: "required"` in Stripe.

## 4. Architecture & Agent Team
### Agent Team
- **Architect (Lead Fixes)**: Overall review and logic audit of the TCG/Social core.
- **Security Engineer (Internal Security)**: Firestore rules, Auth, and "Danger" system fixes.
- **Compliance Reviewer (Legal & Tax)**: GDPR and Stripe/Tax fixes.
- **Coder (Feature Implementation)**: TCG RNG migration and frontend reveal logic.
- **DevOps Engineer (CI/CD & Deployment)**: CI/CD pipeline and deployment config fixes.

## 5. Risk Assessment
- **TCG Latency (Risk-1)**: Moving RNG to a `Callable Function` might add latency (cold starts, RTT) to the pack-opening animation.
- **Frontend Breaking Changes (Risk-2)**: Refactoring `useUserTeachers.ts` might break existing card display or level-up logic.
- **Bill Shock (Risk-3)**: A 15-minute `cron` job for rarity sync might increase Firestore read/write costs.

## 6. Success Criteria
- **Zero-Client RNG (Success-1)**: All card generation and variant selection logic is removed from the frontend and moved to `functions/src/shop.ts`.
- **Zero-Public Firestore Rules (Success-2)**: All previously public collections (`news`, `events`, `finances`, `polls`, `teachers`) are restricted to authenticated users.
- **Full GDPR Deletion (Success-3)**: `onProfileDeleted` successfully removes records from the `referrals` collection.
- **Stripe Compliance (Success-4)**: `billing_address_collection: "required"` is enforced in the Stripe Checkout Session.
