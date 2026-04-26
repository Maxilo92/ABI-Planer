import React from 'react';
import { Users, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const Gruppen: React.FC = () => {
  const groups = [
    { id: 1, name: 'Finanzen & Sponsoring', members: 5, tasks: 12, lead: 'Sarah L.' },
    { id: 2, name: 'Abiball Organisation', members: 8, tasks: 24, lead: 'Max M.' },
    { id: 3, name: 'Abizeitung & Design', members: 6, tasks: 15, lead: 'Felix M.' },
    { id: 4, name: 'Merchandising', members: 4, tasks: 8, lead: 'Julia S.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Planungsgruppen</h2>
        <button 
          onClick={() => toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: 'Gruppen-Konfigurator wird gestartet...',
            success: 'Bereit zur Erstellung',
            error: 'Fehler',
          })}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Neue Gruppe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(group => (
          <div key={group.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <button 
                onClick={() => toast.success(`Einladung für "${group.name}" gesendet!`)}
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{group.name}</h3>
            <p className="text-sm text-slate-500 mb-4">Leitung: {group.lead}</p>
            
            <div className="flex items-center gap-4 text-sm font-bold pt-4 border-t border-slate-50">
              <div className="flex flex-col">
                <span className="text-slate-400 uppercase text-[10px] tracking-widest">Mitglieder</span>
                <span className="text-slate-900">{group.members}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 uppercase text-[10px] tracking-widest">Aufgaben</span>
                <span className="text-slate-900">{group.tasks}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gruppen;
