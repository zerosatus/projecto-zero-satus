// cache-manager.js - VERSÃO OTIMIZADA PARA PLANO FREE

class SupabaseCacheManager {
    constructor() {
        this.listeners = new Map();
        this.currentUserId = null;
        this.isLoading = false;
        this.isInitialized = false;
        this._lastSyncTime = 0;
        this._dataCache = new Map();
        this._saveQueue = [];
        this._isSaving = false;
        this._pendingWrites = new Map();
        this._writeTimeout = null;
        this._syncDebounce = 5000; // ⬆️ 5 segundos
    }

    init() {
        if (this.isInitialized) return;
        console.log('[CacheManager] Inicializado (otimizado)');
        this.isInitialized = true;
        this.getCurrentUserId();

        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cacheReady'));
        }, 200);
    }

    getCurrentUserId() {
        if (this.currentUserId) return this.currentUserId;
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                this.currentUserId = user.id || user.uid;
                return this.currentUserId;
            } catch(e) {}
        }
        return null;
    }

    // ⚡ GET: SEMPRE DO CACHE LOCAL
    get(key, defaultValue = null) {
        // Cache em memória
        if (this._dataCache.has(key)) {
            return this._dataCache.get(key);
        }

        const userId = this.getCurrentUserId();
        if (!userId) return defaultValue;

        // localStorage
        const storageKey = `${userId}_${key}`;
        const data = localStorage.getItem(storageKey);
        
        if (data !== null) {
            try {
                const parsed = JSON.parse(data);
                this._dataCache.set(key, parsed);
                return parsed;
            } catch(e) {}
        }
        
        return defaultValue;
    }

    // ⚡ SET: SALVA LOCAL + AGENDA SYNC
    set(key, value, notify = true) {
        const userId = this.getCurrentUserId();
        if (!userId) return false;

        try {
            const storageKey = `${userId}_${key}`;
            
            // Salvar local IMEDIATAMENTE
            localStorage.setItem(storageKey, JSON.stringify(value));
            this._dataCache.set(key, value);

            // Backup compatibilidade
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    const user = JSON.parse(usuario);
                    if (user.email) {
                        localStorage.setItem(`${key}_${user.email}`, JSON.stringify(value));
                    }
                } catch(e) {}
            }

            // ⚡ AGENDAR SYNC (DEBOUNCE 5s)
            this._scheduleSync(key, value, userId);

            if (notify) {
                this._notifyListeners(key, value);
            }
            
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao set ${key}:`, error);
            return false;
        }
    }

    // ⚡ SYNC COM DEBOUNCE
    _scheduleSync(key, value, userId) {
        const pendingKey = `${userId}_${key}`;
        this._pendingWrites.set(pendingKey, value);

        if (this._writeTimeout) {
            clearTimeout(this._writeTimeout);
        }

        this._writeTimeout = setTimeout(() => {
            this._flushPendingWrites(userId);
        }, 5000); // ⬆️ 5 segundos
    }

    async _flushPendingWrites(userId) {
        if (this._pendingWrites.size === 0) return;

        const items = Array.from(this._pendingWrites.entries());
        this._pendingWrites.clear();

        for (const [key, value] of items) {
            const actualKey = key.replace(`${userId}_`, '');
            await this.saveToCloud(actualKey, value, userId);
        }
    }

    // ⚡ SALVAR NA NUVEM (SEM RETRY INFINITO)
    async saveToCloud(key, value, userId) {
        if (!window.DatabaseService || !userId) return;

        try {
            console.log(`[CacheManager] 💾 Salvando ${key}...`);
            
            const saveMethods = {
                tasks: window.DatabaseService.saveTasks,
                notes: window.DatabaseService.saveNotes,
                calendarEvents: window.DatabaseService.saveCalendarEvents,
                weeklySchedule: window.DatabaseService.saveWeeklySchedule,
                timeSlots: window.DatabaseService.saveTimeSlots,
                notifications: window.DatabaseService.saveNotifications,
                disciplinas: window.DatabaseService.saveDisciplinas
            };

            const saveMethod = saveMethods[key];
            if (saveMethod) {
                await saveMethod(userId, value);
                console.log(`[CacheManager] ✅ ${key} salvo`);
            }
        } catch (error) {
            console.error(`[CacheManager] Erro ao salvar ${key}:`, error);
            // ⚡ APENAS 1 TENTATIVA
        }
    }

    // ⚡ CARREGAR DA NUVEM (MÁX 1 VEZ POR MINUTO)
    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) return false;

        const now = Date.now();
        if (!force && (now - this._lastSyncTime < 60000)) { // ⬆️ 1 minuto
            console.log('[CacheManager] ⏳ Cache recente');
            return false;
        }

        this._lastSyncTime = now;
        console.log('[CacheManager] ☁️ Carregando dados...');

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

            let hasChanges = false;

            for (const [key, getter] of Object.entries(dataTypes)) {
                try {
                    const data = await getter(userId);
                    if (data) {
                        const storageKey = `${userId}_${key}`;
                        const current = localStorage.getItem(storageKey);
                        const newData = JSON.stringify(data);
                        
                        if (current !== newData) {
                            localStorage.setItem(storageKey, newData);
                            this._dataCache.set(key, data);
                            hasChanges = true;
                            this._notifyListeners(key, data);
                        }
                    }
                } catch (error) {
                    console.warn(`[CacheManager] Erro ao carregar ${key}:`, error);
                }
            }

            if (hasChanges) {
                window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                console.log('[CacheManager] ✅ Dados carregados');
            }

            return hasChanges;
        } catch (error) {
            console.error('[CacheManager] Erro no loadFromCloud:', error);
            return false;
        }
    }

    _notifyListeners(key, value) {
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

    // ⚡ LOGOUT COM FLUSH
    async logout() {
        const userId = this.getCurrentUserId();
        if (userId && this._pendingWrites.size > 0) {
            await this._flushPendingWrites(userId);
        }
        
        this.currentUserId = null;
        this.listeners.clear();
        this._dataCache.clear();
        this._pendingWrites.clear();
        if (this._writeTimeout) {
            clearTimeout(this._writeTimeout);
            this._writeTimeout = null;
        }
        console.log('[CacheManager] Logout realizado');
    }

    async forceSync() {
        const userId = this.getCurrentUserId();
        if (userId && this._pendingWrites.size > 0) {
            await this._flushPendingWrites(userId);
        }
        return await this.loadFromCloud(true);
    }

    // ⚡ FOTO DE PERFIL OTIMIZADA
    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;

        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                if (user.avatar_url || user.foto || user.profilePhotoUrl) {
                    const photo = user.avatar_url || user.foto || user.profilePhotoUrl;
                    if (photo && (photo.startsWith('data:') || photo.startsWith('http'))) {
                        return photo;
                    }
                }
            } catch(e) {}
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

    // ⚡ UPLOAD COM COMPRESSÃO (LIMITE 500KB)
    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) return null;

        try {
            let fileToUpload = file;
            if (file.size > 300 * 1024) { // ⬇️ 300KB
                fileToUpload = await this._compressImage(file);
            }

            const photoUrl = await window.StorageService.uploadProfilePhoto(userId, fileToUpload);

            if (photoUrl) {
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
                    detail: { photoUrl }
                }));
            }

            return photoUrl;
        } catch (error) {
            console.error('[CacheManager] Erro no upload:', error);
            return null;
        }
    }

    // ⚡ COMPRESSÃO OTIMIZADA (400px, 70%)
    _compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 400; // ⬇️ 400px
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height = (height * MAX_SIZE) / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width = (width * MAX_SIZE) / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.7); // ⬇️ 70%
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    startRealtimeSync() {
        // ⚡ DISABLED - Economiza requests
        console.log('[CacheManager] ⚡ Realtime sync desabilitado (plano free)');
    }

    async deleteProfilePhoto() {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) return false;

        const result = await window.StorageService.deleteProfilePhoto(userId);
        if (result) {
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

console.log('[CacheManager] v4.0 - OTIMIZADO PARA PLANO FREE!');