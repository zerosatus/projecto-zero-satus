// tarefas/script.js - COMPLETO CORRIGIDO COM CACHEMANAGER

let tarefas = [];
let filtroAtual = 'todas';
let disciplinaAtual = null;
let usuarioAtual = null;
let prioridadeSelecionada = 'media';
let subtasks = [];
let tarefaEditando = null;
let weeklySchedule = {};

window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userNameProfile = document.getElementById('userNameProfile');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userNameDisplay) userNameDisplay.textContent = usuarioAtual.nome;
        if (userNameProfile) userNameProfile.textContent = usuarioAtual.nome;
        if (userAvatar) {
            const iniciais = usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
            userAvatar.textContent = iniciais || usuarioAtual.nome.charAt(0).toUpperCase();
        }
        
        if (window.initSync) {
            await window.initSync();
        }
        
        carregarHorario();
        inicializarTarefas();
        
        // ✅ ESCUTAR EVENTOS DE SINCRONIZAÇÃO
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[Tarefas] Dados atualizados da nuvem');
            carregarHorario();
            carregarTarefas();
            renderizarTarefas();
            atualizarEstatisticas();
            renderizarDisciplinas();
        });
        
        window.addEventListener('tasksUpdated', (event) => {
            if (event.detail) {
                console.log('[Tarefas] Evento tasksUpdated recebido');
                carregarTarefas();
                renderizarTarefas();
                atualizarEstatisticas();
                renderizarDisciplinas();
            }
        });
        
        window.addEventListener('forceRefresh', () => {
            carregarTarefas();
            renderizarTarefas();
            atualizarEstatisticas();
            renderizarDisciplinas();
        });

        // ✅ ESCUTAR MUDANÇAS NO localStorage (outras abas)
        window.addEventListener('storage', (e) => {
            if (e.key && (e.key.includes('_tasks') || e.key.includes('tarefas_'))) {
                console.log('[Tarefas] Mudança detectada em outra aba:', e.key);
                carregarTarefas();
                renderizarTarefas();
                atualizarEstatisticas();
                renderizarDisciplinas();
            }
        });
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

function carregarHorario() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('weeklySchedule', null);
        if (cached !== null) {
            weeklySchedule = cached;
            console.log('[Tarefas] Horário carregado do CacheManager');
            return;
        }
    }

    const userId = usuarioAtual.id;
    const storageKey = `${userId}_weeklySchedule`;
    const scheduleSalvo = localStorage.getItem(storageKey);
    weeklySchedule = scheduleSalvo ? JSON.parse(scheduleSalvo) : { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
}

function inicializarTarefas() {
    carregarTarefas();
    configurarEventos();
    renderizarTarefas();
    atualizarEstatisticas();
    renderizarDisciplinas();
}

function configurarEventos() {
    const filterItems = document.querySelectorAll('.filter-item');
    filterItems.forEach(item => {
        item.addEventListener('click', function() {
            const filtro = this.dataset.filter;
            filterItems.forEach(f => f.classList.remove('active-filter'));
            this.classList.add('active-filter');
            filtroAtual = filtro;
            disciplinaAtual = null;
            renderizarTarefas();
            document.querySelectorAll('.subject-item').forEach(s => s.classList.remove('active'));
        });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', () => renderizarTarefas());

    const orderSelect = document.getElementById('orderSelect');
    if (orderSelect) orderSelect.addEventListener('change', () => renderizarTarefas());

    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('task-checkbox')) {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) alternarConclusaoTarefa(taskItem.dataset.id, e.target.checked);
        }
    });

    document.addEventListener('click', function(e) {
        const favoriteBtn = e.target.closest('.task-btn.favorite');
        if (favoriteBtn) {
            e.preventDefault();
            const taskItem = favoriteBtn.closest('.task-item');
            if (taskItem) alternarFavoritoTarefa(taskItem.dataset.id);
        }
        
        const editBtn = e.target.closest('.task-btn.edit');
        if (editBtn) {
            e.preventDefault();
            const taskItem = editBtn.closest('.task-item');
            if (taskItem) abrirModalEdicao(taskItem.dataset.id);
        }
        
        const deleteBtn = e.target.closest('.task-btn.delete');
        if (deleteBtn) {
            e.preventDefault();
            const taskItem = deleteBtn.closest('.task-item');
            if (taskItem) deletarTarefa(taskItem.dataset.id);
        }
    });
}

