// sw.js - Service Worker para PC/PWA
const CACHE_NAME = 'zero-pwa-v2';
const OFFLINE_URL = '/offline.html';

// URLs para cache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/offline.html',
  '/pc-pwa/pwa-detector.js',
  '/pc-pwa/auto-session.js',
  '/pc-pwa/notification-pc.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

// INSTALAÇÃO
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pré-caching recursos PC');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// ATIVAÇÃO
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH - Estratégia Network First
self.addEventListener('fetch', event => {
  // Ignora analytics e firestore
  if (event.request.url.includes('google-analytics') || 
      event.request.url.includes('firestore')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
              return caches.match('/icons/icon-192x192.png');
            }
            return new Response('Recurso indisponível offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// ============================================
// 🔥 NOTIFICAÇÕES PUSH - PC
// ============================================

// RECEBER NOTIFICAÇÃO
self.addEventListener('push', function(event) {
  let data = {};
  
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: '📚 Zero · Nova Notificação',
      body: 'Você tem uma nova atualização!',
      icon: '/icons/icon-192x192.png',
      url: '/'
    };
  }

  const options = {
    body: data.body || 'Clique para abrir o app',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: '🔗 Abrir App' },
      { action: 'dismiss', title: '❌ Fechar' }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Zero', options)
  );
});

// CLIQUE NA NOTIFICAÇÃO
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    console.log('[SW] Notificação fechada');
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(windowClients => {
      // Procura uma janela já aberta
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
        // Tenta focar qualquer janela do mesmo app
        if (client.url.includes(window.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Abre nova janela
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// NOTIFICAÇÃO FECHADA
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notificação fechada pelo usuário');
});

console.log('🖥️ Service Worker PC/PWA carregado');