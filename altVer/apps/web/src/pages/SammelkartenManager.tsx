import React from 'react';
import { Package, Wand2, List, Printer, LayoutGrid, Info } from 'lucide-react';

const SammelkartenManager: React.FC = () => {
  const stats = [
    { label: 'Karten im Pool', value: '142', icon: Package, color: 'text-indigo-600' },
    { label: 'In Warteschlange', value: '12', icon: List, color: 'text-amber-600' },
    { label: 'Druckaufträge', value: '3', icon: Printer, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sammelkarten Manager</h2>
        <div className="flex gap-2">
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> Designer öffnen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-slate-50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <List className="w-5 h-5" /> Letzte Einreichungen
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-md"></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Lehrer Karte #{104 + i}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Eingereicht von Max M.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">Prüfung</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" /> Design Matrix
          </h3>
          <div className="aspect-video bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <LayoutGrid className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm font-medium">Vorschau der Karten-Verteilung</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-xl flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">Bereit für den Druck?</h3>
          <p className="text-slate-400 max-w-md text-sm leading-relaxed">
            Sobald alle Karten im Pool sind, kannst du hier die hochauflösenden Druckbögen für die Druckerei generieren.
          </p>
          <button className="mt-4 bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-slate-100 transition-colors">
            Logistik öffnen
          </button>
        </div>
        <Printer className="w-32 h-32 absolute -right-4 -bottom-4 text-white/5 rotate-12" />
      </div>
    </div>
  );
};

export default SammelkartenManager;
