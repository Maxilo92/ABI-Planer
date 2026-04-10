'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getFirebaseAuth, getFirebaseDb, getFirebaseFunctions } from '@/lib/firebase'
import { onAuthStateChanged, signOut, User, sendEmailVerification, verifyBeforeUpdateEmail } from 'firebase/auth'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { Profile } from '@/types/database'

const auth = getFirebaseAuth();
const db = getFirebaseDb();
const functions = getFirebaseFunctions();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const SESSION_STARTED_AT_KEY_PREFIX = 'abi_session_started_at_'

function getSessionStartedAtKey(userId: string) {
  return `${SESSION_STARTED_AT_KEY_PREFIX}${userId}`
}

function readSessionStartedAt(userId: string): Date {
  if (typeof window === 'undefined') return new Date()

  const stored = window.sessionStorage.getItem(getSessionStartedAtKey(userId))
  if (stored) {
    const parsed = new Date(stored)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  const startedAt = new Date()
  window.sessionStorage.setItem(getSessionStartedAtKey(userId), startedAt.toISOString())
  return startedAt
}

function clearSessionStartedAt(userId: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(getSessionStartedAtKey(userId))
}

async function bootstrapMissingProfileViaProxy(user: User) {
  const idToken = await user.getIdToken()
  const response = await fetch('/api/auth/bootstrap-missing-profile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })

  const payload = await response.text()
  if (!response.ok) {
    throw new Error(`Bootstrap proxy failed with status ${response.status}: ${payload}`)
  }

  try {
    const parsed = JSON.parse(payload)
    return parsed?.data ?? parsed?.result ?? null
  } catch {
    return null
  }
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  is2FAVerified: boolean
  is2FAInitialCheckDone: boolean
  resendVerification: () => Promise<void>
  requestEmailChange: (newEmail: string) => Promise<void>
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
  requestEmailChange: async () => {},
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
  const sessionStartedAtRef = useRef<Date | null>(null)
  const sessionEndFlushedRef = useRef(false)
  const profileBootstrapAttemptedRef = useRef(false)

  // Load 2FA status from localStorage on mount/init (30-day persistence)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('is_2fa_verified')
      const lastVerification = localStorage.getItem('last_2fa_verification')
      
      if (stored === 'true' && lastVerification) {
        const timestamp = parseInt(lastVerification, 10)
        const now = Date.now()
        
        if (now - timestamp < THIRTY_DAYS_MS) {
          setIs2FAVerifiedState(true)
        } else {
          // Expired - clear it
          localStorage.removeItem('is_2fa_verified')
          localStorage.removeItem('last_2fa_verification')
        }
      }
      setIs2FAInitialCheckDone(true)
    }
  }, [])

  const set2FAVerified = (val: boolean) => {
    setIs2FAVerifiedState(val)
    if (typeof window !== 'undefined') {
      if (val) {
        localStorage.setItem('is_2fa_verified', 'true')
        localStorage.setItem('last_2fa_verification', Date.now().toString())
      } else {
        localStorage.removeItem('is_2fa_verified')
        localStorage.removeItem('last_2fa_verification')
      }
    }
  }

  const resendVerification = async () => {
    const currentUser = auth.currentUser
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser)
    }
  }

  const requestEmailChange = async (newEmail: string) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('Kein aktiver Nutzer gefunden.')
    }

    const normalizedEmail = newEmail.trim().toLowerCase()
    if (!normalizedEmail.endsWith('@hgr-web.lernsax.de')) {
      throw new Error('Nur @hgr-web.lernsax.de Adressen sind erlaubt.')
    }

    await verifyBeforeUpdateEmail(currentUser, normalizedEmail)
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
      return
    }

    const triggerClaim = async () => {
      try {
        const refCode = String(profile.referred_by).trim()
        if (!refCode) return

        const claimReferralFn = httpsCallable(functions, 'claimReferral')
        const result = await claimReferralFn()
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
                      set2FAVerified(false)
                      window.location.href = '/login?reason=timeout'
                    }
                    return
                  }

                  if (isSubscribed) {
                    setProfile(normalizedProfile)
                  }
                } else {
                  console.warn('No profile found for user:', user.uid)
                  if (!profileBootstrapAttemptedRef.current) {
                    profileBootstrapAttemptedRef.current = true
                    try {
                      let bootstrapProfile: Profile | null = null

                      try {
                        const bootstrapResponse = await bootstrapMissingProfileViaProxy(user)
                        bootstrapProfile = (bootstrapResponse as { profile?: Profile | null } | undefined)?.profile || null
                      } catch (proxyError) {
                        console.error('Bootstrap proxy failed, falling back to callable:', proxyError)

                        const bootstrapMissingProfile = httpsCallable(functions, 'bootstrapMissingProfile')
                        const bootstrapResult = await bootstrapMissingProfile({})
                        bootstrapProfile = (bootstrapResult.data as { profile?: Profile | null } | undefined)?.profile || null
                      }

                      if (bootstrapProfile) {
                        const normalizedRole = (bootstrapProfile.role as string) === 'admin' ? 'admin_main' : bootstrapProfile.role
                        const normalizedProfile = { ...bootstrapProfile, id: user.uid, role: normalizedRole } as Profile

                        if (isSubscribed) {
                          setProfile(normalizedProfile)
                        }
                        return
                      }
                    } catch (bootstrapError) {
                      console.error('Failed to bootstrap missing profile:', bootstrapError)
                    }
                  }
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
          profileBootstrapAttemptedRef.current = false
          setProfile(null)
          setLoading(false)
          set2FAVerified(false)
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
    if (!user?.uid || loading || !profile) return

    const userId = user.uid
    sessionEndFlushedRef.current = false
    sessionStartedAtRef.current = readSessionStartedAt(userId)

    const buildPresencePayload = (isOnline: boolean) => {
      const sessionStart = sessionStartedAtRef.current
      const sessionDurationSeconds = sessionStart
        ? Math.max(1, Math.round((Date.now() - sessionStart.getTime()) / 1000))
        : null

      if (isOnline) {
        return {
          isOnline,
          lastOnline: serverTimestamp(),
          onlineSince: sessionStart ? sessionStart.toISOString() : new Date().toISOString(),
          lastSessionDurationSeconds: null,
        }
      }

      return {
        isOnline,
        lastOnline: serverTimestamp(),
        onlineSince: null,
        lastSessionDurationSeconds: sessionDurationSeconds,
      }
    }

    const flushSessionEnd = async () => {
      const sessionStart = sessionStartedAtRef.current
      if (!sessionStart || sessionEndFlushedRef.current) return

      sessionEndFlushedRef.current = true

      try {
        const idToken = await auth.currentUser?.getIdToken()
        if (!idToken) return

        await fetch('/api/presence/close-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken,
            sessionStartedAt: sessionStart.toISOString(),
          }),
          keepalive: true,
        })
      } catch (error) {
        console.error('Error flushing session end:', error)
      }
    }

    const updateStatus = async (isOnline: boolean) => {
      try {
        const docRef = doc(db, 'profiles', userId)
        await updateDoc(docRef, buildPresencePayload(isOnline))
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

    // Handle tab close / hidden state more reliably than beforeunload alone.
    const handlePageHide = () => {
      void flushSessionEnd()
    }

    window.addEventListener('beforeunload', handlePageHide)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handlePageHide)
      window.removeEventListener('pagehide', handlePageHide)
      // Set to offline on logout or unmount
      updateStatus(false)
      void flushSessionEnd()
      clearSessionStartedAt(userId)
      sessionStartedAtRef.current = null
    }
  }, [user?.uid, profile?.id, loading])

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      is2FAVerified, 
      is2FAInitialCheckDone,
      resendVerification, 
      requestEmailChange,
      refreshAuth, 
      set2FAVerified 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
