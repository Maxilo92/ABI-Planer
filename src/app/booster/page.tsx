import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SammelkartenModule } from '../sammelkarten/_modules/components/SammelkartenModule'

export default function BoosterPage() {
  return (
    <Suspense 
      fallback={
        <div className="container mx-auto py-8 space-y-12">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-48 rounded-full" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="w-64 h-[400px] rounded-[2.5rem]" />
          </div>
        </div>
      }
    >
      <SammelkartenModule defaultView="sammelkarten" hideFundingBanner={true} />
    </Suspense>
  )
}
