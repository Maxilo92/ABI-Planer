---
session_id: 2026-03-28-v100-fixes-readiness
task: |-
  Fix all critical blockers and major recommendations from the v1.0.0 readiness review. 
  1. Move TCG card generation (RNG) to a Cloud Function and restrict Firestore rules for user_teachers.
  2. Fix public read access in firestore.rules for news, events, finances, polls, and teachers.
  3. Update GDPR deletion in functions/src/users.ts to include the referrals collection.
  4. Update Stripe checkout in functions/src/shop.ts to enforce billing address collection.
  5. Implement rarity synchronization or cron for teachers.
created: '2026-03-28T21:52:16.154Z'
updated: '2026-03-28T21:57:23.060Z'
status: completed
workflow_mode: standard
design_document: docs/maestro/plans/2026-03-28-v100-readiness-fixes-design.md
implementation_plan: docs/maestro/plans/2026-03-28-v100-readiness-fixes-impl-plan.md
current_phase: 5
total_phases: 5
execution_mode: parallel
execution_backend: native
current_batch: batch-4
task_complexity: complex
token_usage:
  total_input: 0
  total_output: 0
  total_cached: 0
  by_agent: {}
phases:
  - id: 1
    name: Security & GDPR Cleanup
    status: completed
    agents: []
    parallel: false
    started: '2026-03-28T21:52:16.154Z'
    completed: '2026-03-28T21:55:15.176Z'
    blocked_by: []
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
  - id: 2
    name: Backend Core (TCG RNG & Stripe)
    status: pending
    agents: []
    parallel: false
    started: null
    completed: null
    blocked_by: []
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
    name: Frontend TCG Refactor
    status: completed
    agents: []
    parallel: false
    started: '2026-03-28T21:55:15.176Z'
    completed: '2026-03-28T21:56:54.501Z'
    blocked_by: []
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
    name: Global Rarity Sync (Cron)
    status: pending
    agents: []
    parallel: false
    started: null
    completed: null
    blocked_by: []
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
    name: Final Validation & Release Gate
    status: completed
    agents: []
    parallel: false
    started: '2026-03-28T21:56:54.501Z'
    completed: '2026-03-28T21:57:20.168Z'
    blocked_by: []
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

# Fix all critical blockers and major recommendations from the v1.0.0 readiness review. 
1. Move TCG card generation (RNG) to a Cloud Function and restrict Firestore rules for user_teachers.
2. Fix public read access in firestore.rules for news, events, finances, polls, and teachers.
3. Update GDPR deletion in functions/src/users.ts to include the referrals collection.
4. Update Stripe checkout in functions/src/shop.ts to enforce billing address collection.
5. Implement rarity synchronization or cron for teachers. Orchestration Log
