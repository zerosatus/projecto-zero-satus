// modules/ia.js - VERSÃO CORRIGIDA (SUBSTITUIR COMPLETAMENTE)
// ============================================
// modules/ia.js - MÓDULO DA IA COM MULTI-API
// ============================================

class IaModule {
    constructor(app) {
        this.app = app;
        this.name = 'ia';
        this.messages = [];
        this.history = [];
        this.currentHistoryId = null;
        this.isLoading = false;
        this.notifications = [];
        this._modoGiria = false;
        
        console.log('[IA] 🤖 Módulo inicializado');
    }
    
    render(data) {
        this.notifications = data.notifications || [];
        this.profile = data.profile || {};
        this.usuarioAtual = this.app.user || {};
        
        this.carregarHistorico();
        this.renderChat();
        this.renderHistoryList();
        this.atualizarNomeUsuario();
        this.updateBadge();
        this.setupEvents();
        this._atualizarStatusGiria();
        this._atualizarStatusLimite();
        
        document.getElementById('ia-input')?.focus();
    }
    
    // ============================================
    // HISTÓRICO
    // ============================================
    carregarHistorico() {
        if (!this.usuarioAtual) return;
        const userId = this.usuarioAtual.id;
        
        try { 
            this.history = JSON.parse(localStorage.getItem(`${userId}_ia_history`) || '[]'); 
        } catch (e) { this.history = []; }
        
        try { 
            this.messages = JSON.parse(localStorage.getItem(`${userId}_ia_messages`) || '[]'); 
        } catch (e) { this.messages = []; }
        
        this.currentHistoryId = localStorage.getItem(`${userId}_ia_current`);
    }
    
    salvarHistorico() {
        if (!this.usuarioAtual) return;
        const userId = this.usuarioAtual.id;
        localStorage.setItem(`${userId}_ia_history`, JSON.stringify(this.history));
        localStorage.setItem(`${userId}_ia_messages`, JSON.stringify(this.messages));
    }
    
    salvarConversaAtual() {
        if (this.messages.length === 0) return;
        const agora = new Date().toISOString();
        const primeira = this.messages[0]?.content || 'Nova conversa';
        const titulo = primeira.length > 30 ? primeira.substring(0, 30) + '…' : primeira;
        
        if (this.currentHistoryId) {
            const index = this.history.findIndex(h => h.id === this.currentHistoryId);
            if (index !== -1) {
                this.history[index] = {
                    ...this.history[index],
                    title: titulo,
                    messages: [...this.messages],
                    updatedAt: agora
                };
            }
        } else {
            const newConv = {
                id: Date.now().toString(),
                title: titulo,
                messages: [...this.messages],
                createdAt: agora,
                updatedAt: agora
            };
            this.history.push(newConv);
            this.currentHistoryId = newConv.id;
        }
        
        this.salvarHistorico();
        this.renderHistoryList();
        this.atualizarTituloChat();
    }
    
