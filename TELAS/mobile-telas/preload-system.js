// preload-system.js - Sistema de pré-carregamento global
(function() {
    class PreloadSystem {
        constructor() {
            this.isLoaded = false;
            this.loadingPromise = null;
            this.cache = new Map();
        }

        async preloadAllData() {
            if (this.isLoaded) return this.cache;
            if (this.loadingPromise) return this.loadingPromise;

            this.loadingPromise = this._loadData();
            return this.loadingPromise;
        }

        async _loadData() {
            console.log('[Preload] 🚀 Iniciando pré-carregamento...');
            const startTime = performance.now();

            // Verificar usuário logado
            const usuarioSalvo = localStorage.getItem('usuarioLogado');
            if (!usuarioSalvo) {
                console.warn('[Preload] Usuário não logado');
                return null;
            }

            const usuario = JSON.parse(usuarioSalvo);
            const userId = usuario.uid || usuario.email;

            // Carregar dados via CacheManager (já otimizado)
            if (!window.CacheManager) {
                console.error('[Preload] CacheManager não disponível');
                return null;
            }

            // Forçar carregamento único da nuvem
            const cloudData = await window.CacheManager.loadFromCloud(true);
            
            // Pré-carregar todos os dados necessários
            const dataTypes = [
                'tasks', 'notes', 'calendarEvents', 
                'weeklySchedule', 'timeSlots', 'notifications',
                'notificacoesSettings', 'appearanceSettings'
            ];

            for (const type of dataTypes) {
                const data = window.CacheManager.get(type, null);
                if (data !== null) {
                    this.cache.set(type, data);
                    // Armazenar em sessionStorage para persistência entre páginas
                    sessionStorage.setItem(`preload_${type}`, JSON.stringify(data));
                }
            }

            this.isLoaded = true;
            const endTime = performance.now();
            console.log(`[Preload] ✅ Carregado em ${(endTime - startTime).toFixed(0)}ms`);
            
            // Disparar evento de pronto
            window.dispatchEvent(new CustomEvent('preloadComplete', { detail: this.cache }));
            
            return this.cache;
        }

        getCachedData(type) {
            // Tentar sessionStorage primeiro (mais rápido)
            const sessionData = sessionStorage.getItem(`preload_${type}`);
            if (sessionData) {
                return JSON.parse(sessionData);
            }
            return this.cache.get(type) || null;
        }

        isReady() {
            return this.isLoaded;
        }
    }

    // Instância global
    window.PreloadSystem = new PreloadSystem();
    
    // Auto-inicializar se usuário estiver logado
    if (localStorage.getItem('usuarioLogado')) {
        window.PreloadSystem.preloadAllData();
    }

    console.log('[Preload] Sistema de pré-carregamento ativado');
})();