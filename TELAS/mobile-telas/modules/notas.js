// ============================================
// modules/notas.js - NOTAS CORRIGIDO (SEM FANTASMAS)
// ============================================

class NotasModule {
    constructor(app) {
        this.app = app;
        this.name = 'notas';
        this.editingNoteId = null;
        this.searchTerm = '';
        this.isSaving = false;
        this.isLoading = false;
        this._lastNotesString = '';
        this._isSubmitting = false;
        
        console.log('[Notas] 📝 Módulo inicializado');
    }
    
    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[Notas] 📝 Renderizando...');
        
        this.notes = data.notes || [];
        this.notifications = data.notifications || [];
        this._lastNotesString = JSON.stringify(this.notes);
        
        // ⭐ LIMPAR NOTAS FANTASMAS NA RENDERIZAÇÃO
        this.limparNotasFantasma();
        this.renderNotes();
        this.updateBadge();
        this.setupEvents();
    }
    
    // ============================================
    // ⭐ LIMPAR NOTAS FANTASMAS
    // ============================================
    limparNotasFantasma() {
        const antes = this.notes.length;
        
        this.notes = this.notes.filter(note => {
            const hasTitle = note.title && note.title.trim().length > 0;
            const hasContent = note.content && note.content.trim().length > 0 && 
                              note.content !== '<br>' && 
                              note.content !== '<div><br></div>' &&
                              note.content !== '<p><br></p>';
            return hasTitle || hasContent;
        });
        
        if (this.notes.length !== antes) {
            console.log(`[Notas] 🧹 Removidas ${antes - this.notes.length} notas fantasmas`);
            this._lastNotesString = JSON.stringify(this.notes);
            this.salvarDados();
        }
    }
    
    // ============================================
    // SALVAR DADOS
    // ============================================
    async salvarDados() {
        if (this.isSaving || !this.app) return;
        this.isSaving = true;
        
        try {
            // Limpar antes de salvar
            this.limparNotasFantasma();
            
            this.app.data.notes = this.notes;
            await this.app.saveAllData();
            console.log('[Notas] ✅ Dados salvos:', this.notes.length);
        } catch (error) {
            console.error('[Notas] ❌ Erro ao salvar:', error);
        }
        
        setTimeout(() => { this.isSaving = false; }, 500);
    }
    
    // ============================================
    // RENDER NOTAS
    // ============================================
    renderNotes() {
        const grid = document.getElementById('notes-grid');
        if (!grid) return;
        
        // ⭐ LIMPAR NOVAMENTE ANTES DE RENDERIZAR
        this.limparNotasFantasma();
        
        let filtered = [...this.notes];
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = this.notes.filter(n => 
                (n.title && n.title.toLowerCase().includes(term)) ||
                (n.content && n.content.toLowerCase().includes(term))
            );
        }
        
        filtered.sort((a, b) => 
            new Date(b.dataModificacao || b.date || 0) - new Date(a.dataModificacao || a.date || 0)
        );
        
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-notes-minimal">
                    <ion-icon name="document-text-outline"></ion-icon>
                    <p>${this.searchTerm ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação ainda'}</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        filtered.forEach(note => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.content || '';
            const plainText = tempDiv.textContent || '';
            const preview = plainText.substring(0, 80).replace(/\n/g, ' ');
            const titulo = note.title || 'Sem título';
            
            const dateStr = note.dataModificacao || note.date || new Date().toISOString();
            const dateFormatted = new Date(dateStr).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
            
            html += `
                <div class="note-card-minimal" data-id="${note.id}">
                    <div class="note-title-minimal">${this.app.escapeHtml(titulo)}</div>
                    <div class="note-preview-minimal">${this.app.escapeHtml(preview)}${preview.length >= 80 ? '...' : ''}</div>
                    <div class="note-footer-minimal">
                        <div class="note-date-minimal">${dateFormatted}</div>
                        <div class="note-actions-minimal">
                            <ion-icon name="create-outline" class="edit-note" data-id="${note.id}"></ion-icon>
                            <ion-icon name="trash-outline" class="delete-note" data-id="${note.id}"></ion-icon>
                        </div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
        
        grid.querySelectorAll('.edit-note').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = icon.dataset.id;
                const note = this.notes.find(n => n.id == noteId);
                if (note) this.openNoteModal(note);
            });
        });
        
        grid.querySelectorAll('.delete-note').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = icon.dataset.id;
                this.deleteNote(noteId);
            });
        });
        
        grid.querySelectorAll('.note-card-minimal').forEach(card => {
            card.addEventListener('click', () => {
                const noteId = card.dataset.id;
                const note = this.notes.find(n => n.id == noteId);
                if (note) this.openNoteModal(note);
            });
        });
    }
    
    // ============================================
    // DELETAR NOTA
    // ============================================
    deleteNote(noteId) {
        if (!confirm('Excluir esta anotação?')) return;
        
        const note = this.notes.find(n => n.id == noteId);
        if (!note) return;
        
        if (this.editingNoteId == noteId) this.closeNoteModal();
        
        this.notes = this.notes.filter(n => n.id != noteId);
        this._lastNotesString = JSON.stringify(this.notes);
        this.salvarDados();
        this.renderNotes();
        this.updateBadge();
        
        if (typeof showToast === 'function') {
            showToast('🗑️ Anotação excluída!', 'success');
        }
    }
    
    // ============================================
    // MODAL DE NOTA
    // ============================================
    openNoteModal(note) {
        const modal = document.getElementById('note-modal');
        if (!modal) return;
        
        const titleInput = document.getElementById('note-title-input');
        const contentInput = document.getElementById('note-content-input');
        const dateDisplay = document.getElementById('note-date-display');
        
        if (!note) {
            this.editingNoteId = null;
            if (titleInput) titleInput.value = '';
            if (contentInput) contentInput.innerHTML = '';
            if (dateDisplay) {
                dateDisplay.textContent = new Date().toLocaleString('pt-BR');
            }
        } else {
            this.editingNoteId = note.id;
            if (titleInput) titleInput.value = note.title || '';
            if (contentInput) contentInput.innerHTML = note.content || '';
            if (dateDisplay) {
                const dateStr = note.dataModificacao || note.date || new Date().toISOString();
                dateDisplay.textContent = new Date(dateStr).toLocaleString('pt-BR');
            }
        }
        
        modal.classList.add('active');
        
        setTimeout(() => {
            if (contentInput) {
                contentInput.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                if (contentInput.childNodes.length > 0) {
                    range.setStartAfter(contentInput.lastChild);
                    range.collapse(false);
                } else {
                    range.selectNodeContents(contentInput);
                }
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }, 300);
    }
    
    closeNoteModal() {
        const modal = document.getElementById('note-modal');
        if (modal) modal.classList.remove('active');
        this.editingNoteId = null;
        this._isSubmitting = false;
    }
    
    // ============================================
    // ⭐ SALVAR NOTA (CORRIGIDO - PREVINE FANTASMAS)
    // ============================================
    async saveNote() {
        // ⭐ PREVINE CLICK DUPLO
        if (this._isSubmitting) {
            console.log('[Notas] ⏳ Já está salvando, aguarde...');
            return false;
        }
        
        const titleInput = document.getElementById('note-title-input');
        const contentInput = document.getElementById('note-content-input');
        
        if (!titleInput || !contentInput) {
            if (typeof showToast === 'function') {
                showToast('Erro ao salvar anotação', 'error');
            }
            return false;
        }
        
        const title = titleInput.value.trim();
        const content = contentInput.innerHTML;
        
        // ⭐ VERIFICAR SE A NOTA É VAZIA (FANTASMA)
        const isEmpty = !title && (!content || content === '<br>' || content === '<div><br></div>' || content === '<p><br></p>' || content === '');
        
        // Se estiver criando uma nova nota e estiver vazia, fechar sem salvar
        if (!this.editingNoteId && isEmpty) {
            this.closeNoteModal();
            return false;
        }
        
        // Se estiver editando e estiver vazia, perguntar se quer excluir
        if (this.editingNoteId && isEmpty) {
            if (confirm('Esta anotação está vazia. Deseja excluí-la?')) {
                await this.deleteNote(this.editingNoteId);
                this.closeNoteModal();
                return true;
            }
            return false;
        }
        
        this._isSubmitting = true;
        
        try {
            if (!this.editingNoteId) {
                // ⭐ CRIAR NOVA NOTA (APENAS SE NÃO ESTIVER VAZIA)
                const now = new Date().toISOString();
                const novaNota = {
                    id: Date.now().toString(),
                    title: title || 'Sem título',
                    content: content || '',
                    date: now,
                    dataModificacao: now
                };
                
                // ⭐ VERIFICAR SE JÁ EXISTE NOTA IGUAL (EVITA DUPLICAÇÃO)
                const existe = this.notes.some(n => 
                    n.title === novaNota.title && 
                    n.content === novaNota.content &&
                    Math.abs(new Date(n.date) - new Date(now)) < 5000
                );
                
                if (!existe) {
                    this.notes.unshift(novaNota);
                    this._lastNotesString = JSON.stringify(this.notes);
                    await this.salvarDados();
                    this.renderNotes();
                    this.updateBadge();
                    
                    if (typeof showToast === 'function') {
                        showToast('📝 Anotação criada!', 'success');
                    }
                } else {
                    console.log('[Notas] ⚠️ Nota duplicada, ignorando');
                    if (typeof showToast === 'function') {
                        showToast('⚠️ Anotação já existe!', 'info');
                    }
                }
            } else {
                // ⭐ EDITAR NOTA EXISTENTE
                const noteIndex = this.notes.findIndex(n => n.id == this.editingNoteId);
                if (noteIndex === -1) {
                    if (typeof showToast === 'function') {
                        showToast('Anotação não encontrada', 'error');
                    }
                    return false;
                }
                
                const oldNote = this.notes[noteIndex];
                const newTitle = title || oldNote.title || 'Sem título';
                const newContent = content || '';
                
                // Se não houve mudança, apenas fechar
                if (oldNote.title === newTitle && oldNote.content === newContent) {
                    this.closeNoteModal();
                    return true;
                }
                
                this.notes[noteIndex] = {
                    ...oldNote,
                    title: newTitle,
                    content: newContent,
                    dataModificacao: new Date().toISOString()
                };
                
                this._lastNotesString = JSON.stringify(this.notes);
                await this.salvarDados();
                this.renderNotes();
                this.updateBadge();
                
                if (typeof showToast === 'function') {
                    showToast('✅ Anotação salva!', 'success');
                }
            }
            
            this.closeNoteModal();
            return true;
            
        } catch (error) {
            console.error('[Notas] ❌ Erro ao salvar:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Erro ao salvar anotação', 'error');
            }
            return false;
        } finally {
            this._isSubmitting = false;
        }
    }
    
    // ============================================
    // FORMATAÇÃO DE TEXTO
    // ============================================
    formatText(command, value = null) {
        const editor = document.getElementById('note-content-input');
        if (!editor) return;
        document.execCommand(command, false, value);
        editor.focus();
    }
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        // Busca
        document.getElementById('notes-search-input')?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.renderNotes();
        });
        
        // Botão nova nota
        document.getElementById('btn-add-note')?.addEventListener('click', () => {
            this.openNoteModal(null);
        });
        
        // Fechar modal - botão voltar
        document.getElementById('note-modal-back')?.addEventListener('click', () => {
            this.closeNoteModal();
        });
        
        // Fechar modal - clique fora
        document.getElementById('note-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeNoteModal();
            }
        });
        
        // Botão salvar
        document.getElementById('btn-save-note')?.addEventListener('click', () => {
            this.saveNote();
        });
        
        // Tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('note-modal');
                if (modal && modal.classList.contains('active')) {
                    this.closeNoteModal();
                }
            }
        });
        
        // ⭐ Ctrl+Enter para salvar
        document.getElementById('note-content-input')?.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.saveNote();
            }
        });
        
        // Toolbar INFERIOR (Samsung Notes Style)
        document.querySelectorAll('#note-modal .samsung-toolbar-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                this.formatText(command);
                document.getElementById('note-content-input')?.focus();
            });
        });
        
        // Seletor de formato da toolbar inferior
        document.getElementById('format-block-select')?.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value) {
                this.formatText('formatBlock', value);
                e.target.value = '';
            }
            document.getElementById('note-content-input')?.focus();
        });
        
        // Atalhos de teclado (Ctrl+B, Ctrl+I, Ctrl+U)
        document.getElementById('note-content-input')?.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.formatText('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.formatText('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.formatText('underline');
                        break;
                }
            }
        });
        
        // Toolbar flutuante (teclado)
        this.setupFloatingToolbar();
    }
    
    // ============================================
    // TOOLBAR FLUTUANTE (Teclado)
    // ============================================
    setupFloatingToolbar() {
        const toolbar = document.getElementById('floating-toolbar');
        if (!toolbar) return;
        
        const editor = document.getElementById('note-content-input');
        if (!editor) return;
        
        editor.addEventListener('focus', () => {
            setTimeout(() => {
                toolbar.classList.add('show');
            }, 300);
        });
        
        editor.addEventListener('blur', () => {
            setTimeout(() => {
                toolbar.classList.remove('show');
            }, 200);
        });
        
        // Botões da toolbar flutuante
        toolbar.querySelectorAll('.ft-btn').forEach(btn => {
            if (btn.classList.contains('ft-done')) return;
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                if (command) {
                    this.formatText(command);
                }
                editor.focus();
            });
        });
        
        // Seletor de estilo da toolbar flutuante
        const select = toolbar.querySelector('.ft-select');
        if (select) {
            select.addEventListener('change', (e) => {
                const value = e.target.value;
                if (value) {
                    this.formatText('formatBlock', value);
                    e.target.value = '';
                }
                editor.focus();
            });
        }
        
        // Botão Concluir
        const doneBtn = toolbar.querySelector('.ft-done');
        if (doneBtn) {
            doneBtn.addEventListener('click', () => {
                this.saveNote();
            });
        }
    }
    
    // ============================================
    // ⭐ LIMPEZA MANUAL (CHAMAR DO CONSOLE SE PRECISAR)
    // ============================================
    limparNotasFantasmaManual() {
        const antes = this.notes.length;
        this.limparNotasFantasma();
        if (antes !== this.notes.length) {
            this.salvarDados();
            this.renderNotes();
            console.log(`[Notas] 🧹 Limpeza manual: ${antes} -> ${this.notes.length} notas`);
            if (typeof showToast === 'function') {
                showToast(`🧹 ${antes - this.notes.length} notas fantasmas removidas!`, 'success');
            }
        } else {
            if (typeof showToast === 'function') {
                showToast('✅ Nenhuma nota fantasma encontrada!', 'info');
            }
        }
        return this.notes.length;
    }
}

console.log('[Notas] ✅ Módulo carregado (corrigido - sem fantasmas)!');