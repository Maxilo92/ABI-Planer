import React from 'react';
import { Megaphone, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

const News: React.FC = () => {
  const newsItems = [
    { id: 1, title: 'Abiball-Location bestätigt!', date: 'Vor 2 Stunden', author: 'Max M.', content: 'Wir haben endlich die Zusage für die Stadthalle bekommen. Der Termin steht fest!' },
    { id: 2, title: 'Vorverkauf der Tickets startet bald', date: 'Gestern', author: 'Sarah L.', content: 'Ab nächster Woche könnt ihr die Tickets für den Abiball über den Shop erwerben.' },
    { id: 3, title: 'Motto-Wahl: Die Ergebnisse sind da', date: '25.04.2026', author: 'Felix M.', content: 'Das Motto für unseren Jahrgang steht fest: "Abicetamol - Der Schmerz hat ein Ende".' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">News & Ankündigungen</h2>
        <button 
          onClick={() => toast.info('Beitrag-Editor wird geöffnet...')}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <Megaphone className="w-4 h-4" /> Beitrag erstellen
        </button>
      </div>

      <div className="grid gap-4">
        {newsItems.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              <Clock className="w-3 h-3" /> {item.date}
              <span className="mx-1">•</span>
              <User className="w-3 h-3" /> {item.author}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-600 leading-relaxed">{item.content}</p>
            <button 
              onClick={() => toast.info('Beitrag wird geladen...')}
              className="mt-4 text-sm font-bold text-slate-900 hover:underline"
            >
              Weiterlesen →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default News;
