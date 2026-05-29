// Sistema centralizado de gerenciamento de cache com suporte a nuvem e sincronização bidirecional
class CacheManager {
    constructor() {
        this.listeners = new Map();
        this.cacheVersion = 'v7';
        this.isInitialized = false;
        this.currentUserId = null;
        this.isSyncing = false;
        this.syncCallbacks = [];
        this.pendingCloudLoad = null;
        this.cloudListener = null;
    }

    init() {
        if (this.isInitialized) return;
        this.checkAndClearOldCache();
        
        window.addEventListener('storage', (e) => {
            if (e.key && this.listeners.has(e.key)) {
                const callbacks = this.listeners.get(e.key);
                let newData = null;
                try {
                    newData = e.newValue ? JSON.parse(e.newValue) : null;
                } catch (error) {
                    newData = e.newValue;
                }
                callbacks.forEach(cb => cb(newData));
            }
        });
        
        window.addEventListener('cloudDataLoaded', (event) => {
            console.log('[CacheManager] Dados carregados da nuvem, atualizando UI');
            this.notifyAllListeners(event.detail);
        });
        
        this.isInitialized = true;
        console.log('[CacheManager] Inicializado v7');
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
        const userId = this.getCurrentUserId();
        return `${userId}_${key}`;
    }

    checkAndClearOldCache() {
        const currentVersion = localStorage.getItem('cache_version');
        if (currentVersion !== this.cacheVersion) {
            localStorage.setItem('cache_version', this.cacheVersion);
            console.log('[CacheManager] Versão do cache atualizada para', this.cacheVersion);
        }
    }

