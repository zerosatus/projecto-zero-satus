// ============================================
// modules/perfil.js - PERFIL
// ============================================

class PerfilModule {
    constructor(app) {
        this.app = app;
        this.name = 'perfil';
        console.log('[Perfil] 👤 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Perfil] 👤 Renderizando...');
        this.renderProfile(data);
        this.setupEvents();
    }
    
    renderProfile(data) {
        const profile = data.profile || {};
        const settings = data.settings || {};
        
        // Nome e email
        document.getElementById('profile-name').textContent = profile.nome || 'Usuário';
        document.getElementById('profile-email').textContent = profile.email || 'usuario@email.com';
        
        // Inicial do avatar
        const initial = profile.nome ? profile.nome.charAt(0).toUpperCase() : 'U';
        document.getElementById('profile-initial').textContent = initial;
        
        // Foto de perfil (se tiver)
        if (profile.avatar_url) {
            const avatar = document.getElementById('profile-avatar');
            avatar.innerHTML = `<img src="${profile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        }
    }
    
    setupEvents() {
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                
                switch(action) {
                    case 'dados':
                        alert('Dados Pessoais (em breve)');
                        break;
                    case 'seguranca':
                        alert('Segurança (em breve)');
                        break;
                    case 'notificacoes':
                        alert('Notificações (em breve)');
                        break;
                    case 'aparencia':
                        alert('Aparência (em breve)');
                        break;
                    case 'logout':
                        this.logout();
                        break;
                }
            });
        });
    }
    
    logout() {
        if (confirm('Deseja realmente sair da conta?')) {
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('userPhotoURL');
            if (window.CacheManager) window.CacheManager.logout();
            window.location.href = '../login/index.html';
        }
    }
}

console.log('[Perfil] ✅ Módulo carregado!');