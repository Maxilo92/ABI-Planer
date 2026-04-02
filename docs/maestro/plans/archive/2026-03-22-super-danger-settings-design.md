# Design Document: Super Danger Settings Area

**Objective**: Provide a highly secure, automated, and transparent mechanism for irreversible administrative actions (e.g., wiping all teacher cards) with mandatory multi-factor authentication and a 24-hour cooling-off period.

---

## 1. Problem Statement
The ABI Planer project currently lacks a safe way to perform high-risk administrative tasks. Errors or unauthorized access could lead to unrecoverable data loss. We need a "Danger Zone" that enforces safety through a **24-hour delay** and **2FA (TOTP)** while ensuring all users are notified of impending changes via a **live countdown banner**.

---

## 2. Requirements
**Functional Requirements (Traces to REQ-F1 to REQ-F5):**
- **REQ-F1 (Extensible Framework)**: Support multiple action types (Global Wipe, User Wipe, etc.).
- **REQ-F2 (2FA)**: Mandatory TOTP verification (Google/Apple Authenticator) before an action is queued.
- **REQ-F3 (24h Delay)**: Actions must sit in a "pending" state for 24 hours before execution.
- **REQ-F4 (Automated Execution)**: Firebase Functions must automatically run the task after 24h.
- **REQ-F5 (Global Transparency)**: A live countdown banner must appear for all users when an action is pending.

**Non-Functional Requirements (Traces to REQ-NF1 to REQ-NF3):**
- **REQ-NF1 (Security)**: TOTP secrets must be stored in a `user_secrets` collection restricted to Cloud Functions.
- **REQ-NF2 (Auditability)**: All danger actions (queue, cancel, execute) must be logged in the `logs` collection.
- **REQ-NF3 (Safety)**: A text-input confirmation (e.g., "DELETE") is required during the initial 2FA flow.

**Constraints:**
- Requires **Firebase Blaze (Pay-as-you-go) plan** for Cloud Functions.
- No existing MFA infrastructure; must be implemented from scratch (Custom TOTP).

---

## 3. Proposed Solution: Approach 1 (Integrated Firestore/Functions)
- **UI**: A new `AdminDangerPage` in the admin area and a global `DangerAlertBanner` component.
- **Backend**: **Firebase Cloud Functions** (one Callable for authorization and one Scheduled for execution).
- **Database**: 
    - `delayed_actions`: The queue for pending tasks.
    - `user_secrets`: Restricted doc storage for TOTP secrets.

---

## 4. Architecture
**Key Components**:
- **`AdminDangerPage.tsx`**: The control panel for choosing and triggering danger actions.
- **`DangerAlertBanner.tsx`**: A global banner (similar to the cookie banner) that polls for active, pending danger actions.
- **`authorizeDangerAction` (Callable Function)**: Verifies the TOTP code and the "DELETE" string, then creates a doc in `delayed_actions` with an `executableAt` timestamp (now + 24h).
- **`executeDangerActions` (Scheduled Function)**: Runs every 15 minutes to find and execute actions where `now >= executableAt`.

**Data Flow**:
1. Admin selects action (e.g., "Global Wipe") → Types "DELETE" → Enters 2FA code.
2. `authorizeDangerAction` is called → Validates TOTP/String → Writes to `delayed_actions`.
3. `DangerAlertBanner` starts showing the countdown for all users.
4. After 24h, `executeDangerActions` (Cron) runs → Executes the logic (e.g., batch delete) → Marks task as `completed`.

---

## 5. Risk Assessment
- **Risk 1: Accidental Triggering.** Mitigated by the mandatory 24h window and the text-input confirmation. Actions can be cancelled at any time before execution.
- **Risk 2: 2FA Lockout.** If an admin loses their device, other super-admins (who have `admin_main` roles) can reset their 2FA secret (requires manual intervention in the database or a special admin UI).
- **Risk 3: Logic Errors in Wiping.** A dry-run or unit test for the wiping logic in the Cloud Function is essential.

---

## 6. Success Criteria
1.  **[ ]** 2FA can be successfully set up and verified via Google Authenticator.
2.  **[ ]** Danger actions cannot be executed immediately; they always enter a 24h "pending" state.
3.  **[ ]** A global banner appears for all users with a live countdown when a task is pending.
4.  **[ ]** After 24h, the Cloud Function automatically executes the task without human intervention.
5.  **[ ]** All actions are correctly audited in the system logs.
