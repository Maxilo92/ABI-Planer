# Design Document: ToDo DetailView & Beta Label Removal

**Date:** 2026-03-20
**Status:** Draft
**Design Depth:** Quick
**Task Complexity:** Medium

## 1. Problem Statement

The application currently lacks a detailed view for tasks, making it difficult to see long descriptions or the list of sub-tasks in one place. Additionally, the ToDo system supports infinite nesting, which can break the UI layout at deep levels. Finally, the "Beta" labels across the application need to be removed as the platform matures towards a release.

## 2. Requirements

### Functional Requirements
- **ToDo DetailView:**
    - A read-only Dialog triggered by clicking a task's title in the `TodoList`.
    - Displays the task's title, description, status, due date, and a list of its immediate sub-tasks.
- **Sub-task Level Limit:**
    - Limit sub-task nesting to a maximum of 5 levels (0 to 4).
    - Hide the "Add Sub-task" button if a task's depth is 4 or greater.
- **Beta Label Removal:**
    - Remove "Beta" badges from the Dashboard, Navbar, Groups page, and Admin Logs page.
- **Release Branch:**
    - All changes must be pushed to a new branch named `release`.

### Non-Functional Requirements
- **UI Consistency:** Use existing Shadcn UI components (Dialog, Badge, Button).
- **Performance:** Ensure that depth calculation and tree-building in `TodoList.tsx` remain efficient.
- **Data Integrity:** The 5-level limit is a UI-level constraint to maintain layout integrity.

## 3. Approach

### ToDo DetailView
- Create a new component `src/components/modals/TodoDetailDialog.tsx`.
- Pass the current `todo` and the list of `allTodos` to identify children.
- Trigger this dialog when clicking the title in `src/components/dashboard/TodoList.tsx`.

### Sub-task Level Limit
- Modify `src/components/dashboard/TodoList.tsx`:
    - The `displayedTodos` memo already calculates `depth`.
    - Wrap the `AddTodoDialog` trigger with a condition: `todo.depth < 4`.
- Update `src/components/modals/AddTodoDialog.tsx` to ensure it correctly handles the `parentId`.

### Beta Label Removal
- Modify `src/app/page.tsx`, `src/components/layout/Navbar.tsx`, `src/app/gruppen/page.tsx`, and `src/app/admin/logs/page.tsx` to remove the "Beta" badges/flags.

### Release Workflow
- Create the `release` branch using `git checkout -b release`.
- Update `CHANGELOG.md` and `VERSION`.
- Commit and push the changes.

## 4. Risk Assessment
- **Depth Calculation:** Ensure that depth is correctly handled in all rendering paths (Dashboard vs full ToDo page).
- **Branch Management:** Verify that the `release` branch doesn't conflict with existing work if any.

## 5. Success Criteria
- Clicking a task title opens a Dialog with its details and sub-tasks.
- The "Add Sub-task" button is only visible for tasks at levels 0, 1, 2, and 3.
- All "Beta" labels are gone from the UI.
- Changes are successfully pushed to the `release` branch.
