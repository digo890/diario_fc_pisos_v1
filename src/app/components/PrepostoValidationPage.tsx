import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Building2, Calendar, MapPin, UserRound, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { conferenciaApi } from '../utils/api';
import SignatureCanvas from 'react-signature-canvas';
import { useToast } from './Toast';
import { ETAPAS_V1_0_0 } from '../schema/SCHEMA_V1.0.0';

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
          
          {/* Condições Meteorológicas */}
          {formulario.condicoesMeteorologicas && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Condições Meteorológicas
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Período:</span>
                  <span className="text-gray-900 dark:text-white">{formulario.condicoesMeteorologicas.periodo || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Clima:</span>
                  <span className="text-gray-900 dark:text-white">{formulario.condicoesMeteorologicas.clima || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Serviço Executado */}
          {formulario.servicos && formulario.servicos.length > 0 && formulario.servicos[0] && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Serviço Executado
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3 text-sm">
                {(() => {
                  const servico = formulario.servicos[0];
                  const etapas = servico.etapas || {};
                  
                  return (
                    <>
                      {/* Iterar por TODOS os campos do schema, mostrando preenchidos e não preenchidos */}
                      {ETAPAS_V1_0_0.map((field) => {
                        const valor = etapas[field.dataKey];
                        
                        // Determinar se foi preenchido
                        const isPreenchido = valor && valor !== '' && valor !== '0' && valor !== 'Não';
                        
                        // Renderizar baseado no tipo
                        if (field.tipo === 'simple') {
                          return (
                            <div 
                              key={field.numero} 
                              className={`flex gap-4 p-3 rounded-lg border-l-4 transition-colors ${
                                isPreenchido 
                                  ? 'bg-white dark:bg-gray-900 border-[#FD5521]' 
                                  : 'bg-gray-100/50 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <span className={`min-w-[40px] font-bold ${
                                isPreenchido 
                                  ? 'text-[#FD5521]' 
                                  : 'text-gray-400 dark:text-gray-600'
                              }`}>
                                {field.numero}.
                              </span>
                              <div className="flex-1">
                                <div className={`font-medium ${
                                  isPreenchido 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {field.label}
                                </div>
                                <div className={`mt-1 ${
                                  isPreenchido 
                                    ? 'text-gray-700 dark:text-gray-300 font-semibold' 
                                    : 'text-gray-400 dark:text-gray-600 italic'
                                }`}>
                                  {isPreenchido ? (
                                    <>{valor} {field.unit || ''}</>
                                  ) : (
                                    'Não preenchido'
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        } else if (field.tipo === 'dualField') {
                          const partes = valor ? valor.split('|') : [];
                          const val1 = partes[0] || '';
                          const val2 = partes[1] || '';
                          const isPreenchidoDual = (val1 && val1 !== '0') || (val2 && val2 !== '0');
                          
                          return (
                            <div 
                              key={field.numero} 
                              className={`flex gap-4 p-3 rounded-lg border-l-4 transition-colors ${
                                isPreenchidoDual 
                                  ? 'bg-white dark:bg-gray-900 border-[#FD5521]' 
                                  : 'bg-gray-100/50 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <span className={`min-w-[40px] font-bold ${
                                isPreenchidoDual 
                                  ? 'text-[#FD5521]' 
                                  : 'text-gray-400 dark:text-gray-600'
                              }`}>
                                {field.numero}.
                              </span>
                              <div className="flex-1">
                                <div className={`font-medium ${
                                  isPreenchidoDual 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {field.label}
                                </div>
                                <div className={`mt-1 ${
                                  isPreenchidoDual 
                                    ? 'text-gray-700 dark:text-gray-300 font-semibold' 
                                    : 'text-gray-400 dark:text-gray-600 italic'
                                }`}>
                                  {isPreenchidoDual ? (
                                    <>{val1 || '0'} {field.units?.[0] || ''} | {val2 || '0'} {field.units?.[1] || ''}</>
                                  ) : (
                                    'Não preenchido'
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        } else if (field.tipo === 'multiSelect') {
                          // Para multiSelect, valor é um array de strings
                          const opcoes = Array.isArray(valor) ? valor : [];
                          const isPreenchidoMulti = opcoes.length > 0;
                          
                          return (
                            <div 
                              key={field.numero} 
                              className={`p-3 rounded-lg border-l-4 transition-colors ${
                                isPreenchidoMulti 
                                  ? 'bg-white dark:bg-gray-900 border-[#FD5521]' 
                                  : 'bg-gray-100/50 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex gap-4">
                                <span className={`min-w-[40px] font-bold ${
                                  isPreenchidoMulti 
                                    ? 'text-[#FD5521]' 
                                    : 'text-gray-400 dark:text-gray-600'
                                }`}>
                                  {field.numero}.
                                </span>
                                <div className="flex-1">
                                  <div className={`font-medium mb-1 ${
                                    isPreenchidoMulti 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {field.label}
                                  </div>
                                  {isPreenchidoMulti ? (
                                    <div className="flex flex-wrap gap-1">
                                      {opcoes.map((opcao, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-[#FD5521]/10 text-[#FD5521] rounded text-xs">
                                          {opcao}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 dark:text-gray-600 italic text-sm">
                                      Não preenchido
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Observações */}
          {formulario.observacoes && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Observações Gerais
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {formulario.observacoes}
              </div>
            </div>
          )}
          
          {/* Fotos */}
          {formulario.fotos && formulario.fotos.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Registros Fotográficos
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formulario.fotos.map((foto: any, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img 
                      src={foto.url || foto} 
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
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