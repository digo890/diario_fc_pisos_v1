# 📋 ESTRUTURA DE NUMERAÇÃO DO FORMULÁRIO - V1.0.0

## Data: 12/01/2026

---

## 🔢 **NUMERAÇÃO COMPLETA DOS ITENS**

### **Total: 56 Itens**
- **Itens 1-34:** Etapas de Execução dos Serviços
- **Itens 35-56:** Registros Importantes (Estado do Substrato)

---

## 📊 **ITENS 1-34: ETAPAS DE EXECUÇÃO DOS SERVIÇOS**

### Campos Simples (24 itens)
1. Temperatura Ambiente (°C)
2. Umidade Relativa do Ar (%)
3. Temperatura do Substrato (°C)
4. Umidade Superficial do Substrato (%)
5. Temperatura da Mistura (°C)
6. Tempo de Mistura (Minutos)
7. Nº dos Lotes da Parte 1
8. Nº dos Lotes da Parte 2
9. Nº dos Lotes da Parte 3
10. Nº de Kits Gastos
11. Consumo Médio Obtido (m²/Kit)
12. Preparo de Substrato (fresagem e ancoragem) (m²/ml)
16. Aplicação de Epóxi (m²)
17. Corte / Selamento Juntas de Piso (ml)
18. Corte / Selamento Juntas em Muretas (ml)
19. Corte / Selamento Juntas em Rodapés (ml)
25. Tratamento de Trincas (ml)
26. Execução de Lábios Poliméricos (ml)
27. Secagem de Substrato (m²)
28. Remoção de Revestimento Antigo (m²)
29. Polimento Mecânico de Substrato (m²)
31. Reparo de Revestimento em Muretas (ml)
32. Reparo de Revestimento em Rodapé (ml)
33. Quantos botijões de gás foram utilizados?
34. Quantas bisnagas de selante foram utilizadas?

### Campos MultiSelect (3 itens)
13. **Aplicação de Uretano (m²)** - 6 opções:
    - Uretano argamassado 4mm
    - Uretano argamassado 6mm
    - Uretano autonivelante
    - Uretano para rodapé
    - Uretano para muretas
    - Uretano para Paredes, base e pilares

14. **Serviços de pintura (m²)** - 3 opções:
    - Pintura em isopainel (parede)
    - Pintura em isopainel (forro)
    - Pintura em alvenaria

15. **Serviços de pintura de layout (ml)** - 8 opções:
    - Faixas de 10cm
    - Faixas de 5cm
    - Faixas de pedestre
    - Caminho seguro
    - Desenho de empilhadeira
    - Desenho de flechas de indicação
    - Desenho de bonecos
    - Desenho de extintor/hidrante

### Campos DualField (6 itens - m² | cm)
20. Remoção de Substrato Fraco (m² | cm)
21. Desbaste de Substrato (m² | cm)
22. Grauteamento (m² | cm)
23. Remoção e Reparo de Sub-Base (m² | cm)
24. Reparo com Concreto Uretânico (m² | cm)
30. Reparo de Revestimento em Piso (m² | cm)

---

## 📝 **ITENS 35-56: REGISTROS IMPORTANTES (ESTADO DO SUBSTRATO)**

### Total: 22 Registros

35. Constatou-se água / umidade no substrato? (SIM/NÃO)
36. As áreas estavam com fechamento lateral? (SIM/NÃO)
37. Estado do substrato (Dropdown: Excelente/Bom/Regular/Ruim/Muito ruim)
38. Existe contaminações / crostas / incrustações no substrato? (SIM/NÃO)
39. Há concreto remontado sobre os bordos de ralos / canaletas / trilhos (ml)? (SIM/NÃO)
40. Há ralos / canaletas / trilhos desnivelados em relação ao substrato (ml)? (SIM/NÃO)
41. O boleado de rodapés / muretas foi executado com concreto? (SIM/NÃO)
42. Qual a espessura do piso de concreto? (Texto/Número)
43. Qual a profundidade dos cortes das juntas serradas? (Texto/Número)
44. As juntas serradas do piso foram aprofundadas por corte adicional? Em que extensão (ml)? (SIM/NÃO)
45. Existem juntas de dilatação no substrato (ml)? (SIM/NÃO)
46. As muretas estão ancoradas no piso? (SIM/NÃO)
47. Existem muretas apoiadas sobre juntas de dilatação no piso? (SIM/NÃO)
48. Existem juntas com bordas esborcinadas (ml)? (SIM/NÃO)
49. Existem trincas no substrato (ml)? (SIM/NÃO)
50. Existem serviços adicionais a serem realizados? (SIM/NÃO)
51. Os serviços adicionais foram liberados pela contratante? (SIM/NÃO)
52. O preposto acompanhou e conferiu as medições? (SIM/NÃO)
53. As áreas concluídas foram protegidas e isoladas? (SIM/NÃO)
54. O substrato foi fotografado? (SIM/NÃO)
55. Ocorreu alguma desconformidade durante ou após as aplicações? (SIM/NÃO)
56. Você relatou ao preposto as desconformidades? (SIM/NÃO)

