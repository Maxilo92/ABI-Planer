'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { AVATAR_PALETTE } from '@/lib/avatar'
import { verifyStudioCode } from '@/lib/studio-code'
import { AnimatedNftAvatar } from '@/components/ui/animated-nft-avatar'
import { toast } from 'sonner'
import { Undo2, Trash2, Shuffle, Save, Eraser, Paintbrush, FlipHorizontal, Lock, ChevronLeft, LogOut } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BlackMarket } from '@/components/studio/BlackMarket'

const GRID = 8
const TRANSPARENT = 'transparent'
const EMPTY_GRID: string[] = Array(64).fill(TRANSPARENT)
const SESSION_KEY = 'abi_studio_unlocked'
const MAX_ATTEMPTS = 4


// ── Kernel-Sequenz gate ───────────────────────────────────────────────────────
const GATE_LINES = [
  'SYSTEM: PERSÖNLICHE AUTHENTIFIZIERUNG ERFORDERLICH',
  '',
  '"Jeder Nutzer trägt seinen Schlüssel in sich.',
  ' Er steckt tief in den Metadaten',
  ' deiner digitalen Identität.',
  ' Finde deine Kernel-Sequenz."',
  '',
]

function RiddleGate({ uid, onUnlock }: { uid: string; onUnlock: () => void }) {
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<'typing' | 'idle' | 'wrong' | 'cooldown' | 'granting'>('typing')
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS)
  const [cooldown, setCooldown] = useState(0)
  const [lineIdx, setLineIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (lineIdx >= GATE_LINES.length) { setTimeout(() => { setPhase('idle'); inputRef.current?.focus() }, 100); return }
    const t = setTimeout(() => setLineIdx(l => l + 1), 220)
    return () => clearTimeout(t)
  }, [lineIdx])

  useEffect(() => {
    if (phase !== 'cooldown') return
    if (cooldown <= 0) { setPhase('idle'); setAttempts(MAX_ATTEMPTS); return }
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, cooldown])

  const submit = () => {
    if (phase !== 'idle') return
    if (verifyStudioCode(uid, input)) {
      setPhase('granting')
      setTimeout(() => { sessionStorage.setItem(SESSION_KEY, '1'); onUnlock() }, 1800)
      return
    }
    const left = attempts - 1
    setAttempts(left)
    setPhase('wrong')
    setInput('')
    setTimeout(() => {
      if (left <= 0) { setPhase('cooldown'); setCooldown(45) }
      else { setPhase('idle'); inputRef.current?.focus() }
    }, 600)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,#000 0,#000 1px,transparent 1px,transparent 3px)' }} />
      <div className="w-full max-w-lg z-10 space-y-1">
        <p className="text-green-700 text-[10px] tracking-[0.3em] uppercase mb-6">ABI PLANER // LAB-01 // CLASSIFIED</p>
        {GATE_LINES.slice(0, lineIdx).map((line, i) => (
          <div key={i} className={cn('text-sm leading-relaxed',
            i === 0 ? 'text-red-400 font-bold' : 'text-green-300/80', !line && 'h-3')}>
            {line || <>&nbsp;</>}
          </div>
        ))}
        {lineIdx >= GATE_LINES.length && phase !== 'granting' && (
          <>
            <div className={cn('flex items-center gap-2 mt-5',
              phase === 'wrong' && 'animate-[wiggle_0.5s_ease-in-out]')}>
              <span className="text-green-400 shrink-0">
                {phase === 'cooldown' ? `> GESPERRT (${cooldown}s)` : '>'}
              </span>
              {phase !== 'cooldown' ? (
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="off" spellCheck={false}
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-green-200 caret-green-400 text-sm font-mono tracking-widest uppercase"
                  placeholder="XXXX-XXXX-0000" maxLength={20} />
              ) : (
                <span className="text-red-400 text-sm">Zu viele Fehlversuche. Warte {cooldown}s.</span>
              )}
            </div>
            {phase === 'wrong' && <p className="text-red-500/70 text-[11px] mt-1">Falsche Sequenz. Versuche übrig: {attempts}</p>}
            {phase === 'idle' && <p className="text-zinc-700 text-[10px] mt-6">[ Enter ↵ zum Bestätigen ]</p>}
          </>
        )}
        {phase === 'granting' && (
          <div className="mt-6 space-y-1">
            <p className="text-green-400 font-bold animate-pulse">✓ SEQUENZ VERIFIZIERT. ZUGANG GEWÄHRT.</p>
            <p className="text-green-600 text-sm">Geheimes Labor wird initialisiert...</p>
          </div>
        )}
      </div>
      <Link href="/profil" className="absolute top-4 left-4 text-zinc-700 hover:text-zinc-500 text-xs flex items-center gap-1 transition-colors">
        <ChevronLeft className="w-3 h-3" /> zurück
      </Link>
    </div>
  )
}

