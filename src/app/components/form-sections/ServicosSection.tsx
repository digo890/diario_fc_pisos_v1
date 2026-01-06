import React, { useState, useEffect } from 'react';
import { Copy, ChevronDown, Plus, Trash2, Clock } from 'lucide-react';
import type { FormData, ServicoData } from '../../types';
import BottomSheet from '../BottomSheet';
import { useToast } from '../Toast';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  isReadOnly: boolean;
  isPreposto?: boolean;
  activeServico: 'servico1' | 'servico2' | 'servico3';
  setActiveServico: (servico: 'servico1' | 'servico2' | 'servico3') => void;
}

const ETAPAS = [
  { label: 'Temperatura Ambiente', numbered: true, unit: '°C' },
  { label: 'Umidade Relativa do Ar', numbered: true, unit: '%' },
  { label: 'Temperatura do Substrato', numbered: true, unit: '°C' },
  { label: 'Umidade Superficial do Substrato', numbered: true, unit: '%' },
  { label: 'Temperatura da Mistura', numbered: true, unit: '°C' },
  { label: 'Tempo de Mistura', numbered: true, unit: 'Minutos' },
  { label: 'Nº dos Lotes da Parte 1', numbered: true },
  { label: 'Nº dos Lotes da Parte 2', numbered: true },
  { label: 'Nº dos Lotes da Parte 3', numbered: true },
  { label: 'Nº de Kits Gastos', numbered: true },
  { label: 'Consumo Médio Obtido', numbered: true, unit: 'm²/Kit' },
  { label: 'Consumo Médio Especificado', numbered: true, unit: 'm²/Kit' },
  { label: 'Preparo de Substrato', numbered: true, unit: 'm²/ml' },
  { label: 'Aplicação de Primer ou TC-302', numbered: true, unit: 'm²/ml' },
  { label: 'Aplicação de Uretano', numbered: true, isMultiSelect: true, options: 'ucrete', unit: 'm²' },
  { label: 'Aplicação de Uretano WR em Muretas', numbered: true, isDropdown: true, options: 'ucrete', unit: 'ml' },
  { label: 'Aplicação Rodapés', numbered: true, isDropdown: true, options: 'rodapes', unit: 'ml' },
  { label: 'Aplicação de Uretano WR em Paredes', numbered: true, isDropdown: true, options: 'ucrete', unit: 'ml' },
  { label: 'Aplicação de uretano em muretas', numbered: true, isDualField: true, units: ['ml', 'cm'] },
  { label: 'Serviços de pintura', numbered: true, isDropdown: true, options: 'pintura', unit: 'm²' },
  { label: 'Serviços de pintura de layout', numbered: true, isDropdown: true, options: 'pinturaLayout', unit: 'ml' },
  { label: 'Aplicação de Epóxi', numbered: true, unit: 'm²' },
  { label: 'Corte / Selamento Juntas de Piso', numbered: true, unit: 'ml' },
  { label: 'Corte / Selamento Juntas em Muretas', numbered: true, unit: 'ml' },
  { label: 'Corte / Selamento Juntas em Rodapés', numbered: true, unit: 'ml' },
  { label: 'Remoção de Substrato Fraco', numbered: true, unit: 'm² / Espessura' },
  { label: 'Desbaste de Substrato', numbered: true, unit: 'm² / Espessura' },
  { label: 'Grauteamento', numbered: true, unit: 'm² / Espessura' },
  { label: 'Remoção e Reparo de Sub-Base', numbered: true, unit: 'm² / Espessura' },
  { label: 'Reparo com Concreto Uretânico', numbered: true, unit: 'm² / Espessura' },
  { label: 'Tratamento de Trincas', numbered: true, unit: 'ml' },
  { label: 'Execução de Lábios Poliméricos', numbered: true, unit: 'ml' },
  { label: 'Secagem de Substrato', numbered: true, unit: 'm²' },
  { label: 'Remoção de Revestimento Antigo', numbered: true, unit: 'm²' },
  { label: 'Polimento Mecânico de Substrato', numbered: true, unit: 'm²' },
  { label: 'Reparo de Revestimento em Piso', numbered: true, unit: 'm² / Espessura' },
  { label: 'Reparo de Revestimento em Muretas', numbered: true, unit: 'ml' },
  { label: 'Reparo de Revestimento em Rodapé', numbered: true, unit: 'ml' }
];

