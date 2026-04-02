# Implementation Plan - Enhanced Skeleton Loading Sytem

Improve the user experience by replacing full-page loaders and spinners with consistent, high-quality pulsing skeletons across the dashboard and all main subpages.

## User Review Required

> [!IMPORTANT]
> The dashboard will no longer show a "Lade Dashboard..." text. Instead, it will immediately show the layout structure with pulsing skeletons for data-heavy components. Subpages (News, Todos, etc.) will also shift from spinners to skeleton cards.

## Proposed Changes

### Layer 1: Dashboard Overhaul (`src/app/page.tsx`)
- **Action**: Remove the early return `if (!timeoutReached && ...)` that blocks the entire UI.
- **Action**: Ensure all dashboard components (`FundingStatus`, `TodoList`, `CalendarEvents`, `PollList`, `ClassRanking`, `SammelkartenPromo`, `NewsPreview`) receive the correct `loading` prop based on `initialLoadState`.
- **Action**: Standardize the 3-second timeout logic to ensure skeletons eventually disappear even if a background request hangs.

### Layer 2: Subpage Skeleton Integration
- **News Page (`src/app/news/page.tsx`)**: Replace `Loader2` with a grid of 3 news card skeletons (image placeholder + title line + text lines).
- **Todos Page (`src/app/todos/page.tsx`)**: Replace `Loader2` with header skeletons and the `TodoList` skeleton.
- **Calendar Page (`src/app/kalender/page.tsx`)**: Replace `Loader2` with header skeletons and the `CalendarEvents` skeleton.
- **Finance Page (`src/app/finanzen/page.tsx`)**: Replace `Loader2` with 4 status card skeletons, a `FundingStatus` skeleton, and a `Table` skeleton.
- **Profile Page (`src/app/profil/page.tsx`)**: Replace `Loader2` with profile card and stats skeletons.
- **Sammelkarten Page (`src/app/sammelkarten/page.tsx`)**: Replace `Loader2` with a grid of 12-15 card skeletons.

### Layer 3: Component Polish
- **NewsPreview (internal to Dashboard)**: Refine the existing skeleton to match the new `NewsPage` style.
- **PollList**: Ensure the `loading` prop is correctly utilized in the dashboard view.
- **FundingStatus**: Ensure the skeleton matches the exact dimensions of the loaded state to prevent layout shift.

## Phase 1: Dashboard Resilience
- **Objective**: Immediate layout rendering with granular skeletons.
- **Files**:
  - `src/app/page.tsx`
- **Validation**: Dashboard shows layout immediately on refresh; components pulse until data arrives.

## Phase 2: Content Page Skeletons
- **Objective**: Replace spinners on all main navigation pages.
- **Files**:
  - `src/app/news/page.tsx`
  - `src/app/todos/page.tsx`
  - `src/app/kalender/page.tsx`
  - `src/app/finanzen/page.tsx`
  - `src/app/profil/page.tsx`
  - `src/app/sammelkarten/page.tsx`
- **Validation**: Navigating to any page shows skeletons instead of a center spinner.

## Phase 3: Component Consistency
- **Objective**: Final polish of skeleton styles (Pulse animation, rounded corners, matching heights).
- **Files**:
  - `src/components/dashboard/PollList.tsx`
  - `src/components/dashboard/FundingStatus.tsx`
  - `src/components/dashboard/NewsPreview.tsx` (if extracted, otherwise in page.tsx)
- **Validation**: Visual transition from skeleton to data is seamless with minimal layout shift.

## Total Estimated Cost
- **Total Phases**: 3
- **Estimated Input Tokens**: ~20k
- **Estimated Output Tokens**: ~8k
- **Estimated Cost**: ~$0.50

| Phase | Agent | Model | Est. Input | Est. Output | Est. Cost |
|-------|-------|-------|-----------|------------|----------|
| 1 | coder | Pro | 6,000 | 2,000 | $0.14 |
| 2 | coder | Pro | 10,000 | 4,500 | $0.28 |
| 3 | coder | Pro | 4,000 | 1,500 | $0.08 |
| **Total** | | | **20,000** | **8,000** | **$0.50** |
