'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getFirebaseDb } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { translations, Language } from '@/lib/i18n/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const SUPPORTED_LANGUAGES: Language[] = ['de-DE', 'en-US', 'es-ES']
const DEFAULT_LANGUAGE: Language = 'de-DE'
const STORAGE_KEY = 'abi_planer_lang'

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading: authLoading } = useAuth()
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE)
  const [isInitialized, setIsInitialized] = useState(false)

  // Helper to get browser language
  const getBrowserLanguage = useCallback((): Language => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE
    const browserLang = navigator.language
    if (SUPPORTED_LANGUAGES.includes(browserLang as Language)) {
      return browserLang as Language
    }
    const shortLang = browserLang.split('-')[0]
    const match = SUPPORTED_LANGUAGES.find(l => l.startsWith(shortLang))
    return match || DEFAULT_LANGUAGE
  }, [])

  // Initialize language from localStorage or browser
  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedLang = localStorage.getItem(STORAGE_KEY) as Language
    const initialLang = SUPPORTED_LANGUAGES.includes(storedLang) 
      ? storedLang 
      : getBrowserLanguage()

    setLanguageState(initialLang)
    setIsInitialized(true)
  }, [getBrowserLanguage])

  // Sync with profile once loaded - Profile takes precedence
  useEffect(() => {
    if (!authLoading && profile?.language && isInitialized) {
      if (profile.language !== language) {
        setLanguageState(profile.language)
        localStorage.setItem(STORAGE_KEY, profile.language)
      }
    }
  }, [authLoading, profile?.language, isInitialized, language])

  const setLanguage = useCallback(async (newLang: Language) => {
    setLanguageState(newLang)
    localStorage.setItem(STORAGE_KEY, newLang)

    if (user) {
      const db = getFirebaseDb()
      const profileRef = doc(db, 'profiles', user.uid)
      try {
        await updateDoc(profileRef, { language: newLang })
      } catch (error) {
        console.error('[LanguageContext] Failed to update language in profile:', error)
      }
    }
  }, [user])

  const t = useCallback((key: string): string => {
    const keys = key.split('.')
    
    const getKeyValue = (obj: any, path: string[]) => {
      return path.reduce((prev, curr) => prev && prev[curr], obj)
    }

    const value = getKeyValue(translations[language], keys)
    if (typeof value === 'string') return value

    // Fallback to default language if not found in current language
    if (language !== DEFAULT_LANGUAGE) {
      const fallbackValue = getKeyValue(translations[DEFAULT_LANGUAGE], keys)
      if (typeof fallbackValue === 'string') return fallbackValue
    }

    return key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
