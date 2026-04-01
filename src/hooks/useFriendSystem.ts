'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, runTransaction, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { FriendRequest, Friendship, Profile } from '@/types/database'

type RelationshipState = 'self' | 'none' | 'pending_outgoing' | 'pending_incoming' | 'friends'

function normalizeFriendRequest(id: string, data: Record<string, any>): FriendRequest {
  return {
    id,
    fromUserId: data.fromUserId,
    toUserId: data.toUserId,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at ?? null,
    responded_at: data.responded_at ?? null,
    responded_by: data.responded_by ?? null,
    friendship_id: data.friendship_id ?? null,
  }
}

function normalizeFriendship(id: string, data: Record<string, any>): Friendship {
  return {
    id,
    members: Array.isArray(data.members) ? data.members : [],
    request_id: data.request_id,
    created_by: data.created_by,
    created_at: data.created_at,
    accepted_at: data.accepted_at ?? null,
  }
}

function getFriendshipId(userA: string, userB: string) {
  return [userA, userB].sort().join('__')
}

export function useFriendSystem() {
  const { user, profile } = useAuth()
  const currentUserId = user?.uid ?? ''
  const isApproved = profile?.is_approved === true
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([])
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [relatedProfiles, setRelatedProfiles] = useState<Record<string, Profile>>({})

  useEffect(() => {
    if (!currentUserId || !isApproved) {
      setOutgoingRequests([])
      setIncomingRequests([])
      setFriendships([])
      setRelatedProfiles({})
      return
    }

    const outgoingQuery = query(collection(db, 'friend_requests'), where('fromUserId', '==', currentUserId))
    const incomingQuery = query(collection(db, 'friend_requests'), where('toUserId', '==', currentUserId))
    const friendshipsQuery = query(collection(db, 'friendships'), where('members', 'array-contains', currentUserId))

    const unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
      setOutgoingRequests(
        snapshot.docs
          .map((snapshotDoc) => normalizeFriendRequest(snapshotDoc.id, snapshotDoc.data() as Record<string, any>))
          .filter((request) => request.status === 'pending')
      )
    }, (error) => {
      console.error('[FriendSystem] Failed to load outgoing requests:', error)
    })

    const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
      setIncomingRequests(
        snapshot.docs
          .map((snapshotDoc) => normalizeFriendRequest(snapshotDoc.id, snapshotDoc.data() as Record<string, any>))
          .filter((request) => request.status === 'pending')
      )
    }, (error) => {
      console.error('[FriendSystem] Failed to load incoming requests:', error)
    })

    const unsubscribeFriendships = onSnapshot(friendshipsQuery, (snapshot) => {
      setFriendships(snapshot.docs.map((snapshotDoc) => normalizeFriendship(snapshotDoc.id, snapshotDoc.data() as Record<string, any>)))
    }, (error) => {
      console.error('[FriendSystem] Failed to load friendships:', error)
    })

    return () => {
      unsubscribeOutgoing()
      unsubscribeIncoming()
      unsubscribeFriendships()
    }
  }, [currentUserId, isApproved])

  const relatedUserIds = useMemo(() => {
    const ids = new Set<string>()

    for (const request of outgoingRequests) {
      ids.add(request.toUserId)
    }

    for (const request of incomingRequests) {
      ids.add(request.fromUserId)
    }

    for (const friendship of friendships) {
      for (const memberId of friendship.members) {
        if (memberId !== currentUserId) {
          ids.add(memberId)
        }
      }
    }

    return [...ids]
  }, [currentUserId, outgoingRequests, incomingRequests, friendships])

  useEffect(() => {
    if (!relatedUserIds.length) {
      setRelatedProfiles({})
      return
    }

    let cancelled = false

    const loadProfiles = async () => {
      try {
        const entries = await Promise.all(
          relatedUserIds.map(async (relatedUserId) => {
            const profileSnap = await getDoc(doc(db, 'profiles', relatedUserId))
            if (!profileSnap.exists()) {
              return [relatedUserId, null] as const
            }

            return [relatedUserId, { ...profileSnap.data(), id: profileSnap.id } as Profile] as const
          })
        )

        if (cancelled) {
          return
        }

        const nextProfiles: Record<string, Profile> = {}
        for (const [relatedUserId, relatedProfile] of entries) {
          if (relatedProfile) {
            nextProfiles[relatedUserId] = relatedProfile
          }
        }

        setRelatedProfiles(nextProfiles)
      } catch (error) {
        console.error('[FriendSystem] Failed to load related profiles:', error)
      }
    }

    loadProfiles()

    return () => {
      cancelled = true
    }
  }, [relatedUserIds])

  const sendFriendRequest = useCallback(async (targetUserId: string) => {
    if (!user || !profile?.is_approved) {
      throw new Error('Nur verifizierte Mitglieder können Freundschaften anfragen.')
    }

    if (!targetUserId || targetUserId === user.uid) {
      throw new Error('Du kannst keine Freundschaft mit dir selbst anfragen.')
    }

    const requestId = `${user.uid}_${targetUserId}`
    const requestRef = doc(db, 'friend_requests', requestId)

    // Important: do not pre-read foreign/non-existing docs here.
    // Those reads can be rejected by Firestore Rules and cause noisy 403s.
    await setDoc(requestRef, {
      fromUserId: user.uid,
      toUserId: targetUserId,
      status: 'pending',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
  }, [profile?.is_approved, user])

  const respondToFriendRequest = useCallback(async (requestId: string, accepted: boolean) => {
    if (!user || !profile?.is_approved) {
      throw new Error('Nur verifizierte Mitglieder können Freundschaften verwalten.')
    }

    const requestRef = doc(db, 'friend_requests', requestId)

    await runTransaction(db, async (transaction) => {
      const requestSnap = await transaction.get(requestRef)

      if (!requestSnap.exists()) {
        throw new Error('Die Anfrage wurde nicht mehr gefunden.')
      }

      const requestData = requestSnap.data() as FriendRequest
      if (requestData.toUserId !== user.uid || requestData.status !== 'pending') {
        throw new Error('Diese Anfrage kann nicht mehr bearbeitet werden.')
      }

      if (!accepted) {
        transaction.update(requestRef, {
          status: 'declined',
          responded_at: serverTimestamp(),
          responded_by: user.uid,
          updated_at: serverTimestamp(),
        })
        return
      }

      const friendshipId = getFriendshipId(requestData.fromUserId, requestData.toUserId)
      const friendshipRef = doc(db, 'friendships', friendshipId)
      const friendshipSnap = await transaction.get(friendshipRef)

      if (friendshipSnap.exists()) {
        throw new Error('Ihr seid bereits befreundet.')
      }

      transaction.set(friendshipRef, {
        members: [requestData.fromUserId, requestData.toUserId].sort(),
        request_id: requestId,
        created_by: user.uid,
        created_at: serverTimestamp(),
        accepted_at: serverTimestamp(),
      })

      transaction.update(requestRef, {
        status: 'accepted',
        responded_at: serverTimestamp(),
        responded_by: user.uid,
        friendship_id: friendshipId,
        updated_at: serverTimestamp(),
      })
    })
  }, [profile?.is_approved, user])

  const cancelFriendRequest = useCallback(async (requestId: string) => {
    if (!user || !profile?.is_approved) {
      throw new Error('Nur verifizierte Mitglieder können Freundschaften verwalten.')
    }

    const requestRef = doc(db, 'friend_requests', requestId)
    const requestSnap = await getDoc(requestRef)

    if (!requestSnap.exists()) {
      throw new Error('Die Anfrage wurde nicht mehr gefunden.')
    }

    const requestData = requestSnap.data() as FriendRequest
    if (requestData.fromUserId !== user.uid || requestData.status !== 'pending') {
      throw new Error('Nur der Absender kann eine offene Anfrage zurückziehen.')
    }

    await deleteDoc(requestRef)
  }, [profile?.is_approved, user])

  const removeFriend = useCallback(async (targetUserId: string) => {
    if (!user || !profile?.is_approved) {
      throw new Error('Nur verifizierte Mitglieder können Freundschaften verwalten.')
    }

    const friendshipId = getFriendshipId(user.uid, targetUserId)
    const friendshipRef = doc(db, 'friendships', friendshipId)
    const outgoingRequestRef = doc(db, 'friend_requests', `${user.uid}_${targetUserId}`)
    const incomingRequestRef = doc(db, 'friend_requests', `${targetUserId}_${user.uid}`)

    await runTransaction(db, async (transaction) => {
      const friendshipSnap = await transaction.get(friendshipRef)

      if (!friendshipSnap.exists()) {
        throw new Error('Diese Freundschaft existiert nicht mehr.')
      }

      transaction.delete(friendshipRef)

      const outgoingRequestSnap = await transaction.get(outgoingRequestRef)
      if (outgoingRequestSnap.exists() && outgoingRequestSnap.data()?.status === 'pending') {
        transaction.delete(outgoingRequestRef)
      }

      const incomingRequestSnap = await transaction.get(incomingRequestRef)
      if (incomingRequestSnap.exists() && incomingRequestSnap.data()?.status === 'pending') {
        transaction.delete(incomingRequestRef)
      }
    })
  }, [profile?.is_approved, user])

  const getRelationshipState = useCallback((targetUserId: string): RelationshipState => {
    if (!currentUserId || targetUserId === currentUserId) {
      return 'self'
    }

    if (friendships.some((friendship) => friendship.members.includes(targetUserId))) {
      return 'friends'
    }

    if (outgoingRequests.some((request) => request.toUserId === targetUserId)) {
      return 'pending_outgoing'
    }

    if (incomingRequests.some((request) => request.fromUserId === targetUserId)) {
      return 'pending_incoming'
    }

    return 'none'
  }, [currentUserId, friendships, incomingRequests, outgoingRequests])

  return {
    outgoingRequests,
    incomingRequests,
    friendships,
    relatedProfiles,
    getRelationshipState,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
  }
}
