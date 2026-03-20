# Design Document: ToDo Sub-tasks & Log Spam Fix

**Date:** 2026-03-20
**Status:** Draft
**Design Depth:** Quick
**Task Complexity:** Medium

## 1. Problem Statement

The application currently suffers from two main issues:
1. **Log Spam:** On every page refresh (specifically on the Dashboard and Finance pages), a redundant log entry is created: `{"field":"expected_ticket_sales","value":300,"source":"dashboard"}`. This is caused by a `useEffect` loop in the `FundingStatus` component that triggers an update on mount even if the value hasn't changed.
2. **Limited ToDo System:** The current ToDo system only supports a flat list of tasks. Users need the ability to create sub-tasks (nested tasks) to better organize their work.

## 2. Requirements

### Functional Requirements
- **Log Fix:** Prevent redundant Firestore writes and log actions when the `FundingStatus` component initializes.
- **Sub-tasks:**
    - Support recursive nesting (tasks can have sub-tasks, which can have their own sub-tasks).
    - Allow users to create a sub-task for any existing task.
    - Display sub-tasks in an indented list under their parent task in the `TodoList`.
    - Cascade deletion: Deleting a parent task automatically deletes all its descendants.
    - Independent completion: Sub-task status does not automatically update parent task status.

### Non-Functional Requirements
- **Data Integrity:** Ensure that the `parent_id` relationship is maintained correctly in Firestore.
- **Performance:** Efficiently fetch and render the task tree without excessive re-renders or database queries.
- **UI Consistency:** Maintain the existing look and feel using Shadcn UI components.

## 3. Approach

### Log Spam Fix
Modify `src/components/dashboard/FundingStatus.tsx`:
- Use a `ref` or simple state comparison to check if the `ticketSalesInput` has actually changed from the `initialTicketSales` prop before calling `onTicketSalesChange`.
- This ensures that the component only "reports" changes that are truly new (or triggered by user interaction).

### ToDo Sub-tasks
Modify `src/types/database.ts`:
- Add an optional `parentId?: string | null` field to the `Todo` interface.

Modify `src/components/dashboard/TodoList.tsx`:
- Implement a recursive rendering function or a flattened tree structure to display tasks and their descendants with increasing indentation.
- Update the `handleDelete` logic to perform cascading deletes for all sub-tasks in Firestore.

Modify `src/modals/AddTodoDialog.tsx`:
- Accept an optional `parentId` prop to pre-fill the parent task when creating a sub-task.
- (Optional) add a dropdown to select a parent task if creating from the top level.

## 4. Risk Assessment

- **Orphaned Tasks:** If a parent task is deleted without cascading, sub-tasks might become "ghost" tasks that are hard to find. (Mitigated by Cascade Delete requirement).
- **Infinite Nesting UI:** Deeply nested tasks might overflow the screen or look cluttered. (Mitigated by using a reasonable indentation and potentially limiting max depth in the UI).
- **Data Migration:** Existing tasks won't have a `parentId`. (The implementation will handle `undefined` or `null` as top-level tasks).

## 5. Success Criteria

- Refreshing the Dashboard or Finance page no longer triggers a `logAction` for `expected_ticket_sales` unless the value is manually changed.
- Users can create sub-tasks for any existing task.
- Sub-tasks are correctly indented in the `TodoList`.
- Deleting a parent task removes all its sub-tasks from Firestore.
