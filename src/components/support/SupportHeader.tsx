'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, X, HelpCircle, ArrowRight, Languages, Globe, Check, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import { getMainBaseUrl } from '@/lib/dashboard-url'
import { searchHelpFaqs, HelpFaqItem, Locale } from '@/lib/helpFaqs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { useLanguage } from '@/context/LanguageContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const languages = [
  { code: 'de', label: 'DE', name: 'Deutsch', full: 'de-DE' },
  { code: 'en', label: 'EN', name: 'English', full: 'en-US' },
  { code: 'es', label: 'ES', name: 'Español', full: 'es-ES' },
] as const

export function SupportHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const { setLanguage } = useLanguage()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<HelpFaqItem[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Simple locale extraction from pathname
  const locale = (pathname.split('/')[1] as Locale) || 'de'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (search.trim().length > 2) {
      const found = searchHelpFaqs(search, locale, 5)
      setResults(found)
    } else {
      setResults([])
    }
  }, [search, locale])

  const changeLocale = async (newLocale: Locale) => {
    // If logged in, also update profile language
    if (user) {
      const langFull = languages.find(l => l.code === newLocale)?.full
      if (langFull) {
        await setLanguage(langFull as any)
      }
    }
    
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
      isScrolled 
        ? "bg-background/80 backdrop-blur-md border-border py-3 shadow-sm" 
        : "bg-background border-transparent py-4"
    )}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => router.push(`/${locale}`)}>
            <Logo width={35} height={35} />
          </div>
          <div className="hidden sm:flex flex-col -space-y-1">
            <span className="text-base font-black tracking-tight leading-none">Support-Center</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">ABI Planer 2027</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden md:block relative">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={locale === 'en' ? 'Search help...' : locale === 'es' ? 'Buscar ayuda...' : 'Hilfe suchen...'}
              className="pl-10 bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary h-9 rounded-xl transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
            />
          </div>

          {isSearchOpen && search.length > 2 && (
            <div className="absolute top-full left-0 w-full mt-3 bg-popover/95 backdrop-blur-md border rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 z-[60]">
              <div className="flex items-center justify-between px-3 py-2 mb-1 border-b border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {locale === 'en' ? 'Search Results' : locale === 'es' ? 'Resultados' : 'Suchergebnisse'}
                </span>
                <button onClick={() => setIsSearchOpen(false)} className="hover:bg-muted p-1 rounded-full transition-colors">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {results.length > 0 ? (
                  results.map((item) => (
                    <button
                      key={item.id}
                      className="w-full text-left p-3 hover:bg-muted rounded-xl transition-colors group flex items-center justify-between"
                      onClick={() => {
                        router.push(`/${locale}/artikel/${item.id}`)
                        setIsSearchOpen(false)
                        setSearch('')
                      }}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{item.question}</p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider mt-0.5">{item.category}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground italic">
                    {locale === 'en' ? 'No results found.' : locale === 'es' ? 'No se han encontrado resultados.' : 'Keine Treffer gefunden.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] p-1 rounded-xl">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLocale(lang.code as Locale)}
                  className={cn(
                    "flex items-center justify-between px-2 py-1.5 text-sm rounded-lg cursor-pointer transition-colors",
                    locale === lang.code 
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
                  {locale === lang.code && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none ml-2 group relative">
                  <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary/20 transition-all shadow-sm">
                    <AvatarImage src={profile?.photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-border/50">
                <DropdownMenuLabel className="p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-black leading-none">{profile?.full_name || 'Benutzer'}</p>
                    <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-widest">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                   <a href={getMainBaseUrl()} className="flex items-center gap-3">
                     <div className="p-2 bg-primary/10 rounded-lg text-primary">
                       <LayoutDashboard className="h-4 w-4" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-sm font-bold">{locale === 'en' ? 'Planner' : locale === 'es' ? 'Planificador' : 'Zum Planer'}</span>
                       <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Dashboard</span>
                     </div>
                   </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => auth.signOut()} className="rounded-xl p-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5 mt-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold">{locale === 'en' ? 'Logout' : locale === 'es' ? 'Cerrar sesión' : 'Abmelden'}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden lg:flex font-bold text-xs" asChild>
                <a href={getMainBaseUrl()}>{locale === 'en' ? 'Login' : locale === 'es' ? 'Entrar' : 'Login'}</a>
              </Button>
              
              <Button size="sm" className="h-9 px-4 rounded-xl font-bold gap-2 shadow-lg shadow-primary/10 transition-transform active:scale-95" onClick={() => router.push(`/${locale}/beschwerden`)}>
                <HelpCircle className="h-4 w-4" />
                <span className="hidden xs:inline text-xs">{locale === 'en' ? 'Get Help' : locale === 'es' ? 'Ayuda' : 'Hilfe'}</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
