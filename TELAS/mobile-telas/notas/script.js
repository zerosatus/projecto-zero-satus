// mobile-telas/notas/script.js - VERSÃO CORRIGIDA (SEM PERDA DE CONTEÚDO)

let notifications = [];
let notes = [];
let usuarioLogado = null;
let editingNoteId = null;
let profilePhotoUnsubscribe = null;
let saveTimeout = null;
let isSaving = false;

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
// NORMALIZAÇÃO DE NOTAS (CONVERTE FORMATO PC PARA MOBILE)
// ============================================
function normalizarNota(nota) {
    if (!nota) return null;
    
    return {
        id: nota.id || Date.now().toString(),
        title: nota.title || nota.titulo || 'Sem título',
        content: nota.content || nota.conteudo || '',
        date: nota.date || nota.dataModificacao || nota.dataCriacao || new Date().toISOString(),
        dataModificacao: nota.dataModificacao || nota.date || new Date().toISOString()
    };
}

function normalizarTodasNotas(notasArray) {
    if (!notasArray || !Array.isArray(notasArray)) return [];
    return notasArray.map(nota => normalizarNota(nota)).filter(n => n !== null);
}

// ============================================
// PERSISTÊNCIA (SALVAR COM PREVENÇÃO DE LOOP)
// ============================================
async function salvarTodosDados() {
    if (!usuarioLogado || isSaving) return false;
    
    isSaving = true;
    
    try {
        // Normalizar notas antes de salvar
        const notasNormalizadas = notes.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            date: n.date,
            dataModificacao: new Date().toISOString()
        }));
        
        console.log('[Mobile Notas] 💾 Salvando anotações...', notasNormalizadas.length);
        
        // Salvar no localStorage (backup)
        const userId = usuarioLogado.uid || usuarioLogado.email;
        localStorage.setItem(`${userId}_notes`, JSON.stringify(notasNormalizadas));
        
        // Salvar no CacheManager (sincroniza com Firebase)
        if (window.CacheManager) {
            window.CacheManager.set('notes', notasNormalizadas, false); // false = não disparar evento imediato
        }
        
        // Atualizar data de modificação da nota atual
        if (editingNoteId) {
            const currentNote = notes.find(n => n.id === editingNoteId);
            if (currentNote) {
                currentNote.dataModificacao = new Date().toISOString();
            }
        }
        
        return true;
    } catch (error) {
        console.error('[Mobile Notas] Erro ao salvar:', error);
        return false;
    } finally {
        isSaving = false;
    }
}

