export type ThemePalette = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
}

export type AccentThemePresetDefinition = {
  id: string
  label: string
  description: string
  brand: {
    light: string
    dark: string
    foregroundLight: string
    foregroundDark: string
  }
  darkPalette: ThemePalette
}

export type AccentThemePreset = AccentThemePresetDefinition & {
  lightPalette: ThemePalette
  contrast: {
    light: string
    dark: string
    foregroundLight: string
    foregroundDark: string
  }
}

export type ThemeMode = 'light' | 'dark'

export const ACCENT_THEME_STORAGE_KEY = 'abi-accent-theme'

export const accentThemePresetSupport: Record<string, ThemeMode[]> = {
  'classic-green': ['light', 'dark'],
  'ocean-teal': ['light', 'dark'],
  'sunset-amber': ['light'],
  'ruby-night': ['dark'],
  'indigo-night': ['dark'],
  'forest-green': ['dark'],
  'sky-blue': ['light'],
  'plum-dusk': ['dark'],
  'mint-cool': ['light'],
  'coral-warm': ['light'],
  'pure-white': ['light'],
  'clean-slate': ['light'],
  'slate-dark': ['dark'],
  'midnight-black': ['dark'],
  'silver-pro': ['light'],
  obsidian: ['dark'],
}

type HslChannels = {
  hue: number
  saturation: number
  lightness: number
}

function hexToHslChannels(hex: string): HslChannels {
  const normalized = hex.replace('#', '').trim()
  const value = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => char + char)
        .join('')
    : normalized

  const red = Number.parseInt(value.slice(0, 2), 16) / 255
  const green = Number.parseInt(value.slice(2, 4), 16) / 255
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255

  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let hue = 0
  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6
    } else if (max === green) {
      hue = (blue - red) / delta + 2
    } else {
      hue = (red - green) / delta + 4
    }
  }

  hue = Math.round(hue * 60)
  if (hue < 0) {
    hue += 360
  }

  const lightness = (max + min) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))

  return {
    hue,
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
  }
}

function toHsl(channels: HslChannels, saturation: number, lightness: number) {
  return `${channels.hue} ${saturation}% ${lightness}%`
}

function createContrastPair(accentHex: string) {
  const accent = hexToHslChannels(accentHex)
  const light = toHsl(accent, Math.min(Math.max(accent.saturation, 55), 90), 34)
  const dark = toHsl(accent, Math.min(Math.max(accent.saturation, 60), 92), 64)

  return {
    light,
    dark,
    foregroundLight: '0 0% 100%',
    foregroundDark: '222 47% 11%',
  }
}

function createLightPalette(accentHex: string): ThemePalette {
  const accent = hexToHslChannels(accentHex)
  const isNeutralAccent = accent.saturation < 12
  const backgroundSaturation = isNeutralAccent ? 0 : Math.min(accent.saturation, 30)
  const borderSaturation = isNeutralAccent ? 0 : Math.min(accent.saturation, 26)
  const mutedSaturation = isNeutralAccent ? 0 : Math.min(accent.saturation, 24)
  const surfaceLightness = isNeutralAccent ? 99 : 92
  const cardLightness = isNeutralAccent ? 99 : 96
  const secondaryLightness = isNeutralAccent ? 95 : 90
  const mutedLightness = isNeutralAccent ? 96 : 92
  const accentLightness = isNeutralAccent ? 94 : 84
  const borderLightness = isNeutralAccent ? 88 : 76

  return {
    background: toHsl(accent, backgroundSaturation, surfaceLightness),
    foreground: '222 47% 11%',
    card: toHsl(accent, backgroundSaturation, cardLightness),
    cardForeground: '222 47% 11%',
    popover: toHsl(accent, backgroundSaturation, cardLightness),
    popoverForeground: '222 47% 11%',
    primary: toHsl(accent, Math.min(accent.saturation, 60), 36),
    primaryForeground: '0 0% 100%',
    secondary: toHsl(accent, mutedSaturation, secondaryLightness),
    secondaryForeground: '222 47% 11%',
    muted: toHsl(accent, mutedSaturation, mutedLightness),
    mutedForeground: '215 16% 46%',
    accent: toHsl(accent, Math.min(accent.saturation, 24), accentLightness),
    accentForeground: '222 47% 11%',
    border: toHsl(accent, borderSaturation, borderLightness),
    input: toHsl(accent, borderSaturation, borderLightness),
    ring: toHsl(accent, Math.min(accent.saturation, 70), 45),
  }
}

