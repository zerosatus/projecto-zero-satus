// Notas - Gerenciamento de anotações MOBILE
let notifications = [];
let notes = [];
let usuarioLogado = null;
let editingNoteId = null;

// ============================================
// TOAST & CONFIRM
// ============================================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
    toast.innerHTML = `<ion-icon name="${icons[type]}-outline"></ion-icon> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showConfirm(message, title, callback) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) { 
        if (callback) callback(false); 
        return; 
    }
    document.getElementById('confirm-title').textContent = title || 'Confirmar';
    document.getElementById('confirm-message').textContent = message;
    modal.classList.add('active');

    const handleConfirm = () => {
        modal.classList.remove('active');
        if (callback) callback(true);
        cleanup();
    };

    const handleCancel = () => {
        modal.classList.remove('active');
        if (callback) callback(false);
        cleanup();
    };

    const cleanup = () => {
        document.getElementById('confirm-ok').removeEventListener('click', handleConfirm);
        document.getElementById('confirm-cancel').removeEventListener('click', handleCancel);
    };

    document.getElementById('confirm-ok').onclick = handleConfirm;
    document.getElementById('confirm-cancel').onclick = handleCancel;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// PERSISTÊNCIA
// ============================================
function saveAllData() {
    if (window.setCached) {
        window.setCached('usuarioLogado', usuarioLogado);
        window.setCached('notifications', notifications);
        window.setCached('notes', notes);
    }
}

function loadAllData() {
    if (window.getCached && window.getDefaultUser) {
        usuarioLogado = window.getCached('usuarioLogado', window.getDefaultUser());
    } else {
        usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    }
    
    if (!usuarioLogado || !usuarioLogado.email) {
        window.location.href = '../../login/index.html';
        return;
    }

    if (window.getCached && window.getDefaultNotifications && window.getDefaultNotes) {
        notifications = window.getCached('notifications', window.getDefaultNotifications());
        notes = window.getCached('notes', window.getDefaultNotes());
    }
}

// ============================================
// NOTIFICAÇÕES
// ============================================
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const unreadCount = notifications.filter(n => !n.read).length;
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
}

function formatTimeAgo(timeString) {
    if (!timeString) return '';
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
    if (!list) return;
    
    let filtered = [...notifications];
    if (filter === 'unread') filtered = notifications.filter(n => !n.read);
    else if (filter === 'aulas') filtered = notifications.filter(n => n.type === 'aula');
    else if (filter === 'tarefas') filtered = notifications.filter(n => n.type === 'tarefa');

    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)">Nenhuma notificação</div>';
        return;
    }

    let html = '';
    filtered.forEach(notif => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                <ion-icon name="${iconMap[notif.type] || 'notifications'}-outline"></ion-icon>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                <div class="notification-time">${formatTimeAgo(notif.time)}</div>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationsModal();
    saveAllData();
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            saveAllData();
            showToast('Notificações limpas!', 'success');
        }
    });
}

// ============================================
// ANOTAÇÕES - RENDERIZAÇÃO
// ============================================
function renderNotes(searchTerm = '') {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) return;
    
    let filteredNotes = [...notes];
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredNotes = notes.filter(note =>
            (note.title && note.title.toLowerCase().includes(term)) ||
            (note.content && note.content.toLowerCase().includes(term))
        );
    }

    filteredNotes.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `<div class="empty-notes-minimal">
            <ion-icon name="document-text-outline"></ion-icon>
            <p>${searchTerm ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação ainda'}</p>
        </div>`;
        return;
    }

    let html = '';
    filteredNotes.forEach(note => {
        const dateFormatted = note.date ? new Date(note.date).toLocaleDateString('pt-BR') : '';
        const preview = note.content ? note.content.substring(0, 80).replace(/\n/g, ' ').replace(/<[^>]*>/g, '') : '';
        html += `<div class="note-card-minimal" data-id="${note.id}">
            <div class="note-title-minimal">${escapeHtml(note.title || 'Sem título')}</div>
            <div class="note-preview-minimal">${escapeHtml(preview)}${preview.length >= 80 ? '...' : ''}</div>
            <div class="note-footer-minimal">
                <div class="note-date-minimal">${dateFormatted}</div>
                <div class="note-actions-minimal">
                    <ion-icon name="create-outline" class="edit-note" data-id="${note.id}"></ion-icon>
                    <ion-icon name="trash-outline" class="delete-note" data-id="${note.id}"></ion-icon>
                </div>
            </div>
        </div>`;
    });
    notesGrid.innerHTML = html;

    document.querySelectorAll('.note-card-minimal').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.note-actions-minimal')) return;
            const noteId = card.dataset.id;
            const note = notes.find(n => n.id == noteId);
            if (note) openNoteModal(note);
        });
    });

    document.querySelectorAll('.edit-note').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = icon.dataset.id;
            const note = notes.find(n => n.id == noteId);
            if (note) openNoteModal(note);
        });
    });

    document.querySelectorAll('.delete-note').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = icon.dataset.id;
            showConfirm('Excluir esta anotação?', 'Excluir Anotação', (confirmed) => {
                if (confirmed) {
                    notes = notes.filter(n => n.id != noteId);
                    saveAllData();
                    const searchInput = document.getElementById('notes-search-input');
                    renderNotes(searchInput ? searchInput.value : '');
                    showToast('Anotação excluída!', 'success');
                }
            });
        });
    });
}

// ============================================
// MODAL DE ANOTAÇÃO - ESTILO SAMSUNG NOTES
// ============================================
function openNoteModal(note) {
    const modal = document.getElementById('note-modal');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const dateDisplay = document.getElementById('note-date-display');
    if (!modal) return;

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

    modal.classList.add('active');
    
    // Ajustar altura do editor
    setTimeout(() => {
        ajustarAlturaEditor();
        if (contentInput) {
            contentInput.focus();
        }
    }, 100);
}

function closeNoteModal() {
    const modal = document.getElementById('note-modal');
    if (modal) modal.classList.remove('active');
    editingNoteId = null;
}

// ============================================
// AJUSTE DE ALTURA - TECLADO
// ============================================
function ajustarAlturaEditor() {
    const editorWrapper = document.querySelector('.samsung-editor-wrapper');
    const header = document.querySelector('.samsung-header');
    const toolbar = document.querySelector('.samsung-toolbar');
    const footer = document.querySelector('.note-footer-info');

    if (!editorWrapper) return;

    let viewportHeight = window.innerHeight;

    if (window.visualViewport) {
        viewportHeight = window.visualViewport.height;
    }

    const headerHeight = header ? header.offsetHeight : 0;
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
    const footerHeight = footer ? footer.offsetHeight : 0;

    const editorHeight = viewportHeight - headerHeight - toolbarHeight - footerHeight;
    editorWrapper.style.height = editorHeight + 'px';
}

// ============================================
// FORMATAÇÃO DE TEXTO
// ============================================
function formatText(command, value = null) {
    document.execCommand(command, false, value);
    const editor = document.getElementById('note-content-input');
    if (editor) editor.focus();
    updateToolbarState();
}

function updateToolbarState() {
    document.querySelectorAll('.samsung-toolbar-btn[data-command]').forEach(btn => {
        const command = btn.dataset.command;
        if (['bold', 'italic', 'underline', 'strikeThrough'].includes(command)) {
            btn.classList.toggle('active', document.queryCommandState(command));
        }
    });
}

// ============================================
// NAVEGAÇÃO
// ============================================
function switchView(viewName) {
    if (viewName === 'home') window.location.href = '../index.html';
    else if (viewName === 'calendar') window.location.href = '../calendario/index.html';
    else if (viewName === 'tasks') window.location.href = '../tarefas/index.html';
    else if (viewName === 'notes') renderNotes();
    else if (viewName === 'profile') window.location.href = '../perfil/index.html';
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📝 DOMContentLoaded - Iniciando anotações mobile');
    
    if (window.CacheManager && window.CacheManager.init) {
        window.CacheManager.init();
    }
    
    loadAllData();

    if (usuarioLogado) {
        const nomeExibicao = usuarioLogado.nome || usuarioLogado.displayName || usuarioLogado.email.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
    }

    updateNotificationBadge();
    renderNotes();

    // Notificações
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            console.log('🔔 Click notificação');
            const modal = document.getElementById('notifications-modal');
            if (modal) {
                modal.classList.add('active');
                renderNotificationsModal();
            }
        });
    }

    const btnCloseNotifications = document.getElementById('btn-close-notifications');
    if (btnCloseNotifications) {
        btnCloseNotifications.addEventListener('click', () => {
            const modal = document.getElementById('notifications-modal');
            if (modal) modal.classList.remove('active');
        });
    }

    const btnMarkRead = document.getElementById('btn-mark-read');
    if (btnMarkRead) {
        btnMarkRead.addEventListener('click', markAllAsRead);
    }
    
    const btnClearAll = document.getElementById('btn-clear-all');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', clearAllNotifications);
    }

    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });

    // Busca
    const searchInput = document.getElementById('notes-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderNotes(e.target.value));
    }

    // ✅ BOTÃO ADICIONAR
    const btnAddNote = document.getElementById('btn-add-note');
    if (btnAddNote) {
        btnAddNote.addEventListener('click', () => {
            console.log('➕ Botão adicionar clicado!');
            openNoteModal(null);
        });
    } else {
        console.error('❌ Botão btn-add-note não encontrado!');
    }

    // Fechar modal (voltar)
    const noteModalBack = document.getElementById('note-modal-back');
    if (noteModalBack) {
        noteModalBack.addEventListener('click', closeNoteModal);
    }

    // Salvar anotação
    const btnSaveNote = document.getElementById('btn-save-note');
    if (btnSaveNote) {
        btnSaveNote.addEventListener('click', () => {
            console.log('💾 Salvando anotação...');
            const titleInput = document.getElementById('note-title-input');
            const contentInput = document.getElementById('note-content-input');
            
            const title = titleInput ? titleInput.value.trim() : '';
            const content = contentInput ? contentInput.value.trim() : '';
            
            if (!title && !content) {
                showToast('Adicione um título ou conteúdo!', 'error');
                return;
            }
            
            const now = new Date().toISOString();
            
            if (editingNoteId) {
                const noteIndex = notes.findIndex(n => n.id == editingNoteId);
                if (noteIndex > -1) {
                    notes[noteIndex] = {
                        ...notes[noteIndex],
                        title: title || 'Sem título',
                        content: content || '',
                        date: now
                    };
                }
            } else {
                notes.unshift({
                    id: Date.now(),
                    title: title || 'Sem título',
                    content: content || '',
                    date: now
                });
            }
            
            saveAllData();
            renderNotes(searchInput ? searchInput.value : '');
            closeNoteModal();
            showToast(editingNoteId ? 'Anotação atualizada!' : 'Anotação criada!', 'success');
        });
    }

    // Toolbar de formatação
    document.querySelectorAll('.samsung-toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            formatText(command);
        });
    });

    // Seletor de formato
    const formatSelect = document.getElementById('samsung-format-select');
    if (formatSelect) {
        formatSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            formatText('formatBlock', value);
        });
    }

    // Atualizar toolbar ao digitar
    const editor = document.getElementById('note-content-input');
    if (editor) {
        editor.addEventListener('keyup', updateToolbarState);
        editor.addEventListener('mouseup', updateToolbarState);
        editor.addEventListener('click', updateToolbarState);
    }

    // Ajuste de altura quando teclado abre
    ajustarAlturaEditor();
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', ajustarAlturaEditor);
        window.visualViewport.addEventListener('scroll', ajustarAlturaEditor);
    }
    window.addEventListener('resize', ajustarAlturaEditor);

    // Bottom nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.dataset.view;
            console.log('🔄 Navegando para:', viewName);
            switchView(viewName);
        });
    });
    
    console.log('✅ Inicialização concluída!');
});

// ============================================
// NOTIFICAÇÕES NATIVAS ANDROID
// ============================================
function isAndroidApp() {
    return typeof Android !== 'undefined';
}

function sendNativeNotification(title, message, type) {
    if (isAndroidApp()) {
        try {
            Android.showNotification(title, message, type);
        } catch(e) {
            console.log('Erro notificação nativa:', e);
        }
    }
}

function checkPendingTasks() {
    if (!window.getCached) return;
    const tasks = window.getCached('tasks', []);
    const today = new Date().toISOString().split('T')[0];
    tasks.forEach(task => {
        if (!task.completed && task.date === today) {
            sendNativeNotification('📋 Tarefa Hoje', task.title, 'tarefa');
        }
    });
}

function checkUpcomingClasses() {
    if (!window.getCached) return;
    const schedule = window.getCached('weeklySchedule', {});
    const now = new Date();
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = days[now.getDay()];
    const currentTotal = now.getHours() * 60 + now.getMinutes();
    
    if (schedule[today]) {
        schedule[today].forEach(cls => {
            if (cls.horaInicio) {
                const [h, m] = cls.horaInicio.split(':').map(Number);
                const minutesUntil = (h * 60 + m) - currentTotal;
                if (minutesUntil <= 15 && minutesUntil > 0) {
                    sendNativeNotification('📚 Aula em Breve', cls.materia, 'aula');
                }
            }
        });
    }
}

// Executar verificações
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => { checkPendingTasks(); checkUpcomingClasses(); }, 2000);
        setInterval(() => { checkPendingTasks(); checkUpcomingClasses(); }, 15 * 60 * 1000);
    });
} else {
    setTimeout(() => { checkPendingTasks(); checkUpcomingClasses(); }, 2000);
    setInterval(() => { checkPendingTasks(); checkUpcomingClasses(); }, 15 * 60 * 1000);
}