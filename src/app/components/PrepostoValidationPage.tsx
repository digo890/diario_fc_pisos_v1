import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Building2, Calendar, MapPin, UserRound, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { conferenciaApi } from '../utils/api';
import SignatureCanvas from 'react-signature-canvas';
import { useToast } from './Toast';

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
  'Você relatou ao preposto as desconformidades?'
];

interface Props {
  token: string; // Agora é o formularioId direto
}

const PrepostoValidationPage: React.FC<Props> = ({ token: formularioId }) => {
  const { showToast, ToastComponent } = useToast();
  const [loading, setLoading] = useState(true);
  const [formulario, setFormulario] = useState<any>(null);
  const [obra, setObra] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [validated, setValidated] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  const [validationType, setValidationType] = useState<'aprovar' | 'reprovar' | null>(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [formularioId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [CONFERÊNCIA] Buscando formulário:', formularioId);
      
      // ✅ SIMPLES: Uma chamada, retorna formulário + obra
      const response = await conferenciaApi.getFormulario(formularioId);
      
      if (!response.success) {
        setError(response.error || 'Formulário não encontrado');
        setLoading(false);
        return;
      }

      console.log('✅ Dados recebidos:', response.data);
      
      setFormulario(response.data.formulario);
      setObra(response.data.obra);
      
      // Verificar se já foi assinado
      if (response.data.formulario.prepostoConfirmado) {
        setValidated(true);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('❌ Erro ao carregar:', error);
      setError('Erro ao carregar formulário');
      setLoading(false);
    }
  };

  const handleValidate = (tipo: 'aprovar' | 'reprovar') => {
    setValidationType(tipo);
    setShowSignature(true);
  };

  const handleConfirmValidation = async () => {
    if (isSubmitting) return;
    
    if (!signatureRef || signatureRef.isEmpty()) {
      showToast('Por favor, assine para confirmar', 'warning');
      return;
    }

    if (validationType === 'reprovar' && !motivoReprovacao.trim()) {
      showToast('Por favor, informe o motivo da reprovação', 'warning');
      return;
    }

    if (!obra || !formulario) return;

    try {
      setIsSubmitting(true);

      const assinatura = signatureRef.toDataURL();

      console.log('✍️ Enviando assinatura...');

      // ✅ SIMPLES: Uma chamada POST para assinar
      const response = await conferenciaApi.assinarFormulario(formularioId, {
        aprovado: validationType === 'aprovar',
        assinatura,
        motivo: motivoReprovacao || undefined,
      });

      if (!response.success) {
        showToast(response.error || 'Erro ao processar assinatura', 'error');
        return;
      }

      console.log('✅ Assinatura registrada com sucesso');

      // Recarregar dados do formulário para pegar o statusPreposto atualizado
      const responseReload = await conferenciaApi.getFormulario(formularioId);
      if (responseReload.success) {
        setFormulario(responseReload.data.formulario);
      }

      setValidated(true);
      setShowSignature(false);
      showToast(
        validationType === 'aprovar' ? 'Formulário aprovado com sucesso! ✓' : 'Formulário reprovado',
        'success'
      );
    } catch (err) {
      console.error('❌ Erro ao assinar:', err);
      showToast('Erro ao salvar validação. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFE4] dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD5521] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#EDEFE4] dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erro
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (validated) {
    const foiAprovado = formulario?.statusPreposto === 'aprovado';
    
    return (
      <div className="min-h-screen bg-[#EDEFE4] dark:bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className={`w-16 h-16 ${foiAprovado ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {foiAprovado ? (
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {foiAprovado ? 'Formulário Aprovado!' : 'Formulário Reprovado'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {foiAprovado 
              ? 'Sua validação foi registrada com sucesso. A FC Pisos receberá a confirmação.'
              : 'Sua reprovação foi registrada. O encarregado será notificado para realizar as correções necessárias.'
            }
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Validado em: {new Date().toLocaleString('pt-BR')}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!obra || !formulario) return null;

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

  return (
    <div className="min-h-screen bg-[#EDEFE4] dark:bg-gray-950">
      {ToastComponent}
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#FD5521] rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Conferência de Formulário
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Validação de Diário de Obra
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 pb-32">
        {/* Informações da Obra */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            Informações da Obra
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <UserRound className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cliente</div>
                <div className="text-gray-900 dark:text-white font-medium">{obra.cliente}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Obra</div>
                <div className="text-gray-900 dark:text-white font-medium">{obra.obra}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cidade</div>
                <div className="text-gray-900 dark:text-white font-medium">{obra.cidade}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Data</div>
                <div className="text-gray-900 dark:text-white font-medium">{obra.data}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <strong className="block mb-1">Instruções para Conferência</strong>
              Revise cuidadosamente todas as informações do formulário abaixo. Caso tudo esteja correto, 
              clique em "Aprovar". Se houver alguma divergência ou problema, clique em "Reprovar" 
              e informe o motivo.
            </div>
          </div>
        </div>

        {/* Preview do Formulário */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            Dados do Formulário
          </h2>
          
          {/* Condições Ambientais */}
          {formulario.clima && (
            <section>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Condições Ambientais
              </h3>
              <div className="text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-900 dark:text-white">
                  Manhã: <strong>{getClimaLabel(formulario.clima.manha)}</strong>
                  {' - '}
                  Tarde: <strong>{getClimaLabel(formulario.clima.tarde)}</strong>
                  {' - '}
                  Noite: <strong>{getClimaLabel(formulario.clima.noite)}</strong>
                </div>
              </div>
            </section>
          )}

          {/* Serviços Executados */}
          {formulario.servicos && Object.keys(formulario.servicos).some(key => formulario.servicos[key]) && (
            <section>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Serviços Executados
              </h3>
              
              {Object.entries(formulario.servicos).map(([key, servico]: [string, any]) => {
                if (!servico) return null;
                
                return (
                  <div key={key} className="space-y-4 mb-6">
                    {/* Informações Básicas */}
                    {(servico.horarioInicioManha || servico.horarioFimManha || servico.horarioInicioTarde || servico.horarioFimTarde || servico.local) && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 text-sm">
                        {/* Horários condensados em uma linha */}
                        {(servico.horarioInicioManha || servico.horarioInicioTarde) && (
                          <div className="flex gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Horários:</span>
                            <span className="text-gray-900 dark:text-white">
                              {servico.horarioInicioManha && servico.horarioFimManha && (
                                <>Manhã <strong>{servico.horarioInicioManha}</strong> às <strong>{servico.horarioFimManha}</strong></>
                              )}
                              {servico.horarioInicioManha && servico.horarioFimManha && 
                               servico.horarioInicioTarde && servico.horarioFimTarde && (
                                <> - </>
                              )}
                              {servico.horarioInicioTarde && servico.horarioFimTarde && (
                                <>Tarde <strong>{servico.horarioInicioTarde}</strong> às <strong>{servico.horarioFimTarde}</strong></>
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
                        Etapas de Execução (Itens 1-34) - Total: {ETAPAS.length} campos
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
                              const items = valor.split('|').filter(item => item);
                              if (items.length > 0) {
                                const tiposValores = items.map(item => {
                                  const [tipo, valorNum] = item.split(':');
                                  
                                  // Detectar e processar dual fields dentro de multiselect
                                  if (etapa.label === 'Aplicação de Uretano' && valorNum) {
                                    if (tipo === 'Uretano para rodapé' || tipo === 'Uretano para muretas' || 
                                        tipo === 'Uretano para Paredes' || tipo === 'Uretano para Paredes, base e pilares') {
                                      const [val1, val2] = valorNum.split('~');
                                      if (val1 && val2) {
                                        return { tipo: tipo || '-', valor: `${val1} ml / ${val2} cm` };
                                      }
                                      return { tipo: tipo || '-', valor: `${valorNum} ml` };
                                    } else {
                                      return { tipo: tipo || '-', valor: `${valorNum} m²` };
                                    }
                                  } else if (etapa.label === 'Serviços de pintura') {
                                    return { tipo: tipo || '-', valor: `${valorNum} m²` };
                                  } else if (etapa.label === 'Serviços de pintura de layout') {
                                    return { tipo: tipo || '-', valor: `${valorNum} ml` };
                                  }
                                  
                                  return { tipo: tipo || '-', valor: valorNum || '-' };
                                });
                                valor = tiposValores
                                  .filter(tv => tv.tipo !== '-' && tv.valor !== '-')
                                  .map(tv => `${tv.tipo}: ${tv.valor}`)
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
                                <span className={`min-w-[40px] font-bold ${
                                  isPreenchido 
                                    ? 'text-[#FD5521]' 
                                    : 'text-gray-400 dark:text-gray-600'
                                }`}>
                                  {numeroItem}.
                                </span>
                                <div className="flex-1">
                                  <div className={`font-medium ${
                                    isPreenchido 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {etapa.label}
                                  </div>
                                  <div className={`mt-1 ${
                                    isPreenchido 
                                      ? 'text-gray-700 dark:text-gray-300 font-semibold' 
                                      : 'text-gray-400 dark:text-gray-600 italic'
                                  }`}>
                                    {isPreenchido ? (
                                      <>
                                        {valor}
                                        {!etapa.isMultiSelect && !etapa.isDualField && etapa.unit && ` ${etapa.unit}`}
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
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Fotos ({servico.fotos.length}):</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {servico.fotos.map((foto: string, idx: number) => (
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
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Estado do Substrato (Itens 35-56):</h4>
                      <div className="space-y-2">
                        {REGISTROS_ITEMS.map((label, index) => {
                          const registroKey = `registro-${index}`;
                          const item = servico.registros?.[registroKey];
                          const numeroItem = 35 + index;
                          
                          // Itens especiais
                          const isEstadoSubstrato = index === 2; // Item 37
                          
                          // Itens que envolvem o preposto (onde SIM é positivo)
                          const isItemPreposto = index === 17 || index === 21; // Itens 52 e 56
                          
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
          {formulario.observacoes && (
            <section className="mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Observações Gerais
              </h3>
              <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                {formulario.observacoes}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Botões Fixos */}
      {!showSignature && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 z-20">
          <div className="max-w-4xl mx-auto flex gap-3">
            <button
              onClick={() => handleValidate('reprovar')}
              className="flex-1 px-6 py-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Reprovar
            </button>
            <button
              onClick={() => handleValidate('aprovar')}
              className="flex-1 px-6 py-4 rounded-xl bg-[#FD5521] text-white font-medium hover:bg-[#E54A1D] transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Aprovar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Assinatura */}
      {showSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {validationType === 'aprovar' ? 'Aprovar Formulário' : 'Reprovar Formulário'}
              </h3>

              {validationType === 'reprovar' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo da Reprovação *
                  </label>
                  <textarea
                    value={motivoReprovacao}
                    onChange={(e) => setMotivoReprovacao(e.target.value)}
                    placeholder="Descreva o que precisa ser corrigido..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 min-h-[100px] resize-none"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assinatura *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden">
                  <SignatureCanvas
                    ref={(ref) => setSignatureRef(ref)}
                    canvasProps={{
                      className: 'w-full h-48 bg-white dark:bg-gray-800',
                    }}
                  />
                </div>
                <button
                  onClick={() => signatureRef?.clear()}
                  className="mt-2 text-sm text-[#FD5521] hover:text-[#E54A1D]"
                >
                  Limpar assinatura
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSignature(false);
                    setValidationType(null);
                    setMotivoReprovacao('');
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmValidation}
                  className={`flex-1 px-6 py-3 rounded-xl text-white font-medium transition-colors ${
                    validationType === 'aprovar'
                      ? 'bg-[#FD5521] hover:bg-[#E54A1D]'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processando...' : `Confirmar ${validationType === 'aprovar' ? 'Aprovação' : 'Reprovação'}`}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PrepostoValidationPage;