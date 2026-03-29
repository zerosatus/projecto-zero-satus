import { firebaseAPI } from './firebase-config.js';

async function checkAuthAndRedirect() {
    return new Promise((resolve) => {
        firebaseAPI.initAuth(async (isAuthenticated, user) => {
            if (!isAuthenticated) {
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
            resolve(true);
        });
    });
}

async function handleLogout() {
    const result = await firebaseAPI.logout();
    if (result.success) {
        window.location.href = '../login/index.html';
    } else {
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.innerHTML = '<ion-icon name="close-circle-outline"></ion-icon> <span>Erro ao sair da conta</span>';
        document.getElementById('toast-container')?.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

window.mobileAuth = { checkAuthAndRedirect, handleLogout };
