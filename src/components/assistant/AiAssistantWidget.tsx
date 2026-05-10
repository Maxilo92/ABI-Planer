'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, History, Plus, MessageSquare, Trash2, PanelRight, PanelRightClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { translations } from '@/lib/i18n/translations'
import { ChatMarkdown } from '@/components/groups/ChatMarkdown'
import { toast } from 'sonner'
import { useAiChats, AiMessage } from '@/hooks/useAiChats'
import {
  AssistantActionMode,
  AssistantActionProposal,
  getAssistantActionLabel,
  getAssistantActionSummary,
} from '@/lib/assistant-actions'

type AssistantContentProps = {
  isDocked: boolean
  setIsDocked: React.Dispatch<React.SetStateAction<boolean>>
  showHistory: boolean
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>
  startNewChat: () => void
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  locale: 'de' | 'en' | 'es'
  sessions: Array<{ id: string; title: string; messages: AiMessage[] }>
  currentSessionId: string | null
  loadSession: (sessionId: string) => void
  handleDeleteSession: (e: React.MouseEvent, sessionId: string) => Promise<void>
  messages: AiMessage[]
  isThinking: boolean
  pendingAction: AssistantActionProposal | null
  pendingActionMode: AssistantActionMode
  canPersistAssistantActions: boolean
  isExecutingAction: boolean
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSend: (e?: React.FormEvent) => Promise<void>
  handleExecutePendingAction: () => Promise<void>
  dismissPendingAction: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  t: {
    welcome: string
    placeholder: string
  }
}

