// ============================================
// modules/anotacoes.js - ANOTAÇÕES SPA (COMPLETO)
// ⭐ SALVA E ATUALIZA A LISTA LATERAL IMEDIATAMENTE
// ⭐ APAGAR ANOTAÇÕES COM CONFIRMAÇÃO
// ⭐ PROTEÇÃO CONTRA SOBRESCRITA DA NUVEM
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
        this.filtroDisciplina = '';
        this._listenersConfigurados = false;
        this._editandoAgora = false;
        this._deletandoAgora = false;
        
        console.log('[Anotacoes] 📝 Módulo inicializado');
    }
    
    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[Anotacoes] 📝 Renderizando...');
        
        if (!this._editandoAgora) {
            this.notes = data.notes || [];
        }
        
        this.notifications = data.notifications || [];
        this.disciplinas = data.disciplinas || [];
        this.profile = data.profile || {};
        
        this.atualizarNomeUsuario();
        this.popularFiltroDisciplinas();
        this.renderNotesList();
        
        if (!this.currentNoteId && this.notes.length > 0) {
            this.loadFirstNote();
        } else if (this.notes.length === 0) {
            this.limparEditor();
        }
        
        this.updateBadge();
        this.restaurarEstadoSidebar();
        
        if (!this._listenersConfigurados) {
            this.configurarEventos();
            this._listenersConfigurados = true;
        }
        
        window.formatText = (command, value) => this.formatText(command, value);
        window.saveNoteAnotacoes = () => this.saveCurrentNote();
        window.createNewNote = () => this.createNote();
        window.toggleSidebarAnotacoes = () => this.toggleSidebar();
    }
    
    // ============================================
    // HELPERS
    // ============================================
    getDisciplinas() {
        if (this.app?.modules?.disciplinas?.getTodas) {
            return this.app.modules.disciplinas.getTodas();
        }
        return this.disciplinas || [];
    }
    
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
    
    popularSelectDisciplina(disciplinaSelecionada = null) {
        const select = document.getElementById('noteDisciplina');
        if (!select) return;
        
        const disciplinas = this.getDisciplinas();
        
        select.innerHTML = '';
        
        const optSem = document.createElement('option');
        optSem.value = '';
        optSem.textContent = '— Sem disciplina —';
        select.appendChild(optSem);
        
        if (disciplinas.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = '📚 Disciplinas';
            
            disciplinas.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.nome;
                opt.textContent = d.nome;
                optgroup.appendChild(opt);
            });
            
            select.appendChild(optgroup);
        }
        
        const optNova = document.createElement('option');
        optNova.value = '__CRIAR_NOVA__';
        optNova.textContent = '➕ Criar nova disciplina';
        select.appendChild(optNova);
        
        select.value = disciplinaSelecionada || '';
    }
    
    popularFiltroDisciplinas() {
        const select = document.getElementById('notesFiltroDisciplina');
        if (!select) return;
        
        const disciplinas = this.getDisciplinas();
        const valorAtual = select.value;
        
        select.innerHTML = '';
        
        const optTodas = document.createElement('option');
        optTodas.value = '';
        optTodas.textContent = '📚 Todas as disciplinas';
        select.appendChild(optTodas);
        
        const optSem = document.createElement('option');
        optSem.value = '__SEM__';
        optSem.textContent = '— Sem disciplina —';
        select.appendChild(optSem);
        
        disciplinas.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.nome;
            opt.textContent = d.nome;
            select.appendChild(opt);
        });
        
        if (valorAtual) {
            select.value = valorAtual;
        }
    }
    
    // ============================================
    // RENDERIZAR LISTA LATERAL
    // ============================================
    renderNotesList() {
        const list = document.getElementById('notesList');
        if (!list) return;
        
        let filtered = [...this.notes];
        if (this.filtroDisciplina === '__SEM__') {
            filtered = filtered.filter(n => !n.disciplina);
        } else if (this.filtroDisciplina) {
            filtered = filtered.filter(n => 
                n.disciplina && n.disciplina.toLowerCase() === this.filtroDisciplina.toLowerCase()
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
                    <i class="fas fa-sticky-note" style="font-size:48px;margin-bottom:16px;display:block;opacity:0.5;"></i>
                    Nenhuma anotação<br>Clique em + para criar
                </div>
            `;
            return;
        }
        
        list.innerHTML = filtered.map(note => {
            const contentRaw = note.conteudo || note.content || '';
            const contentText = contentRaw.replace(/<[^>]*>/g, '').trim();
            
            let titulo = note.titulo || note.title;
            if (!titulo || titulo === 'Sem título') {
                titulo = contentText ? contentText.substring(0, 30) + '...' : 'Sem título';
            }
            
            const preview = contentText ? contentText.substring(0, 60) + '...' : 'Anotação vazia...';
            const data = new Date(note.dataModificacao || note.updated_at || note.date || Date.now());
            const dataFormatada = this.formatarData(data);
            const isActive = note.id === this.currentNoteId;
            
            let badgeDisciplina = '';
            if (note.disciplina) {
                const cor = this.app?.modules?.disciplinas?.getCor(note.disciplina) || '#8b5cf6';
                const icone = this.app?.modules?.disciplinas?.getIcone(note.disciplina) || 'fa-book';
                badgeDisciplina = `
                    <div class="note-item-disciplina" style="background: ${cor}20; color: ${cor}; display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:10px; font-size:10px; margin-top:4px;">
                        <i class="fas ${icone}"></i>
                        <span>${this.app.escapeHtml(note.disciplina)}</span>
                    </div>
                `;
            }
            
            return `
                <div class="note-item ${isActive ? 'active' : ''}" data-id="${note.id}">
                    <div class="note-item-content">
                        <div class="note-item-title">
                            ${this.app.escapeHtml(titulo)}
                        </div>
                        <div class="note-item-preview">
                            ${this.app.escapeHtml(preview)}
                        </div>
                        ${badgeDisciplina}
                        <div class="note-item-date">
                            ${dataFormatada}
                        </div>
                    </div>
                    <button class="note-item-delete" data-id="${note.id}" title="Apagar anotação">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        // ⭐ Evento de clique no item (carregar nota)
        list.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.note-item-delete')) return;
                this.loadNote(item.dataset.id);
            });
        });
        
        // ⭐ Evento de clique no botão de apagar
        list.querySelectorAll('.note-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.deleteNote(btn.dataset.id);
            });
        });
    }
    
    loadFirstNote() {
        if (this.notes.length > 0 && !this.currentNoteId) {
            this.loadNote(this.notes[0].id);
        } else if (this.notes.length === 0) {
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
        
        this.popularSelectDisciplina(note.disciplina || '');
        
        if (lastSaved) {
            const data = new Date(note.dataModificacao || note.updated_at || note.date || Date.now());
            lastSaved.textContent = `Última edição: ${data.toLocaleString('pt-BR')}`;
        }
        
        this.renderNotesList();
    }
    
    limparEditor() {
        const titleInput = document.getElementById('noteTitle');
        const editor = document.getElementById('editor');
        const lastSaved = document.getElementById('lastSaved');
        
        if (titleInput) titleInput.value = '';
        if (editor) editor.innerHTML = '';
        if (lastSaved) lastSaved.textContent = '';
        
        this.popularSelectDisciplina('');
    }
    
    // ============================================
    // SALVAR ANOTAÇÃO ATUAL
    // ============================================
    async saveCurrentNote() {
        if (!this.currentNoteId) return;
        
        const titleInput = document.getElementById('noteTitle');
        const editor = document.getElementById('editor');
        const disciplinaSelect = document.getElementById('noteDisciplina');
        
        if (!titleInput || !editor) return;
        
        const title = titleInput.value.trim();
        const content = editor.innerHTML;
        let disciplina = disciplinaSelect?.value || '';
        
        if (disciplina === '__CRIAR_NOVA__') disciplina = '';
        
        const isEmpty = !title && (!content || content === '<br>' || content === '<div><br></div>' || content === '<p><br></p>');
        
        if (isEmpty) {
            this.showToast('A anotação está vazia!', 'error');
            return;
        }
        
        const noteIndex = this.notes.findIndex(n => n.id == this.currentNoteId);
        if (noteIndex === -1) return;
        
        // ⭐ BLOQUEIA A NUVEM
        this._editandoAgora = true;
        this.isSaving = true;
        
        // ⭐ ATUALIZA A NOTA LOCAL
        this.notes[noteIndex] = {
            ...this.notes[noteIndex],
            titulo: title || 'Sem título',
            conteudo: content,
            disciplina: disciplina,
            dataModificacao: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // ⭐ SINCRONIZA COM app.data
        this.app.data.notes = [...this.notes];
        
        // ⭐ ATUALIZA A LISTA LATERAL IMEDIATAMENTE
        this.renderNotesList();
        
        // ⭐ ATUALIZA O "ÚLTIMA EDIÇÃO"
        const lastSaved = document.getElementById('lastSaved');
        if (lastSaved) {
            lastSaved.textContent = `Salvo em ${new Date().toLocaleTimeString('pt-BR')}`;
        }
        
        this.showToast('Anotação salva!', 'success');
        
        // ⭐ SALVA SÓ AS NOTES (sem disparar sync global)
        try {
            if (window.CacheManager) {
                window.CacheManager.set('notes', this.notes, false);
                
                if (window.CacheManager._syncTimeout) {
                    clearTimeout(window.CacheManager._syncTimeout);
                }
                
                if (window.CacheManager.forceSyncNotes) {
                    await window.CacheManager.forceSyncNotes();
                } else {
                    const userId = this.app.user?.id;
                    if (userId && window.DatabaseService?.saveNotes) {
                        await window.DatabaseService.saveNotes(userId, this.notes);
                    }
                }
            }
        } catch (e) {
            console.warn('[Anotacoes] Erro no sync:', e);
        }
        
        setTimeout(() => { 
            this.isSaving = false; 
            this._editandoAgora = false;
        }, 3000);
    }
    
    // ============================================
    // ⭐ APAGAR ANOTAÇÃO
    // ============================================
    async deleteNote(id) {
        if (!id) return;
        
        if (this._deletandoAgora) return;
        
        const note = this.notes.find(n => n.id == id);
        if (!note) return;
        
        // Pega o título para mostrar na confirmação
        const contentRaw = note.conteudo || note.content || '';
        const contentText = contentRaw.replace(/<[^>]*>/g, '').trim();
        let titulo = note.titulo || note.title;
        if (!titulo || titulo === 'Sem título') {
            titulo = contentText ? contentText.substring(0, 30) + '...' : 'Sem título';
        }
        
        if (!confirm(`Apagar a anotação "${titulo}"?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }
        
        this._deletandoAgora = true;
        
        try {
            // ⭐ BLOQUEIA A NUVEM
            this._editandoAgora = true;
            this.isSaving = true;
            
            // ⭐ REMOVE DO ARRAY LOCAL
            this.notes = this.notes.filter(n => n.id != id);
            
            // ⭐ SINCRONIZA COM app.data
            this.app.data.notes = [...this.notes];
            
            // ⭐ SE A NOTA APAGADA ERA A ATUAL, LIMPA O EDITOR
            const eraAtual = this.currentNoteId == id;
            if (eraAtual) {
                this.currentNoteId = null;
                this.limparEditor();
            }
            
            // ⭐ ATUALIZA A LISTA LATERAL IMEDIATAMENTE
            this.renderNotesList();
            
            // ⭐ MOSTRA TOAST
            this.showToast('🗑️ Anotação apagada!', 'success');
            
            // ⭐ CARREGA A PRÓXIMA NOTA (se havia uma aberta)
            if (eraAtual && this.notes.length > 0) {
                setTimeout(() => this.loadNote(this.notes[0].id), 150);
            }
            
            // ⭐ SALVA SÓ AS NOTES (sem sync global)
            if (window.CacheManager) {
                window.CacheManager.set('notes', this.notes, false);
                
                if (window.CacheManager._syncTimeout) {
                    clearTimeout(window.CacheManager._syncTimeout);
                }
                
                if (window.CacheManager.forceSyncNotes) {
                    await window.CacheManager.forceSyncNotes();
                } else {
                    const userId = this.app.user?.id;
                    if (userId && window.DatabaseService?.saveNotes) {
                        await window.DatabaseService.saveNotes(userId, this.notes);
                    }
                }
            }
            
            setTimeout(() => { 
                this.isSaving = false; 
                this._editandoAgora = false;
                this._deletandoAgora = false;
            }, 2000);
            
        } catch (error) {
            console.error('[Anotacoes] ❌ Erro ao apagar:', error);
            this.showToast('Erro ao apagar anotação!', 'error');
            this.isSaving = false;
            this._editandoAgora = false;
            this._deletandoAgora = false;
        }
    }
    
    // ============================================
    // CRIAR NOVA ANOTAÇÃO
    // ============================================
    createNote() {
        if (this._criandoAnotacao) return;
        
        if (this.currentNoteId) {
            this.saveCurrentNote();
        }
        
        this._criandoAnotacao = true;
        this._editandoAgora = true;
        
        try {
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
            
            const disciplinaPadrao = this.filtroDisciplina && this.filtroDisciplina !== '__SEM__'
                ? this.filtroDisciplina 
                : '';
            
            const newNote = {
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                titulo: '',
                conteudo: '',
                disciplina: disciplinaPadrao,
                date: new Date().toISOString(),
                dataModificacao: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.notes.unshift(newNote);
            this.app.data.notes = [...this.notes];
            
            if (window.CacheManager) {
                window.CacheManager.set('notes', this.notes, false);
            }
            
            this.currentNoteId = newNote.id;
            
            const titleInput = document.getElementById('noteTitle');
            const editor = document.getElementById('editor');
            const lastSaved = document.getElementById('lastSaved');
            
            if (titleInput) {
                titleInput.value = '';
                titleInput.focus();
            }
            if (editor) editor.innerHTML = '';
            if (lastSaved) lastSaved.textContent = 'Nova anotação';
            
            this.popularSelectDisciplina(disciplinaPadrao);
            this.renderNotesList();
            
        } catch (error) {
            console.error('[Anotacoes] Erro ao criar:', error);
        } finally {
            setTimeout(() => { 
                this._criandoAnotacao = false; 
                this._editandoAgora = false;
            }, 1000);
        }
    }
    
    // ============================================
    // FORMATAR TEXTO
    // ============================================
    formatText(command, value = null) {
        document.execCommand(command, false, value);
        document.getElementById('editor')?.focus();
        this.autoSave();
    }
    
    autoSave() {
        this._editandoAgora = true; 
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => this.saveCurrentNote(), 2000);
    }
    
    // ============================================
    // TOGGLE SIDEBAR
    // ============================================
    toggleSidebar() {
        const sidebar = document.getElementById('rightSidebar');
        const btnToggle = document.getElementById('btnToggleSidebar');
        
        if (sidebar) {
            sidebar.classList.toggle('hidden');
            const isHidden = sidebar.classList.contains('hidden');
            localStorage.setItem('anotacoes_sidebar_collapsed', isHidden);
            
            if (btnToggle) {
                btnToggle.classList.toggle('active', isHidden);
            }
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
    // HELPERS DE FORMATAÇÃO
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
    // CONFIGURAR EVENTOS
    // ============================================
    configurarEventos() {
        const editor = document.getElementById('editor');
        const titleInput = document.getElementById('noteTitle');
        const btnNew = document.getElementById('btnNewNote');
        const btnSave = document.getElementById('btnSaveNote');
        const btnToggle = document.getElementById('btnToggleSidebar');
        const bellBtn = document.getElementById('bellBtn5');
        const disciplinaSelect = document.getElementById('noteDisciplina');
        const filtroSelect = document.getElementById('notesFiltroDisciplina');
        const btnDelete = document.getElementById('btnDeleteNote');
        
        // ⭐ BOTÃO DE APAGAR NO EDITOR (se existir no HTML)
        if (btnDelete) {
            btnDelete.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentNoteId) {
                    this.deleteNote(this.currentNoteId);
                } else {
                    this.showToast('Nenhuma anotação selecionada', 'info');
                }
            });
        }
        
        // Select de disciplina no editor
        if (disciplinaSelect) {
            disciplinaSelect.addEventListener('change', (e) => {
                const valor = e.target.value;
                if (valor === '__CRIAR_NOVA__') {
                    e.target.value = '';
                    if (this.app?.modules?.disciplinas) {
                        this.app.modules.disciplinas.abrirModal();
                    }
                    return;
                }
                this.saveCurrentNote();
            });
        }
        
        // Filtro de disciplina
        if (filtroSelect) {
            filtroSelect.addEventListener('change', (e) => {
                this.filtroDisciplina = e.target.value;
                this.renderNotesList();
            });
        }
        
        // Nova anotação
        if (btnNew) {
            btnNew.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.createNote();
            });
        }
        
        // Salvar
        if (btnSave) {
            btnSave.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveCurrentNote();
            });
        }
        
        // Toggle sidebar
        if (btnToggle) {
            btnToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            });
        }
        
        // Editor - autosave
        if (editor) {
            editor.addEventListener('input', () => this.autoSave());
            editor.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.saveCurrentNote();
                }
            });
        }
        
        // Título - autosave
        if (titleInput) {
            titleInput.addEventListener('input', () => this.autoSave());
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('editor')?.focus();
                }
            });
        }
        
        // Notificações
        if (bellBtn) {
            bellBtn.addEventListener('click', () => {
                this.app.openNotifications();
            });
        }
        
        // ⭐ DISCIPLINAS ATUALIZADAS
        window.addEventListener('disciplinasUpdated', () => {
            const viewAtiva = document.getElementById('view-anotacoes')?.classList.contains('active');
            if (!viewAtiva) return;
            
            this.popularFiltroDisciplinas();
            this.renderNotesList();
            
            if (this.currentNoteId) {
                const note = this.notes.find(n => n.id === this.currentNoteId);
                if (note) {
                    this.popularSelectDisciplina(note.disciplina || '');
                }
            }
        });
        
        // ⭐ CLOUD DATA LOADED - PROTEÇÃO
        window.addEventListener('cloudDataLoaded', () => {
            const viewAtiva = document.getElementById('view-anotacoes')?.classList.contains('active');
            
            if (!viewAtiva || this._editandoAgora || this.isSaving || this._deletandoAgora) return;
            
            const cloudNotes = this.app.data.notes || [];
            
            // ⭐ PROTEÇÃO: Se a nuvem retornou vazio mas temos notas locais, IGNORAR
            if (cloudNotes.length === 0 && this.notes.length > 0) {
                console.warn('[Anotacoes] ⚠️ Nuvem retornou vazio — ignorando para não apagar notas locais');
                return;
            }
            
            this.notes = cloudNotes;
            this.notifications = this.app.data.notifications || [];
            this.disciplinas = this.app.data.disciplinas || [];
            this.profile = this.app.data.profile || {};
            
            this.atualizarNomeUsuario();
            this.popularFiltroDisciplinas();
            this.renderNotesList();
            this.updateBadge();
            
            if (this.currentNoteId) {
                const note = this.notes.find(n => n.id == this.currentNoteId);
                if (note) {
                    const titleInput = document.getElementById('noteTitle');
                    const editor = document.getElementById('editor');
                    
                    if (titleInput && document.activeElement !== titleInput) {
                        titleInput.value = note.titulo || note.title || '';
                    }
                    if (editor && document.activeElement !== editor) {
                        editor.innerHTML = note.conteudo || note.content || '';
                    }
                    this.popularSelectDisciplina(note.disciplina || '');
                } else {
                    this.currentNoteId = null;
                    this.limparEditor();
                }
            }
        });
        
        // ⭐ STORAGE - sincronização entre abas
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.includes('_notes')) {
                const viewAtiva = document.getElementById('view-anotacoes')?.classList.contains('active');
                if (!viewAtiva || this._editandoAgora || this.isSaving) return;
                
                this.notes = this.app.data.notes || [];
                this.renderNotesList();
            }
        });
    }
}

console.log('[Anotacoes] ✅ Módulo carregado!');