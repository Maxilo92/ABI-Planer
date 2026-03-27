import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Info, Sparkles, Star, Zap, Trophy } from 'lucide-react';
import { CardVariant, TeacherRarity } from '@/types/database';

interface ProbabilityInfoProps {
  rarityWeights: Array<{ [key in TeacherRarity]: number }>;
  variantProbabilities: {
    shiny: number;
    holo: number;
    black_shiny_holo: number;
  };
  godpackChance: number;
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-slate-500';
    case 'rare': return 'bg-emerald-500';
    case 'epic': return 'bg-purple-600';
    case 'mythic': return 'bg-red-600';
    case 'legendary': return 'bg-amber-500 text-black';
    default: return 'bg-slate-500';
  }
};

const formatPercent = (val: number) => {
  return (val * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + '%';
};

export const ProbabilityInfo: React.FC<ProbabilityInfoProps> = ({ 
  rarityWeights, 
  variantProbabilities,
  godpackChance
}) => {
  // Durchschnittliche Wahrscheinlichkeiten über alle 3 Slots berechnen
  const avgProbabilities: { [key in TeacherRarity]: number } = {
    common: 0,
    rare: 0,
    epic: 0,
    mythic: 0,
    legendary: 0
  };

  rarityWeights.forEach(slot => {
    Object.keys(slot).forEach(key => {
      avgProbabilities[key as TeacherRarity] += slot[key as TeacherRarity] / 3;
    });
  });

  return (
    <div className="space-y-6 p-6 bg-card border border-border rounded-2xl shadow-xl">
      <div className="flex items-center gap-3 text-foreground font-bold text-lg border-b border-border pb-4">
        <div className="p-2 bg-info/20 rounded-lg">
          <Info className="w-5 h-5 text-info" />
        </div>
        <div className="flex flex-col">
          <span>Wahrscheinlichkeiten & Quoten</span>
          <span className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest">Terminologie & Transparenz</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Seltenheiten */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold flex items-center justify-between">
            <span>Seltenheit pro Karte</span>
            <span className="text-[9px] font-normal opacity-70">(3 Karten pro Pack)</span>
          </p>
          {(Object.entries(avgProbabilities) as [TeacherRarity, number][]).map(([rarity, prob]) => (
            <div key={rarity} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${getRarityColor(rarity)}`} />
                <span className="capitalize text-foreground font-medium">{rarity}</span>
              </div>
              <span className="font-mono text-info font-bold">{formatPercent(prob)}</span>
            </div>
          ))}
        </div>

        {/* Varianten */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold flex items-center justify-between">
            <span>Variante pro Karte</span>
            <span className="text-[9px] font-normal opacity-70">(Zusatz-Chance)</span>
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-foreground font-medium">Holo</span>
              </div>
              <span className="font-mono text-info font-bold">{formatPercent(variantProbabilities.holo)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-foreground font-medium">Shiny</span>
              </div>
              <span className="font-mono text-info font-bold">{formatPercent(variantProbabilities.shiny)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3 text-amber-500">
                <Trophy className="w-4 h-4" />
                <span className="font-bold">Secret Rare</span>
              </div>
              <span className="font-mono text-amber-500 font-bold">{formatPercent(variantProbabilities.black_shiny_holo)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground italic">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Chance auf ein Godpack (gilt pro Booster Pack)</span>
        </div>
        <Badge variant="outline" className="w-fit font-mono text-amber-400 border-amber-400/30 bg-amber-400/5 px-3 py-1">
          {formatPercent(godpackChance)}
        </Badge>
      </div>
      
      <div className="bg-info/5 border border-info/10 rounded-xl p-4 text-[11px] text-muted-foreground leading-relaxed">
        <p className="font-bold text-info mb-1 flex items-center gap-1.5 uppercase tracking-tighter">
          <Info className="w-3 h-3" /> Berechnungsgrundlage & Terminologie
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Karte:</strong> Ein einzelnes Sammelobjekt. Jede Karte hat eine Seltenheit und eine Varianten-Chance.</li>
          <li><strong>Booster Pack:</strong> Ein Beutel, der exakt 3 Karten enthält.</li>
          <li><strong>Chance pro Pack:</strong> Statistischer Wert für den gesamten Inhalt eines Booster Packs.</li>
        </ul>
      </div>
    </div>
  );
};
