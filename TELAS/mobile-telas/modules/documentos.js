// modules/documentos.js - GERENCIADOR DE DOCUMENTOS
// ============================================

class DocumentosModule {
    constructor(app) {
        this.app = app;
        this.name = 'documentos';
        this.documentos = [];
        this.categorias = ['Trabalhos', 'Provas', 'Apresentações', 'Artigos', 'Outros'];
        this.selectedCategory = 'Todos';
        this.isSaving = false;
        this._isSubmitting = false;
        
        console.log('[Documentos] 📁 Módulo inicializado');
    }

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[Documentos] 📁 Renderizando...');
        
        this.documentos = data.documentos || [];
        this.notifications = data.notifications || [];
        
        this.renderDocumentos();
        this.updateBadge();
        this.setupEvents();
    }

    // ============================================
    // SALVAR DADOS
    // ============================================
    async salvarDados() {
        if (this.isSaving || !this.app) return;
        this.isSaving = true;
        
        try {
            this.app.data.documentos = this.documentos;
            await this.app.saveAllData();
            console.log('[Documentos] ✅ Dados salvos:', this.documentos.length);
            
            if (window.CacheManager && window.CacheManager.forceSync) {
                setTimeout(() => {
                    window.CacheManager.forceSync().catch(() => {});
                }, 500);
            }
            
            window.dispatchEvent(new CustomEvent('documentosUpdated', {
                detail: this.documentos
            }));
            
        } catch (error) {
            console.error('[Documentos] ❌ Erro ao salvar:', error);
        }
        
        setTimeout(() => { this.isSaving = false; }, 500);
    }

    // ============================================
    // RENDER DOCUMENTOS
    // ============================================
    renderDocumentos() {
        const container = document.getElementById('documentos-list');
        if (!container) return;
        
        let filtered = [...this.documentos];
        if (this.selectedCategory !== 'Todos') {
            filtered = this.documentos.filter(d => d.categoria === this.selectedCategory);
        }
        
        // Ordenar por data (mais recentes primeiro)
        filtered.sort((a, b) => new Date(b.dataUpload) - new Date(a.dataUpload));
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-documentos">
                    <ion-icon name="document-outline"></ion-icon>
                    <p>${this.selectedCategory !== 'Todos' ? 'Nenhum documento nesta categoria' : 'Nenhum documento enviado'}</p>
                    <button class="btn-add-documento" onclick="app.modules.documentos.openUploadModal()">
                        <ion-icon name="cloud-upload-outline"></ion-icon> Enviar Documento
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        filtered.forEach(doc => {
            const iconMap = {
                'pdf': 'document-text',
                'doc': 'document-text',
                'docx': 'document-text',
                'xls': 'document-text',
                'xlsx': 'document-text',
                'ppt': 'document-text',
                'pptx': 'document-text',
                'jpg': 'image',
                'jpeg': 'image',
                'png': 'image',
                'gif': 'image',
                'mp4': 'videocam',
                'mp3': 'musical-notes',
                'zip': 'archive',
                'rar': 'archive'
            };
            
            const ext = doc.nome?.split('.').pop()?.toLowerCase() || 'file';
            const icon = iconMap[ext] || 'document-outline';
            const sizeFormatted = this.formatFileSize(doc.tamanho || 0);
            
            html += `
                <div class="documento-item" data-id="${doc.id}">
                    <div class="documento-icon ${doc.categoria?.toLowerCase() || 'outros'}">
                        <ion-icon name="${icon}-outline"></ion-icon>
                    </div>
                    <div class="documento-info">
                        <div class="documento-nome">${this.app.escapeHtml(doc.nome)}</div>
                        <div class="documento-meta">
                            <span class="documento-categoria">${this.app.escapeHtml(doc.categoria || 'Outros')}</span>
                            <span class="documento-tamanho">${sizeFormatted}</span>
                            <span class="documento-data">${this.formatDate(doc.dataUpload)}</span>
                        </div>
                    </div>
                    <div class="documento-actions">
                        <button class="btn-download" onclick="app.modules.documentos.downloadDocumento('${doc.id}')" title="Baixar">
                            <ion-icon name="download-outline"></ion-icon>
                        </button>
                        <button class="btn-delete-doc" onclick="app.modules.documentos.deleteDocumento('${doc.id}')" title="Excluir">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        
        // Atualizar contador
        const countEl = document.getElementById('documentos-count');
        if (countEl) {
            const total = this.documentos.length;
            const filtrados = filtered.length;
            countEl.textContent = this.selectedCategory !== 'Todos' ? `${filtrados} de ${total}` : `${total}`;
        }
    }

    // ============================================
    // FORMATAR TAMANHO
    // ============================================
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }

    // ============================================
    // FORMATAR DATA
    // ============================================
    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    // ============================================
    // ABRIR MODAL DE UPLOAD
    // ============================================
    openUploadModal() {
        const modal = document.getElementById('documento-modal');
        if (!modal) return;
        
        document.getElementById('doc-nome').value = '';
        document.getElementById('doc-categoria').value = 'Outros';
        document.getElementById('doc-descricao').value = '';
        document.getElementById('doc-file-input').value = '';
        document.getElementById('doc-file-preview').textContent = 'Nenhum arquivo selecionado';
        document.getElementById('doc-file-preview').style.color = 'var(--text-secondary)';
        this._selectedFile = null;
        
        modal.classList.add('active');
        setTimeout(() => {
            document.getElementById('doc-nome')?.focus();
        }, 300);
    }

    closeUploadModal() {
        const modal = document.getElementById('documento-modal');
        if (modal) modal.classList.remove('active');
        this._selectedFile = null;
        this._isSubmitting = false;
    }

    // ============================================
    // SELECIONAR ARQUIVO
    // ============================================
    selectFile() {
        const input = document.getElementById('doc-file-input');
        if (!input) return;
        
        input.click();
    }

    handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        
        // Verificar tamanho (máx 10MB)
        if (file.size > 10 * 1024 * 1024) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Arquivo muito grande! Máximo 10MB.', 'error');
            }
            return;
        }
        
        this._selectedFile = file;
        
        // Preencher nome automaticamente se vazio
        const nomeInput = document.getElementById('doc-nome');
        if (nomeInput && !nomeInput.value) {
            nomeInput.value = file.name;
        }
        
        const preview = document.getElementById('doc-file-preview');
        if (preview) {
            preview.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
            preview.style.color = 'var(--text-primary)';
        }
    }

    // ============================================
    // SALVAR DOCUMENTO (UPLOAD)
    // ============================================
    async saveDocumento() {
        if (this._isSubmitting) {
            console.log('[Documentos] ⏳ Já está salvando...');
            return;
        }
        
        const nomeInput = document.getElementById('doc-nome');
        const categoriaSelect = document.getElementById('doc-categoria');
        const descricaoInput = document.getElementById('doc-descricao');
        
        const nome = nomeInput?.value?.trim();
        const categoria = categoriaSelect?.value || 'Outros';
        const descricao = descricaoInput?.value?.trim() || '';
        
        if (!nome) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Digite um nome para o documento!', 'error');
            }
            return;
        }
        
        if (!this._selectedFile) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Selecione um arquivo!', 'error');
            }
            return;
        }
        
        this._isSubmitting = true;
        
        try {
            // Ler o arquivo como base64 para armazenar
            const base64 = await this.fileToBase64(this._selectedFile);
            
            const novoDoc = {
                id: Date.now().toString(),
                nome: nome,
                categoria: categoria,
                descricao: descricao,
                arquivo: base64,
                tipo: this._selectedFile.type || 'application/octet-stream',
                nomeArquivo: this._selectedFile.name,
                tamanho: this._selectedFile.size,
                dataUpload: new Date().toISOString()
            };
            
            this.documentos.unshift(novoDoc);
            await this.salvarDados();
            this.closeUploadModal();
            this.renderDocumentos();
            this.renderCategorias();
            
            if (typeof showToast === 'function') {
                showToast('✅ Documento enviado com sucesso!', 'success');
            }
            
        } catch (error) {
            console.error('[Documentos] ❌ Erro ao salvar:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Erro ao enviar documento', 'error');
            }
        } finally {
            this._isSubmitting = false;
        }
    }

    // ============================================
    // CONVERTER FILE PARA BASE64
    // ============================================
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // BAIXAR DOCUMENTO
    // ============================================
    downloadDocumento(id) {
        const doc = this.documentos.find(d => d.id == id);
        if (!doc || !doc.arquivo) {
            if (typeof showToast === 'function') {
                showToast('❌ Documento não encontrado', 'error');
            }
            return;
        }
        
        try {
            // Criar link para download
            const link = document.createElement('a');
            link.href = doc.arquivo;
            link.download = doc.nomeArquivo || doc.nome;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            if (typeof showToast === 'function') {
                showToast('📥 Download iniciado!', 'success');
            }
            
        } catch (error) {
            console.error('[Documentos] ❌ Erro ao baixar:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Erro ao baixar documento', 'error');
            }
        }
    }

    // ============================================
    // DELETAR DOCUMENTO
    // ============================================
    async deleteDocumento(id) {
        const doc = this.documentos.find(d => d.id == id);
        if (!doc) return;
        
        if (!confirm(`Excluir o documento "${doc.nome}"?`)) return;
        
        this.documentos = this.documentos.filter(d => d.id != id);
        await this.salvarDados();
        this.renderDocumentos();
        this.renderCategorias();
        
        if (typeof showToast === 'function') {
            showToast('🗑️ Documento excluído!', 'success');
        }
    }

    // ============================================
    // RENDER CATEGORIAS (FILTROS)
    // ============================================
    renderCategorias() {
        const container = document.getElementById('documentos-categorias');
        if (!container) return;
        
        // Contar documentos por categoria
        const counts = {};
        this.categorias.forEach(cat => counts[cat] = 0);
        this.documentos.forEach(d => {
            const cat = d.categoria || 'Outros';
            if (counts[cat] !== undefined) counts[cat]++;
            else counts['Outros'] = (counts['Outros'] || 0) + 1;
        });
        
        let html = `
            <button class="cat-btn ${this.selectedCategory === 'Todos' ? 'active' : ''}" data-cat="Todos">
                Todos <span class="cat-count">${this.documentos.length}</span>
            </button>
        `;
        
        this.categorias.forEach(cat => {
            const count = counts[cat] || 0;
            html += `
                <button class="cat-btn ${this.selectedCategory === cat ? 'active' : ''}" data-cat="${cat}">
                    ${cat} <span class="cat-count">${count}</span>
                </button>
            `;
        });
        
        container.innerHTML = html;
        
        // Eventos dos botões de categoria
        container.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedCategory = btn.dataset.cat;
                this.renderCategorias();
                this.renderDocumentos();
            });
        });
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
        // Botão novo documento
        document.getElementById('btn-add-documento')?.addEventListener('click', () => {
            this.openUploadModal();
        });
        
        // Fechar modal
        const modal = document.getElementById('documento-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('.btn-back-modal') || e.target.closest('.btn-close-modal-btn')) {
                    this.closeUploadModal();
                }
            });
        }
        
        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUploadModal();
            }
        });
        
        // Botão selecionar arquivo
        document.getElementById('btn-select-file')?.addEventListener('click', () => {
            this.selectFile();
        });
        
        // Input file
        document.getElementById('doc-file-input')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        // Botão salvar
        document.getElementById('btn-save-documento')?.addEventListener('click', () => {
            this.saveDocumento();
        });
        
        // Enter para salvar
        document.getElementById('doc-nome')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveDocumento();
            }
        });
        
        // Escutar atualizações da nuvem
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[Documentos] 📡 Dados da nuvem atualizados');
            this.documentos = this.app.data.documentos || [];
            this.renderDocumentos();
            this.renderCategorias();
        });
    }
}

console.log('[Documentos] ✅ Módulo carregado!');