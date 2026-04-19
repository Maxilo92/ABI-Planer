'use client'

import { Task } from '@/types/database'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Clock, ChevronRight, Briefcase } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getTaskStatusMeta } from '@/modules/shared/status'

interface MarketplaceCardProps {
  task: Task
}

export function MarketplaceCard({ task }: MarketplaceCardProps) {
  const meta = getTaskStatusMeta(task.status, { completed: 'Erledigt' })
  const hasImage = task.task_image_urls && task.task_image_urls.length > 0
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/aufgaben/${task.id}`}>
        <Card className="h-full overflow-hidden hover:shadow-xl transition-all border-muted-foreground/10 flex flex-col group">
          {/* Image Section */}
          <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
            {hasImage ? (
              <Image 
                src={task.task_image_urls[0]} 
                alt={task.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/50">
                <Briefcase className="h-12 w-12 mb-2" />
                <span className="text-xs font-medium uppercase tracking-wider">Kein Vorschaubild</span>
              </div>
            )}
            
            {/* Status Overlay */}
            <div className="absolute top-2 left-2">
              <Badge variant={meta.variant} className={`${meta.className} shadow-sm backdrop-blur-sm bg-opacity-90`}>
                {meta.label}
              </Badge>
            </div>

            {/* Reward Badge Overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-primary px-3 py-1.5 rounded-full text-primary-foreground font-bold shadow-lg animate-in fade-in zoom-in duration-300">
              <Zap className="h-4 w-4 fill-primary-foreground" />
              <span>{task.reward_boosters}</span>
            </div>
          </div>

          <CardHeader className="p-4 flex-grow space-y-2">
            <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {task.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          </CardHeader>

          <CardContent className="px-4 pb-2 pt-0">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px] py-0 h-5">
                Lvl {task.complexity}
              </Badge>
              {task.assignee_id && (
                <Badge variant="secondary" className="text-[10px] py-0 h-5">
                  Vergeben
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-2 border-t bg-muted/30 flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(typeof task.created_at === 'object' && 'seconds' in task.created_at ? task.created_at.seconds * 1000 : task.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1 text-primary font-bold">
              Details <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
