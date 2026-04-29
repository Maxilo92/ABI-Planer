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

  const isPrintingRef = React.useRef(false);
  
  const singlePrintCard = approvedCards.find(c => c.dbId === (currentPrint?.id || singlePrintCardId));
  const activePrintVariant = currentPrint?.variant || singlePrintCard?.data?.variant || 'normal';

  // Process the queue
  useEffect(() => {
    if (!currentPrint && printQueue.length > 0) {
      const next = printQueue[0];
      setPrintQueue(printQueue.slice(1));
      setCurrentPrint(next);
      isPrintingRef.current = false;
    }
  }, [currentPrint, printQueue, setPrintQueue, setCurrentPrint]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setCurrentPrint(null);
      setSinglePrintCardId(null);
      isPrintingRef.current = false;
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [setCurrentPrint, setSinglePrintCardId]);

  useEffect(() => {
    if ((singlePrintCardId || currentPrint) && singlePrintCard && !isPrintingRef.current) {
      isPrintingRef.current = true;
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
      }, 800);
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
        <div className="hidden print:flex fixed inset-0 bg-white z-[99999] overflow-hidden single-card-print-view items-center justify-center">
          <div 
            className="flex flex-row items-center justify-center gap-[6mm] single-card-print-scaling-wrapper"
            style={{
              transform: currentPrint?.size === 'original' ? 'scale(1)' : 'scale(2.05)',
              transformOrigin: 'center center'
            }}
          >
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
          @page { 
            size: ${singlePrintCardId || currentPrint ? 'A4 landscape' : 'A4 portrait'}; 
            margin: 0 !important; 
          }
          
          html, body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            height: 100vh !important;
            width: 100vw !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }

          /* Hide all application content */
          body {
            visibility: hidden !important;
          }

          /* Show only the single card print view and its contents */
          .single-card-print-view {
            visibility: visible !important;
            display: flex !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            z-index: 9999999 !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .single-card-print-view * {
            visibility: visible !important;
          }

          .single-card-print-view [data-slot="back-side"] {
            transform: none !important;
          }
        }
      `}} />
    </div>
  )
}
