// sync-helper-fix.js - CORREÇÃO DE INICIALIZAÇÃO PARA MOBILE (COM PREVENÇÃO DE LOOP)

(function() {
    'use strict';

    console.log('[SyncFix] 🔧 Aplicando correções de sincronização...');

    let _initializing = false;
    let _lastInitTime = 0;

    // ✅ Sobrescrever initSync com versão corrigida para mobile
    window.initSync = async function(options = {}) {
        // ✅ PREVENIR INICIALIZAÇÃO MÚLTIPLA
        if (_initializing) {
            console.log('[SyncFix] ⏳ Inicialização já em andamento...');
            return false;
        }

        const now = Date.now();
        if (now - _lastInitTime < 5000) {
            console.log('[SyncFix] ⏳ Aguardando debounce de inicialização...');
            return false;
        }

        _initializing = true;
        _lastInitTime = now;

        console.log('[SyncFix] Inicializando sync (versão corrigida para mobile)...');

        try {
            // Aguardar CacheManager
            let attempts = 0;
            while (!window.CacheManager && attempts < 30) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }

            if (!window.CacheManager) {
                console.error('[SyncFix] ❌ CacheManager não encontrado!');
                return false;
            }

            // Inicializar CacheManager
            window.CacheManager.init();

            // Obter usuário
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

            // ✅ FORÇAR O USER ID NO CACHE MANAGER
            window.CacheManager.currentUserId = userId;
            console.log('[SyncFix] ✅ User ID definido:', userId);

            // ✅ FORÇAR CARREGAMENTO DA NUVEM
            console.log('[SyncFix] ☁️ Carregando dados da nuvem...');
            const loaded = await window.CacheManager.loadFromCloud(true);
            console.log('[SyncFix] ✅ Dados carregados:', loaded ? 'Sim' : 'Não');

            // ✅ Forçar recarga da UI APENAS UMA VEZ
            if (loaded && window.refreshAllData) {
                setTimeout(() => {
                    console.log('[SyncFix] 🔄 Recarregando UI...');
                    window.refreshAllData();
                }, 500);
            }

            return loaded;
        } catch (error) {
            console.error('[SyncFix] ❌ Erro ao carregar dados:', error);
            return false;
        } finally {
            _initializing = false;
        }
    };

    // ✅ Função para forçar recarga de dados (com prevenção de loop)
    window.forceReloadMobile = async function() {
        console.log('[SyncFix] 🔄 Forçando recarga de dados...');

        // ✅ PREVENIR RECARGA MÚLTIPLA
        if (window._reloading) {
            console.log('[SyncFix] ⏳ Recarga já em andamento...');
            return false;
        }

        window._reloading = true;

        try {
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

            if (window.CacheManager) {
                window.CacheManager.currentUserId = userId;
                const loaded = await window.CacheManager.loadFromCloud(true);
                if (loaded && window.refreshAllData) {
                    setTimeout(() => {
                        window.refreshAllData();
                    }, 300);
                }
                return loaded;
            }

            return false;
        } finally {
            setTimeout(() => {
                window._reloading = false;
            }, 3000);
        }
    };

    console.log('[SyncFix] ✅ Correções aplicadas com sucesso!');
})();