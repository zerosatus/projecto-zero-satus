// ============================================
// modules/anotacoes.js - ANOTAÇÕES SPA (CORRIGIDO)
// ============================================

class AnotacoesModule {
    constructor(app) {
        this.app = app;
        this.name = 'anotacoes';
        this.currentNoteId = null;
        this.notes = [];
        this.isSaving = false;
        this.autoSaveTimer = null;
        this._criandoAnotacao = false;
        
        console.log('[Anotacoes] 📝 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Anotacoes] 📝 Renderizando...');
        
        this.notes = data.notes || [];
        this.notifications = data.notifications || [];
        this.profile = data.profile || {};
        
        this.atualizarNomeUsuario();
        this.renderNotesList();
        this.loadFirstNote();
        this.configurarEventos();
        this.updateBadge();
        this.restaurarEstadoSidebar();
        
        // EXPOR FUNÇÕES GLOBAIS
        window.formatText = (command, value) => this.formatText(command, value);
        window.saveNoteAnotacoes = () => this.saveCurrentNote();
        window.createNewNote = () => this.createNote();
        window.toggleSidebarAnotacoes = () => this.toggleSidebar();
    }
    
    // ============================================
    // ATUALIZAR NOME DO USUÁRIO
    // ============================================
    atualizarNomeUsuario() {
        const profile = this.profile || this.app.user || {};
        const nome = profile.nome || profile.displayName || 'Usuário';
        
        const userName5 = document.getElementById('userName5');
        const userAvatar5 = document.getElementById('userAvatar5');
        
        if (userName5) userName5.textContent = nome;
        if (userAvatar5) {
            const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
            userAvatar5.textContent = iniciais || 'U';
        }
    }
    
