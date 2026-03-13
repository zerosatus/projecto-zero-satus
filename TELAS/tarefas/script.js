// ===== VERIFICAÇÃO DE LOGIN E CARREGAMENTO DO NOME =====
let tarefas = [];
let filtroAtual = 'todas';
let disciplinaAtual = null;
let usuarioAtual = null;

window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        // Verificar se os dados do usuário existem
        if (usuarioAtual && usuarioAtual.nome) {
            // Atualizar título principal
            const tituloElement = document.getElementById('userNameDisplay');
            if (tituloElement) {
                tituloElement.textContent = usuarioAtual.nome;
            }
            
            // Atualizar nome no perfil
            const nomeProfile = document.getElementById('userNameProfile');
            if (nomeProfile) {
                nomeProfile.textContent = usuarioAtual.nome;
            }
            
            // Atualizar avatar com as iniciais
            const avatarElement = document.getElementById('userAvatar');
            if (avatarElement) {
                // Pegar iniciais (primeira letra do nome)
                const iniciais = usuarioAtual.nome
                    .split(' ')
                    .map(palavra => palavra.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                
                avatarElement.textContent = iniciais || usuarioAtual.nome.charAt(0).toUpperCase();
            }
            
            console.log('Usuário carregado:', usuarioAtual.nome);
        }
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
    
    // Inicializar sistema de tarefas
    inicializarTarefas();
});

// ===== SISTEMA DE TAREFAS =====
function inicializarTarefas() {
    carregarTarefas();
    configurarEventos();
    renderizarTarefas();
    atualizarEstatisticas();
}

function configurarEventos() {
    // Filtros principais
    const filterItems = document.querySelectorAll('.filter-item');
    filterItems.forEach(item => {
        item.addEventListener('click', function() {
            const filtro = this.querySelector('span')?.textContent.trim().toLowerCase() || '';
            
            filterItems.forEach(filter => {
                filter.classList.remove('active', 'active-filter');
            });
            this.classList.add('active-filter');
            
            if (filtro.includes('hoje')) {
                filtroAtual = 'hoje';
            } else if (filtro.includes('próximos')) {
                filtroAtual = 'proximos';
            } else if (filtro.includes('favoritas')) {
                filtroAtual = 'favoritas';
            } else if (filtro.includes('concluídas')) {
                filtroAtual = 'concluidas';
            } else {
                filtroAtual = 'todas';
            }
            
            disciplinaAtual = null;
            renderizarTarefas();
        });
    });
    
    // Filtros por disciplina
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
    
    // Checkboxes de tarefas (delegação de eventos)
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('task-checkbox')) {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.id;
                alternarConclusaoTarefa(taskId, e.target.checked);
            }
        }
    });
    
    // Botões de favorito (delegação de eventos)
    document.addEventListener('click', function(e) {
        const favoriteBtn = e.target.closest('.task-btn.favorite');
        if (favoriteBtn) {
            e.preventDefault();
            const taskItem = favoriteBtn.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.id;
                alternarFavoritoTarefa(taskId);
            }
        }
        
        // Botão de editar
        const editBtn = e.target.closest('.task-btn.edit');
        if (editBtn) {
            e.preventDefault();
            const taskItem = editBtn.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.id;
                abrirModalEdicao(taskId);
            }
        }
    });
    
    // Busca de tarefas
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderizarTarefas(e.target.value.toLowerCase());
        });
    }
    
    // Ordenação
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            renderizarTarefas();
        });
    }
}

