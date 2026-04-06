'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, Suspense } from 'react'
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
}: {
  count: number
  source: 'random' | 'custom'
  isSelected: boolean
}) {
  const isCustom = source === 'custom'
  const cardTopClass = isCustom ? 'bg-fuchsia-700' : 'bg-blue-600'
  const cardBottomClass = isCustom ? 'bg-gradient-to-b from-purple-800 to-fuchsia-900' : 'bg-blue-700'
  const iconChipClass = isCustom ? 'bg-fuchsia-200' : 'bg-white'
  const labelChipClass = isCustom ? 'bg-fuchsia-500 text-white' : 'bg-white text-black'

  return (
    <div
      className={cn(
        'relative w-64 h-[400px] group transition-all duration-300',
        isSelected ? 'scale-[1.02] ring-4 ring-sky-300/80 rounded-[2rem]' : 'group-hover:scale-[1.02]'
      )}
      style={{
        filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))',
        perspective: '1000px'
      }}
    >
      <div className="absolute inset-0 flex flex-col h-full w-full">
        <div className="relative w-full h-1/3 z-20 overflow-hidden">
          <div className={cn('absolute inset-0 border-x-4 border-t-4 border-black', cardTopClass)} />

          <div className="absolute top-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-b-2 border-black/20" />

          <div className="absolute inset-0 flex items-center justify-center pt-8">
            <div className={cn('p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]', iconChipClass)}>
              <Sparkles className="h-8 w-8 text-black fill-black" />
            </div>
          </div>
        </div>

        <div className="relative w-full h-2/3 z-10 -mt-[1px] overflow-hidden">
          <div className={cn('absolute inset-0 border-x-4 border-b-4 border-black', cardBottomClass)} />

          <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-t-2 border-black/20" />

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center h-full w-full px-6 pt-10">
            <div className={cn('relative mb-4 px-4 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1', labelChipClass)}>
              <h2 className="font-black text-3xl tracking-tighter italic uppercase">
                {isCustom ? 'CUSTOM PACK' : 'ABI PLANER'}
              </h2>
            </div>

            <div className={cn(
              'px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-auto border-4 border-black',
              isCustom ? 'bg-fuchsia-100 text-black' : 'bg-white text-black'
            )}>
              3 Lehrer Karten
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
      className="relative w-64 h-[400px] group transition-all duration-300 group-hover:scale-[1.02]"
      style={{
        filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))',
        perspective: '1000px'
      }}
    >
      <div className="absolute inset-0 flex flex-col h-full w-full">
        <div className="relative w-full h-1/3 z-20 overflow-hidden">
          <div className="absolute inset-0 border-x-4 border-t-4 border-black bg-emerald-600" />

          <div className="absolute top-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-b-2 border-black/20" />

          <div className="absolute inset-0 flex items-center justify-center pt-8">
            <div className="p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
              <ShoppingBag className="h-8 w-8 text-black" />
            </div>
          </div>
        </div>

        <div className="relative w-full h-2/3 z-10 -mt-[1px] overflow-hidden">
          <div className="absolute inset-0 border-x-4 border-b-4 border-black bg-gradient-to-b from-emerald-700 to-teal-900" />

          <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-t-2 border-black/20" />

          <div className="relative z-10 flex flex-col items-center h-full w-full px-6 pt-10">
            <div className="relative mb-4 px-4 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1 bg-white text-black">
              <h2 className="font-black text-3xl tracking-tighter italic uppercase">SHOP</h2>
            </div>

            <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-auto border-4 border-black bg-emerald-100 text-black">
              Neue Booster holen
            </div>

            <div className="w-full flex justify-between items-end pb-12">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-black/40 uppercase">Sammelkarten</span>
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-3 h-1 bg-black/20 rounded-sm" />
                  ))}
                </div>
              </div>

              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                <ShoppingBag className="h-7 w-7 text-black" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SammelkartenPackSelectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('selected')
  const { user, loading } = useAuth()
  const { getRemainingBoosters } = useUserTeachers()
  const { queueEntries, loading: customQueueLoading } = useCustomPackQueue()

  const availablePacks = useMemo(() => {
    const packs = [] as Array<{
      id: string
      name: string
      count: number
      source: 'random' | 'custom'
      queueId?: string
    }>

    const remainingBoosters = Math.max(0, Number(getRemainingBoosters?.() || 0))
    if (remainingBoosters > 0) {
      packs.push({ id: 'random-pack', name: 'Standard Booster', count: remainingBoosters, source: 'random' })
    }

    queueEntries.forEach((entry, index) => {
      packs.push({
        id: entry.id,
        name: `Custom Pack ${index + 1}`,
        count: entry.slots.length,
        source: 'custom',
        queueId: entry.id
      })
    })

    return packs
  }, [getRemainingBoosters, queueEntries])

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
            className="inline-flex items-center gap-2 rounded-full border border-slate-300/90 bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-slate-400 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-300/80 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Sammelkarten</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Wähle dein Pack</h1>
          <p className="mt-3 text-sm text-slate-600">
            Hier siehst du den Shop zuerst und danach alle verfügbaren Booster. Wähle ein Pack aus, um zur Öffnung zurückzukehren.
          </p>
        </div>

        {customQueueLoading ? (
          <div className="rounded-2xl border border-slate-300/80 bg-white/90 p-6 text-sm text-slate-600">
            Lade verfügbare Packs...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/shop?category=sammelkarten"
              className="group w-full rounded-3xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md bg-white/80 border-emerald-300/90"
            >
              <div className="flex flex-col items-center gap-3">
                <ShopPreviewCard />
                <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-slate-700">
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
                  className={cn(
                    'group w-full rounded-3xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md bg-white/80',
                    isSelected
                      ? 'border-sky-400 bg-sky-50/70'
                      : 'border-slate-300/90'
                  )}
                >
                  <div className="flex flex-col items-center gap-3">
                    <PackPreviewCard
                      count={pack.count}
                      source={pack.source}
                      isSelected={isSelected}
                    />
                    <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                      {pack.name}
                    </p>
                  </div>
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
      <div className="container mx-auto py-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Lade Booster-Auswahl...</p>
      </div>
    }>
      <SammelkartenPackSelectionContent />
    </Suspense>
  )
}
