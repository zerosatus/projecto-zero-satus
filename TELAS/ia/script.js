// ============================================
// ia/script.js — ASSISTENTE IA (interface estilo IA)
// ============================================
let usuarioAtual = null;
let messages = [];
let isLoading = false;
let notifications = [];
let history = [];
let currentHistoryId = null;

// ---------- TEMA (claro/escuro) ----------
(function initTheme() {
    const saved = localStorage.getItem('ia_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
})();

// ============================================
// INICIALIZAÇÃO
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }

    try {
        usuarioAtual = JSON.parse(usuario);

        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        if (userName) userName.textContent = usuarioAtual.nome || 'Usuário';
        if (userAvatar) {
            const iniciais = usuarioAtual.nome
                ? usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
                : 'U';
            userAvatar.textContent = iniciais;
        }

        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = usuarioAtual.id;
        }
        if (window.initSync) await window.initSync({ force: false });

        carregarHistorico();
        carregarNotificacoes();

        renderChat();
        renderHistoryList();
        setupEvents();
        atualizarBadge();
        atualizarIconeTema();

        document.getElementById('ia-input')?.focus();
        console.log('[IA] 🤖 Assistente inicializado!');
    } catch (e) {
        console.error('[IA] Erro:', e);
    }
});

// ============================================
// HISTÓRICO
// ============================================
function carregarHistorico() {
    if (!usuarioAtual) return;
    const userId = usuarioAtual.id;

    const saved = localStorage.getItem(`${userId}_ia_history`);
    if (saved) {
        try { history = JSON.parse(saved); } catch (e) { history = []; }
    }

    const savedMessages = localStorage.getItem(`${userId}_ia_messages`);
    if (savedMessages) {
        try { messages = JSON.parse(savedMessages); } catch (e) { messages = []; }
    }
}

function salvarHistorico() {
    if (!usuarioAtual) return;
    const userId = usuarioAtual.id;
    localStorage.setItem(`${userId}_ia_history`, JSON.stringify(history));
    localStorage.setItem(`${userId}_ia_messages`, JSON.stringify(messages));
}

function salvarConversaAtual() {
    if (messages.length === 0) return;
    const agora = new Date().toISOString();
    const primeira = messages[0]?.content || 'Nova conversa';
    const titulo = primeira.length > 30 ? primeira.substring(0, 30) + '…' : primeira;

    if (currentHistoryId) {
        const index = history.findIndex(h => h.id === currentHistoryId);
        if (index !== -1) {
            history[index] = {
                ...history[index],
                title: titulo,
                messages: [...messages],
                updatedAt: agora
            };
        }
    } else {
        const newConv = {
            id: Date.now().toString(),
            title: titulo,
            messages: [...messages],
            createdAt: agora,
            updatedAt: agora
        };
        history.push(newConv);
        currentHistoryId = newConv.id;
    }

    salvarHistorico();
    renderHistoryList(document.getElementById('searchInput')?.value || '');
    atualizarTituloChat();
}

// ---------- Sidebar de conversas ----------
function renderHistoryList(filtroTexto = '') {
    const container = document.getElementById('historyList');
    if (!container) return;

    const filtro = filtroTexto.toLowerCase().trim();
    const lista = [...history]
        .filter(c => !filtro || (c.title || '').toLowerCase().includes(filtro))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    if (lista.length === 0) {
        container.innerHTML = `
            <div class="history-empty">
                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                <p>${filtro ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda.<br>Comece uma nova!'}</p>
            </div>`;
        return;
    }

    const grupos = { 'Hoje': [], 'Ontem': [], 'Últimos 7 dias': [], 'Anteriores': [] };
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    lista.forEach(conv => {
        const d = new Date(conv.updatedAt);
        const inicioDia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffDias = Math.floor((inicioHoje - inicioDia) / 86400000);
        if (diffDias <= 0) grupos['Hoje'].push(conv);
        else if (diffDias === 1) grupos['Ontem'].push(conv);
        else if (diffDias <= 7) grupos['Últimos 7 dias'].push(conv);
        else grupos['Anteriores'].push(conv);
    });

    let html = '';
    Object.entries(grupos).forEach(([titulo, convs]) => {
        if (!convs.length) return;
        html += `<div class="history-group-title">${titulo}</div>`;
        convs.forEach(conv => {
            html += `
                <div class="history-item ${conv.id === currentHistoryId ? 'active' : ''}" data-id="${conv.id}">
                    <ion-icon name="chatbubble-outline"></ion-icon>
                    <span class="h-title">${escapeHtml(conv.title)}</span>
                    <button class="h-delete" data-delete="${conv.id}" title="Excluir conversa">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>`;
        });
    });
    container.innerHTML = html;
}

