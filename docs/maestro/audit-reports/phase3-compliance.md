# Compliance Audit Report: Phase 3 - v1.0.0 Readiness
**Date:** 2026-03-28  
**Scope:** Stripe Checkout (VAT/MwSt) & GDPR Data Flows  
**Status:** ⚠️ Partial Compliance (Identified Gaps)

---

## 1. Stripe Checkout & VAT (MwSt) Handling
Audit of Stripe integration for German tax compliance and legal requirements for digital goods.

### Findings
- **VAT Engine:** `automatic_tax: { enabled: true }` is correctly implemented in `functions/src/shop.ts` (line 69). This ensures Stripe calculates and collects the correct VAT based on the customer's location.
- **Legal Notice (Digital Goods):** The checkout session includes the mandatory waiver of withdrawal rights for digital content (`functions/src/shop.ts`, line 74). This is a critical legal requirement in the EU/Germany (Art. 246a § 1 Abs. 3 EGBGB).
- **Audit Logging:** Successful payments are logged in `stripe_transactions` and the general `logs` collection (`functions/src/shop.ts`, lines 135-163).

### Gaps & Risks
1.  **Explicit Address Collection:** The `createStripeCheckoutSession` call does not explicitly set `billing_address_collection: "required"`. For MOSS (VAT on Digital Services) compliance, the seller must collect and verify at least two pieces of non-conflicting location evidence (e.g., billing address and IP address). While Stripe Tax may enforce this automatically, it is recommended to be explicit to ensure tax-relevant data is always captured.
2.  **Email Consistency:** `customer_email` is not pre-filled in the Stripe session. Users might provide a different email address than their account email, complicating support and tax reconciliation.

---
<!-- AGENT_NAV_METADATA -->
<!-- path: docs/maestro/audit-reports/phase3-compliance.md -->
<!-- role: planning -->
<!-- read_mode: conditional -->
<!-- token_hint: summary-first -->
<!-- default_action: read if task touches planning, audits, or rollout decisions -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->


## 2. GDPR Data Flows & Deletion (Right to be Forgotten)
Audit of user deletion completeness and data retention policies.

### Findings
- **Core Deletion:** `functions/src/users.ts` implements `onProfileDeleted`, which cleans up the Firebase Auth account, profile document, and specific subcollections (`unseen_gifts`).
- **Subcollection Cleanup:** Logic correctly iterates through `polls` to delete user votes (`functions/src/users.ts`, lines 48-58).
- **Legitimate Retention:** `stripe_transactions` are retained. This is compliant with GDPR Art. 17(3)(b) as German tax law (GoBD) requires keeping financial records for 10 years.

### Gaps & Risks
1.  **Referrals Collection:** Documents in the `referrals` collection (e.g., `std_${userId}`) are **not** deleted during user cleanup. This leaves PII (user_id and referral context) in the database.
    - **Reference:** `functions/src/referrals.ts` (line 155) creates these documents, but `functions/src/users.ts` does not include them in `userRelatedCollections`.
2.  **Audit Logs:** The `logs` collection contains many entries with `user_id`. These are not purged or pseudonymized upon user deletion. While some logs are needed for security (legitimate interest), they should ideally be scrubbed of the specific `user_id` once the account is gone.
3.  **Data Portability:** There is no automated mechanism for users to request a machine-readable export of their data (GDPR Art. 20), although this is claimed in the `DatenschutzPage`.

---

## 3. Recommended Actions

| Action | Priority | Location |
| :--- | :--- | :--- |
| **Add `referrals` to deletion list** | High | `functions/src/users.ts` (line 31) |
| **Enforce Billing Address Collection** | Medium | `functions/src/shop.ts` (line 58) |
| **Pre-fill `customer_email` in Stripe** | Low | `functions/src/shop.ts` (line 58) |
| **Implement Log Anonymization Trigger** | Medium | New Firestore Trigger or extension to `onProfileDeleted` |

## 4. Conclusion
The system is **60% ready** for v1.0.0 from a compliance perspective. The Stripe checkout is legally sound for digital goods, but the GDPR deletion process has significant gaps in the `referrals` and `logs` collections that must be addressed before the official launch.

---
## Task Report
Performed a comprehensive audit of VAT/Stripe and GDPR flows. Identified specific gaps in user deletion completeness (referrals/logs) and tax-related metadata collection in Stripe.

## Downstream Context
- **Fix Required:** Update `onProfileDeleted` in `functions/src/users.ts` to include the `referrals` collection.
- **Improvement:** Update `createStripeCheckoutSession` in `functions/src/shop.ts` to require billing addresses and pre-fill customer emails.
