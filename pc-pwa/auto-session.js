// pc-pwa/auto-session.js
// Sessão automática APENAS para PC com PWA instalado

const AutoSession = {
    _isInitialized: false,
    _sessionCheckInterval: null,

    /**
     * Inicializa o sistema de sessão automática
     */
    init() {
        if (this._isInitialized) return;
        
        // 🔥 SÓ EXECUTA SE FOR PC E PWA INSTALADO
        if (!window.PwaDetector || !window.PwaDetector.canUsePwaFeatures()) {
            console.log('[AutoSession] ❌ Funcionalidade desativada - não é PC ou PWA não instalado');
            return;
        }

        console.log('[AutoSession] ✅ Inicializando sessão automática para PC/PWA');
        this._isInitialized = true;

        // Tenta login automático imediatamente
        this.tryAutoLogin();

        // Configura listener para quando o app for instalado
        window.addEventListener('pwaInstalled', () => {
            console.log('[AutoSession] PWA instalado - tentando auto-login');
            this.tryAutoLogin();
        });

        // Verifica sessão periodicamente (a cada 30s)
        this._sessionCheckInterval = setInterval(() => {
            this.checkSession();
        }, 30000);

        // Verifica sessão ao focar a janela
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkSession();
            }
        });
    },

    /**
     * Tenta fazer login automático
     * @returns {Promise<boolean>} true se login bem-sucedido
     */
    async tryAutoLogin() {
        if (!window.PwaDetector.canUsePwaFeatures()) {
            console.log('[AutoSession] ❌ Não é PC/PWA - abortando auto-login');
            return false;
        }

        console.log('[AutoSession] 🔄 Tentando login automático...');

        // 1. Verifica se há usuário salvo
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (!usuarioSalvo) {
            console.log('[AutoSession] ❌ Nenhum usuário salvo');
            return false;
        }

        try {
            const userData = JSON.parse(usuarioSalvo);
            
            // 2. Verifica se o token ainda é válido
            if (window.AuthService) {
                const { data: { user } } = await window.AuthService.getCurrentUser();
                
                if (user && user.id === userData.id) {
                    console.log('[AutoSession] ✅ Login automático bem-sucedido!');
                    
                    // Dispara evento de login automático
                    window.dispatchEvent(new CustomEvent('autoLoginSuccess', { 
                        detail: { user: userData } 
                    }));
                    
                    // Redireciona para o painel
                    const destino = '../inicio/index.html';
                    if (window.location.pathname.includes('/login/')) {
                        window.location.href = destino;
                    }
                    return true;
                }
            }

            // 3. Se o token expirou, tenta refresh
            if (window.AuthService && window.AuthService.refreshSession) {
                const refreshed = await window.AuthService.refreshSession();
                if (refreshed) {
                    console.log('[AutoSession] ✅ Sessão renovada com sucesso');
                    return true;
                }
            }

            console.log('[AutoSession] ❌ Sessão expirada ou inválida');
            return false;

        } catch (error) {
            console.error('[AutoSession] Erro:', error);
            return false;
        }
    },

    /**
     * Verifica se a sessão atual é válida
     */
    async checkSession() {
        if (!window.PwaDetector.canUsePwaFeatures()) return;
        if (window.location.pathname.includes('/login/')) return;

        try {
            const usuario = localStorage.getItem('usuarioLogado');
            if (!usuario) {
                console.log('[AutoSession] ⚠️ Usuário não está logado - redirecionando para login');
                window.location.href = '../login/index.html';
                return;
            }

            if (window.AuthService) {
                const { data: { user } } = await window.AuthService.getCurrentUser();
                if (!user) {
                    console.log('[AutoSession] ⚠️ Sessão inválida - redirecionando para login');
                    localStorage.removeItem('usuarioLogado');
                    window.location.href = '../login/index.html';
                }
            }
        } catch (error) {
            console.error('[AutoSession] Erro ao verificar sessão:', error);
        }
    },

    /**
     * Limpa a sessão (logout)
     */
    async clearSession() {
        if (this._sessionCheckInterval) {
            clearInterval(this._sessionCheckInterval);
            this._sessionCheckInterval = null;
        }

        if (window.AuthService) {
            await window.AuthService.logout();
        }
        
        localStorage.removeItem('usuarioLogado');
        sessionStorage.removeItem('pwa_installed');
        
        console.log('[AutoSession] Sessão limpa');
        window.location.href = '../login/index.html';
    },

    /**
     * Destroi o sistema
     */
    destroy() {
        if (this._sessionCheckInterval) {
            clearInterval(this._sessionCheckInterval);
            this._sessionCheckInterval = null;
        }
        this._isInitialized = false;
        console.log('[AutoSession] Destruído');
    }
};

// 🔥 EXPORTA GLOBALMENTE
window.AutoSession = AutoSession;

// 🔥 INICIALIZA AUTOMATICAMENTE APÓS O DOM CARREGAR
document.addEventListener('DOMContentLoaded', () => {
    // Só inicializa se estiver na página de login
    if (window.location.pathname.includes('/login/') || 
        window.location.pathname.endsWith('index.html')) {
        AutoSession.init();
    }
});

console.log('🖥️ AutoSession carregado - Sessão automática APENAS PC/PWA');