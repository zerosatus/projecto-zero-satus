// mobile-telas/cache-manager.js
// Sistema centralizado de gerenciamento de cache e sincronização

class CacheManager {
    constructor() {
        this.listeners = new Map();
        this.cacheVersion = 'v1';
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        this.checkAndClearOldCache();
        
        window.addEventListener('storage', (e) => {
            if (e.key && this.listeners.has(e.key)) {
                const callbacks = this.listeners.get(e.key);
                const newData = JSON.parse(e.newValue);
                callbacks.forEach(cb => cb(newData));
            }
        });
        
        this.isInitialized = true;
        console.log('[CacheManager] Inicializado');
    }

    checkAndClearOldCache() {
        const currentVersion = localStorage.getItem('cache_version');
        if (currentVersion !== this.cacheVersion) {
            this.clearAllCache();
            localStorage.setItem('cache_version', this.cacheVersion);
        }
    }

    clearAllCache() {
        const keysToKeep = ['usuarioLogado', 'cache_version'];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        }
    }

    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`[CacheManager] Erro ao obter ${key}:`, error);
            return defaultValue;
        }
    }

    set(key, value, notify = true) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            if (notify && this.listeners.has(key)) {
                const callbacks = this.listeners.get(key);
                callbacks.forEach(cb => cb(value));
            }
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao salvar ${key}:`, error);
            return false;
        }
    }

    remove(key) {
        localStorage.removeItem(key);
        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            callbacks.forEach(cb => cb(null));
        }
    }

    addListener(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            }
        };
    }

    sync(key) {
        const data = this.get(key);
        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            callbacks.forEach(cb => cb(data));
        }
        return data;
    }

    syncAll() {
        const keys = ['usuarioLogado', 'notifications', 'tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notificacoesSettings', 'appearanceSettings'];
        keys.forEach(key => this.sync(key));
    }
}

window.CacheManager = new CacheManager();

window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.onCacheChange = (key, callback) => window.CacheManager.addListener(key, callback);
