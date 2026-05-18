// ==================== DETECÇÃO DE DISPOSITIVO ====================
function ehCelular() {
    const ehMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const ehTelaPequena = window.innerWidth <= 768;
    return ehMobile || ehTelaPequena;
}

const eMobile = ehCelular();
console.log('É celular?', eMobile);

// VERIFICAR SE JÁ ESTÁ LOGADO
const usuarioSalvo = localStorage.getItem('usuarioLogado');

if (usuarioSalvo) {
    try {
        const user = JSON.parse(usuarioSalvo);
        if (user && user.email) {
            console.log('Usuário já logado:', user.email);
            if (eMobile) {
                window.location.href = '../mobile-telas/index.html';
            } else {
                window.location.href = '../inicio/index.html';
            }
        }
    } catch(e) {
        console.error('Erro ao verificar usuário salvo:', e);
        localStorage.removeItem('usuarioLogado');
    }
}

// Configuração do Firebase
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

// Inicializar Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase inicializado!');
}

const auth = firebase.auth();

// Tabs functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const forms = document.querySelectorAll('.form');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));
        
        btn.classList.add('active');
        
        if (tab === 'login') {
            document.getElementById('login-form').classList.add('active');
        } else {
            document.getElementById('registro-form').classList.add('active');
        }
    });
});

// ==================== FUNÇÕES AUXILIARES ====================
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

// ==================== FUNÇÃO DE LOGIN ====================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('login-btn');
    
    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos!', true);
        return;
    }
    
    try {
        setLoading(loginBtn, true);
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Buscar dados adicionais do Firebase Realtime Database
        let nome = user.displayName || email.split('@')[0];
        let avatar = null;
        let telefone = '';
        let nascimento = '';
        
        try {
            const db = firebase.database();
            const snapshot = await db.ref(`users/${user.uid}/perfil`).once('value');
            const perfilData = snapshot.val();
            if (perfilData) {
                nome = perfilData.nome || nome;
                avatar = perfilData.avatar || null;
                telefone = perfilData.telefone || '';
                nascimento = perfilData.nascimento || '';
            }
        } catch(dbError) {
            console.warn('Erro ao buscar dados do Realtime DB:', dbError);
        }
        
        // Salvar dados do usuário no localStorage
        const usuarioData = {
            uid: user.uid,
            email: user.email,
            nome: nome,
            avatar: avatar,
            telefone: telefone,
            nascimento: nascimento,
            logado: true,
            dataLogin: new Date().toISOString()
        };
        
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioData));
        
        showMessage('Login realizado com sucesso! Redirecionando...');
        
        setTimeout(() => {
            if (eMobile) {
                window.location.href = '../mobile-telas/index.html';
            } else {
                window.location.href = '../inicio/index.html';
            }
        }, 1500);
        
    } catch (error) {
        console.error('Erro no login:', error);
        
        let errorMessage = 'Erro ao fazer login.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Senha incorreta.';
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
                errorMessage = 'Erro ao fazer login. Tente novamente.';
        }
        
        showMessage(errorMessage, true);
        setLoading(loginBtn, false);
    }
});

// ==================== FUNÇÃO DE REGISTRO ====================
document.getElementById('registro-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('registro-nome').value.trim();
    const email = document.getElementById('registro-email').value.trim();
    const password = document.getElementById('registro-password').value;
    const registroBtn = document.getElementById('registro-btn');
    
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
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Atualizar perfil com nome
        await user.updateProfile({
            displayName: nome
        });
        
        // Salvar dados adicionais no Realtime Database
        try {
            const db = firebase.database();
            await db.ref(`users/${user.uid}/perfil`).set({
                nome: nome,
                email: email,
                dataCriacao: new Date().toISOString(),
                avatar: null,
                telefone: '',
                nascimento: ''
            });
            console.log('✅ Dados salvos no Realtime Database');
        } catch(dbError) {
            console.warn('Erro ao salvar no Realtime DB:', dbError);
        }
        
        showMessage('Conta criada com sucesso! Faça login para continuar.');
        
        document.getElementById('registro-form').reset();
        
        setTimeout(() => {
            tabBtns.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            tabBtns[0].classList.add('active');
            document.getElementById('login-form').classList.add('active');
            document.getElementById('login-email').value = email;
        }, 2000);
        
    } catch (error) {
        console.error('Erro no registro:', error);
        
        let errorMessage = 'Erro ao criar conta.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este email já está em uso.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Senha muito fraca. Use uma senha mais forte.';
                break;
            default:
                errorMessage = 'Erro ao criar conta. Tente novamente.';
        }
        
        showMessage(errorMessage, true);
        setLoading(registroBtn, false);
    }
});

// ==================== ESQUECI A SENHA ====================
document.getElementById('forgot-password').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    
    if (!email) {
        showMessage('Por favor, digite seu e-mail primeiro.', true);
        document.getElementById('login-email').focus();
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showMessage(`Link de recuperação enviado para: ${email}`);
    } catch (error) {
        console.error('Erro ao enviar email de recuperação:', error);
        
        let errorMessage = 'Erro ao enviar email de recuperação.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Usuário não encontrado.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido.';
        }
        
        showMessage(errorMessage, true);
    }
});

// ==================== MONITORAR ESTADO DE AUTENTICAÇÃO ====================
auth.onAuthStateChanged((user) => {
    if (user && !localStorage.getItem('usuarioLogado')) {
        // Se usuário está autenticado mas não tem dados no localStorage
        console.log('Usuário autenticado, salvando dados...');
        
        const usuarioData = {
            uid: user.uid,
            email: user.email,
            nome: user.displayName || user.email.split('@')[0],
            logado: true,
            dataLogin: new Date().toISOString()
        };
        
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioData));
        
        // Redirecionar
        setTimeout(() => {
            if (eMobile) {
                window.location.href = '../mobile-telas/index.html';
            } else {
                window.location.href = '../inicio/index.html';
            }
        }, 500);
    }
});

// ==================== ANIMAÇÕES DOS INPUTS ====================
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

// ==================== PREVENIR SUBMIT COM ENTER NOS BOTÕES ====================
document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btn.click();
        }
    });
});

console.log('%c🔐 Painel Zero - Login', 'color: #9333ea; font-size: 20px; font-weight: bold;');
console.log('%cSistema de autenticação carregado!', 'color: #10b981; font-size: 14px;');