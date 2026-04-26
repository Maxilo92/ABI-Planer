import React from 'react';
import { List, CheckCircle2, Clock, XCircle, MoreVertical } from 'lucide-react';

const SammelkartenQueue: React.FC = () => {
  const queueItems = [
    { id: 1, name: 'Hr. Schmidt', type: 'Lehrer', user: 'Max M.', status: 'Prüfung', date: 'Vor 20 Min' },
    { id: 2, name: 'Fr. Meyer', type: 'Lehrer', user: 'Sarah L.', status: 'Wartet', date: 'Vor 2 Stunden' },
    { id: 3, name: 'Hr. Wagner', type: 'Lehrer', user: 'Felix M.', status: 'Korrektur', date: 'Gestern' },
    { id: 4, name: 'Fr. Klein', type: 'Lehrer', user: 'Julia S.', status: 'Wartet', date: '25.04.2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Warteschlange</h2>
        <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          4 ausstehende Karten
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-5">Karten-Name</th>
                <th className="px-6 py-5">Typ</th>
                <th className="px-6 py-5">Eingereicht von</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Zeit</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {queueItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-300">
                        <CheckCircle2 className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="font-bold text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.type}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.user}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest ${
                      item.status === 'Prüfung' ? 'bg-amber-100 text-amber-700' : 
                      item.status === 'Korrektur' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">{item.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-slate-400 hover:text-slate-900 transition-colors">
                      <MoreVertical className="w-5 h-5" />
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

export default SammelkartenQueue;
