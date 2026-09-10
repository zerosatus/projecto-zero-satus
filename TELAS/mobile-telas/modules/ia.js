// ============================================
// modules/ia.js - MÓDULO DA IA COM HISTÓRICO CONTÍNUO
// ⭐ CONVERSAS CONTÍNUAS + HISTÓRICO PERSISTENTE
// ⭐ ACESSO TOTAL A TAREFAS, ANOTAÇÕES, HORÁRIO E DISCIPLINAS
// ⭐ LIMITE DIÁRIO DE 15 MENSAGENS
// ============================================

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
        
        this.LIMITE_DIARIO = 15;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        // ⭐ HISTÓRICO DE CONVERSAS
        this.history = [];
        this.currentHistoryId = null;
        
        // ⭐ DADOS DO USUÁRIO
        this.tasks = [];
        this.notes = [];
        this.weeklySchedule = {};
        this.timeSlots = [];
        this.disciplinas = [];
        this.notifications = [];
        
        console.log('[IA] 🤖 Inicializado com histórico contínuo');
        this._resetarLimite();
    }

    _resetarLimite() {
        const hoje = new Date().toDateString();
        const dataSalva = localStorage.getItem('ia_limite_data');
        if (dataSalva !== hoje) {
            localStorage.setItem('ia_limite_data', hoje);
            localStorage.setItem('ia_limite_uso', '0');
            this._usosHoje = 0;
        }
    }
    
    getUsoHoje() {
        this._resetarLimite();
        this._usosHoje = parseInt(localStorage.getItem('ia_limite_uso')) || 0;
        return this._usosHoje;
    }
    
    _incrementarUso() {
        this._resetarLimite();
        this._usosHoje++;
        localStorage.setItem('ia_limite_uso', String(this._usosHoje));
    }
    
    temLimiteDisponivel() {
        return this.getUsoHoje() < this.LIMITE_DIARIO;
    }
    
    getLimiteRestante() {
        return Math.max(0, this.LIMITE_DIARIO - this.getUsoHoje());
    }

    // ============================================
    // ⭐ RENDER PRINCIPAL
    // ============================================
    render(data) {
        this.notifications = data.notifications || [];
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.weeklySchedule = data.weeklySchedule || {};
        this.timeSlots = data.timeSlots || [];
        this.disciplinas = data.disciplinas || [];
        
        // ⭐ CARREGAR HISTÓRICO
        this.carregarHistorico();
        
        this.upgradeHeader();
        this.garantirFab();
        this.criarPainel();
        this.renderHistoryList();
        this.renderChat();
        this.updateBadge();
        this.setupEvents();
        this._atualizarStatusGiria();
        this._atualizarStatusLimite();
        
        console.log('[IA] 📊 Dados carregados:', {
            tasks: this.tasks.length,
            pendentes: this.tasks.filter(t => !t.completed).length,
            notes: this.notes.length,
            disciplinas: this.disciplinas.length,
            conversas: this.history.length,
            mensagensAtuais: this.messages.length
        });
    }

    // ============================================
    // ⭐ CARREGAR HISTÓRICO (COM CONVERSA ATUAL)
    // ============================================
    carregarHistorico() {
        const userId = this.app?.user?.id;
        if (!userId) {
            console.log('[IA] ⚠️ Sem userId, não é possível carregar histórico');
            return;
        }
        
        try {
            this.history = JSON.parse(localStorage.getItem(`${userId}_ia_history`) || '[]');
        } catch (e) {
            this.history = [];
        }
        
        try {
            this.messages = JSON.parse(localStorage.getItem(`${userId}_ia_messages`) || '[]');
        } catch (e) {
            this.messages = [];
        }
        
        this.currentHistoryId = localStorage.getItem(`${userId}_ia_current`);
        
        // ⭐ SE NÃO TEM CONVERSA ATUAL MAS TEM MENSAGENS, CRIAR UMA
        if (!this.currentHistoryId && this.messages.length > 0) {
            this.salvarConversaAtual();
        }
        
        // ⭐ SE TEM CONVERSA ATUAL MAS NÃO TEM MENSAGENS, CARREGAR DO HISTÓRICO
        if (this.currentHistoryId && this.messages.length === 0) {
            const conv = this.history.find(h => h.id === this.currentHistoryId);
            if (conv && conv.messages) {
                this.messages = [...conv.messages];
            }
        }
        
        console.log('[IA] 📚 Histórico carregado:', {
            conversas: this.history.length,
            conversaAtual: this.currentHistoryId,
            mensagens: this.messages.length
        });
    }

    // ============================================
    // ⭐ SALVAR CONVERSA ATUAL (HISTÓRICO COMPLETO)
    // ============================================
    salvarConversaAtual() {
        const userId = this.app?.user?.id;
        if (!userId || this.messages.length === 0) return;
        
        const agora = new Date().toISOString();
        
        // ⭐ TÍTULO BASEADO NA PRIMEIRA MENSAGEM DO USUÁRIO
        const primeira = this.messages.find(m => m.role === 'user')?.content || 'Nova conversa';
        const titulo = primeira.length > 32 ? primeira.substring(0, 32) + '…' : primeira;
        
        // ⭐ SE JÁ EXISTE UMA CONVERSA ATUAL, ATUALIZAR
        if (this.currentHistoryId) {
            const i = this.history.findIndex(h => h.id === this.currentHistoryId);
            if (i !== -1) {
                this.history[i] = {
                    ...this.history[i],
                    title: titulo,
                    messages: [...this.messages],
                    updatedAt: agora
                };
            } else {
                this.currentHistoryId = null;
            }
        }
        
        // ⭐ SE NÃO TEM CONVERSA ATUAL, CRIAR NOVA
        if (!this.currentHistoryId) {
            this.currentHistoryId = Date.now().toString();
            this.history.push({
                id: this.currentHistoryId,
                title: titulo,
                messages: [...this.messages],
                createdAt: agora,
                updatedAt: agora
            });
        }
        
        // ⭐ ORDENAR POR MAIS RECENTE
        this.history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // ⭐ SALVAR NO LOCALSTORAGE
        localStorage.setItem(`${userId}_ia_history`, JSON.stringify(this.history));
        localStorage.setItem(`${userId}_ia_messages`, JSON.stringify(this.messages));
        localStorage.setItem(`${userId}_ia_current`, this.currentHistoryId);
        
        // ⭐ ATUALIZAR LISTA NO PAINEL
        this.renderHistoryList();
        
        console.log('[IA] 💾 Conversa salva:', {
            id: this.currentHistoryId,
            title: titulo,
            messages: this.messages.length
        });
    }

    // ============================================
    // ⭐ RENDER CHAT
    // ============================================
    renderChat() {
        const container = document.getElementById('ia-messages-container');
        if (!container) return;
        
        if (this.messages.length === 0) {
            const hora = new Date().getHours();
            const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
            const nome = this.app?.user?.nome ? this.app.user.nome.split(' ')[0] : 'estudante';
            
            const restante = this.getLimiteRestante();
            const pendentes = this.tasks.filter(t => !t.completed);
            const concluidas = this.tasks.filter(t => t.completed);
            
            container.innerHTML = `
                <div class="ia-empty-state">
                    <div class="ia-empty-orb">${IA_SPARKLES_SVG}</div>
                    <h3>${saud}, ${this.app.escapeHtml(nome)}! 👋</h3>
                    <p style="font-size:0.9rem;color:var(--text-secondary);">Como posso te ajudar hoje?</p>
                    
                    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:12px 0;padding:12px;background:var(--card-bg);border-radius:12px;border:1px solid var(--border-color);width:100%;">
                        <div style="display:flex;flex-direction:column;align-items:center;padding:4px 12px;">
                            <span style="font-weight:700;color:var(--accent-purple);">${pendentes.length}</span>
                            <span style="font-size:0.6rem;color:var(--text-secondary);">Pendentes</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;padding:4px 12px;">
                            <span style="font-weight:700;color:var(--accent-green);">${concluidas.length}</span>
                            <span style="font-size:0.6rem;color:var(--text-secondary);">Concluídas</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;padding:4px 12px;">
                            <span style="font-weight:700;color:var(--accent-orange);">${this.notes.length}</span>
                            <span style="font-size:0.6rem;color:var(--text-secondary);">Anotações</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;padding:4px 12px;">
                            <span style="font-weight:700;color:var(--accent-blue, #60a5fa);">${this.disciplinas.length}</span>
                            <span style="font-size:0.6rem;color:var(--text-secondary);">Disciplinas</span>
                        </div>
                    </div>
                    
                    <p class="ia-empty-hint">💬 Digite <strong>"fala com gíria"</strong> para ativar ou 
                        <strong>"fala normal"</strong> para desativar</p>
                    <p class="ia-empty-limite" id="ia-limite-status">
                        💬 ${restante}/${this.LIMITE_DIARIO} perguntas hoje
                    </p>
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
    // ⭐ BUILD USER CONTEXT - COM HISTÓRICO CONTÍNUO
    // ============================================
    buildUserContext(textoUsuario) {
        const user = this.app.user || {};
        
        const tasks = this.tasks || [];
        const pendentes = tasks.filter(t => !t.completed);
        const concluidas = tasks.filter(t => t.completed);
        const notes = this.notes || [];
        const schedule = this.weeklySchedule || {};
        const slots = this.timeSlots || [];
        const disciplinas = this.disciplinas || [];
        
        const pediuGiria = this._usuarioPediuGiria(textoUsuario);
        const querNormal = this._usuarioQuerNormal(textoUsuario);
        
        if (pediuGiria) {
            this._modoGiria = true;
            this._mostrarToast('🇲🇿 Modo Gíria ativado! Fala como magaia!');
        } else if (querNormal) {
            this._modoGiria = false;
            this._mostrarToast('📚 Modo Normal ativado! Fala formal.');
        }
        
        // ⭐ HISTÓRICO DA CONVERSA ATUAL (últimas 10 mensagens)
        let historicoConversa = '';
        if (this.messages && this.messages.length > 0) {
            const ultimasMensagens = this.messages.slice(-10);
            historicoConversa = '\n📜 HISTÓRICO DA CONVERSA ATUAL:\n';
            ultimasMensagens.forEach((msg) => {
                const role = msg.role === 'user' ? '👤 Usuário' : '🤖 Assistente';
                const content = msg.content?.substring(0, 200) || '';
                historicoConversa += `${role}: ${content}${msg.content?.length > 200 ? '...' : ''}\n`;
            });
        }
        
        let contexto = `
📚 CONTEXTO COMPLETO DO ESTUDANTE - ${new Date().toLocaleString('pt-BR')}

👤 PERFIL:
Nome: ${user.nome || 'Estudante'}
Email: ${user.email || 'Não informado'}
ID: ${user.id || 'N/A'}

${historicoConversa}

📋 TAREFAS:
Total: ${tasks.length}
Pendentes: ${pendentes.length}
Concluídas: ${concluidas.length}

${pendentes.length > 0 ? '📌 TAREFAS PENDENTES:\n' + pendentes.map((t, i) => 
    `   ${i+1}. ${t.title || t.nome || 'Sem título'}${t.subject ? ` (${t.subject})` : ''}${t.date ? ` - Entrega: ${t.date}` : ''}`
).join('\n') : '✅ Todas as tarefas foram concluídas! Parabéns! 🎉'}

${concluidas.length > 0 ? '\n✅ TAREFAS CONCLUÍDAS:\n' + concluidas.slice(0, 5).map((t, i) => 
    `   ${i+1}. ${t.title || t.nome || 'Sem título'}`
).join('\n') + (concluidas.length > 5 ? `\n   ... e mais ${concluidas.length - 5} concluídas` : '') : ''}

📝 ANOTAÇÕES:
Total: ${notes.length}
${notes.length > 0 ? '📄 ÚLTIMAS ANOTAÇÕES:\n' + notes.slice(0, 5).map((n, i) => 
    `   ${i+1}. ${n.title || 'Sem título'}${n.content ? ` - ${n.content.substring(0, 60).replace(/\n/g, ' ')}${n.content.length > 60 ? '...' : ''}` : ''}`
).join('\n') + (notes.length > 5 ? `\n   ... e mais ${notes.length - 5} anotações` : '') : 'Nenhuma anotação ainda'}

📚 DISCIPLINAS:
${disciplinas.length > 0 ? disciplinas.map(d => `   - ${d.nome}${d.cor ? ` (${d.cor})` : ''}`).join('\n') : 'Nenhuma disciplina cadastrada'}

📅 HORÁRIO SEMANAL:
${Object.entries(schedule).map(([dia, aulas]) => {
    if (aulas && aulas.length > 0) {
        return `${dia}: ${aulas.map(a => `${a.materia} (${a.horaInicio}${a.horaFim ? ` - ${a.horaFim}` : ''})${a.professor ? ` - ${a.professor}` : ''}`).join(', ')}`;
    }
    return `${dia}: Sem aulas`;
}).join('\n')}

⏰ HORÁRIOS DISPONÍVEIS: ${slots.join(', ') || 'Nenhum horário cadastrado'}

🎯 LIMITE DIÁRIO DE MENSAGENS:
Usadas hoje: ${this.getUsoHoje()}/${this.LIMITE_DIARIO}
Restantes: ${this.getLimiteRestante()}

INSTRUÇÕES DE ESTILO:
`;
        
        if (this._modoGiria) {
            contexto += `
✅ MODO GÍRIA ATIVO! Use gírias moçambicanas como: broo, nice, maning, go, txuna, tamos juntos, fixe, bué, bora, magaia.
✅ Seja descontraído, amigável e divertido.
✅ Use emojis frequentemente 🇲🇿
✅ Responda com entusiasmo e calor humano.
✅ SEMPRE use os dados do contexto acima para respostas personalizadas.
✅ MANTENHA A CONTINUIDADE DA CONVERSA - lembre-se do que foi dito antes.
✅ Se o usuário fez uma pergunta de acompanhamento, responda no contexto anterior.
`;
        } else {
            contexto += `
✅ MODO NORMAL ATIVO! Fale em português formal e claro.
✅ Seja profissional, direto e objetivo.
✅ Use linguagem neutra, sem gírias.
✅ Dê respostas completas e bem estruturadas.
✅ Seja educado e respeitoso.
✅ SEMPRE use os dados do contexto acima para respostas personalizadas.
✅ MANTENHA A CONTINUIDADE DA CONVERSA - lembre-se do que foi dito antes.
✅ Se o usuário fez uma pergunta de acompanhamento, responda no contexto anterior.
`;
        }
        
        return contexto;
    }

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

    _mostrarToast(mensagem) {
        if (typeof showToast === 'function') {
            showToast(mensagem, 'info');
        } else {
            console.log('[IA] 📢', mensagem);
        }
        this._atualizarStatusGiria();
        this._atualizarStatusLimite();
    }

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
        
        const restante = this.getLimiteRestante();
        limiteEl.textContent = `💬 ${restante}/${this.LIMITE_DIARIO} perguntas hoje`;
        limiteEl.style.color = restante < 3 ? 'var(--accent-red)' : 'var(--text-secondary)';
    }

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
        this.salvarConversaAtual();
        this.renderChat();
    }

    // ============================================
    // ⭐ ENVIAR MENSAGEM (COM HISTÓRICO CONTÍNUO)
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
        
        if (!this.temLimiteDisponivel()) {
            this._mostrarToast(`⛔ Limite diário de ${this.LIMITE_DIARIO} mensagens atingido!`);
            this.messages.push({
                role: 'assistant',
                content: `⛔ Você atingiu o limite diário de ${this.LIMITE_DIARIO} mensagens. Volte amanhã para continuar!`,
                time: new Date().toLocaleTimeString()
            });
            this.salvarConversaAtual();
            this.renderChat();
            return;
        }
        
        this._ultimaMensagem = text;
        
        // ⭐ ADICIONAR MENSAGEM DO USUÁRIO
        this.messages.push({
            role: 'user',
            content: text,
            time: new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString()
        });
        
        // ⭐ SALVAR IMEDIATAMENTE (GARANTE CONTINUIDADE)
        this.salvarConversaAtual();
        
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
                console.log('[IA] 📤 Enviando... Modo:', this._modoGiria ? 'Gíria' : 'Normal');
                console.log('[IA] 📊 Mensagens no histórico:', this.messages.length);
                const result = await service.sendMessage(text, context);
                if (result.success) {
                    response = result.text;
                    if (result.fromCache) response += '\n\n*(Resposta do cache)*';
                } else {
                    response = `❌ ${result.error}`;
                }
            } else {
                response = this._getFallbackResponse(text);
            }
            
            loadingDiv.remove();
            this._incrementarUso();
            
            // ⭐ ADICIONAR RESPOSTA DA IA
            this.messages.push({
                role: 'assistant',
                content: response,
                time: new Date().toLocaleTimeString(),
                timestamp: new Date().toISOString()
            });
            
            // ⭐ SALVAR CONVERSA COMPLETA
            this.salvarConversaAtual();
            this.renderChat();
            this._atualizarStatusLimite();
            
            if (this.getLimiteRestante() === 0) {
                this._mostrarToast(`⛔ Limite diário de ${this.LIMITE_DIARIO} mensagens atingido!`);
            }
            
        } catch (error) {
            console.error('[IA] ❌ Erro:', error);
            loadingDiv.remove();
            this.messages.push({
                role: 'assistant',
                content: '❌ Ocorreu um erro. Tenta novamente!',
                time: new Date().toLocaleTimeString()
            });
            this.salvarConversaAtual();
            this.renderChat();
        } finally {
            this._isProcessing = false;
        }
    }

    // ============================================
    // ⭐ FALLBACK LOCAL
    // ============================================
    _getFallbackResponse(texto) {
        const perguntas = texto.toLowerCase();
        const pendentes = this.tasks.filter(t => !t.completed);
        const concluidas = this.tasks.filter(t => t.completed);
        const notasCount = this.notes.length;
        
        if (perguntas.includes('tarefa') || perguntas.includes('dever') || perguntas.includes('pendente')) {
            if (pendentes.length === 0) {
                return this._modoGiria 
                    ? '🇲🇿 Não tens tarefas pendentes, broo! Tás em dia! 🎉'
                    : 'Você não tem tarefas pendentes. Parabéns, está em dia! 🎉';
            }
            const lista = pendentes.map((t, i) => 
                `${i+1}. ${t.title || t.nome}${t.subject ? ` (${t.subject})` : ''}${t.date ? ` - Entrega: ${t.date}` : ''}`
            ).join('\n');
            return this._modoGiria
                ? `🇲🇿 Tens ${pendentes.length} tarefas pendentes, magaia!\n\n${lista}\n\nVai devagar, uma de cada vez. Tamos juntos! 💪`
                : `Você tem ${pendentes.length} tarefas pendentes:\n\n${lista}\n\nRecomendo priorizar as mais urgentes.`;
        }
        
        if (perguntas.includes('anota') || perguntas.includes('nota')) {
            if (notasCount === 0) {
                return this._modoGiria
                    ? '🇲🇿 Não tens anotações guardadas, broo! Quer criar uma? 📝'
                    : 'Você não tem anotações salvas. Que tal criar uma? 📝';
            }
            const lista = this.notes.slice(0, 5).map((n, i) => 
                `${i+1}. ${n.title || 'Sem título'}`
            ).join('\n');
            return this._modoGiria
                ? `🇲🇿 Tens ${notasCount} anotações, broo!\n\n${lista}${notasCount > 5 ? `\n... e mais ${notasCount - 5}` : ''}\n\nQuer ver alguma? 📝`
                : `Você tem ${notasCount} anotações salvas:\n\n${lista}${notasCount > 5 ? `\n... e mais ${notasCount - 5}` : ''}`;
        }
        
        if (perguntas.includes('disciplina') || perguntas.includes('matéria')) {
            if (this.disciplinas.length === 0) {
                return this._modoGiria
                    ? '🇲🇿 Nenhuma disciplina cadastrada, maning! Vai no dashboard e adiciona. 📚'
                    : 'Nenhuma disciplina cadastrada. Vá ao dashboard e adicione suas matérias. 📚';
            }
            const lista = this.disciplinas.map(d => `- ${d.nome}`).join('\n');
            return this._modoGiria
                ? `🇲🇿 Tuas disciplinas:\n\n${lista}\n\n📚 Bora estudar!`
                : `Suas disciplinas:\n\n${lista}`;
        }
        
        if (perguntas.includes('horário') || perguntas.includes('aula') || perguntas.includes('hoje')) {
            const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'short' });
            const diaSemana = hoje.charAt(0).toUpperCase() + hoje.slice(1);
            const aulasHoje = this.weeklySchedule[diaSemana] || [];
            
            if (aulasHoje.length === 0) {
                return this._modoGiria
                    ? `🇲🇿 Hoje (${diaSemana}) não tens aulas, broo! Aproveita para estudar! 💪`
                    : `Hoje (${diaSemana}) você não tem aulas agendadas. Aproveite para estudar.`;
            }
            const lista = aulasHoje.map(a => 
                `${a.materia} às ${a.horaInicio}${a.horaFim ? ` - ${a.horaFim}` : ''}`
            ).join('\n');
            return this._modoGiria
                ? `🇲🇿 Hoje (${diaSemana}) tens:\n\n${lista}\n\n📚 Bora estudar!`
                : `Hoje (${diaSemana}) você tem:\n\n${lista}`;
        }
        
        if (perguntas.includes('oi') || perguntas.includes('olá') || perguntas.includes('eai')) {
            return this._modoGiria
                ? '🇲🇿 Eai broo! Tá fixe? Como posso ajudar? Tamos juntos! 😎'
                : 'Olá! Como posso ajudar você hoje? Estou aqui para auxiliar nos seus estudos!';
        }
        
        return this._modoGiria
            ? '🇲🇿 Boa pergunta, magaia! Tenta reformular ou me conta mais detalhes. 🤝'
            : 'Desculpe, não entendi completamente sua pergunta. Poderia reformular ou dar mais detalhes?';
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    // ============================================
    // ⭐ SETUP EVENTS
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
    }

    upgradeHeader() {
        const header = document.querySelector('#view-ia .ia-header');
        if (!header || header.classList.contains('upgraded')) return;
        header.classList.add('upgraded');

        const backBtn = document.getElementById('btn-back-ia');

        const menuBtn = document.createElement('button');
        menuBtn.className = 'ia-menu-btn';
        menuBtn.innerHTML = IA_ICONS.menu;
        menuBtn.title = 'Abrir conversas';
        menuBtn.addEventListener('click', () => this.abrirPainel());

        header.insertBefore(menuBtn, header.firstChild);

        if (backBtn) {
            backBtn.style.marginLeft = 'auto';
            header.appendChild(backBtn);
        }

        header.querySelectorAll('.ia-avatar').forEach(a => a.remove());
    }

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

    // ⭐ NOVA CONVERSA (RESET COMPLETO)
    novaConversa() {
        if (this._isProcessing) return;
        
        // ⭐ SALVAR CONVERSA ATUAL ANTES DE CRIAR NOVA
        if (this.messages.length > 0) {
            this.salvarConversaAtual();
        }
        
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
        
        console.log('[IA] 🆕 Nova conversa iniciada');
    }

    // ⭐ SELECIONAR CONVERSA (CARREGAR HISTÓRICO COMPLETO)
    selecionarConversa(id) {
        if (this._isProcessing) return;
        
        const conv = this.history.find(h => h.id === id);
        if (!conv) return;
        
        // ⭐ SALVAR CONVERSA ATUAL ANTES DE MUDAR
        if (this.messages.length > 0 && this.currentHistoryId !== id) {
            this.salvarConversaAtual();
        }
        
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
        
        console.log('[IA] 📂 Conversa carregada:', {
            id: id,
            title: conv.title,
            messages: this.messages.length
        });
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
        if (userId) {
            localStorage.setItem(`${userId}_ia_history`, JSON.stringify(this.history));
            localStorage.removeItem(`${userId}_ia_current`);
        }
        
        this.renderHistoryList();
    }
}

// ============================================
// ⭐ FUNÇÃO GLOBAL PARA COPIAR
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
    }
}

// ============================================
// ⭐ FAB ESCONDE NA TELA DE IA
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

console.log('[IA] ✅ Módulo carregado com HISTÓRICO CONTÍNUO!');
console.log('[IA] 💡 Conversas são salvas automaticamente e mantêm contexto');