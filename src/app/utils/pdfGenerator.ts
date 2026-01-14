/**
 * Gerador de PDF COMPLETO para formulários do Diário de Obras
 * Versão 1.1.0 - Mostra TODOS os dados preenchidos
 * Layout simples e organizado - Documento de garantia da obra
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Obra, FormData, User } from "../types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Cores da empresa FC Pisos
const ORANGE = "#FD5521";
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const GRAY_BG = "#F9FAFB";
const BORDER_GRAY = "#E5E7EB";
const TEXT_GRAY = "#6B7280";

/**
 * Gera PDF completo do formulário com TODOS os dados
 */
export async function generateFormPDF(
  obra: Obra,
  formData: FormData,
  users: User[],
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let yPos = margin;

  // ============================================
  // CABEÇALHO
  // ============================================
  pdf.setFillColor(ORANGE);
  pdf.rect(0, 0, pageWidth, 45, "F");

  pdf.setTextColor(WHITE);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("DIÁRIO DE OBRAS", pageWidth / 2, 15, {
    align: "center",
  });

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    "FC Pisos - Pisos e Revestimentos Industriais Ltda.",
    pageWidth / 2,
    25,
    { align: "center" },
  );

  const dataPreenchimento = formData.condicoesTrabalho?.data
    ? format(
        new Date(formData.condicoesTrabalho.data),
        "dd/MM/yyyy",
      )
    : format(new Date(obra.createdAt), "dd/MM/yyyy");
  pdf.setFontSize(11);
  pdf.text(`Data: ${dataPreenchimento}`, pageWidth / 2, 37, {
    align: "center",
  });

  yPos = 55;

  // ============================================
  // DADOS DA OBRA
  // ============================================
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(BLACK);
  pdf.text("DADOS DA OBRA", margin, yPos);
  yPos += 8;

  const encarregado = users.find(
    (u) => u.id === obra.encarregadoId,
  );

  const obraInfo = [
    ["Cliente", obra.cliente],
    ["Obra", obra.obra],
    ["Cidade", obra.cidade || "N/A"],
    ["Data", obra.data || "N/A"],
    ["Encarregado", encarregado?.nome || "N/A"],
    [
      "Preposto",
      obra.prepostoNome || obra.prepostoEmail || "N/A",
    ],
    ["ID da Obra", `#${obra.id.substring(0, 8)}`],
  ];

  autoTable(pdf, {
    startY: yPos,
    body: obraInfo,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
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
    pdf.setFont("helvetica", "bold");
    pdf.text(
      "CONDIÇÕES AMBIENTAIS E DE TRABALHO",
      margin,
      yPos,
    );
    yPos += 8;

    const condicoesData = [];

    // Clima
    if (formData.condicoesTrabalho.climaManha) {
      condicoesData.push([
        "Clima - Manhã",
        getClimaLabel(formData.condicoesTrabalho.climaManha),
      ]);
    }
    if (formData.condicoesTrabalho.climaTarde) {
      condicoesData.push([
        "Clima - Tarde",
        getClimaLabel(formData.condicoesTrabalho.climaTarde),
      ]);
    }
    if (formData.condicoesTrabalho.climaNoite) {
      condicoesData.push([
        "Clima - Noite",
        getClimaLabel(formData.condicoesTrabalho.climaNoite),
      ]);
    }

    // Temperatura e Umidade
    if (formData.condicoesTrabalho.temperaturaAmbiente) {
      condicoesData.push([
        "Temperatura Ambiente",
        formData.condicoesTrabalho.temperaturaAmbiente + " °C",
      ]);
    }
    if (formData.condicoesTrabalho.umidadeRelativa) {
      condicoesData.push([
        "Umidade Relativa do Ar",
        formData.condicoesTrabalho.umidadeRelativa + " %",
      ]);
    }

    if (condicoesData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        body: condicoesData,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: {
            fontStyle: "bold",
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
  const servicosKeys = [
    "servico1",
    "servico2",
    "servico3",
  ] as const;

  servicosKeys.forEach((servicoKey, index) => {
    const servico = formData.servicos?.[servicoKey];

    if (!servico || !hasServiceContent(servico)) {
      return;
    }

    yPos = checkPageBreak(pdf, yPos, 50, margin);

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(ORANGE);
    pdf.text(`SERVIÇO ${index + 1}`, margin, yPos);
    pdf.setTextColor(BLACK);
    yPos += 8;

    const servicoData = [];

    // ✅ CORREÇÃO: Horários separados (4 campos) - igual ao modal
    const horariosTexto = [];
    if (servico.horarioInicioManha && servico.horarioFimManha) {
      horariosTexto.push(
        `Manhã: ${servico.horarioInicioManha} às ${servico.horarioFimManha}`,
      );
    }
    if (servico.horarioInicioTarde && servico.horarioFimTarde) {
      horariosTexto.push(
        `Tarde: ${servico.horarioInicioTarde} às ${servico.horarioFimTarde}`,
      );
    }
    if (horariosTexto.length > 0) {
      servicoData.push([
        "Horários de Execução",
        horariosTexto.join(" | "),
      ]);
    }

    if (servico.local) {
      servicoData.push(["Local de Execução", servico.local]);
    }

    // TODAS AS 34 ETAPAS POSSÍVEIS (v1.1.0)
    if (servico.etapas) {
      const todasEtapas = [
        {
          dataKey: "Temperatura Ambiente",
          label: "1. Temperatura Ambiente",
          unit: " °C",
        },
        {
          dataKey: "Umidade Relativa do Ar",
          label: "2. Umidade Relativa do Ar",
          unit: " %",
        },
        {
          dataKey: "Temperatura do Substrato",
          label: "3. Temperatura do Substrato",
          unit: " °C",
        },
        {
          dataKey: "Umidade Superficial do Substrato",
          label: "4. Umidade Superficial do Substrato",
          unit: " %",
        },
        {
          dataKey: "Temperatura da Mistura",
          label: "5. Temperatura da Mistura",
          unit: " °C",
        },
        {
          dataKey: "Tempo de Mistura",
          label: "6. Tempo de Mistura",
          unit: " Minutos",
        },
        {
          dataKey: "Nº dos Lotes da Parte 1",
          label: "7. Nº dos Lotes da Parte 1",
          unit: "",
        },
        {
          dataKey: "Nº dos Lotes da Parte 2",
          label: "8. Nº dos Lotes da Parte 2",
          unit: "",
        },
        {
          dataKey: "Nº dos Lotes da Parte 3",
          label: "9. Nº dos Lotes da Parte 3",
          unit: "",
        },
        {
          dataKey: "Nº de Kits Gastos",
          label: "10. Nº de Kits Gastos",
          unit: "",
        },
        {
          dataKey: "Consumo Médio Obtido",
          label: "11. Consumo Médio Obtido",
          unit: " m²/Kit",
        },
        {
          dataKey:
            "Preparo de Substrato (fresagem e ancoragem)",
          label:
            "12. Preparo de Substrato (fresagem e ancoragem)",
          unit: " m²/ml",
        },
        {
          dataKey: "Aplicação de Uretano",
          label: "13. Aplicação de Uretano",
          unit: "",
          isMultiSelect: true,
        },
        {
          dataKey: "Serviços de pintura",
          label: "14. Serviços de pintura",
          unit: "",
          isMultiSelect: true,
        },
        {
          dataKey: "Serviços de pintura de layout",
          label: "15. Serviços de pintura de layout",
          unit: "",
          isMultiSelect: true,
        },
        {
          dataKey: "Aplicação de Epóxi",
          label: "16. Aplicação de Epóxi",
          unit: " m²",
        },
        {
          dataKey: "Corte / Selamento Juntas de Piso",
          label: "17. Corte / Selamento Juntas de Piso",
          unit: " ml",
        },
        {
          dataKey: "Corte / Selamento Juntas em Muretas",
          label: "18. Corte / Selamento Juntas em Muretas",
          unit: " ml",
        },
        {
          dataKey: "Corte / Selamento Juntas em Rodapés",
          label: "19. Corte / Selamento Juntas em Rodapés",
          unit: " ml",
        },
        {
          dataKey: "Remoção de Substrato Fraco",
          label: "20. Remoção de Substrato Fraco",
          isDualField: true,
        },
        {
          dataKey: "Desbaste de Substrato",
          label: "21. Desbaste de Substrato",
          isDualField: true,
        },
        {
          dataKey: "Grauteamento",
          label: "22. Grauteamento",
          isDualField: true,
        },
        {
          dataKey: "Remoção e Reparo de Sub-Base",
          label: "23. Remoção e Reparo de Sub-Base",
          isDualField: true,
        },
        {
          dataKey: "Reparo com Concreto Uretânico",
          label: "24. Reparo com Concreto Uretânico",
          isDualField: true,
        },
        {
          dataKey: "Tratamento de Trincas",
          label: "25. Tratamento de Trincas",
          unit: " ml",
        },
        {
          dataKey: "Execução de Lábios Poliméricos",
          label: "26. Execução de Lábios Poliméricos",
          unit: " ml",
        },
        {
          dataKey: "Secagem de Substrato",
          label: "27. Secagem de Substrato",
          unit: " m²",
        },
        {
          dataKey: "Remoção de Revestimento Antigo",
          label: "28. Remoção de Revestimento Antigo",
          unit: " m²",
        },
        {
          dataKey: "Polimento Mecânico de Substrato",
          label: "29. Polimento Mecânico de Substrato",
          unit: " m²",
        },
        {
          dataKey: "Reparo de Revestimento em Piso",
          label: "30. Reparo de Revestimento em Piso",
          isDualField: true,
        },
        {
          dataKey: "Reparo de Revestimento em Muretas",
          label: "31. Reparo de Revestimento em Muretas",
          unit: " ml",
        },
        {
          dataKey: "Reparo de Revestimento em Rodapé",
          label: "32. Reparo de Revestimento em Rodapé",
          unit: " ml",
        },
        {
          dataKey: "Quantos botijões de gás foram utilizados?",
          label:
            "33. Quantos botijões de gás foram utilizados?",
          unit: "",
        },
        {
          dataKey:
            "Quantas bisnagas de selante foram utilizadas?",
          label:
            "34. Quantas bisnagas de selante foram utilizadas?",
          unit: "",
        },
      ];

      todasEtapas.forEach(
        ({
          dataKey,
          label,
          unit,
          isMultiSelect,
          isDualField,
        }) => {
          const value = servico.etapas[dataKey];

          // ✅ MOSTRAR TODOS OS CAMPOS (preenchidos e não preenchidos)
          if (
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            // CAMPO PREENCHIDO
            if (isMultiSelect) {
              // ✅ Formato MultiSelect: "tipo1:valor1|tipo2:valor2|tipo3:valor3"
              const stringValue = String(value);
              if (stringValue.includes(":")) {
                const items = stringValue
                  .split("|")
                  .filter((item) => item);
                items.forEach((item, idx) => {
                  const [tipo, valor] = item.split(":");
                  if (tipo && valor) {
                    // Detectar unidade baseada no tipo para campo 13 (Aplicação de Uretano)
                    let itemUnit = "";
                    if (dataKey === "Aplicação de Uretano") {
                      if (tipo === "Uretano para rodapé") {
                        itemUnit = " ml";
                      } else if (
                        tipo === "Uretano para muretas" ||
                        tipo === "Uretano para Paredes" ||
                        tipo ===
                          "Uretano para Paredes, base e pilares"
                      ) {
                        // Para campos duplos dentro do multiselect (usa ~ como separador)
                        const [val1, val2] = valor.split("~");
                        if (val1 && val2) {
                          const itemLabel =
                            idx === 0 ? label : `   ${tipo}`;
                          servicoData.push([
                            itemLabel,
                            `${val1} ml / ${val2} cm`,
                          ]);
                          return;
                        }
                        itemUnit = " ml";
                      } else {
                        itemUnit = " m²";
                      }
                    } else if (
                      dataKey === "Serviços de pintura"
                    ) {
                      itemUnit = " m²";
                    } else if (
                      dataKey ===
                      "Serviços de pintura de layout"
                    ) {
                      itemUnit = " ml";
                    }

                    const itemLabel =
                      idx === 0 ? label : `   ${tipo}`;
                    servicoData.push([
                      itemLabel,
                      `${valor}${itemUnit} (${tipo})`,
                    ]);
                  }
                });
              } else {
                servicoData.push([label, stringValue]);
              }
            } else if (isDualField) {
              // ✅ Formato DualField: "valor1|valor2"
              const stringValue = String(value);
              if (stringValue.includes("|")) {
                const [valor1, valor2] = stringValue.split("|");
                if (valor1 && valor2) {
                  servicoData.push([
                    label,
                    `${valor1} m² / ${valor2} cm`,
                  ]);
                } else if (valor1 || valor2) {
                  servicoData.push([
                    label,
                    `${valor1 || valor2} m²`,
                  ]);
                }
              } else {
                servicoData.push([label, `${stringValue} m²`]);
              }
            } else {
              // Campos simples
              servicoData.push([
                label,
                `${value}${unit || ""}`,
              ]);
            }
          } else {
            // ✅ CAMPO NÃO PREENCHIDO - mostrar como "Não preenchido"
            servicoData.push([label, "Não preenchido"]);
          }
        },
      );
    }

    if (servicoData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        body: servicoData,
        theme: "striped",
        styles: {
          fontSize: 9,
          cellPadding: 2.5,
        },
        columnStyles: {
          0: {
            cellWidth: 100,
            fontStyle: "bold",
          },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 12;
    }

    // REGISTROS IMPORTANTES DO SERVIÇO
    if (
      servico.registros &&
      Object.keys(servico.registros).length > 0
    ) {
      yPos = checkPageBreak(pdf, yPos, 40, margin);

      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `Registros Importantes - Serviço ${index + 1} (Itens 35-56)`,
        margin,
        yPos,
      );
      yPos += 6;

      // Labels dos 22 registros importantes
      const REGISTROS_LABELS = [
        "Constatou-se água / umidade no substrato?",
        "As áreas estavam com fechamento lateral?",
        "Estado do substrato",
        "Existe contaminações / crostas / incrustações no substrato?",
        "Há concreto remontado sobre os bordos de ralos / canaletas / trilhos (ml)?",
        "Há ralos / canaletas / trilhos desnivelados em relação ao substrato (ml)?",
        "O boleado de rodapés / muretas foi executado com concreto?",
        "Qual a espessura do piso de concreto?",
        "Qual a profundidade dos cortes das juntas serradas?",
        "As juntas serradas do piso foram aprofundadas por corte adicional? Em que extensão (ml)?",
        "Existem juntas de dilatação no substrato (ml)?",
        "As muretas estão ancoradas no piso?",
        "Existem muretas apoiadas sobre juntas de dilatação no piso?",
        "Existem juntas com bordas esborcinadas (ml)?",
        "Existem trincas no substrato (ml)?",
        "Existem serviços adicionais a serem realizados?",
        "Os serviços adicionais foram liberados pela contratante?",
        "O preposto acompanhou e conferiu as medições?",
        "As áreas concluídas foram protegidas e isoladas?",
        "O substrato foi fotografado?",
        "Ocorreu alguma desconformidade durante ou após as aplicações?",
        "Você relatou ao preposto as desconformidades?",
      ];

      const registrosServicoData = [];

      // ✅ MOSTRAR TODOS OS 22 REGISTROS (preenchidos e não preenchidos)
      REGISTROS_LABELS.forEach((label, index) => {
        const registroKey = `registro-${index}`;
        const item = servico.registros?.[registroKey];
        const numeroItem = 35 + index;

        let resposta = "";

        if (item) {
          // Para item "Estado do substrato" (index 2), mostrar o texto diretamente
          if (index === 2) {
            resposta = item.texto || "N/A";
            if (item.comentario) {
              resposta += ` (${item.comentario})`;
            }
          } else {
            // Para outros itens, mostrar SIM/NÃO baseado em ativo
            resposta = item.ativo ? "SIM" : "NÃO";
            if (item.texto) {
              resposta += ` - ${item.texto}`;
            }
            if (item.comentario) {
              resposta += ` (${item.comentario})`;
            }
          }
        } else {
          // Item não existe - considerar como NÃO (padrão)
          resposta = index === 2 ? "N/A" : "NÃO";
        }

        registrosServicoData.push([
          `${numeroItem}. ${label}`,
          resposta,
        ]);
      });

      if (registrosServicoData.length > 0) {
        autoTable(pdf, {
          startY: yPos,
          body: registrosServicoData,
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 2.5,
          },
          columnStyles: {
            0: {
              cellWidth: 40,
              fontStyle: "bold",
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
  if (
    formData.registros &&
    Object.keys(formData.registros).length > 0
  ) {
    yPos = checkPageBreak(pdf, yPos, 50, margin);

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      "REGISTROS IMPORTANTES - ESTADO DO SUBSTRATO",
      margin,
      yPos,
    );
    yPos += 8;

    const registrosData = getRegistrosTableData(
      formData.registros,
    );

    if (registrosData.length > 0) {
      autoTable(pdf, {
        startY: yPos,
        body: registrosData,
        theme: "striped",
        styles: {
          fontSize: 9,
          cellPadding: 2.5,
        },
        columnStyles: {
          0: {
            cellWidth: 100,
            fontStyle: "bold",
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
  // ✅ CORREÇÃO: formData.observacoes é string direta, não objeto
  if (formData.observacoes && formData.observacoes.trim()) {
    yPos = checkPageBreak(pdf, yPos, 35, margin);

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("OBSERVAÇÕES GERAIS", margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(BLACK);

    const splitText = pdf.splitTextToSize(
      formData.observacoes,
      contentWidth,
    );
    pdf.text(splitText, margin, yPos);
    yPos += splitText.length * 5 + 12;
  }

  // ============================================
  // ASSINATURA DO ENCARREGADO
  // ============================================
  if (formData.assinaturaEncarregado) {
    yPos = checkPageBreak(pdf, yPos, 50, margin);

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("ASSINATURA DO ENCARREGADO", margin, yPos);
    yPos += 8;

    try {
      const imgWidth = 60;
      const imgHeight = 30;
      pdf.addImage(
        formData.assinaturaEncarregado,
        "PNG",
        margin,
        yPos,
        imgWidth,
        imgHeight,
      );

      yPos += imgHeight + 3;

      pdf.setDrawColor(BORDER_GRAY);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, margin + imgWidth, yPos);

      pdf.setFontSize(9);
      pdf.setTextColor(TEXT_GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        encarregado?.nome || "Encarregado",
        margin,
        yPos + 4,
      );

      yPos += 12;
    } catch (error) {
      console.error(
        "Erro ao adicionar assinatura do encarregado:",
        error,
      );
    }
  }

  // ============================================
  // VALIDAÇÃO DO PREPOSTO
  // ============================================
  if (formData.assinaturaPreposto) {
    yPos = checkPageBreak(pdf, yPos, 75, margin);

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("VALIDAÇÃO DO PREPOSTO", margin, yPos);
    yPos += 8;

    const status = formData.prepostoConfirmado
      ? "✓ APROVADO"
      : "✗ REPROVADO";
    const statusColor = formData.prepostoConfirmado
      ? "#22C55E"
      : "#EF4444";

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(statusColor);
    pdf.text(status, margin, yPos);
    pdf.setTextColor(BLACK);
    yPos += 10;

    if (formData.prepostoComentario) {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Comentário:", margin, yPos);
      yPos += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(TEXT_GRAY);
      const splitComment = pdf.splitTextToSize(
        formData.prepostoComentario,
        contentWidth,
      );
      pdf.text(splitComment, margin, yPos);
      yPos += splitComment.length * 5 + 6;
      pdf.setTextColor(BLACK);
    }

    // Assinatura
    try {
      const imgWidth = 60;
      const imgHeight = 30;
      pdf.addImage(
        formData.assinaturaPreposto,
        "PNG",
        margin,
        yPos,
        imgWidth,
        imgHeight,
      );

      yPos += imgHeight + 3;

      pdf.setDrawColor(BORDER_GRAY);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, margin + imgWidth, yPos);

      pdf.setFontSize(9);
      pdf.setTextColor(TEXT_GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        obra.prepostoNome || "Preposto",
        margin,
        yPos + 4,
      );

      yPos += 8;
    } catch (error) {
      console.error(
        "Erro ao adicionar assinatura do preposto:",
        error,
      );
    }

    if (formData.validadoPrepostoAt) {
      pdf.setFontSize(9);
      pdf.setTextColor(TEXT_GRAY);
      pdf.text(
        `Assinado em: ${format(new Date(formData.validadoPrepostoAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        margin,
        yPos,
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
    pdf.setFont("helvetica", "normal");

    pdf.text(
      `FC Pisos - Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
      margin,
      footerY,
    );

    pdf.text(
      `Pág. ${i} de ${totalPages}`,
      pageWidth - margin,
      footerY,
      { align: "right" },
    );
  }

  // ============================================
  // SALVAR PDF
  // ============================================
  // ✅ CORREÇÃO #7: Usar timezone local para evitar diferença de data
  const dataLocal = new Date(obra.data + "T12:00:00"); // Meio-dia garante mesmo dia independente do fuso
  const diaFormatado = format(
    dataLocal,
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR },
  );

  const fileName = `Laudo_${obra.cliente.replace(/\s+/g, "_")}_${format(new Date(), "dd-MM-yyyy")}.pdf`;

  // Salvar PDF
  pdf.save(fileName);
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function checkPageBreak(
  pdf: jsPDF,
  yPos: number,
  requiredSpace: number,
  margin: number,
): number {
  const pageHeight = pdf.internal.pageSize.getHeight();

  if (yPos + requiredSpace > pageHeight - 20) {
    pdf.addPage();
    return margin + 10;
  }

  return yPos;
}

function getClimaLabel(clima?: string): string {
  if (!clima) return "N/A";
  const labels: Record<string, string> = {
    sol: "☀️ Sol",
    nublado: "☁️ Nublado",
    chuva: "🌧️ Chuva",
    lua: "🌙 Lua",
  };
  return labels[clima] || clima;
}

function hasServiceContent(servico: any): boolean {
  if (!servico) return false;

  return !!(
    servico.horarioInicioManha ||
    servico.horarioFimManha ||
    servico.horarioInicioTarde ||
    servico.horarioFimTarde ||
    servico.local ||
    (servico.etapas &&
      Object.keys(servico.etapas).some((key) => {
        const value = servico.etapas[key];
        return (
          value !== null && value !== undefined && value !== ""
        );
      })) ||
    (servico.registros &&
      Object.keys(servico.registros).length > 0)
  );
}

function getRegistrosTableData(
  registros: any,
): [string, string][] {
  const data: [string, string][] = [];

  const questions = [
    {
      key: "aguaUmidade",
      label: "24. Constatou-se água/umidade no substrato?",
    },
    {
      key: "fechamentoLateral",
      label: "25. As áreas estavam com fechamento lateral?",
    },
    {
      key: "estadoSubstrato",
      label: "26. Estado do substrato",
    },
    {
      key: "contaminacoes",
      label: "27. Existe contaminações/crostas/incrustações?",
    },
    {
      key: "concretoRemontado",
      label: "28. Há concreto remontado sobre bordos?",
    },
    {
      key: "ralosDesnivelados",
      label: "29. Há ralos/canaletas/trilhos desnivelados?",
    },
    {
      key: "boleadoRodapes",
      label:
        "30. O boleado de rodapés/muretas foi executado com concreto?",
    },
    {
      key: "espessuraPiso",
      label: "31. Qual a espessura do piso de concreto?",
    },
    {
      key: "profundidadeCortes",
      label:
        "32. Qual a profundidade dos cortes das juntas serradas?",
    },
    {
      key: "juntasAprofundadas",
      label:
        "33. As juntas serradas do piso foram aprofundadas?",
    },
    {
      key: "juntasDilatacao",
      label: "34. Existem juntas de dilatação no substrato?",
    },
    {
      key: "muretasAncoradas",
      label: "35. As muretas estão ancoradas no piso?",
    },
    {
      key: "muretasApoiadas",
      label:
        "36. Existem muretas apoiadas sobre juntas de dilatação?",
    },
    {
      key: "juntasEsborcinadas",
      label: "37. Existem juntas com bordas esborcinadas?",
    },
    {
      key: "trincasSubstrato",
      label: "38. Existem trincas no substrato?",
    },
  ];

  questions.forEach(({ key, label }) => {
    const registro = registros[key];
    if (registro) {
      let answer = "";

      if (typeof registro === "object") {
        if (registro.resposta !== undefined) {
          answer =
            registro.resposta === "sim"
              ? "Sim"
              : registro.resposta === "nao"
                ? "Não"
                : "N/A";

          if (registro.comentario) {
            answer += ` - ${registro.comentario}`;
          }

          if (registro.valor) {
            answer += ` (${registro.valor})`;
          }
        } else if (registro.texto) {
          answer = registro.texto;
        } else if (registro.ativo) {
          answer = "Sim";
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