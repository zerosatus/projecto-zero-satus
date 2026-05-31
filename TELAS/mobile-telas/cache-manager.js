// cache-manager.js - Sistema centralizado de gerenciamento de cache com suporte a nuvem e sincronização bidirecional

class CacheManager {
    constructor() {
        this.listeners = new Map();
        this.cacheVersion = 'v9';
        this.isInitialized = false;
        this.currentUserId = null;
        this.isSyncing = false;
        this.syncCallbacks = [];
        this.pendingCloudLoad = null;
        this.cloudListener = null;
        this._syncTimeout = null;
        this._retryQueue = [];
        this._isOnline = navigator.onLine;
    }

    // ========== INICIALIZAÇÃO ==========
    
    init() {
        if (this.isInitialized) return;
        this.checkAndClearOldCache();
        
        // Escutar mudanças no localStorage (outras abas)
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
        
        // Escutar dados carregados da nuvem
        window.addEventListener('cloudDataLoaded', (event) => {
            console.log('[CacheManager] Dados carregados da nuvem, atualizando UI');
            this.notifyAllListeners(event.detail);
        });
        
        // Monitorar conectividade
        window.addEventListener('online', () => {
            console.log('[CacheManager] 🌐 Conexão restaurada, processando fila de sincronização');
            this._isOnline = true;
            this.processRetryQueue();
        });
        
        window.addEventListener('offline', () => {
            console.log('[CacheManager] 📴 Conexão perdida, dados serão salvos localmente');
            this._isOnline = false;
        });
        
        this.isInitialized = true;
        console.log('[CacheManager] Inicializado v9');
    }

    // ========== MÉTODOS DE USUÁRIO ==========
    
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
    
    setCurrentUser(userId) {
        if (!userId) return;
        this.currentUserId = userId;
        console.log('[CacheManager] ✅ Usuário definido manualmente:', userId);
        
        // Tentar iniciar escuta em tempo real imediatamente
        setTimeout(() => {
            this.startRealtimeSync();
        }, 500);
    }
    
    isUserLoggedIn() {
        return this.currentUserId && this.currentUserId !== 'default';
    }

    getStorageKey(key) {
        const userId = this.getCurrentUserId();
        return `${userId}_${key}`;
    }

