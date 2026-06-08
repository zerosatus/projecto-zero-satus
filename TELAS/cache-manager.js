// cache-manager.js - VERSÃO FIRESTORE COMPLETA CORRIGIDA
class CacheManager {
    constructor() {
        this.listeners = new Map();
        this.cacheVersion = 'v3-firestore';
        this.isInitialized = false;
        this.currentUserId = null;
        this._unsubscribe = null;
        this._syncTimeout = null;
    }

    init() {
        if (this.isInitialized) return;
        
        window.addEventListener('storage', (e) => {
            if (e.key && this.listeners.has(e.key)) {
                try {
                    const newData = e.newValue ? JSON.parse(e.newValue) : null;
                    this.listeners.get(e.key).forEach(cb => cb(newData));
                } catch(e) {}
            }
        });
        
        this.isInitialized = true;
        console.log('[CacheManager] Firestore v3 inicializado');
    }

    getCurrentUserId() {
        if (!this.currentUserId) {
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    const user = JSON.parse(usuario);
                    this.currentUserId = user.uid || user.email || 'default';
                } catch(e) {}
            }
        }
        return this.currentUserId || 'default';
    }

    getStorageKey(key) {
        return `${this.getCurrentUserId()}_${key}`;
    }

    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.getStorageKey(key));
            return data === null ? defaultValue : JSON.parse(data);
        } catch (error) {
            return defaultValue;
        }
    }

    set(key, value, notify = true) {
        try {
            localStorage.setItem(this.getStorageKey(key), JSON.stringify(value));
            
            if (notify && this.listeners.has(key)) {
                this.listeners.get(key).forEach(cb => cb(value));
            }
            
            clearTimeout(this._syncTimeout);
            this._syncTimeout = setTimeout(() => this.syncToFirestore(key, value), 500);
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async syncToFirestore(key, value) {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default' || !window.FirestoreService) return;
        
        try {
            switch(key) {
                case 'tasks':
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            if (item.id) {
                                await window.FirestoreService.saveTask(userId, item.id, item);
                            }
                        }
                    }
                    break;
                case 'notes':
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            if (item.id) {
                                await window.FirestoreService.saveNote(userId, item.id, item);
                            }
                        }
                    }
                    break;
                case 'calendarEvents':
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            if (item.id) {
                                await window.FirestoreService.saveCalendarEvent(userId, item.id, item);
                            }
                        }
                    }
                    break;
                case 'weeklySchedule':
                    await window.FirestoreService.saveWeeklySchedule(userId, value);
                    break;
                case 'timeSlots':
                    await window.FirestoreService.saveTimeSlots(userId, value);
                    break;
                default:
                    console.log(`[CacheManager] Sincronizando ${key}...`);
            }
        } catch (error) {
            console.error(`[CacheManager] Erro ao sincronizar ${key}:`, error);
        }
    }
    
    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default' || !window.FirestoreService) return false;
        
        try {
            // Carregar tarefas
            const tasks = await window.FirestoreService.getTasks(userId);
            if (tasks.length) {
                localStorage.setItem(this.getStorageKey('tasks'), JSON.stringify(tasks));
                console.log('[CacheManager] Tasks carregadas:', tasks.length);
            }
            
            // Carregar anotações
            const notes = await window.FirestoreService.getNotes(userId);
            if (notes.length) {
                localStorage.setItem(this.getStorageKey('notes'), JSON.stringify(notes));
                console.log('[CacheManager] Notes carregadas:', notes.length);
            }
            
            // Carregar eventos do calendário
            const events = await window.FirestoreService.getCalendarEvents(userId);
            if (events.length) {
                localStorage.setItem(this.getStorageKey('calendarEvents'), JSON.stringify(events));
                console.log('[CacheManager] Events carregados:', events.length);
            }
            
            // Carregar horário semanal
            const schedule = await window.FirestoreService.getWeeklySchedule(userId);
            if (schedule) {
                localStorage.setItem(this.getStorageKey('weeklySchedule'), JSON.stringify(schedule));
                console.log('[CacheManager] WeeklySchedule carregado');
            }
            
            // Carregar time slots
            const slots = await window.FirestoreService.getTimeSlots(userId);
            if (slots) {
                localStorage.setItem(this.getStorageKey('timeSlots'), JSON.stringify(slots));
                console.log('[CacheManager] TimeSlots carregados:', slots.length);
            }
            
            // Carregar notificações
            const notifications = await window.FirestoreService.getNotifications(userId);
            if (notifications.length) {
                localStorage.setItem(this.getStorageKey('notifications'), JSON.stringify(notifications));
                console.log('[CacheManager] Notifications carregadas:', notifications.length);
            }
            
            // Carregar configurações (se disponível)
            if (typeof window.FirestoreService.getSettings === 'function') {
                try {
                    const settings = await window.FirestoreService.getSettings(userId);
                    if (settings) {
                        if (settings.notifications) {
                            localStorage.setItem(this.getStorageKey('notificacoesSettings'), JSON.stringify(settings.notifications));
                        }
                        if (settings.appearance) {
                            localStorage.setItem(this.getStorageKey('appearanceSettings'), JSON.stringify(settings.appearance));
                        }
                        console.log('[CacheManager] Settings carregados');
                    }
                } catch(e) {
                    console.warn('[CacheManager] Erro ao carregar settings:', e);
                }
            }
            
            window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
            return true;
        } catch (error) {
            console.error('[CacheManager] Erro no loadFromCloud:', error);
            return false;
        }
    }
    
    startRealtimeSync() {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') return;
        if (this._unsubscribe) return;
        
        if (window.FirestoreService && typeof window.FirestoreService.listenToUserData === 'function') {
            this._unsubscribe = window.FirestoreService.listenToUserData(userId, (data) => {
                // Atualizar tarefas
                if (data.tasks) {
                    const currentTasks = this.get('tasks', []);
                    if (JSON.stringify(currentTasks) !== JSON.stringify(data.tasks)) {
                        localStorage.setItem(this.getStorageKey('tasks'), JSON.stringify(data.tasks));
                        if (this.listeners.has('tasks')) {
                            this.listeners.get('tasks').forEach(cb => cb(data.tasks));
                        }
                        console.log('[CacheManager] Tasks atualizadas em tempo real');
                    }
                }
                
                // Atualizar anotações
                if (data.notes) {
                    const currentNotes = this.get('notes', []);
                    if (JSON.stringify(currentNotes) !== JSON.stringify(data.notes)) {
                        localStorage.setItem(this.getStorageKey('notes'), JSON.stringify(data.notes));
                        if (this.listeners.has('notes')) {
                            this.listeners.get('notes').forEach(cb => cb(data.notes));
                        }
                        console.log('[CacheManager] Notes atualizadas em tempo real');
                    }
                }
                
                // Atualizar eventos
                if (data.calendarEvents) {
                    const currentEvents = this.get('calendarEvents', []);
                    if (JSON.stringify(currentEvents) !== JSON.stringify(data.calendarEvents)) {
                        localStorage.setItem(this.getStorageKey('calendarEvents'), JSON.stringify(data.calendarEvents));
                        if (this.listeners.has('calendarEvents')) {
                            this.listeners.get('calendarEvents').forEach(cb => cb(data.calendarEvents));
                        }
                        console.log('[CacheManager] CalendarEvents atualizados em tempo real');
                    }
                }
                
                // Atualizar horário semanal
                if (data.weeklySchedule) {
                    const currentSchedule = this.get('weeklySchedule', {});
                    if (JSON.stringify(currentSchedule) !== JSON.stringify(data.weeklySchedule)) {
                        localStorage.setItem(this.getStorageKey('weeklySchedule'), JSON.stringify(data.weeklySchedule));
                        if (this.listeners.has('weeklySchedule')) {
                            this.listeners.get('weeklySchedule').forEach(cb => cb(data.weeklySchedule));
                        }
                        console.log('[CacheManager] WeeklySchedule atualizado em tempo real');
                    }
                }
                
                window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
            });
            console.log('[CacheManager] Sincronização em tempo real iniciada');
        }
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
    
    isUserLoggedIn() { 
        return this.getCurrentUserId() !== 'default'; 
    }
    
    async forceSync() { 
        return await this.loadFromCloud(true); 
    }
    
    async afterLogin() {
        this.currentUserId = null;
        const userId = this.getCurrentUserId();
        if (userId && userId !== 'default') {
            await this.loadFromCloud(true);
            this.startRealtimeSync();
            return true;
        }
        return false;
    }
    
    async logout() {
        if (this._unsubscribe) { 
            this._unsubscribe(); 
            this._unsubscribe = null; 
        }
        this.currentUserId = null;
        console.log('[CacheManager] Logout realizado');
    }
    
    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') return null;
        if (window.FirebaseStorage) {
            return await window.FirebaseStorage.uploadProfilePhoto(userId, file);
        }
        return null;
    }
    
    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') return null;
        if (window.FirebaseStorage) {
            return await window.FirebaseStorage.getProfilePhotoUrl(userId);
        }
        return null;
    }
    
    async deleteProfilePhoto() {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') return false;
        if (window.FirebaseStorage) {
            return await window.FirebaseStorage.deleteProfilePhoto(userId);
        }
        return false;
    }
    
    // Método para limpar todo o cache do usuário
    clearAllCache() {
        const userId = this.getCurrentUserId();
        if (userId && userId !== 'default') {
            const keys = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'notificacoesSettings', 'appearanceSettings'];
            keys.forEach(key => {
                localStorage.removeItem(this.getStorageKey(key));
            });
            console.log('[CacheManager] Cache limpo para usuário:', userId);
        }
    }
}

