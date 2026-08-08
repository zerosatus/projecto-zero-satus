// ============================================
// modules/ia.js - MÓDULO DA IA COM MULTI-API
// ⭐ + PAINEL LATERAL, HEADER CHAT, HISTÓRICO E FAB SPARKLES
// ============================================

// ⭐ NOSSOS ÍCONES SVG
const IA_SPARKLES_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
        <path d="M12 9.5q.9 4.6 5.5 5.5-4.6.9-5.5 5.5-.9-4.6-5.5-5.5 4.6-.9 5.5-5.5z"/>
        <path d="M6.5 3.5q.6 3 3.5 3.5-2.9.6-3.5 3.5-.6-2.9-3.5-3.5 2.9-.5 3.5-3.5z"/>
        <path d="M17.5 4.5q.5 2.5 3 3-2.5.5-3 3-.5-2.5-3-3 2.5-.5 3-3z"/>
    </svg>`;

const IA_ICONS = {
    menu:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 17h16"/></svg>`,
    plus:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    chat:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 4h16v12H9l-5 4V4z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>`
};

class IAModule {
    constructor(app) {
        this.app = app;
        this.name = 'ia';
        this.messages = [];
        this._previousView = 'dashboard';
        this._isProcessing = false;
        this._modoGiria = false;
        this._ultimaMensagem = '';
        // ⭐ NOSSO: histórico de conversas
        this.history = [];
        this.currentHistoryId = null;
        console.log('[IA] 🤖 Inicializado com Multi-API (Grok + SambaNova + DeepSeek + OpenRouter)');
    }

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        this.notifications = data.notifications || [];
        // ⭐ NOSSO
        this.carregarHistorico();
        this.upgradeHeader();
        this.garantirFab();
        this.criarPainel();
        this.renderHistoryList();
        // DO PARCEIRO
        this.renderChat();
        this.updateBadge();
        this.setupEvents();
        this._atualizarStatusGiria();
        this._atualizarStatusLimite();
    }

    // ============================================
    // RENDER CHAT (visual nosso + conteúdo do parceiro)
    // ============================================
    renderChat() {
        const container = document.getElementById('ia-messages-container');
        if (!container) return;
        if (this.messages.length === 0) {
            const hora = new Date().getHours();
            const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
            const nome = this.app?.user?.nome ? this.app.user.nome.split(' ')[0] : 'estudante';
            container.innerHTML = `
                <div class="ia-empty-state">
                    <div class="ia-empty-orb">${IA_SPARKLES_SVG}</div>
                    <h3>${saud}, ${this.app.escapeHtml(nome)}! 👋</h3>
                    <p>Como posso te ajudar hoje?</p>
                    <p class="ia-empty-hint">💬 Digite <strong>"fala com gíria"</strong> para ativar ou 
                        <strong>"fala normal"</strong> para desativar</p>
                    <p class="ia-empty-limite" id="ia-limite-status">
                        💬 ${window.getLimiteIA ? window.getLimiteIA().restante : '?'} perguntas hoje</p>
                </div>
            `;
            const actions = document.getElementById('ia-quick-actions');
            if (actions) actions.style.display = 'grid';
            return;
        }
        const actions = document.getElementById('ia-quick-actions');
        if (actions) actions.style.display = 'none';
        let html = '';
        this.messages.forEach((msg) => {
            const isUser = msg.role === 'user';
            const isAI = !isUser;
            const content = this.app.escapeHtml(msg.content)
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            const time = msg.time || (msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString()
                : new Date().toLocaleTimeString());
            html += `
                <div class="ia-message ${isUser ? 'ia-message-user' : 'ia-message-ai'}">
                    <div class="ia-message-avatar">${isUser ? '👤' : '🤖'}</div>
                    <div class="ia-message-content" ${isAI ? 'style="user-select:text;-webkit-user-select:text;"' : ''}>
                        ${content}
                        ${isAI ? `<span class="ia-copy-hint" onclick="window.copyMessage(this)">📋 Copiar</span>` : ''}
                    </div>
                    <div class="ia-message-time">${time}</div>
                </div>
            `;
        });
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }

    // ============================================
    // ⭐ DETECTAR COMANDOS (DO PARCEIRO)
    // ============================================
    _usuarioPediuGiria(texto) {
        const palavrasChave = [
            'gíria', 'giria', 'moçambique', 'moçambicana', 'moçambicano',
            'magaia', 'broo', 'txuna', 'maning', 'tamos juntos',
            'fala moçambicano', 'fala com gíria', 'fala que nem eu',
            'fala que nem magaia', 'giria moçambicana', 'gíria moçambicana',
            'fala moçambicano', 'modo gíria', 'modo giria'
        ];
        return palavrasChave.some(palavra =>
            texto.toLowerCase().includes(palavra.toLowerCase())
        );
    }
    _usuarioQuerNormal(texto) {
        const palavrasChave = [
            'sem gíria', 'normal', 'formal', 'sem gírias',
            'fala normal', 'sério', 'direto', 'sem brincadeira',
            'desativa gíria', 'desativar gíria', 'fala formal',
            'volta ao normal', 'modo normal'
        ];
        return palavrasChave.some(palavra =>
            texto.toLowerCase().includes(palavra.toLowerCase())
        );
    }

    // ============================================
    // ⭐ BUILD USER CONTEXT (DO PARCEIRO)
    // ============================================
    buildUserContext(textoUsuario) {
        const user = this.app.user || {};
        const data = this.app.data || {};
        const tasks = data.tasks || [];
        const pendentes = tasks.filter(t => !t.completed).length;
        const materias = (data.disciplinas || []).length;
        const notas = (data.notes || []).length;
        const pediuGiria = this._usuarioPediuGiria(textoUsuario);
        const querNormal = this._usuarioQuerNormal(textoUsuario);
        if (pediuGiria) {
            this._modoGiria = true;
            this._mostrarToast('🇲 Modo Gíria ativado! Fala como magaia!');
        } else if (querNormal) {
            this._modoGiria = false;
            this._mostrarToast('📚 Modo Normal ativado! Fala formal.');
        }
        const isPerguntaSobreModo = this._usuarioPediuGiria(textoUsuario) ||
                                    this._usuarioQuerNormal(textoUsuario);
        let contexto = `
