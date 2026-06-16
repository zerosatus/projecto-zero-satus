// login/script.js - Login com Supabase (CORRIGIDO)

let isRegisterMode = false;
let isGoogleRedirect = false;

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

    // Redirecionar após 1 segundo
    setTimeout(() => {
        const isMobile = ehCelular();
        const destino = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
        console.log('[Login] Redirecionando para:', destino);
        window.location.href = destino;
    }, 1000);
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
        showMessage(error.message || 'Erro ao cadastrar. Tente novamente.', true);
        return false;
    }
}

async function loginWithGoogle() {
    console.log('[Google] Iniciando login com Google...');

    if (!window.AuthService) {
        showMessage('Sistema offline. Tente novamente.', true);
        return;
    }

    try {
        // Desabilitar botão
        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REDIRECIONANDO...';
        }

        // IMPORTANTE: Configurar a URL de callback correta
        const currentUrl = window.location.origin + window.location.pathname;
        console.log('[Google] URL atual:', currentUrl);

        // Redirecionar para o Google
        await window.AuthService.loginWithGoogle();

        // O código abaixo só executa se o redirecionamento falhar
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> ENTRAR COM GOOGLE';
        }

    } catch (error) {
        console.error('[Google] Erro detalhado:', error);
        showMessage('Erro ao fazer login com Google: ' + error.message, true);

        // Reativar botão
        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> ENTRAR COM GOOGLE';
        }
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
        if (nomeField) nomeField.style.display = 'block';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> CRIAR CONTA';
            submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        if (toggleLink) toggleLink.innerHTML = 'Já tem conta? Faça login';
        if (mainTitle) mainTitle.textContent = 'Criar Conta';
        if (mainSubtitle) mainSubtitle.textContent = 'CADASTRE-SE GRATUITAMENTE';
        const passwordInput = document.getElementById('password');
        if (passwordInput) passwordInput.placeholder = 'Senha (min 6 caracteres)';
    } else {
        if (nomeField) nomeField.style.display = 'none';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ENTRAR COM EMAIL';
            submitBtn.style.background = 'linear-gradient(135deg, #9333ea, #7c3aed)';
        }
        if (toggleLink) toggleLink.innerHTML = 'Não tem conta? Cadastre-se';
        if (mainTitle) mainTitle.textContent = 'Painel Zero';
        if (mainSubtitle) mainSubtitle.textContent = 'PLATAFORMA ACADÊMICA';
        const passwordInput = document.getElementById('password');
        if (passwordInput) passwordInput.placeholder = 'Sua senha';
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nomeInput = document.getElementById('nome');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (nomeInput) nomeInput.value = '';
}

// Função para processar o retorno do Google (callback)
async function handleGoogleCallback() {
    console.log('[Google] Verificando callback...');

    if (!window.AuthService) {
        console.warn('[Google] AuthService não disponível');
        return false;
    }

    try {
        // Verificar se há uma sessão ativa
        const { data: { user } } = await window.AuthService.getCurrentUser();

        if (user) {
            console.log('[Google] Usuário autenticado via callback:', user.email);

            // Verificar se já processou este usuário
            if (!localStorage.getItem('usuarioLogado')) {
                await processarLogin(user);
            } else {
                // Já está logado, redirecionar
                const isMobile = ehCelular();
                const destino = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
                window.location.href = destino;
            }
            return true;
        }

        console.log('[Google] Nenhum usuário na sessão');
        return false;

    } catch (error) {
        console.error('[Google] Erro no callback:', error);
        return false;
    }
}

// Função para verificar se é um callback do Google
function isGoogleCallback() {
    // Verificar parâmetros na URL
    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');
    const hash = window.location.hash;
    const hasAccessToken = hash.includes('access_token');
    const hasError = params.has('error') || hash.includes('error');

    console.log('[Google] Parâmetros URL:', {
        hasCode,
        hasAccessToken,
        hasError,
        search: window.location.search,
        hash: window.location.hash
    });

    // Se tiver erro, mostrar mensagem
    if (hasError) {
        const errorMsg = params.get('error_description') || params.get('error') || 'Erro no login';
        showMessage('Erro no login com Google: ' + errorMsg, true);
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    return hasCode || hasAccessToken;
}

async function checkSession() {
    if (!window.AuthService) return false;

    try {
        const { data: { user } } = await window.AuthService.getCurrentUser();
        if (user && !localStorage.getItem('usuarioLogado')) {
            await processarLogin(user);
            return true;
        }
        return false;
    } catch (err) {
        console.warn('[Login] Erro ao verificar sessão:', err);
        return false;
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

        // Timeout de segurança
        setTimeout(() => {
            console.warn('[Login] Timeout aguardando Supabase');
            resolve();
        }, 10000);
    });
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Login] Inicializando...');
    console.log('[Login] URL atual:', window.location.href);

    // === PRIMEIRO: VERIFICAR CALLBACK DO GOOGLE ===
    // O login com Google redireciona de volta com tokens na URL
    const isCallback = isGoogleCallback();
    if (isCallback) {
        console.log('[Google] Detectado callback do Google!');
        // Aguardar Supabase carregar para processar
        await waitForSupabase();
        if (window.AuthService) {
            const processed = await handleGoogleCallback();
            if (processed) {
                return; // Já processou, não continua
            }
        }
    }

    // Aguardar Supabase carregar
    await waitForSupabase();

    if (!window.AuthService) {
        console.error('[Login] AuthService não disponível!');
        showMessage('Erro ao carregar sistema. Recarregue a página.', true);
        return;
    }

    console.log('[Login] AuthService disponível!');

    // Configurar listener de autenticação (para mudanças de estado)
    window.AuthService.onAuthStateChange(async (event, session) => {
        console.log('[Login] Auth state change:', event);

        if (event === 'SIGNED_IN' && session?.user && !localStorage.getItem('usuarioLogado')) {
            console.log('[Login] Usuário logou, processando...');
            await processarLogin(session.user);
        } else if (event === 'SIGNED_OUT') {
            console.log('[Login] Usuário deslogou');
            localStorage.removeItem('usuarioLogado');
            if (window.CacheManager) window.CacheManager.logout();
        } else if (event === 'TOKEN_REFRESHED') {
            console.log('[Login] Token atualizado');
        }
    });

    // Verificar sessão existente (se já estiver logado)
    const hasSession = await checkSession();
    if (hasSession) {
        console.log('[Login] Sessão ativa encontrada');
        return;
    }

    // Se não tiver sessão, mas for callback do Google que não processou
    if (isCallback) {
        console.log('[Google] Tentando processar callback novamente...');
        const processed = await handleGoogleCallback();
        if (processed) return;
    }

    // Configurar eventos da UI
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[UI] Botão Google clicado');
            loginWithGoogle();
        });
    }

    const emailForm = document.getElementById('auth-form');
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value.trim();
            const password = document.getElementById('password')?.value;
            const submitBtn = emailForm.querySelector('.btn-primary');

            if (!email || !password) {
                showMessage('Preencha e-mail e senha!', true);
                return;
            }

            if (isRegisterMode) {
                const nome = document.getElementById('nome')?.value.trim();
                if (!nome) {
                    showMessage('Preencha seu nome!', true);
                    return;
                }
                if (password.length < 6) {
                    showMessage('Senha deve ter no mínimo 6 caracteres!', true);
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
        });
    }

    const toggleLink = document.getElementById('toggle-mode-link');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForm();
        });
    }

    // Limpar parâmetros da URL após processar
    if (isCallback) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    console.log('%c🔐 Painel Zero - Login com Supabase', 'color: #9333ea; font-size: 16px; font-weight: bold;');
});