// sync-helper-fix.js - CORREÇÃO DE INICIALIZAÇÃO PARA MOBILE

(function() {
    'use strict';

    console.log('[SyncFix] 🔧 Aplicando correções de sincronização...');

    // ✅ Sobrescrever initSync com versão corrigida para mobile
    const originalInit = window.initSync;

    window.initSync = async function(options = {}) {
        console.log('[SyncFix] Inicializando sync (versão corrigida para mobile)...');

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
        try {
            console.log('[SyncFix] ☁️ Carregando dados da nuvem...');
            const loaded = await window.CacheManager.loadFromCloud(true);
            console.log('[SyncFix] ✅ Dados carregados:', loaded ? 'Sim' : 'Não');

            // ✅ Forçar recarga da UI
            if (loaded && window.refreshAllData) {
                setTimeout(window.refreshAllData, 500);
            }

            return loaded;
        } catch (error) {
            console.error('[SyncFix] ❌ Erro ao carregar dados:', error);
            return false;
        }
    };

    // ✅ Função para forçar recarga de dados
    window.forceReloadMobile = async function() {
        console.log('[SyncFix] 🔄 Forçando recarga de dados...');

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
                setTimeout(window.refreshAllData, 300);
            }
            return loaded;
        }

        return false;
    };

    console.log('[SyncFix] ✅ Correções aplicadas com sucesso!');
})();