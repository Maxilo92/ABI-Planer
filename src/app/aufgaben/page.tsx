'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, limit, startAfter, getDocs, where, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { 
  Search,
  ClipboardList,
  LayoutGrid,
  List,
  Filter,
  Plus,
  Loader2,
  ShieldCheck,
  Check,
  X,
  Download,
  User as UserIcon,
  FileVideo,
  ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { Task, Settings } from '@/types/database'
import { MarketplaceCard } from '@/components/aufgaben/MarketplaceCard'
import { TaskValidationTab } from '@/components/aufgaben/TaskValidationTab'
import { onSnapshot as onSnapshotDoc } from 'firebase/firestore'
import { calculateTicketPenalty } from '@/lib/finance-utils'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { getCategoryIcon } from '@/lib/category-icons'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { logAction } from '@/lib/logging'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

const PAGE_SIZE = 12

export default function AufgabenPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [inReviewCount, setInReviewCount] = useState(0)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('marketplace')

  // Validation Action State
  const [reviewingTask, setReviewingTask] = useState<Task | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const isAdmin = profile?.role && ['admin', 'admin_main', 'admin_co'].includes(profile.role)

  useEffect(() => {
    const savedMode = localStorage.getItem('aufgaben-view-mode') as 'grid' | 'list'
    if (savedMode) setViewMode(savedMode)
  }, [])

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('aufgaben-view-mode', mode)
  }

  // Fetch in-review count (needs a separate listener for badge)
  useEffect(() => {
    if (!isAdmin) return
    const q = query(collection(db, 'tasks'), where('status', '==', 'in_review'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInReviewCount(snapshot.size)
    })
    return () => unsubscribe()
  }, [isAdmin])

  const fetchTasks = useCallback(async (isInitial = false, currentLastVisible = lastVisible) => {
    if (!profile) return
    if (!isInitial && (!hasMore || loadingMore)) return

    if (isInitial) {
      setLoading(true)
      setTasks([])
      setLastVisible(null)
    } else {
      setLoadingMore(true)
    }

    try {
      let q = query(collection(db, 'tasks'), orderBy('created_at', 'desc'))

      // Filter by tab status
      if (activeTab === 'marketplace') {
        q = query(q, where('status', '==', 'open'))
      } else if (activeTab === 'my-tasks') {
        q = query(q, where('assignee_id', '==', profile.id))
      } else if (activeTab === 'validation') {
        // Validation uses its own sort order usually, but let's keep it desc for consistency here
        q = query(collection(db, 'tasks'), where('status', '==', 'in_review'), orderBy('submitted_at', 'asc'))
      }

      // Filter by category
      if (categoryFilter !== 'all' && activeTab !== 'validation') {
        q = query(q, where('category_id', '==', categoryFilter))
      }

      // Pagination
      if (!isInitial && currentLastVisible) {
        q = query(q, startAfter(currentLastVisible))
      }
      
      q = query(q, limit(PAGE_SIZE))

      const snapshot = await getDocs(q)
      const newTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task))
      
      setTasks(prev => isInitial ? newTasks : [...prev, ...newTasks])
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Fehler beim Laden der Aufgaben.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [profile, activeTab, categoryFilter, hasMore, loadingMore, lastVisible])

  // Initial load and filter change
  useEffect(() => {
    if (authLoading) return
    if (!profile) {
      setLoading(false)
      return
    }

    fetchTasks(true)
  }, [authLoading, profile, categoryFilter, activeTab])

  // Infinite Scroll Observer
  useEffect(() => {
    if (loading || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          fetchTasks(false)
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel)
      }
    }
  }, [loading, loadingMore, hasMore, fetchTasks])

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshotDoc(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings({ id: 1, ...doc.data() } as Settings)
      }
    }, (error) => {
      console.error('Error listening to settings:', error)
    })

    return () => unsubscribeSettings()
  }, [])

  const handleValidationAction = async (taskId: string, action: 'approve' | 'reject') => {
    const task = tasks.find(t => t.id === taskId) || reviewingTask
    if (!task) return

    setActionLoading(true)
    try {
      const adminReviewTask = httpsCallable(functions, 'adminReviewTask')
      await adminReviewTask({ 
        taskId, 
        action, 
        rejectedReason: action === 'reject' ? rejectReason : undefined 
      })
      
      if (profile) {
        await logAction(
          action === 'approve' ? 'TASK_APPROVED' : 'TASK_REJECTED',
          profile.id,
          profile.full_name,
          {
            task_id: taskId,
            task_title: task.title,
            target_user_id: task.assignee_id,
            target_user_name: task.assignee_name,
            reason: action === 'reject' ? rejectReason : null
          }
        )
      }

      toast.success(action === 'approve' ? 'Aufgabe genehmigt!' : 'Aufgabe abgelehnt.')
      setReviewingTask(null)
      setRejectReason('')
      // Remove from local list
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (error) {
      console.error(`Error ${action}ing task:`, error)
      toast.error('Fehler beim Ausführen der Aktion.')
    } finally {
      setActionLoading(false)
    }
  }

  if (authLoading || (loading && tasks.length === 0)) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-12" />
          <Skeleton className="h-12 w-12" />
        </div>
        <div className="flex gap-8">
          <div className="hidden md:block w-64 space-y-4">
            <Skeleton className="h-8 w-32" />
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12 px-4 max-w-[1200px] mx-auto">
        <ProtectedSystemGate 
          title="Bitte anmelden" 
          description="Melde dich an, um Angebote zu durchstöbern."
          icon={<ClipboardList className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co') && profile?.is_approved
  const favoriteTasks = (profile as any).favorite_tasks || []

  // Client-side search (limited to loaded tasks)
  const filteredTasks = tasks.filter(t => {
    if (!searchQuery) return true
    return t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           t.description.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    if (activeTab === 'validation') return 0; // Maintain Firestore order for validation
    const aIsFav = favoriteTasks.includes(a.id);
    const bIsFav = favoriteTasks.includes(b.id);
    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;
    return 0;
  });

  const categories = settings?.task_categories || []
  const { totalTaskReduction, manualCredit, penaltyBase } = calculateTicketPenalty(profile || null, settings || null)
  const savings = totalTaskReduction + manualCredit

  const toggleFavorite = async (taskId: string) => {
    if (!profile) return
    const isFav = favoriteTasks.includes(taskId)
    try {
      await updateDoc(doc(db, 'profiles', profile.id), {
        favorite_tasks: isFav ? arrayRemove(taskId) : arrayUnion(taskId)
      })
      toast.success(isFav ? 'Von Merkliste entfernt' : 'Auf Merkliste gesetzt')
    } catch (e) {
      console.error('Error toggling favorite:', e)
      toast.error('Fehler beim Merken')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1400px] mx-auto flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/aufgaben" className="font-black text-xl tracking-tight shrink-0 hidden lg:block">
            Market<span className="text-primary">place</span>
          </Link>

          <div className="flex-1 flex items-center max-w-2xl mx-auto w-full">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Wonach suchst du?" 
                className="w-full h-10 pl-10 pr-4 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <Tabs value={viewMode} onValueChange={(val) => toggleViewMode(val as 'grid' | 'list')}>
                <TabsList className="bg-muted/50 border-none h-9 p-1 gap-1">
                  <TabsTrigger 
                    value="grid" 
                    className="h-7 w-8 p-0 data-active:bg-background data-active:shadow-sm"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="list" 
                    className="h-7 w-8 p-0 data-active:bg-background data-active:shadow-sm"
                  >
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-left">Filter & Kategorien</SheetTitle>
                </SheetHeader>
                <FilterSidebar 
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  categories={categories}
                  savings={savings}
                  target={penaltyBase}
                  isPlanner={isPlanner}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-8 px-4 sm:px-6 py-8">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:block w-64 shrink-0 sticky top-24 h-fit">
          <FilterSidebar 
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            categories={categories}
            savings={savings}
            target={penaltyBase}
            isPlanner={isPlanner}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4 border-b overflow-x-auto scrollbar-hide">
              <TabsList variant="line" className="gap-0 min-w-max">
                <TabsTrigger 
                  value="marketplace" 
                  className="px-4 py-3 text-sm font-bold data-active:text-primary transition-none border-none shadow-none after:bottom-0 after:bg-primary"
                >
                  Angebote
                </TabsTrigger>
                <TabsTrigger 
                  value="my-tasks" 
                  className="px-4 py-3 text-sm font-bold data-active:text-primary transition-none border-none shadow-none after:bottom-0 after:bg-primary"
                >
                  Beobachtet
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger 
                    value="validation" 
                    className="px-4 py-3 text-sm font-bold data-active:text-primary transition-none border-none shadow-none after:bottom-0 after:bg-primary"
                  >
                    Validierung ({inReviewCount})
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0 focus-visible:outline-none space-y-8">
              {filteredTasks.length === 0 && !loading ? (
                <div className="py-20 text-center bg-muted/30 rounded-2xl border-2 border-dashed">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-bold text-foreground mb-1">Keine Treffer gefunden</h3>
                  <p className="text-muted-foreground text-sm">Versuche es mit anderen Filtern oder Suchbegriffen.</p>
                </div>
              ) : (
                <>
                  {activeTab === 'validation' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence>
                        {filteredTasks.map((task) => (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                          >
                            <Card className="flex flex-col h-full overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all rounded-2xl">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="space-y-1">
                                    <CardTitle className="text-base font-black leading-tight">{task.title}</CardTitle>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                      <UserIcon className="h-3 w-3" />
                                      <span>{task.assignee_name}</span>
                                    </div>
                                  </div>
                                  <Badge className="bg-yellow-500/10 text-yellow-600 border-none text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                                    In Prüfung
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 flex-1 space-y-4">
                                <div className="bg-muted/50 rounded-xl p-3 text-xs italic text-muted-foreground leading-relaxed border border-border/30">
                                  "{task.description.slice(0, 120)}{task.description.length > 120 ? '...' : ''}"
                                </div>
                                
                                {task.proof_text && (
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Beweis-Text</span>
                                    <div className="bg-brand/5 border border-brand/10 rounded-xl p-3 text-xs whitespace-pre-wrap font-medium">
                                      {task.proof_text}
                                    </div>
                                  </div>
                                )}

                                {task.proof_media_url && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                                      <span>Dateianhang</span>
                                      <span className="flex items-center gap-1">
                                        {task.proof_media_type === 'video' ? <FileVideo className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
                                        {task.proof_media_type === 'video' ? 'Video' : 'Bild'}
                                      </span>
                                    </div>
                                    
                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border/50 group">
                                      {task.proof_media_type === 'video' ? (
                                        <video 
                                          src={task.proof_media_url || undefined} 
                                          className="w-full h-full object-cover"
                                          controls
                                        />
                                      ) : (
                                        <Image 
                                          src={task.proof_media_url || ''} 
                                          alt="Beweis" 
                                          fill 
                                          className="object-cover" 
                                        />
                                      )}
                                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a 
                                          href={task.proof_media_url || ''} 
                                          download 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                        >
                                          <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-md">
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                              <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
                                <Button 
                                  variant="outline" 
                                  className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 rounded-xl font-bold h-9 text-xs"
                                  onClick={() => {
                                    setReviewingTask(task)
                                    setRejectReason('')
                                  }}
                                >
                                  <X className="h-3.5 w-3.5 mr-1.5" /> Ablehnen
                                </Button>
                                <Button 
                                  className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-bold h-9 text-xs shadow-lg shadow-green-600/20"
                                  onClick={() => handleValidationAction(task.id, 'approve')}
                                >
                                  <Check className="h-3.5 w-3.5 mr-1.5" /> Freigeben
                                </Button>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className={cn(
                      "grid gap-4 sm:gap-6",
                      viewMode === 'grid' 
                        ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                        : "grid-cols-1"
                    )}>
                      {filteredTasks.map(task => (
                        <MarketplaceCard 
                          key={task.id}
                          task={task} 
                          variant={viewMode}
                          categoryName={categories.find(c => c.id === task.category_id)?.name}
                          isFavorite={favoriteTasks.includes(task.id)}
                          onToggleFavorite={() => toggleFavorite(task.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Infinite Scroll Indicator & Sentinel */}
                  <div className="flex flex-col items-center gap-4 py-10">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">Lade mehr...</span>
                      </div>
                    )}
                    
                    {!hasMore && tasks.length > 0 && (
                      <p className="text-sm text-muted-foreground font-medium">
                        Ende der Liste erreicht.
                      </p>
                    )}

                    <div ref={sentinelRef} className="h-10 w-full" aria-hidden="true" />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!reviewingTask} onOpenChange={(open) => !open && setReviewingTask(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Aufgabe ablehnen</DialogTitle>
            <DialogDescription className="text-xs">
              Gib einen Grund an, warum der Beweis nicht ausreicht. Der Nutzer hat dann Zeit zur Nachbesserung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-[10px] font-black uppercase tracking-widest ml-1">Begründung</Label>
              <Textarea 
                id="reason" 
                placeholder="z.B. Das Foto ist zu unscharf, man erkennt nichts." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-2xl bg-muted/50 border-none focus-visible:ring-brand/20 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setReviewingTask(null)}>Abbrechen</Button>
            <Button 
              variant="destructive" 
              className="rounded-xl font-bold bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
              disabled={!rejectReason.trim() || actionLoading}
              onClick={() => reviewingTask && handleValidationAction(reviewingTask.id, 'reject')}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Jetzt ablehnen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface FilterSidebarProps {
  categoryFilter: string
  setCategoryFilter: (cat: string) => void
  categories: any[]
  savings: number
  target: number
  isPlanner: boolean
}

function FilterSidebar({ 
  categoryFilter, 
  setCategoryFilter, 
  categories, 
  savings, 
  target,
  isPlanner 
}: FilterSidebarProps) {
  const progress = Math.min(100, Math.round((savings / target) * 100))

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Kategorien</h3>
        <div className="space-y-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              categoryFilter === 'all' 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Search className="h-4 w-4" />
            Alle ansehen
          </button>
          {categories.map((cat) => {
            const IconComp = getCategoryIcon(cat.icon)
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  categoryFilter === cat.id 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <IconComp className="h-4 w-4" />
                <span className="truncate">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-6 border-t">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Dein Status</h3>
        <div className="bg-muted/50 rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-end text-sm">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Aktuell</span>
                <span className="font-black text-lg text-foreground leading-none">{savings}€</span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Ziel</span>
                <span className="font-bold text-muted-foreground leading-none">{target}€</span>
              </div>
            </div>
            
            {/* Simple CSS Progress Bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/20">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <p className="text-[10px] text-muted-foreground font-medium">
              {progress}% des Ziels erreicht
            </p>
          </div>

          <Link href="/finanzen" className="block">
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              Details ansehen
            </Button>
          </Link>
        </div>
      </div>

      {isPlanner && (
        <div className="pt-6">
          <Link href="/aufgaben/neu">
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Inserieren
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
