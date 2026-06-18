// mobile-telas/notas/script.js - VERSÃO SUPABASE APENAS

let notifications = [];
let notes = [];
let usuarioLogado = null;
let editingNoteId = null;
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
// CARREGAR DADOS
// ============================================
async function carregarDados() {
    if (!usuarioLogado || !window.CacheManager) return;
    
    try {
        // Garantir que o CacheManager está com o userId correto
        if (window.CacheManager.currentUserId !== usuarioLogado.id) {
            window.CacheManager.currentUserId = usuarioLogado.id;
        }
        
        const cachedNotes = window.CacheManager.get('notes', null);
        if (cachedNotes !== null && Array.isArray(cachedNotes)) {
            notes = cachedNotes.map(nota => ({
                id: nota.id,
                title: nota.title || nota.titulo || 'Sem título',
                content: nota.content || nota.conteudo || '',
                date: nota.date || nota.dataModificacao || new Date().toISOString(),
                dataModificacao: nota.dataModificacao || nota.date || new Date().toISOString()
            }));
            console.log('[Notas Mobile] Carregadas do CacheManager:', notes.length);
        } else {
            // Fallback para localStorage
            const userId = usuarioLogado.id;
            const notesSalvas = localStorage.getItem(`${userId}_notes`);
            if (notesSalvas) {
                const parsed = JSON.parse(notesSalvas);
                notes = parsed.map(nota => ({
                    id: nota.id || Date.now().toString(),
                    title: nota.title || nota.titulo || 'Sem título',
                    content: nota.content || nota.conteudo || '',
                    date: nota.date || nota.dataModificacao || new Date().toISOString(),
                    dataModificacao: nota.dataModificacao || nota.date || new Date().toISOString()
                }));
                console.log('[Notas Mobile] Carregadas do localStorage:', notes.length);
            }
        }
        
        // Se não houver notas, criar uma de exemplo
        if (notes.length === 0) {
            const exemplo = {
                id: Date.now().toString(),
                title: 'Bem-vindo!',
                content: '<p>Esta é sua primeira anotação. Toque no lápis para editar!</p>',
                date: new Date().toISOString(),
                dataModificacao: new Date().toISOString()
            };
            notes = [exemplo];
            await salvarTodosDados();
        }
        
        renderNotes();
        
    } catch (error) {
        console.error('[Notas Mobile] Erro ao carregar dados:', error);
    }
}

// ============================================
// SALVAR DADOS
// ============================================
async function salvarTodosDados() {
    if (!usuarioLogado || !window.CacheManager || isSaving) return false;
    isSaving = true;
    
    try {
        // Salvar no CacheManager (sincroniza com Supabase)
        window.CacheManager.set('notes', notes, true);
        
        // Backup no localStorage
        const userId = usuarioLogado.id;
        localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
        
        console.log('[Notas Mobile] ✅ Dados salvos:', notes.length);
        return true;
    } catch (error) {
        console.error('[Notas Mobile] Erro ao salvar:', error);
        return false;
    } finally {
        setTimeout(() => { isSaving = false; }, 500);
    }
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
    
    filteredNotes.sort((a, b) => 
        new Date(b.dataModificacao || b.date || 0) - new Date(a.dataModificacao || a.date || 0)
    );
    
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
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content || '';
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
                    const noteToDelete = notes.find(n => n.id == noteId);
                    if (noteToDelete) {
                        if (editingNoteId == noteId) closeNoteModal();
                        notes = notes.filter(n => n.id != noteId);
                        await salvarTodosDados();
                        renderNotes(document.getElementById('notes-search-input')?.value || '');
                        showToast('Anotação excluída!', 'success');
                    }
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
        if (contentInput) contentInput.focus();
    }, 100);
}

function closeNoteModal() {
    const modal = document.getElementById('note-modal');
    if (modal) modal.classList.remove('active');
    editingNoteId = null;
}

function formatText(command, value = null) {
    document.execCommand(command, false, value);
    const editor = document.getElementById('note-content-input');
    if (editor) editor.focus();
}

