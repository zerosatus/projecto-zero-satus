// ==========================================
// supabase-client.js - Cliente Supabase COMPLETO
// ==========================================

const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";

let supabaseClient = null;
let isInitializing = false;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 10; // AUMENTADO PARA MAIS TENTATIVAS

// ============================================
// 🔥 FUNÇÃO PARA ESPERAR O SUPABASE CARREGAR
// ============================================
function waitForSupabaseLibrary() {
    return new Promise((resolve) => {
        // Se já existe, resolve imediatamente
        if (typeof supabase !== 'undefined') {
            resolve();
            return;
        }
        
        console.log('[Supabase] ⏳ Aguardando biblioteca Supabase carregar...');
        
        // Verificar a cada 100ms
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (typeof supabase !== 'undefined') {
                console.log('[Supabase] ✅ Biblioteca Supabase carregada!');
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                console.warn('[Supabase] ⚠️ Timeout aguardando biblioteca Supabase');
                clearInterval(checkInterval);
                
                // Tentar carregar manualmente via CDN
                carregarSupabaseManual();
                
                // Verificar novamente após carregamento manual
                setTimeout(() => {
                    if (typeof supabase !== 'undefined') {
                        console.log('[Supabase] ✅ Biblioteca carregada manualmente!');
                        resolve();
                    } else {
                        console.error('[Supabase] ❌ Falha ao carregar biblioteca Supabase');
                        resolve(); // Resolve mesmo assim para não travar
                    }
                }, 1000);
            }
        }, 100);
    });
}

// ============================================
// 🔥 CARREGAR SUPABASE MANUALMENTE
// ============================================
function carregarSupabaseManual() {
    console.log('[Supabase] 🔄 Tentando carregar Supabase manualmente...');
    
    // Verificar se já existe no window
    if (window.supabase) {
        console.log('[Supabase] ✅ Supabase encontrado no window');
        return;
    }
    
    // Tentar carregar via CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => {
        console.log('[Supabase] ✅ Supabase carregado via script manual!');
        if (!window.supabase && typeof supabase !== 'undefined') {
            window.supabase = supabase;
        }
    };
    script.onerror = () => {
        console.error('[Supabase] ❌ Falha ao carregar Supabase via script manual');
    };
    document.head.appendChild(script);
}

// ============================================
// INICIALIZAR SUPABASE (VERSÃO CORRIGIDA)
// ============================================
async function initSupabase() {
    if (supabaseClient) {
        return supabaseClient;
    }
    
    if (isInitializing) {
        console.log('[Supabase] ⏳ Já inicializando...');
        return null;
    }
    
    isInitializing = true;
    initAttempts++;
    console.log(`[Supabase] 🚀 Inicializando cliente (tentativa ${initAttempts})...`);
    
    try {
        // 🔥 ESPERAR A BIBLIOTECA CARREGAR
        await waitForSupabaseLibrary();
        
        // Verificar novamente após esperar
        const supabaseLib = typeof supabase !== 'undefined' ? supabase : window.supabase;
        
        if (!supabaseLib) {
            console.error('[Supabase] ❌ Biblioteca Supabase não disponível após espera');
            
            if (initAttempts < MAX_INIT_ATTEMPTS) {
                console.log(`[Supabase] 🔄 Tentando novamente em 1s (${initAttempts}/${MAX_INIT_ATTEMPTS})...`);
                setTimeout(() => {
                    isInitializing = false;
                    initSupabase();
                }, 1000);
            } else {
                console.error('[Supabase] ❌ Máximo de tentativas atingido');
                isInitializing = false;
            }
            return null;
        }
        
        console.log('[Supabase] 📦 Criando cliente Supabase...');
        supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: localStorage
            }
        });
        
        console.log('[Supabase] ✅ Cliente inicializado com sucesso');
        window.supabaseClient = supabaseClient;
        window.SupabaseClient = {
            client: supabaseClient,
            initSupabase: initSupabase,
            getClient: () => supabaseClient
        };
        
        // Criar serviços
        criarAuthService(supabaseClient);
        criarDatabaseService(supabaseClient);
        criarStorageService();
        
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('supabaseReady'));
            console.log('[Supabase] 📡 Evento supabaseReady disparado');
        }, 100);
        
        return supabaseClient;
        
    } catch (error) {
        console.error('[Supabase] ❌ Erro ao inicializar:', error);
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            setTimeout(() => {
                isInitializing = false;
                initSupabase();
            }, 2000);
        }
        return null;
    } finally {
        isInitializing = false;
    }
}

// ============================================
// GERAR ID
// ============================================
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

