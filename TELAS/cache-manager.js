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
    }

    init() {
        if (this.isInitialized) return;
        console.log('[CacheManager] Inicializado');
        this.isInitialized = true;

        // ✅ FORÇAR CARREGAMENTO DO USER ID
        this.getCurrentUserId();

        // ✅ DISPARAR EVENTO DE PRONTO PARA O SYNC-HELPER
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
        const flagKey = `${this.getCurrentUserId()}_${key}`;
        if (this._savingFlags.get(flagKey)) {
            return false;
        }

        try {
            const userId = this.getCurrentUserId();
            if (!userId) return false;

            const storageKey = `${userId}_${key}`;

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
            localStorage.setItem(storageKey, JSON.stringify(value));

            this._scheduleCloudSave(key, value, userId);

            if (notify && this.listeners.has(key)) {
                this.listeners.get(key).forEach(cb => {
                    try {
                        cb(value);
                    } catch(e) {
                        console.warn('[CacheManager] Erro no listener:', e);
                    }
                });
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

            const currentValue = this.get(key, null);
            if (currentValue === null) return;

            if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
                await this.saveToCloud(key, currentValue, userId);
            } else {
                await this.saveToCloud(key, value, userId);
            }
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
            }
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

            // TASKS
            if (typeof db.getTasks === 'function') {
                const tasks = await db.getTasks(userId);
                if (tasks && tasks.length > 0) {
                    localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
                    hasChanges = true;
                }
            }

            // NOTES
            if (typeof db.getNotes === 'function') {
                const notes = await db.getNotes(userId);
                if (notes && notes.length > 0) {
                    localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
                    hasChanges = true;
                }
            }

            // CALENDAR EVENTS
            if (typeof db.getCalendarEvents === 'function') {
                const events = await db.getCalendarEvents(userId);
                if (events && events.length > 0) {
                    localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(events));
                    hasChanges = true;
                }
            }

            // WEEKLY SCHEDULE
            if (typeof db.getWeeklySchedule === 'function') {
                const schedule = await db.getWeeklySchedule(userId);
                if (schedule && Object.keys(schedule).length > 0) {
                    localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(schedule));
                    hasChanges = true;
                }
            }

            // TIME SLOTS
            if (typeof db.getTimeSlots === 'function') {
                const slots = await db.getTimeSlots(userId);
                if (slots && slots.length > 0) {
                    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(slots));
                    hasChanges = true;
                }
            }

            // NOTIFICATIONS
            if (typeof db.getNotifications === 'function') {
                const notif = await db.getNotifications(userId);
                if (notif && notif.length > 0) {
                    localStorage.setItem(`${userId}_notifications`, JSON.stringify(notif));
                    hasChanges = true;
                }
            }

            // ✅ CORRIGIDO: DISCIPLINAS
            if (typeof db.getDisciplinas === 'function') {
                const disciplinas = await db.getDisciplinas(userId);
                if (disciplinas && disciplinas.length > 0) {
                    localStorage.setItem(`${userId}_disciplinas`, JSON.stringify(disciplinas));
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                this._reloadFromStorage(userId);
                console.log('[CacheManager] ✅ Dados carregados da nuvem!');

                if (!this._eventTriggered) {
                    this._eventTriggered = true;
                    window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                    setTimeout(() => {
                        this._eventTriggered = false;
                    }, 5000);
                }
            } else {
                console.log('[CacheManager] Nenhum dado novo encontrado');
            }

            return true;
        } catch (error) {
            console.error('[CacheManager] Erro no loadFromCloud:', error);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    _reloadFromStorage(userId) {
        const dataTypes = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
        for (const type of dataTypes) {
            const key = `${userId}_${type}`;
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    this.set(type, parsed, false);
                } catch(e) {
                    console.warn(`[CacheManager] Erro ao parsear ${type}:`, e);
                }
            }
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

console.log('[CacheManager] v2.4 carregado com foto corrigida e evento cacheReady!');