    clearAllCache() {
        const userId = this.getCurrentUserId();
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${userId}_`)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        this.listeners.forEach((callbacks) => {
            callbacks.forEach(cb => cb(null));
        });
        console.log('[CacheManager] Cache do usuário limpo');
    }

    get(key, defaultValue = null) {
        try {
            const storageKey = this.getStorageKey(key);
            const data = localStorage.getItem(storageKey);
            if (data === null) return defaultValue;
            return JSON.parse(data);
        } catch (error) {
            console.error(`[CacheManager] Erro ao obter ${key}:`, error);
            return defaultValue;
        }
    }

    set(key, value, notify = true) {
        try {
            const storageKey = this.getStorageKey(key);
            const stringValue = JSON.stringify(value);
            localStorage.setItem(storageKey, stringValue);
            
            if (notify && this.listeners.has(key)) {
                const callbacks = this.listeners.get(key);
                callbacks.forEach(cb => cb(value));
            }
            
            this.notifyOtherTabs(key, value);
            
            // Sincronizar com nuvem
            if (!this.isSyncing && window.FirebaseSync && 
                typeof window.FirebaseSync.saveUserDataToCloud === 'function' &&
                this.currentUserId && this.currentUserId !== 'default') {
                clearTimeout(this._syncTimeout);
                this._syncTimeout = setTimeout(() => {
                    this.syncToCloud(key, value);
                }, 500);
            }
            
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao salvar ${key}:`, error);
            return false;
        }
    }
    
    notifyOtherTabs(key, value) {
        const notificationKey = `sync_${key}_${Date.now()}`;
        localStorage.setItem(notificationKey, JSON.stringify({ key, value, timestamp: Date.now() }));
        setTimeout(() => localStorage.removeItem(notificationKey), 100);
    }
    
    async syncToCloud(key, value) {
        try {
            const userId = this.getCurrentUserId();
            if (userId && userId !== 'default' && window.FirebaseSync && 
                typeof window.FirebaseSync.saveUserDataToCloud === 'function') {
                await window.FirebaseSync.saveUserDataToCloud(userId, key, value);
                console.log(`[CacheManager] ✅ Dado "${key}" enviado para nuvem`);
            }
        } catch (error) {
            console.error('[CacheManager] Erro ao sincronizar com nuvem:', error);
        }
    }
    
    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') {
            console.log('[CacheManager] Sem usuário logado, ignorando sync da nuvem');
            return false;
        }
        
        if (!window.FirebaseSync || typeof window.FirebaseSync.loadAllUserDataFromCloud !== 'function') {
            console.log('[CacheManager] FirebaseSync não disponível, usando apenas localStorage');
            return false;
        }
        
        if (this.isSyncing && !force) {
            console.log('[CacheManager] Sincronização já em andamento...');
            return this.pendingCloudLoad;
        }
        
        this.isSyncing = true;
        
        try {
            console.log('[CacheManager] 🔍 Carregando dados da nuvem para:', userId);
            const cloudData = await window.FirebaseSync.loadAllUserDataFromCloud(userId);
            console.log('[CacheManager] 📦 Dados da nuvem recebidos:', cloudData ? Object.keys(cloudData) : 'nenhum');
            
            if (cloudData) {
                // TODAS AS CHAVES SUPORTADAS
                const keys = [
                    'usuarioLogado', 
                    'notifications', 
                    'weeklySchedule', 
                    'timeSlots', 
                    'calendarEvents', 
                    'tasks', 
                    'notes', 
                    'notificacoesSettings', 
                    'appearanceSettings'
                ];
                let hasChanges = false;
                
                for (const key of keys) {
                    if (cloudData[key] !== undefined && cloudData[key] !== null) {
                        const localData = this.get(key, null);
                        if (localData === null || JSON.stringify(localData) !== JSON.stringify(cloudData[key])) {
                            const storageKey = this.getStorageKey(key);
                            localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
                            hasChanges = true;
                            console.log(`[CacheManager] ✅ Dado "${key}" carregado da nuvem`);
                            
                            if (this.listeners.has(key)) {
                                const callbacks = this.listeners.get(key);
                                callbacks.forEach(cb => cb(cloudData[key]));
                            }
                        }
                    }
                }
                
                if (hasChanges) {
                    console.log('[CacheManager] 🎉 Dados carregados da nuvem com sucesso!');
                    window.dispatchEvent(new CustomEvent('cloudDataLoaded', { detail: cloudData }));
                }
                return true;
            } else {
                console.log('[CacheManager] ⚠️ Nenhum dado encontrado na nuvem para este usuário');
            }
        } catch (error) {
            console.error('[CacheManager] ❌ Erro ao carregar da nuvem:', error);
        } finally {
            this.isSyncing = false;
            this.pendingCloudLoad = null;
        }
        return false;
    }
    
    async startRealtimeSync() {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') return;
        
        if (this.cloudListener) {
            console.log('[CacheManager] Escuta em tempo real já ativa');
            return;
        }
        
        if (window.FirebaseSync && typeof window.FirebaseSync.listenToUserData === 'function') {
            console.log('[CacheManager] 🔌 Iniciando escuta em tempo real do Firebase...');
            this.cloudListener = window.FirebaseSync.listenToUserData(userId, (cloudData) => {
                console.log('[CacheManager] 🔔 Mudança detectada no Firebase!');
                if (cloudData) {
                    this.mergeCloudData(cloudData);
                }
            });
        } else {
            console.log('[CacheManager] ⚠️ FirebaseSync.listenToUserData não disponível');
        }
    }
    
    stopRealtimeSync() {
        if (this.cloudListener) {
            this.cloudListener();
            this.cloudListener = null;
            console.log('[CacheManager] 🔌 Escuta em tempo real interrompida');
        }
    }
    
    mergeCloudData(cloudData) {
        // TODAS AS CHAVES PARA MERGE
        const keys = [
            'tasks', 
            'notes', 
            'calendarEvents', 
            'weeklySchedule', 
            'timeSlots', 
            'notifications', 
            'notificacoesSettings', 
            'appearanceSettings'
        ];
        let hasChanges = false;
        
        for (const key of keys) {
            if (cloudData[key] !== undefined && cloudData[key] !== null) {
                const localData = this.get(key, null);
                if (JSON.stringify(localData) !== JSON.stringify(cloudData[key])) {
                    const storageKey = this.getStorageKey(key);
                    localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
                    hasChanges = true;
                    console.log(`[CacheManager] 🔄 Dado "${key}" atualizado pelo Firebase`);
                    
                    if (this.listeners.has(key)) {
                        const callbacks = this.listeners.get(key);
                        callbacks.forEach(cb => cb(cloudData[key]));
                    }
                }
            }
        }
        
        if (hasChanges) {
            console.log('[CacheManager] 📢 Disparando evento cloudDataLoaded');
            window.dispatchEvent(new CustomEvent('cloudDataLoaded', { detail: cloudData }));
        }
    }
    
    notifyAllListeners(cloudData) {
        if (!cloudData) return;
        for (const [key, callbacks] of this.listeners) {
            if (cloudData[key] !== undefined && callbacks.length > 0) {
                callbacks.forEach(cb => cb(cloudData[key]));
            }
        }
    }

    addListener(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            }
        };
    }
    
    async forceSync() {
        console.log('[CacheManager] 🔄 Forçando sincronização manual...');
        return await this.loadFromCloud(true);
    }
    
    async afterLogin() {
        this.currentUserId = null;
        const userId = this.getCurrentUserId();
        if (userId && userId !== 'default') {
            console.log('[CacheManager] 🔄 Usuário logado, carregando dados da nuvem...');
            await this.loadFromCloud(true);
            this.startRealtimeSync();
        }
    }
    
    async logout() {
        this.stopRealtimeSync();
        this.currentUserId = null;
        console.log('[CacheManager] Logout realizado, escuta encerrada');
    }
    
    // ===== MÉTODOS ESPECÍFICOS PARA CADA TIPO DE DADO =====
    
    // Anotações (Notes)
    getNotes() {
        return this.get('notes', []);
    }
    
    setNotes(notes, notify = true) {
        return this.set('notes', notes, notify);
    }
    
    addNote(note, notify = true) {
        const notes = this.getNotes();
        notes.unshift(note);
        return this.setNotes(notes, notify);
    }
    
    updateNote(noteId, updatedNote, notify = true) {
        const notes = this.getNotes();
        const index = notes.findIndex(n => n.id == noteId);
        if (index !== -1) {
            notes[index] = { ...notes[index], ...updatedNote };
            return this.setNotes(notes, notify);
        }
        return false;
    }
    
    deleteNote(noteId, notify = true) {
        const notes = this.getNotes();
        const filtered = notes.filter(n => n.id != noteId);
        return this.setNotes(filtered, notify);
    }
    
    // Tarefas (Tasks)
    getTasks() {
        return this.get('tasks', []);
    }
    
    setTasks(tasks, notify = true) {
        return this.set('tasks', tasks, notify);
    }
    
    addTask(task, notify = true) {
        const tasks = this.getTasks();
        tasks.unshift(task);
        return this.setTasks(tasks, notify);
    }
    
    updateTask(taskId, updatedTask, notify = true) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id == taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updatedTask };
            return this.setTasks(tasks, notify);
        }
        return false;
    }
    
    deleteTask(taskId, notify = true) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.id != taskId);
        return this.setTasks(filtered, notify);
    }
    
    toggleTaskComplete(taskId, notify = true) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id == taskId);
        if (index !== -1) {
            tasks[index].completed = !tasks[index].completed;
            tasks[index].dataConclusao = tasks[index].completed ? new Date().toISOString() : null;
            return this.setTasks(tasks, notify);
        }
        return false;
    }
    
    // Eventos do Calendário
    getCalendarEvents() {
        return this.get('calendarEvents', []);
    }
    
    setCalendarEvents(events, notify = true) {
        return this.set('calendarEvents', events, notify);
    }
    
    addCalendarEvent(event, notify = true) {
        const events = this.getCalendarEvents();
        events.push(event);
        return this.setCalendarEvents(events, notify);
    }
    
    updateCalendarEvent(eventId, updatedEvent, notify = true) {
        const events = this.getCalendarEvents();
        const index = events.findIndex(e => e.id == eventId);
        if (index !== -1) {
            events[index] = { ...events[index], ...updatedEvent };
            return this.setCalendarEvents(events, notify);
        }
        return false;
    }
    
    deleteCalendarEvent(eventId, notify = true) {
        const events = this.getCalendarEvents();
        const filtered = events.filter(e => e.id != eventId);
        return this.setCalendarEvents(filtered, notify);
    }
    
    // Horário Semanal
    getWeeklySchedule() {
        return this.get('weeklySchedule', {});
    }
    
    setWeeklySchedule(schedule, notify = true) {
        return this.set('weeklySchedule', schedule, notify);
    }
    
    getTimeSlots() {
        return this.get('timeSlots', ['08:00', '09:30', '11:00', '14:00', '15:30']);
    }
    
    setTimeSlots(slots, notify = true) {
        return this.set('timeSlots', slots, notify);
    }
    
    addClassToSchedule(day, classData, notify = true) {
        const schedule = this.getWeeklySchedule();
        if (!schedule[day]) schedule[day] = [];
        schedule[day].push(classData);
        schedule[day].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        return this.setWeeklySchedule(schedule, notify);
    }
    
    removeClassFromSchedule(day, time, notify = true) {
        const schedule = this.getWeeklySchedule();
        if (schedule[day]) {
            schedule[day] = schedule[day].filter(c => c.horaInicio !== time);
            return this.setWeeklySchedule(schedule, notify);
        }
        return false;
    }
    
    // Notificações
    getNotifications() {
        return this.get('notifications', []);
    }
    
    setNotifications(notifications, notify = true) {
        return this.set('notifications', notifications, notify);
    }
    
    addNotification(notification, notify = true) {
        const notifications = this.getNotifications();
        notifications.unshift({ ...notification, id: Date.now(), read: false, time: new Date().toISOString() });
        if (notifications.length > 50) notifications.pop();
        return this.setNotifications(notifications, notify);
    }
    
    markNotificationAsRead(notificationId, notify = true) {
        const notifications = this.getNotifications();
        const index = notifications.findIndex(n => n.id == notificationId);
        if (index !== -1) {
            notifications[index].read = true;
            return this.setNotifications(notifications, notify);
        }
        return false;
    }
    
    markAllNotificationsAsRead(notify = true) {
        const notifications = this.getNotifications();
        notifications.forEach(n => n.read = true);
        return this.setNotifications(notifications, notify);
    }
    
    clearAllNotifications(notify = true) {
        return this.setNotifications([], notify);
    }
}

