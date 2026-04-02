---
session_id: 2026-03-19-fixes-and-features
task: Fix UI clipping for ClassLeaderboard, fix calendar sorting (past events at bottom), add mentions for people/roles/groups in calendar events, fix registration course selection skip, and allow course changes in settings.
created: '2026-03-19T19:06:05.897Z'
updated: '2026-03-19T19:17:17.011Z'
status: completed
workflow_mode: standard
design_document: docs/maestro/plans/2026-03-19-fixes-and-features-design.md
implementation_plan: docs/maestro/plans/2026-03-19-fixes-and-features-impl-plan.md
current_phase: 7
total_phases: 7
execution_mode: parallel
execution_backend: native
current_batch: batch-1-2026-03-19-fixes-and-features
task_complexity: complex
token_usage:
  total_input: 0
  total_output: 0
  total_cached: 0
  by_agent: {}
phases:
  - id: 1
    name: Foundation (Types & Schema)
    status: completed
    agents: []
    parallel: false
    started: '2026-03-19T19:06:05.897Z'
    completed: '2026-03-19T19:08:38.701Z'
    blocked_by: []
    files_created: []
    files_modified:
      - src/types/database.ts
    files_deleted: []
    downstream_context:
      key_interfaces_introduced:
        - Event interface expanded with mentioned_user_ids, mentioned_roles, mentioned_groups in src/types/database.ts
    errors: []
    retry_count: 0
  - id: 2
    name: UI - Class Ranking
    status: in_progress
    agents: []
    parallel: true
    started: '2026-03-19T19:08:38.701Z'
    completed: null
    blocked_by:
      - 1
    files_created: []
    files_modified: []
    files_deleted: []
    downstream_context:
      key_interfaces_introduced: []
      patterns_established: []
      integration_points: []
      assumptions: []
      warnings: []
    errors: []
    retry_count: 0
  - id: 3
    name: Logic - Calendar Sorting
    status: in_progress
    agents: []
    parallel: true
    started: '2026-03-19T19:08:38.701Z'
    completed: null
    blocked_by:
      - 1
    files_created: []
    files_modified: []
    files_deleted: []
    downstream_context:
      key_interfaces_introduced: []
      patterns_established: []
      integration_points: []
      assumptions: []
      warnings: []
    errors: []
    retry_count: 0
  - id: 4
    name: Feature - Event Mentions
    status: in_progress
    agents: []
    parallel: true
    started: '2026-03-19T19:08:38.701Z'
    completed: null
    blocked_by:
      - 1
    files_created: []
    files_modified: []
    files_deleted: []
    downstream_context:
      key_interfaces_introduced: []
      patterns_established: []
      integration_points: []
      assumptions: []
      warnings: []
    errors: []
    retry_count: 0
  - id: 5
    name: Bug Fix - Registration Flow
    status: in_progress
    agents: []
    parallel: true
    started: '2026-03-19T19:08:38.701Z'
    completed: null
    blocked_by:
      - 1
    files_created: []
    files_modified: []
    files_deleted: []
    downstream_context:
      key_interfaces_introduced: []
      patterns_established: []
      integration_points: []
      assumptions: []
      warnings: []
    errors: []
    retry_count: 0
  - id: 6
    name: Feature - Settings Course Change
    status: completed
    agents: []
    parallel: true
    started: '2026-03-19T19:08:38.701Z'
    completed: '2026-03-19T19:12:51.467Z'
    blocked_by:
      - 1
    files_created:
      - src/components/dashboard/ClassRanking.tsx
    files_modified:
      - src/app/page.tsx
      - src/components/dashboard/CalendarEvents.tsx
      - src/app/kalender/page.tsx
      - src/components/modals/AddEventDialog.tsx
      - src/components/modals/EditEventDialog.tsx
      - src/components/modals/CalendarEventDetailsDialog.tsx
      - src/app/register/page.tsx
      - src/app/profil/page.tsx
    files_deleted: []
    downstream_context:
      warnings:
        - Registration button is now a submit type to prevent race conditions in Step 3.
      patterns_established:
        - Upcoming events sorted asc, past events sorted desc at the bottom.
        - Mentions stored as arrays of IDs/Roles/Groups in Event documents.
    errors: []
    retry_count: 0
  - id: 7
    name: Validation & Cleanup
    status: in_progress
    agents: []
    parallel: false
    started: '2026-03-19T19:12:51.467Z'
    completed: null
    blocked_by:
      - 2
      - 3
      - 4
      - 5
      - 6
    files_created: []
    files_modified: []
    files_deleted: []
    downstream_context:
      key_interfaces_introduced: []
      patterns_established: []
      integration_points: []
      assumptions: []
      warnings: []
    errors: []
    retry_count: 0
---

# Fix UI clipping for ClassLeaderboard, fix calendar sorting (past events at bottom), add mentions for people/roles/groups in calendar events, fix registration course selection skip, and allow course changes in settings. Orchestration Log
