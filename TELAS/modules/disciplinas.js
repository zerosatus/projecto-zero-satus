// ============================================
// modules/disciplinas.js - MÓDULO DE DISCIPLINAS (PC)
// ⭐ CORRIGIDO: sem loop de re-render, _salvar unificado
// ⭐ PROTEÇÃO contra cloudDataLoaded sobrescrever dados locais
// ============================================

class DisciplinasModule {
    constructor(app) {
        this.app = app;
        this.name = 'disciplinas';
        
        this.disciplinas = [];
        this.editando = null;
        this._carregado = false;
        this._sincronizando = false;
        this._listenersSetup = false;
        this._salvandoAgora = false;
        this._eventDebounce = null;
        
        this.coresPadrao = [
            '#9333ea', '#3b82f6', '#ef4444', '#10b981',
            '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'
        ];
        
        this.iconesDisponiveis = [
            { value: 'fa-book', label: '📖 Livro' },
            { value: 'fa-square-root-variable', label: '📐 Matemática' },
            { value: 'fa-atom', label: '⚛️ Átomo' },
            { value: 'fa-flask', label: '🧪 Laboratório' },
            { value: 'fa-dna', label: '🧬 DNA' },
            { value: 'fa-globe-americas', label: '🌍 Globo' },
            { value: 'fa-language', label: '🌐 Idioma' },
            { value: 'fa-landmark', label: '🏛️ História' },
            { value: 'fa-palette', label: '🎨 Arte' },
            { value: 'fa-music', label: '🎵 Música' },
            { value: 'fa-laptop-code', label: '💻 Código' },
            { value: 'fa-calculator', label: '🧮 Calculadora' },
            { value: 'fa-pen', label: '✏️ Escrita' },
            { value: 'fa-star', label: '⭐ Estrela' },
            { value: 'fa-heart', label: '❤️ Coração' },
            { value: 'fa-bolt', label: '⚡ Energia' }
        ];
        
        console.log('[Disciplinas] 📚 Módulo inicializado');
    }
    
    // ============================================
    // RENDER
    // ============================================
    render(data) {
        if (!this._carregado) this.carregar();
        
        const viewAtiva = document.getElementById('view-disciplinas')?.classList.contains('active');
        if (viewAtiva) {
            this._renderizarListaCompleta();
        }
    }
    
