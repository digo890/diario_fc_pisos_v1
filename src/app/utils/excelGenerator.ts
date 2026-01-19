import type { Obra, User, FormData } from '../types';

// Itens 1-34: Etapas de Execução dos Serviços (v1.1.0)
const ETAPAS = [
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
  { label: 'Aplicação de Uretano', unit: '', isMultiSelect: true },
  { label: 'Serviços de pintura', unit: '', isMultiSelect: true },
  { label: 'Serviços de pintura de layout', unit: '', isMultiSelect: true },
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
  { label: 'Quantas bisnagas de selante foram utilizadas?', unit: '' }
];

export async function generateFormExcel(
  obra: Obra,
  formData: FormData,
  users: User[]
): Promise<void> {
  // Dynamic import para reduzir bundle inicial (~1MB)
  const XLSXModule = await import('xlsx');
  const XLSX = (XLSXModule as any).default || XLSXModule;

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user?.nome || 'N/A';
  };

  const getClimaLabel = (clima?: string) => {
    if (!clima) return 'Não informado';
    const labels: Record<string, string> = {
      'sol': 'Sol',
      'nublado': 'Nublado',
      'chuva': 'Chuva',
      'lua': 'Lua'
    };
    return labels[clima] || clima;
  };

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Aba 1: Informações Gerais
  const wsData1: any[][] = [
    ['DIÁRIO DE OBRAS - FC PISOS'],
    [''],
    ['INFORMAÇÕES DA OBRA'],
    ['Cliente:', obra.cliente],
    ['Obra:', obra.obra],
    ['Cidade:', obra.cidade],
    ['Data:', obra.data],
    ['Encarregado:', getUserName(obra.encarregadoId)],
    ['Preposto:', obra.prepostoNome || obra.prepostoEmail || 'N/A'],
    [''],
    ['CONDIÇÕES AMBIENTAIS'],
    ['Clima Manhã:', getClimaLabel(formData.clima.manha)],
    ['Clima Tarde:', getClimaLabel(formData.clima.tarde)],
    ['Clima Noite:', getClimaLabel(formData.clima.noite)],
  ];

  if (formData.observacoes) {
    wsData1.push([''], ['OBSERVAÇÕES GERAIS'], [formData.observacoes]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(wsData1);
  XLSX.utils.book_append_sheet(wb, ws1, 'Informações Gerais');

  // Abas de Serviços
  const servicosKeys: Array<'servico1' | 'servico2' | 'servico3'> = ['servico1', 'servico2', 'servico3'];
  
  servicosKeys.forEach((key, idx) => {
    const servico = formData.servicos[key];
    if (!servico) return;

    // Verificar se tem conteúdo
    const hasContent = servico.horario || servico.local || 
                      Object.keys(servico.etapas || {}).length > 0 || 
                      Object.keys(servico.registros || {}).length > 0;
    
    if (!hasContent) return;

    const wsDataServico: any[][] = [
      [`SERVIÇO ${idx + 1}`],
      [''],
      ['Horário:', servico.horario || '-'],
      ['Local:', servico.local || '-'],
      [''],
      ['ETAPAS DE EXECUÇÃO (Itens 1-34)'],
      ['Item', 'Descrição', 'Valor', 'Unidade']
    ];

    // Adicionar etapas
    ETAPAS.forEach((etapa, index) => {
      const numeroItem = index + 1;
      let valor = servico.etapas?.[etapa.label] || '-';
      
      // Processar valores especiais
      if (etapa.isDropdown && valor !== '-') {
        const parts = valor.split('|');
        const tipo = parts[0] || '-';
        const valorNum = parts[1] || '-';
        valor = valorNum !== '-' && tipo !== '-' ? `${tipo}: ${valorNum}` : '-';
      }
      
      if (etapa.isDualField && valor !== '-') {
        const parts = valor.split('|');
        const valor1 = parts[0] || '-';
        const valor2 = parts[1] || '-';
        valor = valor1 !== '-' && valor2 !== '-' ? `${valor1} ${etapa.units?.[0]}, ${valor2} ${etapa.units?.[1]}` : '-';
      }
      
      if (etapa.isMultiSelect && valor !== '-') {
        const items = valor.split('|').filter((item: string) => item);
        if (items.length > 0) {
          const resultados: string[] = [];
          items.forEach((item: string) => {
            const [tipo, valorNum] = item.split(':');
            if (tipo && valorNum) {
              // Detectar unidade baseada no tipo para campo 13 (Aplicação de Uretano)
              if (etapa.label === 'Aplicação de Uretano') {
                if (tipo === 'Uretano para rodapé') {
                  resultados.push(`${tipo}: ${valorNum} ml`);
                } else if (tipo === 'Uretano para muretas' || tipo === 'Uretano para Paredes' || tipo === 'Uretano para Paredes, base e pilares') {
                  // Para campos duplos dentro do multiselect (usa ~ como separador)
                  const [val1, val2] = valorNum.split('~');
                  if (val1 && val2) {
                    resultados.push(`${tipo}: ${val1} ml / ${val2} cm`);
                  } else {
                    resultados.push(`${tipo}: ${valorNum} ml`);
                  }
                } else {
                  resultados.push(`${tipo}: ${valorNum} m²`);
                }
              } else if (etapa.label === 'Serviços de pintura') {
                resultados.push(`${tipo}: ${valorNum} m²`);
              } else if (etapa.label === 'Serviços de pintura de layout') {
                resultados.push(`${tipo}: ${valorNum} ml`);
              } else {
                resultados.push(`${tipo}: ${valorNum}`);
              }
            }
          });
          valor = resultados.length > 0 ? resultados.join(', ') : '-';
        } else {
          valor = '-';
        }
      }
      
      wsDataServico.push([
        numeroItem,
        etapa.label,
        valor,
        valor !== '-' && etapa.unit && !etapa.isMultiSelect ? etapa.unit : ''
      ]);
    });

    const wsServico = XLSX.utils.aoa_to_sheet(wsDataServico);
    XLSX.utils.book_append_sheet(wb, wsServico, `Serviço ${idx + 1}`);
  });

  // Aba de Validação
  if (formData.prepostoConfirmado) {
    const wsDataValidacao: any[][] = [
      ['VALIDAÇÃO DO PREPOSTO'],
      [''],
      ['Status:', 'Validado ✓'],
    ];

    if (formData.nomeCompletoPreposto) {
      wsDataValidacao.push([
        'Nome:',
        formData.nomeCompletoPreposto
      ]);
    }

    if (formData.prepostoReviewedAt) {
      wsDataValidacao.push([
        'Data de Validação:',
        new Date(formData.prepostoReviewedAt).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      ]);
    }

    const wsValidacao = XLSX.utils.aoa_to_sheet(wsDataValidacao);
    XLSX.utils.book_append_sheet(wb, wsValidacao, 'Validação');
  }

  // Gerar arquivo
  const fileName = `Diario_${obra.cliente.replace(/\s+/g, '_')}_${obra.data.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}