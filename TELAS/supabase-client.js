// supabase-client.js - Cliente Supabase unificado

const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";

// Criar cliente Supabase
let supabaseClient = null;

function initSupabase() {
    if (!supabaseClient && typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Supabase] Cliente inicializado');
    }
    return supabaseClient;
}

// Serviço de Autenticação
const AuthService = {
    async loginWithEmail(email, password) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');
        
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        await this.ensureProfileExists(data.user);
        return { user: data.user };
    },
    
    async registerWithEmail(email, password, nome) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');
        
        const { data, error } = await client.auth.signUp({
            email, password,
            options: { data: { full_name: nome } }
        });
        if (error) throw error;
        
        if (data.user) {
            await this.createProfile(data.user.id, email, nome);
        }
        
        return { user: data.user };
    },
    
    async loginWithGoogle() {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');
        
        const { error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
        if (error) throw error;
    },
    
    async createProfile(userId, email, nome) {
        const client = initSupabase();
        const { error } = await client.from('profiles').insert({
            id: userId,
            email: email,
            nome: nome || email.split('@')[0]
        });
        if (error) console.error('[Auth] Erro ao criar perfil:', error);
    },
    
    async ensureProfileExists(user) {
        const client = initSupabase();
        const { data, error } = await client.from('profiles').select('*').eq('id', user.id).single();
        
        if (error && error.code === 'PGRST116') {
            await this.createProfile(user.id, user.email, user.user_metadata?.full_name);
        }
    },
    
    async getCurrentUser() {
        const client = initSupabase();
        if (!client) return { data: { user: null } };
        
        const { data: { user } } = await client.auth.getUser();
        return { data: { user } };
    },
    
    onAuthStateChange(callback) {
        const client = initSupabase();
        if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
        
        return client.auth.onAuthStateChange(callback);
    },
    
    async logout() {
        const client = initSupabase();
        if (client) await client.auth.signOut();
    }
};

