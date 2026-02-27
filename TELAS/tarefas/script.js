// ===== VERIFICAÇÃO DE LOGIN E CARREGAMENTO DO NOME =====
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        const userData = JSON.parse(usuario);
        
        // Verificar se os dados do usuário existem
        if (userData && userData.nome) {
            // Atualizar título principal
            const tituloElement = document.getElementById('userNameDisplay');
            if (tituloElement) {
                tituloElement.textContent = userData.nome;
            }
            
            // Atualizar nome no perfil
            const nomeProfile = document.getElementById('userNameProfile');
            if (nomeProfile) {
                nomeProfile.textContent = userData.nome;
            }
            
            // Atualizar avatar com as iniciais
            const avatarElement = document.getElementById('userAvatar');
            if (avatarElement) {
                // Pegar iniciais (primeira letra do nome)
                const iniciais = userData.nome
                    .split(' ')
                    .map(palavra => palavra.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                
                avatarElement.textContent = iniciais || userData.nome.charAt(0).toUpperCase();
            }
            
            console.log('Usuário carregado:', userData.nome); // Para debug
        } else {
            console.warn('Dados do usuário incompletos:', userData);
        }
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ===== LOGOUT =====
function logout() {
    if (confirm('Deseja sair?')) {
        localStorage.removeItem('usuarioLogado');
        
        // Se estiver usando Firebase, fazer logout também
        if (window.firebase && firebase.auth) {
            firebase.auth().signOut().catch(console.error);
        }
        
        window.location.href = '../login/index.html';
    }
}

// ===== MENU ATIVO (destacar página atual) =====
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPage.includes(href.replace('../', '').replace('./', ''))) {
            item.classList.add('active');
        }
        
        // Evento de clique para navegação (sem bloquear)
        item.addEventListener('click', function() {
            // Remover active de todos
            menuItems.forEach(i => i.classList.remove('active'));
            // Adicionar active no clicado
            this.classList.add('active');
            // Não previne o comportamento padrão - o link funciona normalmente
        });
    });
});

// ===== FILTROS DE TAREFAS (SEU CÓDIGO ORIGINAL PRESERVADO) =====
const filterItems = document.querySelectorAll('.filter-item');
const taskCheckboxes = document.querySelectorAll('.task-checkbox');
const favoriteButtons = document.querySelectorAll('.task-btn.favorite');
const searchInput = document.querySelector('.search-box input');
const filterSelect = document.querySelector('.filter-select');

// Filtros
filterItems.forEach(item => {
    item.addEventListener('click', function() {
        filterItems.forEach(filter => {
            filter.classList.remove('active');
            filter.classList.remove('active-filter');
        });
        this.classList.add('active-filter');
    });
});

// Checkboxes de tarefas
taskCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const taskItem = this.closest('.task-item');
        if (this.checked) {
            taskItem.style.opacity = '0.6';
            taskItem.querySelector('h4').style.textDecoration = 'line-through';
            updateStats('completed');
        } else {
            taskItem.style.opacity = '1';
            taskItem.querySelector('h4').style.textDecoration = 'none';
            updateStats('pending');
        }
    });
});

// Botões de favorito
favoriteButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active');
        const icon = this.querySelector('i');
        if (this.classList.contains('active')) {
            icon.style.color = '#fdcb6e';
        } else {
            icon.style.color = '';
        }
    });
});

// Função para atualizar estatísticas
function updateStats(action) {
    const statNumber = document.querySelector('.stat-card.completed .stat-number');
    if (statNumber) {
        let currentCount = parseInt(statNumber.textContent);
        if (action === 'completed') {
            statNumber.textContent = currentCount + 1;
        } else {
            statNumber.textContent = Math.max(0, currentCount - 1);
        }
    }
}

// Busca de tarefas
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const tasks = document.querySelectorAll('.task-item');
        tasks.forEach(task => {
            const title = task.querySelector('h4').textContent.toLowerCase();
            const description = task.querySelector('p').textContent.toLowerCase();
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                task.style.display = 'flex';
            } else {
                task.style.display = 'none';
            }
        });
    });
}

// Ordenação de tarefas
if (filterSelect) {
    filterSelect.addEventListener('change', function() {
        const tasks = document.querySelectorAll('.task-item');
        const tasksArray = Array.from(tasks);
        
        switch(this.value) {
            case 'Por prazo':
                tasksArray.sort((a, b) => {
                    const dateA = new Date(a.querySelector('.task-date')?.textContent || '0');
                    const dateB = new Date(b.querySelector('.task-date')?.textContent || '0');
                    return dateA - dateB;
                });
                break;
            case 'Por disciplina':
                tasksArray.sort((a, b) => {
                    const subjectA = a.querySelector('.task-subject')?.textContent || '';
                    const subjectB = b.querySelector('.task-subject')?.textContent || '';
                    return subjectA.localeCompare(subjectB);
                });
                break;
            case 'Por prioridade':
                const priorityOrder = { 'Urgente': 1, 'Alta': 2, 'Média': 3, 'Normal': 4 };
                tasksArray.sort((a, b) => {
                    const priorityA = priorityOrder[a.querySelector('.task-priority')?.textContent.trim()] || 5;
                    const priorityB = priorityOrder[b.querySelector('.task-priority')?.textContent.trim()] || 5;
                    return priorityA - priorityB;
                });
                break;
        }
        
        const taskList = document.querySelector('.task-list');
        tasksArray.forEach(task => taskList.appendChild(task));
    });
}