// ============================================
// ✅ FUNÇÃO CORRIGIDA: CARREGAR TAREFAS
// ============================================
function carregarTarefas() {
    if (!usuarioAtual) return;
    
    // ✅ PRIORIDADE 1: CacheManager (JÁ ENVIA PARA SUPABASE)
    if (window.CacheManager) {
        const cached = window.CacheManager.get('tasks', null);
        if (cached !== null) {
            tarefas = cached;
            console.log('[Tarefas] Carregado do CacheManager:', tarefas.length);
            
            // ✅ GARANTIR QUE LOCALSTORAGE TAMBÉM ESTÁ ATUALIZADO
            const userId = usuarioAtual.id;
            localStorage.setItem(`${userId}_tasks`, JSON.stringify(tarefas));
            return;
        }
    }

    // ✅ PRIORIDADE 2: localStorage com UUID
    const userId = usuarioAtual.id;
    const storageKey = `${userId}_tasks`;
    const tarefasSalvas = localStorage.getItem(storageKey);

    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
        console.log('[Tarefas] Carregado do localStorage:', tarefas.length);
    } else {
        // Tentar migrar dados antigos (se existirem com email)
        const oldStorageKey = `tarefas_${usuarioAtual.email}`;
        const oldTarefas = localStorage.getItem(oldStorageKey);
        if (oldTarefas) {
            tarefas = JSON.parse(oldTarefas);
            console.log('[Tarefas] Migrado do formato antigo:', tarefas.length);
            localStorage.setItem(storageKey, oldTarefas);
            localStorage.removeItem(oldStorageKey);
        } else {
            tarefas = [];
        }
    }
    
    // ✅ SALVAR NO CACHEMANAGER (para enviar para nuvem)
    if (window.CacheManager && tarefas.length > 0) {
        window.CacheManager.set('tasks', tarefas, true);
    }
}

// ============================================
// ✅ FUNÇÃO CORRIGIDA: SALVAR TAREFAS
// ============================================
function salvarTarefas() {
    if (!usuarioAtual) return;
    
    // ✅ 1. Salvar no CacheManager (ENVIA PARA SUPABASE)
    if (window.CacheManager) {
        window.CacheManager.set('tasks', tarefas, true);
        console.log('[Tarefas] ✅ Salvo no CacheManager (nuvem):', tarefas.length);
    }
    
    // ✅ 2. Backup no localStorage com UUID
    const userId = usuarioAtual.id;
    const storageKey = `${userId}_tasks`;
    localStorage.setItem(storageKey, JSON.stringify(tarefas));
    
    // ✅ 3. Backup com email (compatibilidade)
    localStorage.setItem(`tarefas_${usuarioAtual.email}`, JSON.stringify(tarefas));
    
    // ✅ 4. Disparar evento para outras abas
    window.dispatchEvent(new CustomEvent('tasksUpdated', { detail: tarefas }));
}

function gerarId() { 
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9); 
}

