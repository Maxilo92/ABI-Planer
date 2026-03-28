'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { GroupMessage, Settings, PlanningGroup } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate, cn } from '@/lib/utils'
import { Send, Trash2, MessageSquare, Pin, PinOff, Target, Users, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logAction } from '@/lib/logging'

interface GroupWallProps {
  groupName: string
  canManage?: boolean
  type?: 'internal' | 'hub'
}

export function GroupWall({ groupName, canManage = false, type = 'internal' }: GroupWallProps) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [planningGroups, setPlanningGroups] = useState<PlanningGroup[]>([])
  const [targetGroup, setTargetGroup] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (type !== 'hub') return

    const fetchGroups = async () => {
      const settingsRef = doc(db, 'settings', 'config')
      const docSnap = await getDoc(settingsRef)
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings
        setPlanningGroups(data.planning_groups || [])
      }
    }
    fetchGroups()
  }, [type])

  useEffect(() => {
    if (!groupName) return

    const q = query(
      collection(db, 'group_messages'),
      where('group_name', '==', groupName),
      where('type', '==', type),
      orderBy('created_at', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupMessage)))
    })

    return () => unsubscribe()
  }, [groupName, type])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !profile) return

    setLoading(true)
    try {
      await addDoc(collection(db, 'group_messages'), {
        content: newMessage.trim(),
        created_by: user.uid,
        author_name: profile.full_name || user.displayName || 'Unbekannt',
        author_group: profile.planning_group || null,
        target_group: targetGroup,
        group_name: groupName,
        type: type,
        created_at: serverTimestamp(),
      })

      await logAction('GROUP_MESSAGE_CREATED', user.uid, profile.full_name, {
        group_name: groupName,
        type,
        target_group: targetGroup,
        content_length: newMessage.trim().length,
      })

      setNewMessage('')
      setTargetGroup(null)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Nachricht konnte nicht gesendet werden.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!canManage && message?.created_by !== user?.uid) return
    
    try {
      await deleteDoc(doc(db, 'group_messages', messageId))

      if (user) {
        await logAction('GROUP_MESSAGE_DELETED', user.uid, profile?.full_name, {
          message_id: messageId,
          group_name: groupName,
          type,
          was_pinned: !!message?.pinned,
          target_group: message?.target_group || null,
        })
      }

      toast.success('Nachricht gelöscht.')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Fehler beim Löschen.')
    }
  }, [messages, canManage, user, profile, groupName, type])

  const handlePinMessage = useCallback(async (messageId: string, isPinned: boolean) => {
    if (!canManage) return

    try {
      await updateDoc(doc(db, 'group_messages', messageId), {
        pinned: !isPinned
      })

      if (user) {
        await logAction('GROUP_MESSAGE_PINNED', user.uid, profile?.full_name, {
          message_id: messageId,
          group_name: groupName,
          type,
          pinned: !isPinned,
        })
      }

      toast.success(isPinned ? 'Anheftung aufgehoben.' : 'Nachricht angeheftet.')
    } catch (error) {
      console.error('Error pinning message:', error)
      toast.error('Fehler beim Anheften.')
    }
  }, [canManage, user, profile, groupName, type])

  const pinnedMessages = messages.filter(m => m.pinned)
  const regularMessages = messages.filter(m => !m.pinned)

  const renderMessage = useCallback((msg: GroupMessage) => {
    const isOwn = msg.created_by === user?.uid
    const date = toDate(msg.created_at)
    const isPinned = msg.pinned

    return (
      <div 
        key={msg.id} 
        className={cn(
          "flex flex-col group",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <div className={cn(
          "flex items-start gap-2.5 max-w-[85%] relative",
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
            "flex flex-col min-w-0",
            isOwn ? "items-end" : "items-start"
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-1 px-1",
              isOwn ? "flex-row-reverse" : "flex-row"
            )}>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                {msg.author_name}
                {type === 'hub' && msg.author_group && (
                  <span className="ml-1 text-primary/70 font-medium lowercase italic">
                    @{msg.author_group}
                  </span>
                )}
              </span>
              <span className="text-[9px] text-muted-foreground font-medium">
                {format(date, 'HH:mm', { locale: de })}
              </span>
              {isPinned && (
                <div className="flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 rounded-full">
                  <Pin className="h-2.5 w-2.5 text-primary fill-primary" />
                  <span className="text-[8px] font-bold text-primary uppercase">Angeheftet</span>
                </div>
              )}
            </div>
            
            <div className={cn(
              "relative group p-3.5 shadow-sm transition-all overflow-hidden",
              isPinned 
                ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 text-foreground rounded-2xl" 
                : isOwn 
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none hover:shadow-md hover:shadow-primary/10" 
                  : "bg-muted/80 dark:bg-muted/40 backdrop-blur-sm border border-border/50 text-foreground rounded-2xl rounded-tl-none hover:shadow-md hover:shadow-black/5"
            )}>
              {/* Swipe Background Action */}
              {(canManage || isOwn) && (
                <div className={cn(
                  "absolute inset-0 flex items-center justify-end px-6 bg-destructive text-destructive-foreground transition-opacity",
                  "opacity-0 group-active:opacity-100"
                )}>
                  <Trash2 className="h-5 w-5 animate-pulse" />
                </div>
              )}

              <motion.div
                drag={ (canManage || isOwn) ? "x" : false }
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) {
                    handleDeleteMessage(msg.id);
                  }
                }}
                className="relative bg-inherit rounded-[inherit] z-10"
              >
                {msg.target_group && (
                  <div className={cn(
                    "flex items-center gap-1.5 mb-2 font-bold text-[10px] uppercase tracking-wider",
                    isOwn ? "text-primary-foreground/80" : "text-primary"
                  )}>
                    <Target className="h-3 w-3" />
                    Für: {msg.target_group}
                  </div>
                )}
                
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </motion.div>
              
              <div className={cn(
                "absolute top-0 flex items-center gap-1.5 transition-all sm:opacity-0 sm:group-hover:opacity-100 z-20",
                isOwn ? "right-full mr-2 sm:mr-3" : "left-full ml-2 sm:ml-3"
              )}>
                {canManage && (
                  <button
                    onClick={() => handlePinMessage(msg.id, !!isPinned)}
                    className={cn(
                      "p-1.5 bg-background border rounded-lg shadow-sm hover:scale-110 transition-transform",
                      isPinned ? "text-amber-500 border-amber-200" : "text-muted-foreground hover:text-primary"
                    )}
                    title={isPinned ? "Anheftung aufheben" : "Anheften"}
                  >
                    {isPinned ? <PinOff className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> : <Pin className="h-3 sm:h-3.5 w-3 sm:w-3.5" />}
                  </button>
                )}
                {(canManage || isOwn) && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1.5 bg-background border rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/30 shadow-sm hover:scale-110 transition-transform"
                    title="Löschen"
                  >
                    <Trash2 className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                  </button>
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
      </div>
    )
  }, [user?.uid, type, canManage, handlePinMessage, handleDeleteMessage])

  return (
    <Card className="flex flex-col h-[550px] md:h-[650px] lg:h-[750px] shadow-lg border-primary/5 overflow-hidden">
      <CardHeader className="py-4 px-6 border-b bg-muted/20 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                {type === 'hub' ? 'Shared Hub' : 'Team-Pinnwand'}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground font-medium">
                {messages.length} {messages.length === 1 ? 'Nachricht' : 'Nachrichten'}
              </p>
            </div>
          </div>
          {type === 'hub' && (
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-2 py-0.5">
              GLOBAL
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gradient-to-b from-transparent to-muted/5"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="bg-muted/50 p-6 rounded-full">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-muted-foreground">Noch keine Nachrichten</p>
              <p className="text-xs text-muted-foreground/60 max-w-[200px]">Schreib die erste Nachricht an dein Team oder den Hub!</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {pinnedMessages.length > 0 && (
              <div className="space-y-4 relative">
                <div className="sticky top-0 z-10 flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50/80 dark:bg-amber-950/40 backdrop-blur-md py-1.5 px-3 rounded-full border border-amber-200/50 dark:border-amber-900/50 w-fit mx-auto mb-6">
                  <Pin className="h-3 w-3 fill-amber-600" /> WICHTIGE ANKÜNDIGUNGEN
                </div>
                {pinnedMessages.map(renderMessage)}
                <div className="py-2 flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Verlauf</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
              </div>
            )}
            {regularMessages.map(renderMessage)}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t bg-muted/30 backdrop-blur-lg flex flex-col gap-3">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-3 w-full">
          {type === 'hub' && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 text-[10px] font-bold uppercase tracking-wider gap-2 px-3 transition-all",
                        targetGroup 
                          ? "bg-primary/5 border-primary text-primary shadow-sm shadow-primary/10" 
                          : "bg-background"
                      )}
                    >
                      <Target className="h-3 w-3" />
                      {targetGroup ? `An: ${targetGroup}` : "Alle Gruppen"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase">Empfänger wählen</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setTargetGroup(null)}
                    className="text-xs font-medium"
                  >
                    <Users className="h-3.5 w-3.5 mr-2" /> Alle Gruppen
                  </DropdownMenuItem>
                  {planningGroups.map((group) => (
                    <DropdownMenuItem 
                      key={group.name} 
                      onClick={() => setTargetGroup(group.name)}
                      className="text-xs font-medium"
                    >
                      <Target className="h-3.5 w-3.5 mr-2" /> {group.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {targetGroup && (
                <button 
                  type="button"
                  className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors px-1"
                  onClick={() => setTargetGroup(null)}
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input 
                placeholder={type === 'hub' ? "Nachricht an den Hub..." : "Nachricht an das Team..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading}
                className="pr-12 bg-background/50 border-muted-foreground/20 focus:bg-background transition-all rounded-xl min-h-[44px]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground/40">
                <span className="text-[10px] font-medium mr-2 hidden sm:inline">⌘↵</span>
              </div>
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={loading || !newMessage.trim()}
              className="h-[44px] w-[44px] rounded-xl shadow-lg shadow-primary/20 shrink-0 transition-transform active:scale-95"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  )
}
