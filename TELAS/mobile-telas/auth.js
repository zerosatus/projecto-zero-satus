import { firebaseAPI } from './firebase-config.js';

let offlineMode = false;

function showUpdatePopup(message, type = 'info') {
    const event = new CustomEvent('appUpdate', { detail: { message, type } });
    window.dispatchEvent(event);
}

async function checkAuthAndRedirect() {
    return new Promise((resolve) => {
        const cachedUser = window.getCached('usuarioLogado');
        
        if (!firebaseAPI.isOnline && cachedUser) {
            console.log('Modo offline - usando dados em cache');
            offlineMode = true;
            if (window.CacheManager) window.CacheManager.enableFirebaseSync();
            const headerName = document.getElementById('header-name');
            if (headerName && cachedUser.nome) {
                headerName.textContent = cachedUser.nome.split(' ')[0];
            }
            showUpdatePopup('Modo offline - dados salvos localmente', 'info');
            resolve(true);
            return;
        }
        
        firebaseAPI.initAuth(async (isAuthenticated, user) => {
            if (!isAuthenticated && !cachedUser) {
                const currentPath = window.location.pathname;
                if (!currentPath.includes('login.html') && !currentPath.includes('index.html')) {
                    window.location.href = '../login/index.html';
                }
                resolve(false);
                return;
            }
            
            if (window.CacheManager) window.CacheManager.enableFirebaseSync();
            
            const userData = window.getCached('usuarioLogado');
            if (userData && userData.nome) {
                const headerName = document.getElementById('header-name');
                if (headerName) headerName.textContent = userData.nome.split(' ')[0];
            }
            
            if (firebaseAPI.isOnline && !firebaseAPI.isOnline()) {
                showUpdatePopup('Conexão perdida - modo offline ativado', 'info');
            } else if (isAuthenticated) {
                showUpdatePopup('Conectado à nuvem - dados sincronizados', 'success');
            }
            
            resolve(true);
        });
    });
}

async function handleLogout() {
    const result = await firebaseAPI.logout();
    if (result.success) {
        showUpdatePopup('Logout realizado com sucesso!', 'success');
        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 500);
    } else {
        showUpdatePopup('Erro ao sair da conta', 'error');
    }
}

window.mobileAuth = { checkAuthAndRedirect, handleLogout };

window.addEventListener('connectionChange', (e) => {
    if (e.detail.online) {
        showUpdatePopup('Conexão restaurada! Sincronizando dados...', 'success');
        if (window.CacheManager) {
            window.CacheManager.processSyncQueue();
        }
    } else {
        showUpdatePopup('Sem conexão - trabalhando offline', 'info');
    }
});
