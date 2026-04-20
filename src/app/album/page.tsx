'use client'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'

export default function AlbumPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Suspense 
          fallback={
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[2.5/3.5] rounded-xl" />
                ))}
              </div>
            </div>
          }
        >
          <TeacherAlbum />
        </Suspense>
      </div>
    </div>
  )
}
