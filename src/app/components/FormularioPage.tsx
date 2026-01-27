import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Save, Send, Share2, Copy, Check, MessageCircle, Mail, X } from 'lucide-react';
import { getFormByObraId, saveForm, saveObra } from '../utils/database';
import { obraApi, formularioApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { copyToClipboard } from '../utils/clipboard';
import { sendPrepostoConferenciaEmail } from '../utils/emailApi';
import { checkRateLimit } from '../utils/rateLimiter';
import { safeLog, safeError } from '../utils/logSanitizer';
import { useSessionCheck } from '../hooks/useSessionCheck';
import { debounce } from '../utils/performance';
import { getStatusDisplayWithFormulario } from '../utils/diarioHelpers';
import type { Obra, FormData, ServicoData } from '../types';
import CondicoesAmbientaisSection from './form-sections/CondicoesAmbientaisSection';
import ServicosSection from './form-sections/ServicosSection';
import DadosObraSection from './form-sections/DadosObraSection';
import RegistrosSection from './form-sections/RegistrosSection';
import ObservacoesSection from './form-sections/ObservacoesSection';
import PrepostoCheckSection from './form-sections/PrepostoCheckSection';
import { useToast } from './Toast';

interface Props {
  obra: Obra;
  isReadOnly: boolean;
  isPreposto?: boolean;
  onBack: () => void;
}

const FormularioPage: React.FC<Props> = ({ obra, isReadOnly, isPreposto, onBack }) => {
  const { currentUser } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const { checkSession } = useSessionCheck();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeServico, setActiveServico] = useState<'servico1' | 'servico2' | 'servico3'>('servico1');
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isDirty, setIsDirty] = useState(false); // 🎯 DIRTY FLAG: Controla se há mudanças não salvas

  // Função auxiliar para formatar data
  const formatDataCurta = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // ✅ OTIMIZAÇÃO V2: Auto-save otimizado com dirty flag
  const performAutoSave = useCallback(async (dataToSave: FormData, forceSave = false) => {
    // 🛡️ Proteção: Não salvar se não há mudanças (a menos que seja forçado)
    if (!forceSave && !isDirty) {
      safeLog('⏭️ Auto-save ignorado: sem mudanças (isDirty=false)');
      return;
    }

    // 🛡️ Proteção: Não salvar se já estiver salvando
    if (saving) {
      safeLog('⏭️ Auto-save ignorado: já está salvando');
      return;
    }

    if (!dataToSave) return;

    try {
      setSaving(true);
      setAutoSaveStatus('saving');

      // 🎨 UI/UX: Delay mínimo para garantir que o usuário veja o indicador
      const saveStartTime = Date.now();

      // Atualizar timestamp de última modificação
      const updatedForm = {
        ...dataToSave,
        updatedAt: Date.now()
      };

      // Salvar no IndexedDB
      await saveForm(updatedForm);

      // 🎯 CORREÇÃO: Atualizar status da obra para "em_preenchimento" quando começar a preencher
      if (obra.status === 'novo') {
        // Verificar se há algum dado preenchido (além dos campos padrão)
        const hasData =
          (updatedForm.clima && Object.keys(updatedForm.clima).length > 0) ||
          updatedForm.temperaturaMin ||
          updatedForm.temperaturaMax ||
          updatedForm.umidade ||
          (updatedForm.servicos && Object.keys(updatedForm.servicos).length > 0) ||
          updatedForm.ucrete ||
          updatedForm.horarioInicio ||
          updatedForm.horarioTermino ||
          updatedForm.area ||
          updatedForm.espessura ||
          updatedForm.rodape ||
          updatedForm.estadoSubstrato ||
          updatedForm.estadoSubstratoObs ||
          (updatedForm.registros && Object.keys(updatedForm.registros).length > 0) ||
          updatedForm.observacoes;

        if (hasData) {
          const updatedObra = {
            ...obra,
            status: 'em_preenchimento' as const,
            updatedAt: Date.now()
          };
          await saveObra(updatedObra);
          safeLog('✅ Status da obra atualizado para "em_preenchimento"');
        }
      }

      // 🎨 UI/UX: Garantir que o indicador "Salvando..." apareça por pelo menos 300ms
      const elapsedTime = Date.now() - saveStartTime;
      if (elapsedTime < 300) {
        await new Promise(resolve => setTimeout(resolve, 300 - elapsedTime));
      }

      safeLog('💾 Auto-save: formulário salvo localmente');
      setAutoSaveStatus('saved');
      setIsDirty(false); // 🎯 Limpar dirty flag após salvar com sucesso
      setSaving(false);
    } catch (error) {
      safeError('❌ Erro no auto-save:', error);
      setAutoSaveStatus('idle');
      setSaving(false);
    }
  }, [isDirty, saving, obra]);

  // Criar função debounced (mantém referência estável)
  const debouncedAutoSave = useRef(
    debounce((data: FormData) => performAutoSave(data), 600) // 🎯 OTIMIZADO: 600ms (meio termo 500-800ms)
  ).current;

  // 🏆 OTIMIZAÇÃO HÍBRIDA: onBlur para salvar ao sair do campo
  const handleFieldBlur = useCallback(() => {
    if (formData && !saving && !loading && isDirty) {
      performAutoSave(formData);
      // ❌ REMOVIDO: setAutoSaveStatus('saving') - performAutoSave já controla o status
    }
  }, [formData, saving, loading, isDirty, performAutoSave]);

  useEffect(() => {
    // ✅ CORREÇÃO #5: Adicionar cleanup para evitar memory leak
    let cancelled = false;

    const loadForm = async () => {
      let form = await getFormByObraId(obra.id);

      if (!form) {
        // Criar formulário inicial
        // ✅ CORREÇÃO CRÍTICA: Usar obra_id (snake_case) para consistência com backend
        form = {
          obra_id: obra.id,
          clima: {},
          temperaturaMin: '',
          temperaturaMax: '',
          umidade: '',
          servicos: {},
          ucrete: '',
          horarioInicio: '',
          horarioTermino: '',
          area: '',
          espessura: '',
          rodape: '',
          estadoSubstrato: '',
          estadoSubstratoObs: '',
          registros: {},
          observacoes: '',
          status: 'novo',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: currentUser?.id || ''
        };
        await saveForm(form);
      }

      // ✅ Só atualizar state se componente ainda estiver montado
      if (!cancelled) {
        setFormData(form);
        setLoading(false);
      }
    };

    loadForm();

    // ✅ Cleanup: marcar como cancelado ao desmontar
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Não executar auto-save se não houver formData ou se estiver salvando
    if (!formData || saving || loading || !isDirty) {
      return;
    }

    // Debounce: aguardar 600ms após última edição
    debouncedAutoSave(formData);
    // ❌ REMOVIDO: setAutoSaveStatus('saving') - performAutoSave já controla o status
  }, [formData, saving, loading, isDirty, debouncedAutoSave]);

  // Esconder indicador "saved" após 3 segundos
  useEffect(() => {
    if (autoSaveStatus === 'saved') {
      const timer = setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoSaveStatus]);

  const handleSubmit = async () => {
    if (!formData) return;

    // 🔒 BLOQUEIO LÓGICO: Prevenir múltiplos cliques/submits
    if (saving) return;

    // 🔐 VERIFICAÇÃO DE SESSÃO ANTES DE AÇÃO CRÍTICA
    const sessionCheck = await checkSession();
    if (!sessionCheck.isValid) {
      showToast(sessionCheck.message || 'Sessão expirada', 'error');
      return;
    }

    // ✅ CORREÇÃO: Rate limiting - Evitar envios múltiplos acidentais
    const rateLimitCheck = checkRateLimit({
      key: `enviar-preposto-${obra.id}`,
      limitMs: 60000 // 1 minuto
    });

    if (!rateLimitCheck.allowed) {
      const remainingSeconds = Math.ceil(rateLimitCheck.remainingMs / 1000);
      showToast(`Aguarde ${remainingSeconds}s para reenviar`, 'warning');
      return;
    }

    setSaving(true);

    try {
      if (isPreposto) {
        // Preposto envia para admin
        if (!formData.prepostoConfirmado) {
          showToast('É necessário confirmar a conferência antes de enviar', 'warning');
          setSaving(false);
          return;
        }

        const updatedForm = {
          ...formData,
          status: 'concluido' as const,
          prepostoReviewedAt: Date.now(),
          prepostoReviewedBy: currentUser?.id,
          updatedAt: Date.now()
        };

        await saveForm(updatedForm);
        await saveObra({
          ...obra,
          status: 'concluido',
          progress: 100
        });

        showToast('Formulário enviado para o administrador com sucesso!', 'success');

        // Aguardar um pouco para o usuário ver o toast antes de voltar
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        // Encarregado envia para preposto
        const updatedForm = {
          ...formData,
          status: 'enviado_preposto' as const,
          enviadoPrepostoAt: Date.now(),
          updatedAt: Date.now()
        };

        // Salvar no IndexedDB local
        await saveForm(updatedForm);

        const updatedObra = {
          ...obra,
          status: 'enviado_preposto' as const
        };

        await saveObra(updatedObra);

        // ✅ CORREÇÃO #4: Sincronização BLOQUEANTE - não continuar se falhar
        try {
          if (navigator.onLine) {
            // 🔥 CRÍTICO: Sincronizar FORMULÁRIO com backend
            let formularioId: string | undefined; // ✅ CORREÇÃO: Pode ser undefined inicialmente

            try {
              // Verificar se formulário já existe no backend
              const existingFormularios = await formularioApi.list();
              const existingFormulario = existingFormularios.success
                ? existingFormularios.data?.find((f: any) => f.obra_id === obra.id)
                : null;

              if (existingFormulario) {
                // Atualizar formulário existente
                formularioId = existingFormulario.id;
                await formularioApi.update(formularioId, {
                  ...updatedForm,
                  obra_id: obra.id
                });
                safeLog('✅ Formulário atualizado no backend');
              } else {
                // Criar novo formulário
                formularioId = crypto.randomUUID();

                const payload = {
                  id: formularioId,
                  obra_id: obra.id,
                  ...updatedForm
                };

                await formularioApi.create(payload);
                safeLog(`✅ Formulário criado no backend com ID: ${formularioId}`);
              }
            } catch (formSyncError) {
              safeError('❌ Erro ao sincronizar formulário:', formSyncError);
              throw formSyncError; // Propagar para o catch externo
            }

            // ✅ VALIDAÇÃO: Garantir que formularioId foi definido
            if (!formularioId) {
              throw new Error('ID do formulário não foi gerado corretamente');
            }

            // ✅ CORREÇÃO: Encarregado só pode atualizar STATUS e PROGRESS
            // Backend rejeita tentativas de mudar outros campos (RLS)
            await obraApi.update(obra.id, {
              status: 'enviado_preposto',
              progress: obra.progress || 0
            });
            safeLog('✅ Status sincronizado com backend: enviado_preposto');

            // ✅ Só envia email se sincronização funcionou
            let emailEnviado = false;
            if (obra.prepostoEmail) {
              safeLog('📧 Iniciando envio de email para preposto...');

              const emailResult = await sendPrepostoConferenciaEmail({
                prepostoEmail: obra.prepostoEmail,
                prepostoNome: obra.prepostoNome || 'Preposto',
                formularioId, // ✅ Agora garantidamente definido
                obraNome: obra.obra,
                cliente: obra.cliente,
                cidade: obra.cidade,
                encarregadoNome: currentUser?.nome || 'Encarregado',
              });

              if (emailResult.success) {
                safeLog('✅ Email enviado com sucesso ao preposto');
                emailEnviado = true;
              } else {
                safeError('⚠️ Erro ao enviar email ao preposto:', emailResult.error);
                // ⚠️ Email falhou mas sync funcionou - avisar usuário
                showToast('⚠️ Formulário enviado, mas houve erro ao enviar email. Por favor, envie o link manualmente.', 'warning');
              }
            }

            setSaving(false);

            // ✅ Mensagem baseada no que REALMENTE aconteceu
            if (emailEnviado && obra.prepostoEmail) {
              showToast('Formulário enviado e email enviado ao preposto ✓', 'success');
            } else {
              showToast('Formulário enviado! Compartilhe o link de validação com o preposto.', 'success');
            }

            // Aguardar um pouco para o usuário ver o toast antes de voltar
            setTimeout(() => {
              onBack();
            }, 1500);
          } else {
            // ❌ Sem conexão - alertar usuário e reverter
            showToast('Sem conexão com a internet. Por favor, conecte-se e tente novamente.', 'error');

            // Reverter mudanças locais
            await saveForm(formData);
            await saveObra(obra);

            setSaving(false);
            return; // ❌ NÃO continuar sem sincronizar
          }
        } catch (syncError) {
          safeError('❌ Erro crítico ao sincronizar com backend:', syncError);

          // ❌ Reverter mudanças locais
          await saveForm(formData);
          await saveObra(obra);

          showToast('Erro ao sincronizar com servidor. Tente novamente em alguns instantes.', 'error');
          setSaving(false);
          return; // ❌ NÃO enviar email nem continuar
        }
      }
    } catch (error) {
      safeError('❌ Erro ao enviar formulário:', error);
      showToast('Erro ao enviar formulário. Tente novamente.', 'error');
      setSaving(false);
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    if (!formData) return;

    // Deep merge para evitar compartilhamento de referências entre objetos
    const newFormData = { ...formData };

    // Se está atualizando servicos, fazer deep copy
    if (updates.servicos) {
      // Substituir completamente o objeto servicos (não fazer merge)
      // Isso garante que serviços removidos sejam realmente excluídos
      newFormData.servicos = updates.servicos;

      // Deep copy de cada serviço individualmente
      Object.keys(updates.servicos).forEach(key => {
        const servicoKey = key as 'servico1' | 'servico2' | 'servico3';
        if (updates.servicos![servicoKey]) {
          newFormData.servicos[servicoKey] = {
            ...updates.servicos[servicoKey]!,
            etapas: { ...updates.servicos[servicoKey]!.etapas },
            fotos: updates.servicos[servicoKey]!.fotos ? [...updates.servicos[servicoKey]!.fotos!] : undefined
          };
        }
      });
    }

    // Se está atualizando registros, fazer deep copy
    if (updates.registros) {
      newFormData.registros = { ...updates.registros };
    }

    // Se está atualizando clima, fazer deep copy
    if (updates.clima) {
      newFormData.clima = { ...updates.clima };
    }

    // Aplicar outras atualizações
    Object.keys(updates).forEach(key => {
      if (key !== 'servicos' && key !== 'registros' && key !== 'clima') {
        (newFormData as any)[key] = (updates as any)[key];
      }
    });

    setFormData(newFormData);
    setIsDirty(true); // 🎯 DIRTY FLAG: Marcar como sujo quando há mudanças
  };

  // 🎯 SAVE OBRIGATÓRIO: Trocar aba de serviço
  const handleTabChange = useCallback(async (newTab: 'servico1' | 'servico2' | 'servico3') => {
    // Salvar antes de trocar de aba
    if (formData && isDirty) {
      await performAutoSave(formData, true); // forceSave = true
    }
    setActiveServico(newTab);
  }, [formData, isDirty, performAutoSave]);

  // 🎯 SAVE OBRIGATÓRIO: Voltar (sair do formulário)
  const handleBack = useCallback(async () => {
    // Salvar antes de voltar
    if (formData && isDirty) {
      await performAutoSave(formData, true); // forceSave = true
    }
    onBack();
  }, [formData, isDirty, performAutoSave, onBack]);

  // 🎯 SAVE OBRIGATÓRIO: beforeunload (fechar navegador/aba)
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (formData && isDirty && !isReadOnly) {
        // Salvar síncronamente antes de sair
        await performAutoSave(formData, true);

        // Mostrar aviso ao usuário
        e.preventDefault();
        e.returnValue = ''; // Chrome requer returnValue
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, isDirty, isReadOnly, performAutoSave]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Carregando formulário...</div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Erro ao carregar formulário</div>
      </div>
    );
  }

  // 🎯 REGRA DE DOMÍNIO: Calcular status real baseado no formulário
  const statusDisplay = getStatusDisplayWithFormulario(obra, formData);

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Messages */}
      {ToastComponent}

      {/* ✅ CORREÇÃO #8: Overlay de bloqueio durante envio */}
      {saving && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <svg className="animate-spin h-12 w-12 text-[#FD5521]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Enviando formulário...
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Por favor, aguarde
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {obra.cliente} - {obra.obra}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                <span>{obra.cidade}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                  {statusDisplay.label}
                </span>
                {formData.createdAt && (
                  <>
                    <span>•</span>
                    <span>{formatDataCurta(formData.createdAt)}</span>
                  </>
                )}
              </p>
            </div>

            {/* Botão de compartilhar - só aparece quando status é enviado_preposto */}
            {obra.status === 'enviado_preposto' && obra.validationToken && !isPreposto && (
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-[#FD5521] transition-colors"
                title="Compartilhar link de validação"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Formulário */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* Indicador de Auto-save flutuante */}
        {!isReadOnly && !isPreposto && autoSaveStatus !== 'idle' && (
          <div className={`fixed bottom-20 right-4 px-4 py-2 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 ${autoSaveStatus === 'saving'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            }`}>
            {autoSaveStatus === 'saving' ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">Salvando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Salvo automaticamente</span>
              </>
            )}
          </div>
        )}

        <div className="space-y-8">
          <CondicoesAmbientaisSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
            onBlur={handleFieldBlur}
          />

          <ServicosSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
            isPreposto={isPreposto}
            activeServico={activeServico}
            setActiveServico={handleTabChange}
            onBlur={handleFieldBlur}
          />

          <DadosObraSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
            onBlur={handleFieldBlur}
          />

          <RegistrosSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
            activeServico={activeServico}
            onBlur={handleFieldBlur}
          />

          <ObservacoesSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
            onBlur={handleFieldBlur}
          />

          {isPreposto && (
            <PrepostoCheckSection
              data={formData}
              onChange={updateFormData}
              onSubmit={handleSubmit}
              isSubmitting={saving}
            />
          )}

          {!isReadOnly && !isPreposto && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg 
                       bg-[#FD5521] text-white hover:bg-[#E54A1D] disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar para Preposto
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modal de Compartilhamento */}
      {showShareModal && obra.validationToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 relative">
            {/* Botão fechar - X no canto superior direito */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#FD5521]/10 rounded-full flex items-center justify-center">
                <Share2 className="w-6 h-6 text-[#FD5521]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Compartilhar com Preposto
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {obra.prepostoNome || 'Cliente'}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Caso o envio automático não tenha funcionado, você pode reenviar manualmente:
            </p>

            {/* Link de validação */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link de Validação
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/conferencia/${obra.validationToken}`}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <button
                  onClick={async () => {
                    const success = await copyToClipboard(`${window.location.origin}/conferencia/${obra.validationToken}`);
                    if (success) {
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                      showToast('Link copiado! ✓', 'success');
                    } else {
                      showToast('Não foi possível copiar. Por favor, selecione e copie o texto manualmente.', 'warning');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  {linkCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botões de compartilhamento */}
            <div className="space-y-2">
              {obra.prepostoEmail && (
                <a
                  href={`mailto:${obra.prepostoEmail}?subject=${encodeURIComponent(`Conferência de Formulário - ${obra.cliente}`)}&body=${encodeURIComponent(`Olá!\n\nSegue o link para conferência do formulário da obra ${obra.cliente} - ${obra.obra}:\n\n${window.location.origin}/conferencia/${obra.validationToken}\n\nAtenciosamente,\nFC Pisos`)}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Enviar via Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormularioPage;