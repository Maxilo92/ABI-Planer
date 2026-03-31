'use client'

import React from 'react'
import { LootTeacher } from '@/types/database'
import { TeacherListItem } from './TeacherListItem'

interface TeacherListProps {
  teachers: LootTeacher[];
  onEdit: (teacher: LootTeacher) => void;
  onRemove: (teacher: LootTeacher) => void;
}

/**
 * A memoized list of teachers for the Card Manager.
 * Prevents unnecessary re-renders of the entire list when unrelated state changes.
 */
export const TeacherList = React.memo(function TeacherList({ 
  teachers, 
  onEdit, 
  onRemove 
}: TeacherListProps) {
  if (teachers.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-sm text-muted-foreground italic">
        Keine Lehrer im Pool.
      </div>
    )
  }

  return (
    <div className="max-h-[600px] overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted/10">
      {teachers.map((teacher) => (
        <TeacherListItem 
          key={teacher.id} 
          teacher={teacher} 
          onEdit={onEdit} 
          onRemove={onRemove} 
        />
      ))}
    </div>
  )
})
