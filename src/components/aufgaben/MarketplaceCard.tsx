'use client'

import { Task } from '@/types/database'
import { Card } from '@/components/ui/card'
import { Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getDeterministicSeed } from '@/lib/utils'

import { getTaskStatusMeta } from '@/modules/shared/status'

interface MarketplaceCardProps {
  task: Task
  categoryName?: string
  isFavorite?: boolean
  onToggleFavorite?: () => void
  variant?: 'grid' | 'list'
}

export function MarketplaceCard({ 
  task, 
  categoryName, 
  isFavorite, 
  onToggleFavorite,
  variant = 'grid'
}: MarketplaceCardProps) {
  const hasImage = task.task_image_urls && task.task_image_urls.length > 0
  
  // Status & Label Logic
  const getStatusInfo = () => {
    if (task.status === 'open') {
      if (task.ticket_reduction && task.ticket_reduction > 0) {
        return { label: 'Geld sparen', className: 'text-green-600' }
      }
      if (task.reward_boosters && task.reward_boosters > 0) {
        return { label: 'Booster sammeln', className: 'text-green-600' }
      }
      return { label: 'Jetzt helfen', className: 'text-green-600' }
    }
    
    const meta = getTaskStatusMeta(task.status)
    const colorClass = task.status === 'completed' 
      ? 'text-green-600' 
      : task.status === 'rejected' 
        ? 'text-destructive' 
        : 'text-orange-600'
    
    return { label: meta.label, className: colorClass }
  }

  const { label: statusLabel, className: statusClassName } = getStatusInfo()

  // Primary "Price" logic
  const primaryReward = task.ticket_reduction 
    ? `-${task.ticket_reduction}€` 
    : task.reward_boosters 
      ? `${task.reward_boosters} Booster` 
      : 'Bonus'

  const secondaryReward = task.ticket_reduction && task.reward_boosters 
    ? `+ ${task.reward_boosters} Booster` 
    : null

  const seed = task.placeholder_seed ?? getDeterministicSeed(task.id)
  const placeholderImage = `https://loremflickr.com/800/800/city,abstract,modern?lock=${seed % 1000}`

  if (variant === 'list') {
    return (
      <Card className="overflow-hidden border border-border/60 hover:shadow-md transition-shadow duration-200 flex flex-row bg-white rounded-xl h-32 sm:h-40">
        <div className="relative aspect-square h-full bg-muted shrink-0 border-r border-border/40">
          <Link href={`/aufgaben/${task.id}`} className="relative block w-full h-full">
            {hasImage ? (
              <Image 
                src={task.task_image_urls[0]} 
                alt={task.title} 
                fill 
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image 
                  src={placeholderImage} 
                  alt={task.title} 
                  fill
                  className="object-cover brightness-[0.98]"
                  sizes="200px"
                />
              </div>
            )}
          </Link>

          {/* Heart Button - Top Left (on image) */}
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite?.()
            }}
            className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors z-10 border border-border/20 shadow-sm"
          >
            <Heart 
              className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
            />
          </button>
        </div>

        <div className="flex-grow flex flex-col p-3 sm:p-4 min-w-0">
          <Link href={`/aufgaben/${task.id}`} className="flex-grow flex flex-col group">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                {/* Title */}
                <h3 className="font-semibold text-sm sm:text-lg leading-tight line-clamp-1 sm:line-clamp-2 text-foreground group-hover:underline mb-0.5 sm:mb-1">
                  {task.title}
                </h3>

                {/* Subtitle/Description */}
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                  {categoryName ? `${categoryName} • ` : ''}Lvl {task.complexity}
                </p>
              </div>

              {/* Price/Reward Section - Desktop Right */}
              <div className="hidden sm:flex flex-col items-end shrink-0">
                <span className="text-xl font-bold text-foreground">
                  {primaryReward}
                </span>
                {secondaryReward && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {secondaryReward}
                  </span>
                )}
              </div>
            </div>

            {/* Price/Reward Section - Mobile Bottom */}
            <div className="mt-auto flex items-end justify-between">
              <div className="sm:hidden flex flex-col">
                <span className="text-lg font-bold text-foreground leading-none">
                  {primaryReward}
                </span>
                {secondaryReward && (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {secondaryReward}
                  </span>
                )}
              </div>

              {/* Footer Info Row */}
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] sm:text-xs font-medium ${statusClassName}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-hidden border border-border/60 hover:shadow-md transition-shadow duration-200 flex flex-col bg-white rounded-xl">
      <div className="relative aspect-square w-full bg-muted shrink-0 border-b border-border/40">
        <Link href={`/aufgaben/${task.id}`} className="relative block w-full h-full">
          {hasImage ? (
            <Image 
              src={task.task_image_urls[0]} 
              alt={task.title} 
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="relative w-full h-full">
              <Image 
                src={placeholderImage} 
                alt={task.title} 
                fill
                className="object-cover brightness-[0.98]"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
          )}
        </Link>

        {/* Heart Button - Top Right */}
        <button 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite?.()
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors z-10 border border-border/20 shadow-sm"
        >
          <Heart 
            className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
          />
        </button>
      </div>

      <div className="flex-grow flex flex-col p-3">
        <Link href={`/aufgaben/${task.id}`} className="flex-grow flex flex-col group">
          {/* Title */}
          <h3 className="font-semibold text-sm sm:text-base leading-snug line-clamp-2 text-foreground group-hover:underline mb-1">
            {task.title}
          </h3>

          {/* Subtitle/Description */}
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {categoryName ? `${categoryName} • ` : ''}Lvl {task.complexity}
          </p>

          {/* Price/Reward Section */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-xl font-bold text-foreground">
                {primaryReward}
              </span>
              {secondaryReward && (
                <span className="text-xs font-semibold text-muted-foreground">
                  {secondaryReward}
                </span>
              )}
            </div>

            {/* Footer Info Row */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-[11px] font-medium ${statusClassName}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </Card>
  )
}
