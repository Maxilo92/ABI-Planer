import React, { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { mockYears, mockTenants } from '../data/mockData';
import type { Year, Tenant } from '../data/mockData';

export type Page = 
  | 'dashboard' | 'news' | 'polls' 
  | 'kalender' | 'todos' | 'aufgaben' | 'gruppen' 
  | 'finanzen' | 'shop' 
  | 'sammelkarten-queue' | 'sammelkarten-editor' | 'sammelkarten-pool' | 'sammelkarten-logistik' | 'sammelkarten-matrix'
  | 'profil' | 'einstellungen'
  | 'admin-hub' | 'admin-user' | 'admin-system' | 'admin-changelog' | 'admin-logs' | 'admin-feedback'
  | 'hilfe' | 'feedback' | 'beschwerden';
export type Role = 'admin' | 'student';

interface AppContextType {
  currentSchool: Tenant;
  currentYear: Year;
  availableYears: Year[];
  isReadOnly: boolean;
  currentPage: Page;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  isPro: boolean;
  userRole: Role;
  switchYear: (yearId: string) => void;
  setCurrentPage: (page: Page) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setPro: (isPro: boolean) => void;
  setUserRole: (role: Role) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSchool] = useState<Tenant>(mockTenants[0]);
  const [currentYear, setCurrentYear] = useState<Year>(mockYears[0]); // Default to Abi 2026
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [userRole, setUserRole] = useState<Role>('admin');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPro, setPro] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    }
    return false;
  });

  const isReadOnly = useMemo(() => currentYear.phase >= 7, [currentYear]);

  const availableYears = useMemo(() => {
    if (userRole === 'admin') return mockYears;
    return [currentYear];
  }, [userRole, currentYear]);

  const switchYear = (yearId: string) => {
    const year = mockYears.find(y => y.id === yearId);
    if (year) {
      setCurrentYear(year);
    }
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  };

  const value = {
    currentSchool,
    currentYear,
    availableYears,
    isReadOnly,
    currentPage,
    isSidebarCollapsed,
    isMobileMenuOpen,
    isPro,
    userRole,
    switchYear,
    setCurrentPage,
    setSidebarCollapsed,
    setMobileMenuOpen,
    setPro,
    setUserRole,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
