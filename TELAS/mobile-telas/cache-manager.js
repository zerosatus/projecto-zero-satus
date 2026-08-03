// ==========================================
// cache-manager.js - GERENCIADOR DE CACHE COMPLETO (CORRIGIDO)
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
        this._syncTimeout = null;
        this._initAttempts = 0;
        this._maxInitAttempts = 5;
        this._syncInProgress = false;
    }

    init() {
        if (this.isInitialized) {
            console.log('[CacheManager] ⚠️ Já inicializado');
            return;
        }
        console.log('[CacheManager] ✅ Inicializando...');
        this.isInitialized = true;
        this.getCurrentUserId();

        // Verificar se StorageKeys está disponível e migrar dados
        if (window.StorageKeys && typeof window.StorageKeys.migrarDadosAntigos === 'function') {
            setTimeout(() => {
                window.StorageKeys.migrarDadosAntigos();
            }, 100);
        }

        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cacheReady'));
            console.log('[CacheManager] 📡 Evento cacheReady disparado');
        }, 100);
    }

    getCurrentUserId() {
        if (this.currentUserId) {
            return this.currentUserId;
        }

        // Tentar via StorageKeys primeiro
        if (window.StorageKeys && typeof window.StorageKeys.getCurrentUserId === 'function') {
            const userId = window.StorageKeys.getCurrentUserId();
            if (userId) {
                this.currentUserId = userId;
                console.log('[CacheManager] ✅ User ID obtido via StorageKeys:', this.currentUserId);
                return this.currentUserId;
            }
        }

        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                const user = JSON.parse(usuario);
                this.currentUserId = user.id || user.uid;
                console.log('[CacheManager] ✅ User ID obtido do localStorage:', this.currentUserId);
                return this.currentUserId;
            } catch(e) {
                console.error('[CacheManager] ❌ Erro ao parsear usuário:', e);
            }
        }
        console.warn('[CacheManager] ⚠️ Nenhum usuário logado');
        return null;
    }

    // ============================================
    // ⭐ GET - USANDO SEMPRE userId (PADRONIZADO)
    // ============================================
    get(key, defaultValue = null) {
        try {
            if (this._dataCache.has(key)) {
                return this._dataCache.get(key);
            }

            const userId = this.getCurrentUserId();
            if (!userId) {
                return defaultValue;
            }

            // ⭐ USAR SEMPRE O MESMO PADRÃO
            const storageKey = `${userId}_${key}`;
            const data = localStorage.getItem(storageKey);
            
            if (data === null) {
                // ⭐ TENTAR MIGRAR DO FORMATO ANTIGO (COM EMAIL)
                const usuario = localStorage.getItem('usuarioLogado');
                if (usuario) {
                    try {
                        const user = JSON.parse(usuario);
                        const oldKey = `${key}_${user.email}`;
                        const oldData = localStorage.getItem(oldKey);
                        if (oldData !== null) {
                            localStorage.setItem(storageKey, oldData);
                            const parsed = JSON.parse(oldData);
                            this._dataCache.set(key, parsed);
                            console.log(`[CacheManager] ✅ Migrado ${key} do formato antigo (email)`);
                            return parsed;
                        }
                    } catch(e) {
                        console.warn(`[CacheManager] ⚠️ Erro ao migrar ${key}:`, e);
                    }
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

    // ============================================
    // ⭐ SET - USANDO SEMPRE userId (PADRONIZADO)
    // ============================================
    set(key, value, notify = true) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.error(`[CacheManager] ❌ Usuário não logado para set: ${key}`);
            return false;
        }

        console.log(`[CacheManager] 📝 set(${key}) - userId: ${userId.substring(0, 8)}..., itens: ${Array.isArray(value) ? value.length : 'N/A'}`);

        const flagKey = `${userId}_${key}`;
        if (this._savingFlags.get(flagKey)) {
            console.log('[CacheManager] ⏳ Já salvando:', key);
            return false;
        }

        try {
            // ⭐ USAR SEMPRE O MESMO PADRÃO
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
            
            // Salvar no localStorage com o padrão userId
            localStorage.setItem(storageKey, JSON.stringify(value));
            this._dataCache.set(key, value);

            // ⭐ TAMBÉM SALVAR COM EMAIL PARA COMPATIBILIDADE
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    const user = JSON.parse(usuario);
                    if (user.email) {
                        localStorage.setItem(`${key}_${user.email}`, JSON.stringify(value));
                    }
                } catch(e) {}
            }

            // Adicionar à fila para enviar ao Supabase
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
        // Processar a fila imediatamente
        this._processSaveQueue();
    }

    async _processSaveQueue() {
        if (this._isSaving || this._saveQueue.length === 0) {
            return;
        }
        
        this._isSaving = true;
        console.log(`[CacheManager] 🔄 Processando fila (${this._saveQueue.length} itens)...`);
        
        try {
            // Verificar se DatabaseService está disponível
            if (!window.DatabaseService) {
                console.warn('[CacheManager] ⚠️ DatabaseService não disponível, tentando inicializar...');
                if (window.SupabaseClient?.initSupabase) {
                    await window.SupabaseClient.initSupabase();
                }
                // Aguardar um pouco
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (!window.DatabaseService) {
                    console.error('[CacheManager] ❌ DatabaseService ainda não disponível, fila mantida');
                    return;
                }
            }

            while (this._saveQueue.length > 0) {
                const item = this._saveQueue.shift();
                const userId = item.userId || this.getCurrentUserId();
                if (!userId) {
                    console.warn('[CacheManager] ❌ Sem userId para salvar:', item.key);
                    continue;
                }
                const result = await this.saveToCloud(item.key, item.value, userId);
                if (!result) {
                    // Se falhou, recolocar na fila
                    console.warn(`[CacheManager] ⚠️ Falha ao salvar ${item.key}, recolocando na fila`);
                    this._saveQueue.push(item);
                    break;
                }
            }
        } catch (error) {
            console.error('[CacheManager] ❌ Erro ao processar fila:', error);
        } finally {
            this._isSaving = false;
            
            if (this._saveQueue.length > 0) {
                console.log('[CacheManager] 🔄 Novos itens na fila, continuando em 2s...');
                setTimeout(() => this._processSaveQueue(), 2000);
            }
        }
    }

    // ============================================
    // ⭐ SALVAR NA NUVEM (COM VERIFICAÇÃO)
    // ============================================
    async saveToCloud(key, value, userId) {
        // ⭐ VERIFICAR SE DatabaseService ESTÁ DISPONÍVEL
        if (!window.DatabaseService) {
            console.error('[CacheManager] ❌ DatabaseService não disponível para salvar:', key);
            
            // Tentar inicializar novamente
            if (window.SupabaseClient?.initSupabase) {
                console.log('[CacheManager] 🔄 Tentando inicializar Supabase...');
                await window.SupabaseClient.initSupabase();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (!window.DatabaseService) {
                console.error('[CacheManager] ❌ DatabaseService ainda não disponível');
                return false;
            }
        }

        if (!userId) {
            console.error('[CacheManager] ❌ userId não disponível para salvar:', key);
            return false;
        }

        try {
            console.log(`[CacheManager] 💾 Salvando ${key} na nuvem para userId: ${userId.substring(0, 8)}...`);
            
            let result = false;
            switch(key) {
                case 'tasks':
                    result = await window.DatabaseService.saveTasks(userId, value);
                    break;
                case 'notes':
                    result = await window.DatabaseService.saveNotes(userId, value);
                    break;
                case 'calendarEvents':
                    result = await window.DatabaseService.saveCalendarEvents(userId, value);
                    break;
                case 'weeklySchedule':
                    result = await window.DatabaseService.saveWeeklySchedule(userId, value);
                    break;
                case 'timeSlots':
                    result = await window.DatabaseService.saveTimeSlots(userId, value);
                    break;
                case 'notifications':
                    result = await window.DatabaseService.saveNotifications(userId, value);
                    break;
                case 'disciplinas':
                    result = await window.DatabaseService.saveDisciplinas(userId, value);
                    break;
                case 'usuarioLogado':
                    if (value.id && value.email) {
                        await window.DatabaseService.ensureUserData(value.id, value.email, value.nome);
                        result = true;
                    }
                    break;
                default:
                    console.log(`[CacheManager] ⚠️ Tipo não reconhecido: ${key}`);
                    return false;
            }
            
            if (result) {
                console.log(`[CacheManager] ✅ ${key} salvo na nuvem (${Array.isArray(value) ? value.length : Object.keys(value).length} itens)`);
            } else {
                console.error(`[CacheManager] ❌ Falha ao salvar ${key} na nuvem`);
            }
            
            return result;
        } catch (error) {
            console.error(`[CacheManager] ❌ Erro ao salvar ${key} na nuvem:`, error.message);
            this._addToSaveQueue(key, value, userId);
            return false;
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

    // ============================================
    // ⭐ CARREGAR DA NUVEM
    // ============================================
    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.warn('[CacheManager] ⚠️ Não foi possível carregar da nuvem: userId não encontrado');
            return false;
        }

        if (!window.DatabaseService) {
            console.warn('[CacheManager] ⚠️ DatabaseService não disponível, tentando inicializar...');
            if (window.SupabaseClient?.initSupabase) {
                await window.SupabaseClient.initSupabase();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            if (!window.DatabaseService) {
                console.error('[CacheManager] ❌ DatabaseService não disponível para carregar');
                return false;
            }
        }

        if (this.isLoading && !force) {
            console.log('[CacheManager] ⏳ Já carregando...');
            return false;
        }

        this.isLoading = true;
        console.log('[CacheManager] ☁️ Carregando dados da nuvem para:', userId.substring(0, 8) + '...');
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
                    if (data !== null && data !== undefined && data.length > 0) {
                        const storageKey = `${userId}_${key}`;
                        const newDataStr = JSON.stringify(data);
                        const currentLocal = localStorage.getItem(storageKey);
                        
                        if (currentLocal !== newDataStr) {
                            localStorage.setItem(storageKey, newDataStr);
                            // Também salvar com email para compatibilidade
                            const usuario = localStorage.getItem('usuarioLogado');
                            if (usuario) {
                                try {
                                    const user = JSON.parse(usuario);
                                    if (user.email) {
                                        localStorage.setItem(`${key}_${user.email}`, newDataStr);
                                    }
                                } catch(e) {}
                            }
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

    // ============================================
    // ⭐ FORÇAR SINCRONIZAÇÃO (COM RETORNO)
    // ============================================
    async forceSync() {
        if (this._syncInProgress) {
            console.log('[CacheManager] ⏳ Sync já em andamento...');
            return false;
        }
        
        this._syncInProgress = true;
        console.log('[CacheManager] 🔄 Forçando sincronização...');
        
        try {
            // Verificar DatabaseService
            if (!window.DatabaseService) {
                console.warn('[CacheManager] ⚠️ DatabaseService não disponível, tentando inicializar...');
                if (window.SupabaseClient?.initSupabase) {
                    await window.SupabaseClient.initSupabase();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                if (!window.DatabaseService) {
                    console.error('[CacheManager] ❌ DatabaseService não disponível');
                    return false;
                }
            }
            
            // Processar fila pendente
            if (this._saveQueue.length > 0) {
                console.log(`[CacheManager] 📤 Enviando ${this._saveQueue.length} itens pendentes...`);
                await this._processSaveQueue();
            }
            
            // Carregar da nuvem
            const result = await this.loadFromCloud(true);
            this._lastSyncTime = Date.now();
            
            console.log('[CacheManager] ✅ Sincronização concluída:', result ? 'com alterações' : 'sem alterações');
            return result;
        } catch (error) {
            console.error('[CacheManager] ❌ Erro no forceSync:', error);
            return false;
        } finally {
            this._syncInProgress = false;
        }
    }

    async logout() {
        console.log('[CacheManager] 🚪 Realizando logout...');
        if (window.RealtimeSyncManager) {
            window.RealtimeSyncManager.disconnect();
        }
        
        // Tentar sincronizar antes de sair
        try {
            await this.forceSync();
        } catch(e) {
            console.warn('[CacheManager] ⚠️ Erro ao sincronizar no logout:', e);
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
        if (this._syncTimeout) {
            clearTimeout(this._syncTimeout);
            this._syncTimeout = null;
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

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            userId: this.currentUserId,
            dataCacheSize: this._dataCache.size,
            saveQueueSize: this._saveQueue.length,
            isSaving: this._isSaving,
            isLoading: this.isLoading,
            lastSyncTime: this._lastSyncTime ? new Date(this._lastSyncTime).toLocaleString() : 'Nunca'
        };
    }
}

// Instância global
if (typeof window.CacheManager === 'undefined') {
    window.CacheManager = new SimpleCacheManager();
    console.log('[CacheManager] ✅ Instância global criada');
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
window.getCacheStatus = () => window.CacheManager.getStatus();

console.log('[CacheManager] ✅ CacheManager v4.0 carregado com sucesso!');
console.log('[CacheManager] 📌 Funções disponíveis:');
console.log('   - getCached(key, defaultValue)');
console.log('   - setCached(key, value, notify)');
console.log('   - forceSyncCloud()');
console.log('   - getCacheStatus()');