// mobile-telas/notas/script.js - VERSÃO CORRIGIDA COM SINCRONIZAÇÃO

let notifications = [];
let notes = [];
let usuarioLogado = null;
let editingNoteId = null;
let profilePhotoUnsubscribe = null;

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
// PERSISTÊNCIA (Integrada com CacheManager/Firebase)
// ============================================
async function salvarTodosDados() {
    if (!usuarioLogado) return false;
    
    console.log('[Mobile Notas] 💾 Salvando anotações...', notes.length);
    
    // Salvar no CacheManager (que já sincroniza com Firebase)
    if (window.CacheManager) {
        window.CacheManager.set('notes', notes, true);
        console.log('[Mobile Notas] ✅ Anotações salvas no CacheManager');
    }
    
    // Backup no localStorage
    const userId = usuarioLogado.uid || usuarioLogado.email;
    localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
    
    // Disparar evento para sincronizar com outras abas
    window.dispatchEvent(new CustomEvent('notesUpdated', { detail: { notes } }));
    window.dispatchEvent(new CustomEvent('forceRefresh'));
    
    return true;
}

function carregarDados() {
    if (!usuarioLogado) return;
    
    // Tentar carregar do CacheManager primeiro
    if (window.CacheManager) {
        const cachedNotes = window.CacheManager.get('notes', null);
        if (cachedNotes !== null && Array.isArray(cachedNotes)) {
            notes = cachedNotes;
            console.log('[Mobile Notas] Carregado do CacheManager:', notes.length);
            return;
        }
    }
    
    // Fallback para localStorage
    const userId = usuarioLogado.uid || usuarioLogado.email;
    const notesSalvas = localStorage.getItem(`${userId}_notes`);
    
    if (notesSalvas) {
        notes = JSON.parse(notesSalvas);
    } else {
        notes = [];
    }
    
    console.log('[Mobile Notas] Carregado do localStorage:', notes.length);
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
    
    // Carregar notificações
    if (window.getCached) {
        notifications = window.getCached('notifications', window.getDefaultNotifications());
    } else {
        notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    }
    
    carregarDados();
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
    if (window.CacheManager) window.CacheManager.set('notifications', notifications, true);
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            if (window.CacheManager) window.CacheManager.set('notifications', notifications, true);
            showToast('Notificações limpas!', 'success');
        }
    });
}

// ============================================
// NOTAS - RENDERIZAÇÃO
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
            showConfirm('Excluir esta anotação?', 'Excluir Anotação', async (confirmed) => {
                if (confirmed) {
                    notes = notes.filter(n => n.id != noteId);
                    await salvarTodosDados();
                    const searchInput = document.getElementById('notes-search-input');
                    renderNotes(searchInput ? searchInput.value : '');
                    showToast('Anotação excluída!', 'success');
                }
            });
        });
    });
}

// ============================================
// MODAL DE EDIÇÃO
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
        if (contentInput) contentInput.innerHTML = note.content || '';
        if (dateDisplay) dateDisplay.textContent = note.date ? new Date(note.date).toLocaleString('pt-BR') : '';
    } else {
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.innerHTML = '';
        if (dateDisplay) dateDisplay.textContent = new Date().toLocaleString('pt-BR');
    }

    modal.classList.add('active');
    
    setTimeout(() => {
        ajustarAlturaEditor();
        if (contentInput) contentInput.focus();
    }, 100);
}

function closeNoteModal() {
    const modal = document.getElementById('note-modal');
    if (modal) modal.classList.remove('active');
    editingNoteId = null;
}

