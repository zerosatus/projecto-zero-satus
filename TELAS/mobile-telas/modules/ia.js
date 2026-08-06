// ============================================
// modules/ia.js - TELA DE IA CORRIGIDA COM CARDS
// ============================================

class IAModule {
    constructor(app) {
        this.app = app;
        this.name = 'ia';
        this.messages = [];
        this.isLoading = false;
        
        console.log('[IA] 🤖 Módulo inicializado');
    }
    
    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[IA] 🤖 Renderizando...');
        
        this.notifications = data.notifications || [];
        this.renderChat();
        this.updateBadge();
        this.setupEvents();
    }
    
    // ============================================
    // RENDER CHAT
    // ============================================
    renderChat() {
        const container = document.getElementById('ia-messages-container');
        if (!container) return;

        // Se não houver mensagens, mostra o estado vazio com os cards
        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="ia-empty-state">
                    <div class="ia-empty-icon">
                        <ion-icon name="sparkles-outline"></ion-icon>
                    </div>
                    <h3>Olá! Como posso ajudar?</h3>
                    <p>Pergunte sobre tarefas, organização de estudos ou dicas.</p>
                </div>
            `;
            // Re-exibe os cards de ação
            const actions = document.getElementById('ia-quick-actions');
            if (actions) actions.style.display = 'grid';
            return;
        }

        // Esconde os cards de ação quando começa a conversa
        const actions = document.getElementById('ia-quick-actions');
        if (actions) actions.style.display = 'none';

        let html = '';
        this.messages.forEach(msg => {
            html += `
                <div class="ia-message ${msg.role === 'user' ? 'ia-message-user' : 'ia-message-ai'}">
                    <div class="ia-message-content">${this.app.escapeHtml(msg.content)}</div>
                    <div class="ia-message-time">${new Date().toLocaleTimeString()}</div>
                </div>
            `;
        });
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
    
    // ============================================
    // ENVIAR MENSAGEM (COM ARGUMENTO PARA OS CARDS)
    // ============================================
    async sendMessage(text) {
        // Se o texto não foi passado como argumento, pega do input
        if (!text) {
            const input = document.getElementById('ia-input');
            if (!input) return;
            text = input.value.trim();
            if (!text) return;
            input.value = ''; // Limpa o input apenas se veio dele
        }
        
        // Adiciona mensagem do usuário
        this.messages.push({ role: 'user', content: text });
        this.renderChat();
        
        // Simula carregamento
        this.isLoading = true;
        document.getElementById('ia-messages-container').innerHTML += `
            <div class="ia-message ia-message-ai ia-loading">
                <div class="ia-message-content">Digitando...</div>
            </div>
        `;
        document.getElementById('ia-messages-container').scrollTop = document.getElementById('ia-messages-container').scrollHeight;
        
        // Simula resposta da IA (substitua pela sua API real)
        setTimeout(() => {
            this.isLoading = false;
            // Remove o loading
            const loadingEl = document.querySelector('.ia-loading');
            if (loadingEl) loadingEl.remove();
            
            // Adiciona resposta da IA
            this.messages.push({ 
                role: 'assistant', 
                content: 'Essa é uma resposta simulada da IA. Conecte sua API real aqui no futuro! 🚀' 
            });
            this.renderChat();
        }, 1500);
    }
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        const input = document.getElementById('ia-input');
        const sendBtn = document.getElementById('ia-send-btn');
        const actionCards = document.querySelectorAll('.ia-action-card');
        
        // Botão enviar
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }
        
        // Input (Enter para enviar)
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // ⭐ CLIQUE NOS CARDS DE AÇÃO
        if (actionCards.length > 0) {
            actionCards.forEach(card => {
                card.addEventListener('click', () => {
                    const prompt = card.dataset.prompt;
                    if (prompt) {
                        this.sendMessage(prompt);
                    }
                });
            });
        }

        // Botão flutuante para abrir a tela
        const fabBtn = document.getElementById('btn-open-ia');
        if (fabBtn) {
            // Remove listeners antigos para evitar duplicação
            fabBtn.replaceWith(fabBtn.cloneNode(true));
            const newFab = document.getElementById('btn-open-ia');
            
                    newFab.addEventListener('click', () => {
             console.log('[IA] 🔥 Botão clicado, abrindo tela...');
             this._previousView = this.app.currentView;  // ⭐ guarda de onde veio
             if (this.app && typeof this.app.showView === 'function') {
                 this.app.showView('ia');
                } else {
                    console.warn('[IA] ⚠️ App não está pronto ou showView não existe.');
                }
            });
        } else {
            console.warn('[IA] ⚠️ Botão #btn-open-ia não encontrado no DOM.');
                 // ⭐ BOTÃO DE VOLTAR
     const backBtn = document.getElementById('btn-back-ia');
     if (backBtn) {
         backBtn.replaceWith(backBtn.cloneNode(true)); // evita listener duplicado
         document.getElementById('btn-back-ia').addEventListener('click', () => {
             console.log('[IA] 🔙 Voltando...');
             this.app.showView(this._previousView || 'dashboard');
         });
     }
        }
    }
}

console.log('[IA] ✅ Módulo carregado!');