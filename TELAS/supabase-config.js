// supabase-config.js - Configuração do Supabase
const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CnZEwvltWwOT0H2t0-HXqA_WO-zWL2n";

// Inicializar Supabase
let supabaseClient = null;

function initSupabase() {
    if (!supabaseClient && typeof createClient !== 'undefined') {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Supabase] ✅ Cliente inicializado');
    }
    return supabaseClient;
}

// Serviço de Autenticação
const AuthService = {
    async loginWithGoogle() {
        const supabase = initSupabase();
        if (!supabase) throw new Error('Supabase não inicializado');
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/login/index.html'
            }
        });
        
        if (error) throw error;
        return data;
    },
    
    async loginWithEmail(email, password) {
        const supabase = initSupabase();
        if (!supabase) throw new Error('Supabase não inicializado');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email, password
        });
        
        if (error) throw error;
        return data;
    },
    
    async registerWithEmail(email, password, nome) {
        const supabase = initSupabase();
        if (!supabase) throw new Error('Supabase não inicializado');
        
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: nome } }
        });
        
        if (error) throw error;
        return data;
    },
    
    async logout() {
        const supabase = initSupabase();
        if (supabase) {
            await supabase.auth.signOut();
        }
        localStorage.removeItem('usuarioLogado');
    },
    
    getCurrentUser() {
        const supabase = initSupabase();
        return supabase?.auth.getUser();
    },
    
    onAuthStateChange(callback) {
        const supabase = initSupabase();
        return supabase?.auth.onAuthStateChange(callback);
    }
};

