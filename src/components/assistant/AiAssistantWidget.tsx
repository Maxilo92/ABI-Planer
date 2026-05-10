'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, History, Plus, MessageSquare, Trash2, PanelRight, PanelRightClose, Maximize2, Minimize2, MoreHorizontal, Bot, MessageCircle, Paperclip, Ghost, Coffee, Zap, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Info, Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { translations } from '@/lib/i18n/translations'
import { ChatMarkdown } from '@/components/groups/ChatMarkdown'
import { toast } from 'sonner'
import { NftAvatar } from '@/components/ui/nft-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAiChats, AiMessage } from '@/hooks/useAiChats'
import {
  AssistantActionMode,
  AssistantActionProposal,
  BotQuestion,
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
  pendingQuestion: BotQuestion | null
  canPersistAssistantActions: boolean
  isExecutingAction: boolean
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSend: (e?: React.FormEvent) => Promise<void>
  handleSendText: (text: string) => void
  setMessages: React.Dispatch<React.SetStateAction<AiMessage[]>>
  handleExecutePendingAction: () => Promise<void>
  dismissPendingAction: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  t: {
    welcome: string
    placeholder: string
  }
  isFullscreen: boolean
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>
  botMode: 'default' | 'smalltalk' | 'creative' | 'sassy' | 'annoyed' | 'trashy'
  setBotMode: React.Dispatch<React.SetStateAction<'default' | 'smalltalk' | 'creative' | 'sassy' | 'annoyed' | 'trashy'>>
  handleFeedback: (messageId: string, feedback: 'positive' | 'negative') => Promise<void>
}

// Bot profile constants for local UI
const BOT_PROFILE = {
  name: 'ABI Bot',
  avatar: '/images/bot/avatar.png',
}

const TypewriterMarkdown = React.memo(({ content, speed = 20, onComplete }: { content: string, speed?: number, onComplete?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('')
  
  useEffect(() => {
    let index = 0
    let timer: NodeJS.Timeout
    
    const animate = () => {
      if (index <= content.length) {
        setDisplayedContent(content.slice(0, index))
        index += 2 // Reveal 2 characters at a time for better speed feeling
        timer = setTimeout(animate, speed)
      } else {
        onComplete?.()
      }
    }
    
    animate()
    return () => clearTimeout(timer)
  }, [content, speed, onComplete])

  return (
    <div className="relative">
      <ChatMarkdown content={displayedContent} />
      {displayedContent.length < content.length && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse vertical-middle" />
      )}
    </div>
  )
})

