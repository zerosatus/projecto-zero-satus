// ============================================
// modules/ia.js - MÓDULO DA IA (PC - CORRIGIDO)
// ⭐ + ACESSO TOTAL A TAREFAS, ANOTAÇÕES, HORÁRIO E DISCIPLINAS
// ⭐ + LIMITE DIÁRIO DE 15 MENSAGENS
// ⭐ + PAINEL LATERAL, HISTÓRICO E FAB
// ============================================

// ⭐ ÍCONES SVG
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

class IaModule {
    constructor(app) {
        this.app = app;
        this.name = 'ia';
        this.messages = [];
        this._previousView = 'inicio';
        this._isProcessing = false;
        this._modoGiria = false;
        this._ultimaMensagem = '';
        this._firstRender = true;
        
        // LIMITE DIÁRIO
        this.LIMITE_DIARIO = 15;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        // HISTÓRICO
        this.history = [];
        this.currentHistoryId = null;
        
        // DADOS DO USUÁRIO
        this.tasks = [];
        this.notes = [];
        this.weeklySchedule = {};
        this.timeSlots = [];
        this.disciplinas = [];
        this.notifications = [];
        
        console.log('[IA PC] 🤖 Inicializado');
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
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[IA PC] 📊 Renderizando...');
        
        this.notifications = data.notifications || [];
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.weeklySchedule = data.weeklySchedule || {};
        this.timeSlots = data.timeSlots || [];
        this.disciplinas = data.disciplinas || [];
        
        // Inicializar UI
        this.carregarHistorico();
        this.renderHistoryList();
        this.renderChat();
        this.updateBadge();
        this._atualizarStatusGiria();
        this._atualizarStatusLimite();
        
        // Configurar eventos (apenas na primeira vez)
        if (this._firstRender) {
            this.setupEvents();
            this._firstRender = false;
        }
        
        console.log('[IA PC] 📊 Dados carregados:', {
            tasks: this.tasks.length,
            pendentes: this.tasks.filter(t => !t.completed).length,
            notes: this.notes.length,
            disciplinas: this.disciplinas.length
        });
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
                <div class="ia-empty-state" style="text-align:center;padding:40px 20px;max-width:600px;margin:0 auto;">
                    <div class="ia-empty-orb" style="width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,#8b5cf6,#6366f1);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 0 40px rgba(139,92,246,0.3);">
                        ${IA_SPARKLES_SVG}
                    </div>
                    <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:6px;">${saud}, ${this.app.escapeHtml(nome)}! 👋</h3>
                    <p style="font-size:0.95rem;color:var(--text-secondary);margin-bottom:16px;">Como posso te ajudar hoje?</p>
                    
                    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:14px;background:var(--card-bg);border-radius:14px;border:1px solid var(--border-color);margin-bottom:16px;">
                        <div style="display:flex;flex-direction:column;align-items:center;padding:4px 14px;">
                            <span style="font-weight:700;color:var(--accent-purple);font-size:1.1rem;">${pendentes.length}</span>
                            <span style="font-size:0.65rem;color:var(--text-secondary);">Pendentes</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;padding:4px 14px;">
                            <span style="font-weight:700;color:var(--accent-green);font-size:1.1rem;">${concluidas.length}</span>
                            <span style="font-size:0.65rem;color:var(--text-secondary);">Concluídas</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;padding:4px 14px;">
                            <span style="font-weight:700;color:var(--accent-orange);font-size:1.1rem;">${this.notes.length}</span>
                            <span style="font-size:0.65rem;color:var(--text-secondary);">Anotações</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;padding:4px 14px;">
                            <span style="font-weight:700;color:#60a5fa;font-size:1.1rem;">${this.disciplinas.length}</span>
                            <span style="font-size:0.65rem;color:var(--text-secondary);">Disciplinas</span>
                        </div>
                    </div>
                    
                    <p style="font-size:0.75rem;color:var(--text-secondary);">💬 Digite <strong>"fala com gíria"</strong> para ativar ou <strong>"fala normal"</strong> para desativar</p>
                    <p style="font-size:0.7rem;color:var(--text-secondary);margin-top:4px;" id="ia-limite-status">💬 ${restante}/${this.LIMITE_DIARIO} perguntas hoje</p>
                </div>
            `;
            
            const actions = document.getElementById('ia-quick-actions');
            if (actions) actions.style.display = 'flex';
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
                <div class="ia-message ${isUser ? 'ia-message-user' : 'ia-message-ai'}" style="display:flex;align-items:flex-start;gap:12px;max-width:85%;${isUser ? 'align-self:flex-end;flex-direction:row-reverse;' : 'align-self:flex-start;'}">
                    <div class="ia-message-avatar" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;background:${isUser ? 'var(--accent-purple)' : 'var(--card-bg)'};border:${isUser ? 'none' : '1px solid var(--border-color)'};flex-shrink:0;">${isUser ? '👤' : '🤖'}</div>
                    <div class="ia-message-content" style="padding:12px 18px;border-radius:16px;font-size:0.9rem;line-height:1.6;word-wrap:break-word;max-width:100%;background:${isUser ? 'var(--accent-purple)' : 'var(--card-bg)'};color:${isUser ? 'white' : 'var(--text-primary)'};border:${isUser ? 'none' : '1px solid var(--border-color)'};border-bottom-${isUser ? 'right' : 'left'}-radius:4px;" ${isAI ? 'style="user-select:text;-webkit-user-select:text;"' : ''}>
                        ${content}
                        ${isAI ? `<span class="ia-copy-hint" onclick="window.copyMessage(this)" style="font-size:0.6rem;color:var(--text-secondary);opacity:0.5;display:block;margin-top:6px;cursor:pointer;">📋 Copiar</span>` : ''}
                    </div>
                    <div class="ia-message-time" style="font-size:0.6rem;color:var(--text-secondary);margin-top:4px;${isUser ? 'text-align:right;' : ''}">${time}</div>
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
        const slots = this.timeSlots || [];
        const disciplinas = this.disciplinas || [];
        
        // DETECTAR COMANDOS DE GÍRIA
        const pediuGiria = this._usuarioPediuGiria(textoUsuario);
        const querNormal = this._usuarioQuerNormal(textoUsuario);
        
        if (pediuGiria) {
            this._modoGiria = true;
            this._mostrarToast('🇲🇿 Modo Gíria ativado!');
        } else if (querNormal) {
            this._modoGiria = false;
            this._mostrarToast('📚 Modo Normal ativado!');
        }
        
        const isPerguntaSobreModo = pediuGiria || querNormal;
        
        let contexto = `
📚 CONTEXTO COMPLETO DO ESTUDANTE - ${new Date().toLocaleString('pt-BR')}

👤 PERFIL:
Nome: ${user.nome || 'Estudante'}
Email: ${user.email || 'Não informado'}

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
    `   ${i+1}. ${n.title || 'Sem título'}${n.content ? ` - ${n.content.substring(0, 60).replace(/\n/g, ' ')}${n.content.length > 60 ? '...' : ''}` : ''}`
).join('\n') + (notes.length > 5 ? `\n   ... e mais ${notes.length - 5} anotações` : '') : 'Nenhuma anotação ainda'}

