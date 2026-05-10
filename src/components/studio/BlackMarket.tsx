'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ShoppingCart, ChevronDown } from 'lucide-react'

const T = 'transparent'
const C: Record<string, string> = {
  '_': T,
  'W': '#e2e8f0', 'M': '#94a3b8', 'D': '#475569', 'K': '#0f172a',
  'R': '#ef4444', 'r': '#991b1b',
  'O': '#f97316', 'o': '#c2410c',
  'Y': '#eab308', 'y': '#713f12',
  'G': '#22c55e', 'g': '#166534',
  'B': '#3b82f6', 'b': '#1e3a8a',
  'P': '#a855f7', 'p': '#581c87',
  'C': '#06b6d4', 'c': '#0e7490',
  'L': '#ec4899', 'l': '#9d174d',
  'N': '#f59e0b', 'n': '#92400e',
  'V': '#8b5cf6', 'v': '#4c1d95',
  'T': '#14b8a6', 't': '#0f766e',
}
const dec = (s: string) => s.split('').map(ch => C[ch] ?? T)

export const MARKET_TEMPLATES: { name: string; tag: string; pixels: string[] }[] = [
  // ── DARK ──────────────────────────────────────────────────────────────────
  {
    name: 'SKULL',
    tag: 'DARK',
    pixels: dec(
      '_WW__WW_' + // lobes symmetric at 1-2, 5-6
      'WWWWWWWW' +
      'W_WWWW_W' + // eyes at 1,6
      'WWWWWWWW' +
      '_WWWWWW_' + // 1-6
      '__WWWW__' + // 2-5
      '_W_WW_W_' + // teeth
      '__W__W__'   // jaw
    ),
  },
  {
    name: 'GHOST',
    tag: 'DARK',
    pixels: dec(
      '__WWWW__' + // 2-5
      '_WWWWWW_' + // 1-6
      'WWWWWWWW' +
      'WKW__WKW' + // eyes K at 1,6; gap 3-4
      'WWWWWWWW' +
      'WWWWWWWW' +
      'W_W__W_W' + // bumps at 0,2,5,7
      '________'
    ),
  },
  {
    name: 'SNAKE',
    tag: 'DARK',
    pixels: dec(
      '_GGGGG__' + // 1-5
      'G_____G_' + // wall
      'G_GGGGG_' + // wall+inner
      'G_G_____' +
      'GGGGG_G_' +
      '_____G_G' + // mirror
      '_GGGGG_G' +
      '____G___'   // tail center-ish
    ),
  },
  {
    name: 'POISON',
    tag: 'DARK',
    pixels: dec(
      '___PP___' + // 3-4
      '__PPPP__' + // 2-5
      '_PP__PP_' + // 1-2, 5-6
      '_PPPPPP_' + // 1-6
      '__P__P__' + // 2, 5
      '__PPPP__' + // 2-5
      '___PP___' + // 3-4
      '________'
    ),
  },
  // ── RARE ──────────────────────────────────────────────────────────────────
  {
    name: 'HEART',
    tag: 'RARE',
    pixels: dec(
      '_RR__RR_' + // 1-2, 5-6
      'RRRRRRRR' +
      'RRRRRRRR' +
      '_RRRRRR_' + // 1-6
      '__RRRR__' + // 2-5
      '___RR___' + // 3-4
      '___RR___' + // 3-4 (2 wide stays centered)
      '________'
    ),
  },
  {
    name: 'DIAMOND',
    tag: 'RARE',
    pixels: dec(
      '___CC___' + // 3-4
      '__CCCC__' + // 2-5
      '_CCCCCC_' + // 1-6
      'CCCCCCCC' +
      '_CCCCCC_' + // 1-6
      '__CCCC__' + // 2-5
      '___CC___' + // 3-4
      '________'
    ),
  },
  {
    name: 'STAR',
    tag: 'RARE',
    pixels: dec(
      '___YY___' + // 3-4
      '_Y_YY_Y_' + // diagonal
      'YYYYYYYY' +
      '_YYYYYY_' + // 1-6
      'YYYYYYYY' +
      '_Y_YY_Y_' + // diagonal
      '___YY___' + // 3-4
      '________'
    ),
  },
  {
    name: 'WAVE',
    tag: 'RARE',
    pixels: dec(
      '_CC__CC_' + // 1-2, 5-6
      'CC_CC_CC' +
      'C__CC__C' + // 0, 3-4, 7
      '__CCCC__' + // 2-5
      'C__CC__C' +
      'CC_CC_CC' +
      '_CC__CC_' +
      '________'
    ),
  },
  {
    name: 'SHIELD',
    tag: 'RARE',
    pixels: dec(
      '_BBBBBB_' + // 1-6
      'BBBBBBBB' +
      'BB_BB_BB' + // cross detail
      'BBBBBBBB' +
      '_BBBBBB_' + // 1-6
      '__BBBB__' + // 2-5
      '___BB___' + // 3-4
      '____B___'   // 4 – tip (slight off but best we can do)
    ),
  },
  {
    name: 'CRYSTAL',
    tag: 'RARE',
    pixels: dec(
      '___CC___' + // 3-4
      '__CCCC__' + // 2-5
      '_BCCCCB_' + // 1-6 with facets
      'BBCCCCBB' +
      '_BBBBBB_' + // 1-6
      '__BBBB__' + // 2-5
      '___BB___' + // 3-4
      '________'
    ),
  },
  // ── EPIC ──────────────────────────────────────────────────────────────────
  {
    name: 'LIGHTNING',
    tag: 'EPIC',
    pixels: dec(
      '__YYYY__' + // 2-5
      '__YYY___' + // 2-4
      '_YYYYY__' + // 1-5
      'YYYYYYYY' +
      '__YYYYY_' + // 2-6
      '___YYY__' + // 3-5
      '__YYYY__' + // 2-5
      '________'
    ),
  },
  {
    name: 'FLAME',
    tag: 'EPIC',
    pixels: dec(
      '___YY___' + // 3-4
      '__YYYY__' + // 2-5
      '_YYYYYY_' + // 1-6
      '_YORROY_' + // 1-6 with hot core
      '_OORROO_' + // 1-6
      '__RRRR__' + // 2-5
      '__RRRR__' + // 2-5
      '________'
    ),
  },
  {
    name: 'ROCKET',
    tag: 'EPIC',
    pixels: dec(
      '___BB___' + // 3-4 nose
      '__BBBB__' + // 2-5 body
      '__BBBB__' + // 2-5
      '__BBBB__' + // 2-5
      '_BBBBBB_' + // 1-6 with fins
      'BB_BB_BB' + // 0-1, 3-4, 6-7 fins
      '__OOOO__' + // 2-5 exhaust
      '__RRRR__'   // 2-5 flame
    ),
  },
  {
    name: 'ALIEN',
    tag: 'EPIC',
    pixels: dec(
      '_GG__GG_' + // antennae 1-2, 5-6
      'GGGGGGGG' +
      'GKG__GKG' + // eyes K at 1, 6 – gap 3-4
      'GGGGGGGG' +
      '_GGGGGG_' + // 1-6
      '__G__G__' + // legs 2, 5
      '__G__G__' +
      '________'
    ),
  },
  {
    name: 'MUSHROOM',
    tag: 'EPIC',
    pixels: dec(
      '__RRRR__' + // 2-5
      '_RRRRRR_' + // 1-6
      'RRRRRRRR' +
      'RW_RR_WR' + // dots W at 1,6
      'RRRRRRRR' +
      '_NNNNNN_' + // stem 1-6
      '_NNNNNN_' +
      '________'
    ),
  },
  {
    name: 'MATRIX',
    tag: 'EPIC',
    pixels: dec(
      'G_G__G_G' + // 0,2,5,7
      '_G_GG_G_' + // 1,3-4,6
      'G_GGGG_G' + // 0, 2-5, 7
      '_GGGGGG_' + // 1-6
      'G_GGGG_G' +
      '_G_GG_G_' +
      'G_G__G_G' +
      '________'
    ),
  },
  // ── LEGENDARY ─────────────────────────────────────────────────────────────
  {
    name: 'CROWN',
    tag: 'LEGENDARY',
    pixels: dec(
      'Y__YY__Y' + // points at 0, 3-4, 7 – symmetric!
      'Y__YY__Y' +
      'YY_YY_YY' + // 0-1, 3-4, 6-7
      'YYYYYYYY' +
      'YYYYYYYY' +
      'YYYYYYYY' +
      '_YYYYYY_' + // 1-6
      '________'
    ),
  },
  {
    name: 'GALAXY',
    tag: 'LEGENDARY',
    pixels: dec(
      '_P____P_' + // 1, 6
      '__B__B__' + // 2, 5
      '_BBPPBB_' + // 1-6
      'PPYYYYPP' + // center gold
      '_BBPPBB_' +
      '__B__B__' +
      '_P____P_' +
      '________'
    ),
  },
  {
    name: 'PLANET',
    tag: 'LEGENDARY',
    pixels: dec(
      '__CCCC__' + // 2-5
      '_CCGCCC_' + // 1-6 land spot
      'CCCGGCCC' + // 0-7
      'CGGGGGCC' + // 0-7
      'CCGGGGCC' + // 0-7
      '_CCCCCC_' + // 1-6
      '__CCCC__' + // 2-5
      '________'
    ),
  },
  {
    name: 'PORTAL',
    tag: 'LEGENDARY',
    pixels: dec(
      '__PPPP__' + // 2-5
      '_PV__VP_' + // 1-6, gap 2-3 inner
      'PV____VP' + // 0-7
      'PV_PP_VP' + // center spark
      'PV____VP' +
      '_PV__VP_' +
      '__PPPP__' +
      '________'
    ),
  },
  {
    name: 'SUN',
    tag: 'LEGENDARY',
    pixels: dec(
      '_Y_YY_Y_' + // rays at 1, 3-4, 6
      '__YYYY__' + // 2-5
      'YYYYYYYY' +
      'YYNNNNYY' + // N=amber core
      'YYYYYYYY' +
      '__YYYY__' +
      '_Y_YY_Y_' +
      '________'
    ),
  },
]

