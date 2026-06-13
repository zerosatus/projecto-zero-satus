// Configurações do Supabase
const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";

// Inicializar Supabase
let supabase = null;

// Estado da UI
let isRegisterMode = false;

// Elementos DOM
let nomeField, nomeInput, emailInput, passwordInput, submitBtn, toggleLink, mainTitle, mainSubtitle, googleBtn, toastEl;

// Função para mostrar mensagem
function showMessage(message, isError = false) {
    console.log('[Message]', message);
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.style.backgroundColor = isError ? '#dc2626' : '#10b981';
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 4000);
}

// Função de loading
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

// Detectar mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

// Processar login do usuário
async function processUserLogin(user) {
    console.log('[Auth] Processando login para:', user.email);
    
    let nomeUsuario = user.user_metadata?.full_name || user.user_metadata?.name || '';
    if (!nomeUsuario && user.email) {
        nomeUsuario = user.email.split('@')[0];
    }
    
    const usuario = {
        id: user.id,
        email: user.email,
        nome: nomeUsuario,
        foto: user.user_metadata?.avatar_url || null,
        logado: true
    };
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    showMessage(`Bem-vindo, ${usuario.nome}! Redirecionando...`);
    
    setTimeout(() => {
        const mobile = isMobileDevice();
        const redirectPath = mobile ? '../mobile-telas/index.html' : '../inicio/index.html';
        console.log('[Redirect] Indo para:', redirectPath);
        window.location.href = redirectPath;
    }, 800);
}

// LOGIN COM EMAIL/SENHA
async function loginWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (data.user) {
            await processUserLogin(data.user);
            return true;
        }
        return false;
    } catch (error) {
        console.error('[Login] Erro:', error);
        let errorMsg = error.message || 'E-mail ou senha incorretos!';
        if (errorMsg.includes('Invalid login credentials')) errorMsg = 'E-mail ou senha incorretos!';
        showMessage(errorMsg, true);
        return false;
    }
}

// REGISTRO com EMAIL/SENHA + NOME
async function registerWithEmail(email, password, fullName) {
    if (password.length < 6) {
        showMessage('A senha deve ter no mínimo 6 caracteres!', true);
        return false;
    }
    
    if (!fullName || fullName.trim().length < 3) {
        showMessage('Por favor, insira seu nome completo (mínimo 3 letras)', true);
        return false;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName.trim(),
                    email: email
                }
            }
        });
        
        if (error) throw error;
        
        if (data.user) {
            showMessage('✅ Cadastro realizado com sucesso! Agora faça seu login.', false);
            // Voltar para modo login
            if (isRegisterMode) {
                toggleFormMode();
            }
            emailInput.value = email;
            passwordInput.value = '';
            if (nomeInput) nomeInput.value = '';
            return true;
        }
        return false;
    } catch (error) {
        console.error('[Registro] Erro:', error);
        let errorMsg = error.message;
        if (errorMsg.includes('User already registered')) {
            errorMsg = 'Este e-mail já está cadastrado! Faça login.';
        } else if (errorMsg.includes('Password should be at least 6 characters')) {
            errorMsg = 'A senha deve ter no mínimo 6 caracteres!';
        }
        showMessage(errorMsg, true);
        return false;
    }
}

// LOGIN COM GOOGLE
async function loginWithGoogle() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
    } catch (error) {
        console.error('[Google] Erro:', error);
        showMessage('Erro ao iniciar login com Google. Tente novamente.', true);
    }
}

