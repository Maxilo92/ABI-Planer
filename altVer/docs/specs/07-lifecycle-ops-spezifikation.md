# 07 - Lifecycle & Operations Spezifikation

## 1. Übersicht
Diese Spezifikation beschreibt das automatisierte Lifecycle-Management von Schulen und Jahrgängen (YearGroups) in Abi-Planer. Ein zentrales Ziel ist die Einhaltung der DSGVO-Löschfristen sowie die effiziente Ressourcennutzung durch automatisierte Bereinigungsprozesse.

## 2. Status-Modell der Jahrgänge (YearGroups)

Ein Jahrgang durchläuft folgende Zustände:

| Status | Beschreibung | Zugriff |
|--------|--------------|---------|
| `ACTIVE` | Abonnement ist aktiv. | Vollzugriff (Read/Write) |
| `EXPIRED` | Abonnement abgelaufen. | Übergangszustand zu `READ_ONLY` |
| `READ_ONLY` | 12-monatige Aufbewahrungsfrist nach Ablauf. | Nur Lesezugriff |
| `PENDING_DELETION` | 12 Monate abgelaufen, Löschung steht bevor. | Kein Zugriff (Admin-Warnung) |
| `DELETED` | Daten wurden physisch gelöscht. | Kein Zugriff |

## 3. Automatisierte Cloud Function Cron-Schedules

Die Verwaltung erfolgt über Firebase Cloud Functions (Scheduled Functions).

### 3.1 `checkSubscriptionExpiry`
*   **Intervall:** Täglich (02:00 UTC)
*   **Logik:** Prüft das `expiryDate` in `schools/{schoolId}/subscriptions`.
*   **Aktion:** Wenn `now > expiryDate`, wird der Status aller zugehörigen Jahrgänge auf `READ_ONLY` gesetzt.

### 3.2 `sendRetentionReminders`
*   **Intervall:** Täglich (03:00 UTC)
*   **Logik:** Sucht Jahrgänge im Status `READ_ONLY` und berechnet die Zeit bis zur Löschung (12 Monate nach Expiry).
*   **Trigger-Punkte:**
    *   **90 Tage vor Löschung:** E-Mail-Benachrichtigung an alle Schul-Admins.
    *   **30 Tage vor Löschung:** E-Mail + Warnbanner im Dashboard.
    *   **7 Tage vor Löschung:** Letzte Warnung per E-Mail.

### 3.3 `purgeExpiredData`
*   **Intervall:** Wöchentlich (Sonntag, 04:00 UTC)
*   **Logik:** Identifiziert Jahrgänge, deren 12-monatige `READ_ONLY` Frist abgelaufen ist.
*   **Aktion:** Initiiert die `hardDeleteYearGroup` Prozedur.

## 4. Hard Deletion Logic (Runbook)

Die physische Löschung erfolgt atomar oder über eine Queue, um Timeouts zu vermeiden.

1.  **Firestore Cleanup:** Rekursive Löschung des Pfades `schools/{schoolId}/year_groups/{yearGroupId}/**`.
2.  **Storage Cleanup:** Löschung aller Dateien unter `gs://bucket/schools/{schoolId}/year_groups/{yearGroupId}/`.
3.  **Audit Log:** Erstellung eines minimalen Eintrags in einem globalen `deletion_logs` Dokument (SchoolID, YearGroupID, Timestamp, Grund), um die Einhaltung der Löschpflicht nachweisen zu können, ohne personenbezogene Daten aufzubewahren.
4.  **Auth Cleanup:** Falls der Jahrgang der letzte der Schule war und kein aktives Abo besteht, werden die verknüpften User-Accounts (sofern nicht in anderen Schulen aktiv) zur Löschung markiert.

## 5. Modul-Lifecycle (Feature Registry)

Module (Finanzen, Kalender, etc.) folgen einem 3-Stufen-Prozess bei Deaktivierung:

1.  **Deactivate:** Modul wird im UI ausgeblendet (Registry-Flag `enabled: false`). Daten bleiben erhalten.
2.  **Readonly:** Modul-Daten sind sichtbar, aber Mutationen werden durch Firestore Rules und UI-Sperren verhindert.
3.  **Cleanup:** Modul-spezifische Datenpfade werden innerhalb der Jahrgangs-Struktur gelöscht.

## 6. Monitoring & Alerts
*   **Failure Alerts:** Fehlgeschlagene Cron-Jobs senden sofortige Alerts an das DevOps-Team (Slack/PagerDuty).
*   **Retention Dashboard:** Eine interne Admin-Ansicht zeigt die Anzahl der Jahrgänge in den verschiedenen Lifecycle-Phasen.
