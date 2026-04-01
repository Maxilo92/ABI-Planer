'use client'

import Link from 'next/link'
import { LayoutDashboard, CheckSquare, Calendar, Euro, DollarSign, Megaphone, BarChart2, LogOut, Menu, X, ShieldCheck, User, MessageSquareHeart, Settings, Users, ChevronRight, Sparkles, HelpCircle, Gift, Trophy, AlertTriangle, ShoppingBag, MessageSquare, UserPlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import Logo from '@/components/Logo'

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
  const [quickActions, setQuickActions] = useState<Array<{ href: string; label: string }>>([])
  const skipQuickActionTrackingRef = useRef(false)
  const { user, profile, loading } = useAuth()
  const notifications = useNotifications()
  const router = useRouter()
  const pathname = usePathname()
  const hasPlanningGroups = profile?.planning_groups && profile.planning_groups.length > 0

  const isVerified = user?.emailVerified || false

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

  const toggleSubmenu = (submenuKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenSubmenus(prev => {
      const isCurrentlyOpen = !!prev[submenuKey]
      // Keep submenu behavior exclusive: only one section open at a time.
      return { [submenuKey]: !isCurrentlyOpen }
    })
  }

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'

  const navItems: NavItem[] = [
    {
      href: '/uebersicht-root',
      label: 'Übersicht',
      icon: LayoutDashboard,
      subItems: [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/news', label: 'News', icon: Megaphone, notify: notifications.news },
        ...(profile ? [
          { href: '/abstimmungen', label: 'Umfragen', icon: BarChart2, notify: notifications.umfragen }
        ] : []),
      ],
    },
    ...(profile ? [
      {
        href: '/planung-root',
        label: 'Planung',
        icon: Calendar,
        subItems: [
          { href: '/kalender', label: 'Kalender', icon: Calendar, notify: notifications.kalender },
          { href: '/todos', label: 'Todos', icon: CheckSquare, notify: notifications.todos },
          ...(hasPlanningGroups ? [
            { href: '/gruppen?bereich=mein-team', label: 'Mein Team', icon: Users },
          ] : []),
          { href: '/gruppen?bereich=alle-gruppen', label: 'Alle Gruppen', icon: Users },
          { href: '/gruppen?bereich=shared-hub', label: 'Shared Hub', icon: MessageSquare },
        ],
      }
    ] : []),
    {
      href: '/finanzen-root',
      label: 'Finanzen',
      icon: Euro,
      subItems: [
        { href: '/finanzen', label: 'Kassenstand', icon: Euro },
        { href: '/shop', label: 'Shop', icon: ShoppingBag },
      ],
    },
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

  if (profile) {
    navItems.push({
      href: '/konto-root',
      label: 'Konto',
      icon: User,
      subItems: [
        { href: '/profil', label: 'Profil', icon: User },
        { href: '/profil/freunde', label: 'Freunde', icon: UserPlus },
        { href: '/einstellungen', label: 'Einstellungen', icon: Settings },
      ]
    })
  }

  navItems.push({
    href: '/hilfe-root',
    label: 'Hilfe',
    icon: HelpCircle,
    subItems: [
      { href: '/hilfe', label: 'Hilfe & Info', icon: HelpCircle },
      { href: '/feedback', label: 'Feedback geben', icon: MessageSquareHeart },
    ]
  })

  if (isAdmin) {
    const adminSubItems = [
      { href: '/admin', label: 'Benutzer', icon: Users },
      { href: '/admin/sammelkarten', label: 'Sammelkarten Manager', icon: Sparkles },
      { href: '/admin/global-settings', label: 'Globale Einstellungen', icon: Settings },
      { href: '/admin/shop-earnings', label: 'Shop Einnahmen', icon: DollarSign },
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

  const isAuthPage = ['/login', '/register', '/waiting'].includes(pathname)

  const userInitial = profile?.full_name?.substring(0, 1).toUpperCase() || 'U'

  const getRoleLabel = (role: string) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    return role
  }

  const isActive = (href: string) => {
    const [pathWithQuery] = href.split('#')
    const [path, queryString] = pathWithQuery.split('?')

    if (href === '/') return pathname === '/'
    if (href === '/admin-root') return pathname.startsWith('/admin')
    if (href === '/uebersicht-root') return pathname === '/' || pathname.startsWith('/news') || pathname.startsWith('/abstimmungen')
    if (href === '/planung-root') return pathname.startsWith('/kalender') || pathname.startsWith('/todos') || pathname.startsWith('/gruppen')
    if (href === '/finanzen-root') return pathname.startsWith('/finanzen') || pathname.startsWith('/shop')
    if (href === '/sammelkarten-root') return pathname.startsWith('/sammelkarten')
    if (href === '/konto-root') return pathname.startsWith('/profil') || pathname.startsWith('/einstellungen')
    if (href === '/hilfe-root') return pathname.startsWith('/hilfe') || pathname.startsWith('/feedback')

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

  const getQuickActionLabel = (href: string) => {
    const findLabel = (items: NavItem[]): string | null => {
      for (const item of items) {
        if (item.href === href && !item.href.endsWith('-root')) {
          return item.label
        }

        const nested = findLabel(item.subItems ?? [])
        if (nested) {
          return nested
        }
      }

      return null
    }

    const matchedLabel = findLabel(navItems)
    if (matchedLabel) {
      return matchedLabel
    }

    const [pathPart] = href.split(/[?#]/)
    if (pathPart === '/') {
      return 'Dashboard'
    }

    const clean = pathPart.replace(/^\//, '')
    if (!clean) {
      return 'Seite'
    }

    const readable = clean
      .split('/')
      .pop()
      ?.replace(/[-_]/g, ' ') ?? 'Seite'

    return readable.charAt(0).toUpperCase() + readable.slice(1)
  }

  useEffect(() => {
    if (skipQuickActionTrackingRef.current) {
      skipQuickActionTrackingRef.current = false
      return
    }

    const href = `${pathname}${currentSearch}`
    if (!href) return

    const label = getQuickActionLabel(href)

    setQuickActions((prev) => {
      if (prev[0]?.href === href) {
        return prev
      }

      const next = [{ href, label }, ...prev.filter((entry) => entry.href !== href)]
      return next.slice(0, 3)
    })
  }, [pathname, currentSearch, profile?.role, hasPlanningGroups])

  const renderQuickActions = (isMobile: boolean = false) => {
    if (quickActions.length === 0) {
      return null
    }

    return (
      <div className="mb-2 border-b pb-2">
        <div className="space-y-0.5">
          {quickActions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => {
                skipQuickActionTrackingRef.current = true

                if (isMobile) setIsOpen(false)

                const queryIndex = action.href.indexOf('?')
                setCurrentSearch(queryIndex >= 0 ? action.href.slice(queryIndex) : '')
              }}
              className={cn(
                'block px-2 py-1.5 text-sm font-medium transition-colors',
                isActive(action.href)
                  ? 'text-primary'
                  : index === 0
                    ? 'text-foreground hover:text-primary'
                    : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const coreNavItems = navItems.filter((item) =>
    item.href !== '/konto-root' && item.href !== '/hilfe-root' && item.href !== '/admin-root'
  )
  const accountHelpItems = navItems.filter((item) => item.href === '/konto-root' || item.href === '/hilfe-root')
  const adminNavItems = navItems.filter((item) => item.href === '/admin-root')

  const renderNavSection = (title: string, items: NavItem[], isMobile: boolean = false) => {
    if (items.length === 0) {
      return null
    }

    return (
      <div className="space-y-0.5">
        <p className="px-2 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        {items.map((item) => renderNavItem(item, isMobile))}
      </div>
    )
  }

  const renderGroupedNav = (isMobile: boolean = false) => (
    <>
      {renderNavSection('Arbeitsbereiche', coreNavItems, isMobile)}
      {renderNavSection('Konto & Hilfe', accountHelpItems, isMobile)}
      {renderNavSection('Admin', adminNavItems, isMobile)}
    </>
  )

  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isExpanded = openSubmenus[item.href] || (hasSubItems && isActive(item.href) && Object.keys(openSubmenus).length === 0)
    const active = isActive(item.href)

    return (
      <div key={item.href} className="space-y-0.5">
        {hasSubItems ? (
          <button
            onClick={(e) => toggleSubmenu(item.href, e)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-secondary/50 text-primary' : 'hover:bg-secondary'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <item.icon className="h-4 w-4" />
                {item.notify && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                )}
              </div>
              <span className="truncate">{item.label}</span>
              {item.isBeta && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                  Beta
                </Badge>
              )}
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 opacity-50" />
            </motion.div>
          </button>
        ) : (
          <Link
            href={item.href}
            onClick={() => {
              if (isMobile) setIsOpen(false)

              const queryIndex = item.href.indexOf('?')
              setCurrentSearch(queryIndex >= 0 ? item.href.slice(queryIndex) : '')
            }}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-secondary text-primary' : 'hover:bg-secondary'
            )}
          >
            <div className="relative">
              <item.icon className="h-4 w-4" />
              {item.notify && (
                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
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

        <AnimatePresence initial={false}>
          {hasSubItems && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="ml-5 pl-3 border-l-2 space-y-0.5 py-0.5 mt-0.5">
                {item.subItems!.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => {
                      if (isMobile) setIsOpen(false)

                      const queryIndex = subItem.href.indexOf('?')
                      setCurrentSearch(queryIndex >= 0 ? subItem.href.slice(queryIndex) : '')
                    }}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                      isActive(subItem.href) ? 'text-primary bg-secondary/30' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <subItem.icon className="h-4 w-4" />
                    <span className="truncate">{subItem.label}</span>
                    {subItem.isBeta && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                        Beta
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur-sm">
          <div className="h-full px-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Logo width={40} height={40} />
              <span className="font-extrabold text-xl tracking-tight">ABI Planer</span>
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
      {!loading && <div className="lg:hidden h-16" />}

      {!loading && pathname === '/' && (
        <div className="lg:hidden px-4 pt-2 pb-1">
          <div className="flex justify-center">
            <CountdownHeader />
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {!loading && isOpen && (
        <div className="lg:hidden fixed inset-0 z-[90] pointer-events-none">
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 top-16 bottom-0 bg-black/50 pointer-events-auto" 
            onClick={() => setIsOpen(false)} 
            aria-label="Navigation schliessen" 
          />
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.05}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) {
                setIsOpen(false)
              }
            }}
            className="absolute left-0 top-16 bottom-0 w-[85vw] max-w-80 border-r bg-background flex flex-col shadow-2xl touch-pan-y pt-4 pointer-events-auto"
          >
            <div className="flex-1 px-4 pb-4 overflow-y-auto space-y-0.5">
              {renderQuickActions(true)}
              {renderGroupedNav(true)}
            </div>

            <div className="p-4 border-t space-y-2 pb-8">
              {profile ? (
                <>
                  <Link
                    href="/profil"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-secondary transition-colors"
                  >
                    <Avatar size="default">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold leading-none truncate flex items-center gap-1.5">
                        {profile.full_name}
                        {isVerified && (
                          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase mt-1">{getRoleLabel(profile.role)}</div>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full h-12 justify-start gap-3 text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Abmelden
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" onClick={() => setIsOpen(false)} className={cn(buttonVariants({ variant: 'default' }), 'w-full h-12 justify-center rounded-xl')}>
                    Anmelden
                  </Link>
                  <Link 
                    href="/promo" 
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                    Warum ein Konto?
                  </Link>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}

      {/* Desktop sidebar */}
      {!loading && (
        <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:shrink-0 w-72 border-r bg-background/95 backdrop-blur-sm flex-col">
          <div className="h-16 border-b px-5 flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <Logo width={40} height={40} />
              <span className="font-extrabold text-2xl tracking-tight shrink-0">
                ABI Planer
              </span>
            </Link>
          </div>

          <div className="border-b px-4 py-2 flex justify-center">
            <CountdownHeader />
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-0.5">
              {renderQuickActions()}
              {renderGroupedNav()}
            </div>
          </nav>

          <div className="p-4 border-t">
            {profile ? (
              <>
                  <Link href="/profil" className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-secondary transition-colors">
                  <Avatar size="default">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {profile.full_name}
                      {isVerified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{getRoleLabel(profile.role)}</div>
                  </div>
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-3 mt-2 text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Abmelden
                </Button>
              </>
            ) : (
                <div className="space-y-2">
                  <Link href="/login" className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}>
                    Anmelden
                  </Link>
                  <Link 
                    href="/promo" 
                    className="block text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                    Warum ein Konto?
                  </Link>
                </div>
            )}
          </div>
        </aside>
      )}
    </>
  )
}
