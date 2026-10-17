// ============================================
// modules/tarefas.js - TAREFAS SPA (CORRIGIDO)
// ⭐ GUARDA NOME DA DISCIPLINA (NÃO ID)
// ⭐ COMPATÍVEL COM TAREFAS ANTIGAS (IDs)
// ============================================

class TarefasModule {
    constructor(app) {
        this.app = app;
        this.name = 'tarefas';
        this.currentFilter = 'todas';
        this.selectedPriority = 'media';
        this.editingTaskId = null;
        this.subtasks = [];
        this.searchTerm = '';
        this.disciplinaAtual = null;
        this.weeklySchedule = {};
        this._isSavingTask = false;
        
        console.log('[Tarefas] 📋 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Tarefas] 📋 Renderizando...');
        
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.notifications = data.notifications || [];
        this.disciplinas = data.disciplinas || [];
        this.weeklySchedule = data.weeklySchedule || {};
        this.profile = data.profile || {};
        
        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        dias.forEach(day => {
            if (!this.weeklySchedule[day]) this.weeklySchedule[day] = [];
        });
        
        this.atualizarNomeUsuario();
        this.renderStats();
        this.renderTasks();
        this.renderSubjects();
        this.setupEvents();
        this.updateBadge();
    }
    
    // ============================================
    // ATALHOS
    // ============================================
    getDisciplinas() {
        if (this.app?.modules?.disciplinas?.getTodas) {
            return this.app.modules.disciplinas.getTodas();
        }
        return this.disciplinas || [];
    }

    // ⭐ Converte o que estiver na tarefa (ID ou Nome) para o Nome real
    obterNomeDisciplina(valor) {
        if (!valor) return '';
        const disciplinas = this.getDisciplinas();
        const disc = disciplinas.find(d => 
            d.id === valor || 
            d.nome.toLowerCase() === valor.toLowerCase()
        );
        return disc ? disc.nome : valor;
    }
    
    atualizarNomeUsuario() {
        const profile = this.profile || this.app.user || {};
        const nome = profile.nome || profile.displayName || 'Usuário';
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) userNameDisplay.textContent = nome;
        
