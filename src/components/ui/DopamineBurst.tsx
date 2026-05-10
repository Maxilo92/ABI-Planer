'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ParticleProps {
  id: number
  color: string
  shape: 'circle' | 'square' | 'star'
  angle: number
  distance: number
  size: number
  duration: number
}

const SHAPES: ('circle' | 'square' | 'star')[] = ['circle', 'square', 'star']
const COLORS = [
  '#FFD700', // Gold
  '#FF6347', // Tomato
  '#00CED1', // DarkTurquoise
  '#9370DB', // MediumSlateBlue
  '#32CD32', // LimeGreen
  '#FF69B4', // HotPink
]

function Particle({ color, shape, angle, distance, size, duration }: ParticleProps) {
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
      animate={{ 
        x, 
        y: y + 50, // Slight gravity effect
        scale: [0, 1.2, 0.5, 0],
        opacity: [1, 1, 0.8, 0],
        rotate: Math.random() * 360 * 2
      }}
      transition={{ 
        duration, 
        ease: "easeOut",
      }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        backgroundColor: shape === 'star' ? 'transparent' : color,
        borderRadius: shape === 'circle' ? '50%' : '2px',
        borderLeft: shape === 'star' ? `${size/2}px solid transparent` : 'none',
        borderRight: shape === 'star' ? `${size/2}px solid transparent` : 'none',
        borderBottom: shape === 'star' ? `${size}px solid ${color}` : 'none',
      }}
    />
  )
}

interface DopamineBurstProps {
  trigger: boolean
  particleCount?: number
  onComplete?: () => void
  className?: string
}

export function DopamineBurst({ 
  trigger, 
  particleCount = 30, 
  onComplete,
  className = ""
}: DopamineBurstProps) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (trigger) {
      setActive(true)
      const timer = setTimeout(() => {
        setActive(false)
        if (onComplete) onComplete()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  const particles = useMemo(() => {
    if (!active) return []
    
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      angle: Math.random() * Math.PI * 2,
      distance: 50 + Math.random() * 150,
      size: 6 + Math.random() * 8,
      duration: 0.8 + Math.random() * 1.2,
    }))
  }, [active, particleCount])

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <AnimatePresence>
        {active && particles.map((p) => (
          <Particle key={p.id} {...p} />
        ))}
      </AnimatePresence>
    </div>
  )
}
