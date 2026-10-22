// database-service.js - Serviço completo de banco de dados Supabase (Corrigido sem exclusão automática por lote)[cite: 2]
// ============================================
// VERIFICAR SE JÁ FOI CARREGADO
// ============================================
if (window.DatabaseService) {
    console.log('[DatabaseService] ⚠️ Módulo já carregado, ignorando...');
} else {
    console.log('[DatabaseService] 🚀 Inicializando módulo...');

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

        // ⭐ FUNÇÃO DE NORMALIZAÇÃO (IGUAL AO FLUTTER)[cite: 2]
        function normalizeText(texto) {
            if (!texto) return '';
            return texto
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
        }
        
        async function getCurrentUserId() {
            const client = init();
            if (!client) {
                console.warn('[Database] ⚠️ Cliente Supabase não inicializado');
                return null;
            }
            
            try {
                const { data: { user }, error } = await client.auth.getUser();
                if (error) {
                    console.error('[Database] ❌ Erro ao buscar userId:', error.message);
                    return null;
                }
                console.log('[Database] ✅ UserId obtido:', user?.id);
                return user?.id || null;
            } catch (error) {
                console.error('[Database] ❌ Erro ao buscar userId:', error);
                return null;
            }
        }

        // ============================================
        // 🔥 getUserProfile - COM LOGS DETALHADOS[cite: 2]
        // ============================================
        async function getUserProfile(userId) {
            console.log('[Database] 🔍 Buscando perfil para userId:', userId);
            const client = init();
            if (!client || !userId) return null;

            try {
                const { data, error } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') return null;
                    return null;
                }
                return data;
            } catch (error) {
                console.error('[Database] ❌ Exceção ao buscar perfil:', error);
                return null;
            }
        }

        // ============================================
        // 🔥 updateUserProfile[cite: 2]
        // ============================================
        async function updateUserProfile(userId, profile) {
            const client = init();
            if (!client || !userId) return false;

            try {
                const updateData = {
                    updated_at: new Date().toISOString()
                };

                const allowedFields = ['nome', 'email', 'avatar_url', 'telefone', 'nascimento', 'genero', 'role'];
                for (const field of allowedFields) {
                    if (profile[field] !== undefined && profile[field] !== null) {
                        updateData[field] = profile[field];
                    }
                }

                const { error } = await client
                    .from('profiles')
                    .update(updateData)
                    .eq('id', userId);

                if (error) return false;
                return true;
            } catch (error) {
                console.error('[Database] ❌ Exceção ao atualizar perfil:', error);
                return false;
            }
        }

        // ============================================
        // 🔥 createProfile (COM UPSERT)[cite: 2]
        // ============================================
        async function createProfile(userId, email, nome, role = 'user') {
            const client = init();
            if (!client || !userId || !email) return false;

            try {
                const profileData = {
                    id: userId,
                    email: email,
                    nome: nome || email.split('@')[0],
                    role: role || 'user',
                    updated_at: new Date().toISOString()
                };

                const { error } = await client
                    .from('profiles')
                    .upsert(profileData, { onConflict: 'id' });

                return !error;
            } catch (error) {
                console.error('[Database] ❌ Exceção ao criar perfil:', error);
                return false;
            }
        }

        // ============================================
        // 🔥 ensureUserData[cite: 2]
        // ============================================
        async function ensureUserData(userId, email, nome) {
            try {
                let profile = await getUserProfile(userId);
                if (!profile) {
                    await createProfile(userId, email, nome, 'user');
                }

                let schedule = await getWeeklySchedule(userId);
                if (!schedule || Object.keys(schedule).length === 0) {
                    await saveWeeklySchedule(userId, { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] });
                }

                let slots = await getTimeSlots(userId);
                if (!slots || slots.length === 0) {
                    await saveTimeSlots(userId, ['08:00', '09:30', '11:00', '14:00', '15:30']);
                }
                
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao verificar estrutura do usuário:', error);
                return false;
            }
        }

        // ============================================
        // TASKS - COM LOGs[cite: 2]
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

                if (error) return [];

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
                console.error('[Database] ❌ Erro ao buscar tasks:', error);
                return [];
            }
        }

        async function saveTasks(userId, tasks) {
            const client = init();
            if (!client) return false;

            try {
                if (!tasks || tasks.length === 0) {
                    return true; // Não apaga no servidor se a lista local estiver vazia[cite: 2]
                }

                const tasksToUpsert = tasks.map(task => ({
                    id: task.id || generateId(),
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

                const batchSize = 100;
                for (let i = 0; i < tasksToUpsert.length; i += batchSize) {
                    const batch = tasksToUpsert.slice(i, i + batchSize);
                    const { error } = await client
                        .from('tasks')
                        .upsert(batch, { onConflict: 'id' });
                    if (error) throw error;
                }

                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar tasks:', error);
                return false;
            }
        }

        async function deleteTask(userId, taskId) {
            const client = init();
            if (!client) return false;

            try {
                const { error } = await client
                    .from('tasks')
                    .delete()
                    .eq('user_id', userId)
                    .eq('id', taskId);

                if (error) return false;
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao deletar task:', error);
                return false;
            }
        }

        // ============================================
        // ⭐ NOTES - UPSERT CORRIGIDO (MANTÉM IDs)[cite: 2]
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

                if (error) return [];

                return (data || []).map(note => ({
                    id: note.id,
                    title: note.title || 'Sem título',
                    content: note.content || '',
                    date: note.created_at,
                    dataModificacao: note.updated_at
                }));
            } catch (error) {
                console.error('[Database] ❌ Erro ao buscar notes:', error);
                return [];
            }
        }

        async function saveNotes(userId, notes) {
            console.log(`[Database] 💾 Salvando ${notes?.length || 0} notes para userId:`, userId);
            const client = init();
            if (!client) return false;

            try {
                if (!notes || notes.length === 0) {
                    return true; // Não apaga no servidor se a lista local estiver vazia[cite: 2]
                }

                const notesToUpsert = notes.map(note => ({
                    id: note.id || generateId(),
                    user_id: userId,
                    title: note.title || note.titulo || 'Sem título',
                    content: note.content || note.conteudo || '',
                    created_at: note.date || note.dataCriacao || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const batchSize = 100;
                for (let i = 0; i < notesToUpsert.length; i += batchSize) {
                    const batch = notesToUpsert.slice(i, i + batchSize);
                    const { error } = await client
                        .from('notes')
                        .upsert(batch, { onConflict: 'id' });
                    if (error) throw error;
                }

                console.log(`[Database] ✅ ${notes.length} notes sincronizadas com sucesso via UPSERT`);
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar notes:', error);
                return false;
            }
        }

        async function deleteNote(userId, noteId) {
            const client = init();
            if (!client) return false;

            try {
                const { error } = await client
                    .from('notes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('id', noteId);

                if (error) return false;
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao deletar note:', error);
                return false;
            }
        }

        // ============================================
        // ⭐ CALENDAR EVENTS - UPSERT CORRIGIDO (MANTÉM IDs)[cite: 2]
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

                if (error) return [];

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
                console.error('[Database] ❌ Erro ao buscar eventos:', error);
                return [];
            }
        }

        async function saveCalendarEvents(userId, events) {
            console.log(`[Database] 💾 Salvando ${events?.length || 0} eventos para userId:`, userId);
            const client = init();
            if (!client) return false;

            try {
                if (!events || events.length === 0) {
                    return true; // Não apaga no servidor se a lista local estiver vazia[cite: 2]
                }

                const eventsToUpsert = events.map(event => ({
                    id: event.id || generateId(),
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
                    created_at: event.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const batchSize = 100;
                for (let i = 0; i < eventsToUpsert.length; i += batchSize) {
                    const batch = eventsToUpsert.slice(i, i + batchSize);
                    const { error } = await client
                        .from('calendar_events')
                        .upsert(batch, { onConflict: 'id' });
                    if (error) throw error;
                }

                console.log(`[Database] ✅ ${events.length} eventos sincronizados com sucesso via UPSERT`);
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar eventos:', error);
                return false;
            }
        }

        async function deleteCalendarEvent(userId, eventId) {
            const client = init();
            if (!client) return false;

            try {
                const { error } = await client
                    .from('calendar_events')
                    .delete()
                    .eq('user_id', userId)
                    .eq('id', eventId);

                if (error) return false;
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao deletar evento:', error);
                return false;
            }
        }

        // ============================================
        // WEEKLY SCHEDULE[cite: 2]
        // ============================================
        async function getWeeklySchedule(userId) {
            const client = init();
            if (!client) return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };

            try {
                const { data } = await client
                    .from('weekly_schedule')
                    .select('schedule')
                    .eq('user_id', userId)
                    .single();

                const schedule = data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
                ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].forEach(day => {
                    if (!schedule[day]) schedule[day] = [];
                });

                return schedule;
            } catch (error) {
                return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
            }
        }

        async function saveWeeklySchedule(userId, schedule) {
            const client = init();
            if (!client) return false;

            try {
                ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].forEach(day => {
                    if (!schedule[day]) schedule[day] = [];
                });

                const { data: existing } = await client
                    .from('weekly_schedule')
                    .select('user_id')
                    .eq('user_id', userId)
                    .single();

                let error;
                if (existing) {
                    const { error: updateError } = await client
                        .from('weekly_schedule')
                        .update({ schedule, updated_at: new Date().toISOString() })
                        .eq('user_id', userId);
                    error = updateError;
                } else {
                    const { error: insertError } = await client
                        .from('weekly_schedule')
                        .insert({ user_id: userId, schedule, updated_at: new Date().toISOString() });
                    error = insertError;
                }

                if (error) return false;
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar horário:', error);
                return false;
            }
        }

        // ============================================
        // TIME SLOTS[cite: 2]
        // ============================================
        async function getTimeSlots(userId) {
            const client = init();
            if (!client) return ['08:00', '09:30', '11:00', '14:00', '15:30'];

            try {
                const { data } = await client
                    .from('time_slots')
                    .select('slots')
                    .eq('user_id', userId)
                    .single();

                return data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
            } catch (error) {
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
                    .single();

                let error;
                if (existing) {
                    const { error: updateError } = await client
                        .from('time_slots')
                        .update({ slots, updated_at: new Date().toISOString() })
                        .eq('user_id', userId);
                    error = updateError;
                } else {
                    const { error: insertError } = await client
                        .from('time_slots')
                        .insert({ user_id: userId, slots, updated_at: new Date().toISOString() });
                    error = insertError;
                }

                if (error) return false;
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar time slots:', error);
                return false;
            }
        }

        // ============================================
        // NOTIFICATIONS - PROTEGIDAS (VÊM DO SERVIDOR)[cite: 2]
        // ============================================
        async function getNotifications(userId) {
            const client = init();
            if (!client) return [];

            try {
                const { data } = await client
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                return (data || []).map(notif => ({
                    id: notif.id,
                    title: notif.title || 'Notificação',
                    message: notif.message || '',
                    type: notif.type || 'info',
                    read: notif.read || false,
                    time: notif.created_at
                }));
            } catch (error) {
                return [];
            }
        }

        async function saveNotifications(userId, notifications) {
            console.log('[Database] ℹ️ saveNotifications ignorado — notificações vêm do servidor (enviar_notificacao)');
            return true;
        }

        // ============================================
        // ⭐ DISCIPLINAS - UPSERT COM FALLBACK normalizeText[cite: 2]
        // ============================================
        async function getDisciplinas(userId) {
            const client = init();
            if (!client) return [];

            try {
                const { data } = await client
                    .from('disciplinas')
                    .select('*')
                    .eq('user_id', userId)
                    .order('nome', { ascending: true });

                return data || [];
            } catch (error) {
                return [];
            }
        }

        async function saveDisciplinas(userId, disciplinas) {
            const client = init();
            if (!client) return false;

            try {
                if (!disciplinas || disciplinas.length === 0) {
                    return true; // Não apaga no servidor se a lista local estiver vazia[cite: 2]
                }

                const disciplinasToUpsert = disciplinas.map(d => ({
                    id: d.id ? String(d.id) : normalizeText(d.nome),
                    user_id: userId,
                    nome: d.nome || 'Disciplina',
                    cor: d.cor || '#9333ea',
                    icone: d.icone || 'fa-book',
                    created_at: d.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const batchSize = 100;
                for (let i = 0; i < disciplinasToUpsert.length; i += batchSize) {
                    const batch = disciplinasToUpsert.slice(i, i + batchSize);
                    const { error } = await client
                        .from('disciplinas')
                        .upsert(batch, { onConflict: 'id' });
                    if (error) throw error;
                }

                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar disciplinas:', error);
                return false;
            }
        }

        async function deleteDisciplina(userId, disciplinaId) {
            const client = init();
            if (!client) return false;

            try {
                const { error } = await client
                    .from('disciplinas')
                    .delete()
                    .eq('user_id', userId)
                    .eq('id', disciplinaId);

                if (error) return false;
                return true;
            } catch (error) {
                return false;
            }
        }

        // ============================================
        // DOCUMENTOS - COM STORAGE & UPSERT (SEM FILTRO)[cite: 2]
        // ============================================
        async function getDocumentos(userId) {
            const client = init();
            if (!client) return [];

            try {
                const { data } = await client
                    .from('documentos')
                    .select('*')
                    .eq('user_id', userId)
                    .order('data_upload', { ascending: false });

                return (data || []).map(doc => ({
                    id: doc.id,
                    nome: doc.nome,
                    categoria: doc.categoria || 'Outros',
                    descricao: doc.descricao || '',
                    arquivo: doc.arquivo || '',
                    tipo: doc.tipo || 'application/octet-stream',
                    nomeArquivo: doc.nome_arquivo || doc.nome,
                    tamanho: doc.tamanho || 0,
                    dataUpload: doc.data_upload || doc.created_at,
                    storagePath: doc.storage_path || null
                }));
            } catch (error) {
                return [];
            }
        }

        async function saveDocumentos(userId, documentos) {
            const client = init();
            if (!client) return false;

            try {
                if (!documentos || documentos.length === 0) {
                    return true; // Não apaga no servidor se a lista local estiver vazia[cite: 2]
                }

                const docsToUpsert = documentos.map(doc => ({
                    id: doc.id ? String(doc.id) : generateId(),
                    user_id: userId,
                    nome: doc.nome || 'Documento',
                    categoria: doc.categoria || 'Outros',
                    descricao: doc.descricao || '',
                    arquivo: doc.arquivo || '',
                    tipo: doc.tipo || 'application/octet-stream',
                    nome_arquivo: doc.nomeArquivo || doc.nome,
                    tamanho: doc.tamanho || 0,
                    storage_path: doc.storagePath || null,
                    data_upload: doc.dataUpload || new Date().toISOString(),
                    created_at: doc.dataUpload || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const batchSize = 50;
                for (let i = 0; i < docsToUpsert.length; i += batchSize) {
                    const batch = docsToUpsert.slice(i, i + batchSize);
                    const { error } = await client
                        .from('documentos')
                        .upsert(batch, { onConflict: 'id' });
                    if (error) throw error;
                }

                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar documentos:', error);
                return false;
            }
        }

        async function deleteDocumento(userId, documentoId) {
            const client = init();
            if (!client) return false;

            try {
                const { data: doc } = await client
                    .from('documentos')
                    .select('storage_path')
                    .eq('user_id', userId)
                    .eq('id', documentoId)
                    .single();

                if (doc?.storage_path) {
                    await client.storage.from('user-content').remove([doc.storage_path]);
                }

                const { error } = await client
                    .from('documentos')
                    .delete()
                    .eq('user_id', userId)
                    .eq('id', documentoId);

                if (error) return false;
                return true;
            } catch (error) {
                return false;
            }
        }

        async function uploadDocumentoStorage(userId, file, nome) {
            const client = init();
            if (!client) return null;

            try {
                const fileExt = file.name.split('.').pop() || 'pdf';
                const safeName = nome.replace(/\s/g, '_').substring(0, 50);
                const filePath = `documentos/${userId}/${Date.now()}_${safeName}.${fileExt}`;

                const { error: uploadError } = await client.storage
                    .from('user-content')
                    .upload(filePath, file, { cacheControl: '3600', upsert: false });

                if (uploadError) return null;

                const { data: { publicUrl } } = client.storage.from('user-content').getPublicUrl(filePath);
                return { publicUrl, storagePath: filePath };
            } catch (error) {
                return null;
            }
        }

        async function deleteDocumentoStorage(storagePath) {
            const client = init();
            if (!client || !storagePath) return true;

            try {
                await client.storage.from('user-content').remove([storagePath]);
                return true;
            } catch (error) {
                return false;
            }
        }

        // ============================================
        // STUDY SESSIONS (SESSÕES DE ESTUDO)[cite: 2]
        // ============================================
        async function getStudySessions(userId) {
            const client = init();
            if (!client) return [];

            try {
                const { data } = await client
                    .from('study_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('inicio', { ascending: false });

                return (data || []).map(s => ({
                    id: String(s.id),
                    user_id: s.user_id,
                    disciplina: s.disciplina,
                    duracaoSegundos: s.duracao_segundos,
                    tipo: s.tipo,
                    inicio: s.inicio,
                    fim: s.fim,
                    concluida: s.concluida,
                    metaSegundos: s.meta_segundos
                }));
            } catch (e) {
                return [];
            }
        }

        async function saveStudySession(session) {
            const client = init();
            if (!client) return false;

            try {
                await client.from('study_sessions').upsert({
                    id: String(session.id),
                    user_id: session.userId,
                    disciplina: session.disciplina,
                    duracao_segundos: session.duracaoSegundos,
                    tipo: session.tipo,
                    inicio: session.inicio,
                    fim: session.fim,
                    concluida: session.concluida,
                    meta_segundos: session.metaSegundos
                }, { onConflict: 'id' });
                return true;
            } catch (e) {
                return false;
            }
        }

        // ============================================
        // USER SETTINGS[cite: 2]
        // ============================================
        async function getUserSettings(userId) {
            const client = init();
            if (!client) return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };

            try {
                const { data } = await client
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

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
                return true;
            } catch (error) {
                return false;
            }
        }

        // ============================================
        // STORAGE - AVATAR[cite: 2]
        // ============================================
        async function uploadProfilePhoto(userId, file) {
            const client = init();
            if (!client) return null;

            try {
                const fileExt = file.name.split('.').pop() || 'png';
                const fileName = `avatars/${userId}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await client.storage
                    .from('user-content')
                    .upload(fileName, file, { cacheControl: '3600', upsert: true });

                if (uploadError) return null;

                const { data: { publicUrl } } = client.storage.from('user-content').getPublicUrl(fileName);
                if (publicUrl) {
                    await updateUserProfile(userId, { avatar_url: publicUrl });
                    return publicUrl;
                }
                return null;
            } catch (error) {
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
                return false;
            }
        }

        // ============================================
        // IA - CONVERSAS E MENSAGENS[cite: 2]
        // ============================================
        async function getAIConversations(userId) {
            const client = init();
            if (!client) return [];

            try {
                const { data } = await client
                    .from('ai_conversations')
                    .select('*')
                    .eq('user_id', userId)
                    .order('updated_at', { ascending: false });
                return data || [];
            } catch (error) {
                return [];
            }
        }

        async function saveAIConversation(userId, conversation) {
            const client = init();
            if (!client) return false;

            try {
                const { error } = await client.from('ai_conversations').upsert({
                    id: conversation.id,
                    user_id: userId,
                    title: conversation.title || 'Nova conversa',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

                if (error) throw error;
                return true;
            } catch (error) {
                return false;
            }
        }

        async function deleteAIConversation(userId, conversationId) {
            const client = init();
            if (!client) return false;

            try {
                await client.from('ai_messages').delete().eq('conversation_id', conversationId);
                const { error } = await client.from('ai_conversations').delete()
                    .eq('id', conversationId)
                    .eq('user_id', userId);

                if (error) throw error;
                return true;
            } catch (error) {
                return false;
            }
        }

        async function getAIMessages(userId, conversationId) {
            const client = init();
            if (!client) return [];

            try {
                const { data } = await client
                    .from('ai_messages')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });
                return data || [];
            } catch (error) {
                return [];
            }
        }

        async function saveAIMessage(userId, message) {
            const client = init();
            if (!client) return false;

            try {
                const { error } = await client.from('ai_messages').insert({
                    id: message.id || (Date.now().toString() + Math.random().toString(36).substr(2, 6)),
                    conversation_id: message.conversationId,
                    user_id: userId,
                    role: message.role,
                    content: message.content,
                    created_at: message.createdAt || new Date().toISOString()
                });

                if (error) throw error;
                return true;
            } catch (error) {
                return false;
            }
        }

        // ============================================
        // API PÚBLICA[cite: 2]
        // ============================================
        return {
            init,
            getCurrentUserId,
            getUserProfile,
            updateUserProfile,
            createProfile,
            ensureUserData,
            getTasks,
            saveTasks,
            deleteTask,
            getNotes,
            saveNotes,
            deleteNote,
            getCalendarEvents,
            saveCalendarEvents,
            deleteCalendarEvent,
            getWeeklySchedule,
            saveWeeklySchedule,
            getTimeSlots,
            saveTimeSlots,
            getNotifications,
            saveNotifications,
            getDisciplinas,
            saveDisciplinas,
            deleteDisciplina,
            getDocumentos,
            saveDocumentos,
            deleteDocumento,
            uploadDocumentoStorage,
            deleteDocumentoStorage,
            getStudySessions,
            saveStudySession,
            getUserSettings,
            saveUserSettings,
            uploadProfilePhoto,
            deleteProfilePhoto,
            getAIConversations,
            saveAIConversation,
            deleteAIConversation,
            getAIMessages,
            saveAIMessage
        };
    })();

    // Exportar para uso global[cite: 2]
    window.DatabaseService = DatabaseService;
    console.log('[DatabaseService] ✅ Módulo carregado com sucesso!');
}