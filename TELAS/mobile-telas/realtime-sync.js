// realtime-sync.js - COMPLETAMENTE DESABILITADO PARA PLANO FREE

class RealtimeSyncManager {
    constructor() {
        this.subscriptions = [];
        this.userId = null;
        this.callbacks = new Map();
        this.isConnected = false;
        this.isEnabled = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 0;
        this.reconnectDelay = 0;
        this.tables = [];
    }

    async init(userId) {
        console.log('[Realtime] ⚡ Desabilitado (plano free)');
        this.isConnected = true; // Simular conexão
        this.userId = userId;
        window.dispatchEvent(new CustomEvent('realtimeConnected', {
            detail: { userId: this.userId, enabled: false }
        }));
    }

    setupSubscription(table, handler) {
        // Não faz nada
    }

    createHandler(table) {
        return () => {};
    }

    async loadAndNotify(dataType) {
        // Não faz nada
    }

    addListener(eventName, callback) {
        if (!this.callbacks.has(eventName)) {
            this.callbacks.set(eventName, []);
        }
        this.callbacks.get(eventName).push(callback);
        window.addEventListener(eventName, (e) => callback(e.detail));
        return () => {
            const callbacks = this.callbacks.get(eventName);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            }
        };
    }

    scheduleReconnect() {
        // Não faz nada
    }

    disconnect() {
        this.subscriptions = [];
        this.isConnected = false;
        this.userId = null;
        window.dispatchEvent(new CustomEvent('realtimeDisconnected'));
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            enabled: this.isEnabled,
            userId: this.userId,
            subscriptions: this.subscriptions.length,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    async forceReload(dataType) {
        return false;
    }

    async reloadAll() {
        return false;
    }
}

// Instância global
if (typeof window.RealtimeSyncManager === 'undefined') {
    window.RealtimeSyncManager = new RealtimeSyncManager();
}

window.startRealtime = (userId) => {
    console.log('[Realtime] ⚡ Start desabilitado');
    if (window.RealtimeSyncManager) {
        window.RealtimeSyncManager.init(userId);
    }
};

window.stopRealtime = () => {
    if (window.RealtimeSyncManager) {
        window.RealtimeSyncManager.disconnect();
    }
};

window.reloadRealtimeData = () => false;
window.reloadAllRealtime = () => false;

console.log('[Realtime] v4.0 - DESABILITADO PARA PLANO FREE');