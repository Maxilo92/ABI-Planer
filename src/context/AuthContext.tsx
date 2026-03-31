'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getFirebaseAuth, getFirebaseDb, getFirebaseFunctions } from '@/lib/firebase'
import { onAuthStateChanged, signOut, User, sendEmailVerification } from 'firebase/auth'
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
  is2FAVerified: boolean
  is2FAInitialCheckDone: boolean
  resendVerification: () => Promise<void>
  refreshAuth: () => Promise<void>
  set2FAVerified: (val: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  is2FAVerified: false,
  is2FAInitialCheckDone: false,
  resendVerification: async () => {},
  refreshAuth: async () => {},
  set2FAVerified: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [is2FAVerified, setIs2FAVerifiedState] = useState(false)
  const [is2FAInitialCheckDone, setIs2FAInitialCheckDone] = useState(false)

  // Load 2FA status from sessionStorage on mount/init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('is_2fa_verified')
      if (stored === 'true') {
        setIs2FAVerifiedState(true)
      }
      setIs2FAInitialCheckDone(true)
    }
  }, [])

  const set2FAVerified = (val: boolean) => {
    setIs2FAVerifiedState(val)
    if (typeof window !== 'undefined') {
      if (val) {
        sessionStorage.setItem('is_2fa_verified', 'true')
      } else {
        sessionStorage.removeItem('is_2fa_verified')
      }
    }
  }

  const resendVerification = async () => {
    const currentUser = auth.currentUser
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser)
    }
  }

  const refreshAuth = async () => {
    const currentUser = auth.currentUser
    if (currentUser) {
      await currentUser.reload()
      setUser(auth.currentUser)
    }
  }

  // Sync email verification status to Firestore is_approved field
  useEffect(() => {
    if (loading || !user || !profile) return
    
    if (user.emailVerified && !profile.is_approved) {
      console.log('[AuthContext] Syncing emailVerified to profile.is_approved')
      updateDoc(doc(db, 'profiles', user.uid), { 
        is_approved: true,
        updated_at: serverTimestamp()
      }).catch(err => {
        console.error('[AuthContext] Failed to sync verification status:', err)
      })
    }
  }, [user?.emailVerified, profile?.is_approved, loading])

  // Referral claiming logic: Check upon login if a referral needs to be claimed
  useEffect(() => {
    if (loading || !user || !profile || !profile.referred_by || profile.is_referral_claimed) {
      return
    }

    // MANDATORY: Skip reward trigger if email is not verified
    if (!user.emailVerified) {
      console.log('[AuthContext] Skipping referral claim: Email not verified.')
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
  }, [user?.uid, user?.emailVerified, profile?.is_referral_claimed, profile?.referred_by, loading])

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;
    let isSubscribed = true;

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
          profileUnsubscribe = onSnapshot(docRef, (docSnap) => {
            const processProfile = async () => {
              try {
                if (docSnap.exists()) {
                  const profileData = docSnap.data() as Profile
                  const normalizedRole = (profileData.role as string) === 'admin' ? 'admin_main' : profileData.role
                  const normalizedProfile = { ...profileData, id: user.uid, role: normalizedRole } as Profile

                  const timeoutUntilMs = normalizedProfile.timeout_until ? Date.parse(normalizedProfile.timeout_until) : NaN
                  const isTimedOut = Number.isFinite(timeoutUntilMs) && timeoutUntilMs > Date.now()

                  if (isTimedOut) {
                    console.warn('User is currently timed out. Signing out.')
                    if (isSubscribed) {
                      // Ensure we unsubscribe before signing out to avoid state updates after logout
                      if (profileUnsubscribe) {
                        profileUnsubscribe()
                        profileUnsubscribe = null
                      }
                      await signOut(auth)
                      setProfile(null)
                      setLoading(false)
                      window.location.href = '/login?reason=timeout'
                    }
                    return
                  }

                  if (isSubscribed) {
                    setProfile(normalizedProfile)
                  }
                } else {
                  console.warn('No profile found for user:', user.uid)
                  if (isSubscribed) setProfile(null)
                }
              } catch (error) {
                console.error('Error in profile snapshot processing:', error)
                if (isSubscribed) setProfile(null)
              } finally {
                if (isSubscribed) setLoading(false)
              }
            }
            processProfile()
          }, (error) => {
            console.error('Profile snapshot error:', error)
            if (isSubscribed) {
              setProfile(null)
              setLoading(false)
            }
          })
        } else {
          setProfile(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        if (isSubscribed) {
          setProfile(null)
          setLoading(false)
        }
      }
    })

    return () => {
      isSubscribed = false
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
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      is2FAVerified, 
      is2FAInitialCheckDone,
      resendVerification, 
      refreshAuth, 
      set2FAVerified 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
