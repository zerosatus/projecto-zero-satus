// ============================================
// modules/documentos.js - GERENCIADOR DE DOCUMENTOS (COMPLETO CORRIGIDO)
// COM SUPORTE A STORAGE (NUVEM) E FALLBACK BASE64
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
        this._selectedFile = null;
        this._cacheManagerReady = false;
        
        console.log('[Documentos] 📁 Módulo inicializado');
    }

    // ============================================
    // ⭐ GARANTIR QUE O CACHE MANAGER ESTÁ PRONTO
    // ============================================
    async _ensureCacheManager() {
        if (this._cacheManagerReady && window.CacheManager) {
            return true;
        }

        console.log('[Documentos] 🔄 Verificando CacheManager...');

        // Esperar até 5 segundos pelo CacheManager
        let attempts = 0;
        const maxAttempts = 25; // 5 segundos (200ms * 25)

        while (attempts < maxAttempts) {
            if (window.CacheManager) {
                console.log('[Documentos] ✅ CacheManager encontrado!');
                
                // Inicializar se necessário
                if (!window.CacheManager.isInitialized) {
                    console.log('[Documentos] 🔄 Inicializando CacheManager...');
                    window.CacheManager.init();
                    
                    // Aguardar inicialização
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                // Definir userId
                if (this.app?.user?.id && !window.CacheManager.currentUserId) {
                    window.CacheManager.currentUserId = this.app.user.id;
                }

                this._cacheManagerReady = true;
                return true;
            }

            // Tentar forçar carregamento do script
            if (attempts === 5) {
                console.log('[Documentos] 🔄 Tentando carregar CacheManager manualmente...');
                try {
                    const script = document.createElement('script');
                    script.src = 'mobile-telas/cache-manager.js';
                    document.head.appendChild(script);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch(e) {
                    console.warn('[Documentos] ⚠️ Erro ao carregar script:', e);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }

        console.warn('[Documentos] ⚠️ CacheManager não disponível após timeout');
        this._cacheManagerReady = false;
        return false;
    }

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[Documentos] 📁 Renderizando...');
        
        this.documentos = data.documentos || [];
        this.notifications = data.notifications || [];
        this.profile = data.profile || {};
        
        // ⭐ GARANTIR CACHE MANAGER NA RENDERIZAÇÃO
        this._ensureCacheManager().then(ready => {
            if (ready) {
                console.log('[Documentos] ✅ CacheManager pronto para uso');
            }
        });
        
        this.atualizarNomeUsuario();
        this.renderCategorias();
        this.renderDocumentos();
        this.updateBadge();
        this.setupEvents();
    }

    // ============================================
    // ATUALIZAR NOME DO USUÁRIO
    // ============================================
    atualizarNomeUsuario() {
        const profile = this.profile || this.app.user || {};
        const nome = profile.nome || profile.displayName || 'Usuário';
        
        const userName = document.getElementById('userNameDocs');
        if (userName) userName.textContent = nome;
        
        const userAvatar = document.getElementById('userAvatarDocs');
        if (userAvatar) {
            const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
            userAvatar.textContent = iniciais || 'U';
        }
    }

    // ============================================
    // ⭐ SALVAR DADOS (COM VERIFICAÇÃO DO CACHE)
    // ============================================
    async salvarDados() {
        if (this.isSaving || !this.app) return;
        this.isSaving = true;
        
        try {
            // ⭐ GARANTIR QUE O CACHE MANAGER ESTÁ PRONTO
            await this._ensureCacheManager();
            
            this.app.data.documentos = this.documentos;
            
            // ⭐ SALVAR NO CACHE MANAGER (SE DISPONÍVEL)
            if (window.CacheManager && this._cacheManagerReady) {
                // Verificar se está inicializado
                if (!window.CacheManager.isInitialized) {
                    console.log('[Documentos] 🔄 Inicializando CacheManager...');
                    window.CacheManager.init();
                }
                
                // Definir userId se necessário
                if (this.app.user?.id && !window.CacheManager.currentUserId) {
                    window.CacheManager.currentUserId = this.app.user.id;
                }
                
                const result = window.CacheManager.set('documentos', this.documentos, true);
                if (result) {
                    console.log('[Documentos] ✅ Dados salvos no CacheManager:', this.documentos.length);
                } else {
                    console.warn('[Documentos] ⚠️ Falha ao salvar no CacheManager, salvando apenas no localStorage');
                    // Fallback: salvar no localStorage diretamente
                    if (this.app.user?.id) {
                        const userId = this.app.user.id;
                        localStorage.setItem(`${userId}_documentos`, JSON.stringify(this.documentos));
                    }
                }
            } else {
                console.warn('[Documentos] ⚠️ CacheManager não disponível, salvando apenas no localStorage');
                // Fallback: salvar no localStorage
                if (this.app.user?.id) {
                    const userId = this.app.user.id;
                    localStorage.setItem(`${userId}_documentos`, JSON.stringify(this.documentos));
                }
            }
            
            // ⭐ SALVAR VIA APP (FALLBACK PRINCIPAL)
            await this.app.saveAllData();
            console.log('[Documentos] ✅ Dados salvos:', this.documentos.length);
            
            // ⭐ FORÇAR SYNC (SE DISPONÍVEL)
            if (window.CacheManager && this._cacheManagerReady && window.CacheManager.forceSync) {
                setTimeout(() => {
                    window.CacheManager.forceSync().catch(() => {});
                }, 500);
            }
            
            window.dispatchEvent(new CustomEvent('documentosUpdated', {
                detail: this.documentos
            }));
            
        } catch (error) {
            console.error('[Documentos] ❌ Erro ao salvar:', error);
            
            // ⭐ TENTAR SALVAR NO LOCALSTORAGE COMO ÚLTIMO RECURSO
            try {
                if (this.app.user?.id) {
                    const userId = this.app.user.id;
                    localStorage.setItem(`${userId}_documentos`, JSON.stringify(this.documentos));
                    console.log('[Documentos] 💾 Dados salvos no localStorage como fallback');
                }
            } catch (e) {
                console.error('[Documentos] ❌ Falha no fallback:', e);
            }
        }
        
        setTimeout(() => { this.isSaving = false; }, 500);
    }

    // ============================================
    // ⭐ CARREGAR DOCUMENTOS DO CACHE
    // ============================================
    carregarDocumentosDoCache() {
        try {
            // Tentar do CacheManager primeiro
            if (window.CacheManager && this._cacheManagerReady) {
                const cached = window.CacheManager.get('documentos', null);
                if (cached && Array.isArray(cached) && cached.length > 0) {
                    this.documentos = cached;
                    console.log('[Documentos] 📦 Carregado do CacheManager:', this.documentos.length);
                    return true;
                }
            }
            
            // Fallback: localStorage
            if (this.app.user?.id) {
                const userId = this.app.user.id;
                const saved = localStorage.getItem(`${userId}_documentos`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.documentos = parsed;
                        console.log('[Documentos] 📦 Carregado do localStorage:', this.documentos.length);
                        
                        // Tentar sincronizar com CacheManager
                        if (window.CacheManager && this._cacheManagerReady) {
                            window.CacheManager.set('documentos', this.documentos, false);
                        }
                        return true;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.warn('[Documentos] ⚠️ Erro ao carregar documentos:', error);
            return false;
        }
    }

    // ============================================
    // RENDER CATEGORIAS (FILTROS)
    // ============================================
    renderCategorias() {
        const container = document.getElementById('documentos-categorias');
        if (!container) return;
        
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
        
        container.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedCategory = btn.dataset.cat;
                this.renderCategorias();
                this.renderDocumentos();
            });
        });
    }

    // ============================================
    // RENDER DOCUMENTOS (COM INDICADOR DE STORAGE)
    // ============================================
    renderDocumentos() {
        const container = document.getElementById('documentos-list');
        if (!container) return;
        
        let filtered = [...this.documentos];
        if (this.selectedCategory !== 'Todos') {
            filtered = this.documentos.filter(d => d.categoria === this.selectedCategory);
        }
        
        filtered.sort((a, b) => new Date(b.dataUpload) - new Date(a.dataUpload));
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-documentos">
                    <i class="fas fa-file-alt" style="font-size: 3.5rem; opacity: 0.4; display: block; margin-bottom: 16px;"></i>
                    <p>${this.selectedCategory !== 'Todos' ? 'Nenhum documento nesta categoria' : 'Nenhum documento enviado'}</p>
                    <button class="btn-add-documento-empty" onclick="app.modules.documentos.openUploadModal()">
                        <i class="fas fa-cloud-upload-alt"></i> Enviar Documento
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        filtered.forEach(doc => {
            const iconMap = {
                'pdf': 'fa-file-pdf',
                'doc': 'fa-file-word',
                'docx': 'fa-file-word',
                'xls': 'fa-file-excel',
                'xlsx': 'fa-file-excel',
                'ppt': 'fa-file-powerpoint',
                'pptx': 'fa-file-powerpoint',
                'jpg': 'fa-file-image',
                'jpeg': 'fa-file-image',
                'png': 'fa-file-image',
                'gif': 'fa-file-image',
                'mp4': 'fa-file-video',
                'mp3': 'fa-file-audio',
                'zip': 'fa-file-archive',
                'rar': 'fa-file-archive'
            };
            
            const ext = doc.nome?.split('.').pop()?.toLowerCase() || 'file';
            const icon = iconMap[ext] || 'fa-file';
            const sizeFormatted = this.formatFileSize(doc.tamanho || 0);
            
            // ⭐ VERIFICAR SE ESTÁ NO STORAGE
            const isStorage = doc.storagePath && doc.storagePath.length > 0;
            const isStorageUrl = doc.arquivo && doc.arquivo.startsWith('http');
            const storageIcon = isStorage || isStorageUrl ? 'fa-cloud' : 'fa-database';
            const storageLabel = isStorage || isStorageUrl ? '☁️ Nuvem' : '📦 Local';
            
            html += `
                <div class="documento-item" data-id="${doc.id}">
                    <div class="documento-icon ${doc.categoria?.toLowerCase() || 'outros'}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="documento-info">
                        <div class="documento-nome">${this.app.escapeHtml(doc.nome)}</div>
                        <div class="documento-meta">
                            <span class="documento-categoria">${this.app.escapeHtml(doc.categoria || 'Outros')}</span>
                            <span class="documento-tamanho">${sizeFormatted}</span>
                            <span class="documento-data">${this.formatDate(doc.dataUpload)}</span>
                            <span class="documento-storage" style="font-size: 0.6rem; color: var(--text-secondary);">
                                <i class="fas ${storageIcon}"></i> ${storageLabel}
                            </span>
                        </div>
                    </div>
                    <div class="documento-actions">
                        <button class="btn-download" onclick="app.modules.documentos.downloadDocumento('${doc.id}')" title="Baixar">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-delete-doc" onclick="app.modules.documentos.deleteDocumento('${doc.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        
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
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            document.getElementById('doc-nome')?.focus();
        }, 300);
    }

    closeUploadModal() {
        const modal = document.getElementById('documento-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this._selectedFile = null;
        this._isSubmitting = false;
    }

    // ============================================
    // SELECIONAR ARQUIVO
    // ============================================
    selectFile() {
        const input = document.getElementById('doc-file-input');
        if (input) input.click();
    }

    handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        
        // ⭐ LIMITE AUMENTADO PARA 20MB (Storage suporta mais)
        if (file.size > 20 * 1024 * 1024) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Arquivo muito grande! Máximo 20MB.', 'error');
            }
            return;
        }
        
        this._selectedFile = file;
        
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
    // CONVERTER FILE PARA BASE64 (FALLBACK)
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
    // ⭐ SALVAR DOCUMENTO (UPLOAD PARA STORAGE + FALLBACK)
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
        
        // ⭐ GARANTIR QUE O CACHE MANAGER ESTÁ INICIALIZADO
        await this._ensureCacheManager();
        
        // ⭐ GARANTIR QUE O DATABASE SERVICE ESTÁ DISPONÍVEL
        if (!window.DatabaseService) {
            console.warn('[Documentos] ⚠️ DatabaseService não disponível, tentando inicializar...');
            if (window.SupabaseClient?.initSupabase) {
                await window.SupabaseClient.initSupabase();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        try {
            let arquivo = null;
            let storagePath = null;
            let tipo = this._selectedFile.type || 'application/octet-stream';
            let tamanho = this._selectedFile.size;
            let nomeArquivo = this._selectedFile.name;
            
            // ⭐ TENTAR UPLOAD PARA STORAGE PRIMEIRO
            if (window.DatabaseService && window.DatabaseService.uploadDocumentoStorage) {
                console.log('[Documentos] 📤 Tentando upload para Storage...');
                console.log('[Documentos] 📊 userId:', this.app.user?.id);
                console.log('[Documentos] 📊 file.name:', this._selectedFile.name);
                console.log('[Documentos] 📊 file.size:', this._selectedFile.size);
                
                try {
                    const result = await window.DatabaseService.uploadDocumentoStorage(
                        this.app.user.id,
                        this._selectedFile,
                        nome
                    );
                    
                    if (result && result.publicUrl) {
                        arquivo = result.publicUrl;
                        storagePath = result.storagePath;
                        console.log('[Documentos] ✅ Upload para Storage concluído!');
                        console.log('[Documentos] 📎 URL:', arquivo);
                        console.log('[Documentos] 📁 Path:', storagePath);
                    } else {
                        console.log('[Documentos] ⚠️ Falha no Storage, usando Base64 fallback');
                    }
                } catch (storageError) {
                    console.error('[Documentos] ❌ Erro no Storage:', storageError);
                    console.log('[Documentos] 📦 Usando Base64 fallback');
                }
            } else {
                console.warn('[Documentos] ⚠️ DatabaseService.uploadDocumentoStorage não disponível');
            }
            
            // ⭐ FALLBACK: Se Storage falhou, usar Base64
            if (!arquivo) {
                console.log('[Documentos] 📦 Usando Base64 fallback...');
                arquivo = await this.fileToBase64(this._selectedFile);
            }
            
            const novoDoc = {
                id: Date.now().toString(),
                nome: nome,
                categoria: categoria,
                descricao: descricao,
                arquivo: arquivo,
                storagePath: storagePath || null,
                tipo: tipo,
                nomeArquivo: nomeArquivo,
                tamanho: tamanho,
                dataUpload: new Date().toISOString()
            };
            
            this.documentos.unshift(novoDoc);
            await this.salvarDados();
            this.closeUploadModal();
            this.renderDocumentos();
            this.renderCategorias();
            
            if (typeof showToast === 'function') {
                if (storagePath) {
                    showToast('✅ Documento enviado para a nuvem!', 'success');
                } else {
                    showToast('✅ Documento salvo localmente!', 'success');
                }
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
    // DELETAR DOCUMENTO (COM STORAGE)
    // ============================================
    async deleteDocumento(id) {
        const doc = this.documentos.find(d => d.id == id);
        if (!doc) return;
        
        if (!confirm(`Excluir o documento "${doc.nome}"?`)) return;
        
        try {
            // ⭐ DELETAR DO STORAGE SE EXISTIR
            if (doc.storagePath && window.DatabaseService && window.DatabaseService.deleteDocumentoStorage) {
                console.log('[Documentos] 🗑️ Deletando do Storage:', doc.storagePath);
                await window.DatabaseService.deleteDocumentoStorage(doc.storagePath);
            }
            
            this.documentos = this.documentos.filter(d => d.id != id);
            await this.salvarDados();
            this.renderDocumentos();
            this.renderCategorias();
            
            if (typeof showToast === 'function') {
                showToast('🗑️ Documento excluído!', 'success');
            }
            
        } catch (error) {
            console.error('[Documentos] ❌ Erro ao deletar:', error);
            
            // Mesmo com erro, remover do banco
            this.documentos = this.documentos.filter(d => d.id != id);
            await this.salvarDados();
            this.renderDocumentos();
            this.renderCategorias();
            
            if (typeof showToast === 'function') {
                showToast('🗑️ Documento excluído (com erro no Storage)', 'warning');
            }
        }
    }

    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notificationBadgeDocs');
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
        // Botão abrir modal
        document.getElementById('btn-add-documento')?.addEventListener('click', () => {
            this.openUploadModal();
        });
        
        // Área de upload (clique)
        document.getElementById('file-upload-area')?.addEventListener('click', () => {
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
        
        // Fechar modal - clique fora
        document.getElementById('documento-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeUploadModal();
            }
        });
        
        // Fechar modal - botões
        document.querySelectorAll('#documento-modal .btn-back-modal, #documento-modal .btn-close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeUploadModal();
            });
        });
        
        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUploadModal();
            }
        });
        
        // ⭐ ESCUTAR ATUALIZAÇÕES DA NUVEM
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[Documentos] 📡 Dados da nuvem atualizados');
            this.documentos = this.app.data.documentos || [];
            this.notifications = this.app.data.notifications || [];
            this.profile = this.app.data.profile || {};
            this.atualizarNomeUsuario();
            this.renderCategorias();
            this.renderDocumentos();
            this.updateBadge();
        });
        
        // ⭐ ESCUTAR ATUALIZAÇÕES DE DOCUMENTOS
        window.addEventListener('documentosUpdated', () => {
            this.documentos = this.app.data.documentos || [];
            this.renderCategorias();
            this.renderDocumentos();
        });
        
        // ⭐ ESCUTAR SINCronização CONCLUÍDA
        window.addEventListener('syncCompleted', (e) => {
            console.log('[Documentos] 📡 Sync concluído:', e.detail);
            if (e.detail && e.detail.success) {
                this.documentos = this.app.data.documentos || [];
                this.renderDocumentos();
                this.renderCategorias();
            }
        });
        
        // ⭐ ESCUTAR EVENTO DE CACHE PRONTO
        window.addEventListener('cacheReady', () => {
            console.log('[Documentos] 📡 Cache pronto, atualizando...');
            this._cacheManagerReady = true;
            // Tentar carregar documentos do cache
            this.carregarDocumentosDoCache();
            this.renderDocumentos();
            this.renderCategorias();
        });
    }
}

console.log('[Documentos] ✅ Módulo carregado com Storage + Base64 fallback + CacheManager seguro!');