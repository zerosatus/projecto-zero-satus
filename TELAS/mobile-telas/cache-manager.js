// ==========================================
// cache-manager.js - GERENCIADOR DE CACHE COMPLETO (CORRIGIDO)
// ==========================================

console.log('[CacheManager] 🔄 Inicializando CacheManager...');

class SimpleCacheManager {
    constructor() {
        this.listeners = new Map();
        this.currentUserId = null;
        this.isInitialized = false;
        this._dataCache = new Map();
        this._eventTriggered = false;
        this._saveQueue = [];
        this._isSaving = false;
        this._saveTimeout = null;
        this._pendingSync = new Map();
        this._savingFlags = new Map();
        this._lastSyncTime = 0;
        this._syncDebounce = 2000;
        this._profilePhotoCache = null;
        this.isLoading = false;
        this._syncTimeout = null;
        this._initAttempts = 0;
        this._maxInitAttempts = 5;
        this._syncInProgress = false;
        this._dbInitAttempts = 0;
        this._maxDbInitAttempts = 10;
        this._dbInitDelay = 1000;
        this._processingQueue = false;
        this._forceCloudLoad = false;
        this._syncErrorCount = 0;
        this._maxSyncErrors = 5;
        this._deleteQueue = []; 
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.getCurrentUserId();
        if (window.StorageKeys && typeof window.StorageKeys.migrarDadosAntigos === 'function') {
            setTimeout(() => { window.StorageKeys.migrarDadosAntigos(); }, 100);
        }
        setTimeout(() => { window.dispatchEvent(new CustomEvent('cacheReady')); }, 100);
    }

