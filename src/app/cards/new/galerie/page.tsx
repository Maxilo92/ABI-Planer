'use client';

import React from 'react';
import { PrintableTeacherCard } from '../../../../../CardMockUp/PrintableTeacherCard';
import { CardData } from '@/types/cards';
import { Button } from '@/components/ui/button';
import { Printer, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { ProtectedSystemGate } from '@/components/ui/ProtectedSystemGate';
import { Skeleton } from '@/components/ui/skeleton';
// @ts-ignore
import TeacherImage from '../../../../../CardMockUp/teacher_pictures/business-man-illustration-ai-generative-png.webp';

// Mock-Daten für die Lehrer
const MOCK_TEACHERS = [
  {
    data: {
      id: 'teacher-001',
      cardNumber: '001',
      name: 'Herr Müller',
      rarity: 'common',
      variant: 'normal',
      color: '#94a3b8',
      imageUrl: typeof TeacherImage === 'string' ? TeacherImage : TeacherImage.src,
    } as CardData,
    details: {
      title: 'Herr',
      firstName: 'Thomas',
      lastName: 'Müller',
      subjects: ['Mathematik', 'Physik'],
      quote: 'Das ist trivial!',
      stats: {
        punctuality: 'Auf die Sekunde',
        difficulty: 4,
        funFact: 'Trägt immer zwei verschiedene Socken.',
        unpopularSubject: 'Latein',
        leisure: 'Schach spielen',
      },
    },
  },
  {
    data: {
      id: 'teacher-002',
      cardNumber: '002',
      name: 'Frau Schmidt',
      rarity: 'rare',
      variant: 'holo',
      color: '#10b981',
      imageUrl: typeof TeacherImage === 'string' ? TeacherImage : TeacherImage.src,
    } as CardData,
    details: {
      title: 'Frau',
      firstName: 'Sabine',
      lastName: 'Schmidt',
      subjects: ['Deutsch', 'Englisch'],
      quote: 'Lies den Text noch einmal genau.',
      stats: {
        punctuality: 'Meistens pünktlich',
        difficulty: 6,
        funFact: 'Hat 5 Katzen.',
        unpopularSubject: 'Mathe',
        leisure: 'Krimi-Dinner',
      },
    },
  },
  {
    data: {
      id: 'teacher-003',
      cardNumber: '003',
      name: 'Herr Weber',
      rarity: 'epic',
      variant: 'shiny',
      color: '#a855f7',
      imageUrl: typeof TeacherImage === 'string' ? TeacherImage : TeacherImage.src,
    } as CardData,
    details: {
      title: 'Herr',
      firstName: 'Andreas',
      lastName: 'Weber',
      subjects: ['Sport', 'Biologie'],
      quote: 'Noch eine Runde um den Platz!',
      stats: {
        punctuality: 'Immer zu früh',
        difficulty: 3,
        funFact: 'Kann einen Marathon rückwärts laufen.',
        unpopularSubject: 'Chemie',
        leisure: 'Extremsport',
      },
    },
  },
  {
    data: {
      id: 'teacher-004',
      cardNumber: '004',
      name: 'Frau Fischer',
      rarity: 'legendary',
      variant: 'holo',
      color: '#f59e0b',
      imageUrl: typeof TeacherImage === 'string' ? TeacherImage : TeacherImage.src,
    } as CardData,
    details: {
      title: 'Frau',
      firstName: 'Elena',
      lastName: 'Fischer',
      subjects: ['Kunst', 'Geschichte'],
      quote: 'Kreativität kennt keine Grenzen.',
      stats: {
        punctuality: 'Akademische Viertelstunde',
        difficulty: 5,
        funFact: 'Besitzt eine Sammlung antiker Schreibmaschinen.',
        unpopularSubject: 'Physik',
        leisure: 'Malerei',
      },
    },
  },
  {
    data: {
      id: 'teacher-005',
      cardNumber: '005',
      name: 'Herr Meyer',
      rarity: 'iconic',
      variant: 'black_shiny_holo',
      color: '#000000',
      imageUrl: typeof TeacherImage === 'string' ? TeacherImage : TeacherImage.src,
    } as CardData,
    details: {
      title: 'Herr',
      firstName: 'Wolfgang',
      lastName: 'Meyer',
      subjects: ['Informatik', 'Wirtschaft'],
      quote: 'Habt ihr das Backup gemacht?',
      stats: {
        punctuality: 'Digital synchronisiert',
        difficulty: 9,
        funFact: 'Hat das Internet gelöscht. Zweimal.',
        unpopularSubject: 'Sport',
        leisure: 'Programmieren',
      },
    },
  },
];

export default function NewCardsGaleriePage() {
  const { profile, loading: authLoading } = useAuth();
  const [selectedTeacherId, setSelectedTeacherId] = React.useState(MOCK_TEACHERS[0].data.id);

  const handlePrint = () => {
    window.print();
  };

  const RARITIES: Array<{ id: string, label: string }> = [
    { id: 'common', label: 'Common' },
    { id: 'rare', label: 'Rare' },
    { id: 'epic', label: 'Epic' },
    { id: 'mythic', label: 'Mythic' },
    { id: 'legendary', label: 'Legendary' },
    { id: 'iconic', label: 'Iconic' }
  ];

  const VERSIONS: Array<{ id: 'normal' | 'selten' | 'holo', label: string }> = [
    { id: 'normal', label: 'Standard' },
    { id: 'selten', label: 'Selten' },
    { id: 'holo', label: 'Holo' }
  ];

  const showcaseTeacher = MOCK_TEACHERS.find(t => t.data.id === selectedTeacherId) || MOCK_TEACHERS[0];

  // Access Control: Nur Admins und Planer
  const isAuthorized = profile && ['admin', 'admin_main', 'admin_co', 'planner'].includes(profile.role);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 flex flex-col gap-12">
        <div className="max-w-[1600px] mx-auto w-full space-y-4">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 md:grid-cols-[160px_1fr] gap-12">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-8">
            <Skeleton className="h-[400px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <ProtectedSystemGate 
            title="Exklusiver Vorabzugang"
            description="Diese Galerie befindet sich aktuell in der Entwicklungsphase und ist momentan nur für Administratoren und Planer zugänglich. Bitte gedulde dich noch ein wenig."
            icon={<ShieldAlert className="h-10 w-10 text-primary" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      {/* Header - Hidden on Print */}
      <header className="max-w-[1600px] mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 print:hidden">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black uppercase tracking-widest border border-primary/20">
                Interner Vorabzugang
              </span>
            </div>
            <h1 className="text-5xl font-black text-neutral-900 tracking-tighter uppercase leading-none">
              Design Matrix
            </h1>
            <p className="text-neutral-400 mt-3 font-medium uppercase tracking-widest text-xs">
              {showcaseTeacher.details.title} {showcaseTeacher.details.lastName} • Responsive Review
            </p>
          </div>
          
          {/* Teacher Selector */}
          <div className="flex flex-wrap gap-2">
            {MOCK_TEACHERS.map((t) => (
              <button
                key={t.data.id}
                onClick={() => setSelectedTeacherId(t.data.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                  selectedTeacherId === t.data.id
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-md scale-105"
                    : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                )}
              >
                {t.details.lastName}
              </button>
            ))}
          </div>
        </div>
        <Button 
          onClick={handlePrint}
          className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 px-8 py-6 rounded-xl font-bold uppercase tracking-widest text-xs transition-transform active:scale-95 w-full md:w-auto shadow-lg"
        >
          <Printer className="w-5 h-5" />
          PDF Export / Drucken
        </Button>
      </header>

      {/* Matrix Grid - Wrapping instead of scrolling */}
      <main className="max-w-[1600px] mx-auto pb-24">
        <div className="flex flex-col gap-16 md:gap-24">
          {/* Header Row for Variants - Hidden on Mobile */}
          <div className="hidden lg:grid grid-cols-[160px_1fr_1fr_1fr] gap-8 items-center print:hidden">
            <div />
            {VERSIONS.map(v => (
              <div key={v.id} className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300">
                  {v.label}
                </span>
              </div>
            ))}
          </div>

          {/* Rows for Rarities */}
          <div className="space-y-16 md:space-y-24">
            {RARITIES.map((r) => (
              <div key={r.id} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
                {/* Rarity Label (Side) */}
                <div className="flex flex-col items-center lg:items-end lg:pr-8 lg:border-r border-neutral-200 lg:w-[160px] lg:mt-8 shrink-0 print:hidden">
                  <span className="text-xl lg:text-sm font-black uppercase tracking-tighter text-neutral-900 leading-none text-center lg:text-right">
                    {r.label}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                    Rarity
                  </span>
                </div>

                {/* Cards Container - Flex wrap for responsive behavior */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-8 md:gap-12 flex-1">
                  {VERSIONS.map((v) => {
                    const dynamicData: CardData = {
                      ...showcaseTeacher.data,
                      rarity: r.id as any,
                      variant: v.id as any,
                    };

                    return (
                      <div key={`${r.id}-${v.id}`} className="flex flex-col items-center gap-4 group">
                        <div className="scale-[0.85] sm:scale-100 transition-transform origin-top lg:origin-center">
                          <PrintableTeacherCard 
                            data={dynamicData} 
                            details={showcaseTeacher.details} 
                          />
                        </div>
                        <div className="flex flex-col items-center print:hidden">
                          <span className="text-[10px] lg:text-[8px] font-black uppercase tracking-widest text-neutral-300 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            {r.label} / {v.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          body {
            background: white !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, footer, .print-hidden {
            display: none !important;
          }
          main {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .space-y-16 {
            display: block !important;
          }
          /* Matrix layout for print */
          .flex-row {
            display: flex !important;
            flex-direction: row !important;
            margin-bottom: 10mm;
          }
          .flex-wrap {
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 10mm !important;
          }
          .card-container {
            break-inside: avoid;
            page-break-inside: avoid;
            transform: scale(1) !important;
          }
          .min-w-[1000px] {
            min-width: 0 !important;
          }
        }
      `}} />

      <footer className="max-w-7xl mx-auto mt-32 mb-16 pt-8 border-t border-neutral-200 text-center text-neutral-300 text-[10px] font-bold uppercase tracking-[0.4em] print:hidden">
        ABI Planer TCG • Design Verification System • v1.34.13
      </footer>
    </div>
  );
}
