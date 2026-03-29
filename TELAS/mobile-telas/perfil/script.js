// mobile-telas/perfil/script.js
let notifications = [];
let usuarioLogado = null;
let notificacoesSettings = {};
let appearanceSettings = {};
let selectedTheme = 'dark';
let selectedAccent = '#8b5cf6';

function showConfirm(message, title = 'Confirmar', callback) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) { callback?.(false); return; }
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    modal.classList.add('active');
    const btnOk = document.getElementById('confirm-ok');
    const btnCancel = document.getElementById('confirm-cancel');
    btnOk.onclick = () => { modal.classList.remove('active'); callback?.(true); };
    btnCancel.onclick = () => { modal.classList.remove('active'); callback?.(false); };
}

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
    toast.innerHTML = `<ion-icon name="${icons[type]}-outline"></ion-icon> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function saveAllData() {
    window.setCached('usuarioLogado', usuarioLogado);
    window.setCached('notifications', notifications);
    window.setCached('notificacoesSettings', notificacoesSettings);
    window.setCached('appearanceSettings', appearanceSettings);
}

function getDefaultNotifications() {
    return [
        { id: 1, type: 'aula', title: 'Aula de Matemática', message: 'Lembrete: Aula às 14h hoje', time: new Date().toISOString(), read: false },
        { id: 2, type: 'tarefa', title: 'Tarefa Pendente', message: 'Lista de Exercícios para amanhã', time: new Date().toISOString(), read: false },
        { id: 3, type: 'lembrete', title: 'Prova de História', message: 'Sua prova será na próxima segunda', time: new Date().toISOString(), read: false }
    ];
}

function loadAllData() {
    usuarioLogado = window.getCached('usuarioLogado', null);
    notifications = window.getCached('notifications', getDefaultNotifications());
    notificacoesSettings = window.getCached('notificacoesSettings', { push: true, email: false, aulas: true, tarefas: true });
    appearanceSettings = window.getCached('appearanceSettings', { theme: 'dark', accent: '#8b5cf6', fontSize: 14 });
    if (appearanceSettings.accent) { document.documentElement.style.setProperty('--accent-purple', appearanceSettings.accent); }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function formatNotificationTime(timeString) {
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMins = Math.floor((now - notifTime) / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    return notifTime.toLocaleDateString('pt-BR');
}

function renderNotificationsModal(filter = 'all') {
    const list = document.getElementById('notifications-list-modal');
    let filtered = notifications;
    if (filter === 'unread') filtered = notifications.filter(n => !n.read);
    else if (filter === 'aulas') filtered = notifications.filter(n => n.type === 'aula');
    else if (filter === 'tarefas') filtered = notifications.filter(n => n.type === 'tarefa');
    if (filtered.length === 0) { list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)">Nenhuma notificação</div>'; return; }
    let html = '';
    filtered.forEach(notif => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}"><div class="notification-icon ${notif.type}"><ion-icon name="${iconMap[notif.type]}-outline"></ion-icon></div><div class="notification-content"><div class="notification-title">${notif.title}</div><div class="notification-message">${notif.message}</div><div class="notification-time">${formatNotificationTime(notif.time)}</div></div></div>`;
    });
    list.innerHTML = html;
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationsModal();
    window.setCached('notifications', notifications);
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            window.setCached('notifications', notifications);
            showToast('Notificações limpas!', 'success');
        }
    });
}

function loadProfileData() {
    if (usuarioLogado) {
        const nameInput = document.getElementById('profile-name-input');
        const emailInput = document.getElementById('profile-email-input');
        const avatarPreview = document.getElementById('avatar-preview');
        if (nameInput) nameInput.value = usuarioLogado.nome || '';
        if (emailInput) emailInput.value = usuarioLogado.email || '';
        if (avatarPreview) avatarPreview.textContent = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
    }
}

function loadNotificacoes() {
    const push = document.getElementById('toggle-push');
    const email = document.getElementById('toggle-email');
    const aulas = document.getElementById('toggle-aulas');
    const tarefas = document.getElementById('toggle-tarefas');
    if (push) push.checked = notificacoesSettings.push;
    if (email) email.checked = notificacoesSettings.email;
    if (aulas) aulas.checked = notificacoesSettings.aulas;
    if (tarefas) tarefas.checked = notificacoesSettings.tarefas;
}

function loadAparencia() {
    selectedTheme = appearanceSettings.theme;
    selectedAccent = appearanceSettings.accent;
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === selectedTheme));
    document.querySelectorAll('#aparencia-modal .color-option').forEach(option => option.classList.toggle('active', option.dataset.accent === selectedAccent));
    const slider = document.getElementById('font-size-slider');
    if (slider) slider.value = appearanceSettings.fontSize;
}

window.toggleFaq = function(element) { element.classList.toggle('active'); };

