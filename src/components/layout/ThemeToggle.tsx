'use client'

import * as React from 'react'
import { Moon, Sun, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  const themeLabel = theme === 'light' ? 'Hell' : theme === 'dark' ? 'Dunkel' : 'System'

  const handleSetTheme = async (newTheme: string) => {
    setTheme(newTheme)
    if (user) {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), {
          theme: newTheme
        })
      } catch (error) {
        console.error('Failed to save theme to profile:', error)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="flex items-center gap-2">
            <div className="relative h-[1.2rem] w-[1.2rem]">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute inset-0 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
            <span className="text-sm font-medium">{themeLabel}</span>
            <span className="sr-only">Farbschema wählen</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleSetTheme('light')}
          className={cn("flex items-center justify-between", theme === 'light' && "bg-secondary font-bold")}
        >
          Hell
          {theme === 'light' && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleSetTheme('dark')}
          className={cn("flex items-center justify-between", theme === 'dark' && "bg-secondary font-bold")}
        >
          Dunkel
          {theme === 'dark' && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleSetTheme('system')}
          className={cn("flex items-center justify-between", theme === 'system' && "bg-secondary font-bold")}
        >
          System
          {theme === 'system' && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
