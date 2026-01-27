import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FcLogo from '../../imports/FcLogo';
import { APP_VERSION } from '../../version';

const Login: React.FC = () => {
  const { login } = useAuth();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-[#FD5521]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-800
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 focus:border-[#FD5521]
                         placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
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
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-[#FD5521]" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-800
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 focus:border-[#FD5521]
                         placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
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

        {/* Versão do Sistema */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Versão {APP_VERSION} • FC Pisos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;