function switchView(viewName) {
    if (viewName === 'home') window.location.href = '../index.html';
    else if (viewName === 'calendar') window.location.href = '../calendario/index.html';
    else if (viewName === 'tasks') window.location.href = '../tarefas/index.html';
    else if (viewName === 'notes') window.location.href = '../notas/index.html';
    else if (viewName === 'profile') loadProfileData();
    document.querySelectorAll('.nav-item').forEach(nav => { nav.classList.toggle('active', nav.dataset.view === viewName); });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.CacheManager) window.CacheManager.init();
    loadAllData();
    if (usuarioLogado) {
        const headerName = document.getElementById('header-name');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileInitial = document.getElementById('profile-initial');
        if (headerName) headerName.textContent = usuarioLogado.nome.split(' ')[0];
        if (profileName) profileName.textContent = usuarioLogado.nome;
        if (profileEmail) profileEmail.textContent = usuarioLogado.email;
        if (profileInitial) profileInitial.textContent = usuarioLogado.nome.charAt(0).toUpperCase();
    }
    updateNotificationBadge();
    document.getElementById('notification-bell')?.addEventListener('click', () => { document.getElementById('notifications-modal').classList.add('active'); renderNotificationsModal(); });
    document.getElementById('btn-close-notifications')?.addEventListener('click', () => { document.getElementById('notifications-modal').classList.remove('active'); });
    document.getElementById('btn-mark-read')?.addEventListener('click', markAllAsRead);
    document.getElementById('btn-clear-all')?.addEventListener('click', clearAllNotifications);
    document.querySelectorAll('.notification-tab').forEach(tab => { tab.addEventListener('click', () => { document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); renderNotificationsModal(tab.dataset.type); }); });
    const profileMenuItems = document.querySelectorAll('.profile-menu .menu-item:not(.logout)');
    profileMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'dados') { document.getElementById('dados-modal')?.classList.add('active'); loadProfileData(); }
            else if (action === 'seguranca') { document.getElementById('seguranca-modal')?.classList.add('active'); }
            else if (action === 'notificacoes') { document.getElementById('notificacoes-modal')?.classList.add('active'); loadNotificacoes(); }
            else if (action === 'aparencia') { document.getElementById('aparencia-modal')?.classList.add('active'); loadAparencia(); }
            else if (action === 'ajuda') { document.getElementById('ajuda-modal')?.classList.add('active'); }
        });
    });
    document.querySelectorAll('.btn-back').forEach(btn => { btn.addEventListener('click', () => { const modalId = btn.dataset.modal; if (modalId) closeModal(modalId); }); });
    document.querySelectorAll('[data-modal]').forEach(btn => { btn.addEventListener('click', () => { const modalId = btn.dataset.modal; if (modalId) closeModal(modalId); }); });
    document.getElementById('btn-save-dados')?.addEventListener('click', () => {
        const nome = document.getElementById('profile-name-input')?.value.trim();
        const email = document.getElementById('profile-email-input')?.value.trim();
        if (!nome || !email) { showToast('Preencha nome e e-mail!', 'error'); return; }
        usuarioLogado.nome = nome;
        usuarioLogado.email = email;
        saveAllData();
        const headerName = document.querySelector('.greeting h1');
        const profileName = document.querySelector('.profile-name');
        const profileEmail = document.querySelector('.profile-email');
        const profileInitial = document.getElementById('profile-initial');
        const avatarPreview = document.getElementById('avatar-preview');
        if (headerName) headerName.textContent = nome.split(' ')[0];
        if (profileName) profileName.textContent = nome;
        if (profileEmail) profileEmail.textContent = email;
        if (profileInitial) profileInitial.textContent = nome.charAt(0).toUpperCase();
        if (avatarPreview) avatarPreview.textContent = nome.charAt(0).toUpperCase();
        closeModal('dados-modal');
        showToast('Dados atualizados!', 'success');
    });
    document.getElementById('btn-save-senha')?.addEventListener('click', () => {
        const newPassword = document.getElementById('new-password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        if (!newPassword || !confirmPassword) { showToast('Preencha todos os campos!', 'error'); return; }
        if (newPassword.length < 6) { showToast('Senha deve ter 6+ caracteres!', 'error'); return; }
        if (newPassword !== confirmPassword) { showToast('Senhas não coincidem!', 'error'); return; }
        closeModal('seguranca-modal');
        showToast('Senha alterada!', 'success');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    });
    document.getElementById('btn-save-notificacoes')?.addEventListener('click', () => {
        notificacoesSettings = {
            push: document.getElementById('toggle-push')?.checked,
            email: document.getElementById('toggle-email')?.checked,
            aulas: document.getElementById('toggle-aulas')?.checked,
            tarefas: document.getElementById('toggle-tarefas')?.checked
        };
        saveAllData();
        closeModal('notificacoes-modal');
        showToast('Notificações salvas!', 'success');
    });
    document.querySelectorAll('.theme-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedTheme = btn.dataset.theme; }); });
    document.querySelectorAll('#aparencia-modal .color-option').forEach(option => { option.addEventListener('click', () => { document.querySelectorAll('#aparencia-modal .color-option').forEach(o => o.classList.remove('active')); option.classList.add('active'); selectedAccent = option.dataset.accent; }); });
    document.getElementById('btn-save-aparencia')?.addEventListener('click', () => {
        appearanceSettings = { theme: selectedTheme, accent: selectedAccent, fontSize: document.getElementById('font-size-slider')?.value || 14 };
        saveAllData();
        document.documentElement.style.setProperty('--accent-purple', selectedAccent);
        closeModal('aparencia-modal');
        showToast('Aparência salva!', 'success');
    });
    document.getElementById('btn-contato')?.addEventListener('click', () => { window.open('https://wa.me/5500000000000', '_blank'); });
    document.getElementById('btn-termos')?.addEventListener('click', () => { showToast('Termos de Uso em desenvolvimento!', 'info'); });
    document.getElementById('btn-privacidade')?.addEventListener('click', () => { showToast('Política de Privacidade em desenvolvimento!', 'info'); });
    document.getElementById('btn-avaliar')?.addEventListener('click', () => { showToast('Obrigado por avaliar! ⭐⭐⭐⭐⭐', 'success'); });
    document.querySelector('.menu-item.logout')?.addEventListener('click', () => {
        showConfirm('Deseja realmente sair da conta?', 'Sair', (confirmed) => {
            if (confirmed) {
                localStorage.removeItem('usuarioLogado');
                window.location.href = '../index.html';
            }
        });
    });
    document.querySelectorAll('.nav-item').forEach(item => { item.addEventListener('click', () => switchView(item.dataset.view)); });
});
