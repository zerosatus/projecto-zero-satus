// database-service.js - Serviço completo de banco de dados Supabase
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
        // 🔥 getUserProfile - COM LOGS DETALHADOS
        // ============================================
        async function getUserProfile(userId) {
            console.log('[Database] 🔍 Buscando perfil para userId:', userId);
            console.log('[Database] 📊 Início da busca - Timestamp:', new Date().toISOString());
            
            const client = init();
            if (!client) {
                console.error('[Database] ❌ Cliente Supabase não disponível para buscar perfil');
                return null;
            }

            if (!userId) {
                console.error('[Database] ❌ userId é obrigatório para buscar perfil');
                return null;
            }

            try {
                console.log('[Database] 📡 Executando query: SELECT * FROM profiles WHERE id =', userId);
                
                const { data, error } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                console.log('[Database] 📥 Resposta recebida');
                
                if (error) {
                    console.error('[Database] ❌ Erro na query:', error);
                    console.error('[Database] ❌ Código do erro:', error.code);
                    console.error('[Database] ❌ Mensagem:', error.message);
                    
                    if (error.code === 'PGRST116') {
                        console.log('[Database] ⚠️ Perfil não encontrado para o userId:', userId);
                        console.log('[Database] 💡 Isso pode acontecer se o usuário acabou de se cadastrar');
                        return null;
                    }
                    
                    console.log('[Database] ❌ Outro tipo de erro:', error.code);
                    return null;
                }

                if (!data) {
                    console.log('[Database] ⚠️ Nenhum dado retornado para userId:', userId);
                    return null;
                }

                console.log('[Database] ✅ Perfil encontrado com sucesso!');
                console.log('[Database] 📋 Nome:', data.nome);
                console.log('[Database] 📧 Email:', data.email);
                console.log('[Database] 👑 Role:', data.role || 'user');
                console.log('[Database] 🖼️ Avatar:', data.avatar_url ? 'Sim' : 'Não');
                console.log('[Database] 📅 Criado em:', data.created_at);
                console.log('[Database] 🔄 Atualizado em:', data.updated_at);
                
                return data;
                
            } catch (error) {
                console.error('[Database] ❌ Exceção ao buscar perfil:', error);
                console.error('[Database] ❌ Stack trace:', error.stack);
                return null;
            }
        }

        // ============================================
        // 🔥 updateUserProfile - COM LOGS DETALHADOS
        // ============================================
        async function updateUserProfile(userId, profile) {
            console.log('[Database] 🔄 Atualizando perfil para userId:', userId);
            console.log('[Database] 📊 Dados a atualizar:', JSON.stringify(profile, null, 2));
            
            const client = init();
            if (!client) {
                console.error('[Database] ❌ Cliente Supabase não disponível para atualizar perfil');
                return false;
            }

            if (!userId) {
                console.error('[Database] ❌ userId é obrigatório para atualizar perfil');
                return false;
            }

            try {
                const updateData = {
                    updated_at: new Date().toISOString()
                };

                const allowedFields = ['nome', 'email', 'avatar_url', 'telefone', 'nascimento', 'genero', 'role'];

                let fieldsToUpdate = [];
                for (const field of allowedFields) {
                    if (profile[field] !== undefined && profile[field] !== null) {
                        updateData[field] = profile[field];
                        fieldsToUpdate.push(field);
                    }
                }

                console.log('[Database] 📋 Campos a atualizar:', fieldsToUpdate.join(', '));

                if (Object.keys(updateData).length <= 1) {
                    console.log('[Database] ⚠️ Nenhum campo válido para atualizar');
                    return true;
                }

                console.log('[Database] 📡 Executando UPDATE profiles SET', JSON.stringify(updateData, null, 2), 'WHERE id =', userId);

                const { data, error } = await client
                    .from('profiles')
                    .update(updateData)
                    .eq('id', userId)
                    .select();

                if (error) {
                    console.error('[Database] ❌ Erro ao atualizar perfil:', error);
                    console.error('[Database] ❌ Código do erro:', error.code);
                    console.error('[Database] ❌ Mensagem:', error.message);
                    return false;
                }

                console.log('[Database] ✅ Perfil atualizado com sucesso!');
                console.log('[Database] 📊 Dados atualizados:', JSON.stringify(data, null, 2));
                return true;
                
            } catch (error) {
                console.error('[Database] ❌ Exceção ao atualizar perfil:', error);
                console.error('[Database] ❌ Stack trace:', error.stack);
                return false;
            }
        }

        // ============================================
        // 🔥 createProfile - COM LOGS DETALHADOS
        // ============================================
        async function createProfile(userId, email, nome, role = 'user') {
            console.log('[Database] ➕ Criando perfil para userId:', userId);
            console.log('[Database] 📧 Email:', email);
            console.log('[Database] 📛 Nome:', nome);
            console.log('[Database] 👑 Role:', role);
            
            const client = init();
            if (!client) {
                console.error('[Database] ❌ Cliente Supabase não disponível para criar perfil');
                return false;
            }

            if (!userId || !email) {
                console.error('[Database] ❌ userId e email são obrigatórios para criar perfil');
                return false;
            }

            try {
                const profileData = {
                    id: userId,
                    email: email,
                    nome: nome || email.split('@')[0],
                    role: role || 'user',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                console.log('[Database] 📡 Executando INSERT INTO profiles', JSON.stringify(profileData, null, 2));

                const { data, error } = await client
                    .from('profiles')
                    .insert(profileData)
                    .select();

                if (error) {
                    console.error('[Database] ❌ Erro ao criar perfil:', error);
                    console.error('[Database] ❌ Código do erro:', error.code);
                    console.error('[Database] ❌ Mensagem:', error.message);
                    
                    if (error.code === '23505') {
                        console.log('[Database] ⚠️ Perfil já existe para este userId');
                    }
                    return false;
                }

                console.log('[Database] ✅ Perfil criado com sucesso!');
                console.log('[Database] 📊 Dados criados:', JSON.stringify(data, null, 2));
                return true;
                
            } catch (error) {
                console.error('[Database] ❌ Exceção ao criar perfil:', error);
                console.error('[Database] ❌ Stack trace:', error.stack);
                return false;
            }
        }

        // ============================================
        // 🔥 ensureUserData - COM LOGS DETALHADOS
        // ============================================
        async function ensureUserData(userId, email, nome) {
            console.log('[Database] 🔧 Verificando estrutura do usuário:', userId);
            console.log('[Database] 📧 Email:', email);
            console.log('[Database] 📛 Nome:', nome);
            console.log('[Database] ⏰ Timestamp:', new Date().toISOString());

            try {
                // Verificar/criar perfil
                console.log('[Database] 📌 Passo 1: Verificando perfil...');
                let profile = await getUserProfile(userId);
                
                if (!profile) {
                    console.log('[Database] 📌 Passo 1.1: Perfil não encontrado, criando...');
                    const created = await createProfile(userId, email, nome, 'user');
                    if (created) {
                        console.log('[Database] ✅ Perfil criado com sucesso!');
                    } else {
                        console.error('[Database] ❌ Falha ao criar perfil');
                    }
                } else {
                    console.log('[Database] ✅ Perfil já existe para:', email);
                    console.log('[Database] 📋 Role atual:', profile.role || 'user');
                }

                // Verificar/criar weekly_schedule
                console.log('[Database] 📌 Passo 2: Verificando horário semanal...');
                let schedule = await getWeeklySchedule(userId);
                if (!schedule || Object.keys(schedule).length === 0) {
                    console.log('[Database] 📌 Passo 2.1: Criando horário padrão');
                    await saveWeeklySchedule(userId, { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] });
                    console.log('[Database] ✅ Horário padrão criado');
                } else {
                    console.log('[Database] ✅ Horário semanal já existe');
                }

                // Verificar/criar time_slots
                console.log('[Database] 📌 Passo 3: Verificando time slots...');
                let slots = await getTimeSlots(userId);
                if (!slots || slots.length === 0) {
                    console.log('[Database] 📌 Passo 3.1: Criando time slots padrão');
                    await saveTimeSlots(userId, ['08:00', '09:30', '11:00', '14:00', '15:30']);
                    console.log('[Database] ✅ Time slots padrão criados');
                } else {
                    console.log('[Database] ✅ Time slots já existem');
                }

                console.log('[Database] ✅ Estrutura do usuário verificada com sucesso!');
                console.log('[Database] 📊 Resumo:');
                console.log('[Database]    - Perfil:', profile ? '✅ Existe' : '✅ Criado');
                console.log('[Database]    - Horário:', schedule && Object.keys(schedule).length > 0 ? '✅ Existe' : '✅ Criado');
                console.log('[Database]    - Time Slots:', slots && slots.length > 0 ? '✅ Existe' : '✅ Criado');
                
                return true;
                
            } catch (error) {
                console.error('[Database] ❌ Erro ao verificar estrutura do usuário:', error);
                console.error('[Database] ❌ Stack trace:', error.stack);
                return false;
            }
        }

        // ============================================
        // TASKS - COM LOGS
        // ============================================
        async function getTasks(userId) {
            console.log('[Database] 🔍 Buscando tasks para userId:', userId);
            const client = init();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('[Database] ❌ Erro ao buscar tasks:', error);
                    return [];
                }

                console.log(`[Database] ✅ ${data?.length || 0} tasks encontradas`);
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
            console.log(`[Database] 💾 Salvando ${tasks?.length || 0} tasks para userId:`, userId);
            const client = init();
            if (!client) return false;

            try {
                console.log('[Database] 📡 Deletando tasks antigas...');
                const { error: deleteError } = await client
                    .from('tasks')
                    .delete()
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('[Database] ❌ Erro ao deletar tasks:', deleteError);
                    return false;
                }

                if (!tasks || tasks.length === 0) {
                    console.log('[Database] ℹ️ Nenhuma task para salvar');
                    return true;
                }

                const tasksToInsert = tasks.map(task => ({
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

                console.log(`[Database] 📡 Inserindo ${tasksToInsert.length} tasks...`);
                const batchSize = 100;
                for (let i = 0; i < tasksToInsert.length; i += batchSize) {
                    const batch = tasksToInsert.slice(i, i + batchSize);
                    const { error } = await client.from('tasks').insert(batch);
                    if (error) throw error;
                    console.log(`[Database] ✅ Batch ${Math.floor(i/batchSize) + 1} salvo`);
                }

                console.log(`[Database] ✅ ${tasks.length} tarefas salvas com sucesso`);
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar tasks:', error);
                return false;
            }
        }

        // ============================================
        // NOTES - COM LOGS
        // ============================================
        async function getNotes(userId) {
            console.log('[Database] 🔍 Buscando notes para userId:', userId);
            const client = init();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('notes')
                    .select('*')
                    .eq('user_id', userId)
                    .order('updated_at', { ascending: false });

                if (error) {
                    console.error('[Database] ❌ Erro ao buscar notes:', error);
                    return [];
                }

                console.log(`[Database] ✅ ${data?.length || 0} notes encontradas`);
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
                console.log('[Database] 📡 Deletando notes antigas...');
                const { error: deleteError } = await client
                    .from('notes')
                    .delete()
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('[Database] ❌ Erro ao deletar notes:', deleteError);
                    return false;
                }

                if (!notes || notes.length === 0) {
                    console.log('[Database] ℹ️ Nenhuma note para salvar');
                    return true;
                }

                const notesToInsert = notes.map(note => ({
                    id: generateId(),
                    user_id: userId,
                    title: note.title || note.titulo || 'Sem título',
                    content: note.content || note.conteudo || '',
                    created_at: note.date || note.dataCriacao || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                console.log(`[Database] 📡 Inserindo ${notesToInsert.length} notes...`);
                const { error } = await client.from('notes').insert(notesToInsert);
                if (error) throw error;

                console.log(`[Database] ✅ ${notes.length} notes salvas com sucesso`);
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar notes:', error);
                return false;
            }
        }

        // ============================================
        // CALENDAR EVENTS - COM LOGS
        // ============================================
        async function getCalendarEvents(userId) {
            console.log('[Database] 🔍 Buscando eventos para userId:', userId);
            const client = init();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('calendar_events')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: true });

                if (error) {
                    console.error('[Database] ❌ Erro ao buscar eventos:', error);
                    return [];
                }

                console.log(`[Database] ✅ ${data?.length || 0} eventos encontrados`);
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
                console.log('[Database] 📡 Deletando eventos antigos...');
                const { error: deleteError } = await client
                    .from('calendar_events')
                    .delete()
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('[Database] ❌ Erro ao deletar eventos:', deleteError);
                    return false;
                }

                if (!events || events.length === 0) {
                    console.log('[Database] ℹ️ Nenhum evento para salvar');
                    return true;
                }

                const eventsToInsert = events.map(event => ({
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

                console.log(`[Database] 📡 Inserindo ${eventsToInsert.length} eventos...`);
                const { error } = await client.from('calendar_events').insert(eventsToInsert);
                if (error) throw error;

                console.log(`[Database] ✅ ${events.length} eventos salvos com sucesso`);
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar eventos:', error);
                return false;
            }
        }

        // ============================================
        // WEEKLY SCHEDULE - COM LOGS
        // ============================================
        async function getWeeklySchedule(userId) {
            console.log('[Database] 🔍 Buscando horário semanal para userId:', userId);
            const client = init();
            if (!client) return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };

            try {
                const { data, error } = await client
                    .from('weekly_schedule')
                    .select('schedule')
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('[Database] ❌ Erro ao buscar horário:', error);
                }

                const schedule = data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
                const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
                dias.forEach(day => {
                    if (!schedule[day]) schedule[day] = [];
                });

                console.log('[Database] ✅ Horário semanal encontrado');
                return schedule;
            } catch (error) {
                console.error('[Database] ❌ Erro ao buscar horário:', error);
                return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
            }
        }

        async function saveWeeklySchedule(userId, schedule) {
            console.log('[Database] 💾 Salvando horário semanal para userId:', userId);
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
                    .single();

                let error;
                if (existing) {
                    console.log('[Database] 📡 Atualizando horário existente...');
                    const { error: updateError } = await client
                        .from('weekly_schedule')
                        .update({
                            schedule: schedule,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', userId);
                    error = updateError;
                } else {
                    console.log('[Database] 📡 Inserindo novo horário...');
                    const { error: insertError } = await client
                        .from('weekly_schedule')
                        .insert({
                            user_id: userId,
                            schedule: schedule,
                            updated_at: new Date().toISOString()
                        });
                    error = insertError;
                }

                if (error) {
                    console.error('[Database] ❌ Erro ao salvar horário:', error);
                    return false;
                }

                console.log('[Database] ✅ Horário semanal salvo com sucesso');
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar horário:', error);
                return false;
            }
        }

        // ============================================
        // TIME SLOTS - COM LOGS
        // ============================================
        async function getTimeSlots(userId) {
            console.log('[Database] 🔍 Buscando time slots para userId:', userId);
            const client = init();
            if (!client) return ['08:00', '09:30', '11:00', '14:00', '15:30'];

            try {
                const { data, error } = await client
                    .from('time_slots')
                    .select('slots')
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('[Database] ❌ Erro ao buscar time slots:', error);
                }

                const slots = data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
                console.log('[Database] ✅ Time slots encontrados:', slots.length);
                return slots;
            } catch (error) {
                console.error('[Database] ❌ Erro ao buscar time slots:', error);
                return ['08:00', '09:30', '11:00', '14:00', '15:30'];
            }
        }

        async function saveTimeSlots(userId, slots) {
            console.log('[Database] 💾 Salvando time slots para userId:', userId);
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
                    console.log('[Database] 📡 Atualizando time slots existentes...');
                    const { error: updateError } = await client
                        .from('time_slots')
                        .update({
                            slots: slots,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', userId);
                    error = updateError;
                } else {
                    console.log('[Database] 📡 Inserindo novos time slots...');
                    const { error: insertError } = await client
                        .from('time_slots')
                        .insert({
                            user_id: userId,
                            slots: slots,
                            updated_at: new Date().toISOString()
                        });
                    error = insertError;
                }

                if (error) {
                    console.error('[Database] ❌ Erro ao salvar time slots:', error);
                    return false;
                }

                console.log('[Database] ✅ Time slots salvos com sucesso');
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar time slots:', error);
                return false;
            }
        }

        // ============================================
        // NOTIFICATIONS - COM LOGS
        // ============================================
        async function getNotifications(userId) {
            console.log('[Database] 🔍 Buscando notificações para userId:', userId);
            const client = init();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('[Database] ❌ Erro ao buscar notificações:', error);
                    return [];
                }

                console.log(`[Database] ✅ ${data?.length || 0} notificações encontradas`);
                return (data || []).map(notif => ({
                    id: notif.id,
                    title: notif.title || 'Notificação',
                    message: notif.message || '',
                    type: notif.type || 'info',
                    read: notif.read || false,
                    time: notif.created_at
                }));
            } catch (error) {
                console.error('[Database] ❌ Erro ao buscar notificações:', error);
                return [];
            }
        }

        async function saveNotifications(userId, notifications) {
            console.log(`[Database] 💾 Salvando ${notifications?.length || 0} notificações para userId:`, userId);
            const client = init();
            if (!client) return false;

            try {
                console.log('[Database] 📡 Deletando notificações antigas...');
                await client.from('notifications').delete().eq('user_id', userId);

                if (notifications.length === 0) {
                    console.log('[Database] ℹ️ Nenhuma notificação para salvar');
                    return true;
                }

                const notifToInsert = notifications.map(notif => ({
                    id: generateId(),
                    user_id: userId,
                    title: notif.title || 'Notificação',
                    message: notif.message || '',
                    type: notif.type || 'info',
                    read: notif.read || false,
                    created_at: notif.time || new Date().toISOString()
                }));

                console.log(`[Database] 📡 Inserindo ${notifToInsert.length} notificações...`);
                const { error } = await client.from('notifications').insert(notifToInsert);
                if (error) throw error;

                console.log(`[Database] ✅ ${notifications.length} notificações salvas com sucesso`);
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar notificações:', error);
                return false;
            }
        }

        // ============================================
        // DISCIPLINAS - COM LOGS
        // ============================================
        async function getDisciplinas(userId) {
            console.log('[Database] 🔍 Buscando disciplinas para userId:', userId);
            const client = init();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('disciplinas')
                    .select('*')
                    .eq('user_id', userId)
                    .order('nome', { ascending: true });

                if (error) {
                    console.error('[Database] ❌ Erro ao buscar disciplinas:', error);
                    return [];
                }

                console.log(`[Database] ✅ ${data?.length || 0} disciplinas encontradas`);
                return data || [];
            } catch (error) {
                console.error('[Database] ❌ Erro ao buscar disciplinas:', error);
                return [];
            }
        }

        async function saveDisciplinas(userId, disciplinas) {
            console.log(`[Database] 💾 Salvando ${disciplinas?.length || 0} disciplinas para userId:`, userId);
            const client = init();
            if (!client) return false;

            try {
                console.log('[Database] 📡 Deletando disciplinas antigas...');
                await client.from('disciplinas').delete().eq('user_id', userId);

                if (disciplinas.length === 0) {
                    console.log('[Database] ℹ️ Nenhuma disciplina para salvar');
                    return true;
                }

                const disciplinasToInsert = disciplinas.map(d => ({
                    id: generateId(),
                    user_id: userId,
                    nome: d.nome || 'Disciplina',
                    cor: d.cor || '#9333ea',
                    icone: d.icone || 'fa-book',
                    created_at: d.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                console.log(`[Database] 📡 Inserindo ${disciplinasToInsert.length} disciplinas...`);
                const { error } = await client.from('disciplinas').insert(disciplinasToInsert);
                if (error) throw error;

                console.log(`[Database] ✅ ${disciplinas.length} disciplinas salvas com sucesso`);
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar disciplinas:', error);
                return false;
            }
        }

        // ============================================
        // USER SETTINGS - COM LOGS
        // ============================================
        async function getUserSettings(userId) {
            console.log('[Database] 🔍 Buscando settings para userId:', userId);
            const client = init();
            if (!client) return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };

            try {
                const { data, error } = await client
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('[Database] ❌ Erro ao buscar settings:', error);
                }

                if (data) {
                    console.log('[Database] ✅ Settings encontrados');
                    return {
                        theme: data.theme || 'dark',
                        accent: data.accent_color || '#8b5cf6',
                        fontSize: data.font_size || 14,
                        notificationsSettings: data.notifications_settings || {}
                    };
                }

                console.log('[Database] ℹ️ Settings padrão retornados');
                return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
            } catch (error) {
                console.error('[Database] ❌ Erro ao buscar settings:', error);
                return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
            }
        }

        async function saveUserSettings(userId, settings) {
            console.log('[Database] 💾 Salvando settings para userId:', userId);
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
                console.log('[Database] ✅ Settings salvos com sucesso');
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao salvar settings:', error);
                return false;
            }
        }

        // ============================================
        // STORAGE - COM LOGS
        // ============================================
        async function uploadProfilePhoto(userId, file) {
            console.log('[Database] 📤 Upload de foto para userId:', userId);
            const client = init();
            if (!client) return null;

            try {
                const fileExt = file.name.split('.').pop() || 'png';
                const fileName = `${userId}_${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                console.log('[Database] 📡 Upload para:', filePath);

                const { error: uploadError } = await client.storage
                    .from('user-content')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('[Database] ❌ Erro no upload:', uploadError);
                    return null;
                }

                const { data: { publicUrl } } = client.storage
                    .from('user-content')
                    .getPublicUrl(filePath);

                if (publicUrl) {
                    console.log('[Database] ✅ URL pública gerada:', publicUrl);
                    await updateUserProfile(userId, { avatar_url: publicUrl });
                    console.log('[Database] ✅ Perfil atualizado com nova foto');
                    return publicUrl;
                }

                console.log('[Database] ⚠️ Não foi possível obter URL pública');
                return null;
            } catch (error) {
                console.error('[Database] ❌ Erro ao fazer upload:', error);
                return null;
            }
        }

        async function deleteProfilePhoto(userId) {
            console.log('[Database] 🗑️ Deletando foto para userId:', userId);
            const client = init();
            if (!client) return false;

            try {
                const profile = await getUserProfile(userId);
                if (profile?.avatar_url) {
                    const filePath = profile.avatar_url.split('/').pop();
                    console.log('[Database] 📡 Removendo arquivo:', filePath);
                    await client.storage.from('user-content').remove([`avatars/${filePath}`]);
                }

                await updateUserProfile(userId, { avatar_url: null });
                console.log('[Database] ✅ Foto removida com sucesso');
                return true;
            } catch (error) {
                console.error('[Database] ❌ Erro ao deletar foto:', error);
                return false;
            }
        }

        // ============================================
        // API PÚBLICA
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
            getDisciplinas,
            saveDisciplinas,
            getUserSettings,
            saveUserSettings,
            uploadProfilePhoto,
            deleteProfilePhoto
        };
    })();

    // Exportar para uso global
    window.DatabaseService = DatabaseService;
    console.log('[DatabaseService] ✅ Módulo carregado com sucesso! (COM LOGS DETALHADOS)');
}