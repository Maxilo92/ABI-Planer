'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { useAuth } from '@/context/AuthContext'
import { useCustomPackQueue } from '@/hooks/useCustomPackQueue'
import { useUserTeachers } from '@/hooks/useUserTeachers'
import { cn } from '@/lib/utils'

function PackPreviewCard({
  count,
  source,
  isSelected,
  packId
}: {
  count: number
  source: 'random' | 'custom'
  isSelected: boolean
  packId?: string
}) {
  const isCustom = source === 'custom'
  // Support style if packId matches, regardless of source
  const isSupport = packId === 'support_vol_1'
  
  const cardTopClass = isSupport
    ? 'bg-emerald-600'
    : isCustom 
      ? 'bg-fuchsia-700' 
      : 'bg-blue-600'
  const cardBottomClass = isSupport
    ? 'bg-gradient-to-b from-emerald-700 to-teal-900'
    : isCustom 
      ? 'bg-gradient-to-b from-purple-800 to-fuchsia-900' 
      : 'bg-blue-700'
  const iconChipClass = isSupport
    ? 'bg-emerald-200'
    : isCustom 
      ? 'bg-fuchsia-200' 
      : 'bg-white'
  const labelChipClass = isSupport
    ? 'bg-emerald-500 text-white'
    : isCustom 
      ? 'bg-fuchsia-500 text-white' 
      : 'bg-white text-black'

  return (
    <div
      className={cn(
        'relative w-64 h-[400px] group transition-all duration-300',
        isSelected ? 'scale-[1.02]' : 'group-hover:scale-[1.02]'
      )}
      style={{
        filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))',
        perspective: '1000px'
      }}
    >
      <div className="absolute inset-0 flex flex-col h-full w-full">
        <div className="relative w-full h-1/3 z-20 overflow-hidden">
          <div className={cn('absolute inset-0', cardTopClass)} />

          <div className="absolute top-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-b-2 border-black/20" />

          <div className="absolute inset-0 flex items-center justify-center pt-8">
            <div className={cn('p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]', iconChipClass)}>
              <Sparkles className="h-8 w-8 text-black fill-black" />
            </div>
          </div>
        </div>

        <div className="relative w-full h-2/3 z-10 -mt-[1px] overflow-hidden">
          <div className={cn('absolute inset-0', cardBottomClass)} />

          <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-t-2 border-black/20" />

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center h-full w-full px-6 pt-10">
            <div className={cn('relative mb-4 px-4 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1', labelChipClass)}>
              <h2 className="font-black text-3xl tracking-tighter italic uppercase text-center">
                {isSupport ? 'SUPPORT VOL. 1' : isCustom ? 'CUSTOM PACK' : 'ABI PLANER'}
              </h2>
            </div>

            <div className={cn(
              'px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-auto border-4 border-black',
              isSupport ? 'bg-emerald-100 text-black' : isCustom ? 'bg-fuchsia-100 text-black' : 'bg-white text-black'
            )}>
              {isSupport ? '1 Support Karte' : '3 Lehrer Karten'}
            </div>

            <div className="w-full flex justify-between items-end pb-12">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-black/40 uppercase">S1/2026</span>
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-3 h-1 bg-black/20 rounded-sm" />
                  ))}
                </div>
              </div>

              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
                iconChipClass
              )}>
                <Sparkles className="h-7 w-7 text-black fill-black" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShopPreviewCard() {
  return (
    <div
      className="relative w-64 h-[400px] group transition-all duration-300 opacity-50"
      style={{
        filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.25))',
        perspective: '1000px'
      }}
    >
      <div className="absolute inset-0 flex flex-col h-full w-full">
        <div className="relative w-full h-1/3 z-20 overflow-hidden">
          <div className="absolute inset-0 border-x-4 border-t-4 border-gray-400 bg-gray-300 dark:border-gray-600 dark:bg-gray-700" />

          <div className="absolute top-0 left-0 right-0 h-10 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-b-2 border-gray-300/50 dark:border-gray-600/50" />

          <div className="absolute inset-0 flex items-center justify-center pt-8">
            <div className="p-3 rounded-2xl border-4 border-gray-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] bg-gray-200 dark:border-gray-600 dark:bg-gray-600">
              <ShoppingBag className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="relative w-full h-2/3 z-10 -mt-[1px] overflow-hidden">
          <div className="absolute inset-0 border-x-4 border-b-4 border-gray-400 bg-gradient-to-b from-gray-400 to-gray-500 dark:border-gray-600 dark:from-gray-700 dark:to-gray-800" />

          <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-t-2 border-gray-300/50 dark:border-gray-600/50" />

          <div className="relative z-10 flex flex-col items-center h-full w-full px-6 pt-10">
            <div className="relative mb-4 px-4 py-2 border-4 border-gray-400 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] -rotate-1 bg-gray-200 text-gray-600 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400">
              <h2 className="font-black text-3xl tracking-tighter italic uppercase">SHOP</h2>
            </div>

            <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-auto border-4 border-gray-400 bg-gray-300 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
              Packs holen
            </div>

            <div className="w-full flex justify-between items-end pb-12">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-400/60 uppercase">Ausgegraut</span>
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-3 h-1 bg-gray-400/30 rounded-sm" />
                  ))}
                </div>
              </div>

              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-gray-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] bg-gray-200 dark:border-gray-600 dark:bg-gray-600">
                <span className="text-3xl font-black text-gray-600 dark:text-gray-400">+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PackSelectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('selected')
  const { user, loading } = useAuth()
  const { getRemainingBoosters, getRemainingSupportBoosters } = useUserTeachers()
  const { queueEntries, loading: customQueueLoading } = useCustomPackQueue()

  const availablePacks = useMemo(() => {
    const packs = [] as Array<{
      id: string
      name: string
      count: number
      source: 'random' | 'custom'
      queueId?: string
      packId?: string
    }>

    const remainingBoosters = Math.max(0, Number(getRemainingBoosters?.() || 0))
    if (remainingBoosters > 0) {
      packs.push({ id: 'random-pack', name: 'Standard Booster', count: remainingBoosters, source: 'random' })
    }

    const remainingSupport = Math.max(0, Number(getRemainingSupportBoosters?.() || 0))
    if (remainingSupport > 0) {
      packs.push({ 
        id: 'support-vol-1', 
        name: 'Support Pack Vol. 1', 
        count: remainingSupport, 
        source: 'random',
        packId: 'support_vol_1'
      })
    }

    queueEntries.forEach((entry, index) => {
      packs.push({
        id: entry.id,
        name: (entry.name || `Custom Pack ${index + 1}`).trim(),
        count: entry.remainingPacks,
        source: 'custom',
        queueId: entry.id,
        packId: entry.packId // Wichtig für das grüne Design, falls es ein Support-Pack ist!
      })
    })

    return packs
  }, [getRemainingBoosters, getRemainingSupportBoosters, queueEntries])

  const handleSelectPack = (packId: string) => {
    router.push(`/sammelkarten?pack=${encodeURIComponent(packId)}`)
  }

  if (loading) return null

  if (!user) {
    return (
      <div className="container mx-auto py-12">
        <ProtectedSystemGate
          title="Booster-Auswahl gesperrt"
          description="Um ein Pack auszuwaehlen, musst du angemeldet sein."
          icon={<Sparkles className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  return (
    <main className="container mx-auto py-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mb-6">
          <Link
            href="/sammelkarten"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300/90 dark:border-slate-600/90 bg-white/90 dark:bg-slate-900/90 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200 transition-colors hover:border-slate-400 dark:hover:border-slate-500 hover:bg-white dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Sammelkarten</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Wähle dein Pack</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Hier siehst du den Shop zuerst und danach alle verfügbaren Booster. Wähle ein Pack aus, um zur Öffnung zurückzukehren.
          </p>
        </div>

        {customQueueLoading ? (
          <div className="text-sm text-slate-600 dark:text-slate-300 text-center py-8">
            Lade verfügbare Packs...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            <Link
              href="/shop?category=sammelkarten"
              className="group cursor-pointer transition-all hover:-translate-y-0.5"
            >
              <div className="flex flex-col items-center gap-3">
                <ShopPreviewCard />
                <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200 mt-2">
                  Booster-Shop
                </p>
              </div>
            </Link>

            {availablePacks.map((pack) => {
              const isSelected = selectedId === pack.id

              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handleSelectPack(pack.id)}
                  className="group cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col items-center gap-3"
                >
                  <PackPreviewCard
                    count={pack.count}
                    source={pack.source}
                    isSelected={isSelected}
                    packId={pack.packId}
                  />
                  <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
                    {pack.name}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

export default function SammelkartenPackSelectionPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-black uppercase tracking-widest">Lade Auswahl...</div>
      </div>
    }>
      <PackSelectionContent />
    </Suspense>
  )
}
