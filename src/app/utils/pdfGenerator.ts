/**
 * Gerador de PDF completo para formulários do Diário de Obras
 * Cria PDFs profissionais com todos os dados, fotos e assinaturas
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Obra, FormData, User } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Cores da empresa
const PRIMARY_COLOR = '#FD5521';
const SECONDARY_COLOR = '#1E2D3B';
const LIGHT_GRAY = '#F5F5F5';
const DARK_GRAY = '#666666';

/**
 * Gera PDF completo do formulário
 */
export async function generateFormPDF(
  obra: Obra,
  formData: FormData,
  users: User[]
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  let yPos = 20;

  // ========== CABEÇALHO ==========
  pdf.setFillColor(PRIMARY_COLOR);
  pdf.rect(0, 0, pageWidth, 30, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FC PISOS', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Diário de Obras - Relatório Completo', pageWidth / 2, 23, { align: 'center' });

  yPos = 40;

  // ========== INFORMAÇÕES DA OBRA ==========
  pdf.setTextColor(SECONDARY_COLOR);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMAÇÕES DA OBRA', 14, yPos);
  yPos += 10;

  const encarregado = users.find(u => u.id === obra.encarregadoId);

  const obraInfo = [
    ['Cliente', obra.cliente],
    ['Obra', obra.obra],
    ['Encarregado', encarregado?.nome || 'N/A'],
    ['Preposto', obra.prepostoNome || obra.prepostoEmail || obra.prepostoWhatsapp || 'N/A'],
    ['Data de Criação', format(new Date(obra.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })],
    ['Status', getStatusText(obra.status)],
  ];

  autoTable(pdf, {
    startY: yPos,
    head: [],
    body: obraInfo,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: LIGHT_GRAY, textColor: SECONDARY_COLOR },
      1: { textColor: DARK_GRAY },
    },
  });

  yPos = (pdf as any).lastAutoTable.finalY + 15;

  // ========== CONDIÇÕES DE TRABALHO ==========
  if (formData.condicoesTrabalho) {
    yPos = addSectionTitle(pdf, 'CONDIÇÕES DE TRABALHO', yPos);
    
    const condicoes = formData.condicoesTrabalho;
    const condicoesData = [
      ['Data', condicoes.data || 'N/A'],
      ['Clima', getClimaText(condicoes.clima) || 'N/A'],
      ['Local de Execução', condicoes.localExecucao || 'N/A'],
    ];

    autoTable(pdf, {
      startY: yPos,
      head: [],
      body: condicoesData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: LIGHT_GRAY, cellWidth: 50 },
      },
    });

    yPos = (pdf as any).lastAutoTable.finalY + 10;
  }

  // ========== ETAPAS DE EXECUÇÃO ==========
  if (formData.etapas) {
    yPos = checkPageBreak(pdf, yPos, 40);
    yPos = addSectionTitle(pdf, 'ETAPAS DE EXECUÇÃO', yPos);
    
    const etapasData = getEtapasTableData(formData.etapas);
    
    if (etapasData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        head: [['Campo', 'Valor']],
        body: etapasData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
        columnStyles: {
          0: { cellWidth: 80 },
        },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 10;
    }
  }

  // ========== SERVIÇOS ==========
  ['servico1', 'servico2', 'servico3'].forEach((servicoKey, index) => {
    const servico = formData.servicos?.[servicoKey as keyof typeof formData.servicos];
    
    if (servico && Object.keys(servico).length > 0) {
      yPos = checkPageBreak(pdf, yPos, 40);
      yPos = addSectionTitle(pdf, `SERVIÇO ${index + 1}`, yPos);
      
      if (servico.local) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(DARK_GRAY);
        pdf.text(`Local: ${servico.local}`, 14, yPos);
        yPos += 6;
      }

      const servicoData = getServicesTableData(servico);
      
      if (servicoData.length > 0) {
        autoTable(pdf, {
          startY: yPos,
          head: [['Item', 'Valor']],
          body: servicoData,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
          columnStyles: {
            0: { cellWidth: 80 },
          },
        });

        yPos = (pdf as any).lastAutoTable.finalY + 10;
      }
    }
  });

  // ========== REGISTROS IMPORTANTES ==========
  if (formData.registros) {
    yPos = checkPageBreak(pdf, yPos, 40);
    yPos = addSectionTitle(pdf, 'REGISTROS IMPORTANTES - ESTADO DO SUBSTRATO', yPos);
    
    const registrosData = getRegistrosTableData(formData.registros);
    
    if (registrosData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        head: [['Pergunta', 'Resposta']],
        body: registrosData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
        columnStyles: {
          0: { cellWidth: 120 },
        },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 10;
    }
  }

  // ========== OBSERVAÇÕES ==========
  if (formData.observacoes?.observacoes) {
    yPos = checkPageBreak(pdf, yPos, 30);
    yPos = addSectionTitle(pdf, 'OBSERVAÇÕES GERAIS', yPos);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(DARK_GRAY);
    
    const splitText = pdf.splitTextToSize(formData.observacoes.observacoes, pageWidth - 28);
    pdf.text(splitText, 14, yPos);
    yPos += splitText.length * 5 + 10;
  }

  // ========== ASSINATURA DO PREPOSTO ==========
  if (formData.assinaturaPreposto) {
    yPos = checkPageBreak(pdf, yPos, 60);
    yPos = addSectionTitle(pdf, 'VALIDAÇÃO DO PREPOSTO', yPos);
    
    const status = formData.prepostoConfirmado ? 'APROVADO ✓' : 'REPROVADO ✗';
    const statusColor = formData.prepostoConfirmado ? [34, 197, 94] : [239, 68, 68];
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...statusColor);
    pdf.text(status, 14, yPos);
    yPos += 10;

    if (formData.prepostoComentario) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(DARK_GRAY);
      pdf.text('Comentário:', 14, yPos);
      yPos += 5;
      const splitComment = pdf.splitTextToSize(formData.prepostoComentario, pageWidth - 28);
      pdf.text(splitComment, 14, yPos);
      yPos += splitComment.length * 5 + 5;
    }

    // Adicionar imagem da assinatura
    try {
      pdf.addImage(formData.assinaturaPreposto, 'PNG', 14, yPos, 60, 30);
      yPos += 35;
    } catch (error) {
      console.error('Erro ao adicionar assinatura ao PDF:', error);
    }

    if (formData.validadoPrepostoAt) {
      pdf.setFontSize(8);
      pdf.setTextColor(DARK_GRAY);
      pdf.text(
        `Assinado em: ${format(new Date(formData.validadoPrepostoAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        14,
        yPos
      );
      yPos += 6;
    }
  }

  // ========== RODAPÉ EM TODAS AS PÁGINAS ==========
  const pageCount = pdf.internal.pages.length - 1;
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    pdf.setFillColor(LIGHT_GRAY);
    pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    pdf.setFontSize(8);
    pdf.setTextColor(DARK_GRAY);
    pdf.text(
      `FC Pisos - Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
      14,
      pageHeight - 8
    );
    
    pdf.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // Salvar PDF
  const fileName = `Diario_Obras_${obra.cliente}_${obra.obra}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  pdf.save(fileName);
  
  console.log(`✅ PDF gerado com sucesso: ${fileName}`);
}

// ========== FUNÇÕES AUXILIARES ==========

function addSectionTitle(pdf: jsPDF, title: string, yPos: number): number {
  pdf.setFillColor(LIGHT_GRAY);
  pdf.rect(10, yPos - 5, pdf.internal.pageSize.getWidth() - 20, 10, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(SECONDARY_COLOR);
  pdf.text(title, 14, yPos + 2);
  
  return yPos + 12;
}

function checkPageBreak(pdf: jsPDF, yPos: number, requiredSpace: number): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  if (yPos + requiredSpace > pageHeight - 20) {
    pdf.addPage();
    return 20;
  }
  
  return yPos;
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    novo: 'Novo',
    em_preenchimento: 'Em Preenchimento',
    enviado_preposto: 'Enviado ao Preposto',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
    enviado_admin: 'Enviado ao Admin',
    concluido: 'Concluído',
  };
  return statusMap[status] || status;
}

function getClimaText(clima?: string): string {
  const climaMap: Record<string, string> = {
    ensolarado: '☀️ Ensolarado',
    nublado: '☁️ Nublado',
    chuvoso: '🌧️ Chuvoso',
    ventoso: '💨 Ventoso',
  };
  return clima ? climaMap[clima] || clima : '';
}

function getEtapasTableData(etapas: any): [string, string][] {
  const data: [string, string][] = [];
  
  const fields = [
    { key: 'temperaturaAmbiente', label: 'Temperatura Ambiente', unit: '°C' },
    { key: 'umidadeRelativa', label: 'Umidade Relativa do Ar', unit: '%' },
    { key: 'temperaturaSubstrato', label: 'Temperatura do Substrato', unit: '°C' },
    { key: 'umidadeSubstrato', label: 'Umidade Superficial do Substrato', unit: '%' },
    { key: 'temperaturaMistura', label: 'Temperatura da Mistura', unit: '°C' },
    { key: 'tempoMistura', label: 'Tempo de Mistura', unit: 'min' },
    { key: 'loteParte1', label: 'Nº Lote Parte 1', unit: '' },
    { key: 'loteParte2', label: 'Nº Lote Parte 2', unit: '' },
    { key: 'loteParte3', label: 'Nº Lote Parte 3', unit: '' },
    { key: 'kitsGastos', label: 'Nº de Kits Gastos', unit: '' },
    { key: 'consumoObtido', label: 'Consumo Médio Obtido', unit: 'm²/Kit' },
    { key: 'consumoEspecificado', label: 'Consumo Médio Especificado', unit: 'm²/Kit' },
  ];

  fields.forEach(({ key, label, unit }) => {
    const value = etapas[key];
    if (value !== null && value !== undefined && value !== '') {
      data.push([label, `${value}${unit ? ' ' + unit : ''}`]);
    }
  });

  return data;
}

function getServicesTableData(servico: any): [string, string][] {
  const data: [string, string][] = [];
  
  Object.keys(servico).forEach(key => {
    if (key === 'local') return;
    
    const value = servico[key];
    if (value !== null && value !== undefined && value !== '') {
      const label = formatFieldLabel(key);
      const formattedValue = formatFieldValue(value);
      data.push([label, formattedValue]);
    }
  });

  return data;
}

function getRegistrosTableData(registros: any): [string, string][] {
  const data: [string, string][] = [];
  
  const questions = [
    { key: 'aguaUmidade', label: 'Constatou-se água/umidade no substrato?' },
    { key: 'fechamentoLateral', label: 'As áreas estavam com fechamento lateral?' },
    { key: 'estadoSubstrato', label: 'Estado do substrato' },
    { key: 'contaminacoes', label: 'Existe contaminações/crostas/incrustações?' },
    { key: 'concretoRemontado', label: 'Há concreto remontado sobre bordos?' },
    { key: 'ralosDesnivelados', label: 'Há ralos/canaletas/trilhos desnivelados?' },
    { key: 'boleadoRodapes', label: 'O boleado de rodapés/muretas foi executado com concreto?' },
    { key: 'espessuraPiso', label: 'Qual a espessura do piso de concreto?' },
    { key: 'profundidadeCortes', label: 'Qual a profundidade dos cortes das juntas serradas?' },
    { key: 'juntasAprofundadas', label: 'As juntas serradas do piso foram aprofundadas?' },
    { key: 'juntasDilatacao', label: 'Existem juntas de dilatação no substrato?' },
    { key: 'muretasAncoradas', label: 'As muretas estão ancoradas no piso?' },
    { key: 'muretasApoiadas', label: 'Existem muretas apoiadas sobre juntas de dilatação?' },
    { key: 'juntasEsborcinadas', label: 'Existem juntas com bordas esborcinadas?' },
    { key: 'trincasSubstrato', label: 'Existem trincas no substrato?' },
    { key: 'servicosAdicionais', label: 'Existem serviços adicionais a serem realizados?' },
    { key: 'servicosLiberados', label: 'Os serviços adicionais foram liberados?' },
    { key: 'prepostoAcompanhou', label: 'O preposto acompanhou e conferiu as medições?' },
    { key: 'areasProtegidas', label: 'As áreas concluídas foram protegidas e isoladas?' },
    { key: 'substratoFotografado', label: 'O substrato foi fotografado?' },
    { key: 'desconformidade', label: 'Ocorreu alguma desconformidade?' },
    { key: 'relataramPreposto', label: 'Você relatou ao preposto as desconformidades?' },
  ];

  questions.forEach(({ key, label }) => {
    const registro = registros[key];
    if (registro) {
      let answer = '';
      
      if (typeof registro === 'object') {
        if (registro.resposta !== undefined) {
          answer = registro.resposta === 'sim' ? 'Sim' : registro.resposta === 'nao' ? 'Não' : 'N/A';
          
          if (registro.comentario) {
            answer += ` - ${registro.comentario}`;
          }
          
          if (registro.valor) {
            answer += ` (${registro.valor})`;
          }
        } else if (registro.texto) {
          answer = registro.texto;
        }
      } else {
        answer = String(registro);
      }
      
      if (answer) {
        data.push([label, answer]);
      }
    }
  });

  return data;
}

function formatFieldLabel(key: string): string {
  // Converte camelCase para texto legível
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatFieldValue(value: any): string {
  if (typeof value === 'object' && value !== null) {
    if (value.area !== undefined && value.espessura !== undefined) {
      return `${value.area} m² / ${value.espessura} cm`;
    }
    return JSON.stringify(value);
  }
  
  return String(value);
}