// Instância global
window.CacheManager = new CacheManager();

// Funções auxiliares globais
window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.onCacheChange = (key, callback) => window.CacheManager.addListener(key, callback);
window.forceSyncCloud = () => window.CacheManager.forceSync();

// Métodos específicos para anotações
window.getNotes = () => window.CacheManager.getNotes();
window.setNotes = (notes, notify) => window.CacheManager.setNotes(notes, notify);
window.addNote = (note, notify) => window.CacheManager.addNote(note, notify);
window.updateNote = (noteId, updatedNote, notify) => window.CacheManager.updateNote(noteId, updatedNote, notify);
window.deleteNote = (noteId, notify) => window.CacheManager.deleteNote(noteId, notify);

// Métodos específicos para tarefas
window.getTasks = () => window.CacheManager.getTasks();
window.setTasks = (tasks, notify) => window.CacheManager.setTasks(tasks, notify);
window.addTask = (task, notify) => window.CacheManager.addTask(task, notify);
window.updateTask = (taskId, updatedTask, notify) => window.CacheManager.updateTask(taskId, updatedTask, notify);
window.deleteTask = (taskId, notify) => window.CacheManager.deleteTask(taskId, notify);
window.toggleTaskComplete = (taskId, notify) => window.CacheManager.toggleTaskComplete(taskId, notify);

