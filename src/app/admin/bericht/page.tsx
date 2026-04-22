'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Info } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getCountFromServer, query, where, getDocs } from 'firebase/firestore'
import { toast } from 'sonner'

export default function BerichtGeneratorPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const canAccessAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!profile || !canAccessAdmin)) {
      router.replace('/unauthorized')
    }
  }, [profile, authLoading, canAccessAdmin, router])

  const fetchStatsAndPrint = async () => {
    setIsGenerating(true)
    try {
      // Metriken abrufen
      const usersSnap = await getCountFromServer(collection(db, 'profiles'))
      const approvedUsersSnap = await getCountFromServer(query(collection(db, 'profiles'), where('is_approved', '==', true)))
      const eventsSnap = await getCountFromServer(collection(db, 'events'))
      const cardsSnap = await getCountFromServer(collection(db, 'teachers'))
      const userTeachersSnap = await getCountFromServer(collection(db, 'user_teachers'))
      
      const transactionsSnap = await getDocs(collection(db, 'finances'))
      let totalIncome = 0
      let totalExpense = 0
      transactionsSnap.forEach(doc => {
        const amount = doc.data().amount || 0
        if (amount > 0) totalIncome += amount
        if (amount < 0) totalExpense += Math.abs(amount)
      })

      const data = {
        totalUsers: usersSnap.data().count,
        approvedUsers: approvedUsersSnap.data().count,
        totalEvents: eventsSnap.data().count,
        totalCards: cardsSnap.data().count,
        userTeachers: userTeachersSnap.data().count,
        totalIncome,
        totalExpense
      }
      
      generatePDF(data)
      toast.success('Bericht erfolgreich generiert!')
    } catch (error) {
      console.error(error)
      toast.error('Fehler beim Laden der Systemdaten')
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePDF = (data: {
    totalUsers: number;
    approvedUsers: number;
    totalEvents: number;
    totalCards: number;
    userTeachers: number;
    totalIncome: number;
    totalExpense: number;
  }) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Bitte Popups für diese Seite zulassen, um den Bericht anzuzeigen.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Projektbericht - ABI Planer</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            @page { 
              size: A4; 
              margin: 20mm; 
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.6; 
              color: #1a1a1a;
              margin: 0;
              padding: 0;
              background: white;
              -webkit-print-color-adjust: exact;
            }

            h1, h2, h3 { color: #0f172a; }
            h1 { font-size: 24pt; font-weight: 800; text-align: center; margin-bottom: 5mm; }
            h2 { font-size: 16pt; font-weight: 700; margin-top: 15mm; border-bottom: 2px solid #f1f5f9; padding-bottom: 2mm; }
            h3 { font-size: 14pt; font-weight: 600; margin-top: 10mm; }
            
            .page-break { page-break-before: always; }
            .cover-page { height: 250mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
            .cover-subtitle { font-size: 14pt; color: #64748b; margin-bottom: 20mm; }
            .cover-details { font-size: 12pt; color: #334155; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 5mm; }
            th, td { border: 1px solid #cbd5e1; padding: 3mm; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; }
            
            .toc { margin-top: 20mm; }
            .toc-item { display: flex; justify-content: space-between; margin-bottom: 3mm; font-size: 12pt; }
            .toc-item span.leader { flex-grow: 1; border-bottom: 1px dotted #cbd5e1; margin: 0 3mm; position: relative; top: -2mm; }
            
            .info-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 4mm; margin: 5mm 0; font-size: 11pt; color: #334155; }
          </style>
        </head>
        <body>
          <!-- Deckblatt -->
          <div class="cover-page">
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 20px; margin-bottom: 20mm;">
              <h1 style="margin: 0; font-size: 40pt; color: #0f172a;">ABI Planer</h1>
            </div>
            <h1>Projektbericht & Systemvorstellung</h1>
            <div class="cover-subtitle">Zentrale Organisationsplattform für das Abitur 2027</div>
            <div class="cover-details">
              <strong>Datum:</strong> ${new Date().toLocaleDateString('de-DE')}<br/>
              <strong>Adressat:</strong> Schulleitung / Schuladministration<br/>
              <strong>Version:</strong> 1.30.3
            </div>
          </div>
          
          <div class="page-break"></div>

          <!-- Inhaltsverzeichnis -->
          <h2>Inhaltsverzeichnis</h2>
          <div class="toc">
            <div class="toc-item"><span>1. Einleitung</span><span class="leader"></span><span>3</span></div>
            <div class="toc-item"><span>2. Projektbeschreibung</span><span class="leader"></span><span>3</span></div>
            <div class="toc-item"><span>3. Durchführung & Technische Architektur</span><span class="leader"></span><span>4</span></div>
            <div class="toc-item"><span>4. Ergebnisse & Sicherheitskonzept (Compliance)</span><span class="leader"></span><span>5</span></div>
            <div class="toc-item"><span>5. Reflexion & Fazit</span><span class="leader"></span><span>6</span></div>
            <div class="toc-item"><span>6. Quellenverzeichnis</span><span class="leader"></span><span>6</span></div>
          </div>

          <div class="page-break"></div>

          <!-- 1. Einleitung -->
          <h2>1. Einleitung</h2>
          <p>Die Organisation eines Abiturjahrgangs ist ein hochkomplexes Unterfangen, das Finanzmanagement, Terminplanung und die Koordination großer Schülergruppen umfasst. Bisherige Lösungen basierten oft auf ungesicherten Messenger-Gruppen und fragmentierten Excel-Listen, was sowohl datenschutzrechtliche als auch organisatorische Risiken birgt.</p>
          <p><strong>Ziel des Projekts</strong> ist es, eine zentrale, DSGVO-konforme und sichere Plattform ("ABI Planer") bereitzustellen, die alle Planungsaspekte in einem geschlossenen, schulinternen Ökosystem vereint. Die Plattform soll nicht nur die Effizienz der Organisationsteams steigern, sondern durch Gamification-Elemente (Sammelkarten) auch die Schulgemeinschaft stärken und Einnahmen für die Abiturkasse generieren.</p>

          <!-- 2. Projektbeschreibung -->
          <h2>2. Projektbeschreibung</h2>
          <p>Der ABI Planer ist eine modulare Web-Applikation, die speziell für die Anforderungen der Abiturplanung entwickelt wurde. Die Plattform teilt sich in verwaltungstechnische und interaktive Module auf:</p>
          <ul>
            <li><strong>Planung & Organisation:</strong> Ein zentrales Dashboard mit Countdown, Finanzstatus, Aufgabenverwaltung (To-Do-Listen mit Prioritäten), Kalender für Veranstaltungen und einem Umfrage-Modul für schnelle, demokratische Jahrgangsentscheidungen.</li>
            <li><strong>Finanzmanagement:</strong> Ein integriertes Kassenbuch-System, das Einnahmen und Ausgaben transparent trackt. Mit dem neuesten Update (v1.30.3) wurde ein System zum physischen Kassenabgleich ("Cash Verification") implementiert, das die Abweichung zwischen virtuellem Kontostand und gezähltem Barbestand revisionssicher dokumentiert.</li>
            <li><strong>Schulgemeinschaft & TCG:</strong> Ein geschlossenes System für Sammelkarten (Lehrerkarten) und ein In-App-Shop. Dies dient als innovatives Fundraising-Tool für den Abiturjahrgang.</li>
            <li><strong>Rechtemanagement:</strong> Ein striktes Rollensystem (<code>viewer</code>, <code>planner</code>, <code>admin</code>), das sicherstellt, dass nur autorisierte Personen sensible finanzielle oder organisatorische Änderungen vornehmen können.</li>
          </ul>

          <div class="page-break"></div>

          <!-- 3. Durchführung -->
          <h2>3. Durchführung & Technische Architektur</h2>
          <p>Die Entwicklung der Plattform folgte modernen Software-Engineering-Standards unter der Maßgabe "Security by Design" und "Privacy by Default":</p>
          <ul>
            <li><strong>Technologie-Stack:</strong> Die Plattform nutzt modernste Webtechnologien (Next.js 16, React 19) für schnelle Ladezeiten und mobile Optimierung (Mobile-First-Ansatz).</li>
            <li><strong>Infrastruktur:</strong> Das Backend wird über Google Firebase (Firestore, Storage, Cloud Functions) betrieben, was eine extrem hohe Ausfallsicherheit und Skalierbarkeit garantiert. Serverseitige Logik (Node.js 22) schützt kritische Prozesse wie den Shop oder das Tauschen von Sammelkarten vor Manipulationen.</li>
            <li><strong>Workflow:</strong> Jeder Code-Zusatz durchläuft automatisierte Qualitätskontrollen (Linting, Regression Tests) und wird vor der Veröffentlichung durch ein striktes Deployment-Gate geprüft.</li>
          </ul>

          <div class="page-break"></div>

          <!-- 4. Ergebnisse -->
          <h2>4. Ergebnisse & Sicherheitskonzept (Compliance)</h2>
          <p>Die Plattform ist voll funktionsfähig und bietet ein Höchstmaß an rechtlicher und technischer Sicherheit. Die wichtigsten Ergebnisse für die Schulleitung sind:</p>
          <div class="info-box">
            <strong>Geschlossenes System (Domain Restriction):</strong> Die Registrierung ist <strong>ausschließlich</strong> mit einer verifizierten schulischen E-Mail-Adresse (<code>@hgr-web.lernsax.de</code>) möglich. Externe haben keinen Zugriff auf das System.
          </div>
          <ul>
            <li><strong>DSGVO & Legal Compliance:</strong> Bei jeder Änderung am System greift eine interne "Legal Compliance Checklist". Personenbezogene Daten werden nach dem Prinzip der Datenminimierung erhoben. Lösch- und Anonymisierungslogiken sind fest im Backend verankert. Die Plattform verfügt über dedizierte Rechtsseiten (AGB, Datenschutz, Impressum).</li>
            <li><strong>Zero-Trust Security:</strong> Die Datenbank ist durch strikte Sicherheitsregeln gesichert. Zugriffe setzen einen manuell freigegebenen Status (<code>is_approved: true</code>) voraus. Es bestehen <strong>0 kritische Sicherheitslücken (CVEs)</strong>.</li>
            <li><strong>Sicheres Trading & RNG:</strong> Gamification-Elemente laufen über kryptografisch sichere, serverseitige Zufallsgeneratoren. Ein manipuliertes Tauschen von Karten ist durch transaktionssichere Backend-Prüfungen ausgeschlossen.</li>
          </ul>
          
          <h3>Live-Systemdaten (Stand: ${new Date().toLocaleDateString('de-DE')})</h3>
          <p>Die folgenden Daten wurden in Echtzeit aus der produktiven Datenbank aggregiert:</p>
          <table>
            <tr>
              <th>Metrik</th>
              <th>Wert</th>
            </tr>
            <tr>
              <td>Registrierte Profile</td>
              <td>${data.totalUsers} (davon ${data.approvedUsers} freigegeben)</td>
            </tr>
            <tr>
              <td>Geplante Veranstaltungen</td>
              <td>${data.totalEvents}</td>
            </tr>
            <tr>
              <td>Finanzen Einnahmen</td>
              <td>${data.totalIncome.toFixed(2).replace('.', ',')} €</td>
            </tr>
            <tr>
              <td>Finanzen Ausgaben</td>
              <td>${data.totalExpense.toFixed(2).replace('.', ',')} €</td>
            </tr>
            <tr>
              <td>Lehrer im Sammelkarten-Pool</td>
              <td>${data.totalCards}</td>
            </tr>
            <tr>
              <td>Aktive Sammler-Inventare</td>
              <td>${data.userTeachers}</td>
            </tr>
          </table>

          <div class="page-break"></div>

          <!-- 5. Reflexion & Fazit -->
          <h2>5. Reflexion & Fazit</h2>
          <p>Der ABI Planer löst das Problem der fragmentierten und unsicheren Abiturplanung durch eine professionelle, zentralisierte Softwarelösung. Was besonders gut funktionierte, war die Implementierung der strikten Zugangsbeschränkung über die Lernsax-Domain, wodurch Datenschutzbedenken von vornherein minimiert wurden.</p>
          <p>Zukünftig liegt der Fokus auf der reibungslosen Skalierung, wenn alle Schüler des Jahrgangs dem System beitreten, sowie der fortlaufenden Überwachung der Kassenprüfungs-Funktionen, um absolute finanzielle Transparenz bis zum Abitur 2027 zu gewährleisten. Die Plattform positioniert die Schule als Vorreiter in der sicheren, digitalen Schülerorganisation.</p>

          <!-- 6. Quellenverzeichnis -->
          <h2>6. Quellenverzeichnis</h2>
          <ul>
            <li><em>ABI Planer Security Guide & Zero-Trust Architecture</em> (Interne Dokumentation)</li>
            <li><em>Legal Compliance Checklist für Entwickler</em> (Stand: April 2026)</li>
            <li><em>Firestore Schema & Cloud Functions API</em> (Architekturspezifikation)</li>
            <li><em>Changelog Version 1.0.0 bis 1.30.3.02</em> (Revisionshistorie)</li>
          </ul>

        </body>
      </html>
    `)

    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 500)
  }

  if (authLoading) return null

  if (!profile || !canAccessAdmin) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Projektbericht Generator</h1>
        <p className="text-muted-foreground mt-1">Generiert einen PDF-fähigen, akademischen Projektbericht für die Schulleitung mit echten Systemdaten.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Akademischer Bericht (PDF)</CardTitle>
          </div>
          <CardDescription>
            Zieht Livedaten (Nutzerzahlen, Finanzen, etc.) und formatiert diese in eine druckfertige Vorlage inkl. Deckblatt, Inhaltsverzeichnis und Compliance-Erklärung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 border rounded-lg p-4 flex gap-3 text-sm text-muted-foreground items-start">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p>
              Beim Klick auf &quot;Generieren&quot; werden Livedaten aus der Datenbank aggregiert. 
              Es öffnet sich ein neues Fenster. Bitte nutze die <strong>Drucken-Funktion deines Browsers (Strg+P / Cmd+P)</strong> 
              und wähle &quot;Als PDF speichern&quot;.
            </p>
          </div>
          <Button onClick={fetchStatsAndPrint} disabled={isGenerating} size="lg" className="w-full sm:w-auto">
            {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileText className="w-5 h-5 mr-2" />}
            {isGenerating ? 'Daten werden geladen...' : 'Bericht als PDF generieren'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
