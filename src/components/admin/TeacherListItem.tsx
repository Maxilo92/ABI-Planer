'use client'

import React from 'react'
import { LootTeacher } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { cn, getRarityColor, getRarityLabel } from '@/lib/utils'

interface TeacherListItemProps {
  teacher: LootTeacher;
  onEdit: (teacher: LootTeacher) => void;
  onRemove: (teacher: LootTeacher) => void;
}

/**
 * A memoized list item for a teacher in the Card Manager.
 * Prevents unnecessary re-renders when the main list state changes.
 */
export const TeacherListItem = React.memo(function TeacherListItem({ 
  teacher, 
  onEdit, 
  onRemove 
}: TeacherListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/30 transition-all group">
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate">{teacher.name}</span>
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-wider", getRarityColor(teacher.rarity))}>
          {getRarityLabel(teacher.rarity)}
        </span>
      </div>
      <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => onEdit(teacher)}
          title="Bearbeiten"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive" 
          onClick={() => onRemove(teacher)}
          title="Entfernen"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
