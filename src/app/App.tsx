import React, { useEffect } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initDB, seedInitialData } from './utils/database';
import { initSyncQueue } from './utils/syncQueue';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EncarregadoDashboard from './components/EncarregadoDashboard';
import PrepostoValidationPage from './components/PrepostoValidationPage';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { OnlineStatus } from './components/OnlineStatus';
import { SyncStatus } from './components/SyncStatus';

/**
 * Diário de Obras - FC Pisos
 * Sistema PWA mobile-first para gestão de obras
 * Versão: 2.0.0
 */

// Componente principal que decide qual rota renderizar
const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  
  useEffect(() => {
    // Inicializar banco de dados e dados iniciais
    const init = async () => {
      await initDB();
      await seedInitialData();
      await initSyncQueue();
    };
    init();
  }, []);

  // Verificar se é rota de validação pública
  const path = window.location.pathname;
  const isValidationRoute = path.startsWith('/validar/');
  
  if (isValidationRoute) {
    const token = path.split('/validar/')[1];
    return <PrepostoValidationPage token={token} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Carregando...</div>
      </div>
    );
  }

  // Login se não autenticado
  if (!currentUser) {
    return <Login />;
  }

  // Renderizar dashboard apropriado baseado no tipo de usuário
  return (
    <>
      {currentUser.tipo === 'Administrador' && <AdminDashboard />}
      {currentUser.tipo === 'Encarregado' && <EncarregadoDashboard />}
      <PWAInstallPrompt />
      <OnlineStatus />
      <SyncStatus />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;