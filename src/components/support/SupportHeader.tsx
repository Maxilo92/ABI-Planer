'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, X, HelpCircle, ArrowRight, Languages } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { getMainBaseUrl } from '@/lib/dashboard-url'
import { searchHelpFaqs, HelpFaqItem, Locale } from '@/lib/helpFaqs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SupportHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<HelpFaqItem[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Simple locale extraction from pathname
  const locale = (pathname.split('/')[1] as Locale) || 'de'

  useEffect(() => {
    if (search.trim().length > 2) {
      const found = searchHelpFaqs(search, locale, 5)
      setResults(found)
    } else {
      setResults([])
    }
  }, [search, locale])

  const changeLocale = (newLocale: Locale) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="cursor-pointer" onClick={() => router.push(`/${locale}`)}>
            <Logo width={40} height={40} />
          </div>
          <div className="hidden sm:flex flex-col -space-y-1">
            <span className="text-lg font-bold tracking-tight">Support-Center</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">ABI Planer 2027</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden md:block relative">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={locale === 'en' ? 'Search...' : 'Suchen...'}
              className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-9 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
            />
          </div>

          {isSearchOpen && search.length > 2 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-popover border rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-2 py-1 mb-1 border-b">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === 'en' ? 'Search Results' : 'Suchergebnisse'}
                </span>
                <button onClick={() => setIsSearchOpen(false)}>
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              {results.length > 0 ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors group flex items-center justify-between"
                    onClick={() => {
                      router.push(`/${locale}/artikel/${item.id}`)
                      setIsSearchOpen(false)
                      setSearch('')
                    }}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium text-sm truncate">{item.question}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {locale === 'en' ? 'No results found.' : 'Keine Treffer gefunden.'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLocale('de')}>Deutsch</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLocale('en')}>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
            <a href={getMainBaseUrl()}>{locale === 'en' ? 'Back to Planner' : 'Zurück zum Planer'}</a>
          </Button>
          <Button size="sm" className="gap-2 rounded-full" onClick={() => router.push(`/${locale}/beschwerden`)}>
            <HelpCircle className="h-4 w-4" />
            <span className="hidden xs:inline">{locale === 'en' ? 'Get Help' : 'Hilfe anfordern'}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
