import type { Obra, User, FormData } from '../types';
import { ETAPAS } from '../schema/etapas';

const REGISTROS_LABELS = [
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
  'Você relatou ao preposto as desconformidades?',
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
    const user = users.find((u) => u.id === id);
    return user?.nome || 'N/A';
  };

  const getClimaLabel = (clima?: string) => {
    if (!clima) return 'Não informado';
    const labels: Record<string, string> = {
      sol: 'Sol',
      nublado: 'Nublado',
      chuva: 'Chuva',
      lua: 'Lua',
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
  const servicosKeys: Array<'servico1' | 'servico2' | 'servico3'> = [
    'servico1',
    'servico2',
    'servico3',
  ];

  servicosKeys.forEach((key, idx) => {
    const servico = formData.servicos[key];
    if (!servico) return;

    // Verificar se tem conteúdo
    const hasContent =
      servico.horario ||
      servico.local ||
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
      ['Item', 'Descrição', 'Valor', 'Unidade'],
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
        valor =
          valor1 !== '-' && valor2 !== '-'
            ? `${valor1} ${etapa.units?.[0]}, ${valor2} ${etapa.units?.[1]}`
            : '-';
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
                } else if (
                  tipo === 'Uretano para muretas' ||
                  tipo === 'Uretano para Paredes' ||
                  tipo === 'Uretano para Paredes, base e pilares'
                ) {
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
        valor !== '-' && etapa.unit && !etapa.isMultiSelect ? etapa.unit : '',
      ]);
    });

    // Adicionar registros (Estado do Substrato) - Itens 35 a 56
    wsDataServico.push(['']);
    wsDataServico.push(['ESTADO DO SUBSTRATO / REGISTROS (Itens 35-56)']);
    wsDataServico.push(['Item', 'Pergunta', 'Resposta', 'Detalhes']);

    REGISTROS_LABELS.forEach((label, index) => {
      const registroKey = `registro-${index}`;
      const item = servico.registros?.[registroKey];
      const numeroItem = 35 + index;

      let resposta = '-';
      let detalhes = '-';

      if (item) {
        const isEstadoSubstrato = label === 'Estado do substrato';
        const isNumericField42 = label === 'Qual a espessura do piso de concreto?';
        const isNumericField43 = label === 'Qual a profundidade dos cortes das juntas serradas?';

        if (isEstadoSubstrato) {
          resposta = item.texto || '-';
          detalhes = item.comentario || '-';
        } else if (isNumericField42) {
          resposta = (item as any).espessura ? `${(item as any).espessura} cm` : '-';
          detalhes = item.comentario || '-';
        } else if (isNumericField43) {
          resposta = item.texto ? `${item.texto} cm` : '-';
          detalhes = item.comentario || '-';
        } else {
          resposta = item.ativo ? 'SIM' : 'NÃO';
          detalhes = item.texto || item.comentario || '-';
        }
      }

      wsDataServico.push([numeroItem, label, resposta, detalhes]);
    });

    const wsServico = XLSX.utils.aoa_to_sheet(wsDataServico);
    XLSX.utils.book_append_sheet(wb, wsServico, `Serviço ${idx + 1}`);
  });

  // Aba de Validação
  if (formData.prepostoConfirmado) {
    const wsDataValidacao: any[][] = [['VALIDAÇÃO DO PREPOSTO'], [''], ['Status:', 'Validado ✓']];

    if (formData.nomeCompletoPreposto) {
      wsDataValidacao.push(['Nome:', formData.nomeCompletoPreposto]);
    }

    if (formData.prepostoReviewedAt) {
      wsDataValidacao.push([
        'Data de Validação:',
        new Date(formData.prepostoReviewedAt).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ]);
    }

    const wsValidacao = XLSX.utils.aoa_to_sheet(wsDataValidacao);
    XLSX.utils.book_append_sheet(wb, wsValidacao, 'Validação');
  }

  // Gerar arquivo
  const fileName = `Diario_${obra.cliente.replace(/\s+/g, '_')}_${obra.data.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
