# Design Document: Groups Page Overhaul (v2)

**Status**: Approved
**Author**: Maestro Orchestrator
**Date**: 2026-03-20
**Task Complexity**: Medium
**Design Depth**: Deep

## 1. Problem Statement
The current "Planungsgruppen" (Groups) page suffers from visual clutter, inconsistent layouts across tabs, and a lack of clear information hierarchy. Users find the interface "catastrophic" despite the functionality being present. The goal is a ground-up UI/UX overhaul that maintains existing submenu structures while providing a modern, dashboard-like experience.

## 2. Requirements & Scope
- **Ground-up UI/UX Redesign**: Complete visual refresh using modern card layouts, improved typography, and consistent spacing.
- **Submenu Preservation**: Keep the "Mein Team", "Alle Gruppen", and "Shared Hub" tabs.
- **Functional Integrity**: Maintain all existing features (member management, GroupWall/Pinnwand, task/event integration, role-based access).
- **Optimization**: Improve data flow with loading states (skeletons) and smoother transitions.
- **Strict Sidebar-Content Pattern**: Move primary tab navigation or group actions to a persistent sidebar/vertical navigation on desktop to maximize content area.

## 3. Architecture & Patterns
- **Compound Component Pattern**: Rebuild group components using a compound structure (e.g., `GroupCard.Header`, `GroupCard.MemberList`, `GroupCard.Actions`) for better reusability and cleaner parent layouts.
- **Data Integration**: Continue using existing Firestore hooks and Auth context, but encapsulate complex logic into internal helpers or small specialized hooks where it simplifies the UI components.
- **State Management**: Use URL search params (`?bereich=...`) for tab persistence, as currently implemented, but refined.

## 4. Visual Strategy
- **Layout**: Transition from a messy grid to a structured "Strict Sidebar-Content" layout.
- **Components**:
    - **GroupCards**: Elevated cards with subtle borders, clear headers, and categorized actions.
    - **Pinnwand (GroupWall)**: Redesigned message bubbles, better distinction between pinned and regular messages, and a cleaner input area.
    - **Member Lists**: Consistent avatar usage, clear role badges (Leader, Planner), and intuitive management buttons.
- **Feedback**: Robust use of `sonner` for actions and `Loader2` or skeleton screens for asynchronous data.

## 5. Decision Matrix & Traceability
| Decision | Rationale | Alternatives Considered |
| --- | --- | --- |
| **Compound Components** | High flexibility for varied group views (Own vs. All) | Atomic components only (too fragmented) |
| **Strict Sidebar-Content** | Best use of desktop screen real-estate for complex dashboards | Flexible Grid (too unpredictable with varying content) |
| **Sequential Implementation** | Lower risk of breaking critical team coordination features | Parallel Batching (higher coordination overhead) |

## 6. Constraints & Risks
- **Firestore Real-time Sync**: Ensure new component structures don't introduce flickering during `onSnapshot` updates.
- **Role Permissions**: Carefully re-verify that `isPlanner` and `isGroupLeader` checks are correctly applied to all new UI actions.
- **Mobile Responsiveness**: The "Sidebar" must transform into a bottom-nav or top-collapsible menu on mobile.
