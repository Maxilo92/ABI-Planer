import React from 'react';
import { Server, Users, LayoutDashboard, FileText, Sparkles, Settings as SettingsIcon, DollarSign, BarChart2, MessageSquareHeart } from 'lucide-react';

const Admin: React.FC = () => {
  const adminStats = [
    { label: 'Gesamtbenutzer', value: '1.248', icon: Users },
    { label: 'Aktive Schulen', value: '42', icon: LayoutDashboard },
    { label: 'Support Anfragen', value: '5', icon: MessageSquareHeart },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Hub</h2>
        <div className="p-2 bg-rose-100 text-rose-700 rounded-lg text-xs font-black uppercase tracking-tighter ring-2 ring-rose-50">
          Super Admin Mode
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {adminStats.map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <stat.icon className="w-5 h-5 text-slate-400 mb-2" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { label: 'Benutzer', icon: Users, color: 'text-blue-600' },
          { label: 'System', icon: Server, color: 'text-purple-600' },
          { label: 'Changelog', icon: FileText, color: 'text-emerald-600' },
          { label: 'TCG Admin', icon: Sparkles, color: 'text-amber-600' },
          { label: 'Global Settings', icon: SettingsIcon, color: 'text-slate-600' },
          { label: 'Finanzen', icon: DollarSign, color: 'text-green-600' },
          { label: 'System Logs', icon: BarChart2, color: 'text-rose-600' },
          { label: 'Feedback', icon: MessageSquareHeart, color: 'text-pink-600' },
        ].map(module => (
          <button key={module.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-900 hover:shadow-md transition-all flex flex-col items-center gap-3 group text-center">
            <div className={`p-3 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform ${module.color}`}>
              <module.icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">{module.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Admin;
