// ============================================
// mobile-telas/modules/disciplinas.js
// MÓDULO DE DISCIPLINAS (MOBILE)
// ⭐ API pública idêntica ao PC (getTodas, getCor, getIcone, resolverNome)
// ⭐ estaEmUso() lê do CacheManager (fonte fiável)
// ⭐ Color picker nativo (sem conflito com chips de outros modais)
// ============================================

class DisciplinasModule {
    constructor(app) {
        this.app = app;
        this.name = 'disciplinas';

        this.disciplinas = [];
        this.editando = null;
        this._carregado = false;
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

        console.log('[Disciplinas] 📚 Módulo mobile inicializado');
    }

    // ============================================
    // RENDER
    // ============================================
       render(data) {
        if (!this._carregado) this.carregar();

        // ⭐ Sempre configurar eventos (idempotente — usa flags _discListener)
        this._setupEventos();

        const viewAtiva = document.getElementById('view-disciplinas')?.classList.contains('active');
        if (viewAtiva) this._renderizarListaCompleta();

        const modalAberto = document.getElementById('disciplina-modal')?.classList.contains('active');
        if (modalAberto) this._renderizarListaModal();
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
                const doLocal = localStorage.getItem(`disciplinas_${email}`);
                if (doLocal) {
                    try {
                        const parsed = JSON.parse(doLocal);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            this.disciplinas = parsed;
                            this._carregado = true;
                            if (window.CacheManager) {
                                window.CacheManager.set('disciplinas', parsed, true);
                            }
                            console.log('[Disciplinas] 📦 Carregado do localStorage:', parsed.length);
                            return this.disciplinas;
                        }
                    } catch (e) {}
                }
            }

            if (Array.isArray(this.app?.data?.disciplinas) && this.app.data.disciplinas.length > 0) {
                this.disciplinas = this.app.data.disciplinas;
                this._carregado = true;
                return this.disciplinas;
            }

            this.disciplinas = [];
            this._carregado = true;
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
                window.CacheManager.set('disciplinas', this.disciplinas, false);
            }

            if (this._eventDebounce) clearTimeout(this._eventDebounce);
            this._eventDebounce = setTimeout(() => {
                window.dispatchEvent(new CustomEvent('disciplinasUpdated', {
                    detail: [...this.disciplinas]
                }));
            }, 150);

            return true;
        } catch (error) {
            console.error('[Disciplinas] ❌ Erro ao salvar:', error);
            return false;
        } finally {
            setTimeout(() => { this._salvandoAgora = false; }, 1000);
        }
    }

    // ============================================
    // ⭐ API PÚBLICA (usada por outros módulos)
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

    // ⭐ CENTRAL: resolve ID antigo OU nome para o nome canónico
    resolverNome(valor) {
        if (!valor) return '';
        if (!this._carregado) this.carregar();

        // Já é nome exato?
        const porNome = this.disciplinas.find(d => d.nome === valor);
        if (porNome) return porNome.nome;

        // É ID?
        const porId = this.disciplinas.find(d => d.id === valor);
        if (porId) return porId.nome;

        // Case-insensitive
        const normalizado = this.normalizar(valor);
        const porNorm = this.disciplinas.find(d => this.normalizar(d.nome) === normalizado);
        if (porNorm) return porNorm.nome;

        // Não encontrada — devolve o que veio (pode ser disciplina "fantasma")
        return valor;
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

    // ⭐ Lê do CacheManager (fonte fiável) em vez de app.data
    estaEmUso(id) {
        const disc = this.getPorId(id);
        if (!disc) return false;
        const nomeNormalizado = this.normalizar(disc.nome);

        const get = (key) => {
            const cache = window.CacheManager?.get(key, null);
            if (cache && (Array.isArray(cache) ? cache.length > 0 : Object.keys(cache).length > 0)) {
                return cache;
            }
            return this.app?.data?.[key] ?? (Array.isArray(cache) ? cache : []);
        };

        const tasks = get('tasks');
        if (tasks.some(t => this.normalizar(t.disciplina || t.subject || '') === nomeNormalizado)) return true;

        const schedule = get('weeklySchedule');
        if (Object.values(schedule).some(day =>
            Array.isArray(day) && day.some(aula => this.normalizar(aula.materia || '') === nomeNormalizado)
        )) return true;

        const events = get('calendarEvents');
        if (events.some(e => this.normalizar(e.disciplina || '') === nomeNormalizado)) return true;

        const notes = get('notes');
        if (notes.some(n => this.normalizar(n.disciplina || '') === nomeNormalizado)) return true;

        return false;
    }

    // ============================================
    // CRUD
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
            return { success: true, disciplina: nova };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async editar(id, dados) {
        try {
            const index = this.disciplinas.findIndex(d => d.id === id);
            if (index === -1) return { success: false, message: 'Disciplina não encontrada' };

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
            return { success: true, disciplina: atualizada };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async deletar(id) {
        try {
            const index = this.disciplinas.findIndex(d => d.id === id);
            if (index === -1) return { success: false, message: 'Disciplina não encontrada' };

            const removida = this.disciplinas[index];
            this.disciplinas.splice(index, 1);
            await this._salvar();
            window.dispatchEvent(new CustomEvent('disciplinaDeletada', { detail: removida }));
            return { success: true, disciplina: removida };
        } catch (error) {
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
    // VIEW: LISTA COMPLETA (cards)
    // ============================================
    _renderizarListaCompleta() {
        const container = document.getElementById('disciplinas-list');
        if (!container) return;
        if (!this._carregado) this.carregar();

        if (this.disciplinas.length === 0) {
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
        this.disciplinas.forEach(d => {
            const emUso = this.estaEmUso(d.id);
            html += `
                <div class="disciplina-card" data-id="${d.id}" style="--disciplina-color: ${d.cor};">
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
                            ${emUso
                                ? '<span><ion-icon name="checkmark-circle-outline"></ion-icon> Em uso</span>'
                                : '<span><ion-icon name="ellipse-outline"></ion-icon> Não usada</span>'}
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('[data-action="editar"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const disc = this.getPorId(btn.dataset.id);
                if (disc) this.abrirModal(disc);
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
    // MODAL (mobile)
    // ============================================
    abrirModal(disciplina = null) {
        if (!this._carregado) this.carregar();

        const modal = document.getElementById('disciplina-modal');
        if (!modal) {
            console.warn('[Disciplinas] ⚠️ #disciplina-modal não encontrado no HTML');
            return;
        }

        const title = document.getElementById('disciplina-modal-title');
        const nomeInput = document.getElementById('disc-nome');
        const corInput = document.getElementById('disc-cor');
        const corHex = document.getElementById('disc-cor-hex');
        const iconeSelect = document.getElementById('disc-icone');
        const btnSalvar = document.getElementById('btn-salvar-disc');

        // Popular select de ícones (só uma vez)
        if (iconeSelect && iconeSelect.options.length <= 1) {
            iconeSelect.innerHTML = '';
            this.iconesDisponiveis.forEach(ic => {
                const opt = document.createElement('option');
                opt.value = ic.value;
                opt.textContent = ic.label;
                iconeSelect.appendChild(opt);
            });
        }

        if (disciplina) {
            this.editando = disciplina;
            if (title) title.textContent = 'Editar Disciplina';
            if (nomeInput) nomeInput.value = disciplina.nome;
            if (corInput) corInput.value = disciplina.cor;
            if (corHex) corHex.textContent = disciplina.cor;
            if (iconeSelect) iconeSelect.value = disciplina.icone || 'fa-book';
            if (btnSalvar) btnSalvar.innerHTML = '<ion-icon name="save-outline"></ion-icon> Salvar Alterações';
        } else {
            this.editando = null;
            if (title) title.textContent = 'Nova Disciplina';
            if (nomeInput) nomeInput.value = '';
            if (corInput) corInput.value = this.coresPadrao[0];
            if (corHex) corHex.textContent = this.coresPadrao[0];
            if (iconeSelect) iconeSelect.value = 'fa-book';
            if (btnSalvar) btnSalvar.innerHTML = '<ion-icon name="save-outline"></ion-icon> Criar Disciplina';
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => nomeInput?.focus(), 300);

        this._renderizarListaModal();
    }

    fecharModal() {
        const modal = document.getElementById('disciplina-modal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
        this.editando = null;
    }

    _renderizarListaModal() {
        const container = document.getElementById('lista-disciplinas-modal');
        if (!container) return;
        if (!this._carregado) this.carregar();

        if (this.disciplinas.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);font-size:0.85rem;">Nenhuma disciplina cadastrada.</p>';
            return;
        }

        let html = '';
        this.disciplinas.forEach(d => {
            const emUso = this.estaEmUso(d.id);
            html += `
                <div class="disciplina-item-mini" data-id="${d.id}">
                    <div class="disciplina-mini-info">
                        <div class="disciplina-mini-color" style="background:${d.cor};">
                            <i class="fas ${d.icone || 'fa-book'}"></i>
                        </div>
                        <div>
                            <strong>${this.app.escapeHtml(d.nome)}</strong>
                            ${emUso ? '<span class="badge-uso">Em uso</span>' : ''}
                        </div>
                    </div>
                    <div class="disciplina-mini-actions">
                        <button data-action="editar" data-id="${d.id}" title="Editar">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button data-action="deletar" data-id="${d.id}" title="Excluir">
                            <ion-icon name="trash-outline"></ion-icon>
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
                    const nomeInput = document.getElementById('disc-nome');
                    const corInput = document.getElementById('disc-cor');
                    const corHex = document.getElementById('disc-cor-hex');
                    const iconeSelect = document.getElementById('disc-icone');
                    const btnSalvar = document.getElementById('btn-salvar-disc');
                    const title = document.getElementById('disciplina-modal-title');
                    if (title) title.textContent = 'Editar Disciplina';
                    if (nomeInput) nomeInput.value = disc.nome;
                    if (corInput) corInput.value = disc.cor;
                    if (corHex) corHex.textContent = disc.cor;
                    if (iconeSelect) iconeSelect.value = disc.icone || 'fa-book';
                    if (btnSalvar) btnSalvar.innerHTML = '<ion-icon name="save-outline"></ion-icon> Salvar Alterações';
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

    async _confirmarDelete(id) {
        const disc = this.getPorId(id);
        if (!disc) return;
        const emUso = this.estaEmUso(id);
        let msg = `Excluir a disciplina "${disc.nome}"?`;
        if (emUso) msg += '\n\n⚠️ Esta disciplina está em uso em tarefas, horários, eventos ou anotações.';
        if (!confirm(msg)) return;

        const result = await this.deletar(id);
        if (result.success) {
            this._renderizarListaCompleta();
            this._renderizarListaModal();
            this._toast('Disciplina excluída!', 'success');
            if (this.editando && this.editando.id === id) {
                this.editando = null;
                const title = document.getElementById('disciplina-modal-title');
                const nomeInput = document.getElementById('disc-nome');
                const btnSalvar = document.getElementById('btn-salvar-disc');
                if (title) title.textContent = 'Nova Disciplina';
                if (nomeInput) nomeInput.value = '';
                if (btnSalvar) btnSalvar.innerHTML = '<ion-icon name="save-outline"></ion-icon> Criar Disciplina';
            }
        } else {
            this._toast(result.message || 'Erro ao excluir', 'error');
        }
    }

    async _salvarFormulario(event) {
        if (event) event.preventDefault();
        const nome = document.getElementById('disc-nome')?.value?.trim();
        const cor = document.getElementById('disc-cor')?.value;
        const icone = document.getElementById('disc-icone')?.value;

        if (!nome) {
            this._toast('Digite o nome da disciplina!', 'error');
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
            this._renderizarListaModal();
            this._renderizarListaCompleta();
            this._toast(editandoAntes ? 'Disciplina atualizada!' : 'Disciplina criada!', 'success');

            this.editando = null;
            const title = document.getElementById('disciplina-modal-title');
            const nomeInput = document.getElementById('disc-nome');
            const corInput = document.getElementById('disc-cor');
            const corHex = document.getElementById('disc-cor-hex');
            const btnSalvar = document.getElementById('btn-salvar-disc');
            if (title) title.textContent = 'Nova Disciplina';
            if (nomeInput) nomeInput.value = '';
            if (corInput) corInput.value = this.coresPadrao[0];
            if (corHex) corHex.textContent = this.coresPadrao[0];
            if (btnSalvar) btnSalvar.innerHTML = '<ion-icon name="save-outline"></ion-icon> Criar Disciplina';
            setTimeout(() => nomeInput?.focus(), 100);
        } else {
            this._toast(result.message || 'Erro ao salvar', 'error');
        }
    }

    _toast(mensagem, tipo = 'success') {
        if (typeof showToast === 'function') {
            showToast(mensagem, tipo);
        } else {
            console.log(`[Disciplinas] 📢 ${mensagem}`);
        }
    }

    // ============================================
    // SETUP EVENTOS
    // ============================================
    _setupEventos() {
        
        const form = document.getElementById('disciplina-form');
        if (form && !form._discListener) {
            form._discListener = true;
            form.addEventListener('submit', (e) => this._salvarFormulario(e));
        }

        const corInput = document.getElementById('disc-cor');
        if (corInput && !corInput._discListener) {
            corInput._discListener = true;
            corInput.addEventListener('input', function() {
                const hex = document.getElementById('disc-cor-hex');
                if (hex) hex.textContent = this.value;
            });
        }
       
        // ⭐ Botão "+" da view
        const btnAdd = document.getElementById('btn-add-disciplina');
        if (btnAdd && !btnAdd._discListener) {
            btnAdd._discListener = true;
            btnAdd.addEventListener('click', (e) => {
                e.preventDefault();
                this.abrirModal();
            });
        }

        document.getElementById('btn-fechar-disc')?.addEventListener('click', () => this.fecharModal());

        const btnLimpar = document.getElementById('btn-limpar-disc');
        if (btnLimpar && !btnLimpar._discListener) {
            btnLimpar._discListener = true;
            btnLimpar.addEventListener('click', () => {
                this.editando = null;
                const title = document.getElementById('disciplina-modal-title');
                const nomeInput = document.getElementById('disc-nome');
                const corInput = document.getElementById('disc-cor');
                const corHex = document.getElementById('disc-cor-hex');
                const btnSalvar = document.getElementById('btn-salvar-disc');
                if (title) title.textContent = 'Nova Disciplina';
                if (nomeInput) nomeInput.value = '';
                if (corInput) corInput.value = this.coresPadrao[0];
                if (corHex) corHex.textContent = this.coresPadrao[0];
                if (btnSalvar) btnSalvar.innerHTML = '<ion-icon name="save-outline"></ion-icon> Criar Disciplina';
            });
        }

        const modal = document.getElementById('disciplina-modal');
        if (modal && !modal._discListener) {
            modal._discListener = true;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.fecharModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const m = document.getElementById('disciplina-modal');
                if (m && m.classList.contains('active')) this.fecharModal();
            }
        });

        if (!window._discCloudListener) {
            window._discCloudListener = true;
            window.addEventListener('cloudDataLoaded', () => {
                if (this.disciplinas.length > 0) return;
                if (this._salvandoAgora) return;
                this._carregado = false;
                this.carregar();
                this._renderizarListaCompleta();
                this._renderizarListaModal();
            });
            window.addEventListener('disciplinasUpdated', (e) => {
                if (e.detail && Array.isArray(e.detail)) {
                    this.disciplinas = [...e.detail];
                }
            });
        }
    }
}

console.log('[Disciplinas] ✅ Módulo mobile carregado!');