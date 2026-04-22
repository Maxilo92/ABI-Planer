'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { collection, getCountFromServer, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { FileText, Loader2, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ReportSection } from '@/lib/reportAnalysisModule'

type ChartType = 'bar' | 'line' | 'pie' | 'doughnut'

export default function BerichtGeneratorPage() {
  const { profile, loading: authLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string>('')
  
  const [selectedSections, setSelectedSections] = useState<Record<ReportSection, boolean>>({
    pitch: true,
    manual: true,
    intro: true,
    features: true,
    users: true,
    finances: true,
    shop: true,
    social: true,
    technical: true,
    roadmap: true,
    script: true
  })

  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({
    users: 'bar',
    finances: 'doughnut',
    shop: 'bar',
    social: 'pie'
  })

  const canAccessAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'admin_main' ||
    profile?.role === 'admin_co'

  useEffect(() => {
    if (!authLoading && (!profile || !canAccessAdmin)) {
      router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
    }
  }, [profile, authLoading, canAccessAdmin, router, pathname])

  const toggleSection = (section: ReportSection) => {
    setSelectedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const fetchStatsAndPrint = async () => {
    if (!user) return
    setIsGenerating(true)
    setProgress(5)
    setCurrentStep('Daten werden verarbeitet...')
    
    try {
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

      const shopSnap = await getDocs(collection(db, 'shop_earnings'))
      let shopGross = 0
      let shopNet = 0
      let shopAbiShare = 0
      shopSnap.forEach(doc => {
        const d = doc.data()
        shopGross += d.amount_total_eur || 0
        shopNet += d.payout_net_eur || 0
        shopAbiShare += d.abi_share_eur || 0
      })

      const logsSnap = await getDocs(query(collection(db, 'logs'), where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))));
      
      setProgress(10)
      
      const token = await user.getIdToken()
      const aiAnalyses: Record<string, string> = {}
      
      const sectionsToAnalyze: ReportSection[] = ['pitch', 'manual', 'features', 'users', 'finances', 'shop', 'social', 'technical', 'script', 'roadmap']
      const activeAnalyses = sectionsToAnalyze.filter(s => selectedSections[s])
      
      for (let i = 0; i < activeAnalyses.length; i++) {
        const section = activeAnalyses[i]
        setCurrentStep(`Sektion: ${section}...`)
        
        const response = await fetch('/api/admin/report/analyze', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            section,
            data: {
              totalUsers: usersSnap.data().count,
              approvedUsers: approvedUsersSnap.data().count,
              totalEvents: eventsSnap.data().count,
              totalCards: cardsSnap.data().count,
              userTeachers: userTeachersSnap.data().count,
              totalIncome,
              totalExpense,
              shopGross,
              shopNet,
              shopAbiShare,
              recentLogs: logsSnap.size
            }
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          aiAnalyses[section] = result.analysis
        } else {
          aiAnalyses[section] = 'Daten werden geladen...'
        }
        
        setProgress(10 + ((i + 1) / activeAnalyses.length) * 85)
      }

      setCurrentStep('Dokument wird erstellt...')
      setProgress(98)

      const reportData = {
        totalUsers: usersSnap.data().count,
        approvedUsers: approvedUsersSnap.data().count,
        totalEvents: eventsSnap.data().count,
        totalCards: cardsSnap.data().count,
        userTeachers: userTeachersSnap.data().count,
        totalIncome,
        totalExpense,
        shopGross,
        shopNet,
        shopAbiShare,
        recentLogs: logsSnap.size,
        aiAnalyses,
        selectedSections,
        chartTypes
      }
      
      generatePDF(reportData)
      toast.success('Report generiert')
    } catch (error) {
      console.error(error)
      toast.error('Fehler')
    } finally {
      setIsGenerating(false)
      setProgress(0)
      setCurrentStep('')
    }
  }

  const generatePDF = (data: any) => {
    const { aiAnalyses, selectedSections, chartTypes } = data
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const mdToHtml = (text: string) => {
      if (!text) return ''
      return text
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>')
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Projekt-Report - ABI Planer 2027</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.4; 
              color: #000; 
              margin: 0; 
              padding: 0;
            }
            .page { 
              width: 210mm; 
              min-height: 297mm; 
              padding: 20mm; 
              margin: 0 auto; 
              background: white; 
              page-break-after: always;
            }
            @media print {
              .page { margin: 0; page-break-after: always; }
              @page { size: A4; margin: 0; }
            }
            
            h1 { font-size: 20pt; margin-bottom: 10mm; border-bottom: 2px solid #000; padding-bottom: 2mm; }
            h2 { font-size: 16pt; margin-top: 10mm; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 5mm; }
            h3 { font-size: 12pt; margin-top: 5mm; margin-bottom: 2mm; text-decoration: underline; }
            
            p { margin-bottom: 3mm; font-size: 10pt; text-align: justify; }
            
            .plain-table {
              width: 100%;
              border-collapse: collapse;
              margin: 5mm 0;
              font-size: 10pt;
            }
            .plain-table th, .plain-table td {
              border: 1px solid #000;
              padding: 2mm;
              text-align: left;
            }
            
            .chart-box { 
              width: 100%; 
              height: 300px; 
              margin: 5mm 0; 
              border: 1px solid #ccc;
            }
            
            .footer { 
              font-size: 8pt; 
              border-top: 1px solid #000; 
              margin-top: 10mm;
              padding-top: 2mm;
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <h1>Projekt-Report: ABI Planer 2027</h1>
            <p>Datum: ${new Date().toLocaleDateString('de-DE')}</p>
            <p>Statusbericht über Nutzerzahlen, Finanzen und Systementwicklung.</p>
            
            <table class="plain-table">
              <thead><tr><th>Kennzahl</th><th>Wert</th></tr></thead>
              <tbody>
                <tr><td>Nutzer (Verifiziert)</td><td>${data.approvedUsers}</td></tr>
                <tr><td>Einnahmen (Netto)</td><td>${data.shopAbiShare.toFixed(2)} EUR</td></tr>
                <tr><td>System-Ereignisse (30d)</td><td>${data.recentLogs}</td></tr>
              </tbody>
            </table>

            ${selectedSections.pitch ? `
              <h2>Projekt-Ziele</h2>
              <p>${mdToHtml(aiAnalyses.pitch)}</p>
            ` : ''}

            <div class="footer">Seite 1</div>
          </div>

          ${selectedSections.users ? `
          <div class="page">
            <h2>Nutzer-Analyse</h2>
            <p>Auswertung der Registrierungen und Verifizierungen.</p>
            <div class="chart-box"><canvas id="usersChart"></canvas></div>
            <p>${mdToHtml(aiAnalyses.users)}</p>
            <div class="footer">Seite 2</div>
          </div>
          ` : ''}

          ${selectedSections.finances ? `
          <div class="page">
            <h2>Finanz-Auswertung</h2>
            <table class="plain-table">
              <thead><tr><th>Posten</th><th>Betrag (EUR)</th></tr></thead>
              <tbody>
                <tr><td>Gesamteinnahmen</td><td>${data.totalIncome.toFixed(2)}</td></tr>
                <tr><td>Gesamtausgaben</td><td>${data.totalExpense.toFixed(2)}</td></tr>
                <tr><td>Shop-Gewinn (Stufe)</td><td>${data.shopAbiShare.toFixed(2)}</td></tr>
              </tbody>
            </table>
            <div class="chart-box"><canvas id="financesChart"></canvas></div>
            <p>${mdToHtml(aiAnalyses.finances)}</p>
            <p>${mdToHtml(aiAnalyses.shop)}</p>
            <div class="footer">Seite 3</div>
          </div>
          ` : ''}

          <div class="page">
            ${selectedSections.intro ? `
              <h2>Einleitung</h2>
              <p>${mdToHtml(aiAnalyses.intro)}</p>
            ` : ''}

            ${selectedSections.features ? `
              <h2>Funktionsübersicht</h2>
              <p>${mdToHtml(aiAnalyses.features)}</p>
            ` : ''}

            ${selectedSections.social ? `
              <h2>Social-Analyse (TCG)</h2>
              <p>${mdToHtml(aiAnalyses.social)}</p>
            ` : ''}

            ${selectedSections.technical ? `
              <h2>Technische Infrastruktur</h2>
              <p>${mdToHtml(aiAnalyses.technical)}</p>
            ` : ''}

            ${selectedSections.manual ? `
              <h2>Betriebs-Anleitung</h2>
              <p>${mdToHtml(aiAnalyses.manual)}</p>
            ` : ''}
            
            ${selectedSections.roadmap ? `
              <h2>Roadmap</h2>
              <p>${mdToHtml(aiAnalyses.roadmap)}</p>
            ` : ''}
            
            ${selectedSections.script ? `
              <h2>Zusammenfassung</h2>
              <p>${mdToHtml(aiAnalyses.script)}</p>
            ` : ''}
            <div class="footer">Letzte Seite</div>
          </div>

          <script>
            const opts = { responsive: true, maintainAspectRatio: false, animation: false };
            ${selectedSections.users ? `new Chart(document.getElementById('usersChart'), { type: 'bar', data: { labels: ['Verifiziert', 'Offen'], datasets: [{ data: [${data.approvedUsers}, ${data.totalUsers - data.approvedUsers}], backgroundColor: ['#000', '#999'] }] }, options: opts });` : ''}
            ${selectedSections.finances ? `new Chart(document.getElementById('financesChart'), { type: 'doughnut', data: { labels: ['Einnahmen', 'Ausgaben'], datasets: [{ data: [${data.totalIncome}, ${data.totalExpense}], backgroundColor: ['#333', '#999'] }] }, options: opts });` : ''}
            setTimeout(() => { window.print(); }, 1000);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Projekt-Report Generator</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Erstellung sachlicher Berichte ohne dekorative Elemente. Nur Text, Zahlen und Diagramme.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-none border shadow-none">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Bericht-Konfiguration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(selectedSections) as ReportSection[]).map((section) => (
                  <div key={section} className="flex items-center justify-between p-3 border">
                    <Label htmlFor={`section-${section}`} className="text-sm">
                      {section === 'pitch' ? 'Projekt-Ziele' : 
                       section === 'manual' ? 'Betriebs-Anleitung' : 
                       section === 'intro' ? 'Einleitung' : 
                       section === 'features' ? 'Funktionsübersicht' : 
                       section === 'users' ? 'Nutzer-Daten' : 
                       section === 'finances' ? 'Finanz-Daten' : 
                       section === 'shop' ? 'Shop-Daten' : 
                       section === 'social' ? 'Social-Daten' : 
                       section === 'technical' ? 'Technik-Daten' : 
                       section === 'roadmap' ? 'Roadmap' : 
                       section === 'script' ? 'Zusammenfassung' : section}
                    </Label>
                    <Switch 
                      id={`section-${section}`} 
                      checked={selectedSections[section]} 
                      onCheckedChange={() => toggleSection(section)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-none border shadow-none sticky top-8 bg-zinc-50">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isGenerating ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{currentStep}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1 rounded-none" />
                </div>
              ) : (
                <Button 
                  onClick={fetchStatsAndPrint} 
                  className="w-full h-12 bg-black hover:bg-zinc-800 text-white rounded-none font-bold"
                >
                  Report generieren
                </Button>
              )}
              
              <div className="p-3 border text-[10px] bg-white leading-tight">
                <strong>Standard-Modus:</strong> Sachlich, ohne Emojis, ohne dekorative Formatierung. 
                Optimiert für interne Dokumentation und klare Datenübersicht.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
