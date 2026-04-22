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
  AlertOctagon,
  Globe,
  Shield,
  Gamepad2,
  Code2
} from 'lucide-react'
import { SystemCheck, SystemCheckStatus } from '@/types/database'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
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

const DOMAIN_CONFIG: Record<string, { label: string, icon: React.ReactNode, color: string }> = {
  main: { label: 'Hauptseite', icon: <Globe className="w-3 h-3" />, color: 'bg-slate-100 text-slate-700' },
  tcg: { label: 'Sammelkarten', icon: <Gamepad2 className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', icon: <Shield className="w-3 h-3" />, color: 'bg-red-100 text-red-700' },
  api: { label: 'API', icon: <Code2 className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
}

const KNOWN_ROUTES = [
  // MAIN
  { id: '/', name: 'Landing Page', domain: 'main' },
  { id: '/home', name: 'Dashboard Home', domain: 'main' },
  { id: '/login', name: 'Login', domain: 'main' },
  { id: '/register', name: 'Registrierung', domain: 'main' },
  { id: '/profil', name: 'Eigenes Profil', domain: 'main' },
  { id: '/profil/freunde', name: 'Freunde & Kontakte', domain: 'main' },
  { id: '/einstellungen', name: 'Einstellungen', domain: 'main' },
  { id: '/einstellungen/referrals', name: 'Referral-System', domain: 'main' },
  { id: '/finanzen', name: 'Finanz-Übersicht', domain: 'main' },
  { id: '/finanzen/spenden', name: 'Spenden Hub', domain: 'main' },
  { id: '/finanzen/spenden/abi', name: 'Spenden (Abi)', domain: 'main' },
  { id: '/finanzen/spenden/entwickler', name: 'Spenden (Dev)', domain: 'main' },
  { id: '/kalender', name: 'Event-Kalender', domain: 'main' },
  { id: '/aufgaben', name: 'Aufgaben-Modul', domain: 'main' },
  { id: '/aufgaben/neu', name: 'Aufgabe erstellen', domain: 'main' },
  { id: '/aufgaben/leaderboard', name: 'Task Leaderboard', domain: 'main' },
  { id: '/news', name: 'News-Feed', domain: 'main' },
  { id: '/gruppen', name: 'Planungs-Gruppen', domain: 'main' },
  { id: '/todos', name: 'To-Dos', domain: 'main' },
  { id: '/abstimmungen', name: 'Abstimmungen', domain: 'main' },
  { id: '/feedback', name: 'Feedback', domain: 'main' },
  { id: '/support', name: 'Support / FAQ', domain: 'main' },
  { id: '/uber', name: 'Über uns', domain: 'main' },
  { id: '/uber/join', name: 'Karriere / Jobs', domain: 'main' },
  { id: '/vorteile', name: 'Vorteile & Features', domain: 'main' },
  { id: '/zugang', name: 'Zugangs-Verwaltung', domain: 'main' },
  { id: '/unauthorized', name: '403 Seite', domain: 'main' },
  { id: '/agb', name: 'AGB', domain: 'main' },
  { id: '/datenschutz', name: 'Datenschutz', domain: 'main' },
  { id: '/impressum', name: 'Impressum', domain: 'main' },
  { id: '/maintenance', name: 'Wartung', domain: 'main' },

  // TCG
  { id: '/sammelkarten', name: 'TCG Hub', domain: 'tcg' },
  { id: '/album', name: 'Karten-Album', domain: 'tcg' },
  { id: '/shop', name: 'TCG Shop', domain: 'tcg' },
  { id: '/shop/abo', name: 'Abo-Verwaltung', domain: 'tcg' },
  { id: '/booster', name: 'Booster-Store', domain: 'tcg' },
  { id: '/battle-pass', name: 'Battle Pass', domain: 'tcg' },
  { id: '/sammelkarten/kaempfe', name: 'Combat Arena', domain: 'tcg' },
  { id: '/sammelkarten/kaempfe/log', name: 'Combat Logs', domain: 'tcg' },
  { id: '/sammelkarten/tausch', name: 'Trading System', domain: 'tcg' },
  { id: '/sammelkarten/tausch/neu', name: 'Trade erstellen', domain: 'tcg' },
  { id: '/sammelkarten/info', name: 'Karten-Info', domain: 'tcg' },
  { id: '/sammelkarten/packs', name: 'Meine Packs', domain: 'tcg' },
  { id: '/sammelkarten/shop', name: 'Karten Shop', domain: 'tcg' },
  { id: '/agb/sammelkarten', name: 'TCG Regeln', domain: 'tcg' },

  // ADMIN
  { id: '/admin', name: 'Admin Dashboard', domain: 'admin' },
  { id: '/admin/system', name: 'System Info', domain: 'admin' },
  { id: '/admin/system/control', name: 'System Control', domain: 'admin' },
  { id: '/admin/system/analytics', name: 'Analytics', domain: 'admin' },
  { id: '/admin/logs', name: 'Audit Logs', domain: 'admin' },
  { id: '/admin/feedback', name: 'Feedback Mod', domain: 'admin' },
  { id: '/admin/aufgaben', name: 'Task Manager', domain: 'admin' },
  { id: '/admin/sammelkarten', name: 'TCG Admin', domain: 'admin' },
  { id: '/admin/sammelkarten/ideen-labor', name: 'Ideen-Labor', domain: 'admin' },
  { id: '/admin/sammelkarten/pool', name: 'Card Pool', domain: 'admin' },
  { id: '/admin/sammelkarten/trading', name: 'Trade Monitoring', domain: 'admin' },
  { id: '/admin/sammelkarten/einladungen', name: 'TCG Einladungen', domain: 'admin' },
  { id: '/admin/sammelkarten/drop-rates', name: 'Drop-Rates', domain: 'admin' },
  { id: '/admin/sammelkarten/parameter', name: 'TCG Parameter', domain: 'admin' },
  { id: '/admin/send', name: 'Push/Broadcast', domain: 'admin' },
  { id: '/admin/global-settings', name: 'Global Settings', domain: 'admin' },
  { id: '/admin/danger', name: 'Danger Zone', domain: 'admin' },
  { id: '/admin/shop-earnings', name: 'Finanz-Tracking', domain: 'admin' },
  { id: '/admin/changelog', name: 'System Changelog', domain: 'admin' },
  { id: '/admin/trades', name: 'Trade Overview', domain: 'admin' },
  { id: '/admin/migrate-referrals', name: 'Referral Migration', domain: 'admin' },
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
      check.name.toLowerCase().includes(search.toLowerCase()) ||
      check.domain?.toLowerCase().includes(search.toLowerCase())
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
        if (docId === '_') continue; // Skip root id as it can cause issues

        const checkRef = doc(db, 'system_checks', docId === '' ? 'root' : docId)
        
        const existing = checks.find(c => c.id === (docId === '' ? 'root' : docId))
        if (!existing) {
          await setDoc(checkRef, {
            id: docId === '' ? 'root' : docId,
            path: route.id,
            name: route.name,
            domain: route.domain,
            status: 'untested',
            last_checked: null,
            checked_by: null,
            checked_by_name: null,
            notes: ''
          })
        } else if (!existing.domain) {
            // Update domain if missing
            await updateDoc(checkRef, { domain: route.domain })
        }
      }
    } catch (error) {
      console.error('Error syncing routes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Seite, Bereich oder Pfad suchen..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 bg-white"
          />
        </div>
        <Button onClick={syncRoutes} variant="outline" className="h-11 font-black uppercase tracking-widest text-[10px] gap-2 px-6">
          <RefreshCw className="w-4 h-4" />
          Routes Sync
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-2 border-emerald-200 bg-emerald-50/50 p-4">
            <div className="text-2xl font-black text-emerald-800 leading-none">
              {checks.filter(c => c.status === 'perfect').length}
            </div>
            <p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mt-1">Stabil</p>
        </Card>
        <Card className="border-2 border-amber-200 bg-amber-50/50 p-4">
            <div className="text-2xl font-black text-amber-800 leading-none">
              {checks.filter(c => c.status === 'minor_bugs' || c.status === 'major_bugs').length}
            </div>
            <p className="text-[10px] text-amber-600 uppercase font-black tracking-widest mt-1">Bugs</p>
        </Card>
        <Card className="border-2 border-red-200 bg-red-50/50 p-4 col-span-2 md:col-span-1">
            <div className="text-2xl font-black text-red-800 leading-none">
              {checks.filter(c => c.status === 'catastrophic' || c.status === 'down').length}
            </div>
            <p className="text-[10px] text-red-600 uppercase font-black tracking-widest mt-1">Kritisch</p>
        </Card>
      </div>

      <Card className="border-2 shadow-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-4 sm:p-6">
          <CardTitle className="uppercase tracking-tighter font-black text-xl flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            System Funktions-Check
          </CardTitle>
          <CardDescription>
            Zentrale Übersicht aller Plattform-Komponenten.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="block md:hidden">
            {/* Mobile List View */}
            <div className="divide-y">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground animate-pulse font-black uppercase tracking-widest text-xs">Loading...</div>
                ) : filteredChecks.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground font-bold italic">Keine Treffer</div>
                ) : filteredChecks.map(check => (
                    <div key={check.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-black text-sm uppercase tracking-tight">{check.name}</div>
                                <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <Badge className={cn("px-1.5 py-0 text-[8px] h-4", (DOMAIN_CONFIG[check.domain || 'main']).color)}>
                                        {(DOMAIN_CONFIG[check.domain || 'main']).label}
                                    </Badge>
                                    {check.path || '/'+check.id.replace(/_/g, '/')}
                                </div>
                            </div>
                            <a href={check.path || '/'+check.id.replace(/_/g, '/')} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 text-primary" />
                            </a>
                        </div>
                        
                        <Select 
                          value={check.status} 
                          onValueChange={(val) => handleUpdateStatus(check.id, val as SystemCheckStatus)}
                          disabled={updatingId === check.id}
                        >
                          <SelectTrigger className={cn(
                            "w-full h-10 text-[9px] sm:text-xs font-black uppercase tracking-widest px-2 sm:px-3",
                            STATUS_CONFIG[check.status].color
                          )}>
                            <div className="flex items-center gap-2 truncate">
                              {STATUS_CONFIG[check.status].icon}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="min-w-[220px] sm:min-w-[280px] max-w-[90vw]">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key} className="text-[10px] sm:text-xs uppercase font-black tracking-widest py-3 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className={cn("p-1 rounded-md", config.color.split(' ')[0])}>
                                    {config.icon}
                                  </div>
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-muted/50 p-2 rounded border">
                                <div className="text-muted-foreground uppercase font-black mb-0.5">Prüfer</div>
                                <div className="font-bold truncate">{check.checked_by_name || 'N/A'}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded border">
                                <div className="text-muted-foreground uppercase font-black mb-0.5">Datum</div>
                                <div className="font-bold">{check.last_checked ? format((check.last_checked as Timestamp).toDate(), 'dd.MM HH:mm') : '-'}</div>
                            </div>
                        </div>

                        <Input 
                            defaultValue={check.notes || ''} 
                            placeholder="Notizen..."
                            className="h-10 text-xs bg-muted/20"
                            onBlur={(e) => handleUpdateNotes(check.id, e.target.value)}
                        />
                    </div>
                ))}
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="w-[30%] uppercase font-black tracking-widest text-[10px]">Bereich / Pfad</TableHead>
                  <TableHead className="w-[20%] uppercase font-black tracking-widest text-[10px]">Status</TableHead>
                  <TableHead className="w-[15%] uppercase font-black tracking-widest text-[10px]">Prüfung</TableHead>
                  <TableHead className="w-[30%] uppercase font-black tracking-widest text-[10px]">Anmerkungen</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center animate-pulse font-black uppercase tracking-widest">
                      Lade System-Daten...
                    </TableCell>
                  </TableRow>
                ) : filteredChecks.map((check) => (
                    <TableRow key={check.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg mt-0.5", (DOMAIN_CONFIG[check.domain || 'main']).color)}>
                                {(DOMAIN_CONFIG[check.domain || 'main']).icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-sm uppercase tracking-tight">{check.name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    {check.path || '/'+check.id.replace(/_/g, '/')}
                                </span>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={check.status} 
                          onValueChange={(val) => handleUpdateStatus(check.id, val as SystemCheckStatus)}
                          disabled={updatingId === check.id}
                        >
                          <SelectTrigger className={cn(
                            "w-full h-9 text-[10px] font-black uppercase tracking-widest px-2",
                            STATUS_CONFIG[check.status].color
                          )}>
                            <div className="flex items-center gap-2 truncate">
                              {STATUS_CONFIG[check.status].icon}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="min-w-[280px]">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key} className="text-[10px] uppercase font-black tracking-widest py-2.5 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className={cn("p-1 rounded-md", config.color.split(' ')[0])}>
                                    {config.icon}
                                  </div>
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[10px] font-black uppercase tracking-tighter">
                            {check.checked_by_name?.split(' ')[0] || '-'}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {check.last_checked ? format((check.last_checked as Timestamp).toDate(), 'dd.MM.yy HH:mm') : 'Nie'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                          <Input 
                            defaultValue={check.notes || ''} 
                            placeholder="Details..."
                            className="h-8 text-[11px] bg-transparent border-transparent group-hover:border-muted group-hover:bg-white transition-all"
                            onBlur={(e) => handleUpdateNotes(check.id, e.target.value)}
                          />
                      </TableCell>
                      <TableCell>
                        <a 
                          href={check.path || '/'+check.id.replace(/_/g, '/')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors inline-block"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={cn("px-2 py-0.5 rounded-full font-black tracking-widest inline-flex items-center justify-center", className)}>{children}</span>
}
