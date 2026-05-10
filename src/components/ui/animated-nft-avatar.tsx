'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedNftAvatarProps {
  /** The SVG data-URL from the user profile (data:image/svg+xml;base64,...) */
  url: string
  className?: string
  /** Internal canvas resolution (default: 64) */
  size?: number
}

/**
 * Parses an 8x8 symmetric SVG pixel avatar (base64 encoded) and returns
 * a flat array of 64 hex color strings (row-major, left to right, top to bottom).
 * Falls back to transparent for any unreadable cells.
 */
function parseSvgPixels(dataUrl: string): string[] {
  try {
    const base64 = dataUrl.replace('data:image/svg+xml;base64,', '')
    const svg = typeof window !== 'undefined'
      ? window.atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8')

    const parser = new DOMParser()
    const doc = parser.parseFromString(svg, 'image/svg+xml')
    const rects = Array.from(doc.querySelectorAll('rect'))

    // Build a map: "x,y" -> fill color
    const colorMap = new Map<string, string>()
    for (const rect of rects) {
      const x = Math.round(parseFloat(rect.getAttribute('x') || '0'))
      const y = Math.round(parseFloat(rect.getAttribute('y') || '0'))
      const fill = rect.getAttribute('fill') || '#000000'
      colorMap.set(`${x},${y}`, fill)
    }

    // The SVG uses 8x8 grid with blockSize = 8px each (64/8 = 8)
    const blockSize = 8
    const grid: string[] = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const key = `${col * blockSize},${row * blockSize}`
        grid.push(colorMap.get(key) || 'transparent')
      }
    }
    return grid
  } catch {
    return Array(64).fill('transparent')
  }
}

export function AnimatedNftAvatar({
  url,
  className,
  size = 64,
}: AnimatedNftAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Parse the original pixel colors once per URL
  const originalPixels = useMemo(() => {
    if (!url || !url.startsWith('data:image/svg+xml;base64,')) return null
    return parseSvgPixels(url)
  }, [url])

  useEffect(() => {
    if (!originalPixels) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const GRID = 8

    // Per-cell animation state: how much to brighten/darken right now
    type CellState = {
      shimmer: number        // current alpha multiplier [0..1], applied on top of the base color
      targetShimmer: number
      speed: number
    }

    const cells: CellState[] = originalPixels.map(() => ({
      shimmer: 1,
      targetShimmer: 1,
      speed: 0.015 + Math.random() * 0.03,
    }))

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const pSize = canvas.width / GRID

      for (let i = 0; i < 64; i++) {
        const row = Math.floor(i / GRID)
        const col = i % GRID
        const cell = cells[i]
        const baseColor = originalPixels[i]

        if (baseColor === 'transparent') continue

        // Occasionally trigger a shimmer pulse
        if (Math.abs(cell.shimmer - cell.targetShimmer) < 0.01) {
          if (Math.random() > 0.992) {
            // Flicker: go to a random dimmed or boosted value
            cell.targetShimmer = 0.3 + Math.random() * 0.8
            cell.speed = 0.01 + Math.random() * 0.04
          } else {
            cell.targetShimmer = 1.0
          }
        }

        // Ease towards target
        cell.shimmer += (cell.targetShimmer - cell.shimmer) * cell.speed

        ctx.globalAlpha = Math.max(0, Math.min(1, cell.shimmer))
        ctx.fillStyle = baseColor
        ctx.fillRect(col * pSize, row * pSize, pSize, pSize)
        ctx.globalAlpha = 1
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationFrameId)
  }, [originalPixels])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full border border-border shadow-inner bg-muted/10 shrink-0',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Same glass sheen as the bot avatar */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />
    </div>
  )
}
