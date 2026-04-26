import React from 'react';
import { useAppContext } from '../context/AppContext';
import { mockTransactions, mockTodos, mockEvents } from '../data/mockData';
import { Calendar, Sparkles, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const { currentYear, currentSchool, setCurrentPage, setPro, isPro } = useAppContext();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [currentYear]);

  const transactions = mockTransactions[currentYear.id] || [];
  const todos = mockTodos[currentYear.id] || [];
  const events = mockEvents[currentYear.id] || [];

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const openTodos = todos.filter(t => t.status === 'todo').length;
  const nextEvent = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse-subtle">
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Willkommen, {currentSchool.name}!</h1>
          <p className="text-indigo-100 text-lg">
            Ihr seid gerade in der Planung für <span className="font-semibold text-white">{currentYear.label}</span>.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => setCurrentPage('finanzen')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover-card-effect group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Budget Stand</p>
            <Wallet className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="flex items-end justify-between">
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button 
          onClick={() => setCurrentPage('todos')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover-card-effect group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Offene Aufgaben</p>
            <CheckCircle2 className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{openTodos}</p>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button 
          onClick={() => setCurrentPage('kalender')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover-card-effect group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Nächstes Event</p>
            <Calendar className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900 truncate">
                {nextEvent ? nextEvent.title : 'Keine Termine'}
              </p>
              {nextEvent && (
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {new Date(nextEvent.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Pro-Feature Upsell */}
      {!isPro && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-1 shadow-lg shadow-orange-200/50">
          <div className="bg-white/95 backdrop-blur-sm rounded-[14px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-amber-100 p-4 rounded-2xl shadow-inner">
                <Sparkles className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xl">Upgrade auf Pro</h3>
                <p className="text-slate-600 mt-1 max-w-md">
                  Schalte alle Module frei und synchronisiere deine Termine mit deinem Smartphone.
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setPro(true);
                toast.success('Willkommen bei ABI Planer PRO!', {
                  description: 'Alle Module wurden für dich freigeschaltet.'
                });
              }}
              className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-200"
            >
              Jetzt upgraden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
