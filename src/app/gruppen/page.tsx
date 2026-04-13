'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { GroupMessage, PlanningGroup, Profile, Settings } from '@/types/database'
import { 
  type LucideIcon, 
  Loader2, 
  Plus, 
  Users, 
  Globe, 
  Inbox, 
  Hash, 
  ClipboardList, 
  Shield, 
  Bot, 
  ArrowLeft,
  MoreVertical,
  LogOut
} from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate'
import { cn, getOnlineStatus, toDate } from '@/lib/utils'
import { GroupWall } from '@/components/groups/GroupWall'
import { AddTodoDialog } from '@/components/modals/AddTodoDialog'
import { AddEventDialog } from '@/components/modals/AddEventDialog'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { useGroupJoin } from '@/hooks/useGroupJoin'

type ChatItem = {
  id: string
  label: string
  type: 'internal' | 'hub' | 'role'
  groupName: string
  roleAccess?: string
  latestMessage: GroupMessage | null
  isAbiBot?: boolean
}

function getLastMessageTime(message: GroupMessage | null): number {
  if (!message) return 0
  return toDate(message.created_at).getTime()
}

function getChatPreview(message: GroupMessage | null): string {
  if (!message) return 'Noch keine Nachrichten'
  if (message.content?.trim()) return message.content.trim()
  if (message.media_type === 'image') return 'Bild'
  if (message.media_type === 'doc') return 'Datei gesendet'
  return 'Nachricht'
}

function getChatInitial(label: string): string {
  return (label || '?').trim().charAt(0).toUpperCase() || '?'
}

function getChatIcon(chat: ChatItem): { icon: LucideIcon; bg: string; text: string } {
  if (chat.isAbiBot)              return { icon: Bot,           bg: 'bg-primary/15',                             text: 'text-primary' }
  if (chat.type === 'hub')        return { icon: Globe,         bg: 'bg-primary/15',                             text: 'text-primary' }
  if (chat.id === 'system')       return { icon: Inbox,         bg: 'bg-muted',                                  text: 'text-muted-foreground' }
  if (chat.id === 'role:viewer')  return { icon: Users,         bg: 'bg-blue-100 dark:bg-blue-900/30',           text: 'text-blue-600 dark:text-blue-400' }
  if (chat.id === 'role:planner') return { icon: ClipboardList, bg: 'bg-amber-100 dark:bg-amber-900/30',         text: 'text-amber-600 dark:text-amber-400' }
  if (chat.id === 'role:admin')   return { icon: Shield,        bg: 'bg-red-100 dark:bg-red-900/30',             text: 'text-red-600 dark:text-red-400' }
  return { icon: Hash, bg: 'bg-secondary', text: 'text-secondary-foreground' }
}

