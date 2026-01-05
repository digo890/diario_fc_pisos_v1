import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '/utils/supabase/info';
import FcLogo from '../../imports/FcLogo';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');

  const createMasterUser = async () => {
    setSetupStatus('creating');
    setError(null);

    try {
      // Primeiro, testar a conexão com o servidor
      console.log('🏥 Testando health check do servidor...');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/health`;
      console.log('📍 Health URL:', healthUrl);
      
      try {
        const healthResponse = await fetch(healthUrl);
        console.log('🏥 Health check status:', healthResponse.status);
        const healthData = await healthResponse.text();
        console.log('🏥 Health check response:', healthData);
      } catch (healthError) {
        console.error('❌ Health check falhou:', healthError);
      }
      
      // Agora tentar criar o usuário
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/auth/create-master`;
      
      console.log('🔧 Iniciando criação do usuário master...');
      console.log('📍 URL:', url);
      console.log('📤 Request body:', {
        email: 'digoo890@gmail.com',
        nome: 'Master Admin',
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'digoo890@gmail.com',
          password: 'Klapaucius',
          nome: 'Master Admin',
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', {
        contentType: response.headers.get('content-type'),
      });
      
      const responseText = await response.text();
      console.log('📦 Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📦 Response data (parsed):', data);
      } catch (e) {
        console.error('❌ Erro ao fazer parse do JSON:', e);
        setSetupStatus('error');
        setError(`Resposta inválida do servidor: ${responseText.substring(0, 100)}`);
        return;
      }

      if (response.ok && data.success) {
        console.log('✅ Usuário master criado com sucesso!');
        setSetupStatus('success');
        // Preencher campos automaticamente
        setEmail('digoo890@gmail.com');
        setPassword('Klapaucius');
        setTimeout(() => setShowSetup(false), 2000);
      } else {
        // Se o erro for "User already registered", considerar como sucesso
        if (data.error?.includes('already registered') || data.error?.includes('já existe') || data.error?.includes('User already registered')) {
          console.log('ℹ️ Usuário master já existe');
          setSetupStatus('success');
          setEmail('digoo890@gmail.com');
          setPassword('Klapaucius');
          setTimeout(() => setShowSetup(false), 2000);
        } else {
          console.error('❌ Erro ao criar usuário:', data);
          setSetupStatus('error');
          setError(data.error || data.message || 'Erro ao criar usuário master');
        }
      }
    } catch (err: any) {
      console.error('❌ Erro de conexão:', err);
      setSetupStatus('error');
      setError(`Erro de conexão: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      
      // Se o erro for de credenciais inválidas, sugerir criar usuário master
      if (err.message.includes('Invalid login credentials')) {
        setError('Credenciais inválidas. Se é sua primeira vez, clique em "Primeira Configuração" abaixo.');
      } else {
        setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Modal de Primeira Configuração
  if (showSetup) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-[#FD5521] flex items-center justify-center p-5 shadow-[0_0_30px_rgba(253,85,33,0.4)]">
              <FcLogo />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Primeira Configuração
          </h1>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
            Criar usuário master do sistema
          </p>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8">
            {setupStatus === 'idle' && (
              <>
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Credenciais do usuário master:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Email: </span>
                      <span className="font-mono text-[#FD5521]">digoo890@gmail.com</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Senha: </span>
                      <span className="font-mono text-[#FD5521]">Klapaucius</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Tipo: </span>
                      <span className="font-medium text-gray-900 dark:text-white">Administrador</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={createMasterUser}
                  className="w-full py-3 rounded-xl bg-[#FD5521] text-white font-medium
                           hover:bg-[#E04A1C] active:bg-[#C63F18]
                           transition-all shadow-lg hover:shadow-xl
                           flex items-center justify-center gap-2 mb-4"
                >
                  <UserPlus className="w-5 h-5" />
                  Criar Usuário Master
                </button>

                <button
                  onClick={() => setShowSetup(false)}
                  className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Voltar ao Login
                </button>
              </>
            )}

            {setupStatus === 'creating' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 border-4 border-[#FD5521]/30 border-t-[#FD5521] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-900 dark:text-white font-medium">Criando usuário master...</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Aguarde um momento</p>
              </div>
            )}

            {setupStatus === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium mb-2">Usuário criado com sucesso!</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Redirecionando para login...</p>
              </div>
            )}

            {setupStatus === 'error' && error && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={createMasterUser}
                  className="px-6 py-2 rounded-xl bg-[#FD5521] text-white font-medium
                           hover:bg-[#E04A1C] transition-all"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-[#FD5521] flex items-center justify-center p-5 shadow-[0_0_30px_rgba(253,85,33,0.4)]">
            <FcLogo />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Diário de Obras
        </h1>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-800
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 focus:border-[#FD5521]
                         placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                         transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-800
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 focus:border-[#FD5521]
                         placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                         transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Botão de login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#FD5521] text-white font-medium
                     hover:bg-[#E04A1C] active:bg-[#C63F18]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all shadow-lg hover:shadow-xl
                     flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Botão de Primeira Configuração */}
        <div className="mt-6">
          <button
            onClick={() => setShowSetup(true)}
            className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#FD5521] dark:hover:text-[#FD5521]
                     transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Primeira Configuração
          </button>
        </div>

        {/* Versão do Sistema */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Versão 1.0.0 • FC Pisos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;