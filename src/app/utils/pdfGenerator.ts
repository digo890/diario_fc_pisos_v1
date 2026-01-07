/**
 * Gerador de PDF completo para formulários do Diário de Obras
 * Versão simplificada - Formato A4 vertical seguindo layout do modal
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Obra, FormData, User } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Cores da empresa FC Pisos
const ORANGE = '#FD5521';
const WHITE = '#FFFFFF';
const BLACK = '#000000';
const GRAY_BG = '#F9FAFB';
const BORDER_GRAY = '#E5E7EB';
const TEXT_GRAY = '#6B7280';

/**
 * Gera PDF completo do formulário
 */
export async function generateFormPDF(
  obra: Obra,
  formData: FormData,
  users: User[]
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4'); // portrait, milímetros, A4
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPos = margin;

  // ============================================
  // CABEÇALHO LARANJA
  // ============================================
  pdf.setFillColor(ORANGE);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  pdf.setTextColor(WHITE);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Diário de Obras - FC PISOS', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Pisos e Revestimentos Industriais Ltda.', pageWidth / 2, 25, { align: 'center' });
  
  // Data de preenchimento
  const dataPreenchimento = formData.condicoesTrabalho?.data 
    ? format(new Date(formData.condicoesTrabalho.data), 'dd/MM/yyyy')
    : format(new Date(obra.createdAt), 'dd/MM/yyyy');
  pdf.setFontSize(10);
  pdf.text(`Preenchimento: ${dataPreenchimento}`, pageWidth / 2, 35, { align: 'center' });
  
  yPos = 55;

  // ============================================
  // INFORMAÇÕES DA OBRA
  // ============================================
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(BLACK);
  pdf.text('Dados da Obra', margin, yPos);
  yPos += 8;

  const encarregado = users.find(u => u.id === obra.encarregadoId);
  
  const obraInfo = [
    ['Cliente', obra.cliente],
    ['Obra', obra.obra],
    ['Cidade', obra.cidade || 'N/A'],
    ['Encarregado', encarregado?.nome || 'N/A'],
    ['Preposto', obra.prepostoNome || obra.prepostoEmail || 'N/A'],
    ['ID da Obra', `#${obra.id.substring(0, 8)}`],
  ];

  autoTable(pdf, {
    startY: yPos,
    head: [],
    body: obraInfo,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        fillColor: [249, 250, 251],
        cellWidth: 45,
      },
      1: { 
        textColor: [0, 0, 0],
      },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (pdf as any).lastAutoTable.finalY + 10;

  // ============================================
  // CONDIÇÕES AMBIENTAIS
  // ============================================
  if (formData.condicoesTrabalho) {
    yPos = checkPageBreak(pdf, yPos, 40, margin);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(BLACK);
    pdf.text('Condições Ambientais', margin, yPos);
    yPos += 8;

    const climaData = [
      ['Manhã', getClimaLabel(formData.condicoesTrabalho.climaManha)],
      ['Tarde', getClimaLabel(formData.condicoesTrabalho.climaTarde)],
      ['Noite', getClimaLabel(formData.condicoesTrabalho.climaNoite)],
    ];

    autoTable(pdf, {
      startY: yPos,
      head: [],
      body: climaData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          fillColor: [249, 250, 251],
          cellWidth: 45,
        },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (pdf as any).lastAutoTable.finalY + 10;
  }

  // ============================================
  // SERVIÇOS
  // ============================================
  const servicosKeys = ['servico1', 'servico2', 'servico3'] as const;
  
  servicosKeys.forEach((servicoKey, index) => {
    const servico = formData.servicos?.[servicoKey];
    
    if (!servico || !hasServiceContent(servico)) {
      return;
    }

    yPos = checkPageBreak(pdf, yPos, 40, margin);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(BLACK);
    pdf.text(`Serviço ${index + 1}`, margin, yPos);
    yPos += 8;

    const servicoData = getServiceTableData(servico);

    if (servicoData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        head: [['Item', 'Valor']],
        body: servicoData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
        },
        headStyles: {
          fillColor: [253, 85, 33], // ORANGE
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        columnStyles: {
          0: { 
            cellWidth: 85,
            fontStyle: 'normal',
          },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 10;
    }
  });

  // ============================================
  // REGISTROS IMPORTANTES
  // ============================================
  if (formData.registros && Object.keys(formData.registros).length > 0) {
    yPos = checkPageBreak(pdf, yPos, 40, margin);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(BLACK);
    pdf.text('Registros Importantes - Estado do Substrato', margin, yPos);
    yPos += 8;

    const registrosData = getRegistrosTableData(formData.registros);

    if (registrosData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        head: [['Pergunta', 'Resposta']],
        body: registrosData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
        },
        headStyles: {
          fillColor: [253, 85, 33],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        columnStyles: {
          0: { 
            cellWidth: 100,
          },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 10;
    }
  }

  // ============================================
  // OBSERVAÇÕES
  // ============================================
  if (formData.observacoes?.observacoes) {
    yPos = checkPageBreak(pdf, yPos, 30, margin);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(BLACK);
    pdf.text('Observações Gerais', margin, yPos);
    yPos += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(TEXT_GRAY);
    
    const splitText = pdf.splitTextToSize(formData.observacoes.observacoes, contentWidth);
    pdf.text(splitText, margin, yPos);
    yPos += splitText.length * 5 + 10;
  }

  // ============================================
  // VALIDAÇÃO DO PREPOSTO
  // ============================================
  if (formData.assinaturaPreposto) {
    yPos = checkPageBreak(pdf, yPos, 70, margin);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(BLACK);
    pdf.text('Validação do Preposto', margin, yPos);
    yPos += 8;

    const status = formData.prepostoConfirmado ? 'APROVADO ✓' : 'REPROVADO ✗';
    const statusColor = formData.prepostoConfirmado ? '#22C55E' : '#EF4444';
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(statusColor);
    pdf.text(status, margin, yPos);
    yPos += 8;

    if (formData.prepostoComentario) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(BLACK);
      pdf.text('Comentário:', margin, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(TEXT_GRAY);
      const splitComment = pdf.splitTextToSize(formData.prepostoComentario, contentWidth);
      pdf.text(splitComment, margin, yPos);
      yPos += splitComment.length * 5 + 5;
    }

    // Assinatura
    try {
      const imgWidth = 60;
      const imgHeight = 30;
      pdf.addImage(formData.assinaturaPreposto, 'PNG', margin, yPos, imgWidth, imgHeight);
      
      yPos += imgHeight + 3;
      
      pdf.setDrawColor(BORDER_GRAY);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, margin + imgWidth, yPos);
      
      pdf.setFontSize(8);
      pdf.setTextColor(TEXT_GRAY);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Assinatura do Preposto', margin, yPos + 4);
      
      yPos += 8;
    } catch (error) {
      console.error('Erro ao adicionar assinatura:', error);
    }

    if (formData.validadoPrepostoAt) {
      pdf.setFontSize(8);
      pdf.setTextColor(TEXT_GRAY);
      pdf.text(
        `Assinado em: ${format(new Date(formData.validadoPrepostoAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        margin,
        yPos
      );
    }
  }

  // ============================================
  // RODAPÉ EM TODAS AS PÁGINAS
  // ============================================
  const totalPages = pdf.internal.pages.length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    const footerY = pageHeight - 10;
    
    pdf.setFontSize(8);
    pdf.setTextColor(TEXT_GRAY);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text(
      `FC Pisos - Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
      margin,
      footerY
    );
    
    pdf.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );
  }

  // ============================================
  // SALVAR PDF
  // ============================================
  const fileName = `Diario_Obras_${obra.cliente.replace(/[^a-zA-Z0-9]/g, '_')}_${obra.obra.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  pdf.save(fileName);
  
  console.log(`✅ PDF gerado com sucesso: ${fileName}`);
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function checkPageBreak(pdf: jsPDF, yPos: number, requiredSpace: number, margin: number): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  if (yPos + requiredSpace > pageHeight - 20) {
    pdf.addPage();
    return margin + 10;
  }
  
  return yPos;
}

function getClimaLabel(clima?: string): string {
  if (!clima) return 'N/A';
  const labels: Record<string, string> = {
    'sol': '☀️ Sol',
    'nublado': '☁️ Nublado',
    'chuva': '🌧️ Chuva',
    'lua': '🌙 Lua'
  };
  return labels[clima] || clima;
}

function hasServiceContent(servico: any): boolean {
  if (!servico) return false;
  
  return !!(
    servico.horario ||
    servico.local ||
    (servico.etapas && Object.keys(servico.etapas).some(key => {
      const value = servico.etapas[key];
      return value !== null && value !== undefined && value !== '';
    }))
  );
}

function getServiceTableData(servico: any): [string, string][] {
  const data: [string, string][] = [];
  
  // Horário de execução
  if (servico.horario) {
    data.push(['Horário de execução', servico.horario]);
  }
  
  // Local de execução
  if (servico.local) {
    data.push(['Local de execução', servico.local]);
  }
  
  // Etapas
  if (servico.etapas) {
    const etapas = [
      { key: 'temperaturaAmbiente', label: '1. Temperatura Ambiente', unit: '°C' },
      { key: 'umidadeRelativa', label: '2. Umidade Relativa do Ar', unit: '%' },
      { key: 'temperaturaSubstrato', label: '3. Temperatura do Substrato', unit: '°C' },
      { key: 'umidadeSubstrato', label: '4. Umidade Superficial do Substrato', unit: '%' },
      { key: 'temperaturaMistura', label: '5. Temperatura da Mistura', unit: '°C' },
      { key: 'tempoMistura', label: '6. Tempo de Mistura', unit: ' minutos' },
      { key: 'loteParte1', label: '7. Nº dos Lotes da Parte 1', unit: '' },
      { key: 'loteParte2', label: '8. Nº dos Lotes da Parte 2', unit: '' },
      { key: 'loteParte3', label: '9. Nº dos Lotes da Parte 3', unit: '' },
      { key: 'kitsGastos', label: '10. Nº de Kits Gastos', unit: '' },
      { key: 'consumoObtido', label: '11. Consumo Médio Obtido', unit: ' m²/Kit' },
      { key: 'consumoEspecificado', label: '12. Consumo Médio Especificado', unit: ' m²/Kit' },
      { key: 'preparoSubstrato', label: '13. Preparo de Substrato', unit: ' m²' },
      { key: 'aplicacaoPrimer', label: '14. Aplicação de Primer ou TC-302', unit: ' m²' },
    ];
    
    etapas.forEach(({ key, label, unit }) => {
      const value = servico.etapas[key];
      if (value !== null && value !== undefined && value !== '') {
        data.push([label, `${value}${unit}`]);
      }
    });
    
    // 15. Aplicação de Uretano
    if (servico.etapas.aplicacaoUretano) {
      const uretano = servico.etapas.aplicacaoUretano;
      
      if (Array.isArray(uretano) && uretano.length > 0) {
        uretano.forEach((item: any, idx: number) => {
          if (item.tipo && item.area) {
            const label = idx === 0 ? '15. Aplicação de Uretano' : `    > ${item.tipo}`;
            data.push([label, `${item.area} m² (${item.tipo})`]);
          }
        });
      } else if (typeof uretano === 'object' && uretano.area) {
        data.push(['15. Aplicação de Uretano', `${uretano.area} m²`]);
      }
    }
    
    // 16 a 23
    const outrosServicos = [
      { key: 'uretanoMuretas', label: '16. Aplicação de Uretano WR em Muretas' },
      { key: 'rodapes', label: '17. Aplicação Rodapés' },
      { key: 'uretanoParedes', label: '18. Aplicação de Uretano WR em Paredes' },
      { key: 'muretasUretano', label: '19. Aplicação de uretano em muretas' },
      { key: 'pintura', label: '20. Serviços de pintura' },
      { key: 'pinturaLayout', label: '21. Serviços de pintura de layout' },
      { key: 'epoxi', label: '22. Aplicação de Epóxi' },
      { key: 'juntas', label: '23. Corte / Selamento Juntas de Piso' },
    ];
    
    outrosServicos.forEach(({ key, label }) => {
      const value = servico.etapas[key];
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          if (value.tipo && value.valor) {
            data.push([label, `${value.tipo}: ${value.valor}`]);
          } else if (value.metragem && value.altura) {
            data.push([label, `${value.metragem} ml × ${value.altura} m`]);
          } else if (value.area) {
            data.push([label, `${value.area} m²`]);
          } else {
            data.push([label, JSON.stringify(value)]);
          }
        } else {
          data.push([label, String(value)]);
        }
      }
    });
  }
  
  return data;
}

function getRegistrosTableData(registros: any): [string, string][] {
  const data: [string, string][] = [];
  
  const questions = [
    { key: 'aguaUmidade', label: '24. Constatou-se água/umidade no substrato?' },
    { key: 'fechamentoLateral', label: '25. As áreas estavam com fechamento lateral?' },
    { key: 'estadoSubstrato', label: '26. Estado do substrato' },
    { key: 'contaminacoes', label: '27. Existe contaminações/crostas/incrustações?' },
    { key: 'concretoRemontado', label: '28. Há concreto remontado sobre bordos?' },
    { key: 'ralosDesnivelados', label: '29. Há ralos/canaletas/trilhos desnivelados?' },
    { key: 'boleadoRodapes', label: '30. O boleado de rodapés/muretas foi executado com concreto?' },
    { key: 'espessuraPiso', label: '31. Qual a espessura do piso de concreto?' },
    { key: 'profundidadeCortes', label: '32. Qual a profundidade dos cortes das juntas serradas?' },
    { key: 'juntasAprofundadas', label: '33. As juntas serradas do piso foram aprofundadas?' },
    { key: 'juntasDilatacao', label: '34. Existem juntas de dilatação no substrato?' },
    { key: 'muretasAncoradas', label: '35. As muretas estão ancoradas no piso?' },
    { key: 'muretasApoiadas', label: '36. Existem muretas apoiadas sobre juntas de dilatação?' },
    { key: 'juntasEsborcinadas', label: '37. Existem juntas com bordas esborcinadas?' },
    { key: 'trincasSubstrato', label: '38. Existem trincas no substrato?' },
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
