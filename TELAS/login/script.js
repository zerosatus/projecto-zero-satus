// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDOXYoICsqe3D7bBALLI1MFLSGr1D-t4iY",
    authDomain: "zero-5e74d.firebaseapp.com",
    projectId: "zero-5e74d",
    storageBucket: "zero-5e74d.firebasestorage.app",
    messagingSenderId: "431244473899",
    appId: "1:431244473899:web:da9424fd226f7386dddc6e",
    measurementId: "G-HTX5HLKYHJ"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
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

// Toggle password visibility
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

// Função para mostrar mensagens
function showMessage(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc2626' : '#10b981';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Função para mostrar loading
function setLoading(button, isLoading, originalText = null) {
    if (isLoading) {
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AGUARDE...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalHtml;
        button.disabled = false;
    }
}

// LOGIN FORM
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('login-btn');
    
    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos!', true);
        return;
    }
    
    try {
        setLoading(loginBtn, true);
        
        // Tentar fazer login
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Verificar se o email está verificado (opcional)
        // if (!user.emailVerified) {
        //     showMessage('Por favor, verifique seu email antes de fazer login.', true);
        //     setLoading(loginBtn, false);
        //     return;
        // }
        
        // Salvar dados do usuário
        localStorage.setItem('usuarioLogado', JSON.stringify({
            uid: user.uid,
            email: user.email,
            nome: user.displayName || email.split('@')[0],
            logado: true
        }));
        
        showMessage('Login realizado com sucesso! Redirecionando...');
        
        setTimeout(() => {
            window.location.href = '../inicio/index.html'; // Ajuste o caminho conforme necessário
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

// REGISTRO FORM
document.getElementById('registro-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('registro-nome').value;
    const email = document.getElementById('registro-email').value;
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
        
        // Criar usuário
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Atualizar perfil com o nome
        await user.updateProfile({
            displayName: nome
        });
        
        // Enviar email de verificação (opcional)
        // await user.sendEmailVerification();
        
        showMessage('Conta criada com sucesso! Faça login para continuar.');
        
        // Limpar formulário
        document.getElementById('registro-form').reset();
        
        // Voltar para a aba de login
        setTimeout(() => {
            tabBtns.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            tabBtns[0].classList.add('active');
            document.getElementById('login-form').classList.add('active');
            
            // Preencher email no login
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

// GOOGLE LOGIN
document.getElementById('google-login').addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        localStorage.setItem('usuarioLogado', JSON.stringify({
            uid: user.uid,
            email: user.email,
            nome: user.displayName,
            logado: true
        }));
        
        showMessage('Login com Google realizado com sucesso!');
        
        setTimeout(() => {
            window.location.href = '../inicio/index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Erro no login com Google:', error);
        showMessage('Erro ao fazer login com Google.', true);
    }
});

// GITHUB LOGIN (você precisa habilitar no Firebase Console)
document.getElementById('github-login').addEventListener('click', async () => {
    const provider = new firebase.auth.GithubAuthProvider();
    
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        localStorage.setItem('usuarioLogado', JSON.stringify({
            uid: user.uid,
            email: user.email,
            nome: user.displayName,
            logado: true
        }));
        
        showMessage('Login com GitHub realizado com sucesso!');
        
        setTimeout(() => {
            window.location.href = '../inicio/index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Erro no login com GitHub:', error);
        showMessage('Erro ao fazer login com GitHub.', true);
    }
});

// ESQUECI A SENHA
document.getElementById('forgot-password').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    
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

// Toggle between login and register
document.getElementById('toggle-registro').addEventListener('click', (e) => {
    e.preventDefault();
    
    tabBtns.forEach(b => b.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    tabBtns[1].classList.add('active');
    document.getElementById('registro-form').classList.add('active');
});

// Verificar se usuário já está logado
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário já está logado, pode redirecionar automaticamente
        // Descomente se quiser redirecionar automaticamente
        // window.location.href = '../inicio/index.html';
    }
});

// Input animations
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