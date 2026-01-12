import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null; // ✅ CORREÇÃO #2: Armazenar timeout ID

    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // ✅ CORREÇÃO #2: Limpar timeout anterior antes de criar novo
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      // ✅ CORREÇÃO #2: Limpar timeout ao ficar offline
      if (timeoutId) clearTimeout(timeoutId);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      // ✅ CORREÇÃO #2: Cleanup do timeout ao desmontar componente
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mostrar sempre quando offline, ou temporariamente quando volta online
  if (!showStatus && isOnline) return null;

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg transition-all ${
        isOnline
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm">
          {isOnline ? 'Conectado' : 'Modo Offline'}
        </span>
      </div>
    </div>
  );
}