function novaConversa() {
    if (isLoading) return;
    messages = [];
    currentHistoryId = null;
    renderChat();
    renderHistoryList(document.getElementById('searchInput')?.value || '');
    atualizarTituloChat();
    fecharSidebarMobile();
    document.getElementById('ia-input')?.focus();
}

function selecionarConversa(id) {
    if (isLoading) return;
    const conv = history.find(h => h.id === id);
    if (!conv) return;
    currentHistoryId = id;
    messages = [...(conv.messages || [])];
    renderChat();
    renderHistoryList(document.getElementById('searchInput')?.value || '');
    atualizarTituloChat();
    fecharSidebarMobile();
}

function excluirConversa(id) {
    const conv = history.find(h => h.id === id);
    if (!confirm(`Excluir "${conv?.title || 'esta conversa'}"?`)) return;
    history = history.filter(h => h.id !== id);
    if (currentHistoryId === id) {
        currentHistoryId = null;
        messages = [];
        renderChat();
        atualizarTituloChat();
    }
    salvarHistorico();
    renderHistoryList(document.getElementById('searchInput')?.value || '');
    mostrarToast('Conversa excluída!', 'info');
}

function atualizarTituloChat() {
    const el = document.getElementById('chatTitle');
    if (!el) return;
    if (!currentHistoryId) { el.textContent = 'Nova conversa'; return; }
    const conv = history.find(h => h.id === currentHistoryId);
    el.textContent = conv?.title || 'Nova conversa';
}

// ============================================
// RENDER DO CHAT
// ============================================
function renderChat() {
    const container = document.getElementById('ia-messages-container');
    const quickActions = document.getElementById('ia-quick-actions');
    if (!container) return;

    if (messages.length === 0) {
        const hora = new Date().getHours();
        const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
        const nome = usuarioAtual?.nome ? escapeHtml(usuarioAtual.nome.split(' ')[0]) : 'estudante';

        container.innerHTML = `
            <div class="welcome-state">
                <div class="welcome-orb"><ion-icon name="sparkles"></ion-icon></div>
                <h2>${saudacao}, ${nome}!</h2>
                <p>Como posso te ajudar hoje?</p>
            </div>`;
        quickActions?.classList.remove('hidden');
        return;
    }

    quickActions?.classList.add('hidden');

    let html = '';
    messages.forEach(msg => {
        const hora = new Date(msg.timestamp || Date.now())
            .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        if (msg.role === 'user') {
            html += `
                <div class="msg msg-user">
                    <div class="msg-bubble">${formatarResposta(msg.content)}</div>
                </div>`;
        } else {
            html += `
                <div class="msg msg-ai">
                    <div class="msg-avatar"><ion-icon name="sparkles"></ion-icon></div>
                    <div class="msg-body">
                        <div class="msg-meta">
                            <span class="name">Satus IA</span>
                            <span class="time">${hora}</span>
                        </div>
                        <div class="msg-bubble">${formatarResposta(msg.content)}</div>
                    </div>
                </div>`;
        }
    });

    container.innerHTML = html;
    scrollChatFim();
}

function scrollChatFim() {
    const scroller = document.getElementById('chatScroll');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
}