📚 CONTEXTO DO ESTUDANTE
Nome: ${user.nome || 'Estudante'}
Tarefas pendentes: ${pendentes}
Disciplinas: ${materias}
Notas: ${notas}
INSTRUÇÕES DE ESTILO:
`;
        if (this._modoGiria) {
            contexto += `
✅ MODO GÍRIA ATIVO! Use gírias moçambicanas como: broo, nice, maning, go, txuna, tamos juntos, fixe, bué, bora, magaia.
✅ Seja descontraído, amigável e divertido.
✅ Use emojis frequentemente 🇲🇿
✅ Responda com entusiasmo e calor humano.
${isPerguntaSobreModo ? '⚠️ O usuário acabou de ativar o modo gíria. Responda comemorando com uma gíria!' : ''}
`;
        } else {
            contexto += `
✅ MODO NORMAL ATIVO! Fale em português formal e claro.
✅ Seja profissional, direto e objetivo.
✅ Use linguagem neutra, sem gírias.
✅ Dê respostas completas e bem estruturadas.
✅ Seja educado e respeitoso.
${isPerguntaSobreModo ? '⚠️ O usuário acabou de desativar o modo gíria. Responda confirmando de forma educada.' : ''}
`;
        }
        return contexto;
    }

    // ============================================
    // ⭐ MOSTRAR TOAST (DO PARCEIRO)
    // ============================================
    _mostrarToast(mensagem) {
        if (typeof showToast === 'function') {
            showToast(mensagem, 'info');
        } else {
            console.log('[IA] 📢', mensagem);
        }
        this._atualizarStatusGiria();
        this._atualizarStatusLimite();
    }

    // ============================================
    // ⭐ ATUALIZAR STATUS (DO PARCEIRO)
    // ============================================
    _atualizarStatusGiria() {
        const statusEl = document.getElementById('giria-status');
        if (statusEl) {
            statusEl.textContent = this._modoGiria ? 'Gíria 🇲🇿' : 'Normal';
            statusEl.style.color = this._modoGiria ? 'var(--accent-purple)' : 'var(--text-secondary)';
        }
        const btn = document.getElementById('btn-toggle-giria');
        if (btn) {
            btn.style.borderColor = this._modoGiria ? 'var(--accent-purple)' : 'var(--border-color)';
            btn.style.background = this._modoGiria ? 'rgba(139, 92, 246, 0.15)' : 'var(--card-bg)';
        }
    }
    _atualizarStatusLimite() {
        const limiteEl = document.getElementById('ia-limite-status');
        if (!limiteEl) return;
        if (window.getLimiteIA) {
            const info = window.getLimiteIA();
            let statusText = `💬 ${info.restante}/${info.maximo} perguntas hoje`;
            if (info.providers) {
                const detalhes = info.providers.map(p =>
                    `${p.name}: ${p.disponivel ? '✅' : '⛔'} ${p.usoHoje}/${p.limiteDiario}`
                ).join(' | ');
                limiteEl.textContent = `${statusText} (${detalhes})`;
                limiteEl.title = detalhes;
            } else {
                limiteEl.textContent = statusText;
            }
            limiteEl.style.color = info.restante < 3 ? 'var(--accent-red)' : 'var(--text-secondary)';
        }
    }

    // ============================================
    // ⭐ ALTERNAR MODO (DO PARCEIRO)
    // ============================================
    toggleModoGiria() {
        this._modoGiria = !this._modoGiria;
        const mensagem = this._modoGiria
            ? '🇲🇿 Modo Gíria ativado! Fala que nem magaia!'
            : '📚 Modo Normal ativado! Fala formal.';
        this._mostrarToast(mensagem);
        this._atualizarStatusGiria();
        this.messages.push({
            role: 'assistant',
            content: this._modoGiria
                ? '🇲🇿 **Modo Gíria ativado!** Agora vou falar com gírias moçambicanas, broo! Tamos juntos! 😎'
                : '📚 **Modo Normal ativado!** Agora vou falar de forma formal e profissional. Como posso ajudar?',
            time: new Date().toLocaleTimeString(),
            isSystem: true
        });
        this.renderChat();
    }

    // ============================================
    // ⭐ ENVIAR MENSAGEM (parceiro + salvar histórico nosso)
    // ============================================
    async sendMessage(text) {
        if (!text) {
            const input = document.getElementById('ia-input');
            if (!input) return;
            text = input.value.trim();
            if (!text) return;
            input.value = '';
        }
        if (this._isProcessing) return;
        this._ultimaMensagem = text;
        this.messages.push({
            role: 'user',
            content: text,
            time: new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString() // ⭐ NOSSO (compatível com PC)
        });
        this.renderChat();
        this._isProcessing = true;
        const container = document.getElementById('ia-messages-container');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ia-message ia-message-ai ia-loading';
        loadingDiv.innerHTML = `
            <div class="ia-message-avatar">🤖</div>
            <div class="ia-message-content">
                <span class="ia-dots"><span>.</span><span>.</span><span>.</span></span>
                <span style="font-size:0.7rem;color:var(--text-secondary);margin-left:8px;">
                    ${this._modoGiria ? 'To a pensar, broo...' : 'Processando...'}
                </span>
            </div>
        `;
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;
        try {
            const context = this.buildUserContext(text);
            let response;
            const service = window.MultiAIService || window.GeminiService || window.OpenRouterService;
            if (service) {
                console.log('[IA] 📤 Enviando para Multi-API... Modo:', this._modoGiria ? 'Gíria' : 'Normal');
                const result = await service.sendMessage(text, context);
                if (result.success) {
                    response = result.text;
                    if (result.fromCache) response += '\n\n*(Resposta do cache)*';
                    if (result.provider) response += `\n\n*(via ${result.provider})*`;
                } else {
                    response = `❌ ${result.error}`;
                }
            } else {
                response = this._getFallbackResponse(text);
            }
            loadingDiv.remove();
            this.messages.push({
                role: 'assistant',
                content: response,
                time: new Date().toLocaleTimeString(),
                timestamp: new Date().toISOString() // ⭐ NOSSO
            });
            this.salvarConversaAtual(); // ⭐ NOSSO: salva no painel/histórico
            this.renderChat();
            this._atualizarStatusLimite();
        } catch (error) {
            console.error('[IA] ❌ Erro:', error);
            loadingDiv.remove();
            this.messages.push({
                role: 'assistant',
                content: '❌ Ocorreu um erro. Tenta novamente!',
                time: new Date().toLocaleTimeString()
            });
            this.renderChat();
        } finally {
            this._isProcessing = false;
        }
    }

    // ============================================
    // ⭐ FALLBACK (DO PARCEIRO)
    // ============================================
    _getFallbackResponse(texto) {
        const perguntas = texto.toLowerCase();
        if (this._modoGiria) {
            if (perguntas.includes('oi') || perguntas.includes('olá')) {
                return '🇲🇿 Eai broo! Tá fixe? Como posso ajudar hoje?';
            }
            if (perguntas.includes('estudar') || perguntas.includes('estudos')) {
                return '🇲🇿 Bora estudar! A chave é consistência, maning. Faz um plano e segue firme! Tamos juntos! 💪';
            }
            if (perguntas.includes('tarefa') || perguntas.includes('dever')) {
                return '🇲 As tarefas tão aí, mas tu consegues! Vai devagar, uma de cada vez. Não te estresses, broo! 😎';
            }
            return '🇲🇿 Boa pergunta, magaia! Tenta reformular ou ativa o modo normal se quiser uma resposta mais formal. Tamos juntos!';
        } else {
            if (perguntas.includes('oi') || perguntas.includes('olá')) {
                return 'Olá! Como posso ajudar você hoje?';
            }
            if (perguntas.includes('estudar') || perguntas.includes('estudos')) {
                return 'Para estudar de forma eficiente, recomendo: 1) Criar um cronograma, 2) Usar técnicas como Pomodoro, 3) Revisar o conteúdo regularmente.';
            }
            if (perguntas.includes('tarefa') || perguntas.includes('dever')) {
                return 'Para gerenciar suas tarefas, sugiro priorizar as mais urgentes, dividir em pequenas etapas e definir prazos realistas.';
            }
            return 'Desculpe, não entendi sua pergunta. Poderia reformular? Estou aqui para ajudar!';
        }
    }

    // ============================================
    // UPDATE BADGE (DO PARCEIRO)
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    // ============================================
    // SETUP EVENTS (DO PARCEIRO, intacto)
    // ============================================
    setupEvents() {
        const input = document.getElementById('ia-input');
        const sendBtn = document.getElementById('ia-send-btn');
        const fabBtn = document.getElementById('btn-open-ia');
        const backBtn = document.getElementById('btn-back-ia');
        const toggleBtn = document.getElementById('btn-toggle-giria');

        if (sendBtn) sendBtn.onclick = () => this.sendMessage();
        if (input) {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            };
        }
        if (fabBtn) {
            fabBtn.onclick = () => {
                this._previousView = this.app.currentView;
                this.app.showView('ia');
                setTimeout(() => this._atualizarStatusLimite(), 500);
            };
        }
        if (backBtn) {
            backBtn.onclick = () => {
                this.app.showView(this._previousView || 'dashboard');
            };
        }
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                this.toggleModoGiria();
            };
        }
        document.querySelectorAll('.ia-action-card').forEach(card => {
            card.onclick = () => {
                const prompt = card.dataset.prompt;
                if (prompt) {
                    const textoFinal = this._modoGiria
                        ? `${prompt} (fala com gíria moçambicana)`
                        : prompt;
                    this.sendMessage(textoFinal);
                }
            };
        });
        setInterval(() => {
            this._atualizarStatusLimite();
        }, 30000);
        console.log('[IA] ✅ Eventos configurados! Modo:', this._modoGiria ? 'Gíria' : 'Normal');
    }

    // ============================================
    // ⭐ NOSSO: HEADER COM ☰ + AVATAR ONLINE
    // ============================================
    upgradeHeader() {
        const header = document.querySelector('#view-ia .ia-header');
        if (!header || header.classList.contains('upgraded')) return;
        header.classList.add('upgraded');

        const menuBtn = document.createElement('button');
        menuBtn.className = 'ia-menu-btn';
        menuBtn.innerHTML = IA_ICONS.menu;
        menuBtn.title = 'Abrir conversas';
        menuBtn.addEventListener('click', () => this.abrirPainel());

        const avatar = document.createElement('div');
        avatar.className = 'ia-avatar';
        avatar.innerHTML = IA_SPARKLES_SVG + '<span class="ia-online"></span>';

        // ⭐ Só ADICIONA no começo — não remove nada do parceiro
        header.insertBefore(avatar, header.firstChild);
        header.insertBefore(menuBtn, header.firstChild);
    }

    // ============================================
    // ⭐ NOSSO: FAB COM ÍCONE SPARKLES
    // ============================================
    garantirFab() {
        let fab = document.getElementById('btn-open-ia');
        if (!fab) {
            fab = document.createElement('button');
            fab.id = 'btn-open-ia';
            fab.className = 'fab-ia';
            document.body.appendChild(fab);
        }
        if (!fab.querySelector('svg')) {
            fab.innerHTML = `<span class="pulse"></span>${IA_SPARKLES_SVG}`;
        }
        fab.title = 'Assistente IA';
        return fab;
    }

    // ============================================
    // ⭐ NOSSO: PAINEL LATERAL (ChatGPT/DeepSeek)
    // ============================================
    criarPainel() {
        if (document.getElementById('iaPainel')) return;

        const nome = this.app?.user?.nome || 'Usuário';
        const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();

        const overlay = document.createElement('div');
        overlay.className = 'ia-painel-overlay';
        overlay.id = 'iaPainelOverlay';
        overlay.addEventListener('click', () => this.fecharPainel());

        const painel = document.createElement('aside');
        painel.className = 'ia-painel';
        painel.id = 'iaPainel';
        painel.innerHTML = `
            <div class="ia-painel-header">
                <div class="ia-painel-brand">
                    <div class="ia-painel-logo">${IA_SPARKLES_SVG}</div>
                    <div class="ia-painel-brand-text"><strong>Satus IA</strong><small>Zero Satus</small></div>
                </div>
                <button class="ia-painel-close" id="iaPainelClose">${IA_ICONS.close}</button>
            </div>
            <button class="ia-painel-new" id="iaPainelNew">${IA_ICONS.plus} Nova conversa</button>
            <div class="ia-painel-list" id="iaPainelList"></div>
            <div class="ia-painel-footer">
                <div class="ia-painel-user">
                    <div class="ia-painel-user-avatar">${this.app.escapeHtml(iniciais)}</div>
                    <div class="ia-painel-user-info">
                        <span>${this.app.escapeHtml(nome)}</span>
                        <small>Aluno • Zero Satus</small>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        document.body.appendChild(painel);

        document.getElementById('iaPainelClose').addEventListener('click', () => this.fecharPainel());
        document.getElementById('iaPainelNew').addEventListener('click', () => this.novaConversa());
        painel.querySelector('.ia-painel-list').addEventListener('click', (e) => {
            const del = e.target.closest('[data-del]');
            if (del) { this.excluirConversa(del.dataset.del); return; }
            const item = e.target.closest('.ia-painel-item');
            if (item) this.selecionarConversa(item.dataset.id);
        });
    }

    abrirPainel() {
        this.renderHistoryList();
        document.getElementById('iaPainel')?.classList.add('open');
        document.getElementById('iaPainelOverlay')?.classList.add('show');
    }
    fecharPainel() {
        document.getElementById('iaPainel')?.classList.remove('open');
        document.getElementById('iaPainelOverlay')?.classList.remove('show');
    }

    // ============================================
    // ⭐ NOSSO: HISTÓRICO (mesmas chaves do PC 🔗)
    // ============================================
    carregarHistorico() {
        const userId = this.app?.user?.id;
        if (!userId) return;
        try { this.history = JSON.parse(localStorage.getItem(`${userId}_ia_history`) || '[]'); } catch (e) { this.history = []; }
        try { this.messages = JSON.parse(localStorage.getItem(`${userId}_ia_messages`) || '[]'); } catch (e) { this.messages = []; }
        this.currentHistoryId = localStorage.getItem(`${userId}_ia_current`);
    }

    salvarConversaAtual() {
        const userId = this.app?.user?.id;
        if (!userId || this.messages.length === 0) return;
        const agora = new Date().toISOString();
        const primeira = this.messages.find(m => m.role === 'user')?.content || 'Nova conversa';
        const titulo = primeira.length > 32 ? primeira.substring(0, 32) + '…' : primeira;

        if (this.currentHistoryId) {
            const i = this.history.findIndex(h => h.id === this.currentHistoryId);
            if (i !== -1) {
                this.history[i] = { ...this.history[i], title: titulo, messages: [...this.messages], updatedAt: agora };
            } else { this.currentHistoryId = null; }
        }
        if (!this.currentHistoryId) {
            this.currentHistoryId = Date.now().toString();
            this.history.push({ id: this.currentHistoryId, title: titulo, messages: [...this.messages], createdAt: agora, updatedAt: agora });
        }
        this.history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        localStorage.setItem(`${userId}_ia_history`, JSON.stringify(this.history));
        localStorage.setItem(`${userId}_ia_messages`, JSON.stringify(this.messages));
        localStorage.setItem(`${userId}_ia_current`, this.currentHistoryId);
        this.renderHistoryList();
    }

    renderHistoryList() {
        const list = document.getElementById('iaPainelList');
        if (!list) return;
        if (this.history.length === 0) {
            list.innerHTML = `<div class="ia-painel-empty">Nenhuma conversa ainda.<br>Comece uma nova! ✨</div>`;
            return;
        }
        list.innerHTML = this.history.map(h => `
            <div class="ia-painel-item ${h.id === this.currentHistoryId ? 'active' : ''}" data-id="${h.id}">
                ${IA_ICONS.chat}
                <span class="ia-painel-item-title">${this.app.escapeHtml(h.title)}</span>
                <button class="ia-painel-item-del" data-del="${h.id}">${IA_ICONS.trash}</button>
            </div>`).join('');
    }

    novaConversa() {
        if (this._isProcessing) return;
        this.messages = [];
        this.currentHistoryId = null;
        const userId = this.app?.user?.id;
        if (userId) {
            localStorage.setItem(`${userId}_ia_messages`, '[]');
            localStorage.removeItem(`${userId}_ia_current`);
        }
        this.renderChat();
        this.renderHistoryList();
        this.fecharPainel();
    }

    selecionarConversa(id) {
        if (this._isProcessing) return;
        const conv = this.history.find(h => h.id === id);
        if (!conv) return;
        this.currentHistoryId = id;
        this.messages = [...(conv.messages || [])];
        const userId = this.app?.user?.id;
        if (userId) {
            localStorage.setItem(`${userId}_ia_messages`, JSON.stringify(this.messages));
            localStorage.setItem(`${userId}_ia_current`, id);
        }
        this.renderChat();
        this.renderHistoryList();
        this.fecharPainel();
    }

    excluirConversa(id) {
        const conv = this.history.find(h => h.id === id);
        if (!confirm(`Excluir "${conv?.title || 'esta conversa'}"?`)) return;
        this.history = this.history.filter(h => h.id !== id);
        if (this.currentHistoryId === id) {
            this.currentHistoryId = null;
            this.messages = [];
            this.renderChat();
        }
        const userId = this.app?.user?.id;
        if (userId) localStorage.setItem(`${userId}_ia_history`, JSON.stringify(this.history));
        this.renderHistoryList();
    }
}