// ===== CARREGAR TAREFAS DO LOCALSTORAGE =====
function carregarTarefas() {
    if (!usuarioAtual) return;
    
    const storageKey = `tarefas_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(storageKey);
    
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
    } else {
        // Tarefas padrão para primeiro acesso
        tarefas = [
            {
                id: gerarId(),
                nome: 'Resolver exercícios de Matemática',
                descricao: 'Capítulo 3: Equações do segundo grau - exercícios 1 a 20.',
                prioridade: 'alta',
                prazo: '25/07/2024',
                disciplina: 'matematica',
                subtasks: [],
                favorita: false,
                concluida: false,
                dataCriacao: new Date().toISOString(),
                dataConclusao: null
            },
            {
                id: gerarId(),
                nome: 'Fazer resumo de Português',
                descricao: 'Resumo sobre figuras de linguagem e suas aplicações.',
                prioridade: 'media',
                prazo: '26/07/2024',
                disciplina: 'portugues',
                subtasks: [],
                favorita: false,
                concluida: false,
                dataCriacao: new Date().toISOString(),
                dataConclusao: null
            },
            {
                id: gerarId(),
                nome: 'Praticar verbos irregulares em Inglês',
                descricao: 'Lista de 50 verbos irregulares mais comuns.',
                prioridade: 'baixa',
                prazo: '27/07/2024',
                disciplina: 'ingles',
                subtasks: [],
                favorita: false,
                concluida: false,
                dataCriacao: new Date().toISOString(),
                dataConclusao: null
            },
            {
                id: gerarId(),
                nome: 'Estudar para prova de Física',
                descricao: 'Revisar cinemática, dinâmica e leis de Newton.',
                prioridade: 'alta',
                prazo: '28/07/2024',
                disciplina: 'fisica',
                subtasks: [],
                favorita: true,
                concluida: false,
                dataCriacao: new Date().toISOString(),
                dataConclusao: null
            }
        ];
        salvarTarefas();
    }
}

// ===== SALVAR TAREFAS NO LOCALSTORAGE =====
function salvarTarefas() {
    if (!usuarioAtual) return;
    
    const storageKey = `tarefas_${usuarioAtual.email}`;
    localStorage.setItem(storageKey, JSON.stringify(tarefas));
}

// ===== RENDERIZAR TAREFAS =====
function renderizarTarefas(termoBusca = '') {
    const taskList = document.querySelector('.task-list');
    if (!taskList) return;
    
    let tarefasFiltradas = filtrarTarefas(termoBusca);
    tarefasFiltradas = ordenarTarefas(tarefasFiltradas);
    
    if (tarefasFiltradas.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>Nenhuma tarefa encontrada</h3>
                <p>Clique em "Nova Tarefa" para começar</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = tarefasFiltradas.map(tarefa => criarHTMLTarefa(tarefa)).join('');
    
    // Atualizar checkboxes conforme estado
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

// ===== FILTRAR TAREFAS =====
function filtrarTarefas(termoBusca = '') {
    let filtradas = [...tarefas];
    
    // Filtrar por disciplina
    if (disciplinaAtual) {
        filtradas = filtradas.filter(t => 
            getTextoDisciplina(t.disciplina).toLowerCase() === disciplinaAtual
        );
    }
    
    // Filtrar por categoria
    switch(filtroAtual) {
        case 'hoje':
            const hoje = new Date().toLocaleDateString('pt-BR');
            filtradas = filtradas.filter(t => !t.concluida && t.prazo === hoje);
            break;
        case 'proximos':
            filtradas = filtradas.filter(t => !t.concluida && t.prazo);
            break;
        case 'favoritas':
            filtradas = filtradas.filter(t => t.favorita);
            break;
        case 'concluidas':
            filtradas = filtradas.filter(t => t.concluida);
            break;
        default:
            filtradas = filtradas.filter(t => !t.concluida);
    }
    
    // Filtrar por busca
    if (termoBusca) {
        filtradas = filtradas.filter(t => 
            t.nome.toLowerCase().includes(termoBusca) ||
            t.descricao.toLowerCase().includes(termoBusca)
        );
    }
    
    return filtradas;
}

// ===== ORDENAR TAREFAS =====
function ordenarTarefas(tarefasParaOrdenar) {
    const filterSelect = document.querySelector('.filter-select');
    if (!filterSelect) return tarefasParaOrdenar;
    
    const ordenacao = filterSelect.value;
    
    switch(ordenacao) {
        case 'Por prazo':
            return tarefasParaOrdenar.sort((a, b) => {
                if (!a.prazo) return 1;
                if (!b.prazo) return -1;
                const [aDia, aMes, aAno] = a.prazo.split('/');
                const [bDia, bMes, bAno] = b.prazo.split('/');
                const dataA = new Date(aAno, aMes-1, aDia);
                const dataB = new Date(bAno, bMes-1, bDia);
                return dataA - dataB;
            });
        case 'Por disciplina':
            return tarefasParaOrdenar.sort((a, b) => 
                getTextoDisciplina(a.disciplina).localeCompare(getTextoDisciplina(b.disciplina))
            );
        case 'Por prioridade':
            const prioridadeOrder = { 'alta': 1, 'media': 2, 'baixa': 3, 'nenhuma': 4 };
            return tarefasParaOrdenar.sort((a, b) => 
                (prioridadeOrder[a.prioridade] || 4) - (prioridadeOrder[b.prioridade] || 4)
            );
        default:
            return tarefasParaOrdenar;
    }
}

// ===== CRIAR HTML DA TAREFA =====
function criarHTMLTarefa(tarefa) {
    const corDisciplina = getCorDisciplina(tarefa.disciplina);
    const textoDisciplina = getTextoDisciplina(tarefa.disciplina);
    const classePrioridade = getClassePrioridade(tarefa.prioridade);
    const textoPrioridade = getTextoPrioridade(tarefa.prioridade);
    const favoritaClass = tarefa.favorita ? 'active' : '';
    const favoritaColor = tarefa.favorita ? '#fdcb6e' : '';
    
    let subtasksHTML = '';
    if (tarefa.subtasks && tarefa.subtasks.length > 0) {
        subtasksHTML = `<div class="task-subtasks" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">
            <strong style="font-size: 12px; color: var(--text-secondary);">Subtarefas:</strong>
            <ul style="margin-top: 6px; padding-left: 20px;">
                ${tarefa.subtasks.map(st => `<li style="font-size: 13px; color: var(--text-secondary); margin: 4px 0;">${st.texto}</li>`).join('')}
            </ul>
        </div>`;
    }
    
    return `
        <div class="task-item" data-id="${tarefa.id}">
            <input type="checkbox" class="task-checkbox" ${tarefa.concluida ? 'checked' : ''}>
            <div class="task-content">
                <h4 style="${tarefa.concluida ? 'text-decoration: line-through;' : ''}">${tarefa.nome}</h4>
                <p>${tarefa.descricao || 'Sem descrição'}</p>
                <div class="task-meta">
                    <span class="task-subject" style="color: ${corDisciplina}">
                        <i class="fas fa-circle"></i> ${textoDisciplina}
                    </span>
                    ${tarefa.prazo ? `<span class="task-date"><i class="fas fa-calendar"></i> ${tarefa.prazo}</span>` : ''}
                    <span class="task-priority ${classePrioridade}">
                        <i class="fas fa-flag"></i> ${textoPrioridade}
                    </span>
                </div>
                ${subtasksHTML}
            </div>
            <div class="task-actions">
                <button class="task-btn favorite ${favoritaClass}" style="color: ${favoritaColor}">
                    <i class="fas fa-star"></i>
                </button>
                <button class="task-btn edit">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>
    `;
}

// ===== ALTERNAR CONCLUSÃO DA TAREFA =====
function alternarConclusaoTarefa(id, concluida) {
    const tarefa = tarefas.find(t => t.id == id);
    if (tarefa) {
        tarefa.concluida = concluida;
        tarefa.dataConclusao = concluida ? new Date().toISOString() : null;
        salvarTarefas();
        
        // Atualizar UI
        const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskItem) {
            const h4 = taskItem.querySelector('h4');
            if (h4) h4.style.textDecoration = concluida ? 'line-through' : 'none';
        }
        
        atualizarEstatisticas();
        atualizarContadores();
    }
}

// ===== ALTERNAR FAVORITO DA TAREFA =====
function alternarFavoritoTarefa(id) {
    const tarefa = tarefas.find(t => t.id == id);
    if (tarefa) {
        tarefa.favorita = !tarefa.favorita;
        salvarTarefas();
        
        // Atualizar UI
        const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskItem) {
            const favBtn = taskItem.querySelector('.task-btn.favorite');
            const icon = favBtn.querySelector('i');
            if (tarefa.favorita) {
                favBtn.classList.add('active');
                icon.style.color = '#fdcb6e';
            } else {
                favBtn.classList.remove('active');
                icon.style.color = '';
            }
        }
        
        atualizarContadores();
    }
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas() {
    const pendentes = tarefas.filter(t => !t.concluida).length;
    const concluidasHoje = tarefas.filter(t => {
        if (!t.dataConclusao) return false;
        const hoje = new Date().toDateString();
        const dataConclusao = new Date(t.dataConclusao).toDateString();
        return dataConclusao === hoje;
    }).length;
    
    const atrasadas = tarefas.filter(t => {
        if (t.concluida || !t.prazo) return false;
        const [dia, mes, ano] = t.prazo.split('/');
        const dataPrazo = new Date(ano, mes-1, dia);
        const hoje = new Date();
        return dataPrazo < hoje;
    }).length;
    
    // Atualizar números nos cards
    const pendingNumber = document.querySelector('.stat-card.pending .stat-number');
    const completedNumber = document.querySelector('.stat-card.completed .stat-number');
    const overdueNumber = document.querySelector('.stat-card.overdue .stat-number');
    
    if (pendingNumber) pendingNumber.textContent = pendentes;
    if (completedNumber) completedNumber.textContent = concluidasHoje;
    if (overdueNumber) overdueNumber.textContent = atrasadas;
}

// ===== ATUALIZAR CONTADORES =====
function atualizarContadores() {
    // Contador de favoritas
    const favoritasCount = tarefas.filter(t => t.favorita).length;
    const favBadge = document.querySelector('.filter-item:nth-child(3) .badge');
    if (favBadge) favBadge.textContent = favoritasCount;
    
    // Contador total de tarefas não concluídas
    const totalAtivas = tarefas.filter(t => !t.concluida).length;
    const totalBadge = document.querySelector('.filter-item.active-filter .badge');
    if (totalBadge) totalBadge.textContent = totalAtivas;
    
    // Contador de concluídas
    const concluidasCount = tarefas.filter(t => t.concluida).length;
    const concluidasBadge = document.querySelector('.filter-item:last-child .badge');
    if (concluidasBadge) concluidasBadge.textContent = concluidasCount;
    
    // Contadores por disciplina
    const subjects = document.querySelectorAll('.subject-item');
    subjects.forEach(subject => {
        const subjectName = subject.querySelector('span')?.textContent.trim().toLowerCase();
        if (subjectName) {
            const count = tarefas.filter(t => 
                getTextoDisciplina(t.disciplina).toLowerCase() === subjectName && !t.concluida
            ).length;
            const countSpan = subject.querySelector('.subject-count');
            if (countSpan) countSpan.textContent = count;
        }
    });
}

// ===== FUNÇÕES DO MODAL =====
let prioridadeSelecionada = 'media';
let subtasks = [];
let tarefaEditando = null;

function abrirModal() {
    const modal = document.getElementById('modalNovaTarefa');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('nomeTarefa')?.focus();
}

function abrirModalEdicao(id) {
    const tarefa = tarefas.find(t => t.id == id);
    if (!tarefa) return;
    
    tarefaEditando = tarefa;
    prioridadeSelecionada = tarefa.prioridade;
    
    // Preencher formulário
    document.getElementById('nomeTarefa').value = tarefa.nome;
    document.getElementById('descricaoTarefa').value = tarefa.descricao || '';
    document.getElementById('prazoTarefa').value = tarefa.prazo || '';
    document.getElementById('disciplinaTarefa').value = tarefa.disciplina;
    
    // Selecionar prioridade
    selecionarPrioridade(tarefa.prioridade);
    
    // Carregar subtarefas
    const container = document.getElementById('subtasksContainer');
    container.innerHTML = '';
    subtasks = tarefa.subtasks || [];
    subtasks.forEach(st => {
        adicionarSubtarefa(st.texto);
    });
    
    // Abrir modal
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

// Fechar modal clicando fora
document.getElementById('modalNovaTarefa')?.addEventListener('click', function(e) {
    if (e.target === this) {
        fecharModal();
    }
});

// Tecla ESC para fechar modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modalNovaTarefa');
        if (modal && modal.classList.contains('active')) {
            fecharModal();
        }
    }
});

function selecionarPrioridade(prioridade) {
    prioridadeSelecionada = prioridade;
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const selectedBtn = document.querySelector(`.priority-btn[data-priority="${prioridade}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

function formatarData(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length <= 2) {
        input.value = valor;
    } else if (valor.length <= 4) {
        input.value = `${valor.slice(0, 2)}/${valor.slice(2)}`;
    } else {
        input.value = `${valor.slice(0, 2)}/${valor.slice(2, 4)}/${valor.slice(4, 8)}`;
    }
}

function adicionarSubtarefa(texto = '') {
    const container = document.getElementById('subtasksContainer');
    const subtaskId = Date.now() + Math.random();
    const subtaskDiv = document.createElement('div');
    subtaskDiv.className = 'subtask-item';
    subtaskDiv.dataset.id = subtaskId;
    subtaskDiv.innerHTML = `
        <input type="text" placeholder="Nome da subtarefa..." value="${texto.replace(/"/g, '&quot;')}">
        <button type="button" class="remove-subtask">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Adicionar evento para remover
    subtaskDiv.querySelector('.remove-subtask').addEventListener('click', function() {
        removerSubtarefa(subtaskDiv);
    });
    
    container.appendChild(subtaskDiv);
}

function removerSubtarefa(element) {
    element.style.animation = 'subtaskSlideIn 0.3s ease-out reverse';
    setTimeout(() => {
        element.remove();
    }, 300);
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

// Submit do formulário
document.getElementById('formNovaTarefa')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeTarefa')?.value.trim();
    const descricao = document.getElementById('descricaoTarefa')?.value.trim();
    const prazo = document.getElementById('prazoTarefa')?.value.trim();
    const disciplina = document.getElementById('disciplinaTarefa')?.value;
    
    if (!nome) {
        alert('Por favor, preencha o nome da tarefa.');
        return;
    }
    
    // Coletar subtarefas
    const subtasksElements = document.querySelectorAll('.subtask-item input');
    const subtasksList = Array.from(subtasksElements)
        .map(input => ({ texto: input.value.trim(), concluida: false }))
        .filter(st => st.texto);
    
    if (tarefaEditando) {
        // Editar tarefa existente
        const index = tarefas.findIndex(t => t.id === tarefaEditando.id);
        if (index !== -1) {
            tarefas[index] = {
                ...tarefas[index],
                nome: nome,
                descricao: descricao || '',
                prioridade: prioridadeSelecionada,
                prazo: prazo || '',
                disciplina: disciplina || 'outros',
                subtasks: subtasksList
            };
        }
    } else {
        // Criar nova tarefa
        const novaTarefa = {
            id: gerarId(),
            nome: nome,
            descricao: descricao || '',
            prioridade: prioridadeSelecionada,
            prazo: prazo || '',
            disciplina: disciplina || 'outros',
            subtasks: subtasksList,
            favorita: false,
            concluida: false,
            dataCriacao: new Date().toISOString(),
            dataConclusao: null
        };
        
        tarefas.push(novaTarefa);
    }
    
    salvarTarefas();
    fecharModal();
    renderizarTarefas();
    atualizarEstatisticas();
    mostrarNotificacao(tarefaEditando ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!', 'success');
});

// ===== FUNÇÕES AUXILIARES =====
function gerarId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getCorDisciplina(disciplina) {
    const cores = {
        matematica: '#9b59b6', portugues: '#3498db', historia: '#e74c3c',
        fisica: '#e67e22', quimica: '#2ecc71', biologia: '#f1c40f',
        geografia: '#1abc9c', ingles: '#34495e', outros: '#95a5a6'
    };
    return cores[disciplina] || '#95a5a6';
}

function getTextoDisciplina(disciplina) {
    const textos = {
        matematica: 'Matemática', portugues: 'Português', historia: 'História',
        fisica: 'Física', quimica: 'Química', biologia: 'Biologia',
        geografia: 'Geografia', ingles: 'Inglês', outros: 'Outros'
    };
    return textos[disciplina] || disciplina;
}

function getClassePrioridade(prioridade) {
    const classes = { alta: 'urgent', media: 'high', baixa: 'medium', nenhuma: 'normal' };
    return classes[prioridade] || 'normal';
}

function getTextoPrioridade(prioridade) {
    const textos = { alta: 'Urgente', media: 'Alta', baixa: 'Média', nenhuma: 'Normal' };
    return textos[prioridade] || 'Normal';
}

// ===== NOTIFICAÇÕES =====
function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 16px 24px; background-color: ${tipo === 'success' ? '#00b894' : '#d63031'};
        color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 2000; animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(notificacao);
    setTimeout(() => {
        notificacao.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Deseja sair?')) {
        // Salvar antes de sair
        salvarTarefas();
        localStorage.removeItem('usuarioLogado');
        
        if (window.firebase && firebase.auth) {
            firebase.auth().signOut().catch(console.error);
        }
        
        window.location.href = '../login/index.html';
    }
}

// ===== MENU ATIVO =====
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPage.includes(href.replace('../', '').replace('./', ''))) {
            item.classList.add('active');
        }
        
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// Adicionar estilo para empty state
if (!document.querySelector('#task-styles')) {
    const style = document.createElement('style');
    style.id = 'task-styles';
    style.textContent = `
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-secondary);
        }
        .empty-state i {
            font-size: 48px;
            margin-bottom: 16px;
            color: var(--border-color);
        }
        .empty-state h3 {
            font-size: 18px;
            margin-bottom: 8px;
            color: var(--text-primary);
        }
        .empty-state p {
            font-size: 14px;
        }
        .subject-item.active {
            background-color: rgba(108, 92, 231, 0.1);
            border-radius: 8px;
            padding: 8px;
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

console.log('%c📚 Painel de Tarefas', 'color: #6c5ce7; font-size: 20px; font-weight: bold;');
console.log('%cSistema carregado com sucesso!', 'color: #00b894; font-size: 14px;');

// ===== NOTIFICAR OUTRAS ABAS SOBRE MUDANÇAS =====
function notificarSincronizacao() {
    localStorage.setItem('sync_notification', Date.now().toString());
}

// Modificar a função salvarTarefas
function salvarTarefas() {
    if (!usuarioAtual) return;
    
    const storageKey = `tarefas_${usuarioAtual.email}`;
    localStorage.setItem(storageKey, JSON.stringify(tarefas));
    
    // NOTIFICAR OUTRAS ABAS
    notificarSincronizacao();
}
