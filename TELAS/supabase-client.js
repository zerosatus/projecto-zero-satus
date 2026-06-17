// supabase-client.js - Cliente Supabase unificado (VERSÃO COMPLETA COM CONFIRMAÇÃO DE E-MAIL E ANTI-AUTOCOMPLETE)

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
// SERVIÇO DE AUTENTICAÇÃO (COM CONFIRMAÇÃO)
// ============================================
const AuthService = {
    async loginWithEmail(email, password) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
            // Verificar se o erro é de e-mail não confirmado
            if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
                throw new Error('Por favor, confirme seu e-mail antes de fazer login.');
            }
            throw error;
        }

        // Verificar se o e-mail foi confirmado
        if (!data.user?.email_confirmed_at) {
            throw new Error('E-mail não confirmado. Verifique sua caixa de entrada.');
        }

        // Garantir que o perfil existe
        await this.ensureProfileExists(data.user);

        return { user: data.user };
    },

    async registerWithEmail(email, password, nome) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: nome || email.split('@')[0],
                    avatar_url: null
                },
                // O usuário será redirecionado para esta URL após confirmar o e-mail
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;

        // Se o usuário foi criado mas precisa confirmar e-mail
        if (data.user && !data.user.email_confirmed_at) {
            console.log('[Auth] Usuário criado. Aguardando confirmação de e-mail.');

            return {
                user: data.user,
                needsConfirmation: true,
                message: 'E-mail de confirmação enviado! Verifique sua caixa de entrada.'
            };
        }

        // Criar perfil após cadastro (se já confirmado)
        if (data.user) {
            await this.createProfile(data.user.id, email, nome);
        }

        return { user: data.user };
    },

    // ============================================
    // REENVIAR E-MAIL DE CONFIRMAÇÃO
    // ============================================
    async resendConfirmationEmail(email) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        try {
            const { error } = await client.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });

            if (error) throw error;

            console.log('[Auth] E-mail de confirmação reenviado para:', email);
            return true;

        } catch (error) {
            console.error('[Auth] Erro ao reenviar confirmação:', error);

            // Se o usuário já estiver confirmado
            if (error.message.includes('already confirmed')) {
                throw new Error('Este e-mail já foi confirmado. Tente fazer login.');
            }

            throw error;
        }
    },

    // ============================================
    // ⭐ CONFIRMAR E-MAIL (via token) - NOVO
    // ============================================
    async confirmEmail(token) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        try {
            console.log('[Auth] Tentando confirmar e-mail com token:', token.substring(0, 10) + '...');

            const { data, error } = await client.auth.verifyOtp({
                token_hash: token,
                type: 'email'
            });

            if (error) {
                console.error('[Auth] Erro ao verificar OTP:', error);
                throw error;
            }

            console.log('[Auth] E-mail confirmado com sucesso!');

            // Criar perfil após confirmação
            if (data.user) {
                await this.createProfile(
                    data.user.id,
                    data.user.email,
                    data.user.user_metadata?.full_name
                );

                // ⚠️ IMPORTANTE: Fazer logout para evitar conflito de contas
                console.log('[Auth] Fazendo logout após confirmação para evitar conflito...');
                await this.logout();
            }

            return data;

        } catch (error) {
            console.error('[Auth] Erro ao confirmar e-mail:', error);
            throw error;
        }
    },

    // ============================================
    // ⭐ VERIFICAR SE É CALLBACK DE CONFIRMAÇÃO
    // ============================================
    isConfirmationCallback() {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        // Verificar se há token de confirmação na URL
        const hasToken = params.has('token') || params.has('confirmation_token') ||
                         hash.includes('access_token') || hash.includes('confirmation');

        // Verificar se é o callback do Google
        const isGoogle = params.has('code') || hash.includes('access_token');

        return hasToken && !isGoogle;
    },

    // ============================================
    // ⭐ EXTRAIR TOKEN DA URL
    // ============================================
    extractConfirmationToken() {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        // Extrair token da URL
        let token = params.get('token') || params.get('confirmation_token');

        // Se não tiver token, verificar no hash
        if (!token && hash) {
            const hashParams = new URLSearchParams(hash.replace('#', '?'));
            token = hashParams.get('access_token');
            if (!token) {
                token = hashParams.get('token');
            }
        }

        return token;
    },

    // ============================================
    // ⭐ PROCESSAR CALLBACK DE CONFIRMAÇÃO COMPLETO
    // ============================================
    async processConfirmationCallback() {
        console.log('[Auth] Processando callback de confirmação...');

        if (!this.isConfirmationCallback()) {
            console.log('[Auth] Não é um callback de confirmação');
            return null;
        }

        const token = this.extractConfirmationToken();

        if (!token) {
            console.log('[Auth] Nenhum token encontrado na URL');
            return null;
        }

        console.log('[Auth] Token encontrado:', token.substring(0, 10) + '...');

        try {
            // Verificar se o usuário atual corresponde ao e-mail confirmado
            const { data: { user } } = await this.getCurrentUser();

            // Se já estiver logado, fazer logout primeiro para evitar conflitos
            if (user) {
                console.log('[Auth] Usuário logado. Fazendo logout antes de confirmar...');
                await this.logout();
                localStorage.removeItem('usuarioLogado');

                // Aguardar um pouco para o logout ser processado
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Confirmar o e-mail
            const result = await this.confirmEmail(token);

            if (result.user) {
                console.log('[Auth] ✅ E-mail confirmado com sucesso para:', result.user.email);

                // Remover parâmetros da URL
                window.history.replaceState({}, document.title, window.location.pathname);

                return {
                    success: true,
                    user: result.user,
                    message: 'E-mail confirmado com sucesso! Faça login para continuar.'
                };
            }

            return null;

        } catch (error) {
            console.error('[Auth] Erro ao processar confirmação:', error);
            throw error;
        }
    },

    async loginWithGoogle() {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        const redirectUrl = window.location.origin + window.location.pathname;
        console.log('[Auth] Redirect URL Google:', redirectUrl);

        const { data, error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        if (error) throw error;

        console.log('[Auth] Redirecionando para Google...');
        return data;
    },

    async createProfile(userId, email, nome) {
        const client = initSupabase();
        if (!client) return;

        try {
            // Verificar se já existe
            const { data: existing } = await client
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            if (existing) {
                console.log('[Auth] Perfil já existe');
                return;
            }

            const { error } = await client.from('profiles').insert({
                id: userId,
                email: email,
                nome: nome || email.split('@')[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            if (error) {
                console.error('[Auth] Erro ao criar perfil:', error);
                if (error.code !== '23505') throw error;
            } else {
                console.log('[Auth] Perfil criado com sucesso');
            }
        } catch (error) {
            console.error('[Auth] Erro ao criar perfil:', error);
        }
    },

    async ensureProfileExists(user) {
        if (!user) return;

        // Só cria perfil se o e-mail estiver confirmado
        if (!user.email_confirmed_at) {
            console.log('[Auth] Usuário não confirmou e-mail ainda. Perfil não criado.');
            return;
        }

        const client = initSupabase();
        if (!client) return;

        try {
            const { data, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                console.log('[Auth] Criando perfil para:', user.email);
                await this.createProfile(
                    user.id,
                    user.email,
                    user.user_metadata?.full_name || user.email.split('@')[0]
                );
            } else if (error) {
                console.error('[Auth] Erro ao verificar perfil:', error);
            } else {
                console.log('[Auth] Perfil já existe para:', user.email);
            }
        } catch (error) {
            console.error('[Auth] Erro em ensureProfileExists:', error);
        }
    },

    async getCurrentUser() {
        const client = initSupabase();
        if (!client) return { data: { user: null } };

        try {
            const { data: { user } } = await client.auth.getUser();
            return { data: { user } };
        } catch (error) {
            console.error('[Auth] Erro ao buscar usuário:', error);
            return { data: { user: null } };
        }
    },

    // Verificar status do usuário
    async getUserStatus() {
        const { data: { user } } = await this.getCurrentUser();
        if (!user) return { loggedIn: false, confirmed: false };

        return {
            loggedIn: true,
            confirmed: !!user.email_confirmed_at,
            email: user.email,
            id: user.id,
            nome: user.user_metadata?.full_name || user.email.split('@')[0]
        };
    },

    onAuthStateChange(callback) {
        const client = initSupabase();
        if (!client) {
            return {
                data: {
                    subscription: {
                        unsubscribe: () => {}
                    }
                }
            };
        }

        return client.auth.onAuthStateChange(callback);
    },

    async logout() {
        const client = initSupabase();
        if (!client) return;

        try {
            await client.auth.signOut();
            console.log('[Auth] Logout realizado');
            // Limpar dados locais
            localStorage.removeItem('usuarioLogado');
            if (window.CacheManager) {
                window.CacheManager.logout();
            }
        } catch (error) {
            console.error('[Auth] Erro no logout:', error);
        }
    },

    async getSession() {
        const client = initSupabase();
        if (!client) return { data: { session: null } };

        try {
            const { data, error } = await client.auth.getSession();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[Auth] Erro ao buscar sessão:', error);
            return { session: null };
        }
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

        try {
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
    },

    async saveTasks(userId, tasks) {
        const client = initSupabase();
        if (!client) return false;

        try {
            await client.from('tasks').delete().eq('user_id', userId);

            if (tasks.length === 0) return true;

            const tasksToInsert = tasks.map(task => ({
                id: task.id || crypto.randomUUID(),
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

        try {
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
        } catch (error) {
            console.error('[DB] Erro ao buscar notes:', error);
            return [];
        }
    },

    async saveNotes(userId, notes) {
        const client = initSupabase();
        if (!client) return false;

        try {
            await client.from('notes').delete().eq('user_id', userId);

            if (notes.length === 0) return true;

            const notesToInsert = notes.map(note => ({
                id: note.id || crypto.randomUUID(),
                user_id: userId,
                title: note.title || 'Sem título',
                content: note.content || '',
                created_at: note.date || new Date().toISOString(),
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

        try {
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
                description: event.description || '',
                date: event.date,
                start: event.start_time,
                end: event.end_time,
                type: event.type || 'aula',
                color: event.color || '#8b5cf6',
                repeat: event.repeat_type || 'nao',
                reminder: event.reminder || false,
                day: event.date ? new Date(event.date).getDate() : null,
                month: event.date ? new Date(event.date).getMonth() : null,
                year: event.date ? new Date(event.date).getFullYear() : null,
                time: event.start_time
            }));
        } catch (error) {
            console.error('[DB] Erro ao buscar eventos:', error);
            return [];
        }
    },

    async saveCalendarEvents(userId, events) {
        const client = initSupabase();
        if (!client) return false;

        try {
            await client.from('calendar_events').delete().eq('user_id', userId);

            if (events.length === 0) return true;

            const eventsToInsert = events.map(event => ({
                id: event.id || crypto.randomUUID(),
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
                created_at: new Date().toISOString(),
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

        try {
            const { data, error } = await client
                .from('weekly_schedule')
                .select('schedule')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('[DB] Erro ao buscar horário:', error);
            }

            return data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
        } catch (error) {
            console.error('[DB] Erro ao buscar horário:', error);
            return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
        }
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
                }, { onConflict: 'user_id' });

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

        try {
            const { data, error } = await client
                .from('time_slots')
                .select('slots')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('[DB] Erro ao buscar time slots:', error);
            }

            return data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
        } catch (error) {
            console.error('[DB] Erro ao buscar time slots:', error);
            return ['08:00', '09:30', '11:00', '14:00', '15:30'];
        }
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
                }, { onConflict: 'user_id' });

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

        try {
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
    },

    async saveNotifications(userId, notifications) {
        const client = initSupabase();
        if (!client) return false;

        try {
            await client.from('notifications').delete().eq('user_id', userId);

            if (notifications.length === 0) return true;

            const notifToInsert = notifications.map(notif => ({
                id: notif.id || crypto.randomUUID(),
                user_id: userId,
                title: notif.title || 'Notificação',
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

        try {
            const { data, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('[DB] Erro ao buscar perfil:', error);
            }

            return data || null;
        } catch (error) {
            console.error('[DB] Erro ao buscar perfil:', error);
            return null;
        }
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
                try {
                    await client.from('profiles').insert({
                        id: userId,
                        email: email,
                        nome: nome || email.split('@')[0],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                    console.log('[DB] Perfil criado com sucesso');
                } catch (error) {
                    console.error('[DB] Erro ao criar perfil:', error);
                }
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

// ============================================
// EXPORTAR (TUDO DISPONÍVEL GLOBALMENTE)
// ============================================
window.SupabaseClient = {
    initSupabase,
    getClient: initSupabase
};
window.AuthService = AuthService;
window.DatabaseService = DatabaseService;
window.StorageService = StorageService;

// Disparar evento para informar que o Supabase está pronto
window.dispatchEvent(new CustomEvent('supabaseReady'));

console.log('[Supabase] Serviços carregados com sucesso!');
console.log('[Supabase] URL:', SUPABASE_URL);
console.log('[Supabase] AuthService disponível:', !!window.AuthService);
console.log('[Supabase] Confirmação de e-mail habilitada');
console.log('[Supabase] ✅ Anti-autocomplete e confirmação de e-mail corrigidos!');