/**
 * Componente de Status de Sincronização
 * Exibe informações sobre sincronização offline e fila pendente
 */

import React from 'react';
import { CloudOff, Cloud, CloudUpload, RefreshCw, AlertCircle } from 'lucide-react';
import { useSyncQueue } from '../hooks/useSyncQueue';

export function SyncStatus() {
  const { isPending, count, isSyncing, isOnline, lastError, sync } = useSyncQueue();

  // Não mostrar se não há itens pendentes e não está sincronizando
  if (!isPending && !isSyncing && !lastError) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md
          border transition-all duration-300
          ${
            lastError
              ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800'
              : isSyncing
              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800'
              : 'bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800'
          }
        `}
      >
        {/* Ícone de Status */}
        <div className="relative">
          {lastError ? (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : isSyncing ? (
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          ) : !isOnline ? (
            <CloudOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <CloudUpload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          )}
          
          {/* Badge de contagem */}
          {count > 0 && !isSyncing && (
            <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#FD5521] rounded-full">
              {count}
            </span>
          )}
        </div>

        {/* Mensagem */}
        <div className="flex flex-col gap-0.5">
          <span
            className={`text-sm font-medium ${
              lastError
                ? 'text-red-900 dark:text-red-200'
                : isSyncing
                ? 'text-blue-900 dark:text-blue-200'
                : 'text-orange-900 dark:text-orange-200'
            }`}
          >
            {lastError
              ? 'Erro na Sincronização'
              : isSyncing
              ? 'Sincronizando...'
              : !isOnline
              ? 'Modo Offline'
              : `${count} ${count === 1 ? 'item pendente' : 'itens pendentes'}`}
          </span>
          
          {lastError && (
            <span className="text-xs text-red-700 dark:text-red-300">
              {lastError}
            </span>
          )}
          
          {!isOnline && (
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Aguardando conexão
            </span>
          )}
        </div>

        {/* Botão de sincronização manual */}
        {!isSyncing && isOnline && isPending && (
          <button
            onClick={sync}
            className="ml-2 p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
            title="Sincronizar agora"
          >
            <Cloud className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  );
}
