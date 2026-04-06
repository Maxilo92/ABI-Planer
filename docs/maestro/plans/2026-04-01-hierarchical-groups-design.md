<!-- AGENT_NAV_METADATA -->
<!-- path: docs/maestro/plans/2026-04-01-hierarchical-groups-design.md -->
<!-- role: planning -->
<!-- read_mode: conditional -->
<!-- token_hint: summary-first -->
<!-- default_action: read if task touches planning, audits, or rollout decisions -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

# Design: Hierarchical Groups & Multiple Memberships

**Design Depth**: Standard
**Task Complexity**: Medium

## 1. Problem Statement

The current planning group system is flat: a user can belong to exactly one group, and all groups are at the same level. This doesn't reflect the project's real-world structure, where "Ballplanung" (Prom Planning) and "FinanzTeam" (Finance Team) act as high-level umbrellas for specialized subgroups (e.g., "Location", "Sponsoring").

Additionally, the limitation to a single group per user prevents coordination for people who contribute to multiple teams (e.g., "Location" and "Pfannkuchen verkauf").

## 2. Requirements

### Functional Requirements
- **Hierarchy Support**: Implement a parent-child relationship for groups. "Ballplanung" and "FinanzTeam" are top-level parents.
- **Multiple Memberships**: Allow users to be members of multiple groups simultaneously.
- **Granular Leadership**: Support per-group leadership. A user can lead one or more groups they are in.
- **UI Navigation**: Redesign the groups page to reflect the hierarchy and manage multiple memberships easily.
- **Data Migration**: Transition existing single-membership data to the new multi-membership format without loss.

### Non-Functional Requirements
- **Security**: Firestore rules must prevent unauthorized membership changes and group-specific communications.
- **Scalability**: The system should handle future subgroups easily.
- **Simplicity**: Maintain a clean UI for the majority of users who are in only one group.

### Constraints
- Must use existing Firebase (Firestore) infrastructure.
- Must preserve existing group communication (GroupWall) data.

## 3. Approach

### Selected Approach: Relational Multi-Membership

**Summary**: 
Move from a single `planning_group` string in the user profile to a `planning_groups: string[]` array. Introduce `parent_name` in the group configuration. Track leadership via `led_groups: string[]` in the profile for efficient security checks.

**Architecture**:
- **Settings (`/settings/config`)**: `planning_groups` array of objects: `{ name, leader_user_id, parent_name, is_parent }`.
- **Profile (`/profiles/{uid}`)**: `planning_groups: string[]`, `led_groups: string[]`.

**Pros**:
- **Fully flexible**: Supports any number of group memberships.
- **Performant Rules**: Firestore rules can check `groupName in getProfile().planning_groups` efficiently.
- **Clear Hierarchy**: Explicit `parent_name` makes rendering easy.

**Cons**:
- **Increased Complexity**: Every component using group info must handle arrays now.
- **Migration Required**: All existing profiles need a one-time update.

**Decision Matrix**:

| Criterion | Weight | Relational Multi-Membership | Map-Based (Nested) |
|-----------|--------|-----------------------------|-------------------|
| Flexibility | 30% | 5: Supports any combination | 4: Harder to handle cross-parent |
| Security | 30% | 5: Clean array-based rules | 3: Nested object rules are complex |
| UI Simplicity | 20% | 4: Clean list-based UI | 4: Similar UI impact |
| Data Integrity | 20% | 5: Easy to validate unique names | 3: Nesting risks duplication |
| **Weighted Total** | | **4.8** | **3.6** |

## 4. Architecture

### Data Interfaces
```typescript
interface PlanningGroup {
  name: string;
  leader_user_id?: string | null;
  leader_name?: string | null;
  parent_name?: string | null; // e.g., "Ballplanung"
  is_parent?: boolean; // true for "Ballplanung", "FinanzTeam"
}

interface Profile {
  // ... existing fields
  planning_groups: string[]; // List of group names
  led_groups: string[]; // List of groups where user is a leader
}
```

### Component Flow
1. **Admin/Settings**: Admin creates/edits groups and sets their `parent_name`.
2. **Groups Page**: Renders parents as headers and subgroups below.
3. **Membership Management**: Updating a member adds/removes strings from the `planning_groups` array.
4. **GroupWall/Communication**: Messages are linked to a single group name, but visibility is granted if the user is in that group.

## 5. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data Corruption during Migration | High | Create a robust migration script with dry-run support. Backup Firestore before run. |
| Security Rules Gaps | High | Rigorously test the new `planning_groups` array-based rules. |
| Performance on large arrays | Low | Number of groups per user is expected to be small (< 10). |
| User Confusion | Medium | Use a clear UI that distinguishes between Parent and Subgroups. |

## 6. Agent Team

- **Architect**: Oversees the hierarchy and schema changes.
- **Coder**: Implements the UI changes in `GroupsPage` and `SettingsPage`.
- **Database Engineer**: Handles the Firestore migration script and rules update.
- **Tester**: Validates membership logic and security boundaries.

## 7. Success Criteria

- [ ] Users can join multiple groups.
- [ ] Groups are correctly grouped under "Ballplanung" and "FinanzTeam" in the UI.
- [ ] Leaders can manage members of their specific group(s).
- [ ] All existing group data is successfully migrated.
- [ ] No regression in "GroupWall" communication functionality.
