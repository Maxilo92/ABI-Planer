'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'

import { Profile } from '@/types/database'

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

  useEffect(() => {
    if (!auth) {
      console.error('Firebase Auth is not initialized. Check your configuration.')
      setLoading(false)
      return
    }

    let profileUnsubscribe: (() => void) | null = null

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'Logged in' : 'Logged out')
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

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
