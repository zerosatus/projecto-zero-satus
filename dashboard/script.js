// ============================================
// VERIFICAÇÃO DE LOGIN
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        const userData = JSON.parse(usuario);
        const welcomeTitle = document.querySelector('.header h2');
        if (welcomeTitle && userData.nome) {
            welcomeTitle.textContent = `Bem-vindo, ${userData.nome}!`;
        }
    } catch (e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ============================================
// DESTACAR MENU ITEM ATIVO (sem bloquear links!)
// ============================================
const menuItems = document.querySelectorAll('.menu-item');

menuItems.forEach(item => {
    item.addEventListener('click', function() {
        // Remove active de todos
        menuItems.forEach(link => link.classList.remove('active'));
        // Adiciona active no clicado
        this.classList.add('active');
        // ✅ NÃO usa e.preventDefault() - os links funcionam!
    });
});

// ============================================
// FUNÇÃO DE LOGOUT
// ============================================
function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

// ============================================
// ANIMAÇÃO DOS BOTÕES DE ÍCONE (opcional)
// ============================================
const iconBtns = document.querySelectorAll('.icon-btn');
iconBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
});