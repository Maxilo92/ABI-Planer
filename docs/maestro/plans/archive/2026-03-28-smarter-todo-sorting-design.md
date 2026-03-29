# Design Document: Smarter Todo Sorting and Centralization

**design_depth: quick**
**task_complexity: medium**

## 1. Problem Statement
Currently, todos in the ABI Planer are sorted inconsistently across different pages (Dashboard, Todos, Groups). The sorting logic is either hardcoded in Firestore queries (e.g., `orderBy('created_at', 'desc')`) or manually calculated in specific pages (like the Dashboard). Users need a "smarter" and more personal sorting experience where tasks assigned to them, their class, or their group are prioritized, and deadlines are factored in consistently.

## 2. Requirements
- **Centralized Sorting Logic:** A single, reusable utility or component-level logic that can be applied to any set of todos.
- **User-Specific Prioritization:** Personal assignments (+100), Planning Group assignments (+50), and Class assignments (+25) should boost a task's relevance.
- **Deadline-Awareness:** Overdue tasks (+40) and tasks with upcoming deadlines (<7 days: +20, <14 days: +10) should be prioritized.
- **Hierarchical Consistency:** The existing parent-child tree structure must be preserved. Sorting should apply recursively (Roots first, then children within each parent).
- **Status Integration:** Active tasks (Open/In Progress) should always appear above completed tasks (Done) in the "All" view.
- **Consistent Tied-Breakers:** After status, relevance, and deadlines, tasks should be ordered by their absolute deadline (soonest first) and then by creation date (newest first).

## 3. Approach
### Selected Approach: Centralized Recursive Utility
We will implement a `getSortedTodoTree` (or similar) utility function within `src/components/dashboard/TodoList.tsx`'s `useMemo`. This function will calculate a `relevanceScore` for each todo based on the current user's profile and assignment details.

**Sorting Algorithm:**
1. **Status:** Active tasks (`open`, `in_progress`) come before `done` tasks.
2. **Relevance Score (desc):**
   - Personal assignment: +100
   - Group assignment: +50
   - Class assignment: +25
   - Deadline urgency: Overdue (+40), <7d (+20), <14d (+10)
3. **Absolute Deadline (asc):** Earlier `deadline_date` first (tasks without deadlines follow).
4. **Creation Date (desc):** Newest `created_at` first.

**Tree Integration:**
- Filter the top-level `roots` from the `todos` prop.
- Sort these `roots` using the algorithm above.
- Recursively process each root's `children`, sorting them using the same algorithm before adding them to the flattened display list.

**Pros:**
- Consistent behavior across Dashboard, Todos Page, and Groups Page.
- DRY (Don't Repeat Yourself) implementation.
- Preserves the existing hierarchical UI.

**Cons:**
- Calculating scores for all todos on every render (mitigated by `useMemo`).

## 4. Risk Assessment
- **Performance:** For very large lists of todos (unlikely for a school project, but possible), recursive sorting in every render could cause lag. We will ensure this is properly memoized and efficient.
- **Complexity of Subtasks:** High-priority subtasks will stay under their parents. If a parent is low-priority, the subtask might be "buried" further down. However, since the tree is flattened for rendering, this follows the user's preference for maintaining hierarchy.
- **Data Dependencies:** Sorting requires the full `profile` object. We must ensure the component handles cases where the profile is still loading or unavailable.

## 5. Success Criteria
- Todos on the main `/todos` page are sorted by status, assignment, and deadline.
- The Dashboard shows the top 5 most relevant tasks using the same centralized logic.
- The Groups page correctly sorts team-specific tasks using the same priority.
- Subtasks are correctly sorted within their parent's scope.
