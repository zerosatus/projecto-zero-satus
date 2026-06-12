// login/script.js - VERSÃO SUPABASE COMPLETA (CORRIGIDA)

// ✅ Usar let ao invés de const para evitar dupla declaração
let supabase = null;
let isRegisterMode = false;

function ehCelular() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth <= 768;
}

function showMessage(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc2626' : '#10b981';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function setLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AGUARDE...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalHtml;
        button.disabled = false;
    }
}

async function criarDadosPadrao(usuario) {
    console.log('[Login] Criando dados padrão para:', usuario.email);
    const userId = usuario.id;
    
    const dadosPadrao = {
        tasks: [],
        notes: [],
        calendarEvents: [],
        weeklySchedule: { 'Seg': [], 'Ter': [], 'Qua': [], 'Qui': [], 'Sex': [] },
        timeSlots: ['08:00', '09:30', '11:00', '14:00', '15:30'],
        notifications: [],
        notificacoesSettings: { push: true, email: false, aulas: true, tarefas: true },
        appearanceSettings: { theme: 'dark', accent: '#8b5cf6', fontSize: 14 }
    };
    
    for (const [key, value] of Object.entries(dadosPadrao)) {
        localStorage.setItem(`${userId}_${key}`, JSON.stringify(value));
        if (window.CacheManager) {
            window.CacheManager.set(key, value, true);
        }
        sessionStorage.setItem(`preload_${key}`, JSON.stringify(value));
    }
    
    // Salvar perfil do usuário no Supabase
    if (supabase) {
        try {
            const { error } = await supabase.from('profiles').upsert({
                id: userId,
                email: usuario.email,
                nome: usuario.user_metadata?.full_name || usuario.email.split('@')[0],
                avatar_url: usuario.user_metadata?.avatar_url || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            if (error) console.error('[Login] Erro ao salvar perfil:', error);
        } catch(e) {
            console.error('[Login] Erro ao salvar perfil:', e);
        }
    }
}

async function processarLogin(user, isNewUser) {
    console.log('[Login] Processando login para:', user.email);
    
    const usuario = {
        id: user.id,
        uid: user.id,
        email: user.email,
        nome: user.user_metadata?.full_name || user.email.split('@')[0],
        foto: user.user_metadata?.avatar_url || null,
        logado: true,
        supabaseToken: user.access_token
    };
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    sessionStorage.setItem('supabaseToken', user.access_token);
    
    // INICIALIZAR CACHE MANAGER
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuario.id;
        window.CacheManager.currentUserEmail = usuario.email;
        
        // Aguardar carregar dados da nuvem
        await window.CacheManager.loadFromCloud(true);
        
        if (window.CacheManager.startRealtimeSync) {
            window.CacheManager.startRealtimeSync();
        }
        
        if (isNewUser) {
            await criarDadosPadrao(usuario);
        }
    }
    
    showMessage(`Bem-vindo, ${usuario.nome}!`);
    
    setTimeout(() => {
        const isMobile = ehCelular();
        window.location.href = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
    }, 500);
}

// ============================================
// INICIALIZAR SUPABASE
// ============================================
async function initSupabase() {
    // ✅ Verificar se já existe e usar o existente
    if (window.supabaseClient) {
        supabase = window.supabaseClient;
        console.log('[Login] Supabase já inicializado');
    } 
    // ✅ Aguardar o CDN carregar
    else if (typeof createClient !== 'undefined') {
        const config = window.supabaseConfig || {
            url: "https://yqxtfnnjjpoitbmtcxjd.supabase.co",
            anonKey: "sb_publishable_CnZEwvltWwOT0H2t0-HXqA_WO-zWL2n"
        };
        supabase = createClient(config.url, config.anonKey);
        window.supabaseClient = supabase;
        console.log('[Login] Supabase inicializado pelo login');
    }
    // ✅ Aguardar um pouco e tentar novamente
    else {
        console.log('[Login] Aguardando Supabase CDN...');
        await new Promise(r => setTimeout(r, 500));
        return initSupabase();
    }
    
    if (supabase) {
        // Verificar sessão existente
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !localStorage.getItem('usuarioLogado')) {
            console.log('[Login] Sessão existente encontrada');
            await processarLogin(session.user, false);
        }
        
        // Monitorar mudanças de autenticação
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Login] Auth state change:', event);
            
            if (event === 'SIGNED_IN' && session && !localStorage.getItem('usuarioLogado')) {
                await processarLogin(session.user, false);
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem('usuarioLogado');
                if (window.CacheManager) window.CacheManager.logout();
            }
        });
        
        return true;
    }
    return false;
}