---

## 💾 **FORMATO DE SALVAMENTO**

### Campos Simples
```typescript
servico.etapas['Temperatura Ambiente'] = "25"
```

### Campos DualField
```typescript
servico.etapas['Remoção de Substrato Fraco'] = "100|5"
// Formato: "valor_m2|valor_cm"
```

### Campos MultiSelect
```typescript
servico.etapas['Aplicação de Uretano'] = "Uretano argamassado 4mm:100|Uretano autonivelante:50"
// Formato: "tipo1:valor1|tipo2:valor2|tipo3:valor3"
```

### Registros Importantes
```typescript
servico.registros['registro-0'] = {
  ativo: true,  // SIM = true, NÃO = false
  texto: "Detalhes adicionais",
  comentario: "Observações",
  foto: "data:image/png;base64,..."
}
```

**Registro Especial (Item 37 - Estado do substrato):**
```typescript
servico.registros['registro-2'] = {
  texto: "Bom",  // Excelente/Bom/Regular/Ruim/Muito ruim
  comentario: "Observações adicionais",
  foto: "data:image/png;base64,..."
}
```

---

## 📄 **EXIBIÇÃO NOS RELATÓRIOS**

### ViewRespostasModal.tsx
- **Seção 1:** Etapas de Execução (Itens 1-34) - Total: 34 campos
- **Seção 2:** Estado do Substrato (Itens 35-56) - Total: 22 registros

### pdfGenerator.ts
- **Seção "SERVIÇOS EXECUTADOS":**
  - Etapas: 1-34 (numerados)
  - Registros Importantes: 35-56 (numerados com labels)

### excelGenerator.ts
- **Aba "Serviço 1/2/3":**
  - Linhas 1-34: Etapas
  - Linhas 35-56: Registros

---

## ✅ **VALIDAÇÃO DA NUMERAÇÃO**

### Checklist de Consistência:
- ✅ ServicosSection.tsx: 34 campos (ETAPAS array)
- ✅ ViewRespostasModal.tsx: 34 ETAPAS + 22 REGISTROS_ITEMS (35-56)
- ✅ pdfGenerator.ts: 34 todasEtapas + 22 REGISTROS_LABELS (35-56)
- ✅ excelGenerator.ts: 34 ETAPAS
- ✅ SCHEMA_V1.0.0.ts: 34 ETAPAS_V1_0_0 (congelado)

### Fórmula de Validação:
```
Total de Itens = Etapas + Registros
56 = 34 + 22 ✅
```

---

## 🚨 **IMPORTANTE PARA MANUTENÇÃO**

### Ao Adicionar Novos Campos:
1. **Etapas de Serviço** (1-34):
   - Atualizar SCHEMA para V1.1.0
   - Novos campos devem começar do número 35 (renumerando registros)

2. **Registros Importantes** (35-56):
   - Adicionar no final da lista (item 57+)
   - Atualizar REGISTROS_LABELS em todos os arquivos

### Arquivos a Atualizar:
1. `/src/app/schema/SCHEMA_V1.X.0.ts` (criar nova versão)
2. `/src/app/components/form-sections/ServicosSection.tsx` (ETAPAS array)
3. `/src/app/components/ViewRespostasModal.tsx` (ETAPAS + REGISTROS_ITEMS)
4. `/src/app/utils/pdfGenerator.ts` (todasEtapas + REGISTROS_LABELS)
5. `/src/app/utils/excelGenerator.ts` (ETAPAS array)

---

## 📊 **ESTATÍSTICAS V1.0.0**

- **Total de Itens:** 56
- **Etapas de Serviço:** 34
  - Simples: 24
  - DualField: 6
  - MultiSelect: 3
- **Registros Importantes:** 22
  - SIM/NÃO: 20
  - Dropdown: 1 (Estado do substrato)
  - Texto/Número: 1 (Espessura do piso)

---

**Documento criado por:** Sistema de Documentação  
**Data:** 12/01/2026  
**Versão do Sistema:** 1.0.0  
**Status:** ✅ APROVADO E VALIDADO
