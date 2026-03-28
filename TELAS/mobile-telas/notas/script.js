// mobile-telas/notas/script.js
let notifications = [];
let notes = [];
let usuarioLogado = null;
let editingNoteId = null;

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
    const existingToast = container.querySelector('.toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
    toast.innerHTML = `<ion-icon name="${icons[type]}-outline"></ion-icon> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

function saveAllData() {
    window.setCached('usuarioLogado', usuarioLogado);
    window.setCached('notifications', notifications);
    window.setCached('notes', notes);
}

function getDefaultNotifications() {
    return [
        { id: 1, type: 'aula', title: 'Aula de Matemática', message: 'Lembrete: Aula às 14h hoje', time: new Date().toISOString(), read: false },
        { id: 2, type: 'tarefa', title: 'Tarefa Pendente', message: 'Lista de Exercícios para amanhã', time: new Date().toISOString(), read: false },
        { id: 3, type: 'lembrete', title: 'Prova de História', message: 'Sua prova será na próxima segunda', time: new Date().toISOString(), read: false }
    ];
}

function getDefaultNotes() {
    return [
        { id: Date.now() - 1000, title: 'Fórmulas de Física', content: 'F = m * a\nE = m * c²', date: new Date().toISOString() },
        { id: Date.now() - 2000, title: 'Vocabulário Inglês', content: 'Apple - Maçã\nBook - Livro', date: new Date().toISOString() }
    ];
}

function loadAllData() {
    usuarioLogado = window.getCached('usuarioLogado', null);
    notifications = window.getCached('notifications', getDefaultNotifications());
    notes = window.getCached('notes', getDefaultNotes());
    if (window.onCacheChange) {
        window.onCacheChange('notes', (newNotes) => { if (newNotes) { notes = newNotes; renderNotes(document.getElementById('notes-search-input')?.value || ''); } });
    }
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

function renderNotes(searchTerm = '') {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) return;
    let filteredNotes = notes;
    if (searchTerm) filteredNotes = notes.filter(note => note.title.toLowerCase().includes(searchTerm.toLowerCase()) || (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase())));
    filteredNotes.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `<div class="empty-notes-minimal"><ion-icon name="document-text-outline"></ion-icon><p>${searchTerm ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação ainda'}</p></div>`;
        return;
    }
    let html = '';
    filteredNotes.forEach(note => {
        const dateFormatted = note.date ? new Date(note.date).toLocaleDateString('pt-BR') : '';
        const preview = note.content ? note.content.substring(0, 100) : '';
        html += `<div class="note-card-minimal" data-id="${note.id}"><div class="note-title-minimal">${note.title || 'Sem título'}</div><div class="note-preview-minimal">${preview}${preview.length >= 100 ? '...' : ''}</div><div class="note-footer-minimal"><div class="note-date-minimal">${dateFormatted}</div><div class="note-actions-minimal"><ion-icon name="create-outline" class="edit-note" data-id="${note.id}"></ion-icon><ion-icon name="trash-outline" class="delete-note" data-id="${note.id}"></ion-icon></div></div></div>`;
    });
    notesGrid.innerHTML = html;
    document.querySelectorAll('.note-card-minimal').forEach(card => {
        card.addEventListener('click', (e) => { if (e.target.closest('.note-actions-minimal')) return; const noteId = card.dataset.id; const note = notes.find(n => n.id == noteId); if (note) openNoteModal(note); });
    });
    document.querySelectorAll('.edit-note').forEach(icon => { icon.addEventListener('click', (e) => { e.stopPropagation(); const noteId = icon.dataset.id; const note = notes.find(n => n.id == noteId); if (note) openNoteModal(note); }); });
    document.querySelectorAll('.delete-note').forEach(icon => { icon.addEventListener('click', (e) => { e.stopPropagation(); const noteId = icon.dataset.id; showConfirm('Excluir esta anotação?', 'Excluir Anotação', (confirmed) => { if (confirmed) { notes = notes.filter(n => n.id != noteId); saveAllData(); renderNotes(); showToast('Anotação excluída!', 'success'); } }); }); });
}

function openNoteModal(note) {
    const noteModal = document.getElementById('note-modal');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const dateDisplay = document.getElementById('note-date-display');
    if (!noteModal) return;
    editingNoteId = note ? note.id : null;
    if (note) {
        if (titleInput) titleInput.value = note.title || '';
        if (contentInput) contentInput.value = note.content || '';
        if (dateDisplay) dateDisplay.textContent = note.date ? new Date(note.date).toLocaleString('pt-BR') : '';
    } else {
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
        if (dateDisplay) dateDisplay.textContent = new Date().toLocaleString('pt-BR');
    }
    noteModal.classList.add('active');
}

function switchView(viewName) {
    if (viewName === 'home') window.location.href = '../index.html';
    else if (viewName === 'calendar') window.location.href = '../calendario/index.html';
    else if (viewName === 'tasks') window.location.href = '../tarefas/index.html';
    else if (viewName === 'notes') renderNotes();
    else if (viewName === 'profile') window.location.href = '../perfil/index.html';
    document.querySelectorAll('.nav-item').forEach(nav => { nav.classList.toggle('active', nav.dataset.view === viewName); });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.CacheManager) window.CacheManager.init();
    loadAllData();
    if (usuarioLogado) { const headerName = document.getElementById('header-name'); if (headerName) headerName.textContent = usuarioLogado.nome.split(' ')[0]; }
    updateNotificationBadge();
    renderNotes();
    document.getElementById('notification-bell')?.addEventListener('click', () => { document.getElementById('notifications-modal').classList.add('active'); renderNotificationsModal(); });
    document.getElementById('btn-close-notifications')?.addEventListener('click', () => { document.getElementById('notifications-modal').classList.remove('active'); });
    document.getElementById('btn-mark-read')?.addEventListener('click', markAllAsRead);
    document.getElementById('btn-clear-all')?.addEventListener('click', clearAllNotifications);
    document.querySelectorAll('.notification-tab').forEach(tab => { tab.addEventListener('click', () => { document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); renderNotificationsModal(tab.dataset.type); }); });
    document.getElementById('notes-search-input')?.addEventListener('input', (e) => renderNotes(e.target.value));
    document.getElementById('btn-add-note')?.addEventListener('click', () => openNoteModal(null));
    document.getElementById('note-modal-back')?.addEventListener('click', () => { document.getElementById('note-modal').classList.remove('active'); });
    document.getElementById('btn-save-note')?.addEventListener('click', () => {
        const title = document.getElementById('note-title-input')?.value.trim();
        const content = document.getElementById('note-content-input')?.value.trim();
        if (!title && !content) { showToast('Adicione um título ou conteúdo!', 'error'); return; }
        const now = new Date().toISOString();
        if (editingNoteId) {
            const noteIndex = notes.findIndex(n => n.id == editingNoteId);
            if (noteIndex > -1) notes[noteIndex] = { ...notes[noteIndex], title: title || 'Sem título', content: content, date: now };
        } else { notes.unshift({ id: Date.now(), title: title || 'Sem título', content: content, date: now }); }
        saveAllData();
        renderNotes();
        document.getElementById('note-modal').classList.remove('active');
        showToast(editingNoteId ? 'Anotação atualizada!' : 'Anotação criada!', 'success');
    });
    document.querySelectorAll('.nav-item').forEach(item => { item.addEventListener('click', () => switchView(item.dataset.view)); });
});