const UCRETE_OPTIONS = [
  'Uretano argamassado 4mm',
  'Uretano argamassado 6mm',
  'Uretano autonivelante',
  'Uretano para rodapé',
  'Uretano para muretas'
];
const RODAPES_OPTIONS = [
  'Uretano argamassado 4mm',
  'Uretano argamassado 6mm',
  'Uretano autonivelante',
  'Uretano para rodapé',
  'Uretano para muretas'
];
const PINTURA_OPTIONS = [
  'Pintura em isopainel (parede)',
  'Pintura em isopainel (forro)',
  'Pintura em alvenaria'
];
const PINTURA_LAYOUT_OPTIONS = [
  'Faixas de 10cm',
  'Faixas de 5cm',
  'Faixas de pedestre',
  'Caminho seguro',
  'Desenho de empilhadeira',
  'Desenho de flechas de indicação',
  'Desenho de bonecos',
  'Desenho de extintor/hidrante'
];

// Função para validar e formatar valores de percentual
const validatePercentValue = (value: string): string => {
  // Permite apenas números, vírgula e ponto
  let cleanValue = value.replace(/[^0-9.,]/g, '');

  // Se não há vírgula/ponto e tem 3+ dígitos, verificar se precisa inserir vírgula
  if (!cleanValue.includes(',') && !cleanValue.includes('.') && cleanValue.length >= 3) {
    const numSemVirgula = parseFloat(cleanValue);
    // Só inserir vírgula automaticamente se o número for maior que 100
    if (!isNaN(numSemVirgula) && numSemVirgula > 100) {
      // Pega todos os dígitos menos o último e adiciona vírgula antes do último
      cleanValue = cleanValue.slice(0, -1) + ',' + cleanValue.slice(-1);
    }
  }

  // Converte vírgula para ponto para cálculo
  cleanValue = cleanValue.replace(',', '.');

  // Evita múltiplos pontos
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limita casas decimais a 1 dígito
  if (parts.length === 2 && parts[1].length > 1) {
    cleanValue = parts[0] + '.' + parts[1].charAt(0);
  }

  let number = parseFloat(cleanValue);

  if (!isNaN(number)) {
    if (number > 100) number = 100;
    if (number < 0) number = 0;

    // Arredonda para 1 casa decimal
    number = Math.round(number * 10) / 10;

    // Volta para vírgula no display
    return number.toString().replace('.', ',');
  }
  
  return '';
};