    checkAndClearOldCache() {
        const currentVersion = localStorage.getItem('cache_version');
        if (currentVersion !== this.cacheVersion) {
            if (currentVersion && currentVersion !== this.cacheVersion) {
                console.log('[CacheManager] Versão do cache mudou de', currentVersion, 'para', this.cacheVersion);
            }
            localStorage.setItem('cache_version', this.cacheVersion);
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

    // ========== MÉTODOS CRUD ==========
    
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
            
            // Sincronizar com nuvem se estiver online e usuário logado
            if (this._isOnline && !this.isSyncing && window.FirebaseSync && 
                typeof window.FirebaseSync.saveUserDataToCloud === 'function' &&
                this.isUserLoggedIn()) {
                clearTimeout(this._syncTimeout);
                this._syncTimeout = setTimeout(() => {
                    this.syncToCloudWithRetry(key, value);
                }, 500);
            } else if (!this._isOnline) {
                console.log(`[CacheManager] 📴 Offline: dado "${key}" salvo localmente, será sincronizado quando online`);
                this.addToRetryQueue(key, value);
            } else if (!this.isUserLoggedIn()) {
                console.log(`[CacheManager] ⚠️ Dado "${key}" não enviado para nuvem (usuário não definido)`);
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
    
    // ========== FILA DE RETRY PARA OFFLINE ==========
    
    addToRetryQueue(key, value) {
        this._retryQueue.push({ key, value, timestamp: Date.now() });
        // Salvar fila no localStorage para persistir entre sessões
        localStorage.setItem('_sync_retry_queue', JSON.stringify(this._retryQueue));
        console.log(`[CacheManager] 📋 Adicionado à fila: ${key}, total: ${this._retryQueue.length}`);
    }
    
    async processRetryQueue() {
        if (!this._isOnline) {
            console.log('[CacheManager] 📴 Offline, aguardando conexão para processar fila');
            return;
        }
        
        if (this._retryQueue.length === 0) {
            // Tentar carregar fila do localStorage
            const savedQueue = localStorage.getItem('_sync_retry_queue');
            if (savedQueue) {
                try {
                    this._retryQueue = JSON.parse(savedQueue);
                } catch(e) {}
            }
        }
        
        if (this._retryQueue.length === 0) return;
        
        console.log(`[CacheManager] 🔄 Processando fila de sincronização (${this._retryQueue.length} itens)`);
        
        const queue = [...this._retryQueue];
        this._retryQueue = [];
        localStorage.removeItem('_sync_retry_queue');
        
        for (const item of queue) {
            console.log(`[CacheManager] ⏳ Tentando sincronizar ${item.key} da fila...`);
            const success = await this.syncToCloud(item.key, item.value);
            if (!success) {
                // Se falhar, adicionar de volta à fila
                this.addToRetryQueue(item.key, item.value);
            } else {
                console.log(`[CacheManager] ✅ ${item.key} sincronizado da fila com sucesso`);
            }
        }
    }
    
    // ========== MÉTODOS DE SINCRONIZAÇÃO COM NUVEM ==========
    
    async syncToCloudWithRetry(key, value, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const success = await this.syncToCloud(key, value);
            if (success) {
                console.log(`[CacheManager] ✅ Dado "${key}" sincronizado com sucesso (tentativa ${attempt})`);
                return true;
            }
            console.log(`[CacheManager] ⚠️ Tentativa ${attempt} falhou para "${key}", ${attempt < maxRetries ? 'tentando novamente...' : 'adicionando à fila'}`);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff exponencial
            }
        }
        // Se todas as tentativas falharem, adicionar à fila
        this.addToRetryQueue(key, value);
        return false;
    }
    
    async syncToCloud(key, value) {
        try {
            const userId = this.getCurrentUserId();
            
            if (!userId || userId === 'default') {
                console.warn(`[CacheManager] ⚠️ Usuário não definido, não sincronizando ${key}`);
                return false;
            }
            
            if (!window.FirebaseSync || typeof window.FirebaseSync.saveUserDataToCloud !== 'function') {
                console.warn('[CacheManager] ⚠️ FirebaseSync não disponível');
                return false;
            }
            
            console.log(`[CacheManager] ☁️ Enviando "${key}" para nuvem (usuário: ${userId})`);
            const result = await window.FirebaseSync.saveUserDataToCloud(userId, key, value);
            
            if (result) {
                console.log(`[CacheManager] ✅ Dado "${key}" enviado para nuvem com sucesso`);
                // Disparar evento para outras abas
                window.dispatchEvent(new CustomEvent('cloudDataSaved', { detail: { key, value } }));
            } else {
                console.log(`[CacheManager] ⚠️ Falha ao enviar "${key}" para nuvem`);
            }
            return result;
        } catch (error) {
            console.error('[CacheManager] Erro ao sincronizar com nuvem:', error);
            return false;
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
                        const localStr = localData ? JSON.stringify(localData) : 'null';
                        const cloudStr = JSON.stringify(cloudData[key]);
                        
                        if (localStr !== cloudStr) {
                            const storageKey = this.getStorageKey(key);
                            localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
                            hasChanges = true;
                            console.log(`[CacheManager] ✅ Dado "${key}" carregado da nuvem`);
                            
                            if (this.listeners.has(key)) {
                                const callbacks = this.listeners.get(key);
                                callbacks.forEach(cb => cb(cloudData[key]));
                            }
                        } else {
                            console.log(`[CacheManager] ℹ️ Dado "${key}" já está atualizado`);
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
                return false;
            }
        } catch (error) {
            console.error('[CacheManager] ❌ Erro ao carregar da nuvem:', error);
            return false;
        } finally {
            this.isSyncing = false;
            this.pendingCloudLoad = null;
        }
    }
    
    // ========== ESCUTA EM TEMPO REAL ==========
    
    async startRealtimeSync() {
        const userId = this.getCurrentUserId();
        if (!userId || userId === 'default') {
            console.log('[CacheManager] Usuário não definido, não iniciando escuta');
            return;
        }
        
        if (this.cloudListener) {
            console.log('[CacheManager] Escuta em tempo real já ativa');
            return;
        }
        
        if (window.FirebaseSync && typeof window.FirebaseSync.listenToUserData === 'function') {
            console.log('[CacheManager] 🔌 Iniciando escuta em tempo real do Firebase para:', userId);
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
                const localStr = localData ? JSON.stringify(localData) : 'null';
                const cloudStr = JSON.stringify(cloudData[key]);
                
                if (localStr !== cloudStr) {
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
    
    // ========== MÉTODOS DE LISTENERS ==========
    
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
    
    // ========== MÉTODOS DE FORÇA ==========
    
    async forceSync() {
        console.log('[CacheManager] 🔄 Forçando sincronização manual...');
        const result = await this.loadFromCloud(true);
        
        // Também enviar dados locais para nuvem
        if (result && this.isUserLoggedIn() && this._isOnline) {
            const keys = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications'];
            for (const key of keys) {
                const data = this.get(key, null);
                if (data !== null) {
                    await this.syncToCloud(key, data);
                }
            }
        }
        
        // Processar fila de retry
        await this.processRetryQueue();
        
        return result;
    }
    
    async afterLogin() {
        this.currentUserId = null;
        const userId = this.getCurrentUserId();
        if (userId && userId !== 'default') {
            console.log('[CacheManager] 🔄 Usuário logado, carregando dados da nuvem...');
            const loaded = await this.loadFromCloud(true);
            if (loaded) {
                console.log('[CacheManager] ✅ Dados da nuvem carregados com sucesso!');
            } else {
                console.log('[CacheManager] ℹ️ Nenhum dado na nuvem, mantendo dados locais');
                // Enviar dados locais para nuvem
                const keys = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications'];
                for (const key of keys) {
                    const data = this.get(key, null);
                    if (data !== null && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
                        await this.syncToCloud(key, data);
                    }
                }
            }
            this.startRealtimeSync();
            return loaded;
        }
        return false;
    }
    
    async logout() {
        this.stopRealtimeSync();
        this.currentUserId = null;
        console.log('[CacheManager] Logout realizado, escuta encerrada');
    }
}

// ========== INSTÂNCIA GLOBAL ==========
window.CacheManager = new CacheManager();

// ========== FUNÇÕES AUXILIARES GLOBAIS ==========
window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.onCacheChange = (key, callback) => window.CacheManager.addListener(key, callback);
window.forceSyncCloud = () => window.CacheManager.forceSync();

// ========== MÉTODOS ESPECÍFICOS PARA ANOTAÇÕES ==========
window.getNotes = () => window.CacheManager.get('notes', []);
window.setNotes = (notes, notify) => window.CacheManager.set('notes', notes, notify);
window.addNote = (note, notify) => {
    const notes = window.getNotes();
    notes.unshift(note);
    window.setNotes(notes, notify);
    return note;
};
window.updateNote = (noteId, updatedNote, notify) => {
    const notes = window.getNotes();
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
        notes[index] = { ...notes[index], ...updatedNote };
        window.setNotes(notes, notify);
        return true;
    }
    return false;
};
window.deleteNote = (noteId, notify) => {
    const notes = window.getNotes();
    const filtered = notes.filter(n => n.id !== noteId);
    window.setNotes(filtered, notify);
    return true;
};

// ========== MÉTODOS ESPECÍFICOS PARA TAREFAS ==========
window.getTasks = () => window.CacheManager.get('tasks', []);
window.setTasks = (tasks, notify) => window.CacheManager.set('tasks', tasks, notify);
window.addTask = (task, notify) => {
    const tasks = window.getTasks();
    tasks.unshift(task);
    window.setTasks(tasks, notify);
    return task;
};
window.updateTask = (taskId, updatedTask, notify) => {
    const tasks = window.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updatedTask };
        window.setTasks(tasks, notify);
        return true;
    }
    return false;
};
window.deleteTask = (taskId, notify) => {
    const tasks = window.getTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    window.setTasks(filtered, notify);
    return true;
};
window.toggleTaskComplete = (taskId, notify) => {
    const tasks = window.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        window.setTasks(tasks, notify);
        return true;
    }
    return false;
};

