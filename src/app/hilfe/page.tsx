'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function HilfePage() {
  const router = useRouter()
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({})
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const faqs = [
    {
      id: 'registrierung',
      category: 'Registrierung & Anmeldung',
      items: [
        {
          q: 'Welche E-Mail-Adresse kann ich zur Registrierung nutzen?',
          a: 'Du brauchst eine @hgr-web.lernsax.de Adresse. Das ist deine offizielle Schul-E-Mail. Andere E-Mail-Adressen (@gmail, @outlook, etc.) funktionieren nicht – das ist eine Sicherheitsmaßnahme.'
        },
        {
          q: 'Ich habe meine Lernsax-Email vergessen.',
          a: 'Deine Lernsax-Email sollte so aussehen: nachname.vorname@hgr-web.lernsax.de. Frag einen Lehrer oder Admin im Sekretariat nach deiner genauen Adresse.'
        },
        {
          q: 'Wie setze ich mein Passwort zurück?',
          a: 'Auf der Login-Seite klick auf "Passwort vergessen?" → gib deine E-Mail ein → ein Reset-Link wird dir mailt → Folge dem Link und setze ein neues Passwort.'
        },
        {
          q: 'Bin ich automatisch ein "Planner"?',
          a: 'Nein. Neue User sind standardmäßig "Zuschauer" (können nur lesen). Admin kann dir die "Planner"-Rolle geben wenn du bei der Abi-Planung aktiv mithelfen willst.'
        }
      ]
    },
    {
      id: 'features',
      category: 'Features & Funktionen',
      items: [
        {
          q: 'Wie erstelle ich eine neue Aufgabe?',
          a: 'Gehe zu "Aufgaben" → Klick "Neue Aufgabe" → Fülle Titel, Beschreibung, Priorität aus → Speichern. Nur Planner & Admin können neue Aufgaben erstellen.'
        },
        {
          q: 'Kann ich eine Aufgabe editieren?',
          a: 'Ja! Klick auf eine Aufgabe → "Bearbeiten" Button. Du kannst Status ändern, Priorität anpassen, oder die Beschreibung updaten.'
        },
        {
          q: 'Wie funktionieren die Abstimmungen?',
          a: 'Gehe zu "Abstimmungen" → Wähle eine Frage aus → Klick deine bevorzugte Option → Deine Stimme wird gezählt. Die Ergebnisse aktualisieren sich live.'
        },
        {
          q: 'Wer kann News schreiben?',
          a: 'Nur Planner und Admin können News schreiben. Das ist so, damit nicht zu viel Spam entsteht und wichtige Infos nicht untergehen.'
        },
        {
          q: 'Kann ich mein Konto löschen?',
          a: 'Das können nur Admin. Wenn du dein Konto nicht mehr brauchst, kontaktier einen Admin → die können es löschen.'
        }
      ]
    },
    {
      id: 'sammelkarten',
      category: 'Sammelkarten & Lehrer',
      items: [
        {
          q: 'Was sind die Lehrer-Sammelkarten?',
          a: 'Das ist ein Mini-Game in der App! Du kannst Booster-Packs öffnen und digitale Karten deiner Lehrer sammeln. Jede Karte hat eine Seltenheit, die von euch als Community festgelegt wird.'
        },
        {
          q: 'Wie funktioniert die Seltenheits-Abstimmung?',
          a: 'Unter "Umfragen" findest du die Lehrer-Seltenheit-Abstimmung. Dort kannst du für jeden Lehrer abstimmen, wie selten er sein sollte. Die Durchschnittswerte helfen dabei, die Seltenheiten im Album festzulegen.'
        },
        {
          q: 'Warum sehe ich nur einen Lehrer nach dem anderen?',
          a: 'Die Umfrage zeigt dir die Lehrer nacheinander an, damit alle Lehrer gleichmäßig viele Stimmen bekommen und wir ein faires Ergebnis für das Sammelalbum erhalten. Neue Lehrer werden sofort in den Pool aufgenommen.'
        },
        {
          q: 'Wo finde ich mein Lehrer-Album?',
          a: 'Klicke im Menü auf "Sammelkarten" → "Lehrer-Album". Dort siehst du deine gesammelten Karten und deinen Fortschritt. Booster kannst du unter "Booster öffnen" ziehen.'
        }
      ]
    },
    {
      id: 'zahlungen',
      category: 'Zahlungen & Booster-Kauf',
      items: [
        {
          q: 'Wie kann ich zusätzliche Booster-Packs kaufen?',
          a: 'Im Bereich "Sammelkarten" findest du den "Booster Shop". Dort kannst du verschiedene Pakete wählen. Die Zahlung erfolgt sicher über unseren Partner Stripe.'
        },
        {
          q: 'Welche Zahlungsmethoden werden unterstützt?',
          a: 'Wir unterstützen alle gängigen Methoden via Stripe, darunter Kreditkarte (Visa, Mastercard), Apple Pay, Google Pay, Giropay und Klarna.'
        },
        {
          q: 'Was passiert mit dem Geld?',
          a: 'Das ist das Beste: 90% der Gewinne fließen direkt in eure Stufenkasse (Abikasse), um euren Abiball und eure Aktionen zu finanzieren. Die restlichen 10% decken Transaktionsgebühren und Serverkosten.'
        },
        {
          q: 'Erhalte ich eine Rechnung?',
          a: 'Ja! Nach jedem Kauf schickt dir Stripe automatisch eine offizielle Rechnung als PDF an deine hinterlegte E-Mail-Adresse.'
        },
        {
          q: 'Kann ich meinen Kauf widerrufen?',
          a: 'Da es sich um digitale Inhalte handelt, die sofort nach dem Kauf in deinem Album erscheinen, erlischt das Widerrufsrecht mit der Bereitstellung. Dem stimmst du beim Kauf explizit zu.'
        }
      ]
    },
    {
      id: 'finanzen',
      category: 'Finanzen & Kontostand',
      items: [
        {
          q: 'Wie werden Einnahmen & Ausgaben berechnet?',
          a: 'Einnahmen sind positive Werte (zB +500€ Cake Sale). Ausgaben sind negative Werte (zB -200€ DJ). Der Kontostand = Einnahmen MINUS Ausgaben. Die Finanzierungsquote ist: Aktueller Kontostand / Ziel × 100%.'
        },
        {
          q: 'Kann ich sehen wer was eingetragen hat?',
          a: 'Ja! Jeder Eintrag zeigt den Namen des Authors. Das ist wichtig für Transparenz. Alle Änderungen werden auch geLoggt – wenn jemand was löscht oder ändert, wird das gespeichert.'
        },
        {
          q: 'Das Finanzierungsziel ist falsch eingestellt.',
          a: 'Nur Admin können das ändern. Gehe zu "Einstellungen" (oder schreib einen Admin an) → die können das Ziel anpassen.'
        },
        {
          q: 'Warum zeigt das Dashboard andere Zahlen als die Finanzen-Seite?',
          a: 'Das sollte nicht passieren! Wenn du einen Unterschied siehst, kann es sein, dass die Seite noch nicht aktualisiert wurde. Probier einen Refresh (F5). Wenn das Problem bleibt → Feedback geben!'
        }
      ]
    },
    {
      id: 'gruppen',
      category: 'Gruppen & Rollen',
      items: [
        {
          q: 'Was ist der Unterschied zwischen Viewer, Planner und Admin?',
          a: 'Zuschauer: Kann alles ansehen & lesen, aber nicht erstellen. Planner: Kann Events, Aufgaben, News erstellen & editieren. Admin: Kann alles + Nutzer-Rollen verwalten.'
        },
        {
          q: 'Wie werden Gruppen erstellt?',
          a: 'Gruppen werden von Admin unter Einstellungen → Planungs-Gruppen erstellt. Neue Gruppen werden sofort für alle sichtbar.'
        },
        {
          q: 'Kann ich eine Gruppe verlassen?',
          a: 'Nein, Gruppen sind automatisch basierend auf deine Klasse/Kurs. Aber du kannst die Gruppe "Stummschalten" wenn dich die Notifications stören.'
        }
      ]
    },
    {
      id: 'technisch',
      category: 'Technische Fragen',
      items: [
        {
          q: 'Die App lädt sehr langsam.',
          a: 'Das kann am Netzwerk liegen oder die App braucht neu zu laden. Versuche: 1) Refresh (F5), 2) Browser Cache leeren (DevTools → Storage → Clear), 3) Ein anderes Netzwerk probieren oder warten. Wenn\'s immer noch langsam ist → Feedback!'
        },
        {
          q: 'Ich sehe die neuen Änderungen nicht.',
          a: 'Echtzeit-Sync sollte automatisch funktionieren. Wenn nicht, refresh die Seite oder versuch neu anzumelden. Browser Cache-Probleme? → Storage leeren.'
        },
        {
          q: 'Dark Mode funktioniert nicht.',
          a: 'Gehe zu Einstellungen → Dort sollte ein Theme-Toggle sein. Wenn das nicht funktioniert, probier die Seite neu zu laden.'
        },
        {
          q: 'Ich bin auf Mobile – warum ist das Layout komisch?',
          a: 'Die App sollte auf Mobile perfekt funktionieren. Wenn was komisch aussieht, probier: 1) Zoom zurücksetzen (Menü → Zoom 100%), 2) Browser neu starten, 3) Feedback geben mit Details!'
        },
        {
          q: 'Logout funktioniert nicht – ich bin immer noch angemeldet.',
          a: 'Versuche: 1) Neuladen der Seite, 2) Browser Cache leeren, 3) Incognito-Tab öffnen & testen. Wenn das Problem bleibt → Browser-Cookies blockieren möglicherweise Logout.'
        }
      ]
    },
    {
      id: 'datenschutz',
      category: 'Datenschutz & Sicherheit',
      items: [
        {
          q: 'Wer kann meine Daten sehen?',
          a: 'Grundsätzlich nur:Du selbst. Admin können dein Profil verwalten (Rollen etc) aber nicht deine privaten Daten editieren. Finanzen sind für alle Planner sichtbar (wegen Transparenz), Details pro Transaktion nur für Dokumentation/Admin.'
        },
        {
          q: 'Werden meine Daten gelöscht wenn ich die Seite verlasse?',
          a: 'Nein, deine Daten bleiben in der Datenbank bis Admin dein Konto löscht. Die App speichert alles dauerhaft – das ist ja der Sinn!'
        },
        {
          q: 'Ist mein Passwort sicher?',
          a: 'Ja. Passwörter werden verschlüsselt über Firebase gespeichert. Firebase ist von Google – eine der sichersten Cloud-Plattformen. Dein Passwort wird niemals plain-text gespeichert oder irgendwem gezeigt.'
        },
        {
          q: 'Werden Logs aufbewahrt?',
          a: 'Ja, kritische Aktionen (Admin-Changes, Finanztransaktionen, Feedback) werden geLoggt für Audit-Trails. Das hilft bei Streitigkeiten oder wenn etwas Falsches passiert ist – man kann zurückverfolgen was wann gemacht wurde.'
        }
      ]
    },
    {
      id: 'bugs',
      category: 'Bugs & Fehler',
      items: [
        {
          q: 'Ich habe einen Bug gefunden – wie melde ich ihn?',
          a: 'Perfekt! Gehe im Menü zu "Feedback" → Beschreib den Bug ganz genau: Was hast du gemacht? Was sollte passieren? Was passiert stattdessen? Browser & Gerät? Screenshot hilft! → Speichern → Entwickler werden es sehen.'
        },
        {
          q: 'Ich sehe einen roten Fehler in der Console (F12).',
          a: 'Das kann ein Browser-Extension sein oder eine temporäre Netzwerk-Issue. Für uns wichtig: Kopiere den Error-Text und gib einen Bug-Report im Feedback. So können wir es fixen!'
        },
        {
          q: 'Die Seite zeigt "Fehler beim Laden" an.',
          a: '1) Probier zu Refreshen (F5), 2) Browser Cache leeren, 3) Andere Browser testen, 4) Later probieren (Server-Issue), 5) Feedback geben mit Screenshot. Wichtig: Welche Seite? Wann? Browser?'
        }
      ]
    },
    {
      id: 'kontakt',
      category: 'Support & Kontakt',
      items: [
        {
          q: 'Wer kann mir helfen wenn ich Probleme habe?',
          a: 'Erste Anlaufstelle: Dieses FAQ & die Dokumentation. Wenn das nicht hilft → Gib Feedback in der App. Oder kontaktier ein Admin direkt (Namen sollten im Admin-Dashboard stehen).'
        },
        {
          q: 'Wie kann ich eine Feature-Idee einreichen?',
          a: 'Gehe zu Feedback → Schreib deine Idee auf. Nutze den Titel "Feature-Request:" damit es klar ist. Team wird es reviewen und möglicherweise in v1.1.0 oder später implementieren!'
        }
      ]
    }
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <Button 
        variant="ghost" 
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Hilfe & FAQ</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tipp:</strong> Nutze Strg+F (Cmd+F auf Mac) um diese Seite zu durchsuchen!
            </p>
          </div>

          {faqs.map(category => (
            <section key={category.id} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">
                {category.category}
              </h3>

              <div className="space-y-2">
                {category.items.map((item, idx) => {
                  const accordionId = `${category.id}-${idx}`
                  const isOpen = openAccordions[accordionId]

                  return (
                    <div key={accordionId} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleAccordion(accordionId)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="font-medium text-foreground pr-4">
                          {item.q}
                        </span>
                        <ChevronDown 
                          className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-4 py-3 bg-muted/30 border-t text-muted-foreground leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          <section className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Deine Frage ist nicht beantwortet?</h3>
            <p className="text-muted-foreground leading-relaxed">
              Kein Problem! Nutze das <strong>Feedback-Feature</strong> im Menü – schreib deine Frage auf und das Team wird dir helfen. Oder stell die Frage im Planner-Team-Chat.
            </p>
          </section>

          <div className="pt-8 border-t space-y-2">
            <p className="text-xs text-muted-foreground italic">
              Stand: März 2026 | v{version}
            </p>
            <p className="text-xs text-muted-foreground">
              Noch Fragen? Klick hier um <strong>Feedback zu geben</strong> oder kontaktiert einen Admin.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