// Serviço de Banco de Dados
const DatabaseService = {
    async getCurrentUserId() {
        const { data: { user } } = await AuthService.getCurrentUser();
        return user?.id || null;
    },
    
    async getTasks(userId) {
        const client = initSupabase();
        const { data, error } = await client.from('tasks').select('*').eq('user_id', userId);
        if (error) throw error;
        return data || [];
    },
    
    async saveTasks(userId, tasks) {
        const client = initSupabase();
        
        // Primeiro, deletar todas as tarefas existentes
        await client.from('tasks').delete().eq('user_id', userId);
        
        // Inserir novas tarefas
        if (tasks.length > 0) {
            const tasksToInsert = tasks.map(t => ({
                id: t.id,
                user_id: userId,
                title: t.title || t.nome,
                description: t.description || t.descricao || '',
                subject: t.subject || t.disciplina || 'geral',
                priority: t.priority || 'media',
                date: t.date || t.prazo || null,
                completed: t.completed || false,
                favorita: t.favorita || false,
                subtasks: t.subtasks || [],
                updated_at: new Date().toISOString()
            }));
            
            const { error } = await client.from('tasks').insert(tasksToInsert);
            if (error) throw error;
        }
        
        return true;
    },
    
    async getNotes(userId) {
        const client = initSupabase();
        const { data, error } = await client.from('notes').select('*').eq('user_id', userId);
        if (error) throw error;
        return data || [];
    },
    
    async saveNotes(userId, notes) {
        const client = initSupabase();
        await client.from('notes').delete().eq('user_id', userId);
        
        if (notes.length > 0) {
            const notesToInsert = notes.map(n => ({
                id: n.id,
                user_id: userId,
                title: n.title || 'Sem título',
                content: n.content || '',
                updated_at: new Date().toISOString()
            }));
            
            const { error } = await client.from('notes').insert(notesToInsert);
            if (error) throw error;
        }
        
        return true;
    },
    
    async getCalendarEvents(userId) {
        const client = initSupabase();
        const { data, error } = await client.from('calendar_events').select('*').eq('user_id', userId);
        if (error) throw error;
        return data || [];
    },
    
    async saveCalendarEvents(userId, events) {
        const client = initSupabase();
        await client.from('calendar_events').delete().eq('user_id', userId);
        
        if (events.length > 0) {
            const eventsToInsert = events.map(e => ({
                id: e.id,
                user_id: userId,
                title: e.title,
                description: e.description || '',
                date: e.date,
                start_time: e.start || e.startTime,
                end_time: e.end || e.endTime,
                type: e.type || 'aula',
                color: e.color || '#8b5cf6',
                repeat_type: e.repeat || 'nao',
                reminder: e.reminder || false,
                updated_at: new Date().toISOString()
            }));
            
            const { error } = await client.from('calendar_events').insert(eventsToInsert);
            if (error) throw error;
        }
        
        return true;
    },
    
    async getWeeklySchedule(userId) {
        const client = initSupabase();
        const { data, error } = await client.from('weekly_schedule').select('*').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
    },
    
    async saveWeeklySchedule(userId, schedule) {
        const client = initSupabase();
        
        const { error } = await client.from('weekly_schedule').upsert({
            user_id: userId,
            schedule: schedule,
            updated_at: new Date().toISOString()
        });
        
        if (error) throw error;
        return true;
    },
    
    async getTimeSlots(userId) {
        const client = initSupabase();
        const { data, error } = await client.from('time_slots').select('*').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
    },
    
    async saveTimeSlots(userId, slots) {
        const client = initSupabase();
        
        const { error } = await client.from('time_slots').upsert({
            user_id: userId,
            slots: slots,
            updated_at: new Date().toISOString()
        });
        
        if (error) throw error;
        return true;
    },
    
    async getNotifications(userId) {
        const client = initSupabase();
        const { data, error } = await client.from('notifications').select('*').eq('user_id', userId);
        if (error) throw error;
        return data || [];
    },
    
    async saveNotifications(userId, notifications) {
        const client = initSupabase();
        await client.from('notifications').delete().eq('user_id', userId);
        
        if (notifications.length > 0) {
            const notifToInsert = notifications.map(n => ({
                id: n.id,
                user_id: userId,
                title: n.title,
                message: n.message,
                type: n.type || 'info',
                read: n.read || false,
                created_at: n.time || n.created_at || new Date().toISOString()
            }));
            
            const { error } = await client.from('notifications').insert(notifToInsert);
            if (error) throw error;
        }
        
        return true;
    },
    
    async getUserSettings(userId) {
        const client = initSupabase();
        const { data, error } = await client.from('user_settings').select('*').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    },
    
    async saveUserSettings(userId, settings) {
        const client = initSupabase();
        
        const { error } = await client.from('user_settings').upsert({
            user_id: userId,
            theme: settings.theme || 'dark',
            accent_color: settings.accent || '#8b5cf6',
            font_size: settings.fontSize || 14,
            notifications_settings: settings.notificationsSettings || {},
            updated_at: new Date().toISOString()
        });
        
        if (error) throw error;
        return true;
    },
    
    async getUserProfile(userId) {
        const client = initSupabase();
        const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
        if (error) throw error;
        return data;
    },
    
    async updateUserProfile(userId, profile) {
        const client = initSupabase();
        
        const { error } = await client.from('profiles').update({
            nome: profile.nome,
            telefone: profile.telefone,
            nascimento: profile.nascimento,
            genero: profile.genero,
            avatar_url: profile.avatar_url,
            updated_at: new Date().toISOString()
        }).eq('id', userId);
        
        if (error) throw error;
        return true;
    }
};

// Serviço de Storage (para fotos)
const StorageService = {
    async uploadProfilePhoto(userId, file) {
        const client = initSupabase();
        if (!client) return null;
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await client.storage
            .from('user-content')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = client.storage
            .from('user-content')
            .getPublicUrl(filePath);
        
        if (publicUrl) {
            await DatabaseService.updateUserProfile(userId, { avatar_url: publicUrl });
        }
        
        // Converter para Base64 para compatibilidade
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    },
    
    async deleteProfilePhoto(userId) {
        // Buscar URL atual e deletar do storage
        const profile = await DatabaseService.getUserProfile(userId);
        if (profile?.avatar_url) {
            try {
                const filePath = profile.avatar_url.split('/').pop();
                const client = initSupabase();
                await client.storage.from('user-content').remove([`avatars/${filePath}`]);
            } catch(e) {}
        }
        
        await DatabaseService.updateUserProfile(userId, { avatar_url: null });
        return true;
    }
};

// Exportar
window.SupabaseClient = { initSupabase };
window.AuthService = AuthService;
window.DatabaseService = DatabaseService;
window.StorageService = StorageService;

// Disparar evento quando pronto
window.dispatchEvent(new CustomEvent('supabaseReady'));

console.log('[Supabase] Serviços carregados com sucesso!');