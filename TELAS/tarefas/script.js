// ===== VERIFICAÇÃO DE LOGIN E CARREGAMENTO DO NOME =====
let tarefas = [];
let filtroAtual = 'todas';
let disciplinaAtual = null;
let usuarioAtual = null;

window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        if (usuarioAtual && usuarioAtual.nome) {
            const tituloElement = document.getElementById('userNameDisplay');
            if (tituloElement) tituloElement.textContent = usuarioAtual.nome;
            
            const nomeProfile = document.getElementById('userNameProfile');
            if (nomeProfile) nomeProfile.textContent = usuarioAtual.nome;
            
            const avatarElement = document.getElementById('userAvatar');
            if (avatarElement) {
                const iniciais = usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
                avatarElement.textContent = iniciais || usuarioAtual.nome.charAt(0).toUpperCase();
            }
        }
        
        // Iniciar sincronização
        if (window.initSync) {
            await window.initSync();
        }
        
        inicializarTarefas();
        
        // Escutar mudanças do Firebase
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[Tarefas] Dados atualizados do Firebase');
            carregarTarefas();
            renderizarTarefas();
            atualizarEstatisticas();
        });
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

function inicializarTarefas() {
    carregarTarefas();
    configurarEventos();
    renderizarTarefas();
    atualizarEstatisticas();
}

function configurarEventos() {
    const filterItems = document.querySelectorAll('.filter-item');
    filterItems.forEach(item => {
        item.addEventListener('click', function() {
            const filtro = this.querySelector('span')?.textContent.trim().toLowerCase() || '';
            filterItems.forEach(filter => filter.classList.remove('active', 'active-filter'));
            this.classList.add('active-filter');
            
            if (filtro.includes('hoje')) filtroAtual = 'hoje';
            else if (filtro.includes('próximos')) filtroAtual = 'proximos';
            else if (filtro.includes('favoritas')) filtroAtual = 'favoritas';
            else if (filtro.includes('concluídas')) filtroAtual = 'concluidas';
            else filtroAtual = 'todas';
            
            disciplinaAtual = null;
            renderizarTarefas();
        });
    });
    
    const subjectItems = document.querySelectorAll('.subject-item');
    subjectItems.forEach(item => {
        item.addEventListener('click', function() {
            const disciplina = this.querySelector('span')?.textContent.trim().toLowerCase() || '';
            subjectItems.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            disciplinaAtual = disciplina;
            renderizarTarefas();
        });
    });
    
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
    });
    
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) searchInput.addEventListener('input', (e) => renderizarTarefas(e.target.value.toLowerCase()));
    
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) filterSelect.addEventListener('change', () => renderizarTarefas());
}

