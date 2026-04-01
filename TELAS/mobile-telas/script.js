// Página Principal - Dashboard

let notifications = [];
let weeklySchedule = {};
let timeSlots = [];
let calendarEvents = [];
let tasks = [];
let usuarioLogado = null;
let editingSubject = null;
let selectedSubjectColor = '#6366f1';
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

// ==================== FUNÇÕES AUXILIARES ====================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
    toast.innerHTML = `<ion-icon name="${icons[type]}-outline"></ion-icon> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showConfirm(message, title, callback) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) { callback(false); return; }
    
    document.getElementById('confirm-title').textContent = title || 'Confirmar';
    document.getElementById('confirm-message').textContent = message;
    modal.classList.add('active');
    
    const handleConfirm = () => {
        modal.classList.remove('active');
        callback(true);
        cleanup();
    };
    
    const handleCancel = () => {
        modal.classList.remove('active');
        callback(false);
        cleanup();
    };
    
    const cleanup = () => {
        document.getElementById('confirm-ok').removeEventListener('click', handleConfirm);
        document.getElementById('confirm-cancel').removeEventListener('click', handleCancel);
    };
    
    document.getElementById('confirm-ok').onclick = handleConfirm;
    document.getElementById('confirm-cancel').onclick = handleCancel;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadUserData() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        try {
            const user = JSON.parse(usuarioSalvo);
            if (usuarioLogado) {
                usuarioLogado.nome = user.nome || user.displayName || user.email?.split('@')[0] || 'Usuário';
                usuarioLogado.email = user.email;
                usuarioLogado.uid = user.uid;
            }
        } catch(e) {}
    }
    
    if (usuarioLogado && usuarioLogado.nome) {
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = usuarioLogado.nome.split(' ')[0];
    }
}

function saveAllData() {
    if (!usuarioLogado || !usuarioLogado.uid) return;
    
    window.setCached('usuarioLogado', usuarioLogado);
    window.setCached('notifications', notifications);
    window.setCached('weeklySchedule', weeklySchedule);
    window.setCached('timeSlots', timeSlots);
    window.setCached('calendarEvents', calendarEvents);
    window.setCached('tasks', tasks);
}

function loadAllData() {
    usuarioLogado = window.getCached('usuarioLogado', window.getDefaultUser());
    
    if (!usuarioLogado || !usuarioLogado.email) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    loadUserData();
    
    notifications = window.getCached('notifications', window.getDefaultNotifications());
    weeklySchedule = window.getCached('weeklySchedule', window.getDefaultWeeklySchedule());
    timeSlots = window.getCached('timeSlots', window.getDefaultTimeSlots());
    calendarEvents = window.getCached('calendarEvents', window.getDefaultCalendarEvents());
    tasks = window.getCached('tasks', window.getDefaultTasks());
    
    days.forEach(day => {
        if (!weeklySchedule[day]) weeklySchedule[day] = [];
    });
}

function updateSummaryCards() {
    const materias = new Set();
    Object.values(weeklySchedule).forEach(day => {
        day.forEach(c => { if (c.materia) materias.add(c.materia.toLowerCase()); });
    });
    const disciplinas = materias.size;
    const concluidas = tasks.filter(t => t.completed).length;
    const pendentes = tasks.filter(t => !t.completed).length;
    
    const cardDisciplinas = document.querySelector('.card:nth-child(1) .card-number');
    const cardConcluidas = document.querySelector('.card:nth-child(2) .card-number');
    const cardPendentes = document.querySelector('.card:nth-child(3) .card-number');
    
    if (cardDisciplinas) cardDisciplinas.textContent = disciplinas;
    if (cardConcluidas) cardConcluidas.textContent = concluidas;
    if (cardPendentes) cardPendentes.textContent = pendentes;
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function renderNotificationsModal(filter = 'all') {
    const list = document.getElementById('notifications-list-modal');
    if (!list) return;
    
    let filtered = [...notifications];
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
            <div class="notification-icon ${notif.type}">
                <ion-icon name="${iconMap[notif.type] || 'notifications'}-outline"></ion-icon>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                <div class="notification-time">${formatTime(notif.time)}</div>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function formatTime(timeString) {
    if (!timeString) return '';
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMins = Math.floor((now - notifTime) / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    return notifTime.toLocaleDateString('pt-BR');
}

function renderNotificationsDynamic() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    
    const unreadNotifications = notifications.filter(n => !n.read).slice(0, 3);
    if (unreadNotifications.length === 0) {
        list.innerHTML = '<div class="list-item"><div class="item-icon notification"><ion-icon name="checkmark-circle-outline"></ion-icon></div><div class="item-info"><div class="item-title">Tudo em dia!</div><div class="item-subtitle">Nenhuma notificação pendente ✨</div></div></div>';
        return;
    }
    
    let html = '';
    unreadNotifications.forEach(item => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="list-item" data-id="${item.id}">
            <div class="item-icon" style="background-color: var(--accent-purple); color: white">
                <ion-icon name="${iconMap[item.type] || 'notifications'}-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(item.title)}</div>
                <div class="item-subtitle">${escapeHtml(item.message)}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    list.innerHTML = html;
}

function renderNextEvent() {
    const container = document.getElementById('next-event-container');
    if (!container) return;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sortedEvents = [...calendarEvents]
        .filter(e => e.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);
    
    if (sortedEvents.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="calendar-outline"></ion-icon></div><div class="item-info"><div class="item-title">Sem eventos próximos</div><div class="item-subtitle">Adicione um evento no calendário 📅</div></div></div>';
        return;
    }
    
    let html = '';
    sortedEvents.forEach(event => {
        const [year, month, day] = event.date.split('-');
        const dateFormatted = `${day}/${month}`;
        html += `<div class="list-item" data-id="${event.id}">
            <div class="item-icon" style="background-color: ${event.color}20; color: ${event.color}">
                <ion-icon name="calendar-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(event.title)}</div>
                <div class="item-subtitle">${dateFormatted} • ${event.start}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderNextTasks() {
    const container = document.getElementById('next-tasks-container');
    if (!container) return;
    
    const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 3);
    if (upcomingTasks.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="checkmark-circle-outline"></ion-icon></div><div class="item-info"><div class="item-title">Tudo em dia!</div><div class="item-subtitle">Nenhuma tarefa pendente ✨</div></div></div>';
        return;
    }
    
    let html = '';
    upcomingTasks.forEach(task => {
        html += `<div class="list-item" data-id="${task.id}">
            <div class="item-icon" style="background-color: ${task.color}20; color: ${task.color}">
                <ion-icon name="checkbox-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(task.title)}</div>
                <div class="item-subtitle">${escapeHtml(task.subject)} • ${task.date}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderSchedule() {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);
    
    timeSlots.forEach(time => {
        html += `<div class="time-slot">${time}</div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem) {
                html += `<div class="class-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color}">
                        ${escapeHtml(classItem.materia)}<br><small>${classItem.horaInicio}</small>
                    </div>
                </div>`;
            } else {
                html += `<div class="class-cell"><div class="class-block empty">+</div></div>`;
            }
        });
    });
    grid.innerHTML = html;
}

