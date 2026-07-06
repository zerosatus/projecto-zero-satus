// database-service.js - VERSÃO OTIMIZADA PARA PLANO FREE

const DatabaseService = (function() {
    let supabase = null;
    
    function init() {
        if (!supabase && window.supabase) {
            const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return supabase;
    }
    
    function generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // ⚡ GET COM CACHE LOCAL
    async function getTasks(userId) {
        // Verificar cache local primeiro
        const cached = localStorage.getItem(`${userId}_tasks`);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }

        const client = init();
        if (!client) return [];

        try {
            const { data, error } = await client
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .limit(100) // ⬆️ LIMITAR RESULTADOS
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Salvar cache
            localStorage.setItem(`${userId}_tasks`, JSON.stringify(data || []));
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
            console.error('[DB] Erro ao buscar tasks:', error);
            return [];
        }
    }

    // ⚡ SAVE COM BATCH (50 POR VEZ)
    async function saveTasks(userId, tasks) {
        const client = init();
        if (!client) return false;

        try {
            await client.from('tasks').delete().eq('user_id', userId);

            if (tasks.length === 0) return true;

            // ⚡ BATCH DE 50 (plano free)
            const batchSize = 50;
            for (let i = 0; i < tasks.length; i += batchSize) {
                const batch = tasks.slice(i, i + batchSize);
                const tasksToInsert = batch.map(task => ({
                    id: generateId(),
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

                const { error } = await client.from('tasks').insert(tasksToInsert);
                if (error) throw error;
            }

            // Atualizar cache
            localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar tasks:', error);
            return false;
        }
    }

    // ⚡ GET NOTES COM CACHE
    async function getNotes(userId) {
        const cached = localStorage.getItem(`${userId}_notes`);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }

        const client = init();
        if (!client) return [];

        try {
            const { data, error } = await client
                .from('notes')
                .select('*')
                .eq('user_id', userId)
                .limit(100) // ⬆️ LIMITAR
                .order('updated_at', { ascending: false });

            if (error) throw error;
            
            localStorage.setItem(`${userId}_notes`, JSON.stringify(data || []));
            return (data || []).map(note => ({
                id: note.id,
                title: note.title || 'Sem título',
                content: note.content || '',
                date: note.created_at,
                dataModificacao: note.updated_at
            }));
        } catch (error) {
            console.error('[DB] Erro ao buscar notes:', error);
            return [];
        }
    }

    // ⚡ SAVE NOTES COM BATCH
    async function saveNotes(userId, notes) {
        const client = init();
        if (!client) return false;

        try {
            await client.from('notes').delete().eq('user_id', userId);

            if (!notes || notes.length === 0) return true;

            const batchSize = 50;
            for (let i = 0; i < notes.length; i += batchSize) {
                const batch = notes.slice(i, i + batchSize);
                const notesToInsert = batch.map(note => ({
                    id: generateId(),
                    user_id: userId,
                    title: note.title || note.titulo || 'Sem título',
                    content: note.content || note.conteudo || '',
                    created_at: note.date || note.dataCriacao || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { error } = await client.from('notes').insert(notesToInsert);
                if (error) throw error;
            }

            localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar notes:', error);
            return false;
        }
    }

    // ⚡ GET CALENDAR EVENTS COM CACHE
    async function getCalendarEvents(userId) {
        const cached = localStorage.getItem(`${userId}_calendarEvents`);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }

        const client = init();
        if (!client) return [];

        try {
            const { data, error } = await client
                .from('calendar_events')
                .select('*')
                .eq('user_id', userId)
                .limit(100)
                .order('date', { ascending: true });

            if (error) throw error;
            
            localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(data || []));
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
            console.error('[DB] Erro ao buscar eventos:', error);
            return [];
        }
    }

    async function saveCalendarEvents(userId, events) {
        const client = init();
        if (!client) return false;

        try {
            await client.from('calendar_events').delete().eq('user_id', userId);

            if (!events || events.length === 0) return true;

            const batchSize = 50;
            for (let i = 0; i < events.length; i += batchSize) {
                const batch = events.slice(i, i + batchSize);
                const eventsToInsert = batch.map(event => ({
                    id: generateId(),
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

                const { error } = await client.from('calendar_events').insert(eventsToInsert);
                if (error) throw error;
            }

            localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(events));
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar eventos:', error);
            return false;
        }
    }

    // ⚡ GET WEEKLY SCHEDULE COM CACHE
    async function getWeeklySchedule(userId) {
        const cached = localStorage.getItem(`${userId}_weeklySchedule`);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }

        const client = init();
        if (!client) return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };

        try {
            const { data, error } = await client
                .from('weekly_schedule')
                .select('schedule')
                .eq('user_id', userId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('[DB] Erro ao buscar horário:', error);
            }

            const schedule = data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            dias.forEach(day => {
                if (!schedule[day]) schedule[day] = [];
            });

            localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(schedule));
            return schedule;
        } catch (error) {
            console.error('[DB] Erro ao buscar horário:', error);
            return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
        }
    }

    async function saveWeeklySchedule(userId, schedule) {
        const client = init();
        if (!client) return false;

        try {
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            dias.forEach(day => {
                if (!schedule[day]) schedule[day] = [];
            });

            const { data: existing } = await client
                .from('weekly_schedule')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle();

            let error;
            if (existing) {
                const { error: updateError } = await client
                    .from('weekly_schedule')
                    .update({
                        schedule: schedule,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId);
                error = updateError;
            } else {
                const { error: insertError } = await client
                    .from('weekly_schedule')
                    .insert({
                        user_id: userId,
                        schedule: schedule,
                        updated_at: new Date().toISOString()
                    });
                error = insertError;
            }

            if (error) throw error;

            localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(schedule));
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar weekly schedule:', error);
            return false;
        }
    }

    // ⚡ GET TIME SLOTS COM CACHE
    async function getTimeSlots(userId) {
        const cached = localStorage.getItem(`${userId}_timeSlots`);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }

        const client = init();
        if (!client) return ['08:00', '09:30', '11:00', '14:00', '15:30'];

        try {
            const { data, error } = await client
                .from('time_slots')
                .select('slots')
                .eq('user_id', userId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('[DB] Erro ao buscar time slots:', error);
            }

            const slots = data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
            localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(slots));
            return slots;
        } catch (error) {
            console.error('[DB] Erro ao buscar time slots:', error);
            return ['08:00', '09:30', '11:00', '14:00', '15:30'];
        }
    }

    async function saveTimeSlots(userId, slots) {
        const client = init();
        if (!client) return false;

        try {
            if (!slots || !Array.isArray(slots)) {
                slots = ['08:00', '09:30', '11:00', '14:00', '15:30'];
            }

            const { data: existing } = await client
                .from('time_slots')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle();

            let error;
            if (existing) {
                const { error: updateError } = await client
                    .from('time_slots')
                    .update({
                        slots: slots,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId);
                error = updateError;
            } else {
                const { error: insertError } = await client
                    .from('time_slots')
                    .insert({
                        user_id: userId,
                        slots: slots,
                        updated_at: new Date().toISOString()
                    });
                error = insertError;
            }

            if (error) throw error;

            localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(slots));
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar time slots:', error);
            return false;
        }
    }

    // ⚡ GET DISCIPLINAS COM CACHE
    async function getDisciplinas(userId) {
        const cached = localStorage.getItem(`${userId}_disciplinas`);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }

        const client = init();
        if (!client) return [];

        try {
            const { data, error } = await client
                .from('disciplinas')
                .select('*')
                .eq('user_id', userId)
                .limit(50)
                .order('nome', { ascending: true });

            if (error) throw error;

            localStorage.setItem(`${userId}_disciplinas`, JSON.stringify(data || []));
            return data || [];
        } catch (error) {
            console.error('[DB] Erro ao buscar disciplinas:', error);
            return [];
        }
    }

    async function saveDisciplinas(userId, disciplinas) {
        const client = init();
        if (!client) return false;

        try {
            await client.from('disciplinas').delete().eq('user_id', userId);

            if (disciplinas.length === 0) return true;

            const batchSize = 50;
            for (let i = 0; i < disciplinas.length; i += batchSize) {
                const batch = disciplinas.slice(i, i + batchSize);
                const disciplinasToInsert = batch.map(d => ({
                    id: generateId(),
                    user_id: userId,
                    nome: d.nome || 'Disciplina',
                    cor: d.cor || '#9333ea',
                    icone: d.icone || 'fa-book',
                    created_at: d.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { error } = await client.from('disciplinas').insert(disciplinasToInsert);
                if (error) throw error;
            }

            localStorage.setItem(`${userId}_disciplinas`, JSON.stringify(disciplinas));
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar disciplinas:', error);
            return false;
        }
    }

    // ⚡ GET NOTIFICATIONS COM CACHE
    async function getNotifications(userId) {
        const cached = localStorage.getItem(`${userId}_notifications`);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }

        const client = init();
        if (!client) return [];

        try {
            const { data, error } = await client
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .limit(50)
                .order('created_at', { ascending: false });

            if (error) throw error;

            localStorage.setItem(`${userId}_notifications`, JSON.stringify(data || []));
            return (data || []).map(notif => ({
                id: notif.id,
                title: notif.title || 'Notificação',
                message: notif.message || '',
                type: notif.type || 'info',
                read: notif.read || false,
                time: notif.created_at
            }));
        } catch (error) {
            console.error('[DB] Erro ao buscar notificações:', error);
            return [];
        }
    }

    async function saveNotifications(userId, notifications) {
        const client = init();
        if (!client) return false;

        try {
            await client.from('notifications').delete().eq('user_id', userId);

            if (notifications.length === 0) return true;

            const batchSize = 50;
            for (let i = 0; i < notifications.length; i += batchSize) {
                const batch = notifications.slice(i, i + batchSize);
                const notifToInsert = batch.map(notif => ({
                    id: generateId(),
                    user_id: userId,
                    title: notif.title || 'Notificação',
                    message: notif.message || '',
                    type: notif.type || 'info',
                    read: notif.read || false,
                    created_at: notif.time || new Date().toISOString()
                }));

                const { error } = await client.from('notifications').insert(notifToInsert);
                if (error) throw error;
            }

            localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar notificações:', error);
            return false;
        }
    }

    // ⚡ GET USER PROFILE COM CACHE
    async function getUserProfile(userId) {
        const cached = localStorage.getItem(`${userId}_profile`);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }

        const client = init();
        if (!client) return null;

        try {
            const { data, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('[DB] Erro ao buscar perfil:', error);
            }

            if (data) {
                localStorage.setItem(`${userId}_profile`, JSON.stringify(data));
            }
            return data || null;
        } catch (error) {
            console.error('[DB] Erro ao buscar perfil:', error);
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

            if (Object.keys(updateData).length <= 1) return true;

            const { error } = await client
                .from('profiles')
                .update(updateData)
                .eq('id', userId);

            if (error) throw error;

            // Atualizar cache
            const current = await getUserProfile(userId);
            if (current) {
                localStorage.setItem(`${userId}_profile`, JSON.stringify({ ...current, ...updateData }));
            }

            return true;
        } catch (error) {
            console.error('[DB] Erro ao atualizar perfil:', error);
            return false;
        }
    }

    async function ensureUserData(userId, email, nome) {
        console.log('[DB] Verificando estrutura do usuário:', userId);
        
        try {
            let profile = await getUserProfile(userId);
            if (!profile) {
                const client = init();
                if (client) {
                    await client.from('profiles').insert({
                        id: userId,
                        email: email,
                        nome: nome || email.split('@')[0],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                }
            }

            let schedule = await getWeeklySchedule(userId);
            if (!schedule || Object.keys(schedule).length === 0) {
                await saveWeeklySchedule(userId, { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] });
            }

            let slots = await getTimeSlots(userId);
            if (!slots || slots.length === 0) {
                await saveTimeSlots(userId, ['08:00', '09:30', '11:00', '14:00', '15:30']);
            }

            console.log('[DB] Estrutura do usuário verificada');
            return true;
        } catch (error) {
            console.error('[DB] Erro ao verificar estrutura:', error);
            return false;
        }
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

    async function createProfile(userId, email, nome) {
        const client = init();
        if (!client) return false;
        try {
            await client.from('profiles').insert({
                id: userId,
                email: email,
                nome: nome || email.split('@')[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('[DB] Erro ao criar perfil:', error);
            return false;
        }
    }

    async function getUserSettings(userId) {
        return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
    }

    async function saveUserSettings(userId, settings) {
        return true;
    }

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
            
            if (uploadError) {
                console.error('[DB] Erro no upload:', uploadError);
                return null;
            }
            
            const { data: { publicUrl } } = client.storage
                .from('user-content')
                .getPublicUrl(filePath);
            
            if (publicUrl) {
                await updateUserProfile(userId, { avatar_url: publicUrl });
                return publicUrl;
            }
            return null;
        } catch (error) {
            console.error('[DB] Erro ao fazer upload:', error);
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
            console.error('[DB] Erro ao deletar foto:', error);
            return false;
        }
    }

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

window.DatabaseService = DatabaseService;
console.log('[DatabaseService] v4.0 - OTIMIZADO PARA PLANO FREE!');