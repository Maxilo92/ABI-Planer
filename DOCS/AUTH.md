# Lernsax E-Mail Authentifizierung

Dieses Projekt nutzt die E-Mail-Verifizierung von Supabase, um sicherzustellen, dass nur Nutzer mit einer offiziellen `@hgr-web.lernsax.de` Adresse Zugriff erhalten.

## Supabase Konfiguration

Damit die Verifizierung funktioniert, müssen im Supabase Dashboard folgende Einstellungen vorgenommen werden:

### 1. E-Mail Bestätigung aktivieren
- Gehe zu `Authentication` -> `Providers` -> `Email`.
- Aktiviere **"Confirm email"**.
- (Optional aber empfohlen) Deaktiviere **"Secure email change"**, falls dies zu Problemen führt, oder konfiguriere es entsprechend.

### 2. E-Mail Templates anpassen
Unter `Authentication` -> `Email Templates` können die Texte für die Bestätigungsmail angepasst werden:

**Confirm signup:**
- **Subject:** `Bestätige deine Anmeldung für den ABI Planer`
- **Body:**
```html
<h2>Willkommen beim ABI Planer!</h2>
<p>Klicke auf den untenstehenden Link, um dein Konto zu bestätigen:</p>
<p><a href="{{ .ConfirmationURL }}">E-Mail bestätigen</a></p>
```

### 3. SMTP Server (Wichtig für Produktion)
Supabase erlaubt standardmäßig nur **3 E-Mails pro Stunde**. Für den echten Betrieb muss ein SMTP-Provider hinterlegt werden:
- Gehe zu `Authentication` -> `Settings`.
- Scrolle zu **"SMTP Settings"**.
- Aktiviere "Enable Custom SMTP".
- Trage die Daten deines Providers ein (z.B. [Resend](https://resend.com), SendGrid oder der Lernsax SMTP Server, falls Zugangsdaten vorhanden sind).

## Sicherheitshinweis
Die Anwendung prüft im Frontend, ob die E-Mail auf `@hgr-web.lernsax.de` endet. In Supabase Auth sollte unter `Authentication` -> `Settings` zusätzlich "Allow only specific domains" konfiguriert werden, um die Domain serverseitig zu erzwingen:
- **Allowed Email Domains:** `hgr-web.lernsax.de`
