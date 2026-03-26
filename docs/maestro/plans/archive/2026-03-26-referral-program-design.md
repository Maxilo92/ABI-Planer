# Design Document: Booster Referral Program

**Date**: 2026-03-26
**Status**: Approved
**Design Depth**: standard
**Task Complexity**: complex

## 1. Problem Statement

The goal is to implement a **Booster Referral Program** to drive organic user growth through personal recommendations. Currently, the platform lacks a mechanism for users to invite friends and be rewarded. This feature will provide:
- **Incentive**: 5 boosters for both the referrer and the referred user upon successful profile completion.
- **Engagement**: A monthly limit (25 boosters) and milestone rewards (5 extra boosters for 5 invites) to encourage sustained activity.
- **Security**: Abuse prevention through Firestore transactions, monthly caps, and a dedicated `referrals` collection for auditing.

**Key Decisions**:
- **Shortened ID** — *Using a 6-character unique hash (derived from UID or random) ensures collision resistance and fits the "ultra-short link" request.*
- **Short Link Prefix** — *Using `abi-planer-27.de/r/XXXXXX` prevents Next.js route collisions with users or news while keeping it short.*
- **Profile Completion Trigger** — *Rewarding upon name/class entry balances low friction with user quality (REQ-1).*

## 2. Requirements

### Functional Requirements
- **REQ-1**: Users must be able to generate and share a unique 6-character referral code and link (`abi-planer-27.de/r/XXXXXX`).
- **REQ-2**: New users who sign up via a referral link must automatically have the referrer's UID attributed to their `referred_by` profile field.
- **REQ-3**: Both the referrer and the new user must receive **5 boosters** exactly once when the new user completes their initial profile (Name, Class).
- **REQ-4**: A monthly reward limit of **25 boosters** (5 successful invites) must be enforced for the referrer.
- **REQ-5**: A **5-booster milestone bonus** is awarded for every 5 successful, rewarded referrals (tracked via a dedicated `referrals` collection).

### Non-Functional Requirements
- **NFR-1 (Security)**: Rewards must be handled via Firestore transactions in a Cloud Function to prevent double-spending or abuse.
- **NFR-2 (Performance)**: The referral redirect (`/r/[code]`) must resolve in under 200ms and accurately pass the `ref` parameter to the `/register` page.
- **NFR-3 (UX)**: A dedicated "Freunde einladen" page must clearly display the user's referral code, link, current progress (monthly and total), and GDPR information.

### Constraints
- **CON-1**: No manual user data sharing (DSGVO). Links must be shareable via standard OS sharing or copy-paste.
- **CON-2**: Relies on existing Firebase Authentication and Firestore `profiles` schema.

## 3. Approach

**Selected Approach: Firestore Trigger Cloud Function**

We will implement the referral system as a background process triggered by user profile updates. This ensures that rewards are granted securely and automatically without complicating the client-side registration flow.

**Architecture Overview**:
- **Client-Side**: The `/r/[code]` route captures the 6-character hash, looks up the corresponding `referrerId`, and redirects to `/register?ref=REFERRER_ID`.
- **Registration**: The `ref` parameter is stored in the new user's `Profile` document as `referred_by`.
- **Cloud Function**: An `onUpdate` trigger on the `profiles` collection fires when `is_profile_complete` (or name/class fields) changes. It then:
  1. Validates the referral (not already rewarded, monthly limit not reached).
  2. Uses a **Firestore transaction** to increment `booster_stats.extra_available` for both users by 5.
  3. Creates a record in the `referrals` collection.
  4. Checks for the **5-invite milestone** and awards an additional 5 boosters if reached.

**Alternatives Considered**:
- **Direct Client-Side Rewarding** (Rejected) — *Too risky for abuse and hard to manage concurrent transactions across two user documents.*
- **Manual "Claim" Button** (Rejected) — *Higher friction for users; automated background rewards provide a better "wow" factor upon completion.*

## 4. Architecture

### Key Components
1.  **Short Link Handler (`src/app/r/[id]/page.tsx`)**: Dynamic route that captures the 6-character `referral_code` and redirects to `/register?ref=REFERRER_ID`.
2.  **Registration Extension (`src/app/register/page.tsx`)**: Reads the `ref` query parameter and saves it to the new user's `Profile` document.
3.  **Referral Reward Function (`functions/src/referrals.ts`)**: `onDocumentUpdated` trigger that safely awards boosters using a transaction.
4.  **Invite Dashboard (`src/app/einstellungen/referrals/page.tsx`)**: Displays the user's personal link, monthly limit progress, and milestone status.

### Data Schema Changes
- **`profiles/{uid}`**:
    - `referral_code`: `string` (unique 6-character hash).
    - `referred_by`: `string | null` (UID of the referrer).
- **`referrals/{referralId}`**:
    - `referrerId`: `string`
    - `referredId`: `string`
    - `timestamp`: `Timestamp`
    - `type`: `'standard' | 'milestone'`

## 5. Agent Team
- **`data_engineer`**: Firestore schema and `referrals` collection/indexes.
- **`api_designer`**: Cloud Function implementation (`functions/src/referrals.ts`).
- **`coder`**: Frontend routes (`/r/[id]`, registration update) and dashboard logic.
- **`ux_designer`**: Design and Polish of the "Invite Friends" page.
- **`tester`**: End-to-end validation of the referral flow and limits.

## 6. Risk Assessment
- **Abuse**: Mitigated by profile completion trigger and monthly caps.
- **Consistency**: Handled by Firestore Transactions.
- **Collisions**: Short prefix `/r/` and unique 6-character hashes.

## 7. Success Criteria
- 100% accurate attribution of referrals.
- 100% transaction safety for booster rewards.
- Functional "Invite Friends" dashboard with progress tracking.
