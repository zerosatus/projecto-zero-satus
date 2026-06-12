// login/script.js - Login completo com Supabase (VERSÃO CORRIGIDA)
let isRegisterMode = false;
let supabaseClient = null;

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
    
    const usuario = {
        id: user.id,
        email: user.email,
        nome: user.user_metadata?.full_name || user.email.split('@')[0],
        foto: user.user_metadata?.avatar_url || null,
        logado: true
    };
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    
    showMessage(`Bem-vindo, ${usuario.nome}!`);
    
    setTimeout(() => {
        const isMobile = ehCelular();
        window.location.href = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
    }, 500);
}

// ============================================
// SUPABASE AUTH FUNCTIONS
// ============================================

function initSupabase() {
    if (supabaseClient) return supabaseClient;
    
    const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_CnZEwvltWwOT0H2t0-HXqA_WO-zWL2n";
    
    // Verificar se createClient está disponível (Suporte a múltiplos formatos)
    if (typeof createClient !== 'undefined') {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Login] Supabase client criado com createClient');
    } 
    // Verificar se supabase já está disponível globalmente
    else if (typeof supabase !== 'undefined') {
        supabaseClient = supabase;
        console.log('[Login] Supabase client já disponível');
    }
    // Verificar se window.supabase está disponível
    else if (window.supabase) {
        supabaseClient = window.supabase;
        console.log('[Login] Supabase client via window.supabase');
    }
    else {
        console.error('[Login] Nenhum cliente Supabase disponível');
        return null;
    }
    
    return supabaseClient;
}

// Função para carregar o Supabase manualmente se necessário
function loadSupabaseManually() {
    return new Promise((resolve, reject) => {
        // Verificar se já está carregado
        if (typeof createClient !== 'undefined' || typeof supabase !== 'undefined') {
            resolve(true);
            return;
        }
        
        console.log('[Login] Tentando carregar Supabase manualmente...');
        
        // Tentar com CDN principal
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            console.log('[Login] Supabase CDN carregado manualmente!');
            resolve(true);
        };
        script.onerror = () => {
            console.error('[Login] Falha ao carregar CDN principal');
            
            // Tentar com CDN alternativo
            const script2 = document.createElement('script');
            script2.src = 'https://unpkg.com/@supabase/supabase-js@2';
            script2.onload = () => {
                console.log('[Login] Supabase CDN alternativo carregado!');
                resolve(true);
            };
            script2.onerror = () => {
                console.error('[Login] Falha ao carregar todos os CDNs');
                reject(false);
            };
            document.head.appendChild(script2);
        };
        document.head.appendChild(script);
    });
}

async function loginWithGoogle() {
    const supabase = initSupabase();
    if (!supabase) {
        showMessage('Sistema offline. Tente novamente.', true);
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { 
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
    } catch (error) {
        console.error('[Google] Erro:', error);
        showMessage('Erro ao fazer login com Google. Tente novamente.', true);
    }
}

async function loginWithEmail(email, password) {
    const supabase = initSupabase();
    if (!supabase) {
        showMessage('Sistema offline. Tente novamente.', true);
        return false;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email, password 
        });
        if (error) throw error;
        
        if (data.user) {
            await processarLogin(data.user);
            return true;
        }
        return false;
    } catch (error) {
        console.error('[Email] Erro:', error);
        let errorMsg = error.message || 'E-mail ou senha incorretos!';
        if (errorMsg.includes('Invalid login credentials')) errorMsg = 'E-mail ou senha incorretos!';
        showMessage(errorMsg, true);
        return false;
    }
}

async function registerWithEmail(email, password, nome) {
    const supabase = initSupabase();
    if (!supabase) {
        showMessage('Sistema offline. Tente novamente.', true);
        return false;
    }
    
    if (password.length < 6) {
        showMessage('A senha deve ter no mínimo 6 caracteres!', true);
        return false;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email, 
            password,
            options: { 
                data: { 
                    full_name: nome,
                    email: email
                } 
            }
        });
        
        if (error) throw error;
        
        if (data.user) {
            showMessage('Cadastro realizado com sucesso! Faça login.', false);
            
            // Limpar e voltar para login
            document.getElementById('email').value = email;
            document.getElementById('password').value = '';
            if (document.getElementById('nome')) {
                document.getElementById('nome').value = '';
            }
            if (isRegisterMode) {
                toggleForm();
            }
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

async function checkExistingSession() {
    const supabase = initSupabase();
    if (!supabase) return false;
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && !localStorage.getItem('usuarioLogado')) {
            console.log('[Login] Sessão existente encontrada');
            await processarLogin(session.user);
            return true;
        }
        return false;
    } catch (error) {
        console.warn('[Login] Erro ao verificar sessão:', error);
        return false;
    }
}

