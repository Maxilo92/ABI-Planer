'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Swords, Trophy, Sparkles, X, Loader2, CheckCircle2, Bot, Zap, Users, Key, ChevronRight, UserPlus, Shield, Star, ArrowLeft, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import Link from 'next/link'
import { useDecks } from '@/hooks/useDecks'
import { useAuth } from '@/context/AuthContext'
import { useFriendSystem } from '@/hooks/useFriendSystem'
import { db, functions } from '@/lib/firebase'
import { endMyOpenMatches } from '@/lib/combatCleanup'
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, collection, query, where, limit, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSammelkartenConfig } from '@/app/sammelkarten/_modules/hooks/useSammelkartenConfig'
import { useCombatStats } from '@/hooks/useCombatStats'
import { useCombatEvents } from '@/hooks/useCombatEvents'
import { CombatMode } from '@/types/combat'

export default function KaempfePage() {
  const { user } = useAuth()
  const { decks, loading: decksLoading } = useDecks()
  const { friendships, relatedProfiles } = useFriendSystem()
  const { isCombatEnabled, loading: configLoading } = useSammelkartenConfig()
  const { stats, loading: statsLoading } = useCombatStats()
  const { events } = useCombatEvents()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [combatType, setCombatType] = useState<'pvp' | 'pve' | null>(null)
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<CombatMode>('unranked')
  
  const [isSearching, setIsSearching] = useState(false)
  const [showDeckPicker, setShowDeckPicker] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isFriendLoading, setIsFriendLoading] = useState(false)
  const [isCodeLoading, setIsCodeLoading] = useState(false)
  const [searchTime, setSearchTime] = useState(0)
  const [showQueueTable, setShowQueueTable] = useState(false)
  
  const [showFriendModal, setShowFriendModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [allQueueEntries, setAllQueueEntries] = useState<any[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [incomingInvite, setIncomingInvite] = useState<any>(null)
  const [aiElo, setAiElo] = useState(1200)
  const cleanupRanRef = useRef(false)
  const selectedDeckStorageKey = useMemo(
    () => (user?.uid ? `abi-planer:combat:selected-deck:${user.uid}` : null),
    [user?.uid]
  )

  useEffect(() => {
    if (stats?.elo) {
      setAiElo(stats.elo)
    }
  }, [stats])
  
  const router = useRouter()

  // Combat gating
  useEffect(() => {
    if (configLoading) return
    if (isCombatEnabled === false) {
      router.replace('/sammelkarten')
    }
  }, [isCombatEnabled, configLoading, router])

  const validDecks = useMemo(() => decks.filter(deck => deck.cardIds.length === 10), [decks])

  useEffect(() => {
    if (!selectedDeckStorageKey || validDecks.length === 0) return

    const selectedIsValid = selectedDeckId ? validDecks.some((deck) => deck.id === selectedDeckId) : false
    if (selectedIsValid) return

    const savedDeckId = window.localStorage.getItem(selectedDeckStorageKey)
    if (savedDeckId && validDecks.some((deck) => deck.id === savedDeckId)) {
      setSelectedDeckId(savedDeckId)
      return
    }

    setSelectedDeckId(validDecks[0].id)
  }, [validDecks, selectedDeckId, selectedDeckStorageKey])

  useEffect(() => {
    if (!selectedDeckStorageKey || !selectedDeckId) return
    window.localStorage.setItem(selectedDeckStorageKey, selectedDeckId)
  }, [selectedDeckId, selectedDeckStorageKey])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1)
      }, 1000)
    } else {
      setSearchTime(0)
    }
    return () => clearInterval(interval)
  }, [isSearching])

  useEffect(() => {
    if (!user) return
    const queueRef = doc(db, 'matchmaking_queue', user.uid)
    const unsubscribe = onSnapshot(queueRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setIsSearching(true)
        
        // Restore state from Firestore if present (for page reloads)
        if (data.mode) setSelectedMode(data.mode as CombatMode)
        if (data.deckId) setSelectedDeckId(data.deckId)
        
        if (data.matchId) {
          router.push(`/sammelkarten/kaempfe/${data.matchId}`)
        }
      } else {
        setIsSearching(false)
      }
    })
    return () => unsubscribe()
  }, [user, router])

  useEffect(() => {
    if (!isSearching) {
      setAllQueueEntries([])
      return
    }
    const q = query(collection(db, 'matchmaking_queue'), orderBy('joinedAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAllQueueEntries(entries)
    }, (error) => {
      console.error('DebugQueue: Error fetching queue entries:', error)
    })
    return () => unsubscribe()
  }, [isSearching])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'matches'),
      where('playerB_uid', '==', user.uid),
      where('status', '==', 'waiting_for_opponent'),
      limit(1)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setIncomingInvite({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
      } else {
        setIncomingInvite(null)
      }
    }, (error) => {
      console.error('KaempfePage: Error listening to incoming matches:', error)
    })
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user || !functions || cleanupRanRef.current) return
    cleanupRanRef.current = true
    void endMyOpenMatches(user, functions).catch((err) => {
      console.error('Combat cleanup failed:', err)
    })
  }, [user, functions])

  const handleJoinQueue = async () => {
    if (!user || !selectedDeckId) return
    try {
      if (functions) {
        void endMyOpenMatches(user, functions).catch((err) => {
          console.error('Combat cleanup failed (non-blocking):', err)
        })
      }
      await setDoc(doc(db, 'matchmaking_queue', user.uid), {
        userId: user.uid,
        userName: user.displayName || 'Anonym',
        userPhoto: user.photoURL,
        deckId: selectedDeckId,
        mode: selectedMode,
        elo: stats?.elo || 1200,
        joinedAt: serverTimestamp(),
        matchId: null
      })
    } catch (err) {
      console.error('Error joining queue:', err)
    }
  }

  const handleLeaveQueue = async () => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'matchmaking_queue', user.uid))
    } catch (err) {
      console.error('Error leaving queue:', err)
    }
  }

  const handleStartAiMatch = async () => {
    if (!user || !selectedDeckId || !functions) return
    setIsAiLoading(true)
    try {
      if (functions) {
        void endMyOpenMatches(user, functions).catch((err) => {
          console.error('Combat cleanup failed (non-blocking):', err)
        })
      }
      const startAiMatch = httpsCallable(functions, 'startAiMatch')
      const result = await startAiMatch({ 
        deckId: selectedDeckId, 
        mode: selectedMode,
        customElo: selectedMode === 'pve_custom' ? aiElo : undefined
      })
      const data = result.data as { matchId: string }
      if (data.matchId) {
        router.push(`/sammelkarten/kaempfe/${data.matchId}`)
      }
    } catch (err) {
      console.error('Error starting AI match:', err)
      setIsAiLoading(false)
      alert('KI-Match konnte nicht gestartet werden. Bitte erneut versuchen.')
    }
  }

  const handleCreateFriendMatch = async (targetUserId: string) => {
    if (!user || !selectedDeckId || !functions) return
    setIsFriendLoading(true)
    try {
      void endMyOpenMatches(user, functions).catch((err) => {
        console.error('Combat cleanup failed (non-blocking):', err)
      })
      const createFriendMatch = httpsCallable(functions, 'createFriendMatch')
      const result = await createFriendMatch({ targetUserId, deckId: selectedDeckId, mode: selectedMode })
      const data = result.data as { matchId: string }
      if (data.matchId) {
        router.push(`/sammelkarten/kaempfe/${data.matchId}`)
      }
    } catch (err) {
      console.error('Error creating friend match:', err)
      setIsFriendLoading(false)
      alert('Fehler beim Einladen des Freundes.')
    }
  }

  const handleCreateCodeMatch = async () => {
    if (!user || !selectedDeckId || !functions) return
    setIsCodeLoading(true)
    try {
      void endMyOpenMatches(user, functions).catch((err) => {
        console.error('Combat cleanup failed (non-blocking):', err)
      })
      const createMatchWithCode = httpsCallable(functions, 'createMatchWithCode')
      const result = await createMatchWithCode({ deckId: selectedDeckId, mode: selectedMode })
      const data = result.data as { matchId: string, inviteCode: string }
      if (data.inviteCode) {
        setInviteCode(data.inviteCode)
        const unsubscribe = onSnapshot(doc(db, 'matches', data.matchId), (snap) => {
          if (snap.exists() && snap.data().status === 'active') {
            unsubscribe()
            router.push(`/sammelkarten/kaempfe/${data.matchId}`)
          }
        })
      }
    } catch (err) {
      console.error('Error creating code match:', err)
      setIsCodeLoading(false)
      alert('Fehler beim Erstellen des Codes.')
    }
  }

  const handleJoinByCode = async () => {
    if (!user || !selectedDeckId || !functions || !joinCode) return
    setIsCodeLoading(true)
    try {
      const joinMatchByCode = httpsCallable(functions, 'joinMatchByCode')
      const result = await joinMatchByCode({ inviteCode: joinCode, deckId: selectedDeckId })
      const data = result.data as { matchId: string }
      if (data.matchId) {
        router.push(`/sammelkarten/kaempfe/${data.matchId}`)
      }
    } catch (err) {
      console.error('Error joining by code:', err)
      setIsCodeLoading(false)
      alert('Ungültiger Code oder Match bereits voll.')
    }
  }

  const handleAcceptInvite = async (matchId: string) => {
    if (!user || !selectedDeckId || !functions) {
      alert('Bitte wähle zuerst ein Deck aus.')
      return
    }
    setIsCodeLoading(true)
    try {
      const joinMatchById = httpsCallable(functions, 'joinMatchById')
      await joinMatchById({ matchId, deckId: selectedDeckId })
      router.push(`/sammelkarten/kaempfe/${matchId}`)
    } catch (err) {
      console.error('Error accepting invite:', err)
      setIsCodeLoading(false)
      alert('Fehler beim Beitreten des Matches.')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const nextStep = () => setCurrentStep(prev => prev + 1)
  const prevStep = () => setCurrentStep(prev => prev - 1)

  if (decksLoading || configLoading || statsLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand/30 pb-20 overflow-x-hidden font-sans">
      
      <div className="container mx-auto py-5 sm:py-6 px-3 sm:px-4 w-full max-w-lg relative z-10 flex flex-col min-h-[90vh]">
        
        {/* Step Progress */}
        {!isSearching && (
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(step => (
                <div key={step} className={cn("h-1 rounded-full transition-all duration-500", 
                  currentStep === step ? "w-10 bg-primary" : currentStep > step ? "w-4 bg-primary/40" : "w-4 bg-primary/10"
                )} />
              ))}
            </div>
          </div>
        )}

        {/* Incoming Challenge */}
        {incomingInvite && currentStep < 3 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-card text-card-foreground p-4 rounded-3xl flex items-center justify-between shadow-2xl border border-border">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center"><Zap className="h-4 w-4 text-primary-foreground" /></div>
              <div className="text-[10px] font-black uppercase leading-tight">{incomingInvite.playerA.name}<br/><span className="opacity-50">fordert dich heraus</span></div>
            </div>
            <Button size="sm" onClick={() => handleAcceptInvite(incomingInvite.id)} className="rounded-xl font-black uppercase text-[9px] h-8">Annehmen</Button>
          </motion.div>
        )}

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {isSearching ? (
              <motion.div key="searching" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center py-8 sm:py-10 space-y-8 sm:space-y-12 text-center overflow-y-auto custom-scrollbar pr-1">
                <div className="shrink-0 space-y-8 sm:space-y-10 flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-150 animate-pulse" />
                    <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-full border-2 border-dashed border-primary/20 animate-[spin_10s_linear_infinite] relative z-10" />
                    <div className="absolute inset-3 rounded-full border-4 border-t-primary border-primary/5 animate-spin z-20" />
                    <Swords className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-11 w-11 sm:h-14 sm:w-14 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter">Suche Gegner</h2>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{selectedMode}</span>
                      <p className="text-foreground text-4xl sm:text-5xl font-mono pt-2 tabular-nums">{formatTime(searchTime)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 w-full max-w-[240px]">
                    <Button variant="destructive" size="lg" onClick={handleLeaveQueue} className="w-full rounded-full h-16 font-black uppercase tracking-widest text-xs border-none shadow-2xl transition-transform active:scale-95">Abbrechen</Button>
                    <button 
                      onClick={() => setShowQueueTable(!showQueueTable)} 
                      className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-all flex items-center justify-center gap-2 outline-none group"
                    >
                      <div className={cn("h-1 w-1 rounded-full bg-primary transition-all group-hover:scale-150", showQueueTable ? "scale-150" : "scale-100")} />
                      {showQueueTable ? "Warteschlange ausblenden" : "Warteschlange anzeigen"}
                    </button>
                  </div>
                </div>

                {/* Queue Table */}
                <AnimatePresence>
                  {showQueueTable && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="w-full pt-4 space-y-4 text-left"
                    >
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase italic tracking-widest opacity-40">Aktive Warteschlange</h3>
                        <Badge variant="outline" className="text-[8px] font-black uppercase px-2 h-5 opacity-40">{allQueueEntries.length} Spieler</Badge>
                      </div>

                      <div className="bg-card/50 border border-border rounded-3xl overflow-hidden shadow-inner shrink-0">
                        <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="text-[8px] font-black uppercase tracking-widest pl-4 sm:pl-6">Spieler</TableHead>
                              <TableHead className="text-[8px] font-black uppercase tracking-widest text-center">ELO</TableHead>
                              <TableHead className="text-[8px] font-black uppercase tracking-widest text-center">Modus</TableHead>
                              <TableHead className="text-[8px] font-black uppercase tracking-widest text-right pr-4 sm:pr-6">Zeit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allQueueEntries.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-[10px] font-black uppercase opacity-20 italic">
                                  Warte auf Daten...
                                </TableCell>
                              </TableRow>
                            ) : (
                              allQueueEntries.map((entry) => {
                                const joinedTime = entry.joinedAt?.toDate ? entry.joinedAt.toDate() : (entry.joinedAt?.seconds ? new Date(entry.joinedAt.seconds * 1000) : new Date())
                                const waitSeconds = Math.floor((new Date().getTime() - joinedTime.getTime()) / 1000)
                                const isMe = entry.id === user?.uid

                                return (
                                  <TableRow key={entry.id} className={cn("border-border/50", isMe && "bg-primary/5 hover:bg-primary/10")}>
                                    <TableCell className="pl-4 sm:pl-6 py-4 min-w-[130px]">
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-background border border-border overflow-hidden shrink-0 relative">
                                          {entry.userPhoto ? (
                                            <img src={entry.userPhoto} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-[10px] text-muted-foreground">{entry.userName?.[0]}</div>
                                          )}
                                          {isMe && <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full border border-background animate-pulse" />}
                                        </div>
                                        <div className="font-black uppercase text-[11px] tracking-tight truncate max-w-[72px] sm:max-w-[120px]">
                                          {entry.userName}
                                          {isMe && <span className="ml-1 text-[7px] text-primary">●</span>}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center font-mono font-black text-[11px] text-yellow-500/80">
                                      {entry.elo || 1200}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className="text-[8px] font-black uppercase bg-muted/50 px-1.5 py-0.5 rounded-md border border-border/50 opacity-60">
                                        {entry.mode}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-4 sm:pr-6 font-mono font-black text-[11px] tabular-nums opacity-60 min-w-[64px]">
                                      {formatTime(waitSeconds > 0 ? waitSeconds : 0)}
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            )}
                          </TableBody>
                        </Table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <>
                {/* STEP 1: PVP vs PVE */}
                {currentStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    <div className="space-y-3">
                      <h1 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-[0.9]">Wähle<br/>deinen<br/>Gegner</h1>
                      <p className="text-muted-foreground font-medium text-sm">PvP für die Rangliste, PvE gegen die KI.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <button onClick={() => { setCombatType('pvp'); setCurrentStep(2); }} className="group p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-card text-card-foreground border border-border text-left transition-all active:scale-95 shadow-2xl hover:border-primary/50">
                        <div className="flex justify-between items-start mb-6 sm:mb-10">
                          <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                          <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center"><ChevronRight className="h-5 w-5" /></div>
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter mb-1">Spieler</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">PvP</p>
                      </button>
                      <button onClick={() => { setCombatType('pve'); setSelectedMode('pve_custom'); setCurrentStep(3); }} className="group p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-muted/30 border border-border hover:border-primary/50 text-left transition-all active:scale-95">
                        <div className="flex justify-between items-start mb-6 sm:mb-10">
                          <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                          <ChevronRight className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter mb-1 text-foreground/60">Computer</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">PvE</p>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: MODES */}
                {currentStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setCurrentStep(1)} className="h-12 w-12 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-all"><ArrowLeft className="h-5 w-5" /></button>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none">{combatType === 'pvp' ? 'Online Modus' : 'KI Training'}</h1>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {combatType === 'pvp' ? (
                          <>
                            <button onClick={() => { setSelectedMode('ranked'); setCurrentStep(3); }} className="p-6 rounded-[2rem] bg-yellow-500 text-black text-left transition-all flex items-center gap-5 shadow-xl active:scale-95">
                              <div className="h-12 w-12 rounded-2xl bg-black/10 flex items-center justify-center"><Trophy className="h-6 w-6" /></div>
                              <div className="flex-1 font-black uppercase italic text-xl sm:text-2xl tracking-tighter">Ranked<br/><span className="text-[8px] tracking-widest opacity-40">ELO & Belohnungen</span></div>
                            </button>
                            <button onClick={() => { setSelectedMode('unranked'); setCurrentStep(3); }} className="p-6 rounded-[2rem] bg-muted/30 border border-border text-left transition-all flex items-center gap-5 active:scale-95 hover:border-primary/50">
                              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-blue-500"><Zap className="h-6 w-6" /></div>
                              <div className="flex-1 font-black uppercase italic text-xl sm:text-2xl tracking-tighter">Unranked<br/><span className="text-[8px] tracking-widest text-muted-foreground">Nur zum Spaß</span></div>
                            </button>
                            
                            {/* Active Events */}
                            {events && events.filter(e => e.isActive).map(event => (
                              <button key={event.id} onClick={() => { setSelectedMode('event' as CombatMode); setCurrentStep(3); }} className="p-6 rounded-[2rem] bg-indigo-600 text-white text-left transition-all flex items-center gap-5 shadow-lg active:scale-95">
                                <div className="h-12 w-12 rounded-2xl bg-black/20 flex items-center justify-center"><Star className="h-6 w-6 fill-current text-yellow-400" /></div>
                                <div className="flex-1 font-black uppercase italic text-xl sm:text-2xl tracking-tighter">Event<br/><span className="text-[8px] tracking-widest opacity-60">{event.title}</span></div>
                              </button>
                            ))}

                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <button onClick={() => setShowFriendModal(true)} className="p-5 rounded-3xl bg-muted/30 border border-border flex flex-col items-center gap-2 active:scale-95 transition-all text-muted-foreground hover:border-primary/50">
                                <Users className="h-6 w-6" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Freunde</span>
                              </button>
                              <button onClick={() => setShowCodeModal(true)} className="p-5 rounded-3xl bg-muted/30 border border-border flex flex-col items-center gap-2 active:scale-95 transition-all text-muted-foreground hover:border-primary/50">
                                <Key className="h-6 w-6" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Code</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => { setSelectedMode('pve_custom'); setCurrentStep(3); }} className="p-6 rounded-[2rem] bg-muted/30 border border-border text-left transition-all flex items-center gap-5 active:scale-95 hover:border-primary/50 group">
                              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><Sliders className="h-6 w-6" /></div>
                              <div className="flex-1 font-black uppercase italic text-xl sm:text-2xl tracking-tighter">Custom KI<br/><span className="text-[8px] tracking-widest text-muted-foreground">Wähle die ELO selbst</span></div>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  </motion.div>
                )}

                {/* STEP 3: FINAL CHECK */}
                {currentStep === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    <div className="flex items-center gap-4">
                      <button onClick={() => combatType === 'pve' ? setCurrentStep(1) : setCurrentStep(2)} className="h-12 w-12 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-all"><ArrowLeft className="h-5 w-5" /></button>
                      <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none">Ready?</h1>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-border space-y-8 sm:space-y-10 relative overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-start relative z-10">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Modus</span>
                            <div className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter">
                              {selectedMode === 'pve' ? 'KI Training' : (selectedMode === 'pve_custom' ? 'Custom KI' : selectedMode)}
                            </div>
                          </div>
                          <div className="h-10 w-10 rounded-2xl bg-success/20 flex items-center justify-center text-success"><CheckCircle2 className="h-6 w-6" /></div>
                        </div>

                        {selectedMode === 'pve_custom' && (
                          <div className="space-y-4 pt-4 border-t border-border relative z-10">
                            <div className="flex justify-between items-end">
                              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">KI Schwierigkeit (ELO)</span>
                              <div className="text-2xl font-black tabular-nums italic text-orange-500">{aiElo}</div>
                            </div>
                            <div className="px-2">
                              <input 
                                type="range" 
                                min="500" 
                                max="3000" 
                                step="50" 
                                value={aiElo} 
                                onChange={(e) => setAiElo(parseInt(e.target.value))}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-orange-500"
                              />
                              <div className="flex justify-between mt-2 text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
                                <span>Anfänger (500)</span>
                                <span>Meister (3000)</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 relative z-10">
                          <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Dein Kampf-Deck</span>
                          {validDecks.find(d => d.id === selectedDeckId) ? (
                            <button onClick={() => setShowDeckPicker(true)} className="w-full text-left p-4 sm:p-6 rounded-3xl border border-border bg-muted/30 hover:bg-muted/50 transition-all flex items-center justify-between group outline-none">
                              <div className="flex items-center gap-4 flex-1 mr-4 overflow-hidden">
                                <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center font-black border border-border text-xl italic group-hover:scale-110 transition-transform shrink-0">10</div>
                                <div className="font-black text-xl sm:text-2xl tracking-tighter uppercase truncate">{validDecks.find(d => d.id === selectedDeckId)?.title || "Kein Deck"}</div>
                              </div>
                              <div className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[9px] font-black uppercase shrink-0">Wechseln</div>
                            </button>
                          ) : (
                            <Button asChild variant="outline" className="w-full h-16 rounded-[2rem] border-dashed border-border hover:bg-muted/30">
                              <Link href="/sammelkarten?view=decks">Deck erstellen</Link>
                            </Button>
                          )}
                        </div>

                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="relative z-10 pt-6">
                          <Button 
                            disabled={!selectedDeckId || isAiLoading} 
                            onClick={selectedMode.startsWith('pve') ? handleStartAiMatch : handleJoinQueue} 
                            // @ts-expect-error - size="none" intentionally bypasses default size variants here
                            size="none"
                            className={cn(
                              "w-full py-5 sm:py-6 rounded-[2rem] text-2xl sm:text-3xl font-black italic shadow-2xl transition-all uppercase tracking-tighter border-4 group overflow-hidden relative flex flex-col items-center justify-center leading-none", 
                              selectedDeckId 
                                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                                : "bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed"
                            )}
                          >
                            {/* Glossy Overlay effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            
                            {isAiLoading ? (
                              <Loader2 className="h-12 w-12 animate-spin" />
                            ) : (
                              <>
                                <span className="relative z-10 block">KÄMPFEN!</span>
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mt-1.5 block">Start Matchmaking</span>
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card border border-border rounded-3xl p-6 text-center shadow-xl">
                          <div className="text-[9px] font-black uppercase text-muted-foreground/40 mb-1">Deine ELO</div>
                          <div className="text-3xl font-black tabular-nums italic tracking-tighter">{stats?.elo || 1200}</div>
                        </div>
                        <div className="bg-card border border-border rounded-3xl p-6 text-center shadow-xl">
                          <div className="text-[9px] font-black uppercase text-muted-foreground/40 mb-1">Winrate</div>
                          <div className="text-3xl font-black tabular-nums text-success italic tracking-tighter">{stats?.totalMatches ? Math.round((stats.wins / stats.totalMatches) * 100) : 0}%</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showDeckPicker && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeckPicker(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-card border border-border rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md p-8 relative z-10 space-y-6 max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Deck wählen</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowDeckPicker(false)} className="rounded-full h-12 w-12 bg-muted hover:bg-muted/80"><X className="h-6 w-6" /></Button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
                <div className="grid grid-cols-1 gap-3">
                  {validDecks.map((deck) => (
                    <button key={deck.id} onClick={() => { setSelectedDeckId(deck.id); setShowDeckPicker(false); }} className={cn("text-left p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between", selectedDeckId === deck.id ? "border-primary bg-primary/5" : "border-border bg-muted/30")}>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center font-black text-lg border border-border italic">10</div>
                        <div className="font-black text-xl tracking-tighter uppercase">{deck.title}</div>
                      </div>
                      {selectedDeckId === deck.id && <CheckCircle2 className="h-6 w-6 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showCodeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowCodeModal(false); setInviteCode(null); }} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card border border-border rounded-[3rem] w-full max-w-md p-10 relative z-10 space-y-10 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Code</h3>
                <Button variant="ghost" size="icon" onClick={() => { setShowCodeModal(false); setInviteCode(null); }} className="rounded-full h-12 w-12 bg-muted"><X className="h-6 w-6" /></Button>
              </div>
              {inviteCode ? (
                <div className="space-y-8 text-center">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.4em]">Dein Match-Code</div>
                    <div className="text-7xl font-black tracking-[0.1em] text-foreground font-mono bg-muted/30 p-8 rounded-[2.5rem] border border-border">{inviteCode}</div>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium px-6">Warte bis dein Gegner beitritt...</p>
                  <div className="h-1.5 w-32 bg-muted rounded-full mx-auto overflow-hidden"><motion.div animate={{ x: [-128, 128] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="h-full w-32 bg-primary/40" /></div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase text-muted-foreground/40 text-center tracking-[0.3em]">Beitreten</div>
                    <Input placeholder="000000" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="h-24 bg-background border-border rounded-[2rem] text-center text-5xl font-black tracking-[0.2em] border-2 focus:border-primary transition-all shadow-inner" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Button disabled={!selectedDeckId || isCodeLoading || !joinCode} onClick={handleJoinByCode} className="h-18 rounded-[1.5rem] font-black uppercase tracking-widest text-lg shadow-xl">BEITRETEN</Button>
                    <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center"><span className="bg-card px-4 text-[9px] font-black uppercase text-muted-foreground/40">Oder</span></div></div>
                    <Button variant="outline" disabled={!selectedDeckId || isCodeLoading} onClick={handleCreateCodeMatch} className="h-18 rounded-[1.5rem] border-border font-black uppercase tracking-widest hover:bg-muted/30">CODE GENERIEREN</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {showFriendModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFriendModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-card border border-border rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md p-8 relative z-10 space-y-8 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Freunde</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowFriendModal(false)} className="rounded-full h-12 w-12 bg-muted"><X className="h-6 w-6" /></Button>
              </div>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pb-10">
                {friendships.length === 0 ? (
                  <div className="text-center py-16 opacity-20"><UserPlus className="h-16 w-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest text-xs">Keine Freunde online</p></div>
                ) : (
                  friendships.map((f) => {
                    const friendId = f.members.find(m => m !== user?.uid)
                    const p = friendId ? relatedProfiles[friendId] : null
                    if (!p) return null
                    return (
                      <button key={f.id} disabled={!selectedDeckId || isFriendLoading} onClick={() => { handleCreateFriendMatch(friendId!); setShowFriendModal(false); setCurrentStep(3); }} className="w-full p-5 rounded-[2rem] bg-muted/30 border border-border hover:border-primary hover:bg-muted/50 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4 text-left">
                          <div className="h-14 w-14 rounded-full bg-background overflow-hidden border-2 border-border">{p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-xl">{p.full_name?.[0]}</div>}</div>
                          <div><div className="font-black uppercase text-lg leading-tight tracking-tighter">{p.full_name}</div><div className="text-[9px] font-black uppercase text-success tracking-widest flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />Bereit</div></div>
                        </div>
                        <Swords className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:rotate-12" />
                      </button>
                    )
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--primary) / 0.1); border-radius: 10px; }
      `}</style>
    </div>
  )
}
