import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initDB, seedInitialData } from './utils/database';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EncarregadoDashboard from './components/EncarregadoDashboard';
import PrepostoValidationPage from './components/PrepostoValidationPage';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { OnlineStatus } from './components/OnlineStatus';
import { TestAPI } from './components/TestAPI';
import { TestSync } from './components/TestSync';
import { TestModeButton } from './components/TestModeButton';

// v1.0.1 - Updated forms with icons
const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    // Inicializar banco de dados e dados iniciais
    const init = async () => {
      await initDB();
      await seedInitialData();
    };
    init();
  }, []);

  // MODO DE TESTE - Botão flutuante
  if (testMode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="bg-[#FD5521] text-white p-4 text-center">
          <p className="font-bold">🧪 MODO DE TESTE ATIVO</p>
          <button
            onClick={() => setTestMode(false)}
            className="mt-2 bg-white text-[#FD5521] px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
          >
            ✕ Sair do Modo de Teste
          </button>
        </div>
        <TestSync />
        <TestAPI />
      </div>
    );
  }

  // Verificar se é rota de validação pública
  const path = window.location.pathname;
  const isValidationRoute = path.startsWith('/validar/');
  
  if (isValidationRoute) {
    const token = path.split('/validar/')[1];
    return <PrepostoValidationPage token={token} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Login />
        <TestModeButton onClick={() => setTestMode(true)} />
      </>
    );
  }

  // Renderizar dashboard apropriado baseado no tipo de usuário
  return (
    <>
      {currentUser.tipo === 'Administrador' && <AdminDashboard />}
      {currentUser.tipo === 'Encarregado' && <EncarregadoDashboard />}
      <PWAInstallPrompt />
      <OnlineStatus />
      
      {/* Botão flutuante para ativar modo de teste */}
      <TestModeButton onClick={() => setTestMode(true)} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;