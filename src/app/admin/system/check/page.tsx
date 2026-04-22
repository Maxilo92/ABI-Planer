'use client'

import { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Search, 
  RefreshCw,
  ExternalLink,
  AlertOctagon
} from 'lucide-react'
import { SystemCheck, SystemCheckStatus } from '@/types/database'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'

const STATUS_CONFIG: Record<SystemCheckStatus, { label: string, color: string, icon: React.ReactNode }> = {
  perfect: { 
    label: 'Funktioniert einwandfrei', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  minor_bugs: { 
    label: 'Minimale Bugs (UI etc.)', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <HelpCircle className="w-4 h-4" />
  },
  major_bugs: { 
    label: 'Große Bugs (Buttons defekt)', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <AlertTriangle className="w-4 h-4" />
  },
  catastrophic: { 
    label: 'Katastrophaler Zustand', 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: <AlertOctagon className="w-4 h-4" />
  },
  down: { 
    label: 'Seite geht gar nicht', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="w-4 h-4" />
  },
  untested: { 
    label: 'Ungetestet', 
    color: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: <RefreshCw className="w-4 h-4" />
  }
}

// Initial list of routes generated from src/app
const KNOWN_ROUTES = [
  { id: '/', name: 'Landing Page' },
  { id: '/home', name: 'Dashboard Home' },
  { id: '/login', name: 'Login' },
  { id: '/register', name: 'Registrierung' },
  { id: '/profil', name: 'Eigenes Profil' },
  { id: '/profil/freunde', name: 'Freunde & Kontakte' },
  { id: '/einstellungen', name: 'Einstellungen' },
  { id: '/einstellungen/referrals', name: 'Einladungs-System' },
  { id: '/finanzen', name: 'Finanz-Übersicht' },
  { id: '/finanzen/spenden', name: 'Spenden-Zentrum' },
  { id: '/kalender', name: 'Kalender / Events' },
  { id: '/aufgaben', name: 'Aufgaben-Modul' },
  { id: '/news', name: 'News-Feed' },
  { id: '/sammelkarten', name: 'Sammelkarten Hub' },
  { id: '/album', name: 'Karten-Album' },
  { id: '/shop', name: 'NP Shop' },
  { id: '/booster', name: 'Booster-Öffnen' },
  { id: '/battle-pass', name: 'Battle Pass' },
  { id: '/sammelkarten/kaempfe', name: 'Karten-Kämpfe' },
  { id: '/sammelkarten/tausch', name: 'Karten-Tausch' },
  { id: '/gruppen', name: 'Planungs-Gruppen' },
  { id: '/todos', name: 'Persönliche Todos' },
  { id: '/feedback', name: 'Feedback-Formular' },
  { id: '/support', name: 'Support / FAQ' },
  { id: '/agb', name: 'AGB' },
  { id: '/datenschutz', name: 'Datenschutz' },
  { id: '/impressum', name: 'Impressum' },
  { id: '/admin', name: 'Admin Dashboard' },
  { id: '/admin/system', name: 'System Übersicht' },
  { id: '/admin/system/control', name: 'System Steuerung' },
  { id: '/admin/system/analytics', name: 'Analytics' },
  { id: '/admin/logs', name: 'Action Logs' },
  { id: '/admin/feedback', name: 'Feedback Moderation' },
  { id: '/admin/aufgaben', name: 'Aufgaben Verwaltung' },
  { id: '/admin/sammelkarten', name: 'TCG Manager' },
  { id: '/admin/send', name: 'Push-Benachrichtigungen' },
  { id: '/maintenance', name: 'Wartungs-Seite' }
]

export default function FunctionalChecklistPage() {
  const { profile } = useAuth()
  const [checks, setChecks] = useState<SystemCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'system_checks'), orderBy('id', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SystemCheck))
      setChecks(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const filteredChecks = useMemo(() => {
    return checks.filter(check => 
      check.id.toLowerCase().includes(search.toLowerCase()) || 
      check.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [checks, search])

  const handleUpdateStatus = async (path: string, status: SystemCheckStatus) => {
    if (!profile) return
    setUpdatingId(path)
    try {
      const checkRef = doc(db, 'system_checks', path.replace(/\//g, '_'))
      await updateDoc(checkRef, {
        status,
        last_checked: serverTimestamp(),
        checked_by: profile.id,
        checked_by_name: profile.full_name || profile.email
      })
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdateNotes = async (path: string, notes: string) => {
    try {
      const checkRef = doc(db, 'system_checks', path.replace(/\//g, '_'))
      await updateDoc(checkRef, { notes })
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const syncRoutes = async () => {
    if (!profile) return
    setLoading(true)
    try {
      for (const route of KNOWN_ROUTES) {
        const docId = route.id.replace(/\//g, '_')
        const checkRef = doc(db, 'system_checks', docId)
        
        // Only set if not exists to avoid overwriting existing status
        const existing = checks.find(c => c.id === docId)
        if (!existing) {
          await setDoc(checkRef, {
            id: docId,
            path: route.id,
            name: route.name,
            status: 'untested',
            last_checked: null,
            checked_by: null,
            checked_by_name: null,
            notes: ''
          })
        }
      }
    } catch (error) {
      console.error('Error syncing routes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Seite suchen..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={syncRoutes} variant="outline" className="font-black uppercase tracking-widest text-[10px] gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Routen synchronisieren
        </Button>
      </div>

      <Card className="border-2 shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="uppercase tracking-tighter font-black text-xl flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            Funktions-Checkliste
          </CardTitle>
          <CardDescription>
            Übersicht aller System-Module und deren aktueller Betriebszustand.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 hover:bg-muted/10">
                  <TableHead className="w-[250px] uppercase font-black tracking-widest text-[10px]">Seite / Modul</TableHead>
                  <TableHead className="w-[250px] uppercase font-black tracking-widest text-[10px]">Status</TableHead>
                  <TableHead className="w-[200px] uppercase font-black tracking-widest text-[10px]">Zuletzt geprüft</TableHead>
                  <TableHead className="min-w-[200px] uppercase font-black tracking-widest text-[10px]">Anmerkungen</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground animate-pulse">
                      Lade Checkliste...
                    </TableCell>
                  </TableRow>
                ) : filteredChecks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Keine Einträge gefunden. Nutze &quot;Routen synchronisieren&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChecks.map((check) => (
                    <TableRow key={check.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm leading-tight">{check.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{check.path || '/'+check.id.replace(/_/g, '/')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={check.status} 
                          onValueChange={(val) => handleUpdateStatus(check.id, val as SystemCheckStatus)}
                          disabled={updatingId === check.id}
                        >
                          <SelectTrigger className={cn(
                            "w-full h-9 text-xs font-bold uppercase tracking-tight",
                            STATUS_CONFIG[check.status].color
                          )}>
                            <div className="flex items-center gap-2">
                              {STATUS_CONFIG[check.status].icon}
                              <SelectValue placeholder="Status wählen" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key} className="text-xs uppercase font-bold tracking-tight py-2">
                                <div className="flex items-center gap-2">
                                  {config.icon}
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium">
                            {check.last_checked ? format((check.last_checked as Timestamp).toDate(), 'dd.MM.yyyy HH:mm', { locale: de }) : 'Nie'}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                            {check.checked_by_name || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input 
                            defaultValue={check.notes || ''} 
                            placeholder="Bugs, Details..."
                            className="h-8 text-xs"
                            onBlur={(e) => handleUpdateNotes(check.id, e.target.value)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={check.path || '/'+check.id.replace(/_/g, '/')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-primary/10 rounded-full transition-colors inline-block"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-700 text-sm uppercase font-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Stabil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-800">
              {checks.filter(c => c.status === 'perfect').length}
            </div>
            <p className="text-[10px] text-emerald-600 uppercase font-bold">Module ohne bekannte Bugs</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 text-sm uppercase font-black flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Baustellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-800">
              {checks.filter(c => c.status === 'minor_bugs' || c.status === 'major_bugs').length}
            </div>
            <p className="text-[10px] text-amber-600 uppercase font-bold">Module mit Fehlern</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 text-sm uppercase font-black flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              Kritisch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-800">
              {checks.filter(c => c.status === 'catastrophic' || c.status === 'down').length}
            </div>
            <p className="text-[10px] text-red-600 uppercase font-bold">Module mit Totalausfall</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
