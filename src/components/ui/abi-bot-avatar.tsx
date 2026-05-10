'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { AVATAR_PALETTE } from '@/lib/avatar'

interface AbiBotAvatarProps {
  className?: string
  size?: number // This will be used for internal canvas resolution
}

export function AbiBotAvatar({ 
  className, 
  size = 64
}: AbiBotAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef<Array<Array<{ 
    colorIndex: number; 
    targetColorIndex: number; 
    transition: number; 
    speed: number;
    active: boolean;
  }>>>([])

  useEffect(() => {
    // Initialize symmetric grid (8x8)
    const size_grid = 8
    const halfSize = size_grid / 2
    const grid = []

    for (let y = 0; y < size_grid; y++) {
      const row = []
      for (let x = 0; x < halfSize; x++) {
        const colorIndex = Math.floor(Math.random() * AVATAR_PALETTE.length)
        row.push({
          colorIndex,
          targetColorIndex: colorIndex,
          transition: 1,
          speed: 0.02 + Math.random() * 0.05,
          active: Math.random() > 0.3
        })
      }
      grid.push(row)
    }
    gridRef.current = grid

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const pSize = canvas.width / size_grid

      for (let y = 0; y < size_grid; y++) {
        for (let x = 0; x < halfSize; x++) {
          const cell = gridRef.current[y][x]

          if (cell.transition >= 1) {
            if (Math.random() > 0.98) {
              cell.targetColorIndex = Math.floor(Math.random() * AVATAR_PALETTE.length)
              cell.transition = 0
              cell.speed = 0.01 + Math.random() * 0.04
              if (Math.random() > 0.8) {
                cell.active = !cell.active
              }
            }
          } else {
            cell.transition += cell.speed
          }

          if (!cell.active && cell.transition >= 1) continue

          const targetColor = AVATAR_PALETTE[cell.targetColorIndex]
          
          ctx.globalAlpha = cell.active ? Math.min(1, cell.transition + 0.5) : (1 - cell.transition)
          
          if (cell.transition >= 1) {
            cell.colorIndex = cell.targetColorIndex
            ctx.fillStyle = targetColor
          } else {
            ctx.fillStyle = targetColor
          }

          ctx.fillRect(x * pSize, y * pSize, pSize, pSize)
          const mirroredX = size_grid - 1 - x
          ctx.fillRect(mirroredX * pSize, y * pSize, pSize, pSize)
          
          ctx.globalAlpha = 1.0
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className={cn("relative overflow-hidden rounded-full border border-border shadow-inner bg-muted/10 shrink-0", className)}>
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />
    </div>
  )
}
