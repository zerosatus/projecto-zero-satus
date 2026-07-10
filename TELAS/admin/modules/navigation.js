// ==========================================
// navigation.js - NAVEGAÇÃO ENTRE SEÇÕES
// ==========================================

console.log('[Navigation] 🧭 Inicializando navegação...');

// ==========================================
// CONFIGURAR NAVEGAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Navigation] Configurando sidebar...');
    
    const links = document.querySelectorAll('.sidebar-menu a[data-target]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('data-target');
            if (!targetId) return;
            
            // Atualizar active na sidebar
            document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
            
            // Mostrar seção
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active');

            // Carregar dados conforme a seção
            switch(targetId) {
                case 'dashboard':
                    if (typeof loadDashboardStats === 'function') loadDashboardStats();
                    break;
                case 'users':
                    if (typeof loadUsers === 'function') loadUsers();
                    break;
                case 'posts':
                    if (typeof loadPosts === 'function') loadPosts();
                    break;
                case 'comments':
                    if (typeof loadComments === 'function') loadComments();
                    break;
                case 'notifications':  /* ← ADICIONADO */
                    if (typeof loadNotifications === 'function') loadNotifications();
                    break;
                case 'logs':
                    if (typeof loadAuditLogs === 'function') loadAuditLogs();
                    break;
                case 'reports':
                    if (typeof loadReports === 'function') loadReports();
                    break;
                case 'settings':
                    // Configurações - sem ação específica
                    break;
            }
        });
    });
    
    console.log('[Navigation] ✅ Navegação configurada!');
});

console.log('[Navigation] ✅ navigation.js carregado!');