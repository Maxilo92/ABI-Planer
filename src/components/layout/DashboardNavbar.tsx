'use client'

import Link from 'next/link'
import { LayoutDashboard, CheckSquare, Calendar, Euro, DollarSign, Megaphone, BarChart2, LogOut, Menu, X, ShieldCheck, User, MessageSquareHeart, Settings, Users, ChevronRight, ChevronLeft, Sparkles, HelpCircle, Trophy, AlertTriangle, ShoppingBag, UserPlus, Server, ArrowLeftRight, Pin, PinOff, Briefcase, Home, ShieldAlert, FileText, Wand2, Package, Printer, LayoutGrid, List } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { db, getFirebaseAuth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useSystemFeatures } from '@/hooks/useSystemFeatures'
import { CountdownHeader } from './CountdownHeader'
import { useNotifications } from '@/hooks/useNotifications'
import Logo from '@/components/Logo'
import { getDashboardBaseUrl, getTcgBaseUrl, getShopBaseUrl, getSupportBaseUrl } from '@/lib/dashboard-url'

const auth = getFirebaseAuth()

interface NavItem {
  href: string
  label: string
  icon: any
  notify?: boolean
  isBeta?: boolean
  subItems?: NavItem[]
  isExternal?: boolean
}

interface QuickAction {
  href: string
  label: string
  pinned?: boolean
}

const MAX_QUICK_ACTIONS = 3

