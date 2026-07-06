// sync-helper.js - VERSÃO OTIMIZADA PARA PLANO FREE

(function() {
    'use strict';

    let isInitialized = false;
    let isSyncing = false;
    let lastSyncTime = 0;
    let syncInterval = null;
    let retryQueue = [];
    
    // ⚡ INTERVALOS MAIORES
    const SYNC_INTERVAL = 60000; // 1 MINUTO
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 10000;

    const config = {
        syncInterval: SYNC_INTERVAL,
        maxRetries: MAX_RETRIES,
        retryDelay: RETRY_DELAY,
        autoSync: true,
        debug: false // ⚡ DESLIGAR LOGS
    };

    function log(message, type = 'info') {
        if (!config.debug) return;
        const prefix = '[Sync]';
        if (type === 'error') console.error(prefix, message);
        else if (type === 'warn') console.warn(prefix, message);
        else console.log(prefix, message);
    }

    window.initSync = async function(options = {}) {
        if (isInitialized) return true;
        log('Inicializando...');

        Object.assign(config, options);

        if (!window.DatabaseService || !window.CacheManager) {
            console.warn('[Sync] Serviços não disponíveis');
            return false;
        }

        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (!usuarioSalvo) return false;

        let usuario;
        try { usuario = JSON.parse(usuarioSalvo); } catch(e) { return false; }

        const userId = usuario.id || usuario.uid;
        if (!userId) return false;

        window.CacheManager.currentUserId = userId;
        window.CacheManager.init();

        // ⚡ CARREGAR APENAS 1 VEZ
        await window.CacheManager.loadFromCloud(false);

        if (config.autoSync) {
            startPeriodicSync();
        }

        isInitialized = true;
        log('Inicializado!', 'success');
        return true;
    };

    function startPeriodicSync() {
        if (syncInterval) clearInterval(syncInterval);
        syncInterval = setInterval(() => {
            if (!isSyncing && window.navigator.onLine) {
                performSync();
            }
        }, config.syncInterval);
        log('Sync: ' + (config.syncInterval / 1000) + 's');
    }

    async function performSync() {
        if (isSyncing || !window.navigator.onLine) return;
        isSyncing = true;

        try {
            const userId = window.CacheManager?.getCurrentUserId();
            if (!userId) return;

            const dataTypes = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'disciplinas'];
            let syncCount = 0;

            for (const type of dataTypes) {
                try {
                    const data = window.CacheManager.get(type, null);
                    if (data !== null) {
                        await window.CacheManager.saveToCloud(type, data, userId);
                        syncCount++;
                    }
                } catch (error) {
                    log('❌ Erro ' + type, 'error');
                }
            }

            if (syncCount > 0) {
                log('✅ ' + syncCount + ' sincronizados');
            }
        } catch (error) {
            log('Erro: ' + error.message, 'error');
        } finally {
            isSyncing = false;
        }
    }

    window.forceSync = async function() {
        if (isSyncing) return false;
        await performSync();
        return true;
    };

    window.refreshAllData = function() {
        window.dispatchEvent(new CustomEvent('forceRefresh'));
        setTimeout(() => {
            if (typeof atualizarEstatisticasMini === 'function') atualizarEstatisticasMini();
            if (typeof atualizarHorarioDesktop === 'function') atualizarHorarioDesktop();
            if (typeof atualizarListaDisciplinas === 'function') atualizarListaDisciplinas();
        }, 100);
    };

    window.safeLogout = async function() {
        try {
            if (window.CacheManager) {
                await window.CacheManager.logout();
            }
            if (syncInterval) {
                clearInterval(syncInterval);
                syncInterval = null;
            }
            localStorage.removeItem('usuarioLogado');
            isInitialized = false;
            window.location.href = '../login/index.html';
        } catch (error) {
            console.error('Erro no logout:', error);
            window.location.href = '../login/index.html';
        }
    };

    window.getSyncStatus = function() {
        return {
            initialized: isInitialized,
            syncing: isSyncing,
            lastSync: lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Nunca',
            retryQueue: retryQueue.length
        };
    };

    document.addEventListener('DOMContentLoaded', () => {
        if (localStorage.getItem('usuarioLogado')) {
            setTimeout(() => window.initSync(), 500);
        }
    });

    console.log('[Sync] v4.0 - OTIMIZADO PARA PLANO FREE');
})();