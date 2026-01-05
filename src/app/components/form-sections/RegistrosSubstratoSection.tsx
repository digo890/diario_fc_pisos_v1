import React from 'react';
import { DiarioData, RegistrosSubstrato, CondicionalItem } from '../../types';
import { FormSection } from '../FormSection';
import { CondicionalField } from '../CondicionalField';

interface RegistrosSubstratoSectionProps {
  data: DiarioData;
  onChange: (data: DiarioData) => void;
  disabled: boolean;
}

export function RegistrosSubstratoSection({
  data,
  onChange,
  disabled,
}: RegistrosSubstratoSectionProps) {
  const updateField = <K extends keyof RegistrosSubstrato>(
    field: K,
    value: CondicionalItem
  ) => {
    onChange({
      ...data,
      registrosSubstrato: {
        ...data.registrosSubstrato,
        [field]: value,
      },
    });
  };

  const registros = data.registrosSubstrato;

  return (
    <FormSection title="Registros Importantes sobre o Estado do Substrato">
      <div className="space-y-4">
        <CondicionalField
          label="1. Constatou-se água/umidade no substrato?"
          value={registros.aguaUmidade}
          onChange={(v) => updateField('aguaUmidade', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="2. As áreas estavam com fechamento lateral?"
          value={registros.fechamentoLateral}
          onChange={(v) => updateField('fechamentoLateral', v)}
          disabled={disabled}
        />

        <div className="pt-2">
          <h3 className="mb-4 text-[#1E2D3B]">3. Estado do Substrato</h3>
          <div className="space-y-4">
            <CondicionalField
              label="Substrato Fraco"
              value={registros.substratoFraco}
              onChange={(v) => updateField('substratoFraco', v)}
              disabled={disabled}
            />
            <CondicionalField
              label="Substrato Irregular / Ondulado"
              value={registros.substratoIrregular}
              onChange={(v) => updateField('substratoIrregular', v)}
              disabled={disabled}
            />
            <CondicionalField
              label="Substrato em Bom Estado"
              value={registros.substratoBomEstado}
              onChange={(v) => updateField('substratoBomEstado', v)}
              disabled={disabled}
            />
          </div>
        </div>

        <CondicionalField
          label="4. Existe contaminação / crostas / incrustações?"
          value={registros.contaminacao}
          onChange={(v) => updateField('contaminacao', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="5. Existe concreto remontado sobre bordos de ralos / canaletas / trilhos?"
          value={registros.concretoRemontado}
          onChange={(v) => updateField('concretoRemontado', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="6. Existem ralos / canaletas / trilhos desnivelados?"
          value={registros.ralosDesnivelados}
          onChange={(v) => updateField('ralosDesnivelados', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="7. O boleado de rodapés / muretas foi executado com concreto?"
          value={registros.boleadoConcreto}
          onChange={(v) => updateField('boleadoConcreto', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="8. As juntas serradas do piso foram aprofundadas por corte adicional?"
          value={registros.juntasSerradas}
          onChange={(v) => updateField('juntasSerradas', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="9. Existem juntas de dilatação no substrato?"
          value={registros.juntasDilatacao}
          onChange={(v) => updateField('juntasDilatacao', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="10. As muretas estão ancoradas no piso?"
          value={registros.muretasAncoradas}
          onChange={(v) => updateField('muretasAncoradas', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="11. Existem muretas apoiadas sobre juntas de dilatação?"
          value={registros.muretasJuntasDilatacao}
          onChange={(v) => updateField('muretasJuntasDilatacao', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="12. Existem juntas com bordas esborcinadas?"
          value={registros.juntasEsborcinadas}
          onChange={(v) => updateField('juntasEsborcinadas', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="13. Existem trincas no substrato?"
          value={registros.trincasSubstrato}
          onChange={(v) => updateField('trincasSubstrato', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="14. Existem serviços adicionais a serem realizados?"
          value={registros.servicosAdicionais}
          onChange={(v) => updateField('servicosAdicionais', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="15. Os serviços adicionais foram liberados pela contratante?"
          value={registros.servicosLiberados}
          onChange={(v) => updateField('servicosLiberados', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="16. O preposto acompanhou e conferiu as medições?"
          value={registros.prepostoMedicoes}
          onChange={(v) => updateField('prepostoMedicoes', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="17. As áreas concluídas foram protegidas e isoladas?"
          value={registros.areasProtegidas}
          onChange={(v) => updateField('areasProtegidas', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="18. O substrato foi fotografado?"
          value={registros.substratoFotografado}
          onChange={(v) => updateField('substratoFotografado', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="19. Ocorreu alguma desconformidade durante ou após as aplicações?"
          value={registros.desconformidades}
          onChange={(v) => updateField('desconformidades', v)}
          disabled={disabled}
        />

        <CondicionalField
          label="20. Você relatou ao preposto as desconformidades?"
          value={registros.relatouDesconformidades}
          onChange={(v) => updateField('relatouDesconformidades', v)}
          disabled={disabled}
        />
      </div>
    </FormSection>
  );
}
