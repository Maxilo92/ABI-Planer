---
design_depth: standard
task_complexity: complex
---

# Design Document: Sammelkarten Feature Release & Version-Button Easter Egg (v0.21.00)

## 1. Problem Statement
The "Sammelkarten" (trading cards) feature, currently a hidden "Easter Egg," needs to be finalized and transitioned into a permanent, publicly accessible feature for the `v0.21.00` release. Additionally, a new interaction-based reward should be implemented: clicking the version number in the Footer 3 times will grant users 5 free booster packs as a one-time "annoyance" reward from the app.

## 2. Requirements

### Functional Requirements
- **Permanent Visibility**: The Sammelkarten feature must be visible to all users by default in the Navbar and Footer, regardless of any legacy `easter_egg_unlocked` flags.
- **Settings Cleanup**: Remove the "Sammelkarten verstecken" option from the user settings page to reflect its new status as a core feature.
- **Version-Button Reward**: Implement a click counter on the version number in the Footer. After 3 clicks, the user receives 5 free booster packs.
- **Annoyance Feedback**: Display a "get off my back" style message (e.g., "Hör auf zu klicken! Hier hast du 5 Booster, jetzt lass mich in Ruhe!") via a toast notification upon reward.
- **One-time Reward**: The 5-booster reward must be claimable only once per user lifetime.
- **Versioning**: Bump the application version to `v0.21.00` and update the changelog accordingly.

### Non-Functional Requirements
- **Consistency**: Use existing UI patterns (Sonner toast, Footer interaction) for the new reward.
- **Security**: Ensure booster rewards are granted via secure Firestore transactions to prevent data inconsistency or simple client-side manipulation.
- **Maintainability**: Simplify visibility logic by removing conditional checks for the hidden state.

### Constraints
- Must be implemented within the existing React/Next.js/Firestore stack.
- Use the `sync-version.mjs` script for versioning consistency.

## 3. Approach

### Selected Approach: Integrated Release & Interactive Reward
Transition the Sammelkarten feature to a permanent one by simplifying visibility logic and adding a new interaction-based reward in the Footer.

### Alternatives Considered
- **Gradual Rollout**: Keeping the visibility check but defaulting it to "on." This was rejected in favor of a cleaner codebase and true feature permanence.
- **Session-based Reward**: Allowing the 5-booster reward multiple times (e.g., once per day). This was rejected to maintain the booster economy's balance.

### Decision Matrix

| Criterion | Weight | Approach 1: Integrated Release | Approach 2: Gradual Rollout |
|-----------|--------|-------------------------------|---------------------------|
| **Maintainability** | 40% | 5: Simplifies logic. — *Rationale: Removing conditional checks reduces complexity.* | 3: Keeps legacy toggles. |
| **User Experience** | 30% | 5: Direct access to feature. — *Rationale: Immediate value for all users.* | 4: Preserves user choice. |
| **Security** | 20% | 4: Secure via transactions. — *Rationale: Consistency with existing booster logic.* | 4: Consistent security. |
| **Economy Balance** | 10% | 5: One-time, limited reward. — *Rationale: Prevents long-term abuse.* | 3: Potential daily abuse. |
| **Weighted Total** | | **4.8** | **3.5** |

## 4. Architecture

### Component Diagram & Interactions
1.  **Navbar & Footer**: Always render links to `/sammelkarten`.
2.  **Settings Page**: Remove the visibility toggle component.
3.  **Footer**:
    - Manage local `clickCount` state.
    - Call `claimExtraBoosters` after 3 clicks.
    - Trigger `toast()` with the annoyance message.
4.  **useUserTeachers Hook**:
    - Add `claimExtraBoosters` function.
    - Firestore Transaction:
        - Check `extra_boosters_claimed` flag.
        - Increment `available_boosters` by 5.
        - Set `extra_boosters_claimed: true`.

### Data Flow
- User clicks Version Button (Footer) -> Clicks reach 3 -> Hook call `claimExtraBoosters()` -> Firestore Update -> Local state update (Boosters) -> Toast Notification.

## 5. Agent Team
- **Coder**: Lead implementation for UI changes, hook logic, and versioning.
- **Tester**: Verify the 5-booster reward works correctly (once-only) and that the visibility changes are applied across all pages.
- **Technical Writer**: Finalize the `CHANGELOG.md` entry for `v0.21.00`.

## 6. Risk Assessment
- **Feature Abuse**: Users might try to reset their `extra_boosters_claimed` flag.
    - *Mitigation*: Firestore security rules already prevent users from directly editing their profiles without authorization, and the transaction ensures atomic updates.
- **Booster Economy Impact**: Adding 5 free boosters for everyone might slightly accelerate card collection.
    - *Mitigation*: This is a one-time reward and won't affect long-term daily limits.

## 7. Success Criteria
- [ ] Sammelkarten feature is visible to all users in the Navbar and Footer.
- [ ] The "Sammelkarten verstecken" setting is removed from the Settings page.
- [ ] Clicking the version number 3 times grants 5 boosters (verified in Firestore).
- [ ] The "annoyance" toast message appears only on the first success.
- [ ] Version is bumped to `v0.21.00` across `VERSION`, `package.json`, and `CHANGELOG.md`.
