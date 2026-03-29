class CacheManager {
    constructor() {
        this.listeners = new Map();
        this.cacheVersion = 'v2';
        this.isInitialized = false;
        this.firebaseSyncEnabled = false;
        this.syncQueue = new Map();
        this.syncTimeout = null;
    }

    init() {
        if (this.isInitialized) return;
        this.checkAndClearOldCache();
        window.addEventListener('storage', (e) => {
            if (e.key && this.listeners.has(e.key)) {
                try {
                    const newData = JSON.parse(e.newValue);
                    this.listeners.get(e.key).forEach(cb => cb(newData));
                    if (this.firebaseSyncEnabled && window.firebaseAPI?.getCurrentUser()) {
                        this.queueFirebaseSync(e.key, newData);
                    }
                } catch (err) {}
            }
        });
        this.isInitialized = true;
    }
    
    enableFirebaseSync() { this.firebaseSyncEnabled = true; }
    
    queueFirebaseSync(key, data) {
        this.syncQueue.set(key, data);
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => this.processSyncQueue(), 1000);
    }
    
    async processSyncQueue() {
        if (!this.firebaseSyncEnabled || !window.firebaseAPI?.getCurrentUser()) return;
        const dataMap = { 'notifications': 'notifications', 'tasks': 'tasks', 'notes': 'notes', 'calendarEvents': 'calendarEvents', 'weeklySchedule': 'weeklySchedule', 'timeSlots': 'timeSlots', 'notificacoesSettings': 'notificacoesSettings', 'appearanceSettings': 'appearanceSettings', 'usuarioLogado': 'usuarioLogado' };
        for (const [key, data] of this.syncQueue) {
            if (dataMap[key]) await window.firebaseAPI.saveToFirestore(dataMap[key], data);
        }
        this.syncQueue.clear();
    }

    checkAndClearOldCache() {
        if (localStorage.getItem('cache_version') !== this.cacheVersion) {
            const keysToKeep = ['usuarioLogado', 'cache_version'];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!keysToKeep.includes(key)) localStorage.removeItem(key);
            }
            localStorage.setItem('cache_version', this.cacheVersion);
        }
    }

    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) { return defaultValue; }
    }

    set(key, value, notify = true) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            if (notify && this.listeners.has(key)) {
                this.listeners.get(key).forEach(cb => cb(value));
            }
            if (this.firebaseSyncEnabled && window.firebaseAPI?.getCurrentUser()) {
                this.queueFirebaseSync(key, value);
            }
            return true;
        } catch (error) { return false; }
    }

    remove(key) {
        localStorage.removeItem(key);
        if (this.listeners.has(key)) this.listeners.get(key).forEach(cb => cb(null));
    }

    addListener(key, callback) {
        if (!this.listeners.has(key)) this.listeners.set(key, []);
        this.listeners.get(key).push(callback);
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            }
        };
    }
}

window.CacheManager = new CacheManager();
window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.onCacheChange = (key, callback) => window.CacheManager.addListener(key, callback);