    getCurrentUserId() {
        if (this.currentUserId) return this.currentUserId;
        if (window.StorageKeys && typeof window.StorageKeys.getCurrentUserId === 'function') {
            const userId = window.StorageKeys.getCurrentUserId();
            if (userId) { this.currentUserId = userId; return this.currentUserId; }
        }
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                this.currentUserId = user.id || user.uid;
                return this.currentUserId;
            } catch(e) { console.error('[CacheManager] ❌ Erro ao parsear utilizador:', e); }
        }
        return null;
    }

    async _ensureDatabaseService() {
        if (window.DatabaseService) { this._dbInitAttempts = 0; return true; }
        if (this._dbInitAttempts >= this._maxDbInitAttempts) return false;
        this._dbInitAttempts++;
        if (window.SupabaseClient?.initSupabase) {
            try {
                await window.SupabaseClient.initSupabase();
                await new Promise(r => setTimeout(r, 1000));
                if (window.DatabaseService) { this._dbInitAttempts = 0; return true; }
            } catch (e) {}
        }
        try {
            const script = document.createElement('script');
            script.src = '/TELAS/mobile-telas/database-service.js';
            script.onload = () => { if (window.DatabaseService) this._dbInitAttempts = 0; };
            document.head.appendChild(script);
            await new Promise(r => setTimeout(r, 1500));
        } catch(e) {}
        if (window.DatabaseService) { this._dbInitAttempts = 0; return true; }
        if (this._dbInitAttempts < this._maxDbInitAttempts) {
            await new Promise(r => setTimeout(r, this._dbInitDelay));
            return this._ensureDatabaseService();
        }
        return false;
    }

    get(key, defaultValue = null) {
        try {
            if (this._dataCache.has(key)) return this._dataCache.get(key);
            const userId = this.getCurrentUserId();
            if (!userId) return defaultValue;
            const storageKey = `${userId}_${key}`;
            const data = localStorage.getItem(storageKey);
            if (data === null) {
                const usuario = localStorage.getItem('usuarioLogado');
                if (usuario) {
                    try {
                        const user = JSON.parse(usuario);
                        const oldKey = `${key}_${user.email}`;
                        const oldData = localStorage.getItem(oldKey);
                        if (oldData !== null) {
                            localStorage.setItem(storageKey, oldData);
                            const parsed = JSON.parse(oldData);
                            this._dataCache.set(key, parsed);
                            return parsed;
                        }
                    } catch(e) {}
                }
                return defaultValue;
            }
            const parsed = JSON.parse(data);
            this._dataCache.set(key, parsed);
            return parsed;
        } catch (error) { return defaultValue; }
    }

    set(key, value, notify = true) {
        const userId = this.getCurrentUserId();
        if (!userId) return false;
        const flagKey = `${userId}_${key}`;
        if (this._savingFlags.get(flagKey)) return false;
        
        try {
            const storageKey = `${userId}_${key}`;
            const currentData = localStorage.getItem(storageKey);
            if (currentData !== null) {
                try {
                    const parsed = JSON.parse(currentData);
                    if (JSON.stringify(parsed) === JSON.stringify(value)) return true;
                } catch(e) {}
            }
            
            this._savingFlags.set(flagKey, true);
            localStorage.setItem(storageKey, JSON.stringify(value));
            this._dataCache.set(key, value);
            
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    const user = JSON.parse(usuario);
                    if (user.email) {
                        localStorage.setItem(`${key}_${user.email}`, JSON.stringify(value));
                    }
                } catch(e) {}
            }
            
            if (window.DatabaseService) {
                this._addToSaveQueue(key, value, userId);
            } else {
                this._saveQueue.push({ key, value, userId });
                if (!this._processingQueue) setTimeout(() => this._processSaveQueue(), 2000);
            }
            
            if (notify) {
                if (this.listeners.has(key)) {
                    this.listeners.get(key).forEach(cb => {
                        try { cb(value); } catch(e) {}
                    });
                }
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: value }));
                    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value } }));
                }, 50);
            }
            return true;
        } catch (error) {
            console.error(`[CacheManager] ❌ Erro ao set ${key}:`, error);
            return false;
        } finally {
            setTimeout(() => { this._savingFlags.delete(flagKey); }, 1000);
        }
    }

    delete(key, itemId, notify = true) {
        const userId = this.getCurrentUserId();
        if (!userId) return false;
        try {
            const currentData = this.get(key, []);
            if (!Array.isArray(currentData)) return false;
            const newData = currentData.filter(item => item.id != itemId);
            if (newData.length === currentData.length) return false;
            const storageKey = `${userId}_${key}`;
            localStorage.setItem(storageKey, JSON.stringify(newData));
            this._dataCache.set(key, newData);
            this._addToDeleteQueue(key, itemId, userId);
            
            if (notify) {
                if (this.listeners.has(key)) {
                    this.listeners.get(key).forEach(cb => {
                        try { cb(newData); } catch(e) {}
                    });
                }
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: newData }));
                    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value: newData } }));
                }, 50);
            }
            return true;
        } catch (error) { return false; }
    }

    _addToDeleteQueue(key, itemId, userId) {
        this._deleteQueue.push({ key, itemId, userId });
        this._processDeleteQueue();
    }

    async _processDeleteQueue() {
        if (this._processingQueue || this._deleteQueue.length === 0) return;
        this._processingQueue = true;
        try {
            const dbReady = await this._ensureDatabaseService();
            if (!dbReady || !window.DatabaseService) {
                setTimeout(() => { this._processingQueue = false; if (this._deleteQueue.length > 0) this._processDeleteQueue(); }, 5000);
                return;
            }
            while (this._deleteQueue.length > 0) {
                const item = this._deleteQueue.shift();
                const userId = item.userId || this.getCurrentUserId();
                if (!userId) continue;
                const result = await this.deleteFromCloud(item.key, item.itemId, userId);
                if (!result) {
                    this._deleteQueue.push(item);
                    break;
                }
            }
        } catch (error) { console.error('[CacheManager] ❌ Erro delete queue:', error); } 
        finally {
            this._processingQueue = false;
            if (this._deleteQueue.length > 0) {
                setTimeout(() => { if (this._deleteQueue.length > 0) this._processDeleteQueue(); }, 3000);
            }
        }
    }

    async deleteFromCloud(key, itemId, userId) {
        if (!window.DatabaseService) {
            const dbReady = await this._ensureDatabaseService();
            if (!dbReady || !window.DatabaseService) return false;
        }
        if (!userId) return false;
        try {
            let result = false;
            switch(key) {
                case 'tasks': result = await window.DatabaseService.deleteTask(userId, itemId); break;
                case 'notes': result = await window.DatabaseService.deleteNote(userId, itemId); break;
                case 'calendarEvents': result = await window.DatabaseService.deleteCalendarEvent(userId, itemId); break;
                case 'disciplinas': result = await window.DatabaseService.deleteDisciplina(userId, itemId); break;
                case 'documentos': result = await window.DatabaseService.deleteDocumento(userId, itemId); break;
                default: return false;
            }
            return result;
        } catch (error) { return false; }
    }

    _addToSaveQueue(key, value, userId) {
        this._saveQueue.push({ key, value, userId });
        this._processSaveQueue();
    }

    async _processSaveQueue() {
        if (this._processingQueue || this._saveQueue.length === 0) return;
        this._processingQueue = true;
        try {
            const dbReady = await this._ensureDatabaseService();
            if (!dbReady || !window.DatabaseService) {
                setTimeout(() => { this._processingQueue = false; if (this._saveQueue.length > 0) this._processSaveQueue(); }, 5000);
                return;
            }
            while (this._saveQueue.length > 0) {
                const item = this._saveQueue.shift();
                const userId = item.userId || this.getCurrentUserId();
                if (!userId) continue;
                const result = await this.saveToCloud(item.key, item.value, userId);
                if (!result) {
                    this._saveQueue.push(item);
                    break;
                }
            }
        } catch (error) { console.error('[CacheManager] ❌ Erro save queue:', error); }
        finally {
            this._processingQueue = false;
            if (this._saveQueue.length > 0) {
                setTimeout(() => { if (this._saveQueue.length > 0) this._processSaveQueue(); }, 3000);
            }
        }
    }

    async saveToCloud(key, value, userId) {
        if (!window.DatabaseService) {
            const dbReady = await this._ensureDatabaseService();
            if (!dbReady || !window.DatabaseService) return false;
        }
        if (!userId) return false;
        try {
            let result = false;
            switch(key) {
                case 'tasks': result = await window.DatabaseService.saveTasks(userId, value); break;
                case 'notes': result = await window.DatabaseService.saveNotes(userId, value); break;
                case 'calendarEvents': result = await window.DatabaseService.saveCalendarEvents(userId, value); break;
                case 'weeklySchedule': result = await window.DatabaseService.saveWeeklySchedule(userId, value); break;
                case 'timeSlots': result = await window.DatabaseService.saveTimeSlots(userId, value); break;
                case 'notifications': result = await window.DatabaseService.saveNotifications(userId, value); break;
                case 'disciplinas': result = await window.DatabaseService.saveDisciplinas(userId, value); break;
                case 'studySessions':
                    for (const session of value) { await window.DatabaseService.saveStudySession(session); }
                    result = true;
                    break;
                case 'documentos': result = await window.DatabaseService.saveDocumentos(userId, value); break;
                default: return false;
            }
            return result;
        } catch (error) { return false; }
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

    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId) return false;
        const dbReady = await this._ensureDatabaseService();
        if (!dbReady || !window.DatabaseService) return false;
        if (this.isLoading && !force) return false;
        
        this.isLoading = true;
        let hasChanges = false;
        try {
            const db = window.DatabaseService;
            const dataTypes = {
                tasks: db.getTasks.bind(db), notes: db.getNotes.bind(db),
                calendarEvents: db.getCalendarEvents.bind(db), weeklySchedule: db.getWeeklySchedule.bind(db),
                timeSlots: db.getTimeSlots.bind(db), notifications: db.getNotifications.bind(db),
                disciplinas: db.getDisciplinas.bind(db), documentos: db.getDocumentos.bind(db)
            };
            for (const [key, getter] of Object.entries(dataTypes)) {
                try {
                    const data = await getter(userId);
                    if (data !== null && data !== undefined) {
                        const storageKey = `${userId}_${key}`;
                        const currentLocalStr = localStorage.getItem(storageKey);
                        let currentLocal = null;
                        try { currentLocal = currentLocalStr ? JSON.parse(currentLocalStr) : null; } catch(e) {}
                        const nuvemLen = Array.isArray(data) ? data.length : 0;
                        const localLen = Array.isArray(currentLocal) ? currentLocal.length : 0;
                        
                        const temNaFila = this._saveQueue.some(item => item.key === key) || this._pendingSync.has(key);
                        if (temNaFila && nuvemLen < localLen) continue;
                        
                        const nuvemVazia = (nuvemLen === 0) && (typeof data === 'object' && !Array.isArray(data) ? Object.keys(data).length === 0 : true);
                        const localTemDados = localLen > 0 || (currentLocal && typeof currentLocal === 'object' && !Array.isArray(currentLocal) && Object.keys(currentLocal).length > 0);
                        
                        if (nuvemVazia && localTemDados && (key === 'disciplinas' || key === 'tasks' || key === 'notes')) continue;

                        if (force || (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
                            const newDataStr = JSON.stringify(data);
                            if (force || currentLocalStr !== newDataStr) {
                                localStorage.setItem(storageKey, newDataStr);
                                const usuario = localStorage.getItem('usuarioLogado');
                                if (usuario) {
                                    try {
                                        const user = JSON.parse(usuario);
                                        if (user.email) localStorage.setItem(`${key}_${user.email}`, newDataStr);
                                    } catch(e) {}
                                }
                                this._dataCache.set(key, data);
                                hasChanges = true;
                                if (this.listeners.has(key)) {
                                    this.listeners.get(key).forEach(cb => {
                                        try { cb(data); } catch(e) {}
                                    });
                                }
                                setTimeout(() => {
                                    window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: data }));
                                    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value: data } }));
                                }, 50);
                            }
                        }
                    }
                } catch (error) { console.error(`[CacheManager] ❌ Erro ao carregar ${key}:`, error); }
            }
            if (hasChanges) {
                if (!this._eventTriggered) {
                    this._eventTriggered = true;
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                        this._eventTriggered = false;
                    }, 100);
                }
            }
            return hasChanges || force;
        } catch (error) { return false; } 
        finally { this.isLoading = false; }
    }

    async forceSync() {
        if (this._syncInProgress) return false;
        this._syncInProgress = true;
        try {
            const dbReady = await this._ensureDatabaseService();
            if (!dbReady || !window.DatabaseService) return false;
            if (this._deleteQueue.length > 0) await this._processDeleteQueue();
            if (this._saveQueue.length > 0) await this._processSaveQueue();
            this._lastSyncTime = Date.now();
            this._syncErrorCount = 0;
            window.dispatchEvent(new CustomEvent('syncCompleted', { detail: { success: true } }));
            return true;
        } catch (error) {
            this._syncErrorCount++;
            console.error(`[CacheManager] ❌ Erro forceSync (${this._syncErrorCount}/${this._maxSyncErrors}):`, error);
            if (this._syncErrorCount < this._maxSyncErrors) {
                setTimeout(() => this.forceSync(), 5000);
            }
            return false;
        } finally { this._syncInProgress = false; }
    }

    async logout() {
        if (window.RealtimeSyncManager) window.RealtimeSyncManager.disconnect();
        try { await this.forceSync(); } catch(e) {}
        this.currentUserId = null;
        this.listeners.clear();
        this._savingFlags.clear();
        this._pendingSync.clear();
        this._profilePhotoCache = null;
        this._dataCache.clear();
        this._saveQueue = [];
        this._deleteQueue = [];
        this._dbInitAttempts = 0;
        this._processingQueue = false;
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        if (this._syncTimeout) clearTimeout(this._syncTimeout);
    }

    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;
        if (this._profilePhotoCache) return this._profilePhotoCache;
        const localPhoto = localStorage.getItem('userPhotoURL');
        if (localPhoto && (localPhoto.startsWith('data:') || localPhoto.startsWith('http'))) {
            this._profilePhotoCache = localPhoto;
            return localPhoto;
        }
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                if (user.avatar_url || user.foto || user.profilePhotoUrl) {
                    const photo = user.avatar_url || user.foto || user.profilePhotoUrl;
                    if (photo && (photo.startsWith('data:') || photo.startsWith('http'))) {
                        this._profilePhotoCache = photo;
                        localStorage.setItem('userPhotoURL', photo);
                        return photo;
                    }
                }
            } catch(e) {}
        }
        if (window.DatabaseService) {
            try {
                const profile = await window.DatabaseService.getUserProfile(userId);
                if (profile?.avatar_url) {
                    this._profilePhotoCache = profile.avatar_url;
                    localStorage.setItem('userPhotoURL', profile.avatar_url);
                    return profile.avatar_url;
                }
            } catch (error) {}
        }
        return null;
    }

    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) return null;
        if (!file || !file.type || !file.type.startsWith('image/')) return null;
        try {
            const photoUrl = await window.DatabaseService.uploadProfilePhoto(userId, file);
            if (photoUrl) {
                this._profilePhotoCache = photoUrl;
                localStorage.setItem('userPhotoURL', photoUrl);
                const usuario = localStorage.getItem('usuarioLogado');
                if (usuario) {
                    try {
                        const user = JSON.parse(usuario);
                        user.avatar_url = photoUrl;
                        user.foto = photoUrl;
                        user.profilePhotoUrl = photoUrl;
                        localStorage.setItem('usuarioLogado', JSON.stringify(user));
                    } catch(e) {}
                }
                window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { photoUrl } }));
                return photoUrl;
            }
            return null;
        } catch (error) { return null; }
    }

    async deleteProfilePhoto() {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) return false;
        const result = await window.DatabaseService.deleteProfilePhoto(userId);
        if (result) {
            this._profilePhotoCache = null;
            localStorage.removeItem('userPhotoURL');
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    const user = JSON.parse(usuario);
                    delete user.avatar_url;
                    delete user.foto;
                    delete user.profilePhotoUrl;
                    localStorage.setItem('usuarioLogado', JSON.stringify(user));
                } catch(e) {}
            }
        }
        return result;
    }

    startRealtimeSync() {
        const userId = this.getCurrentUserId();
        if (userId && window.RealtimeSyncManager) window.RealtimeSyncManager.init(userId);
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            userId: this.currentUserId,
            dataCacheSize: this._dataCache.size,
            saveQueueSize: this._saveQueue.length,
            deleteQueueSize: this._deleteQueue.length,
            isSaving: this._isSaving,
            isLoading: this.isLoading,
            dbAvailable: !!window.DatabaseService,
            dbInitAttempts: this._dbInitAttempts,
            processingQueue: this._processingQueue,
            lastSyncTime: this._lastSyncTime ? new Date(this._lastSyncTime).toLocaleString() : 'Nunca',
            syncErrorCount: this._syncErrorCount
        };
    }
}