function openEditModal() {
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        editModal.classList.add('active');
        renderEditSchedule();
    }
}

function closeEditModal() {
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        editModal.classList.remove('active');
        renderSchedule();
        updateSummaryCards();
    }
}

function renderEditSchedule() {
    const grid = document.getElementById('edit-schedule-grid');
    if (!grid) return;
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);
    
    timeSlots.forEach(time => {
        html += `<div class="time-slot">
            ${time}
            <button class="btn-delete-row" data-time="${time}">
                <ion-icon name="trash-outline"></ion-icon>
            </button>
        </div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem) {
                html += `<div class="edit-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color}">
                        ${escapeHtml(classItem.materia)}<br><small>${classItem.horaInicio}</small>
                    </div>
                </div>`;
            } else {
                html += `<div class="edit-cell">
                    <button class="btn-add" data-day="${day}" data-time="${time}">+</button>
                </div>`;
            }
        });
    });
    grid.innerHTML = html;
    
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const time = btn.dataset.time;
            showConfirm(`Remover horário ${time}?`, 'Excluir Horário', (confirmed) => {
                if (confirmed) {
                    timeSlots = timeSlots.filter(t => t !== time);
                    days.forEach(day => {
                        if (weeklySchedule[day]) {
                            weeklySchedule[day] = weeklySchedule[day].filter(c => c.horaInicio !== time);
                        }
                    });
                    saveAllData();
                    renderEditSchedule();
                    showToast('Horário removido!', 'success');
                }
            });
        });
    });
    
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => {
            openSubjectModal(null, btn.dataset.day, btn.dataset.time);
        });
    });
}

function openSubjectModal(subject, day, time) {
    const modal = document.getElementById('subject-modal');
    const title = document.getElementById('subject-modal-title');
    const nameInput = document.getElementById('subject-name-input');
    const teacherInput = document.getElementById('subject-teacher-input');
    const startInput = document.getElementById('subject-start-input');
    const endInput = document.getElementById('subject-end-input');
    const dayInput = document.getElementById('subject-day-input');
    
    if (!modal) return;
    
    editingSubject = subject;
    if (dayInput) dayInput.value = day;
    
    if (subject) {
        title.textContent = 'Editar Matéria';
        if (nameInput) nameInput.value = subject.materia;
        if (teacherInput) teacherInput.value = subject.professor || '';
        if (startInput) startInput.value = subject.horaInicio;
        if (endInput) endInput.value = subject.horaFim || '';
        selectedSubjectColor = subject.color;
    } else {
        title.textContent = 'Adicionar Matéria';
        if (nameInput) nameInput.value = '';
        if (teacherInput) teacherInput.value = '';
        if (startInput) startInput.value = time;
        if (endInput) endInput.value = '';
        selectedSubjectColor = '#6366f1';
    }
    
    document.querySelectorAll('#subject-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedSubjectColor);
    });
    modal.classList.add('active');
}

function saveSubject() {
    const name = document.getElementById('subject-name-input')?.value.trim();
    const teacher = document.getElementById('subject-teacher-input')?.value.trim();
    const startTime = document.getElementById('subject-start-input')?.value;
    const endTime = document.getElementById('subject-end-input')?.value;
    const day = document.getElementById('subject-day-input')?.value;
    
    if (!name) { showToast('Preencha o nome da matéria!', 'error'); return; }
    if (!startTime || !endTime) { showToast('Defina início e término!', 'error'); return; }
    if (endTime <= startTime) { showToast('Término deve ser depois do início!', 'error'); return; }
    
    if (!weeklySchedule[day]) weeklySchedule[day] = [];
    
    if (editingSubject) {
        const oldStart = editingSubject.horaInicio;
        weeklySchedule[day] = weeklySchedule[day].filter(c => !(c.materia === editingSubject.materia && c.horaInicio === oldStart));
    }
    
    weeklySchedule[day].push({
        materia: name,
        professor: teacher,
        color: selectedSubjectColor,
        horaInicio: startTime,
        horaFim: endTime
    });
    weeklySchedule[day].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    
    saveAllData();
    updateSummaryCards();
    document.getElementById('subject-modal').classList.remove('active');
    showToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
    
    const editModal = document.getElementById('edit-modal');
    if (editModal && editModal.classList.contains('active')) {
        renderEditSchedule();
    } else {
        renderSchedule();
    }
}

function addNewTimeSlot() {
    const newTime = document.getElementById('new-time-input')?.value;
    if (!newTime) { showToast('Selecione um horário!', 'error'); return; }
    if (timeSlots.includes(newTime)) { showToast('Este horário já existe!', 'error'); return; }
    
    timeSlots.push(newTime);
    timeSlots.sort();
    saveAllData();
    document.getElementById('new-time-input').value = '11:00';
    renderEditSchedule();
    showToast('Horário adicionado!', 'success');
}

function switchView(viewName) {
    if (viewName === 'home') {
        refreshHomeData();
    } else if (viewName === 'calendar') {
        window.location.href = 'calendario/index.html';
    } else if (viewName === 'tasks') {
        window.location.href = 'tarefas/index.html';
    } else if (viewName === 'notes') {
        window.location.href = 'notas/index.html';
    } else if (viewName === 'profile') {
        window.location.href = 'perfil/index.html';
    }
}

function refreshHomeData() {
    updateSummaryCards();
    renderSchedule();
    renderNextEvent();
    renderNextTasks();
    renderNotificationsDynamic();
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationsModal();
    window.setCached('notifications', notifications);
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            window.setCached('notifications', notifications);
            showToast('Notificações limpas!', 'success');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.CacheManager) window.CacheManager.init();
    loadAllData();
    
    if (usuarioLogado) {
        const nomeExibicao = usuarioLogado.nome || usuarioLogado.displayName || usuarioLogado.email?.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
    }
    
    updateNotificationBadge();
    refreshHomeData();
    
    document.getElementById('notification-bell')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.add('active');
        renderNotificationsModal();
    });
    
    document.getElementById('notification-bell-link')?.addEventListener('click', () => {
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
    
    document.getElementById('toggle-edit-mode')?.addEventListener('click', openEditModal);
    document.getElementById('btn-back')?.addEventListener('click', closeEditModal);
    document.getElementById('btn-save')?.addEventListener('click', closeEditModal);
    document.getElementById('btn-add-time')?.addEventListener('click', addNewTimeSlot);
    document.getElementById('btn-cancel-time')?.addEventListener('click', () => {
        document.getElementById('new-time-input').value = '11:00';
    });
    
    document.querySelector('[data-modal="subject-modal"]')?.addEventListener('click', () => {
        document.getElementById('subject-modal').classList.remove('active');
    });
    
    document.getElementById('btn-save-subject')?.addEventListener('click', saveSubject);
    
    document.querySelectorAll('#subject-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#subject-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedSubjectColor = option.dataset.color;
        });
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
});
