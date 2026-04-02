---
design_depth: standard
task_complexity: complex
---
# Design Document: ABI Planer Fixes & Features

## 1. Problem Statement
The ABI Planer project has several UI and logic issues:
- **ClassLeaderboard (Kurswettstreit)**: The component name is clunky, and the UI clips in the 'Wettstreit-Tipp' section.
- **Calendar Sorting**: Events are currently sorted by date only, showing past events mixed with upcoming ones.
- **Event Mentions**: Users want to mention people, roles, or groups in calendar events.
- **Registration Flow**: The course selection step is sometimes skipped.
- **Settings**: Users cannot change their course after registration.

## 2. Requirements
### Functional
- Rename 'Kurswettstreit' to 'Kurs-Ranking'.
- Fix clipping in the leaderboard UI (specifically the tip section).
- Sort calendar events: Upcoming first (asc), Past last (desc).
- Add mentions for people/roles/groups in events (lookup by ID/Name).
- Fix registration course selection step logic.
- Add 'Change Course' section in user settings for students.

### Non-Functional
- Maintain data integrity for mentions using ID lookups.
- Use existing Firebase infrastructure.
- Ensure responsive UI.

## 3. Approach (Integrated Updates)
- **Renaming & Layout Fix**: Update `ClassLeaderboard.tsx` and related labels to 'Kurs-Ranking'. Adjust `line-clamp-2` or container overflow to fix clipping. — *Rational: 'Kurs-Ranking' is more descriptive and competition-focused. Layout fix ensures content visibility.*
- **Sorting Logic**: Update `CalendarEvents.tsx` and `app/kalender/page.tsx` to sort upcoming events (today/future) first in ascending order, then past events in descending order. — *Rational: Focuses user attention on what's next while keeping history accessible.*
- **Mentions Implementation**: Update `Event` type in `types/database.ts` to include `mentioned_user_ids`, `mentioned_roles`, and `mentioned_groups`. Add search/select logic to `AddEventDialog.tsx` and `EditEventDialog.tsx`. — *Rational: Dedicated fields ensure structured data and better UI presentation (badges).*
- **Registration Fix**: Investigate `src/app/register/page.tsx` for step validation logic. Ensure the `courses` list defaults correctly if Firestore settings are missing. — *Rational: Ensures data completeness for new users.*
- **Settings Update**: Expand `src/components/modals/EditSettingsDialog.tsx` to include a profile section for course changes or create a dedicated profile edit modal. — *Rational: Allows users to correct registration mistakes.*

## 4. Architecture
### Components
- `ClassLeaderboard`: Renamed and layout fixed.
- `CalendarEvents`: Sorting logic updated.
- `AddEventDialog`, `EditEventDialog`: Mentions UI added.
- `EditSettingsDialog`: Profile course change added.
- `RegisterPage`: Step logic fixed.

### Types
- `Event`: Expanded with `mentioned_user_ids`, `mentioned_roles`, `mentioned_groups`.
- `Profile`: Existing `class_name` used.
- `Settings`: Existing `courses` array used.

### Data Flow
- Firestore (profiles, events, settings) → Next.js (Server/Client components) → UI.

## 5. Agent Team
- `architect`: Oversee the architectural changes and data structure updates.
- `coder`: Implement UI and logic updates across components and pages.
- `tester`: Verify the fixes and new features with end-to-end tests (manual or automated).

## 6. Risk Assessment
- **Data Migration**: Mentions will only apply to new/updated events. Existing events will remain as-is.
- **Registration Logic**: Changes could impact user sign-ups if not carefully tested.
- **Firestore Queries**: Complexity in sorting might require client-side processing for the upcoming/past split.

## 7. Success Criteria
- 'Kurs-Ranking' displayed correctly without clipping.
- Calendar events sorted correctly (Upcoming first, Past last).
- Mentions functional in event dialogs.
- Registration course step consistently shown.
- Course change possible in settings.
