// ==========================================
// notifications-sync.js - Com POP-UP de notificações
// ==========================================

console.log('[NotifSync] 📬 Inicializando sincronização de notificações...');

// ==========================================
// VARIÁVEIS
// ==========================================
let notifications = [];
let _usuarioNotif = null;

// ==========================================
// ADICIONAR CSS PARA ANIMAÇÕES
// ==========================================
function adicionarEstilosPopUp() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(120%); opacity: 0; }
        }
        .notificacao-popup {
            animation: slideInRight 0.4s ease-out;
        }
        .notificacao-popup:hover {
            transform: scale(1.02);
            transition: transform 0.2s;
        }
        .notificacao-popup .popup-close:hover {
            background: rgba(239, 68, 68, 0.2);
            border-radius: 50%;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// MOSTRAR POP-UP DE NOTIFICAÇÃO
// ==========================================
function mostrarPopUpNotificacao(notificacao) {
    if (!notificacao) return;
    
    const notifId = notificacao.id;
    if (localStorage.getItem(`notif_shown_${notifId}`)) {
        return;
    }
    
    localStorage.setItem(`notif_shown_${notifId}`, 'true');
    
    const icones = {
        'info': '🔔',
        'aula': '📚',
        'tarefa': '✅',
        'warning': '⚠️',
        'success': '🎉'
    };
    const icone = icones[notificacao.type] || '🔔';
    
    const popup = document.createElement('div');
    popup.className = 'notificacao-popup';
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 1px solid rgba(147, 51, 234, 0.3);
        border-radius: 12px;
        padding: 16px 20px;
        max-width: 380px;
        z-index: 9999;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        display: flex;
        gap: 12px;
        align-items: flex-start;
        color: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        cursor: pointer;
        transition: transform 0.2s;
    `;
    
    popup.innerHTML = `
        <div style="font-size: 24px; flex-shrink: 0;">${icone}</div>
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #a855f7;">
                ${escapeHtml(notificacao.title || 'Notificação')}
            </div>
            <div style="font-size: 13px; color: #94a3b8; line-height: 1.4; word-wrap: break-word;">
                ${escapeHtml(notificacao.message || '')}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                ${formatarTempoRelativo(notificacao.time)}
            </div>
        </div>
        <button class="popup-close" onclick="event.stopPropagation(); this.closest('.notificacao-popup').remove();" style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 16px; padding: 4px 8px; border-radius: 50%; transition: all 0.2s; flex-shrink: 0;">
            ✕
        </button>
    `;
    
    // Clicar no popup abre o modal de notificações
    popup.addEventListener('click', function(e) {
        if (e.target.closest('.popup-close')) return;
        this.remove();
        // Tentar abrir o modal de notificações
        if (typeof abrirNotifModal === 'function') {
            abrirNotifModal();
        } else if (typeof window.abrirNotifModal === 'function') {
            window.abrirNotifModal();
        }
    });
    
    document.body.appendChild(popup);
    
    // Remover após 6 segundos
    setTimeout(() => {
        if (popup.parentElement) {
            popup.style.transition = 'all 0.3s ease-in';
            popup.style.transform = 'translateX(120%)';
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 300);
        }
    }, 6000);
    
    // Tocar som
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACBhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqF');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch(e) {}
}

// ==========================================
// OBTER CLIENTE SUPABASE
// ==========================================
function getSupabaseClient() {
    let client = null;
    
    if (window.supabaseClient) {
        client = window.supabaseClient;
        console.log('[NotifSync] ✅ Cliente via window.supabaseClient');
        return client;
    }
    
    if (window.SupabaseClient) {
        if (typeof window.SupabaseClient.getClient === 'function') {
            client = window.SupabaseClient.getClient();
        } else if (window.SupabaseClient.client) {
            client = window.SupabaseClient.client;
        } else if (window.SupabaseClient.supabase) {
            client = window.SupabaseClient.supabase;
        }
        if (client) {
            console.log('[NotifSync] ✅ Cliente via window.SupabaseClient');
            return client;
        }
    }
    
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[NotifSync] ✅ Cliente criado manualmente');
        return client;
    }
    
    console.warn('[NotifSync] ⚠️ Nenhum cliente Supabase encontrado');
    return null;
}

// ==========================================
// CARREGAR NOTIFICAÇÕES DO ADMIN
// ==========================================
async function carregarNotificacoesDoAdmin() {
    let usuario = window.usuarioAtual || window._usuarioAtual;
    
    if (!usuario) {
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (!usuarioSalvo) {
            console.warn('[NotifSync] ⚠️ Nenhum usuário logado');
            return;
        }
        try {
            usuario = JSON.parse(usuarioSalvo);
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
    
    // Carregar do cache primeiro
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notifications', null);
        if (cached && cached.length > 0) {
            const oldCount = notifications.length;
            notifications = cached;
            console.log('[NotifSync] 📦 Notificações carregadas do cache:', notifications.length);
            
            // Verificar novas notificações
            if (notifications.length > oldCount) {
                const novas = notifications.slice(0, notifications.length - oldCount);
                novas.forEach(n => {
                    if (!localStorage.getItem(`notif_shown_${n.id}`) && !n.read) {
                        setTimeout(() => mostrarPopUpNotificacao(n), 500);
                    }
                });
            }
            
            localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
            atualizarBadgeEmTodasPaginas(notifications);
            renderizarNotificacoesEmTodasPaginas(notifications);
        }
    }
    
    // Tentar do Supabase
    try {
        const client = getSupabaseClient();
        
        if (!client) {
            console.log('[NotifSync] ℹ️ Supabase não disponível - usando cache');
            const saved = localStorage.getItem(`${userId}_notifications`);
            if (saved && !notifications.length) {
                try {
                    notifications = JSON.parse(saved);
                    atualizarBadgeEmTodasPaginas(notifications);
                    renderizarNotificacoesEmTodasPaginas(notifications);
                } catch(e) {}
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
            return;
        }
        
        if (data && data.length > 0) {
            console.log('[NotifSync] ✅ Encontradas:', data.length, 'notificações');
            
            const notificacoes = data.map(n => ({
                id: n.id || String(Date.now() + Math.random()),
                type: n.type || 'info',
                title: n.title || 'Notificação',
                message: n.message || '',
                time: n.created_at || new Date().toISOString(),
                read: n.read || false
            }));
            
            // Verificar novas notificações (comparar com as atuais)
            const idsAtuais = new Set(notifications.map(n => n.id));
            const novasNotificacoes = notificacoes.filter(n => !idsAtuais.has(n.id) && !n.read);
            
            // Mostrar pop-ups para novas notificações
            novasNotificacoes.slice(0, 3).forEach(n => {
                setTimeout(() => mostrarPopUpNotificacao(n), 300);
            });
            
            // Mesclar com existentes
            const merged = [...notificacoes];
            if (notifications.length > 0) {
                const existingIds = new Set(merged.map(n => n.id));
                notifications.forEach(n => {
                    if (!existingIds.has(n.id)) {
                        merged.push(n);
                    }
                });
            }
            
            // Salvar
            localStorage.setItem(`${userId}_notifications`, JSON.stringify(merged));
            
            if (window.CacheManager) {
                window.CacheManager.set('notifications', merged, true);
            }
            
            notifications = merged;
            
            // ATUALIZAR UI
            atualizarBadgeEmTodasPaginas(notifications);
            renderizarNotificacoesEmTodasPaginas(notifications);
        } else {
            console.log('[NotifSync] ℹ️ Nenhuma notificação encontrada no Supabase');
            if (notifications.length === 0) {
                const saved = localStorage.getItem(`${userId}_notifications`);
                if (saved) {
                    try {
                        notifications = JSON.parse(saved);
                        atualizarBadgeEmTodasPaginas(notifications);
                        renderizarNotificacoesEmTodasPaginas(notifications);
                    } catch(e) {}
                } else {
                    const welcomeNotif = [{
                        id: 'welcome-' + Date.now(),
                        type: 'info',
                        title: 'Bem-vindo! 🎉',
                        message: 'Sistema de notificações ativo!',
                        time: new Date().toISOString(),
                        read: false
                    }];
                    notifications = welcomeNotif;
                    localStorage.setItem(`${userId}_notifications`, JSON.stringify(welcomeNotif));
                    if (window.CacheManager) {
                        window.CacheManager.set('notifications', welcomeNotif, true);
                    }
                    atualizarBadgeEmTodasPaginas(welcomeNotif);
                    renderizarNotificacoesEmTodasPaginas(welcomeNotif);
                    
                    // Mostrar pop-up de boas-vindas
                    setTimeout(() => mostrarPopUpNotificacao(welcomeNotif[0]), 1000);
                }
            }
        }
    } catch (error) {
        console.error('[NotifSync] ❌ Erro ao carregar notificações:', error);
    }
}

// ==========================================
// ATUALIZAR BADGE
// ==========================================
function atualizarBadgeEmTodasPaginas(notificacoes) {
    const naoLidas = (notificacoes || []).filter(n => !n.read).length;
    
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
        const client = getSupabaseClient();
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
        const client = getSupabaseClient();
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
// FILTRAR NOTIFICAÇÕES
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
// INICIALIZAR
// ==========================================
async function initNotificacoes() {
    // Adicionar estilos CSS
    adicionarEstilosPopUp();
    
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        console.log('[NotifSync] ⚠️ Nenhum usuário logado');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioSalvo);
        _usuarioNotif = usuario;
        
        const userId = usuario.id || usuario.uid;
        
        if (userId) {
            const saved = localStorage.getItem(`${userId}_notifications`);
            if (saved) {
                try {
                    notifications = JSON.parse(saved);
                    atualizarBadgeEmTodasPaginas(notifications);
                    renderizarNotificacoesEmTodasPaginas(notifications);
                } catch(e) {}
            }
        }
        
        await carregarNotificacoesDoAdmin();
        
        // Verificar notificações não lidas periodicamente
        setInterval(() => {
            const naoLidas = notifications.filter(n => !n.read);
            if (naoLidas.length > 0) {
                // Verificar se alguma não foi mostrada
                naoLidas.forEach(n => {
                    if (!localStorage.getItem(`notif_shown_${n.id}`)) {
                        mostrarPopUpNotificacao(n);
                    }
                });
            }
        }, 30000);
        
        console.log('[NotifSync] ✅ Inicializado com sucesso,', notifications.length, 'notificações');
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
window.mostrarPopUpNotificacao = mostrarPopUpNotificacao;
window.notifications = notifications;

window.carregarNotificacoes = carregarNotificacoesDoAdmin;
window.filtrarNotif = window.filtrarNotificacoes;
window.marcarTodasNotifLidas = window.marcarTodasNotificacoesLidas;

// ==========================================
// INICIAR AUTOMATICAMENTE
// ==========================================
if (document.readyState === 'complete') {
    setTimeout(initNotificacoes, 800);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initNotificacoes, 800);
    });
}

window.addEventListener('cloudDataLoaded', () => {
    console.log('[NotifSync] 📡 cloudDataLoaded - sincronizando...');
    setTimeout(carregarNotificacoesDoAdmin, 500);
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
                    atualizarBadgeEmTodasPaginas(notifications);
                    renderizarNotificacoesEmTodasPaginas(notifications);
                } catch(e) {}
            }
        }
    }
});

console.log('[NotifSync] ✅ Módulo carregado com POP-UP!');

// ============================================
// ESCUTAR NOTIFICAÇÕES EM TEMPO REAL
// ============================================

// 🔥 RECARREGAR NOTIFICAÇÕES PERIODICAMENTE
setInterval(() => {
    console.log('[NotifSync] 🔄 Verificando novas notificações...');
    carregarNotificacoesDoAdmin();
}, 30000); // A cada 30 segundos

// 🔥 RECARREGAR QUANDO A PÁGINA VOLTAR AO FOCO
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('[NotifSync] 📱 Página voltou ao foco - recarregando notificações');
        carregarNotificacoesDoAdmin();
    }
});

// 🔥 RECARREGAR QUANDO O USUÁRIO FIZER ALGUMA AÇÃO
// Exemplo: clicar no sino
document.addEventListener('click', (e) => {
    const bellBtn = e.target.closest('.icon-btn, .btn-notification, #bellBtn');
    if (bellBtn) {
        console.log('[NotifSync] 🔔 Sino clicado - recarregando notificações');
        carregarNotificacoesDoAdmin();
    }
});

// 🔥 FORÇAR RECARREGAMENTO VIA EVENTO GLOBAL
window.forcarRecarregarNotificacoes = function() {
    console.log('[NotifSync] 🔄 Forçando recarregamento de notificações');
    carregarNotificacoesDoAdmin();
};