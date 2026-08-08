// modules/ia.js - MÓDULO DA IA (HUGGING FACE)
// ============================================

class IAModule {
    constructor(app) {
        this.app = app;
        this.name = 'Zero ia';
        this.messages = [];
        this._previousView = 'dashboard';
        this._isProcessing = false;
        this._modoGiria = false;
        this._ultimaMensagem = '';
        console.log('[IA]  Inicializado com Hugging Face API');
    }

    render(data) {
        this.notifications = data.notifications || [];
        this.renderChat();
        this.updateBadge();
        this.setupEvents();
        this._atualizarStatusGiria();
        this._atualizarStatusLimite();
    }

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
                    <p style="font-size:0.6rem;color:var(--text-secondary);margin-top:4px;" id="ia-limite-status">
                        💬 ${window.getLimiteIA ? window.getLimiteIA().restante : '?'} perguntas hoje
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

            html += `
                <div class="ia-message ${isUser ? 'ia-message-user' : 'ia-message-ai'}">
                    <div class="ia-message-avatar">${isUser ? '👤' : '🤖'}</div>
                    <div class="ia-message-content" ${isAI ? 'style="user-select:text;-webkit-user-select:text;"' : ''}>
                        ${content}
                        ${isAI ? `<span class="ia-copy-hint" onclick="window.copyMessage(this)">📋 Copiar</span>` : ''}
                    </div>
                    <div class="ia-message-time">${msg.time || new Date().toLocaleTimeString()}</div>
                </div>
            `;
        });
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }

    _usuarioPediuGiria(texto) {
        const palavrasChave = [
            'gíria', 'giria', 'moçambique', 'moçambicana', 'moçambicano',
            'maza', 'broo', 'txuna', 'maning', 'tamos juntos',
            'fala moçambicano', 'fala com gíria', 'fala que nem eu',
            'fala que nem broo', 'giria moçambicana', 'gíria moçambicana',
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
            this._mostrarToast('Modo Gíria ativado! Fala como broo!');
        } else if (querNormal) {
            this._modoGiria = false;
            this._mostrarToast(' Modo Normal ativado! Fala formal.');
        }

        const isPerguntaSobreModo = this._usuarioPediuGiria(textoUsuario) || 
                                     this._usuarioQuerNormal(textoUsuario);

        let contexto = `
 CONTEXTO DO ESTUDANTE
Nome: ${user.nome || 'Estudante'}
Tarefas pendentes: ${pendentes}
Disciplinas: ${materias}
Notas: ${notas}
`;

        if (this._modoGiria) {
            contexto += `
✅ MODO GÍRIA ATIVO! Use gírias moçambicanas como: broo, nice, maning, txuna, tamos juntos, bora, maza.
✅ Seja descontraído, amigável e divertido.
✅ Responda com entusiasmo e calor humano.
`;
        } else {
            contexto += `
✅ MODO NORMAL ATIVO! Fale em português formal e claro.
✅ Seja profissional, direto e objetivo.
✅ Use linguagem neutra, sem gírias.
✅ Dê respostas completas e bem estruturadas.
`;
        }

        return contexto;
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
        
        if (window.getLimiteIA) {
            const info = window.getLimiteIA();
            limiteEl.textContent = `💬 ${info.restante}/${info.maximo} perguntas hoje (${info.provider})`;
            limiteEl.style.color = info.restante < 3 ? 'var(--accent-red)' : 'var(--text-secondary)';
        }
    }

    toggleModoGiria() {
        this._modoGiria = !this._modoGiria;
        const mensagem = this._modoGiria 
            ? 'Modo Gíria ativado! Fala que nem broo!'
            : '📚 Modo Normal ativado! Fala formal.';
        this._mostrarToast(mensagem);
        this._atualizarStatusGiria();
        
        this.messages.push({
            role: 'assistant',
            content: this._modoGiria 
                ? '🇲🇿 **Modo Gíria ativado!** Agora vou falar com gírias moçambicanas, broo! Na boa?! '
                : '📚 **Modo Normal ativado!** Agora vou falar de forma formal e profissional. Como posso ajudar?',
            time: new Date().toLocaleTimeString(),
            isSystem: true
        });
        this.renderChat();
    }

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
            
            const service = window.MultiAIService || window.GeminiService;

            if (service) {
                console.log('[IA] 📤 Enviando para Hugging Face...');
                const result = await service.sendMessage(text, context);
                if (result.success) {
                    loadingDiv.remove();
                    this.messages.push({
                        role: 'assistant',
                        content: result.text,
                        time: new Date().toLocaleTimeString()
                    });
                    this.renderChat();
                    this._atualizarStatusLimite();
                } else {
                    loadingDiv.remove();
                    this.messages.push({
                        role: 'assistant',
                        content: `❌ ${result.error || 'Erro desconhecido'}`,
                        time: new Date().toLocaleTimeString()
                    });
                    this.renderChat();
                }
            } else {
                loadingDiv.remove();
                this.messages.push({
                    role: 'assistant',
                    content: this._getFallbackResponse(text),
                    time: new Date().toLocaleTimeString()
                });
                this.renderChat();
            }

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

    _getFallbackResponse(texto) {
        const perguntas = texto.toLowerCase();
        
        if (this._modoGiria) {
            if (perguntas.includes('oi') || perguntas.includes('olá')) {
                return 'Kmk broo! Nice? Tás biz em help?';
            }
            if (perguntas.includes('estudar') || perguntas.includes('estudos')) {
                return 'Ago marrar! Não tás bizz em capotar né? Vamos marra! ';
            }
            if (perguntas.includes('tarefa') || perguntas.includes('dever')) {
                return 'Bro a vida não é feita de morrangos! Vai txunar teu tpc se não ohh!';
            }
            if (perguntas.includes('matem') || perguntas.includes('conta')) {
                return 'Matemática não da medo, broo! Treina cenas faceis depois vai txunar ceda dificil! ';
            }
            return 'Boa pergunta, maza! Tenta txunar denovo ou ativa o modo normal se quiser uma resposta mais formal!';
        } else {
            if (perguntas.includes('oi') || perguntas.includes('olá')) {
                return 'Olá! Como posso ajudar você hoje?';
            }
            if (perguntas.includes('estudar') || perguntas.includes('estudos')) {
                return 'Para estudar de forma eficiente: 1) Crie um cronograma, 2) Use técnicas como Pomodoro, 3) Revisão espaçada.';
            }
            if (perguntas.includes('tarefa') || perguntas.includes('dever')) {
                return 'Para gerenciar suas tarefas: 1) Priorize as mais urgentes, 2) Divida em etapas, 3) Defina prazos realistas.';
            }
            if (perguntas.includes('matem') || perguntas.includes('conta')) {
                return 'Para matemática: 1) Domine as operações básicas, 2) Pratique exercícios diariamente, 3) Entenda os conceitos.';
            }
            return 'Desculpe, não entendi sua pergunta. Poderia reformular? Estou aqui para ajudar!';
        }
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    setupEvents() {
        const input = document.getElementById('ia-input');
        const sendBtn = document.getElementById('ia-send-btn');
        const fabBtn = document.getElementById('btn-open-ia');
        const backBtn = document.getElementById('btn-back-ia');
        const toggleBtn = document.getElementById('btn-toggle-giria');

        if (sendBtn) {
            sendBtn.onclick = () => this.sendMessage();
        }

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

        console.log('[IA] ✅ Eventos configurados!');
    }
}

// ⭐ FUNÇÃO GLOBAL PARA COPIAR MENSAGENS
window.copyMessage = function(element) {
    try {
        const messageContent = element.closest('.ia-message-content');
        if (!messageContent) return;
        
        const text = messageContent.textContent.replace(' Copiar', '').trim();
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    const originalText = element.textContent;
                    element.textContent = '✅ Copiado!';
                    setTimeout(() => {
                        element.textContent = originalText;
                    }, 2000);
                })
                .catch(() => {
                    fallbackCopy(text, element);
                });
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
        setTimeout(() => {
            element.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('[IA] Fallback copy falhou:', err);
        const originalText = element.textContent;
        element.textContent = '❌ Erro ao copiar';
        setTimeout(() => {
            element.textContent = originalText;
        }, 2000);
    }
}

console.log('[IA] ✅ Módulo carregado com Hugging Face API!');