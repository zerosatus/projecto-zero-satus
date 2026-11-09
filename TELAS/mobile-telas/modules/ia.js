// ============================================
// modules/ia.js - MÓDULO DA IA (PC)
// ⭐ Histórico na nuvem (ai_conversations / ai_messages)
// ⭐ Limite diário de 15 mensagens
// ⭐ SEM modo gíria (igual ao Flutter)
// ⭐ Deteta: create_note, create_document, read_document, plot_chart
// ⭐ Usa MultiAIService (Edge Function zero-ia)
// ============================================

class IAModule {
    constructor(app) {
        this.app = app;
        this.name = 'ia';
        this.messages = [];
        this.history = [];
        this.currentHistoryId = null;
        this._isProcessing = false;
        this._previousView = 'inicio';

        this.tasks = [];
        this.notes = [];
        this.disciplinas = [];
        this.weeklySchedule = {};
        this.notifications = [];

        console.log('[IA PC] 🤖 Módulo inicializado');
    }

    // ══════════════════════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════════════════════
    async render(data) {
        this.notifications = data.notifications || [];
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.disciplinas = data.disciplinas || [];
        this.weeklySchedule = data.weeklySchedule || {};

        await this.carregarHistorico();
        this.renderHistoryList();
        this.renderChat();
        this.updateBadge();
        this.setupEvents();
        this._atualizarStatusLimite();
    }

    // ══════════════════════════════════════════════════════
    //  HISTÓRICO NA NUVEM
    // ══════════════════════════════════════════════════════
    async carregarHistorico() {
        const userId = this.app?.user?.id;
        if (!userId) { this.history = []; this.messages = []; return; }

        try {
            if (window.DatabaseService) {
                const convs = await window.DatabaseService.getAIConversations(userId);
                this.history = convs.map(c => ({
                    id: c.id,
                    title: c.title,
                    createdAt: c.created_at,
                    updatedAt: c.updated_at
                }));

                if (this.history.length > 0) {
                    this.currentHistoryId = this.history[0].id;
                    const msgs = await window.DatabaseService.getAIMessages(userId, this.currentHistoryId);
                    this.messages = msgs.map(m => ({
                        role: m.role,
                        content: m.content,
                        time: new Date(m.created_at).toLocaleTimeString(),
                        timestamp: m.created_at,
                        _saved: true
                    }));
                } else {
                    this.currentHistoryId = null;
                    this.messages = [];
                }
            }
        } catch (e) {
            console.warn('[IA] Erro ao carregar histórico:', e);
            this.history = [];
            this.messages = [];
        }
    }

