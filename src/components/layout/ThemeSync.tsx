'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/context/AuthContext'
import { useAccentTheme } from '@/context/AccentThemeProvider'
import { getFreeAccentThemePresetId, isPremiumAccentThemePreset } from '@/lib/accentThemePresets'

/**
 * ThemeSync component handles carrying over theme and accent settings
 * across sessions, tabs, and devices.
 * It uses the user profile in Firestore as the single source of truth.
 */
export function ThemeSync() {
  const { profile, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const { presetId, setPresetId } = useAccentTheme()
  
  // Track synchronization status to avoid race conditions during local updates
  const lastSyncedThemeRef = useRef<string | undefined>(undefined)
  const lastSyncedAccentRef = useRef<string | undefined>(undefined)

  // 1. Sync Theme (Dark/Light/System)
  useEffect(() => {
    if (loading || !profile || !profile.theme) return

    // If the profile theme has changed (different from what we last synced/applied)
    if (profile.theme !== lastSyncedThemeRef.current) {
      // If the local theme differs from the profile theme, update it
      if (profile.theme !== theme) {
        console.log(`[ThemeSync] Syncing theme from profile: ${theme} -> ${profile.theme}`)
        setTheme(profile.theme)
      }
      // Update our record of what the profile theme is
      lastSyncedThemeRef.current = profile.theme
    }
  }, [profile?.theme, theme, setTheme, loading])

  // 2. Sync Accent Theme
  useEffect(() => {
    if (loading || !profile || !profile.accent_theme) return

    const hasPremiumThemes = Boolean(profile.cosmetics?.premium_themes)
    const requestedTheme = profile.accent_theme
    const effectiveProfileTheme = isPremiumAccentThemePreset(requestedTheme) && !hasPremiumThemes
      ? getFreeAccentThemePresetId()
      : requestedTheme

    // If the profile accent theme has changed
    if (effectiveProfileTheme !== lastSyncedAccentRef.current) {
      // If the local accent theme differs from the profile accent theme, update it
      if (effectiveProfileTheme !== presetId) {
        console.log(`[ThemeSync] Syncing accent from profile: ${presetId} -> ${effectiveProfileTheme}`)
        setPresetId(effectiveProfileTheme)
      }
      // Update our record of what the profile accent theme is
      lastSyncedAccentRef.current = effectiveProfileTheme
    }
  }, [profile?.accent_theme, profile?.cosmetics?.premium_themes, presetId, setPresetId, loading])

  return null
}