function renderizarDisciplinas() {
    const subjectsList = document.getElementById('subjectsList');
    if (!subjectsList) return;
    
    const disciplinasMap = new Map();

    tarefas.forEach(t => {
        const disc = t.disciplina || t.subject;
        if (disc) {
            const pendentes = t.completed ? 0 : 1;
            if (disciplinasMap.has(disc)) {
                disciplinasMap.set(disc, disciplinasMap.get(disc) + pendentes);
            } else {
                disciplinasMap.set(disc, pendentes);
            }
        }
    });

    if (weeklySchedule) {
        Object.values(weeklySchedule).forEach(day => {
            if (Array.isArray(day)) {
                day.forEach(c => {
                    if (c && c.materia) {
                        const disc = c.materia.toLowerCase();
                        if (!disciplinasMap.has(disc)) {
                            disciplinasMap.set(disc, 0);
                        }
                    }
                });
            }
        });
    }

    if (disciplinasMap.size === 0) {
        subjectsList.innerHTML = '<p style="text-align: center; padding: 20px; color: #9ca3af;">Nenhuma disciplina</p>';
        return;
    }

    const cores = {
        'matematica': '#8b5cf6', 'portugues': '#3b82f6', 'historia': '#ef4444',
        'fisica': '#f59e0b', 'quimica': '#10b981', 'biologia': '#eab308', 
        'geografia': '#14b8a6', 'ingles': '#64748b', 'outros': '#9ca3af'
    };

    let html = '';
    for (const [disciplina, count] of disciplinasMap) {
        const cor = cores[disciplina] || '#9ca3af';
        html += `<div class="subject-item" data-subject="${disciplina}">
            <div class="subject-color" style="background-color: ${cor};"></div>
            <span>${getTextoDisciplina(disciplina)}</span>
            <span class="subject-count">${count}</span>
        </div>`;
    }

    subjectsList.innerHTML = html;

    document.querySelectorAll('.subject-item').forEach(item => {
        item.addEventListener('click', function() {
            const disciplina = this.dataset.subject;
            if (disciplinaAtual === disciplina) {
                disciplinaAtual = null;
                document.querySelectorAll('.subject-item').forEach(s => s.classList.remove('active'));
            } else {
                document.querySelectorAll('.subject-item').forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                disciplinaAtual = disciplina;
            }
            renderizarTarefas();
        });
    });
}

function getTextoDisciplina(disciplina) {
    const textos = {
        matematica: 'Matemática', portugues: 'Português', historia: 'História',
        fisica: 'Física', quimica: 'Química', biologia: 'Biologia',
        geografia: 'Geografia', ingles: 'Inglês', outros: 'Outros'
    };
    return textos[disciplina] || disciplina;
}

function getCorDisciplina(disciplina) {
    const cores = {
        matematica: '#8b5cf6', portugues: '#3b82f6', historia: '#ef4444',
        fisica: '#f59e0b', quimica: '#10b981', biologia: '#eab308',
        geografia: '#14b8a6', ingles: '#64748b', outros: '#9ca3af'
    };
    return cores[disciplina] || '#9ca3af';
}

function getClassePrioridade(prioridade) {
    const classes = { alta: 'urgent', media: 'high', baixa: 'medium' };
    return classes[prioridade] || 'normal';
}

function getTextoPrioridade(prioridade) {
    const textos = { alta: 'Urgente', media: 'Alta', baixa: 'Média' };
    return textos[prioridade] || 'Normal';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatarDataParaString(data) {
    if (!data) return '';
    const d = new Date(data);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}

function renderizarTarefas() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    let tarefasFiltradas = filtrarTarefas();
    tarefasFiltradas = ordenarTarefas(tarefasFiltradas);

    if (tarefasFiltradas.length === 0) {
        taskList.innerHTML = `<div class="empty-state" style="text-align: center; padding: 40px;">
            <i class="fas fa-tasks" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px; display: block;"></i>
            <h3 style="color: var(--text-primary);">Nenhuma tarefa encontrada</h3>
            <p style="color: var(--text-secondary);">Clique em "Nova Tarefa" para começar</p>
        </div>`;
        return;
    }

    taskList.innerHTML = tarefasFiltradas.map(tarefa => criarHTMLTarefa(tarefa)).join('');
}