TypewriterMarkdown.displayName = 'TypewriterMarkdown'

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
  pendingQuestion,
  canPersistAssistantActions,
  isExecutingAction,
  input, 
  setInput, 
  handleSend, 
  handleSendText,
  setMessages,
  handleExecutePendingAction,
  dismissPendingAction,
  scrollRef,
  t,
  isFullscreen,
  setIsFullscreen,
  botMode,
  setBotMode,
  handleFeedback
}: AssistantContentProps) => {
  const [questionInput, setQuestionInput] = useState('')
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const isTypingAny = messages.some(m => (m as any).isTyping)
  const isBlocked = isThinking || isTypingAny

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('In die Zwischenablage kopiert')
  }

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({ ...prev, [msgId]: !prev[msgId] }))
  }

  const currentSession = sessions.find(s => s.id === currentSessionId)
  const displayTitle = currentSession?.title && currentSession.title !== 'Neuer Chat...' && currentSession.title !== 'Neuer Chat' 
    ? currentSession.title 
    : null

  return (
  <>
    {/* Header */}
    <div className="p-4 border-b border-border flex flex-row items-center justify-between shrink-0 bg-background gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/profil/abi-bot" className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0 text-left group/botheader">
          <div className="flex flex-col min-w-0">
            <h2 className="text-base font-semibold tracking-tight shrink-0 group-hover/botheader:text-primary transition-colors flex items-center gap-1.5">
              ABI Bot
              <ExternalLink className="h-3 w-3 opacity-0 group-hover/botheader:opacity-100 transition-opacity" />
            </h2>
          </div>
        </Link>
        {displayTitle && (
          <>
            <span className="text-muted-foreground/30 shrink-0 mx-1">|</span>
            <span className="text-sm text-muted-foreground truncate" title={displayTitle}>
              {displayTitle}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsDocked(!isDocked)} 
          className="hidden lg:flex h-8 w-8 rounded-md text-muted-foreground hover:text-foreground shrink-0"
          title={isDocked ? "Undock" : "Dock"}
        >
          {isDocked ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsFullscreen(!isFullscreen)} 
          className="hidden lg:flex h-8 w-8 rounded-md text-muted-foreground hover:text-foreground shrink-0"
          title={isFullscreen ? "Minimize" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowHistory(!showHistory)} 
          className={cn("h-8 w-8 rounded-md transition-colors shrink-0", showHistory ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <History className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={startNewChat} 
          className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(false)} 
          className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground shrink-0"
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
              {messages.map((m, index) => {
                const isLatest = index === messages.length - 1
                const isAssistant = m.role === 'assistant'
                const isUser = m.role === 'user'
                const hasThought = isAssistant && m.thought

                return (
                  <motion.div
                    key={m.id}
                    initial={isLatest ? { opacity: 0, y: 10 } : false}
                    animate={isLatest ? { opacity: 1, y: 0 } : false}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {isAssistant && (
                        <Link 
                          href="/profil/abi-bot"
                          className="relative group/bot transition-transform hover:scale-110 active:scale-95 shrink-0 mt-1"
                        >
                          <NftAvatar isBot interactive={false} className="h-8 w-8 border border-primary/20 shadow-sm" />
                          {isLatest && (
                            <motion.div 
                              className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                              transition={{ duration: 3, repeat: Infinity }}
                            />
                          )}
                        </Link>
                    )}
                    <div className={cn(
                      "flex flex-col gap-2",
                      isUser ? "items-end" : "items-start"
                    )}>
                        {hasThought && (
                          <div className="mb-1">
                            <button
                              onClick={() => toggleThought(m.id)}
                              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group"
                            >
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/60"></span>
                              </span>
                              Thinking...
                              {expandedThoughts[m.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            
                            <AnimatePresence>
                              {expandedThoughts[m.id] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border/50 text-[13px] text-muted-foreground italic leading-relaxed backdrop-blur-sm max-w-[400px]">
                                    {m.thought}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                        
                        <div className={cn(
                          "text-sm leading-relaxed",
                          isUser
                            ? "bg-muted px-4 py-2.5 rounded-2xl shadow-sm"
                            : "text-foreground"
                        )}>
                          {isAssistant && (m as any).isTyping ? (
                            <TypewriterMarkdown 
                              content={m.content} 
                              onComplete={() => {
                                // Mark as done typing in parent state
                                if (setMessages) {
                                  setMessages(prev => prev.map(msg => 
                                    msg.id === m.id ? { ...msg, isTyping: false } : msg
                                  ))
                                }
                              }}
                            />
                          ) : (
                            <ChatMarkdown content={m.content} />
                          )}
                        </div>

                        {isAssistant && (
                          <div className="flex items-center gap-2 mt-1 px-1">
                            <div className="flex items-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFeedback(m.id, 'positive')}
                                className={cn(
                                  "h-7 w-7 rounded-md transition-all",
                                  m.feedback === 'positive' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <ThumbsUp className={cn("h-3.5 w-3.5", m.feedback === 'positive' && "fill-current")} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFeedback(m.id, 'negative')}
                                className={cn(
                                  "h-7 w-7 rounded-md transition-all",
                                  m.feedback === 'negative' ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <ThumbsDown className={cn("h-3.5 w-3.5", m.feedback === 'negative' && "fill-current")} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(m.id, m.content)}
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                              >
                                {copiedId === m.id ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>

                            <div className="ml-auto">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="end" className="w-64 p-3">
                                  <PopoverHeader>
                                    <PopoverTitle className="text-xs uppercase tracking-wider text-muted-foreground">KI Modell Details</PopoverTitle>
                                  </PopoverHeader>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">Modell:</span>
                                      <span className="text-xs font-mono font-medium">{m.model || 'Groq Llama 3.1'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">Provider:</span>
                                      <span className="text-xs font-medium">Groq API</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                                      Diese Antwort wurde mit modernster KI-Technologie generiert. Feedback hilft uns, den Bot zu verbessern.
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                )
              })}

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

              {/* Interactive Bot Question */}
              {pendingQuestion && !isBlocked && (
                <div className="mr-auto max-w-[92%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">{pendingQuestion.prompt}</p>
                    
                    {pendingQuestion.type === 'multiple_choice' && pendingQuestion.options && (
                      <div className="flex flex-wrap gap-2">
                        {pendingQuestion.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleSendText(option)}
                            className={cn(
                              "px-3.5 py-2 text-sm font-medium rounded-xl border-2 border-primary/20",
                              "bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary",
                              "transition-all duration-200 active:scale-95",
                              "focus:outline-none focus:ring-2 focus:ring-primary/30"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {pendingQuestion.type === 'text_input' && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          if (questionInput.trim()) {
                            handleSendText(questionInput.trim())
                            setQuestionInput('')
                          }
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          value={questionInput}
                          onChange={(e) => setQuestionInput(e.target.value)}
                          placeholder={pendingQuestion.placeholder || 'Deine Antwort...'}
                          className="flex-1 rounded-xl border-2 border-primary/20 focus:border-primary bg-background h-10"
                          autoFocus
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!questionInput.trim() || isBlocked}
                          className="rounded-xl h-10 px-4"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
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
                id="abi-bot-chat-form"
                onSubmit={handleSend}
                className="relative flex items-center border border-border rounded-xl bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                      type="button"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="w-56 mb-1">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span>Modus wechseln</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        <DropdownMenuItem 
                          onClick={() => setBotMode('default')}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Bot className={cn("h-4 w-4", botMode === 'default' ? "text-primary" : "text-muted-foreground")} />
                          <span className={botMode === 'default' ? "font-medium" : ""}>Planer Modus</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setBotMode('creative')}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Sparkles className={cn("h-4 w-4", botMode === 'creative' ? "text-primary" : "text-muted-foreground")} />
                          <span className={botMode === 'creative' ? "font-medium" : ""}>Kreativ Modus</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setBotMode('smalltalk')}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <MessageCircle className={cn("h-4 w-4", botMode === 'smalltalk' ? "text-primary" : "text-muted-foreground")} />
                          <span className={botMode === 'smalltalk' ? "font-medium" : ""}>Smalltalk Modus</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setBotMode('sassy')}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Zap className={cn("h-4 w-4", botMode === 'sassy' ? "text-primary" : "text-muted-foreground")} />
                          <span className={botMode === 'sassy' ? "font-medium" : ""}>Sassy Modus</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setBotMode('annoyed')}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Coffee className={cn("h-4 w-4", botMode === 'annoyed' ? "text-primary" : "text-muted-foreground")} />
                          <span className={botMode === 'annoyed' ? "font-medium" : ""}>Genervter Modus</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setBotMode('trashy')}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Ghost className={cn("h-4 w-4", botMode === 'trashy' ? "text-primary" : "text-muted-foreground")} />
                          <span className={botMode === 'trashy' ? "font-medium" : ""}>Asozialer Modus</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem disabled className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span>Anhang (Bald verfügbar)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Input
                  maxLength={1000}
                  placeholder={isBlocked ? (locale === 'de' ? 'Warte auf Antwort...' : locale === 'es' ? 'Esperando respuesta...' : 'Waiting for response...') : t.placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isBlocked}
                  className="flex-1 border-0 focus-visible:ring-0 bg-transparent shadow-none px-4 py-3 h-auto min-h-[44px] disabled:opacity-50"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="ghost"
                  onMouseDown={(event) => event.preventDefault()}
                  disabled={!input.trim() || isBlocked}
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
  )
})

AssistantContent.displayName = 'AssistantContent'

export function AiAssistantWidget({ locale = 'de', displace = false }: { locale?: 'de' | 'en' | 'es', displace?: boolean }) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('abi-bot-open')
      return saved === 'true'
    }
    return false
  })
  
  // Save isOpen state
  useEffect(() => {
    localStorage.setItem('abi-bot-open', isOpen.toString())
  }, [isOpen])
  const [isDocked, setIsDocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('abi-bot-docked')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })
  
  // Save isDocked state
  useEffect(() => {
    localStorage.setItem('abi-bot-docked', isDocked.toString())
  }, [isDocked])
  const [showHistory, setShowHistory] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<AssistantActionProposal | null>(null)
  const [pendingActionMode, setPendingActionMode] = useState<AssistantActionMode>('none')
  const [pendingQuestion, setPendingQuestion] = useState<BotQuestion | null>(null)
  const [isExecutingAction, setIsExecutingAction] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(40) // vw
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [botMode, setBotMode] = useState<'default' | 'smalltalk' | 'creative' | 'sassy' | 'annoyed' | 'trashy'>('default')
  
  // Load saved width on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('abi-bot-sidebar-width')
    if (savedWidth) {
      const parsed = parseFloat(savedWidth)
      if (!isNaN(parsed) && parsed >= 20 && parsed <= 50) {
        setSidebarWidth(parsed)
      }
    }
  }, [])
  
  // Save width when it changes
  useEffect(() => {
    localStorage.setItem('abi-bot-sidebar-width', sidebarWidth.toString())
  }, [sidebarWidth])
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const { user, profile } = useAuth()
  const { sessions, createSession, updateSession, updateSessionTitle, deleteSession } = useAiChats()

  const langKey = (locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'de-DE') as keyof typeof translations
  const langTranslations = translations[langKey] || translations['de-DE']
  const t = (langTranslations?.supportCenter || translations['de-DE'].supportCenter).aiAssistant
  const canPersistAssistantActions = Boolean(profile && ['planner', 'admin', 'admin_main', 'admin_co'].includes(profile.role))

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const newWidthPx = window.innerWidth - e.clientX
      const newWidthVw = (newWidthPx / window.innerWidth) * 100
      
      // limit between 20vw and 50vw
      if (newWidthVw >= 20 && newWidthVw <= 50) {
        setSidebarWidth(newWidthVw)
      }
    }

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = 'default'
        document.body.style.userSelect = 'auto'
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, isThinking, showHistory])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const isTypingAny = messages.some(m => (m as any).isTyping)
    if (!input.trim() || isThinking || isTypingAny) return

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
    setPendingQuestion(null)

    let activeSessionId = currentSessionId
    const isNewSession = !activeSessionId

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
          locale,
          botMode
        })
      })

      const data = await response.json()

      if (response.status === 429) {
        toast.error(t.rateLimit)
        setIsThinking(false)
        return
      }

      if (!response.ok || !data.ok) {
        const errorMsg = data.error || 'Failed to respond'
        const details = data.details ? ` (${data.details})` : ''
        throw new Error(`${errorMsg}${details}`)
      }

      if (data.action) {
        setPendingAction(data.action)
        setPendingActionMode(data.actionMode || 'confirmable')
      }

      if (data.question) {
        setPendingQuestion(data.question)
      }

      const assistantMessage: AiMessage & { isTyping?: boolean } = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        thought: data.thought || null,
        model: data.meta?.model,
        isTyping: true
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)
      
      if (activeSessionId) {
        await updateSession(activeSessionId, finalMessages)
      }

      if (isNewSession && activeSessionId) {
        const titleResponse = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
          },
          body: JSON.stringify({
            mode: 'title',
            messages: finalMessages.slice(0, 4).map(m => ({ role: m.role, content: m.content })),
            locale,
          })
        })

        const titleData = await titleResponse.json().catch(() => null)
        if (titleResponse.ok && titleData?.title) {
          await updateSessionTitle(activeSessionId, titleData.title)
        }
      }

    } catch (error) {
      console.error('AiAssistantWidget error:', error)
      toast.error(t.error)
    } finally {
      setIsThinking(false)
    }
  }

  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    const targetMessage = messages.find(m => m.id === messageId)
    if (!targetMessage) return

    const messageIndex = messages.findIndex(m => m.id === messageId)
    const promptMessage = messageIndex > 0 ? messages[messageIndex - 1] : null

    const isRemoving = targetMessage.feedback === feedback
    const updatedMessages = messages.map(m => {
      if (m.id === messageId) {
        const newFeedback = isRemoving ? undefined : feedback
        return { ...m, feedback: newFeedback }
      }
      return m
    })
    
    setMessages(updatedMessages)
    
    if (currentSessionId) {
      try {
        await updateSession(currentSessionId, updatedMessages)
        
        // If we just added feedback (not removed it), sync to dedicated feedback collection
        if (!isRemoving) {
          const idToken = user ? await user.getIdToken() : null
          fetch('/api/ai/assistant/feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
            },
            body: JSON.stringify({
              messageId,
              sessionId: currentSessionId,
              feedback,
              content: targetMessage.content,
              prompt: promptMessage?.content,
              model: targetMessage.model
            })
          }).catch(err => console.error('Silent feedback sync failed:', err))

          if (feedback === 'positive') {
            toast.success(locale === 'de' ? 'Freut mich, dass ich helfen konnte! ✨' : 'Glad I could help! ✨')
          } else {
            toast.info(locale === 'de' ? 'Danke für dein Feedback. Ich wurde an die Entwickler gemeldet, damit ich besser werde. 🛠️' : 'Thanks for the feedback. Reported to developers. 🛠️')
          }
        }
      } catch (error) {
        console.error('Failed to update session with feedback:', error)
      }
    }
  }

  const handleExecutePendingAction = async () => {
    if (!pendingAction || isExecutingAction) return

    if (!canPersistAssistantActions) {
      toast.info(locale === 'de' ? 'Nur Planer und Admins können Bot-Aktionen direkt speichern. Der Entwurf bleibt im Chat.' : 'Only planners and admins can save bot actions directly.')
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

  const handleSendText = (text: string) => {
    const isTypingAny = messages.some(m => (m as any).isTyping)
    if (!text.trim() || isThinking || isTypingAny) return
    setPendingQuestion(null)
    setInput(text.trim())
    // Use a microtask to ensure input state is set before triggering send
    setTimeout(() => {
      const form = document.getElementById('abi-bot-chat-form') as HTMLFormElement | null
      if (form) form.requestSubmit()
    }, 0)
  }

  const startNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    setShowHistory(false)
    setPendingAction(null)
    setPendingActionMode('none')
    setPendingQuestion(null)
  }

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(session.id)
      setMessages(session.messages)
      setShowHistory(false)
      setPendingAction(null)
      setPendingActionMode('none')
      setPendingQuestion(null)
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
      {/* Spacer for content displacement (only on desktop when docked and open) */}
      <AnimatePresence>
        {displace && isOpen && isDocked && !isFullscreen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: `${sidebarWidth}vw`, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="hidden lg:block shrink-0 h-screen transition-all"
            style={{ 
              width: `${sidebarWidth}vw`,
              maxWidth: '50vw',
              minWidth: '20vw'
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setIsOpen(true)}
              className="p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 group"
            >
              <Sparkles className="h-6 w-6 group-hover:animate-spin-slow" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Main Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[95] lg:hidden"
            />
            
            {/* Sidebar / Floating Container */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ width: isDocked && !isFullscreen ? `${sidebarWidth}vw` : undefined }}
              className={cn(
                "fixed top-0 right-0 h-full bg-background border-l border-border z-[100] flex flex-col shadow-2xl",
                !isDocked && "lg:top-6 lg:right-6 lg:h-[calc(100%-48px)] lg:max-w-md lg:rounded-2xl lg:border lg:overflow-hidden",
                isFullscreen && "lg:w-full lg:top-0 lg:right-0 lg:h-full lg:max-w-none lg:rounded-none lg:border-0"
              )}
            >
              {/* Resize Handle (only when docked) */}
              {isDocked && !isFullscreen && (
                <div 
                  className="absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-primary/30 transition-colors z-[110] hidden lg:block"
                  onMouseDown={() => {
                    isDragging.current = true
                    document.body.style.cursor = 'ew-resize'
                    document.body.style.userSelect = 'none'
                  }}
                />
              )}

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
                pendingQuestion={pendingQuestion}
                canPersistAssistantActions={canPersistAssistantActions}
                isExecutingAction={isExecutingAction}
                input={input}
                setInput={setInput}
                handleSend={handleSend}
                handleSendText={handleSendText}
                setMessages={setMessages}
                handleExecutePendingAction={handleExecutePendingAction}
                dismissPendingAction={dismissPendingAction}
                scrollRef={scrollRef}
                t={t}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
                botMode={botMode}
                setBotMode={setBotMode}
                handleFeedback={handleFeedback}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
