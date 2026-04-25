'use client'

import Link from 'next/link'
import { Home, Sparkles, Gift, Trophy, ArrowLeftRight, Swords, FileText, ShoppingBag, User, UserPlus, Settings, HelpCircle, MessageSquareHeart, ShieldAlert, LogOut, Menu, X, ChevronRight, ChevronLeft, ShieldCheck, LayoutDashboard, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getFirebaseAuth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useSystemFeatures } from '@/hooks/useSystemFeatures'
import { useNotifications } from '@/hooks/useNotifications'
import { CountdownHeader } from './CountdownHeader'
import Logo from '@/components/Logo'
import { getDashboardBaseUrl, getShopBaseUrl, getSupportBaseUrl, isTcgHost } from '@/lib/dashboard-url'

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

export function TcgNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [isStandaloneTCG, setIsStandaloneTCG] = useState(false)
  const { user, profile } = useAuth()
  const { isEnabled } = useSystemFeatures()
  const notifications = useNotifications()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandaloneTCG(isTcgHost(window.location.hostname))
    }
  }, [])

  const dashboardUrl = getDashboardBaseUrl()
  const shopUrl = getShopBaseUrl()
  const isLocalPlannerUser = profile?.role === 'planner' || ['admin_main', 'admin', 'admin_co'].includes(profile?.role || '') || (profile?.class_name && profile.class_name.includes('11'))

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
    { href: '/home', label: 'TCG Dashboard', icon: Home },
  ]

  // Show Planner link for admins and planners
  if (isLocalPlannerUser) {
    navItems.push({
      href: '/planer-back-root',
      label: 'Zum Planer-Modul',
      icon: ChevronLeft,
      subItems: [
        { href: `${dashboardUrl}/`, label: 'Dashboard öffnen', icon: LayoutDashboard, isExternalLink: true },
        { href: `${dashboardUrl}/kalender`, label: 'Kalender öffnen', icon: Calendar, isExternalLink: true },
      ]
    })
  }

  if (profile && isEnabled('sammelkarten_status')) {
    navItems.push({
      href: '/sammelkarten-root',
      label: 'Sammelkarten',
      icon: Sparkles,
      subItems: [
        { href: '/booster', label: 'Booster öffnen', icon: Gift },
        { href: '/album', label: 'Lehrer-Album', icon: Trophy },
        { href: '/sammelkarten?view=decks', label: 'Meine Decks', icon: LayoutDashboard },
        ...(isEnabled('trading_status') ? [{ href: '/sammelkarten/tausch', label: 'Trading-Hub', icon: ArrowLeftRight, notify: notifications.karten }] : []),
        ...(isEnabled('combat_status') ? [
          { href: '/sammelkarten/kaempfe', label: 'Kämpfe', icon: Swords, isBeta: true },
          { href: '/sammelkarten/kaempfe/log', label: 'Kampflog', icon: FileText }
        ] : []),
      ]
    })

    navItems.push({
      href: '/tcg-shop-root',
      label: 'Shop & Extras',
      icon: ShoppingBag,
      subItems: [
        { href: `${shopUrl}/shop?category=sammelkarten`, label: 'Karten-Shop', icon: Sparkles, isExternalLink: true },
        { href: `${shopUrl}/shop?category=merch`, label: 'Merch-Shop', icon: ShoppingBag, isExternalLink: true },
        ...(isEnabled('battle_pass_status') ? [{ href: '/battle-pass', label: 'Battle Pass', icon: Trophy }] : []),
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
      // Hide Planner settings for normal users in TCG mode, but keep for admins/planners
      ...(!isStandaloneTCG || isLocalPlannerUser ? [{ href: `${dashboardUrl}/einstellungen`, label: 'Einstellungen', icon: Settings, isExternalLink: true }] : []),
    ]
  })

  navItems.push({
    href: '/hilfe-root',
    label: 'Hilfe',
    icon: HelpCircle,
    subItems: [
      { href: getSupportBaseUrl(), label: 'Hilfe Center', icon: HelpCircle, isExternalLink: true },
      // Keep Feedback for admins/planners
      ...(!isStandaloneTCG || isLocalPlannerUser ? [{ href: `${dashboardUrl}/feedback`, label: 'Feedback geben', icon: MessageSquareHeart, isExternalLink: true }] : []),
    ]
  })

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

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
            target={item.isExternalLink ? '_blank' : undefined}
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
                  target={sub.isExternalLink ? '_blank' : undefined}
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[100] h-16 border-b bg-background/95 backdrop-blur-sm px-4 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-3">
          <Logo width={40} height={40} />
          <span className="font-extrabold text-xl tracking-tight hidden xs:inline">ABI TCG</span>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2">
          <CountdownHeader />
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-muted-foreground hover:bg-secondary">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>
      <div className="lg:hidden h-16" />

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

      <div className={cn('hidden lg:block h-screen shrink-0', isDesktopCollapsed ? 'w-20' : 'w-72')}>
        <aside className={cn('fixed top-0 left-0 h-screen border-r bg-background flex flex-col transition-all', isDesktopCollapsed ? 'w-20' : 'w-72')}>
          <div className={cn('h-16 border-b flex items-center px-5', isDesktopCollapsed ? 'justify-center' : 'justify-between')}>
            <Link href="/home" className="flex items-center gap-3 min-w-0">
              <Logo width={40} height={40} />
              {!isDesktopCollapsed && <span className="font-extrabold text-2xl tracking-tight">ABI TCG</span>}
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
