// modules/ia.js - Módulo da IA (com Turso + Neon)
class IAModule {
    constructor(app) {
        this.app = app;
        this.name = 'ia';
        this.messages = [];
        this.history = [];
        this.currentHistoryId = null;
        this._isProcessing = false;
        this._previousView = 'dashboard';

        this.tasks = [];
        this.notes = [];
        this.disciplinas = [];
        this.weeklySchedule = {};
        this.notifications = [];

        console.log('[IA] 🤖 Módulo inicializado');
    }

    async render(data) {
        this.notifications = data.notifications || [];
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.disciplinas = data.disciplinas || [];
        this.weeklySchedule = data.weeklySchedule || {};

        await this.carregarHistorico();
        this.criarPainel();
        this.renderHistoryList();
        this.renderChat();
        this.updateBadge();
        this.setupEvents();
    }

    // ============================================
    // HISTÓRICO (NEON)
    // ============================================
    async carregarHistorico() {
        const userId = this.app?.user?.id;
        if (!userId) { this.history = []; this.messages = []; return; }

        try {
            // O Neon Proxy devolve o histórico da conversa mais recente
            const msgs = await window.NeonService.carregarHistorico(userId);
            this.messages = msgs.map(m => ({
                role: m.role,
                content: m.content,
                time: new Date(m.timestamp).toLocaleTimeString(),
                timestamp: m.timestamp,
                _saved: true
            }));

            // Nota: Para listar todas as conversas, precisaríamos de outro endpoint.
            // Por agora, mostramos a conversa ativa.
            if (this.messages.length > 0) {
                this.currentHistoryId = 'active'; // ID simbólico
                this.history = [{ id: 'active', title: 'Conversa Atual' }];
            } else {
                this.history = [];
            }
        } catch (e) {
            console.warn('[IA] Erro ao carregar histórico do Neon:', e);
        }
    }

    async salvarConversaAtual() {
        const userId = this.app?.user?.id;
        if (!userId || this.messages.length === 0) return;

        const primeira = this.messages.find(m => m.role === 'user')?.content || 'Nova conversa';
        const titulo = primeira.length > 32 ? primeira.substring(0, 32) + '…' : primeira;

        if (!this.currentHistoryId) {
            const newId = await window.NeonService.criarConversa(userId, titulo);
            if (newId) this.currentHistoryId = newId;
        }

        // Guardar apenas as últimas 2 mensagens (user + assistant) que ainda não foram salvas
        const ultimas = this.messages.slice(-2);
        for (const msg of ultimas) {
            if (!msg._saved) {
                await window.NeonService.guardarMensagem(this.currentHistoryId, msg.role, msg.content);
                msg._saved = true;
            }
        }

        this.renderHistoryList();
    }

    async novaConversa() {
        if (this.messages.length > 0) await this.salvarConversaAtual();
        this.messages = [];
        this.currentHistoryId = null;
        this.renderChat();
        this.renderHistoryList();
        this.fecharPainel();
    }

    async selecionarConversa(id) {
        const userId = this.app?.user?.id;
        if (!userId) return;
        const msgs = await window.NeonService.carregarHistorico(userId, id);
        this.currentHistoryId = id;
        this.messages = msgs.map(m => ({
            role: m.role, content: m.content,
            time: new Date(m.timestamp).toLocaleTimeString(),
            timestamp: m.timestamp, _saved: true
        }));
        this.renderChat();
        this.renderHistoryList();
        this.fecharPainel();
    }

    async excluirConversa(id) {
        if (!confirm('Excluir esta conversa?')) return;
        const userId = this.app?.user?.id;
        await window.NeonService.apagarHistorico(userId);
        this.history = this.history.filter(h => h.id !== id);
        if (this.currentHistoryId === id) {
            this.currentHistoryId = null;
            this.messages = [];
            this.renderChat();
        }
        this.renderHistoryList();
    }

