export type Locale = 'de' | 'en'

export interface HelpFaqItem {
  id: string
  category: string
  question: string
  answer: string
  keywords: string[]
  priority: number
}

export interface HelpFaqSection {
  id: string
  category: string
  items: HelpFaqItem[]
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9äöüß\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokenize = (value: string) => {
  const stopwords = new Set(['der', 'die', 'das', 'und', 'oder', 'wie', 'was', 'wo', 'ist', 'ein', 'eine', 'ich', 'du', 'man', 'mit', 'zu', 'im', 'in', 'den', 'dem', 'auf', 'für', 'fur', 'kann', 'kannst', 'kann ich'])
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopwords.has(token))
}

export const helpFaqSections: Record<Locale, HelpFaqSection[]> = {
  de: [
    {
      id: 'registrierung',
      category: 'Registrierung & Anmeldung',
      items: [
        {
          id: 'registrierung-email',
          category: 'Registrierung & Anmeldung',
          question: 'Welche E-Mail-Adresse kann ich zur Registrierung nutzen?',
          answer: 'Du brauchst eine @hgr-web.lernsax.de Adresse. Das ist deine offizielle Schul-E-Mail. Andere E-Mail-Adressen (@gmail, @outlook, etc.) funktionieren nicht – das ist eine Sicherheitsmaßnahme.',
          keywords: ['registrierung', 'email', 'lersax', 'anmeldung'],
          priority: 100,
        },
        {
          id: 'registrierung-email-vergessen',
          category: 'Registrierung & Anmeldung',
          question: 'Ich habe meine Lernsax-Email vergessen.',
          answer: 'Deine Lernsax-Email sollte so aussehen: nachname.vorname@hgr-web.lernsax.de. Frag einen Lehrer oder Admin im Sekretariat nach deiner genauen Adresse.',
          keywords: ['lersax', 'email', 'vergessen', 'anmeldung'],
          priority: 95,
        },
        {
          id: 'registrierung-passwort-reset',
          category: 'Registrierung & Anmeldung',
          question: 'Wie setze ich mein Passwort zurück?',
          answer: 'Auf der Login-Seite klick auf "Passwort vergessen?" → gib deine E-Mail ein → ein Reset-Link wird dir gemailt → Folge dem Link und setze ein neues Passwort.',
          keywords: ['passwort', 'reset', 'login', 'vergessen'],
          priority: 95,
        },
        {
          id: 'registrierung-planner',
          category: 'Registrierung & Anmeldung',
          question: 'Bin ich automatisch ein Planner?',
          answer: 'Nein. Neue User sind standardmäßig Zuschauer und können nur lesen. Ein Admin kann dir die Planner-Rolle geben, wenn du bei der Abi-Planung aktiv mithelfen willst.',
          keywords: ['planner', 'rolle', 'zuschauer', 'admin'],
          priority: 80,
        },
      ],
    },
    {
      id: 'features',
      category: 'Features & Funktionen',
      items: [
        {
          id: 'features-neue-aufgabe',
          category: 'Features & Funktionen',
          question: 'Wie erstelle ich eine neue Aufgabe?',
          answer: 'Gehe zu "Aufgaben" → klick "Neue Aufgabe" → fülle Titel, Beschreibung und Priorität aus → speichern. Nur Planner und Admin können neue Aufgaben erstellen.',
          keywords: ['aufgabe', 'todo', 'neu', 'erstellen'],
          priority: 100,
        },
        {
          id: 'features-aufgabe-bearbeiten',
          category: 'Features & Funktionen',
          question: 'Kann ich eine Aufgabe editieren?',
          answer: 'Ja. Klick auf eine Aufgabe und nutze den Bearbeiten-Button. Du kannst Status ändern, Priorität anpassen oder die Beschreibung aktualisieren.',
          keywords: ['aufgabe', 'bearbeiten', 'editieren', 'todo'],
          priority: 90,
        },
        {
          id: 'features-abstimmungen',
          category: 'Features & Funktionen',
          question: 'Wie funktionieren die Abstimmungen?',
          answer: 'Gehe zu "Abstimmungen" → wähle eine Frage aus → klick deine bevorzugte Option. Deine Stimme wird gezählt und die Ergebnisse aktualisieren sich live.',
          keywords: ['abstimmung', 'umfrage', 'vote', 'poll'],
          priority: 90,
        },
        {
          id: 'features-news-schreiben',
          category: 'Features & Funktionen',
          question: 'Wer kann News schreiben?',
          answer: 'Nur Planner und Admin können News schreiben. So bleibt Spam gering und wichtige Infos gehen nicht unter.',
          keywords: ['news', 'schreiben', 'admin', 'planner'],
          priority: 85,
        },
        {
          id: 'features-konto-loeschen',
          category: 'Features & Funktionen',
          question: 'Kann ich mein Konto löschen?',
          answer: 'Das können nur Admins. Wenn du dein Konto nicht mehr brauchst, kontaktiere einen Admin. Dort kann es gelöscht werden.',
          keywords: ['konto', 'loeschen', 'admin', 'account'],
          priority: 75,
        },
      ],
    },
    {
      id: 'sammelkarten',
      category: 'Sammelkarten & Lehrer',
      items: [
        {
          id: 'sammelkarten-was-ist-das',
          category: 'Sammelkarten & Lehrer',
          question: 'Was sind die Lehrer-Sammelkarten?',
          answer: 'Das ist ein Mini-Game in der App. Du kannst Booster-Packs öffnen und digitale Karten deiner Lehrer sammeln. Jede Karte hat eine Seltenheit, die von euch als Community festgelegt wird.',
          keywords: ['sammelkarten', 'lehrer', 'booster', 'karten'],
          priority: 100,
        },
        {
          id: 'sammelkarten-seltenheit',
          category: 'Sammelkarten & Lehrer',
          question: 'Wie funktioniert die Seltenheits-Abstimmung?',
          answer: 'Unter "Umfragen" findest du die Lehrer-Seltenheit-Abstimmung. Dort kannst du für jeden Lehrer abstimmen, wie selten er sein sollte. Die Durchschnittswerte helfen dabei, die Seltenheiten im Album festzulegen.',
          keywords: ['seltenheit', 'abstimmung', 'karten', 'umfrage'],
          priority: 95,
        },
        {
          id: 'sammelkarten-lehrer-album',
          category: 'Sammelkarten & Lehrer',
          question: 'Wo finde ich mein Lehrer-Album?',
          answer: 'Klicke im Menü auf "Sammelkarten" → "Lehrer-Album". Dort siehst du deine gesammelten Karten und deinen Fortschritt. Booster kannst du unter "Booster öffnen" ziehen.',
          keywords: ['album', 'sammelkarten', 'booster', 'lehrer'],
          priority: 90,
        },
      ],
    },
    {
      id: 'zahlungen',
      category: 'Zahlungen & Booster-Kauf',
      items: [
        {
          id: 'zahlungen-booster-kaufen',
          category: 'Zahlungen & Booster-Kauf',
          question: 'Wie kann ich zusätzliche Booster-Packs kaufen?',
          answer: 'Im Bereich "Sammelkarten" findest du den "Booster Shop". Dort kannst du verschiedene Pakete wählen. Die Zahlung erfolgt sicher über Stripe.',
          keywords: ['booster', 'shop', 'kaufen', 'stripe'],
          priority: 100,
        },
        {
          id: 'zahlungen-methoden',
          category: 'Zahlungen & Booster-Kauf',
          question: 'Welche Zahlungsmethoden werden unterstützt?',
          answer: 'Wir unterstützen gängige Methoden via Stripe, darunter Kreditkarte, Apple Pay, Google Pay, Giropay und Klarna.',
          keywords: ['zahlung', 'stripe', 'apple pay', 'google pay'],
          priority: 85,
        },
        {
          id: 'zahlungen-geld-verwendung',
          category: 'Zahlungen & Booster-Kauf',
          question: 'Was passiert mit dem Geld?',
          answer: '90% der Gewinne fließen direkt in die Stufenkasse für Abiball und Aktionen. Die restlichen 10% decken Transaktionsgebühren und Serverkosten.',
          keywords: ['geld', 'kasse', 'abiball', 'serverkosten'],
          priority: 80,
        },
      ],
    },
    {
      id: 'finanzen',
      category: 'Finanzen & Kontostand',
      items: [
        {
          id: 'finanzen-berechnung',
          category: 'Finanzen & Kontostand',
          question: 'Wie werden Einnahmen und Ausgaben berechnet?',
          answer: 'Einnahmen sind positive Werte, Ausgaben negative Werte. Der Kontostand = Einnahmen minus Ausgaben. Die Finanzierungsquote ist: aktueller Kontostand geteilt durch Ziel mal 100.',
          keywords: ['finanzen', 'kontostand', 'einnahmen', 'ausgaben'],
          priority: 100,
        },
        {
          id: 'finanzen-wer-hat-eingetragen',
          category: 'Finanzen & Kontostand',
          question: 'Kann ich sehen wer was eingetragen hat?',
          answer: 'Ja. Jeder Eintrag zeigt den Namen des Autors. Alle Änderungen werden auch geloggt, damit nachvollziehbar bleibt, wer was geändert hat.',
          keywords: ['finanzen', 'autor', 'eintrag', 'log'],
          priority: 90,
        },
        {
          id: 'finanzen-ziel-falsch',
          category: 'Finanzen & Kontostand',
          question: 'Das Finanzierungsziel ist falsch eingestellt.',
          answer: 'Nur Admins können das ändern. Gehe zu "Einstellungen" oder schreib einen Admin an, damit das Ziel angepasst wird.',
          keywords: ['ziel', 'finanzen', 'einstellungen', 'admin'],
          priority: 85,
        },
      ],
    },
    {
      id: 'gruppen',
      category: 'Gruppen & Rollen',
      items: [
        {
          id: 'gruppen-rollen',
          category: 'Gruppen & Rollen',
          question: 'Was ist der Unterschied zwischen Viewer, Planner und Admin?',
          answer: 'Viewer kann alles ansehen und lesen, aber nichts erstellen. Planner kann Events, Aufgaben und News erstellen und bearbeiten. Admin kann zusätzlich Nutzer und Rollen verwalten.',
          keywords: ['rolle', 'viewer', 'planner', 'admin'],
          priority: 100,
        },
        {
          id: 'gruppen-erstellen',
          category: 'Gruppen & Rollen',
          question: 'Wie werden Gruppen erstellt?',
          answer: 'Gruppen werden von Admins unter Einstellungen → Planungs-Gruppen erstellt. Neue Gruppen sind danach sofort für alle sichtbar.',
          keywords: ['gruppen', 'einstellungen', 'admin', 'planung'],
          priority: 90,
        },
      ],
    },
    {
      id: 'technisch',
      category: 'Technische Fragen',
      items: [
        {
          id: 'technisch-langsam',
          category: 'Technische Fragen',
          question: 'Die App lädt sehr langsam.',
          answer: 'Das kann am Netzwerk liegen oder die App braucht neu zu laden. Versuche: Refresh, Browser-Cache leeren oder ein anderes Netzwerk testen. Wenn es bleibt, gib Feedback.',
          keywords: ['langsam', 'laden', 'cache', 'netzwerk'],
          priority: 100,
        },
        {
          id: 'technisch-aenderungen',
          category: 'Technische Fragen',
          question: 'Ich sehe die neuen Änderungen nicht.',
          answer: 'Echtzeit-Sync sollte automatisch funktionieren. Wenn nicht, refresh die Seite oder melde dich neu an. Falls nötig: Browser-Cache leeren.',
          keywords: ['aenderungen', 'nicht sichtbar', 'reload', 'cache'],
          priority: 90,
        },
        {
          id: 'technisch-darkmode',
          category: 'Technische Fragen',
          question: 'Dark Mode funktioniert nicht.',
          answer: 'Gehe zu Einstellungen. Dort sollte ein Theme-Toggle sein. Wenn das nicht funktioniert, lade die Seite neu.',
          keywords: ['dark mode', 'theme', 'einstellungen'],
          priority: 80,
        },
      ],
    },
    {
      id: 'datenschutz',
      category: 'Datenschutz & Sicherheit',
      items: [
        {
          id: 'datenschutz-daten-sehen',
          category: 'Datenschutz & Sicherheit',
          question: 'Wer kann meine Daten sehen?',
          answer: 'Grundsätzlich nur du selbst. Admins können dein Profil verwalten, aber nicht deine privaten Daten editieren. Finanzen sind für Planner sichtbar, damit die Planung transparent bleibt.',
          keywords: ['daten', 'sehen', 'datenschutz', 'admin'],
          priority: 100,
        },
        {
          id: 'datenschutz-logs',
          category: 'Datenschutz & Sicherheit',
          question: 'Werden Logs aufbewahrt?',
          answer: 'Ja, kritische Aktionen werden für Audit-Trails gespeichert. Das hilft bei Streitigkeiten oder wenn etwas Falsches passiert ist.',
          keywords: ['logs', 'audit', 'aufbewahrt', 'sicherheit'],
          priority: 90,
        },
      ],
    },
    {
      id: 'bugs',
      category: 'Bugs & Fehler',
      items: [
        {
          id: 'bugs-melden',
          category: 'Bugs & Fehler',
          question: 'Ich habe einen Bug gefunden – wie melde ich ihn?',
          answer: 'Gehe im Menü zu Feedback und beschreibe den Bug möglichst genau: was du gemacht hast, was passieren sollte und was stattdessen passiert. Ein Screenshot hilft zusätzlich.',
          keywords: ['bug', 'fehler', 'feedback', 'melden'],
          priority: 100,
        },
        {
          id: 'bugs-fehler-laden',
          category: 'Bugs & Fehler',
          question: 'Die Seite zeigt "Fehler beim Laden" an.',
          answer: 'Probier zunächst Refresh, Browser-Cache leeren oder einen anderen Browser. Wenn das Problem bleibt, schick ein Feedback mit Screenshot und betroffener Seite.',
          keywords: ['fehler', 'laden', 'bug', 'seite'],
          priority: 90,
        },
      ],
    },
    {
      id: 'kontakt',
      category: 'Support & Kontakt',
      items: [
        {
          id: 'kontakt-hilfe',
          category: 'Support & Kontakt',
          question: 'Wer kann mir helfen wenn ich Probleme habe?',
          answer: 'Erste Anlaufstelle ist das FAQ und die Dokumentation. Wenn das nicht hilft, nutze Feedback in der App oder kontaktiere einen Admin.',
          keywords: ['hilfe', 'support', 'kontakt', 'probleme'],
          priority: 100,
        },
        {
          id: 'kontakt-feature-idee',
          category: 'Support & Kontakt',
          question: 'Wie kann ich eine Feature-Idee einreichen?',
          answer: 'Gehe zu Feedback und schreibe deine Idee auf. Nutze am besten einen klaren Titel mit Feature-Request.',
          keywords: ['feature', 'idee', 'feedback', 'verbesserung'],
          priority: 85,
        },
      ],
    },
  ],
  en: [
    {
      id: 'registrierung',
      category: 'Registration & Login',
      items: [
        {
          id: 'registrierung-email',
          category: 'Registration & Login',
          question: 'Which email address can I use for registration?',
          answer: 'You need an @hgr-web.lernsax.de address. This is your official school email. Other email addresses (@gmail, @outlook, etc.) will not work – this is a security measure.',
          keywords: ['registration', 'email', 'lernsax', 'login'],
          priority: 100,
        },
      ],
    },
    // Placeholder for English content
  ]
}

