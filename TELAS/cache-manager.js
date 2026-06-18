// cache-manager.js - Versão Supabase COMPLETA CORRIGIDA

class SupabaseCacheManager {
    constructor() {
        this.listeners = new Map();
        this.currentUserId = null;
        this._pendingSync = new Map();
        this.isLoading = false;
        this.isInitialized = false;
        this._savingFlags = new Map();
        this._lastSyncTime = 0;
        this._syncDebounce = 2000;
        this._profilePhotoCache = null;
        this._eventTriggered = false;
        this._dataCache = new Map();
    }

    init() {
        if (this.isInitialized) return;
        console.log('[CacheManager] Inicializado');
        this.isInitialized = true;

        // FORÇAR CARREGAMENTO DO USER ID
        this.getCurrentUserId();

        // DISPARAR EVENTO DE PRONTO
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cacheReady'));
            console.log('[CacheManager] 📡 Evento cacheReady disparado');
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
            // Verificar cache em memória primeiro
            if (this._dataCache.has(key)) {
                return this._dataCache.get(key);
            }

            const userId = this.getCurrentUserId();
            if (!userId) return defaultValue;

            const storageKey = `${userId}_${key}`;
            const data = localStorage.getItem(storageKey);
            
            if (data === null) {
                // Tentar com a chave antiga (email) para compatibilidade
                const usuario = localStorage.getItem('usuarioLogado');
                if (usuario) {
                    try {
                        const user = JSON.parse(usuario);
                        if (user.email) {
                            const oldKey = `${key}_${user.email}`;
                            const oldData = localStorage.getItem(oldKey);
                            if (oldData !== null) {
                                // Migrar para o novo formato
                                localStorage.setItem(storageKey, oldData);
                                localStorage.removeItem(oldKey);
                                const parsed = JSON.parse(oldData);
                                this._dataCache.set(key, parsed);
                                return parsed;
                            }
                        }
                    } catch(e) {}
                }
                return defaultValue;
            }
            
            const parsed = JSON.parse(data);
            this._dataCache.set(key, parsed);
            return parsed;
        } catch (error) {
            console.error(`[CacheManager] Erro ao get ${key}:`, error);
            return defaultValue;
        }
    }

    set(key, value, notify = true) {
        const flagKey = `${this.getCurrentUserId()}_${key}`;
        if (this._savingFlags.get(flagKey)) {
            return false;
        }

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

            this._savingFlags.set(flagKey, true);
            
            // Salvar no localStorage
            localStorage.setItem(storageKey, JSON.stringify(value));
            
            // Salvar no cache em memória
            this._dataCache.set(key, value);

            // Salvar também com a chave antiga para compatibilidade
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    const user = JSON.parse(usuario);
                    if (user.email) {
                        const oldKey = `${key}_${user.email}`;
                        localStorage.setItem(oldKey, JSON.stringify(value));
                    }
                } catch(e) {}
            }

            // Agendar salvamento na nuvem
            this._scheduleCloudSave(key, value, userId);

            // Notificar listeners
            if (notify) {
                if (this.listeners.has(key)) {
                    this.listeners.get(key).forEach(cb => {
                        try { cb(value); } catch(e) { console.warn('[CacheManager] Erro no listener:', e); }
                    });
                }
                
                // Disparar eventos globais
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: value }));
                    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value } }));
                }, 50);
            }
            
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao set ${key}:`, error);
            return false;
        } finally {
            setTimeout(() => {
                this._savingFlags.delete(flagKey);
            }, 1000);
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

        const now = Date.now();
        if (now - this._lastSyncTime < this._syncDebounce) {
            return;
        }

        try {
            this._lastSyncTime = now;

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
                case 'usuarioLogado':
                    if (value.id && value.email) {
                        await window.DatabaseService.ensureUserData(value.id, value.email, value.nome);
                    }
                    break;
                default:
                    console.log(`[CacheManager] Tipo não reconhecido: ${key}`);
                    return;
            }
            
            console.log(`[CacheManager] ✅ ${key} salvo na nuvem (${Array.isArray(value) ? value.length : Object.keys(value).length} itens)`);
        } catch (error) {
            console.error(`[CacheManager] Erro ao salvar ${key} na nuvem:`, error);
        }
    }

    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) {
            console.warn('[CacheManager] loadFromCloud: userId ou DatabaseService não disponível');
            return false;
        }

        if (this.isLoading && !force) {
            console.log('[CacheManager] Já carregando...');
            return false;
        }

        this.isLoading = true;
        console.log('[CacheManager] ☁️ Carregando dados da nuvem para:', userId);
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
                try {
                    const data = await getter(userId);
                    if (data && (data.length > 0 || Object.keys(data).length > 0)) {
                        const storageKey = `${userId}_${key}`;
                        const newDataStr = JSON.stringify(data);
                        const currentLocal = localStorage.getItem(storageKey);
                        
                        if (currentLocal !== newDataStr) {
                            localStorage.setItem(storageKey, newDataStr);
                            this._dataCache.set(key, data);
                            hasChanges = true;
                            
                            // Salvar também com a chave antiga
                            const usuario = localStorage.getItem('usuarioLogado');
                            if (usuario) {
                                try {
                                    const user = JSON.parse(usuario);
                                    if (user.email) {
                                        localStorage.setItem(`${key}_${user.email}`, newDataStr);
                                    }
                                } catch(e) {}
                            }
                            
                            console.log(`[CacheManager] ${key} atualizado da nuvem: ${Array.isArray(data) ? data.length : Object.keys(data).length} itens`);
                            
                            // Notificar listeners
                            if (this.listeners.has(key)) {
                                this.listeners.get(key).forEach(cb => {
                                    try { cb(data); } catch(e) {}
                                });
                            }
                            
                            // Disparar eventos
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: data }));
                                window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value: data } }));
                            }, 50);
                        }
                    }
                } catch (error) {
                    console.error(`[CacheManager] Erro ao carregar ${key}:`, error);
                }
            }

            if (hasChanges) {
                if (!this._eventTriggered) {
                    this._eventTriggered = true;
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                        this._eventTriggered = false;
                    }, 100);
                }
                console.log('[CacheManager] ✅ Dados carregados da nuvem!');
            } else {
                console.log('[CacheManager] Nenhum dado novo encontrado');
            }

            return hasChanges;
        } catch (error) {
            console.error('[CacheManager] Erro no loadFromCloud:', error);
            return false;
        } finally {
            this.isLoading = false;
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

    async logout() {
        if (window.RealtimeSyncManager) {
            window.RealtimeSyncManager.disconnect();
        }
        this.currentUserId = null;
        this.listeners.clear();
        this._savingFlags.clear();
        this._pendingSync.clear();
        this._profilePhotoCache = null;
        this._dataCache.clear();
        console.log('[CacheManager] Logout realizado');
    }

    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;

        if (this._profilePhotoCache) {
            return this._profilePhotoCache;
        }

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
            } catch (error) {
                console.error('[CacheManager] Erro ao buscar foto do perfil:', error);
            }
        }

        return null;
    }

    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) {
            console.error('[CacheManager] uploadProfilePhoto: userId ou StorageService não disponível');
            return null;
        }

        if (!file || !file.type || !file.type.startsWith('image/')) {
            console.error('[CacheManager] Arquivo inválido:', file);
            return null;
        }

        try {
            const photoUrl = await window.StorageService.uploadProfilePhoto(userId, file);

            if (photoUrl) {
                this._profilePhotoCache = photoUrl;
                localStorage.setItem('userPhotoURL', photoUrl);

                const profile = await window.DatabaseService.getUserProfile(userId);
                if (profile) {
                    await window.DatabaseService.updateUserProfile(userId, {
                        ...profile,
                        avatar_url: photoUrl
                    });
                }

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

                window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
                    detail: { photoUrl: photoUrl }
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
        if (userId && window.RealtimeSyncManager) {
            window.RealtimeSyncManager.init(userId);
        }
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

console.log('[CacheManager] v2.5 carregado com correções de sincronização!');