'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getFirebaseAuth, getFirebaseDb, getFirebaseFunctions } from '@/lib/firebase'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { Profile } from '@/types/database'

const auth = getFirebaseAuth();
const db = getFirebaseDb();
const functions = getFirebaseFunctions();

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Referral claiming logic: Check upon login if a referral needs to be claimed
  useEffect(() => {
    if (loading || !user || !profile || !profile.referred_by || profile.is_referral_claimed) {
      return
    }

    const triggerClaim = async () => {
      try {
        const refCode = String(profile.referred_by).trim()
        if (!refCode) return

        console.log('[AuthContext] Triggering referral claim check for code:', refCode)
        const claimReferralFn = httpsCallable(functions, 'claimReferral')
        const result = await claimReferralFn()
        console.log('[AuthContext] Referral claim check processed. Result:', result.data)
      } catch (error) {
        // We log but don't block the UI for referral failures
        console.error('[AuthContext] Failed to claim referral:', error)
      }
    }

    triggerClaim()
  }, [user?.uid, profile?.is_referral_claimed, profile?.referred_by, loading])

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      // Unsubscribe from previous profile if exists
      if (profileUnsubscribe) {
        profileUnsubscribe()
        profileUnsubscribe = null
      }
      
      try {
        if (user) {
          const docRef = doc(db, 'profiles', user.uid)
          
          // Use onSnapshot to make the profile reactive
          profileUnsubscribe = onSnapshot(docRef, async (docSnap) => {
            try {
              if (docSnap.exists()) {
                const profileData = docSnap.data() as Profile
                const normalizedRole = (profileData.role as string) === 'admin' ? 'admin_main' : profileData.role
                const normalizedProfile = { ...profileData, id: user.uid, role: normalizedRole } as Profile

                const timeoutUntilMs = normalizedProfile.timeout_until ? Date.parse(normalizedProfile.timeout_until) : NaN
                const isTimedOut = Number.isFinite(timeoutUntilMs) && timeoutUntilMs > Date.now()

                if (isTimedOut) {
                  console.warn('User is currently timed out. Signing out.')
                  // Ensure we unsubscribe before signing out to avoid state updates after logout
                  if (profileUnsubscribe) {
                    profileUnsubscribe()
                    profileUnsubscribe = null
                  }
                  await signOut(auth)
                  setProfile(null)
                  setLoading(false)
                  window.location.href = '/login?reason=timeout'
                  return
                }

                setProfile(normalizedProfile)
              } else {
                console.warn('No profile found for user:', user.uid)
                setProfile(null)
              }
            } catch (error) {
              console.error('Error in profile snapshot:', error)
              setProfile(null)
            } finally {
              setLoading(false)
            }
          }, (error) => {
            console.error('Profile snapshot error:', error)
            setProfile(null)
            setLoading(false)
          })
        } else {
          setProfile(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      authUnsubscribe()
      if (profileUnsubscribe) profileUnsubscribe()
    }
  }, [])

  // Heartbeat logic to track online status
  useEffect(() => {
    if (!user?.uid) return

    const userId = user.uid

    const updateStatus = async (isOnline: boolean) => {
      try {
        const docRef = doc(db, 'profiles', userId)
        await updateDoc(docRef, {
          isOnline,
          lastOnline: serverTimestamp(),
        })
      } catch (error) {
        console.error('Error updating online status:', error)
      }
    }

    // Set online status initially
    updateStatus(true)

    // Heartbeat every 2 minutes
    const interval = setInterval(() => {
      updateStatus(true)
    }, 120000)

    // Handle tab close or navigation away
    const handleBeforeUnload = () => {
      const docRef = doc(db, 'profiles', userId)
      // Note: updateDoc is async and might not complete in beforeunload,
      // but it's the requested method.
      updateDoc(docRef, {
        isOnline: false,
        lastOnline: serverTimestamp(),
      }).catch(console.error)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Set to offline on logout or unmount
      updateStatus(false)
    }
  }, [user?.uid])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
