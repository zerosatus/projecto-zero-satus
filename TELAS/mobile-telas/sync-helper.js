// sync-helper.js - Helper de sincronização OTIMIZADO E COMPLETO (CORRIGIDO)

(function() {
    'use strict';

    let isInitialized = false;
    let isSyncing = false;
    let lastSyncTime = 0;
    let syncInterval = null;
    let pendingChanges = new Map();
    let retryQueue = [];
    const SYNC_INTERVAL = 30000; // 30 segundos
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000;

    // ============================================
    // CONFIGURAÇÃO
    // ============================================
    const config = {
        syncInterval: SYNC_INTERVAL,
        maxRetries: MAX_RETRIES,
        retryDelay: RETRY_DELAY,
        autoSync: true,
        debug: true
    };

    // ============================================
    // LOG
    // ============================================
    function log(message, type = 'info') {
        if (!config.debug) return;

        const prefix = '[Sync]';
        switch(type) {
            case 'error':
                console.error(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            case 'success':
                console.log(prefix, '✅', message);
                break;
            default:
                console.log(prefix, message);
        }
    }

    // ============================================
    // INICIALIZAÇÃO (CORRIGIDA)
    // ============================================
    window.initSync = async function(options = {}) {
        if (isInitialized) {
            log('Já inicializado');
            return true;
        }

        log('Inicializando sistema de sincronização...');

        // Merge options
        Object.assign(config, options);

        // Verificar dependências
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

        // ✅ FORÇAR inicialização do CacheManager
        window.CacheManager.init();

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

        // ✅ USAR O ID CORRETO (UUID)
        const userId = usuario.id || usuario.uid;
        if (!userId) {
            log('Usuário sem ID válido', 'error');
            return false;
        }

        // ✅ FORÇAR o userId no CacheManager
        window.CacheManager.currentUserId = userId;
        log('Usuário identificado: ' + userId);

        try {
            // ✅ CARREGAR dados da nuvem COM FORCE
            const loaded = await window.CacheManager.loadFromCloud(true);

            if (loaded) {
                log('Dados carregados da nuvem com sucesso!', 'success');
            } else {
                log('Nenhum dado encontrado na nuvem', 'warn');
            }

            // Iniciar realtime sync
            setTimeout(() => {
                if (window.CacheManager && window.CacheManager.startRealtimeSync) {
                    window.CacheManager.startRealtimeSync();
                    log('Realtime sync iniciado', 'success');
                }
            }, 1000);

            // Iniciar sync periódico
            if (config.autoSync) {
                startPeriodicSync();
            }

            isInitialized = true;
            lastSyncTime = Date.now();

            log('Sistema de sincronização inicializado com sucesso!', 'success');
            return loaded;

        } catch (error) {
            log('Erro ao inicializar sync: ' + error.message, 'error');
            return false;
        }
    };

    // ============================================
    // SYNC PERIÓDICO
    // ============================================
    function startPeriodicSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
        }

        syncInterval = setInterval(() => {
            if (!isSyncing) {
                performSync();
            }
        }, config.syncInterval);

        log('Sync periódico iniciado (intervalo: ' + (config.syncInterval / 1000) + 's)');
    }

    function stopPeriodicSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
            log('Sync periódico parado');
        }
    }

    // ============================================
    // PERFORM SYNC
    // ============================================
    async function performSync() {
        if (isSyncing) {
            log('Sync já em andamento');
            return;
        }

        isSyncing = true;
        log('Iniciando sincronização...');

        try {
            const userId = window.CacheManager?.getCurrentUserId();
            if (!userId) {
                log('Usuário não encontrado para sync', 'warn');
                return;
            }

            // Lista de dados para sincronizar
            const dataTypes = [
                'tasks', 'notes', 'calendarEvents',
                'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'
            ];

            let syncCount = 0;
            let errorCount = 0;

            for (const type of dataTypes) {
                try {
                    const data = window.CacheManager.get(type, null);
                    if (data !== null) {
                        await window.CacheManager.saveToCloud(type, data, userId);
                        syncCount++;
                        log('✅ ' + type + ' sincronizado');
                    }
                } catch (error) {
                    errorCount++;
                    log('❌ Erro ao sincronizar ' + type + ': ' + error.message, 'error');
                    // Adicionar à fila de retry
                    retryQueue.push({ type, timestamp: Date.now(), attempts: 0 });
                }
            }

            // Processar fila de retry
            await processRetryQueue();

            lastSyncTime = Date.now();
            log('Sincronização concluída: ' + syncCount + ' tipos sincronizados, ' + errorCount + ' erros',
                errorCount > 0 ? 'warn' : 'success');

            // Disparar evento
            window.dispatchEvent(new CustomEvent('syncCompleted', {
                detail: {
                    success: errorCount === 0,
                    synced: syncCount,
                    errors: errorCount,
                    timestamp: lastSyncTime
                }
            }));

        } catch (error) {
            log('Erro durante sync: ' + error.message, 'error');
        } finally {
            isSyncing = false;
        }
    }

    // ============================================
    // RETRY QUEUE
    // ============================================
    async function processRetryQueue() {
        if (retryQueue.length === 0) return;

        log('Processando fila de retry (' + retryQueue.length + ' itens)');

        const userId = window.CacheManager?.getCurrentUserId();
        if (!userId) {
            log('Usuário não encontrado para retry', 'warn');
            return;
        }

        const remaining = [];

        for (const item of retryQueue) {
            item.attempts++;

            try {
                const data = window.CacheManager.get(item.type, null);
                if (data !== null) {
                    await window.CacheManager.saveToCloud(item.type, data, userId);
                    log('✅ Retry bem-sucedido para ' + item.type);
                    continue;
                }
            } catch (error) {
                log('❌ Retry falhou para ' + item.type + ': ' + error.message, 'error');
            }

            // Se ainda tem tentativas, manter na fila
            if (item.attempts < config.maxRetries) {
                remaining.push(item);
            } else {
                log('❌ Máximo de tentativas atingido para ' + item.type, 'error');
            }
        }

        retryQueue = remaining;

        // Agendar próximo retry se houver itens
        if (retryQueue.length > 0) {
            setTimeout(() => {
                processRetryQueue();
            }, config.retryDelay);
        }
    }

    // ============================================
    // FUNÇÕES PÚBLICAS
    // ============================================

    // Forçar sincronização manual
    window.forceSync = async function() {
        if (isSyncing) {
            log('Sync já em andamento, aguarde...', 'warn');
            return false;
        }

        await performSync();
        return true;
    };

    // Recarregar dados da nuvem
    window.refreshFromCloud = async function() {
        if (!window.CacheManager) {
            log('CacheManager não disponível', 'error');
            return false;
        }

        try {
            const userId = window.CacheManager.getCurrentUserId();
            if (!userId) {
                log('Usuário não logado', 'error');
                return false;
            }

            await window.CacheManager.loadFromCloud(true);
            log('Dados recarregados da nuvem', 'success');

            window.refreshAllData();
            return true;

        } catch (error) {
            log('Erro ao recarregar dados: ' + error.message, 'error');
            return false;
        }
    };

    // Forçar recarga da UI
    window.refreshAllData = function() {
        log('🔄 Recarregando dados da UI...');

        const pathname = window.location.pathname;

        // Disparar evento genérico
        window.dispatchEvent(new CustomEvent('forceRefresh'));

        // Atualizações específicas por página
        if (pathname.includes('/inicio/') || pathname.includes('/mobile-telas/')) {
            if (typeof atualizarFraseDoDiaMobile === 'function') atualizarFraseDoDiaMobile();
            if (typeof atualizarFraseDoDiaDesktop === 'function') atualizarFraseDoDiaDesktop();
            if (typeof atualizarEstatisticasMini === 'function') atualizarEstatisticasMini();
            if (typeof atualizarHorarioDesktop === 'function') atualizarHorarioDesktop();
            if (typeof renderizarHorario === 'function') renderizarHorario();
            if (typeof atualizarListaDisciplinas === 'function') atualizarListaDisciplinas();
        }

        if (pathname.includes('/tarefas/')) {
            if (typeof renderizarTarefas === 'function') renderizarTarefas();
            if (typeof atualizarEstatisticas === 'function') atualizarEstatisticas();
            if (typeof renderizarDisciplinas === 'function') renderizarDisciplinas();
        }

        if (pathname.includes('/calendario/')) {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderEvents === 'function') renderEvents();
        }

        if (pathname.includes('/anotacoes/') || pathname.includes('/notas/')) {
            if (typeof renderNotes === 'function') renderNotes();
            if (typeof carregarAnotacoes === 'function') carregarAnotacoes();
        }

        if (pathname.includes('/perfil/')) {
            if (typeof loadProfileData === 'function') loadProfileData();
            if (typeof carregarFotoPerfil === 'function') carregarFotoPerfil();
        }

        log('UI recarregada', 'success');
    };

    // ============================================
    // EVENT LISTENERS
    // ============================================
    let cloudLoadTimeout = null;

    window.addEventListener('cloudDataLoaded', (event) => {
        if (cloudLoadTimeout) clearTimeout(cloudLoadTimeout);
        cloudLoadTimeout = setTimeout(() => {
            log('Cloud data loaded, atualizando UI');
            window.refreshAllData();
            cloudLoadTimeout = null;
        }, 300);
    });

    // Detectar mudanças nos dados locais
    window.addEventListener('storage', (event) => {
        if (event.key && event.key.includes('_tasks') ||
            event.key.includes('_notes') ||
            event.key.includes('_disciplinas')) {
            log('Dados locais alterados: ' + event.key);
            // Agendar sync
            if (config.autoSync && !isSyncing) {
                setTimeout(performSync, 1000);
            }
        }
    });

    // ============================================
    // LOGOUT SEGURO
    // ============================================
    window.safeLogout = async function() {
        log('Realizando logout seguro...');

        try {
            // Tentar sync final
            if (!isSyncing) {
                await performSync();
            }

            if (window.CacheManager) {
                await window.CacheManager.logout();
            }

            if (window.RealtimeSyncManager) {
                window.RealtimeSyncManager.disconnect();
            }

            stopPeriodicSync();

            localStorage.removeItem('usuarioLogado');

            // Limpar dados do usuário
            const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
            if (usuario && usuario.email) {
                const keys = Object.keys(localStorage);
                const prefix = usuario.email + '_';
                keys.forEach(key => {
                    if (key.startsWith(prefix)) {
                        localStorage.removeItem(key);
                    }
                });
            }

            isInitialized = false;
            log('Logout realizado com sucesso', 'success');

            window.location.href = '../login/index.html';

        } catch (error) {
            log('Erro no logout: ' + error.message, 'error');
            // Forçar logout
            localStorage.removeItem('usuarioLogado');
            window.location.href = '../login/index.html';
        }
    };

    // ============================================
    // STATUS
    // ============================================
    window.getSyncStatus = function() {
        return {
            initialized: isInitialized,
            syncing: isSyncing,
            lastSync: lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Nunca',
            retryQueue: retryQueue.length,
            config: {
                autoSync: config.autoSync,
                syncInterval: config.syncInterval,
                maxRetries: config.maxRetries
            }
        };
    };

    // ============================================
    // INICIALIZAÇÃO AUTOMÁTICA
    // ============================================
    // Tentar inicializar automaticamente se o usuário estiver logado
    document.addEventListener('DOMContentLoaded', () => {
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            setTimeout(() => {
                if (!isInitialized) {
                    window.initSync();
                }
            }, 500);
        }
    });

    log('Sync Helper carregado com sucesso!');
    log('Versão: 2.0.1');

})();