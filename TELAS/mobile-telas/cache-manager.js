// Sistema centralizado de gerenciamento de cache com suporte a nuvem
class CacheManager {
    constructor() {
        this.listeners = new Map();
        this.cacheVersion = 'v5';
        this.isInitialized = false;
        this.currentUserId = null;
        this.isSyncing = false;
        this.syncCallbacks = [];
    }

    init() {
        if (this.isInitialized) return;
        this.checkAndClearOldCache();
        
        window.addEventListener('storage', (e) => {
            if (e.key && this.listeners.has(e.key)) {
                const callbacks = this.listeners.get(e.key);
                let newData = null;
                try {
                    newData = e.newValue ? JSON.parse(e.newValue) : null;
                } catch (error) {
                    newData = e.newValue;
                }
                callbacks.forEach(cb => cb(newData));
            }
        });
        
        this.isInitialized = true;
        console.log('[CacheManager] Inicializado');
    }

    getCurrentUserId() {
        if (!this.currentUserId) {
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    const user = JSON.parse(usuario);
                    this.currentUserId = user.uid || user.email || 'default';
                } catch(e) {}
            }
        }
        return this.currentUserId || 'default';
    }

    getStorageKey(key) {
        const userId = this.getCurrentUserId();
        return `${userId}_${key}`;
    }

    checkAndClearOldCache() {
        const currentVersion = localStorage.getItem('cache_version');
        if (currentVersion !== this.cacheVersion) {
            localStorage.setItem('cache_version', this.cacheVersion);
            console.log('[CacheManager] Versão do cache atualizada para', this.cacheVersion);
        }
    }

    clearAllCache() {
        const userId = this.getCurrentUserId();
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${userId}_`)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        this.listeners.forEach((callbacks) => {
            callbacks.forEach(cb => cb(null));
        });
        console.log('[CacheManager] Cache do usuário limpo');
    }

    get(key, defaultValue = null) {
        try {
            const storageKey = this.getStorageKey(key);
            const data = localStorage.getItem(storageKey);
            if (data === null) return defaultValue;
            return JSON.parse(data);
        } catch (error) {
            console.error(`[CacheManager] Erro ao obter ${key}:`, error);
            return defaultValue;
        }
    }

    set(key, value, notify = true) {
        try {
            const storageKey = this.getStorageKey(key);
            const stringValue = JSON.stringify(value);
            localStorage.setItem(storageKey, stringValue);
            if (notify && this.listeners.has(key)) {
                const callbacks = this.listeners.get(key);
                callbacks.forEach(cb => cb(value));
            }
            
            // Sincronizar com a nuvem (Realtime DB)
            if (!this.isSyncing && window.FirebaseSync && this.currentUserId && this.currentUserId !== 'default') {
                this.syncToCloud(key, value);
            }
            
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao salvar ${key}:`, error);
            return false;
        }
    }
    
    async syncToCloud(key, value) {
        try {
            const userId = this.getCurrentUserId();
            if (userId && userId !== 'default') {
                await window.FirebaseSync.saveUserDataToCloud(userId, key, value);
                console.log(`[CacheManager] Dado "${key}" enviado para nuvem`);
            }
        } catch (error) {
            console.error('[CacheManager] Erro ao sincronizar com nuvem:', error);
        }
    }
    
    async loadFromCloud() {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') {
            console.log('[CacheManager] Sem usuário logado, ignorando sync da nuvem');
            return false;
        }
        
        if (this.isSyncing) {
            console.log('[CacheManager] Sincronização já em andamento...');
            return false;
        }
        
        this.isSyncing = true;
        
        try {
            console.log('[CacheManager] 🔍 Carregando dados da nuvem para:', userId);
            const cloudData = await window.FirebaseSync.loadAllUserDataFromCloud(userId);
            console.log('[CacheManager] 📦 Dados da nuvem recebidos:', cloudData ? Object.keys(cloudData) : 'nenhum');
            
            if (cloudData) {
                const keys = ['usuarioLogado', 'notifications', 'weeklySchedule', 'timeSlots', 'calendarEvents', 'tasks', 'notes', 'notificacoesSettings', 'appearanceSettings'];
                let hasChanges = false;
                
                for (const key of keys) {
                    if (cloudData[key] !== undefined && cloudData[key] !== null) {
                        const localData = this.get(key, null);
                        // Se não tem dados locais OU os dados da nuvem existem
                        if (localData === null || JSON.stringify(localData) !== JSON.stringify(cloudData[key])) {
                            const storageKey = this.getStorageKey(key);
                            localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
                            hasChanges = true;
                            console.log(`[CacheManager] ✅ Dado "${key}" carregado da nuvem`);
                            
                            // Notificar listeners
                            if (this.listeners.has(key)) {
                                const callbacks = this.listeners.get(key);
                                callbacks.forEach(cb => cb(cloudData[key]));
                            }
                        }
                    }
                }
                
                // Forçar recarregamento da UI
                if (hasChanges) {
                    console.log('[CacheManager] 🎉 Dados carregados da nuvem com sucesso!');
                    // Disparar evento global
                    window.dispatchEvent(new CustomEvent('cloudDataLoaded', { detail: cloudData }));
                }
                return true;
            } else {
                console.log('[CacheManager] ⚠️ Nenhum dado encontrado na nuvem para este usuário');
            }
        } catch (error) {
            console.error('[CacheManager] ❌ Erro ao carregar da nuvem:', error);
        } finally {
            this.isSyncing = false;
        }
        return false;
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
    
    // Forçar sincronização manual
    async forceSync() {
        console.log('[CacheManager] 🔄 Forçando sincronização manual...');
        return await this.loadFromCloud();
    }
}

window.CacheManager = new CacheManager();
window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.onCacheChange = (key, callback) => window.CacheManager.addListener(key, callback);
window.forceSyncCloud = () => window.CacheManager.forceSync();