if (typeof window.CacheManager === 'undefined') {
    window.CacheManager = new SimpleCacheManager();
}

window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.deleteCached = (key, id, notify) => window.CacheManager.delete(key, id, notify);
window.forceSyncCloud = () => window.CacheManager.forceSync();
window.getNotes = () => window.CacheManager.get('notes', []);
window.setNotes = (notes, notify) => window.CacheManager.set('notes', notes, notify);
window.getTasks = () => window.CacheManager.get('tasks', []);
window.setTasks = (tasks, notify) => window.CacheManager.set('tasks', tasks, notify);
window.getCalendarEvents = () => window.CacheManager.get('calendarEvents', []);
window.setCalendarEvents = (events, notify) => window.CacheManager.set('calendarEvents', events, notify);
window.getWeeklySchedule = () => window.CacheManager.get('weeklySchedule', {});
window.setWeeklySchedule = (schedule, notify) => window.CacheManager.set('weeklySchedule', schedule, notify);
window.getTimeSlots = () => window.CacheManager.get('timeSlots', []);
window.setTimeSlots = (slots, notify) => window.CacheManager.set('timeSlots', slots, notify);
window.getNotifications = () => window.CacheManager.get('notifications', []);
window.setNotifications = (notifications, notify) => window.CacheManager.set('notifications', notifications, notify);
window.getDisciplinas = () => window.CacheManager.get('disciplinas', []);
window.setDisciplinas = (disciplinas, notify) => window.CacheManager.set('disciplinas', disciplinas, notify);
window.getDocumentos = () => window.CacheManager.get('documentos', []);
window.setDocumentos = (documentos, notify) => window.CacheManager.set('documentos', documentos, notify);
window.getCacheStatus = () => window.CacheManager.getStatus();

console.log('[CacheManager] ✅ CacheManager v7.0 carregado (Web otimizado)');