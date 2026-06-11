import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Moon,
  Sun,
  LogOut,
  Building2,
  Users,
  BarChart3,
  Filter,
  LayoutGrid,
  LayoutList,
  FolderOpen,
  Link2Off,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  getObras,
  getUsers,
  saveObra,
  deleteObra,
  saveUser,
  deleteUser,
  getAllForms,
  getFormByObraId,
  deleteForm,
  saveForm,
  saveBatchForms,
} from '../utils/database';
import { obraApi, userApi, formularioApi } from '../utils/api';
import {
  getStatusDisplay,
  getStatusDisplayWithFormulario,
  getObraStatusReal,
} from '../utils/diarioHelpers';
import { mergeObras, mergeUsers, normalizeFormularioFromBackend } from '../utils/dataSync';
import { safeLog, safeError, safeWarn } from '../utils/logSanitizer';
import type { Obra, User, UserRole, FormData } from '../types';
import ConfirmModal from './ConfirmModal';
import FcLogo from '../../imports/FcLogo';
import { useToast } from './Toast';
import LoadingSpinner from './LoadingSpinner';
import { Pagination, usePagination } from './Pagination';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { useSafeLogout } from '../hooks/useSafeLogout'; // 🔒 CORREÇÃO #7

// 🚀 LAZY LOADING: Componentes pesados carregados sob demanda
const CreateObraPage = lazy(() => import('./CreateObraPage'));
const CreateUserPage = lazy(() => import('./CreateUserPage'));
const EditObraPage = lazy(() => import('./EditObraPage'));
const EditUserPage = lazy(() => import('./EditUserPage'));
const ViewRespostasModal = lazy(() => import('./ViewRespostasModal'));
const ResultadosDashboard = lazy(() => import('./ResultadosDashboard'));
const FilterModal = lazy(() => import('./FilterModal'));
const ProductionMonitorDashboard = lazy(() =>
  import('./ProductionMonitorDashboard').then((module) => ({
    default: module.ProductionMonitorDashboard,
  }))
); // 🚨 MONITOR

type TabType = 'resultados' | 'obras' | 'usuarios';
type ObraFilter = 'todas' | 'novo' | 'em_andamento' | 'conferencia' | 'concluidas';
type UserFilter = 'todos' | 'Encarregado' | 'Administrador';

// Paleta de cores para avatares
const AVATAR_COLORS = [
  'bg-[#FD5521]', // Laranja FC
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-rose-500',
];

