---
session_id: 2026-03-27-universal-popup-system
task: Modularize and unify the app's notification system with a universal popup system for small notifications (bottom-right) and important, unskippable messages (center). Create templates/kits and replace existing various popups and banners.
created: '2026-03-27T21:05:53.661Z'
updated: '2026-03-27T21:26:46.775Z'
status: completed
workflow_mode: standard
current_phase: 2
total_phases: 6
execution_mode: sequential
execution_backend: native
current_batch: null
task_complexity: complex
token_usage:
  total_input: 0
  total_output: 0
  total_cached: 0
  by_agent: {}
phases:
  - id: 1
    name: Foundation (Types & Context)
    status: completed
    agents: []
    parallel: false
    started: '2026-03-27T21:05:53.661Z'
    completed: '2026-03-27T21:09:40.473Z'
    blocked_by: []
    files_created:
      - src/types/systemMessages.ts
      - src/context/SystemMessageContext.tsx
    files_modified:
      - src/app/layout.tsx
    files_deleted: []
    downstream_context:
      warnings: []
      integration_points:
        - activeMessages array from useSystemMessage() is the source for rendering.
      assumptions:
        - Downstream agents should verify that SystemMessage objects are correctly passed through the hook.
      key_interfaces_introduced:
        - SystemMessage, SystemMessageType, SystemMessagePriority, SystemMessageAction in src/types/systemMessages.ts
      patterns_established:
        - useSystemMessage hook for triggering messages, SystemMessageProvider manages activeMessages state.
    errors: []
    retry_count: 0
  - id: 2
    name: UI Kit (Toast, Banner, Modal)
    status: in_progress
    agents: []
    parallel: false
    started: '2026-03-27T21:09:40.473Z'
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
    name: Centralized Logic (Firestore Listeners)
    status: pending
    agents: []
    parallel: false
    started: null
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
    name: AppShell Integration
    status: pending
    agents: []
    parallel: false
    started: null
    completed: null
    blocked_by:
      - 2
      - 3
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
    name: Migration (Gifts & Local Triggers)
    status: pending
    agents: []
    parallel: false
    started: null
    completed: null
    blocked_by:
      - 4
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
    name: Quality Assurance & Cleanup
    status: pending
    agents: []
    parallel: false
    started: null
    completed: null
    blocked_by:
      - 5
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

# Modularize and unify the app's notification system with a universal popup system for small notifications (bottom-right) and important, unskippable messages (center). Create templates/kits and replace existing various popups and banners. Orchestration Log