export function DashboardNavbar() {
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

  const isVerified = user?.emailVerified || false
  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'
  
  const dashboardUrl = getDashboardBaseUrl()
  const tcgUrl = getTcgBaseUrl()
  const shopUrl = getShopBaseUrl()

  const resolveHref = (path: string, forceTarget?: 'dashboard' | 'tcg' | 'shop') => {
    if (path === '/') return '/'
    if (forceTarget === 'shop') return `${shopUrl}${path}`
    if (forceTarget === 'tcg') return `${tcgUrl}${path}`
    return path
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('navbar.dashboard.collapsed')
    setIsDesktopCollapsed(stored === 'true')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('navbar.dashboard.collapsed', String(isDesktopCollapsed))
  }, [isDesktopCollapsed])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const syncSearch = () => setCurrentSearch(window.location.search)
    syncSearch()
    window.addEventListener('popstate', syncSearch)
    return () => window.removeEventListener('popstate', syncSearch)
  }, [pathname])

  const handleSignOut = async () => {
    await signOut(auth)
    setIsOpen(false)
    router.push('/login')
  }

  const toggleDesktopCollapsed = () => setIsDesktopCollapsed((v) => !v)

  const toggleSubmenu = (submenuKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenSubmenus(prev => ({ [submenuKey]: !prev[submenuKey] }))
  }

  const navItems: NavItem[] = [
    {
      href: '/uebersicht-root',
      label: 'Übersicht',
      icon: LayoutDashboard,
      subItems: [
        { href: '/', label: 'Dashboard', icon: Home },
        ...(isEnabled('news_status') ? [{ href: '/news', label: 'News', icon: Megaphone, notify: notifications.news }] : []),
        ...(profile && isEnabled('polls_status') ? [
          { href: '/abstimmungen', label: 'Umfragen', icon: BarChart2, notify: notifications.umfragen }
        ] : []),
      ],
    },
  ]

  if (profile) {
    navItems.push({
      href: '/planung-root',
      label: 'Planung',
      icon: Calendar,
      notify: notifications.gruppen,
      subItems: [
        ...(isEnabled('calendar_status') ? [{ href: '/kalender', label: 'Kalender', icon: Calendar, notify: notifications.kalender }] : []),
        ...(isEnabled('todos_status') ? [{ href: '/todos', label: 'Todos', icon: CheckSquare, notify: notifications.todos }] : []),
        { href: '/aufgaben', label: 'Aufgaben', icon: Briefcase },
        { href: '/gruppen', label: 'Gruppen', icon: Users, notify: notifications.gruppen },
      ],
    })

    navItems.push({
      href: '/finanzen-root',
      label: 'Finanzen',
      icon: Euro,
      subItems: [
        { href: '/finanzen', label: 'Kassenstand', icon: Euro },
        ...(isEnabled('shop_status') ? [{ href: resolveHref('/shop', 'shop'), label: 'ABISHOP', icon: ShoppingBag, isExternal: true }] : []),
      ],
    })

    if (isEnabled('sammelkarten_status')) {
      navItems.push({
        href: '/sammelkarten-manager-root',
        label: 'Sammelkarten-Manager',
        icon: Package,
        subItems: [
          { href: '/sammelkarten-manager/queue', label: 'Warteschlange', icon: List },
          { href: '/sammelkarten-manager/editor', label: 'Designer', icon: Wand2 },
          { href: '/sammelkarten-manager/pool', label: 'Karten-Pool', icon: Package },
          { href: '/sammelkarten-manager/logistik', label: 'Druck-Logistik', icon: Printer },
          { href: '/sammelkarten-manager/matrix', label: 'Design-Matrix', icon: LayoutGrid },
        ]
      })
    }

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
      { href: getSupportBaseUrl(), label: 'Hilfe Center', icon: HelpCircle, isExternal: true },
      { href: '/feedback', label: 'Feedback geben', icon: MessageSquareHeart },
      { href: `${getSupportBaseUrl()}/beschwerden`, label: 'Beschwerden', icon: ShieldAlert, isExternal: true },
    ]
  })

  if (isAdmin) {
    navItems.push({ 
      href: '/admin-root', 
      label: 'Admin Bereich', 
      icon: ShieldCheck,
      subItems: [
        { href: '/admin', label: 'Admin Hub', icon: Server },
        { href: '/admin/user', label: 'Benutzerverwaltung', icon: Users },
        { href: '/admin/system', label: 'System Overview', icon: LayoutDashboard },
        { href: '/admin/changelog', label: 'Changelog', icon: FileText },
        { href: '/admin/sammelkarten', label: 'Sammelkarten (Digital)', icon: Sparkles },
        { href: '/admin/global-settings', label: 'Globale Einstellungen', icon: Settings },
        { href: '/admin/shop-earnings', label: 'Shop Einnahmen', icon: DollarSign },
        { href: '/admin/logs', label: 'Logs', icon: BarChart2 },
        { href: '/admin/feedback', label: 'Feedback Admin', icon: MessageSquareHeart },
      ]
    })
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/admin-root') return pathname.startsWith('/admin')
    if (href === '/sammelkarten-manager-root') return pathname.startsWith('/sammelkarten-manager')
    if (href === '/uebersicht-root') return pathname === '/' || pathname.startsWith('/news') || pathname.startsWith('/abstimmungen')
    if (href === '/planung-root') return pathname.startsWith('/kalender') || pathname.startsWith('/todos') || pathname.startsWith('/gruppen')
    if (href === '/finanzen-root') return pathname.startsWith('/finanzen')
    if (href === '/konto-root') return pathname.startsWith('/profil') || pathname.startsWith('/einstellungen')
    if (href === '/hilfe-root') return pathname.startsWith('/feedback')
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  // Quick Actions logic (simplified for this task)
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.uid) return
    const stored = window.localStorage.getItem(`quick_actions:${user.uid}`)
    if (stored) setQuickActions(JSON.parse(stored).slice(0, MAX_QUICK_ACTIONS))
    setQuickActionsHydrated(true)
  }, [user?.uid])

  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isExpanded = openSubmenus[item.href] || (hasSubItems && isActive(item.href) && Object.keys(openSubmenus).length === 0)
    const active = isActive(item.href)
    const isCompact = !isMobile && isDesktopCollapsed

    return (
      <div key={item.href} className="space-y-0.5">
        {hasSubItems ? (
          <button
            onClick={(e) => isCompact ? (setIsDesktopCollapsed(false), setOpenSubmenus({ [item.href]: true })) : toggleSubmenu(item.href, e)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg text-sm font-medium transition-colors',
              isCompact ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
              active ? 'bg-secondary/50 text-primary' : 'hover:bg-secondary'
            )}
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="h-4 w-4" />
              {!isCompact && <span>{item.label}</span>}
            </div>
            {!isCompact && <ChevronRight className={cn("h-4 w-4 opacity-50 transition-transform", isExpanded && "rotate-90")} />}
          </button>
        ) : (
          <Link
            href={item.href}
            target={item.isExternal ? '_blank' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors',
              isCompact ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
              active ? 'bg-secondary text-primary' : 'hover:bg-secondary'
            )}
          >
            <item.icon className="h-4 w-4" />
            {!isCompact && <span>{item.label}</span>}
          </Link>
        )}

        <AnimatePresence>
          {hasSubItems && isExpanded && !isCompact && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-5 pl-3 border-l-2 space-y-0.5 py-0.5">
              {item.subItems!.map((sub) => (
                <Link
                  key={sub.href}
                  href={sub.href}
                  target={sub.isExternal ? '_blank' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                    pathname === sub.href ? 'text-primary bg-secondary/30' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <sub.icon className="h-4 w-4" />
                  <span className="truncate">{sub.label}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const userInitial = profile?.full_name?.substring(0, 1).toUpperCase() || 'U'

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[100] h-16 border-b bg-background/95 backdrop-blur-sm px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo width={40} height={40} />
          <span className="font-extrabold text-xl tracking-tight hidden xs:inline">ABI Planer</span>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2">
          <CountdownHeader />
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-muted-foreground hover:bg-secondary">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>
      <div className="lg:hidden h-16" />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-[90]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="absolute left-0 top-16 bottom-0 w-80 border-r bg-background flex flex-col p-4">
              <nav className="flex-1 overflow-y-auto space-y-4">
                {navItems.map(item => renderNavItem(item, true))}
              </nav>
              <div className="border-t pt-4">
                <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Abmelden
                </Button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className={cn('hidden lg:block h-screen shrink-0', isDesktopCollapsed ? 'w-20' : 'w-72')}>
        <aside className={cn('fixed top-0 left-0 h-screen border-r bg-background flex flex-col transition-all', isDesktopCollapsed ? 'w-20' : 'w-72')}>
          <div className={cn('h-16 border-b flex items-center px-5', isDesktopCollapsed ? 'justify-center' : 'justify-between')}>
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <Logo width={40} height={40} />
              {!isDesktopCollapsed && <span className="font-extrabold text-2xl tracking-tight">ABI Planer</span>}
            </Link>
            {!isDesktopCollapsed && <Button variant="ghost" size="icon" onClick={toggleDesktopCollapsed}><ChevronLeft className="h-4 w-4" /></Button>}
          </div>

          <div className="p-2 border-b flex justify-center"><CountdownHeader collapsed={isDesktopCollapsed} /></div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map(item => renderNavItem(item))}
          </nav>

          <div className="p-4 border-t space-y-2">
            <Link href="/profil" className={cn("flex items-center rounded-md hover:bg-secondary p-2.5", isDesktopCollapsed ? "justify-center" : "gap-3")}>
              <Avatar size="default"><AvatarFallback>{userInitial}</AvatarFallback></Avatar>
              {!isDesktopCollapsed && <span className="font-semibold truncate">{profile?.full_name}</span>}
            </Link>
            <Button variant="ghost" className={cn("text-destructive w-full", isDesktopCollapsed ? "justify-center" : "justify-start gap-3")} onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> {!isDesktopCollapsed && "Abmelden"}
            </Button>
          </div>
        </aside>
        {isDesktopCollapsed && <div className="fixed left-20 top-3 z-40 border-y border-r bg-background rounded-r-lg p-1 shadow-sm"><Button variant="ghost" size="icon" onClick={toggleDesktopCollapsed} className="h-9 w-6"><ChevronRight className="h-4 w-4" /></Button></div>}
      </div>
    </>
  )
}