export const getHelpFaqItems = (locale: Locale = 'de') => (helpFaqSections[locale] || helpFaqSections.de).flatMap((section) => section.items)

export function searchFaqItems(query: string, items: HelpFaqItem[], limit = 5) {
  const tokens = tokenize(query)
  if (tokens.length === 0) {
    return items.slice(0, limit)
  }

  const scored = items
    .map((item) => {
      const text = normalizeText(`${item.question} ${item.answer} ${item.category} ${item.keywords.join(' ')}`)
      let score = item.priority

      if (normalizeText(item.question) === normalizeText(query)) {
        score += 120
      }

      for (const token of tokens) {
        if (text.includes(token)) score += 15
        if (normalizeText(item.question).includes(token)) score += 25
        if (normalizeText(item.category).includes(token)) score += 8
      }

      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || right.item.priority - left.item.priority)

  return scored.slice(0, limit).map(({ item }) => item)
}

export function searchHelpFaqs(query: string, locale: Locale = 'de', limit = 5) {
  return searchFaqItems(query, getHelpFaqItems(locale), limit)
}

export function formatHelpFaqContext(items: HelpFaqItem[]) {
  if (items.length === 0) {
    return 'Keine passenden FAQ-Treffer gefunden.'
  }

  return items
    .map((item, index) => `${index + 1}. [${item.category}] ${item.question}\nAntwort: ${item.answer}`)
    .join('\n\n')
}
