'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft, FileText, Sparkles, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getMainBaseUrl } from '@/lib/dashboard-url';

export default function PrintableFormPage() {
  const registrationUrl = typeof window !== 'undefined' 
    ? `${getMainBaseUrl()}/lehrer-anmeldung`
    : 'https://abi-planer-27.de/lehrer-anmeldung';

  return (
    <div className="min-h-screen bg-neutral-50 pb-12 print:bg-white print:pb-0">
      {/* Control Bar - Hidden when printing */}
      <div className="bg-white border-b border-neutral-200 p-4 sticky top-0 z-50 print:hidden shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/sammelkarten-manager/queue">
            <Button variant="ghost" className="gap-2 text-neutral-600 hover:text-black transition-colors print-hidden">
              <ArrowLeft className="w-4 h-4" /> Zurück zum Manager
            </Button>
          </Link>
          <div className="flex gap-3">
            <Button 
              className="gap-2 bg-black text-white hover:bg-neutral-800"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Formular Drucken (A4)
            </Button>
          </div>
        </div>
      </div>

      {/* A4 Form Container */}
      <div className="max-w-[210mm] mx-auto mt-8 mb-12 print:mt-0 print:mb-0">
        <div 
          className="bg-white aspect-[210/297] shadow-[0_0_40px_rgba(0,0,0,0.05)] p-[15mm] flex flex-col text-black relative overflow-hidden print:shadow-none print:p-[12mm]"
          id="form-content"
        >
          {/* Header Section */}
          <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-black text-white px-2 py-0.5 text-sm font-black uppercase tracking-tighter">ABI PLANER</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Trading Card Edition</div>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                ANMELDE-FORMULAR
              </h1>
              <p className="text-sm font-bold italic text-neutral-600">Offizieller Beitrag zur Lehrer-Sammelkartenedition 2027</p>
            </div>
            
            <div className="text-right flex gap-4 items-center">
               <div className="text-right">
                  <p className="text-[9px] font-black uppercase leading-tight mb-1">Alternativ:<br/>Digital ausfüllen</p>
                  <p className="text-[7px] font-mono text-neutral-400">{registrationUrl.replace('https://', '').replace('http://', '')}</p>
               </div>
               <div className="bg-white p-1 border-2 border-black">
                 <QRCodeSVG value={registrationUrl} size={65} level="M" />
               </div>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed mb-8 max-w-2xl">
            Liebe Lehrerinnen und Lehrer, werden Sie Teil unserer exklusiven Sammelkarten-Kollektion! 
            Bitte füllen Sie dieses Formular leserlich in <b>Druckbuchstaben</b> aus. Diese Daten bilden die 
            Basis für Ihre persönliche Karte im ABI-TCG.
          </p>

          <div className="flex-1 space-y-8">
            {/* Section 1: Personal Data */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] bg-neutral-100 px-3 py-1 inline-block">01. Stammdaten</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1 border-b border-neutral-300 pb-1">
                  <label className="text-[9px] font-black uppercase text-neutral-500 block">Anrede / Titel</label>
                  <div className="h-6"></div>
                </div>
                <div className="space-y-1 border-b border-neutral-300 pb-1">
                  <label className="text-[9px] font-black uppercase text-neutral-500 block">Unterrichtsfächer</label>
                  <div className="h-6"></div>
                </div>
                <div className="space-y-1 border-b border-neutral-300 pb-1">
                  <label className="text-[9px] font-black uppercase text-neutral-500 block">Vorname</label>
                  <div className="h-6"></div>
                </div>
                <div className="space-y-1 border-b border-neutral-300 pb-1">
                  <label className="text-[9px] font-black uppercase text-neutral-500 block">Nachname</label>
                  <div className="h-6"></div>
                </div>
              </div>
            </div>

            {/* Section 2: Card Content */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] bg-neutral-100 px-3 py-1 inline-block">02. Karten-Inhalt</h2>
              <div className="space-y-6">
                <div className="space-y-1 border-b border-neutral-300 pb-1">
                  <label className="text-[9px] font-black uppercase text-neutral-500 block">Ihr Zitat / Wahlspruch / Klassiker (Was Sie oft sagen)</label>
                  <div className="h-10"></div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-1 border-b border-neutral-300 pb-1">
                    <label className="text-[9px] font-black uppercase text-neutral-500 block">Pünktlichkeit (z.B. "Auf die Sekunde" oder "Akademische Viertelstunde")</label>
                    <div className="h-6"></div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-neutral-500 block">Schwierigkeitsgrad der Klausuren (Bitte ankreuzen)</label>
                    <div className="flex justify-between px-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <div key={n} className="flex flex-col items-center gap-1">
                          <div className="w-4 h-4 border border-black rounded-sm"></div>
                          <span className="text-[8px] font-bold">{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 border-b border-neutral-300 pb-1">
                  <label className="text-[9px] font-black uppercase text-neutral-500 block">Ein "Fun Fact" über Sie (Was Ihre Schüler sicher noch nicht wissen)</label>
                  <div className="h-6"></div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-1 border-b border-neutral-300 pb-1">
                    <label className="text-[9px] font-black uppercase text-neutral-500 block">Ihr unbeliebtestes Fach während Ihrer eigenen Schulzeit</label>
                    <div className="h-6"></div>
                  </div>
                  <div className="space-y-1 border-b border-neutral-300 pb-1">
                    <label className="text-[9px] font-black uppercase text-neutral-500 block">Lieblings-Freizeitbeschäftigung (außerhalb der Korrekturen)</label>
                    <div className="h-6"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Section */}
            <div className="pt-4">
               <div className="space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] bg-neutral-100 px-3 py-1 inline-block">03. Das Foto (Digital erforderlich)</h2>
                  <p className="text-[10px] leading-relaxed text-neutral-600">
                    Für eine hochwertige Druckqualität der Sammelkarten muss Ihr Portraitfoto <b className="text-black">digital</b> vorliegen. 
                    Ein Aufkleben von physischen Fotos auf dieses Formular ist daher nicht möglich. Bitte wählen Sie einen der folgenden Wege:
                  </p>
                  <ul className="text-[10px] leading-relaxed text-neutral-600 space-y-2 list-disc pl-4">
                    <li>Senden Sie ein digitales Foto (Dateiformat: JPG, PNG oder WebP) direkt an: <b className="text-black text-xs">Priesnitz.maximilian@hgr-web.lernsax.de</b></li>
                    <li>Alternativ vereinbaren Sie per E-Mail einen kurzen <b className="text-black">Fototermin</b> im Schulhaus mit dem ABI-Team, damit wir ein professionelles Foto für Ihre Karte erstellen können.</li>
                  </ul>
                  
                  <div className="pt-10 grid grid-cols-2 gap-16 max-w-2xl">
                    <div className="border-t border-black pt-1">
                      <p className="text-[8px] font-black uppercase tracking-tighter">Ort, Datum</p>
                    </div>
                    <div className="border-t border-black pt-1">
                      <p className="text-[8px] font-black uppercase tracking-tighter">Unterschrift (Einverständnis zur Nutzung der Daten & des Fotos)</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-8 pt-4 border-t border-neutral-100 flex justify-between items-end opacity-50">
             <div className="text-[8px] font-bold text-neutral-400">
                &copy; 2027 ABI PLANER - TRADING CARD GENERATOR V1.34
             </div>
             <div className="flex items-center gap-1">
               <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 italic">Authorized Document</span>
               <div className="w-2 h-2 bg-black rounded-full"></div>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @font-face {
          font-family: 'Inter';
          font-style: normal;
          font-weight: 100 900;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2) format('woff2');
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          /* Ganze Seite unsichtbar machen */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            visibility: hidden;
          }

          /* Nur das Formular und dessen Inhalt wieder sichtbar machen */
          #form-content, #form-content * {
            visibility: visible;
          }

          /* Das Formular absolut positionieren, damit es die Seite füllt und keine Ränder entstehen */
          #form-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm !important;
            margin: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 1;
          }

          /* Alles andere restlos ausblenden */
          .print-hidden, .bg-white.border-b, header, nav, aside {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
