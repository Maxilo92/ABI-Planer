<!-- AGENT_NAV_METADATA -->
<!-- path: docs/maestro/plans/2026-04-01-card-trading-system-design.md -->
<!-- role: planning -->
<!-- read_mode: conditional -->
<!-- token_hint: summary-first -->
<!-- default_action: read if task touches planning, audits, or rollout decisions -->
<!-- index: docs/AGENT_CONTEXT_INDEX.md -->

# Design Document: Card Trading System

**Design Depth**: Standard
**Task Complexity**: Complex
**Status**: Approved

## 1. Problem Statement
The ABI Planer's "Sammelkarten" feature lacks a mechanism for users to interact and trade cards with their friends. This missing social component reduces the long-term engagement of the feature. We are implementing a secure, balanced, and interactive Card Trading System that allows friends to trade cards in a secure, balanced, and interactive way.

## 2. Requirements

### Functional Requirements
- **REQ-1**: Users must have at least 100 cards to participate in trades. — *Prevents multi-account abuse.*
- **REQ-2**: Trading is only possible between friends. — *Leverages existing social structures.*
- **REQ-3**: Cards of "Iconic" or "Secret Rare" rarity cannot be traded. — *Preserves value of top-tier items.*
- **REQ-4**: Each trade must be a 1-to-1 swap of cards with identical rarity and foil/variant. — *Maintains market balance.*
- **REQ-5**: Negotiation loop with max 3 individual actions (Offer -> Counter -> Counter/Accept). — *Interactive but efficient.*
- **REQ-6**: Max 3 successfully completed trades per day per user. — *Limits daily progression speed.*
- **REQ-7**: Persistent notifications for all trade actions. — *Ensures awareness.*
- **REQ-8**: Multi-step wizard UI for creating and managing trades. — *User-friendly flow.*
- **REQ-9**: Admin view to monitor and cancel active trades. — *Operational oversight.*

### Non-Functional Requirements
- **NFR-1 (Security)**: All card swaps must be atomic using Firestore Transactions. — *No card loss or duplication.*
- **NFR-2 (Performance)**: 100-card and daily limit checks must be fast (using Profile fields). — *Smooth UI experience.*
- **NFR-3 (Consistency)**: Inventory and Profile stats must remain synchronized at all times. — *Data integrity.*

## 3. Approach

### Selected Approach: Event-Driven State Machine (Approach 1)
Each trade action is a Cloud Function call that validates requirements (100-card check, rarity match, etc.) and updates the `card_trades` collection. The final card swap is an atomic Firestore Transaction. 

- **Rationale**: This is the most secure way to handle digital goods in a collaborative environment. It ensures that the "3 actions" and "3 trades per day" limits are strictly enforced on the server side.

### Decision Matrix
| Criterion | Weight | Approach 1 (Event-Driven) | Approach 2 (Optimistic UI) |
|-----------|--------|---------------------------|----------------------------|
| Data Integrity (Atomic Swap) | 35% | 5: Cloud Functions + Transactions ensure 100% integrity. | 4: One function handles the swap, but pre-validation is harder. |
| Security (Rules & Checks) | 30% | 5: All checks (100-card, rarity, limits) are on the backend. | 3: Logic must be split between Rules and Functions. |
| UI Responsiveness | 15% | 3: Latency from Cloud Function calls. | 5: Instant updates via Firestore. |
| Maintainability | 20% | 4: More functions, but each has a clear responsibility. | 3: Complex Firestore rules are hard to maintain and test. |
| **Weighted Total** | | **4.65** | **3.65** |

## 4. Architecture

### Firestore Collections
- **`card_trades`**: Stores the trade state, including participants, cards, round count, and status.
- **`profiles`**: Tracks `total_cards`, `daily_trades_count`, and `last_trade_date` for fast validation.
- **`user_teachers`**: Stores individual card inventories for each user.
- **`notifications`**: Persistent inbox for trade events.

### Cloud Functions
- **`sendTradeOffer`**: Validates 100-card check, friendship, rarity/foil match, and iconic/secret rare exclusion. Creates a new trade document.
- **`counterTradeOffer`**: Validates `roundCount < 2`, rarity/foil match, and iconic/secret rare exclusion. Updates the `card_trades` document and increments `roundCount`.
- **`acceptTradeOffer`**: Validates `roundCount < 3`, daily limit (3 trades), and card ownership. Executes the atomic swap (updates `user_teachers` for both, increments `total_trades_today` in `profiles`).
- **`declineTradeOffer` / `cancelTradeOffer`**: Sets `status` to `declined` or `cancelled`.

### UI Components
- **`TradeCenterPage`**: Main dashboard showing active, pending, and past trades.
- **`NewTradeWizard`**: Multi-step flow (Select Wunschkarte -> Select Friend -> Select Offer).
- **`TradeNegotiationModal`**: View for accepting, declining, or countering a trade request.

## 5. Agent Team
| Agent | Responsibility |
|-------|----------------|
| `architect` | System-Design des Trading-Systems (Datenmodell, State-Machine, Validierungsregeln). |
| `api_designer` | Entwurf der Cloud Functions für Trading-Logik und Inventar-Updates. |
| `ux_designer` | Design des mehrstufigen Tausch-Wizards und des Trade-Dashboards. |
| `coder` | Implementierung des Frontend-Flows, der State-Hooks und UI-Komponenten. |
| `coder` | Implementierung der Backend-Logik (Cloud Functions) und Integration der Regeln. |
| `tester` | End-to-End Tests des Tauschprozesses inkl. Counter-Offers, Limits und 100-Karten-Check. |

## 6. Risk Assessment
- **Race Conditions**: Mitigation via Firestore Transactions.
- **Card Duplication**: Mitigation via atomic swap in Cloud Functions.
- **Bypass Checks**: Mitigation via strict server-side validation.

## 7. Success Criteria
- Successful trade flow in < 3 actions.
- Strict Rarity/Foil match.
- Exclusion of Iconic/Secret Rares.
- 100-card entry barrier.
- 3-trade daily limit.
- Inventory and Profile stats consistency.