// Alternar entre modo login e cadastro
function toggleFormMode() {
    console.log('[Toggle] Alternando modo. Atual:', isRegisterMode ? 'cadastro' : 'login');
    isRegisterMode = !isRegisterMode;
    
    if (isRegisterMode) {
        // Modo CADASTRO
        nomeField.style.display = 'block';
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> CRIAR CONTA';
        submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        toggleLink.innerHTML = 'Já tem conta? Faça login';
        mainTitle.textContent = 'Criar Conta';
        mainSubtitle.textContent = 'CADASTRE-SE GRATUITAMENTE';
        emailInput.placeholder = 'seu@email.com';
        passwordInput.placeholder = 'Senha (min 6 caracteres)';
        console.log('[Toggle] Modo alterado para: CADASTRO');
    } else {
        // Modo LOGIN
        nomeField.style.display = 'none';
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ENTRAR COM EMAIL';
        submitBtn.style.background = 'linear-gradient(135deg, #9333ea, #7c3aed)';
        toggleLink.innerHTML = 'Não tem conta? Cadastre-se';
        mainTitle.textContent = 'Painel Zero';
        mainSubtitle.textContent = 'PLATAFORMA ACADÊMICA';
        emailInput.placeholder = 'seu@email.com';
        passwordInput.placeholder = 'Sua senha';
        console.log('[Toggle] Modo alterado para: LOGIN');
    }
    
    // Limpar campos
    emailInput.value = '';
    passwordInput.value = '';
    if (nomeInput) nomeInput.value = '';
}

// Verificar sessão existente
async function checkExistingSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && !localStorage.getItem('usuarioLogado')) {
            console.log('[Auth] Sessão existente encontrada, redirecionando...');
            await processUserLogin(session.user);
            return true;
        }
        return false;
    } catch (error) {
        console.warn('[Auth] Erro ao verificar sessão:', error);
        return false;
    }
}

// Listener de mudança de estado de autenticação
function setupAuthStateListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] Evento:', event);
        if (event === 'SIGNED_IN' && session && session.user) {
            if (!localStorage.getItem('usuarioLogado')) {
                await processUserLogin(session.user);
            }
        } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('usuarioLogado');
        }
    });
}

// Evento de submit do formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('[Form] Submit detectado. Modo:', isRegisterMode ? 'cadastro' : 'login');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Preencha e-mail e senha!', true);
        return;
    }
    
    if (isRegisterMode) {
        const nome = nomeInput ? nomeInput.value.trim() : '';
        if (!nome) {
            showMessage('Preencha seu nome completo!', true);
            return;
        }
        setLoading(submitBtn, true);
        await registerWithEmail(email, password, nome);
        setLoading(submitBtn, false);
    } else {
        setLoading(submitBtn, true);
        await loginWithEmail(email, password);
        setLoading(submitBtn, false);
    }
}

// Inicialização
async function init() {
    console.log('[Init] Iniciando aplicação...');
    
    // Inicializar Supabase diretamente
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Init] Supabase inicializado!');
    } else {
        console.error('[Init] Supabase não disponível');
        showMessage('Erro ao carregar sistema. Recarregue a página.', true);
        return;
    }
    
    // Obter elementos DOM
    nomeField = document.getElementById('nome-field');
    nomeInput = document.getElementById('nome');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    submitBtn = document.getElementById('submit-btn');
    toggleLink = document.getElementById('toggle-mode-link');
    mainTitle = document.getElementById('main-title');
    mainSubtitle = document.getElementById('main-subtitle');
    googleBtn = document.getElementById('google-login-btn');
    toastEl = document.getElementById('toast');
    
    // Configurar listener de auth
    setupAuthStateListener();
    
    // Verificar sessão existente
    const hasSession = await checkExistingSession();
    if (hasSession) return;
    
    // Configurar eventos
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginWithGoogle();
        });
        console.log('[Init] Evento do Google configurado');
    }
    
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', handleFormSubmit);
        console.log('[Init] Evento do formulário configurado');
    }
    
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[Toggle] Link clicado!');
            toggleFormMode();
        });
        console.log('[Init] Evento do toggle configurado');
    }
    
    console.log('%c🔐 Painel Zero - Login/Cadastro com Supabase', 'color: #9333ea; font-size: 16px; font-weight: bold;');
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}