const AssistantContent = React.memo(({ 
  isDocked, 
  setIsDocked, 
  showHistory, 
  setShowHistory, 
  startNewChat, 
  setIsOpen, 
  locale, 
  sessions, 
  currentSessionId, 
  loadSession, 
  handleDeleteSession, 
  messages, 
  isThinking, 
  pendingAction,
  pendingActionMode,
  canPersistAssistantActions,
  isExecutingAction,
  input, 
  setInput, 
  handleSend, 
  handleExecutePendingAction,
  dismissPendingAction,
  scrollRef,
  t 
}: AssistantContentProps) => (
  <>
    {/* Header */}
    <div className="p-4 border-b border-border flex flex-row items-center justify-between shrink-0 bg-background">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold tracking-tight">AI Assistant</h2>
      </div>
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsDocked(!isDocked)} 
          className="hidden lg:flex h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
          title={isDocked ? "Undock" : "Dock"}
        >
          {isDocked ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowHistory(!showHistory)} 
          className={cn("h-8 w-8 rounded-md transition-colors", showHistory ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <History className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={startNewChat} 
          className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(false)} 
          className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>

    {/* Content Area */}
    <div className="flex-1 overflow-hidden relative bg-background">
      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 overflow-y-auto p-4 space-y-2 scrollbar-none bg-background z-10"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
              {locale === 'en' ? 'Chat History' : locale === 'es' ? 'Historial de chat' : 'Chat-Verlauf'}
            </h3>
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {locale === 'en' ? 'No chats yet' : locale === 'es' ? 'No hay chats aún' : 'Noch keine Chats'}
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group",
                    currentSessionId === session.id 
                      ? "bg-muted text-foreground" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="text-sm truncate">{session.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col"
          >
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none"
              >
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="p-3 bg-muted rounded-full w-fit mx-auto">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                    {t.welcome}
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {m.role === 'assistant' && (
                    <div className="shrink-0 mt-1">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    "text-sm leading-relaxed",
                    m.role === 'user' 
                      ? "bg-muted px-4 py-2.5 rounded-2xl" 
                      : "text-foreground"
                  )}>
                    <ChatMarkdown content={m.content} />
                  </div>
                </div>
              ))}

              {pendingAction && (
                <div className="mr-auto max-w-[92%] rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        {pendingActionMode === 'draft_only' ? 'Entwurf' : 'Bestätigung erforderlich'}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {getAssistantActionLabel(pendingAction)} anlegen
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={dismissPendingAction} className="text-muted-foreground">
                      Verwerfen
                    </Button>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {getAssistantActionSummary(pendingAction).map((line) => (
                      <div key={line} className="leading-relaxed">
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {canPersistAssistantActions && pendingActionMode !== 'draft_only' ? (
                      <Button onClick={handleExecutePendingAction} disabled={isExecutingAction} size="sm">
                        {isExecutingAction ? 'Speichere...' : 'Erstellen'}
                      </Button>
                    ) : (
                      <Button onClick={dismissPendingAction} size="sm" variant="secondary">
                        Nur als Entwurf behalten
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {isThinking && (
                <div className="flex gap-3 mr-auto">
                  <div className="shrink-0 mt-1">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 h-7">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse" style={{ animationDelay: '200ms' }}>●</span>
                    <span className="animate-pulse" style={{ animationDelay: '400ms' }}>●</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background shrink-0">
              <form 
                onSubmit={handleSend}
                className="relative flex items-center border border-border rounded-xl bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all"
              >
                <Input
                  placeholder={t.placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isThinking}
                  className="flex-1 border-0 focus-visible:ring-0 bg-transparent shadow-none px-4 py-3 h-auto min-h-[44px]"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="ghost"
                  onMouseDown={(event) => event.preventDefault()}
                  disabled={!input.trim() || isThinking}
                  className="h-8 w-8 mr-2 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-muted-foreground">AI can make mistakes. Check important info.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </>
))

AssistantContent.displayName = 'AssistantContent'

export function AiAssistantWidget({ locale = 'de' }: { locale?: 'de' | 'en' | 'es' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDocked, setIsDocked] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<AssistantActionProposal | null>(null)
  const [pendingActionMode, setPendingActionMode] = useState<AssistantActionMode>('none')
  const [isExecutingAction, setIsExecutingAction] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user, profile } = useAuth()
  const { sessions, createSession, updateSession, deleteSession } = useAiChats()

  const langKey = (locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'de-DE') as keyof typeof translations
  const langTranslations = translations[langKey] || translations['de-DE']
  const t = (langTranslations?.supportCenter || translations['de-DE'].supportCenter).aiAssistant
  const canPersistAssistantActions = Boolean(profile && ['planner', 'admin', 'admin_main', 'admin_co'].includes(profile.role))

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking, showHistory])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isThinking) return

    const userMessage: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsThinking(true)
    setPendingAction(null)
    setPendingActionMode('none')

    let activeSessionId = currentSessionId

    try {
      if (!activeSessionId) {
        activeSessionId = await createSession(userMessage)
        setCurrentSessionId(activeSessionId)
      } else {
        await updateSession(activeSessionId, newMessages)
      }

      const idToken = user ? await user.getIdToken() : null
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          messages: newMessages.slice(-20).map(m => ({ role: m.role, content: m.content })),
          locale
        })
      })

      const data = await response.json()

      if (response.status === 429) {
        toast.error(t.rateLimit)
        setIsThinking(false)
        return
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to respond')
      }

      if (data.action) {
        setPendingAction(data.action)
        setPendingActionMode(data.actionMode || 'confirmable')
      }

      const assistantMessage: AiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)
      
      if (activeSessionId) {
        await updateSession(activeSessionId, finalMessages)
      }

    } catch (error) {
      console.error('AiAssistantWidget error:', error)
      toast.error(t.error)
    } finally {
      setIsThinking(false)
    }
  }

  const handleExecutePendingAction = async () => {
    if (!pendingAction || isExecutingAction) return

    if (!canPersistAssistantActions) {
      toast.info(locale === 'de' ? 'Nur Planer und Admins können Assistenten-Aktionen direkt speichern. Der Entwurf bleibt im Chat.' : 'Only planners and admins can save assistant actions directly.')
      return
    }

    const idToken = user ? await user.getIdToken() : null
    if (!idToken) {
      toast.error(t.error)
      return
    }

    setIsExecutingAction(true)
    try {
      const response = await fetch('/api/ai/assistant/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action: pendingAction, locale }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Action execution failed')
      }

      const confirmationMessage: AiMessage = {
        id: (Date.now() + 2).toString(),
        role: 'system',
        content: data.message || `${getAssistantActionLabel(pendingAction)} wurde erstellt.`,
      }

      const nextMessages = [...messages, confirmationMessage]
      setMessages(nextMessages)

      if (currentSessionId) {
        await updateSession(currentSessionId, nextMessages)
      }

      setPendingAction(null)
      setPendingActionMode('none')
      toast.success(data.message || 'Aktion ausgeführt.')
    } catch (error) {
      console.error('Failed to execute assistant action:', error)
      toast.error(t.error)
    } finally {
      setIsExecutingAction(false)
    }
  }

  const dismissPendingAction = () => {
    setPendingAction(null)
    setPendingActionMode('none')
  }

  const startNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    setShowHistory(false)
    setPendingAction(null)
    setPendingActionMode('none')
  }

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(session.id)
      setMessages(session.messages)
      setShowHistory(false)
      setPendingAction(null)
      setPendingActionMode('none')
    }
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    try {
      await deleteSession(sessionId)
      if (currentSessionId === sessionId) {
        startNewChat()
      }
      toast.success(locale === 'en' ? 'Chat deleted' : locale === 'es' ? 'Chat eliminado' : 'Chat gelöscht')
    } catch (error) {
      console.error('Failed to delete session:', error)
      toast.error(t.error)
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 bg-primary text-primary-foreground"
            >
              <Sparkles className="h-6 w-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile: Fullscreen Overlay */}
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-0 z-[100] flex flex-col bg-background lg:hidden"
            >
              <AssistantContent 
                isDocked={isDocked} 
                setIsDocked={setIsDocked}
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                startNewChat={startNewChat}
                setIsOpen={setIsOpen}
                locale={locale}
                sessions={sessions}
                currentSessionId={currentSessionId}
                loadSession={loadSession}
                handleDeleteSession={handleDeleteSession}
                messages={messages}
                isThinking={isThinking}
                pendingAction={pendingAction}
                pendingActionMode={pendingActionMode}
                canPersistAssistantActions={canPersistAssistantActions}
                isExecutingAction={isExecutingAction}
                input={input}
                setInput={setInput}
                handleSend={handleSend}
                handleExecutePendingAction={handleExecutePendingAction}
                dismissPendingAction={dismissPendingAction}
                scrollRef={scrollRef}
                t={t}
              />
            </motion.div>

            {/* Desktop: Split Screen (pushes content aside) */}
            {isDocked ? (
              <motion.div 
                key="docked"
                initial={{ width: 0, opacity: 0 }} 
                animate={{ width: '50vw', opacity: 1 }} 
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="hidden lg:flex flex-col border-l border-border bg-background h-[100dvh] sticky top-0 shrink-0 overflow-hidden"
              >
                {/* Inner container to prevent content squishing during animation */}
                <div className="w-[50vw] h-full flex flex-col">
                  <AssistantContent 
                    isDocked={isDocked} 
                    setIsDocked={setIsDocked}
                    showHistory={showHistory}
                    setShowHistory={setShowHistory}
                    startNewChat={startNewChat}
                    setIsOpen={setIsOpen}
                    locale={locale}
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    loadSession={loadSession}
                    handleDeleteSession={handleDeleteSession}
                    messages={messages}
                    isThinking={isThinking}
                    pendingAction={pendingAction}
                    pendingActionMode={pendingActionMode}
                    canPersistAssistantActions={canPersistAssistantActions}
                    isExecutingAction={isExecutingAction}
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    handleExecutePendingAction={handleExecutePendingAction}
                    dismissPendingAction={dismissPendingAction}
                    scrollRef={scrollRef}
                    t={t}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="undocked"
                initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="hidden lg:flex flex-col fixed bottom-24 right-6 w-[400px] h-[600px] max-h-[80vh] rounded-[2rem] shadow-2xl border border-border bg-background z-[100] overflow-hidden"
              >
                <AssistantContent 
                  isDocked={isDocked} 
                  setIsDocked={setIsDocked}
                  showHistory={showHistory}
                  setShowHistory={setShowHistory}
                  startNewChat={startNewChat}
                  setIsOpen={setIsOpen}
                  locale={locale}
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  loadSession={loadSession}
                  handleDeleteSession={handleDeleteSession}
                  messages={messages}
                  isThinking={isThinking}
                  pendingAction={pendingAction}
                  pendingActionMode={pendingActionMode}
                  canPersistAssistantActions={canPersistAssistantActions}
                  isExecutingAction={isExecutingAction}
                  input={input}
                  setInput={setInput}
                  handleSend={handleSend}
                  handleExecutePendingAction={handleExecutePendingAction}
                  dismissPendingAction={dismissPendingAction}
                  scrollRef={scrollRef}
                  t={t}
                />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  )
}
