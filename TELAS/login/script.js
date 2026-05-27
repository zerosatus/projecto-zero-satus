// ==================== DETECÇÃO DE DISPOSITIVO ====================
function ehCelular() {
    const ehMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const ehTelaPequena = window.innerWidth <= 768;
    return ehMobile || ehTelaPequena;
}

const eMobile = ehCelular();
console.log('📱 É celular?', eMobile);

// ==================== VERIFICAR SE JÁ ESTÁ LOGADO ====================
const usuarioSalvo = localStorage.getItem('usuarioLogado');
const isLoginPage = window.location.pathname.includes('/login/');

if (usuarioSalvo && !isLoginPage) {
    if (eMobile) {
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

// Inicializar Firebase se não foi inicializado
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('[Firebase] Firebase inicializado!');
}
const auth = firebase.auth();

// ==================== VARIÁVEIS GLOBAIS ====================
let syncInProgress = false;

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

// Tabs functionality
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
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
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
    
    // Dados padrão de tarefas
    const tarefasPadrao = [
        {
            id: Date.now() + '-1',
            nome: 'Bem-vindo ao Zero!',
            descricao: 'Esta é uma tarefa de exemplo. Você pode editá-la ou criar novas.',
            prioridade: 'media',
            prazo: new Date(Date.now() + 7 * 86400000).toLocaleDateString('pt-BR'),
            disciplina: 'outros',
            subtasks: [],
            favorita: false,
            concluida: false,
            dataCriacao: new Date().toISOString(),
            dataConclusao: null
        },
        {
            id: Date.now() + '-2',
            nome: 'Explore o calendário',
            descricao: 'Adicione eventos importantes no calendário acadêmico.',
            prioridade: 'baixa',
            prazo: new Date(Date.now() + 14 * 86400000).toLocaleDateString('pt-BR'),
            disciplina: 'outros',
            subtasks: [],
            favorita: false,
            concluida: false,
            dataCriacao: new Date().toISOString(),
            dataConclusao: null
        }
    ];
    
    // Dados padrão de anotações
    const anotacoesPadrao = [
        {
            id: Date.now() + '-1',
            title: 'Bem-vindo!',
            content: 'Esta é sua primeira anotação. Use o editor para criar anotações ricas com formatação.',
            date: new Date().toISOString()
        }
    ];
    
    // Dados padrão de eventos
    const eventosPadrao = [
        {
            id: Date.now() + '-1',
            title: 'Comece a usar o Zero',
            type: 'outro',
            date: new Date().toISOString().split('T')[0],
            start: '09:00',
            end: '10:00',
            color: '#8b5cf6',
            description: 'Explore todas as funcionalidades da plataforma!'
        }
    ];
    
    // Dados padrão de horário semanal
    const weeklySchedulePadrao = {
        'Seg': [],
        'Ter': [],
        'Qua': [],
        'Qui': [],
        'Sex': []
    };
    
    // Salvar dados no localStorage com a chave correta
    localStorage.setItem(`${userId}_tasks`, JSON.stringify(tarefasPadrao));
    localStorage.setItem(`${userId}_notes`, JSON.stringify(anotacoesPadrao));
    localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(eventosPadrao));
    localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedulePadrao));
    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(['08:00', '09:30', '11:00', '14:00', '15:30']));
    localStorage.setItem(`${userId}_notificacoesSettings`, JSON.stringify({ push: true, email: false, aulas: true, tarefas: true }));
    localStorage.setItem(`${userId}_appearanceSettings`, JSON.stringify({ theme: 'dark', accent: '#8b5cf6', fontSize: 14 }));
    localStorage.setItem(`${userId}_notifications`, JSON.stringify([]));
    
    // Sincronizar com a nuvem se disponível
    if (window.FirebaseSync) {
        try {
            await window.FirebaseSync.saveUserDataToCloud(userId, 'tasks', tarefasPadrao);
            await window.FirebaseSync.saveUserDataToCloud(userId, 'notes', anotacoesPadrao);
            await window.FirebaseSync.saveUserDataToCloud(userId, 'calendarEvents', eventosPadrao);
            await window.FirebaseSync.saveUserDataToCloud(userId, 'weeklySchedule', weeklySchedulePadrao);
            console.log('[Login] ✅ Dados padrão salvos na nuvem');
        } catch (error) {
            console.error('[Login] Erro ao salvar dados padrão na nuvem:', error);
        }
    }
    
    // Atualizar CacheManager se disponível
    if (window.CacheManager) {
        window.CacheManager.set('tasks', tarefasPadrao, true);
        window.CacheManager.set('notes', anotacoesPadrao, true);
        window.CacheManager.set('calendarEvents', eventosPadrao, true);
        window.CacheManager.set('weeklySchedule', weeklySchedulePadrao, true);
    }
    
    console.log('[Login] ✅ Dados padrão criados com sucesso!');
}

