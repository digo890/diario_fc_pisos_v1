import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Trash2 } from 'lucide-react';
import { clearServiceWorkerCache } from '../utils/registerSW';

/**
 * 📊 Componente de Status do Service Worker
 * Mostra status online/offline e permite limpar cache
 */
const ServiceWorkerStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Monitorar status online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Estimar tamanho do cache (se disponível)
    estimateCacheSize();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const estimateCacheSize = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageInMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
        setCacheSize(parseFloat(usageInMB));
      } catch (error) {
        console.error('Erro ao estimar cache:', error);
      }
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Tem certeza que deseja limpar o cache? Isso pode remover dados offline.')) {
      return;
    }

    setIsClearing(true);
    try {
      await clearServiceWorkerCache();
      await estimateCacheSize();
      alert('Cache limpo com sucesso!');
    } catch (error) {
      alert('Erro ao limpar cache. Tente recarregar a página.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      {/* Rodapé discreto - apenas em desenvolvimento */}
      {import.meta.env.DEV && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-[#EDEFE4] dark:bg-gray-950 text-[#C6CCC2] dark:text-gray-400 px-4 py-2 text-xs font-mono items-center gap-4 z-40 dark:border-t dark:border-gray-800"
          style={{ display: 'none' }}
        >
          <span className="flex items-center gap-1.5">
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span>Online</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>Offline</span>
              </>
            )}
          </span>
          {cacheSize !== null && (
            <>
              <span className="text-[#C6CCC2]">•</span>
              <span className="flex items-center gap-2">
                <span>Cache: {cacheSize} MB</span>
                <button
                  onClick={handleClearCache}
                  disabled={isClearing}
                  className="text-[#C6CCC2] hover:text-gray-400 transition-colors disabled:opacity-50"
                  title="Limpar cache"
                >
                  {isClearing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ServiceWorkerStatus;