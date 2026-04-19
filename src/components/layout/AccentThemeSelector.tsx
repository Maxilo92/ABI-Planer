'use client'

import { useMemo } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'

import { useAccentTheme } from '@/context/AccentThemeProvider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAccentThemePresetsForMode } from '@/lib/accentThemePresets'
import { cn } from '@/lib/utils'

export function AccentThemeSelector() {
  const { presetId, activePreset, setPresetId } = useAccentTheme()
  const { resolvedTheme } = useTheme()
  const themeMode = resolvedTheme === 'dark' ? 'dark' : 'light'
  const availablePresets = useMemo(() => getAccentThemePresetsForMode(themeMode), [themeMode])

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

            return (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => setPresetId(preset.id)}
                className={cn(
                  'flex flex-col gap-1 py-2 px-3 cursor-pointer',
                  isActive && 'bg-brand/10'
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
                  </div>
                  {isActive ? <Check className="h-4 w-4 text-brand shrink-0" /> : null}
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
    </div>
  )
}
