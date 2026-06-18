// supabase-client.js - Cliente Supabase COMPLETO CORRIGIDO

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
// FUNÇÃO PARA COMPACTAR IMAGEM
// ============================================
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 500;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = (height * MAX_SIZE) / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = (width * MAX_SIZE) / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.8);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ============================================
// SERVIÇO DE AUTENTICAÇÃO (CORRIGIDO)
// ============================================
const AuthService = {
    async loginWithEmail(email, password) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        console.log('[Auth] Tentando login com email:', email);

        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('[Auth] Erro no login:', error.message);

            if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
                throw new Error('Por favor, confirme seu e-mail antes de fazer login.');
            }
            throw error;
        }

        console.log('[Auth] Login bem-sucedido para:', data.user?.email);

        if (!data.user?.email_confirmed_at) {
            console.warn('[Auth] E-mail não confirmado!');
            throw new Error('E-mail não confirmado. Verifique sua caixa de entrada.');
        }

        // Garantir que o perfil existe
        await this.ensureProfileExists(data.user);

        return { user: data.user };
    },

    async registerWithEmail(email, password, nome) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        console.log('[Auth] Tentando registrar:', email);

        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: nome || email.split('@')[0],
                    avatar_url: null
                },
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });

        if (error) {
            console.error('[Auth] Erro no registro:', error.message);
            throw error;
        }

        console.log('[Auth] Registro processado para:', email);

        if (data.user && !data.user.email_confirmed_at) {
            console.log('[Auth] Aguardando confirmação de e-mail.');
            return {
                user: data.user,
                needsConfirmation: true,
                message: 'E-mail de confirmação enviado! Verifique sua caixa de entrada.'
            };
        }

        if (data.user) {
            await this.createProfile(data.user.id, email, nome);
        }

        return { user: data.user };
    },

    async resendConfirmationEmail(email) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        console.log('[Auth] Reenviando confirmação para:', email);

        try {
            const { error } = await client.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });

            if (error) {
                console.error('[Auth] Erro ao reenviar:', error.message);
                throw error;
            }

            console.log('[Auth] E-mail de confirmação reenviado com sucesso');
            return true;

        } catch (error) {
            console.error('[Auth] Erro ao reenviar confirmação:', error);

            if (error.message.includes('already confirmed')) {
                throw new Error('Este e-mail já foi confirmado. Tente fazer login.');
            }
            throw error;
        }
    },

    async confirmEmail(token) {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        console.log('[Auth] Confirmando e-mail com token:', token.substring(0, 10) + '...');

        try {
            const { data, error } = await client.auth.verifyOtp({
                token_hash: token,
                type: 'email'
            });

            if (error) {
                console.error('[Auth] Erro ao verificar OTP:', error);
                throw error;
            }

            console.log('[Auth] E-mail confirmado com sucesso para:', data.user?.email);

            if (data.user) {
                await this.createProfile(
                    data.user.id,
                    data.user.email,
                    data.user.user_metadata?.full_name
                );
                console.log('[Auth] Perfil criado após confirmação');
                await this.logout();
                console.log('[Auth] Logout realizado após confirmação');
            }

            return data;

        } catch (error) {
            console.error('[Auth] Erro ao confirmar e-mail:', error);
            throw error;
        }
    },

    isConfirmationCallback() {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        const hasToken = params.has('token') || params.has('confirmation_token') ||
                         hash.includes('access_token') || hash.includes('confirmation');

        const isGoogle = params.has('code') || hash.includes('access_token');

        return hasToken && !isGoogle;
    },

    extractConfirmationToken() {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        let token = params.get('token') || params.get('confirmation_token');

        if (!token && hash) {
            const hashParams = new URLSearchParams(hash.replace('#', '?'));
            token = hashParams.get('access_token');
            if (!token) {
                token = hashParams.get('token');
            }
        }

        return token;
    },

    // 🔥 CORRIGIDO: Processar callback de confirmação com logout forçado
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
            // 🔥 FORÇAR LOGOUT de qualquer sessão existente
            const { data: { user } } = await this.getCurrentUser();

            if (user) {
                console.log('[Auth] ⚠️ Usuário logado detectado:', user.email);
                console.log('[Auth] Forçando logout para evitar conflito...');
                await this.logout();
                localStorage.removeItem('usuarioLogado');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Confirmar o e-mail com o token
            const result = await this.confirmEmail(token);

            if (result.user) {
                console.log('[Auth] ✅ E-mail confirmado com sucesso para:', result.user.email);

                // Remover parâmetros da URL
                window.history.replaceState({}, document.title, window.location.pathname);

                // 🔥 FAZER LOGOUT NOVAMENTE após confirmação
                console.log('[Auth] Fazendo logout novamente após confirmação...');
                await this.logout();
                localStorage.removeItem('usuarioLogado');

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

    // 🔥 CORRIGIDO: Login com Google com logout forçado
    async loginWithGoogle() {
        const client = initSupabase();
        if (!client) throw new Error('Supabase não inicializado');

        console.log('[Auth] Iniciando login com Google...');

        // 🔥 Forçar logout antes do Google para evitar conflitos
        console.log('[Auth] Forçando logout antes do Google...');
        await this.logout();
        localStorage.removeItem('usuarioLogado');

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

        if (error) {
            console.error('[Auth] Erro no login com Google:', error);
            throw error;
        }

        console.log('[Auth] Redirecionando para Google...');
        return data;
    },

    async createProfile(userId, email, nome) {
        const client = initSupabase();
        if (!client) {
            console.warn('[Auth] Cliente não disponível para criar perfil');
            return;
        }

        console.log('[Auth] Criando perfil para:', email);

        try {
            // Verificar se já existe
            const { data: existing, error: checkError } = await client
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            if (existing) {
                console.log('[Auth] Perfil já existe para:', email);
                return;
            }

            if (checkError && checkError.code !== 'PGRST116') {
                console.warn('[Auth] Erro ao verificar perfil:', checkError);
            }

            const { error } = await client.from('profiles').insert({
                id: userId,
                email: email,
                nome: nome || email.split('@')[0],
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            if (error) {
                console.error('[Auth] Erro ao criar perfil:', error);
                if (error.code !== '23505') throw error;
            } else {
                console.log('[Auth] Perfil criado com sucesso para:', email);
            }
        } catch (error) {
            console.error('[Auth] Erro ao criar perfil:', error);
        }
    },

    async ensureProfileExists(user) {
        if (!user) {
            console.warn('[Auth] ensureProfileExists: usuário inválido');
            return;
        }

        if (!user.email_confirmed_at) {
            console.log('[Auth] Usuário não confirmou e-mail ainda. Perfil não criado.');
            return;
        }

        const client = initSupabase();
        if (!client) {
            console.warn('[Auth] Cliente não disponível para ensureProfileExists');
            return;
        }

        console.log('[Auth] Verificando perfil para:', user.email);

        try {
            const { data, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                console.log('[Auth] Perfil não encontrado, criando para:', user.email);
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
            const { data: { user }, error } = await client.auth.getUser();
            if (error) {
                console.warn('[Auth] Erro ao buscar usuário:', error);
                return { data: { user: null } };
            }
            return { data: { user } };
        } catch (error) {
            console.error('[Auth] Erro ao buscar usuário:', error);
            return { data: { user: null } };
        }
    },

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
            console.warn('[Auth] Cliente não disponível para onAuthStateChange');
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
        if (!client) {
            console.warn('[Auth] Cliente não disponível para logout');
            return;
        }

        try {
            console.log('[Auth] Realizando logout...');
            await client.auth.signOut();
            console.log('[Auth] Logout realizado com sucesso');

            // Limpar dados locais
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('userPhotoURL');

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
            if (error) {
                console.warn('[Auth] Erro ao buscar sessão:', error);
                return { session: null };
            }
            return data;
        } catch (error) {
            console.error('[Auth] Erro ao buscar sessão:', error);
            return { session: null };
        }
    }
};

// ============================================
// SERVIÇO DE STORAGE (CORRIGIDO)
// ============================================
const StorageService = {
    // 🔥 CORRIGIDO: Upload de foto com compactação e URL pública
    async uploadProfilePhoto(userId, file) {
        const client = initSupabase();
        if (!client) {
            console.error('[Storage] Cliente não disponível');
            return null;
        }

        try {
            // Validação do arquivo
            if (!file || !file.type || !file.type.startsWith('image/')) {
                console.error('[Storage] Arquivo inválido:', file);
                return null;
            }

            console.log('[Storage] Iniciando upload para:', userId);
            console.log('[Storage] Arquivo:', file.name, file.size, file.type);

            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Compactar imagem se for muito grande
            let fileToUpload = file;
            if (file.size > 500 * 1024) {
                console.log('[Storage] Compactando imagem (tamanho original:', file.size, 'bytes)');
                fileToUpload = await compressImage(file);
                console.log('[Storage] Imagem compactada para:', fileToUpload.size, 'bytes');
            }

            // Tentar fazer upload
            console.log('[Storage] Fazendo upload para:', filePath);
            const { error: uploadError } = await client.storage
                .from('user-content')
                .upload(filePath, fileToUpload, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                console.error('[Storage] Erro no upload:', uploadError);

                // Se o bucket não existir, tentar criar
                if (uploadError.message.includes('bucket not found')) {
                    console.log('[Storage] Bucket não encontrado, criando...');

                    try {
                        const { error: createError } = await client.storage.createBucket('user-content', {
                            public: true,
                            fileSizeLimit: 5242880 // 5MB
                        });

                        if (createError) {
                            console.error('[Storage] Erro ao criar bucket:', createError);
                            return null;
                        }

                        console.log('[Storage] Bucket criado com sucesso');

                        // Tentar novamente
                        const { error: retryError } = await client.storage
                            .from('user-content')
                            .upload(filePath, fileToUpload, {
                                cacheControl: '3600',
                                upsert: true
                            });

                        if (retryError) {
                            console.error('[Storage] Erro no upload após criar bucket:', retryError);
                            return null;
                        }
                    } catch (createError) {
                        console.error('[Storage] Exceção ao criar bucket:', createError);
                        return null;
                    }
                } else {
                    return null;
                }
            }

            // Obter URL pública
            console.log('[Storage] Obtendo URL pública para:', filePath);
            const { data: { publicUrl } } = client.storage
                .from('user-content')
                .getPublicUrl(filePath);

            console.log('[Storage] URL pública obtida:', publicUrl);

            if (publicUrl) {
                // Atualizar perfil com a URL
                await DatabaseService.updateUserProfile(userId, { avatar_url: publicUrl });
                console.log('[Storage] Perfil atualizado com a nova foto');
                return publicUrl;
            }

            console.warn('[Storage] Não foi possível obter URL pública');
            return null;

        } catch (error) {
            console.error('[Storage] Erro ao fazer upload:', error);
            return null;
        }
    },

    async deleteProfilePhoto(userId) {
        const client = initSupabase();
        if (!client) {
            console.error('[Storage] Cliente não disponível');
            return false;
        }

        try {
            console.log('[Storage] Deletando foto para:', userId);

            const profile = await DatabaseService.getUserProfile(userId);
            if (profile?.avatar_url) {
                const filePath = profile.avatar_url.split('/').pop();
                console.log('[Storage] Removendo arquivo:', filePath);

                const { error } = await client.storage
                    .from('user-content')
                    .remove([`avatars/${filePath}`]);

                if (error) {
                    console.error('[Storage] Erro ao deletar arquivo:', error);
                }
            }

            await DatabaseService.updateUserProfile(userId, { avatar_url: null });
            console.log('[Storage] Foto removida com sucesso');
            return true;

        } catch (error) {
            console.error('[Storage] Erro ao deletar foto:', error);
            return false;
        }
    }
};

// ============================================
// SERVIÇO DE BANCO DE DADOS (COMPLETO)
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
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

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
            console.log('[DB] Salvando tasks para:', userId, tasks.length);

            await client.from('tasks').delete().eq('user_id', userId);

            if (tasks.length === 0) {
                console.log('[DB] Nenhuma task para salvar');
                return true;
            }

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
                reminder: event.reminder || false
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
            console.log('[DB] Atualizando perfil para:', userId);

            // Verificar quais campos existem na tabela
            let existingColumns = [];
            try {
                const { data: columns } = await client
                    .from('profiles')
                    .select('*')
                    .limit(1);
                if (columns && columns.length > 0) {
                    existingColumns = Object.keys(columns[0]);
                }
            } catch (e) {
                console.warn('[DB] Não foi possível verificar colunas, usando campos padrão');
            }

            // Campos permitidos
            const allowedFields = ['nome', 'email', 'avatar_url', 'telefone', 'nascimento', 'genero'];
            const updateData = {};

            // Adicionar apenas campos que existem na tabela
            for (const field of allowedFields) {
                if (profile[field] !== undefined && profile[field] !== null) {
                    if (existingColumns.length === 0 || existingColumns.includes(field)) {
                        updateData[field] = profile[field];
                    }
                }
            }

            // Se não houver campos para atualizar, retorna
            if (Object.keys(updateData).length === 0) {
                console.log('[DB] Nenhum campo válido para atualizar');
                return true;
            }

            updateData.updated_at = new Date().toISOString();

            const { error } = await client
                .from('profiles')
                .update(updateData)
                .eq('id', userId);

            if (error) {
                console.error('[DB] Erro ao atualizar perfil:', error);
                return false;
            }

            console.log('[DB] Perfil atualizado com sucesso');
            return true;
        } catch (error) {
            console.error('[DB] Erro ao atualizar perfil:', error);
            return false;
        }
    },

    async getDisciplinas(userId) {
        const client = initSupabase();
        if (!client) return [];

        try {
            const { data, error } = await client
                .from('disciplinas')
                .select('*')
                .eq('user_id', userId)
                .order('nome', { ascending: true });

            if (error) {
                console.error('[DB] Erro ao buscar disciplinas:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[DB] Erro ao buscar disciplinas:', error);
            return [];
        }
    },

    async saveDisciplinas(userId, disciplinas) {
        const client = initSupabase();
        if (!client) return false;

        try {
            await client.from('disciplinas').delete().eq('user_id', userId);

            if (disciplinas.length === 0) {
                console.log('[DB] Nenhuma disciplina para salvar');
                return true;
            }

            const disciplinasToInsert = disciplinas.map(d => ({
                id: d.id,
                user_id: userId,
                nome: d.nome,
                cor: d.cor || '#9333ea',
                icone: d.icone || 'fa-book',
                created_at: d.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const { error } = await client.from('disciplinas').insert(disciplinasToInsert);
            if (error) throw error;

            console.log(`[DB] ${disciplinas.length} disciplinas salvas`);
            return true;
        } catch (error) {
            console.error('[DB] Erro ao salvar disciplinas:', error);
            return false;
        }
    },

    async ensureUserData(userId, email, nome) {
        console.log('[DB] Verificando estrutura do usuário:', userId);

        // Verificar/criar perfil
        let profile = await this.getUserProfile(userId);
        if (!profile) {
            console.log('[DB] Criando perfil para:', email);
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

        // Verificar/criar weekly_schedule
        let schedule = await this.getWeeklySchedule(userId);
        if (!schedule || Object.keys(schedule).length === 0) {
            console.log('[DB] Criando horário padrão');
            await this.saveWeeklySchedule(userId, { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] });
        }

        // Verificar/criar time_slots
        let slots = await this.getTimeSlots(userId);
        if (!slots || slots.length === 0) {
            console.log('[DB] Criando time slots padrão');
            await this.saveTimeSlots(userId, ['08:00', '09:30', '11:00', '14:00', '15:30']);
        }

        console.log('[DB] Estrutura do usuário verificada');
        return true;
    }
};

// ============================================
// EXPORTAR PARA USO GLOBAL
// ============================================
window.SupabaseClient = {
    initSupabase: initSupabase,
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
console.log('[Supabase] DatabaseService disponível:', !!window.DatabaseService);
console.log('[Supabase] StorageService disponível:', !!window.StorageService);
console.log('[Supabase] ✅ Storage com upload e compactação!');
console.log('[Supabase] ✅ Confirmação de e-mail corrigida!');
console.log('[Supabase] ✅ Google login com logout forçado!');