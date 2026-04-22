# Cloud Functions API Referenz

Uebersicht ueber zentrale Cloud Functions in `functions/src/`.

## Global
- Laufzeit: Node.js 22 (`functions/package.json`)
- Region: `europe-west3` (via `functions/src/index.ts`)
- Funktionsarten:
- Callable (`onCall`) fuer App-interne, auth-nahe Operationen
- HTTP (`onRequest`) fuer Webhooks/oeffentliche Endpunkte

## Security-kritische Bereiche

### Shop / Booster
Datei: `functions/src/shop.ts`
- `createStripeCheckoutSession` (callable)
- `stripeWebhook` (http)
- `openBooster` (callable, serverseitiges RNG)
- `purchaseBoosters` (callable)

Hinweis:
`openBooster` ist die autoritative RNG-Quelle und darf nicht in den Client verlagert werden.

### Trading
Datei: `functions/src/trades.ts`
- `sendTradeOffer`
- `counterTradeOffer`
- `acceptTradeOffer`
- `declineTradeOffer`
- `cancelTradeOffer`
- Analytics-/Stats-Endpunkte als callable und http

### Combat
Datei: `functions/src/combat.ts`
- `startAiMatch`
- `submitCombatAction`
- `createFriendMatch`
- `createMatchWithCode`
- `joinMatchByCode`
- `joinMatchById`
- `endMyOpenMatches`
- `selectInitialCard`

### NP / Admin
Dateien: `functions/src/npAdmin.ts`, `functions/src/shop.ts`
- `adminReviewNPTransactions`
- `adminAdjustNP`
- `adminGetNPMetrics`
- `adminExportNPTransactions`

## Weitere zentrale Domains
- MFA: `functions/src/mfa.ts`
- Users: `functions/src/users.ts`
- Gifts: `functions/src/gifts.ts`, `functions/src/giftUtils.ts`
- Referrals: `functions/src/referrals.ts`
- Cards Manager: `functions/src/cardsManager.ts`
- Tasks: `functions/src/tasks.ts`
- Feedback: `functions/src/feedback.ts`
- Cron/Operations: `functions/src/cron.ts`, `functions/src/inventory.ts`, `functions/src/logs.ts`

## Dokumentations-Regel fuer neue Functions
Bei jeder neuen exportierten Function:
1. Zweck dokumentieren.
2. Auth-/Rollenanforderung dokumentieren.
3. Eingabe-/Ausgabeformat dokumentieren.
4. Failure-Cases dokumentieren.
5. Changelog aktualisieren.

## Referenzen
- `functions/src/index.ts`
- `functions/src/*.ts`
- `firestore.rules`