    // ============================================
    // RENDER NOTES LIST
    // ============================================
    renderNotesList() {
        const list = document.getElementById('notesList');
        if (!list) return;
        
        const filtered = [...this.notes].sort((a, b) => {
            const dateA = new Date(a.dataModificacao || a.updated_at || a.date || 0);
            const dateB = new Date(b.dataModificacao || b.updated_at || b.date || 0);
            return dateB - dateA;
        });
        
        if (filtered.length === 0) {
            list.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-secondary)">
                    <i class="fas fa-sticky-note" style="font-size:48px;margin-bottom:16px;display:block;"></i>
                    Nenhuma anotação<br>Clique em + para criar
                </div>
            `;
            return;
        }
        
        list.innerHTML = filtered.map(note => {
            const titulo = note.titulo || note.title || 'Sem título';
            const preview = (note.conteudo || note.content || '').replace(/<[^>]*>/g, '').substring(0, 60) + '...';
            const data = new Date(note.dataModificacao || note.updated_at || note.date || Date.now());
            const dataFormatada = this.formatarData(data);
            const isActive = note.id === this.currentNoteId;
            
            return `
                <div class="note-item ${isActive ? 'active' : ''}" data-id="${note.id}">
                    <div class="note-item-title">${this.app.escapeHtml(titulo)}</div>
                    <div class="note-item-preview">${this.app.escapeHtml(preview)}</div>
                    <div class="note-item-date">${dataFormatada}</div>
                </div>
            `;
        }).join('');
        
        list.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadNote(item.dataset.id);
            });
        });
    }
    
    // ============================================
    // LOAD NOTE
    // ============================================
    loadFirstNote() {
        if (this.notes.length > 0 && !this.currentNoteId) {
            this.loadNote(this.notes[0].id);
        } else if (this.notes.length === 0) {
            // Se não há anotações, mostrar editor vazio
            this.limparEditor();
        }
    }
    
    loadNote(id) {
        if (this.currentNoteId && this.currentNoteId !== id) {
            this.saveCurrentNote();
        }
        
        const note = this.notes.find(n => n.id == id);
        if (!note) return;
        
        this.currentNoteId = id;
        
        const titleInput = document.getElementById('noteTitle');
        const editor = document.getElementById('editor');
        const lastSaved = document.getElementById('lastSaved');
        
        if (titleInput) titleInput.value = note.titulo || note.title || '';
        if (editor) editor.innerHTML = note.conteudo || note.content || '';
        if (lastSaved) {
            const data = new Date(note.dataModificacao || note.updated_at || note.date || Date.now());
            lastSaved.textContent = `Última edição: ${data.toLocaleString('pt-BR')}`;
        }
        
        this.renderNotesList();
    }
    
    // ============================================
    // LIMPAR EDITOR (SEM TEXTO FIXO)
    // ============================================
    limparEditor() {
        const titleInput = document.getElementById('noteTitle');
        const editor = document.getElementById('editor');
        const lastSaved = document.getElementById('lastSaved');
        
        if (titleInput) titleInput.value = '';
        if (editor) editor.innerHTML = '';
        if (lastSaved) lastSaved.textContent = '';
    }
    
    // ============================================
    // SAVE NOTE
    // ============================================
    saveCurrentNote() {
        if (!this.currentNoteId || this.isSaving) return;
        
        const titleInput = document.getElementById('noteTitle');
        const editor = document.getElementById('editor');
        
        if (!titleInput || !editor) return;
        
        const title = titleInput.value.trim();
        const content = editor.innerHTML;
        const isEmpty = !title && (!content || content === '<br>' || content === '<div><br></div>' || content === '<p><br></p>');
        
        const noteIndex = this.notes.findIndex(n => n.id == this.currentNoteId);
        if (noteIndex === -1) return;
        
        const oldNote = this.notes[noteIndex];
        if (oldNote.titulo === title && oldNote.conteudo === content) return;
        
        this.isSaving = true;
        
        if (isEmpty) {
            this.isSaving = false;
            return;
        }
        
        this.notes[noteIndex] = {
            ...oldNote,
            titulo: title || 'Sem título',
            conteudo: content || '',
            dataModificacao: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.app.data.notes = this.notes;
        this.app.saveAllData();
        this.renderNotesList();
        
        const lastSaved = document.getElementById('lastSaved');
        if (lastSaved) {
            lastSaved.textContent = `Salvo em ${new Date().toLocaleTimeString('pt-BR')}`;
        }
        
        this.isSaving = false;
    }
    
    // ============================================
    // CREATE NOTE
    // ============================================
    createNote() {
        if (this._criandoAnotacao) {
            console.log('[Anotacoes] ⏳ Aguarde...');
            return;
        }
        
        if (this.currentNoteId) {
            this.saveCurrentNote();
        }
        
        this._criandoAnotacao = true;
        
        try {
            // Verificar se já existe uma anotação vazia
            const emptyNote = this.notes.find(n => 
                (!n.titulo || n.titulo === '') && 
                (!n.conteudo || n.conteudo === '' || n.conteudo === '<br>' || 
                 n.conteudo === '<div><br></div>' || n.conteudo === '<p><br></p>')
            );
            
            if (emptyNote) {
                this.loadNote(emptyNote.id);
                this._criandoAnotacao = false;
                return;
            }
            
            const newNote = {
                id: this.gerarId(),
                titulo: '',
                conteudo: '',
                date: new Date().toISOString(),
                dataModificacao: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.notes.unshift(newNote);
            this.app.data.notes = this.notes;
            this.app.saveAllData();
            
            this.currentNoteId = newNote.id;
            
            // Limpar editor e focar
            const titleInput = document.getElementById('noteTitle');
            const editor = document.getElementById('editor');
            const lastSaved = document.getElementById('lastSaved');
            
            if (titleInput) {
                titleInput.value = '';
                titleInput.focus();
            }
            if (editor) editor.innerHTML = '';
            if (lastSaved) lastSaved.textContent = 'Nova anotação';
            
            this.renderNotesList();
            this.showToast('Nova anotação criada!', 'success');
            
        } catch (error) {
            console.error('[Anotacoes] Erro ao criar:', error);
            this.showToast('Erro ao criar anotação', 'error');
        } finally {
            setTimeout(() => {
                this._criandoAnotacao = false;
            }, 500);
        }
    }
    
    deleteNote(id) {
        if (!confirm('Excluir esta anotação?')) return;
        
        const note = this.notes.find(n => n.id == id);
        if (!note) return;
        
        if (this.currentNoteId == id) {
            this.currentNoteId = null;
            this.limparEditor();
        }
        
        this.notes = this.notes.filter(n => n.id != id);
        this.app.data.notes = this.notes;
        this.app.saveAllData();
        this.renderNotesList();
        
        if (this.notes.length > 0 && !this.currentNoteId) {
            this.loadNote(this.notes[0].id);
        } else {
            this.limparEditor();
        }
        
        this.showToast('Anotação excluída!', 'success');
    }
    
    // ============================================
    // FORMAT TEXT
    // ============================================
    formatText(command, value = null) {
        document.execCommand(command, false, value);
        document.getElementById('editor')?.focus();
        this.autoSave();
    }
    
    autoSave() {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => this.saveCurrentNote(), 2000);
    }
    
    // ============================================
    // TOGGLE SIDEBAR (CORRIGIDO)
    // ============================================
    toggleSidebar() {
        const sidebar = document.getElementById('rightSidebar');
        const btnToggle = document.getElementById('btnToggleSidebar');
        
        console.log('[Anotacoes] Toggle sidebar - antes:', sidebar?.classList.contains('hidden'));
        
        if (sidebar) {
            sidebar.classList.toggle('hidden');
            const isHidden = sidebar.classList.contains('hidden');
            localStorage.setItem('anotacoes_sidebar_collapsed', isHidden);
            
            if (btnToggle) {
                btnToggle.classList.toggle('active', isHidden);
            }
            
            console.log('[Anotacoes] Toggle sidebar - depois:', isHidden);
            this.showToast(isHidden ? 'Anotações ocultas' : 'Anotações visíveis', 'info');
        } else {
            console.warn('[Anotacoes] Sidebar não encontrada!');
        }
    }
    
    restaurarEstadoSidebar() {
        const isCollapsed = localStorage.getItem('anotacoes_sidebar_collapsed') === 'true';
        const sidebar = document.getElementById('rightSidebar');
        const btnToggle = document.getElementById('btnToggleSidebar');
        
        if (isCollapsed && sidebar) {
            sidebar.classList.add('hidden');
            if (btnToggle) btnToggle.classList.add('active');
        } else if (sidebar) {
            sidebar.classList.remove('hidden');
            if (btnToggle) btnToggle.classList.remove('active');
        }
    }
    
    // ============================================
    // HELPERS
    // ============================================
    formatarData(data) {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        
        if (data.toDateString() === hoje.toDateString()) {
            return `Hoje, ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
        } else if (data.toDateString() === ontem.toDateString()) {
            return `Ontem, ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
        } else {
            return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
        }
    }
    
    gerarId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notificationBadge5');
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        if (badge) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }
    
    showToast(mensagem, tipo = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
            toastMessage.textContent = mensagem;
            toast.className = 'toast show';
            toast.style.background = tipo === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                   tipo === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                   tipo === 'info' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
                                   'linear-gradient(135deg, #10b981, #059669)';
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    configurarEventos() {
        const editor = document.getElementById('editor');
        const titleInput = document.getElementById('noteTitle');
        const btnNew = document.getElementById('btnNewNote');
        const btnSave = document.getElementById('btnSaveNote');
        const btnToggle = document.getElementById('btnToggleSidebar');
        const bellBtn = document.getElementById('bellBtn5');
        
        // 🔥 BOTÃO NOVA ANOTAÇÃO
        if (btnNew) {
            // Remover eventos antigos
            const newBtn = btnNew.cloneNode(true);
            btnNew.parentNode.replaceChild(newBtn, btnNew);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.createNote();
            });
        }
        
        // 🔥 BOTÃO SALVAR
        if (btnSave) {
            const saveBtn = btnSave.cloneNode(true);
            btnSave.parentNode.replaceChild(saveBtn, btnSave);
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveCurrentNote();
                this.showToast('Anotação salva!', 'success');
            });
        }
        
        // 🔥 BOTÃO TOGGLE SIDEBAR
        if (btnToggle) {
            const toggleBtn = btnToggle.cloneNode(true);
            btnToggle.parentNode.replaceChild(toggleBtn, btnToggle);
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            });
        }
        
        // 🔥 EDITOR
        if (editor) {
            editor.addEventListener('input', () => this.autoSave());
            editor.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.saveCurrentNote();
                    this.showToast('Anotação salva!', 'success');
                }
            });
            // Focar no editor quando clicar
            editor.addEventListener('click', () => {
                if (!this.currentNoteId && this.notes.length > 0) {
                    this.loadNote(this.notes[0].id);
                }
            });
        }
        
        // 🔥 TÍTULO
        if (titleInput) {
            titleInput.addEventListener('input', () => this.autoSave());
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('editor')?.focus();
                }
            });
        }
        
        // 🔥 SINO DE NOTIFICAÇÕES
        if (bellBtn) {
            bellBtn.addEventListener('click', () => {
                this.app.openNotifications();
            });
        }
        
        // 🔥 ATUALIZAR DADOS DA NUVEM
        window.addEventListener('cloudDataLoaded', () => {
            this.notes = this.app.data.notes || [];
            this.notifications = this.app.data.notifications || [];
            this.profile = this.app.data.profile || {};
            
            this.atualizarNomeUsuario();
            this.renderNotesList();
            this.updateBadge();
            
            if (this.currentNoteId) {
                const note = this.notes.find(n => n.id == this.currentNoteId);
                if (note) {
                    const titleInput = document.getElementById('noteTitle');
                    const editor = document.getElementById('editor');
                    if (titleInput) titleInput.value = note.titulo || note.title || '';
                    if (editor) editor.innerHTML = note.conteudo || note.content || '';
                } else {
                    this.currentNoteId = null;
                    this.limparEditor();
                }
            }
        });
        
        // 🔥 TECLA ESC - FECHAR MODAIS
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Fechar modais se houver
            }
        });
    }
}

console.log('[Anotacoes] ✅ Módulo carregado!');