function toggleForm() {
    isRegisterMode = !isRegisterMode;
    const form = document.getElementById('email-login-form');
    const submitBtn = form?.querySelector('.btn-primary');
    const toggleLink = document.getElementById('show-register');
    const googleBtn = document.getElementById('google-login-btn');
    
    if (isRegisterMode) {
        // MODO CADASTRO
        let nomeGroup = document.getElementById('nome-group');
        if (!nomeGroup) {
            nomeGroup = document.createElement('div');
            nomeGroup.id = 'nome-group';
            nomeGroup.className = 'input-group';
            nomeGroup.innerHTML = '<input type="text" id="nome" placeholder="Seu nome completo" required autocomplete="name">';
            const passwordGroup = document.querySelector('#password')?.closest('.input-group');
            if (passwordGroup && passwordGroup.parentNode) {
                passwordGroup.parentNode.insertBefore(nomeGroup, passwordGroup.nextSibling);
            } else if (form) {
                form.appendChild(nomeGroup);
            }
        }
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> CRIAR CONTA';
            submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        if (toggleLink) toggleLink.innerHTML = 'Já tem conta? Faça login';
        if (googleBtn) googleBtn.style.display = 'flex';
        
        document.querySelector('.logo-section h1').textContent = 'Criar Conta';
        document.querySelector('.subtitle').textContent = 'CADASTRE-SE GRATUITAMENTE';
        
    } else {
        // MODO LOGIN
        const nomeGroup = document.getElementById('nome-group');
        if (nomeGroup) nomeGroup.remove();
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ENTRAR COM EMAIL';
            submitBtn.style.background = 'linear-gradient(135deg, #9333ea, #7c3aed)';
        }
        if (toggleLink) toggleLink.innerHTML = 'Não tem conta? Cadastre-se';
        if (googleBtn) googleBtn.style.display = 'flex';
        
        document.querySelector('.logo-section h1').textContent = 'Painel Zero';
        document.querySelector('.subtitle').textContent = 'PLATAFORMA ACADÊMICA';
    }
    
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    if (document.getElementById('nome')) {
        document.getElementById('nome').value = '';
    }
}

// Aguardar o Supabase CDN carregar com polling mais agressivo
function waitForSupabaseCDN() {
    return new Promise((resolve) => {
        // Verificação rápida
        if (typeof createClient !== 'undefined' || typeof supabase !== 'undefined') {
            console.log('[Login] Supabase já disponível');
            resolve(true);
            return;
        }
        
        console.log('[Login] Aguardando Supabase CDN...');
        
        let tentativas = 0;
        const maxTentativas = 100; // 10 segundos
        const interval = setInterval(() => {
            tentativas++;
            
            // Verificar múltiplas formas
            if (typeof createClient !== 'undefined' || typeof supabase !== 'undefined' || window.supabase) {
                clearInterval(interval);
                console.log('[Login] Supabase CDN detectado após', tentativas, 'tentativas');
                resolve(true);
            } 
            else if (tentativas >= maxTentativas) {
                clearInterval(interval);
                console.error('[Login] Supabase CDN não carregou após', maxTentativas, 'tentativas');
                resolve(false);
            }
        }, 100);
    });
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Login] Inicializando...');
    
    // Tentar carregar Supabase manualmente primeiro
    try {
        await loadSupabaseManually();
    } catch (e) {
        console.warn('[Login] Falha no carregamento manual');
    }
    
    // Aguardar CDN
    const cdnLoaded = await waitForSupabaseCDN();
    if (!cdnLoaded) {
        showMessage('Erro ao carregar sistema. Recarregue a página.', true);
        return;
    }
    
    console.log('[Login] Supabase CDN carregado!');
    
    // Inicializar Supabase
    const supabase = initSupabase();
    if (!supabase) {
        showMessage('Erro ao inicializar conexão. Recarregue.', true);
        return;
    }
    
    console.log('[Login] Supabase inicializado com sucesso!');
    
    // Configurar listener de autenticação
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Login] Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session && !localStorage.getItem('usuarioLogado')) {
            await processarLogin(session.user);
        } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('usuarioLogado');
        }
    });
    
    // Verificar sessão existente
    const hasSession = await checkExistingSession();
    if (hasSession) return;
    
    // Configurar eventos da UI
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
            const email = document.getElementById('email')?.value.trim();
            const password = document.getElementById('password')?.value;
            
            if (!email || !password) {
                showMessage('Preencha e-mail e senha!', true);
                return;
            }
            
            if (isRegisterMode) {
                const nome = document.getElementById('nome')?.value.trim();
                if (!nome) {
                    showMessage('Preencha seu nome completo!', true);
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

// Função de debug
window.debugAuth = function() {
    console.log('===== DEBUG =====');
    console.log('createClient:', typeof createClient);
    console.log('supabaseClient:', !!supabaseClient);
    console.log('usuarioLogado:', localStorage.getItem('usuarioLogado'));
    console.log('isRegisterMode:', isRegisterMode);
    console.log('================');
};

// Função para teste rápido de conexão
window.testSupabase = async function() {
    const supabase = initSupabase();
    if (!supabase) {
        console.error('Supabase não inicializado');
        return;
    }
    const { data, error } = await supabase.auth.getSession();
    console.log('Sessão atual:', data?.session?.user?.email || 'Nenhum');
};