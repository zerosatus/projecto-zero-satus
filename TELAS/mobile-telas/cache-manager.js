// ==========================================
// cache-manager.js - GERENCIADOR DE CACHE COMPLETO
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
    }

    init() {
        if (this.isInitialized) {
            console.log('[CacheManager] ⚠️ Já inicializado');
            return;
        }
        console.log('[CacheManager] ✅ Inicializando...');
        this.isInitialized = true;
        this.getCurrentUserId();

        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cacheReady'));
            console.log('[CacheManager] 📡 Evento cacheReady disparado');
        }, 100);
    }

    getCurrentUserId() {
        if (this.currentUserId) {
            return this.currentUserId;
        }

        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                this.currentUserId = user.id || user.uid;
                console.log('[CacheManager] ✅ User ID obtido:', this.currentUserId);
                return this.currentUserId;
            } catch(e) {
                console.error('[CacheManager] ❌ Erro ao parsear usuário:', e);
            }
        }
        console.warn('[CacheManager] ⚠️ Nenhum usuário logado');
        return null;
    }

    get(key, defaultValue = null) {
        try {
            if (this._dataCache.has(key)) {
                return this._dataCache.get(key);
            }

            const userId = this.getCurrentUserId();
            if (!userId) {
                return defaultValue;
            }

            const storageKey = `${userId}_${key}`;
            const data = localStorage.getItem(storageKey);
            
            if (data === null) {
                const oldData = localStorage.getItem(key);
                if (oldData !== null) {
                    localStorage.setItem(storageKey, oldData);
                    localStorage.removeItem(key);
                    const parsed = JSON.parse(oldData);
                    this._dataCache.set(key, parsed);
                    return parsed;
                }
                return defaultValue;
            }
            
            const parsed = JSON.parse(data);
            this._dataCache.set(key, parsed);
            return parsed;
        } catch (error) {
            console.error(`[CacheManager] ❌ Erro ao get ${key}:`, error);
            return defaultValue;
        }
    }

    set(key, value, notify = true) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.warn('[CacheManager] ⚠️ Usuário não logado para set:', key);
            return false;
        }

        const flagKey = `${userId}_${key}`;
        if (this._savingFlags.get(flagKey)) {
            console.log('[CacheManager] ⏳ Já salvando:', key);
            return false;
        }

        try {
            const storageKey = `${userId}_${key}`;

            const currentData = localStorage.getItem(storageKey);
            if (currentData !== null) {
                try {
                    const parsed = JSON.parse(currentData);
                    if (JSON.stringify(parsed) === JSON.stringify(value)) {
                        console.log('[CacheManager] ℹ️ Dados já estão atualizados:', key);
                        return true;
                    }
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

            this._addToSaveQueue(key, value, userId);

            if (notify) {
                if (this.listeners.has(key)) {
                    this.listeners.get(key).forEach(cb => {
                        try { 
                            cb(value); 
                        } catch(e) { 
                            console.warn('[CacheManager] ⚠️ Erro no listener:', e); 
                        }
                    });
                }
                
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: value }));
                    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value } }));
                }, 50);
            }
            
            console.log(`[CacheManager] ✅ ${key} salvo localmente (${Array.isArray(value) ? value.length : Object.keys(value).length} itens)`);
            return true;
        } catch (error) {
            console.error(`[CacheManager] ❌ Erro ao set ${key}:`, error);
            return false;
        } finally {
            setTimeout(() => {
                this._savingFlags.delete(flagKey);
            }, 1000);
        }
    }

    _addToSaveQueue(key, value, userId) {
        this._saveQueue.push({ key, value, userId });
        console.log(`[CacheManager] 📋 ${key} adicionado à fila (${this._saveQueue.length} itens)`);
        this._processSaveQueue();
    }

    async _processSaveQueue() {
        if (this._isSaving || this._saveQueue.length === 0) {
            return;
        }
        
        this._isSaving = true;
        console.log(`[CacheManager] 🔄 Processando fila (${this._saveQueue.length} itens)...`);
        
        try {
            while (this._saveQueue.length > 0) {
                const item = this._saveQueue.shift();
                const userId = item.userId || this.getCurrentUserId();
                if (!userId) {
                    console.warn('[CacheManager] ❌ Sem userId para salvar:', item.key);
                    continue;
                }
                await this.saveToCloud(item.key, item.value, userId);
            }
        } catch (error) {
            console.error('[CacheManager] ❌ Erro ao processar fila:', error);
        } finally {
            this._isSaving = false;
            
            if (this._saveQueue.length > 0) {
                console.log('[CacheManager] 🔄 Novos itens na fila, continuando...');
                setTimeout(() => this._processSaveQueue(), 500);
            }
        }
    }

    async saveToCloud(key, value, userId) {
        if (!window.DatabaseService || !userId) {
            console.warn('[CacheManager] ⚠️ DatabaseService ou userId não disponível');
            return;
        }

        try {
            console.log(`[CacheManager] 💾 Salvando ${key} na nuvem...`);
            
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
                    console.log(`[CacheManager] ⚠️ Tipo não reconhecido: ${key}`);
                    return;
            }
            
            console.log(`[CacheManager] ✅ ${key} salvo na nuvem (${Array.isArray(value) ? value.length : Object.keys(value).length} itens)`);
        } catch (error) {
            console.error(`[CacheManager] ❌ Erro ao salvar ${key} na nuvem:`, error);
            this._addToSaveQueue(key, value, userId);
        }
    }

    addListener(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        console.log(`[CacheManager] 👂 Listener adicionado para ${key}`);
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
                console.log(`[CacheManager] 👂 Listener removido para ${key}`);
            }
        };
    }

    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) {
            console.warn('[CacheManager] ⚠️ Não foi possível carregar da nuvem');
            return false;
        }

        if (this.isLoading && !force) {
            console.log('[CacheManager] ⏳ Já carregando...');
            return false;
        }

        this.isLoading = true;
        console.log('[CacheManager] ☁️ Carregando dados da nuvem para:', userId);
        let hasChanges = false;

        try {
            const db = window.DatabaseService;
            
            const dataTypes = {
                tasks: db.getTasks.bind(db),
                notes: db.getNotes.bind(db),
                calendarEvents: db.getCalendarEvents.bind(db),
                weeklySchedule: db.getWeeklySchedule.bind(db),
                timeSlots: db.getTimeSlots.bind(db),
                notifications: db.getNotifications.bind(db),
                disciplinas: db.getDisciplinas.bind(db)
            };

            for (const [key, getter] of Object.entries(dataTypes)) {
                try {
                    console.log(`[CacheManager] 🔍 Buscando ${key}...`);
                    const data = await getter(userId);
                    if (data !== null && data !== undefined) {
                        const storageKey = `${userId}_${key}`;
                        const newDataStr = JSON.stringify(data);
                        const currentLocal = localStorage.getItem(storageKey);
                        
                        if (currentLocal !== newDataStr) {
                            localStorage.setItem(storageKey, newDataStr);
                            localStorage.setItem(key, newDataStr);
                            this._dataCache.set(key, data);
                            hasChanges = true;
                            
                            console.log(`[CacheManager] ✅ ${key} carregado da nuvem: ${Array.isArray(data) ? data.length : Object.keys(data).length} itens`);
                            
                            if (this.listeners.has(key)) {
                                this.listeners.get(key).forEach(cb => {
                                    try { 
                                        cb(data); 
                                    } catch(e) {
                                        console.warn('[CacheManager] ⚠️ Erro no listener:', e);
                                    }
                                });
                            }
                            
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: data }));
                                window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value: data } }));
                            }, 50);
                        }
                    }
                } catch (error) {
                    console.error(`[CacheManager] ❌ Erro ao carregar ${key}:`, error);
                }
            }

            if (hasChanges) {
                if (!this._eventTriggered) {
                    this._eventTriggered = true;
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                        console.log('[CacheManager] 📡 Evento cloudDataLoaded disparado');
                        this._eventTriggered = false;
                    }, 100);
                }
                console.log('[CacheManager] ✅ Dados carregados da nuvem!');
            } else {
                console.log('[CacheManager] ℹ️ Nenhum dado novo encontrado');
            }

            return hasChanges;
        } catch (error) {
            console.error('[CacheManager] ❌ Erro no loadFromCloud:', error);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    async forceSync() {
        console.log('[CacheManager] 🔄 Forçando sincronização...');
        return await this.loadFromCloud(true);
    }

    async logout() {
        console.log('[CacheManager] 🚪 Realizando logout...');
        if (window.RealtimeSyncManager) {
            window.RealtimeSyncManager.disconnect();
        }
        this.currentUserId = null;
        this.listeners.clear();
        this._savingFlags.clear();
        this._pendingSync.clear();
        this._profilePhotoCache = null;
        this._dataCache.clear();
        this._saveQueue = [];
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = null;
        }
        console.log('[CacheManager] ✅ Logout realizado');
    }

    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return null;
        }

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
            } catch(e) {
                console.warn('[CacheManager] ⚠️ Erro ao parsear usuário para foto:', e);
            }
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
                console.error('[CacheManager] ❌ Erro ao buscar foto do perfil:', error);
            }
        }

        return null;
    }

    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) {
            console.error('[CacheManager] ❌ uploadProfilePhoto: userId ou StorageService não disponível');
            return null;
        }

        if (!file || !file.type || !file.type.startsWith('image/')) {
            console.error('[CacheManager] ❌ Arquivo inválido:', file);
            return null;
        }

        try {
            console.log('[CacheManager] 📤 Fazendo upload da foto...');
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

                console.log('[CacheManager] ✅ Foto enviada com sucesso');
                return photoUrl;
            }

            return null;
        } catch (error) {
            console.error('[CacheManager] ❌ Erro no upload:', error);
            return null;
        }
    }

    async deleteProfilePhoto() {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) {
            return false;
        }

        console.log('[CacheManager] 🗑️ Deletando foto...');
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
            console.log('[CacheManager] ✅ Foto deletada com sucesso');
        }
        return result;
    }

    startRealtimeSync() {
        const userId = this.getCurrentUserId();
        if (userId && window.RealtimeSyncManager) {
            console.log('[CacheManager] 🔄 Iniciando Realtime Sync...');
            window.RealtimeSyncManager.init(userId);
        }
    }
}

// Instância global
if (typeof window.CacheManager === 'undefined') {
    window.CacheManager = new SimpleCacheManager();
    console.log('[CacheManager] ✅ Instância global criada');
}

// Funções globais para facilitar o uso
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

console.log('[CacheManager] ✅ CacheManager v3.0 carregado com sucesso!');
console.log('[CacheManager] 📌 Funções disponíveis:');
console.log('   - getCached(key, defaultValue)');
console.log('   - setCached(key, value, notify)');
console.log('   - forceSyncCloud()');
console.log('   - getTasks(), setTasks()');
console.log('   - getNotes(), setNotes()');
console.log('   - getDisciplinas(), setDisciplinas()');