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
        this._dbInitAttempts = 0;
        this._maxDbInitAttempts = 10;
        this._dbInitDelay = 1000;
        this._processingQueue = false;
        this._forceCloudLoad = false;
        this._syncErrorCount = 0;
        this._maxSyncErrors = 5;
        this._deleteQueue = []; // ⭐ NOVO: FILA DE DELETES
    }

    init() {
        if (this.isInitialized) {
            console.log('[CacheManager] ⚠️ Já inicializado');
            return;
        }
        console.log('[CacheManager] ✅ Inicializando...');
        this.isInitialized = true;
        this.getCurrentUserId();

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

    async _ensureDatabaseService() {
        if (window.DatabaseService) {
            this._dbInitAttempts = 0;
            return true;
        }

        if (this._dbInitAttempts >= this._maxDbInitAttempts) {
            console.warn('[CacheManager] ⚠️ Máximo de tentativas para DatabaseService atingido');
            return false;
        }

        this._dbInitAttempts++;
        console.log(`[CacheManager] 🔄 Tentando inicializar DatabaseService (${this._dbInitAttempts}/${this._maxDbInitAttempts})...`);

        if (window.SupabaseClient?.initSupabase) {
            try {
                await window.SupabaseClient.initSupabase();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (window.DatabaseService) {
                    console.log('[CacheManager] ✅ DatabaseService inicializado com sucesso!');
                    this._dbInitAttempts = 0;
                    return true;
                }
            } catch (e) {
                console.warn('[CacheManager] ⚠️ Erro ao inicializar Supabase:', e.message);
            }
        }

        try {
            console.log('[CacheManager] 🔄 Tentando carregar database-service.js...');
            const script = document.createElement('script');
            script.src = '/TELAS/mobile-telas/database-service.js';
            script.onload = () => {
                console.log('[CacheManager] ✅ database-service.js carregado!');
                if (window.DatabaseService) {
                    this._dbInitAttempts = 0;
                }
            };
            script.onerror = () => {
                console.warn('[CacheManager] ⚠️ Falha ao carregar database-service.js');
            };
            document.head.appendChild(script);
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch(e) {
            console.warn('[CacheManager] ⚠️ Erro ao carregar script:', e);
        }

        if (window.DatabaseService) {
            console.log('[CacheManager] ✅ DatabaseService disponível após carregamento manual');
            this._dbInitAttempts = 0;
            return true;
        }

        if (this._dbInitAttempts < this._maxDbInitAttempts) {
            await new Promise(resolve => setTimeout(resolve, this._dbInitDelay));
            return this._ensureDatabaseService();
        }

        console.warn('[CacheManager] ⚠️ DatabaseService não disponível após múltiplas tentativas');
        return false;
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

            if (window.DatabaseService) {
                this._addToSaveQueue(key, value, userId);
            } else {
                console.log('[CacheManager] ⏳ DatabaseService não disponível, agendando para depois...');
                this._saveQueue.push({ key, value, userId });
                if (!this._processingQueue) {
                    setTimeout(() => this._processSaveQueue(), 2000);
                }
            }

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

    // ⭐ NOVO: DELETE COM SYNC
    delete(key, itemId, notify = true) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.error(`[CacheManager] ❌ Usuário não logado para delete: ${key}`);
            return false;
        }

        try {
            const currentData = this.get(key, []);
            if (!Array.isArray(currentData)) {
                console.warn(`[CacheManager] ⚠️ ${key} não é um array, não pode deletar`);
                return false;
            }

            const newData = currentData.filter(item => item.id != itemId);
            if (newData.length === currentData.length) {
                console.warn(`[CacheManager] ⚠️ Item ${itemId} não encontrado em ${key}`);
                return false;
            }

            // Salvar localmente
            const storageKey = `${userId}_${key}`;
            localStorage.setItem(storageKey, JSON.stringify(newData));
            this._dataCache.set(key, newData);

            // Adicionar à fila de delete
            this._addToDeleteQueue(key, itemId, userId);

            if (notify) {
                if (this.listeners.has(key)) {
                    this.listeners.get(key).forEach(cb => {
                        try { cb(newData); } catch(e) {}
                    });
                }
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: newData }));
                    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value: newData } }));
                }, 50);
            }

            console.log(`[CacheManager] ✅ ${key} item ${itemId} deletado localmente`);
            return true;
        } catch (error) {
            console.error(`[CacheManager] ❌ Erro ao delete ${key}:`, error);
            return false;
        }
    }

    _addToDeleteQueue(key, itemId, userId) {
        this._deleteQueue.push({ key, itemId, userId });
        this._processDeleteQueue();
    }

    async _processDeleteQueue() {
        if (this._processingQueue || this._deleteQueue.length === 0) {
            return;
        }
        
        this._processingQueue = true;
        console.log(`[CacheManager] 🔄 Processando fila de delete (${this._deleteQueue.length} itens)...`);
        
        try {
            const dbReady = await this._ensureDatabaseService();
            
            if (!dbReady) {
                console.warn('[CacheManager] ⚠️ DatabaseService não disponível, fila mantida');
                setTimeout(() => {
                    this._processingQueue = false;
                    if (this._deleteQueue.length > 0) {
                        this._processDeleteQueue();
                    }
                }, 5000);
                return;
            }

            if (!window.DatabaseService) {
                console.warn('[CacheManager] ⚠️ DatabaseService ainda não disponível, fila mantida');
                this._processingQueue = false;
                return;
            }

            while (this._deleteQueue.length > 0) {
                const item = this._deleteQueue.shift();
                const userId = item.userId || this.getCurrentUserId();
                if (!userId) {
                    console.warn('[CacheManager] ❌ Sem userId para deletar:', item.key);
                    continue;
                }
                const result = await this.deleteFromCloud(item.key, item.itemId, userId);
                if (!result) {
                    console.warn(`[CacheManager] ⚠️ Falha ao deletar ${item.key} da nuvem, recolocando na fila`);
                    this._deleteQueue.push(item);
                    break;
                }
            }
        } catch (error) {
            console.error('[CacheManager] ❌ Erro ao processar fila de delete:', error);
        } finally {
            this._processingQueue = false;
            
            if (this._deleteQueue.length > 0) {
                console.log('[CacheManager] 🔄 Novos itens na fila de delete, continuando em 3s...');
                setTimeout(() => {
                    if (this._deleteQueue.length > 0) {
                        this._processDeleteQueue();
                    }
                }, 3000);
            }
        }
    }

    async deleteFromCloud(key, itemId, userId) {
        if (!window.DatabaseService) {
            console.error('[CacheManager] ❌ DatabaseService não disponível para deletar:', key);
            const dbReady = await this._ensureDatabaseService();
            if (!dbReady || !window.DatabaseService) {
                console.error('[CacheManager] ❌ DatabaseService ainda não disponível');
                return false;
            }
        }

        if (!userId) {
            console.error('[CacheManager] ❌ userId não disponível para deletar:', key);
            return false;
        }

        try {
            console.log(`[CacheManager] 🗑️ Deletando ${key} item ${itemId} da nuvem para userId: ${userId.substring(0, 8)}...`);
            
            let result = false;
            switch(key) {
                case 'tasks':
                    result = await window.DatabaseService.deleteTask(userId, itemId);
                    break;
                case 'notes':
                    result = await window.DatabaseService.deleteNote(userId, itemId);
                    break;
                case 'calendarEvents':
                    result = await window.DatabaseService.deleteCalendarEvent(userId, itemId);
                    break;
                case 'disciplinas':
                    result = await window.DatabaseService.deleteDisciplina(userId, itemId);
                    break;
                case 'documentos':
                    result = await window.DatabaseService.deleteDocumento(userId, itemId);
                    break;
                default:
                    console.log(`[CacheManager] ⚠️ Tipo não reconhecido para delete: ${key}`);
                    return false;
            }
            
            if (result) {
                console.log(`[CacheManager] ✅ ${key} item ${itemId} deletado da nuvem`);
            } else {
                console.error(`[CacheManager] ❌ Falha ao deletar ${key} item ${itemId} da nuvem`);
            }
            
            return result;
        } catch (error) {
            console.error(`[CacheManager] ❌ Erro ao deletar ${key} da nuvem:`, error.message);
            this._addToDeleteQueue(key, itemId, userId);
            return false;
        }
    }

    _addToSaveQueue(key, value, userId) {
        this._saveQueue.push({ key, value, userId });
        console.log(`[CacheManager] 📋 ${key} adicionado à fila (${this._saveQueue.length} itens)`);
        this._processSaveQueue();
    }

    async _processSaveQueue() {
        if (this._processingQueue || this._saveQueue.length === 0) {
            return;
        }
        
        this._processingQueue = true;
        console.log(`[CacheManager] 🔄 Processando fila (${this._saveQueue.length} itens)...`);
        
        try {
            const dbReady = await this._ensureDatabaseService();
            
            if (!dbReady) {
                console.warn('[CacheManager] ⚠️ DatabaseService não disponível, fila mantida para próxima tentativa');
                setTimeout(() => {
                    this._processingQueue = false;
                    if (this._saveQueue.length > 0) {
                        this._processSaveQueue();
                    }
                }, 5000);
                return;
            }

            if (!window.DatabaseService) {
                console.warn('[CacheManager] ⚠️ DatabaseService ainda não disponível, fila mantida');
                this._processingQueue = false;
                return;
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
                    console.warn(`[CacheManager] ⚠️ Falha ao salvar ${item.key}, recolocando na fila`);
                    this._saveQueue.push(item);
                    break;
                }
            }
        } catch (error) {
            console.error('[CacheManager] ❌ Erro ao processar fila:', error);
        } finally {
            this._processingQueue = false;
            
            if (this._saveQueue.length > 0) {
                console.log('[CacheManager] 🔄 Novos itens na fila, continuando em 3s...');
                setTimeout(() => {
                    if (this._saveQueue.length > 0) {
                        this._processSaveQueue();
                    }
                }, 3000);
            }
        }
    }

    async saveToCloud(key, value, userId) {
        if (!window.DatabaseService) {
            console.error('[CacheManager] ❌ DatabaseService não disponível para salvar:', key);
            const dbReady = await this._ensureDatabaseService();
            if (!dbReady || !window.DatabaseService) {
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
                case 'documentos':
                    result = await window.DatabaseService.saveDocumentos(userId, value);
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
    // ⭐ CARREGAR DA NUVEM (COM FORÇA PARA SOBRESCREVER)
    // ============================================
    async loadFromCloud(force = false) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.warn('[CacheManager] ⚠️ Não foi possível carregar da nuvem: userId não encontrado');
            return false;
        }

        const dbReady = await this._ensureDatabaseService();
        if (!dbReady || !window.DatabaseService) {
            console.warn('[CacheManager] ⚠️ DatabaseService não disponível para carregar');
            return false;
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
                disciplinas: db.getDisciplinas.bind(db),
                documentos: db.getDocumentos.bind(db)
            };

            for (const [key, getter] of Object.entries(dataTypes)) {
                try {
                    console.log(`[CacheManager] 🔍 Buscando ${key}...`);
                    const data = await getter(userId);
                    
                    if (data !== null && data !== undefined) {
                        if (force || (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
                            const storageKey = `${userId}_${key}`;
                            const newDataStr = JSON.stringify(data);
                            const currentLocal = localStorage.getItem(storageKey);
                            
                            if (force || currentLocal !== newDataStr) {
                                localStorage.setItem(storageKey, newDataStr);
                                
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
                                
                                console.log(`[CacheManager] ✅ ${key} ${force ? 'sobrescrito' : 'carregado'} da nuvem: ${Array.isArray(data) ? data.length : Object.keys(data).length} itens`);
                                
                                if (this.listeners.has(key)) {
                                    this.listeners.get(key).forEach(cb => {
                                        try { cb(data); } catch(e) { console.warn('[CacheManager] ⚠️ Erro no listener:', e); }
                                    });
                                }
                                
                                setTimeout(() => {
                                    window.dispatchEvent(new CustomEvent(`${key}Updated`, { detail: data }));
                                    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, value: data } }));
                                }, 50);
                            } else {
                                console.log(`[CacheManager] ℹ️ ${key} já está atualizado`);
                            }
                        } else {
                            console.log(`[CacheManager] ℹ️ ${key} vazio na nuvem, mantendo local`);
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

            return hasChanges || force;
        } catch (error) {
            console.error('[CacheManager] ❌ Erro no loadFromCloud:', error);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    // ============================================
    // ⭐ FORÇAR SINCRONIZAÇÃO (BIDIRECIONAL)
    // ============================================
    async forceSync() {
        if (this._syncInProgress) {
            console.log('[CacheManager] ⏳ Sync já em andamento...');
            return false;
        }
        
        this._syncInProgress = true;
        console.log('[CacheManager] 🔄 Forçando sincronização...');
        
        try {
            const dbReady = await this._ensureDatabaseService();
            if (!dbReady || !window.DatabaseService) {
                console.error('[CacheManager] ❌ DatabaseService não disponível para sync');
                return false;
            }
            
            // PASSO 1: Carregar da nuvem (sobrescreve local)
            console.log('[CacheManager] ☁️ Passo 1: Carregando da nuvem...');
            await this.loadFromCloud(true);
            
            // PASSO 2: Processar fila de delete pendente
            if (this._deleteQueue.length > 0) {
                console.log(`[CacheManager] 🗑️ Passo 2: Processando ${this._deleteQueue.length} itens de delete...`);
                await this._processDeleteQueue();
            }
            
            // PASSO 3: Processar fila pendente (salvar local → nuvem)
            if (this._saveQueue.length > 0) {
                console.log(`[CacheManager] 📤 Passo 3: Enviando ${this._saveQueue.length} itens pendentes...`);
                await this._processSaveQueue();
            }
            
            // PASSO 4: Recarregar da nuvem (consistência final)
            console.log('[CacheManager] 🔄 Passo 4: Recarregando para consistência...');
            await this.loadFromCloud(true);
            
            this._lastSyncTime = Date.now();
            this._syncErrorCount = 0;
            
            console.log('[CacheManager] ✅ Sincronização concluída com sucesso!');
            window.dispatchEvent(new CustomEvent('syncCompleted', { detail: { success: true } }));
            return true;
        } catch (error) {
            this._syncErrorCount++;
            console.error(`[CacheManager] ❌ Erro no forceSync (${this._syncErrorCount}/${this._maxSyncErrors}):`, error);
            
            if (this._syncErrorCount < this._maxSyncErrors) {
                console.log('[CacheManager] 🔄 Tentando novamente em 5s...');
                setTimeout(() => {
                    this.forceSync();
                }, 5000);
            }
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
        this._deleteQueue = [];
        this._dbInitAttempts = 0;
        this._processingQueue = false;
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
            deleteQueueSize: this._deleteQueue.length,
            isSaving: this._isSaving,
            isLoading: this.isLoading,
            dbAvailable: !!window.DatabaseService,
            dbInitAttempts: this._dbInitAttempts,
            processingQueue: this._processingQueue,
            lastSyncTime: this._lastSyncTime ? new Date(this._lastSyncTime).toLocaleString() : 'Nunca',
            syncErrorCount: this._syncErrorCount
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
window.deleteCached = (key, id, notify) => window.CacheManager.delete(key, id, notify);
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
window.getDocumentos = () => window.CacheManager.get('documentos', []);
window.setDocumentos = (documentos, notify) => window.CacheManager.set('documentos', documentos, notify);
window.getCacheStatus = () => window.CacheManager.getStatus();

console.log('[CacheManager] ✅ CacheManager v6.0 carregado com DELETE em cascata!');