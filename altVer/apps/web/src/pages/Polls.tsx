import React from 'react';
import { BarChart2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const Polls: React.FC = () => {
  const polls = [
    { id: 1, question: 'Welche Farbe sollen die Abi-Hoodies haben?', status: 'Aktiv', votes: 124, end: 'In 3 Tagen' },
    { id: 2, question: 'Soll es ein Buffet oder Menü beim Abiball geben?', status: 'Aktiv', votes: 89, end: 'In 5 Tagen' },
    { id: 3, question: 'Abizeitung: Hardcover oder Softcover?', status: 'Beendet', votes: 156, winner: 'Hardcover' },
  ];

  const handleVote = (pollQuestion: string) => {
    toast.success(`Deine Stimme für "${pollQuestion}" wurde gezählt!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Umfragen</h2>
        <button 
          onClick={() => toast.promise(new Promise((resolve) => setTimeout(pollQuestion => resolve(pollQuestion), 1000)), {
            loading: 'Editor wird vorbereitet...',
            success: 'Umfrage-Editor geöffnet',
            error: 'Fehler beim Laden',
          })}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <BarChart2 className="w-4 h-4" /> Neue Umfrage
        </button>
      </div>

      <div className="grid gap-4">
        {polls.map(poll => (
          <div key={poll.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                poll.status === 'Aktiv' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {poll.status}
              </span>
              <span className="text-sm text-slate-400 font-medium">{poll.votes} Stimmen</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">{poll.question}</h3>
            
            {poll.status === 'Aktiv' ? (
              <div className="space-y-3">
                <button 
                  onClick={() => handleVote(poll.question)}
                  className="w-full text-left px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-900 transition-colors text-sm font-medium"
                >
                  Option A
                </button>
                <button 
                  onClick={() => handleVote(poll.question)}
                  className="w-full text-left px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-900 transition-colors text-sm font-medium"
                >
                  Option B
                </button>
                <p className="text-xs text-slate-400 mt-2 italic">Endet {poll.end}</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Ergebnis: {poll.winner}</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Polls;
