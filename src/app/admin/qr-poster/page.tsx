'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft, Download, Sparkles, Smartphone, Upload, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function QRPosterPage() {
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const registrationUrl = `${baseUrl}/lehrer-anmeldung`;

  return (
    <div className="min-h-screen bg-neutral-100 pb-12 print:bg-white print:pb-0">
      {/* Control Bar - Hidden when printing */}
      <div className="bg-white border-b border-neutral-200 p-4 sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/sammelkarten-manager/queue">
            <Button variant="ghost" className="gap-2 text-neutral-600 hover:text-black transition-colors">
              <ArrowLeft className="w-4 h-4" /> Zurück zur Queue
            </Button>
          </Link>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2 border-neutral-200"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Jetzt Drucken (Strg + P)
            </Button>
          </div>
        </div>
      </div>

      {/* Poster Container */}
      <div className="max-w-[210mm] mx-auto mt-12 mb-12 print:mt-0 print:mb-0">
        <div 
          className="bg-white aspect-[210/297] shadow-[0_0_50px_rgba(0,0,0,0.1)] p-[20mm] flex flex-col items-center justify-between text-black relative overflow-hidden print:shadow-none print:p-[15mm]"
          id="poster-content"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-6 bg-black"></div>
          <div className="absolute bottom-0 left-0 w-full h-6 bg-black"></div>
          
          <div className="absolute top-12 right-12 opacity-10 rotate-12">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="absolute bottom-40 left-12 opacity-10 -rotate-12">
            <Sparkles className="w-24 h-24" />
          </div>
          
          {/* Header */}
          <div className="text-center space-y-4 w-full pt-12 relative z-10">
            <div className="flex justify-center mb-8">
              <span className="bg-black text-white px-8 py-3 text-3xl font-black uppercase tracking-[0.3em] transform -rotate-1 shadow-2xl">
                ABI PLANER
              </span>
            </div>
            
            <h1 className="text-[7rem] font-black uppercase tracking-tighter leading-[0.75] text-balance mb-6">
              Werde <br/>
              <span className="text-outline-black">Teil</span> der <br/>
              Legende!
            </h1>
            
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-black/20"></div>
              <p className="text-2xl font-bold uppercase tracking-[0.4em] text-neutral-400">Lehrer-Sammelkarten 2026</p>
              <div className="h-px w-12 bg-black/20"></div>
            </div>
          </div>

          {/* Main Content / QR Code */}
          <div className="flex flex-col items-center gap-12 py-10 relative z-10">
            <div className="relative group">
              {/* Animated-like glow (static for print but nice for preview) */}
              <div className="absolute inset-0 bg-black blur-2xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
              
              <div className="relative p-8 border-[8px] border-black rounded-[3rem] bg-white shadow-2xl">
                <div className="bg-white p-2">
                  <QRCodeSVG value={registrationUrl} size={320} level="H" />
                </div>
                
                {/* Corner Accents */}
                <div className="absolute -top-4 -left-4 w-14 h-14 border-t-[8px] border-l-[8px] border-black rounded-tl-2xl"></div>
                <div className="absolute -top-4 -right-4 w-14 h-14 border-t-[8px] border-r-[8px] border-black rounded-tr-2xl"></div>
                <div className="absolute -bottom-4 -left-4 w-14 h-14 border-b-[8px] border-l-[8px] border-black rounded-bl-2xl"></div>
                <div className="absolute -bottom-4 -right-4 w-14 h-14 border-b-[8px] border-r-[8px] border-black rounded-br-2xl"></div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-3xl font-black uppercase tracking-[0.2em]">Scanne den Code</p>
              <p className="text-xl font-medium text-neutral-600 max-w-md">Sende uns die besten Sprüche, Infos & Bilder deiner Lehrer direkt vom Handy aus.</p>
            </div>
          </div>

          {/* Footer / Info */}
          <div className="w-full space-y-10 pb-12 relative z-10">
            <div className="grid grid-cols-3 gap-12 text-center border-y-[3px] border-black py-10">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="w-6 h-6" />
                </div>
                <p className="font-black uppercase text-sm tracking-widest">1. Scannen</p>
                <p className="text-[11px] font-bold leading-tight text-neutral-500 uppercase tracking-tighter">Code mit der <br/>Kamera erfassen</p>
              </div>
              <div className="space-y-3 border-x-[3px] border-black">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <Edit3 className="w-6 h-6" />
                </div>
                <p className="font-black uppercase text-sm tracking-widest">2. Ausfüllen</p>
                <p className="text-[11px] font-bold leading-tight text-neutral-500 uppercase tracking-tighter">Fächer & Zitate <br/>bequem eingeben</p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-black uppercase text-sm tracking-widest">3. Senden</p>
                <p className="text-[11px] font-bold leading-tight text-neutral-500 uppercase tracking-tighter">Portraitfoto <br/>direkt hochladen</p>
              </div>
            </div>

            <div className="flex justify-between items-end px-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-neutral-300 tracking-[0.2em]">Direkt-Link:</p>
                <p className="text-lg font-mono font-bold tracking-tighter bg-neutral-100 px-3 py-1 rounded-sm border border-neutral-200">{registrationUrl.replace('https://', '')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase italic leading-none text-neutral-400 mb-1">Official Project</p>
                <p className="text-3xl font-black uppercase tracking-tighter leading-none">ABI Planer 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white;
            padding: 0;
          }
          .print-hidden {
            display: none !important;
          }
        }
        .text-outline-black {
          -webkit-text-stroke: 3px black;
          color: white;
        }
      `}</style>
    </div>
  );
}
