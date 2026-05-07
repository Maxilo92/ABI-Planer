'use client'

import { Task } from '@/types/database'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Heart, Info, Tags } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getTaskStatusMeta } from '@/modules/shared/status'

interface MarketplaceCardProps {
  task: Task
  categoryName?: string
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export function MarketplaceCard({ task, categoryName, isFavorite, onToggleFavorite }: MarketplaceCardProps) {
  const meta = getTaskStatusMeta(task.status, { completed: 'Erledigt' })
  const hasImage = task.task_image_urls && task.task_image_urls.length > 0
  
  // Primary "Price" logic
  const primaryReward = task.ticket_reduction 
    ? `-${task.ticket_reduction}€ Ticket` 
    : task.reward_boosters 
      ? `${task.reward_boosters} Booster` 
      : 'Bonus'

  const secondaryReward = task.ticket_reduction && task.reward_boosters 
    ? `${task.reward_boosters} Booster` 
    : null

  const placeholderImage = `https://loremflickr.com/800/800/city,abstract,modern?lock=${task.id.slice(0, 5)}`

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col"
    >
      <Card className="h-full overflow-hidden border-none shadow-none hover:shadow-xl transition-all duration-300 flex flex-col group bg-transparent">
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted mb-3 shrink-0">
          <Link href={`/aufgaben/${task.id}`} className="relative block w-full h-full">
            {hasImage ? (
              <Image 
                src={task.task_image_urls[0]} 
                alt={task.title} 
                fill 
                className="object-contain transition-all duration-700"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image 
                  src={placeholderImage} 
                  alt={task.title} 
                  fill
                  className="object-cover brightness-[0.95] contrast-[1.05] transition-all duration-1000"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />

                {/* Watermark Overlay for placeholders */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/10 backdrop-blur-[1px] pointer-events-none">
                  <div className="border-2 border-white/40 px-3 py-1.5 rotate-[-12deg] bg-black/20">
                    <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap shadow-sm">
                      Beispielbild
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Link>
          
          {/* Status Badge - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
            <Badge variant={meta.variant} className={`${meta.className} shadow-sm backdrop-blur-md bg-opacity-80 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
              {meta.label}
            </Badge>
            {categoryName && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-foreground border-none shadow-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <Tags className="h-2.5 w-2.5" />
                {categoryName}
              </Badge>
            )}
          </div>

          {/* Heart Button - Top Right */}
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite?.()
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background transition-colors z-10"
          >
            <Heart 
              className={`h-5 w-5 transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-muted-foreground'}`} 
            />
          </button>

          {/* Complexity Badge - Bottom Left */}
          <div className="absolute bottom-3 left-3 flex gap-1 pointer-events-none">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground border-none shadow-sm text-[10px] font-bold">
              Lvl {task.complexity}
            </Badge>
            {secondaryReward && (
              <Badge variant="secondary" className="bg-brand/90 backdrop-blur-sm text-brand-foreground border-none shadow-sm text-[10px] font-bold gap-1">
                <Zap className="h-3 w-3 fill-current" />
                {secondaryReward}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-grow flex flex-col px-1.5 pb-2">
          <Link href={`/aufgaben/${task.id}`} className="flex-grow flex flex-col">
            {/* Price/Reward Section */}
            <div className="flex items-baseline gap-2 mb-0.5 mt-1">
              <span className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                {primaryReward}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2 text-foreground group-hover:text-brand transition-colors mb-1">
              {task.title}
            </h3>

            {/* Subtitle/Description - hidden on very small screens to keep height consistent */}
            <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed hidden xs:block">
              {task.description}
            </p>
          </Link>

          {/* Assignee / Info Row */}
          <div className="mt-auto flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-muted-foreground/60">
            <span className="truncate mr-2">{task.assignee_id ? 'Vergeben' : 'Sofort verfügbar'}</span>
            <Link href={`/aufgaben/${task.id}`} className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-brand shrink-0">
              <span className="font-black uppercase tracking-tighter">Details</span>
              <Info className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
