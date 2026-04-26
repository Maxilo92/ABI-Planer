import React from 'react';
import { 
  ChevronRight, 
  Bell, 
  Search,
  Menu
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { currentSchool, currentYear, currentPage, userRole, setUserRole, setMobileMenuOpen } = useAppContext();

  const getPageTitle = (id: string) => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'news': 'News',
      'polls': 'Umfragen',
      'kalender': 'Kalender',
      'todos': 'Todos',
      'aufgaben': 'Aufgaben',
      'gruppen': 'Gruppen',
      'finanzen': 'Finanzen',
      'shop': 'ABISHOP',
      'sammelkarten-queue': 'Warteschlange',
      'sammelkarten-editor': 'Designer',
      'sammelkarten-pool': 'Karten-Pool',
      'sammelkarten-logistik': 'Druck-Logistik',
      'sammelkarten-matrix': 'Design-Matrix',
      'profil': 'Profil',
      'einstellungen': 'Einstellungen',
      'admin-hub': 'Admin Hub',
      'admin-user': 'Benutzerverwaltung',
      'admin-system': 'System Overview',
      'admin-changelog': 'Changelog',
      'admin-logs': 'Logs',
      'admin-feedback': 'Feedback Admin',
      'hilfe': 'Hilfe Center',
      'feedback': 'Feedback geben',
      'beschwerden': 'Beschwerden'
    };
    return titles[id] || 'Dashboard';
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
      {/* Breadcrumbs & Mobile Menu */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <nav className="hidden md:flex items-center gap-2 text-sm font-bold">
          <span className="text-slate-400 hover:text-slate-900 cursor-pointer transition-colors uppercase tracking-wider">{currentSchool.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">{currentYear.label}</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{getPageTitle(currentPage)}</span>
        </nav>

        <h1 className="md:hidden font-bold text-slate-900">{getPageTitle(currentPage)}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all hover:scale-110 active:scale-95">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all hover:scale-110 active:scale-95 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        
        <button 
          onClick={() => setUserRole(userRole === 'admin' ? 'student' : 'admin')}
          className="lg:hidden w-9 h-9 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200"
        >
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User Avatar" 
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};