// ============================================
// ENVIAR MENSAGEM
// ============================================
async function sendMessage(text) {
    if (isLoading) return;

    const input = document.getElementById('ia-input');
    if (!text) {
        text = input?.value.trim();
        if (!text) return;
        if (input) {
            input.value = '';
            input.style.height = 'auto';
        }
    }

    messages.push({ role: 'user', content: text, timestamp: new Date().toISOString() });
    renderChat();

    isLoading = true;
    const sendBtn = document.getElementById('ia-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    const container = document.getElementById('ia-messages-container');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'msg msg-ai';
    loadingDiv.innerHTML = `
        <div class="msg-avatar"><ion-icon name="sparkles"></ion-icon></div>
        <div class="msg-body">
            <div class="typing"><span></span><span></span><span></span></div>
        </div>`;
    container.appendChild(loadingDiv);
    scrollChatFim();

    try {
        const resposta = await simularResposta(text);
        loadingDiv.remove();
        messages.push({ role: 'assistant', content: resposta, timestamp: new Date().toISOString() });
        salvarConversaAtual();
    } catch (error) {
        loadingDiv.remove();
        messages.push({
            role: 'assistant',
            content: 'Desculpe, tive um problema. Tente novamente! 😕',
            timestamp: new Date().toISOString()
        });
    }

    isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    renderChat();
}

// ============================================
// SIMULAÇÃO DE RESPOSTA (substitua pela API real)
// ============================================
async function simularResposta(pergunta) {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 800));
    const respostas = [
        "📚 **Ótima pergunta!** Aqui estão algumas dicas que podem te ajudar:\n\n1. **Divida seu estudo** em blocos de 25 minutos com pausas de 5 minutos (técnica Pomodoro)\n2. **Revise o conteúdo** no mesmo dia\n3. **Ensine o que aprendeu** para alguém\n\nEspero que isso ajude! 🚀",
        "🎯 **Que legal que você está buscando melhorar!**\n\nSugiro:\n• Crie um **cronograma de estudos** realista\n• **Elimine distrações** (celular, redes sociais)\n• Use a **técnica Feynman**\n\nQual dessas dicas você vai aplicar hoje?",
        "🧠 **Excelente pergunta!**\n\nA memorização funciona melhor com:\n• **Mapas mentais**\n• **Associações** com coisas que você já conhece\n• **Revisão espaçada** (1 dia, 3 dias, 7 dias)\n• **Escrever à mão**\n\nTente aplicar isso! 📚",
        "📋 **Vamos organizar isso!**\n\nPara organizar seus estudos:\n1. **Liste** todas as matérias e conteúdos\n2. **Priorize** os mais difíceis\n3. **Defina metas** diárias pequenas\n4. **Revise** o planejamento semanalmente\n\nPosso ajudar com mais detalhes!",
        "🧠 **Foco é treino!**\n\nTécnicas para melhorar o foco:\n• **Pomodoro** (25 min foco, 5 min pausa)\n• **Ambiente** sem distrações\n• **Meditação** de 5 minutos\n• **Definir uma meta** clara\n\nComece com pequenos períodos!"
    ];
    return respostas[Math.floor(Math.random() * respostas.length)];
}

// ============================================
// NOTIFICAÇÕES
// ============================================
function carregarNotificacoes() {
    if (!usuarioAtual) return;
    const saved = localStorage.getItem(`${usuarioAtual.id}_notifications`);
    if (saved) {
        try { notifications = JSON.parse(saved); } catch (e) {}
    }
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notifications', null);
        if (cached !== null) notifications = cached;
    }
    atualizarBadge();
}

function atualizarBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const naoLidas = notifications.filter(n => !n.read).length;
    badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
    badge.style.display = naoLidas > 0 ? 'flex' : 'none';
}

function abrirNotifModal() {
    const modal = document.getElementById('notifModal');
    if (modal) {
        modal.classList.add('active');
        renderizarNotificacoes('todas');
        document.body.style.overflow = 'hidden';
    }
}

