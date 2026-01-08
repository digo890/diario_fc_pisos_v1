// Service Worker para PWA - FC Pisos Diário de Obras
// 🚀 VERSÃO 1.1.0 - OTIMIZADO COM CACHE AGRESSIVO

const CACHE_VERSION = '1.1.0';
const CACHE_NAME = `fc-pisos-static-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `fc-pisos-runtime-v${CACHE_VERSION}`;
const IMAGE_CACHE = `fc-pisos-images-v${CACHE_VERSION}`;
const API_CACHE = `fc-pisos-api-v${CACHE_VERSION}`;
const FONT_CACHE = `fc-pisos-fonts-v${CACHE_VERSION}`;

// ============================================
// 🎯 RECURSOS CRÍTICOS PARA PRECACHE
// ============================================
// Cache agressivo: todos os recursos essenciais para funcionamento offline
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
];

// ============================================
// 🎨 PADRÕES DE URL PARA CACHE AGRESSIVO
// ============================================
const STATIC_ASSET_PATTERNS = [
  /\.(js|jsx|ts|tsx)$/,
  /\.(css|scss)$/,
  /\.(woff|woff2|ttf|eot)$/,
  /\.(svg|png|jpg|jpeg|webp|gif|ico)$/,
];

const API_PATTERNS = [
  /\/functions\/v1\//,
  /\/make-server-1ff231a2\//,
  /supabase\.co/,
];

// ============================================
// 📊 CONFIGURAÇÕES DE CACHE
// ============================================
const CACHE_CONFIG = {
  // Tempo máximo de cache para API (5 minutos)
  API_MAX_AGE: 5 * 60 * 1000,
  
  // Tempo máximo de cache para imagens (7 dias)
  IMAGE_MAX_AGE: 7 * 24 * 60 * 60 * 1000,
  
  // Timeout para requisições de rede
  NETWORK_TIMEOUT: 5000,
  
  // Número máximo de itens por cache
  MAX_CACHE_ITEMS: {
    images: 100,
    api: 50,
    runtime: 50,
  }
};

// Logger condicional
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const log = IS_DEV ? console.log.bind(console) : () => {};
const logError = console.error.bind(console);

// ============================================
// 📥 INSTALAÇÃO - PRECACHE AGRESSIVO
// ============================================
self.addEventListener('install', (event) => {
  log('[SW] 🚀 Instalando Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        log('[SW] ✅ Cache aberto, adicionando recursos críticos...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        log('[SW] ✅ Recursos críticos cacheados com sucesso');
      })
      .catch((error) => {
        logError('[SW] ❌ Erro ao cachear recursos:', error);
      })
  );
  
  // Ativar imediatamente sem esperar
  self.skipWaiting();
});

// ============================================
// 🔄 ATIVAÇÃO - LIMPEZA DE CACHE ANTIGO
// ============================================
self.addEventListener('activate', (event) => {
  log('[SW] 🔄 Ativando Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      // 1. Remover caches antigos
      const cacheNames = await caches.keys();
      const validCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, API_CACHE, FONT_CACHE];
      
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCaches.includes(cacheName)) {
            log('[SW] 🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      // 2. Limpar caches que excederam o limite
      await trimCache(IMAGE_CACHE, CACHE_CONFIG.MAX_CACHE_ITEMS.images);
      await trimCache(API_CACHE, CACHE_CONFIG.MAX_CACHE_ITEMS.api);
      await trimCache(RUNTIME_CACHE, CACHE_CONFIG.MAX_CACHE_ITEMS.runtime);
      
      log('[SW] ✅ Limpeza de cache concluída');
    })()
  );
  
  // Controlar todas as páginas imediatamente
  self.clients.claim();
});

// ============================================
// 🌐 INTERCEPTAÇÃO DE REQUISIÇÕES
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ❌ Ignorar requisições não-GET e protocolos especiais
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // ❌ Ignorar hot-reload do Vite (desenvolvimento)
  if (url.pathname.includes('@vite') || url.pathname.includes('__vite')) {
    return;
  }

  // 🎯 ESTRATÉGIA 1: Cache First AGRESSIVO para assets estáticos
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.match(/\.(js|css|jsx|tsx|ts)$/)
  ) {
    event.respondWith(cacheFirstAggressive(request, CACHE_NAME));
    return;
  }

  // 🔤 ESTRATÉGIA 2: Cache First PERMANENTE para fontes
  if (
    request.destination === 'font' ||
    url.pathname.match(/\.(woff|woff2|ttf|eot|otf)$/)
  ) {
    event.respondWith(cacheFirstPermanent(request, FONT_CACHE));
    return;
  }

  // 🖼️ ESTRATÉGIA 3: Cache First com update para imagens
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/)
  ) {
    event.respondWith(cacheFirstUpdate(request, IMAGE_CACHE));
    return;
  }

  // 🔌 ESTRATÉGIA 4: Network First com timeout para APIs
  if (
    url.pathname.includes('/functions/v1/') ||
    url.pathname.includes('/make-server-1ff231a2/') ||
    url.hostname.includes('supabase.co')
  ) {
    event.respondWith(networkFirstWithTimeout(request, API_CACHE, CACHE_CONFIG.NETWORK_TIMEOUT));
    return;
  }

  // 📄 ESTRATÉGIA 5: Network First para HTML/navegação
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstHTML(request, RUNTIME_CACHE));
    return;
  }

  // 🔄 ESTRATÉGIA PADRÃO: Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// ============================================
// 🎯 ESTRATÉGIAS DE CACHE
// ============================================

/**
 * 💎 Cache First Agressivo
 * - Busca do cache primeiro
 * - Se não encontrar, busca da network e cacheia PERMANENTEMENTE
 * - Ideal para: JS, CSS compilados (não mudam sem rebuild)
 */
async function cacheFirstAggressive(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      log('[SW] 💎 Cache hit (agressivo):', request.url);
      return cached;
    }

    const response = await fetch(request);
    
    // Cache agressivo: cachear TUDO que retornar 200
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      log('[SW] 💾 Cacheado permanentemente:', request.url);
    }
    
    return response;
  } catch (error) {
    logError('[SW] ❌ Erro em cacheFirstAggressive:', error);
    
    // Fallback: tentar buscar do cache mesmo que esteja expirado
    const cached = await caches.match(request);
    if (cached) {
      log('[SW] ⚠️ Retornando cache expirado (offline)');
      return cached;
    }
    
    throw error;
  }
}

/**
 * 🔤 Cache First Permanente (para fontes)
 * - Fontes NUNCA mudam, cache permanente
 */
async function cacheFirstPermanent(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    log('[SW] 🔤 Font cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      log('[SW] 💾 Font cacheada permanentemente');
    }
    return response;
  } catch (error) {
    logError('[SW] ❌ Erro ao carregar fonte:', error);
    throw error;
  }
}

/**
 * 🖼️ Cache First com Update em Background
 * - Retorna imagem do cache IMEDIATAMENTE
 * - Atualiza em background se houver versão nova
 * - Ideal para: Imagens que raramente mudam
 */
async function cacheFirstUpdate(request, cacheName) {
  const cached = await caches.match(request);
  
  // Atualizar cache em background (não espera)
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response && response.status === 200) {
        const cache = await caches.open(cacheName);
        await cache.put(request, response.clone());
        
        // Limpar cache se exceder limite
        await trimCache(cacheName, CACHE_CONFIG.MAX_CACHE_ITEMS.images);
      }
      return response;
    })
    .catch(() => null); // Silenciar erros de background update

  // Retornar do cache imediatamente se disponível
  if (cached) {
    log('[SW] 🖼️ Image cache hit:', request.url);
    return cached;
  }

  return fetchPromise;
}

/**
 * 🔌 Network First com Timeout
 * - Tenta network primeiro com timeout de 5s
 * - Fallback para cache se timeout ou offline
 * - Ideal para: APIs
 */
async function networkFirstWithTimeout(request, cacheName, timeout) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    // Cachear apenas respostas de sucesso
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      
      // Adicionar timestamp para expiração
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      const cachedData = {
        data,
        timestamp: Date.now(),
      };
      
      const newResponse = new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      
      cache.put(request, newResponse);
      log('[SW] 💾 API response cacheada');
    }

    return response;
  } catch (error) {
    log('[SW] ⚠️ Network timeout/falha, usando cache:', request.url);
    
    const cached = await caches.match(request);
    
    if (cached) {
      log('[SW] ✅ Cache API hit (fallback)');
      return cached;
    }

    // Retornar erro offline
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Sem conexão. Tente novamente quando estiver online.' 
      }), 
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * 📄 Network First para HTML
 * - Sempre tenta buscar HTML fresco
 * - Fallback para /index.html se offline
 */
async function networkFirstHTML(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    log('[SW] ⚠️ Network falhou, usando cache HTML');
    
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Fallback para index.html (SPA)
    const indexCached = await caches.match('/index.html');
    if (indexCached) {
      return indexCached;
    }

    return new Response('Offline - Sem cache disponível', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

/**
 * 🔄 Stale While Revalidate
 * - Retorna do cache imediatamente
 * - Atualiza cache em background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (response) => {
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

// ============================================
// 🧹 UTILIDADES DE LIMPEZA
// ============================================

/**
 * Limitar tamanho do cache (FIFO)
 */
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
      const itemsToDelete = keys.length - maxItems;
      log(`[SW] 🧹 Limpando ${itemsToDelete} itens do cache ${cacheName}`);
      
      // Deletar os itens mais antigos
      await Promise.all(
        keys.slice(0, itemsToDelete).map((request) => cache.delete(request))
      );
    }
  } catch (error) {
    logError('[SW] ❌ Erro ao limpar cache:', error);
  }
}

// ============================================
// 🔔 BACKGROUND SYNC (FUTURO)
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-formularios') {
    event.waitUntil(syncFormularios());
  }
});

async function syncFormularios() {
  log('[SW] 🔄 Sincronizando formulários...');
  // TODO: Implementar sincronização de formulários salvos offline
}

// ============================================
// 🔔 PUSH NOTIFICATIONS (FUTURO)
// ============================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nova notificação disponível',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'fc-pisos-notification',
    requireInteraction: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FC Pisos - Diário de Obras', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// ============================================
// 📊 MENSAGENS DO CLIENTE
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

log('[SW] ✅ Service Worker carregado com sucesso v' + CACHE_VERSION);
