// ============================================
// modules/tarefas.js - TAREFAS SPA (CORRIGIDO)
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
        
        // Garantir estrutura do horário
        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        dias.forEach(day => {
            if (!this.weeklySchedule[day]) this.weeklySchedule[day] = [];
        });
        
        // Atualizar nome do usuário
        this.atualizarNomeUsuario();
        
        this.renderStats();
        this.renderTasks();
        this.renderSubjects();
        this.setupEvents();
        this.updateBadge();
    }
    
    // ============================================
    // ATUALIZAR NOME DO USUÁRIO
    // ============================================
    atualizarNomeUsuario() {
        const profile = this.profile || this.app.user || {};
        const nome = profile.nome || profile.displayName || 'Usuário';
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = nome;
        }
        
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = nome;
        }
        
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
            userAvatar.textContent = iniciais || 'U';
        }
    }
    
    // ============================================
    // STATS
    // ============================================
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
        
        document.getElementById('pendingCount').textContent = pendentes;
        document.getElementById('completedTodayCount').textContent = concluidasHoje;
        document.getElementById('overdueCount').textContent = atrasadas;
        document.getElementById('totalBadge').textContent = total;
        document.getElementById('pendingBadge').textContent = pendentes;
        document.getElementById('completedBadge').textContent = concluidas;
        document.getElementById('favoriteBadge').textContent = favoritas;
    }
    
    // ============================================
    // RENDER TASKS
    // ============================================
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
        
        // Eventos das tarefas
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
            filtered = filtered.filter(t => (t.disciplina || t.subject) === this.disciplinaAtual);
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
                return tasks.sort((a, b) => 
                    (a.disciplina || a.subject || '').localeCompare(b.disciplina || b.subject || '')
                );
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
        const disciplina = task.disciplina || task.subject || 'Geral';
        const prioridade = task.prioridade || 'media';
        const prazo = task.prazo ? this.formatarData(task.prazo) : 'Sem data';
        
        const corDisciplina = this.getCorDisciplina(disciplina);
        const textoDisciplina = this.getTextoDisciplina(disciplina);
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
                        <span class="task-subject" style="color: ${corDisciplina}">
                            <i class="fas fa-circle"></i> ${textoDisciplina}
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
        // Checkbox
        document.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = cb.closest('.task-item').dataset.id;
                this.toggleTask(id, cb.checked);
            });
        });
        
        // Favorito
        document.querySelectorAll('.task-btn.favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.task-item').dataset.id;
                this.toggleFavorite(id);
            });
        });
        
        // Editar
        document.querySelectorAll('.task-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.task-item').dataset.id;
                this.openTaskModal(id);
            });
        });
        
        // Deletar
        document.querySelectorAll('.task-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.task-item').dataset.id;
                this.deleteTask(id);
            });
        });
    }
    
    // ============================================
    // CRUD TAREFAS
    // ============================================
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
    
    // ============================================
    // MÉTODO SAVE TASKS (CORRIGIDO)
    // ============================================
    saveTasks() {
        this.app.data.tasks = this.tasks;
        this.app.saveAllData();
    }
    
    gerarId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    // ============================================
    // MODAL DE TAREFA
    // ============================================
    openTaskModal(id = null) {
        const task = id ? this.tasks.find(t => t.id == id) : null;
        this.editingTaskId = task ? task.id : null;
        this.selectedPriority = task ? task.prioridade : 'media';
        this.subtasks = task ? (task.subtasks || []) : [];
        
        const modal = document.getElementById('taskModal');
        if (!modal) return;
        
        document.getElementById('modalTitle').textContent = task ? 'Editar Tarefa' : 'Nova Tarefa';
        document.getElementById('nomeTarefa').value = task ? (task.nome || task.title || '') : '';
        document.getElementById('descricaoTarefa').value = task ? (task.descricao || '') : '';
        document.getElementById('prazoTarefa').value = task ? (task.prazo || '') : '';
        document.getElementById('disciplinaTarefa').value = task ? (task.disciplina || 'matematica') : 'matematica';
        
        this.renderSubtasks();
        this.selectPriority(this.selectedPriority);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
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
        
        // Eventos de remoção
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
    }
    
    saveTaskFromForm() {
        const nome = document.getElementById('nomeTarefa').value.trim();
        if (!nome) {
            this.showToast('Preencha o nome da tarefa!', 'error');
            return;
        }
        
        const subtasksList = [];
        document.querySelectorAll('.subtask-item input').forEach(input => {
            if (input.value.trim()) {
                subtasksList.push({ texto: input.value.trim(), concluida: false });
            }
        });
        
        const taskData = {
            nome: nome,
            title: nome,
            descricao: document.getElementById('descricaoTarefa').value.trim(),
            prioridade: this.selectedPriority,
            prazo: document.getElementById('prazoTarefa').value,
            disciplina: document.getElementById('disciplinaTarefa').value,
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
    }
    
    // ============================================
    // SUBJECTS
    // ============================================
    renderSubjects() {
        const list = document.getElementById('subjectsList');
        if (!list) return;
        
        const disciplinasMap = new Map();
        
        this.tasks.forEach(t => {
            const disc = t.disciplina || t.subject;
            if (disc) {
                const key = disc.toLowerCase();
                if (!disciplinasMap.has(key)) {
                    disciplinasMap.set(key, { nome: disc, count: 0 });
                }
                if (!t.completed) {
                    disciplinasMap.get(key).count++;
                }
            }
        });
        
        // Adicionar disciplinas do horário
        Object.values(this.weeklySchedule).forEach(day => {
            if (Array.isArray(day)) {
                day.forEach(c => {
                    if (c && c.materia) {
                        const key = c.materia.toLowerCase();
                        if (!disciplinasMap.has(key)) {
                            disciplinasMap.set(key, { nome: c.materia, count: 0 });
                        }
                    }
                });
            }
        });
        
        if (disciplinasMap.size === 0) {
            list.innerHTML = '<p style="text-align:center;padding:20px;color:#9ca3af;">Nenhuma disciplina</p>';
            return;
        }
        
        const cores = ['#8b5cf6', '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#eab308'];
        let i = 0;
        let html = '';
        
        for (const [key, disc] of disciplinasMap) {
            const cor = cores[i % cores.length];
            const isActive = this.disciplinaAtual === key;
            html += `
                <div class="subject-item ${isActive ? 'active' : ''}" data-subject="${key}">
                    <div class="subject-color" style="background-color: ${cor};"></div>
                    <span>${this.app.escapeHtml(disc.nome)}</span>
                    <span class="subject-count">${disc.count}</span>
                </div>
            `;
            i++;
        }
        
        list.innerHTML = html;
        
        // Eventos das disciplinas
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
    
    // ============================================
    // HELPERS
    // ============================================
    getCorDisciplina(disciplina) {
        const cores = {
            'matematica': '#8b5cf6', 'portugues': '#3b82f6', 'historia': '#ef4444',
            'fisica': '#f59e0b', 'quimica': '#10b981', 'biologia': '#eab308',
            'geografia': '#14b8a6', 'ingles': '#64748b', 'outros': '#9ca3af'
        };
        return cores[disciplina?.toLowerCase()] || '#9ca3af';
    }
    
    getTextoDisciplina(disciplina) {
        const textos = {
            'matematica': 'Matemática', 'portugues': 'Português', 'historia': 'História',
            'fisica': 'Física', 'quimica': 'Química', 'biologia': 'Biologia',
            'geografia': 'Geografia', 'ingles': 'Inglês', 'outros': 'Outros'
        };
        return textos[disciplina?.toLowerCase()] || disciplina || 'Geral';
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
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
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
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        // Filtros
        document.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.filter-item').forEach(f => f.classList.remove('active-filter'));
                item.classList.add('active-filter');
                this.currentFilter = item.dataset.filter;
                this.renderTasks();
            });
        });
        
        // Busca
        document.getElementById('searchInput')?.addEventListener('input', () => {
            this.renderTasks();
        });
        
        // Ordenação
        document.getElementById('orderSelect')?.addEventListener('change', () => {
            this.renderTasks();
        });
        
        // Nova tarefa
        document.getElementById('btnNewTask')?.addEventListener('click', () => {
            this.openTaskModal();
        });
        
        // Fechar modal
        document.getElementById('taskModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeTaskModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeTaskModal();
        });
        
        // Form submit
        document.getElementById('formNovaTarefa')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTaskFromForm();
        });
        
        // Adicionar subtarefa
        document.querySelector('.btn-add-subtask')?.addEventListener('click', () => {
            this.addSubtask();
        });
        
        // Prioridade buttons
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPriority = btn.dataset.priority;
            });
        });
        
        // Atualizar dados
        window.addEventListener('cloudDataLoaded', () => {
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
        
        // Sincronização entre abas
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