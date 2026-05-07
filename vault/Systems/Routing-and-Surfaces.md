---
type: note
status: active
tags:
  - systems
  - routing
---

# Routing und Surfaces

ABI Planer nutzt ein hybrides Routing-Modell, um zwischen öffentlichem Content und der geschützten App zu unterscheiden.

## Hostname-Split (Multi-Surface)
Die App unterscheidet zwischen verschiedenen Oberflächen basierend auf der URL:
- **Landing Page**: Die Hauptdomain (z.B. `abi-planer.de`) zeigt die öffentlichen Informationen, News-Auszüge und den Login/Registrierungsbereich.
- **Dashboard**: Nach dem Login (oder via Subdomain wie `app.abi-planer.de`) greift das geschützte Dashboard.

## Next.js App Router
Wir nutzen den modernen App Router von Next.js:
- **Layouts**: Zentrale Layouts für das Dashboard (`src/app/(dashboard)/layout.tsx`) verwalten die Navigation und den `AppShell`.
- **Middleware**: Prüft den Auth-Status und leitet nicht-eingeloggte Nutzer von `/dashboard` auf `/login` zurück.
- **Parallel Routes / Intercepting Routes**: Werden für Modale (z.B. Karten-Details im TCG) genutzt, um den Kontext im Hintergrund zu behalten.

## Mobile-First Navigation
- Die Navigation passt sich dynamisch an. Auf Mobile nutzen wir eine Bottom-Nav oder ein Burger-Menü, auf Desktop eine Sidebar.
- Der `AppShell` sorgt für konsistentes Verhalten der UI-Elemente über alle Seiten hinweg.

## Verwandte Quellen
- [next.config.ts](../../next.config.ts)
- [[Design/UI-Guidelines]]
