// login/script.js - APENAS LOGIN COM GOOGLE

function ehCelular() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth <= 768;
}

// Verificar se já está logado
const usuarioSalvo = localStorage.getItem('usuarioLogado');
const isLoginPage = window.location.pathname.includes('/login/');

if (usuarioSalvo && !isLoginPage) {
    const isMobile = ehCelular();
    window.location.href = isMobile ? '/TELAS' : '../inicio/index.html';
}

const googleLoginBtn = document.getElementById('google-login-btn');

function showMessage(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc2626' : '#10b981';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
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

async function criarDadosPadrao(usuario) {
    console.log('[Login] Criando dados padrão para:', usuario.email);
    const userId = usuario.uid;
    
    const dadosPadrao = {
        tasks: [],
        notes: [],
        calendarEvents: [],
        weeklySchedule: { 'Seg': [], 'Ter': [], 'Qua': [], 'Qui': [], 'Sex': [] },
        timeSlots: ['08:00', '09:30', '11:00', '14:00', '15:30'],
        notifications: [],
        notificacoesSettings: { push: true, email: false, aulas: true, tarefas: true },
        appearanceSettings: { theme: 'dark', accent: '#8b5cf6', fontSize: 14 }
    };
    
    // Salvar dados
    for (const [key, value] of Object.entries(dadosPadrao)) {
        localStorage.setItem(`${userId}_${key}`, JSON.stringify(value));
        if (window.CacheManager) {
            window.CacheManager.set(key, value, true);
        }
        sessionStorage.setItem(`preload_${key}`, JSON.stringify(value));
    }
}

async function processarLogin(user, isNewUser) {
    const usuario = {
        uid: user.uid,
        email: user.email,
        nome: user.displayName || user.email.split('@')[0],
        foto: user.photoURL || null,
        logado: true
    };
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuario.uid;
        
        const dadosExistentes = await window.CacheManager.loadFromCloud(true);
        
        if (!dadosExistentes || isNewUser) {
            await criarDadosPadrao(usuario);
            await window.CacheManager.loadFromCloud(true);
        }
        
        await window.CacheManager.startRealtimeSync();
        if (user.photoURL) {
            sessionStorage.setItem('preload_profilePhoto', user.photoURL);
        }
    }
    
    showMessage(`Bem-vindo, ${usuario.nome}!`);
    
    setTimeout(() => {
        const isMobile = ehCelular();
        window.location.href = isMobile ? '/TELAS/mobile-telas/index.html' : '/TELAS/inicio/index.html';
    }, 500);
}

// Login com Google
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            setLoading(googleLoginBtn, true);
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const result = await firebase.auth().signInWithPopup(provider);
            const isNewUser = result.additionalUserInfo?.isNewUser || false;
            
            await processarLogin(result.user, isNewUser);
            
        } catch (error) {
            console.error('[Google] Erro:', error);
            let msg = 'Erro ao fazer login. ';
            if (error.code === 'auth/popup-blocked') msg = 'Popup bloqueado! Permita popups.';
            else if (error.code === 'auth/network-request-failed') msg = 'Sem conexão com internet.';
            else msg += error.message;
            
            showMessage(msg, true);
            setLoading(googleLoginBtn, false);
        }
    });
}

// Monitorar estado
firebase.auth().onAuthStateChanged((user) => {
    if (user && !localStorage.getItem('usuarioLogado')) {
        processarLogin(user, false);
    }
});

if (window.CacheManager) window.CacheManager.init();

console.log('%c🔐 Painel Zero - Login com Google', 'color: #9333ea; font-size: 16px; font-weight: bold;');