function TinyPreview({ pixels }: { pixels: string[] }) {
  const rects = pixels.map((c, i) =>
    c === T ? '' : `<rect x="${i % 8}" y="${Math.floor(i / 8)}" width="1" height="1" fill="${c}"/>`
  ).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">${rects}</svg>`
  const url = typeof window !== 'undefined' ? `data:image/svg+xml;base64,${btoa(svg)}` : ''
  return <img src={url} alt="" className="w-12 h-12 rounded-lg" style={{ imageRendering: 'pixelated' }} />
}

const TAG_STYLE: Record<string, string> = {
  DARK:      'bg-zinc-800 text-zinc-300',
  RARE:      'bg-blue-950 text-blue-400',
  EPIC:      'bg-purple-950 text-purple-300',
  LEGENDARY: 'bg-amber-950 text-amber-400',
}

export function BlackMarket({ onApply }: { onApply: (pixels: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)

  const apply = (name: string, pixels: string[]) => {
    if (confirm === name) {
      onApply(pixels)
      setConfirm(null)
    } else {
      setConfirm(name)
      setTimeout(() => setConfirm(c => c === name ? null : c), 2500)
    }
  }

  return (
    <div className="bg-zinc-950 rounded-2xl border border-zinc-800/80 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">🕶 Black Market</span>
          <span className="text-[10px] font-mono text-zinc-600">// {MARKET_TEMPLATES.length} Vorlagen</span>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-zinc-600 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="p-3 border-t border-zinc-800/60 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {MARKET_TEMPLATES.map(({ name, tag, pixels }) => (
            <button
              key={name}
              onClick={() => apply(name, pixels)}
              className={cn(
                'relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all',
                confirm === name
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800'
              )}
            >
              <TinyPreview pixels={pixels} />
              <p className="text-[9px] font-black tracking-wider text-zinc-200">{name}</p>
              <span className={cn('text-[8px] font-mono px-1 py-0.5 rounded uppercase tracking-widest', TAG_STYLE[tag] ?? TAG_STYLE.DARK)}>
                {tag}
              </span>
              {confirm === name && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
                  <span className="text-[9px] font-black text-amber-400 text-center px-1">Nochmal<br/>→ Laden</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
