// cache-manager.js - VERSÃO FIRESTORE COMPLETA CORRIGIDA
class CacheManager {
    constructor() {
        this.listeners = new Map();
        this.cacheVersion = 'v3-firestore';
        this.isInitialized = false;
        this.currentUserId = null;
        this.currentUserEmail = null;
        this._unsubscribe = null;
        this._syncTimeout = null;
        this._pendingSync = new Map();
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
        // PRIORIZAR O UID DO FIREBASE AUTH
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            const uid = window.firebaseAuth.currentUser.uid;
            if (uid) {
                this.currentUserId = uid;
                console.log('[CacheManager] User ID do Firebase Auth:', uid);
                return uid;
            }
        }
        
        if (window.FirestoreService && window.FirestoreService.getCurrentUser) {
            const user = window.FirestoreService.getCurrentUser();
            if (user && user.uid) {
                this.currentUserId = user.uid;
                return user.uid;
            }
        }
        
        if (!this.currentUserId) {
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    const user = JSON.parse(usuario);
                    this.currentUserId = user.uid || user.email || 'default';
                    console.log('[CacheManager] User ID do localStorage:', this.currentUserId);
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
            const storageKey = this.getStorageKey(key);
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
            const storageKey = this.getStorageKey(key);
            const oldValue = this.get(key, null);
            
            if (JSON.stringify(oldValue) === JSON.stringify(value)) {
                return true;
            }
            
            localStorage.setItem(storageKey, JSON.stringify(value));
            
            if (notify && this.listeners.has(key)) {
                this.listeners.get(key).forEach(cb => cb(value));
            }
            
            if (this._pendingSync.has(key)) {
                clearTimeout(this._pendingSync.get(key));
            }
            
            const timeoutId = setTimeout(() => {
                this.syncToFirestore(key, value);
                this._pendingSync.delete(key);
            }, 500);
            
            this._pendingSync.set(key, timeoutId);
            
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao set ${key}:`, error);
            return false;
        }
    }
    
    async syncToFirestore(key, value) {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default' || !window.FirestoreService) {
            console.log(`[CacheManager] Não foi possível sincronizar ${key}: usuário não logado ou FirestoreService indisponível`);
            return;
        }
        
        try {
            console.log(`[CacheManager] Sincronizando ${key} para o Firestore...`);
            
            switch(key) {
                case 'tasks':
                    if (Array.isArray(value)) {
                        const existingTasks = await window.FirestoreService.getTasks(userId);
                        const existingIds = new Set(existingTasks.map(t => t.id));
                        const newIds = new Set(value.map(t => t.id));
                        
                        for (const existingId of existingIds) {
                            if (!newIds.has(existingId)) {
                                await window.FirestoreService.deleteTask(userId, existingId);
                                console.log(`[CacheManager] Task ${existingId} removida`);
                            }
                        }
                        
                        for (const item of value) {
                            if (item && item.id) {
                                await window.FirestoreService.saveTask(userId, item.id, item);
                            }
                        }
                    }
                    break;
                case 'notes':
                    if (Array.isArray(value)) {
                        const existingNotes = await window.FirestoreService.getNotes(userId);
                        const existingIds = new Set(existingNotes.map(n => n.id));
                        const newIds = new Set(value.map(n => n.id));
                        
                        for (const existingId of existingIds) {
                            if (!newIds.has(existingId)) {
                                await window.FirestoreService.deleteNote(userId, existingId);
                                console.log(`[CacheManager] Note ${existingId} removida`);
                            }
                        }
                        
                        for (const item of value) {
                            if (item && item.id) {
                                await window.FirestoreService.saveNote(userId, item.id, item);
                            }
                        }
                    }
                    break;
                case 'calendarEvents':
                    if (Array.isArray(value)) {
                        const existingEvents = await window.FirestoreService.getCalendarEvents(userId);
                        const existingIds = new Set(existingEvents.map(e => e.id));
                        const newIds = new Set(value.map(e => e.id));
                        
                        for (const existingId of existingIds) {
                            if (!newIds.has(existingId)) {
                                await window.FirestoreService.deleteCalendarEvent(userId, existingId);
                            }
                        }
                        
                        for (const item of value) {
                            if (item && item.id) {
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
                case 'notifications':
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            if (item && item.id) {
                                await window.FirestoreService.saveNotification(userId, item.id, item);
                            }
                        }
                    }
                    break;
                default:
                    console.log(`[CacheManager] Sincronizando ${key}...`);
            }
            
            console.log(`[CacheManager] ✅ ${key} sincronizado com sucesso!`);
        } catch (error) {
            console.error(`[CacheManager] Erro ao sincronizar ${key}:`, error);
        }
    }
    
    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default' || !window.FirestoreService) {
            console.log('[CacheManager] Não foi possível carregar da nuvem: usuário não logado');
            return false;
        }
        
        try {
            console.log('[CacheManager] ☁️ Carregando dados da nuvem...');
            let hasChanges = false;
            
            const tasks = await window.FirestoreService.getTasks(userId);
            if (tasks && Array.isArray(tasks)) {
                const currentTasks = this.get('tasks', []);
                if (JSON.stringify(currentTasks) !== JSON.stringify(tasks)) {
                    localStorage.setItem(this.getStorageKey('tasks'), JSON.stringify(tasks));
                    hasChanges = true;
                    console.log('[CacheManager] Tasks carregadas:', tasks.length);
                }
            }
            
            const notes = await window.FirestoreService.getNotes(userId);
            if (notes && Array.isArray(notes)) {
                const currentNotes = this.get('notes', []);
                if (JSON.stringify(currentNotes) !== JSON.stringify(notes)) {
                    localStorage.setItem(this.getStorageKey('notes'), JSON.stringify(notes));
                    hasChanges = true;
                    console.log('[CacheManager] Notes carregadas:', notes.length);
                }
            }
            
            const events = await window.FirestoreService.getCalendarEvents(userId);
            if (events && Array.isArray(events)) {
                const currentEvents = this.get('calendarEvents', []);
                if (JSON.stringify(currentEvents) !== JSON.stringify(events)) {
                    localStorage.setItem(this.getStorageKey('calendarEvents'), JSON.stringify(events));
                    hasChanges = true;
                    console.log('[CacheManager] Events carregados:', events.length);
                }
            }
            
            const schedule = await window.FirestoreService.getWeeklySchedule(userId);
            if (schedule) {
                const currentSchedule = this.get('weeklySchedule', {});
                if (JSON.stringify(currentSchedule) !== JSON.stringify(schedule)) {
                    localStorage.setItem(this.getStorageKey('weeklySchedule'), JSON.stringify(schedule));
                    hasChanges = true;
                    console.log('[CacheManager] WeeklySchedule carregado');
                }
            }
            
            const slots = await window.FirestoreService.getTimeSlots(userId);
            if (slots && Array.isArray(slots)) {
                const currentSlots = this.get('timeSlots', []);
                if (JSON.stringify(currentSlots) !== JSON.stringify(slots)) {
                    localStorage.setItem(this.getStorageKey('timeSlots'), JSON.stringify(slots));
                    hasChanges = true;
                    console.log('[CacheManager] TimeSlots carregados:', slots.length);
                }
            }
            
            const notifications = await window.FirestoreService.getNotifications(userId);
            if (notifications && Array.isArray(notifications)) {
                const currentNotif = this.get('notifications', []);
                if (JSON.stringify(currentNotif) !== JSON.stringify(notifications)) {
                    localStorage.setItem(this.getStorageKey('notifications'), JSON.stringify(notifications));
                    hasChanges = true;
                    console.log('[CacheManager] Notifications carregadas:', notifications.length);
                }
            }
            
            if (hasChanges) {
                console.log('[CacheManager] 📢 Disparando cloudDataLoaded...');
                window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
            }
            
            return true;
        } catch (error) {
            console.error('[CacheManager] Erro no loadFromCloud:', error);
            return false;
        }
    }
    
    startRealtimeSync() {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') {
            console.log('[CacheManager] Não foi iniciar sync: usuário não logado');
            return;
        }
        if (this._unsubscribe) return;
        
        if (window.FirestoreService && typeof window.FirestoreService.listenToUserData === 'function') {
            console.log('[CacheManager] 🔄 Iniciando escuta em tempo real...');
            
            this._unsubscribe = window.FirestoreService.listenToUserData(userId, (data) => {
                let hasChanges = false;
                
                if (data.tasks && Array.isArray(data.tasks)) {
                    const currentTasks = this.get('tasks', []);
                    if (JSON.stringify(currentTasks) !== JSON.stringify(data.tasks)) {
                        localStorage.setItem(this.getStorageKey('tasks'), JSON.stringify(data.tasks));
                        if (this.listeners.has('tasks')) {
                            this.listeners.get('tasks').forEach(cb => cb(data.tasks));
                        }
                        hasChanges = true;
                        console.log('[CacheManager] Tasks atualizadas em tempo real:', data.tasks.length);
                    }
                }
                
                if (data.notes && Array.isArray(data.notes)) {
                    const currentNotes = this.get('notes', []);
                    if (JSON.stringify(currentNotes) !== JSON.stringify(data.notes)) {
                        localStorage.setItem(this.getStorageKey('notes'), JSON.stringify(data.notes));
                        if (this.listeners.has('notes')) {
                            this.listeners.get('notes').forEach(cb => cb(data.notes));
                        }
                        hasChanges = true;
                        console.log('[CacheManager] Notes atualizadas em tempo real:', data.notes.length);
                    }
                }
                
                if (data.calendarEvents && Array.isArray(data.calendarEvents)) {
                    const currentEvents = this.get('calendarEvents', []);
                    if (JSON.stringify(currentEvents) !== JSON.stringify(data.calendarEvents)) {
                        localStorage.setItem(this.getStorageKey('calendarEvents'), JSON.stringify(data.calendarEvents));
                        if (this.listeners.has('calendarEvents')) {
                            this.listeners.get('calendarEvents').forEach(cb => cb(data.calendarEvents));
                        }
                        hasChanges = true;
                        console.log('[CacheManager] CalendarEvents atualizados em tempo real:', data.calendarEvents.length);
                    }
                }
                
                if (data.weeklySchedule) {
                    const currentSchedule = this.get('weeklySchedule', {});
                    if (JSON.stringify(currentSchedule) !== JSON.stringify(data.weeklySchedule)) {
                        localStorage.setItem(this.getStorageKey('weeklySchedule'), JSON.stringify(data.weeklySchedule));
                        if (this.listeners.has('weeklySchedule')) {
                            this.listeners.get('weeklySchedule').forEach(cb => cb(data.weeklySchedule));
                        }
                        hasChanges = true;
                        console.log('[CacheManager] WeeklySchedule atualizado em tempo real');
                    }
                }
                
                if (hasChanges) {
                    window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
                }
            });
            console.log('[CacheManager] ✅ Sincronização em tempo real iniciada');
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
        console.log('[CacheManager] Forçando sincronização manual...');
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
        this.currentUserEmail = null;
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

// FUNÇÕES GLOBAIS DE ACESSO RÁPIDO
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

window.getNotificacoesSettings = () => window.CacheManager.get('notificacoesSettings', { push: true, email: false, aulas: true, tarefas: true });
window.setNotificacoesSettings = (settings, notify) => window.CacheManager.set('notificacoesSettings', settings, notify);

window.getAppearanceSettings = () => window.CacheManager.get('appearanceSettings', { theme: 'dark', accent: '#8b5cf6', fontSize: 14 });
window.setAppearanceSettings = (settings, notify) => window.CacheManager.set('appearanceSettings', settings, notify);

window.uploadProfilePhoto = (file) => window.CacheManager.uploadProfilePhoto(file);
window.getProfilePhotoUrl = () => window.CacheManager.getProfilePhotoUrl();
window.deleteProfilePhoto = () => window.CacheManager.deleteProfilePhoto();

window.debugSync = async function() {
    console.log('===== DEBUG SINCRONIZAÇÃO =====');
    console.log('Usuario logado:', localStorage.getItem('usuarioLogado'));
    console.log('CacheManager.currentUserId:', window.CacheManager?.currentUserId);
    console.log('FirestoreService disponível:', !!window.FirestoreService);
    console.log('Firebase Auth currentUser:', window.firebaseAuth?.currentUser?.email);
    
    if (window.CacheManager) {
        const notes = window.CacheManager.get('notes', []);
        const tasks = window.CacheManager.get('tasks', []);
        console.log('Notes no cache:', notes.length);
        console.log('Tasks no cache:', tasks.length);
        
        console.log('Forçando sincronização...');
        await window.CacheManager.forceSync();
        console.log('Sincronização forçada concluída');
    }
    console.log('===============================');
};

console.log('[CacheManager] Firestore v3 carregado com correções!');