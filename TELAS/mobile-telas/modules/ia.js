// ============================================
// modules/ia.js - MÓDULO DA IA COM CONTROLE DE GÍRIA
// ============================================

class IAModule {
    constructor(app) {
        this.app = app;
        this.name = 'ia';
        this.messages = [];
        this._previousView = 'dashboard';
        this._isProcessing = false;
        this._modoGiria = false; // ⭐ CONTROLE: false = normal, true = gíria
        this._ultimaMensagem = '';
        console.log('[IA] 🤖 Inicializado com controle de gíria');
    }

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        this.notifications = data.notifications || [];
        this.renderChat();
        this.updateBadge();
        this.setupEvents();
        this._atualizarStatusGiria();
    }

    // ============================================
    // RENDER CHAT
    // ============================================
    renderChat() {
        const container = document.getElementById('ia-messages-container');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="ia-empty-state">
                    <div class="ia-empty-icon"><ion-icon name="sparkles-outline"></ion-icon></div>
                    <h3>Olá! Como posso ajudar?</h3>
                    <p>Pergunte sobre estudos, tarefas ou dicas!</p>
                    <p style="font-size:0.7rem;color:var(--text-secondary);margin-top:8px;">
                        💬 Digite <strong>"fala com gíria"</strong> para ativar ou 
                        <strong>"fala normal"</strong> para desativar
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
            const content = this.app.escapeHtml(msg.content)
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            html += `
                <div class="ia-message ${isUser ? 'ia-message-user' : 'ia-message-ai'}">
                    <div class="ia-message-avatar">${isUser ? '👤' : '🤖'}</div>
                    <div class="ia-message-content">${content}</div>
                    <div class="ia-message-time">${msg.time || new Date().toLocaleTimeString()}</div>
                </div>
            `;
        });
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }

    // ============================================
    // ⭐ DETECTAR SE O USUÁRIO PEDIU GÍRIA
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

    // ============================================
    // ⭐ DETECTAR SE O USUÁRIO QUER VOLTAR AO NORMAL
    // ============================================
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
    // ⭐ BUILD USER CONTEXT (CORRIGIDO)
    // ============================================
    buildUserContext(textoUsuario) {
        const user = this.app.user || {};
        const data = this.app.data || {};
        const tasks = data.tasks || [];
        const pendentes = tasks.filter(t => !t.completed).length;
        const materias = (data.disciplinas || []).length;
        const notas = (data.notes || []).length;

        // ⭐ DETECTAR SE O USUÁRIO PEDIU GÍRIA OU NORMAL
        const pediuGiria = this._usuarioPediuGiria(textoUsuario);
        const querNormal = this._usuarioQuerNormal(textoUsuario);

        // ⭐ ALTERNAR O MODO BASEADO NO QUE O USUÁRIO PEDIU
        if (pediuGiria) {
            this._modoGiria = true;
            this._mostrarToast('🇲🇿 Modo Gíria ativado! Fala como magaia!');
        } else if (querNormal) {
            this._modoGiria = false;
            this._mostrarToast('📚 Modo Normal ativado! Fala formal.');
        }

        // ⭐ SE O USUÁRIO PERGUNTOU ALGO SOBRE O MODO, NÃO PRECISA REPETIR
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
    // ⭐ MOSTRAR TOAST (compatível com a função global)
    // ============================================
    _mostrarToast(mensagem) {
        if (typeof showToast === 'function') {
            showToast(mensagem, 'info');
        } else {
            console.log('[IA] 📢', mensagem);
        }
        this._atualizarStatusGiria();
    }

    // ============================================
    // ⭐ ATUALIZAR STATUS DO BOTÃO
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

    // ============================================
    // ⭐ ALTERNAR MODO MANUAL
    // ============================================
    toggleModoGiria() {
        this._modoGiria = !this._modoGiria;
        const mensagem = this._modoGiria 
            ? '🇲🇿 Modo Gíria ativado! Fala que nem magaia!'
            : '📚 Modo Normal ativado! Fala formal.';
        this._mostrarToast(mensagem);
        this._atualizarStatusGiria();
        
        // Adicionar mensagem do sistema no chat
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
    // ⭐ ENVIAR MENSAGEM (CORRIGIDO)
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

        // Guardar a mensagem para detectar comandos
        this._ultimaMensagem = text;

        this.messages.push({ 
            role: 'user', 
            content: text,
            time: new Date().toLocaleTimeString()
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

            // Tentar usar o serviço disponível
            const service = window.GeminiService || window.OpenRouterService;

            if (service) {
                console.log('[IA] 📤 Enviando para serviço... Modo:', this._modoGiria ? 'Gíria' : 'Normal');
                const result = await service.sendMessage(text, context);
                if (result.success) {
                    response = result.text;
                } else {
                    response = `❌ ${result.error}`;
                }
            } else {
                // ⭐ FALLBACK: respostas pré-definidas
                response = this._getFallbackResponse(text);
            }

            loadingDiv.remove();
            this.messages.push({
                role: 'assistant',
                content: response,
                time: new Date().toLocaleTimeString()
            });
            this.renderChat();

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
    // ⭐ FALLBACK (caso o serviço não esteja disponível)
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
                return '🇲🇿 As tarefas tão aí, mas tu consegues! Vai devagar, uma de cada vez. Não te estresses, broo! 😎';
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
    // UPDATE BADGE
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    // ============================================
    // ⭐ SETUP EVENTS (COMPLETO)
    // ============================================
    setupEvents() {
        const input = document.getElementById('ia-input');
        const sendBtn = document.getElementById('ia-send-btn');
        const fabBtn = document.getElementById('btn-open-ia');
        const backBtn = document.getElementById('btn-back-ia');
        const toggleBtn = document.getElementById('btn-toggle-giria');

        // Botão enviar
        if (sendBtn) {
            sendBtn.onclick = () => this.sendMessage();
        }

        // Input - Enter para enviar
        if (input) {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            };
        }

        // Botão flutuante da IA
        if (fabBtn) {
            fabBtn.onclick = () => {
                this._previousView = this.app.currentView;
                this.app.showView('ia');
            };
        }

        // Botão voltar
        if (backBtn) {
            backBtn.onclick = () => {
                this.app.showView(this._previousView || 'dashboard');
            };
        }

        // ⭐ BOTÃO ALTERNAR GÍRIA
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                this.toggleModoGiria();
            };
        }

        // ⭐ CARDS DE AÇÃO RÁPIDA (com detecção de gíria)
        document.querySelectorAll('.ia-action-card').forEach(card => {
            card.onclick = () => {
                const prompt = card.dataset.prompt;
                if (prompt) {
                    // Adicionar "com gíria" se o modo estiver ativo
                    const textoFinal = this._modoGiria 
                        ? `${prompt} (fala com gíria moçambicana)`
                        : prompt;
                    this.sendMessage(textoFinal);
                }
            };
        });

        // ⭐ COMANDOS POR TEXTO ESPECIAL (via mensagem do sistema)
        // O próprio buildUserContext já detecta os comandos

        console.log('[IA] ✅ Eventos configurados! Modo:', this._modoGiria ? 'Gíria' : 'Normal');
    }
}

console.log('[IA] ✅ Módulo carregado com controle de gíria!');