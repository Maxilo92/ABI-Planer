'use client'

import { useState } from 'react'
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { logAction } from '@/lib/logging'
import { toast } from 'sonner'

export function useGroupJoin() {
  const { user, profile } = useAuth()
  const [isJoining, setIsJoining] = useState(false)

  const joinGroup = async (groupName: string) => {
    if (!user) {
      toast.error('Du musst angemeldet sein, um einer Gruppe beizutreten.')
      return false
    }

    setIsJoining(true)

    try {
      const profileRef = doc(db, 'profiles', user.uid)
      
      // OPTIONAL: Check if user is already in too many groups
      // For now, we assume they can join if they're not in it yet.
      // The calling component should ideally check if they're already in it.
      
      const profileSnap = await getDoc(profileRef)
      if (profileSnap.exists()) {
        const profileData = profileSnap.data()
        const currentGroups = profileData.planning_groups || []
        
        if (currentGroups.includes(groupName)) {
          toast.info(`Du bist bereits Mitglied in ${groupName}.`)
          return true
        }

        // Optional check for too many groups (e.g., limit to 3)
        if (currentGroups.length >= 5) {
          toast.error('Du kannst maximal 5 Planungsgruppen beitreten.')
          return false
        }
      }

      await updateDoc(profileRef, {
        planning_groups: arrayUnion(groupName),
        updated_at: serverTimestamp()
      })

      // Log the action
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

  return {
    joinGroup,
    isJoining
  }
}
