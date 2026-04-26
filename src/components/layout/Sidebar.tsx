'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  Calendar, 
  CheckSquare, 
  Settings, 
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  LogOut,
  HelpCircle,
  Megaphone,
  BarChart2,
  Briefcase,
  Users,
  ShoppingBag,
  Package,
  List,
  Wand2,
  Printer,
  LayoutGrid,
  User,
  UserPlus,
  MessageSquareHeart,
  ShieldAlert,
  ShieldCheck,
  Server,
  FileText,
  Sparkles,
  DollarSign,
  Home,
  Trophy,
  Gift,
  ArrowLeftRight,
  Swords,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useSystemFeatures } from '@/hooks/useSystemFeatures';
import { useNotifications } from '@/hooks/useNotifications';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import Logo from '@/components/Logo';
import { getDashboardBaseUrl, getTcgBaseUrl, getShopBaseUrl, getSupportBaseUrl } from '@/lib/dashboard-url';
import { CountdownHeader } from './CountdownHeader';

const auth = getFirebaseAuth();

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href?: string;
  isExternal?: boolean;
  subItems?: { 
    id: string; 
    label: string; 
    icon: any; 
    href: string; 
    isExternal?: boolean; 
    notify?: boolean;
    feature?: string;
  }[];
  feature?: string;
  notify?: boolean;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user } = useAuth();
  const { isEnabled } = useSystemFeatures();
  const notifications = useNotifications();

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('sidebar_collapsed');
      setSidebarCollapsed(stored === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setSidebarCollapsed(newState);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sidebar_collapsed', String(newState));
    }
  };

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const isAdmin = ['admin_main', 'admin', 'admin_co'].includes(profile?.role || '');
  
  const dashboardUrl = getDashboardBaseUrl();
  const tcgUrl = getTcgBaseUrl();
  const shopUrl = getShopBaseUrl();
  const supportUrl = getSupportBaseUrl();

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Plattform',
      items: [
        { 
          id: 'uebersicht', 
          label: 'Übersicht', 
          icon: LayoutDashboard,
          subItems: [
            { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
            { id: 'news', label: 'News', icon: Megaphone, href: '/news', feature: 'news_status', notify: notifications.news },
            { id: 'polls', label: 'Umfragen', icon: BarChart2, href: '/abstimmungen', feature: 'polls_status', notify: notifications.umfragen },
          ]
        },
        { 
          id: 'planung', 
          label: 'Planung', 
          icon: Calendar,
          notify: notifications.gruppen || notifications.kalender || notifications.todos,
          subItems: [
            { id: 'kalender', label: 'Kalender', icon: Calendar, href: '/kalender', feature: 'calendar_status', notify: notifications.kalender },
            { id: 'todos', label: 'Todos', icon: CheckSquare, href: '/todos', feature: 'todos_status', notify: notifications.todos },
            { id: 'aufgaben', label: 'Aufgaben', icon: Briefcase, href: '/aufgaben' },
            { id: 'gruppen', label: 'Gruppen', icon: Users, href: '/gruppen', notify: notifications.gruppen },
          ]
        },
        { 
          id: 'finanzen', 
          label: 'Finanzen', 
          icon: Wallet,
          subItems: [
            { id: 'finanzen-status', label: 'Kassenstand', icon: Wallet, href: '/finanzen' },
            { id: 'shop', label: 'ABISHOP', icon: ShoppingBag, href: `${shopUrl}/shop`, isExternal: true, feature: 'shop_status' },
          ]
        },
        {
          id: 'sammelkarten',
          label: 'Sammelkarten',
          icon: Package,
          feature: 'sammelkarten_status',
          notify: notifications.karten,
          subItems: [
            { id: 'tcg-home', label: 'TCG Home', icon: Home, href: `${tcgUrl}/home`, isExternal: true },
            { id: 'booster', label: 'Booster', icon: Gift, href: `${tcgUrl}/booster`, isExternal: true },
            { id: 'album', label: 'Album', icon: Trophy, href: `${tcgUrl}/album`, isExternal: true },
            { id: 'trading', label: 'Trading', icon: ArrowLeftRight, href: `${tcgUrl}/sammelkarten/tausch`, isExternal: true, feature: 'trading_status', notify: notifications.karten },
          ]
        }
      ]
    },
    {
      title: 'Persönlich',
      items: [
        { id: 'profil', label: 'Mein Profil', icon: User, href: '/profil' },
        { id: 'einstellungen', label: 'Einstellungen', icon: Settings, href: '/einstellungen' },
        {
          id: 'support',
          label: 'Hilfe & Support',
          icon: HelpCircle,
          subItems: [
            { id: 'hilfe', label: 'Hilfe Center', icon: HelpCircle, href: supportUrl, isExternal: true },
            { id: 'feedback', label: 'Feedback geben', icon: MessageSquareHeart, href: '/feedback' },
            { id: 'beschwerden', label: 'Beschwerden', icon: ShieldAlert, href: `${supportUrl}/beschwerden`, isExternal: true },
          ]
        }
      ]
    }
  ];

  const adminSection: { title: string; items: NavItem[] } = {
    title: 'Verwaltung',
    items: [
      {
        id: 'admin',
        label: 'Admin Bereich',
        icon: ShieldCheck,
        subItems: [
          { id: 'admin-hub', label: 'Admin Hub', icon: Server, href: '/admin' },
          { id: 'admin-user', label: 'Benutzerverwaltung', icon: Users, href: '/admin/user' },
          { id: 'admin-system', label: 'System Overview', icon: LayoutDashboard, href: '/admin/system' },
          { id: 'admin-changelog', label: 'Changelog', icon: FileText, href: '/admin/changelog' },
          { id: 'admin-logs', label: 'Logs', icon: BarChart2, href: '/admin/logs' },
          { id: 'admin-feedback', label: 'Feedback Admin', icon: MessageSquareHeart, href: '/admin/feedback' },
        ]
      }
    ]
  };

  const isItemActive = (item: NavItem) => {
    if (item.href) {
      if (item.href === '/') return pathname === '/';
      return pathname.startsWith(item.href);
    }
    if (item.subItems?.some(sub => {
      if (sub.href === '/') return pathname === '/';
      return pathname.startsWith(sub.href);
    })) return true;
    return false;
  };

  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item.feature && !isEnabled(item.feature as any)) return null;
      
      if (item.subItems) {
        const filteredSubs = item.subItems.filter(sub => !sub.feature || isEnabled(sub.feature as any));
        if (filteredSubs.length === 0) return null;
        return { ...item, subItems: filteredSubs };
      }
      return item;
    }).filter(item => item !== null) as NavItem[]
  })).filter(section => section.items.length > 0);

  const sections = isAdmin ? [...filteredSections, adminSection] : filteredSections;

  const userInitial = profile?.full_name?.substring(0, 1).toUpperCase() || 'U';
  const avatarSeed = profile?.full_name || 'User';

  const SidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header / Logo */}
      <div className={cn("p-6 border-b border-border/50 flex items-center gap-3", isSidebarCollapsed ? 'lg:justify-center' : '')}>
        <Link href="/" className="flex items-center gap-3 w-full group transition-all">
          <div className="shrink-0">
            <Logo width={32} height={32} />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="font-bold text-foreground truncate text-[15px]">ABI Planer</span>
            </div>
          )}
        </Link>
        {!isSidebarCollapsed && (
          <button onClick={toggleSidebar} className="hidden lg:block p-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Countdown Header for Mobile/Collapsed */}
      <div className={cn("p-2 border-b border-border/50 flex justify-center", isSidebarCollapsed ? "lg:hidden" : "")}>
        <CountdownHeader collapsed={isSidebarCollapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-7">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isSidebarCollapsed && (
              <h3 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
            )}
            {section.items.map((item) => {
              const active = isItemActive(item);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = openSubmenus[item.id] || (hasSubItems && active && Object.keys(openSubmenus).length === 0);

              return (
                <div key={item.id} className="space-y-1">
                  {hasSubItems ? (
                    <button
                      onClick={() => {
                        toggleSubmenu(item.id);
                        if (isSidebarCollapsed) setSidebarCollapsed(false);
                      }}
                      className={cn(
                        "flex items-center w-full rounded-lg transition-all group py-1.5",
                        isSidebarCollapsed ? "lg:justify-center px-0" : "px-3 gap-3",
                        active ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground",
                        isExpanded && !isSidebarCollapsed ? "bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60 ring-4 ring-blue-500/5 text-foreground" : "border border-transparent"
                      )}
                      title={isSidebarCollapsed ? item.label : undefined}
                    >
                      <div className="relative">
                        <item.icon className={cn(
                          "shrink-0 w-[18px] h-[18px] transition-colors",
                          active ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground",
                          isExpanded && !isSidebarCollapsed ? "text-blue-600 dark:text-blue-400" : ""
                        )} />
                        {item.notify && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-card" />
                        )}
                      </div>
                      {!isSidebarCollapsed && (
                        <>
                          <span className={cn(
                            "flex-1 text-left text-[14px] font-medium tracking-tight",
                            isExpanded ? "font-semibold" : ""
                          )}>
                            {item.label}
                          </span>
                          <ChevronRight className={cn(
                            "w-3.5 h-3.5 opacity-40 transition-transform",
                            isExpanded ? "rotate-90 text-blue-600 dark:text-blue-400 opacity-100" : ""
                          )} />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      target={item.isExternal ? '_blank' : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center w-full rounded-lg transition-all group py-1.5",
                        isSidebarCollapsed ? "lg:justify-center px-0" : "px-3 gap-3",
                        active ? "text-indigo-600 dark:text-indigo-400 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-800/60" : "text-muted-foreground hover:text-foreground border-transparent",
                        "border"
                      )}
                      title={isSidebarCollapsed ? item.label : undefined}
                    >
                      <div className="relative">
                        <item.icon className={cn(
                          "shrink-0 w-[18px] h-[18px] transition-colors",
                          active ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        {item.notify && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-card" />
                        )}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className={cn(
                          "flex-1 text-left text-[14px] font-medium tracking-tight",
                          active ? "font-semibold" : ""
                        )}>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )}

                  <AnimatePresence>
                    {hasSubItems && isExpanded && (!isSidebarCollapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-11 space-y-1 py-1"
                      >
                        {item.subItems!.map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            target={sub.isExternal ? '_blank' : undefined}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center w-full py-1 text-[13.5px] font-medium transition-colors text-left",
                              pathname === sub.href 
                                ? "text-blue-600 dark:text-blue-400 font-semibold" 
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="truncate flex-1">{sub.label}</span>
                            {sub.notify && (
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full ml-2" />
                            )}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User / Bottom Section */}
      <div className="p-4 border-t border-border/50 bg-card space-y-4">
        <div className={cn("flex flex-col gap-1", isSidebarCollapsed ? 'lg:items-center' : '')}>
          <Link 
            href="/profil"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center rounded-lg transition-all group hover:bg-muted/50 w-full",
              isSidebarCollapsed ? 'p-2 lg:p-1' : 'p-2 gap-3'
            )}
          >
            <div className="shrink-0 w-8 h-8 bg-muted rounded-md overflow-hidden ring-1 ring-border flex items-center justify-center">
              {profile?.full_name ? (
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">{userInitial}</span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <p className="text-[13px] font-bold text-foreground truncate leading-none">{profile?.full_name || 'Benutzer'}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                  {profile?.role === 'admin_main' ? 'Administrator' : 'Student'}
                </p>
              </div>
            )}
          </Link>
          
          <div className={cn("flex items-center gap-0.5", isSidebarCollapsed ? 'lg:flex-col' : 'px-1')}>
            <Link href="/einstellungen" className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors" title="Einstellungen">
              <Settings className="w-4 h-4" />
            </Link>
            <Link href={supportUrl} target="_blank" className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors" title="Hilfe">
              <HelpCircle className="w-4 h-4" />
            </Link>
            <div className="flex-1" />
            <button 
              onClick={handleSignOut}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors" 
              title="Abmelden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          {!isSidebarCollapsed && (
            <div className="px-2 pt-1">
              <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-[0.2em]">v1.34.1.3</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[40] h-16 border-b border-border bg-background/95 backdrop-blur-sm px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo width={32} height={32} />
          <span className="font-extrabold text-xl tracking-tight text-foreground">ABI Planer</span>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2">
          <CountdownHeader />
        </div>

        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-muted-foreground hover:bg-muted">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>
      <div className="lg:hidden h-16" />

      {/* Desktop Sidebar Wrapper */}
      <div className={cn(
        "hidden lg:block h-screen shrink-0 transition-all duration-300",
        isSidebarCollapsed ? 'w-20' : 'w-64'
      )}>
        <aside className={cn(
          "fixed left-0 top-0 bottom-0 z-30 transition-all duration-300",
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}>
          {SidebarContent}
        </aside>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-2xl"
            >
              {SidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Expand Toggle (only when collapsed) */}
      {isSidebarCollapsed && (
        <button 
          onClick={toggleSidebar}
          className="hidden lg:flex absolute left-[70px] top-20 w-6 h-6 bg-card border border-border rounded-full items-center justify-center text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md transition-all z-40 group"
        >
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </>
  );
};
