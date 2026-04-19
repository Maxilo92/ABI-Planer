'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  AccentThemePreset,
  ACCENT_THEME_STORAGE_KEY,
  DEFAULT_ACCENT_THEME_ID,
  getFirstSupportedAccentThemeId,
  isAccentThemeSupportedInMode,
  accentThemePresets,
  accentThemePresetMap,
} from '@/lib/accentThemePresets'
import { useTheme } from 'next-themes'

type AccentThemeContextType = {
  presetId: string
  activePreset: AccentThemePreset
  presets: AccentThemePreset[]
  setPresetId: (id: string) => void
}

const AccentThemeContext = createContext<AccentThemeContextType | undefined>(
  undefined
)

export function AccentThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { resolvedTheme } = useTheme()
  const [presetId, setPresetIdState] = useState<string>(() => {
    try {
      const storedId = localStorage.getItem(ACCENT_THEME_STORAGE_KEY)
      if (storedId && accentThemePresetMap.has(storedId)) {
        return storedId
      }
    } catch (error) {
      console.error('Failed to read accent theme from localStorage:', error)
    }
    return DEFAULT_ACCENT_THEME_ID
  })
  const themeMode = resolvedTheme === 'dark' ? 'dark' : 'light'
  const effectivePresetId = isAccentThemeSupportedInMode(presetId, themeMode)
    ? presetId
    : getFirstSupportedAccentThemeId(themeMode)

  // Apply theme to document when preset changes
  useEffect(() => {
    const preset = accentThemePresetMap.get(effectivePresetId) || accentThemePresetMap.get(DEFAULT_ACCENT_THEME_ID)
    if (!preset) return

    // Apply CSS variables to document
    const root = document.documentElement

    // Apply brand colors
    root.style.setProperty('--brand-accent-light', preset.brand.light)
    root.style.setProperty('--brand-accent-dark', preset.brand.dark)
    root.style.setProperty('--brand-accent-light-foreground', preset.brand.foregroundLight)
    root.style.setProperty('--brand-accent-dark-foreground', preset.brand.foregroundDark)
    root.style.setProperty('--theme-contrast-light', preset.contrast.light)
    root.style.setProperty('--theme-contrast-dark', preset.contrast.dark)
    root.style.setProperty('--theme-contrast-light-foreground', preset.contrast.foregroundLight)
    root.style.setProperty('--theme-contrast-dark-foreground', preset.contrast.foregroundDark)

    // Apply light palette
    Object.entries(preset.lightPalette).forEach(([key, value]) => {
      root.style.setProperty(`--theme-light-${key}`, value)
    })

    // Apply dark palette
    Object.entries(preset.darkPalette).forEach(([key, value]) => {
      root.style.setProperty(`--theme-dark-${key}`, value)
    })

    // Persist to localStorage
    try {
      localStorage.setItem(ACCENT_THEME_STORAGE_KEY, presetId)
    } catch (error) {
      console.error('Failed to save accent theme to localStorage:', error)
    }
  }, [effectivePresetId, presetId])

  const activePreset = accentThemePresetMap.get(effectivePresetId) || accentThemePresetMap.get(DEFAULT_ACCENT_THEME_ID)!

  const setPresetId = (id: string) => {
    if (accentThemePresetMap.has(id)) {
      setPresetIdState(id)
    }
  }

  return (
    <AccentThemeContext.Provider value={{ presetId, activePreset, presets: accentThemePresets, setPresetId }}>
      {children}
    </AccentThemeContext.Provider>
  )
}

export function useAccentTheme() {
  const context = useContext(AccentThemeContext)
  if (!context) {
    throw new Error('useAccentTheme must be used within AccentThemeProvider')
  }
  return context
}
