'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sun, Moon, ArrowRight, Loader2 } from 'lucide-react'
import { getDashboardRedirectUrl, getDashboardBaseUrl } from '@/lib/dashboard-url'
import Logo from '@/components/Logo'

export function LandingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [isThemeReady, setIsThemeReady] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const dashboardBaseUrl = getDashboardBaseUrl()

  useEffect(() => {
    setIsThemeReady(true)
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const goToDashboard = () => {
    if (typeof window === 'undefined') return
    window.location.href = getDashboardRedirectUrl(window.location)
  }

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
      isScrolled 
        ? "bg-background/80 backdrop-blur-md border-border py-3 shadow-sm" 
        : "bg-transparent border-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="transition-transform group-hover:scale-110">
            <Logo width={40} height={40} />
          </div>
          <div className="hidden sm:block">
            <p className="text-base font-black tracking-tight leading-none">ABI Planer</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Jahrgangs-Plattform</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Planen</Link>
          <Link href="/#tcg" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sammeln</Link>
          <Link href="/news" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">News</Link>
          <a href={`${dashboardBaseUrl}/zugang`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Vorteile</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={toggleTheme}
          >
            {!isThemeReady ? <Loader2 className="h-4 w-4 animate-spin opacity-20" /> : resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

          {isAuthenticated ? (
            <Button onClick={goToDashboard} size="sm" className="h-9 px-4 rounded-lg font-bold">
              Dashboard
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="h-9 px-4 font-bold hidden sm:flex" asChild>
                <a href={`${dashboardBaseUrl}/login`}>Anmelden</a>
              </Button>
              <Button onClick={() => window.location.href = `${dashboardBaseUrl}/register`} size="sm" className="h-9 px-5 rounded-lg font-bold shadow-lg shadow-primary/20">
                Registrieren
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
