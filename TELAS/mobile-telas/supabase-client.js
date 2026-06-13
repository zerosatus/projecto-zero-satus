// supabase-client.js - Cliente Supabase unificado (VERSÃO CORRIGIDA)

const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";

let supabaseClient = null;

function initSupabase() {
    if (!supabaseClient && typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Supabase] Cliente inicializado');
    }
    return supabaseClient;
}

// ============================================
// SERVIÇO DE AUTENTICAÇÃO
// ============================================
const AuthService = {
    async loginWithEmail(email, password) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');
        
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Garantir que o perfil existe
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
        const { error } = await client.from('profiles').upsert({
            id: userId,
            email: email,
            nome: nome || email.split('@')[0],
            created_at: new Date().toISOString()
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

// ============================================
// SERVIÇO DE BANCO DE DADOS
// ============================================
const DatabaseService = {
    async getCurrentUserId() {
        const { data: { user } } = await AuthService.getCurrentUser();
        return user?.id || null;
    },
    
    async getTasks(userId) {
        const client = initSupabase();
        if (!client) return [];
        
        console.log('[DB] Buscando tasks para:', userId);
        
        const { data, error } = await client
            .from('tasks')
            .select('*')
            .eq('user_id', userId);
        
        if (error) {
            console.error('[DB] Erro ao buscar tasks:', error);
            return [];
        }
        
        return (data || []).map(task => ({
            id: task.id,
            nome: task.title,
            descricao: task.description,
            disciplina: task.subject,
            prioridade: task.priority,
            prazo: task.date,
            completed: task.completed,
            favorita: task.favorita,
            subtasks: task.subtasks || [],
            dataCriacao: task.created_at,
            dataConclusao: task.completed ? task.updated_at : null
        }));
    },
    
    async saveTasks(userId, tasks) {
        const client = initSupabase();
        if (!client) return false;
        
        try {
            await client.from('tasks').delete().eq('user_id', userId);
            
            if (tasks.length === 0) return true;
            
            const tasksToInsert = tasks.map(task => ({
                id: task.id,
                user_id: userId,
                title: task.nome || task.title || 'Sem título',
                description: task.descricao || '',
                subject: task.disciplina || task.subject || 'geral',
                priority: task.prioridade || 'media',
                date: task.prazo || null,
                completed: task.completed || false,
                favorita: task.favorita || false,
                subtasks: task.subtasks || [],
                updated_at: new Date().toISOString()
            }));
            
            const { error } = await client.from('tasks').insert(tasksToInsert);
            if (error) throw error;
            
            console.log(`[DB] ${tasks.length} tarefas salvas`);
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar tasks:', error);
            return false;
        }
    },
    
    async getNotes(userId) {
        const client = initSupabase();
        if (!client) return [];
        
        const { data, error } = await client
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.error('[DB] Erro ao buscar notes:', error);
            return [];
        }
        
        return (data || []).map(note => ({
            id: note.id,
            title: note.title || 'Sem título',
            content: note.content || '',
            date: note.created_at,
            dataModificacao: note.updated_at
        }));
    },
    
    async saveNotes(userId, notes) {
        const client = initSupabase();
        if (!client) return false;
        
        try {
            await client.from('notes').delete().eq('user_id', userId);
            
            if (notes.length === 0) return true;
            
            const notesToInsert = notes.map(note => ({
                id: note.id,
                user_id: userId,
                title: note.title || 'Sem título',
                content: note.content || '',
                updated_at: new Date().toISOString()
            }));
            
            const { error } = await client.from('notes').insert(notesToInsert);
            if (error) throw error;
            
            console.log(`[DB] ${notes.length} anotações salvas`);
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar notes:', error);
            return false;
        }
    },
    
    async getCalendarEvents(userId) {
        const client = initSupabase();
        if (!client) return [];
        
        const { data, error } = await client
            .from('calendar_events')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: true });
        
        if (error) {
            console.error('[DB] Erro ao buscar eventos:', error);
            return [];
        }
        
        return (data || []).map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.date,
            start: event.start_time,
            end: event.end_time,
            type: event.type,
            color: event.color,
            repeat: event.repeat_type,
            reminder: event.reminder,
            day: event.date ? new Date(event.date).getDate() : null,
            month: event.date ? new Date(event.date).getMonth() : null,
            year: event.date ? new Date(event.date).getFullYear() : null,
            time: event.start_time
        }));
    },
    
    async saveCalendarEvents(userId, events) {
        const client = initSupabase();
        if (!client) return false;
        
        try {
            await client.from('calendar_events').delete().eq('user_id', userId);
            
            if (events.length === 0) return true;
            
            const eventsToInsert = events.map(event => ({
                id: event.id,
                user_id: userId,
                title: event.title,
                description: event.description || '',
                date: event.date,
                start_time: event.start || event.startTime,
                end_time: event.end || event.endTime,
                type: event.type || 'aula',
                color: event.color || '#8b5cf6',
                repeat_type: event.repeat || 'nao',
                reminder: event.reminder || false,
                updated_at: new Date().toISOString()
            }));
            
            const { error } = await client.from('calendar_events').insert(eventsToInsert);
            if (error) throw error;
            
            console.log(`[DB] ${events.length} eventos salvos`);
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar eventos:', error);
            return false;
        }
    },
    
    async getWeeklySchedule(userId) {
        const client = initSupabase();
        if (!client) return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
        
        const { data, error } = await client
            .from('weekly_schedule')
            .select('schedule')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('[DB] Erro ao buscar horário:', error);
        }
        
        return data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
    },
    
    async saveWeeklySchedule(userId, schedule) {
        const client = initSupabase();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('weekly_schedule')
                .upsert({
                    user_id: userId,
                    schedule: schedule,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            console.log('[DB] Horário salvo');
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar horário:', error);
            return false;
        }
    },
    
    async getTimeSlots(userId) {
        const client = initSupabase();
        if (!client) return ['08:00', '09:30', '11:00', '14:00', '15:30'];
        
        const { data, error } = await client
            .from('time_slots')
            .select('slots')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('[DB] Erro ao buscar time slots:', error);
        }
        
        return data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
    },
    
    async saveTimeSlots(userId, slots) {
        const client = initSupabase();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('time_slots')
                .upsert({
                    user_id: userId,
                    slots: slots,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            console.log('[DB] Time slots salvos');
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar time slots:', error);
            return false;
        }
    },
    
    async getNotifications(userId) {
        const client = initSupabase();
        if (!client) return [];
        
        const { data, error } = await client
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('[DB] Erro ao buscar notificações:', error);
            return [];
        }
        
        return (data || []).map(notif => ({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            read: notif.read,
            time: notif.created_at
        }));
    },
    
    async saveNotifications(userId, notifications) {
        const client = initSupabase();
        if (!client) return false;
        
        try {
            await client.from('notifications').delete().eq('user_id', userId);
            
            if (notifications.length === 0) return true;
            
            const notifToInsert = notifications.map(notif => ({
                id: notif.id,
                user_id: userId,
                title: notif.title,
                message: notif.message || '',
                type: notif.type || 'info',
                read: notif.read || false,
                created_at: notif.time || new Date().toISOString()
            }));
            
            const { error } = await client.from('notifications').insert(notifToInsert);
            if (error) throw error;
            
            console.log(`[DB] ${notifications.length} notificações salvas`);
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar notificações:', error);
            return false;
        }
    },
    
    async getUserProfile(userId) {
        const client = initSupabase();
        if (!client) return null;
        
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('[DB] Erro ao buscar perfil:', error);
        }
        
        return data || null;
    },
    
    async updateUserProfile(userId, profile) {
        const client = initSupabase();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('profiles')
                .update({
                    nome: profile.nome,
                    telefone: profile.telefone,
                    nascimento: profile.nascimento,
                    genero: profile.genero,
                    avatar_url: profile.avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
            
            if (error) throw error;
            console.log('[DB] Perfil atualizado');
            return true;
        } catch (error) {
            console.error('[DB] Erro ao atualizar perfil:', error);
            return false;
        }
    },
    
    async ensureUserData(userId, email, nome) {
        let profile = await this.getUserProfile(userId);
        if (!profile) {
            const client = initSupabase();
            if (client) {
                await client.from('profiles').insert({
                    id: userId,
                    email: email,
                    nome: nome || email.split('@')[0],
                    created_at: new Date().toISOString()
                });
            }
        }
        
        let schedule = await this.getWeeklySchedule(userId);
        if (!schedule || Object.keys(schedule).length === 0) {
            await this.saveWeeklySchedule(userId, { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] });
        }
        
        let slots = await this.getTimeSlots(userId);
        if (!slots || slots.length === 0) {
            await this.saveTimeSlots(userId, ['08:00', '09:30', '11:00', '14:00', '15:30']);
        }
        
        console.log('[DB] Estrutura do usuário verificada');
        return true;
    }
};

// ============================================
// SERVIÇO DE STORAGE
// ============================================
const StorageService = {
    async uploadProfilePhoto(userId, file) {
        const client = initSupabase();
        if (!client) return null;
        
        try {
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
            
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('[Storage] Erro ao fazer upload:', error);
            return null;
        }
    },
    
    async deleteProfilePhoto(userId) {
        const client = initSupabase();
        if (!client) return false;
        
        try {
            const profile = await DatabaseService.getUserProfile(userId);
            if (profile?.avatar_url) {
                const filePath = profile.avatar_url.split('/').pop();
                await client.storage.from('user-content').remove([`avatars/${filePath}`]);
            }
            
            await DatabaseService.updateUserProfile(userId, { avatar_url: null });
            return true;
        } catch (error) {
            console.error('[Storage] Erro ao deletar foto:', error);
            return false;
        }
    }
};

// EXPORTAR
window.SupabaseClient = { initSupabase };
window.AuthService = AuthService;
window.DatabaseService = DatabaseService;
window.StorageService = StorageService;

window.dispatchEvent(new CustomEvent('supabaseReady'));

console.log('[Supabase] Serviços carregados com sucesso!');