// Service Worker para PWA - FC Pisos Diário de Obras
// 🚀 ESTRATÉGIAS DE CACHE POR TIPO DE RECURSO

const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `fc-pisos-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `fc-pisos-runtime-v${CACHE_VERSION}`;
const IMAGE_CACHE = `fc-pisos-images-v${CACHE_VERSION}`;
const API_CACHE = `fc-pisos-api-v${CACHE_VERSION}`;

// Recursos para cachear na instalação (Cache First - sempre disponível offline)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Logger condicional (apenas em desenvolvimento)
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const log = IS_DEV ? console.log.bind(console) : () => {};
const logError = console.error.bind(console); // Sempre manter logs de erro

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        log('[SW] Cache aberto');
        return cache.addAll(PRECACHE_URLS);
      })
      .catch((error) => {
        logError('[SW] Erro ao cachear:', error);
      })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== IMAGE_CACHE && cacheName !== API_CACHE) {
            log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET e chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // ESTRATÉGIA 1: Cache First para recursos estáticos (JS, CSS, fonts)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // ESTRATÉGIA 2: Cache First com atualização para imagens
  if (request.destination === 'image') {
    event.respondWith(cacheFirstUpdate(request, IMAGE_CACHE));
    return;
  }

  // ESTRATÉGIA 3: Network First com cache curto para API
  if (url.pathname.includes('/functions/') || url.pathname.includes('/api/')) {
    event.respondWith(networkFirstShortCache(request, API_CACHE, 5000));
    return;
  }

  // ESTRATÉGIA 4: Network First para HTML e navegação
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // ESTRATÉGIA PADRÃO: Network First
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

// ============================================
// CACHE STRATEGIES
// ============================================

/**
 * Cache First: Busca do cache, fallback para network
 * Ideal para: JS, CSS, fonts (recursos que não mudam)
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    log('[SW] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    logError('[SW] Fetch failed:', error);
    throw error;
  }
}

/**
 * Cache First com atualização em background
 * Ideal para: Imagens (retorna do cache mas atualiza)
 */
async function cacheFirstUpdate(request, cacheName) {
  const cached = await caches.match(request);
  
  // Atualizar cache em background
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      const cache = caches.open(cacheName);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  // Retornar do cache imediatamente se disponível
  return cached || fetchPromise;
}

/**
 * Network First: Busca da network, fallback para cache
 * Ideal para: HTML, navegação (quer versão mais recente)
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    log('[SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }

    // Se for navegação, retornar index.html
    if (request.mode === 'navigate') {
      const indexCached = await caches.match('/index.html');
      if (indexCached) {
        return indexCached;
      }
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Network First com timeout
 * Ideal para: APIs (tenta network mas com timeout)
 */
async function networkFirstShortCache(request, cacheName, timeout = 3000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Se timeout ou erro, tentar cache
    log('[SW] Network timeout/failed, trying cache:', request.url);
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }

    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Sincronização em background (futuro)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-diarios') {
    event.waitUntil(syncDiarios());
  }
});

async function syncDiarios() {
  log('[SW] Sincronizando diários...');
  // Implementar sincronização com Supabase no futuro
}

// Notificações push (futuro)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Novo diário disponível',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FC Pisos', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});