// Instância global
window.CacheManager = new CacheManager();

// ============================================
// FUNÇÕES GLOBAIS DE ACESSO RÁPIDO
// ============================================

window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.forceSyncCloud = () => window.CacheManager.forceSync();

// Funções específicas por tipo de dado
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

window.getNotificacoesSettings = () => window.CacheManager.get('notificacoesSettings', { push: true, email: false, aulas: true, tarefas: true });
window.setNotificacoesSettings = (settings, notify) => window.CacheManager.set('notificacoesSettings', settings, notify);

window.getAppearanceSettings = () => window.CacheManager.get('appearanceSettings', { theme: 'dark', accent: '#8b5cf6', fontSize: 14 });
window.setAppearanceSettings = (settings, notify) => window.CacheManager.set('appearanceSettings', settings, notify);

// Foto de perfil
window.uploadProfilePhoto = (file) => window.CacheManager.uploadProfilePhoto(file);
window.getProfilePhotoUrl = () => window.CacheManager.getProfilePhotoUrl();
window.deleteProfilePhoto = () => window.CacheManager.deleteProfilePhoto();

console.log('[CacheManager] Firestore v3 carregado com correções!');
// Adicione esta função no final do arquivo cache-manager.js

// Função para debug da sincronização
window.debugSync = async function() {
    console.log('===== DEBUG SINCRONIZAÇÃO =====');
    console.log('Usuario logado:', localStorage.getItem('usuarioLogado'));
    console.log('CacheManager.currentUserId:', window.CacheManager?.currentUserId);
    console.log('FirestoreService disponível:', !!window.FirestoreService);
    
    if (window.CacheManager) {
        const notes = window.CacheManager.get('notes', []);
        const tasks = window.CacheManager.get('tasks', []);
        console.log('Notes no cache:', notes.length);
        console.log('Tasks no cache:', tasks.length);
        
        // Tentar forçar sincronização
        console.log('Forçando sincronização...');
        await window.CacheManager.forceSync();
        console.log('Sincronização forçada concluída');
    }
    console.log('===============================');
};