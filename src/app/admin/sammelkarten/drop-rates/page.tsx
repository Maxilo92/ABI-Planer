'use client'

import React from 'react'
import { useSammelkartenAdmin } from '@/components/admin/SammelkartenAdminContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Zap, Sparkles } from 'lucide-react'
import { TeacherRarity } from '@/types/database'
import { getRarityColor, getRarityLabel } from '@/lib/utils'

function SmartNumericInput({ 
  value, 
  onChange, 
  step = "1", 
  min, 
  max, 
  className,
  isInteger = false
}: {
  value: number;
  onChange: (val: number) => void;
  step?: string;
  min?: string;
  max?: string;
  className?: string;
  isInteger?: boolean;
}) {
  const [localValue, setLocalValue] = React.useState<string>(value.toString());

  React.useEffect(() => {
    const parsedLocal = isInteger ? parseInt(localValue) : parseFloat(localValue);
    if (parsedLocal !== value) {
      setLocalValue(value.toString());
    }
  }, [value, isInteger, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    
    if (val !== "" && val !== "-") {
      const parsed = isInteger ? parseInt(val) : parseFloat(val);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  return (
    <Input
      type="number"
      step={step}
      min={min}
      max={max}
      value={localValue}
      onChange={handleChange}
      className={className}
    />
  );
}

function formatProbability(weight: number) {
  if (weight <= 0) return "0%";
  const percent = (weight * 100).toFixed(weight < 0.01 ? 2 : 1) + "%";
  const oneIn = weight >= 1 ? "" : ` (1 in ${Math.round(1 / weight)})`;
  return percent + oneIn;
}

const RARITY_ORDER: TeacherRarity[] = ['common', 'rare', 'epic', 'mythic', 'legendary', 'iconic']

export default function DropRatesPage() {
  const { localConfig, handleSaveConfig } = useSammelkartenAdmin()

  if (!localConfig) return null

  return (
    <div className="space-y-6">
      {/* Regular Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Reguläre Pack-Gewichte (3 Slots)
          </CardTitle>
          <CardDescription>Wahrscheinlichkeiten pro Slot im Booster (Summe sollte 1.0 ergeben).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {localConfig.rarity_weights.map((slot, sIdx) => (
            <div key={`reg-slot-${sIdx}`} className="space-y-4 p-4 rounded-xl border bg-muted/30">
              <h4 className="text-xs font-black uppercase text-center tracking-widest border-b pb-2">Slot {sIdx + 1}</h4>
              {RARITY_ORDER.map((rarity) => {
                const weight = slot[rarity] ?? 0
                return (
                  <div key={rarity} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className={getRarityColor(rarity)}>{getRarityLabel(rarity)}</span>
                      <span className="text-muted-foreground">{formatProbability(weight)}</span>
                    </div>
                    <SmartNumericInput 
                      step="0.001" 
                      min="0" 
                      max="1"
                      value={weight}
                      onChange={(val) => {
                        const newWeights = [...localConfig.rarity_weights]
                        newWeights[sIdx] = { ...newWeights[sIdx], [rarity]: val }
                        handleSaveConfig({ rarity_weights: newWeights })
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Godpack Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Godpack-Gewichte (3 Slots)
          </CardTitle>
          <CardDescription>Gewichte, wenn ein Godpack gezogen wird (extrem selten).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {localConfig.godpack_weights.map((slot, sIdx) => (
            <div key={`god-slot-${sIdx}`} className="space-y-4 p-4 rounded-xl border bg-amber-500/5 border-amber-500/20">
              <h4 className="text-xs font-black uppercase text-center tracking-widest border-b border-amber-500/20 pb-2 text-amber-700">Slot {sIdx + 1}</h4>
              {RARITY_ORDER.map((rarity) => {
                const weight = slot[rarity] ?? 0
                return (
                  <div key={rarity} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className={getRarityColor(rarity)}>{getRarityLabel(rarity)}</span>
                      <span className="text-muted-foreground">{formatProbability(weight)}</span>
                    </div>
                    <SmartNumericInput 
                      step="0.001" 
                      min="0" 
                      max="1"
                      value={weight}
                      onChange={(val) => {
                        const newWeights = [...localConfig.godpack_weights]
                        newWeights[sIdx] = { ...newWeights[sIdx], [rarity]: val }
                        handleSaveConfig({ godpack_weights: newWeights })
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
