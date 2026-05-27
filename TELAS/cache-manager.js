// Sistema centralizado de gerenciamento de cache com suporte a nuvem
class CacheManager {
    constructor() {
        this.listeners = new Map();
        this.cacheVersion = 'v6';
        this.isInitialized = false;
        this.currentUserId = null;
        this.isSyncing = false;
        this.syncCallbacks = [];
        this.pendingCloudLoad = null;
    }

    init() {
        if (this.isInitialized) return;
        this.checkAndClearOldCache();
        
        // Escutar mudanças no localStorage de outras abas
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
        
        // Escutar evento global de dados carregados da nuvem
        window.addEventListener('cloudDataLoaded', (event) => {
            console.log('[CacheManager] Dados carregados da nuvem, atualizando UI');
            this.notifyAllListeners(event.detail);
        });
        
        this.isInitialized = true;
        console.log('[CacheManager] Inicializado v6');
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
            
            // Sincronizar com a nuvem (Realtime DB) - apenas se não estiver em processo de sync
            if (!this.isSyncing && window.FirebaseSync && this.currentUserId && this.currentUserId !== 'default') {
                // Debounce para evitar muitas chamadas
                clearTimeout(this._syncTimeout);
                this._syncTimeout = setTimeout(() => {
                    this.syncToCloud(key, value);
                }, 500);
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
            if (userId && userId !== 'default' && window.FirebaseSync) {
                await window.FirebaseSync.saveUserDataToCloud(userId, key, value);
                console.log(`[CacheManager] ✅ Dado "${key}" enviado para nuvem`);
            }
        } catch (error) {
            console.error('[CacheManager] Erro ao sincronizar com nuvem:', error);
        }
    }
    
    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') {
            console.log('[CacheManager] Sem usuário logado, ignorando sync da nuvem');
            return false;
        }
        
        if (this.isSyncing && !force) {
            console.log('[CacheManager] Sincronização já em andamento...');
            return this.pendingCloudLoad;
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
                        if (localData === null || JSON.stringify(localData) !== JSON.stringify(cloudData[key])) {
                            const storageKey = this.getStorageKey(key);
                            localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
                            hasChanges = true;
                            console.log(`[CacheManager] ✅ Dado "${key}" carregado da nuvem`);
                            
                            if (this.listeners.has(key)) {
                                const callbacks = this.listeners.get(key);
                                callbacks.forEach(cb => cb(cloudData[key]));
                            }
                        }
                    }
                }
                
                if (hasChanges) {
                    console.log('[CacheManager] 🎉 Dados carregados da nuvem com sucesso!');
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
            this.pendingCloudLoad = null;
        }
        return false;
    }
    
    notifyAllListeners(cloudData) {
        if (!cloudData) return;
        for (const [key, callbacks] of this.listeners) {
            if (cloudData[key] !== undefined && callbacks.length > 0) {
                callbacks.forEach(cb => cb(cloudData[key]));
            }
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
    
    async forceSync() {
        console.log('[CacheManager] 🔄 Forçando sincronização manual...');
        return await this.loadFromCloud(true);
    }
    
    // Método para ser chamado após login
    async afterLogin() {
        this.currentUserId = null; // Reset para pegar novo usuário
        const userId = this.getCurrentUserId();
        if (userId && userId !== 'default') {
            console.log('[CacheManager] 🔄 Usuário logado, carregando dados da nuvem...');
            await this.loadFromCloud(true);
        }
    }
}

window.CacheManager = new CacheManager();
window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.onCacheChange = (key, callback) => window.CacheManager.addListener(key, callback);
window.forceSyncCloud = () => window.CacheManager.forceSync();