function filtrarTarefas() {
    let filtradas = [...tarefas];
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtradas = filtradas.filter(t => 
            (t.nome || '').toLowerCase().includes(searchTerm) || 
            (t.descricao || '').toLowerCase().includes(searchTerm)
        );
    }

    if (disciplinaAtual) {
        filtradas = filtradas.filter(t => (t.disciplina || t.subject) === disciplinaAtual);
    }

    switch(filtroAtual) {
        case 'pendentes': filtradas = filtradas.filter(t => !t.completed); break;
        case 'concluidas': filtradas = filtradas.filter(t => t.completed); break;
        case 'favoritas': filtradas = filtradas.filter(t => t.favorita); break;
        default: break;
    }

    return filtradas;
}

function ordenarTarefas(tarefasParaOrdenar) {
    const orderSelect = document.getElementById('orderSelect');
    const criterio = orderSelect?.value || 'prazo';
    
    switch(criterio) {
        case 'prazo':
            return tarefasParaOrdenar.sort((a, b) => {
                if (!a.prazo) return 1;
                if (!b.prazo) return -1;
                return new Date(a.prazo) - new Date(b.prazo);
            });
        case 'disciplina':
            return tarefasParaOrdenar.sort((a, b) => 
                (a.disciplina || a.subject || '').localeCompare(b.disciplina || b.subject || '')
            );
        case 'prioridade':
            const prioridadeOrder = { 'alta': 1, 'media': 2, 'baixa': 3 };
            return tarefasParaOrdenar.sort((a, b) => 
                (prioridadeOrder[a.prioridade] || 4) - (prioridadeOrder[b.prioridade] || 4)
            );
        default:
            return tarefasParaOrdenar;
    }
}

function criarHTMLTarefa(tarefa) {
    const corDisciplina = getCorDisciplina(tarefa.disciplina || tarefa.subject);
    const textoDisciplina = getTextoDisciplina(tarefa.disciplina || tarefa.subject);
    const classePrioridade = getClassePrioridade(tarefa.prioridade);
    const textoPrioridade = getTextoPrioridade(tarefa.prioridade);
    const favoritaClass = tarefa.favorita ? 'active' : '';
    const favoritaColor = tarefa.favorita ? '#eab308' : '';
    const prazoFormatado = tarefa.prazo ? formatarDataParaString(tarefa.prazo) : 'Sem data';
    
    let subtasksHTML = '';
    if (tarefa.subtasks && tarefa.subtasks.length > 0) {
        subtasksHTML = `<div class="task-subtasks" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">
            <strong style="font-size: 12px; color: var(--text-secondary);">Subtarefas:</strong>
            <ul style="margin-top: 6px; padding-left: 20px;">
                ${tarefa.subtasks.map(st => `<li style="font-size: 13px; color: var(--text-secondary); margin: 4px 0;">${escapeHtml(st.texto)}</li>`).join('')}
            </ul>
        </div>`;
    }

    return `<div class="task-item" data-id="${tarefa.id}">
        <input type="checkbox" class="task-checkbox" ${tarefa.completed ? 'checked' : ''}>
        <div class="task-content">
            <h4 style="${tarefa.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(tarefa.nome)}</h4>
            <p>${escapeHtml(tarefa.descricao || 'Sem descrição')}</p>
            <div class="task-meta">
                <span class="task-subject" style="color: ${corDisciplina}"><i class="fas fa-circle"></i> ${textoDisciplina}</span>
                <span class="task-date"><i class="fas fa-calendar"></i> ${prazoFormatado}</span>
                <span class="task-priority ${classePrioridade}"><i class="fas fa-flag"></i> ${textoPrioridade}</span>
            </div>
            ${subtasksHTML}
        </div>
        <div class="task-actions">
            <button class="task-btn favorite ${favoritaClass}" style="color: ${favoritaColor}"><i class="fas fa-star"></i></button>
            <button class="task-btn edit"><i class="fas fa-edit"></i></button>
            <button class="task-btn delete"><i class="fas fa-trash"></i></button>
        </div>
    </div>`;
}

