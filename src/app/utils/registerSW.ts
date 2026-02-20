// 🚀 Registro Otimizado do Service Worker para PWA
// v1.1.0 - Com detecção de updates e notificação ao usuário

import { safeLog, safeError } from './logSanitizer';

/**
 * Registrar Service Worker com gerenciamento de atualizações
 */
export const registerServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    safeLog('⚠️ Service Worker não suportado neste navegador');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      // Usar updateViaCache para forçar verificação de updates
      updateViaCache: 'none',
    });

    safeLog('✅ Service Worker registrado com sucesso');

    // ============================================
    // 🔄 DETECTAR ATUALIZAÇÕES DO SERVICE WORKER
    // ============================================

    // Quando há uma nova versão instalando
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        safeLog('🔄 Nova versão do Service Worker detectada, instalando...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nova versão instalada, mas ainda não ativa
            safeLog('✅ Nova versão instalada, aguardando ativação');

            // Notificar usuário sobre atualização disponível
            showUpdateNotification(newWorker);
          }
        });
      }
    });

    // ============================================
    // ⚡ AUTO-UPDATE A CADA 5 MINUTOS
    // ============================================
    // Verificar atualizações periodicamente (apenas em produção)
    if (import.meta.env.PROD) {
      setInterval(
        () => {
          registration.update().catch((error) => {
            safeError('Erro ao verificar atualização do SW:', error);
          });
        },
        5 * 60 * 1000
      ); // A cada 5 minutos
    }

    // ============================================
    // 🔔 CONTROLAR MUDANÇAS DE ESTADO
    // ============================================
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;

      safeLog('🔄 Service Worker atualizado, recarregando página...');
      refreshing = true;

      // Recarregar página automaticamente após 500ms
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  } catch (error) {
    safeError('❌ Erro ao registrar Service Worker:', error);
  }
};

/**
 * 🔔 Mostrar notificação de atualização disponível
 */
function showUpdateNotification(worker: ServiceWorker): void {
  // Verificar se o usuário quer ser notificado
  const shouldNotify = localStorage.getItem('sw-update-notifications') !== 'disabled';

  if (!shouldNotify) {
    // Ativar automaticamente sem notificação
    worker.postMessage({ type: 'SKIP_WAITING' });
    return;
  }

  // Criar banner de atualização
  const existingBanner = document.getElementById('sw-update-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #FD5521;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 90vw;
    animation: slideUp 0.3s ease-out;
  `;

  banner.innerHTML = `
    <style>
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      #sw-update-banner button {
        background: white;
        color: #FD5521;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      }
      #sw-update-banner button:hover {
        transform: scale(1.05);
      }
      #sw-update-banner button:active {
        transform: scale(0.95);
      }
      #sw-update-banner .dismiss {
        background: transparent;
        color: white;
        border: 1px solid white;
      }
    </style>
    <span>🎉 Nova versão disponível!</span>
    <button id="sw-update-btn">Atualizar Agora</button>
    <button id="sw-dismiss-btn" class="dismiss">Depois</button>
  `;

  document.body.appendChild(banner);

  // Botão de atualizar
  const updateBtn = document.getElementById('sw-update-btn');
  updateBtn?.addEventListener('click', () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
    banner.remove();
  });

  // Botão de dispensar
  const dismissBtn = document.getElementById('sw-dismiss-btn');
  dismissBtn?.addEventListener('click', () => {
    banner.remove();
  });

  // Auto-remover após 10 segundos
  setTimeout(() => {
    if (banner.parentNode) {
      banner.remove();
    }
  }, 10000);
}

/**
 * 🧹 Limpar cache do Service Worker
 */
export const clearServiceWorkerCache = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker não suportado neste navegador');
  }

  try {
    // Adicionar timeout de 3 segundos
    const registration = (await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao acessar Service Worker')), 3000)
      ),
    ])) as ServiceWorkerRegistration;

    if (registration && registration.active) {
      registration.active.postMessage({ type: 'CLEAR_CACHE' });
      safeLog('✅ Cache do Service Worker limpo');
    } else {
      throw new Error('Service Worker não está ativo');
    }
  } catch (error) {
    safeError('❌ Erro ao limpar cache:', error);
    throw error;
  }
};

/**
 * ❌ Desregistrar Service Worker (para debug)
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      await registration.unregister();
    }

    safeLog('✅ Service Worker desregistrado');
  }
};
