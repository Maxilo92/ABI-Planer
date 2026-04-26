import React from 'react';
import { Briefcase, Plus, Filter, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

const Aufgaben: React.FC = () => {
  const tasks = [
    { id: 1, title: 'Sponsorenmappe finalisieren', group: 'Finanzen', status: 'In Arbeit', priority: 'Hoch' },
    { id: 2, title: 'Angebot Caterer vergleichen', group: 'Abiball', status: 'Offen', priority: 'Mittel' },
    { id: 3, title: 'Lehrer-Steckbriefe einsammeln', group: 'Abizeitung', status: 'In Arbeit', priority: 'Hoch' },
    { id: 4, title: 'Design für Hoodies entwerfen', group: 'Merch', status: 'Erledigt', priority: 'Niedrig' },
  ];

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Hoch': return 'text-rose-600 bg-rose-50';
      case 'Mittel': return 'text-amber-600 bg-amber-50';
      case 'Niedrig': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Aufgabenverwaltung</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => toast.info('Filter-Optionen werden geladen...')}
            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button 
            onClick={() => toast.promise(new Promise((resolve) => setTimeout(resolve, 800)), {
              loading: 'Aufgaben-Editor wird geladen...',
              success: 'Aufgaben-Editor bereit',
              error: 'Fehler beim Laden',
            })}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Neue Aufgabe
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Aufgabe</th>
                <th className="px-6 py-4">Gruppe</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priorität</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{task.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{task.group}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      task.status === 'Erledigt' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toast('Aktion wählen', {
                        description: `Du bearbeitest gerade: ${task.title}`
                      })}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Aufgaben;
