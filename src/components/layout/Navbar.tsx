'use client'

import Link from 'next/link'
import { LayoutDashboard, CheckSquare, Calendar, Euro, DollarSign, Megaphone, BarChart2, LogOut, Menu, X, ShieldCheck, User, MessageSquareHeart, Settings, Users, ChevronRight, ChevronLeft, Sparkles, HelpCircle, Gift, Trophy, AlertTriangle, ShoppingBag, UserPlus, Server, ArrowLeftRight, Pin, PinOff, Swords, FileText, ShieldAlert, Briefcase } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { db, getFirebaseAuth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useSystemFeatures } from '@/hooks/useSystemFeatures'
import { CountdownHeader } from './CountdownHeader'
import { useNotifications } from '@/hooks/useNotifications'
import Logo from '@/components/Logo'

import { getAppBaseUrl, getMainBaseUrl, getDashboardBaseUrl, getTcgBaseUrl } from '@/lib/dashboard-url'

const auth = getFirebaseAuth()

interface NavItem {
  href: string
  label: string
  icon: any
  notify?: boolean
  isBeta?: boolean
  subItems?: NavItem[]
  isExternalLink?: boolean
}

interface QuickAction {
  href: string
  label: string
  pinned?: boolean
}

const MAX_QUICK_ACTIONS = 3

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [currentSearch, setCurrentSearch] = useState('')
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [quickActionsHydrated, setQuickActionsHydrated] = useState(false)
  const skipQuickActionTrackingRef = useRef(false)
  const { user, profile, loading } = useAuth()
  const { isEnabled } = useSystemFeatures()
  const notifications = useNotifications()
  const router = useRouter()
  const pathname = usePathname()
  const hasPlanningGroups = profile?.planning_groups && profile.planning_groups.length > 0

  const isVerified = user?.emailVerified || false

  // Domain detection
  const [hostname, setHostname] = useState('')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname)
    }
  }, [])

  const isTcgDomain = hostname.startsWith('tcg.') || hostname.includes('.tcg.')
  const isDashboardDomain = hostname.startsWith('dashboard.') || hostname.startsWith('app.') || hostname.includes('dashboard.')
  const isMainDomain = !isTcgDomain && !isDashboardDomain
  
  const dashboardUrl = getDashboardBaseUrl()
  const tcgUrl = getTcgBaseUrl()
  const mainUrl = getMainBaseUrl()

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'
  const isPlanner = profile?.role === 'planner' || isAdmin
  
  // A user is a "Local Stufe" user if they are a planner or have access to dashboard
  const isLocalPlannerUser = isPlanner || (profile?.class_name && profile.class_name.includes('11'))

  // Helper to resolve URLs across domains
  const resolveHref = (path: string) => {
    const landingRoutes = ['/uber', '/vorteile', '/agb', '/datenschutz', '/impressum']
    const cardRoutes = ['/sammelkarten', '/shop', '/battle-pass']
    const plannerRoutes = [
      '/lehrer', '/abstimmungen', '/admin', '/aufgaben', '/einstellungen', '/feedback', 
      '/finanzen', '/gruppen', '/hilfe', '/kalender', '/r', '/todos', '/unauthorized', 
      '/zugang', '/maintenance'
    ]

    // Special case for root
    if (path === '/') {
      if (isTcgDomain) return '/' // Keeps them on TCG dashboard
      return '/'
    }

    if (landingRoutes.some(r => path === r || path.startsWith(r + '/'))) {
      return isMainDomain ? path : `${mainUrl}${path}`
    }
    if (cardRoutes.some(r => path === r || path.startsWith(r + '/'))) {
      return isTcgDomain ? path : `${tcgUrl}${path}`
    }
    if (plannerRoutes.some(r => path === r || path.startsWith(r + '/'))) {
      return isDashboardDomain ? path : `${dashboardUrl}${path}`
    }

    return path
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem('navbar.desktopCollapsed')
    setIsDesktopCollapsed(stored === 'true')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem('navbar.desktopCollapsed', String(isDesktopCollapsed))
  }, [isDesktopCollapsed])

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

  const toggleDesktopCollapsed = () => {
    setIsDesktopCollapsed((value) => !value)
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

  const [isTradingEnabled, setIsTradingEnabled] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        const status = data.trading_status
        if (status === 'enabled') {
          setIsTradingEnabled(true)
        } else if (status === 'admins_only') {
          setIsTradingEnabled(isAdmin)
        } else if (status === 'disabled') {
          setIsTradingEnabled(false)
        } else {
          // Fallback to legacy boolean field
          setIsTradingEnabled(!!data.is_trading_enabled)
        }
      }
    })
    return () => unsub()
  }, [isAdmin])

  const navItems: NavItem[] = []

  // "Zurück zum Planer" only for planners on TCG domain
  if (isTcgDomain && isLocalPlannerUser) {
    navItems.push({
      href: '/planer-back-root',
      label: 'Planer-Modul',
      icon: ChevronLeft,
      subItems: [
        { href: resolveHref('/'), label: 'Zurück zum Dashboard', icon: LayoutDashboard, isExternalLink: true },
        { href: resolveHref('/kalender'), label: 'Kalender öffnen', icon: Calendar, isExternalLink: true },
      ]
    })
  }

  // CORE WORKING AREAS (Dashboard, Planung, Finanzen)
  // Only show if user is a local planner (or we are not on TCG domain)
  if (!isTcgDomain || isLocalPlannerUser) {
    navItems.push({
      href: '/uebersicht-root',
      label: 'Übersicht',
      icon: LayoutDashboard,
      subItems: [
        { href: resolveHref('/'), label: 'Dashboard', icon: LayoutDashboard, isExternalLink: !isDashboardDomain && !isMainDomain },
        ...(isEnabled('news_status') ? [{ href: '/news', label: 'News', icon: Megaphone, notify: notifications.news }] : []),
        ...(profile && isEnabled('polls_status') ? [
          { href: resolveHref('/abstimmungen'), label: 'Umfragen', icon: BarChart2, notify: notifications.umfragen, isExternalLink: !isDashboardDomain }
        ] : []),
      ],
    })

    if (profile) {
      navItems.push({
        href: '/planung-root',
        label: 'Planung',
        icon: Calendar,
        notify: notifications.gruppen,
        subItems: [
          ...(isEnabled('calendar_status') ? [{ href: resolveHref('/kalender'), label: 'Kalender', icon: Calendar, notify: notifications.kalender, isExternalLink: !isDashboardDomain }] : []),
          ...(isEnabled('todos_status') ? [{ href: resolveHref('/todos'), label: 'Todos', icon: CheckSquare, notify: notifications.todos, isExternalLink: !isDashboardDomain }] : []),
          { href: resolveHref('/aufgaben'), label: 'Aufgaben', icon: Briefcase, isExternalLink: !isDashboardDomain },
          { href: resolveHref('/gruppen'), label: 'Gruppen', icon: Users, notify: notifications.gruppen, isExternalLink: !isDashboardDomain },
        ],
      })
    }

    navItems.push({
      href: '/finanzen-root',
      label: 'Finanzen',
      icon: Euro,
      subItems: [
        { href: resolveHref('/finanzen'), label: 'Kassenstand', icon: Euro, isExternalLink: !isDashboardDomain },
        ...(isEnabled('shop_status') ? [{ href: resolveHref('/shop'), label: 'Shop', icon: ShoppingBag, isExternalLink: !isDashboardDomain }] : []),
      ],
    })
  }

  // TCG AREA
  if (profile && isEnabled('sammelkarten_status')) {
    const sammelkartenSubItems: NavItem[] = [
      { href: resolveHref('/sammelkarten?view=sammelkarten'), label: 'Booster öffnen', icon: Gift, isExternalLink: !isTcgDomain },
      { href: resolveHref('/sammelkarten?view=album'), label: 'Lehrer-Album', icon: Trophy, isExternalLink: !isTcgDomain },
      { href: resolveHref('/sammelkarten?view=decks'), label: 'Meine Decks', icon: LayoutDashboard, isExternalLink: !isTcgDomain },
    ]

    if (isEnabled('trading_status')) {
      sammelkartenSubItems.push({ href: resolveHref('/sammelkarten/tausch'), label: 'Trading-Hub', icon: ArrowLeftRight, notify: notifications.karten, isExternalLink: !isTcgDomain })
    }

    if (isEnabled('combat_status')) {
      sammelkartenSubItems.push({ href: resolveHref('/sammelkarten/kaempfe'), label: 'Kämpfe', icon: Swords, isBeta: true, isExternalLink: !isTcgDomain })
      sammelkartenSubItems.push({ href: resolveHref('/sammelkarten/kaempfe/log'), label: 'Kampflog', icon: FileText, isExternalLink: !isTcgDomain })
    }

    navItems.push({
      href: '/sammelkarten-root',
      label: 'Sammelkarten',
      icon: Sparkles,
      subItems: sammelkartenSubItems
    })
  }

  // ACCOUNT AREA
  if (profile) {
    navItems.push({
      href: '/konto-root',
      label: 'Konto',
      icon: User,
      subItems: [
        { href: '/profil', label: 'Profil', icon: User },
        { href: '/profil/freunde', label: 'Freunde', icon: UserPlus },
        { href: resolveHref('/einstellungen'), label: 'Einstellungen', icon: Settings, isExternalLink: !isDashboardDomain },
      ]
    })
  }

  // HELP AREA
  navItems.push({
    href: '/hilfe-root',
    label: 'Hilfe',
    icon: HelpCircle,
    subItems: [
      { href: resolveHref('/hilfe'), label: 'Hilfe & Info', icon: HelpCircle, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/feedback'), label: 'Feedback geben', icon: MessageSquareHeart, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/hilfe/beschwerden'), label: 'Beschwerden', icon: ShieldAlert, isExternalLink: !isDashboardDomain },
    ]
  })

  // ADMIN AREA
  if (isAdmin) {
    const adminSubItems = [
      { href: resolveHref('/admin/system'), label: 'Control Center', icon: Server, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/admin'), label: 'Benutzer', icon: Users, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/admin/changelog'), label: 'Changelog', icon: FileText, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/admin/sammelkarten'), label: 'Sammelkarten Manager', icon: Sparkles, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/admin/aufgaben'), label: 'Aufgaben Prüfung', icon: Briefcase, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/admin/trades'), label: 'Trade Moderation', icon: ArrowLeftRight, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/admin/global-settings'), label: 'Globale Einstellungen', icon: Settings, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/admin/shop-earnings'), label: 'Shop Einnahmen', icon: DollarSign, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/admin/logs'), label: 'Logs', icon: BarChart2, isBeta: false, isExternalLink: !isDashboardDomain },
      { href: resolveHref('/admin/feedback'), label: 'Feedback Admin', icon: MessageSquareHeart, isExternalLink: !isDashboardDomain },
    ]

    if (profile?.role === 'admin_main') {
      adminSubItems.push({ href: resolveHref('/admin/danger'), label: 'Danger Zone', icon: AlertTriangle, isExternalLink: !isDashboardDomain })
    }

    navItems.push({ 
      href: '/admin-root', 
      label: 'Admin Bereich', 
      icon: ShieldCheck,
      subItems: adminSubItems
    })
  }

  const isAuthPage = ['/login', '/register', '/waiting'].includes(pathname)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!isOpen) return

    const body = document.body
    const scrollY = window.scrollY
    const prevOverflow = body.style.overflow
    const prevPosition = body.style.position
    const prevTop = body.style.top
    const prevWidth = body.style.width

    // Prevent background scrolling while the mobile drawer is open.
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    return () => {
      body.style.overflow = prevOverflow
      body.style.position = prevPosition
      body.style.top = prevTop
      body.style.width = prevWidth
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  const userInitial = profile?.full_name?.substring(0, 1).toUpperCase() || 'U'

  const getRoleLabel = (role: string) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    return role
  }

  const getProfileIdFromHref = (href: string) => {
    const [pathPart] = href.split(/[?#]/)
    const match = pathPart.match(/^\/profil\/([^/]+)$/)
    return match ? decodeURIComponent(match[1]) : null
  }

  const resolveProfileLabel = async (profileId: string) => {
    if (profileId === user?.uid) {
      return profile?.full_name?.trim() || 'Profil'
    }

    try {
      const profileSnap = await getDoc(doc(db, 'profiles', profileId))
      if (profileSnap.exists()) {
        const fullName = (profileSnap.data() as { full_name?: string | null }).full_name?.trim()
        if (fullName) {
          return fullName
        }
      }
    } catch (error) {
      console.error('[Navbar] Failed to resolve profile quick action label:', error)
    }

    return 'Profil'
  }

  const orderQuickActions = (actions: QuickAction[]) => {
    const pinnedActions = actions.filter((action) => action.pinned)
    const regularActions = actions.filter((action) => !action.pinned)
    return [...pinnedActions, ...regularActions].slice(0, MAX_QUICK_ACTIONS)
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

  const getQuickActionLabel = async (href: string) => {
    const profileId = getProfileIdFromHref(href)
    if (profileId) {
      return await resolveProfileLabel(profileId)
    }

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
    if (typeof window === 'undefined') return

    let cancelled = false
    setQuickActionsHydrated(false)

    const loadQuickActions = async () => {
      if (!user?.uid) {
        setQuickActions([])
        setQuickActionsHydrated(true)
        return
      }

      try {
        const stored = window.localStorage.getItem(`quick_actions:${user.uid}`)

        if (!stored) {
          setQuickActions([])
          setQuickActionsHydrated(true)
          return
        }

        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .filter((entry): entry is QuickAction => {
              return entry
                && typeof entry.href === 'string'
                && typeof entry.label === 'string'
            })
            .map((entry) => ({
              ...entry,
              pinned: !!entry.pinned,
            }))

          const resolved = await Promise.all(
            normalized.map(async (entry) => {
              const label = await getQuickActionLabel(entry.href)
              return label && label !== entry.label ? { ...entry, label } : entry
            })
          )

          if (!cancelled) {
            setQuickActions(orderQuickActions(resolved))
          }
        } else {
          setQuickActions([])
        }
      } catch (error) {
        console.error('[Navbar] Failed to load quick actions:', error)
        setQuickActions([])
      } finally {
        if (!cancelled) {
          setQuickActionsHydrated(true)
        }
      }
    }

    void loadQuickActions()

    return () => {
      cancelled = true
    }
  }, [user?.uid])

  useEffect(() => {
    if (typeof window === 'undefined' || !quickActionsHydrated || !user?.uid) return

    try {
      if (quickActions.length === 0) {
        window.localStorage.removeItem(`quick_actions:${user.uid}`)
        return
      }

      window.localStorage.setItem(`quick_actions:${user.uid}`, JSON.stringify(orderQuickActions(quickActions)))
    } catch (error) {
      console.error('[Navbar] Failed to persist quick actions:', error)
    }
  }, [quickActions, quickActionsHydrated, user?.uid])

  useEffect(() => {
    if (skipQuickActionTrackingRef.current) {
      skipQuickActionTrackingRef.current = false
      return
    }

    if (!quickActionsHydrated) return

    const href = `${pathname}${currentSearch}`
    if (!href) return

    let cancelled = false

    const trackQuickAction = async () => {
      const label = await getQuickActionLabel(href)
      if (cancelled) return

      setQuickActions((prev) => {
        const existing = prev.find((entry) => entry.href === href)
        if (existing?.pinned) {
          return orderQuickActions(prev.map((entry) => entry.href === href ? { ...entry, label } : entry))
        }

        const pinnedActions = prev.filter((entry) => entry.pinned)
        const regularActions = prev.filter((entry) => !entry.pinned && entry.href !== href)
        return orderQuickActions([{ href, label }, ...pinnedActions, ...regularActions])
      })
    }

    void trackQuickAction()

    return () => {
      cancelled = true
    }
  }, [pathname, currentSearch, profile?.role, hasPlanningGroups, quickActionsHydrated, user?.uid, profile?.full_name])

  const handlePinQuickAction = (href: string) => {
    setQuickActions((prev) => orderQuickActions(prev.map((entry) => entry.href === href ? { ...entry, pinned: !entry.pinned } : entry)))
  }

  const handleRemoveQuickAction = (href: string) => {
    setQuickActions((prev) => orderQuickActions(prev.filter((entry) => entry.href !== href)))
  }

  const renderQuickActions = (isMobile: boolean = false) => {
    if (quickActions.length === 0 || isDesktopCollapsed) {
      return null
    }

    return (
      <div className="mb-2 border-b pb-2">
        <div className="space-y-0.5">
          {quickActions.map((action, index) => {
            const active = isActive(action.href)

            return (
              <div key={action.href} className="group flex items-center gap-2 px-2 py-1.5">
                {action.href.startsWith('http') ? (
                  <a
                    href={action.href}
                    className={cn(
                      'block min-w-0 flex-1 truncate text-sm font-medium transition-colors',
                      active
                        ? 'text-primary'
                        : index === 0
                          ? 'text-foreground hover:text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {action.label}
                  </a>
                ) : (
                  <Link
                    href={action.href}
                    onClick={() => {
                      skipQuickActionTrackingRef.current = true

                      if (isMobile) setIsOpen(false)

                      const queryIndex = action.href.indexOf('?')
                      setCurrentSearch(queryIndex >= 0 ? action.href.slice(queryIndex) : '')
                    }}
                    className={cn(
                      'block min-w-0 flex-1 truncate text-sm font-medium transition-colors',
                      active
                        ? 'text-primary'
                        : index === 0
                          ? 'text-foreground hover:text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {action.label}
                  </Link>
                )}

                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handlePinQuickAction(action.href)}
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors',
                      action.pinned
                        ? 'border-brand/30 bg-brand/10 text-brand'
                        : 'border-border/70 bg-background text-muted-foreground hover:border-brand/30 hover:text-brand'
                    )}
                    aria-label={action.pinned ? 'Quick Action lösen' : 'Quick Action anpinnen'}
                    title={action.pinned ? 'Quick Action lösen' : 'Quick Action anpinnen'}
                  >
                    {action.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuickAction(action.href)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive"
                    aria-label="Quick Action entfernen"
                    title="Quick Action entfernen"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
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
        <p className={cn('px-2 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground', isDesktopCollapsed && 'lg:hidden')}>
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
    const isCompactDesktop = !isMobile && isDesktopCollapsed
    const labelClassName = cn('truncate', isCompactDesktop && 'sr-only')
    const triggerClassName = cn(
      'flex w-full items-center justify-between rounded-lg text-sm font-medium transition-colors',
      isCompactDesktop ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
      active ? 'bg-secondary/50 text-primary' : 'hover:bg-secondary'
    )

    return (
      <div key={item.href} className={cn('space-y-0.5', isCompactDesktop && 'relative')}>
        {hasSubItems ? (
          <button
            onClick={(e) => {
              if (isCompactDesktop) {
                e.preventDefault()
                e.stopPropagation()
                setIsDesktopCollapsed(false)
                setOpenSubmenus({ [item.href]: true })
                return
              }
              toggleSubmenu(item.href, e)
            }}
            className={triggerClassName}
            title={isCompactDesktop ? item.label : undefined}
            aria-label={item.label}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <item.icon className="h-4 w-4" />
                {item.notify && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                )}
              </div>
              <span className={labelClassName}>{item.label}</span>
              {item.isBeta && !isCompactDesktop && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                  Beta
                </Badge>
              )}
            </div>
            {!isCompactDesktop && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-4 w-4 opacity-50" />
              </motion.div>
            )}
          </button>
        ) : (
          item.isExternalLink ? (
            <a
              href={item.href}
              title={isCompactDesktop ? item.label : undefined}
              aria-label={item.label}
              className={cn(
                'flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors',
                isCompactDesktop ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                active ? 'bg-secondary text-primary' : 'hover:bg-secondary'
              )}
            >
              <div className="relative">
                <item.icon className="h-4 w-4" />
                {item.notify && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                )}
              </div>
              <span className={labelClassName}>{item.label}</span>
              {item.isBeta && !isCompactDesktop && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                  Beta
                </Badge>
              )}
            </a>
          ) : (
            <Link
              href={item.href}
              onClick={() => {
                if (isMobile) setIsOpen(false)
                if (isCompactDesktop) setIsDesktopCollapsed(false)

                const queryIndex = item.href.indexOf('?')
                setCurrentSearch(queryIndex >= 0 ? item.href.slice(queryIndex) : '')
              }}
              title={isCompactDesktop ? item.label : undefined}
              aria-label={item.label}
              className={cn(
                'flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors',
                isCompactDesktop ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                active ? 'bg-secondary text-primary' : 'hover:bg-secondary'
              )}
            >
              <div className="relative">
                <item.icon className="h-4 w-4" />
                {item.notify && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                )}
              </div>
              <span className={labelClassName}>{item.label}</span>
              {item.isBeta && !isCompactDesktop && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                  Beta
                </Badge>
              )}
            </Link>
          )
        )}

        <AnimatePresence initial={false}>
          {hasSubItems && isExpanded && !isCompactDesktop && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="ml-5 pl-3 border-l-2 space-y-0.5 py-0.5 mt-0.5">
                {item.subItems!.map((subItem) => (
                  subItem.isExternalLink ? (
                    <a
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                        isActive(subItem.href) ? 'text-primary bg-secondary/30' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <div className="relative">
                        <subItem.icon className="h-4 w-4" />
                        {subItem.notify && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                        )}
                      </div>
                      <span className="truncate">{subItem.label}</span>
                      {subItem.isBeta && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                          Beta
                        </Badge>
                      )}
                    </a>
                  ) : (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={() => {
                        if (isMobile) setIsOpen(false)
                        if (isCompactDesktop) setIsDesktopCollapsed(false)

                        const queryIndex = subItem.href.indexOf('?')
                        setCurrentSearch(queryIndex >= 0 ? subItem.href.slice(queryIndex) : '')
                      }}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                        isActive(subItem.href) ? 'text-primary bg-secondary/30' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <div className="relative">
                        <subItem.icon className="h-4 w-4" />
                        {subItem.notify && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                        )}
                      </div>
                      <span className="truncate">{subItem.label}</span>
                      {subItem.isBeta && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[9px] uppercase tracking-wide">
                          Beta
                        </Badge>
                      )}
                    </Link>
                  )
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
        <div className="lg:hidden fixed inset-0 z-[90]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsOpen(false)} 
            aria-label="Navigation schliessen"
            style={{ touchAction: 'none' }}
          />
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute left-0 top-16 bottom-0 w-[85vw] max-w-80 border-r bg-background flex flex-col shadow-2xl pt-4"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="flex-1 px-4 pb-4 overflow-y-auto overscroll-contain space-y-0.5" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
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
                    href="/zugang" 
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
        <div className={cn('hidden lg:block lg:relative lg:h-screen lg:shrink-0', isDesktopCollapsed ? 'lg:w-20' : 'lg:w-72')}>
          <aside className={cn('lg:flex lg:fixed lg:top-0 lg:left-0 lg:h-screen border-r bg-background/95 backdrop-blur-sm flex-col overflow-hidden', isDesktopCollapsed ? 'lg:w-20' : 'lg:w-72')}>
          <div className={cn('h-16 border-b flex items-center gap-3', isDesktopCollapsed ? 'px-3 justify-center' : 'px-5 justify-between')}>
            <Link href="/" className={cn('flex items-center gap-3 min-w-0', isDesktopCollapsed && 'justify-center')}>
              <Logo width={40} height={40} />
              <span className={cn('font-extrabold text-2xl tracking-tight shrink-0', isDesktopCollapsed && 'hidden')}>
                ABI Planer
              </span>
            </Link>
            {!isDesktopCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
                onClick={toggleDesktopCollapsed}
                aria-label="Menüleiste einklappen"
                title="Menüleiste einklappen"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className={cn('border-b py-2', isDesktopCollapsed ? 'hidden' : 'px-4 flex justify-center')}>
            <CountdownHeader />
          </div>

          <nav className={cn('flex-1 overflow-y-auto', isDesktopCollapsed ? 'p-2' : 'p-4')}>
            <div className="space-y-0.5">
              {renderQuickActions()}
              {renderGroupedNav()}
            </div>
          </nav>

          <div className={cn('border-t', isDesktopCollapsed ? 'p-2' : 'p-4')}>
            {profile ? (
              <>
                <Link
                  href="/profil"
                  className={cn('flex items-center rounded-md hover:bg-secondary transition-colors', isDesktopCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5')}
                  title={isDesktopCollapsed ? profile.full_name ?? 'Profil' : undefined}
                >
                  <Avatar size="default">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className={cn('min-w-0 flex-1', isDesktopCollapsed && 'sr-only')}>
                    <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {profile.full_name}
                      {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{getRoleLabel(profile.role)}</div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  className={cn('mt-2 text-destructive hover:bg-destructive/10', isDesktopCollapsed ? 'h-10 w-10 px-0 justify-center' : 'w-full justify-start gap-3')}
                  onClick={handleSignOut}
                  aria-label="Abmelden"
                  title="Abmelden"
                >
                  <LogOut className="h-4 w-4" />
                  <span className={cn(isDesktopCollapsed && 'sr-only')}>Abmelden</span>
                </Button>
              </>
            ) : (
              <div className={cn('space-y-2', isDesktopCollapsed && 'flex flex-col items-center')}>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: 'default' }), isDesktopCollapsed ? 'h-10 w-10 px-0 justify-center rounded-xl' : 'w-full justify-center')}
                  title="Anmelden"
                  aria-label="Anmelden"
                >
                  <User className="h-4 w-4" />
                  <span className={cn(isDesktopCollapsed && 'sr-only')}>Anmelden</span>
                </Link>
                <Link
                  href="/zugang"
                  className={cn('block text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors', isDesktopCollapsed && 'sr-only')}
                >
                  Warum ein Konto?
                </Link>
              </div>
            )}
          </div>
          </aside>
          {isDesktopCollapsed && (
            <div className="fixed left-20 top-3 z-40 h-11 w-7 rounded-r-lg border border-l-0 bg-background/95 shadow-sm backdrop-blur-sm">
              <button
                type="button"
                className="flex h-full w-full items-center justify-center rounded-r-lg text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                onClick={toggleDesktopCollapsed}
                aria-label="Menüleiste ausklappen"
                title="Menüleiste ausklappen"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
