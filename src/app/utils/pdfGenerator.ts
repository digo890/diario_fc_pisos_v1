/**
 * Gerador de PDF COMPLETO para formulários do Diário de Obras
 * Versão 1.1.0 - Mostra TODOS os dados preenchidos
 * Layout simples e organizado - Documento de garantia da obra
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
 * Gera PDF completo do formulário com TODOS os dados
 */
export async function generateFormPDF(
  obra: Obra,
  formData: FormData,
  users: User[]
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPos = margin;

  // ============================================
  // CABEÇALHO
  // ============================================
  pdf.setFillColor(ORANGE);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  pdf.setTextColor(WHITE);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DIÁRIO DE OBRAS', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('FC Pisos - Pisos e Revestimentos Industriais Ltda.', pageWidth / 2, 25, { align: 'center' });
  
  const dataPreenchimento = formData.condicoesTrabalho?.data 
    ? format(new Date(formData.condicoesTrabalho.data), 'dd/MM/yyyy')
    : format(new Date(obra.createdAt), 'dd/MM/yyyy');
  pdf.setFontSize(11);
  pdf.text(`Data: ${dataPreenchimento}`, pageWidth / 2, 37, { align: 'center' });
  
  yPos = 55;

  // ============================================
  // DADOS DA OBRA
  // ============================================
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(BLACK);
  pdf.text('DADOS DA OBRA', margin, yPos);
  yPos += 8;

  const encarregado = users.find(u => u.id === obra.encarregadoId);
  
  const obraInfo = [
    ['Cliente', obra.cliente],
    ['Obra', obra.obra],
    ['Cidade', obra.cidade || 'N/A'],
    ['Data', obra.data || 'N/A'],
    ['Encarregado', encarregado?.nome || 'N/A'],
    ['Preposto', obra.prepostoNome || obra.prepostoEmail || 'N/A'],
    ['ID da Obra', `#${obra.id.substring(0, 8)}`],
  ];

  autoTable(pdf, {
    startY: yPos,
    body: obraInfo,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        fillColor: [249, 250, 251],
        cellWidth: 50,
      },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (pdf as any).lastAutoTable.finalY + 12;

  // ============================================
  // CONDIÇÕES AMBIENTAIS
  // ============================================
  if (formData.condicoesTrabalho) {
    yPos = checkPageBreak(pdf, yPos, 50, margin);
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONDIÇÕES AMBIENTAIS E DE TRABALHO', margin, yPos);
    yPos += 8;

    const condicoesData = [];
    
    // Clima
    if (formData.condicoesTrabalho.climaManha) {
      condicoesData.push(['Clima - Manhã', getClimaLabel(formData.condicoesTrabalho.climaManha)]);
    }
    if (formData.condicoesTrabalho.climaTarde) {
      condicoesData.push(['Clima - Tarde', getClimaLabel(formData.condicoesTrabalho.climaTarde)]);
    }
    if (formData.condicoesTrabalho.climaNoite) {
      condicoesData.push(['Clima - Noite', getClimaLabel(formData.condicoesTrabalho.climaNoite)]);
    }
    
    // Temperatura e Umidade
    if (formData.condicoesTrabalho.temperaturaAmbiente) {
      condicoesData.push(['Temperatura Ambiente', formData.condicoesTrabalho.temperaturaAmbiente + ' °C']);
    }
    if (formData.condicoesTrabalho.umidadeRelativa) {
      condicoesData.push(['Umidade Relativa do Ar', formData.condicoesTrabalho.umidadeRelativa + ' %']);
    }

    if (condicoesData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        body: condicoesData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [249, 250, 251],
            cellWidth: 70,
          },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 12;
    }
  }

  // ============================================
  // SERVIÇOS EXECUTADOS (até 3 serviços)
  // ============================================
  const servicosKeys = ['servico1', 'servico2', 'servico3'] as const;
  
  servicosKeys.forEach((servicoKey, index) => {
    const servico = formData.servicos?.[servicoKey];
    
    if (!servico || !hasServiceContent(servico)) {
      return;
    }

    yPos = checkPageBreak(pdf, yPos, 50, margin);

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(ORANGE);
    pdf.text(`SERVIÇO ${index + 1}`, margin, yPos);
    pdf.setTextColor(BLACK);
    yPos += 8;

    const servicoData = [];

    // Horário e Local
    if (servico.horario) {
      servicoData.push(['Horário de Execução', servico.horario]);
    }
    if (servico.local) {
      servicoData.push(['Local de Execução', servico.local]);
    }

    // TODAS AS 37 ETAPAS POSSÍVEIS
    if (servico.etapas) {
      const todasEtapas = [
        { key: 'temperaturaAmbiente', label: '1. Temperatura Ambiente', unit: ' °C' },
        { key: 'umidadeRelativa', label: '2. Umidade Relativa do Ar', unit: ' %' },
        { key: 'temperaturaSubstrato', label: '3. Temperatura do Substrato', unit: ' °C' },
        { key: 'umidadeSubstrato', label: '4. Umidade Superficial do Substrato', unit: ' %' },
        { key: 'temperaturaMistura', label: '5. Temperatura da Mistura', unit: ' °C' },
        { key: 'tempoMistura', label: '6. Tempo de Mistura', unit: ' Minutos' },
        { key: 'loteParte1', label: '7. Nº dos Lotes da Parte 1', unit: '' },
        { key: 'loteParte2', label: '8. Nº dos Lotes da Parte 2', unit: '' },
        { key: 'loteParte3', label: '9. Nº dos Lotes da Parte 3', unit: '' },
        { key: 'kitsGastos', label: '10. Nº de Kits Gastos', unit: '' },
        { key: 'consumoObtido', label: '11. Consumo Médio Obtido', unit: ' m²/Kit' },
        { key: 'consumoEspecificado', label: '12. Consumo Médio Especificado', unit: ' m²/Kit' },
        { key: 'preparoSubstrato', label: '13. Preparo de Substrato', unit: ' m²/ml' },
        { key: 'aplicacaoPrimer', label: '14. Aplicação de Primer ou TC-302', unit: ' m²/ml' },
        { key: 'aplicacaoUretano', label: '15. Aplicação de Uretano', unit: ' m²', isComplex: true },
        { key: 'uretanoMuretas', label: '16. Aplicação de Uretano WR em Muretas', unit: ' ml', isComplex: true },
        { key: 'rodapes', label: '17. Aplicação Rodapés', unit: ' ml', isComplex: true },
        { key: 'uretanoParedes', label: '18. Aplicação de Uretano WR em Paredes', unit: ' ml', isComplex: true },
        { key: 'muretasUretano', label: '19. Aplicação de uretano em muretas', unit: '', isComplex: true },
        { key: 'pintura', label: '20. Serviços de pintura', unit: ' m²', isComplex: true },
        { key: 'pinturaLayout', label: '21. Serviços de pintura de layout', unit: ' ml', isComplex: true },
        { key: 'epoxi', label: '22. Aplicação de Epóxi', unit: ' m²' },
        { key: 'juntas', label: '23. Corte / Selamento Juntas de Piso', unit: ' ml' },
        { key: 'juntasMuretas', label: '24. Corte / Selamento Juntas em Muretas', unit: ' ml' },
        { key: 'juntasRodapes', label: '25. Corte / Selamento Juntas em Rodapés', unit: ' ml' },
        { key: 'remocaoSubstrato', label: '26. Remoção de Substrato Fraco', unit: ' m² / Espessura' },
        { key: 'desbaste', label: '27. Desbaste de Substrato', unit: ' m² / Espessura' },
        { key: 'grauteamento', label: '28. Grauteamento', unit: ' m² / Espessura' },
        { key: 'remocaoReparo', label: '29. Remoção e Reparo de Sub-Base', unit: ' m² / Espessura' },
        { key: 'reparoUretanico', label: '30. Reparo com Concreto Uretânico', unit: ' m² / Espessura' },
        { key: 'tratamentoTrincas', label: '31. Tratamento de Trincas', unit: ' ml' },
        { key: 'labiosPolimericos', label: '32. Execução de Lábios Poliméricos', unit: ' ml' },
        { key: 'secagemSubstrato', label: '33. Secagem de Substrato', unit: ' m²' },
        { key: 'remocaoRevestimento', label: '34. Remoção de Revestimento Antigo', unit: ' m²' },
        { key: 'polimentoMecanico', label: '35. Polimento Mecânico de Substrato', unit: ' m²' },
        { key: 'reparoPiso', label: '36. Reparo de Revestimento em Piso', unit: ' m² / Espessura' },
        { key: 'reparoMuretas', label: '37. Reparo de Revestimento em Muretas', unit: ' ml' },
        { key: 'reparoRodape', label: '38. Reparo de Revestimento em Rodapé', unit: ' ml' },
      ];
      
      todasEtapas.forEach(({ key, label, unit, isComplex }) => {
        const value = servico.etapas[key];
        if (value !== null && value !== undefined && value !== '') {
          if (isComplex) {
            // Campos complexos (objetos ou arrays)
            if (Array.isArray(value)) {
              value.forEach((item: any, idx: number) => {
                if (item.tipo && item.area) {
                  const itemLabel = idx === 0 ? label : `   ${item.tipo}`;
                  servicoData.push([itemLabel, `${item.area}${unit} (${item.tipo})`]);
                } else if (item.tipo && item.valor) {
                  const itemLabel = idx === 0 ? label : `   ${item.tipo}`;
                  servicoData.push([itemLabel, `${item.valor}${unit} (${item.tipo})`]);
                }
              });
            } else if (typeof value === 'object') {
              if (value.tipo && value.valor) {
                servicoData.push([label, `${value.valor}${unit} (${value.tipo})`]);
              } else if (value.metragem && value.altura) {
                servicoData.push([label, `${value.metragem} ml × ${value.altura} m`]);
              } else if (value.area) {
                servicoData.push([label, `${value.area}${unit}`]);
              } else {
                servicoData.push([label, JSON.stringify(value)]);
              }
            }
          } else {
            // Campos simples
            servicoData.push([label, `${value}${unit}`]);
          }
        }
      });
    }

    if (servicoData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        body: servicoData,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 2.5,
        },
        columnStyles: {
          0: { 
            cellWidth: 100,
            fontStyle: 'bold',
          },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 12;
    }

    // REGISTROS IMPORTANTES DO SERVIÇO
    if (servico.registros && Object.keys(servico.registros).length > 0) {
      yPos = checkPageBreak(pdf, yPos, 40, margin);
      
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Registros Importantes - Serviço ${index + 1}`, margin, yPos);
      yPos += 6;

      const registrosServicoData = [];
      Object.entries(servico.registros).forEach(([key, item]: [string, any]) => {
        if (item.ativo && item.texto) {
          let resposta = item.texto;
          if (item.resposta !== undefined) {
            resposta += ` - ${item.resposta ? 'Sim' : 'Não'}`;
          }
          if (item.comentario) {
            resposta += ` (${item.comentario})`;
          }
          registrosServicoData.push([key, resposta]);
        }
      });

      if (registrosServicoData.length > 0) {
        autoTable(pdf, {
          startY: yPos,
          body: registrosServicoData,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 2.5,
          },
          columnStyles: {
            0: { 
              cellWidth: 40,
              fontStyle: 'bold',
              fillColor: [249, 250, 251],
            },
          },
          margin: { left: margin, right: margin },
        });

        yPos = (pdf as any).lastAutoTable.finalY + 12;
      }
    }
  });

  // ============================================
  // REGISTROS IMPORTANTES - ESTADO DO SUBSTRATO
  // ============================================
  if (formData.registros && Object.keys(formData.registros).length > 0) {
    yPos = checkPageBreak(pdf, yPos, 50, margin);

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REGISTROS IMPORTANTES - ESTADO DO SUBSTRATO', margin, yPos);
    yPos += 8;

    const registrosData = getRegistrosTableData(formData.registros);

    if (registrosData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        body: registrosData,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 2.5,
        },
        columnStyles: {
          0: { 
            cellWidth: 100,
            fontStyle: 'bold',
          },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 12;
    }
  }

  // ============================================
  // OBSERVAÇÕES GERAIS
  // ============================================
  if (formData.observacoes?.observacoes) {
    yPos = checkPageBreak(pdf, yPos, 35, margin);

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OBSERVAÇÕES GERAIS', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(BLACK);
    
    const splitText = pdf.splitTextToSize(formData.observacoes.observacoes, contentWidth);
    pdf.text(splitText, margin, yPos);
    yPos += splitText.length * 5 + 12;
  }

  // ============================================
  // ASSINATURA DO ENCARREGADO
  // ============================================
  if (formData.assinaturaEncarregado) {
    yPos = checkPageBreak(pdf, yPos, 50, margin);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASSINATURA DO ENCARREGADO', margin, yPos);
    yPos += 8;

    try {
      const imgWidth = 60;
      const imgHeight = 30;
      pdf.addImage(formData.assinaturaEncarregado, 'PNG', margin, yPos, imgWidth, imgHeight);
      
      yPos += imgHeight + 3;
      
      pdf.setDrawColor(BORDER_GRAY);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, margin + imgWidth, yPos);
      
      pdf.setFontSize(9);
      pdf.setTextColor(TEXT_GRAY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(encarregado?.nome || 'Encarregado', margin, yPos + 4);
      
      yPos += 12;
    } catch (error) {
      console.error('Erro ao adicionar assinatura do encarregado:', error);
    }
  }

  // ============================================
  // VALIDAÇÃO DO PREPOSTO
  // ============================================
  if (formData.assinaturaPreposto) {
    yPos = checkPageBreak(pdf, yPos, 75, margin);

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VALIDAÇÃO DO PREPOSTO', margin, yPos);
    yPos += 8;

    const status = formData.prepostoConfirmado ? '✓ APROVADO' : '✗ REPROVADO';
    const statusColor = formData.prepostoConfirmado ? '#22C55E' : '#EF4444';
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(statusColor);
    pdf.text(status, margin, yPos);
    pdf.setTextColor(BLACK);
    yPos += 10;

    if (formData.prepostoComentario) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Comentário:', margin, yPos);
      yPos += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(TEXT_GRAY);
      const splitComment = pdf.splitTextToSize(formData.prepostoComentario, contentWidth);
      pdf.text(splitComment, margin, yPos);
      yPos += splitComment.length * 5 + 6;
      pdf.setTextColor(BLACK);
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
      
      pdf.setFontSize(9);
      pdf.setTextColor(TEXT_GRAY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(obra.prepostoNome || 'Preposto', margin, yPos + 4);
      
      yPos += 8;
    } catch (error) {
      console.error('Erro ao adicionar assinatura do preposto:', error);
    }

    if (formData.validadoPrepostoAt) {
      pdf.setFontSize(9);
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
      `FC Pisos - Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
      margin,
      footerY
    );
    
    pdf.text(
      `Pág. ${i} de ${totalPages}`,
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );
  }

  // ============================================
  // SALVAR PDF
  // ============================================
  // ✅ CORREÇÃO #7: Usar timezone local para evitar diferença de data
  const dataLocal = new Date(obra.data + 'T12:00:00'); // Meio-dia garante mesmo dia independente do fuso
  const diaFormatado = format(dataLocal, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const fileName = `Laudo_${obra.cliente.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  
  // Salvar PDF
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
    })) ||
    (servico.registros && Object.keys(servico.registros).length > 0)
  );
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
        } else if (registro.ativo) {
          answer = 'Sim';
          if (registro.comentario) {
            answer += ` - ${registro.comentario}`;
          }
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