// ==================== FUNÇÃO PARA CARREGAR DADOS DA NUVEM APÓS LOGIN ====================
async function carregarDadosDaNuvemAposLogin(usuario) {
    console.log('[Login] 🔍 Carregando dados da nuvem para:', usuario.email);
    
    // Aguardar o CacheManager inicializar
    if (window.CacheManager) {
        window.CacheManager.init();
        
        // Definir o usuário atual no CacheManager
        const userId = usuario.uid || usuario.email;
        window.CacheManager.currentUserId = userId;
        
        console.log('[Login] CacheManager configurado para usuário:', userId);
        
        // Forçar carregamento da nuvem
        try {
            const dadosCarregados = await window.CacheManager.loadFromCloud(true);
            
            if (dadosCarregados) {
                console.log('[Login] ✅ Dados da nuvem carregados com sucesso!');
            } else {
                console.log('[Login] ℹ️ Nenhum dado existente na nuvem, criando dados padrão');
                await criarDadosPadraoParaNovoUsuario(usuario);
            }
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
    if (eMobile) {
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
            
            // Criar objeto do usuário
            const usuario = {
                uid: user.uid,
                email: user.email,
                nome: user.displayName || email.split('@')[0],
                logado: true,
                dataLogin: new Date().toISOString()
            };
            
            // Salvar no localStorage
            localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
            
            showMessage('Login realizado com sucesso! Carregando seus dados...');
            
            // Carregar dados da nuvem
            await carregarDadosDaNuvemAposLogin(usuario);
            
            // Redirecionar
            setTimeout(redirecionarAposLogin, 1500);
            
        } catch (error) {
            console.error('[Login] Erro no login:', error);
            
            let errorMessage = 'Erro ao fazer login.';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuário não encontrado. Crie uma conta primeiro.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Senha incorreta. Tente novamente.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Esta conta foi desativada.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
                    break;
                default:
                    errorMessage = error.message || 'Erro ao fazer login. Tente novamente.';
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
            
            // Atualizar perfil com nome
            await user.updateProfile({
                displayName: nome
            });
            
            console.log('[Registro] Conta criada com sucesso:', user.uid);
            
            // Criar objeto do usuário
            const usuario = {
                uid: user.uid,
                email: user.email,
                nome: nome,
                logado: true,
                dataCriacao: new Date().toISOString()
            };
            
            // Salvar no localStorage
            localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
            
            // Criar dados padrão
            await criarDadosPadraoParaNovoUsuario(usuario);
            
            showMessage('Conta criada com sucesso! Redirecionando...');
            
            // Redirecionar
            setTimeout(redirecionarAposLogin, 1500);
            
        } catch (error) {
            console.error('[Registro] Erro:', error);
            
            let errorMessage = 'Erro ao criar conta.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este email já está em uso. Faça login ou use outro email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
                    break;
                default:
                    errorMessage = error.message || 'Erro ao criar conta. Tente novamente.';
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
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Usuário não encontrado com este e-mail.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido.';
            }
            
            showMessage(errorMessage, true);
        }
    });
}

// ==================== MONITORAR ESTADO DE AUTENTICAÇÃO ====================
auth.onAuthStateChanged((user) => {
    if (user && !localStorage.getItem('usuarioLogado')) {
        // Sincronizar estado se o Firebase estiver logado mas localStorage não
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

// ==================== EFEITOS VISUAIS ====================
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
        if (!input.value) {
            input.parentElement.classList.remove('focused');
        }
    });
});

// ==================== PREENCHER EMAIL APÓS REGISTRO ====================
// Quando o usuário clica em "LOGIN" após criar conta, preencher email
const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
if (loginTab) {
    loginTab.addEventListener('click', () => {
        const emailRegistrado = registroEmail ? registroEmail.value : '';
        if (emailRegistrado) {
            if (loginEmail) loginEmail.value = emailRegistrado;
            if (loginPassword) loginPassword.value = '';
        }
    });
}

// ==================== INICIALIZAR CACHEMANAGER ====================
if (window.CacheManager) {
    window.CacheManager.init();
    console.log('[Login] CacheManager inicializado');
} else {
    console.warn('[Login] CacheManager não encontrado! Verifique se o arquivo cache-manager.js foi carregado.');
}

// ==================== LOGS ====================
console.log('%c🔐 Painel Zero - Login', 'color: #9333ea; font-size: 20px; font-weight: bold;');
console.log('%cSistema de autenticação carregado!', 'color: #10b981; font-size: 14px;');
console.log('%cDispositivo:', eMobile ? '📱 Mobile' : '💻 Desktop/Tablet', 'color: #f59e0b;');