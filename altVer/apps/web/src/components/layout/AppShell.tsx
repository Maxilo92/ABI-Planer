import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { Info } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface AppShellProps {
  children: React.ReactNode;
  isReadOnly?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, isReadOnly = false }) => {
  const { isSidebarCollapsed } = useAppContext();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-h-screen relative ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        {/* Read-Only Banner */}
        {isReadOnly && (
          <div className="glass-morphism-amber border-b border-amber-200/50 px-4 py-2.5 flex items-center justify-center gap-2 text-amber-900 text-sm font-semibold sticky top-0 z-[60] shadow-sm">
            <Info className="w-4 h-4 text-amber-600" />
            <span>Dieser Jahrgang ist im Read-Only Modus. Änderungen sind nicht möglich.</span>
            <button className="underline ml-2 hover:text-amber-700 transition-colors">Mehr erfahren</button>
          </div>
        )}

        <Header />
        
        <main className="flex-1 p-4 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};
