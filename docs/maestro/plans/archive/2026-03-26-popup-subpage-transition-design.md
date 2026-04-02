# Design: Redirect Always - Transition to /admin/send

**design_depth**: quick
**task_complexity**: medium

## Problem Statement

**Current State**: The "Popup senden" (Send Popup) feature is currently implemented as a complex, multi-tab modal within the main Admin Profile Management page. This modal is visually cluttered, difficult to maintain, and lacks space for advanced features like bulk recipient management or detailed previews.

**Goal**: Transition to a "Redirect Always" strategy. The modal will be removed in favor of the existing `/admin/send` (Kommunikations-Zentrale) subpage. This subpage provides a superior user experience with a dedicated live preview, clear form sections, and robust recipient listing.

**Scope**: 
- Deprecate and remove the `isGiftDialogOpen` modal logic in `src/app/admin/page.tsx`.
- Update all entry points ("Popup senden" buttons in the table and mobile view) to redirect to `/admin/send?u=[userId]`.
- Enhance `/admin/send/page.tsx` to handle single-user initialization from the URL and improve navigation back to the admin dashboard.

## Requirements

### Functional Requirements
- **Single User Action**: "Popup senden" for a single user in the profile table should redirect to `/admin/send?u=[userId]`.
- **Bulk User Action**: "Popup senden" for multiple selected users should save the selection to `sessionStorage` and redirect to `/admin/send`.
- **UI Redesign**: The subpage `/admin/send` should feel like a dedicated "Communication Center" with a polished layout and clear form sections.
- **Recipient Management**: The subpage must reliably load recipients from either the URL or `sessionStorage`.

### Non-Functional Requirements
- **Maintainability**: Remove redundant modal logic and state from the main admin page to reduce code complexity.
- **Performance**: Ensure the subpage loading state is smooth and informative.
- **Consistency**: All communication actions must follow a single, unified workflow.

## Approach

**Selected Approach: Redirect Always (Subpage Transition)**

The core strategy is to remove the local modal and transition the "Popup senden" action to the existing `/admin/send` (Kommunikations-Zentrale) subpage.

### Key Changes
- **Admin Dashboard (`/admin/page.tsx`)**: 
  - Remove all state related to `isGiftDialogOpen`, `giftSending`, and gift form inputs.
  - Delete the `handleGiftPacks` function (it's redundant as it's already implemented on the subpage).
  - Update `openSinglePopup` and "Popup senden" buttons to navigate to `/admin/send?u=[userId]`.
  - Update bulk action "Popup senden" button to navigate to `/admin/send` after saving the current selection to `sessionStorage`.

- **Subpage (`/admin/send/page.tsx`)**:
  - Enhance the URL query parameter handling (e.g., `?u=[userId]`) to ensure the recipient list is correctly initialized.
  - Refine the layout of the subpage to feel more integrated into the admin experience.
  - Ensure the "Back" button correctly returns the user to the relevant section of the admin dashboard.

### Alternatives Considered
- **Hybrid Approach**: Keeping a simpler version of the modal for single messages. (Rejected: Increases maintenance and creates fragmented UX).
- **Modal Only**: Moving all subpage logic into a larger modal. (Rejected: Screenspace constraints and performance overhead in a single page).

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| **Data Loss**: User selections might be lost during the redirect to the subpage. | Use `sessionStorage` for bulk actions to reliably pass recipient lists between the admin dashboard and the subpage. |
| **Incomplete Transition**: Some "Popup senden" buttons (e.g., in the mobile view) could still point to the removed modal. | Perform a thorough grep-search for all "Popup senden" and `isGiftDialogOpen` references to ensure complete removal. |
| **UX Friction**: The transition to a new page could feel slower than a modal. | Implement a smooth loading state and ensure the "Back" button correctly returns the user to their previous context (e.g., keeping search filters if possible). |
| **State Mismatch**: The subpage's `recipients` logic might handle large lists differently than the dashboard. | Validate the `useEffect` in `/admin/send/page.tsx` for robust handling of both single `?u=` query and `sessionStorage` bulk inputs. |

## Success Criteria
- [ ] No references to the "Popup senden" modal remain in `src/app/admin/page.tsx`.
- [ ] Clicking "Popup senden" for a single user correctly redirects to `/admin/send?u=[userId]` and loads the user.
- [ ] Clicking "Popup senden" for multiple users correctly redirects to `/admin/send` and loads all selected users.
- [ ] The "Kommunikations-Zentrale" subpage reflects the latest UI redesign requirements (e.g., polished sections and live preview).
