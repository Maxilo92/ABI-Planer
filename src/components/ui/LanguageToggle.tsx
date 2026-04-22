'use client'

import * as React from "react"
import { Globe, Check } from "lucide-react"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const languages = [
  { code: 'de-DE', label: 'DE', name: 'Deutsch' },
  { code: 'en-US', label: 'EN', name: 'English' },
  { code: 'es-ES', label: 'ES', name: 'Español' },
] as const

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px] p-1">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex items-center justify-between px-2 py-1.5 text-sm rounded-sm cursor-pointer transition-colors",
              language === lang.code 
                ? "bg-accent text-accent-foreground font-medium" 
                : "hover:bg-accent/50"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold bg-muted px-1 rounded min-w-[24px] text-center">
                {lang.label}
              </span>
              <span>{lang.name}</span>
            </div>
            {language === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