function alternarConclusaoTarefa(id, concluida) {
    const tarefa = tarefas.find(t => t.id == id);
    if (tarefa) {
        tarefa.completed = concluida;
        tarefa.dataConclusao = concluida ? new Date().toISOString() : null;
        salvarTarefas();
        renderizarTarefas();
        atualizarEstatisticas();
        renderizarDisciplinas();
        mostrarNotificacao(concluida ? 'Tarefa concluída!' : 'Tarefa reaberta!', 'success');
    }
}

function alternarFavoritoTarefa(id) {
    const tarefa = tarefas.find(t => t.id == id);
    if (tarefa) {
        tarefa.favorita = !tarefa.favorita;
        salvarTarefas();
        renderizarTarefas();
        atualizarEstatisticas();
        mostrarNotificacao(tarefa.favorita ? 'Adicionada aos favoritos!' : 'Removida dos favoritos!', 'success');
    }
}

function deletarTarefa(id) {
    if (confirm('Deseja excluir esta tarefa?')) {
        tarefas = tarefas.filter(t => t.id != id);
        salvarTarefas();
        renderizarTarefas();
        atualizarEstatisticas();
        renderizarDisciplinas();
        mostrarNotificacao('Tarefa excluída!', 'success');
    }
}

function atualizarEstatisticas() {
    const pendentes = tarefas.filter(t => !t.completed).length;
    const concluidasHoje = tarefas.filter(t => t.completed && t.dataConclusao && new Date(t.dataConclusao).toDateString() === new Date().toDateString()).length;
    const atrasadas = tarefas.filter(t => !t.completed && t.prazo && new Date(t.prazo) < new Date()).length;
    const favoritas = tarefas.filter(t => t.favorita).length;
    const total = tarefas.length;
    const concluidas = tarefas.filter(t => t.completed).length;
    
    const pendingCount = document.getElementById('pendingCount');
    const completedTodayCount = document.getElementById('completedTodayCount');
    const overdueCount = document.getElementById('overdueCount');
    const totalBadge = document.getElementById('totalBadge');
    const pendingBadge = document.getElementById('pendingBadge');
    const completedBadge = document.getElementById('completedBadge');
    const favoriteBadge = document.getElementById('favoriteBadge');

    if (pendingCount) pendingCount.textContent = pendentes;
    if (completedTodayCount) completedTodayCount.textContent = concluidasHoje;
    if (overdueCount) overdueCount.textContent = atrasadas;
    if (totalBadge) totalBadge.textContent = total;
    if (pendingBadge) pendingBadge.textContent = pendentes;
    if (completedBadge) completedBadge.textContent = concluidas;
    if (favoriteBadge) favoriteBadge.textContent = favoritas;
}

function mostrarNotificacao(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const toastSpan = toast.querySelector('span');
    if (toastSpan) toastSpan.textContent = mensagem;
    
    toast.style.background = tipo === 'success' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'linear-gradient(135deg, #ef4444, #dc2626)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function abrirModal() { 
    abrirModalEdicao(null); 
}

function abrirModalEdicao(id) {
    const tarefa = id ? tarefas.find(t => t.id == id) : null;
    tarefaEditando = tarefa;
    prioridadeSelecionada = tarefa?.prioridade || 'media';
    
    const modalTitle = document.getElementById('modalTitle');
    const nomeTarefa = document.getElementById('nomeTarefa');
    const descricaoTarefa = document.getElementById('descricaoTarefa');
    const prazoTarefa = document.getElementById('prazoTarefa');
    const disciplinaTarefa = document.getElementById('disciplinaTarefa');

    if (modalTitle) modalTitle.textContent = tarefa ? 'Editar Tarefa' : 'Nova Tarefa';
    if (nomeTarefa) nomeTarefa.value = tarefa?.nome || '';
    if (descricaoTarefa) descricaoTarefa.value = tarefa?.descricao || '';
    if (prazoTarefa) prazoTarefa.value = tarefa?.prazo || '';
    if (disciplinaTarefa) disciplinaTarefa.value = tarefa?.disciplina || 'matematica';

    selecionarPrioridade(tarefa?.prioridade || 'media');

    const container = document.getElementById('subtasksContainer');
    if (container) {
        container.innerHTML = '';
        subtasks = tarefa?.subtasks || [];
        subtasks.forEach(st => adicionarSubtarefa(st.texto));
    }

    const modal = document.getElementById('modalNovaTarefa');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function fecharModal() {
    const modal = document.getElementById('modalNovaTarefa');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    limparFormulario();
    tarefaEditando = null;
}

document.getElementById('modalNovaTarefa')?.addEventListener('click', function(e) {
    if (e.target === this) fecharModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modalNovaTarefa');
        if (modal && modal.classList.contains('active')) fecharModal();
    }
});

