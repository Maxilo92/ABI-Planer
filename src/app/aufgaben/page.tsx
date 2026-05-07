'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { 
  Plus, 
  Trophy, 
  Zap,
  ClipboardList,
  AlertCircle,
  Ticket,
  Sparkles,
  ChevronRight,
  Search,
  Filter,
  X,
  Tags
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Task, Settings } from '@/types/database'
import { MarketplaceCard } from '@/components/aufgaben/MarketplaceCard'
import { onSnapshot as onSnapshotDoc } from 'firebase/firestore'
import { calculateTicketPenalty } from '@/lib/finance-utils'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AufgabenPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [complexityFilter, setComplexityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    if (authLoading) return
    if (!profile) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'tasks'), orderBy('created_at', 'desc'))
    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)))
    }, (error) => {
      console.error('Error listening to tasks:', error)
    })

    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshotDoc(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings({ id: 1, ...doc.data() } as Settings)
      }
      setLoading(false)
    }, (error) => {
      console.error('Error listening to settings:', error)
      setLoading(false)
    })

    return () => {
      unsubscribeTasks()
      unsubscribeSettings()
    }
  }, [authLoading, profile])

  if (authLoading || loading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <Skeleton key={i} className="aspect-square w-full rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12">
        <ProtectedSystemGate 
          title="Marktplatz gesperrt" 
          description="Du musst angemeldet sein, um Aufgaben im Marktplatz zu sehen oder anzunehmen."
          icon={<ClipboardList className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  const isPlanner = (profile?.role === 'planner' || profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co') && profile?.is_approved

  const favoriteTasks = (profile as any).favorite_tasks || []

  // Logic for sorting and filtering
  const processTasks = (taskList: Task[]) => {
    return taskList
      .filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesComplexity = complexityFilter === 'all' || t.complexity === parseInt(complexityFilter);
        const matchesCategory = categoryFilter === 'all' || t.category_id === categoryFilter;
        return matchesSearch && matchesComplexity && matchesCategory;
      })
      .sort((a, b) => {
        const aIsFav = favoriteTasks.includes(a.id);
        const bIsFav = favoriteTasks.includes(b.id);
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;
        return 0; // maintain date order
      });
  }

  const allOpenTasks = tasks.filter(t => t.status === 'open')
  const latestOffers = allOpenTasks.slice(0, 10)
  const openTasks = processTasks(allOpenTasks)
  const myTasks = processTasks(tasks.filter(t => t.assignee_id === profile.id && t.status !== 'completed'))

  const categories = settings?.task_categories || []

  const { currentPenalty, penaltyBase, isFullyReduced, completedTasks, totalTaskReduction, manualCredit } = calculateTicketPenalty(profile || null, settings || null)
  const reductionPercentage = Math.min(100, ((penaltyBase - currentPenalty) / penaltyBase) * 100)

  const toggleFavorite = async (taskId: string) => {
    if (!profile) return
    const isFav = favoriteTasks.includes(taskId)
    try {
      await updateDoc(doc(db, 'users', profile.id), {
        favorite_tasks: isFav ? arrayRemove(taskId) : arrayUnion(taskId)
      })
      toast.success(isFav ? 'Von Merkliste entfernt' : 'Auf Merkliste gesetzt')
    } catch (e) {
      console.error('Error toggling favorite:', e)
      toast.error('Fehler beim Merken')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as any }
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-[0.2em] text-[9px] sm:text-[10px]">
            <Sparkles className="h-3 w-3" />
            Active Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Angebote</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/aufgaben/leaderboard" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full gap-2 rounded-xl h-10 px-4 font-bold border-border hover:bg-accent transition-all text-[11px] sm:text-xs">
              <Trophy className="h-3.5 w-3.5 text-yellow-500" />
              Leaderboard
            </Button>
          </Link>
          {isPlanner && (
            <Link href="/aufgaben/neu" className="flex-1 sm:flex-none">
              <Button className="w-full gap-2 rounded-xl h-10 px-4 font-black shadow-lg shadow-brand/20 bg-brand hover:bg-brand/90 transition-all active:scale-95 text-[11px] sm:text-xs">
                <Plus className="h-3.5 w-3.5" />
                Inserieren
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Category Navigation (Highlights) */}
      {categories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entdecken</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-2 snap-x">
            {/* "Alle" Category Placeholder */}
            <button
              onClick={() => setCategoryFilter('all')}
              className={`group flex-shrink-0 flex flex-col items-center gap-2 snap-start transition-all ${
                categoryFilter === 'all' ? 'scale-105' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className={`h-14 w-14 sm:h-20 sm:w-20 rounded-full flex flex-col items-center justify-center transition-all shadow-sm border-2 ${
                categoryFilter === 'all' ? 'border-brand bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'
              }`}>
                <ClipboardList className={`h-5 w-5 sm:h-8 sm:w-8 ${categoryFilter === 'all' ? 'text-brand' : 'text-muted'}`} />
              </div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alle</p>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
                className={`group flex-shrink-0 flex flex-col items-center gap-2 snap-start transition-all ${
                  categoryFilter === cat.id ? 'scale-105' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`h-14 w-14 sm:h-20 sm:w-20 rounded-full relative overflow-hidden transition-all shadow-sm border-2 ${
                  categoryFilter === cat.id ? 'border-brand ring-4 ring-brand/10' : 'border-border'
                }`}>
                  {cat.image_url ? (
                    <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <Tags className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${
                  categoryFilter === cat.id ? 'text-brand' : 'text-muted-foreground'
                }`}>{cat.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Ticket Progress & Search Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch px-2">
        {/* Compact Ticket Progress */}
        <div className="lg:col-span-4 bg-card text-card-foreground rounded-2xl p-4 flex flex-col justify-center border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Ticket className="h-3.5 w-3.5 text-brand" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Ticket-Bonus</span>
            </div>
            <Link href="/finanzen" className="text-[9px] font-bold text-brand hover:underline flex items-center gap-0.5">
              Finanzen <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-lg sm:text-xl font-black">{totalTaskReduction + manualCredit}€</span>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">Gespart</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${reductionPercentage}%` }}
              className="h-full bg-brand"
            />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="lg:col-span-8 bg-card p-2 sm:p-3 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Was suchst du?" 
              className="pl-9 h-10 sm:h-11 border-none bg-muted/50 rounded-xl focus-visible:ring-brand/20 text-xs sm:text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={complexityFilter} onValueChange={(value) => setComplexityFilter(value ?? 'all')}>
              <SelectTrigger className="w-full sm:w-[130px] h-10 sm:h-11 border-none bg-muted/50 rounded-xl focus:ring-brand/20 text-[11px] sm:text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Lvl" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-xl">
                <SelectItem value="all">Alle Level</SelectItem>
                {[1,2,3,4,5,6,7,8,9,10].map(lv => (
                  <SelectItem key={lv} value={lv.toString()}>Level {lv}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 4. Featured: Aktuelle Angebote */}
      {latestOffers.length > 0 && categoryFilter === 'all' && !searchQuery && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">Neu eingetroffen</h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Die neuesten Inserate</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2 snap-x items-stretch">
            {latestOffers.map((task) => (
              <div key={task.id} className="w-[280px] sm:w-[320px] shrink-0 snap-start flex flex-col">
                <MarketplaceCard 
                  task={task} 
                  categoryName={categories.find(c => c.id === task.category_id)?.name}
                  isFavorite={favoriteTasks.includes(task.id)}
                  onToggleFavorite={() => toggleFavorite(task.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Main Content Section */}
      <Tabs defaultValue="marketplace" className="w-full px-2">
        <div className="flex justify-center mb-8">
          <TabsList className="w-fit bg-muted/50 p-1 h-11 rounded-xl shadow-sm border border-border/50">
            <TabsTrigger value="marketplace" className="rounded-lg px-6 font-bold text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-brand data-[state=active]:shadow-sm transition-all gap-2 text-xs">
              Marktplatz ({openTasks.length})
            </TabsTrigger>
            <TabsTrigger value="my-tasks" className="rounded-lg px-6 font-bold text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-brand data-[state=active]:shadow-sm transition-all gap-2 text-xs">
              Meine Aufgaben ({myTasks.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="marketplace" className="mt-0 focus-visible:outline-none">
          <AnimatePresence mode="wait">
            {openTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/20"
              >
                <div className="bg-card p-5 rounded-full mb-4 shadow-sm">
                  <Zap className="h-8 w-8 text-muted" />
                </div>
                <h3 className="text-lg font-black text-foreground">Nichts gefunden</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-1 text-xs">
                  Passe deine Suche oder Filter an, um mehr Angebote zu sehen.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6 lg:gap-8 items-stretch"
              >
                {openTasks.map(task => (
                  <motion.div key={task.id} variants={itemVariants} className="h-full flex flex-col">
                    <MarketplaceCard 
                      task={task} 
                      categoryName={categories.find(c => c.id === task.category_id)?.name}
                      isFavorite={favoriteTasks.includes(task.id)}
                      onToggleFavorite={() => toggleFavorite(task.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="my-tasks" className="mt-0 focus-visible:outline-none">
          <AnimatePresence mode="wait">
            {myTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-[2rem] bg-muted/20"
              >
                <div className="bg-card p-5 rounded-full mb-4 shadow-sm">
                  <AlertCircle className="h-10 w-10 text-muted" />
                </div>
                <h3 className="text-xl font-black text-foreground">Keine aktiven Aufgaben</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-1 text-sm">
                  Suche dir im Marktplatz eine Aufgabe aus, die dir gefällt.
                </p>
                <Button 
                  className="mt-6 rounded-xl h-10 px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                  onClick={() => {
                    const trigger = document.querySelector('[value="marketplace"]') as HTMLElement
                    trigger?.click()
                  }}
                >
                  Marktplatz durchstöbern
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8 items-stretch"
              >
                {myTasks.map(task => (
                  <motion.div key={task.id} variants={itemVariants} className="h-full flex flex-col">
                    <MarketplaceCard 
                      task={task} 
                      categoryName={categories.find(c => c.id === task.category_id)?.name}
                      isFavorite={favoriteTasks.includes(task.id)}
                      onToggleFavorite={() => toggleFavorite(task.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  )
}