const ServicosSection: React.FC<Props> = ({ data, onChange, isReadOnly, isPreposto, activeServico, setActiveServico }) => {
  const { showToast } = useToast();
  const [activeDropdown, setActiveDropdown] = useState<{
    servicoKey: 'servico1' | 'servico2' | 'servico3' | null;
    label: string | null;
    type: 'ucrete' | 'rodapes' | 'pintura' | 'pinturaLayout' | null;
  }>({ servicoKey: null, label: null, type: null });

  const [showUretanoMultiSelect, setShowUretanoMultiSelect] = useState<{
    servicoKey: 'servico1' | 'servico2' | 'servico3' | null;
    label: string | null;
  }>({ servicoKey: null, label: null });

  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    servico: 'servico2' | 'servico3' | null;
  }>({ show: false, servico: null });

  // Determinar quais serviços estão habilitados (baseado em dados existentes)
  const servicosHabilitados: ('servico1' | 'servico2' | 'servico3')[] = [];
  if (data.servicos?.servico1 !== undefined && data.servicos.servico1 !== null) {
    servicosHabilitados.push('servico1');
  }
  if (data.servicos?.servico2 !== undefined && data.servicos.servico2 !== null) {
    servicosHabilitados.push('servico2');
  }
  if (data.servicos?.servico3 !== undefined && data.servicos.servico3 !== null) {
    servicosHabilitados.push('servico3');
  }

  // Se não houver nenhum serviço habilitado, inicializar com servico1
  useEffect(() => {
    if (servicosHabilitados.length === 0) {
      onChange({
        servicos: {
          servico1: {
            horario: '',
            local: '',
            etapas: {}
          }
        }
      });
    }
  }, []);

  const adicionarServico = () => {
    if (isReadOnly) return;

    // Encontrar o próximo serviço disponível
    let novoServico: 'servico2' | 'servico3' | null = null;
    if (!data.servicos.servico2) {
      novoServico = 'servico2';
    } else if (!data.servicos.servico3) {
      novoServico = 'servico3';
    }

    if (novoServico) {
      onChange({
        servicos: {
          ...data.servicos,
          [novoServico]: {
            horario: '',
            local: '',
            etapas: {}
          }
        }
      });
      setActiveServico(novoServico);
    }
  };

  const removerServico = (servicoKey: 'servico2' | 'servico3') => {
    if (isReadOnly) return;

    setConfirmDelete({ show: true, servico: servicoKey });
  };

  const confirmRemoverServico = (servicoKey: 'servico2' | 'servico3') => {
    // Criar novo objeto servicos sem o serviço removido
    // Fazemos uma cópia profunda apenas dos serviços que queremos manter
    const novosServicos: any = {};
    
    Object.keys(data.servicos).forEach(key => {
      if (key !== servicoKey) {
        const servico = data.servicos[key];
        novosServicos[key] = {
          ...servico,
          etapas: { ...servico.etapas },
          fotos: servico.fotos ? [...servico.fotos] : undefined,
          registros: servico.registros ? { ...servico.registros } : undefined
        };
      }
    });

    onChange({ servicos: novosServicos });

    // Se o serviço ativo foi removido, voltar para servico1
    if (activeServico === servicoKey) {
      setActiveServico('servico1');
    }

    setConfirmDelete({ show: false, servico: null });
  };

  const updateServico = (servicoKey: string, updates: Partial<ServicoData>) => {
    const servico = data.servicos[servicoKey] || {
      horario: '',
      local: '',
      etapas: {}
    };

    // Deep copy para garantir independência completa
    const novoServico: ServicoData = {
      horario: updates.horario !== undefined ? updates.horario : servico.horario,
      local: updates.local !== undefined ? updates.local : servico.local,
      etapas: updates.etapas !== undefined ? { ...updates.etapas } : { ...servico.etapas },
      fotos: updates.fotos !== undefined ? (updates.fotos ? [...updates.fotos] : undefined) : (servico.fotos ? [...servico.fotos] : undefined)
    };

    onChange({
      servicos: {
        ...data.servicos,
        [servicoKey]: novoServico
      }
    });
  };

  const updateEtapaValue = (servicoKey: string, etapa: string, value: string) => {
    const servico = data.servicos[servicoKey] || {
      horario: '',
      local: '',
      etapas: {}
    };

    const etapas = { ...servico.etapas };
    etapas[etapa] = value;

    updateServico(servicoKey, { etapas });
  };

  // Funções genéricas para gerenciar dropdowns - funciona com qualquer label
  const updateDropdownTipo = (servicoKey: string, label: string, tipo: string) => {
    const servico = data.servicos[servicoKey] || {
      horario: '',
      local: '',
      etapas: {}
    };

    const etapas = { ...servico.etapas };
    const currentValue = etapas[label] || '';
    
    // Formato: "tipo|valor" ex: "Uretano argamassado 4mm|100"
    const parts = currentValue.split('|');
    etapas[label] = `${tipo}|${parts[1] || ''}`;

    updateServico(servicoKey, { etapas });
  };

  const updateDropdownValor = (servicoKey: string, label: string, valor: string) => {
    const servico = data.servicos[servicoKey] || {
      horario: '',
      local: '',
      etapas: {}
    };

    const etapas = { ...servico.etapas };
    const currentValue = etapas[label] || '';
    
    // Formato: "tipo|valor" ex: "Uretano argamassado 4mm|100"
    const parts = currentValue.split('|');
    etapas[label] = `${parts[0] || ''}|${valor}`;

    updateServico(servicoKey, { etapas });
  };

  const getDropdownTipo = (servicoKey: string, label: string): string => {
    const servico = data.servicos[servicoKey];
    const value = servico?.etapas[label] || '';
    return value.split('|')[0] || '';
  };

  const getDropdownValor = (servicoKey: string, label: string): string => {
    const servico = data.servicos[servicoKey];
    const value = servico?.etapas[label] || '';
    return value.split('|')[1] || '';
  };

  // Mantém funções legadas para compatibilidade (redirecionam para as genéricas)
  const updateUcreteTipo = (servicoKey: string, tipo: string) => {
    updateDropdownTipo(servicoKey, 'Aplicação de Uretano (m²)', tipo);
  };

  const updateUcreteValor = (servicoKey: string, valor: string) => {
    updateDropdownValor(servicoKey, 'Aplicação de Uretano (m²)', valor);
  };

  const getUcreteTipo = (servicoKey: string): string => {
    return getDropdownTipo(servicoKey, 'Aplicação de Uretano (m²)');
  };

  const getUcreteValor = (servicoKey: string): string => {
    return getDropdownValor(servicoKey, 'Aplicação de Uretano (m²)');
  };

  const updateRodapeTipo = (servicoKey: string, tipo: string) => {
    updateDropdownTipo(servicoKey, 'Aplicação Rodapés (ml)', tipo);
  };

  const updateRodapeValor = (servicoKey: string, valor: string) => {
    updateDropdownValor(servicoKey, 'Aplicação Rodapés (ml)', valor);
  };

  const getRodapeTipo = (servicoKey: string): string => {
    return getDropdownTipo(servicoKey, 'Aplicação Rodapés (ml)');
  };

  const getRodapeValor = (servicoKey: string): string => {
    return getDropdownValor(servicoKey, 'Aplicação Rodapés (ml)');
  };

  const toggleEtapa = (servicoKey: string, etapa: string) => {
    const servico = data.servicos[servicoKey] || {
      horario: '',
      local: '',
      etapas: {}
    };

    const etapas = { ...servico.etapas };
    etapas[etapa] = !etapas[etapa];

    updateServico(servicoKey, { etapas });
  };

  // Funções para multiselect de uretano
  // Formato: "tipo1:valor1|tipo2:valor2|tipo3:valor3"
  const getMultiSelectData = (servicoKey: string, label: string): { tipo: string; valor: string }[] => {
    const servico = data.servicos[servicoKey];
    const value = servico?.etapas[label] || '';
    if (!value) return [];
    
    return value.split('|').filter(item => item).map(item => {
      const [tipo, valor] = item.split(':');
      return { tipo: tipo || '', valor: valor || '' };
    });
  };

  const getMultiSelectSelectedTypes = (servicoKey: string, label: string): string[] => {
    const items = getMultiSelectData(servicoKey, label);
    return items.map(item => item.tipo);
  };

  const toggleMultiSelectType = (servicoKey: string, label: string, tipo: string) => {
    const servico = data.servicos[servicoKey] || {
      horario: '',
      local: '',
      etapas: {}
    };

    const etapas = { ...servico.etapas };
    const items = getMultiSelectData(servicoKey, label);
    const selectedTypes = items.map(i => i.tipo);

    if (selectedTypes.includes(tipo)) {
      // Remover
      const newItems = items.filter(i => i.tipo !== tipo);
      etapas[label] = newItems.map(i => `${i.tipo}:${i.valor}`).join('|');
    } else {
      // Adicionar
      items.push({ tipo, valor: '' });
      etapas[label] = items.map(i => `${i.tipo}:${i.valor}`).join('|');
    }

    updateServico(servicoKey, { etapas });
  };

  const updateMultiSelectValue = (servicoKey: string, label: string, tipo: string, valor: string) => {
    const servico = data.servicos[servicoKey] || {
      horario: '',
      local: '',
      etapas: {}
    };

    const etapas = { ...servico.etapas };
    const items = getMultiSelectData(servicoKey, label);
    
    const updatedItems = items.map(item => {
      if (item.tipo === tipo) {
        return { tipo, valor };
      }
      return item;
    });

    etapas[label] = updatedItems.map(i => `${i.tipo}:${i.valor}`).join('|');
    updateServico(servicoKey, { etapas });
  };

  const copiarServico1 = (destino: 'servico2' | 'servico3') => {
    if (!data.servicos.servico1) {
      showToast('Serviço 1 não possui dados para copiar', 'warning');
      return;
    }

    // Deep copy completo para garantir independência total entre serviços
    const servico1 = data.servicos.servico1;
    
    // Deep copy dos registros
    const registrosCopia: { [key: string]: any } = {};
    if (servico1.registros) {
      Object.keys(servico1.registros).forEach(key => {
        registrosCopia[key] = {
          ...servico1.registros![key],
          foto: servico1.registros![key].foto // As fotos em base64 são strings, então copiar por valor
        };
      });
    }
    
    onChange({
      servicos: {
        ...data.servicos,
        [destino]: {
          horario: servico1.horario,
          local: servico1.local,
          etapas: { ...servico1.etapas },
          fotos: servico1.fotos ? [...servico1.fotos] : undefined,
          registros: Object.keys(registrosCopia).length > 0 ? registrosCopia : undefined
        }
      }
    });

    setActiveServico(destino);
  };

  const renderServico = (servicoKey: 'servico1' | 'servico2' | 'servico3', numero: number) => {
    const servico = data.servicos[servicoKey];

    return (
      <div className="space-y-6">
        {/* Botões de ação (apenas para serviços 2 e 3) */}
        {numero > 1 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copiarServico1(servicoKey)}
              disabled={isReadOnly}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
                       border-2 border-dashed border-gray-300 dark:border-gray-700
                       text-gray-700 dark:text-gray-300 hover:border-[#FD5521] hover:text-[#FD5521]
                       disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-700"
            >
              <Copy className="w-4 h-4" />
              Copiar dados do Serviço 1
            </button>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => removerServico(servicoKey as 'servico2' | 'servico3')}
                className="px-3 py-2 rounded-lg border-2 border-dashed border-red-300 dark:border-red-900
                         text-red-600 dark:text-red-400 hover:border-red-500 hover:text-red-700
                         dark:hover:border-red-700 dark:hover:text-red-300"
                title="Excluir este serviço"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Horário de execução */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Horário de execução
          </label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="time"
              value={servico?.horario || ''}
              onChange={(e) => updateServico(servicoKey, { horario: e.target.value })}
              disabled={isReadOnly}
              className="w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* Local de execução */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Local de execução
          </label>
          <input
            type="text"
            value={servico?.local || ''}
            onChange={(e) => updateServico(servicoKey, { local: e.target.value })}
            disabled={isReadOnly}
            placeholder={isReadOnly ? '' : 'Ex: Galpão A, Área externa'}
            className="w-full px-4 py-3 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                     disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
          />
        </div>

        {/* Etapas de execução */}
        <div>
          <div className="space-y-3">
            {ETAPAS.map((etapa, index) => {
              const numero = index + 1; // Agora começa em 1
              const isUcrete = etapa.options === 'ucrete';
              const isRodapes = etapa.options === 'rodapes';
              
              return (
                <div key={index}>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <span className="text-[#C6CCC2] dark:text-[#C6CCC2]">{numero}.</span> {etapa.label}
                  </label>
                  {etapa.isDropdown ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isReadOnly) {
                            setActiveDropdown({ servicoKey, label: etapa.label, type: etapa.options as 'ucrete' | 'rodapes' | 'pintura' | 'pinturaLayout' });
                          }
                        }}
                        disabled={isReadOnly}
                        className="w-1/2 px-4 py-3 rounded-lg 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                                 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
                                 flex items-center justify-between"
                      >
                        <span className={`truncate ${getDropdownTipo(servicoKey, etapa.label) ? '' : 'text-[#C6CCC2] dark:text-gray-600'}`}>
                          {getDropdownTipo(servicoKey, etapa.label) || (isReadOnly ? '' : 'Selecione')}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="relative w-1/2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={getDropdownValor(servicoKey, etapa.label)}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.,/-]/g, '');
                            updateDropdownValor(servicoKey, etapa.label, value);
                          }}
                          disabled={isReadOnly}
                          placeholder={isReadOnly ? '' : 'Digite o valor'}
                          className="w-full px-4 py-3 pr-12 rounded-lg 
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                   placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                                   focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                                   disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-sm">
                          {etapa.unit}
                        </span>
                      </div>
                    </div>
                  ) : etapa.isMultiSelect ? (
                    <div className="space-y-2">
                      {/* Botão para abrir o seletor */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isReadOnly) {
                            setShowUretanoMultiSelect({ servicoKey, label: etapa.label });
                          }
                        }}
                        disabled={isReadOnly}
                        className="w-full px-4 py-3 rounded-lg 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                                 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
                                 flex items-center justify-between transition-colors"
                      >
                        <span className={getMultiSelectSelectedTypes(servicoKey, etapa.label).length > 0 ? '' : 'text-[#C6CCC2] dark:text-gray-600'}>
                          {getMultiSelectSelectedTypes(servicoKey, etapa.label).length > 0 ? 
                            `${getMultiSelectSelectedTypes(servicoKey, etapa.label).length} tipo(s) selecionado(s)` : 
                            (isReadOnly ? '' : 'Selecione os tipos')}
                        </span>
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>

                      {/* Campos para cada tipo selecionado */}
                      {getMultiSelectData(servicoKey, etapa.label).map((item, itemIndex) => (
                        <div key={itemIndex} className="pl-4 border-l-2 border-[#FD5521]">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {item.tipo}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.valor}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.,/-]/g, '');
                                updateMultiSelectValue(servicoKey, etapa.label, item.tipo, value);
                              }}
                              disabled={isReadOnly}
                              placeholder={isReadOnly ? '' : 'Digite o valor'}
                              className="w-full px-4 py-3 pr-12 rounded-lg 
                                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                                       disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-sm">
                              {etapa.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : etapa.isDualField ? (
                    <div className="flex gap-2">
                      <div className="relative w-1/2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={(servico?.etapas[etapa.label] || '').split('|')[0] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.,/-]/g, '');
                            const currentValue = servico?.etapas[etapa.label] || '';
                            const parts = currentValue.split('|');
                            const newValue = `${value}|${parts[1] || ''}`;
                            updateEtapaValue(servicoKey, etapa.label, newValue);
                          }}
                          disabled={isReadOnly}
                          placeholder={isReadOnly ? '' : 'Valor'}
                          className="w-full px-4 py-3 pr-12 rounded-lg 
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                   placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                                   focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                                   disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-sm">
                          {etapa.units?.[0]}
                        </span>
                      </div>
                      <div className="relative w-1/2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={(servico?.etapas[etapa.label] || '').split('|')[1] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.,/-]/g, '');
                            const currentValue = servico?.etapas[etapa.label] || '';
                            const parts = currentValue.split('|');
                            const newValue = `${parts[0] || ''}|${value}`;
                            updateEtapaValue(servicoKey, etapa.label, newValue);
                          }}
                          disabled={isReadOnly}
                          placeholder={isReadOnly ? '' : 'Valor'}
                          className="w-full px-4 py-3 pr-12 rounded-lg 
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                   placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                                   focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                                   disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-sm">
                          {etapa.units?.[1]}
                        </span>
                      </div>
                    </div>
                  ) : etapa.unit ? (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={servico?.etapas[etapa.label] || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.,/-]/g, '');
                          // Aplicar validação de percentual se a unidade for '%'
                          if (etapa.unit === '%') {
                            value = validatePercentValue(value);
                          }
                          updateEtapaValue(servicoKey, etapa.label, value);
                        }}
                        disabled={isReadOnly}
                        placeholder={isReadOnly ? '' : 'Digite o valor'}
                        className="w-full px-4 py-3 pr-24 rounded-lg 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                                 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                                 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-sm">
                        {etapa.unit}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={servico?.etapas[etapa.label] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.,/-]/g, '');
                        updateEtapaValue(servicoKey, etapa.label, value);
                      }}
                      disabled={isReadOnly}
                      placeholder={isReadOnly ? '' : 'Digite o valor'}
                      className="w-full px-4 py-3 rounded-lg 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                               placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                               focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                               disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Serviços Executados
        </h2>
        {/* Botão para adicionar serviço - apenas para encarregado (não para preposto) */}
        {!isReadOnly && !isPreposto && (
          <button
            type="button"
            onClick={adicionarServico}
            className="flex items-center gap-1 text-sm font-medium transition-colors
                     text-[#FD5521] hover:text-[#FD5521]/80"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar Serviço</span>
          </button>
        )}
      </div>

      {/* Tabs - só aparecem quando há mais de 1 serviço */}
      {servicosHabilitados.length > 1 && (
        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveServico('servico1')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeServico === 'servico1'
                  ? 'border-[#FD5521] text-[#FD5521]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Serviço 1
            </button>
            {servicosHabilitados.includes('servico2') && (
              <button
                type="button"
                onClick={() => setActiveServico('servico2')}
                className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                  activeServico === 'servico2'
                    ? 'border-[#FD5521] text-[#FD5521]'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Serviço 2
              </button>
            )}
            {servicosHabilitados.includes('servico3') && (
              <button
                type="button"
                onClick={() => setActiveServico('servico3')}
                className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                  activeServico === 'servico3'
                    ? 'border-[#FD5521] text-[#FD5521]'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Serviço 3
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo da tab ativa */}
      {activeServico === 'servico1' && renderServico('servico1', 1)}
      {activeServico === 'servico2' && renderServico('servico2', 2)}
      {activeServico === 'servico3' && renderServico('servico3', 3)}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete.show && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setConfirmDelete({ show: false, servico: null })}
        >
          <div 
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Deseja remover o {confirmDelete.servico === 'servico2' ? 'Serviço 2' : 'Serviço 3'}? Todos os dados serão perdidos.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete({ show: false, servico: null })}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                         text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900
                         transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmRemoverServico(confirmDelete.servico as 'servico2' | 'servico3')}
                className="px-4 py-2 rounded-lg bg-red-500 dark:bg-red-700
                         text-white hover:bg-red-600 dark:hover:bg-red-800
                         transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BottomSheets para Ucrete - um para cada serviço */}
      {activeDropdown.type === 'ucrete' && (
        <BottomSheet
          key={`ucrete-${activeDropdown.servicoKey}`}
          isOpen={!!activeDropdown.servicoKey}
          onClose={() => setActiveDropdown({ servicoKey: null, label: null, type: null })}
          title="Selecione o tipo"
          options={UCRETE_OPTIONS.map(opt => ({ id: opt, label: opt }))}
          selectedId={getDropdownTipo(activeDropdown.servicoKey!, activeDropdown.label!)}
          onSelect={(id) => {
            updateDropdownTipo(activeDropdown.servicoKey!, activeDropdown.label!, id);
            setActiveDropdown({ servicoKey: null, label: null, type: null });
          }}
        />
      )}

      {/* BottomSheets para Rodapés - um para cada serviço */}
      {activeDropdown.type === 'rodapes' && (
        <BottomSheet
          key={`rodapes-${activeDropdown.servicoKey}`}
          isOpen={!!activeDropdown.servicoKey}
          onClose={() => setActiveDropdown({ servicoKey: null, label: null, type: null })}
          title="Selecione o tipo"
          options={RODAPES_OPTIONS.map(opt => ({ id: opt, label: opt }))}
          selectedId={getDropdownTipo(activeDropdown.servicoKey!, activeDropdown.label!)}
          onSelect={(id) => {
            updateDropdownTipo(activeDropdown.servicoKey!, activeDropdown.label!, id);
            setActiveDropdown({ servicoKey: null, label: null, type: null });
          }}
        />
      )}

      {/* BottomSheets para Pintura - um para cada serviço */}
      {activeDropdown.type === 'pintura' && (
        <BottomSheet
          key={`pintura-${activeDropdown.servicoKey}`}
          isOpen={!!activeDropdown.servicoKey}
          onClose={() => setActiveDropdown({ servicoKey: null, label: null, type: null })}
          title="Selecione o tipo"
          options={PINTURA_OPTIONS.map(opt => ({ id: opt, label: opt }))}
          selectedId={getDropdownTipo(activeDropdown.servicoKey!, activeDropdown.label!)}
          onSelect={(id) => {
            updateDropdownTipo(activeDropdown.servicoKey!, activeDropdown.label!, id);
            setActiveDropdown({ servicoKey: null, label: null, type: null });
          }}
        />
      )}

      {/* BottomSheets para Pintura de Layout - um para cada serviço */}
      {activeDropdown.type === 'pinturaLayout' && (
        <BottomSheet
          key={`pinturaLayout-${activeDropdown.servicoKey}`}
          isOpen={!!activeDropdown.servicoKey}
          onClose={() => setActiveDropdown({ servicoKey: null, label: null, type: null })}
          title="Selecione o tipo"
          options={PINTURA_LAYOUT_OPTIONS.map(opt => ({ id: opt, label: opt }))}
          selectedId={getDropdownTipo(activeDropdown.servicoKey!, activeDropdown.label!)}
          onSelect={(id) => {
            updateDropdownTipo(activeDropdown.servicoKey!, activeDropdown.label!, id);
            setActiveDropdown({ servicoKey: null, label: null, type: null });
          }}
        />
      )}

      {/* Bottom Sheet Multiselect para Uretano */}
      {showUretanoMultiSelect.servicoKey && showUretanoMultiSelect.label && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setShowUretanoMultiSelect({ servicoKey: null, label: null })}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                Selecione os tipos de uretano
              </h3>
            </div>
            
            {/* Lista de opções com scroll */}
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {UCRETE_OPTIONS.map((tipo) => {
                const selectedTypes = getMultiSelectSelectedTypes(showUretanoMultiSelect.servicoKey!, showUretanoMultiSelect.label!);
                const isSelected = selectedTypes.includes(tipo);
                
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => {
                      toggleMultiSelectType(showUretanoMultiSelect.servicoKey!, showUretanoMultiSelect.label!, tipo);
                    }}
                    className="w-full px-4 py-3 rounded-lg flex items-center justify-between
                             bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800
                             transition-colors"
                  >
                    <span className="text-gray-900 dark:text-white">{tipo}</span>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-[#FD5521] border-[#FD5521]' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer com botão */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowUretanoMultiSelect({ servicoKey: null, label: null })}
                className="w-full py-3 rounded-lg bg-[#FD5521] text-white font-medium
                         hover:bg-[#FD5521]/90 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServicosSection;