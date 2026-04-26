# Abi-Planer Billing & Entitlements

## 1. Stripe Integration & Webhook Flows
Die Abrechnung erfolgt vollständig automatisiert über Stripe. Das System reagiert asynchron auf Ereignisse via Webhooks, um den Abonnement-Status der Schulen zu verwalten.

### 1.1 Zentrale Webhook-Events
| Event | Aktion im System |
|-------|------------------|
| `checkout.session.completed` | Initialisierung der Schule, Aktivierung des gewählten Tiers. |
| `invoice.paid` | Verlängerung des `expiresAt` Zeitstempels im Schul-Dokument. |
| `invoice.payment_failed` | Markierung der Schule als `past_due`, Versand von Mahnungen. |
| `customer.subscription.updated` | Synchronisation von Tier-Wechseln (Upgrade/Downgrade). |
| `customer.subscription.deleted` | Markierung der Schule als `canceled`, Einleitung der Phase 7 (Read-Only). |

### 1.2 Idempotenz & Zuverlässigkeit
Um doppelte Verarbeitungen (z.B. bei Netzwerkfehlern) zu vermeiden, implementiert der Webhook-Handler eine strikte Idempotenz-Logik:
1. **Event-ID Tracking**: Jede verarbeitete `stripe-event-id` wird in einer dedizierten Firestore-Collection (`/system/webhooks/processedEvents/{eventId}`) gespeichert.
2. **Transaktionale Updates**: Statusänderungen an der `School` Collection erfolgen innerhalb einer Firestore-Transaktion, die gleichzeitig den Event-Eintrag erstellt.
3. **Retry-Sicherheit**: Falls ein Event erneut gesendet wird, erkennt das System den vorhandenen Eintrag und bricht die Verarbeitung ohne Fehler ab (200 OK an Stripe).

## 2. Entitlement Status Mapping
Der Zugriff auf Features wird durch den `subscription.status` und das `subscription.tier` im Schul-Dokument gesteuert.

| Status | Tier | Zugriffsebene | Beschreibung |
|--------|------|---------------|--------------|
| `active` | `free` | **Limited** | Zugriff nur auf das Finanz-Modul. |
| `active` | `pro` | **Full** | Zugriff auf alle Module (Finanzen, Kalender, Todos). |
| `past_due` | * | **Grace Period** | Voller Zugriff für 7 Tage, danach Downgrade auf Read-Only. |
| `canceled` | * | **Read-Only** | Phase 7 (12 Monate Retention), kein Schreibzugriff. |
| `unpaid` | * | **Suspended** | Kein Zugriff auf Daten bis Zahlung erfolgt. |

## 3. Refund Processing (90-Tage Garantie)
Abi-Planer bietet eine volle 90-Tage Geld-zurück-Garantie für Pro-Abonnements.

### 3.1 Ablauf der Rückerstattung
1. **Antrag**: Der Schul-Admin stellt den Antrag über das Dashboard oder den Support.
2. **Validierung**: Das System prüft, ob das Kaufdatum weniger als 90 Tage zurückliegt.
3. **Stripe-Trigger**: Eine Cloud Function initiiert den Refund via Stripe API (`stripe.refunds.create`).
4. **Status-Update**: Nach erfolgreichem Refund wird das Abonnement sofort beendet und die Schule in den `canceled` Status (Phase 7) versetzt.

## 4. Upgrade & Downgrade Logik
- **Upgrades**: Werden sofort wirksam. Stripe berechnet den Differenzbetrag anteilig (Proration).
- **Downgrades**: Werden zum Ende des aktuellen Abrechnungszeitraums wirksam. Daten in Modulen, die im Free-Tier nicht enthalten sind (z.B. Kalender), bleiben im Read-Only Modus erhalten, können aber nicht mehr bearbeitet werden.
