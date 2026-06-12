import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Download, Share2, Check, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusDisplay, getStatusDisplayWithFormulario } from '../utils/diarioHelpers';
import { copyToClipboard } from '../utils/clipboard';
import { safeError } from '../utils/logSanitizer';
import type { Obra, User, FormData } from '../types';
import { ETAPAS } from '../schema/etapas';

/**
 * 🚀 PERFORMANCE: ViewRespostasModal otimizado
 *
 * - useMemo para cálculos de loops aninhados pesados
 * - Evita recalcular listas filtradas a cada render
 * - Dynamic imports para PDF/Excel (~1.6MB removidos do bundle inicial)
 */

interface Props {
  obra: Obra;
  users: User[];
  formData: FormData | null;
  onClose: () => void;
}

// Itens 35-56: Registros Importantes (Estado do Substrato)
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
  'Você relatou ao preposto as desconformidades?',
];

const ViewRespostasModal: React.FC<Props> = ({ obra, users, formData, onClose }) => {
  const [activeServiceTab, setActiveServiceTab] = useState<'servico1' | 'servico2' | 'servico3'>(
    'servico1'
  );
  const [linkCopied, setLinkCopied] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const status = getStatusDisplayWithFormulario(obra, formData);

  // 🎯 TOAST: Fechar modal automaticamente quando não há respostas
  useEffect(() => {
    if (!formData && obra.status === 'novo') {
      toast.info('Esta obra ainda não possui respostas', {
        duration: 3000,
      });
      // Fechar modal após um pequeno delay para o toast aparecer
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formData, obra.status, onClose]);

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
    const user = users.find((u) => u.id === id);
    return user?.nome || 'N/A';
  };

  const handleDownloadPDF = async () => {
    if (!formData) return;

    try {
      setDownloadMenuOpen(false);
      toast.info('Gerando PDF...');

      // Dynamic import para reduzir bundle inicial
      const { generateFormPDF } = await import('../utils/pdfGenerator');
      await generateFormPDF(obra, formData, users);

      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      safeError('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleDownloadExcel = async () => {
    if (!formData) return;

    try {
      setDownloadMenuOpen(false);
      toast.info('Gerando Excel...');

      // Dynamic import para reduzir bundle inicial
      const { generateFormExcel } = await import('../utils/excelGenerator');
      await generateFormExcel(obra, formData, users);

      toast.success('Excel gerado com sucesso!');
    } catch (error) {
      safeError('Erro ao gerar Excel:', error);
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
      sol: 'Sol',
      nublado: 'Nublado',
      chuva: 'Chuva',
      lua: 'Lua',
    };
    return labels[clima] || clima;
  };

  // 🚀 PERFORMANCE: Memoizar cálculo de serviços com conteúdo (evita recalcular loops a cada render)
  const servicosComConteudo = useMemo((): Array<'servico1' | 'servico2' | 'servico3'> => {
    if (!formData) return [];
    const servicosKeys: Array<'servico1' | 'servico2' | 'servico3'> = [
      'servico1',
      'servico2',
      'servico3',
    ];
    return servicosKeys.filter((key) => {
      const servico = formData.servicos[key];
      if (!servico) return false;
      // Verificar se tem algum conteúdo
      return (
        servico.horarioInicioManha ||
        servico.horarioFimManha ||
        servico.horarioInicioTarde ||
        servico.horarioFimTarde ||
        servico.local ||
        Object.keys(servico.etapas || {}).length > 0 ||
        Object.keys(servico.registros || {}).length > 0 ||
        (servico.fotos && servico.fotos.length > 0)
      );
    });
  }, [formData]);

  // 🎯 TOAST: Quando não há formData, o useEffect já mostra toast e fecha o modal
  // Retornar null para não renderizar nada enquanto fecha
  if (!formData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Respostas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{status.label}</p>
          </div>
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
                {linkCopied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
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
                <div className="text-gray-900 dark:text-white">
                  {getUserName(obra.encarregadoId)}
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Preposto:</span>
                <div className="text-gray-900 dark:text-white">
                  {obra.prepostoNome || obra.prepostoEmail || 'N/A'}
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
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Condições Ambientais */}
          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Condições Ambientais
            </h3>
            <div className="text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-900 dark:text-white">
                Manhã: <strong>{getClimaLabel(formData.clima.manha)}</strong>
                {' - '}
                Tarde: <strong>{getClimaLabel(formData.clima.tarde)}</strong>
                {' - '}
                Noite: <strong>{getClimaLabel(formData.clima.noite)}</strong>
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
                    {(servico.horarioInicioManha ||
                      servico.horarioFimManha ||
                      servico.horarioInicioTarde ||
                      servico.horarioFimTarde ||
                      servico.local) && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 text-sm">
                        {/* Horários condensados em uma linha */}
                        {(servico.horarioInicioManha || servico.horarioInicioTarde) && (
                          <div className="flex gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Horários:</span>
                            <span className="text-gray-900 dark:text-white">
                              {servico.horarioInicioManha && servico.horarioFimManha && (
                                <>
                                  Manhã <strong>{servico.horarioInicioManha}</strong> às{' '}
                                  <strong>{servico.horarioFimManha}</strong>
                                </>
                              )}
                              {servico.horarioInicioManha &&
                                servico.horarioFimManha &&
                                servico.horarioInicioTarde &&
                                servico.horarioFimTarde && <> - </>}
                              {servico.horarioInicioTarde && servico.horarioFimTarde && (
                                <>
                                  Tarde <strong>{servico.horarioInicioTarde}</strong> às{' '}
                                  <strong>{servico.horarioFimTarde}</strong>
                                </>
                              )}
                            </span>
                          </div>
                        )}
                        {servico.local && (
                          <div className="flex gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Local:</span>
                            <span className="text-gray-900 dark:text-white">{servico.local}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Etapas - Itens 1 a 34 - MOSTRAR TODOS */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                        Etapas de Execução
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          {ETAPAS.map((etapa, index) => {
                            const numeroItem = index + 1;
                            let valor = servico.etapas?.[etapa.label] || '-';

                            // Tratar campos dualField (formato "valor1|valor2")
                            if (etapa.isDualField && valor !== '-') {
                              const [val1, val2] = valor.split('|');
                              if (val1 || val2) {
                                const unit1 = etapa.units?.[0] || '';
                                const unit2 = etapa.units?.[1] || '';
                                valor = `${val1 || '-'} ${unit1} | ${val2 || '-'} ${unit2}`;
                              }
                            }

                            // Tratar itens com múltipla seleção (formato "tipo1:valor1|tipo2:valor2")
                            if (etapa.isMultiSelect && valor !== '-') {
                              const items = valor.split('|').filter((item) => item);
                              if (items.length > 0) {
                                const tiposValores = items.map((item) => {
                                  const [tipo, valorNum] = item.split(':');

                                  // 🐛 CORREÇÃO: Detectar e processar dual fields dentro de multiselect
                                  if (etapa.label === 'Aplicação de Uretano' && valorNum) {
                                    // Verificar se é um tipo que tem dual field (usa ~)
                                    if (
                                      tipo === 'Uretano para rodapé' ||
                                      tipo === 'Uretano para muretas' ||
                                      tipo === 'Uretano para Paredes' ||
                                      tipo === 'Uretano para Paredes, base e pilares'
                                    ) {
                                      const [val1, val2] = valorNum.split('~');
                                      if (val1 && val2) {
                                        return {
                                          tipo: tipo || '-',
                                          valor: `${val1} ml / ${val2} cm`,
                                        };
                                      }
                                      // Fallback se não tiver o formato dual field
                                      return { tipo: tipo || '-', valor: `${valorNum} ml` };
                                    } else {
                                      // Outros tipos de uretano
                                      return { tipo: tipo || '-', valor: `${valorNum} m²` };
                                    }
                                  } else if (etapa.label === 'Serviços de pintura') {
                                    return { tipo: tipo || '-', valor: `${valorNum} m²` };
                                  } else if (etapa.label === 'Serviços de pintura de layout') {
                                    return { tipo: tipo || '-', valor: `${valorNum} ml` };
                                  }

                                  return { tipo: tipo || '-', valor: valorNum || '-' };
                                });
                                valor =
                                  tiposValores
                                    .filter((tv) => tv.tipo !== '-' && tv.valor !== '-')
                                    .map((tv) => `${tv.tipo}: ${tv.valor}`)
                                    .join(', ') || '-';
                              } else {
                                valor = '-';
                              }
                            }

                            // Determinar se o campo foi preenchido
                            const isPreenchido = valor !== '-';

                            return (
                              <div
                                key={index}
                                className={`flex gap-4 p-3 rounded-lg transition-colors ${
                                  isPreenchido
                                    ? 'bg-white dark:bg-gray-900 border-l-4 border-[#FD5521]'
                                    : 'bg-gray-100/50 dark:bg-gray-800/30 border-l-4 border-gray-300 dark:border-gray-700'
                                }`}
                              >
                                <span
                                  className={`min-w-[40px] font-bold ${
                                    isPreenchido
                                      ? 'text-[#FD5521]'
                                      : 'text-gray-400 dark:text-gray-600'
                                  }`}
                                >
                                  {numeroItem}.
                                </span>
                                <div className="flex-1">
                                  <div
                                    className={`font-medium ${
                                      isPreenchido
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    {etapa.label}
                                  </div>
                                  <div
                                    className={`mt-1 ${
                                      isPreenchido
                                        ? 'text-gray-700 dark:text-gray-300 font-semibold'
                                        : 'text-gray-400 dark:text-gray-600 italic'
                                    }`}
                                  >
                                    {isPreenchido ? (
                                      <>
                                        {valor}
                                        {!etapa.isMultiSelect &&
                                          !etapa.isDualField &&
                                          etapa.unit &&
                                          ` ${etapa.unit}`}
                                      </>
                                    ) : (
                                      'Não preenchido'
                                    )}
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
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                          Fotos ({servico.fotos.length}):
                        </h4>
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

                    {/* Registros Importantes - Itens 35 a 56 - MOSTRAR TODOS */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
                        Estado do Substrato (Itens 35-56):
                      </h4>
                      <div className="space-y-2">
                        {REGISTROS_ITEMS.map((label, index) => {
                          const registroKey = `registro-${index}`;
                          const item = servico.registros?.[registroKey];
                          const numeroItem = 35 + index;

                          // Itens especiais
                          const isEstadoSubstrato = index === 2; // Item 37 (Estado do Substrato)

                          // Itens numéricos/texto (42 e 43)
                          const isNumericField42 =
                            label === 'Qual a espessura do piso de concreto?';
                          const isNumericField43 =
                            label === 'Qual a profundidade dos cortes das juntas serradas?';

                          // Itens que envolvem o preposto (onde SIM é positivo)
                          const isItemPreposto = index === 17 || index === 21; // Itens 52 e 56

                          const isEven = index % 2 === 0;

                          // Para itens de dropdown ou numéricos (37, 42, 43)
                          if (isEstadoSubstrato || isNumericField42 || isNumericField43) {
                            let textoResposta = '-';

                            if (isEstadoSubstrato) {
                              textoResposta = item?.texto || '-';
                            } else if (isNumericField42) {
                              textoResposta = (item as any)?.espessura
                                ? `${(item as any).espessura} cm`
                                : '-';
                            } else if (isNumericField43) {
                              textoResposta = item?.texto ? `${item.texto} cm` : '-';
                            }

                            const comentarioResposta = item?.comentario || '';

                            return (
                              <div
                                key={registroKey}
                                className={`rounded-lg p-4 text-sm ${isEven ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-gray-100/50 dark:bg-gray-800/30'}`}
                              >
                                <div className="font-medium text-gray-900 dark:text-white mb-2">
                                  {numeroItem}. {label}
                                </div>
                                <div
                                  className={`${textoResposta !== '-' ? 'text-gray-700 dark:text-gray-300 font-semibold text-[15px]' : 'text-gray-400 dark:text-gray-600 italic'}`}
                                >
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
                          const isPositivo =
                            resposta === 'NÃO' || (resposta === 'SIM' && isItemPreposto);

                          return (
                            <div
                              key={registroKey}
                              className={`rounded-lg p-4 text-sm ${isEven ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-gray-100/50 dark:bg-gray-800/30'}`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {numeroItem}. {label}
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                    isPositivo
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}
                                >
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

          {/* Validação do Preposto - Mostrar quando houver assinatura (aprovado OU reprovado) */}
          {formData.assinaturaPreposto && (
            <section
              className={`rounded-lg p-4 ${
                formData.prepostoConfirmado
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Validação do Preposto
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full font-medium ${
                      formData.prepostoConfirmado
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {formData.prepostoConfirmado ? '✓ Aprovado' : '✗ Reprovado'}
                  </span>
                </div>
                {formData.nomeCompletoPreposto && (
                  <div className="text-gray-900 dark:text-white">
                    <strong>Nome:</strong> {formData.nomeCompletoPreposto}
                  </div>
                )}
                {formData.prepostoReviewedAt && (
                  <div className="text-gray-600 dark:text-gray-400">
                    {formData.prepostoConfirmado ? 'Aprovado' : 'Reprovado'} em:{' '}
                    {new Date(formData.prepostoReviewedAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
                {formData.prepostoMotivoReprovacao && (
                  <div className="text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded p-3 border border-red-200 dark:border-red-800">
                    <strong>Motivo da Reprovação:</strong>
                    <br />
                    {formData.prepostoMotivoReprovacao}
                  </div>
                )}
                {formData.assinaturaPreposto && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Assinatura do Preposto:
                    </span>
                    <div className="mt-2">
                      <img
                        src={formData.assinaturaPreposto}
                        alt="Assinatura Preposto"
                        className="border border-gray-300 dark:border-gray-600 rounded-lg max-w-xs"
                      />
                    </div>
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
