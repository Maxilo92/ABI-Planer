'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LayoutGrid, ChevronUp, ChevronDown, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Profile, DashboardComponentKey } from '@/types/database'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface CustomizeDashboardDialogProps {
  profile: Profile
  currentLayout: DashboardComponentKey[]
}

const WIDGET_LABELS: Record<DashboardComponentKey, string> = {
  funding: 'Finanzen & Prognose',
  news: 'Letzte Updates',
  todos: 'Meine Aufgaben',
  events: 'Anstehende Termine',
  polls: 'Abstimmungen',
  leaderboard: 'Klassen-Ranking'
}

export function CustomizeDashboardDialog({ profile, currentLayout }: CustomizeDashboardDialogProps) {
  const [layout, setLayout] = useState<DashboardComponentKey[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Initialize layout when dialog opens
  useEffect(() => {
    if (open) {
      // Ensure all possible widgets are in the list, even if not in currentLayout
      const allWidgets: DashboardComponentKey[] = [
        'todos', 'events', 'polls', 'funding', 'news', 'leaderboard'
      ]
      
      const existing = currentLayout.filter(key => allWidgets.includes(key))
      const missing = allWidgets.filter(key => !currentLayout.includes(key))
      
      setLayout([...existing, ...missing])
    }
  }, [open, currentLayout])

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newLayout = [...layout]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newLayout.length) {
      const temp = newLayout[index]
      newLayout[index] = newLayout[targetIndex]
      newLayout[targetIndex] = temp
      setLayout(newLayout)
    }
  }

  const handleToggle = (key: DashboardComponentKey) => {
    if (layout.includes(key)) {
      setLayout(layout.filter(k => k !== key))
    } else {
      // Add it at the end
      setLayout([...layout, key])
    }
  }

  const handleSave = async () => {
    if (!profile.id) return
    setLoading(true)

    try {
      const userRef = doc(db, 'profiles', profile.id)
      await updateDoc(userRef, {
        dashboard_layout: layout
      })
      setOpen(false)
    } catch (error) {
      console.error('Error saving dashboard layout:', error)
    }
    setLoading(false)
  }

  const handleReset = async () => {
    if (!profile.id) return
    setLoading(true)

    try {
      const userRef = doc(db, 'profiles', profile.id)
      await updateDoc(userRef, {
        dashboard_layout: null
      })
      setOpen(false)
    } catch (error) {
      console.error('Error resetting dashboard layout:', error)
    }
    setLoading(false)
  }

  const allPossibleWidgets: DashboardComponentKey[] = [
    'todos', 'events', 'polls', 'funding', 'news', 'leaderboard'
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 border-brand/20 hover:bg-brand/5 text-xs font-bold uppercase tracking-wider">
          <LayoutGrid className="h-3.5 w-3.5" />
          Anpassen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="italic uppercase font-black italic">Dashboard anpassen</DialogTitle>
          <DialogDescription>
            Wähle aus, welche Widgets du sehen möchtest und in welcher Reihenfolge.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <AnimatePresence mode="popLayout">
            {layout.map((key, index) => (
              <motion.div 
                key={key} 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  layout.includes(key) ? "bg-card border-border shadow-sm" : "bg-muted/30 border-dashed opacity-60"
                )}
              >
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === layout.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex-1 font-bold text-sm">
                  {WIDGET_LABELS[key]}
                </div>

                <Button
                  variant={layout.includes(key) ? "ghost" : "secondary"}
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleToggle(key)}
                >
                  {layout.includes(key) ? (
                    <Eye className="h-4 w-4 text-brand" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Show widgets that are not in the current active layout list separately if they were somehow excluded */}
          <AnimatePresence mode="popLayout">
            {allPossibleWidgets
              .filter(k => !layout.includes(k))
              .map((key) => (
                <motion.div 
                  key={`inactive-${key}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 0.6, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed bg-muted/30 opacity-60"
                >
                  <div className="flex-1 font-bold text-sm pl-9">
                    {WIDGET_LABELS[key]}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleToggle(key)}
                  >
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 mt-2">
          <div className="w-full sm:w-auto flex justify-start">
            {profile.dashboard_layout && profile.dashboard_layout.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReset} 
                disabled={loading}
                className="h-8 gap-2 border-brand/20 hover:bg-brand/5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-brand transition-all"
              >
                <Sparkles className="h-3 w-3 text-brand" />
                Automatik
              </Button>
            )}
          </div>
          <div className="w-full sm:w-auto flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs">Abbrechen</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-brand hover:bg-brand/90 text-brand-foreground font-black uppercase tracking-widest text-[10px] h-9 px-4">
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
