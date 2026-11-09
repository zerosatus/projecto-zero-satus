// ============================================
// mobile-telas/modules/notas.js
// NOTAS COMPLETO (COM DISCIPLINAS)
// ⭐ Select de disciplina no modal
// ⭐ Listener disciplinasUpdated
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

        this.popularSelectDisciplinas();
        this.limparNotasFantasma();
        this.renderNotes();
        this.updateBadge();
        this.setupEvents();
    }

    // ============================================
    // ⭐ POPULAR SELECT DE DISCIPLINAS
    // ============================================
    popularSelectDisciplinas(selecionada = '') {
        const select = document.getElementById('note-disciplina');
        if (!select) return;

        const disciplinas = this.app.modules.disciplinas?.getTodas() || [];

        select.innerHTML = '<option value="">📚 Sem disciplina</option>';
        disciplinas.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.nome;
            opt.textContent = d.nome;
            select.appendChild(opt);
        });

        select.value = selecionada || '';
    }

    // ============================================
    // LIMPAR NOTAS FANTASMAS
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

            const disc = note.disciplina || '';
            const cor = disc ? (this.app.modules.disciplinas?.getCor(disc) || 'var(--accent-purple)') : null;
            const icone = disc ? (this.app.modules.disciplinas?.getIcone(disc) || 'fa-book') : null;
            const badgeDisc = disc
                ? `<div style="font-size:0.6rem;color:${cor};margin-top:2px;"><i class="fas ${icone}" style="margin-right:3px;"></i>${this.app.escapeHtml(disc)}</div>`
                : '';

            html += `
                <div class="note-card-minimal" data-id="${note.id}">
                    <div class="note-title-minimal">${this.app.escapeHtml(titulo)}</div>
                    <div class="note-preview-minimal">${this.app.escapeHtml(preview)}${preview.length >= 80 ? '...' : ''}</div>
                    <div class="note-footer-minimal">
                        <div>
                            <div class="note-date-minimal">${dateFormatted}</div>
                            ${badgeDisc}
                        </div>
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
                this.deleteNote(icon.dataset.id);
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
        if (typeof showToast === 'function') showToast('🗑️ Anotação excluída!', 'success');
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
            if (dateDisplay) dateDisplay.textContent = new Date().toLocaleString('pt-BR');
            this.popularSelectDisciplinas('');
        } else {
            this.editingNoteId = note.id;
            if (titleInput) titleInput.value = note.title || '';
            if (contentInput) contentInput.innerHTML = note.content || '';
            if (dateDisplay) {
                const dateStr = note.dataModificacao || note.date || new Date().toISOString();
                dateDisplay.textContent = new Date(dateStr).toLocaleString('pt-BR');
            }
            const nomeDisc = this.app.modules.disciplinas?.resolverNome(note.disciplina || '') || '';
            this.popularSelectDisciplinas(nomeDisc);
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
    // SALVAR NOTA
    // ============================================
    async saveNote() {
        if (this._isSubmitting) return;

        const titleInput = document.getElementById('note-title-input');
        const contentInput = document.getElementById('note-content-input');

        if (!titleInput || !contentInput) {
            if (typeof showToast === 'function') showToast('Erro ao salvar anotação', 'error');
            return false;
        }

        const title = titleInput.value.trim();
        const content = contentInput.innerHTML;
        const disciplina = document.getElementById('note-disciplina')?.value || '';

        const isEmpty = !title && (!content || content === '<br>' || content === '<div><br></div>' || content === '<p><br></p>' || content === '');

        if (!this.editingNoteId && isEmpty) {
            this.closeNoteModal();
            return false;
        }

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
                const now = new Date().toISOString();
                const novaNota = {
                    id: Date.now().toString(),
                    title: title || 'Sem título',
                    content: content || '',
                    disciplina: disciplina,
                    date: now,
                    dataModificacao: now
                };

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
                    if (typeof showToast === 'function') showToast('📝 Anotação criada!', 'success');
                } else {
                    if (typeof showToast === 'function') showToast('⚠️ Anotação já existe!', 'info');
                }
            } else {
                const noteIndex = this.notes.findIndex(n => n.id == this.editingNoteId);
                if (noteIndex === -1) {
                    if (typeof showToast === 'function') showToast('Anotação não encontrada', 'error');
                    return false;
                }

                const oldNote = this.notes[noteIndex];
                const newTitle = title || oldNote.title || 'Sem título';
                const newContent = content || '';

                if (oldNote.title === newTitle && oldNote.content === newContent && oldNote.disciplina === disciplina) {
                    this.closeNoteModal();
                    return true;
                }

                this.notes[noteIndex] = {
                    ...oldNote,
                    title: newTitle,
                    content: newContent,
                    disciplina: disciplina,
                    dataModificacao: new Date().toISOString()
                };

                this._lastNotesString = JSON.stringify(this.notes);
                await this.salvarDados();
                this.renderNotes();
                this.updateBadge();
                if (typeof showToast === 'function') showToast('✅ Anotação salva!', 'success');
            }

            this.closeNoteModal();
            return true;

        } catch (error) {
            console.error('[Notas] ❌ Erro ao salvar:', error);
            if (typeof showToast === 'function') showToast('❌ Erro ao salvar anotação', 'error');
            return false;
        } finally {
            this._isSubmitting = false;
        }
    }

    // ============================================
    // FORMATAÇÃO
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
        document.getElementById('notes-search-input')?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.renderNotes();
        });

        document.getElementById('btn-add-note')?.addEventListener('click', () => {
            this.openNoteModal(null);
        });

        document.getElementById('note-modal-back')?.addEventListener('click', () => {
            this.closeNoteModal();
        });

        document.getElementById('note-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeNoteModal();
        });

        document.getElementById('btn-save-note')?.addEventListener('click', () => {
            this.saveNote();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('note-modal');
                if (modal && modal.classList.contains('active')) this.closeNoteModal();
            }
        });

        document.getElementById('note-content-input')?.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.saveNote();
            }
        });

        document.querySelectorAll('#note-modal .samsung-toolbar-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.formatText(btn.dataset.command);
                document.getElementById('note-content-input')?.focus();
            });
        });

        document.getElementById('format-block-select')?.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value) {
                this.formatText('formatBlock', value);
                e.target.value = '';
            }
            document.getElementById('note-content-input')?.focus();
        });

        document.getElementById('note-content-input')?.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b': e.preventDefault(); this.formatText('bold'); break;
                    case 'i': e.preventDefault(); this.formatText('italic'); break;
                    case 'u': e.preventDefault(); this.formatText('underline'); break;
                }
            }
        });

        this.setupFloatingToolbar();

        // ⭐ Atualizar select quando disciplinas mudarem
        window.addEventListener('disciplinasUpdated', () => {
            const modalAberto = document.getElementById('note-modal')?.classList.contains('active');
            if (modalAberto) {
                const valorAtual = document.getElementById('note-disciplina')?.value || '';
                this.popularSelectDisciplinas(valorAtual);
            }
            const viewAtiva = document.getElementById('view-notas')?.classList.contains('active');
            if (viewAtiva) this.renderNotes();
        });
    }

    // ============================================
    // TOOLBAR FLUTUANTE
    // ============================================
    setupFloatingToolbar() {
        const toolbar = document.getElementById('floating-toolbar');
        if (!toolbar) return;
        const editor = document.getElementById('note-content-input');
        if (!editor) return;

        editor.addEventListener('focus', () => {
            setTimeout(() => toolbar.classList.add('show'), 300);
        });

        editor.addEventListener('blur', () => {
            setTimeout(() => toolbar.classList.remove('show'), 200);
        });

        toolbar.querySelectorAll('.ft-btn').forEach(btn => {
            if (btn.classList.contains('ft-done')) return;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                if (command) this.formatText(command);
                editor.focus();
            });
        });

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

        const doneBtn = toolbar.querySelector('.ft-done');
        if (doneBtn) {
            doneBtn.addEventListener('click', () => this.saveNote());
        }
    }

    // ============================================
    // LIMPEZA MANUAL
    // ============================================
    limparNotasFantasmaManual() {
        const antes = this.notes.length;
        this.limparNotasFantasma();
        if (antes !== this.notes.length) {
            this.salvarDados();
            this.renderNotes();
            if (typeof showToast === 'function') {
                showToast(`🧹 ${antes - this.notes.length} notas fantasmas removidas!`, 'success');
            }
        } else {
            if (typeof showToast === 'function') showToast('✅ Nenhuma nota fantasma encontrada!', 'info');
        }
        return this.notes.length;
    }
}

console.log('[Notas] ✅ Módulo carregado!');