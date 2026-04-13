'use client'

import { useState } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { logAction } from '@/lib/logging'
import { toast } from 'sonner'

export function useGroupJoin() {
  const { user, profile } = useAuth()
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const joinGroup = async (groupName: string) => {
    if (!user) {
      toast.error('Du musst angemeldet sein, um einer Gruppe beizutreten.')
      return false
    }

    setIsJoining(true)

    try {
      const profileRef = doc(db, 'profiles', user.uid)
      
      const profileSnap = await getDoc(profileRef)
      if (profileSnap.exists()) {
        const profileData = profileSnap.data()
        const currentGroups = profileData.planning_groups || []
        
        if (currentGroups.includes(groupName)) {
          toast.info(`Du bist bereits Mitglied in ${groupName}.`)
          return true
        }

        if (currentGroups.length >= 5) {
          toast.error('Du kannst maximal 5 Planungsgruppen beitreten.')
          return false
        }
      }

      await updateDoc(profileRef, {
        planning_groups: arrayUnion(groupName),
        updated_at: serverTimestamp()
      })

      await logAction('GROUP_MEMBER_ADDED', user.uid, profile?.full_name, {
        group_name: groupName,
        method: 'self_join'
      })

      toast.success(`Du bist der Gruppe ${groupName} beigetreten!`)
      return true
    } catch (error: any) {
      console.error('[useGroupJoin] Error joining group:', error)
      toast.error('Fehler beim Beitritt: ' + (error.message || 'Unbekannter Fehler'))
      return false
    } finally {
      setIsJoining(false)
    }
  }

  const leaveGroup = async (groupName: string) => {
    if (!user) return false
    
    setIsLeaving(true)
    try {
      const profileRef = doc(db, 'profiles', user.uid)
      await updateDoc(profileRef, {
        planning_groups: arrayRemove(groupName),
        updated_at: serverTimestamp()
      })

      await logAction('GROUP_MEMBER_REMOVED', user.uid, profile?.full_name, {
        group_name: groupName,
        method: 'self_leave'
      })

      toast.success(`Du hast die Gruppe ${groupName} verlassen.`)
      return true
    } catch (error: any) {
      console.error('[useGroupJoin] Error leaving group:', error)
      toast.error('Fehler beim Verlassen der Gruppe.')
      return false
    } finally {
      setIsLeaving(false)
    }
  }

  return {
    joinGroup,
    leaveGroup,
    isJoining,
    isLeaving
  }
}