// Função para gerar cor baseada no ID do usuário
const getAvatarColor = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth(); // 🔒 CORREÇÃO #7: logout removido daqui
  const { theme, toggleTheme } = useTheme();
  const { showToast, ToastComponent } = useToast();

  // 🔒 CORREÇÃO #7: Hook de logout seguro v1.1.0
  const { handleLogout, forceLogout, cancelLogout, showLogoutConfirm, pendingCount } =
    useSafeLogout();

  const [activeTab, setActiveTab] = useState<TabType>('resultados');
  const [obras, setObras] = useState<Obra[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formularios, setFormularios] = useState<FormData[]>([]); // 🎯 CORREÇÃO: Cache de formulários para regra de domínio
  const [obraFilter, setObraFilter] = useState<ObraFilter>('todas');
  const [userFilter, setUserFilter] = useState<UserFilter>('todos');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false); // 🆕 CORREÇÃO URGENTE #2: Prevenir loadData simultâneo
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true); // 🎯 SKELETON: Estado de carregamento inicial
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Para desktop apenas
  const [searchObra, setSearchObra] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const [showCreateObra, setShowCreateObra] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingObra, setViewingObra] = useState<Obra | null>(null);
  const [viewingFormData, setViewingFormData] = useState<FormData | null>(null);
  const [deletingObra, setDeletingObra] = useState<Obra | null>(null);
  const [revogandoLinkObra, setRevogandoLinkObra] = useState<Obra | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // 🎯 SKELETON: Estado para obras em criação
  const [creatingSkeleton, setCreatingSkeleton] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewingObra) {
      loadFormData(viewingObra.id);
    }
  }, [viewingObra]);

  // ✅ REMOVIDO: Sincronização automática obsoleta
  // Estratégia nova v1.0.0: backend sempre vence no merge (getMostRecent sempre retorna backend)
  // loadData() já faz revalidação automática quando online

  const handleDeleteObra = async (id: string) => {
    try {
      // Deletar do backend primeiro
      const response = await obraApi.delete(id);

      if (response.success) {
        // Deletar também do IndexedDB local
        await deleteObra(id);
        await deleteForm(id); // Deletar formulário associado
        await loadData();
        setDeletingObra(null);
        showToast('Obra excluída com sucesso!', 'success');
      } else {
        showToast(`Erro ao excluir obra: ${response.error}`, 'error');
      }
    } catch (error: any) {
      safeError('❌ Erro ao excluir obra:', error);
      showToast(`Erro ao excluir obra: ${error.message}`, 'error');
    }
  };

  const handleRevogarLink = async (obra: Obra) => {
    const formulario = formularios.find((f) => f.obra_id === obra.id);
    if (!formulario?.id) {
      showToast('Não foi possível localizar o formulário desta obra.', 'error');
      return;
    }
    try {
      const response = await formularioApi.revogarLink(formulario.id);
      if (response.success) {
        await loadData();
        showToast('Link de conferência revogado com sucesso.', 'success');
      } else {
        showToast(`Erro ao revogar link: ${response.error}`, 'error');
      }
    } catch (error: any) {
      safeError('❌ Erro ao revogar link:', error);
      showToast(`Erro ao revogar link: ${error.message}`, 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    // ✅ CORREÇÃO #5: Validar se usuário é encarregado de alguma obra
    const obrasDoUsuario = obras.filter((o) => o.encarregadoId === id);

    if (obrasDoUsuario.length > 0) {
      const nomeUsuario = deletingUser?.nome || 'Este usuário';
      showToast(
        `❌ Não é possível excluir ${nomeUsuario}. Ele é responsável por ${obrasDoUsuario.length} obra(s). ` +
          `Reatribua as obras antes de excluir.`,
        'error'
      );
      setDeletingUser(null);
      return;
    }

    try {
      // Deletar do backend primeiro
      const response = await userApi.delete(id);

      if (response.success) {
        // Deletar também do IndexedDB local
        await deleteUser(id);
        await loadData();
        setDeletingUser(null);
        showToast('Usuário excluído com sucesso!', 'success');
      } else {
        // Extrair mensagem de erro adequada
        const errorMessage =
          typeof response.error === 'string'
            ? response.error
            : (response.error as any)?.message ||
              JSON.stringify(response.error) ||
              'Erro desconhecido';
        showToast(`Erro ao excluir usuário: ${errorMessage}`, 'error');
      }
    } catch (error: any) {
      safeError('❌ Erro ao excluir usuário:', error);
      const errorMessage = error?.message || String(error) || 'Erro desconhecido';
      showToast(`Erro ao excluir usuário: ${errorMessage}`, 'error');
    }
  };

  const handleCloseModal = () => {
    setViewingObra(null);
    setViewingFormData(null);
  };

  // 🚀 OTIMIZAÇÃO #1: Memoizar filteredObras (recalcula apenas quando dependências mudarem)
  // 🎯 CORREÇÃO: Aplicar regra de domínio no filtro (usar status real)
  const filteredObras = useMemo(() => {
    return obras
      .filter((obra) => {
        if (obraFilter === 'todas') return true;

        // 🎯 REGRA DE DOMÍNIO: Calcular status real baseado no formulário
        const formulario = formularios.find((f) => f.obra_id === obra.id);
        const statusReal = getObraStatusReal(obra, formulario);

        if (obraFilter === 'novo') return statusReal === 'novo';
        if (obraFilter === 'em_andamento')
          return statusReal === 'em_preenchimento' || statusReal === 'reprovado_preposto';
        if (obraFilter === 'conferencia') return statusReal === 'enviado_preposto';
        if (obraFilter === 'concluidas') return statusReal === 'concluido';
        return true;
      })
      .filter(
        (obra) =>
          obra.cliente.toLowerCase().includes(searchObra.toLowerCase()) ||
          obra.obra.toLowerCase().includes(searchObra.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [obras, formularios, obraFilter, searchObra]);

  // 🚀 OTIMIZAÇÃO #1: Memoizar filteredUsers (recalcula apenas quando dependências mudarem)
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        if (userFilter === 'todos') return true;
        return user.tipo === userFilter;
      })
      .filter((user) => user.nome.toLowerCase().includes(searchUser.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [users, userFilter, searchUser]);

  // 🚀 PAGINAÇÃO: Limita renderização a 10 itens por página
  const obrasPagination = usePagination(filteredObras, 10);
  const usersPagination = usePagination(filteredUsers, 10);

  // 🚀 OTIMIZAÇÃO #7: Memoizar Map de usuários para lookup O(1)
  const usersMap = useMemo(() => {
    return new Map(users.map((u) => [u.id, u]));
  }, [users]);

  // 🚀 OTIMIZAÇÃO #1: Memoizar getUserName (evita re-render de componentes filhos)
  const getUserName = useCallback(
    (id: string) => {
      return usersMap.get(id)?.nome || 'N/A'; // ✅ CORREÇÃO #7: O(1) lookup ao invés de O(n)
    },
    [usersMap]
  );

  const loadData = async () => {
    if (isLoadingData) return; // 🆕 CORREÇÃO URGENTE #2: Prevenir loadData simultâneo
    setIsLoadingData(true);
    setIsLoadingDashboard(true); // 🎯 SKELETON: Iniciar carregamento

    try {
      // 🚀 OTIMIZAÇÃO: Disparar carregamento local e remoto em paralelo
      // O local resolve rápido e libera a UI. O remoto atualiza depois.

      // 1. Definição da carga Local
      const loadLocalPromise = (async () => {
        const [localObras, localUsers, localFormularios] = await Promise.all([
          getObras(),
          getUsers(),
          getAllForms(),
        ]);

        // Aplicar dados locais imediatamente para liberar UI
        const obrasValidas = localObras.filter(
          (obra: Obra) =>
            // 🚀 OTIMIZAÇÃO: Filtro único para validar obras
            obra.id && obra.cliente && obra.obra && obra.cidade && obra.encarregadoId
        );

        setObras(obrasValidas);
        setUsers(localUsers);
        setFormularios(localFormularios);

        // 🎯 SKELETON: Desativa skeleton assim que dados locais chegam
        setCreatingSkeleton(false);
        setIsLoadingDashboard(false); // Libera UI
        safeLog(
          `📂 Dados locais carregados: ${obrasValidas.length} obras, ${localUsers.length} usuários`
        );

        return { localObras: obrasValidas, localUsers, localFormularios };
      })();

      // 2. Definição da carga Remota
      const loadRemotePromise = (async () => {
        if (!navigator.onLine) {
          showToast('📡 Modo offline. Exibindo dados locais.', 'warning');
          return;
        }

        try {
          safeLog('🔄 Buscando dados do backend (paralelo)...');

          // Buscar tudo em paralelo
          const [usersResponse, obrasResponse, formulariosResponse] = await Promise.all([
            userApi.list(),
            obraApi.list(),
            formularioApi.list(),
          ]);

          // Processar Usuários (Upsert Merge)
          if (usersResponse.success && usersResponse.data) {
            const remoteUsers = usersResponse.data;
            setUsers((currentUsers) => {
              const userMap = new Map(currentUsers.map((u) => [u.id, u]));
              remoteUsers.forEach((u: User) => userMap.set(u.id, u)); // Atualiza ou insere
              return Array.from(userMap.values());
            });
          }

          // Processar Obras (Upsert Merge)
          if (obrasResponse.success && obrasResponse.data) {
            const remoteObras = obrasResponse.data;
            setObras((currentObras) => {
              const obraMap = new Map(currentObras.map((o) => [o.id, o]));
              remoteObras.forEach((o: Obra) => obraMap.set(o.id, o)); // Atualiza ou insere
              return Array.from(obraMap.values());
            });
          }

          // Processar Formulários (Upsert Merge)
          if (formulariosResponse.success && formulariosResponse.data) {
            const remoteFormulariosRaw = formulariosResponse.data;
            const remoteFormularios = remoteFormulariosRaw.map((f: any) =>
              normalizeFormularioFromBackend(f)
            );

            // 🚀 OTIMIZAÇÃO: Salvar no banco local em bulk (single transaction)
            void saveBatchForms(remoteFormularios).catch((err) =>
              safeWarn('⚠️ Erro ao salvar formulários em cache:', err)
            );

            setFormularios((currentForms) => {
              const formMap = new Map(currentForms.map((f) => [f.obra_id, f]));
              remoteFormularios.forEach((f: FormData) => formMap.set(f.obra_id, f));
              return Array.from(formMap.values());
            });
          }
        } catch (apiError) {
          safeWarn('⚠️ Erro parcial ao buscar backend:', apiError);
          // Não bloqueia UI pois dados locais já estão lá
        }
      })().catch((err) => {
        // 🛡️ ROBUSTEX: Capturar erros não tratados da promise remota
        safeWarn('🚨 Falha crítica no carregamento remoto:', err);
      });

      // Aguardar carga LOCAL para garantir que a UI mostre algo
      // Remoto continua em background se demorar mais
      await loadLocalPromise;
    } catch (error) {
      safeError('❌ Erro crítico ao carregar dashboard:', error);
      // Se falhar tudo (nem local carregar), parar loading
      setIsLoadingDashboard(false);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadFormData = async (obraId: string) => {
    const form = await getFormByObraId(obraId);
    setViewingFormData(form || null);
  };

  // ✅ FASE 2: Simplificado - Apenas validar se formulário existe
  const handleObraClick = async (obra: Obra) => {
    // Verificar se obra está em status que deveria ter formulário
    const statusesComFormulario = ['enviado_preposto', 'reprovado_preposto', 'concluido'];

    if (statusesComFormulario.includes(obra.status)) {
      const form = await getFormByObraId(obra.id);

      if (!form) {
        showToast(
          `⚠️ Formulário não encontrado. Recarregue a página (F5) ou contate o suporte.`,
          'warning'
        );
        return;
      }
    }

    // Abrir modal normalmente
    setViewingObra(obra);
  };

  return (
    <div className="min-h-screen bg-[#EDEFE4] dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FD5521] flex items-center justify-center flex-shrink-0 p-2">
                <FcLogo />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Administrativo</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Sync Status Indicator */}
              <SyncStatusIndicator />

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

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('resultados')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'resultados'
                  ? 'border-[#FD5521] text-[#FD5521]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="hidden md:inline">Resultados</span>
            </button>
            <button
              onClick={() => setActiveTab('obras')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'obras'
                  ? 'border-[#FD5521] text-[#FD5521]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="md:hidden">({isLoadingDashboard ? '—' : obras.length})</span>
              <span className="hidden md:inline">
                Obras ({isLoadingDashboard ? '—' : obras.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'usuarios'
                  ? 'border-[#FD5521] text-[#FD5521]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="md:hidden">({users.length})</span>
              <span className="hidden md:inline">Usuários ({users.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'resultados' ? (
            <motion.div
              key="resultados"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Suspense fallback={<LoadingSpinner />}>
                <ResultadosDashboard obras={obras} />
              </Suspense>
            </motion.div>
          ) : activeTab === 'obras' ? (
            <motion.div
              key="obras"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {/* Header com botões de Filtro e Adicionar */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Obras</h2>
                <div className="flex gap-2">
                  {/* Botão de visualização - apenas desktop */}
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="hidden md:flex w-12 h-12 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors items-center justify-center shadow-md"
                    title={viewMode === 'grid' ? 'Visualizar como lista' : 'Visualizar como cards'}
                  >
                    {viewMode === 'grid' ? (
                      <LayoutList className="w-5 h-5" />
                    ) : (
                      <LayoutGrid className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowFilterDrawer(true)}
                    className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center shadow-md relative"
                  >
                    <Filter className="w-5 h-5" />
                    {(obraFilter !== 'todas' || searchObra.trim() !== '') && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FD5521] rounded-full"></span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateObra(true)}
                    className="w-12 h-12 rounded-full bg-[#FD5521] text-white hover:bg-[#E54A1D] transition-colors flex items-center justify-center shadow-md"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Lista de Obras */}
              {/* Visualização em Cards - Sempre no mobile, opcional no desktop */}
              <div className={`space-y-3 ${viewMode === 'list' ? 'md:hidden' : ''}`}>
                {/* 🎯 SKELETON: Mensagem de carregamento */}
                {isLoadingDashboard && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
                    Carregando obras...
                  </p>
                )}

                {/* 🎯 SKELETON: Cards de carregamento */}
                {isLoadingDashboard &&
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="bg-white dark:bg-gray-900 rounded-xl p-3 animate-pulse"
                    >
                      <div className="rounded-xl px-5 py-4 mb-2.5 bg-gray-200 dark:bg-gray-800">
                        {/* Título skeleton */}
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-3 w-3/4"></div>

                        {/* ID e Data skeleton */}
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3"></div>

                        {/* Info blocks skeleton */}
                        <div className="space-y-2.5">
                          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>

                      {/* Botões skeleton */}
                      <div className="flex gap-2 justify-end mt-2">
                        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                      </div>
                    </div>
                  ))}

                {/* 🎯 SKELETON: Card de obra em criação */}
                {creatingSkeleton && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-900 rounded-xl p-3"
                  >
                    <div className="rounded-xl px-5 py-4 mb-2.5 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 animate-pulse">
                      {/* Título skeleton */}
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3 w-3/4"></div>

                      {/* ID e Data skeleton */}
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-1/3"></div>

                      {/* Informações skeleton */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>

                    {/* Rodapé skeleton */}
                    <div className="flex items-center justify-between px-2.5">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    </div>

                    {/* Texto indicador */}
                    <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                      Criando diário de obra...
                    </div>
                  </motion.div>
                )}

                {/* 🎯 Lista real de obras - só mostra após carregar */}
                {!isLoadingDashboard &&
                  obrasPagination.paginatedItems.map((obra) => {
                    // 🎯 REGRA DE DOMÍNIO: Aplicar status real baseado no formulário
                    const formulario = formularios.find((f) => f.obra_id === obra.id);
                    const status = getStatusDisplayWithFormulario(obra, formulario);
                    const statusReal = getObraStatusReal(obra, formulario);

                    return (
                      <div
                        key={obra.id}
                        onClick={() => handleObraClick(obra)}
                        className="bg-white dark:bg-gray-900 rounded-xl p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all relative"
                      >
                        {/* Container com gradiente */}
                        <div
                          className={`rounded-xl px-5 py-4 mb-2.5 ${
                            statusReal === 'novo'
                              ? 'bg-gradient-to-r from-[#fff5df] to-[#f7e3cc] dark:from-gray-800 dark:to-gray-800'
                              : statusReal === 'enviado_preposto'
                                ? 'bg-gradient-to-r from-[#dbf3f3] to-[#ccdbf7] dark:from-gray-800 dark:to-gray-800'
                                : statusReal === 'concluido'
                                  ? 'bg-gradient-to-r from-[#afffb5] to-[#c1f3ff] dark:from-gray-800 dark:to-gray-800'
                                  : 'bg-gradient-to-r from-[#e7f3db] to-[#ccf7f3] dark:from-gray-800 dark:to-gray-800'
                          }`}
                        >
                          {/* Título da Obra */}
                          <h3 className="font-semibold text-xl leading-6 text-gray-900 dark:text-white mb-3">
                            {obra.cliente} - {obra.obra}
                          </h3>

                          {/* ID e Data */}
                          <p className="font-['Cousine',monospace] text-sm text-gray-900/[0.56] dark:text-gray-400/[0.56] mb-4 tracking-[1px]">
                            #{String(obra.id).slice(-5)} -{' '}
                            {obra.createdAt
                              ? new Date(Number(obra.createdAt)).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit',
                                })
                              : 'N/A'}
                          </p>

                          {/* Informações */}
                          <div className="space-y-2 text-sm leading-normal text-gray-900 dark:text-white">
                            <p>
                              <span className="font-normal">Cidade: </span>
                              <span className="font-semibold">{obra.cidade}</span>
                            </p>
                            <p>
                              <span className="font-normal">Encarregado: </span>
                              <span className="font-semibold">
                                {getUserName(obra.encarregadoId)}
                              </span>
                            </p>
                            <p>
                              <span className="font-normal">Preposto: </span>
                              <span className="font-semibold">
                                {obra.prepostoNome || obra.prepostoEmail || 'N/A'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Rodapé: Status e Ações (fora do gradiente) */}
                        <div className="flex items-center justify-between px-2.5">
                          {/* Badge de Status */}
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-2.5 h-2.5">
                              <svg className="absolute inset-0" viewBox="0 0 18 18" fill="none">
                                <circle
                                  cx="9"
                                  cy="9"
                                  r="5"
                                  className={
                                    status.color.includes('blue')
                                      ? 'fill-blue-600'
                                      : status.color.includes('green')
                                        ? 'fill-green-600'
                                        : status.color.includes('yellow')
                                          ? 'fill-yellow-600'
                                          : status.color.includes('purple')
                                            ? 'fill-purple-600'
                                            : status.color.includes('orange')
                                              ? 'fill-orange-600'
                                              : 'fill-gray-400'
                                  }
                                />
                                <circle
                                  cx="9"
                                  cy="9"
                                  r="7"
                                  className={
                                    status.color.includes('blue')
                                      ? 'stroke-blue-600'
                                      : status.color.includes('green')
                                        ? 'stroke-green-600'
                                        : status.color.includes('yellow')
                                          ? 'stroke-yellow-600'
                                          : status.color.includes('purple')
                                            ? 'stroke-purple-600'
                                            : status.color.includes('orange')
                                              ? 'stroke-orange-600'
                                              : 'stroke-gray-400'
                                  }
                                  strokeOpacity="0.24"
                                  strokeWidth="4"
                                />
                              </svg>
                            </div>
                            <span
                              className={`font-medium text-base leading-normal ${
                                status.color.includes('blue')
                                  ? 'text-blue-600'
                                  : status.color.includes('green')
                                    ? 'text-green-600'
                                    : status.color.includes('yellow')
                                      ? 'text-yellow-600'
                                      : status.color.includes('purple')
                                        ? 'text-purple-600'
                                        : status.color.includes('orange')
                                          ? 'text-orange-600'
                                          : 'text-gray-600'
                              }`}
                            >
                              {status.label}
                            </span>
                          </div>

                          {/* Botões de ação */}
                          <div className="flex gap-[6px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Bloquear edição se obra estiver concluída ou aguardando conferência (usar status REAL)
                                if (
                                  statusReal === 'concluido' ||
                                  statusReal === 'enviado_preposto'
                                ) {
                                  showToast(
                                    `Obras ${statusReal === 'concluido' ? 'concluídas' : 'aguardando conferência'} não podem ser editadas`,
                                    'error'
                                  );
                                  return;
                                }
                                setEditingObra(obra);
                              }}
                              className={`p-2 rounded-[10px] transition-colors ${
                                statusReal === 'concluido' || statusReal === 'enviado_preposto'
                                  ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                              title={
                                statusReal === 'concluido' || statusReal === 'enviado_preposto'
                                  ? `Obras ${statusReal === 'concluido' ? 'concluídas' : 'aguardando conferência'} não podem ser editadas`
                                  : 'Editar'
                              }
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingObra(obra);
                              }}
                              className="p-2 rounded-[10px] hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* 🎯 Empty state - só mostra após carregar */}
                {!isLoadingDashboard &&
                  filteredObras.length === 0 &&
                  (obras.length === 0 ? (
                    <button
                      onClick={() => setShowCreateObra(true)}
                      className="w-full text-center py-12 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-[#FD5521]/10 flex items-center justify-center group-hover:bg-[#FD5521]/20 transition-colors">
                          <Plus className="w-8 h-8 text-[#FD5521]" />
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium mb-1">
                            Nenhuma obra cadastrada
                          </p>
                          <p className="text-sm text-[#FD5521] group-hover:underline">
                            Clique aqui para cadastrar a primeira obra
                          </p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full bg-[#f1f3ea] dark:bg-gray-900/50 rounded-[10px] pt-[48px] pb-[48px]">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-[#e6e8dc] dark:bg-gray-800 flex items-center justify-center">
                          <FolderOpen
                            className="w-8 h-8 text-[#C6CCC2] dark:text-gray-600"
                            strokeWidth={2}
                          />
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <p className="text-[#101828] dark:text-white font-normal text-base leading-6">
                            Nenhuma obra{' '}
                            {obraFilter === 'novo'
                              ? 'nova'
                              : obraFilter === 'em_andamento'
                                ? 'em andamento'
                                : obraFilter === 'conferencia'
                                  ? 'em conferência'
                                  : obraFilter === 'concluidas'
                                    ? 'concluída'
                                    : ''}
                          </p>
                          <p className="text-[#6a7282] dark:text-gray-400 text-sm leading-5">
                            {obraFilter === 'todas'
                              ? 'Nenhuma obra encontrada'
                              : 'Altere o filtro para ver outras obras'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* 🚀 PAGINAÇÃO - Cards View */}
              {filteredObras.length > 0 && (
                <div className={viewMode === 'list' ? 'md:hidden' : ''}>
                  <Pagination
                    currentPage={obrasPagination.currentPage}
                    totalPages={obrasPagination.totalPages}
                    onPageChange={obrasPagination.setCurrentPage}
                    totalItems={obrasPagination.totalItems}
                    itemsPerPage={obrasPagination.itemsPerPage}
                  />
                </div>
              )}

              {/* Visualização em Lista - Desktop apenas */}
              <div
                className={`bg-white dark:bg-gray-900 rounded-lg overflow-hidden ${viewMode === 'list' ? 'hidden md:block' : 'hidden'}`}
              >
                {/* 🎯 SKELETON: Row de obra em criação */}
                {creatingSkeleton && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="px-5 py-4 border-b border-gray-200 dark:border-gray-800"
                  >
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-2/3"></div>
                          <div className="flex items-center gap-6">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </div>
                      <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                        Criando diário de obra...
                      </div>
                    </div>
                  </motion.div>
                )}

                {filteredObras.length > 0 ? (
                  <>
                    {obrasPagination.paginatedItems.map((obra, index) => {
                      // 🎯 REGRA DE DOMÍNIO: Aplicar status real baseado no formulário
                      const formulario = formularios.find((f) => f.obra_id === obra.id);
                      const status = getStatusDisplayWithFormulario(obra, formulario);

                      return (
                        <div key={obra.id}>
                          <div
                            onClick={() => handleObraClick(obra)}
                            className="px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              {/* Info da obra */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                                    {obra.cliente} - {obra.obra}
                                  </h3>
                                  {/* Badge de Status */}
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <div className="relative w-2 h-2">
                                      <svg
                                        className="absolute inset-0"
                                        viewBox="0 0 18 18"
                                        fill="none"
                                      >
                                        <circle
                                          cx="9"
                                          cy="9"
                                          r="5"
                                          className={
                                            status.color.includes('blue')
                                              ? 'fill-blue-600'
                                              : status.color.includes('green')
                                                ? 'fill-green-600'
                                                : status.color.includes('yellow')
                                                  ? 'fill-yellow-600'
                                                  : 'fill-gray-400'
                                          }
                                        />
                                      </svg>
                                    </div>
                                    <span
                                      className={`font-medium text-sm ${
                                        status.color.includes('blue')
                                          ? 'text-blue-600'
                                          : status.color.includes('green')
                                            ? 'text-green-600'
                                            : status.color.includes('yellow')
                                              ? 'text-yellow-600'
                                              : 'text-gray-600'
                                      }`}
                                    >
                                      {status.label}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                  <span>
                                    <span className="font-medium text-gray-900 dark:text-gray-300">
                                      {obra.cidade}
                                    </span>
                                  </span>
                                  <span>•</span>
                                  <span>{getUserName(obra.encarregadoId)}</span>
                                  <span>•</span>
                                  <span>
                                    {new Date(obra.createdAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: '2-digit',
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span className="font-['Cousine',monospace] text-xs">
                                    #{String(obra.id).slice(-5)}
                                  </span>
                                </div>
                              </div>

                              {/* Botões de ação */}
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Bloquear edição se obra estiver concluída ou aguardando conferência
                                    if (
                                      obra.status === 'concluido' ||
                                      obra.status === 'enviado_preposto'
                                    ) {
                                      showToast(
                                        `Obras ${obra.status === 'concluido' ? 'concluídas' : 'aguardando conferência'} não podem ser editadas`,
                                        'error'
                                      );
                                      return;
                                    }
                                    setEditingObra(obra);
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    obra.status === 'concluido' ||
                                    obra.status === 'enviado_preposto'
                                      ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                  }`}
                                  title={
                                    obra.status === 'concluido' ||
                                    obra.status === 'enviado_preposto'
                                      ? `Obras ${obra.status === 'concluido' ? 'concluídas' : 'aguardando conferência'} não podem ser editadas`
                                      : 'Editar'
                                  }
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {obra.status === 'enviado_preposto' &&
                                  (() => {
                                    const form = formularios.find(
                                      (f) => f.obra_id === obra.id
                                    );
                                    const jaRevogado =
                                      form?.linkPrepostoRevogado === true;
                                    return (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (jaRevogado) return;
                                          setRevogandoLinkObra(obra);
                                        }}
                                        disabled={jaRevogado}
                                        className={`p-2 rounded-lg transition-colors ${
                                          jaRevogado
                                            ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
                                            : 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                        }`}
                                        title={
                                          jaRevogado
                                            ? 'Link de conferência já revogado'
                                            : 'Revogar link de conferência'
                                        }
                                      >
                                        <Link2Off className="w-4 h-4" />
                                      </button>
                                    );
                                  })()}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingObra(obra);
                                  }}
                                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {index < obrasPagination.paginatedItems.length - 1 && (
                            <div className="mx-5 border-b border-[#EDEFE4] dark:border-gray-800"></div>
                          )}
                        </div>
                      );
                    })}

                    {/* 🚀 PAGINAÇÃO - List View */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                      <Pagination
                        currentPage={obrasPagination.currentPage}
                        totalPages={obrasPagination.totalPages}
                        onPageChange={obrasPagination.setCurrentPage}
                        totalItems={obrasPagination.totalItems}
                        itemsPerPage={obrasPagination.itemsPerPage}
                      />
                    </div>
                  </>
                ) : obras.length === 0 ? (
                  <button
                    onClick={() => setShowCreateObra(true)}
                    className="w-full text-center py-12 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#FD5521]/10 flex items-center justify-center group-hover:bg-[#FD5521]/20 transition-colors">
                        <Plus className="w-8 h-8 text-[#FD5521]" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium mb-1">
                          Nenhuma obra cadastrada
                        </p>
                        <p className="text-sm text-[#FD5521] group-hover:underline">
                          Clique aqui para cadastrar a primeira obra
                        </p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="w-full bg-[#f1f3ea] dark:bg-gray-900/50 rounded-[10px] pt-[48px] pb-[48px]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#e6e8dc] dark:bg-gray-800 flex items-center justify-center">
                        <FolderOpen
                          className="w-8 h-8 text-[#C6CCC2] dark:text-gray-600"
                          strokeWidth={2}
                        />
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <p className="text-[#101828] dark:text-white font-normal text-base leading-6">
                          Nenhuma obra{' '}
                          {obraFilter === 'novo'
                            ? 'nova'
                            : obraFilter === 'em_andamento'
                              ? 'em andamento'
                              : obraFilter === 'conferencia'
                                ? 'em conferência'
                                : obraFilter === 'concluidas'
                                  ? 'concluída'
                                  : ''}
                        </p>
                        <p className="text-[#6a7282] dark:text-gray-400 text-sm leading-5">
                          {obraFilter === 'todas'
                            ? 'Nenhuma obra encontrada'
                            : 'Altere o filtro para ver outras obras'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="usuarios"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {/* Header com botões de Filtro e Adicionar */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilterDrawer(true)}
                    className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center shadow-md relative"
                  >
                    <Filter className="w-5 h-5" />
                    {(userFilter !== 'todos' || searchUser.trim() !== '') && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FD5521] rounded-full"></span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="w-12 h-12 rounded-full bg-[#FD5521] text-white hover:bg-[#E54A1D] transition-colors flex items-center justify-center shadow-md"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Lista de Usuários */}
              {filteredUsers.length > 0 ? (
                <>
                  <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                    {usersPagination.paginatedItems.map((user, index) => (
                      <div key={user.id}>
                        <div className="px-5 py-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full ${getAvatarColor(user.id)} text-white flex items-center justify-center font-medium flex-shrink-0`}
                            >
                              {user.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {user.nome}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {user.tipo}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                              title="Editar"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        {index < usersPagination.paginatedItems.length - 1 && (
                          <div className="mx-5 border-b border-[#EDEFE4] dark:border-gray-800"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 🚀 PAGINAÇÃO - Usuários */}
                  <Pagination
                    currentPage={usersPagination.currentPage}
                    totalPages={usersPagination.totalPages}
                    onPageChange={usersPagination.setCurrentPage}
                    totalItems={usersPagination.totalItems}
                    itemsPerPage={usersPagination.itemsPerPage}
                  />
                </>
              ) : (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {userFilter === 'todos'
                      ? 'Nenhum usuário encontrado'
                      : `Nenhum ${userFilter === 'Encarregado' ? 'encarregado' : 'administrador'} encontrado`}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modais */}
      <AnimatePresence mode="wait">
        {showCreateObra && (
          <Suspense fallback={<LoadingSpinner />}>
            <CreateObraPage
              users={users}
              onBack={() => setShowCreateObra(false)}
              onSuccess={() => {
                setShowCreateObra(false);
                setCreatingSkeleton(true); // 🎯 Mostra skeleton imediatamente
                loadData(); // Quando carregar, skeleton desaparece automaticamente
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showCreateUser && (
          <Suspense fallback={<LoadingSpinner />}>
            <CreateUserPage
              onBack={() => setShowCreateUser(false)}
              onSuccess={() => {
                loadData();
                setShowCreateUser(false);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {editingObra && (
          <Suspense fallback={<LoadingSpinner />}>
            <EditObraPage
              obra={editingObra}
              users={users}
              onBack={() => setEditingObra(null)}
              onSuccess={() => {
                loadData();
                setEditingObra(null);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {editingUser && (
          <Suspense fallback={<LoadingSpinner />}>
            <EditUserPage
              user={editingUser}
              onBack={() => setEditingUser(null)}
              onSuccess={() => {
                loadData();
                setEditingUser(null);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {viewingObra && (
        <Suspense fallback={<LoadingSpinner />}>
          <ViewRespostasModal
            obra={viewingObra}
            users={users}
            formData={viewingFormData}
            onClose={handleCloseModal}
          />
        </Suspense>
      )}

      {deletingObra && (
        <ConfirmModal
          isOpen={!!deletingObra}
          title="Excluir Obra"
          message={`Deseja realmente excluir a obra "${deletingObra.cliente} - ${deletingObra.obra}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => handleDeleteObra(deletingObra.id)}
          onCancel={() => setDeletingObra(null)}
        />
      )}

      {revogandoLinkObra && (
        <ConfirmModal
          isOpen={!!revogandoLinkObra}
          title="Revogar link de conferência"
          message={`Deseja revogar o link de conferência da obra "${revogandoLinkObra.cliente} - ${revogandoLinkObra.obra}"? O preposto não conseguirá mais acessar nem assinar por este link. Será necessário reenviar a conferência para gerar um novo link.`}
          confirmLabel="Revogar"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => {
            const obra = revogandoLinkObra;
            setRevogandoLinkObra(null);
            handleRevogarLink(obra);
          }}
          onCancel={() => setRevogandoLinkObra(null)}
        />
      )}

      {deletingUser && (
        <ConfirmModal
          isOpen={!!deletingUser}
          title="Excluir Usuário"
          message={`Deseja realmente excluir o usuário "${deletingUser.nome}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => handleDeleteUser(deletingUser.id)}
          onCancel={() => setDeletingUser(null)}
        />
      )}

      {/* Modal de Filtros */}
      <FilterModal
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        type={activeTab === 'obras' ? 'obras' : 'usuarios'}
        currentFilter={activeTab === 'obras' ? obraFilter : userFilter}
        onFilterChange={(filter) => {
          if (activeTab === 'obras') {
            setObraFilter(filter as ObraFilter);
          } else {
            setUserFilter(filter as UserFilter);
          }
        }}
        onSearchChange={(search) => {
          if (activeTab === 'obras') {
            setSearchObra(search);
          } else {
            setSearchUser(search);
          }
        }}
        searchValue={activeTab === 'obras' ? searchObra : searchUser}
      />

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

      {/* Toast Component */}
      {ToastComponent}
    </div>
  );
};

export default AdminDashboard;
