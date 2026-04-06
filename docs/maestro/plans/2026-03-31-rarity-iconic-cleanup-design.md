---
title: Rarity Expansion (Iconic) & Voting Cleanup
date: 2026-03-31
author: Gemini CLI (Maestro Orchestrator)
task_complexity: medium
design_depth: standard
---
<!-- AGENT_NAV_METADATA -->
<!-- path: docs/maestro/plans/2026-03-31-rarity-iconic-cleanup-design.md -->
<!-- role: planning -->
<!-- read_mode: conditional -->
<!-- token_hint: summary-first -->
<!-- default_action: read if task touches planning, audits, or rollout decisions -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->


# Design Document: Rarity Expansion & Voting Cleanup

## 1. Problem Statement
The current crowdsourced teacher rarity system is being replaced by a purely administrative model. We are introducing a new top-tier rarity level, "Iconic" (Ikonen), positioned above "Legendary". Simultaneously, all remnants of the previous rarity voting system (UI, logic, and database fields) must be completely removed to eliminate technical debt and align with the new manual rarity assignment model.

## 2. Requirements

### Functional Requirements
- **New Rarity Tier**: Add `iconic` to the `TeacherRarity` type.
- **Visual Identity**: Implement a "Crown" symbol and a "Black/Gold" aesthetic for the Iconic tier.
- **Voting Removal**: 
    - Delete the `TeacherRarityVoting` component.
    - Remove rarity voting sections from the `/abstimmungen` page.
    - Remove `avg_rating` and `vote_count` from the `Teacher` data model.
- **Data Cleanup**:
    - Delete the `teacher_ratings` collection in Firestore.
    - Wipe existing `avg_rating` and `vote_count` fields from all teacher documents.
- **Backend Services**:
    - Remove the `voteForTeacher` Cloud Function.
    - Disable/Remove the `syncTeacherRarities` cron job.
    - Update global rarity limits and balancing logic to support `iconic`.

### Non-Functional Requirements
- **Data Integrity**: Ensure the transition to manual rarity assignment doesn't leave teachers with "undefined" or broken rarity states.
- **Performance**: Ensure the database cleanup script runs efficiently without exceeding Firestore limits.
- **UI Consistency**: Update all card-related components (Album, Shop, Promo) to reflect the new hierarchy.

## 3. Approach (Selected: Tabula Rasa & Administrative Control)

**Summary**: We will perform a clean break from the voting system. All historical voting data will be deleted, and the application will transition to a model where rarities are assigned directly by administrators.

### Decision Matrix

| Criterion | Weight | Approach: Tabula Rasa |
|-----------|--------|-----------------------|
| Technical Debt Reduction | 40% | 5: Complete removal of obsolete fields/functions. |
| Clarity of Hierarchy | 30% | 5: Clear distinction between Iconic and Legendary. |
| Implementation Speed | 20% | 4: Straightforward removal/addition of static types. |
| Data Consistency | 10% | 5: Eliminates conflicting "user vs admin" rarity states. |
| **Weighted Total** | | **4.8** |

### Rationale Annotations
- **Iconic Visuals** — *Black/Gold with a Crown was chosen to provide a premium, "ultimate" feel that surpasses the Amber/Star of Legendary.*
- **Full Deletion** — *Removing fields like `avg_rating` ensures the `Teacher` interface remains lean and focused on the new administrative model.*

## 4. Architecture

- **Types**: `TeacherRarity` expanded to `'common' | 'rare' | 'epic' | 'mythic' | 'legendary' | 'iconic'`.
- **UI Components**: 
    - `RaritySymbol.tsx`: Updated with the Crown SVG.
    - `Card.tsx` / `TeacherAlbum.tsx`: Updated styling for the Iconic tier.
- **Backend**:
    - `rarity.ts`: Logic updated to prioritize admin-assigned rarities and enforce new global limits (e.g., max 1-2 Iconic).
    - `cleanup.ts` (New Script): A one-time script to purge voting data.

## 5. Agent Team

- **Data Engineer**: Handles Firestore schema updates, collection deletion, and data migration scripts.
- **Backend Developer (Coder)**: Removes Cloud Functions, updates rarity calculation logic and cron jobs.
- **Frontend Developer (Coder)**: Removes voting UI, adds Iconic rarity styling/symbols, and updates card displays.
- **Tester**: Validates the new rarity hierarchy and ensures no broken UI remnants from the voting system exist.

## 6. Risk Assessment
- **Accidental Data Loss**: *Mitigation*: The "Tabula Rasa" approach is intentional. However, we will ensure that existing `rarity` assignments are preserved during the field cleanup.
- **Broken References**: *Mitigation*: Global search for `avg_rating` and `voteForTeacher` to ensure no orphaned code remains.
- **Balancing**: *Mitigation*: Update pack-opening weights to include a very low (e.g., 0.05%) chance for Iconic cards.

## 7. Success Criteria
- [ ] `iconic` rarity is selectable and functional in the Admin Dashboard.
- [ ] Iconic cards display the Black/Gold Crown symbol correctly.
- [ ] No rarity voting UI exists on the `/abstimmungen` page.
- [ ] `teacher_ratings` collection is deleted and `Teacher` documents are cleaned.
- [ ] `voteForTeacher` function is removed from Firebase.
- [ ] Pack simulation results confirm Iconic cards are appropriately rare.
