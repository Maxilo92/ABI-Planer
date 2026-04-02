# Implementation Plan: Bug Fixes & Feature Implementation (Batch 2026-03-19)

**Status:** Draft
**Phases:** 4
**Agents:** 3

## Phase 1: Auth & Registration (Critical)
- **Goal:** Fix critical authentication and registration flow bugs.
- **Tasks:**
  - Fix registration "ficking" the app: Ensure user state is correctly updated after registration and the "Login" button is replaced by the user's profile/settings (`src/app/register/page.tsx`, `src/context/AuthContext.tsx`).
  - Fix settings page accessibility after registration (`src/app/einstellungen/page.tsx`).
  - Fix "Nutzer können nicht Admin werden" (The option is missing) in `src/app/profil/[id]/page.tsx` or `src/app/admin/page.tsx`.
- **Agent:** `coder`
- **Validation:** Manual login/registration flow test; Verify settings page accessibility.

## Phase 2: UI, Navigation & Responsiveness
- **Goal:** Address navigation glitches, theme toggle visibility, and Tablet/iPad layout issues.
- **Tasks:**
  - Fix admin menu glitch (admin feedback selection selects "admin" as well) in `src/components/layout/Navbar.tsx`.
  - Improve Theme Toggle visibility (show active selection) in `src/components/layout/ThemeToggle.tsx`.
  - iPad/Tablet layout fixes: Ensure the footer and profile button stick correctly using adaptive styling (relative units/media queries) in `src/components/layout/AppShell.tsx` and `Footer.tsx`.
  - Fix red notification dots not disappearing in `src/hooks/useNotifications.ts`.
- **Agent:** `ux_designer` / `coder`
- **Validation:** Visual UI tests on multiple screen sizes; Verify navigation menu highlighting.

## Phase 3: Core Features (Finances & Feedback)
- **Goal:** Update financial calculations and implement a public bug reporting system.
- **Tasks:**
  - Financial updates: Show estimated amount, calculate ticket prices, and ensure expenses don't solely make up the target sum (`src/app/finanzen/page.tsx`).
  - Public bug report page: Make feedback/bugs public and allow image uploads (`src/app/feedback/page.tsx`, `src/app/admin/feedback/page.tsx`).
  - Kalender fix: Make events clickable with a detail view in `src/app/kalender/page.tsx`.
  - Abstimmung: Allow users to withdraw their participation in `src/app/abstimmungen/page.tsx`.
- **Agent:** `coder`
- **Validation:** Verify financial calculations; Test feedback visibility and image uploads; Test calendar interactivity.

## Phase 4: New Modules & Legal
- **Goal:** Implement the groups system, logging, and legal pages.
- **Tasks:**
  - Groups: Implement groups with leaders and members, including internal features (`src/app/gruppen/page.tsx` - new page).
  - Logs: Implement detailed action logging (timestamp + user) in `src/lib/firebase.ts` or a new logging utility.
  - Legal: Create the AGB/Legal page at `src/app/impressum/page.tsx` or a new `src/app/agb/page.tsx`.
  - Support for special characters: Ensure correct handling of ä, ö, ü in `src/lib/utils.ts` or relevant UI components.
- **Agent:** `coder`
- **Validation:** Test group management; Verify logs are created for actions; Check AGB page content.

## Final Review
- **Goal:** Ensure all 19 reports are addressed and no regressions were introduced.
- **Tasks:**
  - Final manual QA pass across all 19 reports.
  - Run `scripts/regression-guard.mjs`.
  - Code review of all changes.
- **Agent:** `code_reviewer`
