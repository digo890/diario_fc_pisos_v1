import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface NumberInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  unit?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function NumberInput({
  label,
  value,
  onChange,
  unit,
  placeholder,
  min,
  max,
  step = 0.01,
  disabled = false,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = React.useState('');

  // Sincronizar displayValue com value prop
  React.useEffect(() => {
    setDisplayValue(value === null ? '' : String(value));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de controle
    const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Escape', 'Home', 'End'];
    if (controlKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }

    // Permitir apenas números, ponto e vírgula
    if (!/^[0-9.,]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Simular o valor após a digitação
    const input = e.currentTarget;
    const selectionStart = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;
    const currentValue = displayValue;
    
    // Construir o novo valor que seria criado após a digitação
    const newValue = 
      currentValue.substring(0, selectionStart) + 
      e.key + 
      currentValue.substring(selectionEnd);

    // Se o novo valor contém apenas ponto/vírgula, permitir (digitação parcial)
    if (/^[.,]$/.test(newValue) || /^\d+[.,]$/.test(newValue)) {
      return;
    }

    // Converter para número para validar
    const num = parseFloat(newValue.replace(',', '.'));

    if (isNaN(num)) {
      // Se não é um número válido e não é digitação parcial, bloquear
      if (newValue !== '') {
        e.preventDefault();
      }
      return;
    }

    // Verificar limites ANTES de permitir a digitação
    if (min !== undefined && num < min) {
      e.preventDefault();
      return;
    }
    
    if (max !== undefined && num > max) {
      e.preventDefault();
      return;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Se estiver vazio, permitir
    if (inputValue === '') {
      setDisplayValue('');
      onChange(null);
      return;
    }

    // Permitir apenas números, ponto e vírgula
    if (!/^-?\d*[.,]?\d*$/.test(inputValue)) {
      return;
    }

    // Converter para número para validar
    const num = parseFloat(inputValue.replace(',', '.'));
    
    if (isNaN(num)) {
      // Permitir digitação parcial como "1." ou "1,"
      if (/^\d+[.,]$/.test(inputValue)) {
        setDisplayValue(inputValue);
      }
      return;
    }

    // Validar limites
    if (min !== undefined && num < min) {
      return;
    }
    
    if (max !== undefined && num > max) {
      return;
    }

    // Se passou nas validações, aceitar o valor
    setDisplayValue(inputValue);
    onChange(num);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    const pastedText = e.clipboardData.getData('text');
    
    // Permitir apenas números, ponto e vírgula
    if (!/^-?\d*[.,]?\d*$/.test(pastedText)) {
      return;
    }

    const num = parseFloat(pastedText.replace(',', '.'));
    
    if (isNaN(num)) {
      return;
    }

    // Validar limites
    if (min !== undefined && num < min) {
      return;
    }
    
    if (max !== undefined && num > max) {
      return;
    }

    setDisplayValue(pastedText);
    onChange(num);
  };

  const handleBlur = () => {
    // Ao sair do campo, limpar formatação (remover vírgula/ponto final)
    if (displayValue === '' || displayValue === '-') {
      setDisplayValue('');
      onChange(null);
      return;
    }

    const num = parseFloat(displayValue.replace(',', '.'));
    if (!isNaN(num)) {
      let validatedNum = num;
      if (min !== undefined && validatedNum < min) {
        validatedNum = min;
      }
      if (max !== undefined && validatedNum > max) {
        validatedNum = max;
      }
      setDisplayValue(String(validatedNum));
      onChange(validatedNum);
    } else {
      setDisplayValue('');
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="h-12"
          disabled={disabled}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}