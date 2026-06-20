// mobile-telas/notas/script.js - VERSÃO CORRIGIDA (SEM RECURSÃO)

let notifications = [];
let notes = [];
let usuarioLogado = null;
let editingNoteId = null;
let isSaving = false;
let isLoading = false;
let _lastNotesString = '';

// ============================================
// TOAST & CONFIRM
// ============================================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    // Remover toasts antigos
    const existingToasts = container.querySelectorAll('.toast');
    if (existingToasts.length > 5) {
        existingToasts[0]?.remove();
    }
    
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
    if (!modal) { if (callback) callback(false); return; }
    
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
// ✅ CARREGAR DADOS (SEM RECURSÃO)
// ============================================
async function carregarDados() {
    // ⚠️ PREVENIR RECURSÃO
    if (isLoading) {
        console.log('[Notas] ⏳ Já carregando...');
        return;
    }
    
    if (!usuarioLogado || !window.CacheManager) {
        console.warn('[Notas] CacheManager ou usuário não disponível');
        return;
    }
    
    isLoading = true;
    console.log('[Notas] 📂 Carregando dados...');
    
    try {
        // Garantir userId correto
        if (window.CacheManager.currentUserId !== usuarioLogado.id) {
            window.CacheManager.currentUserId = usuarioLogado.id;
        }
        
        // ✅ CARREGAR DO CACHEMANAGER
        const cachedNotes = window.CacheManager.get('notes', null);
        const cachedNotif = window.CacheManager.get('notifications', null);
        
        // Processar notas
        if (cachedNotes !== null && Array.isArray(cachedNotes) && cachedNotes.length > 0) {
            const novasNotas = cachedNotes.map(nota => ({
                id: nota.id || Date.now().toString(),
                title: nota.title || nota.titulo || 'Sem título',
                content: nota.content || nota.conteudo || '',
                date: nota.date || nota.dataModificacao || new Date().toISOString(),
                dataModificacao: nota.dataModificacao || nota.date || new Date().toISOString()
            }));
            
            // Verificar se realmente mudou
            const newStr = JSON.stringify(novasNotas);
            if (newStr !== _lastNotesString || notes.length !== novasNotas.length) {
                notes = novasNotas;
                _lastNotesString = newStr;
                console.log('[Notas] ✅ Carregado do CacheManager:', notes.length);
            } else {
                console.log('[Notas] 📌 Nenhuma mudança nas notas');
            }
        } else {
            // Fallback para localStorage com UUID
            const userId = usuarioLogado.id;
            const notesSalvas = localStorage.getItem(`${userId}_notes`);
            if (notesSalvas) {
                try {
                    const parsed = JSON.parse(notesSalvas);
                    if (parsed && parsed.length > 0) {
                        notes = parsed.map(nota => ({
                            id: nota.id || Date.now().toString(),
                            title: nota.title || nota.titulo || 'Sem título',
                            content: nota.content || nota.conteudo || '',
                            date: nota.date || nota.dataModificacao || new Date().toISOString(),
                            dataModificacao: nota.dataModificacao || nota.date || new Date().toISOString()
                        }));
                        _lastNotesString = JSON.stringify(notes);
                        console.log('[Notas] Carregado do localStorage:', notes.length);
                    }
                } catch(e) {
                    console.warn('[Notas] Erro ao parsear localStorage:', e);
                }
            }
        }
        
        // Processar notificações
        if (cachedNotif !== null && Array.isArray(cachedNotif)) {
            notifications = cachedNotif;
        } else {
            const userId = usuarioLogado.id;
            const notifSalvas = localStorage.getItem(`${userId}_notifications`);
            if (notifSalvas) {
                try {
                    notifications = JSON.parse(notifSalvas);
                } catch(e) {
                    notifications = [];
                }
            }
        }
        
        // ✅ Se não houver notas, criar exemplo
        if (notes.length === 0) {
            const exemplo = {
                id: Date.now().toString(),
                title: '📝 Bem-vindo!',
                content: '<p>Esta é sua primeira anotação. Toque no <strong>✏️ lápis</strong> para editar!</p><ul><li>Toque em <strong>+</strong> para criar</li><li>Toque no <strong>✏️</strong> para editar</li><li>Toque no <strong>🗑️</strong> para excluir</li></ul>',
                date: new Date().toISOString(),
                dataModificacao: new Date().toISOString()
            };
            notes = [exemplo];
            _lastNotesString = JSON.stringify(notes);
            await salvarTodosDados();
            showToast('📝 Anotação de exemplo criada!', 'success');
        }
        
        renderNotes();
        updateNotificationBadge();
        
    } catch (error) {
        console.error('[Notas] Erro ao carregar dados:', error);
        showToast('Erro ao carregar anotações', 'error');
    } finally {
        isLoading = false;
    }
}