const accentThemePresetDefinitions: AccentThemePresetDefinition[] = [
  {
    id: 'classic-green',
    label: 'Klassisch Grün',
    description: 'Standardstil mit grünem Akzent und kühlem Darkmode.',
    brand: {
      light: '#7DD200',
      dark: '#7DD200',
      foregroundLight: '#132300',
      foregroundDark: '#132300',
    },
    darkPalette: {
      background: '222 26% 10%',
      foreground: '210 22% 96%',
      card: '223 24% 14%',
      cardForeground: '210 22% 96%',
      popover: '223 24% 14%',
      popoverForeground: '210 22% 96%',
      primary: '210 32% 92%',
      primaryForeground: '222 35% 14%',
      secondary: '223 18% 20%',
      secondaryForeground: '210 22% 96%',
      muted: '223 18% 20%',
      mutedForeground: '214 16% 78%',
      accent: '220 22% 24%',
      accentForeground: '210 22% 96%',
      border: '222 18% 28%',
      input: '222 18% 26%',
      ring: '212 80% 72%',
    },
  },
  {
    id: 'ocean-teal',
    label: 'Ocean Teal',
    description: 'Klarer Türkis-Akzent mit ruhigem dunklen Petrol-Look.',
    brand: {
      light: '#0FB6A6',
      dark: '#25D2C0',
      foregroundLight: '#042A26',
      foregroundDark: '#042A26',
    },
    darkPalette: {
      background: '190 32% 9%',
      foreground: '182 24% 94%',
      card: '191 28% 13%',
      cardForeground: '182 24% 94%',
      popover: '191 28% 13%',
      popoverForeground: '182 24% 94%',
      primary: '179 41% 90%',
      primaryForeground: '191 35% 15%',
      secondary: '191 23% 19%',
      secondaryForeground: '182 24% 94%',
      muted: '191 23% 19%',
      mutedForeground: '186 14% 75%',
      accent: '188 31% 24%',
      accentForeground: '182 24% 95%',
      border: '190 20% 29%',
      input: '190 20% 26%',
      ring: '177 72% 62%',
    },
  },
  {
    id: 'sunset-amber',
    label: 'Sunset Amber',
    description: 'Warmes Gold als Akzent mit dunkler Schieferbasis.',
    brand: {
      light: '#F59E0B',
      dark: '#FBBF24',
      foregroundLight: '#2A1500',
      foregroundDark: '#2A1500',
    },
    darkPalette: {
      background: '24 18% 9%',
      foreground: '34 28% 95%',
      card: '24 16% 13%',
      cardForeground: '34 28% 95%',
      popover: '24 16% 13%',
      popoverForeground: '34 28% 95%',
      primary: '36 52% 90%',
      primaryForeground: '25 32% 17%',
      secondary: '24 14% 19%',
      secondaryForeground: '34 28% 95%',
      muted: '24 14% 19%',
      mutedForeground: '31 15% 76%',
      accent: '24 23% 24%',
      accentForeground: '35 30% 95%',
      border: '24 14% 29%',
      input: '24 14% 27%',
      ring: '37 92% 63%',
    },
  },
  {
    id: 'ruby-night',
    label: 'Ruby Night',
    description: 'Roter Akzent mit neutral-dunklem Anthrazit als Grundlage.',
    brand: {
      light: '#E11D48',
      dark: '#FB5B79',
      foregroundLight: '#FFFFFF',
      foregroundDark: '#2A0A12',
    },
    darkPalette: {
      background: '228 16% 9%',
      foreground: '220 24% 95%',
      card: '229 15% 13%',
      cardForeground: '220 24% 95%',
      popover: '229 15% 13%',
      popoverForeground: '220 24% 95%',
      primary: '220 30% 92%',
      primaryForeground: '229 24% 16%',
      secondary: '229 12% 20%',
      secondaryForeground: '220 24% 95%',
      muted: '229 12% 20%',
      mutedForeground: '220 14% 77%',
      accent: '229 18% 25%',
      accentForeground: '220 24% 95%',
      border: '228 10% 30%',
      input: '228 10% 27%',
      ring: '344 95% 68%',
    },
  },
  {
    id: 'indigo-night',
    label: 'Indigo Night',
    description: 'Violettes Akzent mit tiefem Indigo-Darkmode.',
    brand: {
      light: '#6366F1',
      dark: '#818CF8',
      foregroundLight: '#FFFFFF',
      foregroundDark: '#1E1B4B',
    },
    darkPalette: {
      background: '262 52% 8%',
      foreground: '250 23% 94%',
      card: '263 46% 12%',
      cardForeground: '250 23% 94%',
      popover: '263 46% 12%',
      popoverForeground: '250 23% 94%',
      primary: '263 50% 88%',
      primaryForeground: '262 60% 16%',
      secondary: '263 35% 18%',
      secondaryForeground: '250 23% 94%',
      muted: '263 35% 18%',
      mutedForeground: '258 18% 72%',
      accent: '263 40% 24%',
      accentForeground: '250 24% 95%',
      border: '262 30% 32%',
      input: '262 30% 29%',
      ring: '270 91% 71%',
    },
  },
  {
    id: 'forest-green',
    label: 'Forest Green',
    description: 'Waldgrüner Akzent mit erdiger Dunkelpalette.',
    brand: {
      light: '#059669',
      dark: '#10B981',
      foregroundLight: '#FFFFFF',
      foregroundDark: '#064E3B',
    },
    darkPalette: {
      background: '160 24% 9%',
      foreground: '152 28% 93%',
      card: '161 20% 13%',
      cardForeground: '152 28% 93%',
      popover: '161 20% 13%',
      popoverForeground: '152 28% 93%',
      primary: '162 44% 89%',
      primaryForeground: '161 31% 17%',
      secondary: '161 18% 19%',
      secondaryForeground: '152 28% 93%',
      muted: '161 18% 19%',
      mutedForeground: '157 16% 74%',
      accent: '161 28% 24%',
      accentForeground: '152 28% 94%',
      border: '160 20% 31%',
      input: '160 20% 28%',
      ring: '155 80% 59%',
    },
  },
  {
    id: 'sky-blue',
    label: 'Sky Blue',
    description: 'Helles Himmelblau mit tiefem Navy-Darkmode.',
    brand: {
      light: '#0EA5E9',
      dark: '#38BDF8',
      foregroundLight: '#0C2340',
      foregroundDark: '#0C2340',
    },
    darkPalette: {
      background: '228 38% 8%',
      foreground: '216 28% 93%',
      card: '229 35% 12%',
      cardForeground: '216 28% 93%',
      popover: '229 35% 12%',
      popoverForeground: '216 28% 93%',
      primary: '229 48% 89%',
      primaryForeground: '229 42% 15%',
      secondary: '229 30% 18%',
      secondaryForeground: '216 28% 93%',
      muted: '229 30% 18%',
      mutedForeground: '224 16% 74%',
      accent: '229 36% 25%',
      accentForeground: '216 28% 94%',
      border: '228 28% 33%',
      input: '228 28% 30%',
      ring: '217 94% 61%',
    },
  },
  {
    id: 'plum-dusk',
    label: 'Plum Dusk',
    description: 'Pflaumen-Akzent mit dunklem Purple-Grundton.',
    brand: {
      light: '#D946EF',
      dark: '#EC4899',
      foregroundLight: '#FFFFFF',
      foregroundDark: '#500724',
    },
    darkPalette: {
      background: '280 24% 8%',
      foreground: '275 24% 93%',
      card: '281 22% 12%',
      cardForeground: '275 24% 93%',
      popover: '281 22% 12%',
      popoverForeground: '275 24% 93%',
      primary: '281 38% 88%',
      primaryForeground: '282 36% 16%',
      secondary: '281 20% 18%',
      secondaryForeground: '275 24% 93%',
      muted: '281 20% 18%',
      mutedForeground: '276 14% 73%',
      accent: '281 28% 25%',
      accentForeground: '275 25% 94%',
      border: '280 18% 32%',
      input: '280 18% 29%',
      ring: '291 86% 62%',
    },
  },
  {
    id: 'mint-cool',
    label: 'Mint Cool',
    description: 'Frisches Mint-Grün mit minimalistischem Grau-Darkmode.',
    brand: {
      light: '#14B8A6',
      dark: '#2DD4BF',
      foregroundLight: '#0D3B37',
      foregroundDark: '#0D3B37',
    },
    darkPalette: {
      background: '208 14% 9%',
      foreground: '200 20% 94%',
      card: '210 12% 13%',
      cardForeground: '200 20% 94%',
      popover: '210 12% 13%',
      popoverForeground: '200 20% 94%',
      primary: '210 24% 90%',
      primaryForeground: '210 16% 17%',
      secondary: '210 10% 19%',
      secondaryForeground: '200 20% 94%',
      muted: '210 10% 19%',
      mutedForeground: '205 12% 75%',
      accent: '210 14% 26%',
      accentForeground: '200 20% 95%',
      border: '209 10% 34%',
      input: '209 10% 31%',
      ring: '174 88% 61%',
    },
  },
  {
    id: 'coral-warm',
    label: 'Coral Warm',
    description: 'Korallenrot mit warmem Orangen-Darkmode.',
    brand: {
      light: '#FF6B6B',
      dark: '#FF8787',
      foregroundLight: '#2A0A0A',
      foregroundDark: '#2A0A0A',
    },
    darkPalette: {
      background: '12 30% 8%',
      foreground: '28 24% 94%',
      card: '12 28% 12%',
      cardForeground: '28 24% 94%',
      popover: '12 28% 12%',
      popoverForeground: '28 24% 94%',
      primary: '28 48% 89%',
      primaryForeground: '12 36% 16%',
      secondary: '12 24% 18%',
      secondaryForeground: '28 24% 94%',
      muted: '12 24% 18%',
      mutedForeground: '22 16% 74%',
      accent: '12 32% 25%',
      accentForeground: '28 25% 94%',
      border: '12 20% 33%',
      input: '12 20% 30%',
      ring: '10 100% 67%',
    },
  },
  {
    id: 'pure-white',
    label: 'Pure White',
    description: 'Reines Schwarz auf Weiß – Minimalistisch und scharf.',
    brand: {
      light: '#000000',
      dark: '#1F2937',
      foregroundLight: '#FFFFFF',
      foregroundDark: '#1F2937',
    },
    darkPalette: {
      background: '0 0% 5%',
      foreground: '0 0% 97%',
      card: '0 0% 10%',
      cardForeground: '0 0% 97%',
      popover: '0 0% 10%',
      popoverForeground: '0 0% 97%',
      primary: '0 0% 95%',
      primaryForeground: '0 0% 8%',
      secondary: '0 0% 15%',
      secondaryForeground: '0 0% 97%',
      muted: '0 0% 15%',
      mutedForeground: '0 0% 75%',
      accent: '0 0% 20%',
      accentForeground: '0 0% 97%',
      border: '0 0% 25%',
      input: '0 0% 23%',
      ring: '0 0% 60%',
    },
  },
  {
    id: 'clean-slate',
    label: 'Clean Slate',
    description: 'Neutrales Grau – Zeitlos und professionell.',
    brand: {
      light: '#6B7280',
      dark: '#9CA3AF',
      foregroundLight: '#FFFFFF',
      foregroundDark: '#1F2937',
    },
    darkPalette: {
      background: '220 13% 8%',
      foreground: '215 14% 94%',
      card: '220 12% 13%',
      cardForeground: '215 14% 94%',
      popover: '220 12% 13%',
      popoverForeground: '215 14% 94%',
      primary: '215 24% 90%',
      primaryForeground: '220 12% 17%',
      secondary: '220 10% 18%',
      secondaryForeground: '215 14% 94%',
      muted: '220 10% 18%',
      mutedForeground: '213 12% 74%',
      accent: '220 12% 25%',
      accentForeground: '215 14% 95%',
      border: '220 10% 32%',
      input: '220 10% 30%',
      ring: '215 50% 62%',
    },
  },
  {
    id: 'slate-dark',
    label: 'Slate Dark',
    description: 'Tiefes Schiefer-Grau mit extrabraunem Darkmode.',
    brand: {
      light: '#475569',
      dark: '#64748B',
      foregroundLight: '#FFFFFF',
      foregroundDark: '#F1F5F9',
    },
    darkPalette: {
      background: '220 14% 7%',
      foreground: '218 16% 93%',
      card: '220 13% 11%',
      cardForeground: '218 16% 93%',
      popover: '220 13% 11%',
      popoverForeground: '218 16% 93%',
      primary: '218 22% 89%',
      primaryForeground: '220 14% 16%',
      secondary: '220 12% 17%',
      secondaryForeground: '218 16% 93%',
      muted: '220 12% 17%',
      mutedForeground: '216 14% 73%',
      accent: '220 14% 24%',
      accentForeground: '218 16% 94%',
      border: '220 12% 31%',
      input: '220 12% 28%',
      ring: '217 60% 64%',
    },
  },
  {
    id: 'midnight-black',
    label: 'Midnight Black',
    description: 'Absolut schwarz – Für absolute Dunkelheit.',
    brand: {
      light: '#0F0F0F',
      dark: '#1A1A1A',
      foregroundLight: '#FFFFFF',
      foregroundDark: '#FFFFFF',
    },
    darkPalette: {
      background: '0 0% 3%',
      foreground: '0 0% 98%',
      card: '0 0% 7%',
      cardForeground: '0 0% 98%',
      popover: '0 0% 7%',
      popoverForeground: '0 0% 98%',
      primary: '0 0% 96%',
      primaryForeground: '0 0% 5%',
      secondary: '0 0% 12%',
      secondaryForeground: '0 0% 98%',
      muted: '0 0% 12%',
      mutedForeground: '0 0% 76%',
      accent: '0 0% 18%',
      accentForeground: '0 0% 98%',
      border: '0 0% 22%',
      input: '0 0% 20%',
      ring: '0 0% 55%',
    },
  },
  {
    id: 'silver-pro',
    label: 'Silver Pro',
    description: 'Helles Silber mit dunklem Professional-Look.',
    brand: {
      light: '#D1D5DB',
      dark: '#E5E7EB',
      foregroundLight: '#111827',
      foregroundDark: '#111827',
    },
    darkPalette: {
      background: '220 16% 9%',
      foreground: '215 18% 93%',
      card: '220 14% 14%',
      cardForeground: '215 18% 93%',
      popover: '220 14% 14%',
      popoverForeground: '215 18% 93%',
      primary: '215 28% 91%',
      primaryForeground: '220 14% 18%',
      secondary: '220 12% 20%',
      secondaryForeground: '215 18% 93%',
      muted: '220 12% 20%',
      mutedForeground: '213 14% 75%',
      accent: '220 14% 27%',
      accentForeground: '215 18% 94%',
      border: '220 12% 35%',
      input: '220 12% 32%',
      ring: '215 60% 66%',
    },
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    description: 'Glänzendes Obsidian-Schwarz – Ultra-dunkel.',
    brand: {
      light: '#0D0D0D',
      dark: '#161616',
      foregroundLight: '#FFFFFF',
      foregroundDark: '#FFFFFF',
    },
    darkPalette: {
      background: '0 0% 2%',
      foreground: '0 0% 99%',
      card: '0 0% 6%',
      cardForeground: '0 0% 99%',
      popover: '0 0% 6%',
      popoverForeground: '0 0% 99%',
      primary: '0 0% 97%',
      primaryForeground: '0 0% 4%',
      secondary: '0 0% 11%',
      secondaryForeground: '0 0% 99%',
      muted: '0 0% 11%',
      mutedForeground: '0 0% 77%',
      accent: '0 0% 16%',
      accentForeground: '0 0% 99%',
      border: '0 0% 20%',
      input: '0 0% 18%',
      ring: '0 0% 52%',
    },
  },
]

export const accentThemePresets: AccentThemePreset[] = accentThemePresetDefinitions.map((preset) => ({
  ...preset,
  lightPalette: createLightPalette(preset.brand.light),
  contrast: createContrastPair(preset.brand.light),
}))

export function isAccentThemeSupportedInMode(presetId: string, themeMode: ThemeMode) {
  return (accentThemePresetSupport[presetId] || ['light', 'dark']).includes(themeMode)
}

export function getAccentThemePresetsForMode(themeMode: ThemeMode) {
  return accentThemePresets.filter((preset) => isAccentThemeSupportedInMode(preset.id, themeMode))
}

export function getFirstSupportedAccentThemeId(themeMode: ThemeMode) {
  return getAccentThemePresetsForMode(themeMode)[0]?.id || DEFAULT_ACCENT_THEME_ID
}

export const DEFAULT_ACCENT_THEME_ID = accentThemePresets[0].id

export const accentThemePresetMap = new Map(
  accentThemePresets.map((preset) => [preset.id, preset])
)
