import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Moon, Sun, LogOut, ChevronRight, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getObras, getUsers, getAllForms, saveObra, getFormByObraId, saveForm } from '../utils/database';
import { obraApi, formularioApi } from '../utils/api';
import { safeLog, safeError, safeWarn } from '../utils/logSanitizer';
import { useToast } from './Toast';
import { getStatusDisplay } from '../utils/diarioHelpers';
import type { Obra, User } from '../types';
import FcLogo from '../../imports/FcLogo';
import LoadingSpinner from './LoadingSpinner';
import ConfirmModal from './ConfirmModal'; // 🔒 CORREÇÃO #7
import { useSafeLogout } from '../hooks/useSafeLogout'; // 🔒 CORREÇÃO #7

// 🚀 LAZY LOADING: FormularioPage carregado sob demanda
const FormularioPage = lazy(() => import('./FormularioPage'));

const EncarregadoDashboard: React.FC = () => {
  const { currentUser } = useAuth(); // 🔒 CORREÇÃO #7: logout removido daqui
  const { theme, toggleTheme } = useTheme();
  const { showToast, ToastComponent } = useToast();
  
  // 🔒 CORREÇÃO #7: Hook de logout seguro v1.1.0
  const { handleLogout, forceLogout, cancelLogout, showLogoutConfirm, pendingCount } = useSafeLogout();
  
  const [obras, setObras] = useState<Obra[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'novo' | 'em_andamento' | 'enviado_preposto' | 'concluidas'>('todas');

  useEffect(() => {
    loadData();
  }, []);

  // ✅ CORREÇÃO: Validar e corrigir inconsistências antes de abrir formulário
  const handleObraClick = async (obra: Obra) => {
    // Verificar se obra está em status que deveria ter formulário
    const statusesComFormulario = ['enviado_preposto', 'reprovado_preposto', 'concluido'];
    
    if (statusesComFormulario.includes(obra.status)) {
      const form = await getFormByObraId(obra.id);
      
      if (!form) {
        safeWarn(`🐛 Inconsistência de dados na obra ${obra.id}: status=${obra.status} mas formData não existe`);
        safeWarn(`⚠️ Inconsistência detectada: obra "${obra.status}" sem formulário. Tentando recuperar do backend...`);
        
        try {
          // 1️⃣ Tentar buscar formulário do backend
          if (navigator.onLine) {
            safeLog(`🔍 Buscando todos os formulários no backend...`);
            const formularioResponse = await formularioApi.list();
            
            safeLog(`📊 Resposta da API:`, {
              success: formularioResponse.success,
              hasData: !!formularioResponse.data,
              dataLength: formularioResponse.data?.length,
              error: formularioResponse.error
            });
            
            if (formularioResponse.success && formularioResponse.data) {
              safeLog(`🔎 Procurando formulário com obra_id: ${obra.id}`);
              safeLog(`📋 IDs de obras nos formulários:`, formularioResponse.data.map((f: any) => f.obra_id));
              
              const formularioBackend = formularioResponse.data.find((f: any) => f.obra_id === obra.id);
              
              if (formularioBackend) {
                safeLog(`✅ Formulário encontrado no backend:`, formularioBackend);
                await saveForm(formularioBackend);
                
                showToast('✅ Dados recuperados do servidor com sucesso!', 'success');
                setSelectedObra(obra);
                return;
              } else {
                safeWarn(`❌ Formulário com obra_id ${obra.id} não encontrado na lista`);
              }
            } else {
              safeWarn(`❌ Falha ao buscar formulários:`, formularioResponse.error);
            }
          } else {
            safeWarn(`❌ Sem conexão com internet`);
          }
          
          // 2️⃣ Formulário NÃO existe nem no backend - REVERTER STATUS
          safeWarn(`❌ Formulário não encontrado no backend. Revertendo status da obra...`);
          
          const obraCorrigida = {
            ...obra,
            status: 'em_preenchimento' as const,
            progress: 0
          };
          
          await saveObra(obraCorrigida);
          
          if (navigator.onLine) {
            try {
              await obraApi.update(obra.id, {
                status: 'em_preenchimento',
                progress: 0
              });
              safeLog(`✅ Status revertido no backend com sucesso`);
            } catch (backendError) {
              safeError('⚠️ Erro ao atualizar backend:', backendError);
            }
          }
          
          await loadData();
          
          showToast(
            '⚠️ Inconsistência corrigida. Status revertido para "Em Preenchimento". Por favor, preencha e envie o formulário novamente.',
            'warning'
          );
          
          return;
        } catch (error) {
          safeError('❌ Erro ao corrigir inconsistência:', error);
          showToast('❌ Erro ao corrigir dados. Tente novamente ou recarregue a página.', 'error');
          return;
        }
      }
    }
    
    // Tudo ok, abrir formulário normalmente
    setSelectedObra(obra);
  };

  const loadData = async () => {
    const obrasData = await getObras();
    const usersData = await getUsers();
    const allFormsData = await getAllForms();
    
    // Filtrar apenas obras atribuídas a este encarregado
    const minhasObras = obrasData.filter(o => o.encarregadoId === currentUser?.id);
    
    // Verificar status das obras e atualizar se necessário
    const obrasComStatusAtualizado = await Promise.all(
      minhasObras.map(async (obra: Obra) => {
        const formData = allFormsData.find(f => f.obra_id === obra.id); // ✅ CORREÇÃO: obra_id em vez de obraId
        
        // IMPORTANTE: Só atualizar status se for 'novo' → 'em_preenchimento'
        // NÃO sobrescrever status de obras já enviadas (enviado_preposto, concluido, etc)
        if (obra.status === 'novo' && formData && Object.keys(formData).length > 0) {
          const obraAtualizada = { ...obra, status: 'em_preenchimento' as const };
          await saveObra(obraAtualizada);
          return obraAtualizada;
        }
        
        return obra;
      })
    );
    
    setObras(obrasComStatusAtualizado);
    setUsers(usersData);
  };

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user?.nome || 'N/A';
  };

  // Filtrar obras com base no status selecionado
  const obrasFiltradas = obras.filter(obra => {
    if (filtroStatus === 'todas') return true;
    if (filtroStatus === 'novo') return obra.status === 'novo';
    if (filtroStatus === 'em_andamento') return obra.status === 'em_preenchimento';
    if (filtroStatus === 'enviado_preposto') return obra.status === 'enviado_preposto';
    if (filtroStatus === 'concluidas') return obra.status === 'concluido';
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt); // Ordenar por data de criação, mais recentes primeiro

  // Contar obras por status
  const contadores = {
    todas: obras.length,
    novo: obras.filter(o => o.status === 'novo').length,
    em_andamento: obras.filter(o => o.status === 'em_preenchimento').length,
    enviado_preposto: obras.filter(o => o.status === 'enviado_preposto').length,
    concluidas: obras.filter(o => o.status === 'concluido').length
  };

  return (
    <>
      {/* Toast Messages */}
      {ToastComponent}
      
      <AnimatePresence mode="wait">
        {selectedObra ? (
          <motion.div
            key="formulario"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Suspense fallback={<LoadingSpinner />}>
              <FormularioPage
                obra={selectedObra}
                isReadOnly={selectedObra.status !== 'novo' && selectedObra.status !== 'em_preenchimento'}
                onBack={() => {
                  setSelectedObra(null);
                  loadData();
                }}
              />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="min-h-screen bg-[#EDEFE4] dark:bg-gray-950"
          >
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FD5521] flex items-center justify-center flex-shrink-0 p-2">
                      <FcLogo />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Obras
                      </h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                               text-gray-600 dark:text-gray-400"
                      aria-label="Alternar tema claro/escuro"
                    >
                      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                               text-gray-600 dark:text-gray-400"
                      aria-label="Sair do sistema"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Filtros de Status */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setFiltroStatus('todas')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                      filtroStatus === 'todas'
                        ? 'border-[#FD5521] text-[#FD5521]'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Todas ({contadores.todas})
                  </button>
                  <button
                    onClick={() => setFiltroStatus('novo')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                      filtroStatus === 'novo'
                        ? 'border-[#FD5521] text-[#FD5521]'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Nova ({contadores.novo})
                  </button>
                  <button
                    onClick={() => setFiltroStatus('em_andamento')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                      filtroStatus === 'em_andamento'
                        ? 'border-[#FD5521] text-[#FD5521]'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Em andamento ({contadores.em_andamento})
                  </button>
                  <button
                    onClick={() => setFiltroStatus('enviado_preposto')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                      filtroStatus === 'enviado_preposto'
                        ? 'border-[#FD5521] text-[#FD5521]'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Aguardando conferência ({contadores.enviado_preposto})
                  </button>
                  <button
                    onClick={() => setFiltroStatus('concluidas')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                      filtroStatus === 'concluidas'
                        ? 'border-[#FD5521] text-[#FD5521]'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Concluídas ({contadores.concluidas})
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
              <motion.div
                key={filtroStatus}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {obrasFiltradas.map((obra, index) => {
                  const status = getStatusDisplay(obra);
                  
                  // Determinar cor da borda
                  let borderColor = 'border-l-gray-300 dark:border-l-gray-700';
                  if (obra.status === 'novo') borderColor = 'border-l-yellow-500 dark:border-l-yellow-600';
                  if (obra.status === 'em_preenchimento') borderColor = 'border-l-blue-500 dark:border-l-blue-600';
                  if (obra.status === 'enviado_preposto') borderColor = 'border-l-purple-500 dark:border-l-purple-600';
                  if (obra.status === 'concluido') borderColor = 'border-l-green-500 dark:border-l-green-600';
                  
                  return (
                    <motion.div
                      key={obra.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleObraClick(obra)}
                      className={`p-5 cursor-pointer transition-all duration-200 border-l-4 ${borderColor} rounded-xl dark:border dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800`}
                    >
                      {/* Cabeçalho com título e status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight">
                            {obra.cliente} - {obra.obra}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {obra.cidade}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      {/* Informações da obra */}
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div className="space-y-1">
                          <div className="text-gray-500 dark:text-gray-500 text-xs">Data</div>
                          <div className="text-gray-900 dark:text-gray-100 font-medium">{obra.data}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-500 dark:text-gray-500 text-xs">Preposto</div>
                          <div className="text-gray-900 dark:text-gray-100 font-medium truncate">
                            {obra.prepostoNome || obra.prepostoEmail || obra.prepostoWhatsapp || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rodapé */}
                      <div className="flex items-center justify-between text-[#FD5521] hover:text-[#E54A1D] transition-colors pt-3 border-t border-[#EDEFE4] dark:border-gray-700">
                        <span className="font-medium text-sm">Abrir formulário</span>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </motion.div>
                  );
                })}

                {obrasFiltradas.length === 0 && (
                  <div className="text-center py-16">
                    <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[#DDE1D7]" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {obras.length === 0 
                        ? 'Nenhuma obra atribuída a você' 
                        : 'Nenhuma obra encontrada com este filtro'}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 🔒 CORREÇÃO #7: Modal de confirmação de logout com dados pendentes */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Dados não sincronizados"
        message={`Você tem ${pendingCount} operação(ões) aguardando sincronização com o servidor. Se sair agora, esses dados podem ser perdidos. Deseja realmente sair?`}
        confirmLabel="Sair mesmo assim"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={forceLogout}
        onCancel={cancelLogout}
      />
    </>
  );
};

export default EncarregadoDashboard;