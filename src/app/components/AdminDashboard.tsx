import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Moon, Sun, LogOut, Download, Building2, Users, BarChart3, Bell, Filter, LayoutGrid, LayoutList, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getObras, getUsers, deleteObra as deleteObraLocal, deleteUser as deleteUserLocal, getFormByObraId } from '../utils/database';
import { obraApi, userApi } from '../utils/api';
import { getStatusDisplay } from '../utils/diarioHelpers';
import type { Obra, User, UserRole, FormData } from '../types';
import CreateObraPage from './CreateObraPage';
import CreateUserPage from './CreateUserPage';
import EditObraPage from './EditObraPage';
import EditUserPage from './EditUserPage';
import ViewRespostasModal from './ViewRespostasModal';
import ConfirmModal from './ConfirmModal';
import ResultadosDashboard from './ResultadosDashboard';
import NotificationDrawer, { Notification } from './NotificationDrawer';
import FcLogo from '../../imports/FcLogo';
import { useToast } from './Toast';

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
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast, ToastComponent } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('resultados');
  const [obras, setObras] = useState<Obra[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [obraFilter, setObraFilter] = useState<ObraFilter>('todas');
  const [userFilter, setUserFilter] = useState<UserFilter>('todos');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Para desktop apenas
  
  const [showCreateObra, setShowCreateObra] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingObra, setViewingObra] = useState<Obra | null>(null);
  const [viewingFormData, setViewingFormData] = useState<FormData | null>(null);
  const [deletingObra, setDeletingObra] = useState<Obra | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewingObra) {
      loadFormData(viewingObra.id);
    }
  }, [viewingObra]);
  
  // Generate notifications when obras data changes
  useEffect(() => {
    generateNotifications();
  }, [obras, users]);

  const loadData = async () => {
    try {
      // Primeiro, tentar buscar dados do backend (online)
      if (navigator.onLine) {
        try {
          // Buscar usuários e obras do backend
          const [usersResponse, obrasResponse] = await Promise.all([
            userApi.list(),
            obraApi.list()
          ]);

          // Salvar usuários no IndexedDB local (cache)
          if (usersResponse.success && usersResponse.data) {
            const usersData = usersResponse.data;
            // Salvar cada usuário no IndexedDB
            await Promise.all(
              usersData.map((user: User) => 
                import('../utils/database').then(db => db.saveUser(user))
              )
            );
            setUsers(usersData);
          }

          // Salvar obras no IndexedDB local (cache)
          if (obrasResponse.success && obrasResponse.data) {
            console.log('📊 Dados do backend (ANTES da conversão):', obrasResponse.data[0]);
            
            // Converter dados do backend (snake_case) para frontend (camelCase)
            const obrasData = obrasResponse.data.map((obraBackend: any) => ({
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
              status: obraBackend.status,
              progress: obraBackend.progress || 0,
              createdAt: obraBackend.created_at ? new Date(obraBackend.created_at).getTime() : Date.now(),
              createdBy: obraBackend.created_by
            } as Obra));
            
            console.log('✅ Dados convertidos (DEPOIS da conversão):', obrasData[0]);
            
            // Salvar cada obra no IndexedDB
            await Promise.all(
              obrasData.map((obra: Obra) => 
                import('../utils/database').then(db => db.saveObra(obra))
              )
            );
            setObras(obrasData);
          }

          return; // Sucesso, não precisa continuar
        } catch (apiError) {
          console.warn('⚠️ Erro ao buscar dados do backend, usando cache local:', apiError);
          // Continua para buscar do IndexedDB como fallback
        }
      }

      // Fallback: buscar dados locais do IndexedDB (offline ou erro na API)
      const [obrasData, usersData] = await Promise.all([
        getObras(),
        getUsers()
      ]);
      setObras(obrasData);
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      // Em caso de erro total, mostrar arrays vazios
      setObras([]);
      setUsers([]);
    }
  };

  const loadFormData = async (obraId: string) => {
    const form = await getFormByObraId(obraId);
    setViewingFormData(form || null);
  };
  
  const generateNotifications = async () => {
    const newNotifications: Notification[] = [];
    const storedReadIds = JSON.parse(localStorage.getItem('readNotifications') || '[]') as string[];
    
    for (const obra of obras) {
      // Notificação quando encarregado responde o formulário
      if (obra.status === 'enviado_preposto' || obra.status === 'aprovado_preposto' || 
          obra.status === 'reprovado_preposto' || obra.status === 'enviado_admin' || obra.status === 'concluido') {
        const formData = await getFormByObraId(obra.id);
        if (formData && formData.assinaturaEncarregado) {
          const encarregado = users.find(u => u.id === obra.encarregadoId);
          const notificationId = `form_submitted_${obra.id}`;
          newNotifications.push({
            id: notificationId,
            type: 'form_submitted',
            obraId: obra.id,
            obraNome: `${obra.cliente} - ${obra.obra}`,
            userName: encarregado?.nome || 'Encarregado',
            timestamp: formData.updatedAt || obra.updatedAt,
            read: storedReadIds.includes(notificationId)
          });
        }
      }
      
      // Notificação quando preposto assina o formulário
      if (obra.status === 'aprovado_preposto' || obra.status === 'enviado_admin' || obra.status === 'concluido') {
        const formData = await getFormByObraId(obra.id);
        if (formData && formData.assinaturaPreposto && formData.prepostoConfirmado) {
          const notificationId = `form_signed_${obra.id}`;
          newNotifications.push({
            id: notificationId,
            type: 'form_signed',
            obraId: obra.id,
            obraNome: `${obra.cliente} - ${obra.obra}`,
            userName: obra.prepostoNome || 'Preposto',
            timestamp: formData.prepostoReviewedAt || obra.updatedAt,
            read: storedReadIds.includes(notificationId)
          });
        }
      }
    }
    
    // Sort by timestamp (newest first)
    newNotifications.sort((a, b) => b.timestamp - a.timestamp);
    setNotifications(newNotifications);
  };
  
  const handleNotificationClick = (notification: Notification) => {
    const obra = obras.find(o => o.id === notification.obraId);
    if (obra) {
      setViewingObra(obra);
      setShowNotifications(false);
    }
  };
  
  const handleMarkAsRead = (notificationId: string) => {
    const storedReadIds = JSON.parse(localStorage.getItem('readNotifications') || '[]') as string[];
    if (!storedReadIds.includes(notificationId)) {
      storedReadIds.push(notificationId);
      localStorage.setItem('readNotifications', JSON.stringify(storedReadIds));
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    }
  };
  
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleDeleteObra = async (id: string) => {
    try {
      // Deletar do backend primeiro
      const response = await obraApi.delete(id);
      
      if (response.success) {
        // Deletar também do IndexedDB local
        await deleteObraLocal(id);
        await loadData();
        setDeletingObra(null);
        showToast('Obra excluída com sucesso!', 'success');
      } else {
        showToast(`Erro ao excluir obra: ${response.error}`, 'error');
      }
    } catch (error: any) {
      console.error('❌ Erro ao excluir obra:', error);
      showToast(`Erro ao excluir obra: ${error.message}`, 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      // Deletar do backend primeiro
      const response = await userApi.delete(id);
      
      if (response.success) {
        // Deletar também do IndexedDB local
        await deleteUserLocal(id);
        await loadData();
        setDeletingUser(null);
        showToast('Usuário excluído com sucesso!', 'success');
      } else {
        showToast(`Erro ao excluir usuário: ${response.error}`, 'error');
      }
    } catch (error: any) {
      console.error('❌ Erro ao excluir usuário:', error);
      showToast(`Erro ao excluir usuário: ${error.message}`, 'error');
    }
  };

  const handleCloseModal = () => {
    setViewingObra(null);
    setViewingFormData(null);
  };

  const filteredObras = obras
    .filter(obra => {
      if (obraFilter === 'todas') return true;
      if (obraFilter === 'novo') return obra.status === 'novo';
      if (obraFilter === 'em_andamento') return obra.status === 'em_preenchimento' || obra.status === 'reprovado_preposto';
      if (obraFilter === 'conferencia') return obra.status === 'enviado_preposto';
      if (obraFilter === 'concluidas') return obra.status === 'enviado_admin' || obra.status === 'concluido';
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const filteredUsers = users
    .filter(user => {
      if (userFilter === 'todos') return true;
      return user.tipo === userFilter;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user?.nome || 'N/A';
  };

  // Contar obras concluídas
  const obrasConcluidas = obras.filter(o => o.status === 'concluido').length;

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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Administrativo
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
                onClick={() => setShowNotifications(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 \n                         text-gray-600 dark:text-gray-400 relative"
                title="Notificações"
                aria-label={`Notificações (${unreadNotificationsCount})`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FD5521] text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <button
                onClick={logout}
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
              <span className="md:hidden">({obras.length})</span>
              <span className="hidden md:inline">Obras ({obras.length})</span>
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
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ResultadosDashboard obras={obras} />
            </motion.div>
          ) : activeTab === 'obras' ? (
            <motion.div
              key="obras"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
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
                    {viewMode === 'grid' ? <LayoutList className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setShowFilterDrawer(true)}
                    className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center shadow-md relative"
                  >
                    <Filter className="w-5 h-5" />
                    {obraFilter !== 'todas' && (
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
                {filteredObras.map(obra => {
                  const status = getStatusDisplay(obra);
                  
                  return (
                    <div
                      key={obra.id}
                      onClick={() => setViewingObra(obra)}
                      className="bg-white dark:bg-gray-900 rounded-xl p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all relative"
                    >
                      {/* Container com gradiente */}
                      <div className={`rounded-xl px-6 py-6 mb-3 ${
                        obra.status === 'novo'
                          ? 'bg-gradient-to-r from-[#fff5df] to-[#f7e3cc] dark:from-gray-800 dark:to-gray-800'
                          : obra.status === 'enviado_preposto' 
                          ? 'bg-gradient-to-r from-[#dbf3f3] to-[#ccdbf7] dark:from-gray-800 dark:to-gray-800'
                          : obra.status === 'enviado_admin' || obra.status === 'concluido'
                          ? 'bg-gradient-to-r from-[#afffb5] to-[#c1f3ff] dark:from-gray-800 dark:to-gray-800'
                          : 'bg-gradient-to-r from-[#e7f3db] to-[#ccf7f3] dark:from-gray-800 dark:to-gray-800'
                      }`}>
                        {/* Título da Obra */}
                        <h3 className="font-semibold text-2xl leading-[27px] text-gray-900 dark:text-white mb-[15px]">
                          {obra.cliente} - {obra.obra}
                        </h3>
                        
                        {/* ID e Data */}
                        <p className="font-['Cousine',monospace] text-sm text-gray-900/[0.56] dark:text-gray-400/[0.56] mb-[21px] tracking-[1px]">
                          #{String(obra.id).slice(-5)} - {obra.createdAt ? new Date(Number(obra.createdAt)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A'}
                        </p>
                        
                        {/* Informações */}
                        <div className="space-y-3 text-lg leading-5 text-gray-900 dark:text-white">
                          <p>
                            <span className="font-normal">Cidade: </span>
                            <span className="font-semibold">{obra.cidade}</span>
                          </p>
                          <p>
                            <span className="font-normal">Encarregado: </span>
                            <span className="font-semibold">{getUserName(obra.encarregadoId)}</span>
                          </p>
                          <p>
                            <span className="font-normal">Preposto: </span>
                            <span className="font-semibold">{obra.prepostoNome || obra.prepostoEmail || obra.prepostoWhatsapp || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                      
                      {/* Rodapé: Status e Ações (fora do gradiente) */}
                      <div className="flex items-center justify-between px-3">
                        {/* Badge de Status */}
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-2.5 h-2.5">
                            <svg className="absolute inset-0" viewBox="0 0 18 18" fill="none">
                              <circle cx="9" cy="9" r="5" className={status.color.includes('blue') ? 'fill-blue-600' : status.color.includes('green') ? 'fill-green-600' : status.color.includes('yellow') ? 'fill-yellow-600' : 'fill-gray-400'} />
                              <circle cx="9" cy="9" r="7" className={status.color.includes('blue') ? 'stroke-blue-600' : status.color.includes('green') ? 'stroke-green-600' : status.color.includes('yellow') ? 'stroke-yellow-600' : 'stroke-gray-400'} strokeOpacity="0.24" strokeWidth="4" />
                            </svg>
                          </div>
                          <span className={`font-medium text-base leading-normal ${
                            status.color.includes('blue') ? 'text-blue-600' : 
                            status.color.includes('green') ? 'text-green-600' : 
                            status.color.includes('yellow') ? 'text-yellow-600' : 
                            'text-gray-600'
                          }`}>
                            {status.label}
                          </span>
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex gap-[6px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingObra(obra);
                            }}
                            className="p-2 rounded-[10px] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                            title="Editar"
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

                {filteredObras.length === 0 && (
                  <button
                    onClick={() => setShowCreateObra(true)}
                    className="w-full text-center py-12 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#FD5521]/10 flex items-center justify-center group-hover:bg-[#FD5521]/20 transition-colors">
                        <Plus className="w-8 h-8 text-[#FD5521]" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium mb-1">Nenhuma obra encontrada</p>
                        <p className="text-sm text-[#FD5521] group-hover:underline">Clique aqui para cadastrar a primeira obra</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Visualização em Lista - Desktop apenas */}
              <div className={`bg-white dark:bg-gray-900 rounded-lg overflow-hidden ${viewMode === 'list' ? 'hidden md:block' : 'hidden'}`}>
                {filteredObras.length > 0 ? (
                  filteredObras.map((obra, index) => {
                    const status = getStatusDisplay(obra);
                    
                    return (
                      <div key={obra.id}>
                        <div
                          onClick={() => setViewingObra(obra)}
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
                                    <svg className="absolute inset-0" viewBox="0 0 18 18" fill="none">
                                      <circle cx="9" cy="9" r="5" className={status.color.includes('blue') ? 'fill-blue-600' : status.color.includes('green') ? 'fill-green-600' : status.color.includes('yellow') ? 'fill-yellow-600' : 'fill-gray-400'} />
                                    </svg>
                                  </div>
                                  <span className={`font-medium text-sm ${
                                    status.color.includes('blue') ? 'text-blue-600' : 
                                    status.color.includes('green') ? 'text-green-600' : 
                                    status.color.includes('yellow') ? 'text-yellow-600' : 
                                    'text-gray-600'
                                  }`}>
                                    {status.label}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                <span>
                                  <span className="font-medium text-gray-900 dark:text-gray-300">{obra.cidade}</span>
                                </span>
                                <span>•</span>
                                <span>{getUserName(obra.encarregadoId)}</span>
                                <span>•</span>
                                <span>{new Date(obra.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
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
                                  setEditingObra(obra);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
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
                        {index < filteredObras.length - 1 && (
                          <div className="mx-5 border-b border-[#EDEFE4] dark:border-gray-800"></div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <button
                    onClick={() => setShowCreateObra(true)}
                    className="w-full text-center py-12 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#FD5521]/10 flex items-center justify-center group-hover:bg-[#FD5521]/20 transition-colors">
                        <Plus className="w-8 h-8 text-[#FD5521]" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium mb-1">Nenhuma obra encontrada</p>
                        <p className="text-sm text-[#FD5521] group-hover:underline">Clique aqui para cadastrar a primeira obra</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="usuarios"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
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
                    {userFilter !== 'todos' && (
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
                <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                  {filteredUsers.map((user, index) => (
                    <div key={user.id}>
                      <div className="px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.id)} text-white flex items-center justify-center font-medium flex-shrink-0`}>
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
                      {index < filteredUsers.length - 1 && (
                        <div className="mx-5 border-b border-[#EDEFE4] dark:border-gray-800"></div>
                      )}
                    </div>
                  ))}
                </div>
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
          <CreateObraPage
            users={users}
            onBack={() => setShowCreateObra(false)}
            onSuccess={() => {
              loadData();
              setShowCreateObra(false);
            }}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {showCreateUser && (
          <CreateUserPage
            onBack={() => setShowCreateUser(false)}
            onSuccess={() => {
              loadData();
              setShowCreateUser(false);
            }}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {editingObra && (
          <EditObraPage
            obra={editingObra}
            users={users}
            onBack={() => setEditingObra(null)}
            onSuccess={() => {
              loadData();
              setEditingObra(null);
            }}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {editingUser && (
          <EditUserPage
            user={editingUser}
            onBack={() => setEditingUser(null)}
            onSuccess={() => {
              loadData();
              setEditingUser(null);
            }}
          />
        )}
      </AnimatePresence>
      
      {viewingObra && (
        <ViewRespostasModal
          obra={viewingObra}
          users={users}
          formData={viewingFormData}
          onClose={handleCloseModal}
        />
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

      {/* Bottom Drawer de Filtros */}
      {showFilterDrawer && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowFilterDrawer(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-8"
          >
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Filtrar {activeTab === 'obras' ? 'Obras' : 'Usuários'}
            </h3>

            {activeTab === 'obras' ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setObraFilter('todas');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    obraFilter === 'todas'
                      ? 'bg-[#FD5521] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => {
                    setObraFilter('novo');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    obraFilter === 'novo'
                      ? 'bg-[#FD5521] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Novo
                </button>
                <button
                  onClick={() => {
                    setObraFilter('em_andamento');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    obraFilter === 'em_andamento'
                      ? 'bg-[#FD5521] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Em andamento
                </button>
                <button
                  onClick={() => {
                    setObraFilter('conferencia');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    obraFilter === 'conferencia'
                      ? 'bg-[#FD5521] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Conferência
                </button>
                <button
                  onClick={() => {
                    setObraFilter('concluidas');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    obraFilter === 'concluidas'
                      ? 'bg-[#FD5521] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Concluídas
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setUserFilter('todos');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    userFilter === 'todos'
                      ? 'bg-[#FD5521] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => {
                    setUserFilter('Encarregado');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    userFilter === 'Encarregado'
                      ? 'bg-[#FD5521] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Encarregados
                </button>
                <button
                  onClick={() => {
                    setUserFilter('Administrador');
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    userFilter === 'Administrador'
                      ? 'bg-[#FD5521] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Administradores
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
      
      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        onNotificationClick={handleNotificationClick}
        onMarkAsRead={handleMarkAsRead}
      />
      
      {/* Toast Component */}
      {ToastComponent}
    </div>
  );
};

export default AdminDashboard;