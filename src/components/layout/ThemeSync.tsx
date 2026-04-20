'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/context/AuthContext'
import { useAccentTheme } from '@/context/AccentThemeProvider'

/**
 * ThemeSync component handles carrying over theme and accent settings
 * across subdomains (e.g. from dashboard.abi-planer-27.de to tcg.abi-planer-27.de).
 * It uses the user profile in Firestore as the single source of truth.
 */
export function ThemeSync() {
  const { profile, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const { presetId, setPresetId } = useAccentTheme()
  
  // Track synchronization status for this mount
  const hasSyncedThemeRef = useRef(false)
  const hasSyncedAccentRef = useRef(false)

  // 1. Sync Theme (Dark/Light)
  useEffect(() => {
    if (loading || !profile) return

    // If profile has a theme and it differs from current local theme (and we haven't forced a sync yet)
    if (profile.theme && profile.theme !== theme && !hasSyncedThemeRef.current) {
      console.log(`[ThemeSync] Syncing theme: ${theme} -> ${profile.theme}`)
      setTheme(profile.theme)
      hasSyncedThemeRef.current = true
    } else if (profile.theme === theme) {
      // If they already match, mark as synced so we don't overwrite user changes later in the session
      hasSyncedThemeRef.current = true
    }
  }, [profile, loading, theme, setTheme])

  // 2. Sync Accent Theme
  useEffect(() => {
    if (loading || !profile) return

    if (profile.accent_theme && profile.accent_theme !== presetId && !hasSyncedAccentRef.current) {
      console.log(`[ThemeSync] Syncing accent: ${presetId} -> ${profile.accent_theme}`)
      setPresetId(profile.accent_theme)
      hasSyncedAccentRef.current = true
    } else if (profile.accent_theme === presetId) {
      hasSyncedAccentRef.current = true
    }
  }, [profile, loading, presetId, setPresetId])

  return null
}
