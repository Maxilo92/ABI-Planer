import React from 'react';
import { Toaster } from 'sonner';
import { AppShell } from './components/layout/AppShell';
import { AppProvider, useAppContext } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Finanzen from './pages/Finanzen';
import Todos from './pages/Todos';
import News from './pages/News';
import Polls from './pages/Polls';
import Aufgaben from './pages/Aufgaben';
import Gruppen from './pages/Gruppen';
import SammelkartenManager from './pages/SammelkartenManager';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ModulePlaceholder from './pages/ModulePlaceholder';
import Kalender from './pages/Kalender';
import Shop from './pages/Shop';
import SammelkartenQueue from './pages/SammelkartenQueue';
import { 
  HelpCircle, 
  MessageSquareHeart, 
  ShieldAlert,
  Wand2,
  Printer,
  LayoutGrid,
  Users,
  Server,
  FileText,
  BarChart2
} from 'lucide-react';

const PageRenderer: React.FC = () => {
  const { currentPage } = useAppContext();

  switch (currentPage) {
    case 'dashboard': return <Dashboard />;
    case 'news': return <News />;
    case 'polls': return <Polls />;
    case 'kalender': return <Kalender />;
    case 'todos': return <Todos />;
    case 'aufgaben': return <Aufgaben />;
    case 'gruppen': return <Gruppen />;
    case 'finanzen': return <Finanzen />;
    case 'shop': return <Shop />;
    
    // Sammelkarten
    case 'sammelkarten-queue': return <SammelkartenQueue />;
    case 'sammelkarten-editor': return <ModulePlaceholder title="Sammelkarten Designer" icon={Wand2} />;
    case 'sammelkarten-pool': return <SammelkartenManager />;
    case 'sammelkarten-logistik': return <ModulePlaceholder title="Druck-Logistik" icon={Printer} />;
    case 'sammelkarten-matrix': return <ModulePlaceholder title="Design-Matrix" icon={LayoutGrid} />;
    
    // Konto
    case 'profil': return <Profile />;
    case 'einstellungen': return <Settings />;
    
    // Admin
    case 'admin-hub': return <Admin />;
    case 'admin-user': return (
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Benutzerverwaltung</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Users className="w-16 h-16 text-slate-200 mx-auto" />
          <p className="text-slate-500 font-medium">Hier können Administratoren Benutzerrollen verwalten.</p>
        </div>
      </div>
    );
    case 'admin-system': return <ModulePlaceholder title="System Overview" icon={Server} />;
    case 'admin-changelog': return <ModulePlaceholder title="Changelog" icon={FileText} />;
    case 'admin-logs': return <ModulePlaceholder title="System Logs" icon={BarChart2} />;
    case 'admin-feedback': return <ModulePlaceholder title="Feedback Admin" icon={MessageSquareHeart} />;
    
    // Hilfe
    case 'hilfe': return <ModulePlaceholder title="Hilfe Center" icon={HelpCircle} />;
    case 'feedback': return <ModulePlaceholder title="Feedback geben" icon={MessageSquareHeart} />;
    case 'beschwerden': return <ModulePlaceholder title="Beschwerden" icon={ShieldAlert} />;
    
    default:
      return <Dashboard />;
  }
};

function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" richColors />
      <AppShell>
        <PageRenderer />
      </AppShell>
    </AppProvider>
  );
}

export default App;