// ============================================
// ✅ SALVAR DADOS (SEM RECURSÃO)
// ============================================
async function salvarTodosDados() {
    if (!usuarioLogado || !window.CacheManager || isSaving) return false;
    
    isSaving = true;
    console.log('[Notas] 💾 Salvando...');
    
    try {
        // Garantir userId correto
        if (window.CacheManager.currentUserId !== usuarioLogado.id) {
            window.CacheManager.currentUserId = usuarioLogado.id;
        }
        
        // ✅ SALVAR NO CACHEMANAGER
        if (notes && notes.length > 0) {
            window.CacheManager.set('notes', notes, true);
        }
        if (notifications && notifications.length > 0) {
            window.CacheManager.set('notifications', notifications, true);
        }
        
        // ✅ BACKUP LOCAL COM UUID
        const userId = usuarioLogado.id;
        localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
        localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
        
        // Atualizar string de comparação
        _lastNotesString = JSON.stringify(notes);
        
        console.log('[Notas] ✅ Salvo:', notes.length, 'notas');
        return true;
        
    } catch (error) {
        console.error('[Notas] Erro ao salvar:', error);
        return false;
    } finally {
        setTimeout(() => { isSaving = false; }, 500);
    }
}

// ============================================
// NOTIFICAÇÕES
// ============================================
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
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
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type || 'info'}">
                <ion-icon name="notifications-outline"></ion-icon>
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
    salvarTodosDados();
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            salvarTodosDados();
            showToast('Notificações limpas!', 'success');
        }
    });
}

// ============================================
// RENDERIZAR NOTAS
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
    
    // Ordenar por data modificação (mais recente primeiro)
    filteredNotes.sort((a, b) => 
        new Date(b.dataModificacao || b.date || 0) - new Date(a.dataModificacao || a.date || 0)
    );
    
    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-notes-minimal" style="grid-column: span 2; text-align: center; padding: 60px 20px;">
                <ion-icon name="document-text-outline" style="font-size: 3.5rem; opacity: 0.5;"></ion-icon>
                <p style="color: var(--text-secondary); margin-top: 16px;">
                    ${searchTerm ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação ainda'}
                </p>
                <button onclick="openNoteModal(null)" style="margin-top: 16px; background: var(--accent-purple); border: none; color: white; padding: 10px 24px; border-radius: 20px; cursor: pointer; font-size: 0.9rem;">
                    <ion-icon name="add-outline"></ion-icon> Criar primeira anotação
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    filteredNotes.forEach(note => {
        // Extrair texto puro para preview
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content || '';
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        const preview = plainText.substring(0, 80).replace(/\n/g, ' ');
        const titulo = note.title || 'Sem título';
        
        // Formatar data
        const dateStr = note.dataModificacao || note.date || new Date().toISOString();
        const dateFormatted = new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        
        html += `
            <div class="note-card-minimal" data-id="${note.id}" onclick="openNoteModalById('${note.id}')">
                <div class="note-title-minimal">${escapeHtml(titulo)}</div>
                <div class="note-preview-minimal">${escapeHtml(preview)}${preview.length >= 80 ? '...' : ''}</div>
                <div class="note-footer-minimal">
                    <div class="note-date-minimal">${dateFormatted}</div>
                    <div class="note-actions-minimal">
                        <ion-icon name="create-outline" class="edit-note" data-id="${note.id}" onclick="event.stopPropagation(); openNoteModalById('${note.id}')"></ion-icon>
                        <ion-icon name="trash-outline" class="delete-note" data-id="${note.id}" onclick="event.stopPropagation(); confirmDeleteNote('${note.id}')"></ion-icon>
                    </div>
                </div>
            </div>
        `;
    });
    notesGrid.innerHTML = html;
}

// ============================================
// CRUD DE NOTAS
// ============================================
function openNoteModalById(noteId) {
    const note = notes.find(n => n.id == noteId);
    if (note) {
        openNoteModal(note);
    } else {
        showToast('Anotação não encontrada', 'error');
    }
}

function openNoteModal(note) {
    const modal = document.getElementById('note-modal');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const dateDisplay = document.getElementById('note-date-display');
    
    if (!modal) return;
    
    // Se for null, criar nova
    if (!note) {
        editingNoteId = null;
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.innerHTML = '';
        if (dateDisplay) dateDisplay.textContent = new Date().toLocaleString('pt-BR');
        modal.classList.add('active');
        setTimeout(() => {
            if (contentInput) contentInput.focus();
        }, 200);
        return;
    }
    
    // Editar existente
    editingNoteId = note.id;
    if (titleInput) titleInput.value = note.title || '';
    if (contentInput) contentInput.innerHTML = note.content || '';
    if (dateDisplay) {
        const dateStr = note.dataModificacao || note.date || new Date().toISOString();
        dateDisplay.textContent = new Date(dateStr).toLocaleString('pt-BR');
    }
    
    modal.classList.add('active');
    setTimeout(() => {
        if (contentInput) contentInput.focus();
    }, 200);
}

