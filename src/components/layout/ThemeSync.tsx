'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/context/AuthContext'
import { useAccentTheme } from '@/context/AccentThemeProvider'

export function ThemeSync() {
  const { profile, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const { presetId, setPresetId } = useAccentTheme()
  
  // Track if we have already synced from profile to avoid overwriting user changes
  // made in the same session before profile loaded (though unlikely)
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    if (loading || !profile || hasSyncedRef.current) return

    let changed = false

    if (profile.theme && profile.theme !== theme) {
      setTheme(profile.theme)
      changed = true
    }

    if (profile.accent_theme && profile.accent_theme !== presetId) {
      setPresetId(profile.accent_theme)
      changed = true
    }

    if (profile.theme || profile.accent_theme) {
      hasSyncedRef.current = true
    }
  }, [profile, loading, theme, setTheme, presetId, setPresetId])

  return null
}
