// Navegação entre seções via sidebar
console.log('[Navigation] Inicializando navegação...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Navigation] Configurando sidebar...');
    document.querySelectorAll('.sidebar-menu a[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active');

            // Carregar dados conforme a seção
            if (targetId === 'users' && typeof loadUsers === 'function') loadUsers();
            if (targetId === 'posts' && typeof loadPosts === 'function') loadPosts();
            if (targetId === 'comments' && typeof loadComments === 'function') loadComments();
            if (targetId === 'logs' && typeof loadAuditLogs === 'function') loadAuditLogs();
            if (targetId === 'reports' && typeof loadReports === 'function') loadReports();
             if (targetId === 'notifications' && typeof loadNotifications === 'function') loadNotifications();
        });
    });
});
console.log('[Navigation] ✅ navigation.js carregado!');
