// ==================== DETECÇÃO DE DISPOSITIVO ====================
function ehCelular() {
    const ehMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const ehTelaPequena = window.innerWidth <= 768;
    return ehMobile || ehTelaPequena;
}

// ==================== VERIFICAR SE JÁ ESTÁ LOGADO ====================
const usuarioSalvo = localStorage.getItem('usuarioLogado');
const isLoginPage = window.location.pathname.includes('/login/');

if (usuarioSalvo && !isLoginPage) {
    const isMobile = ehCelular();
    if (isMobile) {
        window.location.href = '../mobile-telas/index.html';
    } else {
        window.location.href = '../inicio/index.html';
    }
}

// ==================== CONFIGURAÇÃO DO FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyDOXYoICsqe3D7bBALLI1MFLSGr1D-t4iY",
    authDomain: "zero-5e74d.firebaseapp.com",
    projectId: "zero-5e74d",
    storageBucket: "zero-5e74d.firebasestorage.app",
    messagingSenderId: "431244473899",
    appId: "1:431244473899:web:da9424fd226f7386dddc6e",
    measurementId: "G-HTX5HLKYHJ",
    databaseURL: "https://zero-5e74d-default-rtdb.firebaseio.com/"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('[Firebase] Firebase inicializado!');
}
const auth = firebase.auth();

// ==================== ELEMENTOS DOM ====================
const tabBtns = document.querySelectorAll('.tab-btn');
const forms = document.querySelectorAll('.form');
const loginForm = document.getElementById('login-form');
const registroForm = document.getElementById('registro-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const registroNome = document.getElementById('registro-nome');
const registroEmail = document.getElementById('registro-email');
const registroPassword = document.getElementById('registro-password');
const loginBtn = document.getElementById('login-btn');
const registroBtn = document.getElementById('registro-btn');
const forgotPasswordLink = document.getElementById('forgot-password');

// ==================== FUNÇÕES DE UI ====================

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));
        btn.classList.add('active');
        if (tab === 'login') {
            loginForm.classList.add('active');
        } else {
            registroForm.classList.add('active');
        }
    });
});

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const event = window.event;
    const icon = event.currentTarget.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function showMessage(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc2626' : '#10b981';
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 5000);
}

function setLoading(button, isLoading) {
    if (isLoading) {
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AGUARDE...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalHtml;
        button.disabled = false;
    }
}

// ==================== FUNÇÃO PARA CRIAR DADOS PADRÃO ====================
async function criarDadosPadraoParaNovoUsuario(usuario) {
    console.log('[Login] Criando dados padrão para:', usuario.email);
    const userId = usuario.uid || usuario.email;
    
    const tarefasPadrao = [];
    const anotacoesPadrao = [];
    const eventosPadrao = [];
    const weeklySchedulePadrao = { 'Seg': [], 'Ter': [], 'Qua': [], 'Qui': [], 'Sex': [] };
    const timeSlotsPadrao = ['08:00', '09:30', '11:00', '14:00', '15:30'];
    const notificationsPadrao = [];
    const notificacoesSettingsPadrao = { push: true, email: false, aulas: true, tarefas: true };
    const appearanceSettingsPadrao = { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
    
    localStorage.setItem(`${userId}_tasks`, JSON.stringify(tarefasPadrao));
    localStorage.setItem(`${userId}_notes`, JSON.stringify(anotacoesPadrao));
    localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(eventosPadrao));
    localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedulePadrao));
    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlotsPadrao));
    localStorage.setItem(`${userId}_notifications`, JSON.stringify(notificationsPadrao));
    localStorage.setItem(`${userId}_notificacoesSettings`, JSON.stringify(notificacoesSettingsPadrao));
    localStorage.setItem(`${userId}_appearanceSettings`, JSON.stringify(appearanceSettingsPadrao));
    
    if (window.CacheManager) {
        window.CacheManager.set('tasks', tarefasPadrao, true);
        window.CacheManager.set('notes', anotacoesPadrao, true);
        window.CacheManager.set('calendarEvents', eventosPadrao, true);
        window.CacheManager.set('weeklySchedule', weeklySchedulePadrao, true);
        window.CacheManager.set('timeSlots', timeSlotsPadrao, true);
        window.CacheManager.set('notifications', notificationsPadrao, true);
        window.CacheManager.set('notificacoesSettings', notificacoesSettingsPadrao, true);
        window.CacheManager.set('appearanceSettings', appearanceSettingsPadrao, true);
    }
    
    console.log('[Login] ✅ Dados padrão criados com sucesso!');
}

