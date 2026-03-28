'use client'

import Link from 'next/link'
import { LayoutDashboard, CheckSquare, Calendar, Euro, Megaphone, BarChart2, LogOut, Menu, X, ShieldCheck, User, MessageSquareHeart, Settings, Users, ChevronDown, ChevronRight, Sparkles, HelpCircle, Gift, Trophy, AlertTriangle, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getFirebaseAuth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { CountdownHeader } from './CountdownHeader'
import { useNotifications } from '@/hooks/useNotifications'

const auth = getFirebaseAuth()

interface NavItem {
  href: string
  label: string
  icon: any
  notify?: boolean
  isBeta?: boolean
  subItems?: NavItem[]
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [currentSearch, setCurrentSearch] = useState('')
  const { profile, loading } = useAuth()
  const notifications = useNotifications()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncSearch = () => {
      setCurrentSearch(window.location.search)
    }

    syncSearch()
    window.addEventListener('popstate', syncSearch)
    return () => window.removeEventListener('popstate', syncSearch)
  }, [pathname])

  const handleSignOut = async () => {
    await signOut(auth)
    setIsOpen(false)
    router.push('/login')
  }

  const toggleSubmenu = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenSubmenus(prev => ({
      ...prev,
      [href]: !prev[href]
    }))
  }

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'

  const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, isBeta: false },
    { href: '/todos', label: 'Todos', icon: CheckSquare, notify: notifications.todos },
    { href: '/kalender', label: 'Kalender', icon: Calendar, notify: notifications.kalender },
    { href: '/finanzen', label: 'Finanzen', icon: Euro },
    { href: '/news', label: 'News', icon: Megaphone, notify: notifications.news },
    { href: '/feedback', label: 'Feedback', icon: MessageSquareHeart },
    {
      href: '/gruppen-root',
      label: 'Gruppen',
      icon: Users,
      isBeta: false,
      subItems: [
        { href: '/gruppen?bereich=mein-team', label: 'Mein Team', icon: Users },
        { href: '/gruppen?bereich=alle-gruppen', label: 'Alle Gruppen', icon: Users },
        { href: '/gruppen?bereich=shared-hub', label: 'Shared Hub', icon: MessageSquareHeart },
      ],
    },
    { href: '/abstimmungen', label: 'Umfragen', icon: BarChart2, notify: notifications.umfragen },
    { href: '/shop', label: 'Shop', icon: ShoppingBag },
  ]

  if (profile) {
    navItems.push({
      href: '/sammelkarten-root',
      label: 'Sammelkarten',
      icon: Sparkles,
      subItems: [
        { href: '/sammelkarten?view=sammelkarten', label: 'Booster öffnen', icon: Gift },
        { href: '/sammelkarten?view=album', label: 'Lehrer-Album', icon: Trophy },
      ]
    })
  }

  navItems.push({ href: '/einstellungen', label: 'Einstellungen', icon: Settings })

  if (isAdmin) {
    const adminSubItems = [
      { href: '/admin', label: 'Benutzer', icon: Users },
      { href: '/admin/sammelkarten', label: 'Sammelkarten Manager', icon: Sparkles },
      { href: '/admin/global-settings', label: 'Globale Einstellungen', icon: Settings },
      { href: '/admin/logs', label: 'Logs', icon: BarChart2, isBeta: false },
      { href: '/admin/feedback', label: 'Feedback Admin', icon: MessageSquareHeart },
    ]

    if (profile?.role === 'admin_main') {
      adminSubItems.push({ href: '/admin/danger', label: 'Danger Zone', icon: AlertTriangle })
    }

    navItems.push({ 
      href: '/admin-root', 
      label: 'Admin Bereich', 
      icon: ShieldCheck,
      subItems: adminSubItems
    })
  }

  navItems.push({ href: '/hilfe', label: 'Hilfe', icon: HelpCircle })

  const isAuthPage = ['/login', '/register', '/waiting'].includes(pathname)

  const userInitial = profile?.full_name?.substring(0, 1).toUpperCase() || 'U'

  const getRoleLabel = (role: string) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    return role
  }

  const isActive = (href: string) => {
    const [path, queryString] = href.split('?')

    if (href === '/') return pathname === '/'
    if (href === '/admin-root') return pathname.startsWith('/admin')
    if (href === '/gruppen-root') return pathname.startsWith('/gruppen')
    if (href === '/sammelkarten-root') return pathname.startsWith('/sammelkarten')

    if (queryString) {
      if (pathname !== path) return false

      const linkParams = new URLSearchParams(queryString)
      const activeParams = new URLSearchParams(currentSearch)
      for (const [key, value] of linkParams.entries()) {
        if (activeParams.get(key) !== value) {
          return false
        }
      }

      return true
    }

    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isExpanded = openSubmenus[item.href] || (hasSubItems && isActive(item.href))
    const active = isActive(item.href)

    return (
      <div key={item.href} className="space-y-1">
        {hasSubItems ? (
          <button
            onClick={(e) => toggleSubmenu(item.href, e)}
            className={cn(
              'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-secondary/50 text-primary' : 'hover:bg-secondary'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <item.icon className="h-4 w-4" />
                {item.notify && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2 rounded-full bg-red-500 border border-background" />
                )}
              </div>
              <span className="truncate">{item.label}</span>
              {item.isBeta && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                  Beta
                </Badge>
              )}
            </div>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <Link
            href={item.href}
            onClick={() => isMobile && setIsOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-secondary text-primary' : 'hover:bg-secondary'
            )}
          >
            <div className="relative">
              <item.icon className="h-4 w-4" />
              {item.notify && (
                <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2 rounded-full bg-red-500 border border-background" />
              )}
            </div>
            <span className="truncate">{item.label}</span>
            {item.isBeta && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                Beta
              </Badge>
            )}
          </Link>
        )}

        {hasSubItems && isExpanded && (
          <div className={cn("ml-4 pl-4 border-l space-y-1", isMobile ? "mt-1" : "mt-1")}>
            {item.subItems!.map((subItem) => (
              <Link
                key={subItem.href}
                href={subItem.href}
                onClick={() => {
                  if (isMobile) setIsOpen(false)

                  const queryIndex = subItem.href.indexOf('?')
                  if (queryIndex >= 0) {
                    setCurrentSearch(subItem.href.slice(queryIndex))
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(subItem.href) ? 'text-primary bg-secondary/30' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <subItem.icon className="h-3.5 w-3.5" />
                <span className="truncate">{subItem.label}</span>
                {subItem.isBeta && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                    Beta
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isAuthPage) {
    return null
  }

  return (
    <>
      {/* Mobile top bar */}
      {!loading && (
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur-sm">
          <div className="h-full px-4 flex items-center justify-between">
            <Link href="/" className="font-extrabold text-xl tracking-tight">
              ABI Planer
            </Link>
            <div className="flex items-center">
              <button
                onClick={() => setIsOpen((v) => !v)}
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-secondary"
                aria-label="Navigation öffnen"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile spacer so content is not hidden under fixed top bar */}
      {!loading && <div className="md:hidden h-16" />}

      {!loading && pathname === '/' && (
        <div className="md:hidden px-4 pt-2 pb-1">
          <div className="flex justify-center">
            <CountdownHeader />
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {!loading && isOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <button className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} aria-label="Navigation schliessen" />
          <aside className="absolute left-0 top-16 bottom-0 w-[85vw] max-w-80 border-r bg-background flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto space-y-1">
              {navItems.map((item) => renderNavItem(item, true))}
            </div>

            <div className="p-4 border-t space-y-2">
              {profile ? (
                <>
                  <Link
                    href="/profil"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-secondary transition-colors"
                  >
                    <Avatar size="default">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold leading-none truncate">{profile.full_name}</div>
                      <div className="text-xs text-muted-foreground uppercase mt-1">{getRoleLabel(profile.role)}</div>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Abmelden
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)} className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}>
                  Anmelden
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      {!loading && (
        <aside className="hidden md:flex md:sticky md:top-0 md:h-screen md:shrink-0 w-72 border-r bg-background/95 backdrop-blur-sm flex-col">
          <div className="h-16 border-b px-5 flex items-center">
            <Link href="/" className="font-extrabold text-2xl tracking-tight shrink-0">
              ABI Planer
            </Link>
          </div>

          <div className="border-b px-4 py-2 flex justify-center">
            <CountdownHeader />
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => renderNavItem(item))}
            </div>
          </nav>

          <div className="p-4 border-t">
            {profile ? (
              <>
                <Link href="/profil" className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-secondary transition-colors">
                  <Avatar size="default">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{profile.full_name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{getRoleLabel(profile.role)}</div>
                  </div>
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-3 mt-2 text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Abmelden
                </Button>
              </>
            ) : (
                <Link href="/login" className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}>
                  Anmelden
                </Link>
            )}
          </div>
        </aside>
      )}
    </>
  )
}
