<!-- AGENT_NAV_METADATA -->
<!-- path: docs/maestro/state/2026-03-20-online-status-review.md -->
<!-- role: state-log -->
<!-- read_mode: conditional -->
<!-- token_hint: summary-first -->
<!-- default_action: read only if prior execution state is relevant -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

## Code Review Results

**Scope**: Implementation of "online" and "last online" status across AuthContext, database types, profile page, and utilities.
**Files Reviewed**: 4
**Total Findings**: 1 Major, 1 Minor, 1 Suggestion

### Findings

| # | Severity | File | Line | Description | Suggested Fix |
|---|----------|------|------|-------------|---------------|
| 1 | Major | src/context/AuthContext.tsx | 129 | `updateDoc` in `beforeunload` is asynchronous and may be cancelled by browsers before completion. | The current implementation relies on the 5-minute stale session fallback in `getOnlineStatus`, which is a robust mitigation. No change required if this lag is acceptable. |
| 2 | Minor | src/context/AuthContext.tsx | 118 | Heartbeat interval (120000ms) matches the 2-minute requirement, but multiple tabs will all fire heartbeats. | Consider adding a check for `document.visibilityState === 'visible'` to only heartbeat from the active tab. |
| 3 | Suggestion | src/lib/utils.ts | 40 | `getOnlineStatus` uses a hardcoded 5-minute threshold. | Consider making the 5-minute threshold a constant or configuration value. |

### Summary

The implementation is clean, idiomatic, and correctly follows the approved design. The use of a centralized heartbeat in `AuthContext` ensures consistent tracking, and the `getOnlineStatus` helper provides a robust "stale session" fallback that handles browser crashes or network interruptions gracefully. The UI integration on the profile page is well-integrated with existing components and follows the project's visual style.