    // ============================================
    // CARREGAR
    // ============================================
    carregar() {
        try {
            if (window.CacheManager) {
                const doCache = window.CacheManager.get('disciplinas', null);
                if (Array.isArray(doCache) && doCache.length > 0) {
                    this.disciplinas = doCache;
                    this._carregado = true;
                    console.log('[Disciplinas] ✅ Carregado do CacheManager:', doCache.length);
                    return this.disciplinas;
                }
            }
            
            const email = this.app?.user?.email || this.app?.data?.profile?.email;
            if (email) {
                const chave = `disciplinas_${email}`;
                const doLocal = localStorage.getItem(chave);
                if (doLocal) {
                    try {
                        const parsed = JSON.parse(doLocal);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            this.disciplinas = parsed;
                            this._carregado = true;
                            console.log('[Disciplinas] 📦 Carregado do localStorage:', parsed.length);
                            if (window.CacheManager) {
                                window.CacheManager.set('disciplinas', parsed, true);
                            }
                            return this.disciplinas;
                        }
                    } catch (e) {
                        console.warn('[Disciplinas] ⚠️ Erro localStorage:', e);
                    }
                }
            }
            
            if (Array.isArray(this.app?.data?.disciplinas) && this.app.data.disciplinas.length > 0) {
                this.disciplinas = this.app.data.disciplinas;
                this._carregado = true;
                console.log('[Disciplinas] 📦 Carregado do app.data:', this.disciplinas.length);
                return this.disciplinas;
            }
            
            this.disciplinas = [];
            this._carregado = true;
            console.log('[Disciplinas] ℹ️ Nenhuma disciplina encontrada');
            return this.disciplinas;
            
        } catch (error) {
            console.error('[Disciplinas] ❌ Erro ao carregar:', error);
            this.disciplinas = [];
            this._carregado = true;
            return this.disciplinas;
        }
    }
    
    // ============================================
    // SALVAR (UNIFICADO + DEBOUNCE NO EVENTO)
    // ============================================
    async _salvar() {
        this._salvandoAgora = true;
        try {
            const email = this.app?.user?.email || this.app?.data?.profile?.email;
            if (email) {
                localStorage.setItem(`disciplinas_${email}`, JSON.stringify(this.disciplinas));
            }
            
            if (this.app?.data) {
                this.app.data.disciplinas = [...this.disciplinas];
            }
            
            if (window.CacheManager) {
                // ⭐ false = NÃO força sync imediato (usa o debounce de 2s)
                window.CacheManager.set('disciplinas', this.disciplinas, false);
            }
            
            // ⭐ DISPARAR EVENTO APENAS UMA VEZ, COM DEBOUNCE
            if (this._eventDebounce) clearTimeout(this._eventDebounce);
            this._eventDebounce = setTimeout(() => {
                window.dispatchEvent(new CustomEvent('disciplinasUpdated', {
                    detail: [...this.disciplinas]
                }));
            }, 150);
            
            console.log('[Disciplinas] 💾 Salvo:', this.disciplinas.length);
            return true;
        } catch (error) {
            console.error('[Disciplinas] ❌ Erro ao salvar:', error);
            return false;
        } finally {
            setTimeout(() => { this._salvandoAgora = false; }, 1000);
        }
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
    getTodas() {
        if (!this._carregado) this.carregar();
        return [...this.disciplinas];
    }
    
    getPorId(id) {
        if (!this._carregado) this.carregar();
        return this.disciplinas.find(d => d.id === id) || null;
    }
    
    getPorNome(nome) {
        if (!this._carregado) this.carregar();
        if (!nome) return null;
        const normalizado = this.normalizar(nome);
        return this.disciplinas.find(d => this.normalizar(d.nome) === normalizado) || null;
    }
    
    getCor(disciplinaOuNome) {
        if (typeof disciplinaOuNome === 'object' && disciplinaOuNome !== null) {
            if (disciplinaOuNome.cor) return disciplinaOuNome.cor;
            disciplinaOuNome = disciplinaOuNome.nome || disciplinaOuNome.materia || '';
        }
        const encontrada = this.getPorNome(disciplinaOuNome);
        if (encontrada?.cor) return encontrada.cor;
        return this._corPorHash(disciplinaOuNome);
    }
    
    getIcone(disciplinaOuNome) {
        if (typeof disciplinaOuNome === 'object' && disciplinaOuNome !== null) {
            if (disciplinaOuNome.icone) return disciplinaOuNome.icone;
            disciplinaOuNome = disciplinaOuNome.nome || disciplinaOuNome.materia || '';
        }
        const encontrada = this.getPorNome(disciplinaOuNome);
        if (encontrada?.icone) return encontrada.icone;
        return 'fa-book';
    }
    
    estaEmUso(id) {
        const disc = this.getPorId(id);
        if (!disc) return false;
        const nomeNormalizado = this.normalizar(disc.nome);
        
        const tasks = this.app?.data?.tasks || [];
        if (tasks.some(t => this.normalizar(t.disciplina || t.subject || '') === nomeNormalizado)) return true;
        
        const schedule = this.app?.data?.weeklySchedule || {};
        if (Object.values(schedule).some(day => 
            Array.isArray(day) && day.some(aula => this.normalizar(aula.materia || '') === nomeNormalizado)
        )) return true;
        
        const events = this.app?.data?.calendarEvents || [];
        if (events.some(e => this.normalizar(e.disciplina || '') === nomeNormalizado)) return true;
        
        const notes = this.app?.data?.notes || [];
        if (notes.some(n => this.normalizar(n.disciplina || '') === nomeNormalizado)) return true;
        
        return false;
    }
    
    // ============================================
    // CRUD (SEM forceSync imediato!)
    // ============================================
    async criar(nome, cor, icone = 'fa-book') {
        try {
            if (!nome || !nome.trim()) {
                return { success: false, message: 'Nome é obrigatório' };
            }
            
            const nomeLimpo = nome.trim();
            const id = this.normalizar(nomeLimpo);
            
            if (this.getPorId(id)) {
                return { success: false, message: 'Disciplina já existe!' };
            }
            
            const nova = {
                id,
                nome: nomeLimpo,
                cor: cor || this.coresPadrao[0],
                icone: icone || 'fa-book',
                criadaEm: new Date().toISOString()
            };
            
            this.disciplinas.push(nova);
            
            await this._salvar();
            
            window.dispatchEvent(new CustomEvent('disciplinaCriada', { detail: nova }));
            
            console.log('[Disciplinas] ✅ Criada:', nova.nome);
            return { success: true, disciplina: nova };
            
        } catch (error) {
            console.error('[Disciplinas] ❌ Erro ao criar:', error);
            return { success: false, message: error.message };
        }
    }
    
    async editar(id, dados) {
        try {
            const index = this.disciplinas.findIndex(d => d.id === id);
            if (index === -1) {
                return { success: false, message: 'Disciplina não encontrada' };
            }
            
            const antiga = this.disciplinas[index];
            let novoId = antiga.id;
            
            if (dados.nome && dados.nome.trim() !== antiga.nome) {
                novoId = this.normalizar(dados.nome.trim());
                if (novoId !== antiga.id && this.getPorId(novoId)) {
                    return { success: false, message: 'Já existe outra disciplina com esse nome' };
                }
            }
            
            const atualizada = {
                ...antiga,
                id: novoId,
                nome: dados.nome?.trim() || antiga.nome,
                cor: dados.cor || antiga.cor,
                icone: dados.icone || antiga.icone,
                atualizadaEm: new Date().toISOString()
            };
            
            this.disciplinas[index] = atualizada;
            
            await this._salvar();
            
            window.dispatchEvent(new CustomEvent('disciplinaAtualizada', { detail: atualizada }));
            
            console.log('[Disciplinas] ✅ Editada:', atualizada.nome);
            return { success: true, disciplina: atualizada };
            
        } catch (error) {
            console.error('[Disciplinas] ❌ Erro ao editar:', error);
            return { success: false, message: error.message };
        }
    }
    
    async deletar(id) {
        try {
            const index = this.disciplinas.findIndex(d => d.id === id);
            if (index === -1) {
                return { success: false, message: 'Disciplina não encontrada' };
            }
            
            const removida = this.disciplinas[index];
            this.disciplinas.splice(index, 1);
            
            if (window.CacheManager?.delete) {
                window.CacheManager.delete('disciplinas', id, true);
            } else {
                await this._salvar();
            }
            
            // ⭐ dispara evento manualmente após deletar (o CacheManager.delete não dispara)
            if (this._eventDebounce) clearTimeout(this._eventDebounce);
            this._eventDebounce = setTimeout(() => {
                window.dispatchEvent(new CustomEvent('disciplinasUpdated', {
                    detail: [...this.disciplinas]
                }));
            }, 150);
            
            window.dispatchEvent(new CustomEvent('disciplinaDeletada', { detail: removida }));
            
            console.log('[Disciplinas] ✅ Deletada:', removida.nome);
            return { success: true, disciplina: removida };
            
        } catch (error) {
            console.error('[Disciplinas] ❌ Erro ao deletar:', error);
            return { success: false, message: error.message };
        }
    }
    
    // ============================================
    // HELPERS
    // ============================================
    normalizar(texto) {
        if (!texto) return '';
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }
    
    _corPorHash(texto) {
        if (!texto) return this.coresPadrao[0];
        let hash = 0;
        const str = this.normalizar(texto);
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return this.coresPadrao[Math.abs(hash) % this.coresPadrao.length];
    }
    
    getIconesDisponiveis() { return [...this.iconesDisponiveis]; }
    getCoresPadrao() { return [...this.coresPadrao]; }
    
    // ============================================
    // VIEW: LISTA DE DISCIPLINAS
    // ============================================
    _renderizarListaCompleta() {
        const container = document.getElementById('disciplinas-list');
        if (!container) return;
        
        if (!this._carregado) this.carregar();
        
        const disciplinas = this.disciplinas;
        
        if (disciplinas.length === 0) {
            container.innerHTML = `
                <div class="empty-disciplinas">
                    <ion-icon name="book-outline"></ion-icon>
                    <p>Nenhuma disciplina cadastrada</p>
                    <button class="btn-add-documento" onclick="app.modules.disciplinas.abrirModal()">
                        <ion-icon name="add-outline"></ion-icon> Adicionar Disciplina
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        disciplinas.forEach(d => {
            const emUso = this.estaEmUso(d.id);
            html += `
                <div class="disciplina-card" data-id="${d.id}">
                    <div class="card-top">
                        <div class="card-icon" style="background: ${d.cor};">
                            <i class="fas ${d.icone || 'fa-book'}"></i>
                        </div>
                        <div class="card-actions">
                            <button class="btn-edit" data-action="editar" data-id="${d.id}" title="Editar">
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                            <button class="btn-delete" data-action="deletar" data-id="${d.id}" title="Excluir">
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>
                    </div>
                    <div class="card-info">
                        <h3>${this.app.escapeHtml(d.nome)}</h3>
                        <div class="card-stats">
                            ${emUso ? '<span><ion-icon name="checkmark-circle-outline"></ion-icon> Em uso</span>' : '<span><ion-icon name="ellipse-outline"></ion-icon> Não usada</span>'}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        container.querySelectorAll('[data-action="editar"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._iniciarEdicao(btn.dataset.id);
            });
        });
        
        container.querySelectorAll('[data-action="deletar"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._confirmarDelete(btn.dataset.id);
            });
        });
    }
    
    // ============================================
    // MODAL - COMPATÍVEL COM IDs DO index.html PC
    // ============================================
    abrirModal(disciplina = null) {
        console.log('[Disciplinas] 📂 Abrindo modal');
        
        if (!this._carregado) this.carregar();
        
        const modal = document.getElementById('modalDisciplinas');
        if (!modal) {
            console.warn('[Disciplinas] ⚠️ Modal #modalDisciplinas não encontrado');
            return;
        }
        
        const title = document.getElementById('modalDiscTitle');
        const nomeInput = document.getElementById('discNome');
        const corInput = document.getElementById('discCor');
        const corHex = document.getElementById('colorHexDisplay');
        const iconeSelect = document.getElementById('discIcone');
        const btnSalvar = document.getElementById('btnSalvarDisc');
        
        if (disciplina) {
            this.editando = disciplina;
            if (title) title.textContent = 'Editar Disciplina';
            if (nomeInput) nomeInput.value = disciplina.nome;
            if (corInput) corInput.value = disciplina.cor;
            if (corHex) corHex.textContent = disciplina.cor;
            if (iconeSelect) iconeSelect.value = disciplina.icone || 'fa-book';
            if (btnSalvar) btnSalvar.textContent = 'Salvar Alterações';
        } else {
            this.editando = null;
            if (title) title.textContent = 'Nova Disciplina';
            if (nomeInput) nomeInput.value = '';
            if (corInput) corInput.value = this.coresPadrao[0];
            if (corHex) corHex.textContent = this.coresPadrao[0];
            if (iconeSelect) iconeSelect.value = 'fa-book';
            if (btnSalvar) btnSalvar.textContent = 'Criar Disciplina';
        }
        
        if (iconeSelect && iconeSelect.options.length <= 1) {
            iconeSelect.innerHTML = '';
            this.iconesDisponiveis.forEach(ic => {
                const opt = document.createElement('option');
                opt.value = ic.value;
                opt.textContent = ic.label;
                iconeSelect.appendChild(opt);
            });
            if (disciplina) iconeSelect.value = disciplina.icone || 'fa-book';
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => nomeInput?.focus(), 300);
        
        this._renderizarListaDisciplinasModal();
    }
    
    _renderizarListaDisciplinasModal() {
        const container = document.getElementById('listaDisciplinas');
        if (!container) return;
        
        if (!this._carregado) this.carregar();
        
        const disciplinas = this.disciplinas;
        
        if (disciplinas.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Nenhuma disciplina cadastrada.</p>';
            return;
        }
        
        let html = '';
        disciplinas.forEach(d => {
            const emUso = this.estaEmUso(d.id);
            html += `
                <div class="disciplina-card" data-id="${d.id}">
                    <div class="disciplina-info">
                        <div class="disciplina-color" style="background-color: ${d.cor};">
                            <i class="fas ${d.icone || 'fa-book'}"></i>
                        </div>
                        <div class="disciplina-text">
                            <strong>${this.app.escapeHtml(d.nome)}</strong>
                            <span class="disciplina-id">${d.id}</span>
                            ${emUso ? '<span class="badge-uso">Em uso</span>' : ''}
                        </div>
                    </div>
                    <div class="disciplina-actions">
                        <button class="btn-edit-disc" data-action="editar" data-id="${d.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete-disc" data-action="deletar" data-id="${d.id}" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        container.querySelectorAll('[data-action="editar"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const disc = this.getPorId(btn.dataset.id);
                if (disc) {
                    this.editando = disc;
                    
                    const title = document.getElementById('modalDiscTitle');
                    const nomeInput = document.getElementById('discNome');
                    const corInput = document.getElementById('discCor');
                    const corHex = document.getElementById('colorHexDisplay');
                    const iconeSelect = document.getElementById('discIcone');
                    const btnSalvar = document.getElementById('btnSalvarDisc');
                    
                    if (title) title.textContent = 'Editar Disciplina';
                    if (nomeInput) nomeInput.value = disc.nome;
                    if (corInput) corInput.value = disc.cor;
                    if (corHex) corHex.textContent = disc.cor;
                    if (iconeSelect) iconeSelect.value = disc.icone || 'fa-book';
                    if (btnSalvar) btnSalvar.textContent = 'Salvar Alterações';
                    
                    setTimeout(() => nomeInput?.focus(), 100);
                }
            });
        });
        
        container.querySelectorAll('[data-action="deletar"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._confirmarDelete(btn.dataset.id);
            });
        });
    }
    
    fecharModal() {
        const modal = document.getElementById('modalDisciplinas');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.editando = null;
    }
    
    _iniciarEdicao(id) {
        const disc = this.getPorId(id);
        if (disc) this.abrirModal(disc);
    }
    
    async _confirmarDelete(id) {
        const disc = this.getPorId(id);
        if (!disc) return;
        
        const emUso = this.estaEmUso(id);
        let msg = `Excluir a disciplina "${disc.nome}"?`;
        if (emUso) {
            msg += '\n\n⚠️ Esta disciplina está em uso em tarefas, horários, eventos ou anotações.';
        }
        
        if (!confirm(msg)) return;
        
        const result = await this.deletar(id);
        if (result.success) {
            // ⭐ Só re-renderiza se a view estiver ativa
            const viewAtiva = document.getElementById('view-disciplinas')?.classList.contains('active');
            if (viewAtiva) this._renderizarListaCompleta();
            
            // ⭐ Só re-renderiza o modal se estiver aberto
            const modalAberto = document.getElementById('modalDisciplinas')?.classList.contains('active');
            if (modalAberto) this._renderizarListaDisciplinasModal();
            
            this._mostrarToast('Disciplina excluída!', 'success');
            
            if (this.editando && this.editando.id === id) {
                this.editando = null;
                const title = document.getElementById('modalDiscTitle');
                const nomeInput = document.getElementById('discNome');
                const btnSalvar = document.getElementById('btnSalvarDisc');
                if (title) title.textContent = 'Nova Disciplina';
                if (nomeInput) nomeInput.value = '';
                if (btnSalvar) btnSalvar.textContent = 'Criar Disciplina';
            }
        } else {
            this._mostrarToast(result.message || 'Erro ao excluir', 'error');
        }
    }
    
    async _salvarFormulario(event) {
        if (event) event.preventDefault();
        
        const nome = document.getElementById('discNome')?.value?.trim();
        const cor = document.getElementById('discCor')?.value;
        const icone = document.getElementById('discIcone')?.value;
        
        if (!nome) {
            this._mostrarToast('Digite o nome da disciplina!', 'error');
            return;
        }
        
        const editandoAntes = this.editando;
        let result;
        
        if (this.editando) {
            result = await this.editar(this.editando.id, { nome, cor, icone });
        } else {
            result = await this.criar(nome, cor, icone);
        }
        
        if (result.success) {
            // ⭐ Só re-renderiza o modal se estiver aberto
            const modalAberto = document.getElementById('modalDisciplinas')?.classList.contains('active');
            if (modalAberto) {
                this._renderizarListaDisciplinasModal();
            }
            
            // ⭐ Só re-renderiza a view se estiver ativa
            const viewAtiva = document.getElementById('view-disciplinas')?.classList.contains('active');
            if (viewAtiva) {
                this._renderizarListaCompleta();
            }
            
            this._mostrarToast(
                editandoAntes ? 'Disciplina atualizada!' : 'Disciplina criada!',
                'success'
            );
            
            // Limpa o form
            this.editando = null;
            const title = document.getElementById('modalDiscTitle');
            const nomeInput = document.getElementById('discNome');
            const corInput = document.getElementById('discCor');
            const corHex = document.getElementById('colorHexDisplay');
            const btnSalvar = document.getElementById('btnSalvarDisc');
            
            if (title) title.textContent = 'Nova Disciplina';
            if (nomeInput) nomeInput.value = '';
            if (corInput) corInput.value = this.coresPadrao[0];
            if (corHex) corHex.textContent = this.coresPadrao[0];
            if (btnSalvar) btnSalvar.textContent = 'Criar Disciplina';
            
            // ⭐ Foco de volta no input (se modal continuar aberto)
            if (modalAberto) {
                setTimeout(() => nomeInput?.focus(), 100);
            }
            
        } else {
            this._mostrarToast(result.message || 'Erro ao salvar', 'error');
        }
    }
    
    _mostrarToast(mensagem, tipo = 'success') {
        if (typeof showToast === 'function') {
            showToast(mensagem, tipo);
            return;
        }
        
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
        } else {
            console.log(`[Disciplinas] 📢 ${mensagem}`);
        }
    }
    
    // ============================================
    // SETUP EVENTOS
    // ============================================
    setupEventos() {
        if (this._listenersSetup) return;
        this._listenersSetup = true;
        
        console.log('[Disciplinas] 🔧 Configurando eventos');
        
        const form = document.getElementById('formDisciplina');
        if (form && !form._disciplinasListener) {
            form._disciplinasListener = true;
            form.addEventListener('submit', (e) => this._salvarFormulario(e));
        }
        
        const corInput = document.getElementById('discCor');
        if (corInput && !corInput._disciplinasListener) {
            corInput._disciplinasListener = true;
            corInput.addEventListener('input', function() {
                const hex = document.getElementById('colorHexDisplay');
                if (hex) hex.textContent = this.value;
            });
        }
        
        const btnFechar = document.getElementById('btnFecharModalDisciplinas');
        if (btnFechar && !btnFechar._disciplinasListener) {
            btnFechar._disciplinasListener = true;
            btnFechar.addEventListener('click', () => this.fecharModal());
        }
        
        const btnLimpar = document.getElementById('btnLimparDisc');
        if (btnLimpar && !btnLimpar._disciplinasListener) {
            btnLimpar._disciplinasListener = true;
            btnLimpar.addEventListener('click', () => {
                this.editando = null;
                const title = document.getElementById('modalDiscTitle');
                const nomeInput = document.getElementById('discNome');
                const corInput = document.getElementById('discCor');
                const corHex = document.getElementById('colorHexDisplay');
                const btnSalvar = document.getElementById('btnSalvarDisc');
                
                if (title) title.textContent = 'Nova Disciplina';
                if (nomeInput) nomeInput.value = '';
                if (corInput) corInput.value = this.coresPadrao[0];
                if (corHex) corHex.textContent = this.coresPadrao[0];
                if (btnSalvar) btnSalvar.textContent = 'Criar Disciplina';
            });
        }
        
        const modal = document.getElementById('modalDisciplinas');
        if (modal && !modal._disciplinasListener) {
            modal._disciplinasListener = true;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.fecharModal();
                }
            });
        }
        
        if (!document._disciplinasEscListener) {
            document._disciplinasEscListener = true;
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const modalAberto = document.getElementById('modalDisciplinas')?.classList.contains('active');
                    if (modalAberto) this.fecharModal();
                }
            });
        }
        
        // ⭐ CLOUD SYNC — PROTEÇÃO TOTAL
        if (!window._disciplinasCloudListener) {
            window._disciplinasCloudListener = true;
            
            window.addEventListener('cloudDataLoaded', () => {
                if (this.disciplinas.length > 0) {
                    console.log('[Disciplinas] 📡 cloudDataLoaded ignorado (já temos dados)');
                    return;
                }
                
                if (this._salvandoAgora) {
                    console.log('[Disciplinas] 📡 cloudDataLoaded ignorado (a salvar)');
                    return;
                }
                
                console.log('[Disciplinas] 📡 Nuvem atualizou, recarregando...');
                this._carregado = false;
                this.carregar();
                
                // ⭐ Só re-renderiza o que está visível
                const viewAtiva = document.getElementById('view-disciplinas')?.classList.contains('active');
                if (viewAtiva) this._renderizarListaCompleta();
                
                const modalAberto = document.getElementById('modalDisciplinas')?.classList.contains('active');
                if (modalAberto) this._renderizarListaDisciplinasModal();
            });
            
            window.addEventListener('disciplinasUpdated', (e) => {
                if (e.detail && Array.isArray(e.detail)) {
                    this.disciplinas = [...e.detail];
                }
            });
        }
    }
}

console.log('[Disciplinas] ✅ Módulo carregado!');