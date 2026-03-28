// ==================== DADOS GLOBAIS ====================
let notifications = [];
let tasks = [];
let usuarioLogado = null;
let currentTaskFilter = 'todos';
let editingTaskId = null;
let selectedTaskPriority = 'media';
let selectedTaskColor = '#6366f1';

// ==================== FUNÇÕES GLOBAIS ====================
function showConfirm(message, title = 'Confirmar', callback) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) { callback?.(false); return; }
    
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    modal.classList.add('active');
    
    const btnOk = document.getElementById('confirm-ok');
    const btnCancel = document.getElementById('confirm-cancel');
    
    btnOk.onclick = () => { modal.classList.remove('active'); callback?.(true); };
    btnCancel.onclick = () => { modal.classList.remove('active'); callback?.(false); };
}

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
    toast.innerHTML = `<ion-icon name="${icons[type]}-outline"></ion-icon> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// ==================== DADOS PADRÃO ====================
function saveAllData() {
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadAllData() {
    usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || null;
    notifications = JSON.parse(localStorage.getItem('notifications')) || getDefaultNotifications();
    tasks = JSON.parse(localStorage.getItem('tasks')) || getDefaultTasks();
}

function getDefaultNotifications() {
    return [
        { id: 1, type: 'aula', title: 'Aula de Matemática', message: 'Lembrete: Aula às 14h hoje', time: new Date().toISOString(), read: false },
        { id: 2, type: 'tarefa', title: 'Tarefa Pendente', message: 'Lista de Exercícios para amanhã', time: new Date().toISOString(), read: false },
        { id: 3, type: 'lembrete', title: 'Prova de História', message: 'Sua prova será na próxima segunda', time: new Date().toISOString(), read: false }
    ];
}

function getDefaultTasks() {
    return [
        { id: 1, title: 'Entregar Redação', subject: 'Português', date: getTomorrowDate(), color: '#ec4899', completed: false, priority: 'alta' },
        { id: 2, title: 'Lista de Exercícios', subject: 'Matemática', date: getTodayDate(), color: '#6366f1', completed: false, priority: 'media' },
        { id: 3, title: 'Resumo Cap. 5', subject: 'História', date: getYesterdayDate(), color: '#f59e0b', completed: true, priority: 'baixa' }
    ];
}

function getTodayDate() {
    const today = new Date();
    return today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ==================== NOTIFICAÇÕES ====================
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function formatNotificationTime(timeString) {
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMins = Math.floor((now - notifTime) / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    return notifTime.toLocaleDateString('pt-BR');
}

function renderNotificationsModal(filter = 'all') {
    const list = document.getElementById('notifications-list-modal');
    let filtered = notifications;
    
    if (filter === 'unread') filtered = notifications.filter(n => !n.read);
    else if (filter === 'aulas') filtered = notifications.filter(n => n.type === 'aula');
    else if (filter === 'tarefas') filtered = notifications.filter(n => n.type === 'tarefa');
    
    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)">Nenhuma notificação</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(notif => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}"><ion-icon name="${iconMap[notif.type]}-outline"></ion-icon></div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatNotificationTime(notif.time)}</div>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationsModal();
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            showToast('Notificações limpas!', 'success');
        }
    });
}

// ==================== TAREFAS ====================
function updateTaskPriorityButtons() {
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === selectedTaskPriority);
    });
}

function updateTaskColorOptions() {
    document.querySelectorAll('#task-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedTaskColor);
    });
}

function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;
    
    let filteredTasks = tasks;
    if (currentTaskFilter === 'pendentes') filteredTasks = tasks.filter(t => !t.completed);
    else if (currentTaskFilter === 'concluidas') filteredTasks = tasks.filter(t => t.completed);
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)">Nenhuma tarefa encontrada</div>';
        return;
    }
    
    let html = '';
    filteredTasks.forEach(task => {
        html += `<div class="task-item ${task.completed ? 'completed' : ''} prioridade-${task.priority || 'baixa'}" data-id="${task.id}" style="border-left-color: ${task.color}">
            <div class="task-color" style="background-color: ${task.color};"></div>
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-subject">${task.subject}</div>
                <div class="task-date"><ion-icon name="calendar-outline"></ion-icon> ${task.date}</div>
            </div>
            <div class="task-check ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                ${task.completed ? '<ion-icon name="checkmark-outline"></ion-icon>' : ''}
            </div>
            <div class="task-arrow" data-id="${task.id}">
                <ion-icon name="chevron-forward-outline"></ion-icon>
            </div>
        </div>`;
    });
    tasksList.innerHTML = html;
    
    document.querySelectorAll('.task-check').forEach(check => {
        check.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = check.dataset.id;
            const task = tasks.find(t => t.id == taskId);
            if (task) {
                task.completed = !task.completed;
                saveAllData();
                renderTasks();
            }
        });
    });
    
    document.querySelectorAll('.task-arrow').forEach(arrow => {
        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = arrow.dataset.id;
            const task = tasks.find(t => t.id == taskId);
            if (task) openTaskModal(task);
        });
    });
}

function openTaskModal(task) {
    const taskModal = document.getElementById('task-modal');
    if (!taskModal) return;
    
    editingTaskId = task ? task.id : null;
    
    if (task) {
        document.getElementById('task-modal-title').textContent = 'Editar Tarefa';
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-subject').value = task.subject;
        document.getElementById('task-date').value = task.date;
        selectedTaskColor = task.color || '#6366f1';
        selectedTaskPriority = task.priority || 'media';
    } else {
        document.getElementById('task-modal-title').textContent = 'Nova Tarefa';
        document.getElementById('task-title').value = '';
        document.getElementById('task-subject').value = '';
        document.getElementById('task-date').value = '';
        selectedTaskPriority = 'media';
        selectedTaskColor = '#6366f1';
    }
    
    updateTaskPriorityButtons();
    updateTaskColorOptions();
    taskModal.classList.add('active');
}

// ==================== NAVEGAÇÃO ====================
function switchView(viewName) {
    if (viewName === 'home') window.location.href = '../index.html';
    else if (viewName === 'calendar') window.location.href = '../calendario/index.html';
    else if (viewName === 'tasks') renderTasks();
    else if (viewName === 'notes') window.location.href = '../notas/index.html';
    else if (viewName === 'profile') window.location.href = '../perfil/index.html';
    
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.toggle('active', nav.dataset.view === viewName);
    });
}

// ==================== DOMContentLoaded ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    
    if (usuarioLogado) {
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = usuarioLogado.nome.split(' ')[0];
    }
    
    updateNotificationBadge();
    renderTasks();
    
    // Notificações
    document.getElementById('notification-bell')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.add('active');
        renderNotificationsModal();
    });
    
    document.getElementById('btn-close-notifications')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.remove('active');
    });
    
    document.getElementById('btn-mark-read')?.addEventListener('click', markAllAsRead);
    document.getElementById('btn-clear-all')?.addEventListener('click', clearAllNotifications);
    
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });
    
    // Filtros de Tarefas
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTaskFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    // Adicionar Tarefa
    document.getElementById('btn-add-task')?.addEventListener('click', () => openTaskModal(null));
    
    document.querySelector('[data-modal="task-modal"]')?.addEventListener('click', () => {
        document.getElementById('task-modal').classList.remove('active');
    });
    
    // Prioridade
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTaskPriority = btn.dataset.priority;
        });
    });
    
    // Cores
    document.querySelectorAll('#task-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#task-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedTaskColor = option.dataset.color;
        });
    });
    
    // Salvar Tarefa
    document.getElementById('btn-save-task')?.addEventListener('click', () => {
        const title = document.getElementById('task-title')?.value.trim();
        const subject = document.getElementById('task-subject')?.value.trim();
        const date = document.getElementById('task-date')?.value;
        
        if (!title) {
            showToast('Preencha o título!', 'error');
            return;
        }
        
        if (editingTaskId) {
            const index = tasks.findIndex(t => t.id == editingTaskId);
            if (index > -1) {
                tasks[index] = { ...tasks[index], title, subject: subject || tasks[index].subject, date: date || tasks[index].date, color: selectedTaskColor, priority: selectedTaskPriority };
            }
        } else {
            tasks.unshift({ id: Date.now(), title, subject: subject || 'Geral', date: date || 'Sem data', color: selectedTaskColor, priority: selectedTaskPriority, completed: false });
        }
        
        saveAllData();
        showToast(editingTaskId ? 'Tarefa atualizada!' : 'Tarefa criada!', 'success');
        document.getElementById('task-modal').classList.remove('active');
        renderTasks();
    });
    
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
});