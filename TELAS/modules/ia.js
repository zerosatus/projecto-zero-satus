// ============================================
// mobile-telas/modules/ia.js - MÓDULO DA IA (MOBILE / WEB)
// ⭐ HISTÓRICO CONTÍNUO (INTEGRAÇÃO NUVEM / DATABASE SERVICE)
// ⭐ ACESSO A DADOS DO USUÁRIO (APENAS LEITURA)
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
        this._ultimaMensagem = '';
        
        // LIMITE DIÁRIO
        this.LIMITE_DIARIO = 15;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        // HISTÓRICO DE CONVERSAS
        this.history = [];
        this.currentHistoryId = null;
        
        // DADOS DO USUÁRIO
        this.tasks = [];
        this.notes = [];
        this.weeklySchedule = {};
        this.timeSlots = [];
        this.disciplinas = [];
        this.notifications = [];
        
        console.log('[IA Mobile] 🤖 Inicializado');
        this._resetarLimite();
    }

    // ============================================
    // RESETAR LIMITE DIÁRIO
    // ============================================
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
    // ESCAPE HTML HELPER
    // ============================================
    _escapeHtml(text) {
        if (!text) return '';
        if (this.app && typeof this.app.escapeHtml === 'function') {
            return this.app.escapeHtml(text);
        }
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    async render(data) {
        console.log('[IA Mobile] 📊 Renderizando...');
        
        this.notifications = data.notifications || [];
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.weeklySchedule = data.weeklySchedule || {};
        this.timeSlots = data.timeSlots || [];
        this.disciplinas = data.disciplinas || [];
        
        // ⭐ GARANTIR FAB E HEADER PRIMEIRO
        this.garantirFab();
        this.upgradeHeader();
        this.criarPainel();
        
        // ⭐ CARREGAR HISTÓRICO COM TRY/CATCH
        try {
            await this.carregarHistorico();
        } catch (e) {
            console.warn('[IA Mobile] ⚠️ Erro no histórico:', e);
            this.history = [];
            this.messages = [];
        }
        
        this.renderHistoryList();
        this.renderChat();
        this.updateBadge();
        this.setupEvents();
        this._atualizarStatusLimite();
        
        console.log('[IA Mobile] ✅ Renderizado!');
    }

    // ============================================
    // CARREGAR HISTÓRICO (DA NUVEM)
    // ============================================
    async carregarHistorico() {
        const userId = this.app?.user?.id;
        if (!userId) { this.history = []; this.messages = []; return; }
        
        try {
            if (window.DatabaseService) {
                // ⭐ BUSCAR DA NUVEM
                const convs = await window.DatabaseService.getAIConversations(userId);
                this.history = convs.map(c => ({
                    id: c.id,
                    title: c.title,
                    createdAt: c.created_at,
                    updatedAt: c.updated_at
                }));
                
                // Conversa atual: a mais recente
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
                
                // ⭐ MIGRAR histórico local antigo (se existir)
                await this._migrarHistoricoLocal(userId);
            }
        } catch (e) {
            console.warn('[IA] Erro ao carregar histórico da nuvem:', e);
            // Fallback para local
            try {
                this.history = JSON.parse(localStorage.getItem(`${userId}_ia_history`) || '[]');
                this.messages = JSON.parse(localStorage.getItem(`${userId}_ia_messages`) || '[]');
                this.currentHistoryId = localStorage.getItem(`${userId}_ia_current`);
            } catch (err) {
                this.history = []; this.messages = []; this.currentHistoryId = null;
            }
        }
    }

    // ⭐ Migrar histórico local para a nuvem (só uma vez)
    async _migrarHistoricoLocal(userId) {
        try {
            const localHistory = JSON.parse(localStorage.getItem(`${userId}_ia_history`) || '[]');
            if (localHistory.length === 0) return;
            
            if (this.history.length > 0) {
                // Já tem na nuvem, limpar local
                localStorage.removeItem(`${userId}_ia_history`);
                localStorage.removeItem(`${userId}_ia_messages`);
                localStorage.removeItem(`${userId}_ia_current`);
                return;
            }
            
            console.log('[IA] 🔄 Migrando histórico local para nuvem...');
            for (const conv of localHistory) {
                await window.DatabaseService.saveAIConversation(userId, {
                    id: conv.id, title: conv.title
                });
                for (const msg of (conv.messages || [])) {
                    await window.DatabaseService.saveAIMessage(userId, {
                        conversationId: conv.id,
                        role: msg.role,
                        content: msg.content,
                        createdAt: msg.timestamp
                    });
                }
            }
            localStorage.removeItem(`${userId}_ia_history`);
            localStorage.removeItem(`${userId}_ia_messages`);
            localStorage.removeItem(`${userId}_ia_current`);
            console.log('[IA] ✅ Histórico migrado');
            await this.carregarHistorico();
        } catch (e) {
            console.warn('[IA] Erro na migração:', e);
        }
    }

    // ============================================
    // SALVAR CONVERSA ATUAL (NA NUVEM)
    // ============================================
    async salvarConversaAtual() {
        const userId = this.app?.user?.id;
        if (!userId || this.messages.length === 0) return;
        
        const primeira = this.messages.find(m => m.role === 'user')?.content || 'Nova conversa';
        const titulo = primeira.length > 32 ? primeira.substring(0, 32) + '…' : primeira;
        
        // Criar ID se não existir
        if (!this.currentHistoryId) {
            this.currentHistoryId = Date.now().toString();
        }
        
        // Guardar conversa
        await window.DatabaseService.saveAIConversation(userId, {
            id: this.currentHistoryId,
            title: titulo
        });
        
        // Guardar as últimas mensagens ainda não gravadas
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
        
        // Atualizar lista local
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

    // ============================================
    // NOVA CONVERSA
    // ============================================
    async novaConversa() {
        if (this._isProcessing) return;
        if (this.messages.length > 0) {
            await this.salvarConversaAtual();
        }
        this.messages = [];
        this.currentHistoryId = null;
        this.renderChat();
        this.renderHistoryList();
        this.fecharPainel();
    }

    // ============================================
    // SELECIONAR CONVERSA (DA NUVEM)
    // ============================================
    async selecionarConversa(id) {
        if (this._isProcessing) return;
        if (this.messages.length > 0 && this.currentHistoryId !== id) {
            await this.salvarConversaAtual();
        }
        const userId = this.app?.user?.id;
        if (!userId) return;
        
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
            this.fecharPainel();
        } catch (e) {
            console.error('[IA] Erro ao selecionar conversa:', e);
        }
    }

    // ============================================
    // EXCLUIR CONVERSA (DA NUVEM)
    // ============================================
    async excluirConversa(id) {
        const conv = this.history.find(h => h.id === id);
        if (!confirm(`Excluir "${conv?.title || 'esta conversa'}"?`)) return;
        const userId = this.app?.user?.id;
        if (!userId) return;
        
        await window.DatabaseService.deleteAIConversation(userId, id);
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
            
            const restante = this.getLimiteRestante();
            const pendentes = this.tasks.filter(t => !t.completed);
            const concluidas = this.tasks.filter(t => t.completed);
            
            container.innerHTML = `
                <div class="ia-empty-state">
                    <div class="ia-empty-orb">${IA_SPARKLES_SVG}</div>
                    <h3>${saud}, ${this._escapeHtml(nome)}! 👋</h3>
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
                            <span style="font-weight:700;color:#60a5fa;">${this.disciplinas.length}</span>
                            <span style="font-size:0.6rem;color:var(--text-secondary);">Disciplinas</span>
                        </div>
                    </div>
                    
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
            const content = this._escapeHtml(msg.content)
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
    // BUILD USER CONTEXT
    // ============================================
    buildUserContext(textoUsuario) {
        const user = this.app.user || {};
        
        const tasks = this.tasks || [];
        const pendentes = tasks.filter(t => !t.completed);
        const concluidas = tasks.filter(t => t.completed);
        const notes = this.notes || [];
        const schedule = this.weeklySchedule || {};
        const disciplinas = this.disciplinas || [];
        
        // Histórico da conversa atual
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

${historicoConversa}

📋 TAREFAS:
Total: ${tasks.length}
Pendentes: ${pendentes.length}
Concluídas: ${concluidas.length}

${pendentes.length > 0 ? '📌 TAREFAS PENDENTES:\n' + pendentes.map((t, i) => 
    `   ${i+1}. ${t.title || t.nome || 'Sem título'}${t.subject ? ` (${t.subject})` : ''}${t.date ? ` - Entrega: ${t.date}` : ''}`
).join('\n') : '✅ Todas as tarefas foram concluídas! 🎉'}

📝 ANOTAÇÕES:
Total: ${notes.length}
${notes.length > 0 ? '📄 ÚLTIMAS ANOTAÇÕES:\n' + notes.slice(0, 5).map((n, i) => 
    `   ${i+1}. ${n.title || 'Sem título'}${n.content ? ` - ${n.content.substring(0, 60).replace(/\n/g, ' ')}` : ''}`
).join('\n') : 'Nenhuma anotação ainda'}

📚 DISCIPLINAS:
${disciplinas.length > 0 ? disciplinas.map(d => `   - ${d.nome}`).join('\n') : 'Nenhuma disciplina cadastrada'}

📅 HORÁRIO SEMANAL:
${Object.entries(schedule).map(([dia, aulas]) => {
    if (aulas && aulas.length > 0) {
        return `${dia}:${aulas.map(a => `${a.materia} (${a.horaInicio}${a.horaFim ? ` - ${a.horaFim}` : ''})`).join(', ')}`;
    }
    return `${dia}: Sem aulas`;
}).join('\n')}

🎯 LIMITE DIÁRIO DE MENSAGENS:
Usadas hoje: ${this.getUsoHoje()}/${this.LIMITE_DIARIO}
Restantes: ${this.getLimiteRestante()}

INSTRUÇÕES DE ESTILO:
✅ MODO NORMAL ATIVO! Fale em português formal e claro.
✅ Seja profissional, direto e objetivo.
✅ Dê respostas completas e bem estruturadas.
✅ SEMPRE use os dados do contexto acima para respostas personalizadas.
✅ MANTENHA A CONTINUIDADE DA CONVERSA.
`;
        
        return contexto;
    }

    _mostrarToast(mensagem) {
        if (typeof showToast === 'function') {
            showToast(mensagem, 'info');
        } else {
            console.log('[IA Mobile] 📢', mensagem);
        }
        this._atualizarStatusLimite();
    }
    
    _atualizarStatusLimite() {
        const limiteEl = document.getElementById('ia-limite-status');
        if (!limiteEl) return;
        
        const restante = this.getLimiteRestante();
        limiteEl.textContent = `💬 ${restante}/${this.LIMITE_DIARIO} perguntas hoje`;
        limiteEl.style.color = restante < 3 ? 'var(--accent-red)' : 'var(--text-secondary)';
    }

    // ============================================
    // DETEÇÃO DE INTENÇÕES (JSON)
    // ============================================
    _detectCreateDocument(text) {
        const regex = /\{[\s\S]*?"action"\s*:\s*"create_document"[\s\S]*?\}/;
        const match = text.match(regex);
        if (!match) return null;
        try {
            const json = JSON.parse(match[0]);
            if (json.action === 'create_document') return json;
        } catch (e) {}
        return null;
    }

    _detectReadDocument(text) {
        const regex = /\{[\s\S]*?"action"\s*:\s*"read_document"[\s\S]*?\}/;
        const match = text.match(regex);
        if (!match) return null;
        try {
            const json = JSON.parse(match[0]);
            if (json.action === 'read_document') return json;
        } catch (e) {}
        return null;
    }

    // ============================================
    // CRIAR E GUARDAR NO TURSO + SUPABASE
    // ============================================
    async _createAndUploadDocument(intent) {
        const userId = this.app.user.id;
        if (!userId) return;
        if (typeof showToast === 'function') showToast('⏳ A gerar documento...', 'info');
        try {
            const title = intent.title || 'Documento Sem Título';
            const content = intent.content || '';
            const format = (intent.format || 'pdf').toLowerCase();
            const category = intent.category || 'Trabalhos';
            const id = Date.now().toString();

            console.log('[Turso] Guardando conteúdo para:', title);

            const novoDoc = {
                id: id,
                nome: title,
                categoria: category,
                descricao: 'Criado pela Zero IA',
                arquivo: 'TURSO_DB',
                conteudoIA: content, // ⭐ ADICIONAR O TEXTO COMPLETO AQUI
                tipo: format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
                nomeArquivo: `${title}.${format}`,
                tamanho: content.length,
                dataUpload: new Date().toISOString(),
                storagePath: null
            };

            if (!this.app.data.documentos) this.app.data.documentos = [];
            this.app.data.documentos.unshift(novoDoc);

            await window.DatabaseService.saveDocumentos(userId, this.app.data.documentos);

            if (window.CacheManager) {
                window.CacheManager.set('documentos', this.app.data.documentos, true);
            }
            if (typeof showToast === 'function') showToast('✅ Documento guardado nos Meus Documentos!', 'success');
            
            this.messages.push({
                role: 'assistant',
                content: `✅ Documento **"${title}"** criado e guardado nos **Meus Documentos** (formato ${format.toUpperCase()}).`,
                time: new Date().toLocaleTimeString(),
                _saved: false
            });
            await this.salvarConversaAtual();
            this.renderChat();
        } catch (e) {
            console.error('[CreateDoc]', e);
            if (typeof showToast === 'function') showToast('❌ Erro ao criar documento.', 'error');
        }
    }

    // ============================================
    // LER DOCUMENTO E ENVIAR PARA A IA
    // ============================================
    async _handleReadDocument(search, aiContext, docsList) {
        try {
            const searchLower = search.toLowerCase();
            const doc = docsList.find(d => d.nome.toLowerCase().includes(searchLower));

            if (!doc) {
                this.messages.push({
                    role: 'assistant',
                    content: `❌ Não encontrei nenhum documento com o nome "${search}".`,
                    time: new Date().toLocaleTimeString(),
                    _saved: false
                });
                await this.salvarConversaAtual();
                this.renderChat();
                return;
            }
            if (typeof showToast === 'function') showToast(`📄 A ler "${doc.nome}"...`, 'info');

            let content = doc.conteudoIA || "Conteúdo do documento não disponível.";
            if (doc.arquivo && doc.arquivo !== 'TURSO_DB' && doc.arquivo.startsWith('data:')) {
                content = atob(doc.arquivo.split(',')[1]);
            }

            const promptWithDoc = `📄 Documento lido: "${doc.nome}"\nCONTEÚDO:\n${content.substring(0, 10000)}\n---\nO utilizador quer criar um trabalho com base neste documento. Gera o trabalho e adiciona o JSON de create_document.`;
            const supabaseUrl = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
            const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";
            
            const apiResponse = await fetch(`${supabaseUrl}/functions/v1/zero-ia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
                body: JSON.stringify({ prompt: promptWithDoc, context: aiContext, models: ["openai/gpt-oss-120b"] })
            });
            
            if (apiResponse.ok) {
                const data = await apiResponse.json();
                const response2 = data.choices?.[0]?.message?.content;

                if (response2) {
                    const createIntent = this._detectCreateDocument(response2);
                    if (createIntent) {
                        this.messages.push({
                            role: 'assistant',
                            content: '✅ Novo documento baseado no original está pronto!',
                            time: new Date().toLocaleTimeString(),
                            _saved: false
                        });
                        await this.salvarConversaAtual();
                        this.renderChat();
                        await this._createAndUploadDocument(createIntent);
                    } else {
                        this.messages.push({
                            role: 'assistant',
                            content: response2,
                            time: new Date().toLocaleTimeString(),
                            _saved: false
                        });
                        await this.salvarConversaAtual();
                        this.renderChat();
                    }
                }
            }
        } catch (e) {
            console.error('[ReadDoc]', e);
        }
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
        
        if (!this.temLimiteDisponivel()) {
            this._mostrarToast(`⛔ Limite diário de ${this.LIMITE_DIARIO} mensagens atingido!`);
            this.messages.push({
                role: 'assistant',
                content: `⛔ Você atingiu o limite diário de ${this.LIMITE_DIARIO} mensagens. Volte amanhã para continuar!`,
                time: new Date().toLocaleTimeString(),
                _saved: false
            });
            await this.salvarConversaAtual();
            this.renderChat();
            return;
        }
        
        this._ultimaMensagem = text;
        
        // Adicionar mensagem do user
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
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ia-message ia-message-ai ia-loading';
        loadingDiv.innerHTML = `
            <div class="ia-message-avatar">🤖</div>
            <div class="ia-message-content">
                <span class="ia-dots"><span>.</span><span>.</span><span>.</span></span>
                <span style="font-size:0.7rem;color:var(--text-secondary);margin-left:8px;">Processando...</span>
            </div>
        `;
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;
        
        try {
            // ⭐ BUSCAR DOCUMENTOS DO BANCO (para o contexto da IA)
            const userId = this.app.user.id;
            let docsDoBanco = [];
            if (window.DatabaseService) {
                docsDoBanco = await window.DatabaseService.getDocumentos(userId);
            }

            // Construir contexto
            let context = this.buildUserContext(text);
            if (docsDoBanco.length > 0) {
                context += `\n📁 SEUS DOCUMENTOS NO SISTEMA:\n`;
                docsDoBanco.forEach(d => {
                    context += `- ${d.nome}\n`;
                });
                context += `(Se o utilizador pedir para ler um destes documentos, responda com o JSON de read_document).\n`;
            }
            let response;
                
            // ⭐ CHAMAR O SUPABASE (EDGE FUNCTION)
            const supabaseUrl = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
            const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";
                
            const apiResponse = await fetch(`${supabaseUrl}/functions/v1/zero-ia`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({
                    prompt: text,
                    context: context,
                    models: ["openai/gpt-oss-120b", "llama-3.3-70b-versatile"]
                })
            });
                        
            if (apiResponse.ok) {
                const data = await apiResponse.json();
                response = data.choices?.[0]?.message?.content;
            }
                        
            if (!response) {
                response = this._getFallbackResponse(text);
            }
                        
            loadingDiv.remove();
            this._incrementarUso();

            // ⭐ VERIFICAR SE A IA QUER CRIAR UM DOCUMENTO
            const createIntent = this._detectCreateDocument(response);
            if (createIntent) {
                const cleanResponse = response.replace(/```json[\s\S]*?```/g, '').replace(/\{[\s\S]*?"action"\s*:\s*"create_document"[\s\S]*?\}/g, '').trim();

                this.messages.push({
                    role: 'assistant',
                    content: cleanResponse || '✅ Documento preparado!',
                    time: new Date().toLocaleTimeString(),
                    timestamp: new Date().toISOString(),
                    _saved: false
                });
                this.renderChat();

                // Criar documento
                await this._createAndUploadDocument(createIntent);
                this._isProcessing = false;
                return;
            }

            // ⭐ VERIFICAR SE A IA QUER LER UM DOCUMENTO
            const readIntent = this._detectReadDocument(response);
            if (readIntent) {
                const cleanResponse = response.replace(/```json[\s\S]*?```/g, '').replace(/\{[\s\S]*?"action"\s*:\s*"read_document"[\s\S]*?\}/g, '').trim();

                if (cleanResponse) {
                    this.messages.push({
                        role: 'assistant',
                        content: cleanResponse,
                        time: new Date().toLocaleTimeString(),
                        timestamp: new Date().toISOString(),
                        _saved: false
                    });
                    this.renderChat();
                }

                await this._handleReadDocument(readIntent.search, context, docsDoBanco);
                this._isProcessing = false;
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
            console.error('[IA Mobile] ❌ Erro:', error);
            loadingDiv.remove();
            this.messages.push({
                role: 'assistant',
                content: '❌ Ocorreu um erro ao comunicar com a IA. Tenta novamente!',
                time: new Date().toLocaleTimeString(),
                _saved: false
            });
            await this.salvarConversaAtual();
            this.renderChat();
        } finally {
            this._isProcessing = false;
        }
    }

    // ============================================
    // FALLBACK LOCAL
    // ============================================
    _getFallbackResponse(texto) {
        const perguntas = texto.toLowerCase();
        const pendentes = this.tasks.filter(t => !t.completed);
        const notasCount = this.notes.length;
        
        if (perguntas.includes('tarefa') || perguntas.includes('dever') || perguntas.includes('pendente')) {
            if (pendentes.length === 0) {
                return 'Você não tem tarefas pendentes. Parabéns, está em dia! 🎉';
            }
            const lista = pendentes.map((t, i) => 
                `${i+1}. ${t.title || t.nome}${t.subject ? ` (${t.subject})` : ''}${t.date ? ` - Entrega: ${t.date}` : ''}`
            ).join('\n');
            return `Você tem ${pendentes.length} tarefas pendentes:\n\n${lista}\n\nRecomendo priorizar as mais urgentes.`;
        }
        
        if (perguntas.includes('anota') || perguntas.includes('nota')) {
            if (notasCount === 0) {
                return 'Você não tem anotações salvas. Que tal criar uma? 📝';
            }
            const lista = this.notes.slice(0, 5).map((n, i) => 
                `${i+1}. ${n.title || 'Sem título'}`
            ).join('\n');
            return `Você tem ${notasCount} anotações salvas:\n\n${lista}${notasCount > 5 ? `\n... e mais ${notasCount - 5}` : ''}`;
        }
        
        if (perguntas.includes('disciplina') || perguntas.includes('matéria')) {
            if (this.disciplinas.length === 0) {
                return 'Nenhuma disciplina cadastrada. Vá ao dashboard e adicione suas matérias. 📚';
            }
            const lista = this.disciplinas.map(d => `- ${d.nome}`).join('\n');
            return `Suas disciplinas:\n\n${lista}`;
        }
        
        if (perguntas.includes('horário') || perguntas.includes('aula') || perguntas.includes('hoje')) {
            const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'short' });
            const diaSemana = hoje.charAt(0).toUpperCase() + hoje.slice(1);
            const aulasHoje = this.weeklySchedule[diaSemana] || [];
            
            if (aulasHoje.length === 0) {
                return `Hoje (${diaSemana}) você não tem aulas agendadas. Aproveite para estudar.`;
            }
            const lista = aulasHoje.map(a => 
                `${a.materia} às ${a.horaInicio}${a.horaFim ? ` - ${a.horaFim}` : ''}`
            ).join('\n');
            return `Hoje (${diaSemana}) você tem:\n\n${lista}`;
        }
        
        if (perguntas.includes('oi') || perguntas.includes('olá') || perguntas.includes('eai')) {
            return 'Olá! Como posso ajudar você hoje? Estou aqui para auxiliar nos seus estudos!';
        }
        
        return 'Desculpe, não entendi completamente sua pergunta. Poderia reformular ou dar mais detalhes?';
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    // ============================================
    // SETUP EVENTS
    // ============================================
    setupEvents() {
        const input = document.getElementById('ia-input');
        const sendBtn = document.getElementById('ia-send-btn');
        const fabBtn = document.getElementById('btn-open-ia');
        const backBtn = document.getElementById('btn-back-ia');

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
        
        document.querySelectorAll('.ia-action-card').forEach(card => {
            card.onclick = () => {
                const prompt = card.dataset.prompt;
                if (prompt) {
                    this.sendMessage(prompt);
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
                    <div class="ia-painel-user-avatar">${this._escapeHtml(iniciais)}</div>
                    <div class="ia-painel-user-info">
                        <span>${this._escapeHtml(nome)}</span>
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
                <span class="ia-painel-item-title">${this._escapeHtml(h.title)}</span>
                <button class="ia-painel-item-del" data-del="${h.id}">${IA_ICONS.trash}</button>
            </div>`).join('');
    }
}

// ============================================
// FUNÇÃO GLOBAL PARA COPIAR
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
        console.error('[IA Mobile] Erro ao copiar:', error);
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
        console.error('[IA Mobile] Fallback copy falhou:', err);
    }
}

// ============================================
// FAB ESCONDE NA TELA DE IA
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

console.log('[IA Mobile] ✅ Módulo atualizado com sucesso!');