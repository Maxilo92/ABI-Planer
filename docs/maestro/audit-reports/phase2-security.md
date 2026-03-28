# Security Audit Report: Phase 2 - ABI Planer v1.0.0 Readiness

**Auditor:** Gemini CLI (security_engineer)  
**Date:** 2026-03-28  
**Scope:** Firestore Security Rules, Authentication Enforcement, 24h-Delay Danger System.

---

## 1. Executive Summary
The security architecture for ABI Planer v1.0.0 is robust in its core mechanisms, particularly the "Danger System" which utilizes 2FA and mandatory delays. However, a significant gap was identified in the Firestore rules where several collections allow public read access, contradicting the intended "Zero Trust" model.

## 2. Firestore Security Rules Audit (`firestore.rules`)

### 2.1 Public Read Access (High Risk)
Several collections are configured with `allow read: if true;`, making them accessible to unauthenticated users on the public internet. This violates the "Zero Trust" principle stated in `PROJECT_KNOWLEDGE.md`.

**Affected Collections:**
- `/settings/{docId}` (Line 132)
- `/todos/{id}` (Line 137)
- `/events/{id}` (Line 138)
- `/finances/{id}` (Line 142)
- `/news/{id}` (Line 143)
- `/teachers/{teacherId}` (Line 167)
- `/polls/{pollId}` (Line 177)
- `/votes/{voteId}` (Line 196)
- `/poll_votes/{voteId}` (Line 201)

**Recommendation:** Replace `allow read: if true;` with `allow read: if isAuthenticated();` (or `isApproved()` where appropriate) across all identified collections to ensure only authorized school members can access the data.

### 2.2 Profile Data Privacy (Low Risk)
- **Finding:** `allow read: if isAuthenticated();` (Line 76) for `/profiles/{userId}` allows any logged-in user to read any other user's profile.
- **Context:** If profiles contain sensitive data beyond what's needed for collaboration, this should be restricted.

### 2.3 Log Spam Protection (Low Risk)
- **Finding:** `allow create: if isApproved() ...` (Line 206) for `/logs/{logId}`.
- **Risk:** Approved users can theoretically flood the logs collection with arbitrary `action` strings.
- **Recommendation:** Implement rate-limiting via Cloud Functions for logging if volume becomes an issue.

---

## 3. Danger System Audit (`functions/src/danger.ts` & `functions/src/cron.ts`)

### 3.1 Authorization & Authentication (Robust)
- **Findings:**
  - `authorizeDangerAction` strictly enforces `admin_main` role (Line 24).
  - TOTP-based 2FA is mandatory and verified via `otplib` (Line 50).
  - Confirmation string matching is enforced (Line 92).
  - All operations are server-side in Cloud Functions (v2).

### 3.2 24h Delay Enforcement (Robust)
- **Findings:**
  - Creation of `delayed_actions` sets `executableAt` to exactly 24 hours in the future (Line 120).
  - Execution is handled by a scheduled cron job (`every 15 minutes`) in `cron.ts`.
  - The cron job explicitly filters for `executableAt <= now` (Line 25), ensuring the delay is respected.

### 3.3 Delayed Actions Visibility (Medium Risk)
- **Finding:** `allow read: if isMainAdmin() || resource.data.status == 'pending';` (Line 213) in `firestore.rules`.
- **Risk:** Lacks `isAuthenticated()` check. Furthermore, any user can read the full `payload` of a pending action, which might contain sensitive IDs (e.g., `uid` for `WIPE_USER_CARDS`).
- **Recommendation:** Add `isAuthenticated()` check and consider limiting fields returned to non-admins (e.g., hide `payload`).

---

## 4. Auth Enforcement (`PROJECT_KNOWLEDGE.md`)

- **Finding:** Zero Trust claim via email domain restriction (`@hgr-web.lernsax.de`) is correctly implemented in `isLernsax()` rule (Line 11).
- **Finding:** Role-based access control (RBAC) is consistently applied throughout the rules.

---

## 5. Audit Conclusion
The implementation of the 24h-delay Danger system is **excellent** and follows best practices for critical administrative actions. The primary security concern for the v1.0.0 release is the **public read access** in Firestore, which must be addressed to fulfill the security promises made in the project documentation.

## Task Report
- Audited `firestore.rules` for authentication and authorization gaps.
- Audited `functions/src/danger.ts` and `functions/src/cron.ts` for the 24h-delay system integrity.
- Audited `functions/src/mfa.ts` for TOTP security.
- Created `docs/maestro/audit-reports/phase2-security.md` with findings.

## Downstream Context
The findings in this report (specifically the public read access) should be addressed in a follow-up "Fix" batch within Phase 2 or Phase 3.