    // ============================================
    // RENDER CHAT
    // ============================================
    renderChat() {
        const container = document.getElementById('ia-messages-container');
        if (!container) return;

        if (this.messages.length === 0) {
            const hora = new Date().getHours();
            const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
            const nome = this.app?.user?.nome ? this.app.user.nome.split(' ')[0] : 'estudante';
            const restante = window.IAService.getLimiteRestante();
            const pendentes = this.tasks.filter(t => !t.completed);

            container.innerHTML = `
                <div class="ia-empty-state">
                    <div class="ia-empty-orb">✨</div>
                    <h3>${saud}, ${this.app.escapeHtml(nome)}! 👋</h3>
                    <p>Como posso ajudar hoje?</p>
                    <div style="display:flex;gap:8px;justify-content:center;margin:12px 0;flex-wrap:wrap;">
                        <span style="background:var(--card-bg);padding:4px 12px;border-radius:12px;">${pendentes.length} pendentes</span>
                        <span style="background:var(--card-bg);padding:4px 12px;border-radius:12px;">${this.notes.length} notas</span>
                        <span style="background:var(--card-bg);padding:4px 12px;border-radius:12px;">${this.disciplinas.length} disciplinas</span>
                    </div>
                    <p id="ia-limite-status">💬 ${restante}/15 perguntas hoje</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.messages.map(msg => {
            const isUser = msg.role === 'user';
            const content = this.app.escapeHtml(msg.content).replace(/\n/g, '<br>');
            return `
                <div class="ia-message ${isUser ? 'ia-message-user' : 'ia-message-ai'}">
                    <div class="ia-message-avatar">${isUser ? '👤' : '🤖'}</div>
                    <div class="ia-message-content">${content}
                        ${!isUser ? `<span class="ia-copy-hint" onclick="window.copyMessage(this)">📋 Copiar</span>` : ''}
                    </div>
                    <div class="ia-message-time">${msg.time || ''}</div>
                </div>
            `;
        }).join('');
        container.scrollTop = container.scrollHeight;
    }

    // ============================================
    // CONTEXTO
    // ============================================
    buildUserContext() {
        const user = this.app.user || {};
        const pendentes = this.tasks.filter(t => !t.completed);
        let historico = '';
        if (this.messages.length > 0) {
            const ultimas = this.messages.slice(-10);
            historico = '\n📜 HISTÓRICO:\n';
            ultimas.forEach(m => {
                historico += `${m.role === 'user' ? '👤' : '🤖'}: ${m.content.substring(0, 200)}...\n`;
            });
        }

        return `
📚 CONTEXTO DO ESTUDANTE
Nome: ${user.nome || 'Estudante'}
Email: ${user.email || ''}
${historico}
📋 TAREFAS PENDENTES (${pendentes.length}):
${pendentes.map(t => `- ${t.nome || t.title} ${t.disciplina ? `(${t.disciplina})` : ''}`).join('\n')}
📝 ANOTAÇÕES: ${this.notes.length}
📚 DISCIPLINAS: ${this.disciplinas.map(d => d.nome).join(', ')}

INSTRUÇÕES:
- Responde SEMPRE em português.
- Se pedir resumo, gera JSON {"action":"create_note", ...}.
- Se pedir documento, gera JSON {"action":"create_document", ...}.
- Se pedir para ler documento, gera JSON {"action":"read_document", "search":"..."}.
        `;
    }

    // ============================================
    // ENVIAR MENSAGEM
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
        if (!window.IAService.temLimiteDisponivel()) {
            this._mostrarToast('⛔ Limite diário atingido!');
            return;
        }

        this.messages.push({
            role: 'user', content: text,
            time: new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString(), _saved: false
        });
        await this.salvarConversaAtual();
        this.renderChat();
        this._isProcessing = true;

        const container = document.getElementById('ia-messages-container');
        const loading = document.createElement('div');
        loading.className = 'ia-message ia-message-ai ia-loading';
        loading.innerHTML = `<div class="ia-message-avatar">🤖</div><div class="ia-message-content">...</div>`;
        container.appendChild(loading);
        container.scrollTop = container.scrollHeight;

        try {
            const context = this.buildUserContext();
            const response = await window.IAService.sendMessage({ prompt: text, context });
            loading.remove();

            const noteIntent = this._detectCreateNote(response);
            const docIntent = this._detectCreateDocument(response);
            const readIntent = this._detectReadDocument(response);

            if (noteIntent) {
                this.messages.push({
                    role: 'assistant', content: '📝 Resumo pronto! Queres guardar nas anotações?',
                    time: new Date().toLocaleTimeString(), _saved: false
                });
                this.renderChat();
                if (confirm(`Guardar resumo "${noteIntent.title}"?`)) await this._saveNote(noteIntent);
            } else if (docIntent) {
                this.messages.push({
                    role: 'assistant', content: '📄 Documento gerado! Queres guardar?',
                    time: new Date().toLocaleTimeString(), _saved: false
                });
                this.renderChat();
                if (confirm(`Guardar documento "${docIntent.title}"?`)) await this._saveDocumentToTurso(docIntent);
            } else if (readIntent) {
                this.messages.push({
                    role: 'assistant', content: `📄 A ler "${readIntent.search}"...`,
                    time: new Date().toLocaleTimeString(), _saved: false
                });
                this.renderChat();
                await this._readFromTursoAndSummarize(readIntent.search, context);
            } else {
                this.messages.push({
                    role: 'assistant', content: response,
                    time: new Date().toLocaleTimeString(), _saved: false
                });
                this.renderChat();
            }

            await this.salvarConversaAtual();
        } catch (error) {
            loading.remove();
            this.messages.push({
                role: 'assistant', content: '❌ Erro ao comunicar com a IA.',
                time: new Date().toLocaleTimeString(), _saved: false
            });
            await this.salvarConversaAtual();
            this.renderChat();
        } finally {
            this._isProcessing = false;
        }
    }

    // ============================================
    // DETEÇÃO
    // ============================================
    _detectCreateNote(t) {
        const m = t.match(/\{[\s\S]*?"action"\s*:\s*"create_note"[\s\S]*?\}/);
        if (!m) return null;
        try { return JSON.parse(m[0]); } catch (e) { return null; }
    }

    _detectCreateDocument(t) {
        const m = t.match(/\{[\s\S]*?"action"\s*:\s*"create_document"[\s\S]*?\}/);
        if (!m) return null;
        try { return JSON.parse(m[0]); } catch (e) { return null; }
    }

    _detectReadDocument(t) {
        const m = t.match(/\{[\s\S]*?"action"\s*:\s*"read_document"[\s\S]*?\}/);
        if (!m) return null;
        try { return JSON.parse(m[0]); } catch (e) { return null; }
    }

    // ============================================
    // AÇÕES (TURSO + SUPABASE)
    // ============================================
    async _saveNote(intent) {
        const userId = this.app.user.id;
        const now = new Date().toISOString();
        const novaNota = {
            id: Date.now().toString(),
            title: intent.title || 'Resumo',
            content: intent.content || '',
            date: now, dataModificacao: now
        };
        this.notes.unshift(novaNota);
        this.app.data.notes = this.notes;
        await window.DatabaseService.saveNotes(userId, this.notes);
        if (window.CacheManager) window.CacheManager.set('notes', this.notes, true);
        if (typeof showToast === 'function') showToast('✅ Resumo guardado!', 'success');
    }

    async _saveDocumentToTurso(intent) {
        const userId = this.app.user.id;
        const id = Date.now().toString();
        const title = intent.title || 'Documento IA';
        const content = intent.content || '';
        const format = intent.format || 'pdf';

        // 1. Guardar no Turso (igual ao Flutter)
        const ok = await window.TursoService.saveDocument({
            id, userId, title,
            category: intent.category || 'Trabalhos',
            content, format
        });
        if (!ok) throw new Error('Falha ao guardar no Turso');

        // 2. Guardar metadados no Supabase
        const novoDoc = {
            id, nome: title,
            categoria: intent.category || 'Trabalhos',
            descricao: 'Criado pela Zero IA',
            arquivo: 'TURSO_DB',
            tipo: format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
            nomeArquivo: `${title}.${format}`,
            tamanho: content.length,
            dataUpload: new Date().toISOString(),
            storagePath: null
        };

        if (!this.app.data.documentos) this.app.data.documentos = [];
        this.app.data.documentos.unshift(novoDoc);
        await window.DatabaseService.saveDocumentos(userId, this.app.data.documentos);
        if (window.CacheManager) window.CacheManager.set('documentos', this.app.data.documentos, true);

        if (typeof showToast === 'function') showToast('✅ Documento guardado no Turso!', 'success');
    }

    async _readFromTursoAndSummarize(search, context) {
        const userId = this.app.user.id;
        const tursoDoc = await window.TursoService.getDocument(userId, search);

        if (!tursoDoc) {
            this.messages.push({
                role: 'assistant', content: `❌ Documento "${search}" não encontrado no Turso.`,
                time: new Date().toLocaleTimeString(), _saved: false
            });
            await this.salvarConversaAtual();
            this.renderChat();
            return;
        }

        const prompt = `📄 Documento: "${tursoDoc.title}"\nCONTEÚDO:\n${tursoDoc.content.substring(0, 10000)}\n---\nFaz um resumo com # e ## e adiciona o JSON de create_note.`;
        const response = await window.IAService.sendMessage({ prompt, context });

        const intent = this._detectCreateNote(response);
        this.messages.push({
            role: 'assistant', content: intent ? '✅ Resumo do documento pronto!' : response,
            time: new Date().toLocaleTimeString(), _saved: false
        });
        this.renderChat();

        if (intent && confirm(`Guardar resumo de "${tursoDoc.title}"?`)) {
            await this._saveNote(intent);
        }
    }

    // ============================================
    // UI
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
                    <div class="ia-painel-logo">✨</div>
                    <div class="ia-painel-brand-text"><strong>Satus IA</strong><small>Zero Satus</small></div>
                </div>
                <button class="ia-painel-close" id="iaPainelClose">✕</button>
            </div>
            <button class="ia-painel-new" id="iaPainelNew">+ Nova conversa</button>
            <div class="ia-painel-list" id="iaPainelList"></div>
            <div class="ia-painel-footer">
                <div class="ia-painel-user">
                    <div class="ia-painel-user-avatar">${iniciais}</div>
                    <div class="ia-painel-user-info">
                        <span>${this.app.escapeHtml(nome)}</span>
                        <small>Aluno • Zero Satus</small>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        document.body.appendChild(painel);

        document.getElementById('iaPainelClose')?.addEventListener('click', () => this.fecharPainel());
        document.getElementById('iaPainelNew')?.addEventListener('click', () => this.novaConversa());
        painel.querySelector('.ia-painel-list')?.addEventListener('click', (e) => {
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

    renderHistoryList() {
        const list = document.getElementById('iaPainelList');
        if (!list) return;
        if (this.history.length === 0) {
            list.innerHTML = `<div class="ia-painel-empty">Nenhuma conversa ainda.</div>`;
            return;
        }
        list.innerHTML = this.history.map(h => `
            <div class="ia-painel-item ${h.id === this.currentHistoryId ? 'active' : ''}" data-id="${h.id}">
                💬 <span class="ia-painel-item-title">${this.app.escapeHtml(h.title)}</span>
                <button class="ia-painel-item-del" data-del="${h.id}">🗑️</button>
            </div>
        `).join('');
    }

    setupEvents() {
        document.getElementById('ia-send-btn')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('ia-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
        });
        document.getElementById('btn-open-ia')?.addEventListener('click', () => {
            this._previousView = this.app.currentView;
            this.app.showView('ia');
        });
        document.getElementById('btn-back-ia')?.addEventListener('click', () => {
            this.app.showView(this._previousView || 'dashboard');
        });
    }

    _mostrarToast(msg) { if (typeof showToast === 'function') showToast(msg, 'info'); }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
}

window.copyMessage = function(el) {
    const content = el.closest('.ia-message-content')?.textContent.replace('📋 Copiar', '').trim();
    if (content && navigator.clipboard) {
        navigator.clipboard.writeText(content).then(() => {
            el.textContent = '✅ Copiado!';
            setTimeout(() => { el.textContent = '📋 Copiar'; }, 2000);
        });
    }
};

console.log('[IA] ✅ Módulo carregado com Turso + Neon');