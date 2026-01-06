import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, UserPlus, CheckCircle2, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import FcLogo from '../../imports/FcLogo';

type ViewMode = 'login' | 'signup';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupNome, setSignupNome] = useState('');
  const [signupTipo, setSignupTipo] = useState<'Administrador' | 'Encarregado'>('Encarregado');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [emailJaExiste, setEmailJaExiste] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setError(null);
    setSignupSuccess(false);

    // Validações
    if (!signupNome.trim()) {
      setError('Por favor, preencha seu nome completo');
      setSignupLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setSignupLoading(false);
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('As senhas não coincidem');
      setSignupLoading(false);
      return;
    }

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/auth/signup`;
      
      console.log('🔧 Criando novo usuário...');
      console.log('📍 URL:', url);
      console.log('📦 Dados:', { email: signupEmail, nome: signupNome, tipo: signupTipo });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`, // Adicionar auth header para JWT verification
        },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          nome: signupNome,
          tipo: signupTipo,
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Tentar ler o corpo da resposta
      const responseText = await response.text();
      console.log('📡 Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Erro ao criar usuário';
        
        // Tentar parsear JSON
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Se não for JSON, usar o texto da resposta
          errorMessage = responseText || errorMessage;
        }
        
        // Se for 401, provavelmente a Edge Function não foi deployada
        if (response.status === 401) {
          errorMessage = '⚠️ Edge Function não está deployada no Supabase. Por favor, faça o deploy da função primeiro.';
        }
        
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ Usuário criado com sucesso:', data);

      setSignupSuccess(true);
      
      // Limpar formulário
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupNome('');
      setSignupTipo('Encarregado');

      // Após 2 segundos, voltar para tela de login
      setTimeout(() => {
        setViewMode('login');
        setSignupSuccess(false);
        // Preencher email no login
        setEmail(data.data?.email || signupEmail);
      }, 2000);

    } catch (err: any) {
      console.error('❌ Erro ao criar usuário:', err);
      
      // Detectar se o email já existe
      const errorMessage = err.message || 'Erro ao criar usuário. Tente novamente.';
      if (errorMessage.includes('Já existe um usuário cadastrado com este email')) {
        setEmailJaExiste(true);
      } else {
        setEmailJaExiste(false);
      }
      
      setError(errorMessage);
    } finally {
      setSignupLoading(false);
    }
  };

  // Renderizar tela de cadastro
  if (viewMode === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">

            {/* Título */}
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Criar Conta
            </h1>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
              Preencha os dados para criar sua conta
            </p>

            {/* Success Message */}
            {signupSuccess && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Conta criada com sucesso!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Redirecionando para o login...
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !emailJaExiste && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Email já existe - mensagem especial */}
            {emailJaExiste && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                      Este email já está cadastrado
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Já existe uma conta com o email <strong>{signupEmail}</strong>. Faça login ou use outro email.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setEmail(signupEmail);
                    setError(null);
                    setEmailJaExiste(false);
                  }}
                  className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Ir para Login
                </button>
              </div>
            )}

            {/* Formulário de Cadastro */}
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Nome Completo */}
              <div>
                <label htmlFor="signup-nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="signup-nome"
                    type="text"
                    value={signupNome}
                    onChange={(e) => setSignupNome(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 transition-all [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(17_24_39)] dark:[&:-webkit-autofill]:!bg-gray-900 dark:[&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0_1000px_white_inset] dark:[&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0_1000px_white_inset] dark:[&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset]"
                    placeholder="Digite seu nome completo"
                    required
                    disabled={signupLoading || signupSuccess}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 transition-all [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(17_24_39)] dark:[&:-webkit-autofill]:!bg-gray-900 dark:[&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0_1000px_white_inset] dark:[&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0_1000px_white_inset] dark:[&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset]"
                    placeholder="seu@email.com"
                    required
                    disabled={signupLoading || signupSuccess}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Tipo de Usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tipo de Usuário
                </label>
                <div className="relative inline-flex w-full p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {/* Background slider */}
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-900 rounded-md shadow-md transition-transform duration-200 ease-out ${
                      signupTipo === 'Administrador' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
                    }`}
                  />
                  
                  {/* Encarregado Button */}
                  <button
                    type="button"
                    onClick={() => setSignupTipo('Encarregado')}
                    disabled={signupLoading || signupSuccess}
                    className={`relative z-10 flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      signupTipo === 'Encarregado'
                        ? 'text-[#FD5521]'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Encarregado
                  </button>
                  
                  {/* Administrador Button */}
                  <button
                    type="button"
                    onClick={() => setSignupTipo('Administrador')}
                    disabled={signupLoading || signupSuccess}
                    className={`relative z-10 flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      signupTipo === 'Administrador'
                        ? 'text-[#FD5521]'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 transition-all"
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={signupLoading || signupSuccess}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="signup-confirm-password"
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 transition-all"
                    placeholder="Digite a senha novamente"
                    required
                    disabled={signupLoading || signupSuccess}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-3 pt-4">
                <button
                  type="submit"
                  disabled={signupLoading || signupSuccess}
                  className="w-full bg-[#FD5521] hover:bg-[#E54A1D] text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signupLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Criando conta...
                    </>
                  ) : signupSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Conta criada!
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Criar Conta
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setError(null);
                    setSignupSuccess(false);
                  }}
                  disabled={signupLoading || signupSuccess}
                  className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar para Login
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            Ao criar uma conta, você concorda com os termos de uso
          </p>
        </div>
      </div>
    );
  }

  // Renderizar tela de login
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
        <form onSubmit={handleLogin} className="space-y-6">
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
                         transition-all [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(17_24_39)] dark:[&:-webkit-autofill]:!bg-gray-900 dark:[&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0_1000px_white_inset] dark:[&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0_1000px_white_inset] dark:[&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset]"
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
                         transition-all [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(17_24_39)] dark:[&:-webkit-autofill]:!bg-gray-900 dark:[&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0_1000px_white_inset] dark:[&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0_1000px_white_inset] dark:[&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0_1000px_rgb(17_24_39)_inset]"
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
            onClick={() => {
              setViewMode('signup');
              setError(null);
            }}
            className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#FD5521] dark:hover:text-[#FD5521]
                     transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Cadastre-se
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