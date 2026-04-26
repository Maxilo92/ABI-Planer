import React from 'react';
import { Layout } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  icon?: any;
}

const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title, icon: Icon = Layout }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg rotate-3">
          <Icon className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{title}</h2>
        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
          Dieses Modul befindet sich aktuell noch in der Entwicklung. Schau bald wieder vorbei!
        </p>
      </div>
      
      <div className="flex gap-3">
        <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default ModulePlaceholder;