// ============================================
// ⭐ FUNÇÃO GLOBAL PARA COPIAR MENSAGENS (DO PARCEIRO)
// ============================================
window.copyMessage = function(element) {
    try {
        const messageContent = element.closest('.ia-message-content');
        if (!messageContent) return;
        const text = messageContent.textContent.replace('📋 Copiar', '').trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    const originalText = element.textContent;
                    element.textContent = '✅ Copiado!';
                    setTimeout(() => { element.textContent = originalText; }, 2000);
                })
                .catch(() => { fallbackCopy(text, element); });
        } else {
            fallbackCopy(text, element);
        }
    } catch (error) {
        console.error('[IA] Erro ao copiar:', error);
    }
};
function fallbackCopy(text, element) {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.top = '-1000px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        const originalText = element.textContent;
        element.textContent = '✅ Copiado!';
        setTimeout(() => { element.textContent = originalText; }, 2000);
    } catch (err) {
        console.error('[IA] Fallback copy falhou:', err);
        const originalText = element.textContent;
        element.textContent = '❌ Erro ao copiar';
        setTimeout(() => { element.textContent = originalText; }, 2000);
    }
}

// ============================================
// ⭐ NOSSO: SOME O FAB DENTRO DA TELA DE IA
// ============================================
(function () {
    function atualizarFab() {
        const fab = document.getElementById('btn-open-ia');
        const iaAtiva = document.getElementById('view-ia')?.classList.contains('active');
        if (fab) fab.style.display = iaAtiva ? 'none' : '';
    }
    const view = document.getElementById('view-ia');
    if (view) {
        new MutationObserver(atualizarFab).observe(view, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
    atualizarFab();
})();

console.log('[IA] ✅ Função copyMessage registrada globalmente');
console.log('[IA] ✅ Módulo carregado com Multi-API + Painel Lateral + Histórico!');