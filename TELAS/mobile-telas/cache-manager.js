// cache-manager.js - Versão Supabase
class SupabaseCacheManager {
    constructor() {
        this.listeners = new Map();
        this.currentUserId = null;
        this._pendingSync = new Map();
    }
    
    init() {
        console.log('[CacheManager] Supabase v1 inicializado');
    }
    
    getCurrentUserId() {
        if (this.currentUserId) return this.currentUserId;
        
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                this.currentUserId = user.id;
                return user.id;
            } catch(e) {}
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
            
            if (notify && this.listeners.has(key)) {
                this.listeners.get(key).forEach(cb => cb(value));
            }
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao set ${key}:`, error);
            return false;
        }
    }
    
    async loadFromCloud() {
        const userId = this.getCurrentUserId();
        if (!userId || !window.DatabaseService) return false;
        
        console.log('[CacheManager] ☁️ Carregando dados da nuvem...');
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
            
            if (hasChanges) {
                window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
            }
            return true;
        } catch (error) {
            console.error('[CacheManager] Erro no loadFromCloud:', error);
            return false;
        }
    }
    
    async forceSync() {
        return await this.loadFromCloud();
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
        this.currentUserId = null;
        this.listeners.clear();
        console.log('[CacheManager] Logout realizado');
    }
    
    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;
        if (window.DatabaseService) {
            const profile = await window.DatabaseService.getUserProfile(userId);
            return profile?.avatar_url || null;
        }
        return null;
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
}

// Instância global (APENAS UMA VEZ)
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

console.log('[CacheManager] Supabase v1 carregado!');