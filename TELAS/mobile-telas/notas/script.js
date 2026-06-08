// mobile-telas/notas/script.js - VERSÃO CORRIGIDA COM FIRESTORE

let notifications = [];
let notes = [];
let usuarioLogado = null;
let editingNoteId = null;
let profilePhotoUnsubscribe = null;
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
// INICIALIZAÇÃO DO FIRESTORE
// ============================================
async function inicializarFirestoreNotas() {
    if (!usuarioLogado) return false;
    
    console.log('[Notas Mobile] 🔥 Inicializando Firestore...');
    
    if (!window.CacheManager) {
        console.error('[Notas Mobile] CacheManager não encontrado!');
        return false;
    }
    
    window.CacheManager.init();
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    window.CacheManager.currentUserId = userId;
    console.log('[Notas Mobile] User ID configurado:', userId);
    
    // Carregar dados da nuvem
    console.log('[Notas Mobile] ☁️ Carregando dados da nuvem...');
    const loaded = await window.CacheManager.loadFromCloud(true);
    
    // Iniciar sincronização em tempo real
    if (window.CacheManager.startRealtimeSync) {
        window.CacheManager.startRealtimeSync();
    }
    
    console.log('[Notas Mobile] ✅ Firestore inicializado, loaded:', loaded);
    return loaded;
}

// ============================================
// PERSISTÊNCIA
// ============================================
async function salvarTodosDados() {
    if (!usuarioLogado || isSaving) return false;
    isSaving = true;
    
    try {
        const notasNormalizadas = notes.map(n => ({
            id: n.id,
            title: n.title || n.titulo || 'Sem título',
            content: n.content || n.conteudo || '',
            date: n.date || new Date().toISOString(),
            dataModificacao: new Date().toISOString()
        }));
        
        console.log('[Notas Mobile] 💾 Salvando anotações:', notasNormalizadas.length);
        
        const userId = usuarioLogado.uid || usuarioLogado.email;
        localStorage.setItem(`${userId}_notes`, JSON.stringify(notasNormalizadas));
        
        if (window.CacheManager) {
            if (!window.CacheManager.currentUserId || window.CacheManager.currentUserId === 'default') {
                window.CacheManager.currentUserId = userId;
            }
            window.CacheManager.set('notes', notasNormalizadas, true);
        }
        
        return true;
    } catch (error) {
        console.error('[Notas Mobile] Erro ao salvar:', error);
        return false;
    } finally {
        isSaving = false;
    }
}

function carregarDados() {
    if (!usuarioLogado) return;
    
    let dadosCarregados = null;
    
    if (window.CacheManager) {
        const cachedNotes = window.CacheManager.get('notes', null);
        if (cachedNotes !== null && Array.isArray(cachedNotes)) {
            dadosCarregados = cachedNotes;
            console.log('[Notas Mobile] Carregado do CacheManager:', dadosCarregados.length);
        }
    }
    
    if (!dadosCarregados) {
        const userId = usuarioLogado.uid || usuarioLogado.email;
        const notesSalvas = localStorage.getItem(`${userId}_notes`);
        if (notesSalvas) {
            dadosCarregados = JSON.parse(notesSalvas);
            console.log('[Notas Mobile] Carregado do localStorage:', dadosCarregados.length);
        }
    }
    
    if (dadosCarregados && Array.isArray(dadosCarregados)) {
        notes = dadosCarregados.map(nota => ({
            id: nota.id || Date.now().toString(),
            title: nota.title || nota.titulo || 'Sem título',
            content: nota.content || nota.conteudo || '',
            date: nota.date || nota.dataModificacao || new Date().toISOString(),
            dataModificacao: nota.dataModificacao || nota.date || new Date().toISOString()
        }));
    } else if (notes.length === 0) {
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
    
    console.log('[Notas Mobile] Total de notas:', notes.length);
}

function loadAllData() {
    usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    if (!usuarioLogado || !usuarioLogado.email) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    console.log('[Notas Mobile] Usuário logado:', usuarioLogado.email);
    
    if (window.getCached) {
        notifications = window.getCached('notifications', []);
    } else {
        notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    }
    
    carregarDados();
}

// ============================================
// RENDERIZAÇÃO
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

    filteredNotes.sort((a, b) => new Date(b.dataModificacao || b.date || 0) - new Date(a.dataModificacao || a.date || 0));

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
                    notes = notes.filter(n => n.id != noteId);
                    await salvarTodosDados();
                    renderNotes(document.getElementById('notes-search-input')?.value || '');
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
        if (contentInput) contentInput.focus();
    }, 100);
}

