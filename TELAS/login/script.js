// login/script.js - VERSÃO CORRIGIDA COM AUTENTICAÇÃO FIRESTORE COMPLETA

function ehCelular() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth <= 768;
}

function isInWebView() {
    return /wv|WebView|Android.*Chrome\/\d+\.\d+/.test(navigator.userAgent) 
        || (typeof Android !== 'undefined')
        || window.location.href.includes('file://');
}

const USE_REDIRECT = isInWebView();
console.log(`[Login] Usando ${USE_REDIRECT ? 'REDIRECT' : 'POPUP'} para autenticação`);

// Verificar se já está logado
const usuarioSalvo = localStorage.getItem('usuarioLogado');
const isLoginPage = window.location.pathname.includes('/login/');

if (usuarioSalvo && !isLoginPage) {
    const isMobile = ehCelular();
    window.location.href = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
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
    
    for (const [key, value] of Object.entries(dadosPadrao)) {
        localStorage.setItem(`${userId}_${key}`, JSON.stringify(value));
        if (window.CacheManager) {
            window.CacheManager.set(key, value, true);
        }
        sessionStorage.setItem(`preload_${key}`, JSON.stringify(value));
    }
}

async function processarLogin(user, isNewUser) {
    console.log('[Login] Processando login para:', user.email);
    
    // 🔥 OBTER TOKEN DE AUTENTICAÇÃO
    let idToken = null;
    try {
        idToken = await user.getIdToken();
        console.log('[Login] Token obtido com sucesso');
    } catch (error) {
        console.error('[Login] Erro ao obter token:', error);
    }
    
    const usuario = {
        uid: user.uid,
        email: user.email,
        nome: user.displayName || user.email.split('@')[0],
        foto: user.photoURL || null,
        logado: true,
        firebaseToken: idToken
    };
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    sessionStorage.setItem('firebaseToken', idToken);
    
    // 🔥 INICIALIZAR CACHE MANAGER E FIRESTORE
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuario.uid;
        window.CacheManager.currentUserEmail = usuario.email;
        
        // Aguardar FirestoreService estar disponível
        let tentativas = 0;
        while (!window.FirestoreService && tentativas < 20) {
            await new Promise(r => setTimeout(r, 100));
            tentativas++;
        }
        
        if (window.FirestoreService) {
            // Garantir autenticação no Firestore
            if (typeof window.FirestoreService.setCurrentUser === 'function') {
                window.FirestoreService.setCurrentUser(user);
            }
            
            // Carregar dados da nuvem
            await window.CacheManager.loadFromCloud(true);
            
            // Iniciar sincronização em tempo real
            if (window.CacheManager.startRealtimeSync) {
                window.CacheManager.startRealtimeSync();
            }
        }
        
        if (isNewUser) {
            await criarDadosPadrao(usuario);
        }
    }
    
    showMessage(`Bem-vindo, ${usuario.nome}!`);
    
    setTimeout(() => {
        const isMobile = ehCelular();
        window.location.href = isMobile ? '../mobile-telas/index.html' : '../inicio/index.html';
    }, 500);
}

// 🔑 LOGIN COM GOOGLE
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            setLoading(googleLoginBtn, true);
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            if (USE_REDIRECT) {
                await firebase.auth().signInWithRedirect(provider);
                return;
            } else {
                const result = await firebase.auth().signInWithPopup(provider);
                const isNewUser = result.additionalUserInfo?.isNewUser || false;
                await processarLogin(result.user, isNewUser);
                setLoading(googleLoginBtn, false);
            }
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

// 🔄 PROCESSAR RETORNO DO REDIRECT
firebase.auth().getRedirectResult().then(async (result) => {
    if (result.user) {
        console.log('[Login] Redirect result recebido');
        const isNewUser = result.additionalUserInfo?.isNewUser || false;
        await processarLogin(result.user, isNewUser);
    }
}).catch((error) => {
    console.error('[Login] Erro no redirect:', error);
    showMessage('Erro ao processar login. Tente novamente.', true);
});

// 🔥 MONITORAR ESTADO DE AUTENTICAÇÃO
firebase.auth().onAuthStateChanged(async (user) => {
    if (user && !localStorage.getItem('usuarioLogado')) {
        console.log('[Login] Usuário já autenticado:', user.email);
        await processarLogin(user, false);
    } else if (!user && localStorage.getItem('usuarioLogado')) {
        console.log('[Login] Usuário deslogado do Firebase, limpando cache');
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) window.CacheManager.logout();
    }
});

if (window.CacheManager) window.CacheManager.init();

console.log('%c🔐 Painel Zero - Login com Google (Firestore Ready)', 'color: #9333ea; font-size: 16px; font-weight: bold;');