<!-- AGENT_NAV_METADATA -->
<!-- path: docs/maestro/plans/2026-03-20-groups-page-overhaul-impl-plan.md -->
<!-- role: planning -->
<!-- read_mode: conditional -->
<!-- token_hint: summary-first -->
<!-- default_action: read if task touches planning, audits, or rollout decisions -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

# Implementation Plan: Groups Page Overhaul

**Status**: Proposed
**Design Ref**: 2026-03-20-groups-page-overhaul-design.md
**Execution Mode**: Sequential (Recommended)

## Phase 1: Foundation & Layout (Agent: `coder`)
- **Task**: Refactor `src/app/gruppen/page.tsx` to use the Strict Sidebar-Content layout.
- **Files**: `src/app/gruppen/page.tsx`
- **Scope**:
    - Implement the sidebar-based tab navigation.
    - Setup the responsive layout structure (collapsible sidebar on mobile).
    - Introduce loading skeleton for the initial data fetch.
- **Validation**: Manual verification of layout and tab switching.

## Phase 2: Refactor Group Components (Agent: `coder`)
- **Task**: Implement the Compound Component pattern for group displays.
- **Files**: `src/components/groups/GroupCard.tsx` (New), `src/components/groups/MemberItem.tsx` (New).
- **Scope**:
    - Create `GroupCard` with `Header`, `MemberList`, and `Actions` sub-components.
    - Create `MemberItem` for consistent display of users in a group.
- **Validation**: Verify rendering of group components with mock/real data.

## Phase 3: "Mein Team" View Overhaul (Agent: `coder`)
- **Task**: Redesign the "Mein Team" tab content.
- **Files**: `src/app/gruppen/page.tsx`, `src/components/dashboard/TodoList.tsx`, `src/components/dashboard/CalendarEvents.tsx`.
- **Scope**:
    - Integrate the new `GroupCard` into the "Mein Team" view.
    - Optimize the layout of `TodoList` and `CalendarEvents` within the team dashboard.
    - Improve the "Add Member" UI for group leaders.
- **Validation**: Functional check of all team actions.

## Phase 4: "Alle Gruppen" & "Shared Hub" Redesign (Agent: `coder`)
- **Task**: Update the remaining tabs to match the new UI.
- **Files**: `src/app/gruppen/page.tsx`, `src/components/groups/GroupWall.tsx`.
- **Scope**:
    - Apply `GroupCard` to the list in "Alle Gruppen".
    - Redesign the `GroupWall` layout and message UI for both internal and hub views.
    - Refresh the "Central Member Assignment" UI for planners.
- **Validation**: Verify UI consistency and functional parity across all tabs.

## Phase 5: Final Quality Pass (Agent: `code_reviewer`)
- **Task**: Review the entire overhaul for code quality and UI consistency.
- **Scope**:
    - Check for redundant logic.
    - Verify responsiveness across different screen sizes.
    - Ensure all role-based actions are correctly secured in the new UI.
- **Validation**: Pass code review with no Critical/Major findings.
