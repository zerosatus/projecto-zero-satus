// ============================================
// mobile-telas/modules/tarefas.js
// TAREFAS COMPLETO (COM DISCIPLINAS)
// ⭐ Select de disciplina no modal
// ⭐ Listener disciplinasUpdated
// ============================================

class TarefasModule {
    constructor(app) {
        this.app = app;
        this.name = 'tarefas';
        this.currentFilter = 'todos';
        this.editingTaskId = null;
        this.selectedPriority = 'media';
        this.selectedColor = '#8b5cf6';
        this.isSaving = false;
        this._isSubmitting = false;

        console.log('[Tarefas] 📋 Módulo inicializado');
    }

    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[Tarefas] 📋 Renderizando...');

        this.tasks = data.tasks || [];
        this.notifications = data.notifications || [];

        this.popularSelectDisciplinas();
        this.renderTasks();
        this.updateBadge();
        this.setupEvents();
    }

    // ============================================
    // ⭐ POPULAR SELECT DE DISCIPLINAS
    // ============================================
    popularSelectDisciplinas(selecionada = '') {
        const select = document.getElementById('task-disciplina');
        if (!select) return;

        const disciplinas = this.app.modules.disciplinas?.getTodas() || [];

        select.innerHTML = '<option value="">— Sem disciplina —</option>';
        disciplinas.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.nome;
            opt.textContent = d.nome;
            select.appendChild(opt);
        });

        select.value = selecionada || '';
    }

    // ============================================
    // SALVAR DADOS
    // ============================================
    async salvarDados() {
        if (this.isSaving || !this.app) return;
        this.isSaving = true;
        try {
            this.app.data.tasks = this.tasks;
            await this.app.saveAllData();
            console.log('[Tarefas] ✅ Dados salvos:', this.tasks.length);
        } catch (error) {
            console.error('[Tarefas] ❌ Erro ao salvar:', error);
        }
        setTimeout(() => { this.isSaving = false; }, 500);
    }

    // ============================================
    // RENDER TAREFAS
    // ============================================
    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        if (!tasksList) return;

        let filtered = [...this.tasks];
        if (this.currentFilter === 'pendentes') {
            filtered = this.tasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'concluidas') {
            filtered = this.tasks.filter(t => t.completed);
        }

        if (filtered.length === 0) {
            tasksList.innerHTML = `
                <div class="tasks-empty">
                    <ion-icon name="checkbox-outline"></ion-icon>
                    <p>${this.currentFilter === 'concluidas' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa encontrada'}</p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(task => {
            const priorityClass = task.priority || 'media';
            const isCompleted = task.completed || false;
            const disc = task.disciplina || task.subject || '';
            const cor = disc ? (this.app.modules.disciplinas?.getCor(disc) || '#8b5cf6') : '#8b5cf6';
            const icone = disc ? (this.app.modules.disciplinas?.getIcone(disc) || 'fa-book') : 'fa-book';
            const discHtml = disc
                ? `<i class="fas ${icone}" style="margin-right:4px;color:${cor};"></i>${this.app.escapeHtml(disc)}`
                : 'Geral';

            html += `
                <div class="task-item ${isCompleted ? 'completed' : ''} prioridade-${priorityClass}" data-id="${task.id}">
                    <div class="task-color" style="background-color: ${task.color || '#8b5cf6'}"></div>
                    <div class="task-info">
                        <div class="task-title">${this.app.escapeHtml(task.title || task.nome || 'Tarefa')}</div>
                        <div class="task-subject">${discHtml}</div>
                        <div class="task-date">
                            <ion-icon name="calendar-outline"></ion-icon>
                            ${task.date || 'Sem data'}
                        </div>
                    </div>
                    <div class="task-check ${isCompleted ? 'checked' : ''}" data-id="${task.id}">
                        ${isCompleted ? '<ion-icon name="checkmark-outline"></ion-icon>' : ''}
                    </div>
                    <div class="task-arrow" data-id="${task.id}">
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </div>
                </div>
            `;
        });
        tasksList.innerHTML = html;

        tasksList.querySelectorAll('.task-check').forEach(check => {
            check.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTask(check.dataset.id);
            });
        });

        tasksList.querySelectorAll('.task-arrow').forEach(arrow => {
            arrow.addEventListener('click', (e) => {
                e.stopPropagation();
                const task = this.tasks.find(t => t.id == arrow.dataset.id);
                if (task) this.openTaskModal(task);
            });
        });

        tasksList.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', () => {
                const task = this.tasks.find(t => t.id == item.dataset.id);
                if (task) this.openTaskModal(task);
            });
        });
    }

    // ============================================
    // TOGGLE TAREFA
    // ============================================
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id == taskId);
        if (!task) return;
        task.completed = !task.completed;
        this.salvarDados();
        this.renderTasks();
        this.updateBadge();
        if (typeof showToast === 'function') {
            showToast(task.completed ? '✅ Tarefa concluída!' : '🔄 Tarefa reaberta!', 'success');
        }
    }

    // ============================================
    // DELETAR TAREFA
    // ============================================
    deleteTask(taskId) {
        if (!confirm('Excluir esta tarefa?')) return;
        this.tasks = this.tasks.filter(t => t.id != taskId);
        this.salvarDados();
        this.renderTasks();
        this.updateBadge();
        if (typeof showToast === 'function') showToast('🗑️ Tarefa excluída!', 'success');
    }

    // ============================================
    // MODAL DE TAREFA
    // ============================================
    openTaskModal(task) {
        const modal = document.getElementById('task-modal');
        if (!modal) return;

        this.editingTaskId = task ? task.id : null;

        if (task) {
            document.getElementById('task-modal-title').textContent = '✏️ Editar Tarefa';
            document.getElementById('task-title').value = task.title || '';
            document.getElementById('task-date').value = task.date || '';
            const nomeDisc = this.app.modules.disciplinas?.resolverNome(task.subject || task.disciplina || '') || '';
            this.popularSelectDisciplinas(nomeDisc);
            this.selectedColor = task.color || '#8b5cf6';
            this.selectedPriority = task.priority || 'media';
        } else {
            document.getElementById('task-modal-title').textContent = '📝 Nova Tarefa';
            document.getElementById('task-title').value = '';
            document.getElementById('task-date').value = '';
            this.popularSelectDisciplinas('');
            this.selectedPriority = 'media';
            this.selectedColor = '#8b5cf6';
        }

        document.querySelectorAll('#task-modal .priority-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === this.selectedPriority);
        });

        document.querySelectorAll('#task-modal .color-option').forEach(option => {
            option.classList.toggle('active', option.dataset.color === this.selectedColor);
        });

        modal.classList.add('active');

        setTimeout(() => {
            document.getElementById('task-title')?.focus();
        }, 300);
    }

    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) modal.classList.remove('active');
        this.editingTaskId = null;
        this._isSubmitting = false;
    }

    // ============================================
    // SALVAR TAREFA
    // ============================================
    async saveTask() {
        if (this._isSubmitting) return;

        const title = document.getElementById('task-title')?.value?.trim();
        const subject = document.getElementById('task-disciplina')?.value || '';
        const date = document.getElementById('task-date')?.value;

        if (!title) {
            if (typeof showToast === 'function') showToast('⚠️ Preencha o título!', 'error');
            return;
        }

        this._isSubmitting = true;

        try {
            if (this.editingTaskId) {
                const index = this.tasks.findIndex(t => t.id == this.editingTaskId);
                if (index > -1) {
                    this.tasks[index] = {
                        ...this.tasks[index],
                        title,
                        subject: subject,
                        disciplina: subject,
                        date: date || this.tasks[index].date,
                        color: this.selectedColor,
                        priority: this.selectedPriority
                    };
                }
            } else {
                const novaTarefa = {
                    id: Date.now(),
                    title,
                    subject: subject,
                    disciplina: subject,
                    date: date || new Date().toLocaleDateString('pt-BR'),
                    color: this.selectedColor,
                    priority: this.selectedPriority,
                    completed: false
                };

                const existe = this.tasks.some(t =>
                    t.title === title &&
                    t.subject === subject &&
                    t.date === date &&
                    !t.completed
                );

                if (!existe) {
                    this.tasks.unshift(novaTarefa);
                } else {
                    if (typeof showToast === 'function') showToast('⚠️ Tarefa já existe!', 'info');
                    this.closeTaskModal();
                    return;
                }
            }

            await this.salvarDados();
            this.closeTaskModal();
            this.renderTasks();
            this.updateBadge();

            if (typeof showToast === 'function') {
                showToast(this.editingTaskId ? '✅ Tarefa atualizada!' : '✅ Tarefa criada!', 'success');
            }
        } catch (error) {
            console.error('[Tarefas] ❌ Erro ao salvar:', error);
            if (typeof showToast === 'function') showToast('❌ Erro ao salvar tarefa', 'error');
        } finally {
            this._isSubmitting = false;
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
        document.querySelectorAll('#view-tarefas .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#view-tarefas .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderTasks();
            });
        });

        document.getElementById('btn-add-task')?.addEventListener('click', () => {
            this.openTaskModal(null);
        });

        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('.btn-back') || e.target.closest('.btn-close')) {
                    this.closeTaskModal();
                }
            });
        }

        document.querySelectorAll('#task-modal .priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#task-modal .priority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPriority = btn.dataset.priority;
            });
        });

        document.querySelectorAll('#task-modal .color-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('#task-modal .color-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.selectedColor = option.dataset.color;
            });
        });

        const saveBtn = document.getElementById('btn-save-task');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveTask());
        }

        document.getElementById('task-title')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveTask();
            }
        });

        // ⭐ Atualizar select quando disciplinas mudarem
        window.addEventListener('disciplinasUpdated', () => {
            const modalAberto = document.getElementById('task-modal')?.classList.contains('active');
            if (modalAberto) {
                const valorAtual = document.getElementById('task-disciplina')?.value || '';
                this.popularSelectDisciplinas(valorAtual);
            }
            const viewAtiva = document.getElementById('view-tarefas')?.classList.contains('active');
            if (viewAtiva) this.renderTasks();
        });
    }
}

console.log('[Tarefas] ✅ Módulo carregado!');