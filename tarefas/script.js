// ===== VERIFICAÇÃO DE LOGIN =====
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    try {
        const userData = JSON.parse(usuario);
        const titulo = document.querySelector('.header h1');
        if (titulo && userData.nome) {
            titulo.textContent = `Bem-vindo, ${userData.nome}!`;
        }
    } catch(e) {}
});

// ===== LOGOUT =====
function logout() {
    if (confirm('Deseja sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

// ===== MENU ATIVO =====
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// ===== SEU CÓDIGO ORIGINAL (PRESERVADO) =====
const navItems = document.querySelectorAll('.nav-item');
const filterItems = document.querySelectorAll('.filter-item');
const taskCheckboxes = document.querySelectorAll('.task-checkbox');
const favoriteButtons = document.querySelectorAll('.task-btn.favorite');
const newTaskButton = document.querySelector('.btn-new-task');
const searchInput = document.querySelector('.search-box input');
const filterSelect = document.querySelector('.filter-select');

filterItems.forEach(item => {
    item.addEventListener('click', function() {
        filterItems.forEach(filter => {
            filter.classList.remove('active');
            filter.classList.remove('active-filter');
        });
        this.classList.add('active-filter');
    });
});

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

function updateStats(action) {
    const statNumber = document.querySelector('.stat-card.completed .stat-number');
    let currentCount = parseInt(statNumber.textContent);
    if (action === 'completed') {
        statNumber.textContent = currentCount + 1;
    } else {
        statNumber.textContent = Math.max(0, currentCount - 1);
    }
}

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

filterSelect.addEventListener('change', function() {
    const tasks = document.querySelectorAll('.task-item');
    const tasksArray = Array.from(tasks);
    switch(this.value) {
        case 'Por prazo':
            tasksArray.sort((a, b) => {
                const dateA = new Date(a.querySelector('.task-date').textContent);
                const dateB = new Date(b.querySelector('.task-date').textContent);
                return dateA - dateB;
            });
            break;
        case 'Por disciplina':
            tasksArray.sort((a, b) => {
                const subjectA = a.querySelector('.task-subject').textContent;
                const subjectB = b.querySelector('.task-subject').textContent;
                return subjectA.localeCompare(subjectB);
            });
            break;
        case 'Por prioridade':
            const priorityOrder = { 'Urgente': 1, 'Alta': 2, 'Média': 3, 'Normal': 4 };
            tasksArray.sort((a, b) => {
                const priorityA = priorityOrder[a.querySelector('.task-priority').textContent.trim()] || 5;
                const priorityB = priorityOrder[b.querySelector('.task-priority').textContent.trim()] || 5;
                return priorityA - priorityB;
            });
            break;
    }
    const taskList = document.querySelector('.task-list');
    tasksArray.forEach(task => taskList.appendChild(task));
});

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

window.addEventListener('load', () => {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        stat.textContent = '0';
        animateValue(stat, 0, finalValue, 1000);
    });
});

const taskItems = document.querySelectorAll('.task-item');
taskItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.borderColor = '#6c5ce7';
    });
    item.addEventListener('mouseleave', function() {
        this.style.borderColor = '#dfe6e9';
    });
});

console.log('%c📚 Painel do Aluno', 'color: #6c5ce7; font-size: 20px; font-weight: bold;');
console.log('%cSistema de gerenciamento de tarefas estudantis', 'color: #636e72; font-size: 12px;');

// Variáveis globais
let prioridadeSelecionada = 'media';
let subtasks = [];

function abrirModal() {
    const modal = document.getElementById('modalNovaTarefa');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('nomeTarefa').focus();
}

function fecharModal() {
    const modal = document.getElementById('modalNovaTarefa');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    limparFormulario();
}

document.getElementById('modalNovaTarefa')?.addEventListener('click', function(e) {
    if (e.target === this) {
        fecharModal();
    }
});

function selecionarPrioridade(prioridade) {
    prioridadeSelecionada = prioridade;
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.priority-btn[data-priority="${prioridade}"]`).classList.add('active');
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
    document.getElementById('formNovaTarefa').reset();
    document.getElementById('subtasksContainer').innerHTML = '';
    subtasks = [];
    prioridadeSelecionada = 'media';
    selecionarPrioridade('media');
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

document.getElementById('formNovaTarefa')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('nomeTarefa').value.trim();
    const descricao = document.getElementById('descricaoTarefa').value.trim();
    const prazo = document.getElementById('prazoTarefa').value.trim();
    const disciplina = document.getElementById('disciplinaTarefa').value;
    
    if (!nome) {
        alert('Por favor, preencha o nome da tarefa.');
        return;
    }
    
    const novaTarefa = {
        id: Date.now(), nome: nome, descricao: descricao,
        prioridade: prioridadeSelecionada, prazo: prazo,
        disciplina: disciplina, subtasks: subtasks,
        concluida: false, dataCriacao: new Date().toISOString()
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
        if (checkbox.checked) {
            taskItem.style.opacity = '0.6';
            taskItem.querySelector('h4').style.textDecoration = 'line-through';
        } else {
            taskItem.style.opacity = '1';
            taskItem.querySelector('h4').style.textDecoration = 'none';
        }
    }
}

function toggleFavorite(btn) {
    btn.classList.toggle('active');
    const icon = btn.querySelector('i');
    if (btn.classList.contains('active')) {
        icon.style.color = '#fdcb6e';
    } else {
        icon.style.color = '';
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

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalNovaTarefa');
            if (modal && modal.classList.contains('active')) {
                fecharModal();
            }
        }
    });
});