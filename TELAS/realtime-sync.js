// realtime-sync.js - Sincronização em tempo real com Supabase

class RealtimeSyncManager {
    constructor() {
        this.subscriptions = [];
        this.userId = null;
        this.callbacks = new Map();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 3000;
        this.tables = [
            'tasks',
            'notes',
            'calendar_events',
            'weekly_schedule',
            'time_slots',
            'notifications',
            'profiles',
            'disciplinas'
        ];
    }

    async init(userId) {
        if (this.isConnected && this.userId === userId) {
            console.log('[Realtime] Já conectado para:', userId);
            return;
        }

        if (this.isConnected) {
            this.disconnect();
        }

        this.userId = userId;
        this.reconnectAttempts = 0;
        console.log('[Realtime] Iniciando sincronização para:', userId);

        const client = window.SupabaseClient?.initSupabase();
        if (!client) {
            console.error('[Realtime] Supabase não inicializado');
            this.scheduleReconnect();
            return;
        }

        try {
            this.tables.forEach(table => {
                this.setupSubscription(table, this.createHandler(table));
            });

            this.isConnected = true;
            console.log('[Realtime] Subscriptions configuradas com sucesso!');

            // Disparar evento de conexão
            window.dispatchEvent(new CustomEvent('realtimeConnected', {
                detail: { userId: this.userId }
            }));

        } catch (error) {
            console.error('[Realtime] Erro ao configurar subscriptions:', error);
            this.scheduleReconnect();
        }
    }

