---
design_depth: standard
task_complexity: medium
---

# Design Document: User Online Status Feature

## 1. Problem Statement
The "ABI Planer" project currently lacks real-time visibility into user activity. Users have no way of knowing if someone is currently active or when they were last seen on the platform. Adding an "online" and "last seen" status to user profiles will enhance the social aspect of the app and help users coordinate more effectively.

## 2. Requirements
### Functional
- **Profile Update:** Add `isOnline` (boolean) and `lastOnline` (timestamp) to user profiles in Firestore.
- **Heartbeat:** Implement a timer in `AuthContext` to update these fields every 2 minutes while active.
- **Cleanup:** Clear `isOnline` on tab close/unload via `beforeunload` listener.
- **Display:** Add a status indicator and "Last seen" text to `src/app/profil/[id]/page.tsx`.

### Non-Functional
- **Performance:** Heartbeat frequency should be balanced to avoid excessive Firestore writes (2 per user every 2 minutes while active).
- **Latency:** Online status should reflect within ~2 minutes of inactivity or tab close.
- **Simplicity:** Leverage existing Firestore setup without new infrastructure.

### Constraints
- Must use existing Firestore and React Context (`AuthContext`).
- Status visible to all authenticated users.

## 3. Approach (Selected Approach: Firestore Heartbeat)

- **Architecture**:
  - `AuthContext.tsx`: `useEffect` with a 2-minute `setInterval` and `beforeunload` listener.
  - `Profile` (in `src/types/database.ts`): Updated to include `isOnline` and `lastOnline`.
  - `Profil/[id]/page.tsx`: Profile page showing status based on `isOnline` and `lastOnline`.

- **Rationale**:
  - Consistent with existing Firestore-heavy architecture.
  - Easy to query for a list of online users.
  - Reliable (handles active sessions well).

### Decision Matrix

| Criterion | Weight | Approach 1 (Heartbeat) | Approach 2 (RTDB) | Approach 3 (Calculated) |
|-----------|--------|-----------------------|-------------------|------------------------|
| **Accuracy** | 30% | 4: (Good, ~2 min lag) | 5: (Excellent, instant) | 3: (Fair, threshold-based) |
| **Simplicity** | 30% | 5: (Very simple) | 2: (Complex setup) | 4: (Simple calculation) |
| **Efficiency** | 20% | 3: (Frequent writes) | 5: (Low write cost) | 3: (Frequent writes) |
| **Queryability** | 20% | 5: (Very easy) | 3: (Requires sync) | 2: (Harder range queries) |
| **Weighted Total** | | **4.3** | **3.7** | **3.3** |

## 4. Architecture

- **Component Layer:**
  - `src/context/AuthContext.tsx`: `useEffect` with a 2-minute `setInterval` and `beforeunload` listener.
  - `src/app/profil/[id]/page.tsx`: Profile page showing status based on `isOnline` and `lastOnline`.

- **Data Layer:**
  - `Profile` (in `src/types/database.ts`):
    - `isOnline: boolean`
    - `lastOnline: Timestamp | Date`

- **Flow:**
  1. User opens the app.
  2. `AuthContext` starts a 2-minute heartbeat.
  3. Every 2 mins, `updateDoc` sets `isOnline: true` and `lastOnline: serverTimestamp()`.
  4. User navigates to another's profile.
  5. Profile page reads `isOnline` and `lastOnline`.
  6. If `isOnline` is false, it calculates the "Last seen" time relative to `lastOnline`.

## 5. Risk Assessment

- **Firestore Write Costs:** A user active for 1 hour will generate ~30 writes per session. This is well within Firebase's free tier for small-to-medium user bases.
- **Stale "Online" Status:** If the browser crashes, the user stays "Online" until the next threshold check. Mitigation: The UI will treat `isOnline: true` as `isOnline: false` if `lastOnline` is older than 5 minutes (stale session fallback).
- **Concurrent Tabs:** Multiple tabs will fire heartbeats. A `visibilitychange` listener could be added later for more efficiency.

## 6. Success Criteria
- User's `isOnline` status is correctly updated in Firestore while active.
- Status is correctly cleared to `false` on tab close/unload.
- Other users' profiles show an "Online" indicator or "Last seen [time]" text.
- No regression in app performance or excessive Firestore billing.
