// ============================================
// modules/ia.js - MÓDULO DA IA COM GÍRIA (CORRIGIDO)
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
                    <h3>Kmk, boss! Na boa?</h3>
                    <p>Pergunta sobre estudos, tarefas ou dicas!</p>
                    <p style="font-size:0.7rem;color:var(--text-secondary);">Fala qualquer cena! </p>
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

    // ⭐ ENVIAR MENSAGEM COM GÍRIA (CORRIGIDO)
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
                <span style="font-size:0.7rem;color:var(--text-secondary);margin-left:8px;">To a pensar broo bolas baxas...</span>
            </div>
        `;
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;

        try {
            const context = this.buildUserContext();
            let response;

            // ⭐ VERIFICAR SE O SERVIÇO ESTÁ DISPONÍVEL
            console.log('[IA] 🔍 Verificando serviços...');
            console.log('[IA] window.GeminiService:', window.GeminiService ? '✅' : '❌');
            console.log('[IA] window.OpenRouterService:', window.OpenRouterService ? '✅' : '❌');

            // ⭐ TENTAR USAR O GeminiService (que é o alias do OpenRouter)
            const service = window.GeminiService || window.OpenRouterService;

            if (service) {
                console.log('[IA] 📤 Enviando para serviço...');
                const result = await service.sendMessage(text, context);
                console.log('[IA] 📬 Resultado:', result);
                
                if (result.success) {
                    response = result.text;
                } else {
                    response = `❌ ${result.error}`;
                }
            } else {
                console.error('[IA] ❌ Nenhum serviço de IA disponível!');
                response = '⚠️ Serviço de IA não disponível. Tenta recarregar a página broo!';
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
                content: '❌ Sorry la masta! Tive um problema. Tenta denovo, valeu!',
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

Responda com gírias moçambicanas como: broo, nice, maning, go, txuna, tamos juntos!
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

        if (fabBtn) {
            fabBtn.onclick = () => {
                this._previousView = this.app.currentView;
                this.app.showView('ia');
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
                if (prompt) this.sendMessage(prompt);
            };
        });

        console.log('[IA] ✅ Eventos configurados! 🇲🇿');
    }
}

console.log('[IA] ✅ Módulo carregado com gíria moçambicana! 🇲🇿');