// ==================== FUNÇÃO PARA CARREGAR DADOS DA NUVEM ====================
async function carregarDadosDaNuvemAposLogin(usuario) {
    console.log('[Login] 🔍 Carregando dados da nuvem para:', usuario.email);
    
    if (window.CacheManager) {
        window.CacheManager.init();
        const userId = usuario.uid || usuario.email;
        window.CacheManager.currentUserId = userId;
        console.log('[Login] CacheManager configurado para usuário:', userId);
        
        try {
            const dadosCarregados = await window.CacheManager.loadFromCloud(true);
            if (dadosCarregados) {
                console.log('[Login] ✅ Dados da nuvem carregados com sucesso!');
            } else {
                console.log('[Login] ℹ️ Nenhum dado existente na nuvem, criando dados padrão');
                await criarDadosPadraoParaNovoUsuario(usuario);
                await window.CacheManager.loadFromCloud(true);
            }
            await window.CacheManager.startRealtimeSync();
        } catch (error) {
            console.error('[Login] ❌ Erro ao carregar da nuvem:', error);
            await criarDadosPadraoParaNovoUsuario(usuario);
        }
    } else {
        console.warn('[Login] ⚠️ CacheManager não disponível!');
        await criarDadosPadraoParaNovoUsuario(usuario);
    }
}

// ==================== FUNÇÃO DE REDIRECIONAMENTO ====================
function redirecionarAposLogin() {
    const isMobile = ehCelular();
    console.log('[Login] Redirecionando para:', isMobile ? 'mobile' : 'desktop');
    
    if (isMobile) {
        window.location.href = '../mobile-telas/index.html';
    } else {
        window.location.href = '../inicio/index.html';
    }
}

// ==================== FUNÇÃO PARA ENVIAR VERIFICAÇÃO DE EMAIL ====================
async function enviarVerificacaoEmail(usuario) {
    try {
        await usuario.sendEmailVerification({
            url: window.location.origin + '/login/index.html',
            handleCodeInApp: false
        });
        console.log('[Verificação] E-mail de verificação enviado para:', usuario.email);
        return true;
    } catch (error) {
        console.error('[Verificação] Erro ao enviar e-mail:', error);
        return false;
    }
}

// ==================== FUNÇÃO PARA VERIFICAR SE EMAIL JÁ FOI VERIFICADO ====================
async function verificarEmailVerificado(usuario) {
    await usuario.reload();
    return usuario.emailVerified;
}

// ==================== FUNÇÃO PARA REENVIAR VERIFICAÇÃO ====================
async function reenviarVerificacao() {
    const user = auth.currentUser;
    if (!user) {
        showMessage('Usuário não encontrado. Faça login novamente.', true);
        return;
    }
    
    if (user.emailVerified) {
        showMessage('Seu e-mail já está verificado!');
        return;
    }
    
    setLoading(reenviarBtn, true);
    const enviado = await enviarVerificacaoEmail(user);
    setLoading(reenviarBtn, false);
    
    if (enviado) {
        showMessage(`✅ E-mail de verificação reenviado para: ${user.email}\nVerifique sua caixa de entrada e spam.`);
    } else {
        showMessage('❌ Erro ao enviar e-mail. Tente novamente mais tarde.', true);
    }
}