function GroupsPageContent() {
  const { profile, user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [presenceProfiles, setPresenceProfiles] = useState<Profile[]>([])
  const [activeChatId, setActiveChatId] = useState<string>('hub')
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  const [planningGroups, setPlanningGroups] = useState<PlanningGroup[]>([])
  const [selectedJoinGroup, setSelectedJoinGroup] = useState('')
  const { joinGroup, leaveGroup, isJoining, isLeaving } = useGroupJoin()

  useEffect(() => {
    if (authLoading) return

    if (!profile?.is_approved) {
      if (!authLoading) setLoading(false)
      return
    }

    const messageSnapshots = new Map<string, GroupMessage[]>()
    const unsubscribeMessages: Array<() => void> = []

    const syncMessages = () => {
      const merged = Array.from(messageSnapshots.values()).flat()
      merged.sort((left, right) => toDate(right.created_at).getTime() - toDate(left.created_at).getTime())
      setMessages(merged)
      setLoading(false)
    }

    const subscribeToMessages = (sourceKey: string, q: ReturnType<typeof query>) => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        messageSnapshots.set(
          sourceKey,
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>
            return { id: docSnap.id, ...data } as GroupMessage
          })
        )
        syncMessages()
      }, (error) => {
        console.error(`Error listening to group messages (${sourceKey}):`, error)
        messageSnapshots.delete(sourceKey)
        syncMessages()
      })

      unsubscribeMessages.push(unsubscribe)
    }

    subscribeToMessages('hub', query(
      collection(db, 'group_messages'),
      where('type', '==', 'hub'),
      where('group_name', '==', 'hub')
    ))

    const ownGroups = profile.planning_groups || []
    ownGroups.forEach((groupName) => {
      subscribeToMessages(`group:${groupName}`, query(
        collection(db, 'group_messages'),
        where('type', '==', 'internal'),
        where('group_name', '==', groupName)
      ))
    })

    subscribeToMessages('role:viewer', query(
      collection(db, 'group_messages'),
      where('type', '==', 'role'),
      where('role_access', '==', 'viewer')
    ))

    if (['planner', 'admin', 'admin_main', 'admin_co'].includes(profile.role || '')) {
      subscribeToMessages('role:planner', query(
        collection(db, 'group_messages'),
        where('type', '==', 'role'),
        where('role_access', '==', 'planner')
      ))
    }

    if (['admin', 'admin_main', 'admin_co'].includes(profile.role || '')) {
      subscribeToMessages('role:admin', query(
        collection(db, 'group_messages'),
        where('type', '==', 'role'),
        where('role_access', '==', 'admin')
      ))
    }

    setLoading(false)

    return () => {
      unsubscribeMessages.forEach((unsubscribe) => unsubscribe())
    }
  }, [authLoading, profile?.is_approved])

  useEffect(() => {
    if (authLoading || !profile?.id) return

    const updateLastVisited = async () => {
      try {
        const now = new Date()
        const lastVisitedStr = profile.last_visited?.gruppen
        const lastVisited = lastVisitedStr ? new Date(lastVisitedStr) : new Date(0)

        if (!lastVisitedStr || (now.getTime() - lastVisited.getTime() > 5 * 60 * 1000)) {
          const userRef = doc(db, 'profiles', profile.id)
          await updateDoc(userRef, {
            [`last_visited.gruppen`]: now.toISOString(),
          })
        }
      } catch (error) {
        console.error('Error updating last_visited for groups:', error)
      }
    }

    updateLastVisited()
  }, [authLoading, profile?.id, profile?.last_visited?.gruppen])

  useEffect(() => {
    if (authLoading || !profile?.is_approved) {
      setPresenceProfiles([])
      return
    }

    const unsubscribeProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const rows = snapshot.docs
        .map((profileDoc) => ({ id: profileDoc.id, ...profileDoc.data() } as Profile))
        .filter((profileRow) => profileRow.is_approved)
      setPresenceProfiles(rows)
    }, (error) => {
      console.error('Error listening to profile presence:', error)
      setPresenceProfiles([])
    })

    return () => unsubscribeProfiles()
  }, [authLoading, profile?.is_approved])

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config')
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings
        setPlanningGroups(data.planning_groups || [])
      }
    }, (error) => {
      console.error('Error listening to settings config:', error)
    })

    return () => unsubscribeSettings()
  }, [])

  const chats = useMemo<ChatItem[]>(() => {
    const ownGroups = profile?.planning_groups || []
    const latestByGroup = new Map<string, GroupMessage | null>()
    const latestOwnMessageByChatId = new Map<string, number>()

    ownGroups.forEach((group) => {
      latestByGroup.set(group, null)
    })

    let latestHubMessage: GroupMessage | null = null
    const latestByRole = new Map<string, GroupMessage | null>()

    for (const msg of messages) {
      if (user?.uid && msg.created_by === user.uid) {
        let chatId: string | null = null

        if (msg.type === 'hub' && msg.group_name === 'hub') {
          chatId = 'hub'
        } else if (msg.type === 'internal') {
          chatId = `group:${msg.group_name}`
        } else if (msg.type === 'role' && msg.role_access) {
          chatId = `role:${msg.role_access}`
        }

        if (chatId) {
          const messageTime = getLastMessageTime(msg)
          const knownTime = latestOwnMessageByChatId.get(chatId) ?? 0
          if (messageTime > knownTime) {
            latestOwnMessageByChatId.set(chatId, messageTime)
          }
        }
      }

      if (msg.type === 'hub' && msg.group_name === 'hub' && !latestHubMessage) {
        latestHubMessage = msg
      }

      if (msg.type === 'internal' && latestByGroup.has(msg.group_name) && !latestByGroup.get(msg.group_name)) {
        latestByGroup.set(msg.group_name, msg)
      }

      if (msg.type === 'role' && msg.role_access && !latestByRole.get(msg.role_access)) {
        latestByRole.set(msg.role_access, msg)
      }
    }

    const internalChats: ChatItem[] = ownGroups.map((groupName) => ({
      id: `group:${groupName}`,
      label: groupName,
      type: 'internal',
      groupName,
      latestMessage: latestByGroup.get(groupName) ?? null,
    }))

    const hubChat: ChatItem = {
      id: 'hub',
      label: 'Global Chat',
      type: 'hub',
      groupName: 'hub',
      latestMessage: latestHubMessage,
    }

    const isPlanner = ['planner', 'admin', 'admin_main', 'admin_co'].includes(profile?.role || '')
    const isAdmin = ['admin', 'admin_main', 'admin_co'].includes(profile?.role || '')

    const systemChat: ChatItem = {
      id: 'system',
      label: 'Posteingang',
      type: 'role',
      groupName: 'system',
      roleAccess: 'system',
      latestMessage: null,
    }

    const roleChats: ChatItem[] = [
      {
        id: 'role:viewer',
        label: 'Öffentlicher Chat',
        type: 'role',
        groupName: 'viewer',
        roleAccess: 'viewer',
        latestMessage: latestByRole.get('viewer') ?? null,
      }
    ]

    if (isPlanner) {
      roleChats.push({
        id: 'role:planner',
        label: 'Planer-Chat',
        type: 'role',
        groupName: 'planner',
        roleAccess: 'planner',
        latestMessage: latestByRole.get('planner') ?? null,
      })
    }

    if (isAdmin) {
      roleChats.push({
        id: 'role:admin',
        label: 'Admin-Intern',
        type: 'role',
        groupName: 'admin',
        roleAccess: 'admin',
        latestMessage: latestByRole.get('admin') ?? null,
      })
    }

    const baseChats = [hubChat, systemChat, ...roleChats, ...internalChats].sort((a, b) => {
      const ownTimeA = latestOwnMessageByChatId.get(a.id) ?? 0
      const ownTimeB = latestOwnMessageByChatId.get(b.id) ?? 0

      if (ownTimeA !== ownTimeB) {
        return ownTimeB - ownTimeA
      }

      const timeA = getLastMessageTime(a.latestMessage)
      const timeB = getLastMessageTime(b.latestMessage)
      
      if (timeA === 0 && timeB === 0) return 0
      
      return timeB - timeA
    })

    const abiBotChat: ChatItem = {
      id: 'bot:abi',
      label: 'ABI Bot',
      type: 'hub',
      groupName: 'hub',
      latestMessage: null,
      isAbiBot: true,
    }

    return [...baseChats, abiBotChat]
  }, [messages, profile?.planning_groups, profile?.role, user?.uid])

  useEffect(() => {
    if (chats.length === 0) return
    const currentExists = chats.some((chat) => chat.id === activeChatId)
    if (!currentExists) {
      setActiveChatId(chats[0].id)
    }
  }, [activeChatId, chats])

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0] || null

  const canManageActiveChat = !!(
    activeChat
    && (
      profile?.role === 'planner'
      || profile?.role === 'admin_main'
      || profile?.role === 'admin_co'
      || profile?.role === 'admin'
      || (activeChat.type === 'internal' && profile?.led_groups?.includes(activeChat.groupName))
    )
  )

  const joinableGroups = useMemo(() => {
    const own = new Set(profile?.planning_groups || [])
    return planningGroups
      .map((group) => group.name)
      .filter((groupName): groupName is string => !!groupName && !own.has(groupName))
  }, [planningGroups, profile?.planning_groups])

  const canCreateGroup = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  const groupedChats = useMemo(() => ({
    systemAndRole: chats.filter((c) => c.type === 'hub' || c.type === 'role' || c.id === 'system' || c.isAbiBot),
    internal: chats.filter((c) => c.type === 'internal'),
  }), [chats])

  const onlineCountByChatId = useMemo(() => {
    const counts = new Map<string, number>()

    for (const chat of chats) {
      const count = presenceProfiles.reduce((acc, presenceProfile) => {
        const onlineState = getOnlineStatus(!!presenceProfile.isOnline, presenceProfile.lastOnline)
        if (!onlineState.isOnline) return acc

        if (chat.type === 'hub') return acc + 1
        if (chat.type === 'role') {
          if (chat.roleAccess === 'viewer') return acc + 1
          if (chat.roleAccess === 'planner') {
            const isP = ['planner', 'admin', 'admin_main', 'admin_co'].includes(presenceProfile.role || '')
            return isP ? acc + 1 : acc
          }
          if (chat.roleAccess === 'admin') {
            const isA = ['admin', 'admin_main', 'admin_co'].includes(presenceProfile.role || '')
            return isA ? acc + 1 : acc
          }
        }

        return presenceProfile.planning_groups?.includes(chat.groupName) ? acc + 1 : acc
      }, 0)

      counts.set(chat.id, count)
    }

    return counts
  }, [chats, presenceProfiles])

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-8">
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-12">
        <ProtectedSystemGate 
          title="Arbeitsgruppen gesperrt" 
          description="Die internen Planungsgruppen und deren Kommunikation sind privat. Bitte melde dich an, um mitzuplanen."
          icon={<Users className="h-10 w-10 text-primary" />}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-auto gap-4 md:gap-6 pb-4 md:pb-20">
      <div className={cn("shrink-0", isMobileChatOpen && "hidden lg:block")}>
        <h1 className="text-2xl md:text-4xl font-black tracking-tight">Gruppen</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 min-h-0">
        <aside className={cn(
          "lg:col-span-4 xl:col-span-3 h-full min-h-0 flex flex-col",
          isMobileChatOpen && "hidden lg:flex"
        )}>
          <Card className="flex-1 flex flex-col rounded-2xl md:rounded-3xl border border-border/50 shadow-2xl bg-background/60 backdrop-blur-xl overflow-hidden min-h-0">
            {/* Beitreten + Erstellen */}
            <div className="p-4 border-b border-border/50 bg-muted/20">
              <div className="space-y-3">
                <Select value={selectedJoinGroup} onValueChange={(v) => setSelectedJoinGroup(v ?? '')}>
                  <SelectTrigger className="w-full h-10 rounded-xl text-sm bg-background/50 border-primary/10">
                    <SelectValue placeholder="Gruppe wählen..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl border-primary/10">
                    {joinableGroups.map((name) => (
                      <SelectItem key={name} value={name} className="rounded-lg">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    className="flex-1 h-10 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20"
                    disabled={!selectedJoinGroup || isJoining || joinableGroups.length === 0}
                    onClick={async () => {
                      if (!selectedJoinGroup) return
                      const joined = await joinGroup(selectedJoinGroup)
                      if (joined) {
                        setActiveChatId(`group:${selectedJoinGroup}`)
                        setIsMobileChatOpen(true)
                        setSelectedJoinGroup('')
                      }
                    }}
                  >
                    {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Beitreten'}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 w-10 p-0 rounded-xl shrink-0 bg-background/50 border-primary/10 hover:border-primary/30"
                    render={<Link href="/admin/global-settings#planungsgruppen" />}
                    disabled={!canCreateGroup}
                    title={canCreateGroup ? 'Planungsgruppe erstellen' : 'Nur Admins können Gruppen erstellen'}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat-Liste */}
            <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
              {/* Sektion: Chats */}
              {groupedChats.systemAndRole.length > 0 && (
                <div className="mb-4">
                  <p className="px-3 pt-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Zentral</p>
                  <div className="space-y-1">
                    {groupedChats.systemAndRole.map((chat) => {
                      const { icon: ChatIcon, bg, text } = getChatIcon(chat)
                      const latestDate = chat.latestMessage ? toDate(chat.latestMessage.created_at) : null
                      const isActive = activeChat?.id === chat.id
                      const chatPreview = getChatPreview(chat.latestMessage)
                      const onlineCount = onlineCountByChatId.get(chat.id) ?? 0
                      return (
                        <button
                          key={chat.id}
                          onClick={() => { setActiveChatId(chat.id); setIsMobileChatOpen(true) }}
                          className="w-full text-left group"
                        >
                          <div className={cn(
                            'flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-300',
                            isActive ? 'bg-primary shadow-lg shadow-primary/20' : 'hover:bg-primary/5'
                          )}>
                            <div className={cn(
                              'h-10 w-10 rounded-xl shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                              isActive ? 'bg-primary-foreground/20' : bg
                            )}>
                              <ChatIcon className={cn('h-5 w-5', isActive ? 'text-primary-foreground' : text)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className={cn('text-sm font-black truncate', isActive ? 'text-primary-foreground' : 'text-foreground')}>
                                  {chat.label}
                                </p>
                                <span className={cn('text-[10px] shrink-0 font-medium', isActive ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                                  {latestDate ? format(latestDate, 'HH:mm', { locale: de }) : ''}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p className={cn('text-xs truncate font-medium', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground opacity-70')}>
                                  {chatPreview}
                                </p>
                                {onlineCount > 0 && (
                                  <span className={cn(
                                    "shrink-0 inline-flex items-center h-4 min-w-4 px-1 rounded-full text-[9px] font-black",
                                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/15 text-primary"
                                  )}>
                                    {onlineCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sektion: Meine Gruppen */}
              {groupedChats.internal.length > 0 && (
                <div className="mt-2">
                  <p className="px-3 pt-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Meine Gruppen</p>
                  <div className="space-y-1">
                    {groupedChats.internal.map((chat) => {
                      const { icon: ChatIcon, bg, text } = getChatIcon(chat)
                      const latestDate = chat.latestMessage ? toDate(chat.latestMessage.created_at) : null
                      const isActive = activeChat?.id === chat.id
                      const chatPreview = getChatPreview(chat.latestMessage)
                      const onlineCount = onlineCountByChatId.get(chat.id) ?? 0
                      return (
                        <ContextMenu key={chat.id}>
                          <ContextMenuTrigger
                            render={
                              <button
                                onClick={() => { setActiveChatId(chat.id); setIsMobileChatOpen(true) }}
                                className="w-full text-left group"
                              >
                                <div className={cn(
                                  'flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-300',
                                  isActive ? 'bg-primary shadow-lg shadow-primary/20' : 'hover:bg-primary/5'
                                )}>
                                  <div className={cn(
                                    'h-10 w-10 rounded-xl shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                                    isActive ? 'bg-primary-foreground/20' : bg
                                  )}>
                                    <ChatIcon className={cn('h-5 w-5', isActive ? 'text-primary-foreground' : text)} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className={cn('text-sm font-black truncate', isActive ? 'text-primary-foreground' : 'text-foreground')}>
                                        {chat.label}
                                      </p>
                                      <span className={cn('text-[10px] shrink-0 font-medium', isActive ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                                        {latestDate ? format(latestDate, 'HH:mm', { locale: de }) : ''}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                      <p className={cn('text-xs truncate font-medium', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground opacity-70')}>
                                        {chatPreview}
                                      </p>
                                      {onlineCount > 0 && (
                                        <span className={cn(
                                          "shrink-0 inline-flex items-center h-4 min-w-4 px-1 rounded-full text-[9px] font-black",
                                          isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/15 text-primary"
                                        )}>
                                          {onlineCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            }
                          />
                          <ContextMenuContent className="w-64 rounded-2xl p-2 shadow-2xl border-primary/10 backdrop-blur-xl">
                            <ContextMenuLabel className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 py-2">{chat.label}</ContextMenuLabel>
                            <ContextMenuSeparator className="bg-primary/10" />
                            <ContextMenuItem 
                              className="rounded-xl p-3 font-bold text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive transition-all gap-3"
                              disabled={isLeaving}
                              onClick={() => leaveGroup(chat.groupName)}
                            >
                              <LogOut className="h-4 w-4" /> 
                              <span>{isLeaving ? 'Verlasse...' : 'Gruppe verlassen'}</span>
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </aside>

        <div className={cn(
          "lg:col-span-8 xl:col-span-9 h-full min-h-0 flex flex-col",
          !isMobileChatOpen && "hidden lg:flex"
        )}>
          <div className="flex-1 min-h-0 flex flex-col">
            {isMobileChatOpen && (
              <div className="lg:hidden shrink-0 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 rounded-xl text-primary font-black text-[11px] uppercase tracking-widest hover:bg-primary/10 transition-all"
                  onClick={() => setIsMobileChatOpen(false)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Zurück zur Liste
                </Button>
              </div>
            )}

            {activeChat && activeChat.type === 'internal' && !activeChat.isAbiBot && (
              <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0 px-1">
                <AddTodoDialog defaultGroup={activeChat.groupName} />
                <AddEventDialog defaultGroup={activeChat.groupName} triggerLabel="Termin für diese Gruppe" />
              </div>
            )}

            <div className="flex-1 min-h-0">
              {activeChat && (
                <GroupWall
                  groupName={activeChat.groupName}
                  type={activeChat.id === 'system' ? 'system' : activeChat.type}
                  roleAccess={activeChat.roleAccess}
                  abiBotMode={!!activeChat.isAbiBot}
                  onlineCount={onlineCountByChatId.get(activeChat.id) ?? 0}
                  canManage={activeChat.id === 'system' ? false : canManageActiveChat}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-8">
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    }>
      <GroupsPageContent />
    </Suspense>
  )
}
