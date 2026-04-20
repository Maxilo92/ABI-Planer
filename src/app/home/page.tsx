import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SammelkartenModule } from '../sammelkarten/_modules/components/SammelkartenModule'

export default function TcgHomePage() {
  return (
    <Suspense 
      fallback={
        <div className="container mx-auto py-8 space-y-12">
          <Skeleton className="h-40 w-full rounded-[2.5rem]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <SammelkartenModule defaultView="dashboard" />
    </Suspense>
  )
}
