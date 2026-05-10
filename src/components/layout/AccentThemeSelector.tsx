'use client'

import { useMemo } from 'react'
import { Check, ChevronDown, Lock, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useAccentTheme } from '@/context/AccentThemeProvider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAccentThemePresetsForMode, isPremiumAccentThemePreset } from '@/lib/accentThemePresets'
import { cn } from '@/lib/utils'

export function AccentThemeSelector() {
  const { presetId, activePreset, setPresetId } = useAccentTheme()
  const { user, profile } = useAuth()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const themeMode = resolvedTheme === 'dark' ? 'dark' : 'light'
  const availablePresets = useMemo(() => getAccentThemePresetsForMode(themeMode), [themeMode])
  const hasPremiumThemes = Boolean(profile?.cosmetics?.premium_themes)

  const handleSetPreset = async (id: string) => {
    if (isPremiumAccentThemePreset(id) && !hasPremiumThemes) {
      toast.info('Premium-Themes sind kostenpflichtig.', {
        description: 'Du kannst sie im Cosmetics-Shop freischalten.',
      })
      router.push('/shop?category=cosmetics')
      return
    }

    setPresetId(id)
    if (user) {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), {
          accent_theme: id
        })
      } catch (error) {
        console.error('Failed to save accent theme to profile:', error)
      }
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Akzentfarben für {themeMode === 'dark' ? 'Darkmode' : 'Whitemode'}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: activePreset.brand.light }}
                  aria-hidden="true"
                />
                <span
                  className="h-4 w-4 rounded-full border border-white/20"
                  style={{ backgroundColor: activePreset.brand.dark }}
                  aria-hidden="true"
                />
              </div>
              <span className="font-medium">{activePreset.label}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {availablePresets.map((preset) => {
            const isActive = preset.id === presetId
            const isLocked = isPremiumAccentThemePreset(preset.id) && !hasPremiumThemes

            return (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => handleSetPreset(preset.id)}
                className={cn(
                  'flex flex-col gap-1 py-2 px-3 cursor-pointer',
                  isActive && 'bg-brand/10',
                  isLocked && 'opacity-70'
                )}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: preset.brand.light }}
                        aria-hidden="true"
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: preset.brand.dark }}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm font-medium">{preset.label}</span>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Paid
                      </span>
                    )}
                  </div>
                  {isActive ? <Check className="h-4 w-4 text-brand shrink-0" /> : isLocked ? <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" /> : null}
                </div>
                <p className="text-xs text-muted-foreground pl-9 leading-snug">{preset.description}</p>
              </DropdownMenuItem>
            )
          })}
          {availablePresets.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Keine passenden Presets für diesen Modus.
            </div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Hell/Dunkel bleiben gratis. Premium-Themes und weitere Cosmetics schaltest du im Shop frei.
      </p>
    </div>
  )
}