function carregarTarefas() {
    if (!usuarioAtual) return;
    
    // Tentar do CacheManager primeiro
    if (window.CacheManager) {
        const cached = window.CacheManager.get('tasks', null);
        if (cached) {
            tarefas = cached;
            console.log('[Tarefas] Carregado do CacheManager:', tarefas.length);
            return;
        }
    }
    
    const storageKey = `tarefas_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(storageKey);
    
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
    } else {
        // Dados de EXEMPLO para primeiro acesso
        tarefas = [
            { id: gerarId(), nome: 'Resolver exercícios de Matemática', descricao: 'Capítulo 3: Equações do segundo grau', prioridade: 'alta', prazo: formatarDataParaString(new Date(Date.now() + 86400000)), disciplina: 'matematica', subtasks: [{texto: 'Resolver 10 questões', concluida: false}], favorita: true, concluida: false, dataCriacao: new Date().toISOString(), dataConclusao: null },
            { id: gerarId(), nome: 'Fazer resumo de Português', descricao: 'Resumo sobre figuras de linguagem', prioridade: 'media', prazo: formatarDataParaString(new Date(Date.now() + 172800000)), disciplina: 'portugues', subtasks: [], favorita: false, concluida: false, dataCriacao: new Date().toISOString(), dataConclusao: null },
            { id: gerarId(), nome: 'Estudar para prova de Física', descricao: 'Revisar cinemática e dinâmica', prioridade: 'alta', prazo: formatarDataParaString(new Date(Date.now() + 259200000)), disciplina: 'fisica', subtasks: [], favorita: false, concluida: false, dataCriacao: new Date().toISOString(), dataConclusao: null }
        ];
        salvarTarefas();
    }
}

function salvarTarefas() {
    if (!usuarioAtual) return;
    const storageKey = `tarefas_${usuarioAtual.email}`;
    localStorage.setItem(storageKey, JSON.stringify(tarefas));
    if (window.CacheManager) window.CacheManager.set('tasks', tarefas, true);
}

function renderizarTarefas(termoBusca = '') {
    const taskList = document.querySelector('.task-list');
    if (!taskList) return;
    
    let tarefasFiltradas = filtrarTarefas(termoBusca);
    tarefasFiltradas = ordenarTarefas(tarefasFiltradas);
    
    if (tarefasFiltradas.length === 0) {
        taskList.innerHTML = `<div class="empty-state"><i class="fas fa-tasks"></i><h3>Nenhuma tarefa encontrada</h3><p>Clique em "Nova Tarefa" para começar</p></div>`;
        return;
    }
    
    taskList.innerHTML = tarefasFiltradas.map(tarefa => criarHTMLTarefa(tarefa)).join('');
    
    tarefasFiltradas.forEach(tarefa => {
        const taskItem = document.querySelector(`.task-item[data-id="${tarefa.id}"]`);
        if (taskItem && tarefa.concluida) {
            const checkbox = taskItem.querySelector('.task-checkbox');
            const h4 = taskItem.querySelector('h4');
            if (checkbox) checkbox.checked = true;
            if (h4) h4.style.textDecoration = 'line-through';
        }
    });
    
    atualizarContadores();
}

function filtrarTarefas(termoBusca = '') {
    let filtradas = [...tarefas];
    if (disciplinaAtual) filtradas = filtradas.filter(t => getTextoDisciplina(t.disciplina).toLowerCase() === disciplinaAtual);
    
    switch(filtroAtual) {
        case 'hoje': filtradas = filtradas.filter(t => !t.concluida && t.prazo === new Date().toLocaleDateString('pt-BR')); break;
        case 'proximos': filtradas = filtradas.filter(t => !t.concluida && t.prazo); break;
        case 'favoritas': filtradas = filtradas.filter(t => t.favorita); break;
        case 'concluidas': filtradas = filtradas.filter(t => t.concluida); break;
        default: filtradas = filtradas.filter(t => !t.concluida);
    }
    
    if (termoBusca) filtradas = filtradas.filter(t => t.nome.toLowerCase().includes(termoBusca) || t.descricao.toLowerCase().includes(termoBusca));
    return filtradas;
}

function ordenarTarefas(tarefasParaOrdenar) {
    const filterSelect = document.querySelector('.filter-select');
    if (!filterSelect) return tarefasParaOrdenar;
    
    switch(filterSelect.value) {
        case 'Por prazo': return tarefasParaOrdenar.sort((a, b) => { if (!a.prazo) return 1; if (!b.prazo) return -1; const [aDia, aMes, aAno] = a.prazo.split('/'); const [bDia, bMes, bAno] = b.prazo.split('/'); return new Date(aAno, aMes-1, aDia) - new Date(bAno, bMes-1, bDia); });
        case 'Por disciplina': return tarefasParaOrdenar.sort((a, b) => getTextoDisciplina(a.disciplina).localeCompare(getTextoDisciplina(b.disciplina)));
        case 'Por prioridade': const prioridadeOrder = { 'alta': 1, 'media': 2, 'baixa': 3, 'nenhuma': 4 }; return tarefasParaOrdenar.sort((a, b) => (prioridadeOrder[a.prioridade] || 4) - (prioridadeOrder[b.prioridade] || 4));
        default: return tarefasParaOrdenar;
    }
}

function criarHTMLTarefa(tarefa) {
    const corDisciplina = getCorDisciplina(tarefa.disciplina);
    const textoDisciplina = getTextoDisciplina(tarefa.disciplina);
    const classePrioridade = getClassePrioridade(tarefa.prioridade);
    const textoPrioridade = getTextoPrioridade(tarefa.prioridade);
    const favoritaClass = tarefa.favorita ? 'active' : '';
    const favoritaColor = tarefa.favorita ? '#fdcb6e' : '';
    
    let subtasksHTML = '';
    if (tarefa.subtasks && tarefa.subtasks.length > 0) {
        subtasksHTML = `<div class="task-subtasks" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);"><strong style="font-size: 12px; color: var(--text-secondary);">Subtarefas:</strong><ul style="margin-top: 6px; padding-left: 20px;">${tarefa.subtasks.map(st => `<li style="font-size: 13px; color: var(--text-secondary); margin: 4px 0;">${escapeHtml(st.texto)}</li>`).join('')}</ul></div>`;
    }
    
    return `<div class="task-item" data-id="${tarefa.id}"><input type="checkbox" class="task-checkbox" ${tarefa.concluida ? 'checked' : ''}><div class="task-content"><h4 style="${tarefa.concluida ? 'text-decoration: line-through;' : ''}">${escapeHtml(tarefa.nome)}</h4><p>${escapeHtml(tarefa.descricao || 'Sem descrição')}</p><div class="task-meta"><span class="task-subject" style="color: ${corDisciplina}"><i class="fas fa-circle"></i> ${textoDisciplina}</span>${tarefa.prazo ? `<span class="task-date"><i class="fas fa-calendar"></i> ${tarefa.prazo}</span>` : ''}<span class="task-priority ${classePrioridade}"><i class="fas fa-flag"></i> ${textoPrioridade}</span></div>${subtasksHTML}</div><div class="task-actions"><button class="task-btn favorite ${favoritaClass}" style="color: ${favoritaColor}"><i class="fas fa-star"></i></button><button class="task-btn edit"><i class="fas fa-ellipsis-v"></i></button></div></div>`;
}

