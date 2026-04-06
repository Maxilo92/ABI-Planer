'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { db, storage } from '@/lib/firebase'
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
  getDoc,
  setDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/context/AuthContext'
import { GroupMessage, Settings, PlanningGroup, Profile } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate, cn, getOnlineStatus } from '@/lib/utils'
import { 
  Send, 
  Trash2, 
  MessageSquare, 
  Pin, 
  PinOff, 
  Target, 
  Users, 
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
  X,
  Reply
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { MessageItem } from './MessageItem'
import { MediaAttachment } from './MediaAttachment'

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
  const [presenceProfiles, setPresenceProfiles] = useState<Profile[]>([])
  
  // Threading & Media State
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Read-Tracking
  useEffect(() => {
    if (!user || !groupName) return

    const updateLastSeen = async () => {
      const groupId = type === 'hub' ? 'hub' : groupName
      try {
        await setDoc(doc(db, 'last_seen', groupId, 'users', user.uid), {
          lastSeenAt: serverTimestamp(),
          userId: user.uid,
          groupId: groupId
        }, { merge: true })
      } catch (error) {
        console.error('Error updating last_seen:', error)
      }
    }

    updateLastSeen()
  }, [user, groupName, type])

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
    if (!groupName || !profile?.is_approved) return

    const q = query(
      collection(db, 'group_messages'),
      where('group_name', '==', groupName),
      where('type', '==', type),
      orderBy('created_at', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupMessage)))
    }, (error) => {
      console.error('GroupWall: Error listening to messages:', error)
    })

    return () => unsubscribe()
  }, [groupName, type, profile?.is_approved])

  useEffect(() => {
    if (!profile?.is_approved) {
      setPresenceProfiles([])
      return
    }

    const unsubscribeProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const rows = snapshot.docs
        .map((profileDoc) => ({ id: profileDoc.id, ...profileDoc.data() } as Profile))
        .filter((profileRow) => profileRow.is_approved)
      setPresenceProfiles(rows)
    }, (error) => {
      console.error('GroupWall: Error listening to profile presence:', error)
      setPresenceProfiles([])
    })

    return () => unsubscribeProfiles()
  }, [profile?.is_approved])

  const onlineCount = useMemo(() => {
    return presenceProfiles.reduce((acc, presenceProfile) => {
      const onlineState = getOnlineStatus(!!presenceProfile.isOnline, presenceProfile.lastOnline)
      if (!onlineState.isOnline) return acc

      if (type === 'hub') return acc + 1
      return presenceProfile.planning_groups?.includes(groupName) ? acc + 1 : acc
    }, 0)
  }, [presenceProfiles, type, groupName])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const isAllowedType = file.type.startsWith('image/') || file.type === 'application/pdf'
      if (!isAllowedType) {
        toast.error('Nur Bilder oder PDF-Dateien sind erlaubt.')
        return
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit (must match storage.rules)
        toast.error('Datei ist zu groß (max. 5MB)')
        return
      }
      setAttachment(file)
    }
  }

  const uploadMedia = async (file: File, groupId: string) => {
    const fileName = `${Date.now()}_${file.name}`
    const storageRef = ref(storage, `group-media/${groupId}/${fileName}`)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !attachment) || !user || !profile) return

    setLoading(true)
    setIsUploading(!!attachment)
    try {
      let mediaUrl = null
      let mediaType: 'image' | 'doc' | null = null
      const groupId = type === 'hub' ? 'hub' : groupName

      if (attachment) {
        mediaUrl = await uploadMedia(attachment, groupId)
        mediaType = attachment.type.startsWith('image/') ? 'image' : 'doc'
      }

      await addDoc(collection(db, 'group_messages'), {
        content: newMessage.trim(),
        created_by: user.uid,
        author_name: profile.full_name || user.displayName || 'Unbekannt',
        author_group: (profile.planning_groups && profile.planning_groups.length > 0) ? profile.planning_groups[0] : null,
        target_group: targetGroup,
        group_name: groupName,
        type: type,
        created_at: serverTimestamp(),
        parent_id: replyTo?.id || null,
        media_url: mediaUrl,
        media_type: mediaType,
      })

      await logAction('GROUP_MESSAGE_CREATED', user.uid, profile.full_name, {
        group_name: groupName,
        type,
        target_group: targetGroup,
        content_length: newMessage.trim().length,
        has_attachment: !!attachment,
        is_reply: !!replyTo,
      })

      setNewMessage('')
      setTargetGroup(null)
      setAttachment(null)
      setReplyTo(null)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Nachricht konnte nicht gesendet werden.')
    } finally {
      setLoading(false)
      setIsUploading(false)
    }
  }

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!canManage && message?.created_by !== user?.uid) return
    
    try {
      // Also delete replies if it's a top-level message
      const replies = messages.filter(m => m.parent_id === messageId)
      for (const reply of replies) {
        await deleteDoc(doc(db, 'group_messages', reply.id))
      }

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

  const pinnedMessages = messages.filter(m => m.pinned && !m.parent_id)
  const topLevelMessages = messages.filter(m => !m.pinned && !m.parent_id)
  
  const getReplies = (parentId: string) => messages.filter(m => m.parent_id === parentId)

  return (
    <Card className="flex flex-col h-[600px] md:h-[700px] lg:h-[800px] shadow-2xl shadow-primary/5 border-primary/10 overflow-hidden rounded-[2rem] bg-card/50 backdrop-blur-xl transition-all duration-500 hover:shadow-primary/10">
      <CardHeader className="py-5 px-8 border-b border-primary/10 bg-muted/20 backdrop-blur-xl relative overflow-hidden group/header">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover/header:opacity-100 transition-opacity duration-700" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-2xl shadow-inner group-hover/header:scale-110 transition-transform duration-500">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight">
                {type === 'hub' ? 'Shared Hub' : 'Team-Pinnwand'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70">
                  {onlineCount} online
                </p>
              </div>
            </div>
          </div>
          {type === 'hub' ? (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1.5 rounded-xl shadow-lg shadow-primary/5 animate-pulse">
              GLOBAL HUB
            </Badge>
          ) : (
            <div className="flex -space-x-3 overflow-hidden">
               {/* Avatars would go here if we had them in props, for now just a placeholder */}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth bg-gradient-to-b from-transparent via-muted/5 to-muted/10 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="bg-primary/5 p-10 rounded-[2.5rem] shadow-inner relative group/empty">
              <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover/empty:opacity-100 transition-opacity" />
              <MessageSquare className="h-16 w-16 text-primary/30 relative z-10 group-hover/empty:scale-110 transition-transform duration-500" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-muted-foreground">Stille im Äther...</p>
              <p className="text-sm text-muted-foreground/60 max-w-[250px] font-bold mx-auto leading-relaxed">Sei der Erste, der den Grundstein für die heutige Planung legt!</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {pinnedMessages.length > 0 && (
              <div className="space-y-6 relative">
                <div className="sticky top-0 z-10 flex items-center gap-3 text-[10px] font-black text-amber-600 bg-amber-50/90 dark:bg-amber-950/60 backdrop-blur-xl py-2 px-5 rounded-2xl border border-amber-200/50 dark:border-amber-900/50 w-fit mx-auto mb-8 shadow-xl shadow-amber-500/10 uppercase tracking-[0.2em]">
                  <Pin className="h-3.5 w-3.5 fill-amber-600 animate-bounce" /> Wichtige Ankündigungen
                </div>
                {pinnedMessages.map(msg => (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    replies={getReplies(msg.id)}
                    isOwn={msg.created_by === user?.uid}
                    canManage={canManage}
                    onDelete={handleDeleteMessage}
                    onPin={handlePinMessage}
                    onReply={setReplyTo}
                    type={type}
                  />
                ))}
                <div className="py-4 flex items-center gap-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                  <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Timeline</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                </div>
              </div>
            )}
            {topLevelMessages.map(msg => (
              <MessageItem
                key={msg.id}
                msg={msg}
                replies={getReplies(msg.id)}
                isOwn={msg.created_by === user?.uid}
                canManage={canManage}
                onDelete={handleDeleteMessage}
                onPin={handlePinMessage}
                onReply={setReplyTo}
                type={type}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 border-t border-primary/10 bg-muted/40 backdrop-blur-2xl flex flex-col gap-4">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-4 w-full">
          {/* Active Reply Indicator */}
          {replyTo && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 animate-in slide-in-from-bottom-4 shadow-inner">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <Reply className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Antwort an {replyTo.author_name}</p>
                  <p className="text-xs text-muted-foreground truncate font-medium opacity-80">{replyTo.content}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setReplyTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Attachment Preview */}
          {attachment && (
            <div className="animate-in fade-in zoom-in-95 p-1">
              <MediaAttachment 
                file={attachment} 
                onRemove={() => setAttachment(null)}
                isUploading={isUploading}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            {type === 'hub' && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-14 text-[10px] font-black uppercase tracking-[0.15em] gap-3 px-5 transition-all rounded-2xl shadow-xl",
                        targetGroup 
                          ? "bg-primary text-primary-foreground border-primary shadow-primary/20" 
                          : "bg-background/50 backdrop-blur-md border-primary/10 hover:border-primary/30"
                      )}
                    >
                      <Target className={cn("h-5 w-5", targetGroup ? "text-primary-foreground" : "text-primary")} />
                      <span className="hidden sm:inline">{targetGroup || "Empfänger"}</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 shadow-2xl border-primary/10 backdrop-blur-xl">
                  <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 py-2">Zielgruppe wählen</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-primary/10" />
                  <DropdownMenuItem 
                    onClick={() => setTargetGroup(null)}
                    className="rounded-xl p-3 font-bold transition-all hover:bg-primary/10"
                  >
                    <Users className="h-4 w-4 mr-3 text-primary" /> Alle Gruppen
                  </DropdownMenuItem>
                  {planningGroups.map((group) => (
                    <DropdownMenuItem 
                      key={group.name} 
                      onClick={() => setTargetGroup(group.name)}
                      className="rounded-xl p-3 font-bold transition-all hover:bg-primary/10"
                    >
                      <Target className="h-4 w-4 mr-3 text-primary/60" /> {group.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <div className="relative flex-1 flex items-center gap-3">
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
              />
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl bg-background/50 backdrop-blur-md border-primary/10 hover:border-primary/30 hover:bg-background transition-all shadow-xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>

              <div className="relative flex-1 group/input">
                <Input 
                  placeholder={
                    replyTo 
                      ? "Antwort schreiben..." 
                      : type === 'hub' 
                        ? "Teile deine Gedanken mit dem Hub..." 
                        : "Nachricht an das Team..."
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={loading}
                  className="pr-14 bg-background/50 backdrop-blur-md border-primary/10 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all rounded-2xl h-14 font-medium text-base shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground/30 group-focus-within/input:text-primary/50 transition-colors">
                  <span className="text-[10px] font-black mr-2 hidden sm:inline tracking-tighter uppercase">Cmd + Enter</span>
                </div>
              </div>
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={loading || (!newMessage.trim() && !attachment)}
              className="h-14 w-14 rounded-2xl shadow-2xl shadow-primary/20 shrink-0 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5 text-primary-foreground" />
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  )
}
