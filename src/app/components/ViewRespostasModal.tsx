import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Download, Share2, Check, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusDisplay } from '../utils/diarioHelpers';
import { copyToClipboard } from '../utils/clipboard';
import { generateFormPDF } from '../utils/pdfGenerator';
import { generateFormExcel } from '../utils/excelGenerator';
import type { Obra, User, FormData } from '../types';

/**
 * 🚀 PERFORMANCE: ViewRespostasModal otimizado
 * 
 * - useMemo para cálculos de loops aninhados pesados
 * - Evita recalcular listas filtradas a cada render
 */

interface Props {
  obra: Obra;
  users: User[];
  formData: FormData | null;
  onClose: () => void;
}

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
  { label: 'Aplicação de Uretano', unit: 'm²', isMultiSelect: true }, // Salvo como "tipo1:valor1|tipo2:valor2"
  { label: 'Aplicação de Uretano WR em Muretas', unit: 'ml', isDropdown: true }, // Salvo como "tipo|valor"
  { label: 'Aplicação Rodapés', unit: 'ml', isDropdown: true }, // Salvo como "tipo|valor"
  { label: 'Aplicação de Uretano WR em Paredes', unit: 'ml', isDropdown: true }, // Salvo como "tipo|valor"
  { label: 'Aplicação de uretano em muretas', isDualField: true, units: ['ml', 'cm'] }, // Salvo como "valor1|valor2"
  { label: 'Serviços de pintura', isDropdown: true, unit: 'm²' }, // Salvo como "tipo|valor"
  { label: 'Serviços de pintura de layout', isDropdown: true, unit: 'ml' }, // Salvo como "tipo|valor"
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

