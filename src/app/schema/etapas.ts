/**
 * Fonte única das 34 Etapas de Execução (itens 1-34) usadas em:
 * - ServicosSection (entrada de dados)
 * - ViewRespostasModal e PrepostoValidationPage (exibição)
 * - excelGenerator (relatório)
 *
 * Antes este array estava duplicado em 4 arquivos, com divergências. Os campos
 * `options` e a unidade dos itens multiselect são usados apenas pela tela de
 * entrada (ServicosSection); os consumidores de exibição/relatório usam `unit`
 * somente em itens que NÃO são multiselect nem dual-field, então esta unificação
 * não altera a saída de nenhum relatório.
 */
export interface EtapaDef {
  label: string;
  unit?: string;
  isMultiSelect?: boolean;
  options?: string;
  isDualField?: boolean;
  units?: string[];
  isDropdown?: boolean;
}

export const ETAPAS: EtapaDef[] = [
  { label: 'Temperatura Ambiente', unit: '°C' },
  { label: 'Umidade Relativa do Ar', unit: '%' },
  { label: 'Temperatura do Substrato', unit: '°C' },
  { label: 'Umidade Superficial do Substrato', unit: '%' },
  { label: 'Temperatura da Mistura', unit: '°C' },
  { label: 'Tempo de Mistura', unit: 'Minutos' },
  { label: 'Nº dos Lotes da Parte 1', unit: '' },
  { label: 'Nº dos Lotes da Parte 2', unit: '' },
  { label: 'Nº dos Lotes da Parte 3', unit: '' },
  { label: 'Nº de Kits Gastos', unit: '' },
  { label: 'Consumo Médio Obtido', unit: 'm²/Kit' },
  { label: 'Preparo de Substrato (fresagem e ancoragem)', unit: 'm²/ml' },
  { label: 'Aplicação de Uretano', unit: 'm²', isMultiSelect: true, options: 'ucrete' },
  { label: 'Serviços de pintura', unit: 'm²', isMultiSelect: true, options: 'pintura' },
  {
    label: 'Serviços de pintura de layout',
    unit: 'ml',
    isMultiSelect: true,
    options: 'pinturaLayout',
  },
  { label: 'Aplicação de Epóxi', unit: 'm²' },
  { label: 'Corte / Selamento Juntas de Piso', unit: 'ml' },
  { label: 'Corte / Selamento Juntas em Muretas', unit: 'ml' },
  { label: 'Corte / Selamento Juntas em Rodapés', unit: 'ml' },
  { label: 'Remoção de Substrato Fraco', isDualField: true, units: ['m²', 'cm'] },
  { label: 'Desbaste de Substrato', isDualField: true, units: ['m²', 'cm'] },
  { label: 'Grauteamento', isDualField: true, units: ['m²', 'cm'] },
  { label: 'Remoção e Reparo de Sub-Base', isDualField: true, units: ['m²', 'cm'] },
  { label: 'Reparo com Concreto Uretânico', isDualField: true, units: ['m²', 'cm'] },
  { label: 'Tratamento de Trincas', unit: 'ml' },
  { label: 'Execução de Lábios Poliméricos', unit: 'ml' },
  { label: 'Secagem de Substrato', unit: 'm²' },
  { label: 'Remoção de Revestimento Antigo', unit: 'm²' },
  { label: 'Polimento Mecânico de Substrato', unit: 'm²' },
  { label: 'Reparo de Revestimento em Piso', isDualField: true, units: ['m²', 'cm'] },
  { label: 'Reparo de Revestimento em Muretas', unit: 'ml' },
  { label: 'Reparo de Revestimento em Rodapé', unit: 'ml' },
  { label: 'Quantos botijões de gás foram utilizados?', unit: '' },
  { label: 'Quantas bisnagas de selante foram utilizadas?', unit: '' },
];
