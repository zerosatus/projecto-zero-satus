// login/script.js - Login com Supabase (SIMPLIFICADO)
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
    
    const usuario = {
        id: user.id,
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

async function loginWithGoogle() {
    if (!window.AuthService) {
        showMessage('Sistema offline. Tente novamente.', true);
        return;
    }
    
    try {
        await window.AuthService.loginWithGoogle();
    } catch (error) {
        console.error('[Google] Erro:', error);
        showMessage('Erro ao fazer login com Google. Tente novamente.', true);
    }
}

async function loginWithEmail(email, password) {
    if (!window.AuthService) {
        showMessage('Sistema offline. Tente novamente.', true);
        return false;
    }
    
    try {
        const { user } = await window.AuthService.loginWithEmail(email, password);
        await processarLogin(user);
        return true;
    } catch (error) {
        console.error('[Email] Erro:', error);
        showMessage(error.message || 'E-mail ou senha incorretos!', true);
        return false;
    }
}

async function registerWithEmail(email, password, nome) {
    if (!window.AuthService) {
        showMessage('Sistema offline. Tente novamente.', true);
        return false;
    }
    
    try {
        const { user } = await window.AuthService.registerWithEmail(email, password, nome);
        showMessage('Cadastro realizado! Faça login para continuar.', false);
        toggleForm();
        return true;
    } catch (error) {
        console.error('[Registro] Erro:', error);
        showMessage(error.message, true);
        return false;
    }
}

function toggleForm() {
    isRegisterMode = !isRegisterMode;
    const form = document.getElementById('email-login-form');
    const submitBtn = form?.querySelector('.btn-primary');
    const toggleLink = document.getElementById('show-register');
    
    if (isRegisterMode) {
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
    } else {
        const nomeGroup = document.getElementById('nome-group');
        if (nomeGroup) nomeGroup.remove();
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ENTRAR COM EMAIL';
        if (toggleLink) toggleLink.innerHTML = 'Não tem conta? Cadastre-se';
    }
}

// Aguardar o Supabase carregar
function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.AuthService) {
            resolve();
            return;
        }
        
        window.addEventListener('supabaseReady', () => {
            console.log('[Login] Evento supabaseReady recebido');
            resolve();
        });
        
        // Timeout após 10 segundos
        setTimeout(() => {
            console.warn('[Login] Timeout aguardando Supabase');
            resolve();
        }, 10000);
    });
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Login] Inicializando...');
    
    // Aguardar Supabase carregar
    await waitForSupabase();
    
    if (!window.AuthService) {
        console.error('[Login] AuthService não disponível!');
        showMessage('Erro ao carregar sistema. Recarregue a página.', true);
        return;
    }
    
    console.log('[Login] AuthService disponível!');
    
    // Configurar listener de autenticação
    window.AuthService.onAuthStateChange(async (event, session) => {
        console.log('[Login] Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session && !localStorage.getItem('usuarioLogado')) {
            await processarLogin(session.user);
        } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('usuarioLogado');
            if (window.CacheManager) window.CacheManager.logout();
        }
    });
    
    // Verificar sessão existente
    try {
        const { data: { user } } = await window.AuthService.getCurrentUser();
        if (user && !localStorage.getItem('usuarioLogado')) {
            console.log('[Login] Sessão existente encontrada');
            await processarLogin(user);
            return;
        }
    } catch (e) {
        console.warn('[Login] Erro ao verificar sessão:', e);
    }
    
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