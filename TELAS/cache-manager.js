// cache-manager.js - Versão Supabase COMPLETA E CORRIGIDA

class SupabaseCacheManager {
    constructor() {
        this.listeners = new Map();
        this.currentUserId = null;
        this.isInitialized = false;
        this._savingKeys = new Set();
        this._lastSavedData = new Map();
        this._pendingSync = new Map();
        this._syncDebounce = 2000;
        this._lastSyncTime = 0;
    }

    init() {
        if (this.isInitialized) return;
        console.log('[CacheManager] Inicializado');
        this.isInitialized = true;
        
        this.getCurrentUserId();
        
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cacheReady'));
        }, 100);
    }

    getCurrentUserId() {
        if (this.currentUserId) return this.currentUserId;
        
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                this.currentUserId = user.id || user.uid;
                console.log('[CacheManager] User ID:', this.currentUserId);
                return this.currentUserId;
            } catch(e) {
                console.error('[CacheManager] Erro ao parsear usuário:', e);
            }
        }
        return null;
    }

    get(key, defaultValue = null) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return defaultValue;
            
            const storageKey = `${userId}_${key}`;
            const data = localStorage.getItem(storageKey);
            if (data === null) return defaultValue;
            return JSON.parse(data);
        } catch (error) {
            console.error(`[CacheManager] Erro ao get ${key}:`, error);
            return defaultValue;
        }
    }

    set(key, value, notify = true) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return false;
            
            const storageKey = `${userId}_${key}`;
            
            // Verificar se mudou
            const currentData = localStorage.getItem(storageKey);
            if (currentData !== null) {
                try {
                    const parsed = JSON.parse(currentData);
                    if (JSON.stringify(parsed) === JSON.stringify(value)) {
                        return true;
                    }
                } catch(e) {}
            }
            
            // Salvar localmente
            localStorage.setItem(storageKey, JSON.stringify(value));
            this._lastSavedData.set(storageKey, JSON.stringify(value));
            
            // Salvar na nuvem
            this._scheduleCloudSave(key, value, userId);
            
            // Notificar listeners
            if (notify && this.listeners.has(key)) {
                this.listeners.get(key).forEach(cb => {
                    try { cb(value); } catch(e) {}
                });
            }
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao set ${key}:`, error);
            return false;
        }
    }

    _scheduleCloudSave(key, value, userId) {
        const pendingKey = `${userId}_${key}`;
        
        if (this._pendingSync.has(pendingKey)) {
            clearTimeout(this._pendingSync.get(pendingKey));
        }
        
        const timeout = setTimeout(async () => {
            this._pendingSync.delete(pendingKey);
            await this.saveToCloud(key, value, userId);
        }, 1500);
        
        this._pendingSync.set(pendingKey, timeout);
    }

    async saveToCloud(key, value, userId) {
        if (!window.DatabaseService || !userId) return;
        if (this._savingKeys.has(`${userId}_${key}`)) return;
        
        try {
            this._savingKeys.add(`${userId}_${key}`);
            
            switch(key) {
                case 'tasks':
                    await window.DatabaseService.saveTasks(userId, value);
                    break;
                case 'notes':
                    await window.DatabaseService.saveNotes(userId, value);
                    break;
                case 'calendarEvents':
                    await window.DatabaseService.saveCalendarEvents(userId, value);
                    break;
                case 'weeklySchedule':
                    await window.DatabaseService.saveWeeklySchedule(userId, value);
                    break;
                case 'timeSlots':
                    await window.DatabaseService.saveTimeSlots(userId, value);
                    break;
                case 'notifications':
                    await window.DatabaseService.saveNotifications(userId, value);
                    break;
                case 'disciplinas':
                    await window.DatabaseService.saveDisciplinas(userId, value);
                    break;
            }
            
            console.log(`[CacheManager] ✅ ${key} salvo na nuvem`);
        } catch (error) {
            console.error(`[CacheManager] Erro ao salvar ${key}:`, error);
        } finally {
            setTimeout(() => {
                this._savingKeys.delete(`${userId}_${key}`);
            }, 3000);
        }
    }

    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) return false;
        
        if (this._savingKeys.size > 0 && !force) {
            console.log('[CacheManager] ⏳ Salvamento em andamento');
            return false;
        }
        
        console.log('[CacheManager] ☁️ Carregando dados da nuvem...');
        let hasChanges = false;
        
        try {
            const db = window.DatabaseService;
            const dataTypes = {
                tasks: db.getTasks,
                notes: db.getNotes,
                calendarEvents: db.getCalendarEvents,
                weeklySchedule: db.getWeeklySchedule,
                timeSlots: db.getTimeSlots,
                notifications: db.getNotifications,
                disciplinas: db.getDisciplinas
            };
            
            for (const [key, getter] of Object.entries(dataTypes)) {
                const data = await getter(userId);
                if (data && (data.length > 0 || Object.keys(data).length > 0)) {
                    const storageKey = `${userId}_${key}`;
                    const newDataStr = JSON.stringify(data);
                    const currentLocal = localStorage.getItem(storageKey);
                    
                    if (currentLocal !== newDataStr) {
                        localStorage.setItem(storageKey, newDataStr);
                        hasChanges = true;
                        console.log(`[CacheManager] ${key} atualizado da nuvem`);
                        
                        // Notificar listeners
                        if (this.listeners.has(key)) {
                            this.listeners.get(key).forEach(cb => {
                                try { cb(data); } catch(e) {}
                            });
                        }
                    }
                }
            }
            
            if (hasChanges) {
                window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                console.log('[CacheManager] ✅ Dados carregados da nuvem!');
            }
            
            return hasChanges;
        } catch (error) {
            console.error('[CacheManager] Erro no loadFromCloud:', error);
            return false;
        }
    }

    async forceSync() {
        return await this.loadFromCloud(true);
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

    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;
        
        const localPhoto = localStorage.getItem('userPhotoURL');
        if (localPhoto && localPhoto.startsWith('data:')) {
            return localPhoto;
        }
        
        if (window.DatabaseService) {
            try {
                const profile = await window.DatabaseService.getUserProfile(userId);
                if (profile?.avatar_url) {
                    localStorage.setItem('userPhotoURL', profile.avatar_url);
                    return profile.avatar_url;
                }
            } catch (error) {
                console.error('[CacheManager] Erro ao buscar foto:', error);
            }
        }
        return null;
    }

    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) return null;
        
        try {
            const photoUrl = await window.StorageService.uploadProfilePhoto(userId, file);
            if (photoUrl) {
                localStorage.setItem('userPhotoURL', photoUrl);
                window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
                    detail: { photoUrl }
                }));
                return photoUrl;
            }
            return null;
        } catch (error) {
            console.error('[CacheManager] Erro no upload:', error);
            return null;
        }
    }

    async deleteProfilePhoto() {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) return false;
        
        const result = await window.StorageService.deleteProfilePhoto(userId);
        if (result) {
            localStorage.removeItem('userPhotoURL');
        }
        return result;
    }

    startRealtimeSync() {
        const userId = this.getCurrentUserId();
        if (userId && window.RealtimeSyncManager) {
            window.RealtimeSyncManager.init(userId);
        }
    }

    logout() {
        if (window.RealtimeSyncManager) {
            window.RealtimeSyncManager.disconnect();
        }
        this.currentUserId = null;
        this.listeners.clear();
        this._savingKeys.clear();
        this._lastSavedData.clear();
        this._pendingSync.clear();
        console.log('[CacheManager] Logout realizado');
    }
}

// Instância global
if (typeof window.CacheManager === 'undefined') {
    window.CacheManager = new SupabaseCacheManager();
}

// Funções globais
window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.forceSyncCloud = () => window.CacheManager.forceSync();

console.log('[CacheManager] ✅ Versão Supabase carregada!');