function closeNoteModal() {
    const modal = document.getElementById('note-modal');
    if (modal) modal.classList.remove('active');
    editingNoteId = null;
}

function confirmDeleteNote(noteId) {
    showConfirm('Excluir esta anotação?', 'Excluir Anotação', async (confirmed) => {
        if (confirmed) {
            const noteToDelete = notes.find(n => n.id == noteId);
            if (noteToDelete) {
                if (editingNoteId == noteId) closeNoteModal();
                notes = notes.filter(n => n.id != noteId);
                _lastNotesString = JSON.stringify(notes);
                await salvarTodosDados();
                renderNotes(document.getElementById('notes-search-input')?.value || '');
                showToast('Anotação excluída!', 'success');
            }
        }
    });
}

// ============================================
// FORMATAÇÃO DE TEXTO
// ============================================
function formatText(command, value = null) {
    document.execCommand(command, false, value);
    const editor = document.getElementById('note-content-input');
    if (editor) editor.focus();
}

// ============================================
// SALVAR ANOTAÇÃO ATUAL
// ============================================
async function salvarAnotacaoAtual() {
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    
    if (!titleInput || !contentInput) {
        showToast('Erro ao salvar anotação', 'error');
        return false;
    }
    
    const title = titleInput.value.trim();
    const content = contentInput.innerHTML;
    const isEmpty = !title && (!content || content === '<br>' || content === '<div><br></div>');
    
    // Nova anotação
    if (!editingNoteId) {
        if (isEmpty) {
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
        _lastNotesString = JSON.stringify(notes);
        await salvarTodosDados();
        renderNotes();
        showToast('📝 Anotação criada!', 'success');
        closeNoteModal();
        return true;
    }
    
    // Editar existente
    const noteIndex = notes.findIndex(n => n.id == editingNoteId);
    if (noteIndex === -1) {
        showToast('Anotação não encontrada', 'error');
        return false;
    }
    
    const oldNote = notes[noteIndex];
    const newTitle = title || oldNote.title || 'Sem título';
    const newContent = content || '';
    
    // Verificar se houve mudança
    if (oldNote.title === newTitle && oldNote.content === newContent) {
        closeNoteModal();
        return true;
    }
    
    notes[noteIndex] = {
        ...notes[noteIndex],
        title: newTitle,
        content: newContent,
        dataModificacao: new Date().toISOString()
    };
    
    _lastNotesString = JSON.stringify(notes);
    await salvarTodosDados();
    renderNotes(document.getElementById('notes-search-input')?.value || '');
    showToast('✅ Anotação salva!', 'success');
    closeNoteModal();
    return true;
}

async function concluirAnotacao() {
    await salvarAnotacaoAtual();
}

// ============================================
// AVATAR
// ============================================
async function carregarFotoPerfilMobile() {
    if (!usuarioLogado) return;
    
    const profileIcon = document.getElementById('notification-bell');
    if (!profileIcon) return;
    
    if (window.CacheManager) {
        try {
            const photoUrl = await window.CacheManager.getProfilePhotoUrl();
            if (photoUrl && photoUrl.startsWith('data:')) {
                profileIcon.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                return;
            }
        } catch(e) {
            console.warn('[Notas] Erro ao carregar foto:', e);
        }
    }
    
    const iniciais = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
    profileIcon.innerHTML = `<span style="font-weight:bold;">${iniciais}</span>`;
}

// ============================================
// LISTENERS (SEM RECURSÃO)
// ============================================
function configurarListeners() {
    // ✅ ESCUTAR EVENTOS DE DADOS ATUALIZADOS
    const eventos = ['notesUpdated', 'dataUpdated', 'cloudDataLoaded', 'forceRefresh', 'syncReady'];
    
    eventos.forEach(eventName => {
        window.addEventListener(eventName, (event) => {
            // Prevenir processamento durante salvamento
            if (isSaving || isLoading) {
                console.log(`[Notas] ⏳ Ignorando ${eventName} - ocupado`);
                return;
            }
            
            console.log(`[Notas] 📡 ${eventName} recebido`);
            
            // Extrair notas do evento
            let novasNotas = null;
            if (event.detail) {
                if (event.detail.notes) novasNotas = event.detail.notes;
                else if (event.detail.value && event.detail.key === 'notes') novasNotas = event.detail.value;
                else if (event.detail.data && event.detail.type === 'notes') novasNotas = event.detail.data;
            }
            
            if (novasNotas && Array.isArray(novasNotas)) {
                const notasNormalizadas = novasNotas.map(n => ({
                    id: n.id || Date.now().toString(),
                    title: n.title || n.titulo || 'Sem título',
                    content: n.content || n.conteudo || '',
                    date: n.date || n.dataModificacao || new Date().toISOString(),
                    dataModificacao: n.dataModificacao || n.date || new Date().toISOString()
                }));
                
                const newStr = JSON.stringify(notasNormalizadas);
                if (newStr !== _lastNotesString) {
                    notes = notasNormalizadas;
                    _lastNotesString = newStr;
                    renderNotes(document.getElementById('notes-search-input')?.value || '');
                    showToast('📝 Anotações sincronizadas!', 'success');
                }
            } else {
                // Recarregar completo
                setTimeout(carregarDados, 100);
            }
        });
    });
    
    // ✅ ESCUTAR MUDANÇAS NO localStorage (outras abas)
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.includes('_notes') && !isSaving && !isLoading) {
            console.log('[Notas] 📡 Mudança detectada em outra aba:', e.key);
            setTimeout(carregarDados, 200);
        }
    });
    
    // ✅ Fechar modal ao clicar fora
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('note-modal');
        const content = modal?.querySelector('.note-editor-container');
        if (modal && modal.classList.contains('active') && content && !content.contains(e.target)) {
            // Não fechar automaticamente para evitar perda de dados
        }
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📝 Iniciando anotações mobile com Supabase...');
    
    // Verificar usuário
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    try {
        usuarioLogado = JSON.parse(usuarioSalvo);
        console.log('[Notas] Usuário:', usuarioLogado.id);
    } catch(e) {
        console.error('[Notas] Erro ao parsear usuário:', e);
        window.location.href = '../../login/index.html';
        return;
    }
    
    // Inicializar CacheManager
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuarioLogado.id;
        console.log('[Notas] CacheManager inicializado');
    }
    
    // Inicializar Sync
    if (window.initSync && !window._notesMobileSyncInit) {
        window._notesMobileSyncInit = true;
        try {
            await window.initSync({ force: false });
            console.log('[Notas] Sync inicializado ✅');
        } catch(e) {
            console.warn('[Notas] Erro no sync:', e);
        }
    }
    
    // Carregar dados
    await carregarDados();
    
    // Atualizar UI
    const headerName = document.getElementById('header-name');
    if (headerName && usuarioLogado.nome) {
        headerName.textContent = usuarioLogado.nome.split(' ')[0];
    }
    
    await carregarFotoPerfilMobile();
    configurarListeners();
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    
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
    
    // Busca de notas
    document.getElementById('notes-search-input')?.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });
    
    // Botão nova nota
    document.getElementById('btn-add-note')?.addEventListener('click', () => {
        openNoteModal(null);
    });
    
    // Modal de edição
    document.getElementById('note-modal-back')?.addEventListener('click', closeNoteModal);
    document.getElementById('btn-save-note')?.addEventListener('click', async () => {
        await salvarAnotacaoAtual();
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('note-modal');
            if (modal && modal.classList.contains('active')) {
                closeNoteModal();
            }
            const notifModal = document.getElementById('notifications-modal');
            if (notifModal && notifModal.classList.contains('active')) {
                notifModal.classList.remove('active');
            }
        }
    });
    
    // Toolbar de formatação
    document.querySelectorAll('.samsung-toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            // Para comandos de alinhamento, garantir que o editor tenha foco
            if (['justifyLeft', 'justifyCenter', 'justifyRight'].includes(command)) {
                const editor = document.getElementById('note-content-input');
                if (editor) editor.focus();
            }
            formatText(command);
        });
    });
    
    // Seletor de formato
    document.getElementById('format-block-select')?.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value) {
            formatText('formatBlock', value);
            e.target.value = '';
        }
    });
    
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (view === 'home') window.location.href = '../index.html';
            else if (view === 'calendar') window.location.href = '../calendario/index.html';
            else if (view === 'tasks') window.location.href = '../tarefas/index.html';
            else if (view === 'profile') window.location.href = '../perfil/index.html';
        });
    });
    
    // Atualização de foto de perfil
    window.addEventListener('profilePhotoUpdated', async (event) => {
        if (event.detail && event.detail.photoUrl) {
            const profileIcon = document.getElementById('notification-bell');
            if (profileIcon) {
                profileIcon.innerHTML = `<img src="${event.detail.photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
        }
    });
    
    console.log('✅ Anotações mobile inicializadas!');
});

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================
window.salvarAnotacaoAtual = salvarAnotacaoAtual;
window.concluirAnotacao = concluirAnotacao;
window.formatText = formatText;
window.openNoteModal = openNoteModal;
window.openNoteModalById = openNoteModalById;
window.confirmDeleteNote = confirmDeleteNote;
window.closeNoteModal = closeNoteModal;

console.log('%c📝 Notas Mobile - Versão Corrigida (Sem Recursão)', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');