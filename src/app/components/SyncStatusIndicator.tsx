/**
 * 🔄 Indicador Visual de Status de Sincronização
 * Auto-hide: Aparece ao detectar mudanças e some após 4 segundos
 */

import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSyncStatus } from '../hooks/useSyncStatus';

interface SyncStatusIndicatorProps {
  className?: string;
}

export function SyncStatusIndicator({ className = '' }: SyncStatusIndicatorProps) {
  const { pendingCount, failedCount, isOnline, hasPendingOperations, retryFailed, processPending } = useSyncStatus();
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Controla visibilidade do botão
  const [isHovered, setIsHovered] = useState(false); // Detecta hover
  
  // Refs para rastrear mudanças
  const previousStatus = useRef({ pendingCount, failedCount, isOnline });
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  // Função para mostrar o botão temporariamente
  const showTemporarily = () => {
    setIsVisible(true);
    
    // Limpar timeout anterior se existir
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    
    // Não esconder se houver problemas/pendências ou se estiver com hover
    if (hasPendingOperations || !isOnline || isHovered) {
      return;
    }
    
    // Esconder após 4 segundos
    hideTimeout.current = setTimeout(() => {
      if (!isHovered && !showDetails) {
        setIsVisible(false);
      }
    }, 4000);
  };

  // Detectar mudanças de status
  useEffect(() => {
    const statusChanged = 
      previousStatus.current.pendingCount !== pendingCount ||
      previousStatus.current.failedCount !== failedCount ||
      previousStatus.current.isOnline !== isOnline;

    if (statusChanged) {
      showTemporarily();
    }

    previousStatus.current = { pendingCount, failedCount, isOnline };
  }, [pendingCount, failedCount, isOnline, isHovered, showDetails, hasPendingOperations]);

  // Gerenciar visibilidade baseada em hover
  useEffect(() => {
    if (isHovered) {
      setIsVisible(true);
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    } else if (!hasPendingOperations && isOnline && !showDetails) {
      // Reativar timer quando sair do hover
      showTemporarily();
    }
  }, [isHovered, hasPendingOperations, isOnline, showDetails]);

  // Manter visível se houver detalhes abertos
  useEffect(() => {
    if (showDetails) {
      setIsVisible(true);
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    }
  }, [showDetails]);

  // Cleanup do timeout
  useEffect(() => {
    return () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (failedCount > 0) {
        await retryFailed();
      } else {
        await processPending();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  // ✅ CORREÇÃO #3: Renomear para evitar conflito com diarioHelpers.getStatusDisplay
  const getSyncStatusDisplay = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        label: 'Offline',
        description: 'Sem conexão com a internet'
      };
    }

    if (failedCount > 0) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        label: 'Erro',
        description: `${failedCount} operação(ões) falharam`
      };
    }

    if (pendingCount > 0) {
      return {
        icon: RefreshCw,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        label: 'Sincronizando',
        description: `${pendingCount} operação(ões) pendente(s)`
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      label: 'Sincronizado',
      description: 'Tudo sincronizado'
    };
  };

  const statusDisplay = getSyncStatusDisplay(); // ✅ Usar novo nome
  const Icon = statusDisplay.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Botão principal com animação de entrada/saída */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={() => setShowDetails(!showDetails)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusDisplay.bgColor} ${statusDisplay.color} hover:opacity-80 transition-all relative`}
            title={statusDisplay.description}
          >
            <Icon className={`w-4 h-4 ${pendingCount > 0 && isOnline ? 'animate-spin' : ''}`} />
            
            {/* Badge de contagem */}
            {hasPendingOperations && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-[#FD5521] text-white text-xs font-medium rounded-full flex items-center justify-center"
              >
                {pendingCount + failedCount}
              </motion.span>
            )}
            
            <span className="hidden md:inline text-sm font-medium">
              {statusDisplay.label}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Painel de detalhes */}
      <AnimatePresence>
        {showDetails && (
          <>
            {/* Overlay para fechar */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDetails(false)}
            />
            
            {/* Card de detalhes */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Status de Sincronização
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-4 space-y-3">
                {/* Status de conexão */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {isOnline ? (
                    <Cloud className="w-5 h-5 text-green-500" />
                  ) : (
                    <CloudOff className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {isOnline 
                        ? 'Conectado ao servidor' 
                        : 'Sem conexão - mudanças serão sincronizadas quando voltar online'}
                    </p>
                  </div>
                </div>

                {/* Operações pendentes */}
                {pendingCount > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {pendingCount} operação(ões) pendente(s)
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Aguardando sincronização
                      </p>
                    </div>
                  </div>
                )}

                {/* Operações falhadas */}
                {failedCount > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {failedCount} operação(ões) falharam
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Clique em "Tentar Novamente"
                      </p>
                    </div>
                  </div>
                )}

                {/* Tudo sincronizado */}
                {!hasPendingOperations && isOnline && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Tudo sincronizado
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Não há operações pendentes
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de ação */}
              {hasPendingOperations && isOnline && (
                <div className="px-4 pb-4">
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="w-full px-4 py-2 rounded-lg bg-[#FD5521] text-white hover:bg-[#E54A1D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>{isRetrying ? 'Sincronizando...' : 'Tentar Novamente'}</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}