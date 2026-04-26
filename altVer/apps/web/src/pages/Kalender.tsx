import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';

const Kalender: React.FC = () => {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const events = [
    { id: 1, title: 'Abiball Planungstreffen', time: '18:00', type: 'Meeting' },
    { id: 2, title: 'Abgabe Steckbriefe', time: 'Ganztägig', type: 'Deadline' },
    { id: 3, title: 'Mottowoche Tag 1', time: '08:00', type: 'Event' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terminkalender</h2>
        <div className="flex gap-2">
          <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-colors">
            Monat
          </button>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Termin hinzufügen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">April 2026</h3>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-slate-50 rounded"><ChevronLeft className="w-5 h-5" /></button>
              <button className="p-1 hover:bg-slate-50 rounded"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100">
            {days.map(day => (
              <div key={day} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="aspect-square border-r border-b border-slate-50 p-2 hover:bg-slate-50 transition-colors relative">
                <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                {i === 25 && <div className="absolute inset-x-1 bottom-1 h-1 bg-indigo-500 rounded-full" />}
                {i === 12 && <div className="absolute inset-x-1 bottom-1 h-1 bg-rose-500 rounded-full" />}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Anstehende Termine</h3>
          {events.map(event => (
            <div key={event.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  event.type === 'Deadline' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {event.type}
                </span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {event.time}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 leading-tight">{event.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Kalender;
