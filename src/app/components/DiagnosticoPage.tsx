import React, { useState } from 'react';
import { Search, ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { publicAnonKey } from '/utils/supabase/info';

const DiagnosticoPage: React.FC = () => {
  const { currentUser, accessToken, isLoading } = useAuth();
  const [token, setToken] = useState(''); // ✅ Limpo por padrão
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🔒 BLOQUEIO: Se ainda estiver carregando a auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Verificando permissões...</div>
      </div>
    );
  }

  // 🔒 BLOQUEIO: Somente Administradores
  if (!currentUser || currentUser.tipo !== 'Administrador') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Esta página é restrita a administradores. Seu acesso não está autorizado.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-all font-medium"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const diagnosticar = async () => {
    if (!token.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://cjwuooaappcnsqxgdpta.supabase.co/functions/v1/make-server-1ff231a2/debug/token/${token}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`, // 🛡️ Usar chave pública para passar pelo CORS
            'X-User-Token': accessToken || '' // 🛡️ SUCESSO: Usar token real do usuário logado
          }
        }
      );
      const data = await response.json();
      setResultado(data);
    } catch (error) {
      setResultado({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Search className="w-7 h-7 text-[#FD5521]" />
            Diagnóstico de Token
          </h1>
          <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            MODO ADMINISTRADOR
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token de Validação (ID do Formulário)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FD5521]/40 focus:border-[#FD5521] outline-none"
              placeholder="Cole o ID do formulário aqui..."
            />
            <button
              onClick={diagnosticar}
              disabled={loading || !token.trim()}
              className="px-6 py-2 bg-[#FD5521] text-white rounded-lg hover:bg-[#E54A1D] disabled:opacity-50 flex items-center gap-2 transition-all shadow-md"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Diagnosticar'}
            </button>
          </div>
        </div>

        {resultado && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Resultado do Diagnóstico
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
              {JSON.stringify(resultado, null, 2)}
            </pre>

            {/* Interpretação do resultado */}
            {resultado.obra_encontrada !== undefined && (
              <div className="mt-6 space-y-3">
                <div className={`p-3 rounded-lg ${resultado.obra_encontrada ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                  <strong>
                    {resultado.obra_encontrada ? '✅ Obra encontrada' : '❌ Obra NÃO encontrada'}
                  </strong>
                  {resultado.obra_encontrada && (
                    <p className="text-sm mt-1">
                      ID: {resultado.obra_id} | Status: {resultado.obra_status}
                    </p>
                  )}
                </div>

                <div className={`p-3 rounded-lg ${resultado.formulario_encontrado ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                  <strong>
                    {resultado.formulario_encontrado ? '✅ Formulário encontrado' : '❌ Formulário NÃO encontrado'}
                  </strong>
                </div>

                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  <div className="flex justify-between items-center">
                    <span>📊 Total de obras:</span>
                    <span className="font-bold">{resultado.total_obras}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span>📋 Total de formulários:</span>
                    <span className="font-bold">{resultado.total_formularios}</span>
                  </div>
                </div>

                {!resultado.formulario_encontrado && resultado.obra_encontrada && (
                  <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
                    <strong className="text-yellow-800 dark:text-yellow-400">
                      ⚠️ PROBLEMA IDENTIFICADO:
                    </strong>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-2 text-sm">
                      A obra existe, mas o formulário não foi criado no backend.
                      <br />
                      Isso acontece quando o encarregado clica em "Enviar para preposto" sem ter salvo o formulário antes ou se houve erro de rede persistente.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticoPage;
