'use client'

import React from 'react'
import { useSammelkartenAdmin } from '@/components/admin/SammelkartenAdminContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Activity } from 'lucide-react'

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

export default function ParameterPage() {
  const { localConfig, handleSaveConfig } = useSammelkartenAdmin()

  if (!localConfig) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            Globale Parameter & Varianten
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Limits */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold border-b pb-2">Limits & Reset</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Tägliche Packs pro User</Label>
                <SmartNumericInput 
                  isInteger
                  value={localConfig.global_limits.daily_allowance}
                  onChange={(val) => handleSaveConfig({ global_limits: { ...localConfig.global_limits, daily_allowance: val }})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Reset Stunde (Berlin Zeit, 0-23)</Label>
                <SmartNumericInput 
                  isInteger
                  min="0"
                  max="23"
                  value={localConfig.global_limits.reset_hour}
                  onChange={(val) => handleSaveConfig({ global_limits: { ...localConfig.global_limits, reset_hour: val }})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Godpack Wahrscheinlichkeit {formatProbability(localConfig.global_limits.godpack_chance)}</Label>
                <SmartNumericInput 
                  step="0.0001"
                  value={localConfig.global_limits.godpack_chance}
                  onChange={(val) => handleSaveConfig({ global_limits: { ...localConfig.global_limits, godpack_chance: val }})}
                />
              </div>
            </div>
          </div>

          {/* Variant Probabilities */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold border-b pb-2">Varianten-Wahrscheinlichkeiten</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Shiny (Silber-Effekt) {formatProbability(localConfig.variant_probabilities.shiny)}</Label>
                <SmartNumericInput 
                  step="0.001"
                  value={localConfig.variant_probabilities.shiny}
                  onChange={(val) => handleSaveConfig({ variant_probabilities: { ...localConfig.variant_probabilities, shiny: val }})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Holo (Regenbogen-Effekt) {formatProbability(localConfig.variant_probabilities.holo)}</Label>
                <SmartNumericInput 
                  step="0.001"
                  value={localConfig.variant_probabilities.holo}
                  onChange={(val) => handleSaveConfig({ variant_probabilities: { ...localConfig.variant_probabilities, holo: val }})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Black Shiny Holo (Secret Rare) {formatProbability(localConfig.variant_probabilities.black_shiny_holo)}</Label>
                <SmartNumericInput 
                  step="0.0001"
                  value={localConfig.variant_probabilities.black_shiny_holo}
                  onChange={(val) => handleSaveConfig({ variant_probabilities: { ...localConfig.variant_probabilities, black_shiny_holo: val }})}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