// ==================== CRIAR MODAL DE AVISO DE VERIFICAÇÃO ====================
function criarModalVerificacao(usuario) {
    // Remove modal existente se houver
    const modalExistente = document.getElementById('verificacao-modal');
    if (modalExistente) modalExistente.remove();
    
    const modal = document.createElement('div');
    modal.id = 'verificacao-modal';
    modal.className = 'verificacao-modal';
    modal.innerHTML = `
        <div class="verificacao-modal-overlay"></div>
        <div class="verificacao-modal-content">
            <div class="verificacao-modal-icon">
                <i class="fas fa-envelope"></i>
            </div>
            <h2>Verifique seu e-mail!</h2>
            <p>Enviamos um link de verificação para:</p>
            <p class="verificacao-email"><strong>${usuario.email}</strong></p>
            <p class="verificacao-info">Clique no link enviado para seu e-mail antes de fazer login.</p>
            <div class="verificacao-buttons">
                <button id="reenviar-verificacao" class="btn-secondary">
                    <i class="fas fa-paper-plane"></i> Reenviar e-mail
                </button>
                <button id="verificar-agora" class="btn-primary">
                    <i class="fas fa-sync-alt"></i> Já verifiquei
                </button>
            </div>
            <button id="sair-login" class="btn-link">
                <i class="fas fa-sign-out-alt"></i> Voltar para o login
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adicionar estilos do modal
    const styleModal = document.createElement('style');
    styleModal.textContent = `
        .verificacao-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        
        .verificacao-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(8px);
        }
        
        .verificacao-modal-content {
            position: relative;
            max-width: 400px;
            width: 90%;
            background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
            border-radius: 28px;
            padding: 32px 24px;
            text-align: center;
            border: 1px solid rgba(139, 92, 246, 0.3);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.3s ease;
        }
        
        .verificacao-modal-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: pulse 2s infinite;
        }
        
        .verificacao-modal-icon i {
            font-size: 40px;
            color: white;
        }
        
        .verificacao-modal-content h2 {
            color: white;
            font-size: 24px;
            margin-bottom: 16px;
        }
        
        .verificacao-modal-content p {
            color: #ccc;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .verificacao-email {
            color: #a78bfa !important;
            font-size: 16px !important;
            margin: 8px 0 !important;
            word-break: break-all;
        }
        
        .verificacao-info {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 12px;
            padding: 12px;
            margin: 16px 0;
            font-size: 13px;
            border-left: 3px solid #8b5cf6;
            text-align: left;
        }
        
        .verificacao-buttons {
            display: flex;
            gap: 12px;
            margin: 24px 0 16px;
        }
        
        .btn-secondary {
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 12px 16px;
            border-radius: 12px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .verificacao-buttons .btn-primary {
            flex: 1;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            border: none;
            padding: 12px 16px;
            border-radius: 12px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .verificacao-buttons .btn-primary:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        
        .btn-link {
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
            font-size: 13px;
            margin-top: 8px;
            transition: color 0.2s;
        }
        
        .btn-link:hover {
            color: #a78bfa;
        }
        
        .btn-secondary:disabled, .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(styleModal);
    
    // Eventos dos botões
    const reenviarBtn = document.getElementById('reenviar-verificacao');
    const verificarBtn = document.getElementById('verificar-agora');
    const sairBtn = document.getElementById('sair-login');
    
    if (reenviarBtn) {
        reenviarBtn.addEventListener('click', async () => {
            setLoading(reenviarBtn, true);
            const enviado = await enviarVerificacaoEmail(usuario);
            setLoading(reenviarBtn, false);
            if (enviado) {
                showMessage(`✅ E-mail reenviado para: ${usuario.email}`);
            } else {
                showMessage('❌ Erro ao reenviar e-mail', true);
            }
        });
    }
    
    if (verificarBtn) {
        verificarBtn.addEventListener('click', async () => {
            setLoading(verificarBtn, true);
            const verificado = await verificarEmailVerificado(usuario);
            setLoading(verificarBtn, false);
            
            if (verificado) {
                showMessage('✅ E-mail verificado! Redirecionando...');
                modal.remove();
                await carregarDadosDaNuvemAposLogin({
                    uid: usuario.uid,
                    email: usuario.email,
                    nome: usuario.displayName || usuario.email.split('@')[0]
                });
                setTimeout(redirecionarAposLogin, 1500);
            } else {
                showMessage('❌ E-mail ainda não foi verificado. Clique no link que enviamos.', true);
            }
        });
    }
    
    if (sairBtn) {
        sairBtn.addEventListener('click', async () => {
            await auth.signOut();
            localStorage.removeItem('usuarioLogado');
            modal.remove();
            showMessage('Você saiu. Faça login após verificar seu e-mail.');
            window.location.reload();
        });
    }
}

// ==================== LOGIN COM VERIFICAÇÃO ====================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmail.value;
        const password = loginPassword.value;
        
        if (!email || !password) {
            showMessage('Por favor, preencha todos os campos!', true);
            return;
        }
        
        try {
            setLoading(loginBtn, true);
            console.log('[Login] Tentando login com:', email);
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('[Login] Usuário autenticado:', user.uid);
            
            // VERIFICAR SE EMAIL FOI CONFIRMADO
            await user.reload();
            
            if (!user.emailVerified) {
                console.log('[Login] ⚠️ Email não verificado!');
                setLoading(loginBtn, false);
                
                // Reenviar verificação automaticamente
                await enviarVerificacaoEmail(user);
                
                // Deslogar o usuário
                await auth.signOut();
                
                // Mostrar modal de verificação
                criarModalVerificacao(user);
                showMessage('📧 Verifique seu e-mail antes de fazer login!', true);
                return;
            }
            
            console.log('[Login] ✅ Email verificado!');
            
            const usuario = {
                uid: user.uid,
                email: user.email,
                nome: user.displayName || email.split('@')[0],
                logado: true,
                dataLogin: new Date().toISOString(),
                emailVerified: true
            };
            
            localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
            showMessage('Login realizado com sucesso! Carregando seus dados...');
            await carregarDadosDaNuvemAposLogin(usuario);
            setTimeout(redirecionarAposLogin, 1500);
            
        } catch (error) {
            console.error('[Login] Erro no login:', error);
            setLoading(loginBtn, false);
            
            let errorMessage = 'Erro ao fazer login.';
            switch (error.code) {
                case 'auth/user-not-found': errorMessage = 'Usuário não encontrado. Crie uma conta primeiro.'; break;
                case 'auth/wrong-password': errorMessage = 'Senha incorreta. Tente novamente.'; break;
                case 'auth/invalid-email': errorMessage = 'Email inválido.'; break;
                case 'auth/user-disabled': errorMessage = 'Esta conta foi desativada.'; break;
                case 'auth/too-many-requests': errorMessage = 'Muitas tentativas. Tente novamente mais tarde.'; break;
                default: errorMessage = error.message || 'Erro ao fazer login. Tente novamente.';
            }
            showMessage(errorMessage, true);
        }
    });
}

