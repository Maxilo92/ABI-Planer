'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'
import { Send, Trash2, MessageSquare, Pin, PinOff, Target } from 'lucide-react'
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

  const handleDeleteMessage = async (messageId: string) => {
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
  }

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
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
  }

  const pinnedMessages = messages.filter(m => m.pinned)
  const regularMessages = messages.filter(m => !m.pinned)

  const renderMessage = (msg: GroupMessage) => {
    const isOwn = msg.created_by === user?.uid
    const date = toDate(msg.created_at)
    const isPinned = msg.pinned

    return (
      <div 
        key={msg.id} 
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
      >
        <div className={`flex items-start gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
          <Avatar className="h-8 w-8 mt-1">
            <AvatarFallback className="text-[10px]">
              {msg.author_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {msg.author_name}
                {type === 'hub' && msg.author_group && (
                  <span className="ml-1 text-primary lowercase tracking-tight">
                    [{msg.author_group}]
                  </span>
                )}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {format(date, 'HH:mm', { locale: de })}
              </span>
              {isPinned && <Pin className="h-3 w-3 text-primary fill-primary/20" />}
            </div>
            
            <div className={`relative group p-3 rounded-2xl text-sm ${
              isPinned 
                ? 'bg-primary/10 border border-primary/20 text-foreground rounded-2xl' 
                : isOwn 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-muted text-foreground rounded-tl-none'
            }`}>
              {msg.target_group && (
                <div className={`flex items-center gap-1.5 mb-1.5 font-semibold text-[11px] ${isOwn ? 'text-primary-foreground/80' : 'text-primary'}`}>
                  <Target className="h-3 w-3" />
                  An: {msg.target_group}
                </div>
              )}
              {msg.content}
              
              <div className={`absolute -top-2 ${isOwn ? '-left-12' : '-right-12'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                {canManage && (
                  <button
                    onClick={() => handlePinMessage(msg.id, !!isPinned)}
                    className="p-1 bg-background border rounded-full hover:text-primary shadow-sm"
                    title={isPinned ? "Anheftung aufheben" : "Anheften"}
                  >
                    {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  </button>
                )}
                {(canManage || isOwn) && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1 bg-background border rounded-full hover:text-destructive shadow-sm"
                    title="Löschen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {type === 'hub' ? 'Shared Hub' : 'Gruppen-Pinnwand'}
        </CardTitle>
      </CardHeader>
      
      <CardContent 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p className="text-sm italic">Noch keine Nachrichten. Schreib etwas!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pinnedMessages.length > 0 && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase px-2">
                  <Pin className="h-3 w-3" /> Angeheftete Nachrichten
                </div>
                {pinnedMessages.map(renderMessage)}
                <div className="border-b opacity-50 mx-2" />
              </div>
            )}
            {regularMessages.map(renderMessage)}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t bg-muted/20 flex flex-col gap-2">
        {type === 'hub' && (
          <div className="flex items-center gap-2 w-full mb-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 text-[11px] gap-2 ${
                      targetGroup ? "border-primary text-primary" : ""
                    }`}
                  >
                    <Target className="h-3 w-3" />
                    {targetGroup ? `An: ${targetGroup}` : "An alle Gruppen"}
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Empfänger wählen</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTargetGroup(null)}>
                  An alle Gruppen
                </DropdownMenuItem>
                {planningGroups.map((group) => (
                  <DropdownMenuItem key={group.name} onClick={() => setTargetGroup(group.name)}>
                    An: {group.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {targetGroup && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[10px] text-muted-foreground"
                onClick={() => setTargetGroup(null)}
              >
                Zurücksetzen
              </Button>
            )}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input 
            placeholder={type === 'hub' ? "Nachricht an den Hub..." : "Nachricht schreiben..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
