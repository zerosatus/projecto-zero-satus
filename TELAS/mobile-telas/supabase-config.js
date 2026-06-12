// supabase-config.js - Configuração do Supabase
// AGUARDAR O CDN CARREGAR
if (typeof createClient === 'undefined') {
    console.error('[Supabase] createClient não disponível. Aguardando CDN...');
    // Não tentar inicializar ainda
} else {
    iniciarSupabase();
}

function iniciarSupabase() {
    // Verificar se já foi carregado para evitar duplicação
    if (typeof window._supabaseConfigured !== 'undefined') return;
    window._supabaseConfigured = true;

    const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_CnZEwvltWwOT0H2t0-HXqA_WO-zWL2n";

    // Inicializar Supabase (apenas se não existir)
    if (typeof window.supabaseClient === 'undefined') {
        window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Supabase] ✅ Cliente inicializado');
    }

    // ... resto do código do AuthService, DatabaseService, etc. ...
}

// Se o CDN ainda não carregou, esperar
if (typeof createClient === 'undefined') {
    window.addEventListener('load', function() {
        if (typeof createClient !== 'undefined') {
            iniciarSupabase();
        } else {
            console.error('[Supabase] CDN não carregou após o load!');
        }
    });
}
// supabase-config.js - Configuração do Supabase (COMPLETO E CORRIGIDO)
// Verificar se já foi carregado para evitar duplicação
if (typeof window._supabaseConfigured === 'undefined') {
    window._supabaseConfigured = true;

const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CnZEwvltWwOT0H2t0-HXqA_WO-zWL2n";

// Inicializar Supabase (apenas se não existir)
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] ✅ Cliente inicializado');
}

// ============================================
// SERVIÇO DE AUTENTICAÇÃO
// ============================================
if (typeof window.AuthService === 'undefined') {
    window.AuthService = {
        async loginWithGoogle() {
            const supabase = window.supabaseClient;
            if (!supabase) throw new Error('Supabase não inicializado');
            
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { 
                    redirectTo: window.location.origin + '/TELAS/login/index.html'
                }
            });
            if (error) throw error;
            return data;
        },
        
        async loginWithEmail(email, password) {
            const supabase = window.supabaseClient;
            if (!supabase) throw new Error('Supabase não inicializado');
            
            const { data, error } = await supabase.auth.signInWithPassword({ 
                email, password 
            });
            if (error) throw error;
            return data;
        },
        
        async registerWithEmail(email, password, nome) {
            const supabase = window.supabaseClient;
            if (!supabase) throw new Error('Supabase não inicializado');
            
            const { data, error } = await supabase.auth.signUp({
                email, 
                password,
                options: { data: { full_name: nome } }
            });
            if (error) throw error;
            return data;
        },
        
        async logout() {
            if (window.supabaseClient) {
                await window.supabaseClient.auth.signOut();
            }
            localStorage.removeItem('usuarioLogado');
            if (window.CacheManager) window.CacheManager.logout();
        },
        
        async getCurrentUser() {
            if (!window.supabaseClient) return { data: { user: null } };
            return await window.supabaseClient.auth.getUser();
        },
        
        onAuthStateChange(callback) {
            if (!window.supabaseClient) {
                return { data: { subscription: { unsubscribe: () => {} } } };
            }
            return window.supabaseClient.auth.onAuthStateChange(callback);
        }
    };
    console.log('[Supabase] ✅ AuthService inicializado');
}

// ============================================
// SERVIÇO DE BANCO DE DADOS
// ============================================
if (typeof window.DatabaseService === 'undefined') {
    window.DatabaseService = {
        // Perfil
        async getUserProfile(userId) {
            const supabase = window.supabaseClient;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error && error.code !== 'PGRST116') return null;
            return data;
        },
        
        async updateUserProfile(userId, updates) {
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        
        async saveTask(userId, taskId, taskData) {
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        
        async saveNote(userId, noteId, noteData) {
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', userId);
            if (error) throw error;
            return data || [];
        },
        
        async saveCalendarEvent(userId, eventId, eventData) {
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
            const { data, error } = await supabase
                .from('weekly_schedule')
                .select('schedule')
                .eq('user_id', userId)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
        },
        
        async saveWeeklySchedule(userId, schedule) {
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
            const { data, error } = await supabase
                .from('time_slots')
                .select('slots')
                .eq('user_id', userId)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
        },
        
        async saveTimeSlots(userId, slots) {
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('time', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        
        async saveNotification(userId, notificationId, notificationData) {
            const supabase = window.supabaseClient;
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
            const supabase = window.supabaseClient;
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)
                .eq('user_id', userId);
            if (error) throw error;
            return true;
        },
        
        async markAllNotificationsAsRead(userId) {
            const supabase = window.supabaseClient;
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId);
            if (error) throw error;
            return true;
        },
        
        // Configurações
        async getSettings(userId) {
            const supabase = window.supabaseClient;
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data || { notifications: {}, appearance: {} };
        },
        
        async saveSettings(userId, settings) {
            const supabase = window.supabaseClient;
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
    console.log('[Supabase] ✅ DatabaseService inicializado');
}

// ============================================
// SERVIÇO DE STORAGE (FOTOS)
// ============================================
if (typeof window.StorageService === 'undefined') {
    window.StorageService = {
        async uploadProfilePhoto(userId, file) {
            const supabase = window.supabaseClient;
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
            await window.DatabaseService.updateUserProfile(userId, { avatar_url: urlData.publicUrl });
            
            return urlData.publicUrl;
        },
        
        async getProfilePhotoUrl(userId) {
            const profile = await window.DatabaseService.getUserProfile(userId);
            return profile?.avatar_url || null;
        },
        
        async deleteProfilePhoto(userId) {
            const supabase = window.supabaseClient;
            // Remover do storage
            await supabase.storage
                .from('avatars')
                .remove([`${userId}/profile.jpg`, `${userId}/profile.png`, `${userId}/profile.jpeg`]);
            
            // Atualizar perfil
            await window.DatabaseService.updateUserProfile(userId, { avatar_url: null });
            return true;
        }
    };
    console.log('[Supabase] ✅ StorageService inicializado');
}

// ============================================
// FUNÇÕES GLOBAIS DE ACESSO RÁPIDO
// ============================================
window.getCached = (key, defaultValue) => window.CacheManager?.get(key, defaultValue) || defaultValue;
window.setCached = (key, value, notify) => window.CacheManager?.set(key, value, notify);
window.forceSyncCloud = () => window.CacheManager?.forceSync();

console.log('[Supabase] 🔥 Configuração completa carregada!');

} // Fim do if de configuração única