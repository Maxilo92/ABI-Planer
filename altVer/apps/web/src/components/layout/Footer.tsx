import React from 'react';
import { Coffee, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-100/50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
              <span className="font-black tracking-tighter text-xl text-slate-900">ABI Planer</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Die zentrale Plattform für eure Abitur-Planung. Verwalte Aufgaben, Finanzen und Termine effizient im Team.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Plattform</h4>
            <ul className="space-y-2 text-sm text-slate-600 font-medium">
              <li><button className="hover:text-indigo-600 transition-colors">Dashboard</button></li>
              <li><button className="hover:text-indigo-600 transition-colors">Finanzen</button></li>
              <li><button className="hover:text-indigo-600 transition-colors">Kalender</button></li>
              <li><button className="hover:text-indigo-600 transition-colors">Aufgaben</button></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Rechtliches</h4>
            <ul className="space-y-2 text-sm text-slate-600 font-medium">
              <li><button className="hover:text-indigo-600 transition-colors">Impressum</button></li>
              <li><button className="hover:text-indigo-600 transition-colors">Datenschutz</button></li>
              <li><button className="hover:text-indigo-600 transition-colors">AGB</button></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span>&copy; {new Date().getFullYear()} ABI Planer</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <button className="hover:text-slate-600 transition-colors">v0.0.8.1</button>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold hover:bg-amber-500/20 transition-all">
              <Coffee className="w-3.5 h-3.5" />
              <span>Support</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