function buildSvg(pixels: string[]): string {
  const bs = 8
  let r = ''
  pixels.forEach((c, i) => {
    if (!c || c === TRANSPARENT) return
    r += `<rect x="${(i % GRID) * bs}" y="${Math.floor(i / GRID) * bs}" width="${bs}" height="${bs}" fill="${c}" />`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${r}</svg>`
}
const enc = (svg: string) => typeof window !== 'undefined' ? `data:image/svg+xml;base64,${window.btoa(svg)}` : ''

function floodFill(pixels: string[], idx: number, fill: string): string[] {
  const target = pixels[idx]
  if (target === fill) return pixels
  const next = [...pixels]
  const stack = [idx]
  while (stack.length) {
    const i = stack.pop()!
    if (i < 0 || i >= 64 || next[i] !== target) continue
    next[i] = fill
    const row = Math.floor(i / GRID), col = i % GRID
    if (col > 0) stack.push(i - 1)
    if (col < 7) stack.push(i + 1)
    if (row > 0) stack.push(i - GRID)
    if (row < 7) stack.push(i + GRID)
  }
  return next
}

function randomize(sym: boolean): string[] {
  const p = Array.from({ length: 64 }, () =>
    Math.random() > 0.35 ? AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)] : TRANSPARENT)
  if (sym) for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) p[r * 8 + (7 - c)] = p[r * 8 + c]
  return p
}

// ── Global studio theme ───────────────────────────────────────────────────────
function useStudioTheme() {
  useEffect(() => {
    const root = document.documentElement
    const prevClass = root.getAttribute('class') || ''
    root.classList.add('dark')
    const overrides: [string, string][] = [
      ['--background', '224 27% 5%'],
      ['--foreground', '120 10% 88%'],
      ['--card', '224 20% 8%'],
      ['--card-foreground', '120 10% 88%'],
      ['--border', '224 15% 14%'],
      ['--muted', '224 18% 12%'],
      ['--muted-foreground', '214 12% 55%'],
      ['--primary', '142 70% 42%'],
      ['--primary-foreground', '142 100% 5%'],
      ['--secondary', '224 18% 14%'],
      ['--secondary-foreground', '120 10% 88%'],
      ['--accent', '224 18% 14%'],
      ['--brand-accent', '#22c55e'],
      ['--brand-accent-foreground', '#052e16'],
    ]
    overrides.forEach(([k, v]) => root.style.setProperty(k, v))
    return () => {
      root.setAttribute('class', prevClass)
      overrides.forEach(([k]) => root.style.removeProperty(k))
    }
  }, [])
}


// ── Editor ────────────────────────────────────────────────────────────────────
type Tool = 'pencil' | 'eraser' | 'fill'

function AvatarEditor() {
  const { user } = useAuth()
  const [pixels, setPixels] = useState<string[]>(EMPTY_GRID)
  const [history, setHistory] = useState<string[][]>([EMPTY_GRID])
  const [color, setColor] = useState(AVATAR_PALETTE[0])
  const [tool, setTool] = useState<Tool>('pencil')
  const [sym, setSym] = useState(true)
  const [painting, setPainting] = useState(false)
  const [saving, setSaving] = useState(false)
  const last = useRef(-1)

  const push = useCallback((next: string[]) => {
    setHistory(h => [...h.slice(-19), next]); setPixels(next)
  }, [])

  const paint = useCallback((idx: number) => {
    if (idx === last.current) return
    last.current = idx
    setPixels(prev => {
      const c = tool === 'eraser' ? TRANSPARENT : color
      const n = [...prev]
      n[idx] = c
      if (sym) { const row = Math.floor(idx / 8), col = idx % 8, m = 7 - col; if (m !== col) n[row * 8 + m] = c }
      return n
    })
  }, [tool, color, sym])

  const commit = useCallback(() => {
    setHistory(h => [...h.slice(-19), pixels]); last.current = -1
  }, [pixels])

  const undo = useCallback(() => {
    setHistory(h => { if (h.length <= 1) return h; const n = h.slice(0, -1); setPixels(n[n.length - 1]); return n })
  }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
      if (e.key === 'p') setTool('pencil')
      if (e.key === 'e') setTool('eraser')
      if (e.key === 'f') setTool('fill')
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [undo])

  const pDown = (idx: number) => (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId); setPainting(true)
    if (tool === 'fill') { push(floodFill(pixels, idx, color)); return }
    paint(idx)
  }
  const pEnter = (idx: number) => () => { if (painting && tool !== 'fill') paint(idx) }
  const pUp = () => { if (painting) { commit(); setPainting(false) } }

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        photo_url: enc(buildSvg(pixels)),
        'cosmetics.pixel_avatar_mode': 'custom',
        'cosmetics.pixel_avatar_seed': null,
      })
      toast.success('Avatar gespeichert!')
    } catch { toast.error('Fehler beim Speichern.') }
    finally { setSaving(false) }
  }

  const handleLogout = async () => {
    sessionStorage.removeItem('abi_studio_unlocked')
    await signOut(auth)
  }

  const previewUrl = enc(buildSvg(pixels))
  const isEmpty = pixels.every(p => p === TRANSPARENT)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,#000 0,#000 1px,transparent 1px,transparent 3px)' }} />

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/profil" className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Lock className="w-2.5 h-2.5 text-green-400 shrink-0" />
              <span className="text-[8px] sm:text-[9px] font-mono text-green-400 uppercase tracking-[0.2em] truncate">CLASSIFIED · LAB-01</span>
            </div>
            <h1 className="text-base sm:text-xl font-black tracking-tighter">Avatar<span className="text-green-400">Studio</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={save} disabled={saving || isEmpty}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              isEmpty ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/20')}>
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{saving ? 'Speichert...' : 'Als Profilbild'}</span>
            <span className="sm:hidden">{saving ? '...' : 'Speichern'}</span>
          </button>
          <button
            onClick={handleLogout}
            title="Abmelden"
            className="p-2 rounded-xl border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-900/60 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 sm:gap-8">

          {/* Editor col */}
          <div className="space-y-4">
            {/* Toolbar row 1: tools + symmetry */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                {([['pencil', <Paintbrush key="p" className="w-4 h-4" />, 'P'],
                   ['eraser', <Eraser key="e" className="w-4 h-4" />, 'E'],
                   ['fill',   <span key="f" className="text-base leading-none">⬛</span>, 'F']] as const).map(([id, icon, key]) => (
                  <button key={id} onClick={() => setTool(id as Tool)} title={`${id} (${key})`}
                    className={cn('px-2.5 py-2 rounded-lg transition-all',
                      tool === id ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800')}>
                    {icon}
                  </button>
                ))}
              </div>
              <button onClick={() => setSym(s => !s)}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all',
                  sym ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                <FlipHorizontal className="w-4 h-4" /><span className="hidden sm:inline">Spiegel</span>
              </button>
              <div className="flex-1" />
              <button onClick={() => push(randomize(sym))} className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all" title="Zufällig"><Shuffle className="w-4 h-4" /></button>
              <button onClick={undo} disabled={history.length <= 1} className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-all" title="Rückgängig"><Undo2 className="w-4 h-4" /></button>
              <button onClick={() => push(EMPTY_GRID)} className="p-2 rounded-xl border border-red-900/60 text-red-500 hover:bg-red-500/10 transition-all" title="Löschen"><Trash2 className="w-4 h-4" /></button>
            </div>

            {/* Color palette */}
            <div className="p-3 sm:p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2.5">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Farben</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {AVATAR_PALETTE.map(c => (
                  <button key={c} onClick={() => { setColor(c); setTool('pencil') }}
                    className={cn('w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 transition-all hover:scale-110',
                      color === c && tool !== 'eraser' ? 'border-green-400 scale-110 ring-2 ring-green-400/40' : 'border-zinc-700')}
                    style={{ backgroundColor: c }} title={c} />
                ))}
                <button onClick={() => setTool('eraser')}
                  className={cn('w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 transition-all hover:scale-110 flex items-center justify-center',
                    tool === 'eraser' ? 'border-green-400 scale-110 ring-2 ring-green-400/40' : 'border-zinc-700')}
                  style={{ background: 'repeating-conic-gradient(#333 0% 25%,#222 0% 50%) 0 0/8px 8px' }}>
                  <Eraser className="w-3 h-3 text-zinc-400" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded border border-zinc-700"
                  style={{ background: tool === 'eraser' ? 'repeating-conic-gradient(#333 0% 25%,#222 0% 50%) 0 0/6px 6px' : color }} />
                <span className="text-[11px] font-mono text-zinc-400">{tool === 'eraser' ? 'RADIERER' : color.toUpperCase()}</span>
              </div>
            </div>

            {/* Canvas – full width, square */}
            <div className="select-none touch-none bg-zinc-900 rounded-2xl border border-zinc-800 w-full p-3 sm:p-4"
              onPointerUp={pUp} onPointerLeave={pUp}>
              <div className="grid border border-zinc-700 rounded-lg overflow-hidden w-full"
                style={{ gridTemplateColumns: `repeat(${GRID},1fr)`, aspectRatio: '1' }}>
                {pixels.map((c, i) => (
                  <div key={i} onPointerDown={pDown(i)} onPointerEnter={pEnter(i)}
                    className="border border-zinc-800/40 cursor-crosshair hover:brightness-110 hover:ring-1 hover:ring-green-400/30 hover:ring-inset"
                    style={{ background: c !== TRANSPARENT ? c : 'repeating-conic-gradient(#1e1e1e 0% 25%,#171717 0% 50%) 0 0/6px 6px' }} />
                ))}
              </div>
            </div>
            <p className="text-[10px] font-mono text-zinc-600 hidden sm:block">P = Stift · E = Radierer · F = Füllen · Ctrl+Z = Rückgängig</p>

            {/* ── BLACK MARKET ── */}
            <BlackMarket onApply={(tpl) => push(tpl)} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-3">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Live-Vorschau</p>
              <div className="flex flex-col items-center gap-3">
                {isEmpty
                  ? <div className="w-28 h-28 rounded-2xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center"><span className="text-zinc-600 text-xs font-mono">LEER</span></div>
                  : <AnimatedNftAvatar url={previewUrl} size={256} className="w-28 h-28 rounded-2xl shadow-xl shadow-green-500/10" />}
              </div>
              {!isEmpty && (
                <div className="flex items-end justify-center gap-2 pt-2 border-t border-zinc-800">
                  {[8, 10, 12, 16].map(s => (
                    <AnimatedNftAvatar key={s} url={previewUrl} size={64} className={`w-${s} h-${s} rounded-lg`} />
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 font-mono text-xs space-y-2">
              <p className="text-zinc-500 uppercase tracking-widest text-[10px]">Stats</p>
              {[
                ['Gefüllte Pixel', `${pixels.filter(p => p !== TRANSPARENT).length} / 64`],
                ['Farben', `${new Set(pixels.filter(p => p !== TRANSPARENT)).size}`],
                ['Symmetrie', sym ? 'AN' : 'AUS'],
                ['History', `${history.length}`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-zinc-400"><span>{l}</span><span className="text-green-400">{v}</span></div>
              ))}
            </div>
            <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/20 text-xs font-mono text-green-500/70 space-y-1">
              <p className="text-green-400 font-black">// GEHEIMES LABOR</p>
              <p>Du hast das Rätsel gelöst. Nur wenige kennen diesen Ort.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AvatarStudioPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [unlocked, setUnlocked] = useState<boolean | null>(null)

  useStudioTheme()

  useEffect(() => {
    if (!loading && !user) { router.push('/login?reason=unauthorized'); return }
    if (user) setUnlocked(sessionStorage.getItem(SESSION_KEY) === '1')
  }, [loading, user, router])

  if (loading || unlocked === null) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-2 h-4 bg-green-400 animate-pulse font-mono" />
    </div>
  )

  return unlocked ? <AvatarEditor /> : <RiddleGate uid={user!.uid} onUnlock={() => setUnlocked(true)} />


}
