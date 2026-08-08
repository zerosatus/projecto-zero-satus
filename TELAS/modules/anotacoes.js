// ============================================
// modules/anotacoes.js - ANOTAÇÕES
// ============================================

class AnotacoesModule {
    constructor(app) {
        this.app = app;
        this.name = 'anotacoes';
        this.currentNoteId = null;
        this.notes = [];
        this.isSaving = false;
        this.autoSaveTimer = null;
        this.searchTerm = '';
        
        console.log('[Anotacoes] 📝 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Anotacoes] 📝 Renderizando...');
        
        this.notes = data.notes || [];
        this.notifications = data.notifications || [];
        
        this.renderNotesList();
        this.setupEvents();
        this.loadFirstNote();
        this.updateBadge();
    }
    
    // ============================================
    // RENDER NOTES LIST
    // ============================================
    renderNotesList() {
        const list = document.getElementById('notesList');
        if (!list) return;
        
        let filtered = [...this.notes];
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(n => 
                (n.title || n.titulo || '').toLowerCase().includes(term) ||
                (n.content || n.conteudo || '').toLowerCase().includes(term)
            );
        }
        
        filtered.sort((a, b) => {
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
            const titulo = note.title || note.titulo || 'Sem título';
            const preview = (note.content || note.conteudo || '').replace(/<[^>]*>/g, '').substring(0, 60) + '...';
            const data = new Date(note.dataModificacao || note.updated_at || note.date || Date.now());
            const dataFormatada = this.formatDate(data);
            const isActive = note.id === this.currentNoteId;
            
            return `
                <div class="note-item ${isActive ? 'active' : ''}" data-id="${note.id}">
                    <div class="note-item-title">${this.app.escapeHtml(titulo)}</div>
                    <div class="note-item-preview">${this.app.escapeHtml(preview)}</div>
                    <div class="note-item-date">${dataFormatada}</div>
                </div>
            `;
        }).join('');
        
        // Eventos de clique
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
        }
    }
    
    loadNote(id) {
        if (this.currentNoteId && this.currentNoteId !== id) {
            this.saveCurrentNote();
        }
        
        const note = this.notes.find(n => n.id == id);
        if (!note) return;
        
        this.currentNoteId = id;
        
        const titleInput = document.querySelector('.note-title');
        const editor = document.getElementById('editor');
        const dateDisplay = document.querySelector('.last-saved');
        
        if (titleInput) titleInput.value = note.title || note.titulo || '';
        if (editor) editor.innerHTML = note.content || note.conteudo || '';
        if (dateDisplay) {
            const data = new Date(note.dataModificacao || note.updated_at || note.date || Date.now());
            dateDisplay.textContent = `Última edição: ${data.toLocaleString('pt-BR')}`;
        }
        
        this.renderNotesList();
    }
    
    // ============================================
    // SAVE NOTE
    // ============================================
    saveCurrentNote() {
        if (!this.currentNoteId || this.isSaving) return;
        
        const titleInput = document.querySelector('.note-title');
        const editor = document.getElementById('editor');
        
        if (!titleInput || !editor) return;
        
        const title = titleInput.value.trim();
        const content = editor.innerHTML;
        const isEmpty = !title && (!content || content === '<br>' || content === '<div><br></div>');
        
        const noteIndex = this.notes.findIndex(n => n.id == this.currentNoteId);
        if (noteIndex === -1) return;
        
        const oldNote = this.notes[noteIndex];
        if (oldNote.title === title && oldNote.content === content) return;
        
        this.isSaving = true;
        
        if (isEmpty) {
            // Não salvar anotações vazias
            this.isSaving = false;
            return;
        }
        
        this.notes[noteIndex] = {
            ...oldNote,
            title: title || 'Sem título',
            content: content || '',
            dataModificacao: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.app.data.notes = this.notes;
        this.app.saveAllData();
        this.renderNotesList();
        
        const dateDisplay = document.querySelector('.last-saved');
        if (dateDisplay) {
            dateDisplay.textContent = `Salvo em ${new Date().toLocaleTimeString('pt-BR')}`;
        }
        
        this.isSaving = false;
    }
    
    // ============================================
    // CREATE NOTE
    // ============================================
    createNote() {
        // Salvar nota atual
        if (this.currentNoteId) {
            this.saveCurrentNote();
        }
        
        // Verificar se já existe uma nota vazia
        const emptyNote = this.notes.find(n => 
            (!n.title || n.title === '') && 
            (!n.content || n.content === '' || n.content === '<br>' || n.content === '<div><br></div>')
        );
        
        if (emptyNote) {
            this.loadNote(emptyNote.id);
            return;
        }
        
        const newNote = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            title: '',
            content: '',
            date: new Date().toISOString(),
            dataModificacao: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.app.data.notes = this.notes;
        this.app.saveAllData();
        
        this.loadNote(newNote.id);
        document.querySelector('.note-title')?.focus();
        
        if (typeof showToast === 'function') {
            showToast('Nova anotação criada!', 'success');
        }
    }
    
    deleteNote(id) {
        if (!confirm('Excluir esta anotação?')) return;
        
        const note = this.notes.find(n => n.id == id);
        if (!note) return;
        
        if (this.currentNoteId == id) {
            this.currentNoteId = null;
            document.querySelector('.note-title').value = '';
            document.getElementById('editor').innerHTML = '';
        }
        
        this.notes = this.notes.filter(n => n.id != id);
        this.app.data.notes = this.notes;
        this.app.saveAllData();
        this.renderNotesList();
        
        // Carregar primeira nota se houver
        if (this.notes.length > 0 && !this.currentNoteId) {
            this.loadNote(this.notes[0].id);
        }
        
        if (typeof showToast === 'function') {
            showToast('Anotação excluída!', 'success');
        }
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
    // HELPERS
    // ============================================
    formatDate(data) {
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
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        if (badge) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        // Editor auto-save
        const editor = document.getElementById('editor');
        const titleInput = document.querySelector('.note-title');
        
        if (editor) {
            editor.addEventListener('input', () => this.autoSave());
            editor.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.saveCurrentNote();
                }
            });
        }
        
        if (titleInput) {
            titleInput.addEventListener('input', () => this.autoSave());
        }
        
        // Nova nota
        document.getElementById('btnNewNote')?.addEventListener('click', () => this.createNote());
        document.getElementById('btnNewNoteSidebar')?.addEventListener('click', () => this.createNote());
        
        // Salvar manual
        document.getElementById('btnSaveNote')?.addEventListener('click', () => {
            this.saveCurrentNote();
            if (typeof showToast === 'function') {
                showToast('Anotação salva!', 'success');
            }
        });
        
        // Busca
        // (implementar busca se houver input de busca)
        
        // Listener de dados
        window.addEventListener('cloudDataLoaded', () => {
            this.notes = this.app.data.notes || [];
            this.renderNotesList();
            if (this.currentNoteId) {
                const note = this.notes.find(n => n.id == this.currentNoteId);
                if (note) {
                    document.querySelector('.note-title').value = note.title || '';
                    document.getElementById('editor').innerHTML = note.content || '';
                }
            }
        });
    }
}

console.log('[Anotacoes] ✅ Módulo carregado!');