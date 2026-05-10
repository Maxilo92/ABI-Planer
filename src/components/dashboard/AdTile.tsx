'use client'

import { Ad } from '@/types/database'
import { Megaphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface AdTileProps {
  ads: Ad[]
}

export function AdTile({ ads }: AdTileProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (ads.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [ads.length])

  if (ads.length === 0) return null

  const ad = ads[currentIndex]

  const isExternal = ad.link_url?.startsWith('http') || ad.link_url?.startsWith('//')
  const href = ad.link_url || '#'

  const Content = (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-border/40 shadow-card bg-card flex flex-col group">
      <div className="relative h-52 w-full overflow-hidden bg-muted/30 shrink-0">
        {ad.image_url ? (
          <>
            {/* Blurred Background to fill space */}
            <div 
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-50 scale-110 pointer-events-none"
              style={{ backgroundImage: `url(${ad.image_url})` }}
            />
            <img
              src={ad.image_url}
              alt={ad.title}
              className="relative h-full w-full object-contain transition-transform duration-700 group-hover:scale-105 z-10"
            />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Megaphone className="h-10 w-10 text-primary/40" />
          </div>
        )}

        {/* Pagination Indicators - Now on top of image */}
        {ads.length > 1 && (
          <div className="absolute top-4 left-6 flex gap-1.5">
            {ads.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === currentIndex ? "w-6 bg-white shadow-sm" : "w-1.5 bg-white/40 shadow-sm"
                )} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Section Below Image */}
      <div className="p-5 flex flex-col justify-center flex-1 space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="bg-muted border border-border/60 px-2 py-0.5 rounded-full h-fit shrink-0 flex items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/90 leading-none">Anzeige</span>
          </div>
          <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-1">{ad.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 font-medium leading-relaxed">{ad.description}</p>
      </div>
    </div>
  )

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={ad.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4 }}
        className="h-full"
      >
        {isExternal ? (
          <a 
            href={href} 
            target="_blank"
            rel="noopener noreferrer"
            className="block h-full group"
          >
            {Content}
          </a>
        ) : (
          <Link href={href} className="block h-full group">
            {Content}
          </Link>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
