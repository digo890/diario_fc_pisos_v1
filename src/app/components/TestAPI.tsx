// ============================================
// COMPONENTE DE TESTE - API
// Use temporariamente para testar backend
// ============================================

import { useState } from 'react';
import { healthCheck, userApi, obraApi, formularioApi, emailApi } from '../utils/api';

export function TestAPI() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🧪 Executando teste: ${testName}`);
      const res = await testFn();
      setResult({ test: testName, ...res });
      console.log(`✅ ${testName} - Sucesso!`, res);
    } catch (err: any) {
      console.error(`❌ ${testName} - Erro:`, err);
      setError(err.message);
      setResult({ test: testName, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          🧪 Painel de Testes - API Backend
        </h1>

        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-700 rounded p-4 mb-6">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            ⚠️ <strong>Componente temporário de teste.</strong> Remova após testar.
          </p>
        </div>

        {/* Botões de Teste */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {/* Health Check */}
          <button
            onClick={() => runTest('Health Check', healthCheck)}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔍 Health Check
          </button>

          {/* Criar Usuário */}
          <button
            onClick={() =>
              runTest('Criar Usuário', () =>
                userApi.create({
                  nome: 'Teste Auto ' + Date.now(),
                  tipo: 'Administrador',
                  email: `teste${Date.now()}@auto.com`,
                  telefone: '(11) 99999-9999',
                  senha: 'senha123',
                })
              )
            }
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ➕ Criar Usuário
          </button>

          {/* Listar Usuários */}
          <button
            onClick={() => runTest('Listar Usuários', userApi.list)}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📋 Listar Usuários
          </button>

          {/* Criar Obra */}
          <button
            onClick={() =>
              runTest('Criar Obra', () =>
                obraApi.create({
                  cliente: 'FC Pisos Ltda',
                  obra: 'Obra Teste ' + Date.now(),
                  local: 'São Paulo - SP',
                  data: new Date().toISOString().split('T')[0],
                  preposto_nome: 'Carlos Silva',
                  preposto_email: 'carlos@teste.com',
                  preposto_telefone: '(11) 98888-8888',
                  status: 'ativa',
                })
              )
            }
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🏗️ Criar Obra
          </button>

          {/* Listar Obras */}
          <button
            onClick={() => runTest('Listar Obras', obraApi.list)}
            disabled={loading}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📋 Listar Obras
          </button>

          {/* Criar Formulário */}
          <button
            onClick={() =>
              runTest('Criar Formulário', () =>
                formularioApi.create({
                  obra_id: 'test-obra-' + Date.now(),
                  status: 'novo',
                  dados: { test: true },
                  token_validacao: crypto.randomUUID(),
                })
              )
            }
            disabled={loading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📝 Criar Formulário
          </button>

          {/* Listar Formulários */}
          <button
            onClick={() => runTest('Listar Formulários', formularioApi.list)}
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📋 Listar Formulários
          </button>

          {/* Enviar Email (Mock) */}
          <button
            onClick={() =>
              runTest('Enviar Email', () =>
                emailApi.sendValidation({
                  email: 'teste@fcpisos.com.br',
                  token: crypto.randomUUID(),
                  cliente: 'FC Pisos',
                  obra: 'Obra Teste',
                })
              )
            }
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📧 Enviar Email (Mock)
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-700 rounded p-4 mb-4">
            <p className="text-blue-900 dark:text-blue-200">
              ⏳ Executando teste...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 rounded p-4 mb-4">
            <p className="text-red-900 dark:text-red-200 font-bold mb-2">
              ❌ Erro:
            </p>
            <p className="text-red-800 dark:text-red-300 text-sm font-mono">
              {error}
            </p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-900 dark:text-white">
                📊 Resultado:
              </h3>
              <button
                onClick={() => setResult(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <pre className="text-xs overflow-auto bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded p-4">
          <h3 className="font-bold mb-2 text-gray-900 dark:text-white">
            📖 Instruções:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Clique em cada botão para testar a funcionalidade</li>
            <li>Verifique o resultado JSON abaixo</li>
            <li>Abra o Console do navegador (F12) para ver logs detalhados</li>
            <li>
              Se tudo funcionar, você verá{' '}
              <code className="bg-white dark:bg-gray-900 px-1 rounded">
                {'"success": true'}
              </code>
            </li>
            <li>Após testar, remova este componente do App.tsx</li>
          </ol>
        </div>

        {/* Console Info */}
        <div className="mt-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-700 rounded p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            💡 <strong>Dica:</strong> Abra o Console (F12) para ver logs
            detalhados de cada teste executado.
          </p>
        </div>
      </div>
    </div>
  );
}