async function salvarAnotacaoAtual() {
    const title = document.getElementById('note-title-input')?.value.trim();
    const content = document.getElementById('note-content-input')?.innerHTML;
    
    if (!editingNoteId) {
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
        closeNoteModal();
        return true;
    } else {
        const noteIndex = notes.findIndex(n => n.id == editingNoteId);
        if (noteIndex === -1) return false;
        
        const oldNote = notes[noteIndex];
        const newTitle = title || oldNote.title || 'Sem título';
        const newContent = content || '';
        
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
        
        await salvarTodosDados();
        renderNotes(document.getElementById('notes-search-input')?.value || '');
        showToast('Anotação salva!', 'success');
        closeNoteModal();
        return true;
    }
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
        const photoUrl = await window.CacheManager.getProfilePhotoUrl();
        if (photoUrl && photoUrl.startsWith('data:')) {
            profileIcon.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            return;
        }
    }
    
    const iniciais = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
    profileIcon.innerHTML = `<span style="font-weight:bold;">${iniciais}</span>`;
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📝 Iniciando anotações mobile com Supabase...');
    
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    try {
        usuarioLogado = JSON.parse(usuarioSalvo);
        console.log('[Notas Mobile] Usuário:', usuarioLogado.id);
    } catch(e) {
        console.error('[Notas Mobile] Erro ao parsear usuário:', e);
        window.location.href = '../../login/index.html';
        return;
    }
    
    // Inicializar CacheManager
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuarioLogado.id;
        console.log('[Notas Mobile] CacheManager inicializado');
    }
    
    // Inicializar Sync
    if (window.initSync && !window._notesMobileSyncInit) {
        window._notesMobileSyncInit = true;
        try {
            await window.initSync({ force: false });
            console.log('[Notas Mobile] Sync inicializado ✅');
        } catch(e) {
            console.warn('[Notas Mobile] Erro no sync:', e);
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
    
    // Configurar eventos
    document.getElementById('notification-bell')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.add('active');
    });
    
    document.getElementById('btn-close-notifications')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.remove('active');
    });
    
    document.getElementById('notes-search-input')?.addEventListener('input', (e) => renderNotes(e.target.value));
    document.getElementById('btn-add-note')?.addEventListener('click', () => openNoteModal(null));
    document.getElementById('note-modal-back')?.addEventListener('click', closeNoteModal);
    document.getElementById('btn-save-note')?.addEventListener('click', async () => { await salvarAnotacaoAtual(); });
    
    document.querySelectorAll('.samsung-toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            formatText(btn.dataset.command);
        });
    });
    
    document.getElementById('format-block-select')?.addEventListener('change', (e) => {
        formatText('formatBlock', e.target.value);
        e.target.value = '';
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (view === 'home') window.location.href = '../index.html';
            else if (view === 'calendar') window.location.href = '../calendario/index.html';
            else if (view === 'tasks') window.location.href = '../tarefas/index.html';
            else if (view === 'profile') window.location.href = '../perfil/index.html';
        });
    });
    
    // Listeners globais
    window.addEventListener('cloudDataLoaded', async () => {
        console.log('[Notas Mobile] 📡 Dados da nuvem carregados!');
        await carregarDados();
        renderNotes();
        showToast('📝 Anotações sincronizadas!', 'success');
    });
    
    window.addEventListener('notesUpdated', (event) => {
        if (event.detail && event.detail.notes && !isSaving) {
            const novasNotas = event.detail.notes.map(n => ({
                id: n.id,
                title: n.title || n.titulo || 'Sem título',
                content: n.content || n.conteudo || '',
                date: n.date || n.dataModificacao || new Date().toISOString(),
                dataModificacao: n.dataModificacao || n.date || new Date().toISOString()
            }));
            
            const notasAtuais = notes.map(n => n.id);
            const novasNotasIds = novasNotas.map(n => n.id);
            const notasRemovidas = notasAtuais.filter(id => !novasNotasIds.includes(id));
            
            if (notasRemovidas.length > 0 && editingNoteId && notasRemovidas.includes(editingNoteId)) {
                closeNoteModal();
                editingNoteId = null;
                showToast('Esta anotação foi removida em outro dispositivo', 'info');
            }
            
            if (JSON.stringify(notes.map(n => ({ id: n.id, title: n.title, content: n.content }))) !==
                JSON.stringify(novasNotas.map(n => ({ id: n.id, title: n.title, content: n.content })))) {
                notes = novasNotas;
                renderNotes();
                showToast('📝 Anotações sincronizadas!', 'success');
            }
        }
    });
    
    window.addEventListener('syncReady', () => {
        console.log('[Notas Mobile] 📡 Sync pronto, recarregando dados...');
        carregarDados();
        renderNotes();
    });
    
    window.addEventListener('profilePhotoUpdated', async (event) => {
        if (event.detail && event.detail.photoUrl) {
            const profileIcon = document.getElementById('notification-bell');
            if (profileIcon) {
                profileIcon.innerHTML = `<img src="${event.detail.photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
        }
    });
    
    console.log('✅ Anotações mobile com Supabase inicializadas!');
});

// Exportar funções globais
window.salvarAnotacaoAtual = salvarAnotacaoAtual;
window.concluirAnotacao = concluirAnotacao;
window.formatText = formatText;
window.openNoteModal = openNoteModal;

console.log('%c📝 Notas Mobile - Supabase Apenas!', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');