// ===== ANIMAÇÕES =====
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Animação dos números das estatísticas
window.addEventListener('load', () => {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        if (!isNaN(finalValue)) {
            stat.textContent = '0';
            animateValue(stat, 0, finalValue, 1000);
        }
    });
});

// Hover effect nas tarefas
const taskItems = document.querySelectorAll('.task-item');
taskItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.borderColor = '#6c5ce7';
    });
    item.addEventListener('mouseleave', function() {
        this.style.borderColor = '#dfe6e9';
    });
});

// ===== MODAL NOVA TAREFA (SEU CÓDIGO ORIGINAL) =====
// Variáveis globais
let prioridadeSelecionada = 'media';
let subtasks = [];

function abrirModal() {
    const modal = document.getElementById('modalNovaTarefa');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('nomeTarefa')?.focus();
}

function fecharModal() {
    const modal = document.getElementById('modalNovaTarefa');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    limparFormulario();
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
    const subtaskId = Date.now();
    const subtaskDiv = document.createElement('div');
    subtaskDiv.className = 'subtask-item';
    subtaskDiv.dataset.id = subtaskId;
    subtaskDiv.innerHTML = `
        <input type="text" placeholder="Nome da subtarefa..." value="${texto}" onchange="atualizarSubtarefa(${subtaskId}, this.value)">
        <button type="button" class="remove-subtask" onclick="removerSubtarefa(${subtaskId})">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(subtaskDiv);
    subtasks.push({ id: subtaskId, texto: texto, concluida: false });
}

function atualizarSubtarefa(id, texto) {
    const subtask = subtasks.find(s => s.id === id);
    if (subtask) {
        subtask.texto = texto;
    }
}

function removerSubtarefa(id) {
    const element = document.querySelector(`.subtask-item[data-id="${id}"]`);
    if (element) {
        element.style.animation = 'subtaskSlideIn 0.3s ease-out reverse';
        setTimeout(() => {
            element.remove();
            subtasks = subtasks.filter(s => s.id !== id);
        }, 300);
    }
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

// Funções auxiliares para tarefas
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
    
    const novaTarefa = {
        id: Date.now(),
        nome: nome,
        descricao: descricao || '',
        prioridade: prioridadeSelecionada,
        prazo: prazo || '',
        disciplina: disciplina || 'outros',
        subtasks: [...subtasks],
        concluida: false,
        dataCriacao: new Date().toISOString()
    };
    
    adicionarTarefaNaLista(novaTarefa);
    fecharModal();
    mostrarNotificacao('Tarefa criada com sucesso!', 'success');
});

function adicionarTarefaNaLista(tarefa) {
    const taskList = document.querySelector('.task-list');
    if (!taskList) return;
    
    const corDisciplina = getCorDisciplina(tarefa.disciplina);
    const textoDisciplina = getTextoDisciplina(tarefa.disciplina);
    const classePrioridade = getClassePrioridade(tarefa.prioridade);
    const textoPrioridade = getTextoPrioridade(tarefa.prioridade);
    
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.id = tarefa.id;
    
    let subtasksHTML = '';
    if (tarefa.subtasks && tarefa.subtasks.length > 0) {
        subtasksHTML = `<div class="task-subtasks" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">
            <strong style="font-size: 12px; color: var(--text-secondary);">Subtarefas:</strong>
            <ul style="margin-top: 6px; padding-left: 20px;">
                ${tarefa.subtasks.map(st => `<li style="font-size: 13px; color: var(--text-secondary); margin: 4px 0;">${st.texto}</li>`).join('')}
            </ul>
        </div>`;
    }
    
    taskItem.innerHTML = `
        <input type="checkbox" class="task-checkbox" onchange="toggleTarefa(${tarefa.id})">
        <div class="task-content">
            <h4>${tarefa.nome}</h4>
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
            <button class="task-btn favorite" onclick="toggleFavorite(this)"><i class="fas fa-star"></i></button>
            <button class="task-btn edit" onclick="editarTarefa(${tarefa.id})"><i class="fas fa-ellipsis-v"></i></button>
        </div>
    `;
    
    taskList.insertBefore(taskItem, taskList.firstChild);
    atualizarContadorTarefas();
}

function toggleTarefa(id) {
    const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
    if (taskItem) {
        const checkbox = taskItem.querySelector('.task-checkbox');
        const h4 = taskItem.querySelector('h4');
        
        if (checkbox.checked) {
            taskItem.style.opacity = '0.6';
            if (h4) h4.style.textDecoration = 'line-through';
        } else {
            taskItem.style.opacity = '1';
            if (h4) h4.style.textDecoration = 'none';
        }
    }
}

function toggleFavorite(btn) {
    btn.classList.toggle('active');
    const icon = btn.querySelector('i');
    if (icon) {
        icon.style.color = btn.classList.contains('active') ? '#fdcb6e' : '';
    }
}

function editarTarefa(id) {
    alert(`Editar tarefa ${id} - Funcionalidade em desenvolvimento`);
}

function atualizarContadorTarefas() {
    const totalTarefas = document.querySelectorAll('.task-item').length;
    const badge = document.querySelector('.filter-item.active-filter .badge');
    if (badge) {
        badge.textContent = totalTarefas;
    }
}

function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed; top: 20px; right: 20px;
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

// Adicionar estilo para notificações se não existir
if (!document.querySelector('#notification-style')) {
    const style = document.createElement('style');
    style.id = 'notification-style';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

console.log('%c📚 Painel de Tarefas', 'color: #6c5ce7; font-size: 20px; font-weight: bold;');
console.log('%cSistema carregado com sucesso!', 'color: #00b894; font-size: 14px;');