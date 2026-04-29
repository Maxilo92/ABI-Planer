'use client'

import React, { useEffect } from 'react'
import { StaffGuard } from '@/components/auth/StaffGuard'
import { SammelkartenManagerProvider, useManager } from '@/components/sammelkarten/SammelkartenManagerContext'
import { Package, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrintableTeacherCard } from '../../../CardMockUp/PrintableTeacherCard'

export default function SammelkartenManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StaffGuard>
      <SammelkartenManagerProvider>
        <SammelkartenManagerContent>
          {children}
        </SammelkartenManagerContent>
      </SammelkartenManagerProvider>
    </StaffGuard>
  )
}

function SammelkartenManagerContent({ children }: { children: React.ReactNode }) {
  const { 
    singlePrintCardId, 
    setSinglePrintCardId, 
    approvedCards,
    printQueue,
    setPrintQueue,
    currentPrint,
    setCurrentPrint
  } = useManager();
  
  const singlePrintCard = approvedCards.find(c => c.dbId === (currentPrint?.id || singlePrintCardId));
  const activePrintVariant = currentPrint?.variant || singlePrintCard?.data?.variant || 'normal';

  // Process the queue
  useEffect(() => {
    if (!currentPrint && printQueue.length > 0) {
      const next = printQueue[0];
      setPrintQueue(printQueue.slice(1));
      setCurrentPrint(next);
    }
  }, [currentPrint, printQueue, setPrintQueue, setCurrentPrint]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setCurrentPrint(null);
      setSinglePrintCardId(null);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [setCurrentPrint, setSinglePrintCardId]);

  useEffect(() => {
    if ((singlePrintCardId || currentPrint) && singlePrintCard) {
      // Set temporary title for PDF filename
      const originalTitle = document.title;
      const personName = `${singlePrintCard.details?.lastName || 'Karte'}`.replace(/\s+/g, '_');
      const rarity = (singlePrintCard.data?.rarity || 'common').replace(/\s+/g, '_');
      const variant = activePrintVariant.replace(/\s+/g, '_');
      
      document.title = `${personName}_${rarity}_${variant}`;

      // Wait for render
      const timer = setTimeout(() => {
        window.print();
        if (!currentPrint) {
          setSinglePrintCardId(null);
        }
        document.title = originalTitle;
      }, 700);
      return () => {
        clearTimeout(timer);
        document.title = originalTitle;
      };
    }
  }, [singlePrintCardId, currentPrint, singlePrintCard, activePrintVariant, setSinglePrintCardId]);

  return (
    <div className="w-full h-full">
      <div className="max-w-[1920px] mx-auto space-y-6 animate-in fade-in duration-500 py-6 px-4 print:hidden">
        {/* Common Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-neutral-800">
              <Package className="w-5 h-5 text-primary" /> Sammelkarten Manager
            </h1>
            <p className="text-neutral-500 text-xs font-medium">Zentrale Verwaltung für Produktions-Design und Druck-Logistik.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()} className="h-8 rounded-md gap-2 border-neutral-200 font-bold uppercase tracking-widest text-[9px] bg-white">
              <Printer className="w-3.5 h-3.5" /> PDF Export
            </Button>
          </div>
        </div>
        
        {children}
      </div>

      {/* Single Card Print View */}
      {singlePrintCard && (
        <div className="hidden print:flex fixed inset-0 bg-white z-[9999] items-center justify-center single-card-print-view">
          <div className="flex flex-row items-center justify-center gap-[4mm] single-card-print-scaling-wrapper">
            <PrintableTeacherCard 
              data={{ ...singlePrintCard.data, variant: activePrintVariant }} 
              details={singlePrintCard.details} 
              imageSettings={singlePrintCard.imageSettings} 
            />
            <PrintableTeacherCard 
              data={{ ...singlePrintCard.data, variant: activePrintVariant }} 
              details={singlePrintCard.details} 
              imageSettings={singlePrintCard.imageSettings} 
              isFlipped={true}
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: ${singlePrintCardId || currentPrint ? 'A4 landscape' : 'A4 portrait'}; margin: 0mm !important; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; width: ${singlePrintCardId || currentPrint ? '297mm' : '210mm'} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          header, footer, nav, [role="tablist"], button, .print-hidden { display: none !important; }
          
          .print-page-container { 
            display: ${singlePrintCardId || currentPrint ? 'none !important' : 'flex !important'};
            page-break-after: always !important; break-after: page !important; height: 297mm !important; width: 210mm !important; align-items: flex-start; justify-content: center; padding-top: 10mm !important; background: white !important; 
          }
          .print-gallery-grid { display: grid !important; grid-template-columns: repeat(3, 63mm) !important; grid-auto-rows: 88mm !important; gap: 2mm !important; justify-content: center !important; }
          .card-container { transform: none !important; break-inside: avoid !important; page-break-inside: avoid !important; }
          
          .single-card-print-view {
            display: ${singlePrintCardId || currentPrint ? 'flex !important' : 'none !important'};
          }

          .single-card-print-scaling-wrapper {
            transform: scale(2.2) !important;
          }

          .single-card-print-view [data-slot="back-side"] {
            transform: none !important;
          }
        }
      `}} />
    </div>
  )
}
