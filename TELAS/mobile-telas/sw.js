const CACHE_NAME = 'painel-aluno-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './db.js',
  './manifest.json',
  './offline.html',
  'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js',
  'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request)
        .then(networkResponse => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return networkResponse;
        })
      )
      .catch(() => {
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./offline.html');
        }
      })
  );
});

// ==================== NOTIFICAÇÕES PUSH ====================

self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  
  let data = {
    title: 'Painel do Aluno',
    body: 'Você tem uma nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {},
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ]
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, data)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const urlToOpen = event.notification.data?.url || '/index.html';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('/index.html') && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});

// ==================== GERENCIAMENTO DE NOTIFICAÇÕES AGENDADAS ====================

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PainelAlunoDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('tarefas')) {
        db.createObjectStore('tarefas', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('eventos')) {
        db.createObjectStore('eventos', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('notifications_log')) {
        const store = db.createObjectStore('notifications_log', { keyPath: 'id', autoIncrement: true });
        store.createIndex('tag', 'tag', { unique: false });
        store.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('agendadas')) {
        const store = db.createObjectStore('agendadas', { keyPath: 'id', autoIncrement: true });
        store.createIndex('tag', 'tag', { unique: true });
        store.createIndex('disparo_em', 'disparo_em');
      }
    };
  });
}

async function salvarLogNotificacao(tag, titulo, mensagem) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['notifications_log'], 'readwrite');
    const store = tx.objectStore('notifications_log');
    
    await store.add({
      tag,
      titulo,
      mensagem,
      timestamp: Date.now(),
      lida: false
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar log:', error);
    return false;
  }
}

async function notificacaoJaEnviada(tag, intervalo = 3600000) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['notifications_log'], 'readonly');
    const store = tx.objectStore('notifications_log');
    const index = store.index('tag');
    
    const registros = await new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(tag));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (registros.length === 0) return false;
    
    const agora = Date.now();
    const ultimo = Math.max(...registros.map(r => r.timestamp));
    
    return (agora - ultimo) < intervalo;
  } catch (error) {
    console.error('Erro ao verificar notificação:', error);
    return false;
  }
}

async function agendarNotificacao(options) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['agendadas'], 'readwrite');
    const store = tx.objectStore('agendadas');
    const index = store.index('tag');
    
    const existing = await new Promise((resolve) => {
      const request = index.getAll(IDBKeyRange.only(options.tag));
      request.onsuccess = () => resolve(request.result);
    });
    
    if (existing.length > 0) {
      for (const item of existing) {
        store.delete(item.id);
      }
    }
    
    await store.add({
      tag: options.tag,
      titulo: options.title,
      mensagem: options.body,
      disparo_em: options.disparo_em,
      data: options.data || {},
      icone: options.icon || '/icons/icon-192x192.png'
    });
    
    console.log(`Notificação agendada para ${new Date(options.disparo_em).toLocaleString()}`);
    return true;
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
    return false;
  }
}

async function verificarNotificacoesAgendadas() {
  console.log('Verificando notificações agendadas...');
  
  try {
    const db = await openDatabase();
    const agora = Date.now();
    
    const tx = db.transaction(['agendadas'], 'readonly');
    const store = tx.objectStore('agendadas');
    const index = store.index('disparo_em');
    
    const paraDisparar = await new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.upperBound(agora));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (paraDisparar.length === 0) return;
    
    console.log(`Encontradas ${paraDisparar.length} notificações para disparar`);
    
    for (const notif of paraDisparar) {
      const jaEnviada = await notificacaoJaEnviada(notif.tag);
      
      if (!jaEnviada) {
        await dispararNotificacao({
          title: notif.titulo,
          body: notif.mensagem,
          tag: notif.tag,
          icon: notif.icone,
          data: notif.data
        });
        
        await salvarLogNotificacao(notif.tag, notif.titulo, notif.mensagem);
      }
      
      const deleteTx = db.transaction(['agendadas'], 'readwrite');
      const deleteStore = deleteTx.objectStore('agendadas');
      deleteStore.delete(notif.id);
    }
    
  } catch (error) {
    console.error('Erro ao verificar agendadas:', error);
  }
}

async function dispararNotificacao(options) {
  const defaultOptions = {
    title: 'Painel do Aluno',
    body: 'Nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: `notif-${Date.now()}`,
    requireInteraction: false,
    silent: false,
    actions: [
      { action: 'open', title: 'Ver detalhes' },
      { action: 'close', title: 'Fechar' }
    ],
    data: {}
  };
  
  const notificationOptions = { ...defaultOptions, ...options };
  
  return self.registration.showNotification(
    notificationOptions.title,
    notificationOptions
  );
}

