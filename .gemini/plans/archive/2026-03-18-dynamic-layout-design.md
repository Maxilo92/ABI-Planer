# Design: Dynamic Layout & Personalized Tool Ordering

**Status**: Draft
**Date**: 2026-03-18
**Author**: Gemini CLI

## 1. Problem Statement

The "ABI Planer 2027" application requires a more personalized user experience. Currently, the dashboard and navigation are largely static, which can lead to important tasks being overlooked if they are buried at the bottom of the page or deep in the menu.

The goal is to implement a dynamic layout system that:
- Prioritizes tools and information based on the user's role, group, and specific assignments.
- Uses visual cues (red dots in the navbar) to highlight areas requiring attention.
- Ensures all tools remain accessible but are presented in a contextually relevant order.

---

## 2. Requirements

### 2.1 Functional Requirements
- **Dynamic Dashboard Sorting**: The order of components on the dashboard must be determined by a "relevance score."
- **Relevance Factors**:
    - **High Priority**: Open todos assigned to the user or their group, upcoming events (next 3 days), active polls not yet voted on.
    - **Medium Priority**: Role-specific tools (e.g., Financial status for Planners/Admins).
    - **Low Priority**: General information (e.g., Class Leaderboard, News).
- **Navbar Notifications**: A "red dot" indicator must appear next to navbar items if there are "Action Items" (e.g., assigned tasks, new polls).
- **Tool Inclusion**: The dashboard must include all primary tools, including those currently missing from the main view (`PollList`, `ClassLeaderboard`).

### 2.2 Non-Functional Requirements
- **Real-time Updates**: The layout and indicators must update instantly as data changes in Firestore.
- **Maintainability**: Sorting logic should be centralized in a reusable hook.
- **Performance**: Sorting should happen on the client-side with minimal overhead.

---

## 3. Proposed Solution: Client-Side Heuristics

We will implement a client-side sorting mechanism using a custom React hook `useDashboardSorting`. This hook will evaluate the current state of the application (user profile + fetched data) and provide an ordered list of component identifiers.

### Component Map
The dashboard will manage a map of available components:
- `funding`: `FundingStatus`
- `news`: `NewsPreview`
- `todos`: `TodoList`
- `events`: `CalendarEvents`
- `polls`: `PollList`
- `leaderboard`: `ClassLeaderboard`

### Scoring Logic (Draft)
- **Base Score**: 0
- **Todos**: +100 if user has an open todo assigned to them or their group.
- **Events**: +80 if an event is occurring within the next 3 days.
- **Polls**: +70 if an active poll exists that the user hasn't voted in.
- **Finances**: +50 for `planner` or `admin` roles.
- **News**: +30 if news were posted in the last 24 hours.
- **Leaderboard**: +10 (Baseline).

---

## 4. Architecture

### 4.1 Data Flow
1. `Dashboard` fetches all necessary collections (`todos`, `events`, `polls`, `news`, `finances`, `settings`).
2. `Dashboard` passes the data to `useDashboardSorting`.
3. `useDashboardSorting` calculates scores and returns an array of keys (e.g., `['todos', 'polls', 'events', ...]`).
4. `Dashboard` iterates through the keys and renders the corresponding components in a responsive grid.

### 4.2 Navbar Integration
- The `Navbar` component will subscribe to the same relevant collections (using a shared utility or hook if possible) to determine the visibility of "red dots" for each menu item.

### 4.3 Key Interfaces
- `DashboardComponentKey`: `'funding' | 'news' | 'todos' | 'events' | 'polls' | 'leaderboard'`
- `RelevanceData`: Object containing todos, events, polls, etc.

---

## 5. Agent Team
- **Architect**: (Me) Oversight and architectural decisions.
- **Coder**: Implements the `useDashboardSorting` hook and updates `Dashboard.tsx`.
- **UI Designer (Coder)**: Updates `Navbar.tsx` and adds red dot indicators.
- **Tester**: Verifies the dynamic sorting and notification logic.

---

## 6. Risk Assessment & Mitigation
- **Complexity of Hooks**: Managing many subscriptions in one place can be heavy. *Mitigation*: Use efficient Firestore queries (limit, where) and ensure clean cleanup.
- **Layout Shift**: Sorting components might cause jarring layout shifts when data loads. *Mitigation*: Use loading skeletons or a "fixed" layout until the initial relevance is calculated.

---

## 7. Success Criteria
- Dashboard components reorder correctly based on assigned tasks.
- Red dots appear in the navbar for relevant action items.
- All tools are visible on the dashboard in some order.
- Mobile and desktop layouts remain responsive and functional.
