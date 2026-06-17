// sync-helper-fix.js - CORREÇÃO DEFINITIVA PARA MOBILE

(function() {
    'use strict';

    console.log('[SyncFix] 🔧 Aplicando correções de sincronização...');

    // 🔥 FLAG GLOBAL PARA CONTROLAR INICIALIZAÇÃO
    if (window._syncFixApplied) {
        console.log('[SyncFix] ⏳ Correções já aplicadas, ignorando...');
        return;
    }
    window._syncFixApplied = true;

    let _initializing = false;
    let _lastInitTime = 0;
    const INIT_DEBOUNCE = 1000;

    // ✅ SOBRESCREVER initSync com versão CORRIGIDA
    window.initSync = async function(options = {}) {
        if (_initializing) {
            console.log('[SyncFix] ⏳ Inicialização já em andamento...');
            return false;
        }

        const now = Date.now();
        if (now - _lastInitTime < INIT_DEBOUNCE) {
            console.log('[SyncFix] ⏳ Debounce de inicialização...');
            await new Promise(r => setTimeout(r, INIT_DEBOUNCE));
            return window.initSync(options);
        }

        _initializing = true;
        _lastInitTime = now;

        console.log('[SyncFix] 🚀 Inicializando sync...');

        try {
            // Aguardar CacheManager
            let attempts = 0;
            while (!window.CacheManager && attempts < 20) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }

            if (!window.CacheManager) {
                console.error('[SyncFix] ❌ CacheManager não encontrado!');
                return false;
            }

            if (!window.CacheManager.isInitialized) {
                window.CacheManager.init();
            }

            const usuarioSalvo = localStorage.getItem('usuarioLogado');
            if (!usuarioSalvo) {
                console.warn('[SyncFix] ⚠️ Nenhum usuário logado');
                return false;
            }

            let usuario;
            try {
                usuario = JSON.parse(usuarioSalvo);
            } catch(e) {
                console.error('[SyncFix] ❌ Erro ao parsear usuário:', e);
                return false;
            }

            const userId = usuario.id || usuario.uid;
            if (!userId) {
                console.error('[SyncFix] ❌ Usuário sem ID');
                return false;
            }

            if (window.CacheManager.currentUserId !== userId) {
                window.CacheManager.currentUserId = userId;
                console.log('[SyncFix] ✅ User ID definido:', userId);
            }

            const hasLocalData = localStorage.getItem(`${userId}_tasks`) !== null ||
                                 localStorage.getItem(`${userId}_notes`) !== null;

            if (!hasLocalData || options.force) {
                console.log('[SyncFix] ☁️ Carregando dados da nuvem...');
                await window.CacheManager.loadFromCloud(true);
                console.log('[SyncFix] ✅ Dados carregados');
            } else {
                console.log('[SyncFix] 📦 Usando dados locais');
            }

            if (window.CacheManager.startRealtimeSync && !window._realtimeStarted) {
                window._realtimeStarted = true;
                setTimeout(() => {
                    window.CacheManager.startRealtimeSync();
                    console.log('[SyncFix] 📡 Realtime sync iniciado');
                }, 500);
            }

            setTimeout(() => {
                if (window.refreshAllData) {
                    console.log('[SyncFix] 🔄 Recarregando UI...');
                    window.refreshAllData();
                }
                window.dispatchEvent(new CustomEvent('syncReady'));
            }, 300);

            return true;

        } catch (error) {
            console.error('[SyncFix] ❌ Erro ao inicializar:', error);
            return false;
        } finally {
            _initializing = false;
        }
    };

    window.forceReloadMobile = async function() {
        console.log('[SyncFix] 🔄 Forçando recarga...');

        if (window._reloading) {
            console.log('[SyncFix] ⏳ Recarga já em andamento...');
            return false;
        }

        window._reloading = true;

        try {
            const usuarioSalvo = localStorage.getItem('usuarioLogado');
            if (!usuarioSalvo) return false;

            let usuario = JSON.parse(usuarioSalvo);
            const userId = usuario.id || usuario.uid;
            if (!userId) return false;

            if (window.CacheManager) {
                window.CacheManager.currentUserId = userId;
                const loaded = await window.CacheManager.loadFromCloud(true);
                window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                if (loaded && window.refreshAllData) {
                    setTimeout(() => window.refreshAllData(), 300);
                }
                return loaded;
            }
            return false;
        } finally {
            setTimeout(() => { window._reloading = false; }, 2000);
        }
    };

    window.isSyncReady = function() {
        return window.CacheManager &&
               window.CacheManager.isInitialized &&
               window.CacheManager.currentUserId !== null;
    };

    console.log('[SyncFix] ✅ Correções aplicadas!');
})();