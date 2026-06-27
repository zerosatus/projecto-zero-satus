// sw.js - Service Worker COMPLETO com suporte a notificações em background

const CACHE_NAME = 'zero-pwa-v3';
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
  '/pc-pwa/task-notifier.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

// ============================================
// INSTALAÇÃO
// ============================================
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

// ============================================
// ATIVAÇÃO
// ============================================
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

// ============================================
// FETCH
// ============================================
self.addEventListener('fetch', event => {
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
// 🔥 NOTIFICAÇÕES PUSH
// ============================================

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

// ============================================
// 🔥 CLIQUE NA NOTIFICAÇÃO
// ============================================

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
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
        if (client.url.includes(window.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ============================================
// 🔥 NOTIFICAÇÃO FECHADA
// ============================================

self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notificação fechada pelo usuário');
});

// ============================================
// 🔥 SINCRONIZAÇÃO EM BACKGROUND
// ============================================

self.addEventListener('sync', event => {
  console.log('[SW] Evento de sincronização:', event.tag);
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(sincronizarTarefas());
  }
  
  if (event.tag === 'sync-calendar') {
    event.waitUntil(sincronizarCalendario());
  }
  
  if (event.tag === 'sync-notes') {
    event.waitUntil(sincronizarAnotacoes());
  }
});

// ============================================
// 🔥 FUNÇÕES DE SINCRONIZAÇÃO
// ============================================

async function sincronizarTarefas() {
  console.log('[SW] 🔄 Sincronizando tarefas em background...');
  
  try {
    // Busca cliente ativo para obter dados
    const clientList = await clients.matchAll({ type: 'window' });
    let userId = null;
    let tasks = [];
    
    for (const client of clientList) {
      try {
        // Tenta buscar dados via mensagem
        const response = await new Promise((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (e) => resolve(e.data);
          client.postMessage({ type: 'GET_TASKS' }, [channel.port2]);
        });
        
        if (response && response.userId) {
          userId = response.userId;
          tasks = response.tasks || [];
          break;
        }
      } catch (e) {
        console.warn('[SW] Erro ao obter dados do cliente:', e);
      }
    }
    
    if (!userId || tasks.length === 0) {
      console.log('[SW] ⚠️ Nenhuma tarefa para sincronizar');
      return;
    }
    
    // Verifica tarefas urgentes
    const agora = new Date();
    const tarefasUrgentes = tasks.filter(t => {
      if (t.completed) return false;
      if (!t.prazo) return false;
      
      const prazo = new Date(t.prazo);
      const diffHoras = (prazo - agora) / (1000 * 60 * 60);
      return diffHoras > 0 && diffHoras <= 24;
    });
    
    if (tarefasUrgentes.length > 0) {
      console.log(`[SW] 📢 ${tarefasUrgentes.length} tarefas urgentes encontradas`);
      
      for (const tarefa of tarefasUrgentes) {
        const prazo = new Date(tarefa.prazo);
        const diffHoras = Math.ceil((prazo - agora) / (1000 * 60 * 60));
        
        await self.registration.showNotification(
          '⏰ TAREFA URGENTE!',
          {
            body: `"${tarefa.nome}" vence em ${diffHoras}h! ⚠️`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [200, 100, 200],
            data: { url: '/TELAS/login/index.html' },
            requireInteraction: true
          }
        );
      }
    }
    
    console.log('[SW] ✅ Sincronização de tarefas concluída');
    
  } catch (error) {
    console.error('[SW] Erro na sincronização de tarefas:', error);
  }
}

async function sincronizarCalendario() {
  console.log('[SW] 🔄 Sincronizando calendário em background...');
  // Implementar verificação de eventos
}

async function sincronizarAnotacoes() {
  console.log('[SW] 🔄 Sincronizando anotações em background...');
  // Implementar verificação de anotações
}

// ============================================
// 🔥 SINCRONIZAÇÃO PERIÓDICA
// ============================================

self.addEventListener('periodicsync', event => {
  console.log('[SW] Sincronização periódica:', event.tag);
  
  if (event.tag === 'check-tasks') {
    event.waitUntil(verificarTarefasPeriodicamente());
  }
  
  if (event.tag === 'check-calendar') {
    event.waitUntil(verificarCalendarioPeriodicamente());
  }
});

async function verificarTarefasPeriodicamente() {
  console.log('[SW] 🔍 Verificando tarefas periodicamente...');
  await sincronizarTarefas();
}

async function verificarCalendarioPeriodicamente() {
  console.log('[SW] 🔍 Verificando calendário periodicamente...');
  await sincronizarCalendario();
}

// ============================================
// 🔥 MENSAGENS DO CLIENTE
// ============================================

self.addEventListener('message', event => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data.type === 'GET_USER_ID') {
    // Responde com o userId se disponível
    event.ports[0].postMessage({ 
      userId: event.data.userId || null 
    });
  }
  
  if (event.data.type === 'GET_TASKS') {
    event.ports[0].postMessage({
      userId: event.data.userId || null,
      tasks: event.data.tasks || []
    });
  }
  
  if (event.data.type === 'FORCE_SYNC') {
    event.waitUntil(sincronizarTarefas());
  }
});

console.log('🖥️ Service Worker PC/PWA COMPLETO carregado!');