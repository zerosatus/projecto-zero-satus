// realtime-sync.js - APENAS NOTIFICAÇÕES EM TEMPO REAL

console.log('[Realtime] 🔄 Inicializando módulo de notificações em tempo real...');

class RealtimeSyncManager {
    constructor() {
        this.subscriptions = [];
        this.userId = null;
        this.callbacks = new Map();
        this.isConnected = false;
        this.isEnabled = true;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        this._notificationChannel = null;
        this._adminChannel = null;
        this._isInitialized = false;
    }

    async init(userId) {
        if (this._isInitialized && this.userId === userId) {
            console.log('[Realtime] ✅ Já inicializado para este usuário');
            return;
        }

        console.log('[Realtime] 🔌 Inicializando para userId:', userId);
        this.userId = userId;
        this.isConnected = true;
        this._isInitialized = true;

        await this._waitForSupabase();
        this._setupNotificationChannel(userId);
        this._setupAdminChannel();
        this._loadExistingNotifications();

        window.dispatchEvent(new CustomEvent('realtimeConnected', {
            detail: { userId: this.userId, enabled: this.isEnabled }
        }));
    }

    async _waitForSupabase() {
        let attempts = 0;
        const maxAttempts = 20;

        while (!window.supabaseClient && attempts < maxAttempts) {
            console.log('[Realtime] ⏳ Aguardando Supabase...');
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (window.supabaseClient) {
            console.log('[Realtime] ✅ Supabase disponível');
        } else {
            console.warn('[Realtime] ⚠️ Supabase não disponível, tentando inicializar...');
            if (window.SupabaseClient?.initSupabase) {
                await window.SupabaseClient.initSupabase();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    _setupNotificationChannel(userId) {
        const client = this._getSupabaseClient();
        if (!client) {
            console.warn('[Realtime] ⚠️ Cliente não disponível');
            return;
        }

        if (this._notificationChannel) {
            this._notificationChannel.unsubscribe();
            this._notificationChannel = null;
        }

        console.log('[Realtime] 📡 Criando canal de notificações para:', userId);

        try {
            this._notificationChannel = client.channel(`notification-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('[Realtime] 📬 Nova notificação recebida:', payload.new);
                        this._handleNewNotification(payload.new);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('[Realtime] 📬 Notificação atualizada:', payload.new);
                        this._handleNotificationUpdate(payload.new);
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[Realtime] ✅ Inscrito no canal de notificações');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.warn('[Realtime] ⚠️ Erro no canal:', err);
                        this._scheduleReconnect();
                    } else {
                        console.log('[Realtime] 📡 Status do canal:', status);
                    }
                });

            console.log('[Realtime] ✅ Canal de notificações configurado');

        } catch (error) {
            console.error('[Realtime] ❌ Erro ao configurar canal:', error);
        }
    }

    _setupAdminChannel() {
        const client = this._getSupabaseClient();
        if (!client) return;

        this._adminChannel = client.channel('admin-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: 'read=eq.true'
                },
                (payload) => {
                    console.log('[Realtime] 👁️ Notificação lida por usuário:', payload.new);
                    this._handleNotificationRead(payload.new);
                }
            )
            .subscribe();

        console.log('[Realtime] ✅ Canal admin configurado');
    }

    async _loadExistingNotifications() {
        try {
            console.log('[Realtime] 📋 Carregando notificações existentes...');
            const client = this._getSupabaseClient();
            if (!client) return;

            const { data, error } = await client
                .from('notifications')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[Realtime] ❌ Erro ao carregar notificações:', error);
                return;
            }

            if (data && data.length > 0) {
                console.log(`[Realtime] 📬 ${data.length} notificações carregadas`);
                
                if (window.CacheManager) {
                    const cached = window.CacheManager.get('notifications', []);
                    const merged = this._mergeNotifications(data, cached);
                    window.CacheManager.set('notifications', merged, true);
                }
                
                window.dispatchEvent(new CustomEvent('notificationsUpdated', { 
                    detail: { notifications: data } 
                }));
            }

        } catch (error) {
            console.error('[Realtime] ❌ Erro:', error);
        }
    }

    _mergeNotifications(newData, cached) {
        const map = new Map();
        for (const item of cached) {
            map.set(item.id, item);
        }
        for (const item of newData) {
            map.set(item.id, {
                id: item.id,
                title: item.title || 'Notificação',
                message: item.message || '',
                type: item.type || 'info',
                read: item.read || false,
                time: item.created_at
            });
        }
        return Array.from(map.values());
    }

    _handleNewNotification(notification) {
        console.log('[Realtime] 📬 Nova notificação:', notification.title);

        if (window.CacheManager) {
            const cached = window.CacheManager.get('notifications', []);
            const exists = cached.some(n => n.id === notification.id);
            
            if (!exists) {
                const newNotif = {
                    id: notification.id,
                    title: notification.title || 'Notificação',
                    message: notification.message || '',
                    type: notification.type || 'info',
                    read: notification.read || false,
                    time: notification.created_at
                };
                cached.unshift(newNotif);
                window.CacheManager.set('notifications', cached, true);
            }
        }

        this._updateBadge();

        window.dispatchEvent(new CustomEvent('newNotification', {
            detail: { notification }
        }));

        window.dispatchEvent(new CustomEvent('notificationsUpdated', {
            detail: { notifications: [notification] }
        }));

        if (typeof showToast === 'function' && !notification.read) {
            showToast(`📬 ${notification.title}`, 'info');
        }
    }

    _handleNotificationUpdate(notification) {
        if (window.CacheManager) {
            const cached = window.CacheManager.get('notifications', []);
            const index = cached.findIndex(n => n.id === notification.id);
            
            if (index !== -1) {
                cached[index] = {
                    ...cached[index],
                    read: notification.read || false
                };
                window.CacheManager.set('notifications', cached, true);
            }
        }

        this._updateBadge();
        window.dispatchEvent(new CustomEvent('notificationsUpdated', {
            detail: { notification }
        }));
    }

    _handleNotificationRead(notification) {
        console.log('[Realtime] 👁️ Usuário leu notificação:', notification.id);
    }

    _updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;

        let notifications = [];
        if (window.CacheManager) {
            notifications = window.CacheManager.get('notifications', []);
        }

        const unread = notifications.filter(n => !n.read).length;
        badge.textContent = unread > 9 ? '9+' : unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
    }

    _getSupabaseClient() {
        return window.supabaseClient || window.SupabaseClient?.getClient?.() || null;
    }

    _scheduleReconnect() {
        console.log(`[Realtime] 🔄 Tentando reconectar em ${this.reconnectDelay}ms...`);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                this.init(this.userId);
            }, this.reconnectDelay);
        } else {
            console.warn('[Realtime] ⚠️ Máximo de tentativas de reconexão atingido');
            this.isConnected = false;
        }
    }

    addListener(eventName, callback) {
        if (!this.callbacks.has(eventName)) {
            this.callbacks.set(eventName, []);
        }
        this.callbacks.get(eventName).push(callback);
        
        window.addEventListener(eventName, (e) => {
            callback(e.detail);
        });
        
        return () => {
            const callbacks = this.callbacks.get(eventName);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            }
        };
    }

    disconnect() {
        console.log('[Realtime] 🔌 Desconectando...');
        
        if (this._notificationChannel) {
            this._notificationChannel.unsubscribe();
            this._notificationChannel = null;
        }
        
        if (this._adminChannel) {
            this._adminChannel.unsubscribe();
            this._adminChannel = null;
        }
        
        this.subscriptions = [];
        this.isConnected = false;
        this.userId = null;
        this._isInitialized = false;
        
        window.dispatchEvent(new CustomEvent('realtimeDisconnected'));
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            enabled: this.isEnabled,
            userId: this.userId,
            isInitialized: this._isInitialized,
            channelSubscribed: this._notificationChannel?.subscription?.state === 'SUBSCRIBED',
            reconnectAttempts: this.reconnectAttempts
        };
    }

    async forceReload() {
        console.log('[Realtime] 🔄 Forçando recarga das notificações...');
        await this._loadExistingNotifications();
        this._updateBadge();
        return true;
    }
}

// ============================================
// INSTÂNCIA GLOBAL
// ============================================
if (typeof window.RealtimeSyncManager === 'undefined') {
    window.RealtimeSyncManager = new RealtimeSyncManager();
}

// ============================================
// FUNÇÕES GLOBAIS
// ============================================
window.startRealtime = async (userId) => {
    console.log('[Realtime] 🚀 Iniciando...');
    if (window.RealtimeSyncManager) {
        await window.RealtimeSyncManager.init(userId);
    }
};

window.stopRealtime = () => {
    if (window.RealtimeSyncManager) {
        window.RealtimeSyncManager.disconnect();
    }
};

window.reloadNotifications = () => {
    if (window.RealtimeSyncManager) {
        return window.RealtimeSyncManager.forceReload();
    }
    return false;
};

window.getRealtimeStatus = () => {
    return window.RealtimeSyncManager?.getStatus() || { isConnected: false };
};

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (usuario) {
        try {
            const user = JSON.parse(usuario);
            const userId = user.id || user.uid;
            if (userId) {
                setTimeout(() => {
                    window.startRealtime(userId);
                }, 1500);
            }
        } catch(e) {
            console.warn('[Realtime] ⚠️ Erro ao parsear usuário:', e);
        }
    }
});

// ============================================
// ESCUTAR EVENTOS DE LOGIN/LOGOUT
// ============================================
window.addEventListener('userLoggedIn', (e) => {
    if (e.detail?.userId) {
        window.startRealtime(e.detail.userId);
    }
});

window.addEventListener('userLoggedOut', () => {
    window.stopRealtime();
});

console.log('[Realtime] ✅ Módulo de notificações em tempo real carregado!');