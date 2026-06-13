// cache-manager.js - Versão Supabase COMPLETA E CORRIGIDA

class SupabaseCacheManager {
    constructor() {
        this.listeners = new Map();
        this.currentUserId = null;
        this._pendingSync = new Map();
        this.isLoading = false;
    }
    
    init() {
        console.log('[CacheManager] Inicializado');
    }
    
    getCurrentUserId() {
        if (this.currentUserId) return this.currentUserId;
        
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                // Usar o ID do Supabase (UUID) que vem do login
                this.currentUserId = user.id;
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
            
            // Salvar no Supabase
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
            if (tasks && tasks.length > 0) {
                localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
                hasChanges = true;
            }
            
            const notes = await window.DatabaseService.getNotes(userId);
            if (notes && notes.length > 0) {
                localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
                hasChanges = true;
            }
            
            const events = await window.DatabaseService.getCalendarEvents(userId);
            if (events && events.length > 0) {
                localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(events));
                hasChanges = true;
            }
            
            const schedule = await window.DatabaseService.getWeeklySchedule(userId);
            if (schedule && Object.keys(schedule).length > 0) {
                localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(schedule));
                hasChanges = true;
            }
            
            const slots = await window.DatabaseService.getTimeSlots(userId);
            if (slots && slots.length > 0) {
                localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(slots));
                hasChanges = true;
            }
            
            const notif = await window.DatabaseService.getNotifications(userId);
            if (notif && notif.length > 0) {
                localStorage.setItem(`${userId}_notifications`, JSON.stringify(notif));
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
    
    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId || !window.StorageService) return null;
        return await window.StorageService.uploadProfilePhoto(userId, file);
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

window.getTimeSlots = () => window.CacheManager.get('timeSlots', ['08:00', '09:30', '11:00', '14:00', '15:30']);
window.setTimeSlots = (slots, notify) => window.CacheManager.set('timeSlots', slots, notify);

window.getNotifications = () => window.CacheManager.get('notifications', []);
window.setNotifications = (notifications, notify) => window.CacheManager.set('notifications', notifications, notify);

console.log('[CacheManager] Supabase v2 carregado!');