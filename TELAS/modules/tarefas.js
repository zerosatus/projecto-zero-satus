// ============================================
// modules/tarefas.js - TAREFAS
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
        
        console.log('[Tarefas] 📋 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Tarefas] 📋 Renderizando...');
        
        this.tasks = data.tasks || [];
        this.notifications = data.notifications || [];
        this.disciplinas = data.disciplinas || [];
        this.weeklySchedule = data.weeklySchedule || {};
        
        this.renderStats();
        this.renderTasks();
        this.renderSubjects();
        this.setupEvents();
        this.updateBadge();
    }
    
    // ============================================
    // RENDER STATS
    // ============================================
    renderStats() {
        const pendentes = this.tasks.filter(t => !t.completed).length;
        const concluidasHoje = this.tasks.filter(t => t.completed && t.dataConclusao && 
            new Date(t.dataConclusao).toDateString() === new Date().toDateString()).length;
        const atrasadas = this.tasks.filter(t => !t.completed && t.prazo && new Date(t.prazo) < new Date()).length;
        const concluidas = this.tasks.filter(t => t.completed).length;
        const favoritas = this.tasks.filter(t => t.favorita).length;
        const total = this.tasks.length;
        
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
        
        // Eventos
        taskList.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = cb.closest('.task-item').dataset.id;
                this.toggleTask(id, cb.checked);
            });
        });
        
        taskList.querySelectorAll('.task-btn.favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.task-item').dataset.id;
                this.toggleFavorite(id);
            });
        });
        
        taskList.querySelectorAll('.task-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.task-item').dataset.id;
                this.openTaskModal(id);
            });
        });
        
        taskList.querySelectorAll('.task-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.task-item').dataset.id;
                this.deleteTask(id);
            });
        });
    }
    
    filterTasks() {
        let filtered = [...this.tasks];
        const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        
        if (searchTerm) {
            filtered = filtered.filter(t => 
                (t.title || t.nome || '').toLowerCase().includes(searchTerm)
            );
        }
        
        switch(this.currentFilter) {
            case 'pendentes': filtered = filtered.filter(t => !t.completed); break;
            case 'concluidas': filtered = filtered.filter(t => t.completed); break;
            case 'favoritas': filtered = filtered.filter(t => t.favorita); break;
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
                    (a.subject || a.disciplina || '').localeCompare(b.subject || b.disciplina || '')
                );
            case 'prioridade':
                return tasks.sort((a, b) => 
                    (prioridadeOrder[a.priority] || 4) - (prioridadeOrder[b.priority] || 4)
                );
            default:
                return tasks;
        }
    }
    
    createTaskHTML(task) {
        const isCompleted = task.completed || false;
        const isFavorita = task.favorita || false;
        const disciplina = task.subject || task.disciplina || 'Geral';
        const prioridade = task.priority || 'media';
        const prazo = task.prazo ? new Date(task.prazo).toLocaleDateString('pt-BR') : 'Sem data';
        
        const corDisciplina = this.getCorDisciplina(disciplina);
        const classePrioridade = this.getClassePrioridade(prioridade);
        const textoPrioridade = this.getTextoPrioridade(prioridade);
        const disciplinaTexto = this.getTextoDisciplina(disciplina);
        
        return `
            <div class="task-item" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
                <div class="task-content">
                    <h4 style="${isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${this.app.escapeHtml(task.title || task.nome)}</h4>
                    <p>${this.app.escapeHtml(task.description || task.descricao || 'Sem descrição')}</p>
                    <div class="task-meta">
                        <span class="task-subject" style="color: ${corDisciplina}">
                            <i class="fas fa-circle"></i> ${disciplinaTexto}
                        </span>
                        <span class="task-date"><i class="fas fa-calendar"></i> ${prazo}</span>
                        <span class="task-priority ${classePrioridade}">
                            <i class="fas fa-flag"></i> ${textoPrioridade}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn favorite ${isFavorita ? 'active' : ''}" style="color: ${isFavorita ? '#eab308' : ''}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="task-btn edit"><i class="fas fa-edit"></i></button>
                    <button class="task-btn delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }
    
    // ============================================
    // CRUD
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
            if (typeof showToast === 'function') {
                showToast(completed ? 'Tarefa concluída!' : 'Tarefa reaberta!', 'success');
            }
        }
    }
    
    toggleFavorite(id) {
        const task = this.tasks.find(t => t.id == id);
        if (task) {
            task.favorita = !task.favorita;
            this.saveTasks();
            this.renderTasks();
            this.renderStats();
            if (typeof showToast === 'function') {
                showToast(task.favorita ? 'Adicionada aos favoritos!' : 'Removida dos favoritos!', 'success');
            }
        }
    }
    
    deleteTask(id) {
        if (confirm('Deseja excluir esta tarefa?')) {
            this.tasks = this.tasks.filter(t => t.id != id);
            this.saveTasks();
            this.renderTasks();
            this.renderStats();
            this.renderSubjects();
            if (typeof showToast === 'function') {
                showToast('Tarefa excluída!', 'success');
            }
        }
    }
    
    saveTasks() {
        this.app.data.tasks = this.tasks;
        this.app.saveAllData();
    }
    
    // ============================================
    // MODAL DE TAREFA
    // ============================================
    openTaskModal(id = null) {
        const task = id ? this.tasks.find(t => t.id == id) : null;
        this.editingTaskId = task ? task.id : null;
        this.selectedPriority = task ? task.priority : 'media';
        this.subtasks = task ? task.subtasks || [] : [];
        
        const modal = document.getElementById('taskModal');
        if (!modal) {
            // Criar modal se não existir
            this.createTaskModal();
            return;
        }
        
        document.getElementById('modalTitle').textContent = task ? 'Editar Tarefa' : 'Nova Tarefa';
        document.getElementById('nomeTarefa').value = task ? task.title || task.nome : '';
        document.getElementById('descricaoTarefa').value = task ? task.description || task.descricao : '';
        document.getElementById('prazoTarefa').value = task ? task.prazo : '';
        document.getElementById('disciplinaTarefa').value = task ? task.subject || task.disciplina || 'matematica' : 'matematica';
        
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
    
    createTaskModal() {
        const modalHTML = `
            <div class="modal" id="taskModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modalTitle">Nova Tarefa</h2>
                        <button class="modal-close" onclick="app.modules.tarefas.closeTaskModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="formNovaTarefa">
                        <div class="form-group">
                            <label>Nome da Tarefa</label>
                            <input type="text" id="nomeTarefa" placeholder="Digite o nome da tarefa" required>
                        </div>
                        <div class="form-group">
                            <label>Descrição</label>
                            <textarea id="descricaoTarefa" placeholder="Digite a descrição (opcional)"></textarea>
                        </div>
                        <div class="form-row-two">
                            <div class="form-group">
                                <label>Prioridade</label>
                                <div class="priority-options">
                                    <button type="button" class="priority-btn" data-priority="alta">Alta</button>
                                    <button type="button" class="priority-btn active" data-priority="media">Média</button>
                                    <button type="button" class="priority-btn" data-priority="baixa">Baixa</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Prazo</label>
                                <input type="date" id="prazoTarefa">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Disciplina</label>
                            <select id="disciplinaTarefa">
                                <option value="matematica">Matemática</option>
                                <option value="portugues">Português</option>
                                <option value="historia">História</option>
                                <option value="fisica">Física</option>
                                <option value="quimica">Química</option>
                                <option value="biologia">Biologia</option>
                                <option value="geografia">Geografia</option>
                                <option value="ingles">Inglês</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Subtarefas</label>
                            <div class="subtasks-container" id="subtasksContainer"></div>
                            <button type="button" class="btn-add-subtask" onclick="app.modules.tarefas.addSubtask()">
                                <i class="fas fa-plus"></i> Adicionar subtarefa
                            </button>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" onclick="app.modules.tarefas.closeTaskModal()">Cancelar</button>
                            <button type="submit" class="btn-create">Salvar Tarefa</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupFormEvents();
        this.openTaskModal();
    }
    
    setupFormEvents() {
        document.getElementById('formNovaTarefa')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTaskFromForm();
        });
        
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPriority = btn.dataset.priority;
            });
        });
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
                <button type="button" class="remove-subtask" onclick="app.modules.tarefas.removeSubtask(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(div);
        });
    }
    
    addSubtask() {
        this.subtasks.push({ texto: '', concluida: false });
        this.renderSubtasks();
    }
    
    removeSubtask(index) {
        this.subtasks.splice(index, 1);
        this.renderSubtasks();
    }
    
    saveTaskFromForm() {
        const nome = document.getElementById('nomeTarefa').value.trim();
        if (!nome) {
            alert('Preencha o nome da tarefa!');
            return;
        }
        
        const subtasksList = [];
        document.querySelectorAll('.subtask-item input').forEach(input => {
            if (input.value.trim()) {
                subtasksList.push({ texto: input.value.trim(), concluida: false });
            }
        });
        
        const taskData = {
            title: nome,
            description: document.getElementById('descricaoTarefa').value.trim(),
            priority: this.selectedPriority,
            prazo: document.getElementById('prazoTarefa').value,
            subject: document.getElementById('disciplinaTarefa').value,
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
            taskData.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            this.tasks.unshift(taskData);
        }
        
        this.saveTasks();
        this.closeTaskModal();
        this.renderTasks();
        this.renderStats();
        this.renderSubjects();
        if (typeof showToast === 'function') {
            showToast(this.editingTaskId ? 'Tarefa atualizada!' : 'Tarefa criada!', 'success');
        }
    }
    
    // ============================================
    // SUBJECTS
    // ============================================
    renderSubjects() {
        const list = document.getElementById('subjectsList');
        if (!list) return;
        
        const disciplinasMap = new Map();
        this.tasks.forEach(t => {
            const disc = t.subject || t.disciplina;
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
        
        if (disciplinasMap.size === 0) {
            list.innerHTML = '<p style="text-align:center;padding:20px;color:#9ca3af;">Nenhuma disciplina</p>';
            return;
        }
        
        const cores = ['#8b5cf6', '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#eab308'];
        let i = 0;
        let html = '';
        for (const [key, disc] of disciplinasMap) {
            const cor = cores[i % cores.length];
            html += `
                <div class="subject-item" data-subject="${key}" onclick="app.modules.tarefas.filterBySubject('${key}')">
                    <div class="subject-color" style="background-color: ${cor};"></div>
                    <span>${this.app.escapeHtml(disc.nome)}</span>
                    <span class="subject-count">${disc.count}</span>
                </div>
            `;
            i++;
        }
        list.innerHTML = html;
    }
    
    filterBySubject(subject) {
        document.querySelectorAll('.subject-item').forEach(el => el.classList.remove('active'));
        const el = document.querySelector(`.subject-item[data-subject="${subject}"]`);
        if (el) el.classList.add('active');
        
        // Filtrar tarefas por disciplina
        this.currentFilter = 'todas';
        document.querySelectorAll('.filter-item').forEach(f => f.classList.remove('active-filter'));
        document.querySelector('.filter-item[data-filter="todas"]')?.classList.add('active-filter');
        
        // Buscar pela disciplina
        document.getElementById('searchInput').value = subject;
        this.renderTasks();
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
    
    selectPriority(priority) {
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === priority);
        });
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
        
        // Fechar modal clicando fora
        document.getElementById('taskModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeTaskModal();
        });
        
        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeTaskModal();
        });
    }
}

console.log('[Tarefas] ✅ Módulo carregado!');