import React from 'react';
import { Settings as SettingsIcon, Bell, Lock, Eye, Moon, Globe } from 'lucide-react';

const Settings: React.FC = () => {
  const sections = [
    { title: 'Konto & Sicherheit', icon: Lock, items: ['Passwort ändern', 'Zweistufige Authentifizierung', 'Anmeldeverlauf'] },
    { title: 'Benachrichtigungen', icon: Bell, items: ['E-Mail Benachrichtigungen', 'Push-Nachrichten', 'Wöchentlicher Report'] },
    { title: 'Darstellung', icon: Moon, items: ['Dunkelmodus', 'Kompakte Ansicht', 'Sprache (Deutsch)'] },
    { title: 'Datenschutz', icon: Eye, items: ['Profil-Sichtbarkeit', 'Daten-Export', 'Konto löschen'] },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Einstellungen</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(section => (
          <div key={section.title} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-900">
                <section.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
            </div>

            <div className="space-y-1">
              {section.items.map(item => (
                <button key={item} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 text-left">
                  <span>{item}</span>
                  <div className="w-8 h-4 bg-slate-200 rounded-full relative">
                    <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