// ========== MÉTODOS ESPECÍFICOS PARA EVENTOS DO CALENDÁRIO ==========
window.getCalendarEvents = () => window.CacheManager.get('calendarEvents', []);
window.setCalendarEvents = (events, notify) => window.CacheManager.set('calendarEvents', events, notify);
window.addCalendarEvent = (event, notify) => {
    const events = window.getCalendarEvents();
    events.push(event);
    window.setCalendarEvents(events, notify);
    return event;
};
window.updateCalendarEvent = (eventId, updatedEvent, notify) => {
    const events = window.getCalendarEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
        events[index] = { ...events[index], ...updatedEvent };
        window.setCalendarEvents(events, notify);
        return true;
    }
    return false;
};
window.deleteCalendarEvent = (eventId, notify) => {
    const events = window.getCalendarEvents();
    const filtered = events.filter(e => e.id !== eventId);
    window.setCalendarEvents(filtered, notify);
    return true;
};

// ========== MÉTODOS ESPECÍFICOS PARA HORÁRIO SEMANAL ==========
window.getWeeklySchedule = () => window.CacheManager.get('weeklySchedule', {});
window.setWeeklySchedule = (schedule, notify) => window.CacheManager.set('weeklySchedule', schedule, notify);
window.getTimeSlots = () => window.CacheManager.get('timeSlots', ['08:00', '09:30', '11:00', '14:00', '15:30']);
window.setTimeSlots = (slots, notify) => window.CacheManager.set('timeSlots', slots, notify);
window.addClassToSchedule = (day, classData, notify) => {
    const schedule = window.getWeeklySchedule();
    if (!schedule[day]) schedule[day] = [];
    schedule[day].push(classData);
    schedule[day].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    window.setWeeklySchedule(schedule, notify);
    return true;
};
window.removeClassFromSchedule = (day, time, notify) => {
    const schedule = window.getWeeklySchedule();
    if (schedule[day]) {
        schedule[day] = schedule[day].filter(c => c.horaInicio !== time);
        window.setWeeklySchedule(schedule, notify);
        return true;
    }
    return false;
};