// Métodos específicos para eventos do calendário
window.getCalendarEvents = () => window.CacheManager.getCalendarEvents();
window.setCalendarEvents = (events, notify) => window.CacheManager.setCalendarEvents(events, notify);
window.addCalendarEvent = (event, notify) => window.CacheManager.addCalendarEvent(event, notify);
window.updateCalendarEvent = (eventId, updatedEvent, notify) => window.CacheManager.updateCalendarEvent(eventId, updatedEvent, notify);
window.deleteCalendarEvent = (eventId, notify) => window.CacheManager.deleteCalendarEvent(eventId, notify);

// Métodos específicos para horário semanal
window.getWeeklySchedule = () => window.CacheManager.getWeeklySchedule();
window.setWeeklySchedule = (schedule, notify) => window.CacheManager.setWeeklySchedule(schedule, notify);
window.getTimeSlots = () => window.CacheManager.getTimeSlots();
window.setTimeSlots = (slots, notify) => window.CacheManager.setTimeSlots(slots, notify);
window.addClassToSchedule = (day, classData, notify) => window.CacheManager.addClassToSchedule(day, classData, notify);
window.removeClassFromSchedule = (day, time, notify) => window.CacheManager.removeClassFromSchedule(day, time, notify);

// Métodos específicos para notificações
window.getNotifications = () => window.CacheManager.getNotifications();
window.setNotifications = (notifications, notify) => window.CacheManager.setNotifications(notifications, notify);
window.addNotification = (notification, notify) => window.CacheManager.addNotification(notification, notify);
window.markNotificationAsRead = (notificationId, notify) => window.CacheManager.markNotificationAsRead(notificationId, notify);
window.markAllNotificationsAsRead = (notify) => window.CacheManager.markAllNotificationsAsRead(notify);
window.clearAllNotifications = (notify) => window.CacheManager.clearAllNotifications(notify);

console.log('[CacheManager] v7 carregado com suporte completo para anotações, tarefas, calendário e horário');