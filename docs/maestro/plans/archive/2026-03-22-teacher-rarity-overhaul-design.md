# Design Document: Teacher Rarity Voting Overhaul

**Status**: Draft
**Date**: 2026-03-22
**Design Depth**: Standard
**Task Complexity**: Medium

## 1. Problem Statement

The teacher rarity voting feature currently manages its list of teachers independently from the global settings' `loot_teachers` array. This duplication makes it difficult to maintain a consistent pool of teachers for both the "Sammelkarten" (trading cards) feature and the crowdsourced rarity poll. Users want a single management interface in the Global Settings where new teachers can be added and immediately become available for voting.

## 2. Requirements

### Functional Requirements
- **Single Source of Truth**: The `loot_teachers` list in `settings/global` must be the master list for the rarity poll.
- **Immediate Voting**: Newly added teachers in Global Settings must be available for voting in the dashboard component as soon as they are saved.
- **Admin Management**: Admins can add, edit, and remove teachers from the global settings, which automatically updates the voting pool.
- **Voting Aggregation**: Casting a vote updates the `teachers` collection with `avg_rating` and `vote_count`.
- **Rarity Synchronization**: Admins can manually sync the `loot_teachers` rarities based on current voting results.

### Non-Functional Requirements
- **Performance**: The voting UI should remain responsive and not be slowed down by fetching both global settings and voting data.
- **Consistency**: The `teachers` collection and `loot_teachers` array should be kept in sync during administrative actions.

## 3. Approach

### Selected Approach: Split Fetching with Admin-Side Initialization

We will adopt a hybrid approach where the "definition" of teachers resides in global settings, but the "results" of voting reside in a dedicated `teachers` collection.

**Key Components:**
- **GlobalSettingsPage**: Handles the master list and initializes voting documents upon teacher creation.
- **TeacherRarityVoting**: Fetches the master list and the results, merging them on the client for display.

### Decision Matrix

| Criterion | Weight | Split Fetching | Unified Document |
|-----------|--------|----------------|------------------|
| Performance | 30% | 5: High (minimal writes to settings) | 2: Low (constant updates to settings) |
| Simplicity | 20% | 4: Medium (requires client-side merging) | 5: High (all data in one doc) |
| Scalability | 30% | 5: High (supports many concurrent votes) | 1: Low (Firestore document write limits) |
| Robustness | 20% | 5: High (voting data is isolated) | 3: Medium (settings doc corruption risk) |
| **Weighted Total** | | **4.8** | **2.5** |

### Alternatives Considered
- **Unified Document**: Rejected because of Firestore's 1 write/second limit on a single document, which would cause failures during peak voting times.
- **Client-side Only Initialization**: Rejected in favor of Admin-side initialization for better data consistency.

## 4. Architecture

### Data Flow
1. **Admin Action**: `GlobalSettingsPage` adds a teacher to `settings/global.loot_teachers` and creates a document in the `teachers` collection.
2. **Voting Loading**: `TeacherRarityVoting` fetches `settings/global` and the `teachers` collection simultaneously.
3. **Voting Display**: The component filters the `teachers` collection results to only show those currently present in the `loot_teachers` array.
4. **Voting Action**: Casting a vote updates the `teachers` collection and the user's `profile.rated_teachers`.

### Key Interfaces
- `LootTeacher`: `{ id: string, name: string, rarity: TeacherRarity }`
- `Teacher`: `{ id: string, name: string, avg_rating: number, vote_count: number }`

## 5. Agent Team
- **api_designer**: To ensure Firestore schemas and update logic are consistent.
- **coder**: To implement the UI changes in `GlobalSettingsPage` and `TeacherRarityVoting`.
- **tester**: To verify immediate availability and correct aggregation of votes.

## 6. Risk Assessment
- **Sync Failure**: If a teacher is added to settings but the `teachers` doc creation fails. *Mitigation: Use a batch write or ensure robust error handling in the Admin panel.*
- **Concurrency**: Multiple users voting on the same teacher. *Mitigation: Firestore increment operations and current aggregate logic (existing).*

## 7. Success Criteria
- [ ] New teachers added in Admin settings appear in the voting UI within one refresh.
- [ ] Teachers removed from Admin settings no longer appear in the voting UI.
- [ ] Voting on a new teacher correctly updates the `teachers` collection.
- [ ] Rarity Sync still works correctly with the updated pool.
