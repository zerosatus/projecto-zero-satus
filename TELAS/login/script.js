// Configurações do Supabase
const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";

// Criar cliente Supabase com nome diferente para evitar conflito
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado
let isRegisterMode = false;

// Mostrar mensagem
function showMessage(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.backgroundColor = isError ? '#dc2626' : '#10b981';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Alternar entre login e cadastro
function toggleMode() {
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

// Login com email
async function doLogin(email, password) {
    const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
}

// Registrar com email
async function doRegister(email, password, nome) {
    const { data, error } = await sbClient.auth.signUp({
        email, password,
        options: { data: { full_name: nome, email } }
    });
    if (error) throw error;
    return data.user;
}

// Processar após login
async function afterLogin(user) {
    const usuario = {
        id: user.id,
        email: user.email,
        nome: user.user_metadata?.full_name || user.email.split('@')[0],
        logado: true
    };
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    showMessage(`Bem-vindo, ${usuario.nome}!`);
    setTimeout(() => {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;
        window.location.href = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
    }, 500);
}

// Submit do formulário
async function handleSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submit-btn');
    
    if (!email || !password) {
        showMessage('Preencha e-mail e senha!', true);
        return;
    }
    
    submitBtn.disabled = true;
    const originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AGUARDE...';
    
    try {
        if (isRegisterMode) {
            const nome = document.getElementById('nome').value.trim();
            if (!nome) throw new Error('Preencha seu nome completo');
            if (password.length < 6) throw new Error('Senha deve ter no mínimo 6 caracteres');
            
            await doRegister(email, password, nome);
            showMessage('✅ Cadastro realizado! Faça login.');
            toggleMode();
        } else {
            const user = await doLogin(email, password);
            await afterLogin(user);
        }
    } catch (err) {
        let msg = err.message;
        if (msg.includes('Invalid login credentials')) msg = 'E-mail ou senha incorretos!';
        if (msg.includes('User already registered')) msg = 'E-mail já cadastrado! Faça login.';
        showMessage(msg, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
    }
}

// Login com Google
async function googleLogin() {
    try {
        await sbClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
    } catch (err) {
        showMessage('Erro ao conectar com Google', true);
    }
}

// Verificar sessão existente
async function checkSession() {
    try {
        const { data: { session } } = await sbClient.auth.getSession();
        if (session?.user && !localStorage.getItem('usuarioLogado')) {
            await afterLogin(session.user);
            return true;
        }
        return false;
    } catch (err) {
        return false;
    }
}

// Inicializar
async function init() {
    console.log('🚀 Inicializando sistema de login...');
    
    // Verificar sessão
    const hasSession = await checkSession();
    if (hasSession) return;
    
    // Configurar eventos
    const toggleLink = document.getElementById('toggle-mode-link');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMode();
        });
    }
    
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', handleSubmit);
    }
    
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            googleLogin();
        });
    }
    
    // Listener de autenticação
    sbClient.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);
        if (event === 'SIGNED_IN' && session?.user && !localStorage.getItem('usuarioLogado')) {
            await afterLogin(session.user);
        }
    });
    
    console.log('✅ Login inicializado com sucesso!');
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}