function carregarDados() {
    if (!usuarioLogado) return;
    
    let dadosCarregados = null;
    
    // Tentar carregar do CacheManager primeiro
    if (window.CacheManager) {
        const cachedNotes = window.CacheManager.get('notes', null);
        if (cachedNotes !== null && Array.isArray(cachedNotes) && cachedNotes.length > 0) {
            dadosCarregados = cachedNotes;
            console.log('[Mobile Notas] Carregado do CacheManager:', dadosCarregados.length);
        }
    }
    
    // Fallback para localStorage
    if (!dadosCarregados) {
        const userId = usuarioLogado.uid || usuarioLogado.email;
        const notesSalvas = localStorage.getItem(`${userId}_notes`);
        
        if (notesSalvas) {
            dadosCarregados = JSON.parse(notesSalvas);
            console.log('[Mobile Notas] Carregado do localStorage:', dadosCarregados.length);
        }
    }
    
    // Normalizar as notas
    if (dadosCarregados && Array.isArray(dadosCarregados)) {
        notes = normalizarTodasNotas(dadosCarregados);
    } else {
        // Criar nota de exemplo se não houver nenhuma
        if (notes.length === 0) {
            const exemplo = {
                id: Date.now().toString(),
                title: 'Bem-vindo!',
                content: '<p>Esta é sua primeira anotação. Toque no lápis para editar!</p>',
                date: new Date().toISOString(),
                dataModificacao: new Date().toISOString()
            };
            notes = [exemplo];
            salvarTodosDados();
        }
    }
    
    console.log('[Mobile Notas] Total de notas carregadas:', notes.length);
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
    
    console.log('[Mobile Notas] Usuário logado:', usuarioLogado.email);
    
    // Carregar notificações
    if (window.getCached) {
        notifications = window.getCached('notifications', []);
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
    if (window.CacheManager) window.CacheManager.set('notifications', notifications, false);
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            if (window.CacheManager) window.CacheManager.set('notifications', notifications, false);
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
    
    console.log('[Mobile Notas] Renderizando notas. Total:', notes.length);
    
    let filteredNotes = [...notes];
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredNotes = notes.filter(note =>
            (note.title && note.title.toLowerCase().includes(term)) ||
            (note.content && note.content.toLowerCase().includes(term))
        );
    }

    filteredNotes.sort((a, b) => {
        const dateA = new Date(a.dataModificacao || a.date || 0);
        const dateB = new Date(b.dataModificacao || b.date || 0);
        return dateB - dateA;
    });

    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `<div class="empty-notes-minimal">
            <ion-icon name="document-text-outline"></ion-icon>
            <p>${searchTerm ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação ainda'}</p>
            <button class="btn-new-note" onclick="openNoteModal(null)" style="margin-top: 16px; background: var(--accent-purple); border: none; color: white; padding: 8px 20px; border-radius: 20px;">Criar primeira anotação</button>
        </div>`;
        return;
    }

    let html = '';
    filteredNotes.forEach(note => {
        const dateFormatted = note.date ? new Date(note.date).toLocaleDateString('pt-BR') : 
                              (note.dataModificacao ? new Date(note.dataModificacao).toLocaleDateString('pt-BR') : '');
        const conteudo = note.content || '';
        // Remove HTML tags para preview
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = conteudo;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        const preview = plainText.substring(0, 80).replace(/\n/g, ' ');
        const titulo = note.title || 'Sem título';
        
        html += `<div class="note-card-minimal" data-id="${note.id}">
            <div class="note-title-minimal">${escapeHtml(titulo)}</div>
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
        if (dateDisplay) dateDisplay.textContent = note.date ? new Date(note.date).toLocaleString('pt-BR') : 
                                              (note.dataModificacao ? new Date(note.dataModificacao).toLocaleString('pt-BR') : '');
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
// AJUSTE DE ALTURA
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
    editorWrapper.style.height = Math.max(editorHeight, 200) + 'px';
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
            const isActive = document.queryCommandState(command);
            if (isActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

// ============================================
// SALVAR ANOTAÇÃO (CORRIGIDO)
// ============================================
async function salvarAnotacaoAtual() {
    if (!editingNoteId && !notes.some(n => n.id === editingNoteId)) {
        // Nova anotação
        const title = document.getElementById('note-title-input')?.value.trim();
        const content = document.getElementById('note-content-input')?.innerHTML;
        
        if (!title && (!content || content === '<br>' || content === '<div><br></div>')) {
            closeNoteModal();
            return false;
        }
        
        const now = new Date().toISOString();
        const novaNota = {
            id: Date.now().toString(),
            title: title || 'Sem título',
            content: content || '',
            date: now,
            dataModificacao: now
        };
        
        notes.unshift(novaNota);
        editingNoteId = novaNota.id;
        await salvarTodosDados();
        renderNotes();
        showToast('Anotação criada!', 'success');
        return true;
    } else {
        // Editando anotação existente
        const title = document.getElementById('note-title-input')?.value.trim();
        const content = document.getElementById('note-content-input')?.innerHTML;
        const noteIndex = notes.findIndex(n => n.id == editingNoteId);
        
        if (noteIndex === -1) return false;
        
        // Verificar se houve mudança
        const oldNote = notes[noteIndex];
        if (oldNote.title === title && oldNote.content === content) {
            closeNoteModal();
            return true;
        }
        
        notes[noteIndex] = {
            ...notes[noteIndex],
            title: title || notes[noteIndex].title || 'Sem título',
            content: content || '',
            dataModificacao: new Date().toISOString()
        };
        
        await salvarTodosDados();
        const searchInput = document.getElementById('notes-search-input');
        renderNotes(searchInput ? searchInput.value : '');
        showToast('Anotação salva!', 'success');
        closeNoteModal();
        return true;
    }
}

// ============================================
// CONCLUSÃO DE ANOTAÇÃO (Botão Concluir)
// ============================================
async function concluirAnotacao() {
    await salvarAnotacaoAtual();
}

// ============================================
// NAVEGAÇÃO
// ============================================
function switchView(viewName) {
    if (viewName === 'home') window.location.href = '../index.html';
    else if (viewName === 'calendar') window.location.href = '../calendario/index.html';
    else if (viewName === 'tasks') window.location.href = '../tarefas/index.html';
    else if (viewName === 'notes') {
        carregarDados();
        renderNotes();
    }
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
    console.log('📝 Iniciando anotações mobile...');
    
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

    // ===== EVENTOS DE SINCRONIZAÇÃO (COM PREVENÇÃO DE LOOP) =====
    let syncInProgress = false;
    
    window.addEventListener('cloudDataLoaded', (event) => {
        if (syncInProgress) return;
        syncInProgress = true;
        
        console.log('[Mobile Notas] 📡 cloudDataLoaded recebido');
        
        // Salvar anotação atual antes de recarregar
        if (editingNoteId && document.getElementById('note-modal').classList.contains('active')) {
            salvarAnotacaoAtual().then(() => {
                setTimeout(() => {
                    carregarDados();
                    renderNotes();
                    syncInProgress = false;
                }, 100);
            });
        } else {
            carregarDados();
            renderNotes();
            syncInProgress = false;
        }
    });
    
    window.addEventListener('notesUpdated', (event) => {
        if (syncInProgress) return;
        syncInProgress = true;
        
        if (event.detail && event.detail.notes) {
            console.log('[Mobile Notas] 📝 notesUpdated recebido');
            const novasNotas = normalizarTodasNotas(event.detail.notes);
            notes = novasNotas;
            renderNotes();
        }
        setTimeout(() => { syncInProgress = false; }, 500);
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

    // Salvar anotação (botão Concluir)
    document.getElementById('btn-save-note')?.addEventListener('click', async () => {
        await salvarAnotacaoAtual();
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
        e.target.value = '';
    });

    // Atualizar estado da toolbar
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

// Expor funções globais
window.salvarAnotacaoAtual = salvarAnotacaoAtual;
window.concluirAnotacao = concluirAnotacao;
window.formatText = formatText;
window.openNoteModal = openNoteModal;