// ============================================
// LOGIN COM GOOGLE
// ============================================
async function loginWithGoogle() {
    if (!supabase) {
        showMessage('Sistema offline. Tente novamente.', true);
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/login/index.html',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        if (error) throw error;
        
    } catch (error) {
        console.error('[Google] Erro:', error);
        showMessage('Erro ao fazer login com Google. Tente novamente.', true);
    }
}

// ============================================
// LOGIN COM EMAIL/SENHA
// ============================================
async function loginWithEmail(email, password) {
    if (!supabase) {
        showMessage('Sistema offline. Tente novamente.', true);
        return false;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        await processarLogin(data.user, false);
        return true;
        
    } catch (error) {
        console.error('[Email] Erro:', error);
        if (error.message === 'Invalid login credentials') {
            showMessage('E-mail ou senha incorretos!', true);
        } else {
            showMessage(error.message, true);
        }
        return false;
    }
}

// ============================================
// REGISTRO COM EMAIL/SENHA
// ============================================
async function registerWithEmail(email, password, nome) {
    if (!supabase) {
        showMessage('Sistema offline. Tente novamente.', true);
        return false;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: nome,
                    email: email
                }
            }
        });
        
        if (error) throw error;
        
        if (data.user) {
            showMessage('Cadastro realizado! Faça login para continuar.', false);
            toggleForm();
            return true;
        }
        
    } catch (error) {
        console.error('[Registro] Erro:', error);
        showMessage(error.message, true);
        return false;
    }
}

// ============================================
// ALTERNAR ENTRE LOGIN E REGISTRO
// ============================================
function toggleForm() {
    isRegisterMode = !isRegisterMode;
    const form = document.getElementById('email-login-form');
    const submitBtn = form?.querySelector('.btn-primary');
    const toggleLink = document.getElementById('show-register');
    const divider = document.querySelector('.divider');
    
    if (isRegisterMode) {
        // Adicionar campo de nome se não existir
        let nomeGroup = document.getElementById('nome-group');
        if (!nomeGroup) {
            nomeGroup = document.createElement('div');
            nomeGroup.id = 'nome-group';
            nomeGroup.className = 'input-group';
            nomeGroup.innerHTML = '<input type="text" id="nome" placeholder="Seu nome completo" required>';
            if (form) form.insertBefore(nomeGroup, form.firstChild);
        }
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> CRIAR CONTA';
        if (toggleLink) toggleLink.innerHTML = 'Já tem conta? Faça login';
        if (divider) divider.style.display = 'flex';
    } else {
        const nomeGroup = document.getElementById('nome-group');
        if (nomeGroup) nomeGroup.remove();
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ENTRAR COM EMAIL';
        if (toggleLink) toggleLink.innerHTML = 'Não tem conta? Cadastre-se';
        if (divider) divider.style.display = 'flex';
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Login] Inicializando...');
    
    if (window.CacheManager) window.CacheManager.init();
    
    await initSupabase();
    
    // Verificar se já está logado
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    const isLoginPage = window.location.pathname.includes('/login/');
    
    if (usuarioSalvo && !isLoginPage) {
        const isMobile = ehCelular();
        window.location.href = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
        return;
    }
    
    // Configurar eventos
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginWithGoogle();
        });
    }
    
    const emailForm = document.getElementById('email-login-form');
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            
            if (!email || !password) {
                showMessage('Preencha e-mail e senha!', true);
                return;
            }
            
            if (isRegisterMode) {
                const nome = document.getElementById('nome')?.value;
                if (!nome) {
                    showMessage('Preencha seu nome!', true);
                    return;
                }
                setLoading(emailForm.querySelector('.btn-primary'), true);
                await registerWithEmail(email, password, nome);
                setLoading(emailForm.querySelector('.btn-primary'), false);
            } else {
                setLoading(emailForm.querySelector('.btn-primary'), true);
                await loginWithEmail(email, password);
                setLoading(emailForm.querySelector('.btn-primary'), false);
            }
        });
    }
    
    const toggleLink = document.getElementById('show-register');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForm();
        });
    }
    
    console.log('%c🔐 Painel Zero - Login com Supabase', 'color: #9333ea; font-size: 16px; font-weight: bold;');
});

// ✅ Exportar funções para debug (opcional)
window.debugSupabase = () => {
    console.log('Supabase client:', supabase);
    console.log('Usuário logado:', localStorage.getItem('usuarioLogado'));
    supabase?.auth.getSession().then(console.log);
};