function fecharNotifModal() {
    const modal = document.getElementById('notifModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderizarNotificacoes(filtro = 'todas') {
    const container = document.getElementById('notifList');
    if (!container) return;

    let filtradas = [...notifications];
    if (filtro === 'nao-lidas') filtradas = notifications.filter(n => !n.read);
    else if (filtro !== 'todas') filtradas = notifications.filter(n => n.type === filtro);

    if (filtradas.length === 0) {
        container.innerHTML = `<div class="notif-empty"><i class="fas fa-bell-slash"></i><p>Nenhuma notificação</p></div>`;
        return;
    }

    const icones = { 'info': 'bell', 'aula': 'book', 'tarefa': 'tasks' };
    const cores = { 'info': 'info', 'aula': 'aula', 'tarefa': 'tarefa' };

    container.innerHTML = filtradas.map(notif => `
        <div class="notif-item ${notif.read ? 'read' : 'unread'}" onclick="marcarNotificacaoLida('${notif.id}')">
            <div class="notif-icon ${cores[notif.type] || 'info'}">
                <i class="fas fa-${icones[notif.type] || 'bell'}"></i>
            </div>
            <div class="notif-content">
                <div class="notif-title">${escapeHtml(notif.title)}</div>
                <div class="notif-message">${escapeHtml(notif.message)}</div>
                <div class="notif-time">${formatarTempoAtras(notif.time)}</div>
            </div>
        </div>`).join('');
}

function marcarNotificacaoLida(id) {
    const notif = notifications.find(n => n.id == id);
    if (notif && !notif.read) {
        notif.read = true;
        if (usuarioAtual) {
            localStorage.setItem(`${usuarioAtual.id}_notifications`, JSON.stringify(notifications));
        }
        if (window.CacheManager) window.CacheManager.set('notifications', notifications, true);
        renderizarNotificacoes(document.querySelector('.notif-tab.active')?.dataset.filter || 'todas');
        atualizarBadge();
    }
}

function formatarTempoAtras(timeString) {
    if (!timeString) return '';
    const now = new Date();
    const diffMins = Math.floor((now - new Date(timeString)) / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    return new Date(timeString).toLocaleDateString('pt-BR');
}

// ============================================
// TEMA
// ============================================
function alternarTema() {
    const atual = document.documentElement.getAttribute('data-theme');
    const novo = atual === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', novo);
    localStorage.setItem('ia_theme', novo);
    atualizarIconeTema();
}

function atualizarIconeTema() {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    const tema = document.documentElement.getAttribute('data-theme');
    icon.setAttribute('name', tema === 'light' ? 'sunny-outline' : 'moon-outline');
}

// ============================================
// SIDEBAR MOBILE
// ============================================
function abrirSidebarMobile() {
    document.getElementById('iaSidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('show');
}

function fecharSidebarMobile() {
    document.getElementById('iaSidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('show');
}

// ============================================
// HELPERS
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatarResposta(text) {
    let safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return safe;
}

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = mensagem;
        toast.style.background =
            tipo === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
            tipo === 'info' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
            'linear-gradient(135deg, #10b981, #059669)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
        alert(mensagem);
    }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    if (confirm('Deseja sair?')) {
        if (messages.length > 0) salvarConversaAtual();
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) window.CacheManager.logout();
        window.location.href = '../login/index.html';
    }
}

// ============================================
// EVENTOS DA UI
// ============================================
function setupEvents() {
    const input = document.getElementById('ia-input');
    const sendBtn = document.getElementById('ia-send-btn');

    // Enviar
    sendBtn?.addEventListener('click', () => sendMessage());

    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-expandir textarea
    input?.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 160) + 'px';
    });

    // Chips de sugestão
    document.querySelectorAll('#ia-quick-actions .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.dataset.prompt;
            if (prompt) sendMessage(prompt);
        });
    });

    // Sidebar de conversas
    document.getElementById('newChatBtn')?.addEventListener('click', novaConversa);
    document.getElementById('searchInput')?.addEventListener('input', (e) => renderHistoryList(e.target.value));

    document.getElementById('historyList')?.addEventListener('click', (e) => {
        const delBtn = e.target.closest('[data-delete]');
        if (delBtn) { excluirConversa(delBtn.dataset.delete); return; }
        const item = e.target.closest('.history-item');
        if (item) selecionarConversa(item.dataset.id);
    });

    // Sidebar mobile
    document.getElementById('menuToggle')?.addEventListener('click', abrirSidebarMobile);
    document.getElementById('sidebarClose')?.addEventListener('click', fecharSidebarMobile);
    document.getElementById('sidebarOverlay')?.addEventListener('click', fecharSidebarMobile);

    // Tema
    document.getElementById('themeToggle')?.addEventListener('click', alternarTema);

    // 🔙 Menu de navegação (voltar às outras telas)
    const navBtn = document.getElementById('navBackBtn');
    const navDropdown = document.getElementById('navDropdown');
    navBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        navDropdown?.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (navDropdown && !navDropdown.contains(e.target) && e.target !== navBtn) {
            navDropdown.classList.remove('open');
        }
    });

    // Notificações
    document.getElementById('bellBtn')?.addEventListener('click', abrirNotifModal);

    document.getElementById('btnMarkAllRead')?.addEventListener('click', () => {
        notifications.forEach(n => n.read = true);
        if (usuarioAtual) localStorage.setItem(`${usuarioAtual.id}_notifications`, JSON.stringify(notifications));
        if (window.CacheManager) window.CacheManager.set('notifications', notifications, true);
        renderizarNotificacoes(document.querySelector('.notif-tab.active')?.dataset.filter || 'todas');
        atualizarBadge();
        mostrarToast('Todas marcadas como lidas!', 'success');
    });

    document.getElementById('btnClearAll')?.addEventListener('click', () => {
        if (confirm('Limpar todas as notificações?')) {
            notifications = [];
            if (usuarioAtual) localStorage.setItem(`${usuarioAtual.id}_notifications`, JSON.stringify(notifications));
            if (window.CacheManager) window.CacheManager.set('notifications', notifications, true);
            renderizarNotificacoes('todas');
            atualizarBadge();
            mostrarToast('Notificações limpas!', 'success');
        }
    });

    document.getElementById('notifModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharNotifModal();
    });

    document.querySelectorAll('.notif-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderizarNotificacoes(tab.dataset.filter);
        });
    });

    // ESC fecha tudo
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fecharNotifModal();
            navDropdown?.classList.remove('open');
        }
    });
}

console.log('%c✨ Satus IA — Interface estilo IA', 'color: #8b5cf6; font-size: 18px; font-weight: bold;');