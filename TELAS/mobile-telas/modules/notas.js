// ============================================
// modules/notas.js - NOTAS
// ============================================

class NotasModule {
    constructor(app) {
        this.app = app;
        this.name = 'notas';
        this.editingNoteId = null;
        this.searchTerm = '';
        console.log('[Notas] 📝 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Notas] 📝 Renderizando...');
        this.renderNotes(data);
        this.setupEvents();
    }
    
    renderNotes(data) {
        const notesGrid = document.getElementById('notes-grid');
        if (!notesGrid) return;
        
        let filtered = [...data.notes];
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = data.notes.filter(n => 
                (n.title && n.title.toLowerCase().includes(term)) ||
                (n.content && n.content.toLowerCase().includes(term))
            );
        }
        
        if (filtered.length === 0) {
            notesGrid.innerHTML = `
                <div class="empty-notes-minimal" style="grid-column: span 2; text-align: center; padding: 60px 20px;">
                    <ion-icon name="document-text-outline" style="font-size: 3.5rem; opacity: 0.5;"></ion-icon>
                    <p style="color: var(--text-secondary); margin-top: 16px;">
                        ${this.searchTerm ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação ainda'}
                    </p>
                </div>
            `;
            return;
        }
        
        let html = '';
        filtered.forEach(note => {
            // Extrair texto puro para preview
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.content || '';
            const plainText = tempDiv.textContent || '';
            const preview = plainText.substring(0, 80);
            const titulo = note.title || 'Sem título';
            
            const dateFormatted = new Date(note.dataModificacao || note.date).toLocaleDateString('pt-BR');
            
            html += `
                <div class="note-card-minimal">
                    <div class="note-title-minimal">${this.app.escapeHtml(titulo)}</div>
                    <div class="note-preview-minimal">${this.app.escapeHtml(preview)}${preview.length >= 80 ? '...' : ''}</div>
                    <div class="note-footer-minimal">
                        <div class="note-date-minimal">${dateFormatted}</div>
                        <div class="note-actions-minimal">
                            <ion-icon name="create-outline" onclick="app.modules.notas.editNote('${note.id}')"></ion-icon>
                            <ion-icon name="trash-outline" onclick="app.modules.notas.deleteNote('${note.id}')"></ion-icon>
                        </div>
                    </div>
                </div>
            `;
        });
        notesGrid.innerHTML = html;
    }
    
    editNote(noteId) {
        const note = this.app.data.notes.find(n => n.id == noteId);
        if (note) {
            // TODO: Abrir editor
            alert(`Editar: ${note.title}`);
        }
    }
    
    deleteNote(noteId) {
        if (confirm('Excluir esta anotação?')) {
            this.app.data.notes = this.app.data.notes.filter(n => n.id != noteId);
            this.app.saveAllData();
            this.render(this.app.data);
        }
    }
    
    setupEvents() {
        // Busca
        document.getElementById('notes-search-input')?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.render(this.app.data);
        });
        
        // Botão nova nota
        document.getElementById('btn-add-note')?.addEventListener('click', () => {
            // TODO: Abrir editor
            alert('Nova anotação (em breve)');
        });
    }
}

console.log('[Notas] ✅ Módulo carregado!');