const ViewRespostasModal: React.FC<Props> = ({ obra, users, formData, onClose }) => {
  const [activeServiceTab, setActiveServiceTab] = useState<'servico1' | 'servico2' | 'servico3'>('servico1');
  const [linkCopied, setLinkCopied] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  
  const status = getStatusDisplay(obra);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setDownloadMenuOpen(false);
      }
    };

    if (downloadMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [downloadMenuOpen]);

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user?.nome || 'N/A';
  };

  const handleDownloadPDF = async () => {
    if (!formData) return;
    
    try {
      setDownloadMenuOpen(false);
      toast.info('Gerando PDF...');
      await generateFormPDF(obra, formData, users);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleDownloadExcel = async () => {
    if (!formData) return;
    
    try {
      setDownloadMenuOpen(false);
      toast.info('Gerando Excel...');
      await generateFormExcel(obra, formData, users);
      toast.success('Excel gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast.error('Erro ao gerar Excel. Tente novamente.');
    }
  };

  const handleShareLink = async () => {
    if (!obra.validationToken) return;
    
    const link = `${window.location.origin}/conferencia/${obra.validationToken}`;
    const success = await copyToClipboard(link);
    
    if (success) {
      setLinkCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setLinkCopied(false), 2000);
    }
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

  // 🚀 PERFORMANCE: Memoizar cálculo de serviços com conteúdo (evita recalcular loops a cada render)
  const servicosComConteudo = useMemo((): Array<'servico1' | 'servico2' | 'servico3'> => {
    if (!formData) return [];
    const servicosKeys: Array<'servico1' | 'servico2' | 'servico3'> = ['servico1', 'servico2', 'servico3'];
    return servicosKeys.filter(key => {
      const servico = formData.servicos[key];
      if (!servico) return false;
      // Verificar se tem algum conteúdo
      return servico.horario || servico.local || Object.keys(servico.etapas || {}).length > 0 || Object.keys(servico.registros || {}).length > 0 || (servico.fotos && servico.fotos.length > 0);
    });
  }, [formData]);

  if (!formData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sem respostas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Esta obra ainda não possui formulário preenchido.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Respostas do Formulário
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative" ref={downloadMenuRef}>
              <button
                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                className="p-2 rounded-lg bg-[#FD5521] text-white hover:bg-[#E54A1D]"
                title="Baixar"
              >
                <Download className="w-5 h-5" />
              </button>
              {downloadMenuOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg overflow-hidden min-w-[160px] z-20">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    className="w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 border-t border-gray-200 dark:border-gray-800"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              )}
            </div>
            {obra.status === 'enviado_preposto' && obra.validationToken && (
              <button
                onClick={handleShareLink}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
                title={linkCopied ? 'Link copiado!' : 'Compartilhar link'}
              >
                {linkCopied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações da Obra */}
          <section className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Informações da Obra
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
                <div className="text-gray-900 dark:text-white">{obra.cliente}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Obra:</span>
                <div className="text-gray-900 dark:text-white">{obra.obra}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Cidade:</span>
                <div className="text-gray-900 dark:text-white">{obra.cidade}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Data:</span>
                <div className="text-gray-900 dark:text-white">{obra.data}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Encarregado:</span>
                <div className="text-gray-900 dark:text-white">{getUserName(obra.encarregadoId)}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Preposto:</span>
                <div className="text-gray-900 dark:text-white">
                  {obra.prepostoNome || obra.prepostoEmail || obra.prepostoWhatsapp || 'N/A'}
                </div>
              </div>
              {formData.enviadoPrepostoAt && (
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Enviado ao Preposto em:</span>
                  <div className="text-gray-900 dark:text-white">
                    {new Date(formData.enviadoPrepostoAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Status */}
          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Status do Formulário
            </h3>
            <div className="text-sm">
              <span className={`inline-block px-3 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
          </section>

          {/* Condições Ambientais */}
          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Condições Ambientais
            </h3>
            <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex gap-4">
                <span className="text-gray-600 dark:text-gray-400 w-32">Clima Manhã:</span>
                <span className="text-gray-900 dark:text-white">{getClimaLabel(formData.clima.manha)}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600 dark:text-gray-400 w-32">Clima Tarde:</span>
                <span className="text-gray-900 dark:text-white">{getClimaLabel(formData.clima.tarde)}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600 dark:text-gray-400 w-32">Clima Noite:</span>
                <span className="text-gray-900 dark:text-white">{getClimaLabel(formData.clima.noite)}</span>
              </div>
            </div>
          </section>

          {/* Serviços Executados - Só mostrar se houver pelo menos 1 serviço */}
          {servicosComConteudo.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Serviços Executados
              </h3>
              
              {/* Tabs de Serviços - Só mostrar os que têm conteúdo */}
              {servicosComConteudo.length > 1 && (
                <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                  {servicosComConteudo.map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveServiceTab(key)}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        activeServiceTab === key
                          ? 'border-[#FD5521] text-[#FD5521]'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      Serviço {key === 'servico1' ? 1 : key === 'servico2' ? 2 : 3}
                    </button>
                  ))}
                </div>
              )}

              {/* Conteúdo do Serviço Ativo */}
              {servicosComConteudo.map((key) => {
                if (servicosComConteudo.length > 1 && activeServiceTab !== key) return null;
                
                const servico = formData.servicos[key];
                if (!servico) return null;

                return (
                  <div key={key} className="space-y-4">
                    {/* Título do serviço (se houver apenas 1 serviço) */}
                    {servicosComConteudo.length === 1 && (
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Serviço {key === 'servico1' ? 1 : key === 'servico2' ? 2 : 3}
                      </h4>
                    )}

                    {/* Informações Básicas */}
                    {(servico.horario || servico.local) && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 text-sm">
                        {servico.horario && (
                          <div className="flex gap-4">
                            <span className="text-gray-600 dark:text-gray-400 w-24">Horário:</span>
                            <span className="text-gray-900 dark:text-white">{servico.horario}</span>
                          </div>
                        )}
                        {servico.local && (
                          <div className="flex gap-4">
                            <span className="text-gray-600 dark:text-gray-400 w-24">Local:</span>
                            <span className="text-gray-900 dark:text-white">{servico.local}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Etapas - Itens 1 a 37 - MOSTRAR TODOS */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Etapas de Execução (Itens 1-37):</h4>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          {ETAPAS.map((etapa, index) => {
                            const numeroItem = index + 1;
                            let valor = servico.etapas?.[etapa.label] || '-';
                            
                            // Tratar itens com dropdown (formato "tipo|valor")
                            if (etapa.isDropdown && valor !== '-') {
                              const parts = valor.split('|');
                              const tipo = parts[0] || '-';
                              const valorNum = parts[1] || '-';
                              valor = valorNum !== '-' && tipo !== '-' ? `${tipo}: ${valorNum}` : '-';
                            }
                            
                            // Tratar itens com dois campos (formato "valor1|valor2")
                            if (etapa.isDualField && valor !== '-') {
                              const parts = valor.split('|');
                              const valor1 = parts[0] || '-';
                              const valor2 = parts[1] || '-';
                              valor = valor1 !== '-' && valor2 !== '-' ? `${valor1} ${etapa.units[0]}, ${valor2} ${etapa.units[1]}` : '-';
                            }
                            
                            // Tratar itens com múltipla seleção (formato "tipo1:valor1|tipo2:valor2")
                            if (etapa.isMultiSelect && valor !== '-') {
                              const items = valor.split('|').filter(item => item);
                              if (items.length > 0) {
                                const tiposValores = items.map(item => {
                                  const [tipo, valorNum] = item.split(':');
                                  return { tipo: tipo || '-', valor: valorNum || '-' };
                                });
                                valor = tiposValores
                                  .filter(tv => tv.tipo !== '-' && tv.valor !== '-')
                                  .map(tv => `${tv.tipo}: ${tv.valor} ${etapa.unit}`)
                                  .join(', ') || '-';
                              } else {
                                valor = '-';
                              }
                            }
                            
                            return (
                              <div 
                                key={index} 
                                className="flex gap-4 p-3 rounded-lg bg-white dark:bg-gray-900"
                              >
                                <span className="text-gray-600 dark:text-gray-400 min-w-[40px] font-medium">{numeroItem}.</span>
                                <div className="flex-1">
                                  <div className="text-gray-900 dark:text-white font-medium">{etapa.label}</div>
                                  <div className={`${valor !== '-' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                                    {valor}{valor !== '-' && etapa.unit && !etapa.isMultiSelect ? ` ${etapa.unit}` : ''}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Fotos do Serviço */}
                    {servico.fotos && servico.fotos.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Fotos ({servico.fotos.length}):</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {servico.fotos.map((foto, idx) => (
                            <img
                              key={idx}
                              src={foto}
                              alt={`Foto ${idx + 1}`}
                              loading="lazy"
                              decoding="async"
                              className="w-full aspect-square object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Registros Importantes - Itens 39 a 60 - MOSTRAR TODOS */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Estado do Substrato (Itens 39-60):</h4>
                      <div className="space-y-2">
                        {REGISTROS_ITEMS.map((label, index) => {
                          const registroKey = `registro-${index}`;
                          const item = servico.registros?.[registroKey];
                          const numeroItem = 39 + index;
                          
                          // Itens especiais
                          const isEstadoSubstrato = index === 2; // Item 41
                          
                          // Itens que envolvem o preposto (onde SIM é positivo)
                          const isItemPreposto = index === 17 || index === 21; // Itens 56 e 60
                          
                          const isEven = index % 2 === 0;
                          
                          // Para itens de dropdown ou numéricos
                          if (isEstadoSubstrato) {
                            const textoResposta = item?.texto || '-';
                            const comentarioResposta = item?.comentario || '';
                            
                            return (
                              <div key={registroKey} className={`rounded-lg p-4 text-sm ${isEven ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-gray-100/50 dark:bg-gray-800/30'}`}>
                                <div className="font-medium text-gray-900 dark:text-white mb-2">
                                  {numeroItem}. {label}
                                </div>
                                <div className={`${textoResposta !== '-' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                                  {textoResposta}
                                </div>
                                {(comentarioResposta || item?.foto) && (
                                  <div className="flex gap-3 mt-2">
                                    {item?.foto && (
                                      <img
                                        src={item.foto}
                                        alt="Registro"
                                        className="w-1/3 flex-shrink-0 aspect-square object-contain rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                      />
                                    )}
                                    {comentarioResposta && (
                                      <div className="text-gray-600 dark:text-gray-400 text-[15px] flex-1">
                                        <strong>Observações:</strong> {comentarioResposta}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          
                          // Para itens Sim/Não - ativo = true significa "SIM", ausente ou false significa "NÃO"
                          const resposta = item?.ativo ? 'SIM' : 'NÃO';
                          const isPositivo = resposta === 'NÃO' || (resposta === 'SIM' && isItemPreposto);
                          
                          return (
                            <div key={registroKey} className={`rounded-lg p-4 text-sm ${isEven ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-gray-100/50 dark:bg-gray-800/30'}`}>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {numeroItem}. {label}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                  isPositivo
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                  {resposta}
                                </span>
                              </div>
                              
                              {/* Se tiver foto, layout lado a lado */}
                              {item?.foto ? (
                                <div className="flex gap-3 mt-2">
                                  <img
                                    src={item.foto}
                                    alt="Registro"
                                    className="w-1/3 flex-shrink-0 aspect-square object-contain rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                  />
                                  <div className="flex-1 space-y-2">
                                    {item?.texto && (
                                      <div className="text-gray-600 dark:text-gray-400 text-[15px]">
                                        <strong>Detalhes:</strong> {item.texto}
                                      </div>
                                    )}
                                    {item?.comentario && (
                                      <div className="text-gray-600 dark:text-gray-400 text-[15px]">
                                        <strong>Comentário:</strong> {item.comentario}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Se NÃO tiver foto, textos aparecem normalmente */
                                <>
                                  {item?.texto && (
                                    <div className="text-gray-600 dark:text-gray-400 text-[15px] mt-2">
                                      <strong>Detalhes:</strong> {item.texto}
                                    </div>
                                  )}
                                  {item?.comentario && (
                                    <div className="text-gray-600 dark:text-gray-400 text-[15px] mt-2">
                                      <strong>Comentário:</strong> {item.comentario}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Observações Gerais */}
          {formData.observacoes && (
            <section>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Observações Gerais
              </h3>
              <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                {formData.observacoes}
              </div>
            </section>
          )}

          {/* Validação do Preposto */}
          {formData.prepostoConfirmado && (
            <section className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Validação do Preposto
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                    ✓ Validado
                  </span>
                </div>
                {formData.prepostoReviewedAt && (
                  <div className="text-gray-600 dark:text-gray-400">
                    Validado em: {new Date(formData.prepostoReviewedAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                {formData.assinaturaPreposto && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Assinatura do Preposto:</span>
                    <img 
                      src={formData.assinaturaPreposto} 
                      alt="Assinatura Preposto" 
                      className="mt-2 border border-gray-300 dark:border-gray-600 rounded-lg max-w-xs"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Assinatura do Encarregado */}
          {formData.assinaturaEncarregado && (
            <section>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Assinatura do Encarregado
              </h3>
              <img 
                src={formData.assinaturaEncarregado} 
                alt="Assinatura Encarregado" 
                className="border border-gray-300 dark:border-gray-600 rounded-lg max-w-xs"
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewRespostasModal;