import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface AreaEspessuraInputProps {
  label: string;
  value: { area: number | null; espessura: number | null };
  onChange: (value: { area: number | null; espessura: number | null }) => void;
  disabled?: boolean;
}

export function AreaEspessuraInput({ label, value, onChange, disabled = false }: AreaEspessuraInputProps) {
  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange({
      ...value,
      area: val === '' ? null : parseFloat(val),
    });
  };

  const handleEspessuraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange({
      ...value,
      espessura: val === '' ? null : parseFloat(val),
    });
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Input
            type="number"
            value={value.area === null ? '' : value.area}
            onChange={handleAreaChange}
            placeholder="Área"
            step="0.01"
            className="h-12"
            disabled={disabled}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            m²
          </span>
        </div>
        <div className="relative">
          <Input
            type="number"
            value={value.espessura === null ? '' : value.espessura}
            onChange={handleEspessuraChange}
            placeholder="Espessura"
            step="0.01"
            className="h-12"
            disabled={disabled}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            mm
          </span>
        </div>
      </div>
    </div>
  );
}