// Serviço de Banco de Dados
const DatabaseService = {
    async getUserProfile(userId) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async updateUserProfile(userId, updates) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // Tarefas
    async getTasks(userId) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },
    
    async saveTask(userId, taskId, taskData) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('tasks')
            .upsert({
                id: taskId,
                user_id: userId,
                ...taskData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async deleteTask(userId, taskId) {
        const supabase = initSupabase();
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('user_id', userId);
        
        if (error) throw error;
        return true;
    },
    
    // Anotações
    async getNotes(userId) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },
    
    async saveNote(userId, noteId, noteData) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('notes')
            .upsert({
                id: noteId,
                user_id: userId,
                ...noteData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async deleteNote(userId, noteId) {
        const supabase = initSupabase();
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId)
            .eq('user_id', userId);
        
        if (error) throw error;
        return true;
    },
    
    // Eventos do Calendário
    async getCalendarEvents(userId) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data || [];
    },
    
    async saveCalendarEvent(userId, eventId, eventData) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('calendar_events')
            .upsert({
                id: eventId,
                user_id: userId,
                ...eventData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async deleteCalendarEvent(userId, eventId) {
        const supabase = initSupabase();
        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventId)
            .eq('user_id', userId);
        
        if (error) throw error;
        return true;
    },
    
    // Horário Semanal
    async getWeeklySchedule(userId) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('weekly_schedule')
            .select('schedule')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
    },
    
    async saveWeeklySchedule(userId, schedule) {
        const supabase = initSupabase();
        const { error } = await supabase
            .from('weekly_schedule')
            .upsert({
                user_id: userId,
                schedule: schedule,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        return true;
    },
    
    // Time Slots
    async getTimeSlots(userId) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('time_slots')
            .select('slots')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
    },
    
    async saveTimeSlots(userId, slots) {
        const supabase = initSupabase();
        const { error } = await supabase
            .from('time_slots')
            .upsert({
                user_id: userId,
                slots: slots,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        return true;
    },
    
    // Notificações
    async getNotifications(userId) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('time', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },
    
    async saveNotification(userId, notificationId, notificationData) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('notifications')
            .upsert({
                id: notificationId,
                user_id: userId,
                ...notificationData,
                time: notificationData.time || new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async deleteNotification(userId, notificationId) {
        const supabase = initSupabase();
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId);
        
        if (error) throw error;
        return true;
    },
    
    async markAllNotificationsAsRead(userId) {
        const supabase = initSupabase();
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId);
        
        if (error) throw error;
        return true;
    },
    
    // Configurações
    async getSettings(userId) {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data || { notifications: {}, appearance: {} };
    },
    
    async saveSettings(userId, settings) {
        const supabase = initSupabase();
        const { error } = await supabase
            .from('settings')
            .upsert({
                user_id: userId,
                ...settings,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        return true;
    }
};

// Serviço de Storage (Fotos de Perfil)
const StorageService = {
    async uploadProfilePhoto(userId, file) {
        const supabase = initSupabase();
        if (!file.type.startsWith('image/')) {
            throw new Error('Arquivo não é uma imagem');
        }
        
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('Imagem muito grande (máx 2MB)');
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/profile.${fileExt}`;
        
        // Upload da imagem
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        // Pegar URL pública
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
        
        // Atualizar perfil com a URL
        await DatabaseService.updateUserProfile(userId, { avatar_url: urlData.publicUrl });
        
        return urlData.publicUrl;
    },
    
    async getProfilePhotoUrl(userId) {
        const profile = await DatabaseService.getUserProfile(userId);
        return profile?.avatar_url || null;
    },
    
    async deleteProfilePhoto(userId) {
        const supabase = initSupabase();
        
        // Remover do storage
        const { error } = await supabase.storage
            .from('avatars')
            .remove([`${userId}/profile.jpg`, `${userId}/profile.png`, `${userId}/profile.jpeg`]);
        
        // Atualizar perfil
        await DatabaseService.updateUserProfile(userId, { avatar_url: null });
        
        return true;
    }
};

// Cache Manager adaptado para Supabase
class SupabaseCacheManager {
    constructor() {
        this.listeners = new Map();
        this.currentUserId = null;
        this._unsubscribe = null;
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
            
            // Debounce para sincronização
            if (this._pendingSync.has(key)) {
                clearTimeout(this._pendingSync.get(key));
            }
            
            const timeoutId = setTimeout(() => {
                this.syncToSupabase(key, value);
                this._pendingSync.delete(key);
            }, 500);
            
            this._pendingSync.set(key, timeoutId);
            
            return true;
        } catch (error) {
            console.error(`[CacheManager] Erro ao set ${key}:`, error);
            return false;
        }
    }
    
    async syncToSupabase(key, value) {
        const userId = this.getCurrentUserId();
        if (!userId) return;
        
        console.log(`[CacheManager] Sincronizando ${key} para o Supabase...`);
        
        try {
            switch(key) {
                case 'tasks':
                    await DatabaseService.saveTasksBatch(userId, value);
                    break;
                case 'notes':
                    await DatabaseService.saveNotesBatch(userId, value);
                    break;
                case 'calendarEvents':
                    await DatabaseService.saveEventsBatch(userId, value);
                    break;
                case 'weeklySchedule':
                    await DatabaseService.saveWeeklySchedule(userId, value);
                    break;
                case 'timeSlots':
                    await DatabaseService.saveTimeSlots(userId, value);
                    break;
                case 'notifications':
                    await DatabaseService.saveNotificationsBatch(userId, value);
                    break;
            }
            console.log(`[CacheManager] ✅ ${key} sincronizado!`);
        } catch (error) {
            console.error(`[CacheManager] Erro ao sincronizar ${key}:`, error);
        }
    }
    
    async loadFromCloud() {
        const userId = this.getCurrentUserId();
        if (!userId) return false;
        
        console.log('[CacheManager] ☁️ Carregando dados da nuvem...');
        let hasChanges = false;
        
        try {
            const tasks = await DatabaseService.getTasks(userId);
            if (tasks) {
                localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
                hasChanges = true;
            }
            
            const notes = await DatabaseService.getNotes(userId);
            if (notes) {
                localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
                hasChanges = true;
            }
            
            const events = await DatabaseService.getCalendarEvents(userId);
            if (events) {
                localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(events));
                hasChanges = true;
            }
            
            const schedule = await DatabaseService.getWeeklySchedule(userId);
            if (schedule) {
                localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(schedule));
                hasChanges = true;
            }
            
            const slots = await DatabaseService.getTimeSlots(userId);
            if (slots) {
                localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(slots));
                hasChanges = true;
            }
            
            const notif = await DatabaseService.getNotifications(userId);
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
    
    async uploadProfilePhoto(file) {
        const userId = this.getCurrentUserId();
        if (!userId) return null;
        return await StorageService.uploadProfilePhoto(userId, file);
    }
    
    async getProfilePhotoUrl() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;
        return await StorageService.getProfilePhotoUrl(userId);
    }
    
    async deleteProfilePhoto() {
        const userId = this.getCurrentUserId();
        if (!userId) return false;
        return await StorageService.deleteProfilePhoto(userId);
    }
}

// Instância global
window.CacheManager = new SupabaseCacheManager();
window.supabaseClient = initSupabase();
window.AuthService = AuthService;
window.DatabaseService = DatabaseService;
window.StorageService = StorageService;

// Funções globais
window.getCached = (key, defaultValue) => window.CacheManager.get(key, defaultValue);
window.setCached = (key, value, notify) => window.CacheManager.set(key, value, notify);
window.forceSyncCloud = () => window.CacheManager.forceSync();

console.log('[Supabase] 🔥 Configuração completa carregada!');