function alternarConclusaoTarefa(id, concluida) {
    const tarefa = tarefas.find(t => t.id == id);
    if (tarefa) {
        tarefa.concluida = concluida;
        tarefa.dataConclusao = concluida ? new Date().toISOString() : null;
        salvarTarefas();
        const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskItem) {
            const h4 = taskItem.querySelector('h4');
            if (h4) h4.style.textDecoration = concluida ? 'line-through' : 'none';
        }
        atualizarEstatisticas();
        atualizarContadores();
    }
}

function alternarFavoritoTarefa(id) {
    const tarefa = tarefas.find(t => t.id == id);
    if (tarefa) {
        tarefa.favorita = !tarefa.favorita;
        salvarTarefas();
        const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskItem) {
            const favBtn = taskItem.querySelector('.task-btn.favorite');
            const icon = favBtn.querySelector('i');
            if (tarefa.favorita) { favBtn.classList.add('active'); icon.style.color = '#fdcb6e'; }
            else { favBtn.classList.remove('active'); icon.style.color = ''; }
        }
        atualizarContadores();
    }
}

function atualizarEstatisticas() {
    const pendentes = tarefas.filter(t => !t.concluida).length;
    const concluidasHoje = tarefas.filter(t => t.dataConclusao && new Date(t.dataConclusao).toDateString() === new Date().toDateString()).length;
    const atrasadas = tarefas.filter(t => !t.concluida && t.prazo && new Date(t.prazo.split('/').reverse().join('-')) < new Date()).length;
    
    const pendingNumber = document.querySelector('.stat-card.pending .stat-number');
    const completedNumber = document.querySelector('.stat-card.completed .stat-number');
    const overdueNumber = document.querySelector('.stat-card.overdue .stat-number');
    if (pendingNumber) pendingNumber.textContent = pendentes;
    if (completedNumber) completedNumber.textContent = concluidasHoje;
    if (overdueNumber) overdueNumber.textContent = atrasadas;
}

function atualizarContadores() {
    const favoritasCount = tarefas.filter(t => t.favorita).length;
    const favBadge = document.querySelector('.filter-item:nth-child(3) .badge');
    if (favBadge) favBadge.textContent = favoritasCount;
    
    const totalAtivas = tarefas.filter(t => !t.concluida).length;
    const totalBadge = document.querySelector('.filter-item.active-filter .badge');
    if (totalBadge) totalBadge.textContent = totalAtivas;
    
    const concluidasCount = tarefas.filter(t => t.concluida).length;
    const concluidasBadge = document.querySelector('.filter-item:last-child .badge');
    if (concluidasBadge) concluidasBadge.textContent = concluidasCount;
    
    const subjects = document.querySelectorAll('.subject-item');
    subjects.forEach(subject => {
        const subjectName = subject.querySelector('span')?.textContent.trim().toLowerCase();
        if (subjectName) {
            const count = tarefas.filter(t => getTextoDisciplina(t.disciplina).toLowerCase() === subjectName && !t.concluida).length;
            const countSpan = subject.querySelector('.subject-count');
            if (countSpan) countSpan.textContent = count;
        }
    });
}

let prioridadeSelecionada = 'media';
let subtasks = [];
let tarefaEditando = null;

function abrirModal() { abrirModalEdicao(null); }

function abrirModalEdicao(id) {
    const tarefa = id ? tarefas.find(t => t.id == id) : null;
    tarefaEditando = tarefa;
    prioridadeSelecionada = tarefa ? tarefa.prioridade : 'media';
    
    document.getElementById('nomeTarefa').value = tarefa?.nome || '';
    document.getElementById('descricaoTarefa').value = tarefa?.descricao || '';
    document.getElementById('prazoTarefa').value = tarefa?.prazo || '';
    document.getElementById('disciplinaTarefa').value = tarefa?.disciplina || 'matematica';
    selecionarPrioridade(tarefa?.prioridade || 'media');
    
    const container = document.getElementById('subtasksContainer');
    container.innerHTML = '';
    subtasks = tarefa?.subtasks || [];
    subtasks.forEach(st => adicionarSubtarefa(st.texto));
    
    const modal = document.getElementById('modalNovaTarefa');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    const modal = document.getElementById('modalNovaTarefa');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    limparFormulario();
    tarefaEditando = null;
}

