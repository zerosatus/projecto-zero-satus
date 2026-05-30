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
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
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
            // Tenta carregar da nuvem
            const dadosCarregados = await window.CacheManager.loadFromCloud(true);
            if (dadosCarregados) {
                console.log('[Login] ✅ Dados da nuvem carregados com sucesso!');
            } else {
                console.log('[Login] ℹ️ Nenhum dado existente na nuvem, criando dados padrão');
                await criarDadosPadraoParaNovoUsuario(usuario);
                // Após criar dados padrão, enviar para nuvem
                await window.CacheManager.loadFromCloud(true);
            }
            // Iniciar escuta em tempo real
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

// ==================== LOGIN ====================
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
            
            const usuario = {
                uid: user.uid,
                email: user.email,
                nome: user.displayName || email.split('@')[0],
                logado: true,
                dataLogin: new Date().toISOString()
            };
            
            localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
            showMessage('Login realizado com sucesso! Carregando seus dados...');
            await carregarDadosDaNuvemAposLogin(usuario);
            setTimeout(redirecionarAposLogin, 1500);
            
        } catch (error) {
            console.error('[Login] Erro no login:', error);
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
            setLoading(loginBtn, false);
        }
    });
}

// ==================== REGISTRO ====================
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
            
            console.log('[Registro] Conta criada com sucesso:', user.uid);
            const usuario = {
                uid: user.uid,
                email: user.email,
                nome: nome,
                logado: true,
                dataCriacao: new Date().toISOString()
            };
            
            localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
            await criarDadosPadraoParaNovoUsuario(usuario);
            showMessage('Conta criada com sucesso! Redirecionando...');
            setTimeout(redirecionarAposLogin, 1500);
            
        } catch (error) {
            console.error('[Registro] Erro:', error);
            let errorMessage = 'Erro ao criar conta.';
            switch (error.code) {
                case 'auth/email-already-in-use': errorMessage = 'Este email já está em uso. Faça login ou use outro email.'; break;
                case 'auth/invalid-email': errorMessage = 'Email inválido.'; break;
                case 'auth/weak-password': errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.'; break;
                default: errorMessage = error.message || 'Erro ao criar conta. Tente novamente.';
            }
            showMessage(errorMessage, true);
            setLoading(registroBtn, false);
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
            showMessage(`Link de recuperação enviado para: ${email}. Verifique sua caixa de entrada.`);
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
auth.onAuthStateChanged((user) => {
    if (user && !localStorage.getItem('usuarioLogado')) {
        const usuario = {
            uid: user.uid,
            email: user.email,
            nome: user.displayName || user.email.split('@')[0],
            logado: true
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