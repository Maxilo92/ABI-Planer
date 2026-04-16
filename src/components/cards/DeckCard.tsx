'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { UserDeck } from '@/types/decks'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { TeacherCard } from './TeacherCard'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { buildTeacherCatalogFromSettings, findUserTeacherEntry, TeacherCatalogEntry } from '@/lib/cardCatalog'
import { mapTeacherCatalogToCardData } from '@/modules/cards/cardData'

interface DeckCardProps {
  deck: UserDeck
  onEdit: (deckId: string) => void
  onDelete: (deckId: string) => void
}

export const DeckCard: React.FC<DeckCardProps> = ({ deck, onEdit, onDelete }) => {
  const { teachers: userTeachers, loading: loadingUserTeachers } = useUserTeachers()
  const [globalTeachers, setGlobalTeachers] = useState<TeacherCatalogEntry[]>([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sammelkarten'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setGlobalTeachers(buildTeacherCatalogFromSettings(data))
      }
      setLoadingGlobal(false)
    })
    return () => unsubscribe()
  }, [])

  const coverCardData = useMemo(() => {
    if (loadingUserTeachers || loadingGlobal || !userTeachers) return null

    const teacher = globalTeachers.find(t => t.fullId === deck.coverCardId || t.baseId === deck.coverCardId)
    if (!teacher) return null

    const userData = findUserTeacherEntry(userTeachers, teacher)
    return mapTeacherCatalogToCardData(teacher, userData, globalTeachers)
  }, [deck.coverCardId, userTeachers, globalTeachers, loadingUserTeachers, loadingGlobal])

  const isReady = deck.cardIds.length === 10

  return (
    <Card className="overflow-hidden flex flex-col h-full bg-muted/30 border-white/10 hover:border-white/20 transition-all group">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-black uppercase tracking-tight truncate">
            {deck.title}
          </CardTitle>
          {isReady ? (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1 shrink-0">
              <AlertCircle className="w-3 h-3" />
              {deck.cardIds.length}/10
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-1 flex flex-col items-center justify-center min-h-[200px]">
        {coverCardData ? (
          <div className="w-full max-w-[160px] aspect-[2.5/3.5] transform group-hover:scale-105 transition-transform duration-300">
            <TeacherCard 
              data={coverCardData} 
              interactive={false} 
              styleVariant="modern-flat"
              isFlippedExternally={true}
            />
          </div>
        ) : (
          <div className="w-full max-w-[160px] aspect-[2.5/3.5] bg-muted rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-center p-4">
            <p className="text-xs text-muted-foreground font-medium">Kein Cover ausgewählt</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full gap-2 font-bold uppercase text-[10px]"
          onClick={() => onEdit(deck.id)}
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          className="w-full gap-2 font-bold uppercase text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
          onClick={() => onDelete(deck.id)}
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