document.getElementById('modalNovaTarefa')?.addEventListener('click', function(e) { if (e.target === this) fecharModal(); });
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { const modal = document.getElementById('modalNovaTarefa'); if (modal && modal.classList.contains('active')) fecharModal(); } });

function selecionarPrioridade(prioridade) {
    prioridadeSelecionada = prioridade;
    document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.priority-btn[data-priority="${prioridade}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');
}

function formatarData(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length <= 2) input.value = valor;
    else if (valor.length <= 4) input.value = `${valor.slice(0, 2)}/${valor.slice(2)}`;
    else input.value = `${valor.slice(0, 2)}/${valor.slice(2, 4)}/${valor.slice(4, 8)}`;
}

function adicionarSubtarefa(texto = '') {
    const container = document.getElementById('subtasksContainer');
    const subtaskDiv = document.createElement('div');
    subtaskDiv.className = 'subtask-item';
    subtaskDiv.innerHTML = `<input type="text" placeholder="Nome da subtarefa..." value="${texto.replace(/"/g, '&quot;')}"><button type="button" class="remove-subtask"><i class="fas fa-times"></i></button>`;
    subtaskDiv.querySelector('.remove-subtask').addEventListener('click', function() { this.closest('.subtask-item').remove(); });
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
    if (!nome) { alert('Por favor, preencha o nome da tarefa.'); return; }
    
    const descricao = document.getElementById('descricaoTarefa')?.value.trim();
    const prazo = document.getElementById('prazoTarefa')?.value.trim();
    const disciplina = document.getElementById('disciplinaTarefa')?.value;
    const subtasksElements = document.querySelectorAll('.subtask-item input');
    const subtasksList = Array.from(subtasksElements).map(input => ({ texto: input.value.trim(), concluida: false })).filter(st => st.texto);
    
    if (tarefaEditando) {
        const index = tarefas.findIndex(t => t.id === tarefaEditando.id);
        if (index !== -1) tarefas[index] = { ...tarefas[index], nome, descricao: descricao || '', prioridade: prioridadeSelecionada, prazo: prazo || '', disciplina: disciplina || 'outros', subtasks: subtasksList };
    } else {
        tarefas.push({ id: gerarId(), nome, descricao: descricao || '', prioridade: prioridadeSelecionada, prazo: prazo || '', disciplina: disciplina || 'outros', subtasks: subtasksList, favorita: false, concluida: false, dataCriacao: new Date().toISOString(), dataConclusao: null });
    }
    
    salvarTarefas();
    fecharModal();
    renderizarTarefas();
    atualizarEstatisticas();
    mostrarNotificacao(tarefaEditando ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!', 'success');
});

function gerarId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 9); }
function getCorDisciplina(disciplina) { const cores = { matematica: '#9b59b6', portugues: '#3498db', historia: '#e74c3c', fisica: '#e67e22', quimica: '#2ecc71', biologia: '#f1c40f', geografia: '#1abc9c', ingles: '#34495e', outros: '#95a5a6' }; return cores[disciplina] || '#95a5a6'; }
function getTextoDisciplina(disciplina) { const textos = { matematica: 'Matemática', portugues: 'Português', historia: 'História', fisica: 'Física', quimica: 'Química', biologia: 'Biologia', geografia: 'Geografia', ingles: 'Inglês', outros: 'Outros' }; return textos[disciplina] || disciplina; }
function getClassePrioridade(prioridade) { const classes = { alta: 'urgent', media: 'high', baixa: 'medium', nenhuma: 'normal' }; return classes[prioridade] || 'normal'; }
function getTextoPrioridade(prioridade) { const textos = { alta: 'Urgente', media: 'Alta', baixa: 'Média', nenhuma: 'Normal' }; return textos[prioridade] || 'Normal'; }
function formatarDataParaString(data) { return `${data.getDate().toString().padStart(2,'0')}/${(data.getMonth()+1).toString().padStart(2,'0')}/${data.getFullYear()}`; }
function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; background-color: ${tipo === 'success' ? '#00b894' : '#d63031'}; color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 2000; animation: slideInRight 0.3s ease-out;`;
    document.body.appendChild(notificacao);
    setTimeout(() => { notificacao.style.animation = 'slideInRight 0.3s ease-out reverse'; setTimeout(() => notificacao.remove(), 300); }, 3000);
}

function logout() {
    if (confirm('Deseja sair?')) {
        salvarTarefas();
        localStorage.removeItem('usuarioLogado');
        if (window.firebase && firebase.auth) firebase.auth().signOut().catch(console.error);
        window.location.href = '../login/index.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPage.includes(href.replace('../', '').replace('./', ''))) item.classList.add('active');
        item.addEventListener('click', function() { menuItems.forEach(i => i.classList.remove('active')); this.classList.add('active'); });
    });
});

console.log('%c📚 Painel de Tarefas', 'color: #6c5ce7; font-size: 20px; font-weight: bold;');