function selecionarPrioridade(prioridade) {
    prioridadeSelecionada = prioridade;
    document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.priority-btn[data-priority="${prioridade}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');
}

function adicionarSubtarefa(texto = '') {
    const container = document.getElementById('subtasksContainer');
    if (!container) return;
    
    const subtaskDiv = document.createElement('div');
    subtaskDiv.className = 'subtask-item';
    subtaskDiv.innerHTML = `
        <input type="text" placeholder="Nome da subtarefa..." value="${texto.replace(/"/g, '&quot;')}">
        <button type="button" class="remove-subtask"><i class="fas fa-times"></i></button>
    `;
    
    subtaskDiv.querySelector('.remove-subtask').addEventListener('click', function() {
        this.closest('.subtask-item').remove();
    });
    
    container.appendChild(subtaskDiv);
}

function limparFormulario() {
    const form = document.getElementById('formNovaTarefa');
    if (form) form.reset();
    
    const container = document.getElementById('subtasksContainer');
    if (container) container.innerHTML = '';
    
    subtasks = [];
    prioridadeSelecionada = 'media';
    selecionarPrioridade('media');
}

document.getElementById('formNovaTarefa')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeTarefa')?.value.trim();
    if (!nome) {
        mostrarNotificacao('Preencha o nome da tarefa!', 'error');
        return;
    }
    
    const descricao = document.getElementById('descricaoTarefa')?.value.trim();
    const prazo = document.getElementById('prazoTarefa')?.value;
    const disciplina = document.getElementById('disciplinaTarefa')?.value;
    
    const subtasksElements = document.querySelectorAll('.subtask-item input');
    const subtasksList = Array.from(subtasksElements)
        .map(input => ({ texto: input.value.trim(), concluida: false }))
        .filter(st => st.texto);

    if (tarefaEditando) {
        const index = tarefas.findIndex(t => t.id === tarefaEditando.id);
        if (index !== -1) {
            tarefas[index] = { 
                ...tarefas[index], 
                nome, 
                descricao: descricao || '', 
                prioridade: prioridadeSelecionada, 
                prazo: prazo || '', 
                disciplina: disciplina || 'outros', 
                subtasks: subtasksList 
            };
        }
    } else {
        tarefas.push({
            id: gerarId(), 
            nome, 
            descricao: descricao || '', 
            prioridade: prioridadeSelecionada,
            prazo: prazo || '', 
            disciplina: disciplina || 'outros', 
            subtasks: subtasksList,
            favorita: false, 
            completed: false, 
            dataCriacao: new Date().toISOString(), 
            dataConclusao: null
        });
    }

    salvarTarefas();
    fecharModal();
    renderizarTarefas();
    atualizarEstatisticas();
    renderizarDisciplinas();
    mostrarNotificacao(tarefaEditando ? 'Tarefa atualizada!' : 'Tarefa criada!', 'success');
});

function logout() {
    if (confirm('Deseja sair?')) {
        salvarTarefas();
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) window.CacheManager.logout();
        window.location.href = '../login/index.html';
    }
}

if (typeof window.renderizarDisciplinas === 'undefined') {
    window.renderizarDisciplinas = renderizarDisciplinas;
}

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

console.log('%c📚 Painel de Tarefas com CacheManager', 'color: #8b5cf6; font-size: 20px; font-weight: bold;');