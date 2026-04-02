# Implementation Plan - Fix Firestore Permission Denied Errors

Prevent systematic `permission-denied` errors by ensuring Firestore `onSnapshot` listeners only initiate when the user is authenticated and, where required, approved.

## User Review Required

> [!IMPORTANT]
> This plan identifies several components that access protected Firestore collections (`settings`, `group_messages`, etc.) without verifying the user's "approved" status first. This causes race conditions during app initialization where listeners start before the `AuthContext` has fully loaded the user's profile.

## Proposed Changes

### Layer 1: Global Components & Hooks
- **CountdownHeader.tsx**: Add `profile?.is_approved` guard to `settings/config` listener.
- **useUserTeachers.ts**: Add `profile?.is_approved` guard to `settings/sammelkarten` listener.

### Layer 2: Dashboard Components
- **ClassRanking.tsx**: Add `useAuth` hook and `profile?.is_approved` guard to `settings/config` listener.
- **TeacherAlbum.tsx**: Add `useAuth` hook and `profile?.is_approved` guard to `settings/sammelkarten` and `settings/global` listeners.
- **GroupWall.tsx**: Add `profile?.is_approved` guard to `group_messages` query listener and `settings/config` fetch.

### Layer 3: Dialogs & Modals
- **AddEventDialog.tsx**: Add `profile?.is_approved` guard to `settings/config` listener inside the `useEffect`.
- **AddFinanceDialog.tsx**: Add `profile?.is_approved` guard to `settings/config` listener.
- **EditEventDialog.tsx**: Add `profile?.is_approved` guard to `settings/config` listener.
- **EditFinanceDialog.tsx**: Add `profile?.is_approved` guard to `settings/config` listener.

## Phase 1: Foundation (Global & Hooks)
- **Objective**: Fix components that are likely to mount earliest or are used across many pages.
- **Files**:
  - `src/components/layout/CountdownHeader.tsx`
  - `src/hooks/useUserTeachers.ts`
- **Agent**: `coder`
- **Validation**:
  - `npm run build` to ensure no lint/type errors.
  - Manual verification: Login and ensure no "permission-denied" errors appear in the console during initial load.

## Phase 2: Dashboard Components
- **Objective**: Fix main dashboard components that trigger listeners on page load.
- **Files**:
  - `src/components/dashboard/ClassRanking.tsx`
  - `src/components/dashboard/TeacherAlbum.tsx`
  - `src/components/groups/GroupWall.tsx`
- **Agent**: `coder`
- **Validation**:
  - Navigate to Dashboard and Groups pages.
  - Check console for permission errors.

## Phase 3: Dialogs & Modals
- **Objective**: Fix dialogs that fetch configuration data when opened.
- **Files**:
  - `src/components/modals/AddEventDialog.tsx`
  - `src/components/modals/AddFinanceDialog.tsx`
  - `src/components/modals/EditEventDialog.tsx`
  - `src/components/modals/EditFinanceDialog.tsx`
- **Agent**: `coder`
- **Validation**:
  - Open each dialog (Events, Finance) and ensure they populate correctly without console errors.

## Total Estimated Cost
- **Total Phases**: 3
- **Estimated Input Tokens**: ~15k
- **Estimated Output Tokens**: ~5k
- **Estimated Cost**: ~$0.40

| Phase | Agent | Model | Est. Input | Est. Output | Est. Cost |
|-------|-------|-------|-----------|------------|----------|
| 1 | coder | Pro | 4,000 | 1,200 | $0.09 |
| 2 | coder | Pro | 6,000 | 2,000 | $0.14 |
| 3 | coder | Pro | 5,000 | 1,800 | $0.12 |
| **Total** | | | **15,000** | **5,000** | **$0.35** |

Note: Cost estimate includes 50% buffer for retries.