    async salvarConversaAtual() {
        const userId = this.app?.user?.id;
        if (!userId || this.messages.length === 0) return;

        const primeira = this.messages.find(m => m.role === 'user')?.content || 'Nova conversa';
        const titulo = primeira.length > 32 ? primeira.substring(0, 32) + '…' : primeira;

        if (!this.currentHistoryId) {
            this.currentHistoryId = Date.now().toString();
        }

        if (window.DatabaseService) {
            await window.DatabaseService.saveAIConversation(userId, {
                id: this.currentHistoryId,
                title: titulo
            });

            const ultimas = this.messages.slice(-2);
            for (const msg of ultimas) {
                if (!msg._saved) {
                    await window.DatabaseService.saveAIMessage(userId, {
                        id: `${this.currentHistoryId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                        conversationId: this.currentHistoryId,
                        role: msg.role,
                        content: msg.content,
                        createdAt: msg.timestamp || new Date().toISOString()
                    });
                    msg._saved = true;
                }
            }
        }

        const idx = this.history.findIndex(h => h.id === this.currentHistoryId);
        if (idx !== -1) {
            this.history[idx].title = titulo;
            this.history[idx].updatedAt = new Date().toISOString();
        } else {
            this.history.unshift({
                id: this.currentHistoryId,
                title: titulo,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        this.renderHistoryList();
    }

    async novaConversa() {
        if (this._isProcessing) return;
        if (this.messages.length > 0) await this.salvarConversaAtual();
        this.messages = [];
        this.currentHistoryId = null;
        this.renderChat();
        this.renderHistoryList();
    }

    async selecionarConversa(id) {
        if (this._isProcessing) return;
        if (this.messages.length > 0 && this.currentHistoryId !== id) {
            await this.salvarConversaAtual();
        }
        const userId = this.app?.user?.id;
        if (!userId || !window.DatabaseService) return;

        try {
            const msgs = await window.DatabaseService.getAIMessages(userId, id);
            this.currentHistoryId = id;
            this.messages = msgs.map(m => ({
                role: m.role,
                content: m.content,
                time: new Date(m.created_at).toLocaleTimeString(),
                timestamp: m.created_at,
                _saved: true
            }));
            this.renderChat();
            this.renderHistoryList();
        } catch (e) {
            console.error('[IA] Erro ao selecionar conversa:', e);
        }
    }

    async excluirConversa(id) {
        const conv = this.history.find(h => h.id === id);
        if (!confirm(`Excluir "${conv?.title || 'esta conversa'}"?`)) return;
        const userId = this.app?.user?.id;
        if (!userId || !window.DatabaseService) return;

        await window.DatabaseService.deleteAIConversation(userId, id);
        this.history = this.history.filter(h => h.id !== id);
        if (this.currentHistoryId === id) {
            this.currentHistoryId = null;
            this.messages = [];
            this.renderChat();
        }
        this.renderHistoryList();
    }

    // ══════════════════════════════════════════════════════
    //  RENDER CHAT
    // ══════════════════════════════════════════════════════
    renderChat() {
        const container = document.getElementById('ia-messages-container');
        if (!container) return;

        if (this.messages.length === 0) {
            const hora = new Date().getHours();
            const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
            const nome = this.app?.user?.nome ? this.app.user.nome.split(' ')[0] : 'estudante';
            const restante = window.MultiAIService?.getLimiteRestante() ?? 15;
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

            let contentHtml = '';
            if (msg.content === '__PLOT__' && msg.plotData) {
                const id = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                setTimeout(() => this._renderChart(id, msg.plotData), 100);
                contentHtml = `<div style="background:var(--card-bg);padding:12px;border-radius:12px;margin:8px 0;"><canvas id="${id}" height="200"></canvas></div>`;
            } else {
                contentHtml = this.app.escapeHtml(msg.content)
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            }

            return `
                <div class="ia-message ${isUser ? 'ia-message-user' : 'ia-message-ai'}">
                    <div class="ia-message-avatar">${isUser ? '👤' : '🤖'}</div>
                    <div class="ia-message-content">${contentHtml}
                        ${!isUser && msg.content !== '__PLOT__' ? `<span class="ia-copy-hint" onclick="window.copyMessage(this)">📋 Copiar</span>` : ''}
                    </div>
                    <div class="ia-message-time">${msg.time || ''}</div>
                </div>
            `;
        }).join('');
        container.scrollTop = container.scrollHeight;
    }

    _renderChart(canvasId, plotData) {
        if (typeof Chart === 'undefined') {
            console.warn('[IA] Chart.js não carregado');
            return;
        }
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const data = plotData.data || [];
        const labels = data.map(p => p[0]);
        const values = data.map(p => p[1]);

        new Chart(canvas, {
            type: plotData.type === 'bar' ? 'bar' : 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: plotData.title || 'Gráfico',
                    data: values,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: plotData.title || 'Gráfico', color: '#fff' },
                    legend: { labels: { color: '#fff' } }
                },
                scales: {
                    x: { ticks: { color: '#9ca3af' }, title: { display: true, text: plotData.xlabel || 'x', color: '#9ca3af' } },
                    y: { ticks: { color: '#9ca3af' }, title: { display: true, text: plotData.ylabel || 'y', color: '#9ca3af' } }
                }
            }
        });
    }

    // ══════════════════════════════════════════════════════
    //  CONTEXTO
    // ══════════════════════════════════════════════════════
    buildUserContext() {
        const user = this.app.user || {};
        const pendentes = this.tasks.filter(t => !t.completed);
        const concluidas = this.tasks.filter(t => t.completed);

        let historico = '';
        if (this.messages.length > 0) {
            const ultimas = this.messages.slice(-10);
            historico = '\n📜 HISTÓRICO DA CONVERSA:\n';
            ultimas.forEach(m => {
                const role = m.role === 'user' ? '👤' : '🤖';
                const content = (m.content || '').substring(0, 200);
                historico += `${role}: ${content}${(m.content || '').length > 200 ? '...' : ''}\n`;
            });
        }

        return `
📚 CONTEXTO DO ESTUDANTE
Nome: ${user.nome || 'Estudante'}
Email: ${user.email || ''}
${historico}

📋 TAREFAS: Total ${this.tasks.length}, Pendentes ${pendentes.length}, Concluídas ${concluidas.length}
${pendentes.length > 0 ? 'Pendentes:\n' + pendentes.slice(0, 5).map((t, i) =>
    `  ${i+1}. ${t.nome || t.title}${t.subject ? ` (${t.subject})` : ''}${t.date ? ` - ${t.date}` : ''}`
).join('\n') : '✅ Todas concluídas!'}

📝 ANOTAÇÕES: ${this.notes.length}
📚 DISCIPLINAS: ${this.disciplinas.map(d => d.nome).join(', ') || 'Nenhuma'}

📅 HORÁRIO:
${Object.entries(this.weeklySchedule).map(([dia, aulas]) => {
    if (aulas && aulas.length > 0) {
        return `${dia}: ${aulas.map(a => `${a.materia} (${a.horaInicio}${a.horaFim ? ` - ${a.horaFim}` : ''})`).join(', ')}`;
    }
    return `${dia}: Sem aulas`;
}).join('\n')}

INSTRUÇÕES:
- Responde SEMPRE em português.
- Se pedir resumo, gera JSON {"action":"create_note", ...}.
- Se pedir documento, gera JSON {"action":"create_document", ...}.
- Se pedir para ler documento, gera JSON {"action":"read_document", "search":"..."}.
- Se pedir gráfico, gera JSON {"action":"plot_chart", ...}.
`;
    }

    // ══════════════════════════════════════════════════════
    //  ENVIAR MENSAGEM
    // ══════════════════════════════════════════════════════
    async sendMessage(text) {
        if (!text) {
            const input = document.getElementById('ia-input');
            if (!input) return;
            text = input.value.trim();
            if (!text) return;
            input.value = '';
        }

        if (this._isProcessing) return;

        if (!window.MultiAIService?.temLimiteDisponivel()) {
            this._mostrarToast(`⛔ Limite diário de 15 mensagens atingido!`);
            return;
        }

        // Adicionar mensagem do utilizador
        this.messages.push({
            role: 'user',
            content: text,
            time: new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString(),
            _saved: false
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
            let response = '';

            if (window.MultiAIService) {
                const result = await window.MultiAIService.sendMessage(text, context);
                if (result.success) {
                    response = result.text;
                    if (result.fromCache) response += '\n\n*(Resposta do cache)*';
                } else {
                    response = `❌ ${result.error}`;
                }
            } else {
                response = '❌ Serviço de IA indisponível. Recarrega a página.';
            }

            loading.remove();

            // Detetar intenções
            const noteIntent = this._detectCreateNote(response);
            const docIntent = this._detectCreateDocument(response);
            const readIntent = this._detectReadDocument(response);
            const plotIntent = this._detectPlotChart(response);

            if (noteIntent) {
                const clean = response.replace(/\{[\s\S]*?"action"\s*:\s*"create_note"[\s\S]*?\}/, '').trim();
                this.messages.push({
                    role: 'assistant',
                    content: clean || '📝 Resumo pronto! Queres guardar?',
                    time: new Date().toLocaleTimeString(),
                    _saved: false
                });
                await this.salvarConversaAtual();
                this.renderChat();
                if (confirm(`Guardar resumo "${noteIntent.title}"?`)) {
                    await this._saveNote(noteIntent);
                }
                return;
            }

            if (docIntent) {
                const clean = response.replace(/\{[\s\S]*?"action"\s*:\s*"create_document"[\s\S]*?\}/, '').trim();
                this.messages.push({
                    role: 'assistant',
                    content: clean || '📄 Documento pronto! Queres guardar?',
                    time: new Date().toLocaleTimeString(),
                    _saved: false
                });
                await this.salvarConversaAtual();
                this.renderChat();
                if (confirm(`Guardar documento "${docIntent.title}"?`)) {
                    await this._saveDocumentToTurso(docIntent);
                }
                return;
            }

            if (readIntent) {
                this.messages.push({
                    role: 'assistant',
                    content: `📄 A ler "${readIntent.search}"...`,
                    time: new Date().toLocaleTimeString(),
                    _saved: false
                });
                await this.salvarConversaAtual();
                this.renderChat();
                await this._readFromTursoAndSummarize(readIntent.search, context);
                return;
            }

            if (plotIntent) {
                this.messages.push({
                    role: 'assistant',
                    content: '__PLOT__',
                    plotData: plotIntent,
                    time: new Date().toLocaleTimeString(),
                    _saved: false
                });
                await this.salvarConversaAtual();
                this.renderChat();
                return;
            }

            // Resposta normal
            this.messages.push({
                role: 'assistant',
                content: response,
                time: new Date().toLocaleTimeString(),
                timestamp: new Date().toISOString(),
                _saved: false
            });
            await this.salvarConversaAtual();
            this.renderChat();
            this._atualizarStatusLimite();

        } catch (error) {
            loading.remove();
            console.error('[IA] ❌ Erro:', error);
            this.messages.push({
                role: 'assistant',
                content: '❌ Erro ao comunicar com a IA. Tenta novamente.',
                time: new Date().toLocaleTimeString(),
                _saved: false
            });
            await this.salvarConversaAtual();
            this.renderChat();
        } finally {
            this._isProcessing = false;
        }
    }

    // ══════════════════════════════════════════════════════
    //  DETETORES
    // ══════════════════════════════════════════════════════
    _detectCreateNote(t) {
        const m = t.match(/\{[\s\S]*?"action"\s*:\s*"create_note"[\s\S]*?\}/);
        if (!m) return null;
        try { return JSON.parse(m[0].replace(/```json/g, '').replace(/```/g, '').trim()); } catch (e) { return null; }
    }

    _detectCreateDocument(t) {
        const m = t.match(/\{[\s\S]*?"action"\s*:\s*"create_document"[\s\S]*?\}/);
        if (!m) return null;
        try { return JSON.parse(m[0].replace(/```json/g, '').replace(/```/g, '').trim()); } catch (e) { return null; }
    }

    _detectReadDocument(t) {
        const m = t.match(/\{[\s\S]*?"action"\s*:\s*"read_document"[\s\S]*?\}/);
        if (!m) return null;
        try { return JSON.parse(m[0].replace(/```json/g, '').replace(/```/g, '').trim()); } catch (e) { return null; }
    }

    _detectPlotChart(t) {
        const m = t.match(/\{[\s\S]*?"action"\s*:\s*"plot_chart"[\s\S]*?\}/);
        if (!m) return null;
        try { return JSON.parse(m[0].replace(/```json/g, '').replace(/```/g, '').trim()); } catch (e) { return null; }
    }

    // ══════════════════════════════════════════════════════
    //  AÇÕES
    // ══════════════════════════════════════════════════════
    async _saveNote(intent) {
        const userId = this.app.user.id;
        const now = new Date().toISOString();
        const novaNota = {
            id: Date.now().toString(),
            title: intent.title || 'Resumo',
            content: intent.content || '',
            date: now,
            dataModificacao: now
        };
        this.notes.unshift(novaNota);
        this.app.data.notes = this.notes;

        if (window.DatabaseService) {
            await window.DatabaseService.saveNotes(userId, this.notes);
        }
        if (window.CacheManager) window.CacheManager.set('notes', this.notes, true);

        if (typeof showToast === 'function') showToast('✅ Resumo guardado!', 'success');
    }

    async _saveDocumentToTurso(intent) {
        const userId = this.app.user.id;
        const id = Date.now().toString();
        const title = intent.title || 'Documento IA';
        const content = intent.content || '';
        const format = intent.format || 'pdf';

        // Guardar no Turso
        if (window.TursoService) {
            const ok = await window.TursoService.saveDocument({
                id, userId, title,
                category: intent.category || 'Trabalhos',
                content, format
            });
            if (!ok) throw new Error('Falha ao guardar no Turso');
        } else {
            console.warn('[IA] ⚠️ TursoService não carregado — documento não guardado no Turso');
        }

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

        if (window.DatabaseService) {
            await window.DatabaseService.saveDocumentos(userId, this.app.data.documentos);
        }
        if (window.CacheManager) window.CacheManager.set('documentos', this.app.data.documentos, true);

        if (typeof showToast === 'function') showToast('✅ Documento guardado!', 'success');
    }

    async _readFromTursoAndSummarize(search, context) {
        const userId = this.app.user.id;

        if (!window.TursoService) {
            this.messages.push({
                role: 'assistant',
                content: '❌ TursoService indisponível. Recarrega a página.',
                time: new Date().toLocaleTimeString(),
                _saved: false
            });
            await this.salvarConversaAtual();
            this.renderChat();
            return;
        }

        const tursoDoc = await window.TursoService.getDocument(userId, search);
        if (!tursoDoc) {
            this.messages.push({
                role: 'assistant',
                content: `❌ Documento "${search}" não encontrado.`,
                time: new Date().toLocaleTimeString(),
                _saved: false
            });
            await this.salvarConversaAtual();
            this.renderChat();
            return;
        }

        const prompt = `📄 Documento: "${tursoDoc.title}"\nCONTEÚDO:\n${tursoDoc.content.substring(0, 10000)}\n---\nFaz um resumo com # e ## e adiciona o JSON de create_note.`;
        const result = await window.MultiAIService.sendMessage(prompt, context);

        if (result.success) {
            const intent = this._detectCreateNote(result.text);
            this.messages.push({
                role: 'assistant',
                content: intent ? '✅ Resumo do documento pronto!' : result.text,
                time: new Date().toLocaleTimeString(),
                _saved: false
            });
            this.renderChat();
            if (intent && confirm(`Guardar resumo de "${tursoDoc.title}"?`)) {
                await this._saveNote(intent);
            }
        }
    }

    // ══════════════════════════════════════════════════════
    //  UI
    // ══════════════════════════════════════════════════════
    _atualizarStatusLimite() {
        const el = document.getElementById('ia-limite-status');
        if (!el) return;
        const restante = window.MultiAIService?.getLimiteRestante() ?? 15;
        el.textContent = `💬 ${restante}/15 perguntas hoje`;
        el.style.color = restante < 3 ? '#ef4444' : 'var(--text-secondary)';
    }

    renderHistoryList() {
        const list = document.getElementById('historyList');
        if (!list) return;
        if (this.history.length === 0) {
            list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-secondary);font-size:0.85rem;">Nenhuma conversa ainda.</div>`;
            return;
        }
        list.innerHTML = this.history.map(h => `
            <div class="history-item ${h.id === this.currentHistoryId ? 'active' : ''}" data-id="${h.id}">
                <ion-icon name="chat-bubble-outline"></ion-icon>
                <span class="history-title">${this.app.escapeHtml(h.title)}</span>
                <button class="history-del" data-del="${h.id}">🗑️</button>
            </div>
        `).join('');

        list.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.history-del')) return;
                this.selecionarConversa(item.dataset.id);
            });
        });
        list.querySelectorAll('.history-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.excluirConversa(btn.dataset.del);
            });
        });
    }

    updateBadge() {
        const badge = document.getElementById('notificationBadgeIA');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    setupEvents() {
        document.getElementById('ia-send-btn')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('ia-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        document.getElementById('btnOpenIA')?.addEventListener('click', () => {
            this._previousView = this.app.currentView;
            this.app.showView('ia');
        });
        document.getElementById('navBackBtn')?.addEventListener('click', () => {
            this.app.showView(this._previousView || 'inicio');
        });
        document.getElementById('newChatBtn')?.addEventListener('click', () => this.novaConversa());

        document.querySelectorAll('.quick-chips .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.dataset.prompt;
                if (prompt) this.sendMessage(prompt);
            });
        });
    }

    _mostrarToast(msg) {
        if (typeof showToast === 'function') showToast(msg, 'info');
    }
}

// ══════════════════════════════════════════════════════
//  COPIAR MENSAGEM
// ══════════════════════════════════════════════════════
window.copyMessage = function(element) {
    try {
        const messageContent = element.closest('.ia-message-content');
        if (!messageContent) return;
        const text = messageContent.textContent.replace('📋 Copiar', '').trim();

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                const orig = element.textContent;
                element.textContent = '✅ Copiado!';
                setTimeout(() => { element.textContent = orig; }, 2000);
            }).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            });
        }
    } catch (err) {
        console.error('[IA PC] Erro ao copiar:', err);
    }
};

console.log('[IA PC] ✅ Módulo carregado (sem gíria, alinhado com Flutter)');