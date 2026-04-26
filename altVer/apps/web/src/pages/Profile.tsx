import React from 'react';
import { User, Mail, Shield, Award, MapPin } from 'lucide-react';

const Profile: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dein Profil</h2>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-32 bg-slate-900"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6">
            <div className="w-32 h-32 bg-slate-100 rounded-3xl border-4 border-white shadow-lg overflow-hidden ring-4 ring-slate-100">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h3 className="text-3xl font-black text-slate-900">Felix Müller</h3>
              <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" /> Gymnasial-Schule am See
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all">
                Profil bearbeiten
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Informationen</h4>
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">felix.mueller@example.com</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Jahrgangs-Administrator</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">Mitglied seit April 2026</span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Aktivitäten</h4>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500 text-center italic">
                Noch keine öffentlichen Aktivitäten vorhanden.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