        const userName = document.getElementById('userName');
        if (userName) userName.textContent = nome;
        
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
            userAvatar.textContent = iniciais || 'U';
        }
    }
    
    renderStats() {
        const pendentes = this.tasks.filter(t => !t.completed).length;
        const concluidasHoje = this.tasks.filter(t => 
            t.completed && t.dataConclusao && 
            new Date(t.dataConclusao).toDateString() === new Date().toDateString()
        ).length;
        const atrasadas = this.tasks.filter(t => 
            !t.completed && t.prazo && new Date(t.prazo) < new Date()
        ).length;
        const favoritas = this.tasks.filter(t => t.favorita).length;
        const total = this.tasks.length;
        const concluidas = this.tasks.filter(t => t.completed).length;
        
        const pendingEl = document.getElementById('pendingCount');
        const completedEl = document.getElementById('completedTodayCount');
        const overdueEl = document.getElementById('overdueCount');
        const totalBadge = document.getElementById('totalBadge');
        const pendingBadge = document.getElementById('pendingBadge');
        const completedBadge = document.getElementById('completedBadge');
        const favoriteBadge = document.getElementById('favoriteBadge');
        
        if (pendingEl) pendingEl.textContent = pendentes;
        if (completedEl) completedEl.textContent = concluidasHoje;
        if (overdueEl) overdueEl.textContent = atrasadas;
        if (totalBadge) totalBadge.textContent = total;
        if (pendingBadge) pendingBadge.textContent = pendentes;
        if (completedBadge) completedBadge.textContent = concluidas;
        if (favoriteBadge) favoriteBadge.textContent = favoritas;
    }
    
    renderTasks() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;
        
        let filtered = this.filterTasks();
        filtered = this.sortTasks(filtered);
        
        if (filtered.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>Nenhuma tarefa encontrada</h3>
                    <p>Clique em "Nova Tarefa" para começar</p>
                </div>
            `;
            return;
        }
        
        taskList.innerHTML = filtered.map(task => this.createTaskHTML(task)).join('');
        this.setupTaskEvents();
    }
    
    filterTasks() {
        let filtered = [...this.tasks];
        const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        
        if (searchTerm) {
            filtered = filtered.filter(t => 
                (t.nome || t.title || '').toLowerCase().includes(searchTerm) ||
                (t.descricao || '').toLowerCase().includes(searchTerm)
            );
        }
        
        if (this.disciplinaAtual) {
            filtered = filtered.filter(t => {
                const discNome = this.obterNomeDisciplina(t.disciplina || t.subject || '');
                return discNome.toLowerCase() === this.disciplinaAtual.toLowerCase();
            });
        }
        
        switch(this.currentFilter) {
            case 'pendentes': filtered = filtered.filter(t => !t.completed); break;
            case 'concluidas': filtered = filtered.filter(t => t.completed); break;
            case 'favoritas': filtered = filtered.filter(t => t.favorita); break;
            default: break;
        }
        
        return filtered;
    }
    
    sortTasks(tasks) {
        const order = document.getElementById('orderSelect')?.value || 'prazo';
        const prioridadeOrder = { 'alta': 1, 'media': 2, 'baixa': 3 };
        
        switch(order) {
            case 'prazo':
                return tasks.sort((a, b) => {
                    if (!a.prazo) return 1;
                    if (!b.prazo) return -1;
                    return new Date(a.prazo) - new Date(b.prazo);
                });
            case 'disciplina':
                return tasks.sort((a, b) => {
                    const discA = this.obterNomeDisciplina(a.disciplina || a.subject || '');
                    const discB = this.obterNomeDisciplina(b.disciplina || b.subject || '');
                    return discA.localeCompare(discB);
                });
            case 'prioridade':
                return tasks.sort((a, b) => 
                    (prioridadeOrder[a.prioridade] || 4) - (prioridadeOrder[b.prioridade] || 4)
                );
            default:
                return tasks;
        }
    }
    
    createTaskHTML(task) {
        const isCompleted = task.completed || false;
        const isFavorita = task.favorita || false;
        const disciplinaRaw = task.disciplina || task.subject || '';
        const disciplina = this.obterNomeDisciplina(disciplinaRaw); // ⭐ Converte ID antigo para Nome
        const prioridade = task.prioridade || 'media';
        const prazo = task.prazo ? this.formatarData(task.prazo) : 'Sem data';
        
        const cor = disciplina ? (this.app?.modules?.disciplinas?.getCor(disciplina) || '#9ca3af') : '#9ca3af';
        const icone = disciplina ? (this.app?.modules?.disciplinas?.getIcone(disciplina) || 'fa-book') : 'fa-book';
        const nomeDisciplina = disciplina || 'Sem disciplina';
        
        const classePrioridade = this.getClassePrioridade(prioridade);
        const textoPrioridade = this.getTextoPrioridade(prioridade);
        
        let subtasksHTML = '';
        if (task.subtasks && task.subtasks.length > 0) {
            subtasksHTML = `
                <div class="task-subtasks">
                    <strong>Subtarefas:</strong>
                    <ul>
                        ${task.subtasks.map(st => `<li>${this.app.escapeHtml(st.texto)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        return `
            <div class="task-item" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
                <div class="task-content">
                    <h4 style="${isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                        ${this.app.escapeHtml(task.nome || task.title)}
                    </h4>
                    <p>${this.app.escapeHtml(task.descricao || 'Sem descrição')}</p>
                    <div class="task-meta">
                        <span class="task-subject" style="color: ${cor}">
                            <i class="fas ${icone}"></i> ${this.app.escapeHtml(nomeDisciplina)}
                        </span>
                        <span class="task-date"><i class="fas fa-calendar"></i> ${prazo}</span>
                        <span class="task-priority ${classePrioridade}">
                            <i class="fas fa-flag"></i> ${textoPrioridade}
                        </span>
                    </div>
                    ${subtasksHTML}
                </div>
                <div class="task-actions">
                    <button class="task-btn favorite ${isFavorita ? 'active' : ''}" 
                            style="color: ${isFavorita ? '#eab308' : ''}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="task-btn edit"><i class="fas fa-edit"></i></button>
                    <button class="task-btn delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }
    
    setupTaskEvents() {
        document.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = cb.closest('.task-item').dataset.id;
                this.toggleTask(id, cb.checked);
            });
        });
        
        document.querySelectorAll('.task-btn.favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.task-item').dataset.id;
                this.toggleFavorite(id);
            });
        });
        
        document.querySelectorAll('.task-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.task-item').dataset.id;
                this.openTaskModal(id);
            });
        });
        
        document.querySelectorAll('.task-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.task-item').dataset.id;
                this.deleteTask(id);
            });
        });
    }
    
    toggleTask(id, completed) {
        const task = this.tasks.find(t => t.id == id);
        if (task) {
            task.completed = completed;
            task.dataConclusao = completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.renderStats();
            this.renderSubjects();
            this.showToast(completed ? 'Tarefa concluída!' : 'Tarefa reaberta!', 'success');
        }
    }
    
    toggleFavorite(id) {
        const task = this.tasks.find(t => t.id == id);
        if (task) {
            task.favorita = !task.favorita;
            this.saveTasks();
            this.renderTasks();
            this.renderStats();
            this.showToast(task.favorita ? 'Adicionada aos favoritos!' : 'Removida dos favoritos!', 'success');
        }
    }
    
    deleteTask(id) {
        if (confirm('Deseja excluir esta tarefa?')) {
            this.tasks = this.tasks.filter(t => t.id != id);
            this.saveTasks();
            this.renderTasks();
            this.renderStats();
            this.renderSubjects();
            this.showToast('Tarefa excluída!', 'success');
        }
    }
    
    saveTasks() {
        this.app.data.tasks = this.tasks;
        this.app.saveAllData();
    }
    
    gerarId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    openTaskModal(id = null) {
        const task = id ? this.tasks.find(t => t.id == id) : null;
        this.editingTaskId = task ? task.id : null;
        this.selectedPriority = task ? task.prioridade : 'media';
        this.subtasks = task ? (task.subtasks || []) : [];
        
        const modal = document.getElementById('taskModal');
        if (!modal) return;
        
        const modalTitle = document.getElementById('modalTitle');
        const nomeInput = document.getElementById('nomeTarefa');
        const descInput = document.getElementById('descricaoTarefa');
        const prazoInput = document.getElementById('prazoTarefa');
        
        if (modalTitle) modalTitle.textContent = task ? 'Editar Tarefa' : 'Nova Tarefa';
        if (nomeInput) nomeInput.value = task ? (task.nome || task.title || '') : '';
        if (descInput) descInput.value = task ? (task.descricao || '') : '';
        if (prazoInput) prazoInput.value = task ? (task.prazo || '') : '';
        
        // ⭐ Obter o nome real da disciplina para selecionar no <select>
        const disciplinaRaw = task ? (task.disciplina || task.subject) : null;
        this.popularSelectDisciplinas(disciplinaRaw);
        
        this.renderSubtasks();
        this.selectPriority(this.selectedPriority);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // ⭐ POPULAR SELECT (AGORA VAI USAR O NOME COMO VALUE)
    popularSelectDisciplinas(disciplinaSelecionadaRaw = null) {
        const select = document.getElementById('disciplinaTarefa');
        if (!select) return;
        
        const disciplinas = this.getDisciplinas();
        
        select.innerHTML = '';
        
        if (disciplinas.length === 0) {
            const optVazia = document.createElement('option');
            optVazia.value = '';
            optVazia.textContent = '⚠️ Nenhuma disciplina cadastrada';
            optVazia.disabled = true;
            optVazia.selected = true;
            select.appendChild(optVazia);
            
            const optSem = document.createElement('option');
            optSem.value = '';
            optSem.textContent = 'Sem disciplina';
            select.appendChild(optSem);
            
            const optNova = document.createElement('option');
            optNova.value = '__CRIAR_NOVA__';
            optNova.textContent = '➕ Criar nova disciplina';
            select.appendChild(optNova);
            
            return;
        }
        
        const optSem = document.createElement('option');
        optSem.value = '';
        optSem.textContent = '— Sem disciplina —';
        select.appendChild(optSem);
        
        const optTodas = document.createElement('optgroup');
        optTodas.label = '📚 Disciplinas';
        
        disciplinas.forEach(d => {
            const opt = document.createElement('option');
            // ⭐ AGORA O VALUE É O NOME (e não o ID)
            opt.value = d.nome; 
            opt.textContent = `${d.nome}`;
            optTodas.appendChild(opt);
        });
        
        select.appendChild(optTodas);
        
        const optNova = document.createElement('option');
        optNova.value = '__CRIAR_NOVA__';
        optNova.textContent = '➕ Criar nova disciplina';
        select.appendChild(optNova);
        
        // ⭐ Traduzir ID antigo para Nome
        const nomeReal = this.obterNomeDisciplina(disciplinaSelecionadaRaw);
        if (nomeReal) {
            select.value = nomeReal;
        } else {
            select.value = '';
        }
        
        console.log('[Tarefas] 📚 Select de disciplinas populado:', disciplinas.length);
    }
    
    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.editingTaskId = null;
    }
    
    renderSubtasks() {
        const container = document.getElementById('subtasksContainer');
        if (!container) return;
        
        container.innerHTML = '';
        this.subtasks.forEach((st, index) => {
            const div = document.createElement('div');
            div.className = 'subtask-item';
            div.innerHTML = `
                <input type="text" value="${this.app.escapeHtml(st.texto)}" placeholder="Nome da subtarefa...">
                <button type="button" class="remove-subtask" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(div);
        });
        
        container.querySelectorAll('.remove-subtask').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.subtasks.splice(index, 1);
                this.renderSubtasks();
            });
        });
    }
    
    addSubtask() {
        this.subtasks.push({ texto: '', concluida: false });
        this.renderSubtasks();
    }
    
    selectPriority(priority) {
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === priority);
        });
        this.selectedPriority = priority;
    }
        saveTaskFromForm() {
        // ⭐ PROTEÇÃO CONTRA CLIQUE DUPLO
        if (this._isSavingTask) return;
        this._isSavingTask = true;
        
        const nome = document.getElementById('nomeTarefa')?.value?.trim();
        if (!nome) {
            this.showToast('Preencha o nome da tarefa!', 'error');
            this._isSavingTask = false;
            return;
        }
        
        const subtasksList = [];
        document.querySelectorAll('.subtask-item input').forEach(input => {
            if (input.value.trim()) {
                subtasksList.push({ texto: input.value.trim(), concluida: false });
            }
        });
        
        const selectDisciplina = document.getElementById('disciplinaTarefa');
        let disciplinaNome = selectDisciplina?.value || '';
        
        if (disciplinaNome === '__CRIAR_NOVA__') {
            if (this.app?.modules?.disciplinas) {
                this.app.modules.disciplinas.abrirModal();
            }
            this._isSavingTask = false;
            return;
        }
        
        const taskData = {
            nome: nome,
            title: nome,
            descricao: document.getElementById('descricaoTarefa')?.value?.trim() || '',
            prioridade: this.selectedPriority,
            prazo: document.getElementById('prazoTarefa')?.value || '',
            disciplina: disciplinaNome, // ⭐ GUARDA O NOME
            subject: disciplinaNome,    // ⭐ GUARDA O NOME
            subtasks: subtasksList,
            completed: false,
            favorita: false,
            dataCriacao: new Date().toISOString()
        };
        
        if (this.editingTaskId) {
            const index = this.tasks.findIndex(t => t.id == this.editingTaskId);
            if (index > -1) {
                this.tasks[index] = { ...this.tasks[index], ...taskData };
            }
        } else {
            taskData.id = this.gerarId();
            this.tasks.unshift(taskData);
        }
        
        this.saveTasks();
        this.closeTaskModal();
        this.renderTasks();
        this.renderStats();
        this.renderSubjects();
        this.showToast(this.editingTaskId ? 'Tarefa atualizada!' : 'Tarefa criada!', 'success');
        
        // ⭐ LIBERTA A FLAG DEPOIS DE 500ms
        setTimeout(() => { this._isSavingTask = false; }, 500);
    }
    
    
    renderSubjects() {
        const list = document.getElementById('subjectsList');
        if (!list) return;
        
        const disciplinasMap = new Map();
        const todasDisciplinas = this.getDisciplinas();
        
        // 1. Adicionar todas as oficiais
        todasDisciplinas.forEach(d => {
            const key = d.nome.toLowerCase();
            disciplinasMap.set(key, {
                nome: d.nome,
                cor: d.cor,
                icone: d.icone,
                count: 0
            });
        });
        
        // 2. Contar as tarefas
        this.tasks.forEach(t => {
            const discValue = t.disciplina || t.subject;
            if (discValue) {
                const nomeReal = this.obterNomeDisciplina(discValue);
                if (nomeReal) {
                    const key = nomeReal.toLowerCase();
                    if (!disciplinasMap.has(key)) {
                        // Se for uma disciplina "fantasma" (antiga), adiciona
                        disciplinasMap.set(key, {
                            nome: nomeReal,
                            cor: this.app?.modules?.disciplinas?.getCor(nomeReal) || '#9ca3af',
                            icone: this.app?.modules?.disciplinas?.getIcone(nomeReal) || 'fa-book',
                            count: 0
                        });
                    }
                    if (!t.completed) {
                        disciplinasMap.get(key).count++;
                    }
                }
            }
        });
        
        if (disciplinasMap.size === 0) {
            list.innerHTML = `
                <p style="text-align:center;padding:20px;color:#9ca3af;font-size:13px;">
                    Nenhuma disciplina<br>
                    <small style="font-size:11px;opacity:0.7;">Crie no card "Minhas Disciplinas"</small>
                </p>
            `;
            return;
        }
        
        let html = '';
        for (const [key, disc] of disciplinasMap) {
            const isActive = this.disciplinaAtual === key;
            const cor = disc.cor || '#9ca3af';
            
            html += `
                <div class="subject-item ${isActive ? 'active' : ''}" data-subject="${key}">
                    <div class="subject-color" style="background-color: ${cor};"></div>
                    <span>${this.app.escapeHtml(disc.nome)}</span>
                    <span class="subject-count">${disc.count}</span>
                </div>
            `;
        }
        
        list.innerHTML = html;
        
        list.querySelectorAll('.subject-item').forEach(item => {
            item.addEventListener('click', () => {
                const disciplina = item.dataset.subject;
                if (this.disciplinaAtual === disciplina) {
                    this.disciplinaAtual = null;
                    document.querySelectorAll('.subject-item').forEach(s => s.classList.remove('active'));
                } else {
                    document.querySelectorAll('.subject-item').forEach(s => s.classList.remove('active'));
                    item.classList.add('active');
                    this.disciplinaAtual = disciplina;
                }
                this.renderTasks();
            });
        });
    }
    
    getClassePrioridade(prioridade) {
        const classes = { 'alta': 'urgent', 'media': 'high', 'baixa': 'medium' };
        return classes[prioridade] || 'normal';
    }
    
    getTextoPrioridade(prioridade) {
        const textos = { 'alta': 'Urgente', 'media': 'Alta', 'baixa': 'Média' };
        return textos[prioridade] || 'Normal';
    }
    
    formatarData(data) {
        if (!data) return 'Sem data';
        const d = new Date(data);
        return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
    }
    
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
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
                                   'linear-gradient(135deg, #10b981, #059669)';
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
    
    setupEvents() {
        document.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.filter-item').forEach(f => f.classList.remove('active-filter'));
                item.classList.add('active-filter');
                this.currentFilter = item.dataset.filter;
                this.renderTasks();
            });
        });
        
        document.getElementById('searchInput')?.addEventListener('input', () => {
            this.renderTasks();
        });
        
        document.getElementById('orderSelect')?.addEventListener('change', () => {
            this.renderTasks();
        });
        
        document.getElementById('btnNewTask')?.addEventListener('click', () => {
            this.openTaskModal();
        });
        
        document.getElementById('taskModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeTaskModal();
        });
        
        document.getElementById('modalCloseTask')?.addEventListener('click', () => {
            this.closeTaskModal();
        });
        
        document.getElementById('btnCancelTask')?.addEventListener('click', () => {
            this.closeTaskModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modalAberto = document.getElementById('taskModal')?.classList.contains('active');
                if (modalAberto) this.closeTaskModal();
            }
        });
        
        document.getElementById('formNovaTarefa')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTaskFromForm();
        });
        
        document.getElementById('disciplinaTarefa')?.addEventListener('change', (e) => {
            if (e.target.value === '__CRIAR_NOVA__') {
                console.log('[Tarefas] ➕ Abrindo modal de criar disciplina...');
                
                const modalTarefa = document.getElementById('taskModal');
                const estavaAberto = modalTarefa?.classList.contains('active');
                if (estavaAberto) {
                    modalTarefa.classList.remove('active');
                }
                
                setTimeout(() => {
                    if (this.app?.modules?.disciplinas) {
                        this.app.modules.disciplinas.abrirModal();
                        
                        const checkInterval = setInterval(() => {
                            const modalDisc = document.getElementById('modalDisciplinas');
                            if (!modalDisc?.classList.contains('active')) {
                                clearInterval(checkInterval);
                                if (estavaAberto) {
                                    setTimeout(() => {
                                        this.openTaskModal(this.editingTaskId);
                                    }, 200);
                                }
                            }
                        }, 300);
                    }
                }, 200);
            }
        });
        
        document.querySelector('.btn-add-subtask')?.addEventListener('click', () => {
            this.addSubtask();
        });
        
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPriority = btn.dataset.priority;
            });
        });
        
        window.addEventListener('disciplinasUpdated', () => {
            const viewAtiva = document.getElementById('view-tarefas')?.classList.contains('active');
            if (viewAtiva) {
                this.renderSubjects();
            }
            
            const modalAberto = document.getElementById('taskModal')?.classList.contains('active');
            if (modalAberto) {
                const select = document.getElementById('disciplinaTarefa');
                const valorAtual = select?.value || '';
                this.popularSelectDisciplinas(valorAtual);
            }
        });
        
        window.addEventListener('disciplinaCriada', (e) => {
            console.log('[Tarefas] ✅ Nova disciplina criada:', e.detail?.nome);
            const modalAberto = document.getElementById('taskModal')?.classList.contains('active');
            if (modalAberto) {
                this.popularSelectDisciplinas(e.detail?.nome);
            }
        });
        
                window.addEventListener('cloudDataLoaded', () => {
            // ⭐ SÓ ATUALIZA SE A VIEW ESTIVER ATIVA E NÃO ESTIVER A SALVAR
            const viewAtiva = document.getElementById('view-tarefas')?.classList.contains('active');
            if (!viewAtiva || this._isSavingTask) return;
            
            this.tasks = this.app.data.tasks || [];
            this.notes = this.app.data.notes || [];
            this.notifications = this.app.data.notifications || [];
            this.disciplinas = this.app.data.disciplinas || [];
            this.weeklySchedule = this.app.data.weeklySchedule || {};
            this.profile = this.app.data.profile || {};
            
            this.atualizarNomeUsuario();
            this.renderStats();
            this.renderTasks();
            this.renderSubjects();
            this.updateBadge();
        });
        
        window.addEventListener('storage', (e) => {
            if (e.key && (e.key.includes('_tasks') || e.key.includes('tarefas_'))) {
                this.tasks = this.app.data.tasks || [];
                this.renderStats();
                this.renderTasks();
                this.renderSubjects();
            }
        });
    }
}

console.log('[Tarefas] ✅ Módulo carregado!');