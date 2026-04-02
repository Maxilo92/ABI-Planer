---
title: Universal System Message Engine
date: 2026-03-27
design_depth: standard
task_complexity: complex
---

# Design: Universal System Message Engine

## 1. Problem Statement
The application currently has a fragmented and inconsistent notification system, with ephemeral toasts (`sonner`), persistent banners at the top of the content (`DangerAlertBanner`, `WarningBanner`, `CustomPopupBanner`), and blocking overlays (`TimeoutOverlay`) all managed individually within `AppShell.tsx`. This "mishmash" makes it difficult to add new message types, manage dismissal logic consistently across the app, and maintain a clean layout. We need a modular, unified "System Message Engine" that can handle any user-facing communication through a single, declarative API and centralized state management.

## 2. Requirements
- **Unified Interface**: Provide a `useSystemMessage` hook that can trigger all types of messages (`toast`, `modal`, `banner`).
- **Data-Driven Messaging**: Support automatic fetching and display of messages from Firestore (global settings, user-specific warnings).
- **Dismissal Logic**: Implement a consistent dismissal system (e.g., "don't show this again") stored in `localStorage` or user profiles.
- **Priority Queue**: Messages should be sorted by priority (e.g., `danger` > `warning` > `info`).
- **Accessibility**: Modals and blocking overlays must use Radix UI `Dialog` primitives for focus management.
- **Performance**: Centralized fetching should minimize re-renders and use efficient Firestore listeners.
- **Modularity**: The system should be easy to extend with new message styles (e.g., full-screen takeovers).

## 3. Approach
Selected Approach: **The Unified Hub**
We'll create a `SystemMessageProvider` (React Context) that serves as the "brain" for all user-facing communications. It will listen to relevant Firestore collections (e.g., global settings, user-specific warnings) and provide an imperative hook (`useSystemMessage`) for local components to trigger messages.

### Key Decisions
- **Hybrid Wrapper**: We'll wrap `sonner` for ephemeral toasts and use custom Radix-based components for banners and modals to ensure a consistent API while maintaining distinct visual styles.
- **Centralized Listener**: Instead of each banner listening to Firestore in `AppShell.tsx`, the `SystemMessageProvider` will be the single entry point for all data-driven messages.
- **Visual Distinction**: We'll distinguish between small, peripheral toasts (bottom-right) and important, blocking dialogs (center) to ensure clear user guidance.

### Alternatives Considered
- **Decentralized Bridge**: Individual components continue to listen to their own data sources but call `useSystemMessage` to "register" their banners. Rejected because it fragments dismissal logic and complicates `AppShell.tsx`.

### Decision Matrix
| Criterion | Weight | Approach 1: Unified Hub | Approach 2: Decentralized Bridge |
|-----------|--------|-------------------------|----------------------------------|
| **Maintainability** | 40% | 5: Single source of truth. | 3: Logic is scattered across hooks. |
| **Simplicity (AppShell)** | 30% | 5: Replaces 5+ components with 1. | 4: Also very clean. |
| **Scalability** | 20% | 4: Easy to add new types. | 5: Data sources are independent. |
| **Debuggability** | 10% | 5: Centralized logic. | 2: Difficult to trace messages. |
| **Weighted Total** | | **4.8** | **3.7** |

## 4. Architecture
The core of the system is a `SystemMessageProvider` wrapping the entire app. It manages an `activeMessages` array, sorted by priority.

### Components
- **`SystemMessageProvider`**: Listens for data from Firestore (e.g., `globalSettings`, `userWarnings`) and local sources. It stores active messages in state and handles dismissal persistence.
- **`SystemMessageHost`**: A single component in `AppShell` that renders all active messages based on their type:
    - **`ToastMessage`**: Uses `sonner`'s `toast()` function.
    - **`BannerMessage`**: Top-of-content banner (using `UniversalBanner` style).
    - **`ModalMessage`**: Radix `Dialog` in the center of the screen.
- **`useSystemMessage` hook**: Provides an imperative API (e.g., `msg.toast()`, `msg.modal()`, `msg.banner()`).

### Data Flow
1. **Source**: Firestore listener or local `useSystemMessage` call.
2. **Filtering**: Provider checks dismissal status (localStorage/Firestore).
3. **Queue**: Message added to `activeMessages` state with priority.
4. **Rendering**: `SystemMessageHost` renders UI based on `style` property.

## 5. Agent Team
- **`design_system_engineer`**: Designing the unified `SystemMessageProvider`, the `useSystemMessage` hook, and the `SystemMessageHost` component.
- **`coder`**: Performing the phased migration of each individual banner and toast to the new system.
- **`code_reviewer`**: Ensuring the new architecture is robust and consistent across all components.

## 6. Risk Assessment
- **Duplication**: Avoid double-rendering during migration by carefully replacing each banner. (Mitigation: Incremental migration).
- **Complexity**: Manage multiple Firestore listeners and dismissal logic through a typed schema. (Mitigation: Strict TypeScript schema).
- **Consistency**: Ensure all banners and modals match the existing design language. (Mitigation: Unified UI kit).

## 7. Success Criteria
- **Unified API**: All system-wide notifications are triggered through `useSystemMessage`.
- **Cleaner Layout**: `AppShell.tsx` contains only one `SystemMessageHost` component.
- **Improved UX**: Consistent positioning (small: bottom-right, important: center).
- **Consolidated Logic**: Dismissal and fetching are centralized in `SystemMessageProvider`.
