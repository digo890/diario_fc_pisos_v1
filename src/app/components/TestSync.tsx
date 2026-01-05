// ============================================
// COMPONENTE DE TESTE - SINCRONIZAÇÃO
// Use temporariamente para testar sync
// ============================================

import { useSyncData } from '../hooks/useSyncData';

export function TestSync() {
  const { isSyncing, lastSync, error, sync, syncToCloud, syncFromCloud } = useSyncData();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        🔄 Teste de Sincronização
      </h2>

      {/* Status */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-900 rounded">
          <span className="text-2xl">
            {isSyncing ? '⏳' : navigator.onLine ? '✅' : '📴'}
          </span>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {isSyncing
                ? 'Sincronizando...'
                : navigator.onLine
                ? 'Online - Pronto para sincronizar'
                : 'Offline - Modo local'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {navigator.onLine
                ? 'Dados serão sincronizados com a nuvem'
                : 'Usando apenas dados locais (IndexedDB)'}
            </p>
          </div>
        </div>

        {lastSync && (
          <div className="flex items-center gap-3 p-3 bg-green-100 dark:bg-green-900/20 rounded border border-green-400 dark:border-green-700">
            <span className="text-2xl">🕐</span>
            <div>
              <p className="font-medium text-green-900 dark:text-green-200">
                Última sincronização:
              </p>
              <p className="text-sm text-green-800 dark:text-green-300">
                {lastSync.toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-100 dark:bg-red-900/20 rounded border border-red-400 dark:border-red-700">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">
                Erro na sincronização:
              </p>
              <p className="text-sm text-red-800 dark:text-red-300 font-mono">
                {error}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={sync}
          disabled={isSyncing || !navigator.onLine}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span>🔄</span>
          <span>Sincronizar Tudo</span>
        </button>

        <button
          onClick={syncToCloud}
          disabled={isSyncing || !navigator.onLine}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span>☁️</span>
          <span>Upload → Nuvem</span>
        </button>

        <button
          onClick={syncFromCloud}
          disabled={isSyncing || !navigator.onLine}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span>⬇️</span>
          <span>Download ← Nuvem</span>
        </button>
      </div>

      {/* Explicação */}
      <div className="mt-6 bg-gray-100 dark:bg-gray-900 rounded p-4">
        <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-sm">
          📖 Como funciona:
        </h3>
        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
          <li>
            <strong>🔄 Sincronizar Tudo:</strong> Envia dados locais para nuvem
            E baixa dados da nuvem
          </li>
          <li>
            <strong>☁️ Upload:</strong> Apenas envia dados pendentes do
            IndexedDB para Supabase
          </li>
          <li>
            <strong>⬇️ Download:</strong> Apenas baixa dados do Supabase para
            IndexedDB
          </li>
          <li>
            <strong>🌐 Auto-sync:</strong> Quando você volta online, sincroniza
            automaticamente!
          </li>
        </ul>
      </div>

      {/* Info Offline */}
      {!navigator.onLine && (
        <div className="mt-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-700 rounded p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            ⚠️ <strong>Você está offline.</strong> Os dados estão sendo salvos
            localmente no IndexedDB. Quando voltar online, a sincronização será
            feita automaticamente.
          </p>
        </div>
      )}

      {/* Simulação */}
      <div className="mt-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-700 rounded p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          💡 <strong>Para testar offline:</strong>
        </p>
        <ol className="list-decimal list-inside text-xs text-blue-800 dark:text-blue-300 mt-2 space-y-1">
          <li>Abra DevTools (F12) → Aba "Network"</li>
          <li>Marque a opção "Offline"</li>
          <li>Veja o status mudar para "📴 Offline"</li>
          <li>Desmarque "Offline" para voltar online</li>
          <li>A sincronização automática será executada!</li>
        </ol>
      </div>
    </div>
  );
}