// ============================================
// COMPRESSÃO DE IMAGEM
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
// CRIAR AUTH SERVICE
// ============================================
function criarAuthService(client) {
    if (!client) {
        console.warn('[Supabase] ⚠️ Cliente não disponível para AuthService');
        return;
    }
    
    console.log('[Supabase] 🔐 Criando AuthService...');
    
    const AuthService = {
        async loginWithEmail(email, password) {
            // 🔥 GARANTIR QUE O CLIENTE ESTÁ INICIALIZADO
            const finalClient = window.supabaseClient || initSupabase();
            if (!finalClient) {
                console.error('[Auth] ❌ Cliente não disponível');
                throw new Error('Supabase não inicializado. Verifique sua conexão.');
            }

            console.log('[Auth] 🔐 Tentando login:', email);

            const { data, error } = await finalClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('[Auth] ❌ Erro no login:', error.message);
                if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
                    throw new Error('Por favor, confirme seu e-mail antes de fazer login.');
                }
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('E-mail ou senha incorretos!');
                }
                throw error;
            }

            if (!data.user?.email_confirmed_at) {
                throw new Error('E-mail não confirmado. Verifique sua caixa de entrada.');
            }

            await this.ensureProfileExists(data.user);
            return { user: data.user };
        },

        async registerWithEmail(email, password, nome) {
            const client = window.supabaseClient || initSupabase();
            if (!client) throw new Error('Supabase não inicializado');

            console.log('[Auth] 📝 Tentando registrar:', email);

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
                console.error('[Auth] ❌ Erro no registro:', error.message);
                if (error.message.includes('User already registered')) {
                    throw new Error('Este e-mail já está cadastrado.');
                }
                throw error;
            }

            console.log('[Auth] ✅ Registro processado para:', email);

            if (data.user && !data.user.email_confirmed_at) {
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
            const client = window.supabaseClient || initSupabase();
            if (!client) throw new Error('Supabase não inicializado');

            console.log('[Auth] 📧 Reenviando confirmação para:', email);

            try {
                const { error } = await client.auth.resend({
                    type: 'signup',
                    email: email,
                    options: {
                        emailRedirectTo: window.location.origin + window.location.pathname
                    }
                });

                if (error) {
                    if (error.message.includes('already confirmed')) {
                        throw new Error('Este e-mail já foi confirmado. Tente fazer login.');
                    }
                    throw error;
                }

                return true;

            } catch (error) {
                console.error('[Auth] ❌ Erro ao reenviar:', error);
                throw error;
            }
        },

        async confirmEmail(token) {
            const client = window.supabaseClient || initSupabase();
            if (!client) throw new Error('Supabase não inicializado');

            console.log('[Auth] 🔑 Confirmando e-mail');

            try {
                const { data, error } = await client.auth.verifyOtp({
                    token_hash: token,
                    type: 'email'
                });

                if (error) {
                    console.error('[Auth] ❌ Erro:', error);
                    throw error;
                }

                if (data.user) {
                    await this.createProfile(
                        data.user.id,
                        data.user.email,
                        data.user.user_metadata?.full_name
                    );
                    await this.logout();
                }

                return data;

            } catch (error) {
                console.error('[Auth] ❌ Erro ao confirmar e-mail:', error);
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

        async processConfirmationCallback() {
            console.log('[Auth] 🔄 Processando callback de confirmação...');

            if (!this.isConfirmationCallback()) {
                return null;
            }

            const token = this.extractConfirmationToken();
            if (!token) {
                return null;
            }

            try {
                const { data: { user } } = await this.getCurrentUser();

                if (user) {
                    console.log('[Auth] ⚠️ Usuário logado, fazendo logout...');
                    await this.logout();
                    localStorage.removeItem('usuarioLogado');
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                const result = await this.confirmEmail(token);

                if (result.user) {
                    window.history.replaceState({}, document.title, window.location.pathname);
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
                console.error('[Auth] ❌ Erro:', error);
                throw error;
            }
        },

        async loginWithGoogle() {
            const client = window.supabaseClient || initSupabase();
            if (!client) throw new Error('Supabase não inicializado');

            console.log('[Auth] 🔐 Login com Google...');

            await this.logout();
            localStorage.removeItem('usuarioLogado');

            const redirectUrl = window.location.origin + window.location.pathname;

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
                console.error('[Auth] ❌ Erro no Google:', error);
                throw error;
            }

            return data;
        },

        async createProfile(userId, email, nome) {
            const client = window.supabaseClient || initSupabase();
            if (!client) {
                console.warn('[Auth] ⚠️ Cliente não disponível');
                return;
            }

            console.log('[Auth] 📝 Criando perfil para:', email);

            try {
                const { data: existing } = await client
                    .from('profiles')
                    .select('id')
                    .eq('id', userId)
                    .single();

                if (existing) {
                    console.log('[Auth] ✅ Perfil já existe');
                    return;
                }

                const { error } = await client.from('profiles').insert({
                    id: userId,
                    email: email,
                    nome: nome || email.split('@')[0],
                    avatar_url: null,
                    role: 'user',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

                if (error) {
                    if (error.code !== '23505') throw error;
                } else {
                    console.log('[Auth] ✅ Perfil criado');
                }
            } catch (error) {
                console.error('[Auth] ❌ Erro ao criar perfil:', error);
            }
        },

        async ensureProfileExists(user) {
            if (!user || !user.email_confirmed_at) return;

            console.log('[Auth] 🔍 Verificando perfil para:', user.email);

            try {
                const client = window.supabaseClient || initSupabase();
                if (!client) return;

                const { data } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!data) {
                    await this.createProfile(
                        user.id,
                        user.email,
                        user.user_metadata?.full_name || user.email.split('@')[0]
                    );
                }
            } catch (error) {
                console.warn('[Auth] ⚠️ Erro ao verificar perfil:', error);
                await this.createProfile(
                    user.id,
                    user.email,
                    user.user_metadata?.full_name || user.email.split('@')[0]
                );
            }
        },

        async isUserAdmin() {
            const { data: { user } } = await this.getCurrentUser();
            if (!user) return false;
            
            try {
                const client = window.supabaseClient || initSupabase();
                if (!client) return false;
                
                const { data: profile, error } = await client
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                
                if (error) return false;
                return profile?.role === 'admin';
            } catch (error) {
                return false;
            }
        },

        async getUserRole() {
            const { data: { user } } = await this.getCurrentUser();
            if (!user) return 'user';
            
            try {
                const client = window.supabaseClient || initSupabase();
                if (!client) return 'user';
                
                const { data: profile, error } = await client
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                
                if (error) return 'user';
                return profile?.role || 'user';
            } catch (error) {
                return 'user';
            }
        },

        async getCurrentUser() {
            try {
                const client = window.supabaseClient || initSupabase();
                if (!client) return { data: { user: null } };
                
                const { data: { user }, error } = await client.auth.getUser();
                if (error) {
                    console.warn('[Auth] ⚠️ Erro:', error);
                    return { data: { user: null } };
                }
                return { data: { user } };
            } catch (error) {
                console.error('[Auth] ❌ Erro:', error);
                return { data: { user: null } };
            }
        },

        onAuthStateChange(callback) {
            const client = window.supabaseClient || initSupabase();
            if (!client) {
                console.warn('[Auth] ⚠️ Cliente não disponível');
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
            try {
                const client = window.supabaseClient || initSupabase();
                if (!client) {
                    console.warn('[Auth] ⚠️ Cliente não disponível para logout');
                    return;
                }
                
                console.log('[Auth] 🔄 Logout...');
                await client.auth.signOut();
                console.log('[Auth] ✅ Logout realizado');

                localStorage.removeItem('usuarioLogado');
                localStorage.removeItem('userPhotoURL');

                if (window.CacheManager) {
                    window.CacheManager.logout();
                }
            } catch (error) {
                console.error('[Auth] ❌ Erro no logout:', error);
            }
        },

        async getSession() {
            try {
                const client = window.supabaseClient || initSupabase();
                if (!client) return { session: null };
                
                const { data, error } = await client.auth.getSession();
                if (error) {
                    console.warn('[Auth] ⚠️ Erro:', error);
                    return { session: null };
                }
                return data;
            } catch (error) {
                console.error('[Auth] ❌ Erro:', error);
                return { session: null };
            }
        },

        isReady() {
            return !!window.supabaseClient || !!supabaseClient;
        }
    };

    window.AuthService = AuthService;
    console.log('[Supabase] ✅ AuthService criado e exportado');
}

// ============================================
// CRIAR DATABASE SERVICE
// ============================================
function criarDatabaseService(client) {
    if (!client) {
        console.warn('[Supabase] ⚠️ Cliente não disponível para DatabaseService');
        return;
    }
    
    console.log('[Supabase] 📊 Criando DatabaseService...');
    
    const DatabaseService = {
        async getCurrentUserId() {
            const { data: { user } } = await window.AuthService.getCurrentUser();
            return user?.id || null;
        },

        async getUserProfile(userId) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return null;

            try {
                const { data, error } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') return null;
                    console.error('[DB] ❌ Erro:', error);
                    return null;
                }

                return data;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return null;
            }
        },

        async updateUserProfile(userId, profile) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return false;

            try {
                const updateData = { updated_at: new Date().toISOString() };
                const allowedFields = ['nome', 'email', 'avatar_url', 'telefone', 'nascimento', 'genero', 'role'];

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

                if (error) {
                    console.error('[DB] ❌ Erro:', error);
                    return false;
                }

                return true;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return false;
            }
        },

        async ensureUserData(userId, email, nome) {
            console.log('[DB] 🔧 Verificando estrutura do usuário:', userId);

            try {
                let profile = await this.getUserProfile(userId);
                if (!profile) {
                    console.log('[DB] 📝 Criando perfil...');
                    await window.AuthService.createProfile(userId, email, nome);
                }

                let schedule = await this.getWeeklySchedule(userId);
                if (!schedule || Object.keys(schedule).length === 0) {
                    console.log('[DB] 📝 Criando horário padrão');
                    await this.saveWeeklySchedule(userId, { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] });
                }

                let slots = await this.getTimeSlots(userId);
                if (!slots || slots.length === 0) {
                    console.log('[DB] 📝 Criando time slots padrão');
                    await this.saveTimeSlots(userId, ['08:00', '09:30', '11:00', '14:00', '15:30']);
                }

                console.log('[DB] ✅ Estrutura do usuário verificada');
                return true;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return false;
            }
        },

        // ============================================
        // TASKS
        // ============================================
        async getTasks(userId) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('[DB] ❌ Erro:', error);
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
                console.error('[DB] ❌ Erro:', error);
                return [];
            }
        },

        async saveTasks(userId, tasks) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return false;

            try {
                const { error: deleteError } = await client
                    .from('tasks')
                    .delete()
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('[DB] ❌ Erro:', deleteError);
                    return false;
                }

                if (!tasks || tasks.length === 0) return true;

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

                const batchSize = 100;
                for (let i = 0; i < tasksToInsert.length; i += batchSize) {
                    const batch = tasksToInsert.slice(i, i + batchSize);
                    const { error } = await client.from('tasks').insert(batch);
                    if (error) throw error;
                }

                return true;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return false;
            }
        },

        // ============================================
        // NOTES
        // ============================================
        async getNotes(userId) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('notes')
                    .select('*')
                    .eq('user_id', userId)
                    .order('updated_at', { ascending: false });

                if (error) {
                    console.error('[DB] ❌ Erro:', error);
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
                console.error('[DB] ❌ Erro:', error);
                return [];
            }
        },

        async saveNotes(userId, notes) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return false;

            try {
                const { error: deleteError } = await client
                    .from('notes')
                    .delete()
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('[DB] ❌ Erro:', deleteError);
                    return false;
                }

                if (!notes || notes.length === 0) return true;

                const notesToInsert = notes.map(note => ({
                    id: generateId(),
                    user_id: userId,
                    title: note.title || note.titulo || 'Sem título',
                    content: note.content || note.conteudo || '',
                    created_at: note.date || note.dataCriacao || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { error } = await client.from('notes').insert(notesToInsert);
                if (error) {
                    console.error('[DB] ❌ Erro:', error);
                    throw error;
                }

                return true;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return false;
            }
        },

        // ============================================
        // CALENDAR EVENTS
        // ============================================
        async getCalendarEvents(userId) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('calendar_events')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: true });

                if (error) {
                    console.error('[DB] ❌ Erro:', error);
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
                console.error('[DB] ❌ Erro:', error);
                return [];
            }
        },

        async saveCalendarEvents(userId, events) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return false;

            try {
                const { error: deleteError } = await client
                    .from('calendar_events')
                    .delete()
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('[DB] ❌ Erro:', deleteError);
                    return false;
                }

                if (!events || events.length === 0) return true;

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

                const { error } = await client.from('calendar_events').insert(eventsToInsert);
                if (error) throw error;

                return true;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return false;
            }
        },

        // ============================================
        // WEEKLY SCHEDULE
        // ============================================
        async getWeeklySchedule(userId) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };

            try {
                const { data, error } = await client
                    .from('weekly_schedule')
                    .select('schedule')
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('[DB] ❌ Erro:', error);
                }

                const schedule = data?.schedule || { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
                const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
                dias.forEach(day => {
                    if (!schedule[day]) schedule[day] = [];
                });

                return schedule;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
            }
        },

        async saveWeeklySchedule(userId, schedule) {
            const client = window.supabaseClient || initSupabase();
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

                if (error) {
                    console.error('[DB] ❌ Erro:', error);
                    return false;
                }

                return true;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return false;
            }
        },

        // ============================================
        // TIME SLOTS
        // ============================================
        async getTimeSlots(userId) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return ['08:00', '09:30', '11:00', '14:00', '15:30'];

            try {
                const { data, error } = await client
                    .from('time_slots')
                    .select('slots')
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('[DB] ❌ Erro:', error);
                }

                return data?.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return ['08:00', '09:30', '11:00', '14:00', '15:30'];
            }
        },

        async saveTimeSlots(userId, slots) {
            const client = window.supabaseClient || initSupabase();
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

                if (error) {
                    console.error('[DB] ❌ Erro:', error);
                    return false;
                }

                return true;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return false;
            }
        },

        // ============================================
        // NOTIFICATIONS
        // ============================================
        async getNotifications(userId) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('[DB] ❌ Erro:', error);
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
                console.error('[DB] ❌ Erro:', error);
                return [];
            }
        },

        async saveNotifications(userId, notifications) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return false;

            try {
                await client.from('notifications').delete().eq('user_id', userId);

                if (notifications.length === 0) return true;

                const notifToInsert = notifications.map(notif => ({
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

                return true;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return false;
            }
        },

        // ============================================
        // DISCIPLINAS
        // ============================================
        async getDisciplinas(userId) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return [];

            try {
                const { data, error } = await client
                    .from('disciplinas')
                    .select('*')
                    .eq('user_id', userId)
                    .order('nome', { ascending: true });

                if (error) {
                    console.error('[DB] ❌ Erro:', error);
                    return [];
                }

                return data || [];
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return [];
            }
        },

        async saveDisciplinas(userId, disciplinas) {
            const client = window.supabaseClient || initSupabase();
            if (!client) return false;

            try {
                await client.from('disciplinas').delete().eq('user_id', userId);

                if (disciplinas.length === 0) return true;

                const disciplinasToInsert = disciplinas.map(d => ({
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

                return true;
            } catch (error) {
                console.error('[DB] ❌ Erro:', error);
                return false;
            }
        }
    };

    window.DatabaseService = DatabaseService;
    console.log('[Supabase] ✅ DatabaseService criado e exportado');
}

// ============================================
// CRIAR STORAGE SERVICE
// ============================================
function criarStorageService() {
    console.log('[Supabase] 📁 Criando StorageService...');
    
    const StorageService = {
        async uploadProfilePhoto(userId, file) {
            if (!window.DatabaseService) {
                console.error('[Storage] ❌ DatabaseService não disponível');
                return null;
            }
            return await window.DatabaseService.uploadProfilePhoto(userId, file);
        },

        async deleteProfilePhoto(userId) {
            if (!window.DatabaseService) {
                console.error('[Storage] ❌ DatabaseService não disponível');
                return false;
            }
            return await window.DatabaseService.deleteProfilePhoto(userId);
        }
    };

    window.StorageService = StorageService;
    console.log('[Supabase] ✅ StorageService criado e exportado');
}

// ============================================
// 🔥 INICIALIZAR AUTOMATICAMENTE
// ============================================

// Iniciar imediatamente
console.log('[Supabase] 🔥 Iniciando inicialização...');
initSupabase();

// Tentar novamente após 1s
setTimeout(() => {
    if (!window.AuthService) {
        console.log('[Supabase] 🔄 Segunda tentativa...');
        initSupabase();
    }
}, 1000);

// Tentar novamente após 3s
setTimeout(() => {
    if (!window.AuthService) {
        console.log('[Supabase] 🔄 Terceira tentativa...');
        initSupabase();
    }
}, 3000);

// Tentar novamente após 5s
setTimeout(() => {
    if (!window.AuthService) {
        console.log('[Supabase] 🔄 Quarta tentativa...');
        initSupabase();
    }
}, 5000);

// ============================================
// DISPARAR EVENTO DE PRONTO
// ============================================
setTimeout(() => {
    if (window.supabaseClient) {
        window.dispatchEvent(new CustomEvent('supabaseReady'));
        console.log('[Supabase] 📡 Evento supabaseReady disparado');
    }
}, 500);

console.log('[Supabase] ✅ supabase-client.js carregado!');
console.log('[Supabase] 📊 Status:');
console.log('   - AuthService:', !!window.AuthService);
console.log('   - DatabaseService:', !!window.DatabaseService);
console.log('   - StorageService:', !!window.StorageService);
console.log('   - supabaseClient:', !!window.supabaseClient);