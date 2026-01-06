import * as XLSX from 'xlsx';
import type { Obra, User, FormData } from '../types';

// Itens 1-37: Etapas de Execução dos Serviços
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
  { label: 'Consumo Médio Especificado', unit: 'm²/Kit' },
  { label: 'Preparo de Substrato', unit: 'm²/ml' },
  { label: 'Aplicação de Primer ou TC-302', unit: 'm²/ml' },
  { label: 'Aplicação de Uretano', unit: 'm²', isMultiSelect: true },
  { label: 'Aplicação de Uretano WR em Muretas', unit: 'ml', isDropdown: true },
  { label: 'Aplicação Rodapés', unit: 'ml', isDropdown: true },
  { label: 'Aplicação de Uretano WR em Paredes', unit: 'ml', isDropdown: true },
  { label: 'Aplicação de uretano em muretas', isDualField: true, units: ['ml', 'cm'] },
  { label: 'Serviços de pintura', isDropdown: true, unit: 'm²' },
  { label: 'Serviços de pintura de layout', isDropdown: true, unit: 'ml' },
  { label: 'Aplicação de Epóxi', unit: 'm²' },
  { label: 'Corte / Selamento Juntas de Piso', unit: 'ml' },
  { label: 'Corte / Selamento Juntas em Muretas', unit: 'ml' },
  { label: 'Corte / Selamento Juntas em Rodapés', unit: 'ml' },
  { label: 'Remoção de Substrato Fraco', unit: 'm² / Espessura' },
  { label: 'Desbaste de Substrato', unit: 'm² / Espessura' },
  { label: 'Grauteamento', unit: 'm² / Espessura' },
  { label: 'Remoção e Reparo de Sub-Base', unit: 'm² / Espessura' },
  { label: 'Reparo com Concreto Uretânico', unit: 'm² / Espessura' },
  { label: 'Tratamento de Trincas', unit: 'ml' },
  { label: 'Execução de Lábios Poliméricos', unit: 'ml' },
  { label: 'Secagem de Substrato', unit: 'm²' },
  { label: 'Remoção de Revestimento Antigo', unit: 'm²' },
  { label: 'Polimento Mecânico de Substrato', unit: 'm²' },
  { label: 'Reparo de Revestimento em Piso', unit: 'm² / Espessura' },
  { label: 'Reparo de Revestimento em Muretas', unit: 'ml' },
  { label: 'Reparo de Revestimento em Rodapé', unit: 'ml' }
];

// Itens 39-60: Registros Importantes (Estado do Substrato)
const REGISTROS_ITEMS = [
  'Constatou-se água / umidade no substrato?',
  'As áreas estavam com fechamento lateral?',
  'Estado do substrato',
  'Existe contaminações / crostas / incrustações no substrato?',
  'Há concreto remontado sobre os bordos de ralos / canaletas / trilhos (ml)?',
  'Há ralos / canaletas / trilhos desnivelados em relação ao substrato (ml)?',
  'O boleado de rodapés / muretas foi executado com concreto?',
  'Qual a espessura do piso de concreto?',
  'Qual a profundidade dos cortes das juntas serradas?',
  'As juntas serradas do piso foram aprofundadas por corte adicional? Em que extensão (ml)?',
  'Existem juntas de dilatação no substrato (ml)?',
  'As muretas estão ancoradas no piso?',
  'Existem muretas apoiadas sobre juntas de dilatação no piso?',
  'Existem juntas com bordas esborcinadas (ml)?',
  'Existem trincas no substrato (ml)?',
  'Existem serviços adicionais a serem realizados?',
  'Os serviços adicionais foram liberados pela contratante?',
  'O preposto acompanhou e conferiu as medições?',
  'As áreas concluídas foram protegidas e isoladas?',
  'O substrato foi fotografado?',
  'Ocorreu alguma desconformidade durante ou após as aplicações?',
  'Você relatou ao preposto as desconformidades?'
];

export async function generateFormExcel(
  obra: Obra,
  formData: FormData,
  users: User[]
): Promise<void> {
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
    ['Preposto:', obra.prepostoNome || obra.prepostoEmail || obra.prepostoWhatsapp || 'N/A'],
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
      ['ETAPAS DE EXECUÇÃO (Itens 1-37)'],
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
          const tiposValores = items.map((item: string) => {
            const [tipo, valorNum] = item.split(':');
            return { tipo: tipo || '-', valor: valorNum || '-' };
          });
          valor = tiposValores
            .filter((tv: any) => tv.tipo !== '-' && tv.valor !== '-')
            .map((tv: any) => `${tv.tipo}: ${tv.valor} ${etapa.unit}`)
            .join(', ') || '-';
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

    // Adicionar registros importantes
    wsDataServico.push(
      [''],
      ['ESTADO DO SUBSTRATO (Itens 39-60)'],
      ['Item', 'Descrição', 'Resposta', 'Detalhes/Observações']
    );

    REGISTROS_ITEMS.forEach((label, index) => {
      const registroKey = `registro-${index}`;
      const item = servico.registros?.[registroKey];
      const numeroItem = 39 + index;
      
      const isEstadoSubstrato = index === 2;
      
      if (isEstadoSubstrato) {
        const textoResposta = item?.texto || '-';
        const comentarioResposta = item?.comentario || '';
        wsDataServico.push([
          numeroItem,
          label,
          textoResposta,
          comentarioResposta
        ]);
      } else {
        const resposta = item?.ativo ? 'SIM' : 'NÃO';
        const detalhes: string[] = [];
        if (item?.texto) detalhes.push(`Detalhes: ${item.texto}`);
        if (item?.comentario) detalhes.push(`Comentário: ${item.comentario}`);
        
        wsDataServico.push([
          numeroItem,
          label,
          resposta,
          detalhes.join(' | ')
        ]);
      }
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
