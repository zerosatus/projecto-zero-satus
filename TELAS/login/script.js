// login/script.js - VERSÃO OTIMIZADA COM PRÉ-CARREGAMENTO

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

window.togglePassword = function(inputId) {
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
};

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
    
    // Salvar em localStorage
    localStorage.setItem(`${userId}_tasks`, JSON.stringify(tarefasPadrao));
    localStorage.setItem(`${userId}_notes`, JSON.stringify(anotacoesPadrao));
    localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(eventosPadrao));
    localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedulePadrao));
    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlotsPadrao));
    localStorage.setItem(`${userId}_notifications`, JSON.stringify(notificationsPadrao));
    localStorage.setItem(`${userId}_notificacoesSettings`, JSON.stringify(notificacoesSettingsPadrao));
    localStorage.setItem(`${userId}_appearanceSettings`, JSON.stringify(appearanceSettingsPadrao));
    
    // Salvar via CacheManager
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
    
    // Armazenar no sessionStorage para acesso rápido
    sessionStorage.setItem(`preload_tasks`, JSON.stringify(tarefasPadrao));
    sessionStorage.setItem(`preload_notes`, JSON.stringify(anotacoesPadrao));
    sessionStorage.setItem(`preload_calendarEvents`, JSON.stringify(eventosPadrao));
    sessionStorage.setItem(`preload_weeklySchedule`, JSON.stringify(weeklySchedulePadrao));
    sessionStorage.setItem(`preload_timeSlots`, JSON.stringify(timeSlotsPadrao));
    
    console.log('[Login] ✅ Dados padrão criados com sucesso!');
}

// ==================== FUNÇÃO PARA PRÉ-CARREGAR DADOS ====================
async function preloadDataAfterLogin(usuario) {
    console.log('[Login] 🔄 Pré-carregando dados em background...');
    
    const userId = usuario.uid || usuario.email;
    
    // Buscar dados da nuvem
    if (window.CacheManager) {
        const cloudData = await window.CacheManager.loadFromCloud(true);
        
        // Armazenar no sessionStorage para acesso instantâneo
        const dataTypes = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications'];
        for (const type of dataTypes) {
            const data = window.CacheManager.get(type, null);
            if (data !== null) {
                sessionStorage.setItem(`preload_${type}`, JSON.stringify(data));
            }
        }
        
        // Pré-carregar foto de perfil
        const photoUrl = await window.CacheManager.getProfilePhotoUrl();
        if (photoUrl) {
            sessionStorage.setItem('preload_profilePhoto', photoUrl);
        }
    }
    
    console.log('[Login] ✅ Pré-carregamento concluído!');
}

// ==================== FUNÇÃO DE REDIRECIONAMENTO ====================
function redirecionarAposLogin() {
    const isMobile = ehCelular();
    console.log('[Login] Redirecionando para:', isMobile ? 'mobile' : 'desktop');
    
    // Pequeno delay para garantir que o preload foi salvo
    setTimeout(() => {
        if (isMobile) {
            window.location.href = '../mobile-telas/index.html';
        } else {
            window.location.href = '../inicio/index.html';
        }
    }, 100);
}

// ==================== LOGIN (OTIMIZADO) ====================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        
        if (!email || !password) {
            showMessage('Por favor, preencha todos os campos!', true);
            return;
        }
        
        try {
            setLoading(loginBtn, true);
            console.log('[Login] Tentando login com:', email);
            
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
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
            
            // Inicializar CacheManager e pré-carregar dados
            if (window.CacheManager) {
                window.CacheManager.init();
                window.CacheManager.currentUserId = usuario.uid || usuario.email;
                
                // Carregar dados da nuvem
                const dadosCarregados = await window.CacheManager.loadFromCloud(true);
                
                if (!dadosCarregados) {
                    console.log('[Login] Nenhum dado existente, criando padrão...');
                    await criarDadosPadraoParaNovoUsuario(usuario);
                    await window.CacheManager.loadFromCloud(true);
                }
                
                // Pré-carregar todos os dados em background
                await preloadDataAfterLogin(usuario);
                
                // Iniciar escuta em tempo real
                await window.CacheManager.startRealtimeSync();
                await window.CacheManager.startPhotoRealtimeSync();
            }
            
            showMessage('Login realizado com sucesso! Redirecionando...');
            redirecionarAposLogin();
            
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

// ==================== REGISTRO (OTIMIZADO) ====================
if (registroForm) {
    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = registroNome.value.trim();
        const email = registroEmail.value.trim();
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
            
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
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
            
            // Criar dados padrão
            await criarDadosPadraoParaNovoUsuario(usuario);
            
            // Inicializar CacheManager
            if (window.CacheManager) {
                window.CacheManager.init();
                window.CacheManager.currentUserId = usuario.uid || usuario.email;
                await window.CacheManager.loadFromCloud(true);
                await preloadDataAfterLogin(usuario);
            }
            
            showMessage('Conta criada com sucesso! Redirecionando...');
            redirecionarAposLogin();
            
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
            await firebase.auth().sendPasswordResetEmail(email);
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
firebase.auth().onAuthStateChanged((user) => {
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

// ==================== PRÉ-CARREGAMENTO EM BACKGROUND ====================
// Se já estiver logado, pré-carregar dados em background
if (usuarioSalvo && isLoginPage) {
    console.log('[Login] Usuário já logado, pré-carregando dados...');
    setTimeout(async () => {
        if (window.PreloadSystem) {
            await window.PreloadSystem.preloadAllData();
        }
    }, 100);
}

// ==================== AUTO-PREENCHER EMAIL DO REGISTRO NO LOGIN ====================
const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
if (loginTab) {
    loginTab.addEventListener('click', () => {
        const emailRegistrado = registroEmail ? registroEmail.value : '';
        if (emailRegistrado && loginEmail) loginEmail.value = emailRegistrado;
        if (loginPassword) loginPassword.value = '';
    });
}

console.log('%c🔐 Painel Zero - Login Otimizado', 'color: #9333ea; font-size: 20px; font-weight: bold;');
console.log('%c⚡ Pré-carregamento ativo - Redirecionamento instantâneo', 'color: #10b981; font-size: 14px;');
console.log('%cDispositivo:', ehCelular() ? '📱 Mobile' : '💻 Desktop/Tablet', 'color: #f59e0b;');