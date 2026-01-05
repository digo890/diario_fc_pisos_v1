import React from 'react';
import { DiarioData } from '../../types';
import { FormSection } from '../FormSection';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface CondicoesTrabalhoSectionProps {
  data: DiarioData;
  onChange: (data: DiarioData) => void;
  disabled: boolean;
}

export function CondicoesTrabalhoSection({
  data,
  onChange,
  disabled,
}: CondicoesTrabalhoSectionProps) {
  const updateField = (field: keyof DiarioData['condicoesTrabalho'], value: string) => {
    onChange({
      ...data,
      condicoesTrabalho: {
        ...data.condicoesTrabalho,
        [field]: value,
      },
    });
  };

  return (
    <FormSection title="Condições de Trabalho / Descrição dos Serviços">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Horário de Início</Label>
            <Input
              type="time"
              value={data.condicoesTrabalho.horarioInicio}
              onChange={(e) => updateField('horarioInicio', e.target.value)}
              disabled={disabled}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Horário de Fim</Label>
            <Input
              type="time"
              value={data.condicoesTrabalho.horarioFim}
              onChange={(e) => updateField('horarioFim', e.target.value)}
              disabled={disabled}
              className="h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Local de Execução dos Serviços</Label>
          <Input
            value={data.condicoesTrabalho.localExecucao}
            onChange={(e) => updateField('localExecucao', e.target.value)}
            placeholder={disabled ? '' : 'Descreva o local...'}
            disabled={disabled}
            className="h-12"
          />
        </div>
      </div>
    </FormSection>
  );
}