📚 DISCIPLINAS:
${disciplinas.length > 0 ? disciplinas.map(d => `   - ${d.nome}`).join('\n') : 'Nenhuma disciplina cadastrada'}

📅 HORÁRIO SEMANAL:
${Object.entries(schedule).map(([dia, aulas]) => {
    if (aulas && aulas.length > 0) {
        return `${dia}: ${aulas.map(a => `${a.materia} (${a.horaInicio}${a.horaFim ? ` - ${a.horaFim}` : ''})`).join(', ')}`;
    }
    return `${dia}: Sem aulas`;
}).join('\n')}

🎯 LIMITE DIÁRIO: ${this.getUsoHoje()}/${this.LIMITE_DIARIO} usadas, ${this.getLimiteRestante()} restantes
`;

        if (this._modoGiria) {
            contexto += `
✅ MODO GÍRIA ATIVO! Use gírias moçambicanas: broo, nice, maning, go, txuna, tamos juntos, fixe, bué, bora, magaia.
✅ Seja descontraído, amigável e divertido.
✅ Use emojis frequentemente 🇲🇿
${isPerguntaSobreModo ? '⚠️ O usuário acabou de ativar o modo gíria. Responda comemorando!' : ''}
`;
        } else {
            contexto += `
✅ MODO NORMAL ATIVO! Fale em português formal e claro.
✅ Seja profissional, direto e objetivo.
✅ Dê respostas completas e bem estruturadas.
${isPerguntaSobreModo ? '⚠️ O usuário acabou de desativar o modo gíria. Responda confirmando de forma educada.' : ''}
`;
        }
        
        return contexto;
    }

    _usuarioPediuGiria(texto) {
        const palavras = ['gíria', 'giria', 'moçambique', 'moçambicana', 'magaia', 'broo', 'txuna', 'maning', 'tamos juntos', 'fala com gíria', 'modo gíria'];
        return palavras.some(p => texto.toLowerCase().includes(p));
    }
    
    _usuarioQuerNormal(texto) {
        const palavras = ['sem gíria', 'normal', 'formal', 'fala normal', 'desativa gíria', 'modo normal'];
        return palavras.some(p => texto.toLowerCase().includes(p));
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
            btn.style.background = this._modoGiria ? 'rgba(139,92,246,0.15)' : 'var(--card-bg)';
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
            ? '🇲🇿 Modo Gíria ativado!'
            : '📚 Modo Normal ativado!';
        this._mostrarToast(mensagem);
        this._atualizarStatusGiria();
        this.messages.push({
            role: 'assistant',
            content: this._modoGiria
                ? '🇲🇿 **Modo Gíria ativado!** Agora vou falar com gírias moçambicanas, broo! Tamos juntos! 😎'
                : '📚 **Modo Normal ativado!** Agora vou falar de forma formal e profissional.',
            time: new Date().toLocaleTimeString(),
            isSystem: true
        });
        this.renderChat();
    }

    // ============================================
    // ⭐ ENVIAR MENSAGEM (CORRIGIDO)
    // ============================================
    async sendMessage(text) {
        // ⭐ PEGAR TEXTO DO INPUT
        if (!text) {
            const input = document.getElementById('ia-input');
            if (!input) {
                console.warn('[IA PC] ❌ Input não encontrado');
                return;
            }
            text = input.value.trim();
            if (!text) {
                console.log('[IA PC] ℹ️ Mensagem vazia');
                return;
            }
            input.value = '';
            console.log('[IA PC] 📤 Mensagem do input:', text.substring(0, 50) + '...');
        }
        
        if (this._isProcessing) {
            console.log('[IA PC] ⏳ Já processando...');
            return;
        }
        
        // ⭐ VERIFICAR LIMITE
        if (!this.temLimiteDisponivel()) {
            this._mostrarToast(`⛔ Limite diário de ${this.LIMITE_DIARIO} mensagens atingido!`);
            this.messages.push({
                role: 'assistant',
                content: `⛔ Você atingiu o limite diário de ${this.LIMITE_DIARIO} mensagens. Volte amanhã!`,
                time: new Date().toLocaleTimeString()
            });
            this.renderChat();
            return;
        }
        
        this._ultimaMensagem = text;
        this.messages.push({
            role: 'user',
            content: text,
            time: new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString()
        });
        this.renderChat();
        this._isProcessing = true;
        
        const container = document.getElementById('ia-messages-container');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ia-message ia-message-ai ia-loading';
        loadingDiv.style.cssText = 'display:flex;align-items:flex-start;gap:12px;max-width:85%;align-self:flex-start;';
        loadingDiv.innerHTML = `
            <div class="ia-message-avatar" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;background:var(--card-bg);border:1px solid var(--border-color);flex-shrink:0;">🤖</div>
            <div class="ia-message-content" style="padding:12px 18px;border-radius:16px;font-size:0.9rem;line-height:1.6;background:var(--card-bg);border:1px solid var(--border-color);border-bottom-left-radius:4px;display:flex;align-items:center;gap:10px;">
                <span class="ia-dots" style="display:inline-flex;gap:4px;">
                    <span style="display:inline-block;width:8px;height:8px;background:var(--accent-purple);border-radius:50%;animation:dotBounce 1.2s ease-in-out infinite;"></span>
                    <span style="display:inline-block;width:8px;height:8px;background:var(--accent-purple);border-radius:50%;animation:dotBounce 1.2s ease-in-out infinite 0.2s;"></span>
                    <span style="display:inline-block;width:8px;height:8px;background:var(--accent-purple);border-radius:50%;animation:dotBounce 1.2s ease-in-out infinite 0.4s;"></span>
                </span>
                <span style="font-size:0.75rem;color:var(--text-secondary);">
                    ${this._modoGiria ? 'To a pensar, broo...' : 'Processando...'}
                </span>
            </div>
        `;
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;
        
        try {
            const context = this.buildUserContext(text);
            let response;
            const service = window.MultiAIService;
            
            if (service) {
                console.log('[IA PC] 📤 Enviando para API... Modo:', this._modoGiria ? 'Gíria' : 'Normal');
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
            
            this.messages.push({
                role: 'assistant',
                content: response,
                time: new Date().toLocaleTimeString(),
                timestamp: new Date().toISOString()
            });
            
            this.salvarConversaAtual();
            this.renderChat();
            this._atualizarStatusLimite();
            
            if (this.getLimiteRestante() === 0) {
                this._mostrarToast(`⛔ Limite diário de ${this.LIMITE_DIARIO} mensagens atingido!`);
            }
            
        } catch (error) {
            console.error('[IA PC] ❌ Erro:', error);
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
    // FALLBACK
    // ============================================
    _getFallbackResponse(texto) {
        const perguntas = texto.toLowerCase();
        const pendentes = this.tasks.filter(t => !t.completed);
        const notasCount = this.notes.length;
        
        if (perguntas.includes('tarefa') || perguntas.includes('pendente')) {
            if (pendentes.length === 0) {
                return this._modoGiria 
                    ? '🇲🇿 Não tens tarefas pendentes, broo! Tás em dia! 🎉'
                    : 'Você não tem tarefas pendentes. Parabéns! 🎉';
            }
            const lista = pendentes.map((t, i) => 
                `${i+1}. ${t.title || t.nome}${t.subject ? ` (${t.subject})` : ''}`
            ).join('\n');
            return this._modoGiria
                ? `🇲🇿 Tens ${pendentes.length} tarefas pendentes!\n\n${lista}\n\nVai devagar, tamos juntos! 💪`
                : `Você tem ${pendentes.length} tarefas pendentes:\n\n${lista}`;
        }
        
        if (perguntas.includes('anotação') || perguntas.includes('nota')) {
            if (notasCount === 0) {
                return this._modoGiria
                    ? '🇲🇿 Não tens anotações, broo! Quer criar uma? 📝'
                    : 'Você não tem anotações. Que tal criar uma? 📝';
            }
            const lista = this.notes.slice(0, 5).map((n, i) => 
                `${i+1}. ${n.title || 'Sem título'}`
            ).join('\n');
            return this._modoGiria
                ? `🇲🇿 Tens ${notasCount} anotações!\n\n${lista}${notasCount > 5 ? `\n... e mais ${notasCount - 5}` : ''}`
                : `Você tem ${notasCount} anotações:\n\n${lista}`;
        }
        
        if (perguntas.includes('disciplina') || perguntas.includes('matéria')) {
            if (this.disciplinas.length === 0) {
                return this._modoGiria
                    ? '🇲🇿 Nenhuma disciplina cadastrada, maning!'
                    : 'Nenhuma disciplina cadastrada.';
            }
            const lista = this.disciplinas.map(d => `- ${d.nome}`).join('\n');
            return this._modoGiria
                ? `🇲🇿 Tuas disciplinas:\n\n${lista}\n\n📚 Bora estudar!`
                : `Suas disciplinas:\n\n${lista}`;
        }
        
        if (perguntas.includes('horário') || perguntas.includes('aula') || perguntas.includes('hoje')) {
            const diaSemana = new Date().toLocaleDateString('pt-BR', { weekday: 'short' });
            const dia = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
            const aulasHoje = this.weeklySchedule[dia] || [];
            
            if (aulasHoje.length === 0) {
                return this._modoGiria
                    ? `🇲🇿 Hoje (${dia}) não tens aulas, broo!`
                    : `Hoje (${dia}) você não tem aulas.`;
            }
            const lista = aulasHoje.map(a => `${a.materia} às ${a.horaInicio}`).join('\n');
            return this._modoGiria
                ? `🇲🇿 Hoje (${dia}) tens:\n\n${lista}\n\n📚 Bora estudar, magaia!`
                : `Hoje (${dia}) você tem:\n\n${lista}`;
        }
        
        if (perguntas.includes('oi') || perguntas.includes('olá') || perguntas.includes('eai')) {
            return this._modoGiria
                ? '🇲🇿 Eai broo! Tá fixe? Como posso ajudar? 😎'
                : 'Olá! Como posso ajudar você hoje?';
        }
        
        return this._modoGiria
            ? '🇲🇿 Boa pergunta, magaia! Tenta reformular. Tamos juntos! 🤝'
            : 'Desculpe, não entendi. Poderia reformular?';
    }

    // ============================================
    // UPDATE BADGE
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notificationBadgeIA');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    // ============================================
    // ⭐ SETUP EVENTS (CORRIGIDO)
    // ============================================
    setupEvents() {
        const input = document.getElementById('ia-input');
        const sendBtn = document.getElementById('ia-send-btn');
        const fabBtn = document.getElementById('btnOpenIA');
        const backBtn = document.getElementById('navBackBtn');
        const toggleBtn = document.getElementById('btn-toggle-giria');

        console.log('[IA PC] 🔧 Configurando eventos...');

        // ⭐ BOTÃO ENVIAR
        if (sendBtn) {
            const newSendBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
            
            newSendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[IA PC] 📤 Botão enviar clicado');
                this.sendMessage();
            });
        }
        
        // ⭐ INPUT
        if (input) {
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            newInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[IA PC] 📤 Enter pressionado');
                    this.sendMessage();
                }
            });
            
            setTimeout(() => newInput.focus(), 300);
        }
        
        // ⭐ FAB
        if (fabBtn) {
            const newFab = fabBtn.cloneNode(true);
            fabBtn.parentNode.replaceChild(newFab, fabBtn);
            
            newFab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[IA PC] 🚀 Abrindo IA via FAB');
                this._previousView = this.app.currentView;
                this.app.showView('ia');
                setTimeout(() => {
                    const inputEl = document.getElementById('ia-input');
                    if (inputEl) inputEl.focus();
                    this._atualizarStatusLimite();
                }, 500);
            });
        }
        
        // ⭐ BACK
        if (backBtn) {
            const newBack = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBack, backBtn);
            
            newBack.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[IA PC] 🔙 Voltando para:', this._previousView || 'inicio');
                this.app.showView(this._previousView || 'inicio');
            });
        }
        
        // ⭐ TOGGLE GÍRIA
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleModoGiria();
            });
        }
        
        // ⭐ CARDS DE AÇÃO
        document.querySelectorAll('.chip').forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            newCard.addEventListener('click', (e) => {
                const prompt = newCard.dataset.prompt;
                if (prompt) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[IA PC] 🎯 Card clicado:', prompt);
                    const textoFinal = this._modoGiria
                        ? `${prompt} (fala com gíria moçambicana)`
                        : prompt;
                    this.sendMessage(textoFinal);
                }
            });
        });
        
        // ⭐ LIMITE PERIODICAMENTE
        setInterval(() => {
            this._atualizarStatusLimite();
        }, 30000);
        
        setTimeout(() => this._atualizarStatusLimite(), 500);
        
        console.log('[IA PC] ✅ Eventos configurados!');
    }

    // ============================================
    // HISTÓRICO
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
        const list = document.getElementById('historyList');
        if (!list) return;
        if (this.history.length === 0) {
            list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-secondary);font-size:0.8rem;">Nenhuma conversa ainda.<br>Comece uma nova! ✨</div>`;
            return;
        }
        list.innerHTML = this.history.map(h => `
            <div class="history-item ${h.id === this.currentHistoryId ? 'active' : ''}" onclick="app.modules.ia?.selecionarConversa('${h.id}')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;${h.id === this.currentHistoryId ? 'background:rgba(139,92,246,0.15);' : ''}">
                <span style="font-size:0.8rem;">💬</span>
                <span style="flex:1;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.app.escapeHtml(h.title)}</span>
                <button onclick="event.stopPropagation();app.modules.ia?.excluirConversa('${h.id}')" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:0.7rem;">✕</button>
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

console.log('[IA PC] ✅ Módulo carregado!');