'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { UserDeck } from '@/types/decks'

export const useDecks = () => {
  const { user } = useAuth()
  const [decks, setDecks] = useState<UserDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setDecks((prev) => (prev.length > 0 ? [] : prev))
      setLoading((prev) => (prev ? false : prev))
      return
    }

    setLoading(true)
    const decksQuery = query(
      collection(db, 'user_decks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      decksQuery,
      (snapshot) => {
        const decksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserDeck[]
        setDecks(decksData)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching user decks:', err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const createDeck = useCallback(
    async (deckData: Omit<UserDeck, 'id' | 'userId' | 'createdAt'>) => {
      if (!user) throw new Error('User not authenticated')

      try {
        const docRef = await addDoc(collection(db, 'user_decks'), {
          ...deckData,
          userId: user.uid,
          createdAt: serverTimestamp(),
        })
        return docRef.id
      } catch (err) {
        console.error('Error creating deck:', err)
        throw err
      }
    },
    [user]
  )

  const updateDeck = useCallback(
    async (deckId: string, deckData: Partial<Omit<UserDeck, 'id' | 'userId' | 'createdAt'>>) => {
      if (!user) throw new Error('User not authenticated')

      try {
        const deckRef = doc(db, 'user_decks', deckId)
        await updateDoc(deckRef, deckData)
      } catch (err) {
        console.error('Error updating deck:', err)
        throw err
      }
    },
    [user]
  )

  const deleteDeck = useCallback(
    async (deckId: string) => {
      if (!user) throw new Error('User not authenticated')

      try {
        const deckRef = doc(db, 'user_decks', deckId)
        await deleteDoc(deckRef)
      } catch (err) {
        console.error('Error deleting deck:', err)
        throw err
      }
    },
    [user]
  )

  return {
    decks,
    loading,
    error,
    createDeck,
    updateDeck,
    deleteDeck,
  }
}
