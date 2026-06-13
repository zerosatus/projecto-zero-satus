// database-service.js - Serviço completo de banco de dados Supabase

const DatabaseService = (function() {
    let supabase = null;
    
    function init() {
        if (!supabase && window.supabase) {
            const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[DatabaseService] Supabase inicializado');
        }
        return supabase;
    }
    
    async function getCurrentUserId() {
        const client = init();
        if (!client) return null;
        
        const { data: { user } } = await client.auth.getUser();
        return user?.id || null;
    }
    
    // ============================================
    // TASKS (Tarefas)
    // ============================================
    async function getTasks(userId) {
        const client = init();
        if (!client) return [];
        
        const { data, error } = await client
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('[Database] Erro ao buscar tasks:', error);
            return [];
        }
        
        // Converter para o formato usado pela interface
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
    }
    
    async function saveTasks(userId, tasks) {
        const client = init();
        if (!client) return false;
        
        try {
            // Primeiro, deletar todas as tarefas existentes
            await client.from('tasks').delete().eq('user_id', userId);
            
            if (tasks.length === 0) return true;
            
            // Inserir novas tarefas
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
            
            console.log(`[Database] ${tasks.length} tarefas salvas`);
            return true;
        } catch (error) {
            console.error('[Database] Erro ao salvar tasks:', error);
            return false;
        }
    }
    
    // ============================================
    // NOTES (Anotações)
    // ============================================
    async function getNotes(userId) {
        const client = init();
        if (!client) return [];
        
        const { data, error } = await client
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.error('[Database] Erro ao buscar notes:', error);
            return [];
        }
        
        return (data || []).map(note => ({
            id: note.id,
            title: note.title || 'Sem título',
            content: note.content || '',
            date: note.created_at,
            dataModificacao: note.updated_at
        }));
    }
    
    async function saveNotes(userId, notes) {
        const client = init();
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
            
            console.log(`[Database] ${notes.length} anotações salvas`);
            return true;
        } catch (error) {
            console.error('[Database] Erro ao salvar notes:', error);
            return false;
        }
    }
    
    // ============================================
    // CALENDAR EVENTS (Eventos)
    // ============================================
    async function getCalendarEvents(userId) {
        const client = init();
        if (!client) return [];
        
        const { data, error } = await client
            .from('calendar_events')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: true });
        
        if (error) {
            console.error('[Database] Erro ao buscar eventos:', error);
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
    }
    
    async function saveCalendarEvents(userId, events) {
        const client = init();
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
            
            console.log(`[Database] ${events.length} eventos salvos`);
            return true;
        } catch (error) {
            console.error('[Database] Erro ao salvar eventos:', error);
            return false;
        }
    }
    
    // ============================================
    // WEEKLY SCHEDULE (Horário Semanal)
    // ============================================
    async function getWeeklySchedule(userId) {
        const client = init();
        if (!client) return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
        
        const { data, error } = await client
            .from('weekly_schedule')
            .select('schedule')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('[Database] Erro ao buscar horário:', error);
        }
        
        const schedule = data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
        
        // Garantir que todos os dias existem
        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        dias.forEach(day => {
            if (!schedule[day]) schedule[day] = [];
        });
        
        return schedule;
    }
    
    async function saveWeeklySchedule(userId, schedule) {
        const client = init();
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
            console.log('[Database] Horário salvo');
            return true;
        } catch (error) {
            console.error('[Database] Erro ao salvar horário:', error);
            return false;
        }
    }
    
    // ============================================
    // TIME SLOTS (Horários disponíveis)
    // ============================================
    async function getTimeSlots(userId) {
        const client = init();
        if (!client) return ['08:00', '09:30', '11:00', '14:00', '15:30'];
        
        const { data, error } = await client
            .from('time_slots')
            .select('slots')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('[Database] Erro ao buscar time slots:', error);
        }
        
        return data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
    }
    
    async function saveTimeSlots(userId, slots) {
        const client = init();
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
            console.log('[Database] Time slots salvos');
            return true;
        } catch (error) {
            console.error('[Database] Erro ao salvar time slots:', error);
            return false;
        }
    }
    
    // ============================================
    // NOTIFICATIONS (Notificações)
    // ============================================
    async function getNotifications(userId) {
        const client = init();
        if (!client) return [];
        
        const { data, error } = await client
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('[Database] Erro ao buscar notificações:', error);
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
    }
    
    async function saveNotifications(userId, notifications) {
        const client = init();
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
            
            console.log(`[Database] ${notifications.length} notificações salvas`);
            return true;
        } catch (error) {
            console.error('[Database] Erro ao salvar notificações:', error);
            return false;
        }
    }
    
    // ============================================
    // USER PROFILE (Perfil do usuário)
    // ============================================
    async function getUserProfile(userId) {
        const client = init();
        if (!client) return null;
        
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('[Database] Erro ao buscar perfil:', error);
        }
        
        return data || null;
    }
    
    async function updateUserProfile(userId, profile) {
        const client = init();
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
            console.log('[Database] Perfil atualizado');
            return true;
        } catch (error) {
            console.error('[Database] Erro ao atualizar perfil:', error);
            return false;
        }
    }
    
    async function createProfile(userId, email, nome) {
        const client = init();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('profiles')
                .insert({
                    id: userId,
                    email: email,
                    nome: nome || email.split('@')[0],
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            console.log('[Database] Perfil criado');
            return true;
        } catch (error) {
            console.error('[Database] Erro ao criar perfil:', error);
            return false;
        }
    }
    
    // ============================================
    // USER SETTINGS (Configurações)
    // ============================================
    async function getUserSettings(userId) {
        const client = init();
        if (!client) return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
        
        const { data, error } = await client
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('[Database] Erro ao buscar settings:', error);
        }
        
        if (data) {
            return {
                theme: data.theme,
                accent: data.accent_color,
                fontSize: data.font_size,
                notificationsSettings: data.notifications_settings
            };
        }
        
        return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
    }
    
    async function saveUserSettings(userId, settings) {
        const client = init();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('user_settings')
                .upsert({
                    user_id: userId,
                    theme: settings.theme || 'dark',
                    accent_color: settings.accent || '#8b5cf6',
                    font_size: settings.fontSize || 14,
                    notifications_settings: settings.notificationsSettings || {},
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            console.log('[Database] Settings salvos');
            return true;
        } catch (error) {
            console.error('[Database] Erro ao salvar settings:', error);
            return false;
        }
    }
    
    // ============================================
    // STORAGE (Fotos)
    // ============================================
    async function uploadProfilePhoto(userId, file) {
        const client = init();
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
                await updateUserProfile(userId, { avatar_url: publicUrl });
            }
            
            // Retornar como Base64 para compatibilidade com o sistema atual
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('[Database] Erro ao fazer upload:', error);
            return null;
        }
    }
    
    async function deleteProfilePhoto(userId) {
        const client = init();
        if (!client) return false;
        
        try {
            const profile = await getUserProfile(userId);
            if (profile?.avatar_url) {
                const filePath = profile.avatar_url.split('/').pop();
                await client.storage.from('user-content').remove([`avatars/${filePath}`]);
            }
            
            await updateUserProfile(userId, { avatar_url: null });
            return true;
        } catch (error) {
            console.error('[Database] Erro ao deletar foto:', error);
            return false;
        }
    }
    
    // ============================================
    // INITIALIZATION (Criar estrutura se não existir)
    // ============================================
    async function ensureUserData(userId, email, nome) {
        // Verificar/criar perfil
        let profile = await getUserProfile(userId);
        if (!profile) {
            await createProfile(userId, email, nome);
        }
        
        // Verificar/criar weekly_schedule
        let schedule = await getWeeklySchedule(userId);
        if (!schedule || Object.keys(schedule).length === 0) {
            await saveWeeklySchedule(userId, { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] });
        }
        
        // Verificar/criar time_slots
        let slots = await getTimeSlots(userId);
        if (!slots || slots.length === 0) {
            await saveTimeSlots(userId, ['08:00', '09:30', '11:00', '14:00', '15:30']);
        }
        
        // Verificar/criar settings
        let settings = await getUserSettings(userId);
        if (!settings || Object.keys(settings).length === 0) {
            await saveUserSettings(userId, { theme: 'dark', accent: '#8b5cf6', fontSize: 14 });
        }
        
        console.log('[Database] Estrutura do usuário verificada');
        return true;
    }
    
    // API pública
    return {
        init,
        getCurrentUserId,
        getTasks,
        saveTasks,
        getNotes,
        saveNotes,
        getCalendarEvents,
        saveCalendarEvents,
        getWeeklySchedule,
        saveWeeklySchedule,
        getTimeSlots,
        saveTimeSlots,
        getNotifications,
        saveNotifications,
        getUserProfile,
        updateUserProfile,
        createProfile,
        getUserSettings,
        saveUserSettings,
        uploadProfilePhoto,
        deleteProfilePhoto,
        ensureUserData
    };
})();

// Exportar para uso global
window.DatabaseService = DatabaseService;

console.log('[DatabaseService] Módulo carregado com sucesso!');