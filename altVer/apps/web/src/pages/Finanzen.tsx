import React from 'react';
import { useAppContext } from '../context/AppContext';
import { mockTransactions } from '../data/mockData';
import { TrendingUp, TrendingDown, Wallet, Plus, Lock } from 'lucide-react';

const Finanzen: React.FC = () => {
  const { currentYear, isReadOnly } = useAppContext();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [currentYear]);

  const transactions = mockTransactions[currentYear.id] || [];

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse-subtle">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-64 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Finanzen</h1>
          <p className="text-slate-500">Verwalte das Budget für {currentYear.label}</p>
        </div>
        <button
          disabled={isReadOnly}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
            isReadOnly
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95'
          }`}
        >
          {isReadOnly ? (
            <>
              <Lock className="w-4 h-4" />
              <span>Nur Lesezugriff</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Transaktion hinzufügen</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover-card-effect group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Einnahmen</p>
            <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {totalIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover-card-effect group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ausgaben</p>
            <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-rose-600">
            {totalExpense.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover-card-effect group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kontostand</p>
            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
              <Wallet className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-lg">Transaktionsverlauf</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{transactions.length} Einträge</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 font-bold">Kategorie</th>
                <th className="px-6 py-4 font-bold">Beschreibung</th>
                <th className="px-6 py-4 font-bold">Datum</th>
                <th className="px-6 py-4 font-bold">Nutzer</th>
                <th className="px-6 py-4 font-bold text-right">Betrag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{t.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {new Date(t.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{t.user}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <span className="flex items-center justify-end gap-1">
                        {t.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {t.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Wallet className="w-12 h-12 opacity-20" />
                      <p className="italic font-medium">Keine Transaktionen für dieses Jahr gefunden.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Finanzen;
