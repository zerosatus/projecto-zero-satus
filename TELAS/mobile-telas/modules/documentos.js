// ============================================
// modules/documentos.js - GERENCIADOR DE DOCUMENTOS (COMPLETO CORRIGIDO)
// COM SUPORTE A STORAGE (NUVEM), FALLBACK BASE64, COMPRESSÃO DE IMAGENS E INDEXEDDB
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

        let attempts = 0;
        const maxAttempts = 25;

        while (attempts < maxAttempts) {
            if (window.CacheManager) {
                console.log('[Documentos] ✅ CacheManager encontrado!');
                
                if (!window.CacheManager.isInitialized) {
                    console.log('[Documentos] 🔄 Inicializando CacheManager...');
                    window.CacheManager.init();
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                if (this.app?.user?.id && !window.CacheManager.currentUserId) {
                    window.CacheManager.currentUserId = this.app.user.id;
                }

                this._cacheManagerReady = true;
                return true;
            }

            if (attempts === 5) {
                console.log('[Documentos] 🔄 Tentando carregar CacheManager manualmente...');
                try {
                    const script = document.createElement('script');
                    script.src = '/TELAS/mobile-telas/cache-manager.js';
                    script.onload = () => {
                        console.log('[Documentos] ✅ CacheManager carregado via script!');
                        if (window.CacheManager && !window.CacheManager.isInitialized) {
                            window.CacheManager.init();
                            if (this.app?.user?.id) {
                                window.CacheManager.currentUserId = this.app.user.id;
                            }
                            this._cacheManagerReady = true;
                            window.dispatchEvent(new CustomEvent('cacheReady'));
                        }
                    };
                    script.onerror = () => {
                        console.warn('[Documentos] ⚠️ Falha ao carregar script, tentando caminho alternativo...');
                        const fallbackScript = document.createElement('script');
                        fallbackScript.src = 'cache-manager.js';
                        fallbackScript.onload = () => {
                            if (window.CacheManager) {
                                window.CacheManager.init();
                                if (this.app?.user?.id) {
                                    window.CacheManager.currentUserId = this.app.user.id;
                                }
                                this._cacheManagerReady = true;
                                window.dispatchEvent(new CustomEvent('cacheReady'));
                            }
                        };
                        document.head.appendChild(fallbackScript);
                    };
                    document.head.appendChild(script);
                    await new Promise(resolve => setTimeout(resolve, 1500));
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
    // ⭐ COMPRIMIR IMAGEM (REDUZ TAMANHO PARA EVITAR QUOTA EXCEEDED)
    // ============================================
    async _compressImage(file, maxSizeKB = 500) {
        if (!file || !file.type || !file.type.startsWith('image/')) {
            return file;
        }

        if (file.size < maxSizeKB * 1024) {
            console.log('[Documentos] ℹ️ Imagem já é pequena, pulando compressão');
            return file;
        }

        console.log(`[Documentos] 🖼️ Comprimindo imagem: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`);

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 800;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height = (height * MAX_SIZE) / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width = (width * MAX_SIZE) / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const quality = Math.min(0.8, (maxSizeKB * 1024) / (file.size * 1.5));
                    const finalQuality = Math.max(0.4, Math.min(0.9, quality));

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            console.warn('[Documentos] ⚠️ Falha ao comprimir, usando original');
                            resolve(file);
                            return;
                        }

                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg'
                        });

                        const reduction = ((file.size - compressedFile.size) / file.size * 100).toFixed(0);
                        console.log(`[Documentos] ✅ Imagem comprimida: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${reduction}% menor)`);
                        
                        resolve(compressedFile);
                    }, 'image/jpeg', Math.min(0.85, Math.max(0.5, finalQuality)));
                };
                img.onerror = () => {
                    console.warn('[Documentos] ⚠️ Erro ao carregar imagem, usando original');
                    resolve(file);
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                console.warn('[Documentos] ⚠️ Erro ao ler arquivo, usando original');
                resolve(file);
            };
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // ⭐ VERIFICAR ESPAÇO NO STORAGE
    // ============================================
    _checkStorageSpace() {
        try {
            const testKey = '__storage_test__';
            const testValue = 'A'.repeat(1024 * 100);
            localStorage.setItem(testKey, testValue);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('[Documentos] ⚠️ Storage pode estar cheio:', e.message);
            return false;
        }
    }

    // ============================================
    // ⭐ SALVAR NO INDEXEDDB (PARA DOCUMENTOS GRANDES)
    // ============================================
    async _salvarNoIndexedDB(key, value) {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open('ZeroSatusDocs', 2);
                
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('documentos')) {
                        const store = db.createObjectStore('documentos', { keyPath: 'id' });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                };
                
                request.onsuccess = (e) => {
                    const db = e.target.result;
                    const transaction = db.transaction(['documentos'], 'readwrite');
                    const store = transaction.objectStore('documentos');
                    const doc = { 
                        id: key, 
                        data: value, 
                        timestamp: Date.now(),
                        userId: this.app?.user?.id || 'unknown'
                    };
                    const req = store.put(doc);
                    req.onsuccess = () => {
                        console.log(`[Documentos] ✅ Salvou ${key} no IndexedDB`);
                        resolve(true);
                    };
                    req.onerror = () => reject(req.error);
                    transaction.oncomplete = () => db.close();
                };
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('[Documentos] ❌ Erro no IndexedDB:', error);
                reject(error);
            }
        });
    }

    async _carregarDoIndexedDB(key) {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('ZeroSatusDocs', 2);
                request.onsuccess = (e) => {
                    const db = e.target.result;
                    const transaction = db.transaction(['documentos'], 'readonly');
                    const store = transaction.objectStore('documentos');
                    const req = store.get(key);
                    req.onsuccess = () => {
                        const result = req.result?.data || null;
                        if (result) {
                            console.log(`[Documentos] 📦 Carregou ${key} do IndexedDB`);
                        }
                        resolve(result);
                    };
                    req.onerror = () => resolve(null);
                    transaction.oncomplete = () => db.close();
                };
                request.onerror = () => resolve(null);
            } catch (error) {
                console.warn('[Documentos] ⚠️ Erro ao ler IndexedDB:', error);
                resolve(null);
            }
        });
    }

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[Documentos] 📁 Renderizando...');
        
        this.documentos = data.documentos || [];
        this.notifications = data.notifications || [];
        this.profile = data.profile || {};
        
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
    // ⭐ SALVAR DADOS (COM VERIFICAÇÃO DE ESPAÇO E FALLBACK)
    // ============================================
    async salvarDados() {
        if (this.isSaving || !this.app) return;
        this.isSaving = true;
        
        try {
            await this._ensureCacheManager();
            
            this.app.data.documentos = this.documentos;
            
            // Verificar espaço no storage
            const hasSpace = this._checkStorageSpace();
            
            // ⭐ SALVAR NO CACHE MANAGER (SE DISPONÍVEL)
            if (window.CacheManager && this._cacheManagerReady) {
                if (!window.CacheManager.isInitialized) {
                    console.log('[Documentos] 🔄 Inicializando CacheManager...');
                    window.CacheManager.init();
                }
                
                if (this.app.user?.id && !window.CacheManager.currentUserId) {
                    window.CacheManager.currentUserId = this.app.user.id;
                }
                
                try {
                    const result = window.CacheManager.set('documentos', this.documentos, true);
                    if (result) {
                        console.log('[Documentos] ✅ Dados salvos no CacheManager:', this.documentos.length);
                    } else {
                        console.warn('[Documentos] ⚠️ Falha ao salvar no CacheManager');
                        this._salvarFallback();
                    }
                } catch (cacheError) {
                    console.warn('[Documentos] ⚠️ Erro no CacheManager:', cacheError.message);
                    this._salvarFallback();
                }
            } else {
                console.warn('[Documentos] ⚠️ CacheManager não disponível');
                this._salvarFallback();
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
            
            // ⭐ TENTAR SALVAR NO INDEXEDDB COMO ÚLTIMO RECURSO
            try {
                if (this.app.user?.id) {
                    await this._salvarNoIndexedDB(this.app.user.id, this.documentos);
                    console.log('[Documentos] 💾 Dados salvos no IndexedDB como fallback');
                }
            } catch (e) {
                console.error('[Documentos] ❌ Falha no fallback IndexedDB:', e);
            }
        }
        
        setTimeout(() => { this.isSaving = false; }, 500);
    }

    // ============================================
    // ⭐ SALVAR FALLBACK (LOCALSTORAGE + SESSIONSTORAGE)
    // ============================================
    _salvarFallback() {
        try {
            if (this.app.user?.id) {
                const userId = this.app.user.id;
                
                try {
                    localStorage.setItem(`${userId}_documentos`, JSON.stringify(this.documentos));
                    console.log('[Documentos] 💾 Salvou no localStorage');
                    return;
                } catch (e) {
                    console.warn('[Documentos] ⚠️ localStorage cheio, tentando sessionStorage...');
                }
                
                try {
                    sessionStorage.setItem(`${userId}_documentos`, JSON.stringify(this.documentos));
                    console.log('[Documentos] 💾 Salvou no sessionStorage');
                } catch (e) {
                    console.warn('[Documentos] ⚠️ sessionStorage também cheio!');
                }
            }
        } catch (error) {
            console.error('[Documentos] ❌ Falha no fallback:', error);
        }
    }

    // ============================================
    // ⭐ CARREGAR DOCUMENTOS DO CACHE
    // ============================================
    async carregarDocumentosDoCache() {
        try {
            if (window.CacheManager && this._cacheManagerReady) {
                const cached = window.CacheManager.get('documentos', null);
                if (cached && Array.isArray(cached) && cached.length > 0) {
                    this.documentos = cached;
                    console.log('[Documentos] 📦 Carregado do CacheManager:', this.documentos.length);
                    return true;
                }
            }
            
            if (this.app.user?.id) {
                const userId = this.app.user.id;
                
                let saved = localStorage.getItem(`${userId}_documentos`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.documentos = parsed;
                        console.log('[Documentos] 📦 Carregado do localStorage:', this.documentos.length);
                        
                        if (window.CacheManager && this._cacheManagerReady) {
                            window.CacheManager.set('documentos', this.documentos, false);
                        }
                        return true;
                    }
                }
                
                saved = sessionStorage.getItem(`${userId}_documentos`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.documentos = parsed;
                        console.log('[Documentos] 📦 Carregado do sessionStorage:', this.documentos.length);
                        return true;
                    }
                }
                
                const indexedData = await this._carregarDoIndexedDB(userId);
                if (indexedData && Array.isArray(indexedData) && indexedData.length > 0) {
                    this.documentos = indexedData;
                    console.log('[Documentos] 📦 Carregado do IndexedDB:', this.documentos.length);
                    return true;
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
                    <ion-icon name="document-outline" style="font-size: 3rem; opacity: 0.4; display: block; margin-bottom: 16px;"></ion-icon>
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
                'pdf': 'document',
                'doc': 'document',
                'docx': 'document',
                'xls': 'document',
                'xlsx': 'document',
                'ppt': 'document',
                'pptx': 'document',
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
            const icon = iconMap[ext] || 'document';
            const sizeFormatted = this.formatFileSize(doc.tamanho || 0);
            
            const isStorage = doc.storagePath && doc.storagePath.length > 0;
            const isStorageUrl = doc.arquivo && doc.arquivo.startsWith('http');
            const storageLabel = isStorage || isStorageUrl ? '☁️ Nuvem' : '📦 Local';
            
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
                            <span class="documento-storage" style="font-size: 0.6rem; color: var(--text-secondary);">
                                ${storageLabel}
                            </span>
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
        this._isSubmitting = false;
        
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

    async handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        
        if (file.size > 20 * 1024 * 1024) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Arquivo muito grande! Máximo 20MB.', 'error');
            }
            return;
        }
        
        let processedFile = file;
        if (file.type.startsWith('image/')) {
            processedFile = await this._compressImage(file, 500);
        }
        
        this._selectedFile = processedFile;
        
        const nomeInput = document.getElementById('doc-nome');
        if (nomeInput && !nomeInput.value) {
            nomeInput.value = file.name;
        }
        
        const preview = document.getElementById('doc-file-preview');
        if (preview) {
            const sizeKB = (processedFile.size / 1024).toFixed(1);
            preview.textContent = `${file.name} (${sizeKB}KB)`;
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
    // ⭐ SALVAR DOCUMENTO (UPLOAD PARA STORAGE + FALLBACK) - CORRIGIDO
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
        
        await this._ensureCacheManager();
        
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
            
            if (!arquivo) {
                console.log('[Documentos] 📦 Usando Base64 fallback...');
                arquivo = await this.fileToBase64(this._selectedFile);
            }
            
            if (arquivo && arquivo.length > 5 * 1024 * 1024) {
                console.warn('[Documentos] ⚠️ Base64 muito grande (>5MB), pode causar problemas de storage');
                if (typeof showToast === 'function') {
                    showToast('⚠️ Arquivo muito grande para salvar localmente! Tente um arquivo menor.', 'warning');
                }
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
            
            if (!storagePath && arquivo && arquivo.length > 3 * 1024 * 1024) {
                if (typeof showToast === 'function') {
                    showToast('📦 Documento salvo localmente (arquivo grande)', 'info');
                }
            }
            
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
        document.getElementById('btn-add-documento')?.addEventListener('click', () => {
            this.openUploadModal();
        });
        
        document.getElementById('file-upload-area')?.addEventListener('click', () => {
            this.selectFile();
        });
        
        document.getElementById('doc-file-input')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        document.getElementById('btn-save-documento')?.addEventListener('click', () => {
            this.saveDocumento();
        });
        
        document.getElementById('doc-nome')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveDocumento();
            }
        });
        
        document.getElementById('documento-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeUploadModal();
            }
        });
        
        document.querySelectorAll('#documento-modal .btn-back-modal, #documento-modal .btn-close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeUploadModal();
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUploadModal();
            }
        });
        
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
        
        window.addEventListener('documentosUpdated', () => {
            this.documentos = this.app.data.documentos || [];
            this.renderCategorias();
            this.renderDocumentos();
        });
        
        window.addEventListener('syncCompleted', (e) => {
            console.log('[Documentos] 📡 Sync concluído:', e.detail);
            if (e.detail && e.detail.success) {
                this.documentos = this.app.data.documentos || [];
                this.renderDocumentos();
                this.renderCategorias();
            }
        });
        
        window.addEventListener('cacheReady', () => {
            console.log('[Documentos] 📡 Cache pronto, atualizando...');
            this._cacheManagerReady = true;
            this.carregarDocumentosDoCache();
            this.renderDocumentos();
            this.renderCategorias();
        });
    }
}

console.log('[Documentos] ✅ Módulo carregado com Storage + Base64 fallback + Compressão de imagens + IndexedDB!');