async function verificarTarefasProximas() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['tarefas'], 'readonly');
    const store = tx.objectStore('tarefas');
    
    const tarefas = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const agora = new Date();
    const tarefasPendentes = tarefas.filter(t => !t.concluida && t.prazo);
    
    for (const tarefa of tarefasPendentes) {
      const prazo = new Date(tarefa.prazo);
      const diffHoras = (prazo - agora) / (1000 * 60 * 60);
      
      if (diffHoras <= 24 && diffHoras > 23) {
        const tag = `tarefa-${tarefa.id}-24h`;
        const jaEnviada = await notificacaoJaEnviada(tag);
        
        if (!jaEnviada) {
          await agendarNotificacao({
            tag,
            title: '⏰ Tarefa próxima do prazo!',
            body: `"${tarefa.nome}" vence amanhã (${new Date(tarefa.prazo).toLocaleDateString('pt-BR')})`,
            disparo_em: Date.now() + 5000,
            data: { type: 'tarefa', id: tarefa.id }
          });
        }
      }
      
      if (diffHoras <= 1 && diffHoras > 0.5) {
        const tag = `tarefa-${tarefa.id}-1h`;
        const jaEnviada = await notificacaoJaEnviada(tag);
        
        if (!jaEnviada) {
          await agendarNotificacao({
            tag,
            title: '⚠️ Tarefa vence hoje!',
            body: `"${tarefa.nome}" vence em ${Math.ceil(diffHoras * 60)} minutos`,
            disparo_em: Date.now() + 5000,
            data: { type: 'tarefa', id: tarefa.id }
          });
        }
      }
      
      if (diffHoras < 0 && diffHoras > -24) {
        const tag = `tarefa-${tarefa.id}-atrasada`;
        const jaEnviada = await notificacaoJaEnviada(tag);
        
        if (!jaEnviada) {
          await agendarNotificacao({
            tag,
            title: '🚨 Tarefa atrasada!',
            body: `"${tarefa.nome}" está atrasada há ${Math.abs(Math.floor(diffHoras))} horas`,
            disparo_em: Date.now() + 5000,
            data: { type: 'tarefa', id: tarefa.id }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar tarefas:', error);
  }
}

async function verificarEventosProximos() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['eventos'], 'readonly');
    const store = tx.objectStore('eventos');
    
    const eventos = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    
    for (const evento of eventos) {
      const dataEvento = new Date(evento.year, evento.month, evento.day);
      
      if (dataEvento.toDateString() === hoje.toDateString()) {
        const [hora, minuto] = evento.time.split(':').map(Number);
        const dataHoraEvento = new Date(dataEvento);
        dataHoraEvento.setHours(hora, minuto, 0);
        
        const diffMinutos = (dataHoraEvento - agora) / (1000 * 60);
        
        if (diffMinutos <= 30 && diffMinutos > 25) {
          const tag = `evento-${evento.id}-30min`;
          const jaEnviada = await notificacaoJaEnviada(tag);
          
          if (!jaEnviada) {
            await agendarNotificacao({
              tag,
              title: `📅 ${evento.title}`,
              body: `Começa em 30 minutos (${evento.time})`,
              disparo_em: Date.now() + 5000,
              data: { type: 'evento', id: evento.id }
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar eventos:', error);
  }
}

async function verificarLembreteEstudo() {
  try {
    const db = await openDatabase();
    
    const txTarefas = db.transaction(['tarefas'], 'readonly');
    const storeTarefas = txTarefas.objectStore('tarefas');
    
    const tarefas = await new Promise((resolve) => {
      const request = storeTarefas.getAll();
      request.onsuccess = () => resolve(request.result);
    });
    
    const pendentes = tarefas.filter(t => !t.concluida).length;
    
    if (pendentes === 0) return;
    
    const tag = 'lembrete-estudo-diario';
    const jaEnviadaHoje = await notificacaoJaEnviada(tag, 12 * 3600000);
    
    if (!jaEnviadaHoje) {
      const horas = [8, 12, 16, 20];
      const horaAtual = new Date().getHours();
      
      if (horas.includes(horaAtual)) {
        await agendarNotificacao({
          tag,
          title: '📚 Hora de estudar!',
          body: `Você tem ${pendentes} tarefas pendentes. Que tal começar agora?`,
          disparo_em: Date.now() + 5000,
          data: { type: 'lembrete' }
        });
      }
    }
    
  } catch (error) {
    console.error('Erro no lembrete de estudo:', error);
  }
}

self.addEventListener('sync', (event) => {
  console.log('Evento de sincronização:', event.tag);
  
  if (event.tag === 'sync-notificacoes') {
    event.waitUntil(
      Promise.all([
        verificarNotificacoesAgendadas(),
        verificarTarefasProximas(),
        verificarEventosProximos(),
        verificarLembreteEstudo()
      ])
    );
  }
});

setInterval(() => {
  verificarNotificacoesAgendadas();
  verificarTarefasProximas();
  verificarEventosProximos();
  verificarLembreteEstudo();
}, 15 * 60 * 1000);

setTimeout(() => {
  verificarNotificacoesAgendadas();
  verificarTarefasProximas();
  verificarEventosProximos();
  verificarLembreteEstudo();
}, 5000);
