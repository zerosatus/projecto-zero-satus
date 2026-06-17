// cache-manager.js - Versão Supabase COMPLETA E CORRIGIDA

class SupabaseCacheManager {
    constructor() {
        this.listeners = new Map();
        this.currentUserId = null;
        this._pendingSync = new Map();
        this.isLoading = false;
        this.isInitialized = false;
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
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return false;

            const storageKey = `${userId}_${key}`;
            localStorage.setItem(storageKey, JSON.stringify(value));

            this.saveToCloud(key, value, userId);

            if (notify && this.listeners.has(key)) {
                this.listeners.get(key).forEach(cb => cb(value));
            }
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao set ${key}:`, error);
            return false;
        }
    }

    async saveToCloud(key, value, userId) {
        if (!window.DatabaseService || !userId) return;

        try {
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
            console.log(`[CacheManager] Dados ${key} salvos na nuvem`);
        } catch (error) {
            console.error(`[CacheManager] Erro ao salvar ${key} na nuvem:`, error);
        }
    }

    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) return false;

        if (this.isLoading && !force) {
            console.log('[CacheManager] Já carregando...');
            return false;
        }

        this.isLoading = true;
        console.log('[CacheManager] ☁️ Carregando dados da nuvem para:', userId);
        let hasChanges = false;

        try {
            const tasks = await window.DatabaseService.getTasks(userId);
            if (tasks) {
                localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
                hasChanges = true;
            }

            const notes = await window.DatabaseService.getNotes(userId);
            if (notes) {
                localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
                hasChanges = true;
            }

            const events = await window.DatabaseService.getCalendarEvents(userId);
            if (events) {
                localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(events));
                hasChanges = true;
            }

            const schedule = await window.DatabaseService.getWeeklySchedule(userId);
            if (schedule) {
                localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(schedule));
                hasChanges = true;
            }

            const slots = await window.DatabaseService.getTimeSlots(userId);
            if (slots) {
                localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(slots));
                hasChanges = true;
            }

            const notif = await window.DatabaseService.getNotifications(userId);
            if (notif) {
                localStorage.setItem(`${userId}_notifications`, JSON.stringify(notif));
                hasChanges = true;
            }

            const disciplinas = await window.DatabaseService.getDisciplinas(userId);
            if (disciplinas) {
                localStorage.setItem(`${userId}_disciplinas`, JSON.stringify(disciplinas));
                hasChanges = true;
            }

            if (hasChanges) {
                console.log('[CacheManager] Dados carregados da nuvem!');
                window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
            }
            return true;
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
        console.log('[CacheManager] Logout realizado');
    }

    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) return null;

        const profile = await window.DatabaseService.getUserProfile(userId);
        return profile?.avatar_url || null;
    }

    // 🔥 CORRIGIDO: uploadProfilePhoto com validação
    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) return null;

        if (!file || !file.type || !file.type.startsWith('image/')) {
            console.error('[CacheManager] Arquivo inválido:', file);
            return null;
        }

        try {
            // Primeiro, converter para base64 localmente (fallback)
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

            // Tenta fazer upload para o Storage
            const photoUrl = await window.StorageService.uploadProfilePhoto(userId, file);

            // Se o upload falhar, usa o base64 local
            const finalUrl = photoUrl || base64;

            // Salva no perfil
            const profile = await window.DatabaseService.getUserProfile(userId);
            if (profile) {
                await window.DatabaseService.updateUserProfile(userId, {
                    ...profile,
                    avatar_url: finalUrl
                });
            }

            // Disparar evento de atualização
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

console.log('[CacheManager] Supabase v2 carregado!');