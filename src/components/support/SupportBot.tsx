'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, User, Sparkles, MessageSquare, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { translations } from '@/lib/i18n/translations'
import { ChatMarkdown } from '@/components/groups/ChatMarkdown'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isNotice?: boolean
}

export function SupportBot({ locale = 'de' }: { locale?: 'de' | 'en' | 'es' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const langKey = (locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'de-DE') as keyof typeof translations
  const langTranslations = translations[langKey] || translations['de-DE']
  const t = (langTranslations?.supportCenter || translations['de-DE'].supportCenter).supportBot
  const emptyAnswerHint =
    locale === 'en'
      ? 'I could not find a safe answer for this right now.'
      : locale === 'es'
        ? 'No he encontrado una respuesta segura para esto por ahora.'
        : 'Ich habe dazu gerade keine sichere Antwort gefunden.'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isThinking) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsThinking(true)

    try {
      const idToken = user ? await user.getIdToken() : null
      const response = await fetch('/api/support/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          locale
        })
      })

      const data = await response.json()

      if (response.status === 429) {
        toast.error(t.rateLimit)
        return
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to respond')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          typeof data.answer === 'string' && data.answer.trim().length > 0
            ? data.answer.trim()
            : emptyAnswerHint,
        isNotice: Boolean(data.emptyAnswer) || !(typeof data.answer === 'string' && data.answer.trim().length > 0)
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('SupportBot error:', error)
      toast.error(t.error)
    } finally {
      setIsThinking(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    toast.success(locale === 'en' ? 'Chat cleared' : 'Chat gelöscht')
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] flex flex-col"
          >
            <Card className="flex-1 shadow-2xl border-border/50 overflow-hidden flex flex-col rounded-[2.5rem] bg-background/95 backdrop-blur-xl">
              <CardHeader className="p-6 bg-primary/10 border-b border-border/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl text-primary shadow-sm">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight">{t.title}</CardTitle>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 rounded-full opacity-60 hover:opacity-100">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full opacity-60 hover:opacity-100">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none"
                >
                  {messages.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12 space-y-4"
                    >
                      <div className="p-4 bg-primary/5 rounded-full w-fit mx-auto">
                        <Sparkles className="h-8 w-8 text-primary/40" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium max-w-[200px] mx-auto leading-relaxed">
                        {t.welcome}
                      </p>
                    </motion.div>
                  )}

                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex gap-3 max-w-[85%]",
                        m.isNotice ? "mx-auto max-w-[75%]" : m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      {!m.isNotice && (
                        <div className={cn(
                          "p-2 rounded-xl shrink-0 h-fit shadow-sm",
                          m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                      )}
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed",
                        m.isNotice
                          ? "bg-muted/30 border border-dashed border-border/70 text-muted-foreground text-center shadow-none"
                          : m.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/10"
                            : "bg-muted/50 rounded-tl-none border border-border/50"
                      )}>
                        {m.isNotice ? (
                          <p className="font-medium">{m.content}</p>
                        ) : (
                          <ChatMarkdown content={m.content} />
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isThinking && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3 mr-auto"
                    >
                      <div className="p-2 rounded-xl bg-muted shrink-0 h-fit">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none border border-border/50 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                        <span className="text-xs font-bold text-muted-foreground ml-2 uppercase tracking-widest">{t.thinking}</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                <form 
                  onSubmit={handleSend}
                  className="p-6 bg-background border-t border-border/50"
                >
                  <div className="relative group">
                    <Input
                      placeholder={t.placeholder}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isThinking}
                      className="h-14 pr-14 pl-6 rounded-2xl bg-muted/20 border-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner text-base font-medium"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!input.trim() || isThinking}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-90"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500",
          isOpen 
            ? "bg-muted text-muted-foreground rotate-90" 
            : "bg-primary text-primary-foreground shadow-primary/20"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <X className="h-8 w-8" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Bot className="h-8 w-8" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border-2 border-background rounded-full flex items-center justify-center"
          >
            <Sparkles className="h-2.5 w-2.5 text-white animate-pulse" />
          </motion.div>
        )}
      </motion.button>
    </div>
  )
}
