// login/script.js - Login com Supabase (CORRIGIDO - SEM AUTO-LOGIN)

let isRegisterMode = false;
let pendingEmail = '';
let authListenerUnsubscribe = null;
let isProcessingAuth = false;

function ehCelular() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth <= 768;
}

function showMessage(message, isError = false, duration = 4000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc2626' : '#10b981';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
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

function limparCamposFormulario() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nomeInput = document.getElementById('nome');

    if (emailInput) {
        emailInput.value = '';
        emailInput.setAttribute('autocomplete', 'off');
        emailInput.setAttribute('data-lpignore', 'true');
        emailInput.setAttribute('data-1p-ignore', 'true');
    }

    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.setAttribute('autocomplete', 'new-password');
        passwordInput.setAttribute('data-lpignore', 'true');
        passwordInput.setAttribute('data-1p-ignore', 'true');
    }

    if (nomeInput) {
        nomeInput.value = '';
        nomeInput.setAttribute('autocomplete', 'off');
        nomeInput.setAttribute('data-lpignore', 'true');
        nomeInput.setAttribute('data-1p-ignore', 'true');
    }

    console.log('[Login] Campos do formulário limpos');
}

// ============================================
// PROCESSAR LOGIN
// ============================================
async function processarLogin(user) {
    if (isProcessingAuth) {
        console.log('[Login] Já processando autenticação...');
        return false;
    }

    console.log('[Login] Processando login para:', user.email);

    if (!user.email_confirmed_at) {
        console.warn('[Login] E-mail não confirmado!');
        showMessage('📧 Por favor, confirme seu e-mail antes de fazer login.', true);
        return false;
    }

    isProcessingAuth = true;

    try {
        // Garantir que o perfil existe
        if (window.AuthService) {
            await window.AuthService.ensureProfileExists(user);
        }

        // Buscar perfil para obter nome correto
        let nome = user.user_metadata?.full_name || user.email.split('@')[0];
        let foto = user.user_metadata?.avatar_url || null;

        if (window.DatabaseService) {
            try {
                const profile = await window.DatabaseService.getUserProfile(user.id);
                if (profile) {
                    nome = profile.nome || nome;
                    foto = profile.avatar_url || foto;
                    console.log('[Login] Perfil encontrado:', nome);
                }
            } catch(e) {
                console.warn('[Login] Erro ao buscar perfil:', e);
            }
        }

        const usuario = {
            id: user.id,
            email: user.email,
            nome: nome,
            foto: foto,
            avatar_url: foto,
            logado: true,
            email_confirmado: true
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

        showMessage(`✅ Bem-vindo, ${usuario.nome}!`, false);

        setTimeout(() => {
            const isMobile = ehCelular();
            const destino = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
            console.log('[Login] Redirecionando para:', destino);
            window.location.href = destino;
        }, 1000);

        return true;
    } catch (error) {
        console.error('[Login] Erro ao processar login:', error);
        return false;
    } finally {
        setTimeout(() => {
            isProcessingAuth = false;
        }, 2000);
    }
}

// ============================================
// LOGIN COM EMAIL
// ============================================
async function loginWithEmail(email, password) {
    if (!window.AuthService) {
        showMessage('Sistema offline. Tente novamente.', true);
        return false;
    }

    try {
        console.log('[Login] Tentando login com email:', email);
        const { user } = await window.AuthService.loginWithEmail(email, password);

        if (!user.email_confirmed_at) {
            showMessage('📧 E-mail não confirmado! Verifique sua caixa de entrada.', true);
            showResendButton(email);
            return false;
        }

        await processarLogin(user);
        return true;
    } catch (error) {
        console.error('[Email] Erro:', error);

        if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
            showMessage('📧 Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.', true);
            showResendButton(email);
        } else if (error.message.includes('Invalid login credentials')) {
            showMessage('❌ E-mail ou senha incorretos!', true);
        } else {
            showMessage(error.message || '❌ E-mail ou senha incorretos!', true);
        }
        return false;
    }
}

// ============================================
// REGISTRO
// ============================================
async function registerWithEmail(email, password, nome) {
    if (!window.AuthService) {
        showMessage('Sistema offline. Tente novamente.', true);
        return false;
    }

    try {
        pendingEmail = email;

        const result = await window.AuthService.registerWithEmail(email, password, nome);

        if (result.user && !result.user.email_confirmed_at) {
            showMessage(
                '📧 E-mail de confirmação enviado! Verifique sua caixa de entrada (inclusive spam) e clique no link para ativar sua conta.',
                false,
                6000
            );
            showResendButton(email);

            // Limpar estado
            await window.AuthService.logout();
            localStorage.removeItem('usuarioLogado');
            limparCamposFormulario();

            if (isRegisterMode) toggleForm();
            return true;
        }

        showMessage('✅ Cadastro realizado com sucesso! Faça login para continuar.', false);
        if (isRegisterMode) toggleForm();
        return true;

    } catch (error) {
        console.error('[Registro] Erro:', error);

        if (error.message.includes('User already registered')) {
            showMessage('⚠️ Este e-mail já está cadastrado. Faça login ou recupere sua senha.', true);
        } else {
            showMessage(error.message || '❌ Erro ao cadastrar. Tente novamente.', true);
        }
        return false;
    }
}

// ============================================
// REENVIAR CONFIRMAÇÃO
// ============================================
async function resendConfirmationEmail(email) {
    if (!window.AuthService) {
        showMessage('Sistema offline. Tente novamente.', true);
        return;
    }

    try {
        await window.AuthService.resendConfirmationEmail(email);
        showMessage('📧 Novo e-mail de confirmação enviado! Verifique sua caixa de entrada.', false, 5000);
    } catch (error) {
        console.error('[Resend] Erro:', error);
        showMessage('❌ Erro ao reenviar: ' + error.message, true);
    }
}

function showResendButton(email) {
    const existingBtn = document.getElementById('resend-container');
    if (existingBtn) existingBtn.remove();

    const container = document.querySelector('.register-link');
    if (!container) return;

    const div = document.createElement('div');
    div.id = 'resend-container';
    div.style.cssText = 'margin-top: 15px; text-align: center; padding: 10px; background: rgba(147, 51, 234, 0.1); border-radius: 8px;';
    div.innerHTML = `
        <p style="color: #aaa; font-size: 12px; margin-bottom: 8px;">
            <i class="fas fa-envelope" style="color: #9333ea;"></i>
            Não recebeu o e-mail?
        </p>
        <button id="resend-email-btn" style="
            background: linear-gradient(135deg, #9333ea, #7c3aed);
            border: none;
            color: white;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            padding: 8px 20px;
            border-radius: 8px;
            transition: all 0.3s ease;
        "
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'">
            <i class="fas fa-redo"></i> Reenviar confirmação
        </button>
        <p style="color: #666; font-size: 11px; margin-top: 8px;">
            Verifique também a pasta de <strong>spam</strong>
        </p>
    `;
    container.appendChild(div);

    document.getElementById('resend-email-btn').addEventListener('click', () => {
        resendConfirmationEmail(email);
    });
}

// ============================================
// TOGGLE FORM
// ============================================
function toggleForm() {
    isRegisterMode = !isRegisterMode;
    const nomeField = document.getElementById('nome-field');
    const submitBtn = document.getElementById('submit-btn');
    const toggleLink = document.getElementById('toggle-mode-link');
    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');

    const resendContainer = document.getElementById('resend-container');
    if (resendContainer) resendContainer.remove();

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

    limparCamposFormulario();
}

// ============================================
// HANDLE CONFIRMAÇÃO
// ============================================
async function handleConfirmationCallback() {
    console.log('[Confirmação] Processando callback de confirmação...');

    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    let token = params.get('token') || params.get('confirmation_token');
    if (!token && hash) {
        const hashParams = new URLSearchParams(hash.replace('#', '?'));
        token = hashParams.get('access_token');
    }

    if (!token) {
        console.log('[Confirmação] Nenhum token encontrado');
        return false;
    }

    try {
        // FORÇAR LOGOUT antes de processar
        console.log('[Confirmação] Forçando logout antes de processar...');
        await window.AuthService.logout();
        localStorage.removeItem('usuarioLogado');
        limparCamposFormulario();
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = await window.AuthService.processConfirmationCallback();

        if (result && result.success) {
            showMessage('✅ ' + result.message, false, 5000);

            limparCamposFormulario();
            window.history.replaceState({}, document.title, window.location.pathname);

            setTimeout(() => {
                window.location.reload();
            }, 1500);

            return true;
        }

        return false;
    } catch (error) {
        console.error('[Confirmação] Erro:', error);
        showMessage('❌ Erro ao confirmar e-mail: ' + error.message, true);
        return false;
    }
}

// ============================================
// HANDLE GOOGLE CALLBACK
// ============================================
async function handleGoogleCallback() {
    console.log('[Google] Verificando callback...');

    if (!window.AuthService) return false;

    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: { user } } = await window.AuthService.getCurrentUser();

        if (user) {
            console.log('[Google] Usuário autenticado:', user.email);

            await window.AuthService.ensureProfileExists(user);
            await processarLogin(user);

            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
        }

        const params = new URLSearchParams(window.location.search);
        if (params.has('error')) {
            const error = params.get('error');
            const desc = params.get('error_description');
            showMessage(`❌ Erro no Google: ${desc || error}`, true);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        return false;

    } catch (error) {
        console.error('[Google] Erro no callback:', error);
        return false;
    }
}

function isGoogleCallback() {
    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');
    const hash = window.location.hash;
    const hasAccessToken = hash.includes('access_token');
    const hasError = params.has('error') || hash.includes('error');

    if (hasError) {
        const errorMsg = params.get('error_description') || params.get('error') || 'Erro no login';
        showMessage('❌ Erro no login com Google: ' + errorMsg, true);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    return hasCode || hasAccessToken;
}

// ============================================
// 🔥 CORRIGIDO: checkSession - NÃO FAZ AUTO-LOGIN
// ============================================
async function checkSession() {
    if (!window.AuthService) return false;

    try {
        const { data: { user } } = await window.AuthService.getCurrentUser();

        if (user) {
            console.log('[Login] Sessão existente para:', user.email);

            // 🔥 NÃO FAZ LOGIN AUTOMÁTICO NA PÁGINA DE LOGIN
            // Apenas verifica se já está logado e redireciona se necessário

            const usuarioSalvo = localStorage.getItem('usuarioLogado');
            if (usuarioSalvo) {
                try {
                    const parsed = JSON.parse(usuarioSalvo);
                    if (parsed.id === user.id) {
                        console.log('[Login] Usuário já está logado. Redirecionando...');

                        // 🔥 SÓ REDIRECIONA SE NÃO FOR A PÁGINA DE LOGIN
                        const isLoginPage = window.location.pathname.includes('/login/');
                        if (!isLoginPage) {
                            const isMobile = ehCelular();
                            const destino = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
                            window.location.href = destino;
                            return true;
                        }

                        // Se estiver na página de login, mostra mensagem
                        showMessage('👋 Você já está logado! Redirecionando...', false);
                        setTimeout(() => {
                            const isMobile = ehCelular();
                            const destino = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
                            window.location.href = destino;
                        }, 1500);
                        return true;
                    }
                } catch(e) {
                    console.warn('[Login] Erro ao parsear usuário salvo:', e);
                }
            }

            // Se tem sessão mas não tem usuário salvo, processa login
            console.log('[Login] Sessão encontrada mas sem dados locais. Processando...');
            await processarLogin(user);
            return true;
        }
        return false;
    } catch (err) {
        console.warn('[Login] Erro ao verificar sessão:', err);
        return false;
    }
}

// ============================================
// FUNÇÃO PARA FORÇAR LOGOUT (BOTÃO NA TELA)
// ============================================
window.forcarLogout = async function() {
    if (confirm('Deseja sair da conta atual?')) {
        if (window.AuthService) {
            await window.AuthService.logout();
        }
        localStorage.clear();
        sessionStorage.clear();
        limparCamposFormulario();
        window.location.reload();
        showMessage('✅ Sessão limpa! Faça login novamente.', false);
    }
};

// ============================================
// WAIT FOR SUPABASE
// ============================================
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

        setTimeout(() => {
            console.warn('[Login] Timeout aguardando Supabase');
            resolve();
        }, 10000);
    });
}

// ============================================
// FUNÇÃO PARA LIMPAR SESSÃO (EXPOSTA GLOBALMENTE)
// ============================================
window.limparSessao = async function() {
    console.log('[Login] Limpando sessão manualmente...');
    if (window.AuthService) {
        await window.AuthService.logout();
    }
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('userPhotoURL');
    limparCamposFormulario();
    showMessage('✅ Sessão limpa!', false);
};

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Login] Inicializando...');
    console.log('[Login] URL atual:', window.location.href);

    // Aguardar Supabase
    await waitForSupabase();

    if (!window.AuthService) {
        console.error('[Login] AuthService não disponível!');
        showMessage('❌ Erro ao carregar sistema. Recarregue a página.', true);
        return;
    }

    console.log('[Login] AuthService disponível!');

    // ============================================
    // VERIFICAR CALLBACK DE CONFIRMAÇÃO
    // ============================================
    const isConfirmCallback = window.AuthService.isConfirmationCallback();
    if (isConfirmCallback) {
        console.log('[Login] 🔔 Detectado callback de confirmação!');
        limparCamposFormulario();
        const processed = await handleConfirmationCallback();
        if (processed) {
            setTimeout(() => {
                window.location.href = window.location.pathname;
            }, 2000);
            return;
        }
    }

    // ============================================
    // VERIFICAR CALLBACK DO GOOGLE
    // ============================================
    const isCallback = isGoogleCallback();
    if (isCallback) {
        console.log('[Google] Detectado callback do Google!');
        const processed = await handleGoogleCallback();
        if (processed) return;
    }

    // ============================================
    // 🔥 VERIFICAR SESSÃO - SEM AUTO-LOGIN
    // ============================================
    const hasSession = await checkSession();
    if (hasSession) {
        console.log('[Login] Sessão ativa encontrada - redirecionando...');
        // O redirecionamento já é feito dentro do checkSession
        return;
    }

    // ============================================
    // LIMPAR CAMPOS
    // ============================================
    limparCamposFormulario();

    // ============================================
    // EVENTOS ANTI-AUTOCOMPLETE
    // ============================================
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nomeInput = document.getElementById('nome');

    [emailInput, passwordInput, nomeInput].forEach(input => {
        if (!input) return;
        input.addEventListener('focus', function() {
            if (this.value && !this.dataset.manual) {
                this.value = '';
            }
        });
        input.addEventListener('input', function() {
            if (this.value) {
                this.dataset.manual = 'true';
            }
        });
        input.addEventListener('click', function() {
            if (this.value && !this.dataset.manual) {
                this.value = '';
            }
        });
    });

    setTimeout(() => limparCamposFormulario(), 100);
    setTimeout(() => limparCamposFormulario(), 500);

    // ============================================
    // 🔥 LISTENER DE AUTENTICAÇÃO (DESATIVADO NA PÁGINA DE LOGIN)
    // ============================================
    // Só ativa o listener se NÃO for callback
    if (!isCallback && !isConfirmCallback) {
        authListenerUnsubscribe = window.AuthService.onAuthStateChange(async (event, session) => {
            console.log('[Login] Auth state change:', event);

            if (event === 'SIGNED_IN' && session?.user) {
                // 🔥 SÓ PROCESSA SE FOR CLIQUE DO USUÁRIO (não automático)
                const isLoginPage = window.location.pathname.includes('/login/');

                if (isLoginPage && !localStorage.getItem('usuarioLogado')) {
                    console.log('[Login] Login detectado, processando...');
                    await processarLogin(session.user);
                } else if (!isLoginPage) {
                    console.log('[Login] Login detectado fora da página de login');
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('[Login] Usuário deslogou');
                localStorage.removeItem('usuarioLogado');
                if (window.CacheManager) window.CacheManager.logout();
            }
        });
    }

    // ============================================
    // EVENTOS DA UI
    // ============================================

    // Google Login
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[UI] Botão Google clicado');
            loginWithGoogle();
        });
    }

    // Email Login Form
    const emailForm = document.getElementById('auth-form');
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value.trim();
            const password = document.getElementById('password')?.value;
            const submitBtn = emailForm.querySelector('.btn-primary');

            if (!email || !password) {
                showMessage('⚠️ Preencha e-mail e senha!', true);
                return;
            }

            if (isRegisterMode) {
                const nome = document.getElementById('nome')?.value.trim();
                if (!nome) {
                    showMessage('⚠️ Preencha seu nome!', true);
                    return;
                }
                if (password.length < 6) {
                    showMessage('⚠️ Senha deve ter no mínimo 6 caracteres!', true);
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

    // Toggle Link
    const toggleLink = document.getElementById('toggle-mode-link');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForm();
        });
    }

    // ============================================
    // LIMPEZA PERIÓDICA
    // ============================================
    let limpezaInterval = setInterval(() => {
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const nome = document.getElementById('nome');

        if (email && email.value && !email.dataset.manual) {
            email.value = '';
        }
        if (password && password.value && !password.dataset.manual) {
            password.value = '';
        }
        if (nome && nome.value && !nome.dataset.manual) {
            nome.value = '';
        }
    }, 2000);

    window.addEventListener('beforeunload', () => {
        if (limpezaInterval) clearInterval(limpezaInterval);
        if (authListenerUnsubscribe && typeof authListenerUnsubscribe === 'function') {
            authListenerUnsubscribe();
        }
    });

    console.log('%c🔐 Painel Zero - Login com Supabase', 'color: #9333ea; font-size: 16px; font-weight: bold;');
    console.log('%c✅ Login corrigido - SEM AUTO-LOGIN!', 'color: #10b981; font-size: 14px;');
    console.log('%c💡 Use "forcarLogout()" no console para limpar a sessão', 'color: #f59e0b; font-size: 12px;');
});

// ============================================
// LOGIN COM GOOGLE (chamado do botão)
// ============================================
async function loginWithGoogle() {
    console.log('[Google] Iniciando login com Google...');

    if (!window.AuthService) {
        showMessage('Sistema offline. Tente novamente.', true);
        return;
    }

    try {
        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REDIRECIONANDO...';
        }

        await window.AuthService.loginWithGoogle();

        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> ENTRAR COM GOOGLE';
        }

    } catch (error) {
        console.error('[Google] Erro:', error);
        showMessage('❌ Erro ao fazer login com Google: ' + error.message, true);

        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> ENTRAR COM GOOGLE';
        }
    }
}