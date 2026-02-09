import React, { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initDB, seedInitialData } from './utils/database';
import { initSyncQueue } from './utils/syncQueue';
import { safeWarn, safeError } from './utils/logSanitizer';
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
          safeWarn('IndexedDB não disponível - funcionalidades offline desabilitadas');
          return;
        }

        await initDB();
        await seedInitialData();
        // initSyncQueue movido para useEffect do currentUser (background)
      } catch (error) {
        safeError('Erro ao inicializar aplicação:', error);
        // Não quebrar a aplicação, apenas logar
        // O usuário ainda pode usar funcionalidades online
      }
    };


    // 🔧 CORREÇÃO HMR: Só inicializar após o componente estar montado
    init();
  }, []);

  // 🚀 OTIMIZAÇÃO: Iniciar fila de sincronização em background, mas APENAS após login
  // Isso evita concorrência de rede durante o carregamento crítico inicial
  useEffect(() => {
    if (currentUser) {
      // Usar requestIdleCallback se disponível, com fallback para setTimeout
      const startSync = () => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            initSyncQueue(); // Não await - background fire-and-forget
          }, { timeout: 5000 });
        } else {
          // Fallback para setTimeout
          setTimeout(() => {
            initSyncQueue();
          }, 300);
        }
      };

      startSync();
    }
  }, [currentUser]);

  // Verificar se é rota de validação pública
  const path = window.location.pathname;
  const isValidationRoute = path.startsWith('/validar/') || path.startsWith('/conferencia/');
  const isDiagnosticoRoute = path.startsWith('/diagnostico');

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

  // Renderizar dashboard apropriado baseado no tipo de usuário ou rota
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      {isDiagnosticoRoute ? (
        <DiagnosticoPage />
      ) : (
        <>
          {currentUser.tipo === 'Administrador' && <AdminDashboard />}
          {currentUser.tipo === 'Encarregado' && <EncarregadoDashboard />}
        </>
      )}
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