    setupSubscription(table, handler) {
        const client = window.SupabaseClient?.initSupabase();
        if (!client || !this.userId) {
            console.warn('[Realtime] Não foi possível configurar subscription para:', table);
            return;
        }

        try {
            const subscription = client.channel(`public:${table}`)
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: table,
                        filter: `user_id=eq.${this.userId}`
                    },
                    handler
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`[Realtime] Inscrito em: ${table}`);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error(`[Realtime] Erro no canal ${table}:`, err);
                        this.scheduleReconnect();
                    } else if (status === 'TIMED_OUT') {
                        console.warn(`[Realtime] Timeout no canal ${table}`);
                        this.scheduleReconnect();
                    }
                });

            this.subscriptions.push(subscription);

        } catch (error) {
            console.error(`[Realtime] Erro ao criar subscription para ${table}:`, error);
        }
    }

    createHandler(table) {
        return (payload) => {
            console.log(`[Realtime] ${table} alterada:`, payload.eventType);
            this.loadAndNotify(table);
        };
    }

    async loadAndNotify(dataType) {
        if (!this.userId || !window.DatabaseService) {
            console.warn('[Realtime] Não é possível carregar dados:', !this.userId ? 'sem userId' : 'sem DatabaseService');
            return;
        }

        try {
            let data = null;
            let cacheKey = dataType;

            switch(dataType) {
                case 'tasks':
                    data = await window.DatabaseService.getTasks(this.userId);
                    if (window.CacheManager) window.CacheManager.set('tasks', data, false);
                    break;

                case 'notes':
                    data = await window.DatabaseService.getNotes(this.userId);
                    if (window.CacheManager) window.CacheManager.set('notes', data, false);
                    break;

                case 'calendar_events':
                    data = await window.DatabaseService.getCalendarEvents(this.userId);
                    if (window.CacheManager) window.CacheManager.set('calendarEvents', data, false);
                    break;

                case 'weekly_schedule':
                    data = await window.DatabaseService.getWeeklySchedule(this.userId);
                    if (window.CacheManager) window.CacheManager.set('weeklySchedule', data, false);
                    break;

                case 'time_slots':
                    data = await window.DatabaseService.getTimeSlots(this.userId);
                    if (window.CacheManager) window.CacheManager.set('timeSlots', data, false);
                    break;

                case 'notifications':
                    data = await window.DatabaseService.getNotifications(this.userId);
                    if (window.CacheManager) window.CacheManager.set('notifications', data, false);
                    break;

                case 'profiles':
                    data = await window.DatabaseService.getUserProfile(this.userId);
                    break;

                case 'disciplinas':
                    data = await window.DatabaseService.getDisciplinas(this.userId);
                    if (window.CacheManager) window.CacheManager.set('disciplinas', data, false);
                    // Atualizar o DisciplinaManager se existir
                    if (window.DisciplinaManager) {
                        window.DisciplinaManager.disciplinas = data || [];
                        window.DisciplinaManager.salvar(true);
                        // Disparar eventos de UI
                        if (typeof atualizarListaDisciplinas === 'function') {
                            atualizarListaDisciplinas();
                        }
                        if (typeof renderizarListaDisciplinas === 'function') {
                            renderizarListaDisciplinas();
                        }
                    }
                    break;

                default:
                    console.log('[Realtime] Tipo de dados não reconhecido:', dataType);
                    return;
            }

            // Disparar evento genérico
            window.dispatchEvent(new CustomEvent('cloudDataLoaded', {
                detail: { type: dataType, data }
            }));

            // Disparar evento específico
            window.dispatchEvent(new CustomEvent(`${dataType}Updated`, {
                detail: data
            }));

            console.log(`[Realtime] Dados ${dataType} atualizados da nuvem`);

        } catch (error) {
            console.error(`[Realtime] Erro ao carregar ${dataType}:`, error);
        }
    }

    addListener(eventName, callback) {
        if (!this.callbacks.has(eventName)) {
            this.callbacks.set(eventName, []);
        }
        this.callbacks.get(eventName).push(callback);

        window.addEventListener(eventName, (e) => callback(e.detail));

        // Retornar função para remover
        return () => {
            const callbacks = this.callbacks.get(eventName);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            }
        };
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[Realtime] Máximo de tentativas de reconexão atingido');
            this.isConnected = false;
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        console.log(`[Realtime] Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`);

        setTimeout(() => {
            if (this.userId) {
                this.init(this.userId);
            }
        }, delay);
    }

    disconnect() {
        console.log('[Realtime] Desconectando subscriptions...');
        this.subscriptions.forEach(sub => {
            try {
                sub.unsubscribe();
                console.log('[Realtime] Subscription removida');
            } catch(e) {
                console.warn('[Realtime] Erro ao remover subscription:', e);
            }
        });
        this.subscriptions = [];
        this.isConnected = false;
        this.userId = null;

        window.dispatchEvent(new CustomEvent('realtimeDisconnected'));
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            userId: this.userId,
            subscriptions: this.subscriptions.length,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // Forçar recarga de um tipo específico
    async forceReload(dataType) {
        if (!this.userId || !window.DatabaseService) return false;

        try {
            await this.loadAndNotify(dataType);
            return true;
        } catch (error) {
            console.error('[Realtime] Erro ao forçar recarga:', error);
            return false;
        }
    }

    // Recarregar todos os dados
    async reloadAll() {
        if (!this.userId || !window.DatabaseService) return false;

        console.log('[Realtime] Recarregando todos os dados...');

        try {
            for (const table of this.tables) {
                await this.loadAndNotify(table);
            }
            return true;
        } catch (error) {
            console.error('[Realtime] Erro ao recarregar dados:', error);
            return false;
        }
    }
}

// Instância global
if (typeof window.RealtimeSyncManager === 'undefined') {
    window.RealtimeSyncManager = new RealtimeSyncManager();
}

// Funções auxiliares globais
window.startRealtime = (userId) => {
    if (window.RealtimeSyncManager) {
        window.RealtimeSyncManager.init(userId);
    }
};

window.stopRealtime = () => {
    if (window.RealtimeSyncManager) {
        window.RealtimeSyncManager.disconnect();
    }
};

window.reloadRealtimeData = (dataType) => {
    if (window.RealtimeSyncManager) {
        return window.RealtimeSyncManager.forceReload(dataType);
    }
    return false;
};

window.reloadAllRealtime = () => {
    if (window.RealtimeSyncManager) {
        return window.RealtimeSyncManager.reloadAll();
    }
    return false;
};

console.log('[Realtime] Módulo carregado com sucesso!');
console.log('[Realtime] Versão: 2.0.0');