// ============================================
// AJUSTE DE ALTURA (Teclado)
// ============================================
function ajustarAlturaEditor() {
    const editorWrapper = document.querySelector('.samsung-editor-wrapper');
    const header = document.querySelector('.samsung-header');
    const toolbar = document.querySelector('.samsung-toolbar-bottom');
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
// FUNÇÕES DE FOTO DE PERFIL
// ============================================
async function carregarFotoPerfilMobile() {
    if (!usuarioLogado) return;
    
    const profileIcon = document.getElementById('notification-bell');
    if (!profileIcon) return;
    
    if (window.CacheManager) {
        const photoUrl = await window.CacheManager.getProfilePhotoUrl();
        
        if (photoUrl && photoUrl.startsWith('data:')) {
            profileIcon.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            return;
        }
    }
    
    const iniciais = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
    profileIcon.innerHTML = `<span style="font-weight:bold;">${iniciais}</span>`;
}

function iniciarEscutaFotoMobile() {
    if (!usuarioLogado) return;
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    
    if (window.FirebaseStorage && window.FirebaseStorage.listenProfilePhoto) {
        profilePhotoUnsubscribe = window.FirebaseStorage.listenProfilePhoto(userId, (photoUrl) => {
            if (photoUrl && photoUrl.startsWith('data:')) {
                console.log('[Mobile Notas] Foto atualizada em tempo real!');
                const profileIcon = document.getElementById('notification-bell');
                if (profileIcon) {
                    profileIcon.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                }
            }
        });
    }
}

function pararEscutaFotoMobile() {
    if (profilePhotoUnsubscribe) {
        profilePhotoUnsubscribe();
        profilePhotoUnsubscribe = null;
    }
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📝 Iniciando anotações mobile com sincronização...');
    
    if (window.CacheManager) {
        window.CacheManager.init();
    }
    
    loadAllData();

    if (usuarioLogado) {
        const nomeExibicao = usuarioLogado.nome || usuarioLogado.displayName || usuarioLogado.email?.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
        carregarFotoPerfilMobile();
        iniciarEscutaFotoMobile();
    }

    updateNotificationBadge();
    renderNotes();

    // ===== ESCUTAR EVENTOS DE SINCRONIZAÇÃO =====
    window.addEventListener('cloudDataLoaded', (event) => {
        console.log('[Mobile Notas] Dados da nuvem carregados, atualizando...');
        const oldNotesCount = notes.length;
        carregarDados();
        renderNotes();
        if (oldNotesCount !== notes.length) {
            console.log(`[Mobile Notas] Anotações atualizadas: ${oldNotesCount} → ${notes.length}`);
            showToast('Anotações sincronizadas!', 'success');
        }
    });
    
    window.addEventListener('notesUpdated', (event) => {
        if (event.detail && event.detail.notes) {
            console.log('[Mobile Notas] Recebido notesUpdated, atualizando lista...');
            notes = event.detail.notes;
            renderNotes();
        }
    });
    
    window.addEventListener('forceRefresh', () => {
        console.log('[Mobile Notas] Forçando refresh...');
        carregarDados();
        renderNotes();
    });

    // ===== EVENTOS DA INTERFACE =====
    
    // Notificações
    document.getElementById('notification-bell')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.add('active');
        renderNotificationsModal();
    });

    document.getElementById('btn-close-notifications')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.remove('active');
    });

    document.getElementById('btn-mark-read')?.addEventListener('click', markAllAsRead);
    document.getElementById('btn-clear-all')?.addEventListener('click', clearAllNotifications);

    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });

    // Busca
    document.getElementById('notes-search-input')?.addEventListener('input', (e) => renderNotes(e.target.value));

    // Botão ADICIONAR
    document.getElementById('btn-add-note')?.addEventListener('click', () => {
        console.log('➕ Criando nova anotação...');
        openNoteModal(null);
    });

    // Fechar modal
    document.getElementById('note-modal-back')?.addEventListener('click', closeNoteModal);

    // Salvar anotação
    document.getElementById('btn-save-note')?.addEventListener('click', async () => {
        const title = document.getElementById('note-title-input')?.value.trim();
        const content = document.getElementById('note-content-input')?.innerHTML.trim();
        
        if (!title && (!content || content === '<br>' || content === '<div><br></div>')) {
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
                console.log('[Mobile Notas] Editando anotação:', editingNoteId);
            }
        } else {
            const novaNota = {
                id: Date.now().toString(),
                title: title || 'Sem título',
                content: content || '',
                date: now,
                dataModificacao: now
            };
            notes.unshift(novaNota);
            console.log('[Mobile Notas] Criando nova anotação:', novaNota.id);
        }
        
        await salvarTodosDados();
        const searchInput = document.getElementById('notes-search-input');
        renderNotes(searchInput ? searchInput.value : '');
        closeNoteModal();
        showToast(editingNoteId ? 'Anotação atualizada!' : 'Anotação criada!', 'success');
    });

    // TOOLBAR DE FORMATAÇÃO
    document.querySelectorAll('.samsung-toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            formatText(command);
        });
    });

    // Seletor de formato
    document.getElementById('format-block-select')?.addEventListener('change', (e) => {
        formatText('formatBlock', e.target.value);
    });

    // Atualizar estado da toolbar ao digitar
    const editor = document.getElementById('note-content-input');
    if (editor) {
        editor.addEventListener('keyup', updateToolbarState);
        editor.addEventListener('mouseup', updateToolbarState);
        editor.addEventListener('click', updateToolbarState);
    }

    // Ajuste de altura
    ajustarAlturaEditor();
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', ajustarAlturaEditor);
        window.visualViewport.addEventListener('scroll', ajustarAlturaEditor);
    }
    window.addEventListener('resize', ajustarAlturaEditor);

    // Bottom nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            switchView(item.dataset.view);
        });
    });
    
    console.log('✅ Inicialização das anotações mobile concluída!');
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
    if (!window.getCached && !localStorage.getItem('tasks')) return;
    const tasks = window.getCached ? window.getCached('tasks', []) : JSON.parse(localStorage.getItem('tasks') || '[]');
    const today = new Date().toISOString().split('T')[0];
    tasks.forEach(task => {
        if (!task.completed && task.date === today) {
            sendNativeNotification('📋 Tarefa Hoje', task.title, 'tarefa');
        }
    });
}

function checkUpcomingClasses() {
    if (!window.getCached && !localStorage.getItem('weeklySchedule')) return;
    const schedule = window.getCached ? window.getCached('weeklySchedule', {}) : JSON.parse(localStorage.getItem('weeklySchedule') || '{}');
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => { checkPendingTasks(); checkUpcomingClasses(); }, 2000);
        setInterval(() => { checkPendingTasks(); checkUpcomingClasses(); }, 15 * 60 * 1000);
    });
} else {
    setTimeout(() => { checkPendingTasks(); checkUpcomingClasses(); }, 2000);
    setInterval(() => { checkPendingTasks(); checkUpcomingClasses(); }, 15 * 60 * 1000);
}