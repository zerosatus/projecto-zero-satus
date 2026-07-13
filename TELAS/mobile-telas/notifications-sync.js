// ==========================================
// notifications-sync.js - Sincronização com Admin
// ==========================================

console.log('[NotifSync] 📬 Inicializando sincronização de notificações...');

// ==========================================
// VARIÁVEL GLOBAL
// ==========================================
let notifications = [];
let usuarioAtual = null;

// ==========================================
// CARREGAR NOTIFICAÇÕES DO ADMIN
// ==========================================
async function carregarNotificacoesDoAdmin() {
    if (!usuarioAtual) {
        const usuario = localStorage.getItem('usuarioLogado');
        if (!usuario) return;
        try {
            usuarioAtual = JSON.parse(usuario);
        } catch(e) {
            console.error('[NotifSync] Erro ao parsear usuário:', e);
            return;
        }
    }

    const userId = usuarioAtual.id;
    if (!userId) {
        console.warn('[NotifSync] ⚠️ Sem userId');
        return;
    }
    
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.warn('[NotifSync] ⚠️ Supabase não disponível');
            return;
        }
        
        console.log('[NotifSync] 🔍 Buscando notificações para:', userId);
        
        const { data, error } = await client
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('[NotifSync] ❌ Erro ao buscar:', error);
            return;
        }
        
        if (data && data.length > 0) {
            console.log('[NotifSync] ✅ Encontradas:', data.length);
            
            const notificacoes = data.map(n => ({
                id: n.id || String(Date.now() + Math.random()),
                type: n.type || 'info',
                title: n.title || 'Notificação',
                message: n.message || '',
                time: n.created_at || new Date().toISOString(),
                read: n.read || false
            }));
            
            // Salvar localmente
            localStorage.setItem(`${userId}_notifications`, JSON.stringify(notificacoes));
            
            if (window.CacheManager) {
                window.CacheManager.set('notifications', notificacoes, true);
            }
            
            notifications = notificacoes;
            
            // ATUALIZAR BADGE
            atualizarBadgeEmTodasPaginas(notificacoes);
            
            // ATUALIZAR LISTA
            renderizarNotificacoesEmTodasPaginas(notificacoes);
        } else {
            console.log('[NotifSync] ℹ️ Nenhuma notificação encontrada');
            // Garantir que o badge suma
            atualizarBadgeEmTodasPaginas([]);
        }
    } catch (error) {
        console.error('[NotifSync] ❌ Erro:', error);
    }
}

// ==========================================
// ATUALIZAR BADGE EM TODAS AS PÁGINAS
// ==========================================
function atualizarBadgeEmTodasPaginas(notificacoes) {
    const naoLidas = (notificacoes || []).filter(n => !n.read).length;
    
    // Procurar badge em qualquer lugar da página
    const badges = document.querySelectorAll('.icon-btn .badge, .notif-badge');
    
    badges.forEach(badge => {
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    });
}

// ==========================================
// RENDERIZAR NOTIFICAÇÕES
// ==========================================
function renderizarNotificacoesEmTodasPaginas(notificacoes, filtro = 'todas') {
    const container = document.getElementById('notifList');
    if (!container) return;

    let filtradas = [...notificacoes];
    
    if (filtro === 'nao-lidas') {
        filtradas = filtradas.filter(n => !n.read);
    } else if (filtro === 'aulas') {
        filtradas = filtradas.filter(n => n.type === 'aula');
    } else if (filtro === 'tarefas') {
        filtradas = filtradas.filter(n => n.type === 'tarefa');
    }

    if (filtradas.length === 0) {
        container.innerHTML = `
            <div class="notif-empty">
                <i class="fas fa-bell-slash"></i>
                <p>Nenhuma notificação</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtradas.map(notif => `
        <div class="notif-item ${notif.read ? 'read' : 'unread'}" onclick="marcarNotificacaoLida('${notif.id}')">
            <div class="notif-icon ${notif.type || 'info'}">
                <i class="fas fa-${notif.type === 'aula' ? 'book' : notif.type === 'tarefa' ? 'tasks' : 'bell'}"></i>
            </div>
            <div class="notif-content">
                <div class="notif-title">${escapeHtml(notif.title)}</div>
                <div class="notif-message">${escapeHtml(notif.message)}</div>
                <div class="notif-time">${formatarTempoRelativo(notif.time)}</div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// MARCAR COMO LIDA
// ==========================================
window.marcarNotificacaoLida = async function(id) {
    const notif = notifications.find(n => n.id == id);
    if (!notif || notif.read) return;
    
    notif.read = true;
    
    // Salvar localmente
    const userId = usuarioAtual?.id;
    if (userId) {
        localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
    }
    
    if (window.CacheManager) {
        window.CacheManager.set('notifications', notifications, true);
    }
    
    // Marcar no Supabase
    try {
        const client = window.supabaseClient;
        if (client && userId) {
            await client
                .from('notifications')
                .update({ read: true })
                .eq('id', id);
            console.log('[NotifSync] ✅ Marcado como lida no Supabase');
        }
    } catch (error) {
        console.error('[NotifSync] ❌ Erro ao marcar no Supabase:', error);
    }
    
    // Atualizar UI
    atualizarBadgeEmTodasPaginas(notifications);
    renderizarNotificacoesEmTodasPaginas(notifications);
};

// ==========================================
// MARCAR TODAS COMO LIDAS
// ==========================================
window.marcarTodasNotificacoesLidas = async function() {
    notifications.forEach(n => n.read = true);
    
    const userId = usuarioAtual?.id;
    if (userId) {
        localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
    }
    
    if (window.CacheManager) {
        window.CacheManager.set('notifications', notifications, true);
    }
    
    try {
        const client = window.supabaseClient;
        if (client && userId) {
            await client
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);
            console.log('[NotifSync] ✅ Todas marcadas como lidas no Supabase');
        }
    } catch (error) {
        console.error('[NotifSync] ❌ Erro ao marcar todas:', error);
    }
    
    atualizarBadgeEmTodasPaginas(notifications);
    renderizarNotificacoesEmTodasPaginas(notifications);
    mostrarToast('Todas as notificações marcadas como lidas!', 'success');
};

// ==========================================
// HELPERS
// ==========================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatarTempoRelativo(timeString) {
    if (!timeString) return '';
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMins = Math.floor((now - notifTime) / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    return notifTime.toLocaleDateString('pt-BR');
}

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const span = toast.querySelector('span');
    if (span) span.textContent = mensagem;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==========================================
// INICIALIZAR AUTOMATICAMENTE
// ==========================================
async function initNotificacoes() {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) return;
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        // Carregar notificações locais primeiro
        const userId = usuarioAtual.id;
        const saved = localStorage.getItem(`${userId}_notifications`);
        if (saved) {
            notifications = JSON.parse(saved);
            atualizarBadgeEmTodasPaginas(notifications);
        }
        
        // Depois buscar do Supabase
        await carregarNotificacoesDoAdmin();
        
        console.log('[NotifSync] ✅ Inicializado com sucesso');
    } catch(e) {
        console.error('[NotifSync] ❌ Erro ao inicializar:', e);
    }
}

// Auto-init
if (document.readyState === 'complete') {
    setTimeout(initNotificacoes, 500);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initNotificacoes, 500);
    });
}

// Escutar eventos de sincronização
window.addEventListener('cloudDataLoaded', () => {
    console.log('[NotifSync] 📡 cloudDataLoaded - sincronizando...');
    carregarNotificacoesDoAdmin();
});

window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('_notifications')) {
        console.log('[NotifSync] 📡 Mudança em outra aba');
        const userId = usuarioAtual?.id;
        if (userId && e.key.includes(userId)) {
            const saved = localStorage.getItem(e.key);
            if (saved) {
                notifications = JSON.parse(saved);
                atualizarBadgeEmTodasPaginas(notifications);
                renderizarNotificacoesEmTodasPaginas(notifications);
            }
        }
    }
});

// ==========================================
// EXPORTAR FUNÇÕES GLOBAIS
// ==========================================
window.carregarNotificacoesDoAdmin = carregarNotificacoesDoAdmin;
window.notifications = notifications;

console.log('[NotifSync] ✅ Módulo carregado!');