import React from 'react';
import { DiarioData, EtapasExecucao } from '../../types';
import { FormSection } from '../FormSection';
import { NumberInput } from '../NumberInput';
import { AreaEspessuraInput } from '../AreaEspessuraInput';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface EtapasExecucaoSectionProps {
  data: DiarioData;
  onChange: (data: DiarioData) => void;
  disabled: boolean;
}

export function EtapasExecucaoSection({
  data,
  onChange,
  disabled,
}: EtapasExecucaoSectionProps) {
  const updateField = <K extends keyof EtapasExecucao>(
    field: K,
    value: EtapasExecucao[K]
  ) => {
    onChange({
      ...data,
      etapasExecucao: {
        ...data.etapasExecucao,
        [field]: value,
      },
    });
  };

  const etapas = data.etapasExecucao;

  return (
    <FormSection title="Etapas de Execução dos Serviços">
      <div className="space-y-6">
        {/* Medições Ambientais e Técnicas */}
        <div>
          <h3 className="mb-4 text-[#1E2D3B]">Medições e Lotes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberInput
              label="1. Temperatura Ambiente"
              value={etapas.temperaturaAmbiente}
              onChange={(v) => updateField('temperaturaAmbiente', v)}
              unit="°C"
              disabled={disabled}
            />
            <NumberInput
              label="2. Umidade Relativa do Ar"
              value={etapas.umidadeRelativaAr}
              onChange={(v) => updateField('umidadeRelativaAr', v)}
              unit="%"
              min={0}
              max={100}
              disabled={disabled}
            />
            <NumberInput
              label="3. Temperatura do Substrato"
              value={etapas.temperaturaSubstrato}
              onChange={(v) => updateField('temperaturaSubstrato', v)}
              unit="°C"
              disabled={disabled}
            />
            <NumberInput
              label="4. Umidade Superficial do Substrato"
              value={etapas.umidadeSuperficialSubstrato}
              onChange={(v) => updateField('umidadeSuperficialSubstrato', v)}
              unit="%"
              min={0}
              max={100}
              disabled={disabled}
            />
            <NumberInput
              label="5. Temperatura da Mistura"
              value={etapas.temperaturaMistura}
              onChange={(v) => updateField('temperaturaMistura', v)}
              unit="°C"
              disabled={disabled}
            />
            <NumberInput
              label="6. Tempo de Mistura"
              value={etapas.tempoMistura}
              onChange={(v) => updateField('tempoMistura', v)}
              unit="min"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Lotes */}
        <div>
          <h3 className="mb-4 text-[#1E2D3B]">Números de Lotes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>7. Nº dos Lotes da Parte 1</Label>
              <Input
                value={etapas.loteParte1}
                onChange={(e) => updateField('loteParte1', e.target.value)}
                placeholder={disabled ? '' : 'Lote...'}
                disabled={disabled}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>8. Nº dos Lotes da Parte 2</Label>
              <Input
                value={etapas.loteParte2}
                onChange={(e) => updateField('loteParte2', e.target.value)}
                placeholder={disabled ? '' : 'Lote...'}
                disabled={disabled}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>9. Nº dos Lotes da Parte 3</Label>
              <Input
                value={etapas.loteParte3}
                onChange={(e) => updateField('loteParte3', e.target.value)}
                placeholder={disabled ? '' : 'Lote...'}
                disabled={disabled}
                className="h-12"
              />
            </div>
          </div>
        </div>

        {/* Consumo */}
        <div>
          <h3 className="mb-4 text-[#1E2D3B]">Consumo de Materiais</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberInput
              label="10. Nº de Kits Gastos"
              value={etapas.kitsGastos}
              onChange={(v) => updateField('kitsGastos', v)}
              disabled={disabled}
            />
            <NumberInput
              label="11. Consumo Médio Obtido"
              value={etapas.consumoMedioObtido}
              onChange={(v) => updateField('consumoMedioObtido', v)}
              unit="m²/kit"
              disabled={disabled}
            />
            <NumberInput
              label="12. Consumo Médio Especificado"
              value={etapas.consumoMedioEspecificado}
              onChange={(v) => updateField('consumoMedioEspecificado', v)}
              unit="m²/kit"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Aplicações - Áreas Simples */}
        <div>
          <h3 className="mb-4 text-[#1E2D3B]">Preparação e Aplicações</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberInput
              label="13. Preparo de Substrato"
              value={etapas.preparoSubstrato}
              onChange={(v) => updateField('preparoSubstrato', v)}
              unit="m²/ml"
              disabled={disabled}
            />
            <NumberInput
              label="14. Aplicação de Primer"
              value={etapas.aplicacaoPrimerTC302}
              onChange={(v) => updateField('aplicacaoPrimerTC302', v)}
              unit="m²/ml"
              disabled={disabled}
            />
            <NumberInput
              label="15. Aplicação de Uretano MF"
              value={etapas.aplicacaoUcreteMF}
              onChange={(v) => updateField('aplicacaoUcreteMF', v)}
              unit="m²"
              disabled={disabled}
            />
            <NumberInput
              label="16. Aplicação de Uretano WR em Muretas"
              value={etapas.aplicacaoUcreteWRMuretas}
              onChange={(v) => updateField('aplicacaoUcreteWRMuretas', v)}
              unit="ml"
              disabled={disabled}
            />
            <NumberInput
              label="17. Aplicação de Uretano WR DN/LP"
              value={etapas.aplicacaoUcreteWRDNLP}
              onChange={(v) => updateField('aplicacaoUcreteWRDNLP', v)}
              unit="ml"
              disabled={disabled}
            />
            <NumberInput
              label="18. Aplicação de Uretano WR em Paredes"
              value={etapas.aplicacaoUcreteWRParedes}
              onChange={(v) => updateField('aplicacaoUcreteWRParedes', v)}
              unit="ml"
              disabled={disabled}
            />
            <NumberInput
              label="19. Aplicação de Sonoguard"
              value={etapas.aplicacaoSonoguard}
              onChange={(v) => updateField('aplicacaoSonoguard', v)}
              unit="m²"
              disabled={disabled}
            />
            <NumberInput
              label="20. Aplicação de Epóxi"
              value={etapas.aplicacaoEpoxi}
              onChange={(v) => updateField('aplicacaoEpoxi', v)}
              unit="m²"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Cortes e Selamentos */}
        <div>
          <h3 className="mb-4 text-[#1E2D3B]">Cortes e Selamentos de Juntas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberInput
              label="21. Corte/Selamento de Juntas de Piso"
              value={etapas.corteSelamentoJuntasPiso}
              onChange={(v) => updateField('corteSelamentoJuntasPiso', v)}
              unit="ml"
              disabled={disabled}
            />
            <NumberInput
              label="22. Corte/Selamento de Juntas em Muretas"
              value={etapas.corteSelamentoJuntasMuretas}
              onChange={(v) => updateField('corteSelamentoJuntasMuretas', v)}
              unit="ml"
              disabled={disabled}
            />
            <NumberInput
              label="23. Corte/Selamento de Juntas em Rodapés"
              value={etapas.corteSelamentoJuntasRodapes}
              onChange={(v) => updateField('corteSelamentoJuntasRodapes', v)}
              unit="ml"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Serviços com Área e Espessura */}
        <div>
          <h3 className="mb-4 text-[#1E2D3B]">Serviços de Substrato (Área + Espessura)</h3>
          <div className="space-y-4">
            <AreaEspessuraInput
              label="24. Remoção de Substrato Fraco"
              value={etapas.remocaoSubstratoFraco}
              onChange={(v) => updateField('remocaoSubstratoFraco', v)}
              disabled={disabled}
            />
            <AreaEspessuraInput
              label="25. Desbaste de Substrato"
              value={etapas.desbasteSubstrato}
              onChange={(v) => updateField('desbasteSubstrato', v)}
              disabled={disabled}
            />
            <AreaEspessuraInput
              label="26. Grauteamento"
              value={etapas.grauteamento}
              onChange={(v) => updateField('grauteamento', v)}
              disabled={disabled}
            />
            <AreaEspessuraInput
              label="27. Remoção e Reparo de Sub-base"
              value={etapas.remocaoReparoSubBase}
              onChange={(v) => updateField('remocaoReparoSubBase', v)}
              disabled={disabled}
            />
            <AreaEspessuraInput
              label="28. Reparo com Concreto Uretânico"
              value={etapas.reparoConcretoUretanico}
              onChange={(v) => updateField('reparoConcretoUretanico', v)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Tratamentos Adicionais */}
        <div>
          <h3 className="mb-4 text-[#1E2D3B]">Tratamentos e Serviços Adicionais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberInput
              label="29. Tratamento de Trincas"
              value={etapas.tratamentoTrincas}
              onChange={(v) => updateField('tratamentoTrincas', v)}
              unit="ml"
              disabled={disabled}
            />
            <NumberInput
              label="30. Execução de Lábios Poliméricos"
              value={etapas.execucaoLabiosPolimericos}
              onChange={(v) => updateField('execucaoLabiosPolimericos', v)}
              unit="ml"
              disabled={disabled}
            />
            <NumberInput
              label="31. Secagem de Substrato"
              value={etapas.secagemSubstrato}
              onChange={(v) => updateField('secagemSubstrato', v)}
              unit="m²"
              disabled={disabled}
            />
            <NumberInput
              label="32. Remoção de Revestimento Antigo"
              value={etapas.remocaoRevestimentoAntigo}
              onChange={(v) => updateField('remocaoRevestimentoAntigo', v)}
              unit="m²"
              disabled={disabled}
            />
            <NumberInput
              label="33. Polimento Mecânico do Substrato"
              value={etapas.polimentoMecanicoSubstrato}
              onChange={(v) => updateField('polimentoMecanicoSubstrato', v)}
              unit="m²"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Reparos */}
        <div>
          <h3 className="mb-4 text-[#1E2D3B]">Reparos de Revestimento</h3>
          <div className="space-y-4">
            <AreaEspessuraInput
              label="34. Reparo de Revestimento em Piso"
              value={etapas.reparoRevestimentoPiso}
              onChange={(v) => updateField('reparoRevestimentoPiso', v)}
              disabled={disabled}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput
                label="35. Reparo de Revestimento em Muretas"
                value={etapas.reparoRevestimentoMuretas}
                onChange={(v) => updateField('reparoRevestimentoMuretas', v)}
                unit="ml"
                disabled={disabled}
              />
              <NumberInput
                label="36. Reparo de Revestimento em Rodapé"
                value={etapas.reparoRevestimentoRodape}
                onChange={(v) => updateField('reparoRevestimentoRodape', v)}
                unit="ml"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
}