// ==========================================
// notifications-sync.js - Sincronização com Admin
// ==========================================

console.log('[NotifSync] 📬 Inicializando sincronização de notificações...');

// ==========================================
// VARIÁVEL GLOBAL (NÃO DECLARAR NOVAMENTE)
// ==========================================
// Usar a variável já existente ou criar uma única
if (typeof window._notifications === 'undefined') {
    window._notifications = [];
}
let notifications = window._notifications;

// Não declarar usuarioAtual aqui - usar a da página
// Ou usar uma variável separada
let _usuarioNotif = null;

// ==========================================
// CARREGAR NOTIFICAÇÕES DO ADMIN
// ==========================================
async function carregarNotificacoesDoAdmin() {
    // Tentar obter o usuário da variável global da página
    let usuario = window.usuarioAtual || window._usuarioAtual;
    
    if (!usuario) {
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (!usuarioSalvo) {
            console.warn('[NotifSync] ⚠️ Nenhum usuário logado');
            return;
        }
        try {
            usuario = JSON.parse(usuarioSalvo);
            // Salvar para uso futuro
            _usuarioNotif = usuario;
        } catch(e) {
            console.error('[NotifSync] ❌ Erro ao parsear usuário:', e);
            return;
        }
    }

    const userId = usuario.id || usuario.uid;
    if (!userId) {
        console.warn('[NotifSync] ⚠️ Sem userId');
        return;
    }
    
    try {
        // Tentar obter o cliente Supabase de diferentes formas
        let client = window.supabaseClient;
        
        if (!client) {
            console.warn('[NotifSync] ⚠️ Supabase não disponível via window.supabaseClient');
            // Tentar via window.SupabaseClient
            if (window.SupabaseClient && window.SupabaseClient.getClient) {
                client = window.SupabaseClient.getClient();
            }
        }
        
        if (!client) {
            console.warn('[NotifSync] ⚠️ Supabase não disponível - carregando do cache/local');
            // Tentar carregar do CacheManager
            if (window.CacheManager) {
                const cached = window.CacheManager.get('notifications', null);
                if (cached && cached.length > 0) {
                    notifications = cached;
                    window._notifications = notifications;
                    localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
                    atualizarBadgeEmTodasPaginas(notifications);
                    renderizarNotificacoesEmTodasPaginas(notifications);
                    console.log('[NotifSync] ✅ Notificações carregadas do cache:', notifications.length);
                }
            }
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
            // Fallback para cache
            if (window.CacheManager) {
                const cached = window.CacheManager.get('notifications', null);
                if (cached && cached.length > 0) {
                    notifications = cached;
                    window._notifications = notifications;
                    atualizarBadgeEmTodasPaginas(notifications);
                    renderizarNotificacoesEmTodasPaginas(notifications);
                }
            }
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
            window._notifications = notifications;
            
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
    const badges = document.querySelectorAll('.icon-btn .badge, .notif-badge, .badge');
    
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
    
    // Obter usuário
    let usuario = window.usuarioAtual || window._usuarioAtual || _usuarioNotif;
    if (!usuario) {
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (usuarioSalvo) {
            try { usuario = JSON.parse(usuarioSalvo); } catch(e) {}
        }
    }
    
    const userId = usuario?.id || usuario?.uid;
    
    if (userId) {
        localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
    }
    
    if (window.CacheManager) {
        window.CacheManager.set('notifications', notifications, true);
    }
    
    // Marcar no Supabase
    try {
        let client = window.supabaseClient || (window.SupabaseClient?.getClient ? window.SupabaseClient.getClient() : null);
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
    
    let usuario = window.usuarioAtual || window._usuarioAtual || _usuarioNotif;
    if (!usuario) {
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (usuarioSalvo) {
            try { usuario = JSON.parse(usuarioSalvo); } catch(e) {}
        }
    }
    
    const userId = usuario?.id || usuario?.uid;
    
    if (userId) {
        localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
    }
    
    if (window.CacheManager) {
        window.CacheManager.set('notifications', notifications, true);
    }
    
    try {
        let client = window.supabaseClient || (window.SupabaseClient?.getClient ? window.SupabaseClient.getClient() : null);
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
// FUNÇÃO PARA FILTRAR NOTIFICAÇÕES
// ==========================================
window.filtrarNotificacoes = function(filtro, btn) {
    if (btn) {
        document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
    }
    renderizarNotificacoesEmTodasPaginas(notifications, filtro);
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
    if (!toast) {
        console.log('[Toast]', mensagem);
        return;
    }
    const span = toast.querySelector('span');
    if (span) span.textContent = mensagem;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==========================================
// INICIALIZAR AUTOMATICAMENTE
// ==========================================
async function initNotificacoes() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        console.log('[NotifSync] ⚠️ Nenhum usuário logado');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioSalvo);
        _usuarioNotif = usuario;
        
        // Carregar notificações locais primeiro
        const userId = usuario.id || usuario.uid;
        if (userId) {
            const saved = localStorage.getItem(`${userId}_notifications`);
            if (saved) {
                try {
                    notifications = JSON.parse(saved);
                    window._notifications = notifications;
                    atualizarBadgeEmTodasPaginas(notifications);
                } catch(e) {}
            }
        }
        
        // Depois buscar do Supabase
        await carregarNotificacoesDoAdmin();
        
        console.log('[NotifSync] ✅ Inicializado com sucesso');
    } catch(e) {
        console.error('[NotifSync] ❌ Erro ao inicializar:', e);
    }
}

// ==========================================
// EXPORTAR FUNÇÕES GLOBAIS
// ==========================================
window.carregarNotificacoesDoAdmin = carregarNotificacoesDoAdmin;
window.renderizarNotificacoesEmTodasPaginas = renderizarNotificacoesEmTodasPaginas;
window.atualizarBadgeEmTodasPaginas = atualizarBadgeEmTodasPaginas;

// Expor também para compatibilidade
window.carregarNotificacoes = carregarNotificacoesDoAdmin;

// ==========================================
// INICIAR
// ==========================================
if (document.readyState === 'complete') {
    setTimeout(initNotificacoes, 800);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initNotificacoes, 800);
    });
}

// Escutar eventos
window.addEventListener('cloudDataLoaded', () => {
    console.log('[NotifSync] 📡 cloudDataLoaded - sincronizando...');
    setTimeout(carregarNotificacoesDoAdmin, 300);
});

window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('_notifications')) {
        console.log('[NotifSync] 📡 Mudança em outra aba');
        const usuario = _usuarioNotif || window.usuarioAtual;
        if (usuario && e.key.includes(usuario.id || usuario.uid)) {
            const saved = localStorage.getItem(e.key);
            if (saved) {
                try {
                    notifications = JSON.parse(saved);
                    window._notifications = notifications;
                    atualizarBadgeEmTodasPaginas(notifications);
                    renderizarNotificacoesEmTodasPaginas(notifications);
                } catch(e) {}
            }
        }
    }
});

console.log('[NotifSync] ✅ Módulo carregado!');