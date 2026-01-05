import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { createClient } from '@supabase/supabase-js';
import FcLogo from '../../imports/FcLogo';

interface Props {
  onComplete: () => void;
}

const AutoSetup: React.FC<Props> = ({ onComplete }) => {
  const [status, setStatus] = useState<'checking' | 'creating' | 'complete' | 'error'>('checking');
  const [message, setMessage] = useState('Verificando sistema...');
  const [useDirectAuth, setUseDirectAuth] = useState(false);

  useEffect(() => {
    checkAndSetup();
  }, []);

  const checkAndSetup = async () => {
    try {
      // 1. Verificar se o servidor está online
      setMessage('Conectando ao servidor...');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/health`;
      
      let serverOnline = false;
      try {
        const healthResponse = await fetch(healthUrl, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
        });
        serverOnline = healthResponse.ok;
      } catch (healthError) {
        console.warn('⚠️ Servidor não disponível, usando modo direto');
        serverOnline = false;
      }

      if (!serverOnline) {
        // Modo de desenvolvimento: criar usuário direto no Supabase Auth
        setMessage('Modo de desenvolvimento detectado...');
        setUseDirectAuth(true);
        await createUserDirectly();
        return;
      }

      // 2. Servidor online: usar a rota /auth/create-master
      setStatus('creating');
      setMessage('Configurando usuário master...');
      
      const createUrl = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/auth/create-master`;
      
      const response = await fetch(createUrl, {
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

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('complete');
        setMessage('Sistema configurado com sucesso!');
        setTimeout(() => onComplete(), 1500);
      } else if (data.message === 'Usuário já existe') {
        setStatus('complete');
        setMessage('Sistema já configurado!');
        setTimeout(() => onComplete(), 1500);
      } else {
        throw new Error(data.error || 'Erro ao configurar sistema');
      }
    } catch (error: any) {
      console.error('Erro no auto-setup:', error);
      
      // Tentar modo direto como fallback
      if (!useDirectAuth) {
        console.log('🔄 Tentando modo direto...');
        setUseDirectAuth(true);
        await createUserDirectly();
      } else {
        setStatus('error');
        setMessage(error.message);
        setTimeout(() => onComplete(), 3000);
      }
    }
  };

  const createUserDirectly = async () => {
    try {
      setStatus('creating');
      setMessage('Criando usuário (modo direto)...');

      // Criar cliente Supabase
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

      // Tentar criar o usuário
      const { data, error } = await supabase.auth.signUp({
        email: 'digoo890@gmail.com',
        password: 'Klapaucius',
        options: {
          data: {
            nome: 'Master Admin',
            tipo: 'Administrador'
          }
        }
      });

      if (error) {
        // Se o erro for "User already registered", considerar sucesso
        if (error.message.includes('already registered') || error.message.includes('já existe')) {
          setStatus('complete');
          setMessage('Usuário já configurado!');
          setTimeout(() => onComplete(), 1500);
          return;
        }
        throw error;
      }

      setStatus('complete');
      setMessage('Usuário criado com sucesso!');
      setTimeout(() => onComplete(), 1500);
    } catch (error: any) {
      console.error('Erro ao criar usuário direto:', error);
      setStatus('complete'); // Continuar mesmo com erro
      setMessage('Prosseguindo para o login...');
      setTimeout(() => onComplete(), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-[#FD5521] flex items-center justify-center p-5 shadow-[0_0_30px_rgba(253,85,33,0.4)]">
            <FcLogo />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Diário de Obras
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
          FC Pisos - Sistema de Gestão
        </p>

        {/* Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8">
          {(status === 'checking' || status === 'creating') && (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-[#FD5521] animate-spin mb-4" />
              <p className="text-gray-900 dark:text-white font-medium mb-1">{message}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aguarde um momento...</p>
              {useDirectAuth && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Modo de desenvolvimento</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'complete' && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-gray-900 dark:text-white font-medium mb-1">{message}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Redirecionando...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-yellow-700 dark:text-yellow-400 font-medium mb-1">Aviso</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Continuando para o login...
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Credenciais do usuário master:
          </p>
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-500">Email: </span>
              <span className="font-mono text-[#FD5521]">digoo890@gmail.com</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-500">Senha: </span>
              <span className="font-mono text-[#FD5521]">Klapaucius</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoSetup;