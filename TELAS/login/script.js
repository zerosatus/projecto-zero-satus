// login/script.js - Login com Supabase (COM CONFIRMAÇÃO DE E-MAIL - CORRIGIDO)

let isRegisterMode = false;
let pendingEmail = '';

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

// ============================================
// LIMPAR CAMPOS DO FORMULÁRIO
// ============================================
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

async function processarLogin(user) {
    console.log('[Login] Processando login para:', user.email);
    console.log('[Login] User ID (UUID):', user.id);

    if (!user.email_confirmed_at) {
        console.warn('[Login] E-mail não confirmado!');
        showMessage('📧 Por favor, confirme seu e-mail antes de fazer login.', true);
        return false;
    }

    const usuario = {
        id: user.id,
        email: user.email,
        nome: user.user_metadata?.full_name || user.email.split('@')[0],
        foto: user.user_metadata?.avatar_url || null,
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
}

// ============================================
// LOGIN COM E-MAIL
// ============================================
async function loginWithEmail(email, password) {
    if (!window.AuthService) {
        showMessage('Sistema offline. Tente novamente.', true);
        return false;
    }

    try {
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

            // ⚠️ IMPORTANTE: Limpar TODOS os campos e forçar logout se necessário
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
// REENVIAR E-MAIL DE CONFIRMAÇÃO
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
// ⭐ NOVA FUNÇÃO: VERIFICAR SE É CALLBACK DE CONFIRMAÇÃO
// ============================================
function isConfirmationCallback() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    // Verificar se há token de confirmação na URL
    const hasToken = params.has('token') || params.has('confirmation_token') ||
                     hash.includes('access_token') || hash.includes('confirmation');

    // Verificar se é o callback do Google
    const isGoogle = params.has('code') || hash.includes('access_token');

    return hasToken && !isGoogle;
}

// ============================================
// ⭐ NOVA FUNÇÃO: PROCESSAR CALLBACK DE CONFIRMAÇÃO
// ============================================
async function handleConfirmationCallback() {
    console.log('[Confirmação] Processando callback de confirmação...');

    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    // Extrair token da URL
    let token = params.get('token') || params.get('confirmation_token');

    // Se não tiver token, verificar no hash
    if (!token && hash) {
        const hashParams = new URLSearchParams(hash.replace('#', '?'));
        token = hashParams.get('access_token');
    }

    if (!token) {
        console.log('[Confirmação] Nenhum token encontrado na URL');
        return false;
    }

    console.log('[Confirmação] Token encontrado:', token.substring(0, 10) + '...');

    try {
        // ⚠️ IMPORTANTE: Verificar se o usuário atual corresponde ao e-mail confirmado
        const { data: { user } } = await window.AuthService.getCurrentUser();

        // Se já estiver logado com uma conta diferente, fazer logout primeiro
        if (user && pendingEmail && user.email !== pendingEmail) {
            console.log('[Confirmação] Usuário atual diferente do e-mail confirmado. Fazendo logout...');
            await window.AuthService.logout();
            localStorage.removeItem('usuarioLogado');
            // Limpar campos e recarregar a página
            limparCamposFormulario();
            window.location.reload();
            return true;
        }

        // Tentar confirmar o e-mail
        const result = await window.AuthService.confirmEmail(token);

        if (result.user) {
            showMessage('✅ E-mail confirmado com sucesso! Faça login para continuar.', false, 5000);

            // Limpar campos e redirecionar para login
            limparCamposFormulario();

            // Remover parâmetros da URL
            window.history.replaceState({}, document.title, window.location.pathname);

            // Se estava logado com conta diferente, garantir que fez logout
            await window.AuthService.logout();
            localStorage.removeItem('usuarioLogado');

            return true;
        }

        return false;
    } catch (error) {
        console.error('[Confirmação] Erro ao confirmar e-mail:', error);
        showMessage('❌ Erro ao confirmar e-mail: ' + error.message, true);
        return false;
    }
}

// ============================================
// LOGIN COM GOOGLE
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

// ============================================
// HANDLE CALLBACK DO GOOGLE
// ============================================
async function handleGoogleCallback() {
    console.log('[Google] Verificando callback...');

    if (!window.AuthService) return false;

    try {
        const { data: { user } } = await window.AuthService.getCurrentUser();

        if (user) {
            console.log('[Google] Usuário autenticado via callback:', user.email);

            if (!localStorage.getItem('usuarioLogado')) {
                await processarLogin(user);
            } else {
                const isMobile = ehCelular();
                const destino = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
                window.location.href = destino;
            }
            return true;
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
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Login] Inicializando...');
    console.log('[Login] URL atual:', window.location.href);

    // ============================================
    // PASSO 1: VERIFICAR SE É CALLBACK DE CONFIRMAÇÃO
    // ============================================
    const isConfirmCallback = isConfirmationCallback();

    // Aguardar Supabase
    await waitForSupabase();

    if (!window.AuthService) {
        console.error('[Login] AuthService não disponível!');
        showMessage('❌ Erro ao carregar sistema. Recarregue a página.', true);
        return;
    }

    console.log('[Login] AuthService disponível!');

    // ============================================
    // PASSO 2: PROCESSAR CALLBACK DE CONFIRMAÇÃO PRIMEIRO
    // ============================================
    if (isConfirmCallback) {
        console.log('[Login] 🔔 Detectado callback de confirmação de e-mail!');

        // Limpar campos antes de processar
        limparCamposFormulario();

        // Processar confirmação
        const processed = await handleConfirmationCallback();

        if (processed) {
            // Remover parâmetros da URL
            window.history.replaceState({}, document.title, window.location.pathname);

            // Aguardar um pouco e recarregar a página limpa
            setTimeout(() => {
                window.location.href = window.location.pathname;
            }, 2000);
            return;
        }
    }

    // ============================================
    // PASSO 3: VERIFICAR CALLBACK DO GOOGLE
    // ============================================
    const isCallback = isGoogleCallback();
    if (isCallback) {
        console.log('[Google] Detectado callback do Google!');
        const processed = await handleGoogleCallback();
        if (processed) return;
    }

    // ============================================
    // PASSO 4: LIMPAR CAMPOS
    // ============================================
    limparCamposFormulario();

    // ============================================
    // PASSO 5: EVENTOS ANTI-AUTOCOMPLETE
    // ============================================
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nomeInput = document.getElementById('nome');

    if (emailInput) {
        emailInput.addEventListener('focus', function() {
            if (this.value && !this.dataset.manual) {
                this.value = '';
            }
        });
        emailInput.addEventListener('input', function() {
            if (this.value) {
                this.dataset.manual = 'true';
            }
        });
        emailInput.addEventListener('click', function() {
            if (this.value && !this.dataset.manual) {
                this.value = '';
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('focus', function() {
            if (this.value) {
                this.value = '';
            }
        });
        passwordInput.addEventListener('input', function() {
            if (this.value) {
                this.dataset.manual = 'true';
            }
        });
        passwordInput.addEventListener('click', function() {
            if (this.value) {
                this.value = '';
            }
        });
    }

    if (nomeInput) {
        nomeInput.addEventListener('focus', function() {
            if (this.value && !this.dataset.manual) {
                this.value = '';
            }
        });
        nomeInput.addEventListener('input', function() {
            if (this.value) {
                this.dataset.manual = 'true';
            }
        });
    }

    // ============================================
    // PASSO 6: LIMPAR APÓS DELAY
    // ============================================
    setTimeout(() => limparCamposFormulario(), 100);
    setTimeout(() => limparCamposFormulario(), 500);

    // Listener de autenticação
    window.AuthService.onAuthStateChange(async (event, session) => {
        console.log('[Login] Auth state change:', event);

        if (event === 'SIGNED_IN' && session?.user && !localStorage.getItem('usuarioLogado')) {
            console.log('[Login] Usuário logou, processando...');
            await processarLogin(session.user);
        } else if (event === 'SIGNED_OUT') {
            console.log('[Login] Usuário deslogou');
            localStorage.removeItem('usuarioLogado');
            if (window.CacheManager) window.CacheManager.logout();
        }
    });

    // Verificar sessão existente
    const hasSession = await checkSession();
    if (hasSession) {
        console.log('[Login] Sessão ativa encontrada');
        return;
    }

    // Se for callback do Google que não processou
    if (isCallback) {
        const processed = await handleGoogleCallback();
        if (processed) return;
    }

    // ============================================
    // EVENTOS DA UI
    // ============================================

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

    const toggleLink = document.getElementById('toggle-mode-link');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForm();
        });
    }

    if (isCallback || isConfirmCallback) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Limpeza periódica
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
    });

    console.log('%c🔐 Painel Zero - Login com Supabase', 'color: #9333ea; font-size: 16px; font-weight: bold;');
    console.log('%c✅ Anti-autocomplete e confirmação de e-mail corrigidos!', 'color: #10b981; font-size: 14px;');
});