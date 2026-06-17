// sync-helper.js - Helper de sincronização OTIMIZADO

(function() {
    'use strict';

    if (window._syncHelperLoaded) {
        console.log('[Sync] ⏳ Módulo já carregado');
        return;
    }
    window._syncHelperLoaded = true;

    let isInitialized = false;
    let isSyncing = false;
    let lastSyncTime = 0;
    let syncInterval = null;
    let retryQueue = [];
    const SYNC_INTERVAL = 60000;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000;

    const config = {
        syncInterval: SYNC_INTERVAL,
        maxRetries: MAX_RETRIES,
        retryDelay: RETRY_DELAY,
        autoSync: true,
        debug: false
    };

    function log(message, type = 'info') {
        if (!config.debug) return;
        const prefix = '[Sync]';
        if (type === 'error') console.error(prefix, message);
        else if (type === 'warn') console.warn(prefix, message);
        else if (type === 'success') console.log(prefix, '✅', message);
        else console.log(prefix, message);
    }

    window.initSync = async function(options = {}) {
        if (isInitialized) {
            log('Já inicializado');
            return true;
        }

        log('Inicializando...');
        Object.assign(config, options);

        if (!window.DatabaseService) {
            log('Aguardando DatabaseService...', 'warn');
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!window.DatabaseService) {
                log('DatabaseService não encontrado!', 'error');
                return false;
            }
        }

        if (!window.CacheManager) {
            log('CacheManager não encontrado!', 'error');
            return false;
        }

        if (!window.CacheManager.isInitialized) {
            window.CacheManager.init();
        }

        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (!usuarioSalvo) {
            log('Nenhum usuário logado');
            return false;
        }

        let usuario;
        try {
            usuario = JSON.parse(usuarioSalvo);
        } catch(e) {
            log('Erro ao parsear usuário: ' + e.message, 'error');
            return false;
        }

        const userId = usuario.id || usuario.uid;
        if (!userId) {
            log('Usuário sem ID válido', 'error');
            return false;
        }

        if (window.CacheManager.currentUserId !== userId) {
            window.CacheManager.currentUserId = userId;
            log('User ID definido: ' + userId);
        }

        try {
            const hasLocalData = localStorage.getItem(`${userId}_tasks`) !== null ||
                                 localStorage.getItem(`${userId}_notes`) !== null;

            if (!hasLocalData || options.force) {
                log('Carregando dados da nuvem...');
                await window.CacheManager.loadFromCloud(true);
                log('Dados carregados!', 'success');
            } else {
                log('Usando dados locais');
            }

            if (window.CacheManager.startRealtimeSync && !window._realtimeStarted) {
                window._realtimeStarted = true;
                setTimeout(() => {
                    window.CacheManager.startRealtimeSync();
                    log('Realtime sync iniciado', 'success');
                }, 1000);
            }

            if (config.autoSync) {
                startPeriodicSync();
            }

            isInitialized = true;
            lastSyncTime = Date.now();
            log('Sistema inicializado!', 'success');
            window.dispatchEvent(new CustomEvent('syncReady'));
            return true;

        } catch (error) {
            log('Erro ao inicializar: ' + error.message, 'error');
            return false;
        }
    };

    function startPeriodicSync() {
        if (syncInterval) clearInterval(syncInterval);
        syncInterval = setInterval(() => {
            if (!isSyncing && isInitialized) performSync();
        }, config.syncInterval);
    }

    function stopPeriodicSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
    }

    async function performSync() {
        if (isSyncing) return;
        isSyncing = true;

        try {
            const userId = window.CacheManager?.getCurrentUserId();
            if (!userId) return;

            const dataTypes = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications'];
            let syncCount = 0;

            for (const type of dataTypes) {
                try {
                    const data = window.CacheManager.get(type, null);
                    if (data !== null) {
                        await window.CacheManager.saveToCloud(type, data, userId);
                        syncCount++;
                    }
                } catch (error) {
                    retryQueue.push({ type, timestamp: Date.now(), attempts: 0 });
                }
            }

            await processRetryQueue();
            lastSyncTime = Date.now();

        } catch (error) {
            log('Erro durante sync: ' + error.message, 'error');
        } finally {
            isSyncing = false;
        }
    }

    async function processRetryQueue() {
        if (retryQueue.length === 0) return;
        const userId = window.CacheManager?.getCurrentUserId();
        if (!userId) return;

        const remaining = [];
        for (const item of retryQueue) {
            item.attempts++;
            try {
                const data = window.CacheManager.get(item.type, null);
                if (data !== null) {
                    await window.CacheManager.saveToCloud(item.type, data, userId);
                    continue;
                }
            } catch (error) {}
            if (item.attempts < config.maxRetries) remaining.push(item);
        }
        retryQueue = remaining;
        if (retryQueue.length > 0) {
            setTimeout(processRetryQueue, config.retryDelay);
        }
    }

    window.forceSync = async function() {
        if (isSyncing) return false;
        await performSync();
        return true;
    };

    window.refreshFromCloud = async function() {
        if (!window.CacheManager) return false;
        try {
            const userId = window.CacheManager.getCurrentUserId();
            if (!userId) return false;
            await window.CacheManager.loadFromCloud(true);
            if (window.refreshAllData) window.refreshAllData();
            return true;
        } catch (error) {
            return false;
        }
    };

    window.refreshAllData = function() {
        window.dispatchEvent(new CustomEvent('forceRefresh'));
        const pathname = window.location.pathname;

        if (pathname.includes('/mobile-telas/') || pathname.includes('/inicio/')) {
            if (typeof renderizarTudo === 'function') renderizarTudo();
            if (typeof renderizarHorario === 'function') renderizarHorario();
            if (typeof atualizarCards === 'function') atualizarCards();
        }
        if (pathname.includes('/tarefas/') && typeof renderTasks === 'function') renderTasks();
        if (pathname.includes('/calendario/')) {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderEvents === 'function') renderEvents();
        }
        if (pathname.includes('/notas/') && typeof renderNotes === 'function') renderNotes();
        if (pathname.includes('/perfil/')) {
            if (typeof loadProfileData === 'function') loadProfileData();
            if (typeof carregarFotoPerfil === 'function') carregarFotoPerfil();
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

    let cloudLoadTimeout = null;
    window.addEventListener('cloudDataLoaded', () => {
        if (cloudLoadTimeout) clearTimeout(cloudLoadTimeout);
        cloudLoadTimeout = setTimeout(() => {
            if (window.refreshAllData) window.refreshAllData();
            cloudLoadTimeout = null;
        }, 300);
    });

    log('Sync Helper carregado!');
})();