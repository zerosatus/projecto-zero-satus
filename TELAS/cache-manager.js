// cache-manager.js - Versão Supabase COMPLETA COM PREVENÇÃO DE LOOP

class SupabaseCacheManager {
    constructor() {
        this.listeners = new Map();
        this.currentUserId = null;
        this._pendingSync = new Map();
        this.isLoading = false;
        this.isInitialized = false;
        this._savingFlags = new Map(); // ← PREVENÇÃO DE LOOP
        this._lastSyncTime = 0;
        this._syncDebounce = 2000; // 2 segundos entre sincronizações
    }

    init() {
        if (this.isInitialized) return;
        console.log('[CacheManager] Inicializado');
        this.isInitialized = true;
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
        // ✅ PREVENÇÃO DE LOOP - Se já está salvando este key, ignora
        const flagKey = `${this.getCurrentUserId()}_${key}`;
        if (this._savingFlags.get(flagKey)) {
            // console.log(`[CacheManager] Ignorando set ${key} (já em andamento)`);
            return false;
        }

        try {
            const userId = this.getCurrentUserId();
            if (!userId) return false;

            const storageKey = `${userId}_${key}`;

            // Verificar se o valor realmente mudou
            const currentData = localStorage.getItem(storageKey);
            if (currentData !== null) {
                try {
                    const parsed = JSON.parse(currentData);
                    if (JSON.stringify(parsed) === JSON.stringify(value)) {
                        // Dados idênticos, não precisa salvar
                        return true;
                    }
                } catch(e) {}
            }

            // ✅ MARCAR COMO SALVANDO
            this._savingFlags.set(flagKey, true);

            localStorage.setItem(storageKey, JSON.stringify(value));

            // ✅ SALVAR NA NUVEM COM DEBOUNCE
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
            // ✅ LIMPAR FLAG APÓS 1 SEGUNDO
            setTimeout(() => {
                this._savingFlags.delete(flagKey);
            }, 1000);
        }
    }

    // ✅ DEBOUNCE PARA SALVAR NA NUVEM
    _scheduleCloudSave(key, value, userId) {
        const pendingKey = `${userId}_${key}`;

        if (this._pendingSync.has(pendingKey)) {
            clearTimeout(this._pendingSync.get(pendingKey));
        }

        const timeout = setTimeout(async () => {
            this._pendingSync.delete(pendingKey);

            // Verificar se o valor ainda é o mesmo
            const currentValue = this.get(key, null);
            if (currentValue === null) return;

            if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
                // Valor mudou, salvar o atual
                await this.saveToCloud(key, currentValue, userId);
            } else {
                await this.saveToCloud(key, value, userId);
            }
        }, 1500);

        this._pendingSync.set(pendingKey, timeout);
    }

    async saveToCloud(key, value, userId) {
        if (!window.DatabaseService || !userId) return;

        // ✅ PREVENIR SALVAMENTOS MÚLTIPLOS
        const now = Date.now();
        if (now - this._lastSyncTime < this._syncDebounce) {
            // console.log(`[CacheManager] Debounce para ${key}`);
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
            // console.log(`[CacheManager] Dados ${key} salvos na nuvem`);
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

            // DISCIPLINAS
            if (typeof db.getDisciplinas === 'function') {
                const disciplinas = await db.getDisciplinas(userId);
                if (disciplinas && disciplinas.length > 0) {
                    localStorage.setItem(`${userId}_disciplinas`, JSON.stringify(disciplinas));
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                this._reloadFromStorage(userId);
                console.log('[CacheManager] ✅ Dados carregados da nuvem e salvos localmente!');

                // ✅ DISPARAR EVENTO APENAS UMA VEZ
                if (!this._eventTriggered) {
                    this._eventTriggered = true;
                    window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                    setTimeout(() => {
                        this._eventTriggered = false;
                    }, 5000);
                }
            } else {
                console.log('[CacheManager] Nenhum dado novo encontrado na nuvem');
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
                    // Salvar no cache interno sem notificar
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
        console.log('[CacheManager] Logout realizado');
    }

    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) return null;

        const profile = await window.DatabaseService.getUserProfile(userId);
        return profile?.avatar_url || null;
    }

    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) return null;

        if (!file || !file.type || !file.type.startsWith('image/')) {
            console.error('[CacheManager] Arquivo inválido:', file);
            return null;
        }

        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            if (!base64 || !base64.startsWith('data:')) {
                console.error('[CacheManager] Falha ao converter para base64');
                return null;
            }

            const photoUrl = await window.StorageService.uploadProfilePhoto(userId, file);
            const finalUrl = photoUrl || base64;

            const profile = await window.DatabaseService.getUserProfile(userId);
            if (profile) {
                await window.DatabaseService.updateUserProfile(userId, {
                    ...profile,
                    avatar_url: finalUrl
                });
            }

            window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
                detail: { photoUrl: finalUrl }
            }));

            return finalUrl;
        } catch (error) {
            console.error('[CacheManager] Erro no upload:', error);
            return null;
        }
    }

    async deleteProfilePhoto() {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) return false;
        return await window.StorageService.deleteProfilePhoto(userId);
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

console.log('[CacheManager] Supabase v2.2 carregado! (com prevenção de loop)');