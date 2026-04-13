'use client'

import { useState, memo } from 'react'
import { GroupMessage } from '@/types/database'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate, cn } from '@/lib/utils'
import { Trash2, Pin, PinOff, Reply, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MediaAttachment } from './MediaAttachment'
import { ChatMarkdown } from './ChatMarkdown'

interface MessageItemProps {
  msg: GroupMessage
  replies?: GroupMessage[]
  currentUserId: string | null | undefined
  canManage: boolean
  type?: 'internal' | 'hub' | 'role'
  onDelete: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
  onReply: (msg: GroupMessage) => void
}

export const MessageItem = memo(function MessageItem({
  msg,
  replies = [],
  currentUserId,
  canManage,
  type,
  onDelete,
  onPin,
  onReply
}: MessageItemProps) {
  const [showReplies, setShowReplies] = useState(true)
  const isOwn = msg.created_by === currentUserId
  const date = toDate(msg.created_at)
  const isPinned = msg.pinned
  const hasTextContent = Boolean(msg.content?.trim())
  const isImageOnlyMessage = Boolean(msg.media_url && msg.media_type === 'image' && !hasTextContent)

  return (
    <div className={cn(
      "flex flex-col group overflow-visible",
      isOwn ? "items-end" : "items-start",
      msg.parent_id && "pl-8 mt-1" // Indent replies
    )}>
      <div className={cn(
        "flex items-start gap-2.5 max-w-[90%] relative",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        {!isOwn && (
          <Avatar className="h-8 w-8 mt-1.5 shrink-0 border shadow-sm">
            <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-bold">
              {msg.author_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn(
          "flex flex-col min-w-0 relative",
          isOwn ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "flex items-center gap-2.5 mb-1.5 px-2",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
              {msg.author_name}
              {type === 'hub' && msg.author_group && (
                <span className="ml-1.5 text-primary/60 font-black lowercase italic opacity-80">
                  @{msg.author_group}
                </span>
              )}
            </span>
            <span className="text-[9px] text-muted-foreground font-black opacity-40">
              {format(date, 'HH:mm', { locale: de })}
            </span>
            {isPinned && (
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200/50 shadow-sm animate-pulse">
                <Pin className="h-2.5 w-2.5 text-amber-600 fill-amber-600" />
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Wichtig</span>
              </div>
            )}
          </div>

          <div className={cn(
            "absolute bottom-full mb-1 flex items-center gap-1.5 z-30",
            "opacity-0 group-hover:opacity-100 transition-all duration-150",
            "scale-95 group-hover:scale-100",
            isOwn ? "right-0" : "left-0"
          )}>
            <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl px-1 py-1">
              {!msg.parent_id && (
                <button onClick={() => onReply(msg)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Antworten">
                  <Reply className="h-3.5 w-3.5" />
                </button>
              )}
              {canManage && (
                <button onClick={() => onPin(msg.id, !!isPinned)} className={cn("p-1.5 rounded-lg transition-all", isPinned ? "text-amber-500 hover:bg-amber-50" : "text-muted-foreground hover:text-primary hover:bg-primary/10")} title={isPinned ? "Anheftung aufheben" : "Anheften"}>
                  {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </button>
              )}
              {(canManage || isOwn) && (
                <button onClick={() => onDelete(msg.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="Löschen">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className={cn(
            "relative group p-4 shadow-xl transition-all duration-300",
            isPinned 
              ? "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border-2 border-amber-200/50 dark:border-amber-900/50 text-foreground rounded-3xl" 
              : isImageOnlyMessage
                ? "bg-transparent border-0 p-0 shadow-none"
              : isOwn 
                ? "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground rounded-[2rem] rounded-tr-none shadow-none" 
                : "bg-background/80 dark:bg-muted/20 backdrop-blur-xl border border-primary/10 text-foreground rounded-[2rem] rounded-tl-none shadow-black/5 hover:shadow-primary/5"
          )}>
            <div className={cn("relative z-10", isImageOnlyMessage ? "space-y-0" : "space-y-3")}>
              {msg.content && (
                <ChatMarkdown
                  content={msg.content}
                  tone={isOwn ? 'inverse' : 'default'}
                  className="text-[15px] font-medium tracking-tight"
                />
              )}
              
              {msg.media_url && (
                <div className="rounded-2xl overflow-hidden">
                  <MediaAttachment 
                    url={msg.media_url} 
                    type={msg.media_type} 
                    className={isOwn ? "ml-auto" : "mr-auto"}
                  />
                </div>
              )}
            </div>
            
          </div>
        </div>

        {isOwn && (
          <Avatar className="h-8 w-8 mt-1.5 shrink-0 border shadow-sm">
            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-bold">
              {msg.author_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="w-full mt-2">
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors ml-12 mb-2"
          >
            {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {replies.length} {replies.length === 1 ? 'Antwort' : 'Antworten'}
          </button>
          
          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {replies.map(reply => (
                  <MessageItem
                    key={reply.id}
                    msg={reply}
                    currentUserId={currentUserId}
                    canManage={canManage}
                    onDelete={onDelete}
                    onPin={onPin}
                    onReply={onReply}
                    type={type}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
})
