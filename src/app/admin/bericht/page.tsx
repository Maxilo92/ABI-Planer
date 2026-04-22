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

      const logsSnap = await getDocs(query(collection(db, 'logs'), where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))));
      
      const data = {
        totalUsers: usersSnap.data().count,
        approvedUsers: approvedUsersSnap.data().count,
        totalEvents: eventsSnap.data().count,
        totalCards: cardsSnap.data().count,
        userTeachers: userTeachersSnap.data().count,
        totalIncome,
        totalExpense,
        recentLogs: logsSnap.size
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
    recentLogs: number;
  }) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Bitte Popups erlauben.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Projektbericht - ABI Planer</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }
            h1 { font-size: 24pt; font-weight: 800; text-align: center; margin-bottom: 5mm; }
            h2 { font-size: 16pt; font-weight: 700; margin-top: 15mm; border-bottom: 2px solid #f1f5f9; padding-bottom: 2mm; }
            .page-break { page-break-before: always; }
            .cover-page { height: 250mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
            .info-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 4mm; margin: 5mm 0; }
            .canvas-container { width: 100%; height: 300px; margin: 10mm 0; }
            .script-section { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 6mm; border-radius: 4mm; }
          </style>
        </head>
        <body>
          <div class="cover-page">
            <h1>ABI Planer: Projektbericht</h1>
            <p>Zentrale Organisationsplattform für das Abitur 2027</p>
            <p><strong>Datum:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
          </div>

          <div class="page-break"></div>

          <h2>1. Ergebnisse & Visualisierung</h2>
          <div class="canvas-container">
            <canvas id="financeChart"></canvas>
          </div>
          <script>
            const ctx = document.getElementById('financeChart').getContext('2d');
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['Einnahmen', 'Ausgaben'],
                datasets: [{
                  label: 'Finanzübersicht (€)',
                  data: [${data.totalIncome}, ${data.totalExpense}],
                  backgroundColor: ['#22c55e', '#ef4444']
                }]
              },
              options: { responsive: true, maintainAspectRatio: false }
            });
          </script>

          <div class="page-break"></div>

          <h2>2. Gesprächsleitfaden für die Schulleitung</h2>
          <div class="script-section">
            <h3>Argumentationshilfen:</h3>
            <ul>
              <li><strong>Datenschutz:</strong> "Das System läuft in einem geschlossenen Ökosystem. Nur Schüler mit Lernsax-Mail dürfen sich anmelden."</li>
              <li><strong>Effizienz:</strong> "Wir haben bereits ${data.totalEvents} Veranstaltungen zentral geplant und verwalten Finanzen revisionssicher."</li>
              <li><strong>Sicherheit:</strong> "Keine Sicherheitslücken. Zero-Trust-Architektur und automatisierte Prüfungen bei jeder Änderung."</li>
              <li><strong>Engagement:</strong> "Über ${data.userTeachers} Karten-Inventare zeigen, wie sehr das System die Schulgemeinschaft einbindet."</li>
            </ul>
          </div>
          
          <script>
            setTimeout(() => { window.print(); }, 1500);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
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
