'use client';

import React, { useState } from 'react';
import { useManager } from '@/components/sammelkarten/SammelkartenManagerContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Calculator, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LogistikPage() {
  const { 
    approvedCards, boosterCount, setBoosterCount, cardsPerBooster, setCardsPerBooster,
    godpackCount, rarityQuotas, setRarityQuotas, variantQuotas, setVariantQuotas,
    printStats, setPrintStats, calculating, setCalculating 
  } = useManager();

  // Simulator State
  const [simulationPacks, setSimulationPacks] = useState(1000);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  const runLogisticsCalculation = () => {
    if (approvedCards.length === 0) return;
    setCalculating(true);
    setTimeout(() => {
      const totalCards = boosterCount * cardsPerBooster;
      const rarityCounts: Record<string, number> = {};
      let distributedCount = 0;
      const rarities = Object.keys(rarityQuotas);
      rarities.forEach((rarity, idx) => {
        if (idx === rarities.length - 1) { rarityCounts[rarity] = totalCards - distributedCount; } 
        else { const count = Math.floor((totalCards * (rarityQuotas as any)[rarity]) / 100); rarityCounts[rarity] = count; distributedCount += count; }
      });
      const teachersByRarity: Record<string, any[]> = { 
        common: approvedCards.filter(c => c.data.rarity === 'common'), 
        rare: approvedCards.filter(c => c.data.rarity === 'rare'), 
        epic: approvedCards.filter(c => c.data.rarity === 'epic'), 
        mythic: approvedCards.filter(c => c.data.rarity === 'mythic'), 
        legendary: approvedCards.filter(c => c.data.rarity === 'legendary'), 
        iconic: approvedCards.filter(c => c.data.rarity === 'iconic') 
      };
      const printPool: any[] = [];
      const distributionSummary: any[] = [];
      Object.entries(rarityCounts).forEach(([rarity, totalRarityCount]) => {
        const teachers = teachersByRarity[rarity];
        if (teachers.length === 0) return;
        const countPerTeacher = Math.floor(totalRarityCount / teachers.length);
        const remainder = totalRarityCount % teachers.length;
        teachers.forEach((t, tIdx) => {
          const teacherTotal = countPerTeacher + (tIdx < remainder ? 1 : 0);
          let distributedVariantCount = 0;
          const variants = Object.keys(variantQuotas);
          variants.forEach((variant, vIdx) => {
            let variantCount = vIdx === variants.length - 1 ? teacherTotal - distributedVariantCount : Math.round((teacherTotal * (variantQuotas as any)[variant]) / 100);
            distributedVariantCount += variantCount;
            if (variantCount > 0) {
              const lName = t.details?.lastName || (t.data?.name ? t.data.name.split(' ').pop() : '???');
              const fName = t.details?.firstName || (t.data?.name ? t.data.name.split(' ').slice(0, -1).join(' ') : '');
              for (let i = 0; i < variantCount; i++) { 
                printPool.push({ name: t.data?.name || '???', lastName: lName, firstName: fName, rarity, variant }); 
              }
              distributionSummary.push({ name: t.data?.name || '???', lastName: lName, firstName: fName, rarity, variant, count: variantCount });
            }
          });
        });
      });
      const shuffledPool = [...printPool].sort(() => Math.random() - 0.5);
      const boosters: any[][] = [];
      for (let i = 0; i < boosterCount; i++) { boosters.push(shuffledPool.slice(i * cardsPerBooster, (i + 1) * cardsPerBooster)); }
      if (godpackCount > 0 && boosters.length >= godpackCount) {
        const rareHighEnd = shuffledPool.filter(c => ['legendary', 'iconic', 'epic'].includes(c.rarity)).sort(() => Math.random() - 0.5);
        for (let g = 0; g < godpackCount; g++) {
          const godpackIndex = Math.floor(Math.random() * boosters.length);
          if (rareHighEnd.length >= cardsPerBooster) { boosters[godpackIndex] = rareHighEnd.splice(0, cardsPerBooster); }
        }
      }
      setPrintStats({ totalCards, rarityCounts, distribution: distributionSummary, boosters: boosters });
      setCalculating(false);
    }, 1000);
  };

  const runMonteCarloSimulation = () => {
    setCalculating(true);
    setSimulationResults(null);
    setTimeout(() => {
      const results = {
        totalPacks: simulationPacks,
        totalCards: simulationPacks * cardsPerBooster,
        rarityCounts: { common: 0, rare: 0, epic: 0, mythic: 0, legendary: 0, iconic: 0 },
        variantCounts: { normal: 0, selten: 0, holo: 0 },
        godpacks: 0
      };

      for (let i = 0; i < simulationPacks; i++) {
        const isGodpack = Math.random() < (godpackCount / 100);
        if (isGodpack) results.godpacks++;
        
        for (let s = 0; s < cardsPerBooster; s++) {
          // Rarity simulation
          const rRand = Math.random() * 100;
          let cumulativeR = 0;
          let selectedR = 'common';
          const rarityOrder = ['common', 'rare', 'epic', 'mythic', 'legendary', 'iconic'];
          for (const r of rarityOrder) {
            const quota = (rarityQuotas as any)[r] || 0;
            cumulativeR += quota;
            if (rRand <= cumulativeR) { selectedR = r; break; }
          }
          (results.rarityCounts as any)[selectedR]++;

          // Variant simulation
          const vRand = Math.random() * 100;
          let cumulativeV = 0;
          let selectedV = 'normal';
          const sortedVariants = (Object.entries(variantQuotas) as [string, number][]).sort((a, b) => a[1] - b[1]);
          for (const [v, q] of sortedVariants) {
            cumulativeV += q;
            if (vRand <= cumulativeV) { selectedV = v; break; }
          }
          (results.variantCounts as any)[selectedV]++;
        }
      }
      setSimulationResults(results);
      setCalculating(false);
    }, 800);
  };

  const downloadCSV = (type: 'print' | 'booster') => {
    if (!printStats) return;
    let content = type === 'print' ? "Nachname;Vorname;Seltenheit;Variante;Anzahl\n" : "Booster_ID;Position;Nachname;Vorname;Seltenheit;Variante\n";
    if (type === 'print') { 
      printStats.distribution.forEach((d: any) => { content += `${d.lastName};${d.firstName};${d.rarity};${d.variant};${d.count}\n`; }); 
    } else { 
      printStats.boosters.forEach((booster: any[], bIdx: number) => { 
        booster.forEach((card: any, cIdx: number) => { content += `${bIdx + 1};${cIdx + 1};${card.lastName};${card.firstName};${card.rarity};${card.variant}\n`; }); 
      }); 
    }
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", type === 'print' ? "druck_auftrag.csv" : "booster_manifest.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <Card className="p-6 rounded-md border border-neutral-200 bg-white space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 text-neutral-400">Booster Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-neutral-400">Packs</Label><Input type="number" value={boosterCount} onChange={(e)=>setBoosterCount(parseInt(e.target.value))} className="h-9 rounded-sm" /></div>
               <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-neutral-400">Cards/Pack</Label><Input type="number" value={cardsPerBooster} onChange={(e)=>setCardsPerBooster(parseInt(e.target.value))} className="h-9 rounded-sm" /></div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-sm border border-neutral-100 flex justify-between items-center"><span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Total Cards:</span><span className="text-xl font-black">{(boosterCount * cardsPerBooster).toLocaleString()}</span></div>
         </Card>
         <Card className="p-6 rounded-md border border-neutral-200 bg-white space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 text-neutral-400">Rarity Quotas (%)</h3>
            {Object.entries(rarityQuotas).map(([rarity, value]) => (
              <div key={rarity} className="flex items-center gap-4 text-[9px] font-bold uppercase">
                <span className="w-20 text-neutral-500">{rarity}</span>
                <Input type="number" value={value as number} onChange={(e)=>setRarityQuotas((prev: any)=>({...prev,[rarity]:parseInt(e.target.value)}))} className="w-16 h-7 rounded-sm text-center font-bold" />
                <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-900" style={{width:`${value}%`}} />
                </div>
              </div>
            ))}
         </Card>
         <Card className="p-6 rounded-md border border-neutral-200 bg-white space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 text-neutral-400">Variant Quotas (%)</h3>
            {Object.entries(variantQuotas).map(([variant, value]) => (
              <div key={variant} className="flex items-center gap-4 text-[9px] font-bold uppercase">
                <span className="w-20 text-neutral-500">{variant}</span>
                <Input type="number" value={value as number} onChange={(e)=>setVariantQuotas((prev: any)=>({...prev,[variant]:parseInt(e.target.value)}))} className="w-16 h-7 rounded-sm text-center font-bold" />
                <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{width:`${value}%`}} />
                </div>
              </div>
            ))}
         </Card>
      </div>

      <div className="bg-white p-8 rounded-md border border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div><h2 className="text-lg font-black uppercase tracking-tight">Kalkulation einleiten</h2><p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{approvedCards.length} Teacher in Production Pool</p></div>
          <Button onClick={runLogisticsCalculation} disabled={calculating || approvedCards.length === 0} className="h-12 px-8 rounded-sm uppercase font-black tracking-widest text-[10px] gap-2 bg-neutral-900 text-white">{calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />} Execute Engine</Button>
      </div>

      {printStats && (
         <div className="animate-in slide-in-from-bottom-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={()=>downloadCSV('print')} className="h-11 rounded-sm bg-neutral-900 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm hover:shadow-md transition-all"><Download className="w-4 h-4" /> Export Production CSV</Button>
              <Button onClick={()=>downloadCSV('booster')} variant="outline" className="h-11 rounded-sm border-neutral-200 font-black uppercase text-[10px] tracking-widest gap-2 text-neutral-600 hover:bg-neutral-50 transition-all"><FileText className="w-4 h-4" /> Export Pack Manifest</Button>
            </div>

            <Card className="rounded-md border border-neutral-200 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-neutral-50">
                  <TableRow>
                    <TableHead className="px-4 h-10 text-[9px] font-black uppercase">Nachname</TableHead>
                    <TableHead className="px-4 h-10 text-[9px] font-black uppercase">Vorname</TableHead>
                    <TableHead className="px-4 h-10 text-[9px] font-black uppercase">Seltenheit</TableHead>
                    <TableHead className="px-4 h-10 text-[9px] font-black uppercase">Variante</TableHead>
                    <TableHead className="px-4 h-10 text-right text-[9px] font-black uppercase pr-8">Menge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printStats.distribution.slice(0, 50).map((d:any, i:number)=>(
                    <TableRow key={i} className="hover:bg-neutral-50/50">
                      <TableCell className="px-4 py-2 text-[10px] font-bold uppercase">{d.lastName}</TableCell>
                      <TableCell className="px-4 py-2 text-[10px] uppercase text-neutral-500">{d.firstName || '-'}</TableCell>
                      <TableCell className="px-4 py-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-[2px] text-[8px] font-bold uppercase border",
                          d.rarity === 'common' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                          d.rarity === 'rare' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          d.rarity === 'epic' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          d.rarity === 'mythic' ? 'bg-red-50 text-red-600 border-red-200' :
                          d.rarity === 'legendary' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        )}>{d.rarity}</span>
                      </TableCell>
                      <TableCell className="px-4 py-2"><Badge variant="outline" className="text-[8px] h-4 rounded-sm border-neutral-300 font-bold uppercase">{d.variant}</Badge></TableCell>
                      <TableCell className="px-4 py-2 font-mono text-[10px] font-black text-right pr-8">{d.count}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {printStats.distribution.length > 50 && (
                <div className="p-4 text-center bg-neutral-50 border-t border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">... {printStats.distribution.length - 50} weitere Einträge (siehe CSV Export)</div>
              )}
            </Card>
         </div>
       )}

      {/* Probability Simulator Section */}
      <div className="pt-12 border-t border-neutral-100 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-neutral-800">
            <RefreshCw className="w-5 h-5 text-primary" /> Probability Simulator
          </h2>
          <p className="text-neutral-500 text-xs font-medium uppercase tracking-widest">Monte-Carlo-Simulation zur Validierung der konfigurierten Quoten.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6 rounded-md border border-neutral-200 bg-white space-y-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 text-neutral-400">Simulation Parameter</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-neutral-400">Anzahl Booster Packs</Label>
                <div className="flex gap-4">
                  <Input type="number" value={simulationPacks} onChange={(e)=>setSimulationPacks(parseInt(e.target.value) || 0)} className="h-10 rounded-sm font-bold" />
                  <div className="flex gap-1">
                    {[100, 1000, 5000].map(v => (
                      <Button key={v} variant="outline" size="sm" onClick={() => setSimulationPacks(v)} className="h-10 px-3 text-[10px] font-bold">{v}</Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={runMonteCarloSimulation} 
                  disabled={calculating || simulationPacks <= 0} 
                  className="w-full h-12 rounded-sm uppercase font-black tracking-widest text-[10px] gap-2 bg-neutral-900 text-white"
                >
                  {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Simulation Starten
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-md border border-neutral-200 bg-neutral-900 text-white space-y-6 shadow-xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-white/10 pb-2 text-neutral-500">
              Aktuelle Quoten (Basis)
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">Rarity Distribution</p>
                <div className="space-y-1">
                  {(Object.entries(rarityQuotas) as [string, any][]).map(([r, q]) => (
                    <div key={r} className="flex justify-between text-[10px] font-mono">
                      <span className="text-neutral-400 uppercase">{r}:</span>
                      <span className="font-bold">{q}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">Variant Quotas</p>
                <div className="space-y-1">
                  {(Object.entries(variantQuotas) as [string, any][]).map(([v, q]) => (
                    <div key={v} className="flex justify-between text-[10px] font-mono">
                      <span className="text-neutral-400 uppercase">{v}:</span>
                      <span className="font-bold">{q}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {simulationResults && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-neutral-200 shadow-sm bg-white">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-4">Total Results</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Packs:</span>
                    <span className="text-2xl font-black">{simulationResults.totalPacks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Karten:</span>
                    <span className="text-2xl font-black text-primary">{simulationResults.totalCards.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end border-t pt-2">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Godpacks:</span>
                    <span className="text-lg font-black text-amber-500">{simulationResults.godpacks} <span className="text-[9px] text-neutral-400">({((simulationResults.godpacks / simulationResults.totalPacks) * 100).toFixed(2)}%)</span></span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-neutral-200 shadow-sm bg-white md:col-span-2">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-4">Variant Distribution</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {Object.entries(simulationResults.variantCounts).map(([variant, count]: [string, any]) => {
                    const percentage = (count / simulationResults.totalCards) * 100;
                    const target = (variantQuotas as any)[variant] || 0;
                    const diff = percentage - target;
                    
                    return (
                      <div key={variant} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-tighter">{variant}</span>
                          <span className={cn(
                            "text-[9px] font-mono px-1.5 py-0.5 rounded-sm",
                            Math.abs(diff) < 0.1 ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                          )}>
                            {percentage.toFixed(2)}%
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              variant === 'holo' ? "bg-blue-500" : variant === 'selten' ? "bg-amber-500" : "bg-neutral-400"
                            )}
                            style={{ width: `${Math.min(100, (percentage / (target || 1)) * 50)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-neutral-400">Count: {count.toLocaleString()}</span>
                          <span className="text-neutral-300">Target: {target}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <Card className="p-6 border-neutral-200 shadow-sm bg-white">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-6">Rarity Probability Check</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                {Object.entries(simulationResults.rarityCounts).map(([rarity, count]: [string, any]) => {
                  const percentage = (count / simulationResults.totalCards) * 100;
                  const target = (rarityQuotas as any)[rarity] || 0;
                  
                  return (
                    <div key={rarity} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <span className={cn(
                        "px-2 py-0.5 rounded-[2px] text-[8px] font-bold uppercase border",
                        rarity === 'common' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                        rarity === 'rare' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        rarity === 'epic' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                        rarity === 'mythic' ? 'bg-red-50 text-red-600 border-red-200' :
                        rarity === 'legendary' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      )}>
                        {rarity}
                      </span>
                      <span className="text-xl font-black">{percentage.toFixed(2)}%</span>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">Target: {target}%</span>
                        <span className="text-[8px] font-mono text-neutral-300">{count.toLocaleString()} Cards</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
