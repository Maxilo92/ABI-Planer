'use client'

import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useState, useEffect } from 'react'
import { FeedbackList } from '@/components/admin/FeedbackList'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

type Feedback = {
  id: string
  title: string
  description: string
  type: 'bug' | 'feature' | 'other'
  status: 'new' | 'in_progress' | 'implemented' | 'rejected'
  created_at: string
  created_by: string
  created_by_name?: string
  image_url?: string
}

export default function AdminFeedbackPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'

  useEffect(() => {
    if (authLoading) return
    if (!isAdmin) {
      router.push('/')
      return
    }

    const feedbackRef = collection(db, 'feedback')
    const q = query(feedbackRef, orderBy('created_at', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeedback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback)))
      setLoading(false)
    }, (error) => {
      console.error("Error fetching feedback: ", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [authLoading, isAdmin, router])

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Feedback...</div>
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-[50vh]">Zugriff verweigert.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Feedback & Wünsche</h1>
        <p className="text-muted-foreground">Verwalte hier das Feedback der Nutzer.</p>
      </div>

      <FeedbackList feedbackItems={feedback} />
    </div>
  )
}