function closeNoteModal() {
    const modal = document.getElementById('note-modal');
    if (modal) modal.classList.remove('active');
    editingNoteId = null;
}

function ajustarAlturaEditor() {
    const editorWrapper = document.querySelector('.samsung-editor-wrapper');
    if (!editorWrapper) return;
    let viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const headerHeight = document.querySelector('.samsung-header')?.offsetHeight || 0;
    const toolbarHeight = document.querySelector('.samsung-toolbar-bottom')?.offsetHeight || 0;
    const footerHeight = document.querySelector('.note-footer-info')?.offsetHeight || 0;
    editorWrapper.style.height = Math.max(viewportHeight - headerHeight - toolbarHeight - footerHeight, 200) + 'px';
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
        
        notes[noteIndex] = {
            ...notes[noteIndex],
            title: title || notes[noteIndex].title || 'Sem título',
            content: content || '',
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

function switchView(viewName) {
    if (viewName === 'home') window.location.href = '../index.html';
    else if (viewName === 'calendar') window.location.href = '../calendario/index.html';
    else if (viewName === 'tasks') window.location.href = '../tarefas/index.html';
    else if (viewName === 'profile') window.location.href = '../perfil/index.html';
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📝 Iniciando anotações mobile com Firestore...');
    
    if (window.CacheManager) window.CacheManager.init();
    
    loadAllData();

    if (usuarioLogado) {
        const nomeExibicao = usuarioLogado.nome || usuarioLogado.displayName || usuarioLogado.email?.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
        
        // INICIALIZAR FIRESTORE
        await inicializarFirestoreNotas();
        
        // Recarregar dados após inicialização
        carregarDados();
        renderNotes();
    }

    // Eventos de sincronização
    window.addEventListener('cloudDataLoaded', async () => {
        console.log('[Notas Mobile] 📡 cloudDataLoaded - Sincronizando...');
        if (editingNoteId && document.getElementById('note-modal').classList.contains('active')) {
            await salvarAnotacaoAtual();
        }
        carregarDados();
        renderNotes();
        showToast('📝 Anotações sincronizadas!', 'success');
    });
    
    window.addEventListener('notesUpdated', (event) => {
        if (event.detail && event.detail.notes && !isSaving) {
            console.log('[Notas Mobile] 📝 notesUpdated recebido');
            const novasNotas = event.detail.notes.map(n => ({
                id: n.id,
                title: n.title || n.titulo || 'Sem título',
                content: n.content || n.conteudo || '',
                date: n.date || n.dataModificacao || new Date().toISOString(),
                dataModificacao: n.dataModificacao || n.date || new Date().toISOString()
            }));
            if (JSON.stringify(notes) !== JSON.stringify(novasNotas)) {
                notes = novasNotas;
                renderNotes();
                showToast('📝 Atualizado do PC!', 'info');
            }
        }
    });
    
    // Eventos da interface
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
    
    ajustarAlturaEditor();
    if (window.visualViewport) window.visualViewport.addEventListener('resize', ajustarAlturaEditor);
    window.addEventListener('resize', ajustarAlturaEditor);
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
    
    console.log('✅ Anotações mobile inicializadas com Firestore!');
});

window.salvarAnotacaoAtual = salvarAnotacaoAtual;
window.concluirAnotacao = concluirAnotacao;
window.formatText = formatText;
window.openNoteModal = openNoteModal;