'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'

export type AiMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  thought?: string | null
  model?: string
  feedback?: 'positive' | 'negative' | null
}

function sanitizeAiMessage(message: unknown, index: number): AiMessage | null {
  if (!message || typeof message !== 'object') return null

  const candidate = message as Partial<AiMessage>
  const role = candidate.role
  const content = candidate.content

  if ((role !== 'user' && role !== 'assistant' && role !== 'system') || typeof content !== 'string') {
    return null
  }

  const sanitized: AiMessage = {
    id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : `legacy-${index}`,
    role,
    content: content.trim(),
  }

  if (typeof candidate.thought === 'string' && candidate.thought.trim()) {
    sanitized.thought = candidate.thought.trim()
  }

  if (typeof candidate.model === 'string') {
    sanitized.model = candidate.model
  }

  if (candidate.feedback === 'positive' || candidate.feedback === 'negative') {
    sanitized.feedback = candidate.feedback
  }

  return sanitized
}

function sanitizeAiMessages(messages: unknown): AiMessage[] {
  if (!Array.isArray(messages)) return []

  return messages
    .map((message, index) => sanitizeAiMessage(message, index))
    .filter((message): message is AiMessage => message !== null)
}

export type AiChatSession = {
  id: string
  user_id: string
  title: string
  messages: AiMessage[]
  created_at: Timestamp | Date | null
  updated_at: Timestamp | Date | null
}

export const useAiChats = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<AiChatSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!user?.uid) {
      Promise.resolve().then(() => {
        if (cancelled) return
        setSessions([])
        setLoading(false)
      })

      return () => {
        cancelled = true
      }
    }

    Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
    })

    const q = query(
      collection(db, 'ai_chat_sessions'),
      where('user_id', '==', user.uid),
      orderBy('updated_at', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedSessions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          messages: sanitizeAiMessages(doc.data().messages),
        })) as AiChatSession[]
        setSessions(fetchedSessions)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching AI chat sessions:', error)
        setLoading(false)
      }
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [user])

  const createSession = useCallback(
    async (firstMessage: AiMessage) => {
      if (!user?.uid) throw new Error('User not authenticated')

      const sanitizedFirstMessage = sanitizeAiMessage(firstMessage, 0)
      if (!sanitizedFirstMessage) {
        throw new Error('Invalid first message payload')
      }

      const newSession = {
        user_id: user.uid,
        title: 'Neuer Chat...',
        messages: [sanitizedFirstMessage],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      try {
        const docRef = await addDoc(collection(db, 'ai_chat_sessions'), newSession)
        return docRef.id
      } catch (error) {
        console.error('Error creating AI chat session:', error)
        throw error
      }
    },
    [user]
  )

  const updateSession = useCallback(
    async (sessionId: string, messages: AiMessage[]) => {
      if (!user?.uid) throw new Error('User not authenticated')

      const sanitizedMessages = sanitizeAiMessages(messages)

      try {
        const sessionRef = doc(db, 'ai_chat_sessions', sessionId)
        await updateDoc(sessionRef, {
          messages: sanitizedMessages,
          updated_at: serverTimestamp(),
        })
      } catch (error) {
        console.error('Error updating AI chat session:', error)
        throw error
      }
    },
    [user]
  )

  const updateSessionTitle = useCallback(
    async (sessionId: string, title: string) => {
      if (!user?.uid) throw new Error('User not authenticated')

      const normalizedTitle = title.trim()
      if (!normalizedTitle) return

      try {
        const sessionRef = doc(db, 'ai_chat_sessions', sessionId)
        await updateDoc(sessionRef, {
          title: normalizedTitle,
          updated_at: serverTimestamp(),
        })
      } catch (error) {
        console.error('Error updating AI chat session title:', error)
        throw error
      }
    },
    [user]
  )

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!user?.uid) throw new Error('User not authenticated')

      try {
        const sessionRef = doc(db, 'ai_chat_sessions', sessionId)
        await deleteDoc(sessionRef)
      } catch (error) {
        console.error('Error deleting AI chat session:', error)
        throw error
      }
    },
    [user]
  )

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    updateSessionTitle,
    deleteSession,
  }
}