// ==================== REGISTRO COM VERIFICAÇÃO ====================
if (registroForm) {
    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = registroNome.value;
        const email = registroEmail.value;
        const password = registroPassword.value;
        
        if (!nome || !email || !password) {
            showMessage('Por favor, preencha todos os campos!', true);
            return;
        }
        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres!', true);
            return;
        }
        
        try {
            setLoading(registroBtn, true);
            console.log('[Registro] Criando conta para:', email);
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            await user.updateProfile({ displayName: nome });
            
            // ENVIAR E-MAIL DE VERIFICAÇÃO
            await enviarVerificacaoEmail(user);
            
            console.log('[Registro] Conta criada com sucesso:', user.uid);
            
            // Deslogar o usuário (não queremos ele logado sem verificar)
            await auth.signOut();
            
            // Mostrar modal de verificação
            criarModalVerificacao(user);
            showMessage(`📧 Verifique seu e-mail! Enviamos um link para: ${email}`);
            
        } catch (error) {
            console.error('[Registro] Erro:', error);
            setLoading(registroBtn, false);
            
            let errorMessage = 'Erro ao criar conta.';
            switch (error.code) {
                case 'auth/email-already-in-use': errorMessage = 'Este email já está em uso. Faça login ou use outro email.'; break;
                case 'auth/invalid-email': errorMessage = 'Email inválido.'; break;
                case 'auth/weak-password': errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.'; break;
                default: errorMessage = error.message || 'Erro ao criar conta. Tente novamente.';
            }
            showMessage(errorMessage, true);
        }
    });
}

// ==================== ESQUECI A SENHA ====================
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = loginEmail.value;
        if (!email) {
            showMessage('Digite seu e-mail para receber o link de recuperação.', true);
            loginEmail.focus();
            return;
        }
        try {
            await auth.sendPasswordResetEmail(email);
            showMessage(`🔐 Link de recuperação enviado para: ${email}. Verifique sua caixa de entrada.`);
        } catch (error) {
            console.error('[Recuperação] Erro:', error);
            let errorMessage = 'Erro ao enviar email de recuperação.';
            if (error.code === 'auth/user-not-found') errorMessage = 'Usuário não encontrado com este e-mail.';
            else if (error.code === 'auth/invalid-email') errorMessage = 'E-mail inválido.';
            showMessage(errorMessage, true);
        }
    });
}

// ==================== MONITORAR ESTADO DE AUTENTICAÇÃO ====================
auth.onAuthStateChanged(async (user) => {
    if (user && !localStorage.getItem('usuarioLogado')) {
        // Verificar se email está verificado antes de permitir
        await user.reload();
        
        if (!user.emailVerified) {
            console.log('[Auth] Usuário com email não verificado, deslogando...');
            await auth.signOut();
            return;
        }
        
        const usuario = {
            uid: user.uid,
            email: user.email,
            nome: user.displayName || user.email.split('@')[0],
            logado: true,
            emailVerified: true
        };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        console.log('[Auth] Estado sincronizado com localStorage');
    }
});

// ==================== INICIALIZAR CACHEMANAGER ====================
if (window.CacheManager) {
    window.CacheManager.init();
    console.log('[Login] CacheManager inicializado');
}

const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
if (loginTab) {
    loginTab.addEventListener('click', () => {
        const emailRegistrado = registroEmail ? registroEmail.value : '';
        if (emailRegistrado && loginEmail) loginEmail.value = emailRegistrado;
        if (loginPassword) loginPassword.value = '';
    });
}

console.log('%c🔐 Painel Zero - Login', 'color: #9333ea; font-size: 20px; font-weight: bold;');
console.log('%cDispositivo:', ehCelular() ? '📱 Mobile' : '💻 Desktop/Tablet', 'color: #f59e0b;');
console.log('%c✅ Verificação de e-mail ativada!', 'color: #10b981; font-weight: bold;');