    renderHistoryList(filtroTexto = '') {
        const container = document.getElementById('historyList');
        if (!container) return;
        
        const filtro = filtroTexto.toLowerCase().trim();
        const lista = [...this.history]
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
                    <div class="history-item ${conv.id === this.currentHistoryId ? 'active' : ''}" data-id="${conv.id}">
                        <ion-icon name="chatbubble-outline"></ion-icon>
                        <span class="h-title">${this.app.escapeHtml(conv.title)}</span>
                        <button class="h-delete" data-delete="${conv.id}" title="Excluir conversa">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>`;
            });
        });
        container.innerHTML = html;
    }
    
    renderChat() {
        const container = document.getElementById('ia-messages-container');
        const quickActions = document.getElementById('ia-quick-actions');
        if (!container) return;
        
        if (this.messages.length === 0) {
            const hora = new Date().getHours();
            const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
            const nome = this.usuarioAtual?.nome ? this.app.escapeHtml(this.usuarioAtual.nome.split(' ')[0]) : 'estudante';
            
            container.innerHTML = `
                <div class="welcome-state">
                    <div class="welcome-orb"><ion-icon name="sparkles"></ion-icon></div>
                    <h2>${saudacao}, ${nome}!</h2>
                    <p>Como posso te ajudar hoje?</p>
                </div>`;
            if (quickActions) quickActions.classList.remove('hidden');
            return;
        }
        
        if (quickActions) quickActions.classList.add('hidden');
        
        let html = '';
        this.messages.forEach(msg => {
            const hora = new Date(msg.timestamp || Date.now())
                .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            if (msg.role === 'user') {
                html += `
                    <div class="msg msg-user">
                        <div class="msg-bubble">${this.formatarResposta(msg.content)}</div>
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
                            <div class="msg-bubble">${this.formatarResposta(msg.content)}</div>
                        </div>
                    </div>`;
            }
        });
        
        container.innerHTML = html;
        this.scrollChatFim();
    }
    
    scrollChatFim() {
        const scroller = document.getElementById('chatScroll');
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }
    
    // ============================================
    // ⭐ ENVIAR MENSAGEM (COM MULTI-API)
    // ============================================
    async sendMessage(text) {
        if (this.isLoading) return;
        
        const input = document.getElementById('ia-input');
        if (!text) {
            text = input?.value.trim();
            if (!text) return;
            if (input) {
                input.value = '';
                input.style.height = 'auto';
            }
        }
        
        this.messages.push({ role: 'user', content: text, timestamp: new Date().toISOString() });
        this.renderChat();
        
        this.isLoading = true;
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
        this.scrollChatFim();
        
        try {
            // ⭐ USAR MULTI-AI SERVICE
            const service = window.MultiAIService;
            if (service) {
                const context = this.buildUserContext(text);
                const result = await service.sendMessage(text, context);
                
                loadingDiv.remove();
                
                let resposta = result.text;
                if (result.fromCache) resposta += '\n\n*(Resposta do cache)*';
                if (result.provider) resposta += `\n\n*(via ${result.provider})*`;
                
                this.messages.push({ role: 'assistant', content: resposta, timestamp: new Date().toISOString() });
                this.salvarConversaAtual();
            } else {
                // Fallback local se MultiAI não estiver disponível
                loadingDiv.remove();
                const resposta = this._getFallbackResponse(text);
                this.messages.push({ role: 'assistant', content: resposta, timestamp: new Date().toISOString() });
                this.salvarConversaAtual();
            }
        } catch (error) {
            loadingDiv.remove();
            this.messages.push({
                role: 'assistant',
                content: '❌ Ocorreu um erro. Tenta novamente!',
                timestamp: new Date().toISOString()
            });
        }
        
        this.isLoading = false;
        if (sendBtn) sendBtn.disabled = false;
        this.renderChat();
        this._atualizarStatusLimite();
    }
    
    // ============================================
    // ⭐ BUILD USER CONTEXT
    // ============================================
    buildUserContext(textoUsuario) {
        const user = this.app.user || {};
        const data = this.app.data || {};
        const tasks = data.tasks || [];
        const pendentes = tasks.filter(t => !t.completed).length;
        const materias = (data.disciplinas || []).length;
        const notas = (data.notes || []).length;
        
        let contexto = `
📚 CONTEXTO DO ESTUDANTE
Nome: ${user.nome || 'Estudante'}
Tarefas pendentes: ${pendentes}
Disciplinas: ${materias}
Notas: ${notas}
`;
        return contexto;
    }
    
    // ============================================
    // ⭐ FALLBACK
    // ============================================
    _getFallbackResponse(texto) {
        const perguntas = texto.toLowerCase();
        if (perguntas.includes('oi') || perguntas.includes('olá')) {
            return 'Olá! Como posso ajudar você hoje?';
        }
        if (perguntas.includes('estudar') || perguntas.includes('estudos')) {
            return 'Para estudar de forma eficiente: 1) Criar um cronograma, 2) Usar técnicas como Pomodoro, 3) Revisar o conteúdo regularmente.';
        }
        if (perguntas.includes('tarefa') || perguntas.includes('dever')) {
            return 'Para gerenciar suas tarefas: priorize as mais urgentes, divida em pequenas etapas e defina prazos realistas.';
        }
        return 'Desculpe, não entendi sua pergunta. Poderia reformular? Estou aqui para ajudar!';
    }
    
    // ============================================
    // HELPERS
    // ============================================
    formatarResposta(text) {
        let safe = this.app.escapeHtml(text);
        safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/\n/g, '<br>');
        return safe;
    }
    
    atualizarTituloChat() {
        const el = document.getElementById('chatTitle');
        if (!el) return;
        if (!this.currentHistoryId) { el.textContent = 'Nova conversa'; return; }
        const conv = this.history.find(h => h.id === this.currentHistoryId);
        el.textContent = conv?.title || 'Nova conversa';
    }
    
    atualizarNomeUsuario() {
        const profile = this.profile || this.app.user || {};
        const nome = profile.nome || profile.displayName || 'Usuário';
        
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = nome;
        if (userAvatar) {
            const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
            userAvatar.textContent = iniciais || 'U';
        }
    }
    
    _atualizarStatusLimite() {
        const limiteEl = document.getElementById('ia-limite-status');
        if (!limiteEl) return;
        if (window.getLimiteIA) {
            const info = window.getLimiteIA();
            limiteEl.textContent = `💬 ${info.restante}/${info.maximo} perguntas hoje`;
            limiteEl.style.color = info.restante < 3 ? 'var(--accent-red)' : 'var(--text-secondary)';
        }
    }
    
    _atualizarStatusGiria() {
        // Implementar se necessário
    }
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        if (badge) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }
    
    // ============================================
    // EVENTOS
    // ============================================
    setupEvents() {
        const input = document.getElementById('ia-input');
        const sendBtn = document.getElementById('ia-send-btn');
        
        sendBtn?.addEventListener('click', () => this.sendMessage());
        
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        input?.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 160) + 'px';
        });
        
        document.querySelectorAll('#ia-quick-actions .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.dataset.prompt;
                if (prompt) this.sendMessage(prompt);
            });
        });
        
        document.getElementById('newChatBtn')?.addEventListener('click', () => {
            if (this.isLoading) return;
            this.messages = [];
            this.currentHistoryId = null;
            this.renderChat();
            this.renderHistoryList();
            this.atualizarTituloChat();
            document.getElementById('ia-input')?.focus();
        });
        
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.renderHistoryList(e.target.value);
        });
        
        document.getElementById('historyList')?.addEventListener('click', (e) => {
            const delBtn = e.target.closest('[data-delete]');
            if (delBtn) { 
                const id = delBtn.dataset.delete;
                const conv = this.history.find(h => h.id === id);
                if (!confirm(`Excluir "${conv?.title || 'esta conversa'}"?`)) return;
                this.history = this.history.filter(h => h.id !== id);
                if (this.currentHistoryId === id) {
                    this.currentHistoryId = null;
                    this.messages = [];
                    this.renderChat();
                    this.atualizarTituloChat();
                }
                this.salvarHistorico();
                this.renderHistoryList();
                this.showToast('Conversa excluída!', 'info');
                return;
            }
            const item = e.target.closest('.history-item');
            if (item && !this.isLoading) {
                const id = item.dataset.id;
                const conv = this.history.find(h => h.id === id);
                if (!conv) return;
                this.currentHistoryId = id;
                this.messages = [...(conv.messages || [])];
                this.renderChat();
                this.renderHistoryList();
                this.atualizarTituloChat();
            }
        });
        
        document.getElementById('navBackBtn')?.addEventListener('click', () => {
            this.app.showView('inicio');
        });
        
        document.getElementById('bellBtn')?.addEventListener('click', () => {
            this.app.openNotifications();
        });
        
        window.addEventListener('cloudDataLoaded', () => {
            this.notifications = this.app.data.notifications || [];
            this.profile = this.app.data.profile || {};
            this.usuarioAtual = this.app.user || {};
            this.atualizarNomeUsuario();
            this.updateBadge();
        });
    }
    
    showToast(mensagem, tipo = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
            toastMessage.textContent = mensagem;
            toast.style.background = tipo === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                   tipo === 'info' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
                                   'linear-gradient(135deg, #10b981, #059669)';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
}

console.log('[IA] ✅ Módulo carregado com Multi-API!');