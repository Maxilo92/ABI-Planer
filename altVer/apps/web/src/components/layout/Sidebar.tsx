import React, { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { YearSwitcher } from './YearSwitcher';
import { cn } from '../../lib/utils';

import { useAppContext } from '../../context/AppContext';
import type { Page } from '../../context/AppContext';

interface NavItem {
  id: Page | string;
  label: string;
  icon: any;
  subItems?: { id: Page; label: string; icon: any }[];
}

const navSections: { 
  title: string, 
  items: NavItem[] 
}[] = [
  {
    title: 'Plattform',
    items: [
      { 
        id: 'uebersicht', 
        label: 'Dashboard', 
        icon: LayoutDashboard,
        subItems: [
          { id: 'dashboard', label: 'Übersicht', icon: LayoutDashboard },
          { id: 'news', label: 'News', icon: Megaphone },
          { id: 'polls', label: 'Umfragen', icon: BarChart2 },
        ]
      },
      { 
        id: 'planung', 
        label: 'Planung', 
        icon: Calendar,
        subItems: [
          { id: 'kalender', label: 'Kalender', icon: Calendar },
          { id: 'todos', label: 'Todos', icon: CheckSquare },
          { id: 'aufgaben', label: 'Aufgaben', icon: Briefcase },
          { id: 'gruppen', label: 'Gruppen', icon: Users },
        ]
      },
      { 
        id: 'finanzen', 
        label: 'Finanzen', 
        icon: Wallet,
        subItems: [
          { id: 'finanzen', label: 'Kassenstand', icon: Wallet },
          { id: 'shop', label: 'ABISHOP', icon: ShoppingBag },
        ]
      },
      {
        id: 'sammelkarten',
        label: 'Sammelkarten',
        icon: Package,
        subItems: [
          { id: 'sammelkarten-pool', label: 'Karten-Pool', icon: Package },
          { id: 'sammelkarten-queue', label: 'Warteschlange', icon: List },
          { id: 'sammelkarten-editor', label: 'Designer', icon: Wand2 },
          { id: 'sammelkarten-logistik', label: 'Druck-Logistik', icon: Printer },
          { id: 'sammelkarten-matrix', label: 'Design-Matrix', icon: LayoutGrid },
        ]
      }
    ]
  },
  {
    title: 'Persönlich',
    items: [
      { id: 'profil', label: 'Mein Profil', icon: User },
      { id: 'einstellungen', label: 'Einstellungen', icon: Settings },
      {
        id: 'support',
        label: 'Hilfe & Support',
        icon: HelpCircle,
        subItems: [
          { id: 'hilfe', label: 'Hilfe Center', icon: HelpCircle },
          { id: 'feedback', label: 'Feedback geben', icon: MessageSquareHeart },
          { id: 'beschwerden', label: 'Beschwerden', icon: ShieldAlert },
        ]
      }
    ]
  }
];

const adminSection = {
  title: 'Verwaltung',
  items: [
    {
      id: 'admin',
      label: 'Admin Bereich',
      icon: ShieldCheck,
      subItems: [
        { id: 'admin-hub', label: 'Admin Hub', icon: Server },
        { id: 'admin-user', label: 'Benutzerverwaltung', icon: Users },
        { id: 'admin-system', label: 'System Overview', icon: LayoutDashboard },
        { id: 'admin-changelog', label: 'Changelog', icon: FileText },
        { id: 'admin-logs', label: 'Logs', icon: BarChart2 },
        { id: 'admin-feedback', label: 'Feedback Admin', icon: MessageSquareHeart },
      ]
    }
  ]
};

export const Sidebar: React.FC = () => {
  const { 
    currentPage, 
    setCurrentPage, 
    isSidebarCollapsed, 
    setSidebarCollapsed,
    isMobileMenuOpen,
    setMobileMenuOpen,
    isPro,
    setPro,
    userRole,
    setUserRole
  } = useAppContext();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isItemActive = (item: NavItem) => {
    if (item.id === currentPage) return true;
    if (item.subItems?.some(sub => sub.id === currentPage)) return true;
    return false;
  };

  // Define which items are Pro only
  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (!isPro) {
        // In Free mode, only allow basic Overview and Account/Help
        const allowedFreeRoots = ['uebersicht-root', 'konto-root', 'hilfe-root'];
        if (!allowedFreeRoots.includes(item.id as string)) return null;
        
        // Filter subItems for Free mode
        if (item.subItems) {
          const allowedFreeSubs = ['dashboard', 'news', 'polls', 'profil', 'einstellungen', 'hilfe', 'feedback', 'beschwerden'];
          const filteredSubs = item.subItems.filter(sub => allowedFreeSubs.includes(sub.id));
          if (filteredSubs.length === 0) return null;
          return { ...item, subItems: filteredSubs };
        }
      }
      return item;
    }).filter(item => item !== null) as NavItem[]
  })).filter(section => section.items.length > 0);

  const sections = userRole === 'admin' ? [...filteredSections, adminSection] : filteredSections;

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header / Logo / School Switcher */}
      <div className={`p-6 border-b border-slate-50 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
        <button className="flex items-center gap-3 w-full group transition-all">
          <div className="shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded flex items-center justify-center text-white shadow-sm ring-2 ring-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="font-bold text-slate-900 truncate text-[15px]">ABI Planer</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 rotate-90 transition-colors" />
            </div>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-7">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isSidebarCollapsed && (
              <h3 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
            )}
            {section.items.map((item) => {
              const active = isItemActive(item);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = openSubmenus[item.id as string] || (hasSubItems && active && Object.keys(openSubmenus).length === 0);

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (hasSubItems) {
                        toggleSubmenu(item.id as string);
                        if (isSidebarCollapsed) setSidebarCollapsed(false);
                      } else {
                        setCurrentPage(item.id as Page);
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={cn(
                      "flex items-center w-full rounded-lg transition-all group py-1.5",
                      isSidebarCollapsed ? "lg:justify-center px-0" : "px-3 gap-3",
                      active && !hasSubItems ? "text-indigo-600" : "text-slate-600 hover:text-slate-900",
                      isExpanded && !isSidebarCollapsed ? "bg-blue-50/50 border border-blue-200/60 ring-4 ring-blue-500/5 text-slate-900" : "border border-transparent"
                    )}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className={cn(
                      "shrink-0 w-[18px] h-[18px] transition-colors",
                      active && !hasSubItems ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600",
                      isExpanded && !isSidebarCollapsed ? "text-blue-600" : ""
                    )} />
                    {!isSidebarCollapsed && (
                      <>
                        <span className={cn(
                          "flex-1 text-left text-[14px] font-medium tracking-tight",
                          active && !hasSubItems ? "text-indigo-600" : "",
                          isExpanded ? "font-semibold" : ""
                        )}>
                          {item.label}
                        </span>
                        {hasSubItems && (
                          <ChevronRight className={cn(
                            "w-3.5 h-3.5 opacity-40 transition-transform",
                            isExpanded ? "rotate-90 text-blue-600 opacity-100" : ""
                          )} />
                        )}
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {hasSubItems && isExpanded && (!isSidebarCollapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-11 space-y-1 py-1"
                      >
                        {item.subItems!.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setCurrentPage(sub.id);
                              setMobileMenuOpen(false);
                            }}
                            className={cn(
                              "flex items-center w-full py-1 text-[13.5px] font-medium transition-colors text-left",
                              currentPage === sub.id 
                                ? "text-blue-600 font-semibold" 
                                : "text-slate-500 hover:text-slate-900"
                            )}
                          >
                            <span className="truncate">{sub.label}</span>
                          </button>
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
      <div className="p-4 border-t border-slate-50 bg-white space-y-4">
        {/* Pro Toggle - Slimmer Style */}
        <div className={`flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded flex items-center justify-center text-white font-black text-[9px]",
              isPro ? "bg-indigo-600" : "bg-slate-400"
            )}>
              {isPro ? "PRO" : "FREE"}
            </div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{isPro ? "Full Access" : "Basic"}</span>
          </div>
          <button 
            onClick={() => setPro(!isPro)}
            className={cn(
              "w-7 h-3.5 rounded-full relative transition-colors duration-200",
              isPro ? "bg-indigo-600" : "bg-slate-300"
            )}
          >
            <div className={cn(
              "absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all duration-200 shadow-sm",
              isPro ? "translate-x-3.5" : "translate-x-0"
            )} />
          </button>
        </div>

        <div className={`flex flex-col gap-1 ${isSidebarCollapsed ? 'lg:items-center' : ''}`}>
          <button 
            onClick={() => setUserRole(userRole === 'admin' ? 'student' : 'admin')}
            className={`flex items-center rounded-lg transition-all group hover:bg-slate-50 w-full ${
              isSidebarCollapsed ? 'p-2 lg:p-1 lg:gap-3' : 'p-2 gap-3'
            }`}
          >
            <div className="shrink-0 w-8 h-8 bg-slate-100 rounded-md overflow-hidden ring-1 ring-slate-200">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`flex-1 text-left min-w-0 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              <p className="text-[13px] font-bold text-slate-900 truncate leading-none">Felix Müller</p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
                {userRole === 'admin' ? 'Administrator' : 'Student'}
              </p>
            </div>
          </button>
          
          <div className={`flex items-center gap-0.5 ${isSidebarCollapsed ? 'lg:flex-col' : 'px-1'}`}>
            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors" title="Einstellungen">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors" title="Hilfe">
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="flex-1" />
            <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Abmelden">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          {!isSidebarCollapsed && (
            <div className="px-2 pt-1">
              <p className="text-[10px] font-medium text-slate-300 uppercase tracking-[0.2em]">v0.0.8.1</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {SidebarContent}
      </aside>

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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
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
          onClick={() => setSidebarCollapsed(false)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm hover:shadow-md transition-all z-40 group"
        >
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </>
  );
};
