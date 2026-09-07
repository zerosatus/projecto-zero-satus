// sync-helper.js - Helper de sincronização OTIMIZADO E COMPLETO (CORRIGIDO)

(function() {
    'use strict';

    let isInitialized = false;
    let isSyncing = false;
    let lastSyncTime = 0;
    let syncInterval = null;
    let retryQueue = [];
    let _syncAttempts = 0;
    const MAX_SYNC_ATTEMPTS = 5;
    const SYNC_INTERVAL = 30000;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000;
    let _isFirstSync = true;

    const config = {
        syncInterval: SYNC_INTERVAL,
        maxRetries: MAX_RETRIES,
        retryDelay: RETRY_DELAY,
        autoSync: true,
        debug: true
    };

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

    window.initSync = async function(options = {}) {
        if (isInitialized) {
            log('Já inicializado');
            return true;
        }

        log('Inicializando sistema de sincronização...');

        Object.assign(config, options);

        let attempts = 0;
        while (!window.DatabaseService && attempts < 20) {
            log('Aguardando DatabaseService...', 'warn');
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
            
            if (attempts % 3 === 0 && window.SupabaseClient?.initSupabase) {
                log('Tentando inicializar Supabase...', 'warn');
                await window.SupabaseClient.initSupabase();
            }
        }

        if (!window.DatabaseService) {
            log('DatabaseService não encontrado! Continuando em modo offline', 'warn');
        }

        if (!window.CacheManager) {
            log('CacheManager não encontrado!', 'error');
            return false;
        }

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

        const userId = usuario.id || usuario.uid;
        if (!userId) {
            log('Usuário sem ID válido', 'error');
            return false;
        }

        window.CacheManager.currentUserId = userId;
        log('Usuário identificado: ' + userId.substring(0, 8) + '...');

        try {
            // ⭐ PRIMEIRO: CARREGAR DA NUVEM (sobrescreve local)
            if (window.DatabaseService) {
                log('☁️ Carregando dados da nuvem (primeira vez)...');
                const loaded = await window.CacheManager.loadFromCloud(true);

                if (loaded) {
                    log('Dados carregados da nuvem com sucesso!', 'success');
                    window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                } else {
                    log('Nenhum dado encontrado na nuvem, criando estrutura inicial', 'warn');
                    try {
                        await window.DatabaseService.ensureUserData(userId, usuario.email, usuario.nome);
                        log('Estrutura inicial criada', 'success');
                    } catch(e) {
                        log('Erro ao criar estrutura: ' + e.message, 'warn');
                    }
                }
            } else {
                log('⚠️ DatabaseService indisponível - pulando carga da nuvem', 'warn');
            }

            // ⭐ SALVAR DADOS LOCAIS NA NUVEM (se houver dados locais)
            if (window.DatabaseService) {
                log('💾 Salvando dados locais na nuvem...');
                await performSync();
            }

            // ⭐ INICIAR SYNC PERIÓDICO
            if (config.autoSync) {
                startPeriodicSync();
            }

            isInitialized = true;
            lastSyncTime = Date.now();
            _isFirstSync = false;

            log('Sistema de sincronização inicializado com sucesso!', 'success');
            
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('syncReady'));
                window.dispatchEvent(new CustomEvent('forceRefresh'));
            }, 100);

            return true;

        } catch (error) {
            log('Erro ao inicializar sync: ' + error.message, 'error');
            return false;
        }
    };

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

    async function performSync() {
        if (isSyncing) {
            log('Sync já em andamento');
            return;
        }

        if (!window.DatabaseService) {
            log('⚠️ DatabaseService não disponível, sync adiado', 'warn');
            if (window.SupabaseClient?.initSupabase) {
                await window.SupabaseClient.initSupabase();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            if (!window.DatabaseService) {
                return;
            }
        }

        isSyncing = true;
        _syncAttempts = 0;
        log('🔄 Iniciando sincronização...');

        try {
            const userId = window.CacheManager?.getCurrentUserId();
            if (!userId) {
                log('Usuário não encontrado para sync', 'warn');
                return;
            }

            // ⭐ PASSO 1: CARREGAR DA NUVEM (sobrescreve local)
            log('☁️ Passo 1: Carregando dados da nuvem...');
            const loadedFromCloud = await window.CacheManager.loadFromCloud(true);
            if (loadedFromCloud) {
                log('✅ Dados carregados da nuvem', 'success');
            } else {
                log('ℹ️ Nenhum dado novo na nuvem', 'warn');
            }

            // ⭐ PASSO 2: SALVAR DADOS LOCAIS NA NUVEM
            log('💾 Passo 2: Salvando dados locais na nuvem...');
            const dataTypes = [
                'tasks', 'notes', 'calendarEvents',
                'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas', 'documentos'
            ];

            let syncCount = 0;
            let errorCount = 0;

            for (const type of dataTypes) {
                try {
                    const data = window.CacheManager.get(type, null);
                    if (data !== null && data !== undefined) {
                        const saved = await window.CacheManager.saveToCloud(type, data, userId);
                        if (saved) {
                            syncCount++;
                            log(`✅ ${type} sincronizado (${Array.isArray(data) ? data.length : Object.keys(data).length} itens)`);
                        } else {
                            errorCount++;
                            log(`⚠️ Falha ao sincronizar ${type}`, 'warn');
                            retryQueue.push({ type, timestamp: Date.now(), attempts: 0 });
                        }
                    }
                } catch (error) {
                    errorCount++;
                    log(`❌ Erro ao sincronizar ${type}: ${error.message}`, 'error');
                    retryQueue.push({ type, timestamp: Date.now(), attempts: 0 });
                }
            }

            if (retryQueue.length > 0) {
                await processRetryQueue();
            }

            // ⭐ PASSO 3: RECARREGAR DA NUVEM (consistência final)
            log('🔄 Passo 3: Recarregando da nuvem para consistência...');
            await window.CacheManager.loadFromCloud(true);

            lastSyncTime = Date.now();
            log(`Sincronização concluída: ${syncCount} tipos salvos, ${errorCount} erros`,
                errorCount > 0 ? 'warn' : 'success');

            window.dispatchEvent(new CustomEvent('syncCompleted', {
                detail: {
                    success: errorCount === 0,
                    synced: syncCount,
                    errors: errorCount,
                    timestamp: lastSyncTime
                }
            }));

            // ⭐ ATUALIZAR UI
            window.refreshAllData();

        } catch (error) {
            log('Erro durante sync: ' + error.message, 'error');
        } finally {
            isSyncing = false;
        }
    }

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
                if (data !== null && data !== undefined) {
                    const saved = await window.CacheManager.saveToCloud(item.type, data, userId);
                    if (saved) {
                        log('✅ Retry bem-sucedido para ' + item.type);
                        continue;
                    }
                }
            } catch (error) {
                log('❌ Retry falhou para ' + item.type + ': ' + error.message, 'error');
            }

            if (item.attempts < config.maxRetries) {
                remaining.push(item);
            } else {
                log('❌ Máximo de tentativas atingido para ' + item.type, 'error');
            }
        }

        retryQueue = remaining;

        if (retryQueue.length > 0) {
            setTimeout(() => {
                processRetryQueue();
            }, config.retryDelay);
        }
    }

    window.forceSync = async function() {
        if (isSyncing) {
            log('Sync já em andamento, aguarde...', 'warn');
            return false;
        }

        await performSync();
        return true;
    };

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

            if (!window.DatabaseService) {
                log('DatabaseService não disponível', 'error');
                return false;
            }

            // ⭐ FORÇAR CARGA DA NUVEM (sobrescreve local)
            await window.CacheManager.loadFromCloud(true);
            log('Dados recarregados da nuvem', 'success');

            window.refreshAllData();
            return true;

        } catch (error) {
            log('Erro ao recarregar dados: ' + error.message, 'error');
            return false;
        }
    };

    window.refreshAllData = function() {
        log('🔄 Recarregando dados da UI...');

        window.dispatchEvent(new CustomEvent('forceRefresh'));

        const isMobile = document.querySelector('.bottom-nav') !== null;

        if (isMobile && window.app) {
            if (window.app.modules && window.app.modules.dashboard) {
                window.app.modules.dashboard.render(window.app.data);
            }
            if (window.app.modules && window.app.modules.calendario) {
                window.app.modules.calendario.render(window.app.data);
            }
            if (window.app.modules && window.app.modules.tarefas) {
                window.app.modules.tarefas.render(window.app.data);
            }
            if (window.app.modules && window.app.modules.notas) {
                window.app.modules.notas.render(window.app.data);
            }
            if (window.app.modules && window.app.modules.perfil) {
                window.app.modules.perfil.render(window.app.data);
            }
            if (window.app.modules && window.app.modules.ia) {
                window.app.modules.ia.render(window.app.data);
            }
            if (window.app.modules && window.app.modules.documentos) {
                window.app.modules.documentos.render(window.app.data);
            }
        } else {
            if (typeof carregarDadosDoCache === 'function') {
                carregarDadosDoCache();
            }
            if (typeof atualizarFraseDoDiaDesktop === 'function') atualizarFraseDoDiaDesktop();
            if (typeof atualizarEstatisticasMini === 'function') atualizarEstatisticasMini();
            if (typeof atualizarHorarioDesktop === 'function') atualizarHorarioDesktop();
            if (typeof atualizarListaDisciplinas === 'function') atualizarListaDisciplinas();
            if (typeof renderizarTarefas === 'function') renderizarTarefas();
            if (typeof renderizarAnotacoes === 'function') renderizarAnotacoes();
            if (typeof renderizarEventos === 'function') renderizarEventos();
            if (typeof atualizarBadgeManual === 'function') atualizarBadgeManual();
            if (typeof carregarNotificacoesRecentes === 'function') carregarNotificacoesRecentes();
        }

        log('UI recarregada', 'success');
    };

    // Event listeners
    window.addEventListener('cloudDataLoaded', (event) => {
        setTimeout(() => {
            log('Cloud data loaded, atualizando UI');
            window.refreshAllData();
        }, 300);
    });

    window.addEventListener('storage', (event) => {
        if (event.key && (event.key.includes('_tasks') ||
            event.key.includes('_notes') ||
            event.key.includes('_disciplinas') ||
            event.key.includes('_calendarEvents') ||
            event.key.includes('_weeklySchedule'))) {
            log('Dados locais alterados: ' + event.key);
            if (config.autoSync && !isSyncing) {
                setTimeout(performSync, 1000);
            }
        }
    });

    window.addEventListener('dataUpdated', (event) => {
        if (event.detail && event.detail.key) {
            log(`Dados ${event.detail.key} atualizados via evento`);
            if (config.autoSync && !isSyncing) {
                setTimeout(performSync, 500);
            }
        }
    });

    // ⭐ INTEGRAÇÃO COM REALTIME
    window.addEventListener('newNotification', (event) => {
        const notification = event.detail?.notification;
        if (notification) {
            console.log('[Sync] 📬 Nova notificação via Realtime:', notification.title);
            setTimeout(() => {
                window.refreshAllData();
            }, 300);
        }
    });

    window.addEventListener('notificationsUpdated', () => {
        setTimeout(() => {
            window.refreshAllData();
        }, 100);
    });

    window.safeLogout = async function() {
        log('Realizando logout seguro...');

        try {
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

            isInitialized = false;
            log('Logout realizado com sucesso', 'success');

            window.location.href = '../login/index.html';

        } catch (error) {
            log('Erro no logout: ' + error.message, 'error');
            localStorage.removeItem('usuarioLogado');
            window.location.href = '../login/index.html';
        }
    };

    window.getSyncStatus = function() {
        return {
            initialized: isInitialized,
            syncing: isSyncing,
            lastSync: lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Nunca',
            retryQueue: retryQueue.length,
            dbAvailable: !!window.DatabaseService,
            cacheAvailable: !!window.CacheManager,
            config: {
                autoSync: config.autoSync,
                syncInterval: config.syncInterval,
                maxRetries: config.maxRetries
            }
        };
    };

    // ⭐ INICIALIZAÇÃO AUTOMÁTICA
    document.addEventListener('DOMContentLoaded', () => {
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            setTimeout(() => {
                if (!isInitialized) {
                    window.initSync();
                }
            }, 1000);
        }
    });

    log('Sync Helper v3.0 carregado com sucesso!');
    log('✅ Sincronização automática ativada');

})();

console.log('[Sync] ✅ Integração com Realtime configurada');