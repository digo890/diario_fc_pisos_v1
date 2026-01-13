import React, { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initDB, seedInitialData } from './utils/database';
import { initSyncQueue } from './utils/syncQueue';
import { ensureLocalDataIsConsistent } from './utils/dataSync';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { OnlineStatus } from './components/OnlineStatus';
import { SyncStatus } from './components/SyncStatus';
import ServiceWorkerStatus from './components/ServiceWorkerStatus';

// 🚀 LAZY LOADING: Code splitting para reduzir bundle inicial
const Login = lazy(() => import('./components/Login'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const EncarregadoDashboard = lazy(() => import('./components/EncarregadoDashboard'));
const PrepostoValidationPage = lazy(() => import('./components/PrepostoValidationPage'));
const DiagnosticoPage = lazy(() => import('./components/DiagnosticoPage'));

/**
 * Diário de Obras - FC Pisos
 * Sistema PWA mobile-first para gestão de obras
 * Versão: 1.1.0
 */

// Componente principal que decide qual rota renderizar
const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  
  useEffect(() => {
    // Inicializar banco de dados e dados iniciais
    const init = async () => {
      try {
        // Verificar se o IndexedDB está disponível
        if (typeof indexedDB === 'undefined') {
          console.warn('⚠️ IndexedDB não disponível - funcionalidades offline desabilitadas');
          return;
        }

        await initDB();
        await seedInitialData();
        await initSyncQueue();
        await ensureLocalDataIsConsistent();
      } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
        // Não quebrar a aplicação, apenas logar
        // O usuário ainda pode usar funcionalidades online
      }
    };
    
    // 🔧 CORREÇÃO HMR: Só inicializar após o componente estar montado
    init();
  }, []);

  // Verificar se é rota de validação pública
  const path = window.location.pathname;
  const isValidationRoute = path.startsWith('/validar/') || path.startsWith('/conferencia/');
  const isDiagnosticoRoute = path.startsWith('/diagnostico');
  
  if (isDiagnosticoRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }>
        <DiagnosticoPage />
      </Suspense>
    );
  }
  
  if (isValidationRoute) {
    // Suportar ambas as rotas: /validar/ e /conferencia/
    const token = path.startsWith('/validar/') 
      ? path.split('/validar/')[1] 
      : path.split('/conferencia/')[1];
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }>
        <PrepostoValidationPage token={token} />
      </Suspense>
    );
  }

  // 🔧 CORREÇÃO HMR: Mostrar loading enquanto isLoading for true
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Se não houver usuário logado, mostrar tela de login
  if (!currentUser) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }>
        <Login />
      </Suspense>
    );
  }

  // Renderizar dashboard apropriado baseado no tipo de usuário
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      {currentUser.tipo === 'Administrador' && <AdminDashboard />}
      {currentUser.tipo === 'Encarregado' && <EncarregadoDashboard />}
      {currentUser.tipo === 'Diagnóstico' && <DiagnosticoPage />}
      <PWAInstallPrompt />
      <OnlineStatus />
      <SyncStatus />
      <ServiceWorkerStatus />
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// Adicionar display names para melhor debugging
App.displayName = 'App';
AppContent.displayName = 'AppContent';

export default App;

// Garantir que o módulo seja compatível com Fast Refresh
if (import.meta.hot) {
  import.meta.hot.accept();
}