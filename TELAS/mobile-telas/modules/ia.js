// ============================================
// modules/ia.js - MÓDULO DA IA COM GÍRIA
// ============================================

class IAModule {
    constructor(app) {
        this.app = app;
        this.name = 'ia';
        this.messages = [];
        this._previousView = 'dashboard';
        this._isProcessing = false;
        console.log('[IA] 🤖 Inicializado com gíria moçambicana');
    }

    render(data) {
        this.notifications = data.notifications || [];
        this.renderChat();
        this.updateBadge();
        this.setupEvents();
    }

    renderChat() {
        const container = document.getElementById('ia-messages-container');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="ia-empty-state">
                    <div class="ia-empty-icon"><ion-icon name="sparkles-outline"></ion-icon></div>
                    <h3>🇲🇿 Olá, magaia! Tá fixe?</h3>
                    <p>Pergunta sobre estudos, tarefas ou dicas!</p>
                    <p style="font-size:0.7rem;color:var(--text-secondary);">Tamos juntos! 💪</p>
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

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    // ⭐ ENVIAR MENSAGEM COM GÍRIA
    async sendMessage(text) {
        if (!text) {
            const input = document.getElementById('ia-input');
            if (!input) return;
            text = input.value.trim();
            if (!text) return;
            input.value = '';
        }

        if (this._isProcessing) return;

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
                <span style="font-size:0.7rem;color:var(--text-secondary);margin-left:8px;">Tá a pensar, magaia...</span>
            </div>
        `;
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;

        try {
            const context = this.buildUserContext();
            let response;

            if (window.GeminiService) {
                const result = await window.GeminiService.sendMessage(text, context);
                response = result.success ? result.text : `❌ ${result.error}`;
            } else {
                // Fallback com gíria
                const fallbacks = [
                    'Tá fixe, mano! Conecta com a internet e tenta de novo. 🇲🇿',
                    'Arranja-se! Mas preciso de internet para te ajudar. Bora lá!',
                    'Magaia, tamos com problemas técnicos. Tenta mais tarde, tá?'
                ];
                response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            }

            loadingDiv.remove();
            this.messages.push({
                role: 'assistant',
                content: response,
                time: new Date().toLocaleTimeString()
            });
            this.renderChat();

        } catch (error) {
            loadingDiv.remove();
            this.messages.push({
                role: 'assistant',
                content: '❌ Desculpa, magaia! Tive um problema. Tenta novamente, tamos juntos! 🇲🇿',
                time: new Date().toLocaleTimeString()
            });
            this.renderChat();
        } finally {
            this._isProcessing = false;
        }
    }

    // ⭐ CONTEXTO DO USUÁRIO
    buildUserContext() {
        const user = this.app.user || {};
        const data = this.app.data || {};
        const tasks = data.tasks || [];
        const pendentes = tasks.filter(t => !t.completed).length;

        return `
🇲🇿 CONTEXTO DO ESTUDANTE 🇲🇿
Nome: ${user.nome || 'Estudante'}
Tarefas pendentes: ${pendentes}
Disciplinas: ${(data.disciplinas || []).length}

Responda com gírias moçambicanas como: magaia, fixe, bué, bora, arranja, tamos juntos!
`;
    }

    // ⭐ CONFIGURAR EVENTOS
    setupEvents() {
        const input = document.getElementById('ia-input');
        const sendBtn = document.getElementById('ia-send-btn');
        const fabBtn = document.getElementById('btn-open-ia');
        const backBtn = document.getElementById('btn-back-ia');

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

        // ⭐ BOTÃO FLUTUANTE - ABRE A IA
        if (fabBtn) {
            fabBtn.onclick = () => {
                this._previousView = this.app.currentView;
                this.app.showView('ia');
            };
        }

        // ⭐ BOTÃO VOLTAR
        if (backBtn) {
            backBtn.onclick = () => {
                this.app.showView(this._previousView || 'dashboard');
            };
        }

        // ⭐ CARDS DE AÇÃO
        document.querySelectorAll('.ia-action-card').forEach(card => {
            card.onclick = () => {
                const prompt = card.dataset.prompt;
                if (prompt) this.sendMessage(prompt);
            };
        });

        console.log('[IA] ✅ Eventos configurados! 🇲🇿');
    }
}

console.log('[IA] ✅ Módulo carregado com gíria moçambicana! 🇲🇿');