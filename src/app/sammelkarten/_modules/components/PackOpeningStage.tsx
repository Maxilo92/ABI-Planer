import Link from 'next/link'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Gift, Zap } from 'lucide-react'
import { AvailablePack } from '../types'

const RIP_TRIGGER_PROGRESS = 0.8
const RIP_START_ZONE_PROGRESS = 0.2

type PackOpeningStageProps = {
  gameState: 'idle' | 'ripping' | 'revealed'
  getRemainingBoosters: () => number
  getRemainingSupportBoosters: () => number
  isGodpack: boolean
  timeLeft: string
  availablePacks: AvailablePack[]
  selectedPackId: string | null
  handleOpenPack: () => void
}

export function PackOpeningStage(props: PackOpeningStageProps) {
  const { gameState, getRemainingBoosters, getRemainingSupportBoosters, isGodpack, timeLeft, availablePacks, selectedPackId, handleOpenPack } = props
  const [ripProgress, setRipProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isTriggered, setIsTriggered] = useState(false)
  const [shakeTick, setShakeTick] = useState(0)
  const lineRef = useRef<HTMLDivElement | null>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    if (!document.getElementById('ripDragHintAnimation')) {
      const style = document.createElement('style')
      style.id = 'ripDragHintAnimation'
      style.textContent = `
        @keyframes ripDragHint {
          0%, 100% { transform: translateX(0) }
          40%, 60% { transform: translateX(-12px) }
        }
        @keyframes packShake {
          0%, 100% { transform: rotateZ(0deg) }
          25% { transform: rotateZ(-1.5deg) }
          75% { transform: rotateZ(1.5deg) }
        }
      `
      document.head.appendChild(style)
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [])

  useEffect(() => {
    if (gameState === 'revealed') {
      activePointerIdRef.current = null
      hasTriggeredRef.current = false
      setIsDragging(false)
      setIsTriggered(false)
      setRipProgress(0)
    }
  }, [gameState])

  useEffect(() => {
    if (!isDragging) {
      setShakeTick(0)
      return
    }

    let frameId = 0
    const loop = () => {
      setShakeTick((tick) => tick + 1)
      frameId = window.requestAnimationFrame(loop)
    }

    frameId = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(frameId)
  }, [isDragging])

  const getProgressFromClientX = useCallback((clientX: number) => {
    const rect = lineRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return 0

    const localX = clientX - rect.left
    return Math.min(1, Math.max(0, localX / rect.width))
  }, [])

  const handleRipPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (gameState !== 'idle' || isTriggered) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const startProgress = getProgressFromClientX(event.clientX)
    if (startProgress > RIP_START_ZONE_PROGRESS) return

    activePointerIdRef.current = event.pointerId
    hasTriggeredRef.current = false
    setIsDragging(true)
    setRipProgress(startProgress)

    event.currentTarget.setPointerCapture(event.pointerId)
  }, [gameState, getProgressFromClientX, isTriggered])

  const handleRipPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    if (activePointerIdRef.current !== event.pointerId) return
    if (hasTriggeredRef.current) return

    const progress = getProgressFromClientX(event.clientX)
    setRipProgress(progress)

    if (progress >= RIP_TRIGGER_PROGRESS) {
      hasTriggeredRef.current = true
      setIsDragging(false)
      setIsTriggered(true)
      handleOpenPack()
    }
  }, [getProgressFromClientX, handleOpenPack, isDragging])

  const releasePointerIfCaptured = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return

    activePointerIdRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleRipPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    releasePointerIfCaptured(event)
    if (!isDragging || hasTriggeredRef.current) return

    setIsDragging(false)
    setRipProgress(0)
  }, [isDragging, releasePointerIfCaptured])

  const handleRipPointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    releasePointerIfCaptured(event)
    if (hasTriggeredRef.current) return

    setIsDragging(false)
    setRipProgress(0)
  }, [releasePointerIfCaptured])

  if (!(gameState === 'idle' || gameState === 'ripping')) return null

  const totalBoosters = getRemainingBoosters() + getRemainingSupportBoosters()

  if (totalBoosters > 0 || gameState === 'ripping') {
    const packs = availablePacks.length > 0
      ? availablePacks
      : [{ id: 'random', name: 'Booster', count: getRemainingBoosters(), source: 'random' as const }]

    const selectedPack = packs.find((pack) => pack.id === selectedPackId) || packs[0]
    const isCustomPack = selectedPack.source === 'custom'
    const isSupportPack = selectedPack.packId === 'support_vol_1'
    const currentRemaining = isSupportPack ? getRemainingSupportBoosters() : (isCustomPack ? selectedPack.count : getRemainingBoosters())
    
    const cardTopClass = isCustomPack
      ? 'bg-fuchsia-700'
      : isSupportPack
        ? 'bg-emerald-600'
        : isGodpack
          ? 'bg-neutral-950'
          : 'bg-blue-600'
    const cardBottomClass = isCustomPack
      ? 'bg-gradient-to-b from-purple-800 to-fuchsia-900'
      : isSupportPack
        ? 'bg-gradient-to-b from-emerald-700 to-teal-900'
        : isGodpack
          ? 'bg-neutral-900'
          : 'bg-blue-700'
    const iconChipClass = isCustomPack
      ? 'bg-fuchsia-200'
      : isSupportPack
        ? 'bg-emerald-200'
        : isGodpack
          ? 'bg-amber-400'
          : 'bg-white'
    const labelChipClass = isCustomPack
      ? 'bg-fuchsia-500 text-white'
      : isSupportPack
        ? 'bg-emerald-500 text-white'
        : isGodpack
          ? 'bg-amber-500 text-black'
          : 'bg-white text-black'
    const isRipAnimating = gameState === 'ripping' || isTriggered
    const ripLineTop = 'calc(33.333% - 1px)'

    const dragProgress = isDragging ? Math.min(1, Math.max(0, (ripProgress - 0.02) / 0.78)) : 0
    const shakeStrength = isDragging ? Math.min(1, Math.pow(dragProgress, 0.72)) : 0
    const criticalWobble = isDragging ? Math.min(1, Math.max(0, (ripProgress - 0.62) / 0.18)) : 0
    const criticalBurst = Math.pow(criticalWobble, 1.7)
    const shakePhase = shakeTick * (1.05 + shakeStrength * 1.45 + criticalBurst * 0.55)
    const packShakeX = isDragging
      ? Math.sin(shakePhase * 1.9) * (1.4 + shakeStrength * 6 + criticalBurst * 3.2) + Math.sin(shakePhase * 6.1) * criticalBurst * 1.1
      : 0
    const packShakeY = isDragging
      ? -ripProgress * (6 + criticalBurst * 4) + Math.cos(shakePhase * 2.8) * (0.7 + shakeStrength * 2.8 + criticalBurst * 1.8) + Math.sin(shakePhase * 5.2) * criticalBurst * 0.9
      : 0
    const packShakeRotation = isDragging
      ? Math.sin(shakePhase * 2.15) * (0.35 + shakeStrength * 3.5 + criticalBurst * 2.2) + Math.cos(shakePhase * 4.4) * criticalBurst * 0.8
      : 0

    return (
      <div className="absolute z-30 inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-4xl min-h-[440px] px-4 sm:px-8 flex flex-col items-center justify-center gap-3">
          <motion.div
            key={selectedPack.id}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{
              type: 'spring',
              duration: 0.4,
              stiffness: 200,
              damping: 24
            }}
            className={cn(
              'relative w-64 h-[400px] group transition-all duration-500 hover:scale-105',
              isRipAnimating && 'pointer-events-none'
            )}
          >
            <div className="relative h-full w-full" style={{ perspective: '1000px' }}>
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate3d(${packShakeX}px, ${packShakeY}px, 0) rotate(${packShakeRotation}deg) scale(${isDragging ? 1 + ripProgress * 0.035 + criticalBurst * 0.01 : 1})`,
                  filter: `drop-shadow(0 20px ${50 + ripProgress * 12 + criticalBurst * 6}px rgba(0,0,0,${0.5 + ripProgress * 0.1 + criticalBurst * 0.04}))`,
                  willChange: isDragging ? 'transform, filter' : 'auto'
                }}
              >
                {!isRipAnimating && (
                  <div className="absolute left-0 right-0 z-30" style={{ top: ripLineTop }}>
                    <div
                      ref={lineRef}
                      className={cn(
                        'relative h-9 w-full touch-none select-none cursor-grab active:cursor-grabbing',
                        gameState === 'idle' && !isTriggered ? 'pointer-events-auto' : 'pointer-events-none'
                      )}
                      onPointerDown={handleRipPointerDown}
                      onPointerMove={handleRipPointerMove}
                      onPointerUp={handleRipPointerUp}
                      onPointerCancel={handleRipPointerCancel}
                    >
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/80" />
                      <div
                        className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/95 shadow-[0_0_16px_rgba(255,255,255,0.85)]"
                        style={{
                          width: `${ripProgress * 100}%`,
                          transition: isDragging ? 'none' : 'width 220ms cubic-bezier(0.19, 1, 0.22, 1)'
                        }}
                      />
                      <div
                        className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-black bg-white shadow-[0_0_18px_rgba(255,255,255,0.85)]"
                        style={{
                          left: `clamp(0px, calc(${ripProgress * 100}% - 10px), calc(100% - 20px))`,
                          transition: isDragging ? 'none' : 'left 220ms cubic-bezier(0.19, 1, 0.22, 1)',
                          animation: gameState === 'idle' && ripProgress === 0 ? 'ripDragHint 2s ease-in-out 500ms infinite' : 'none'
                        }}
                      />
                    </div>
                  </div>
                  )}
                <div className="absolute inset-0 flex flex-col h-full w-full">
                  <div
                    className={cn(
                      'relative w-full h-1/3 z-20 transition-transform duration-700 ease-in-out overflow-hidden',
                      isRipAnimating && 'animate-rip-top'
                    )}
                  >
                    <div className={cn('absolute inset-0 border-x-4 border-t-4 border-black', cardTopClass)} />

                    <div className="absolute top-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-b-2 border-black/20" />

                    <div className="absolute inset-0 flex items-center justify-center pt-8">
                      <div className={cn('p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]', iconChipClass)}>
                        <Zap className="h-8 w-8 text-black fill-black" />
                      </div>
                  </div>
                  </div>

                  <div
                    className={cn(
                      'relative w-full h-2/3 z-10 transition-transform duration-700 ease-in-out -mt-[1px] overflow-hidden',
                      isRipAnimating && 'animate-rip-bottom'
                    )}
                  >
                    <div className={cn('absolute inset-0 border-x-4 border-b-4 border-black', cardBottomClass)} />

                    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)] border-t-2 border-black/20" />

                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center h-full w-full px-6 pt-10">
                      <div className={cn('relative mb-4 px-4 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1', labelChipClass)}>
                        <h2 className="font-black text-3xl tracking-tighter italic uppercase">
                          {isCustomPack ? 'CUSTOM PACK' : isSupportPack ? 'SUPPORT VOL. 1' : 'ABI PLANER'}
                        </h2>
                        {isGodpack && !isCustomPack && (
                          <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full border-2 border-black animate-bounce shadow-md">
                            GOD!
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        'px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-auto border-4 border-black',
                        isCustomPack ? 'bg-fuchsia-100 text-black' : isSupportPack ? 'bg-emerald-100 text-black' : isGodpack ? 'bg-amber-500 text-black' : 'bg-white text-black'
                      )}>
                        {isGodpack ? 'SPECIAL EDITION' : isSupportPack ? '1 Support Karte' : '3 Lehrer Karten'}
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
                          <Gift className="h-7 w-7 text-black fill-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    )
  }

  return (
    <div className="absolute z-30 w-64 h-[400px] flex items-center justify-center animate-in fade-in duration-1000">
      <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-8 rounded-[2.5rem] border-0 bg-background shadow-[inset_0_12px_12px_-6px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_12px_24px_-10px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/[0.05] to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-8 opacity-25 dark:opacity-10 flex justify-center">
            <Zap className="h-16 w-16 text-foreground" strokeWidth={0.5} />
          </div>

          <div className="space-y-1 mb-8">
            <p className="text-foreground/40 text-[10px] font-black uppercase tracking-[0.3em]">Nächste Packs in</p>
          </div>

          <div className="mb-12">
            <p className="text-foreground font-mono text-4xl font-light tracking-tighter">{timeLeft}</p>
          </div>

          <Link href="/shop?category=sammelkarten" className="w-full max-w-[160px] block mx-auto">
            <Button
              variant="default"
              className="w-full rounded-2xl bg-neutral-900 dark:bg-blue-600 text-white dark:text-white hover:bg-neutral-800 dark:hover:bg-blue-700 transition-all text-[11px] h-12 font-black uppercase tracking-[0.2em] shadow-xl"
            >
              Shop besuchen
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
