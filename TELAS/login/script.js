// login/script.js - Login com Supabase (CORRIGIDO)

const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";

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

async function processarLogin(user) {
    console.log('[Login] Processando login para:', user.email);
    console.log('[Login] User ID (UUID):', user.id);
    
    const usuario = {
        id: user.id,           // ✅ UUID do Supabase
        email: user.email,
        nome: user.user_metadata?.full_name || user.email.split('@')[0],
        foto: user.user_metadata?.avatar_url || null,
        logado: true
    };
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuario.id;
        try {
            await window.CacheManager.loadFromCloud();
        } catch (e) {
            console.warn('[Login] Erro ao carregar da nuvem:', e);
        }
    }
    
    showMessage(`Bem-vindo, ${usuario.nome}!`);
    
    setTimeout(() => {
        const isMobile = ehCelular();
        window.location.href = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
    }, 500);
}

async function loginWithEmail(email, password) {
    if (!supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        await processarLogin(data.user);
        return true;
    } catch (error) {
        console.error('[Email] Erro:', error);
        showMessage(error.message || 'E-mail ou senha incorretos!', true);
        return false;
    }
}

async function registerWithEmail(email, password, nome) {
    if (!supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: nome } }
        });
        if (error) throw error;
        
        showMessage('Cadastro realizado! Faça login para continuar.', false);
        toggleForm();
        return true;
    } catch (error) {
        console.error('[Registro] Erro:', error);
        showMessage(error.message, true);
        return false;
    }
}

async function loginWithGoogle() {
    if (!supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    
    try {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
    } catch (error) {
        console.error('[Google] Erro:', error);
        showMessage('Erro ao fazer login com Google. Tente novamente.', true);
    }
}

function toggleForm() {
    isRegisterMode = !isRegisterMode;
    const nomeField = document.getElementById('nome-field');
    const submitBtn = document.getElementById('submit-btn');
    const toggleLink = document.getElementById('toggle-mode-link');
    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');
    
    if (isRegisterMode) {
        nomeField.style.display = 'block';
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> CRIAR CONTA';
        submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        toggleLink.innerHTML = 'Já tem conta? Faça login';
        mainTitle.textContent = 'Criar Conta';
        mainSubtitle.textContent = 'CADASTRE-SE GRATUITAMENTE';
        document.getElementById('password').placeholder = 'Senha (min 6 caracteres)';
    } else {
        nomeField.style.display = 'none';
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ENTRAR COM EMAIL';
        submitBtn.style.background = 'linear-gradient(135deg, #9333ea, #7c3aed)';
        toggleLink.innerHTML = 'Não tem conta? Cadastre-se';
        mainTitle.textContent = 'Painel Zero';
        mainSubtitle.textContent = 'PLATAFORMA ACADÊMICA';
        document.getElementById('password').placeholder = 'Sua senha';
    }
    
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    const nomeInput = document.getElementById('nome');
    if (nomeInput) nomeInput.value = '';
}

async function checkSession() {
    if (!supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !localStorage.getItem('usuarioLogado')) {
            await processarLogin(session.user);
            return true;
        }
        return false;
    } catch (err) {
        console.warn('[Login] Erro ao verificar sessão:', err);
        return false;
    }
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Login] Inicializando...');
    
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const hasSession = await checkSession();
    if (hasSession) return;
    
    // Configurar eventos
    const toggleLink = document.getElementById('toggle-mode-link');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForm();
        });
    }
    
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value.trim();
            const password = document.getElementById('password')?.value;
            const submitBtn = document.getElementById('submit-btn');
            
            if (!email || !password) {
                showMessage('Preencha e-mail e senha!', true);
                return;
            }
            
            setLoading(submitBtn, true);
            
            if (isRegisterMode) {
                const nome = document.getElementById('nome')?.value.trim();
                if (!nome) {
                    showMessage('Preencha seu nome!', true);
                    setLoading(submitBtn, false);
                    return;
                }
                if (password.length < 6) {
                    showMessage('Senha deve ter no mínimo 6 caracteres!', true);
                    setLoading(submitBtn, false);
                    return;
                }
                await registerWithEmail(email, password, nome);
            } else {
                await loginWithEmail(email, password);
            }
            
            setLoading(submitBtn, false);
        });
    }
    
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginWithGoogle();
        });
    }
    
    // Listener de autenticação
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Login] Auth event:', event);
        if (event === 'SIGNED_IN' && session?.user && !localStorage.getItem('usuarioLogado')) {
            await processarLogin(session.user);
        }
    });
    
    console.log('[Login] ✅ Login inicializado com sucesso!');
});