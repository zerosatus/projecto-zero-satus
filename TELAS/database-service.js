// database-service.js - Serviço completo de banco de dados Supabase (VERSÃO CORRIGIDA - ERRO 409 FIX)

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
    
    // ============================================
    // FUNÇÃO PARA GERAR ID ÚNICO
    // ============================================
    function generateId() {
        return crypto.randomUUID ? crypto.randomUUID() : 
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    }
    
    async function getCurrentUserId() {
        const client = init();
        if (!client) return null;
        
        try {
            const { data: { user } } = await client.auth.getUser();
            return user?.id || null;
        } catch (error) {
            console.error('[Database] Erro ao buscar userId:', error);
            return null;
        }
    }
    
    // ============================================
    // TASKS (Tarefas) - CORRIGIDO
    // ============================================
    async function getTasks(userId) {
        const client = init();
        if (!client) return [];
        
        try {
            const { data, error } = await client
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('[Database] Erro ao buscar tasks:', error);
                return [];
            }
            
            return (data || []).map(task => ({
                id: task.id,
                nome: task.title,
                descricao: task.description,
                disciplina: task.subject,
                prioridade: task.priority,
                prazo: task.date,
                completed: task.completed || false,
                favorita: task.favorita || false,
                subtasks: task.subtasks || [],
                dataCriacao: task.created_at,
                dataConclusao: task.completed ? task.updated_at : null
            }));
        } catch (error) {
            console.error('[Database] Erro ao buscar tasks:', error);
            return [];
        }
    }
    
    async function saveTasks(userId, tasks) {
        const client = init();
        if (!client) return false;
        
        try {
            // Deletar todas as tarefas existentes
            const { error: deleteError } = await client
                .from('tasks')
                .delete()
                .eq('user_id', userId);
            
            if (deleteError) {
                console.error('[Database] Erro ao deletar tasks:', deleteError);
                return false;
            }
            
            if (!tasks || tasks.length === 0) {
                console.log('[Database] Nenhuma task para salvar');
                return true;
            }
            
            // Preparar dados com IDs novos (UUID)
            const tasksToInsert = tasks.map(task => ({
                id: generateId(), // ✅ SEMPRE GERAR NOVO ID
                user_id: userId,
                title: task.nome || task.title || 'Sem título',
                description: task.descricao || '',
                subject: task.disciplina || task.subject || 'geral',
                priority: task.prioridade || 'media',
                date: task.prazo || null,
                completed: task.completed || false,
                favorita: task.favorita || false,
                subtasks: task.subtasks || [],
                created_at: task.dataCriacao || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));
            
            // Inserir em lotes de 100 para evitar problemas
            const batchSize = 100;
            for (let i = 0; i < tasksToInsert.length; i += batchSize) {
                const batch = tasksToInsert.slice(i, i + batchSize);
                const { error } = await client.from('tasks').insert(batch);
                if (error) throw error;
            }
            
            console.log(`[Database] ${tasks.length} tarefas salvas`);
            return true;
        } catch (error) {
            console.error('[Database] Erro ao salvar tasks:', error);
            return false;
        }
    }
    
    // ============================================
    // NOTES (Anotações) - CORRIGIDO
    // ============================================
    async function getNotes(userId) {
        const client = init();
        if (!client) return [];
        
        try {
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
        } catch (error) {
            console.error('[Database] Erro ao buscar notes:', error);
            return [];
        }
    }
    
    async function saveNotes(userId, notes) {
        const client = init();
        if (!client) return false;
        
        try {
            const { error: deleteError } = await client
                .from('notes')
                .delete()
                .eq('user_id', userId);
            
            if (deleteError) {
                console.error('[Database] Erro ao deletar notes:', deleteError);
                return false;
            }
            
            if (!notes || notes.length === 0) {
                console.log('[Database] Nenhuma anotação para salvar');
                return true;
            }
            
            const notesToInsert = notes.map(note => ({
                id: generateId(), // ✅ SEMPRE GERAR NOVO ID
                user_id: userId,
                title: note.title || 'Sem título',
                content: note.content || '',
                created_at: note.date || new Date().toISOString(),
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
    // CALENDAR EVENTS (Eventos) - CORRIGIDO ⭐
    // ============================================
    async function getCalendarEvents(userId) {
        const client = init();
        if (!client) return [];
        
        try {
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
                description: event.description || '',
                date: event.date,
                start: event.start_time,
                end: event.end_time,
                type: event.type || 'aula',
                color: event.color || '#8b5cf6',
                repeat: event.repeat_type || 'nao',
                reminder: event.reminder || false
            }));
        } catch (error) {
            console.error('[Database] Erro ao buscar eventos:', error);
            return [];
        }
    }
    
    async function saveCalendarEvents(userId, events) {
        const client = init();
        if (!client) return false;
        
        try {
            console.log(`[Database] Salvando ${events?.length || 0} eventos para ${userId}`);
            
            // ✅ DELETAR TODOS OS EVENTOS EXISTENTES PRIMEIRO
            const { error: deleteError } = await client
                .from('calendar_events')
                .delete()
                .eq('user_id', userId);
            
            if (deleteError) {
                console.error('[Database] Erro ao deletar eventos:', deleteError);
                return false;
            }
            
            if (!events || events.length === 0) {
                console.log('[Database] Nenhum evento para salvar');
                return true;
            }
            
            // ✅ GERAR NOVOS IDs PARA CADA EVENTO
            const eventsToInsert = events.map(event => ({
                id: generateId(), // 🔥 CRUCIAL: SEMPRE GERAR NOVO ID
                user_id: userId,
                title: event.title || 'Evento',
                description: event.description || '',
                date: event.date || new Date().toISOString().split('T')[0],
                start_time: event.start || event.startTime || '08:00',
                end_time: event.end || event.endTime || '09:00',
                type: event.type || 'aula',
                color: event.color || '#8b5cf6',
                repeat_type: event.repeat || 'nao',
                reminder: event.reminder || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));
            
            // ✅ INSERIR EM LOTE
            const { error } = await client.from('calendar_events').insert(eventsToInsert);
            
            if (error) {
                console.error('[Database] Erro ao inserir eventos:', error);
                return false;
            }
            
            console.log(`[Database] ${events.length} eventos salvos com sucesso`);
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
        
        try {
            const { data, error } = await client
                .from('weekly_schedule')
                .select('schedule')
                .eq('user_id', userId)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('[Database] Erro ao buscar horário:', error);
            }
            
            const schedule = data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
            
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            dias.forEach(day => {
                if (!schedule[day]) schedule[day] = [];
            });
            
            return schedule;
        } catch (error) {
            console.error('[Database] Erro ao buscar horário:', error);
            return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
        }
    }
    
    async function saveWeeklySchedule(userId, schedule) {
        const client = init();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('weekly_schedule')
                .upsert({
                    user_id: userId,
                    schedule: schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            
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
        
        try {
            const { data, error } = await client
                .from('time_slots')
                .select('slots')
                .eq('user_id', userId)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('[Database] Erro ao buscar time slots:', error);
            }
            
            return data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
        } catch (error) {
            console.error('[Database] Erro ao buscar time slots:', error);
            return ['08:00', '09:30', '11:00', '14:00', '15:30'];
        }
    }
    
    async function saveTimeSlots(userId, slots) {
        const client = init();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('time_slots')
                .upsert({
                    user_id: userId,
                    slots: slots || ['08:00', '09:30', '11:00', '14:00', '15:30'],
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            
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
        
        try {
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
                title: notif.title || 'Notificação',
                message: notif.message || '',
                type: notif.type || 'info',
                read: notif.read || false,
                time: notif.created_at
            }));
        } catch (error) {
            console.error('[Database] Erro ao buscar notificações:', error);
            return [];
        }
    }
    
    async function saveNotifications(userId, notifications) {
        const client = init();
        if (!client) return false;
        
        try {
            const { error: deleteError } = await client
                .from('notifications')
                .delete()
                .eq('user_id', userId);
            
            if (deleteError) {
                console.error('[Database] Erro ao deletar notificações:', deleteError);
                return false;
            }
            
            if (!notifications || notifications.length === 0) {
                console.log('[Database] Nenhuma notificação para salvar');
                return true;
            }
            
            const notifToInsert = notifications.map(notif => ({
                id: generateId(), // ✅ SEMPRE GERAR NOVO ID
                user_id: userId,
                title: notif.title || 'Notificação',
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
        
        try {
            const { data, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('[Database] Erro ao buscar perfil:', error);
            }
            
            return data || null;
        } catch (error) {
            console.error('[Database] Erro ao buscar perfil:', error);
            return null;
        }
    }
    
    async function updateUserProfile(userId, profile) {
        const client = init();
        if (!client) return false;
        
        try {
            const updateData = {
                updated_at: new Date().toISOString()
            };
            
            const allowedFields = ['nome', 'email', 'avatar_url', 'telefone', 'nascimento', 'genero'];
            
            for (const field of allowedFields) {
                if (profile[field] !== undefined && profile[field] !== null) {
                    updateData[field] = profile[field];
                }
            }
            
            if (Object.keys(updateData).length <= 1) {
                console.log('[Database] Nenhum campo válido para atualizar');
                return true;
            }
            
            const { error } = await client
                .from('profiles')
                .update(updateData)
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
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
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
    // DISCIPLINAS - CORRIGIDO
    // ============================================
    async function getDisciplinas(userId) {
        const client = init();
        if (!client) return [];
        
        try {
            const { data, error } = await client
                .from('disciplinas')
                .select('*')
                .eq('user_id', userId)
                .order('nome', { ascending: true });
            
            if (error) {
                console.error('[Database] Erro ao buscar disciplinas:', error);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.error('[Database] Erro ao buscar disciplinas:', error);
            return [];
        }
    }
    
    async function saveDisciplinas(userId, disciplinas) {
        const client = init();
        if (!client) return false;
        
        try {
            const { error: deleteError } = await client
                .from('disciplinas')
                .delete()
                .eq('user_id', userId);
            
            if (deleteError) {
                console.error('[Database] Erro ao deletar disciplinas:', deleteError);
                return false;
            }
            
            if (!disciplinas || disciplinas.length === 0) {
                console.log('[Database] Nenhuma disciplina para salvar');
                return true;
            }
            
            const disciplinasToInsert = disciplinas.map(d => ({
                id: generateId(), // ✅ SEMPRE GERAR NOVO ID
                user_id: userId,
                nome: d.nome || 'Disciplina',
                cor: d.cor || '#9333ea',
                icone: d.icone || 'fa-book',
                created_at: d.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));
            
            const { error } = await client.from('disciplinas').insert(disciplinasToInsert);
            if (error) throw error;
            
            console.log(`[Database] ${disciplinas.length} disciplinas salvas`);
            return true;
        } catch (error) {
            console.error('[Database] Erro ao salvar disciplinas:', error);
            return false;
        }
    }
    
    // ============================================
    // USER SETTINGS (Configurações)
    // ============================================
    async function getUserSettings(userId) {
        const client = init();
        if (!client) return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
        
        try {
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
                    theme: data.theme || 'dark',
                    accent: data.accent_color || '#8b5cf6',
                    fontSize: data.font_size || 14,
                    notificationsSettings: data.notifications_settings || {}
                };
            }
            
            return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
        } catch (error) {
            console.error('[Database] Erro ao buscar settings:', error);
            return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
        }
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
                }, { onConflict: 'user_id' });
            
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
            const fileExt = file.name.split('.').pop() || 'png';
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
                return publicUrl;
            }
            
            return null;
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
    // INITIALIZATION
    // ============================================
    async function ensureUserData(userId, email, nome) {
        console.log('[Database] Verificando estrutura do usuário:', userId);
        
        try {
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
            
            console.log('[Database] Estrutura do usuário verificada');
            return true;
        } catch (error) {
            console.error('[Database] Erro ao verificar estrutura:', error);
            return false;
        }
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
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
        getDisciplinas,
        saveDisciplinas,
        getUserSettings,
        saveUserSettings,
        uploadProfilePhoto,
        deleteProfilePhoto,
        ensureUserData
    };
})();

// Exportar para uso global
window.DatabaseService = DatabaseService;

console.log('[DatabaseService] Módulo carregado com sucesso! (VERSÃO CORRIGIDA - ERRO 409 FIX)');