import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Send, Share2, Copy, Check, MessageCircle, Mail, X } from 'lucide-react';
import { getFormByObraId, saveForm, saveObra } from '../utils/database';
import { useAuth } from '../contexts/AuthContext';
import { copyToClipboard } from '../utils/clipboard';
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
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeServico, setActiveServico] = useState<'servico1' | 'servico2' | 'servico3'>('servico1');
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Função auxiliar para formatar data
  const formatDataCurta = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    loadForm();
  }, []);

  // Auto-save a cada 3 segundos quando houver mudanças
  useEffect(() => {
    if (!formData || isReadOnly || saving) return;

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData, saving]);

  const loadForm = async () => {
    let form = await getFormByObraId(obra.id);
    
    if (!form) {
      // Criar formulário inicial
      form = {
        obraId: obra.id,
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
    
    setFormData(form);
    setLoading(false);
  };

  const handleAutoSave = async () => {
    if (!formData) return;

    try {
      const updatedForm = {
        ...formData,
        updatedAt: Date.now()
      };
      await saveForm(updatedForm);
      
      // Atualizar progresso da obra e mudar status se necessário
      const progress = calculateProgress(updatedForm);
      
      // Se a obra está como 'novo' e há QUALQUER dado preenchido, mudar para 'em_preenchimento'
      let newStatus = obra.status;
      if (obra.status === 'novo' && hasAnyDataFilled(updatedForm)) {
        newStatus = 'em_preenchimento';
      }
      
      await saveObra({
        ...obra,
        progress,
        status: newStatus
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const hasAnyDataFilled = (form: FormData): boolean => {
    // Verificar se há qualquer campo preenchido no formulário
    return !!(
      form.temperaturaMin ||
      form.temperaturaMax ||
      form.umidade ||
      form.ucrete ||
      form.horarioInicio ||
      form.horarioTermino ||
      form.area ||
      form.espessura ||
      form.rodape ||
      form.estadoSubstrato ||
      form.estadoSubstratoObs ||
      form.observacoes ||
      (form.clima && Object.keys(form.clima).length > 0) ||
      (form.servicos && Object.keys(form.servicos).length > 0) ||
      (form.registros && Object.keys(form.registros).length > 0)
    );
  };

  const calculateProgress = (form: FormData): number => {
    // Progresso baseado apenas nas tabs de serviços
    // Tab 1 = 33%, Tab 2 = 66%, Tab 3 = 100%
    let servicosPreenchidos = 0;

    if (form.servicos.servico1 && Object.keys(form.servicos.servico1).length > 0) {
      servicosPreenchidos++;
    }
    
    if (form.servicos.servico2 && Object.keys(form.servicos.servico2).length > 0) {
      servicosPreenchidos++;
    }
    
    if (form.servicos.servico3 && Object.keys(form.servicos.servico3).length > 0) {
      servicosPreenchidos++;
    }

    // Cada serviço representa 33.33% do total
    return Math.round((servicosPreenchidos / 3) * 100);
  };

  const handleSubmit = async () => {
    if (!formData) return;
    
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
          status: 'enviado_admin' as const,
          prepostoReviewedAt: Date.now(),
          prepostoReviewedBy: currentUser?.id,
          updatedAt: Date.now()
        };

        await saveForm(updatedForm);
        await saveObra({
          ...obra,
          status: 'enviado_admin',
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

        await saveForm(updatedForm);
        await saveObra({
          ...obra,
          status: 'enviado_preposto'
        });

        setSaving(false);
        
        // Simular envio automático
        const mensagem = obra.prepostoWhatsapp ? 'Link enviado via WhatsApp' : 
                        obra.prepostoEmail ? 'Link enviado via Email' : 
                        'Formulário enviado com sucesso';
        
        showToast(`${mensagem} ✓`, 'success');
        
        // Aguardar um pouco para o usuário ver o toast antes de voltar
        setTimeout(() => {
          onBack();
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
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
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Messages */}
      {ToastComponent}
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
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
                {obra.status && (
                  <>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      obra.status === 'novo' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      obra.status === 'em_preenchimento' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                      obra.status === 'enviado_preposto' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                      obra.status === 'enviado_admin' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                      {obra.status === 'novo' ? 'Novo' :
                       obra.status === 'em_preenchimento' ? 'Em andamento' :
                       obra.status === 'enviado_preposto' ? 'Enviado ao Preposto' :
                       obra.status === 'enviado_admin' ? 'Validado' :
                       obra.status}
                    </span>
                  </>
                )}
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
        <div className="space-y-8">
          <CondicoesAmbientaisSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
          />

          <ServicosSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
            isPreposto={isPreposto}
            activeServico={activeServico}
            setActiveServico={setActiveServico}
          />

          <DadosObraSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
          />

          <RegistrosSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
            activeServico={activeServico}
          />

          <ObservacoesSection
            data={formData}
            onChange={updateFormData}
            isReadOnly={isReadOnly || isPreposto}
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg \n                       bg-[#FD5521] text-white hover:bg-[#E54A1D] disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              Enviar para Preposto
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
                  value={`${window.location.origin}/validar/${obra.validationToken}`}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <button
                  onClick={async () => {
                    const success = await copyToClipboard(`${window.location.origin}/validar/${obra.validationToken}`);
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
              {obra.prepostoWhatsapp && (
                <a
                  href={`https://wa.me/55${obra.prepostoWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Segue o link para conferência do formulário da obra ${obra.cliente} - ${obra.obra}:\n\n${window.location.origin}/validar/${obra.validationToken}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar via WhatsApp
                </a>
              )}

              {obra.prepostoEmail && (
                <a
                  href={`mailto:${obra.prepostoEmail}?subject=${encodeURIComponent(`Conferência de Formulário - ${obra.cliente}`)}&body=${encodeURIComponent(`Olá!\n\nSegue o link para conferência do formulário da obra ${obra.cliente} - ${obra.obra}:\n\n${window.location.origin}/validar/${obra.validationToken}\n\nAtenciosamente,\nFC Pisos`)}`}
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