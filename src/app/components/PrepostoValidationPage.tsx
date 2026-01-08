import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Building2, Calendar, MapPin, UserRound, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getObras, getFormByObraId, saveForm, saveObra, getUsers } from '../utils/database';
import { sendAdminNotificacaoEmail } from '../utils/emailApi';
import { validationApi } from '../utils/api';
import { retryWithBackoff } from '../utils/retryHelper';
import { safeLog, safeError } from '../utils/logSanitizer';
import type { Obra, FormData } from '../types';
import SignatureCanvas from 'react-signature-canvas';
import { useToast } from './Toast';

interface Props {
  token: string;
}

const PrepostoValidationPage: React.FC<Props> = ({ token }) => {
  const { showToast, ToastComponent } = useToast();
  const [loading, setLoading] = useState(true);
  const [obra, setObra] = useState<Obra | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string>('');
  const [validated, setValidated] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  const [validationType, setValidationType] = useState<'aprovar' | 'reprovar' | null>(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Estado para prevenir múltiplos submits

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // ✅ CORREÇÃO: Validar token no backend primeiro
      safeLog('🔍 Validando token no backend...');
      const validationResponse = await retryWithBackoff(
        () => validationApi.getObraByToken(token),
        3, // maxAttempts
        1000 // delayMs
      );
      
      if (!validationResponse.success) {
        setError(validationResponse.error || 'Link inválido ou expirado');
        setLoading(false);
        return;
      }
      
      const obraBackend = validationResponse.data;
      safeLog('✅ Token validado no backend');
      
      // Buscar obra local (sincronizar com backend se necessário)
      const obras = await getObras();
      let obraEncontrada = obras.find(o => o.id === obraBackend.id);
      
      // Se não existe localmente, criar a partir do backend
      if (!obraEncontrada) {
        safeLog('📥 Sincronizando obra do backend para local...', { obraId: obraBackend.id });
        obraEncontrada = {
          id: obraBackend.id,
          cliente: obraBackend.cliente,
          obra: obraBackend.obra,
          cidade: obraBackend.cidade,
          data: obraBackend.data,
          encarregadoId: obraBackend.encarregado_id,
          prepostoNome: obraBackend.preposto_nome,
          prepostoEmail: obraBackend.preposto_email,
          prepostoWhatsapp: obraBackend.preposto_whatsapp,
          validationToken: obraBackend.token_validacao,
          validationTokenExpiry: obraBackend.token_validacao_expiry ? new Date(obraBackend.token_validacao_expiry).getTime() : undefined,
          status: obraBackend.status,
          progress: obraBackend.progress || 0,
          createdAt: new Date(obraBackend.created_at).getTime(),
          createdBy: obraBackend.created_by || '',
        };
        await saveObra(obraEncontrada);
      }

      setObra(obraEncontrada);

      const form = await getFormByObraId(obraEncontrada.id);
      if (!form) {
        setError('Formulário não encontrado ou ainda não foi preenchido');
        setLoading(false);
        return;
      }

      setFormData(form);

      // ✅ SEGURANÇA: Verificar se já foi validado (impedir re-assinatura)
      if (form.prepostoConfirmado) {
        setError('Este formulário já foi assinado anteriormente. Não é possível assinar novamente.');
        setValidated(true);
        setLoading(false);
        return;
      }

      // Verificar se já foi validado (aprovado ou reprovado) - legado
      if (form.status === 'enviado_admin' || form.status === 'reprovado_preposto') {
        setValidated(true);
      }

      setLoading(false);
    } catch (err) {
      safeError('❌ Erro ao carregar dados:', err);
      setError('Erro ao carregar os dados');
      setLoading(false);
    }
  };

  const handleValidate = (tipo: 'aprovar' | 'reprovar') => {
    setValidationType(tipo);
    setShowSignature(true);
  };

  const handleConfirmValidation = async () => {
    // 🔒 BLOQUEIO LÓGICO: Prevenir múltiplos cliques/submits
    if (isSubmitting) return;
    
    if (!signatureRef || signatureRef.isEmpty()) {
      showToast('Por favor, assine para confirmar', 'warning');
      return;
    }

    if (validationType === 'reprovar' && !motivoReprovacao.trim()) {
      showToast('Por favor, informe o motivo da reprovação', 'warning');
      return;
    }

    if (!obra || !formData) return;

    try {
      setIsSubmitting(true); // ✅ Bloquear múltiplos submits

      const assinatura = signatureRef.toDataURL();

      const formAtualizado: FormData = {
        ...formData,
        prepostoConfirmado: validationType === 'aprovar',
        assinaturaPreposto: assinatura,
        prepostoMotivoReprovacao: validationType === 'reprovar' ? motivoReprovacao : undefined,
        prepostoReviewedAt: Date.now(),
        status: validationType === 'aprovar' ? 'enviado_admin' : 'reprovado_preposto'
      };

      await saveForm(formAtualizado);

      const obraAtualizada: Obra = {
        ...obra,
        status: validationType === 'aprovar' ? 'enviado_admin' : 'reprovado_preposto',
        progress: validationType === 'aprovar' ? 85 : 50
      };

      await saveObra(obraAtualizada);

      // Enviar email para todos os admins
      safeLog('📧 Enviando email para administradores...');
      const users = await getUsers();
      const admins = users.filter(u => u.tipo === 'Administrador');
      
      for (const admin of admins) {
        if (admin.email) {
          const emailResult = await sendAdminNotificacaoEmail({
            adminEmail: admin.email,
            adminNome: admin.nome,
            obraNome: `${obra.cliente} - ${obra.obra}`,
            cliente: obra.cliente,
            prepostoNome: obra.prepostoNome || 'Preposto',
            aprovado: validationType === 'aprovar',
          });
          
          if (emailResult.success) {
            safeLog('✅ Email enviado para admin', { adminId: admin.id });
          } else {
            safeError('⚠️ Erro ao enviar email para admin:', emailResult.error);
          }
        }
      }

      setValidated(true);
      setShowSignature(false);
      showToast(validationType === 'aprovar' ? 'Formulário aprovado com sucesso! ✓' : 'Formulário reprovado', 'success');
    } catch (err) {
      showToast('Erro ao salvar validação. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false); // ✅ Liberar após o submit
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
    return (
      <div className="min-h-screen bg-[#EDEFE4] dark:bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {formData?.prepostoConfirmado ? 'Formulário Aprovado!' : 'Formulário Reprovado'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {formData?.prepostoConfirmado 
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

  if (!obra || !formData) return null;

  return (
    <div className="min-h-screen bg-[#EDEFE4] dark:bg-gray-950">
      {/* Toast Messages */}
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

        {/* Preview do Formulário - Versão Simplificada */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            Resumo do Formulário Preenchido
          </h2>
          
          {/* Condições Ambientais */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
              Condições Ambientais
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Temperatura:</span>
                <span className="text-gray-900 dark:text-white">
                  {formData.temperaturaMin}°C - {formData.temperaturaMax}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Umidade:</span>
                <span className="text-gray-900 dark:text-white">{formData.umidade}%</span>
              </div>
            </div>
          </div>

          {/* Dados da Obra */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
              Dados da Obra
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Horário:</span>
                <span className="text-gray-900 dark:text-white">
                  {formData.horarioInicio} - {formData.horarioTermino}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Área:</span>
                <span className="text-gray-900 dark:text-white">{formData.area} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Espessura:</span>
                <span className="text-gray-900 dark:text-white">{formData.espessura} mm</span>
              </div>
            </div>
          </div>

          {/* Observações */}
          {formData.observacoes && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Observações Gerais
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {formData.observacoes}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <p className="text-sm text-yellow-900 dark:text-yellow-300">
              <strong>Nota:</strong> Este é um resumo do formulário. Para visualizar todos os detalhes 
              completos, incluindo etapas de execução e registros fotográficos, entre em contato com a FC Pisos.
            </p>
          </div>
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
                  disabled={isSubmitting} // ✅ Desabilitar botão durante submit
                >
                  Confirmar {validationType === 'aprovar' ? 'Aprovação' : 'Reprovação'}
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