// ========== MÉTODOS ESPECÍFICOS PARA NOTIFICAÇÕES ==========
window.getNotifications = () => window.CacheManager.get('notifications', []);
window.setNotifications = (notifications, notify) => window.CacheManager.set('notifications', notifications, notify);
window.addNotification = (notification, notify) => {
    const notifications = window.getNotifications();
    notifications.unshift(notification);
    window.setNotifications(notifications, notify);
    return notification;
};
window.markNotificationAsRead = (notificationId, notify) => {
    const notifications = window.getNotifications();
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) {
        notif.read = true;
        window.setNotifications(notifications, notify);
        return true;
    }
    return false;
};
window.markAllNotificationsAsRead = (notify) => {
    const notifications = window.getNotifications();
    notifications.forEach(n => n.read = true);
    window.setNotifications(notifications, notify);
    return true;
};
window.clearAllNotifications = (notify) => {
    window.setNotifications([], notify);
    return true;
};

// ========== MÉTODOS ESPECÍFICOS PARA CONFIGURAÇÕES ==========
window.getNotificacoesSettings = () => window.CacheManager.get('notificacoesSettings', { push: true, email: false, aulas: true, tarefas: true });
window.setNotificacoesSettings = (settings, notify) => window.CacheManager.set('notificacoesSettings', settings, notify);
window.getAppearanceSettings = () => window.CacheManager.get('appearanceSettings', { theme: 'dark', accent: '#8b5cf6', fontSize: 14 });
window.setAppearanceSettings = (settings, notify) => window.CacheManager.set('appearanceSettings', settings, notify);

console.log('[CacheManager] v9 carregado com suporte completo para:');
console.log('  ✅ Anotações (notes)');
console.log('  ✅ Tarefas (tasks)');
console.log('  ✅ Calendário (calendarEvents)');
console.log('  ✅ Horário semanal (weeklySchedule)');
console.log('  ✅ Notificações (notifications)');
console.log('  ✅ Configurações (appearanceSettings, notificacoesSettings)');
console.log('  ✅ Sincronização em tempo real com Firebase');
console.log('  ✅ Fallback offline com localStorage');
console.log('  ✅ Fila de retry para sincronização offline');
console.log('  ✅ Monitoramento de conectividade');