// ==================== DADOS GLOBAIS ====================
let notifications = [];
let weeklySchedule = {};
let timeSlots = [];
let calendarEvents = [];
let tasks = [];
let notes = [];
let notificacoesSettings = {};
let appearanceSettings = {};
let usuarioLogado = null;

// Variáveis de Edição de Horário
let editingSubject = null;
let selectedSubjectColor = '#6366f1';
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

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
    
    const existingToast = container.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
    toast.innerHTML = `<ion-icon name="${icons[type]}-outline"></ion-icon> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

function showSavingAnimation(button, callback) {
    if (!button) { callback?.(); return; }
    const originalText = button.textContent;
    button.classList.add('btn-saving');
    button.disabled = true;
    button.textContent = 'Salvando...';
    setTimeout(() => {
        button.classList.remove('btn-saving');
        button.disabled = false;
        button.textContent = originalText;
        callback?.();
    }, 800);
}

// ==================== DADOS PADRÃO ====================
function saveAllData() {
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
    localStorage.setItem('timeSlots', JSON.stringify(timeSlots));
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('notes', JSON.stringify(notes));
}

function loadAllData() {
    usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || null;
    notifications = JSON.parse(localStorage.getItem('notifications')) || getDefaultNotifications();
    weeklySchedule = JSON.parse(localStorage.getItem('weeklySchedule')) || getDefaultSchedule();
    timeSlots = JSON.parse(localStorage.getItem('timeSlots')) || ['08:00', '09:00', '10:00', '14:00'];
    calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    tasks = JSON.parse(localStorage.getItem('tasks')) || getDefaultTasks();
    notes = JSON.parse(localStorage.getItem('notes')) || getDefaultNotes();
}

function getDefaultNotifications() {
    return [
        { id: 1, type: 'aula', title: 'Aula de Matemática', message: 'Lembrete: Aula às 14h hoje', time: new Date().toISOString(), read: false },
        { id: 2, type: 'tarefa', title: 'Tarefa Pendente', message: 'Lista de Exercícios para amanhã', time: new Date().toISOString(), read: false },
        { id: 3, type: 'lembrete', title: 'Prova de História', message: 'Sua prova será na próxima segunda', time: new Date().toISOString(), read: false }
    ];
}

function getDefaultSchedule() {
    return {
        'Seg': [
            { horaInicio: '08:00', horaFim: '09:30', materia: 'Matemática', color: '#6366f1', professor: '' },
            { horaInicio: '09:30', horaFim: '11:00', materia: 'Química', color: '#10b981', professor: '' },
            { horaInicio: '14:00', horaFim: '15:30', materia: 'Matemática', color: '#6366f1', professor: '' }
        ],
        'Ter': [
            { horaInicio: '08:00', horaFim: '09:30', materia: 'Português', color: '#ec4899', professor: '' },
            { horaInicio: '09:30', horaFim: '11:00', materia: 'Biologia', color: '#3b82f6', professor: '' }
        ],
        'Qua': [
            { horaInicio: '08:00', horaFim: '09:30', materia: 'Física', color: '#ef4444', professor: '' },
            { horaInicio: '09:30', horaFim: '11:00', materia: 'Inglês', color: '#8b5cf6', professor: '' }
        ],
        'Qui': [
            { horaInicio: '08:00', horaFim: '10:00', materia: 'História', color: '#f59e0b', professor: '' }
        ],
        'Sex': [
            { horaInicio: '08:00', horaFim: '09:30', materia: 'História', color: '#f59e0b', professor: '' },
            { horaInicio: '09:30', horaFim: '11:00', materia: 'Geografia', color: '#a855f7', professor: '' }
        ]
    };
}

function getDefaultTasks() {
    return [
        { id: 1, title: 'Entregar Redação', subject: 'Português', date: getTomorrowDate(), color: '#ec4899', completed: false, priority: 'alta' },
        { id: 2, title: 'Lista de Exercícios', subject: 'Matemática', date: getTodayDate(), color: '#6366f1', completed: false, priority: 'media' },
        { id: 3, title: 'Resumo Cap. 5', subject: 'História', date: getYesterdayDate(), color: '#f59e0b', completed: true, priority: 'baixa' }
    ];
}

function getDefaultNotes() {
    return [
        { id: Date.now() - 1000, title: 'Fórmulas de Física', subject: 'Física • Mecânica', content: 'F = m * a', date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), color: 'fisica' },
        { id: Date.now() - 2000, title: 'Vocabulário Inglês', subject: 'Inglês • Unit 4', content: 'Apple - Maçã', date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), color: 'ingles' }
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

// ==================== FUNÇÕES DA HOME ====================
function updateSummaryCards() {
    const materias = new Set();
    Object.values(weeklySchedule).forEach(day => {
        day.forEach(classItem => {
            if (classItem.materia) materias.add(classItem.materia.toLowerCase());
        });
    });
    const disciplinas = materias.size || 0;
    
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
        html += `<div class="list-item"><div class="item-icon" style="background-color: var(--accent-purple); color: white"><ion-icon name="${iconMap[item.type] || 'notifications'}-outline"></ion-icon></div><div class="item-info"><div class="item-title">${item.title}</div><div class="item-subtitle">${item.message}</div></div><div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div></div>`;
    });
    
    list.innerHTML = html;
}

function renderNextEvent() {
    const container = document.getElementById('next-event-container');
    if (!container) return;
    
    const nextEvents = calendarEvents.slice(0, 3);
    
    if (nextEvents.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon matematica"><ion-icon name="calendar-outline"></ion-icon></div><div class="item-info"><div class="item-title">Sem eventos próximos</div><div class="item-subtitle">Adicione um evento no calendário 📅</div></div></div>';
        return;
    }
    
    let html = '';
    nextEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const dateFormatted = eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        html += `<div class="list-item"><div class="item-icon" style="background-color: ${event.color}20; color: ${event.color}"><ion-icon name="calendar-outline"></ion-icon></div><div class="item-info"><div class="item-title">${event.title}</div><div class="item-subtitle">${dateFormatted} • ${event.start}</div></div><div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div></div>`;
    });
    
    container.innerHTML = html;
}

function renderNextTasks() {
    const container = document.getElementById('next-tasks-container');
    if (!container) return;
    
    const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 3);
    
    if (upcomingTasks.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon matematica"><ion-icon name="checkmark-circle-outline"></ion-icon></div><div class="item-info"><div class="item-title">Tudo em dia!</div><div class="item-subtitle">Nenhuma tarefa pendente ✨</div></div></div>';
        return;
    }
    
    let html = '';
    upcomingTasks.forEach(task => {
        html += `<div class="list-item"><div class="item-icon" style="background-color: ${task.color}20; color: ${task.color}"><ion-icon name="checkbox-outline"></ion-icon></div><div class="item-info"><div class="item-title">${task.title}</div><div class="item-subtitle">${task.subject} • ${task.date}</div></div><div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div></div>`;
    });
    
    container.innerHTML = html;
}

// ==================== HORÁRIO SEMANAL ====================
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
                html += `<div class="class-cell"><div class="class-block subject-custom" style="background-color: ${classItem.color}">${classItem.materia}<br><small>${classItem.horaInicio}-${classItem.horaFim}</small></div></div>`;
            } else {
                html += `<div class="class-cell"><div class="class-block empty">+</div></div>`;
            }
        });
    });
    
    grid.innerHTML = html;
}

// ==================== EDIÇÃO DE HORÁRIO ====================
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
    }
}

function renderEditSchedule() {
    const grid = document.getElementById('edit-schedule-grid');
    if (!grid) return;
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);
    
    timeSlots.forEach(time => {
        html += `<div class="time-slot">${time}<button class="btn-delete-row" data-time="${time}"><ion-icon name="trash-outline"></ion-icon></button></div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem) {
                html += `<div class="edit-cell"><div class="class-block subject-custom" style="background-color: ${classItem.color}">${classItem.materia}<br><small>${classItem.horaInicio}-${classItem.horaFim}</small></div></div>`;
            } else {
                html += `<div class="edit-cell"><button class="btn-add" data-day="${day}" data-time="${time}">+</button></div>`;
            }
        });
    });
    
    grid.innerHTML = html;
    attachEditEvents();
}

function attachEditEvents() {
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
                    updateSummaryCards();
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
    const subjectModal = document.getElementById('subject-modal');
    const subjectModalTitle = document.getElementById('subject-modal-title');
    const subjectNameInput = document.getElementById('subject-name-input');
    const subjectTeacherInput = document.getElementById('subject-teacher-input');
    const subjectStartInput = document.getElementById('subject-start-input');
    const subjectEndInput = document.getElementById('subject-end-input');
    const subjectDayInput = document.getElementById('subject-day-input');
    
    if (!subjectModal) return;
    
    editingSubject = subject;
    
    if (subjectDayInput) subjectDayInput.value = day;
    
    if (subject) {
        subjectModalTitle.textContent = 'Editar Matéria';
        if (subjectNameInput) subjectNameInput.value = subject.materia;
        if (subjectTeacherInput) subjectTeacherInput.value = subject.professor || '';
        if (subjectStartInput) subjectStartInput.value = subject.horaInicio;
        if (subjectEndInput) subjectEndInput.value = subject.horaFim || '';
        selectedSubjectColor = subject.color;
    } else {
        subjectModalTitle.textContent = 'Adicionar Matéria';
        if (subjectNameInput) subjectNameInput.value = '';
        if (subjectTeacherInput) subjectTeacherInput.value = '';
        if (subjectStartInput) subjectStartInput.value = time;
        if (subjectEndInput) subjectEndInput.value = '';
        selectedSubjectColor = '#6366f1';
    }
    
    updateSubjectColorOptions();
    subjectModal.classList.add('active');
}

function updateSubjectColorOptions() {
    const colorOptions = document.querySelectorAll('#subject-modal .color-option');
    colorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedSubjectColor);
    });
}

function saveSubject() {
    const subjectNameInput = document.getElementById('subject-name-input');
    const subjectTeacherInput = document.getElementById('subject-teacher-input');
    const subjectStartInput = document.getElementById('subject-start-input');
    const subjectEndInput = document.getElementById('subject-end-input');
    const subjectDayInput = document.getElementById('subject-day-input');
    
    const name = subjectNameInput?.value.trim();
    const teacher = subjectTeacherInput?.value.trim();
    const startTime = subjectStartInput?.value;
    const endTime = subjectEndInput?.value;
    const day = subjectDayInput?.value;
    
    if (!name) {
        showToast('Preencha o nome da matéria!', 'error');
        return;
    }
    
    if (!startTime || !endTime) {
        showToast('Defina início e término!', 'error');
        return;
    }
    
    if (endTime <= startTime) {
        showToast('Término deve ser depois do início!', 'error');
        return;
    }
    
    if (!weeklySchedule[day]) weeklySchedule[day] = [];
    
    if (editingSubject) {
        const oldStart = editingSubject.horaInicio;
        weeklySchedule[day] = weeklySchedule[day].filter(c => 
            !(c.materia === editingSubject.materia && c.horaInicio === oldStart)
        );
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
    
    const subjectModal = document.getElementById('subject-modal');
    if (subjectModal) subjectModal.classList.remove('active');
    
    showToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
    
    const editModal = document.getElementById('edit-modal');
    if (editModal && editModal.classList.contains('active')) {
        renderEditSchedule();
    } else {
        renderSchedule();
    }
}

function addNewTimeSlot() {
    const newTimeInput = document.getElementById('new-time-input');
    const newTime = newTimeInput?.value;
    
    if (!newTime) {
        showToast('Selecione um horário!', 'error');
        return;
    }
    
    if (timeSlots.includes(newTime)) {
        showToast('Este horário já existe!', 'error');
        return;
    }
    
    timeSlots.push(newTime);
    timeSlots.sort();
    saveAllData();
    
    if (newTimeInput) newTimeInput.value = '11:00';
    
    renderEditSchedule();
    showToast('Horário adicionado!', 'success');
}

// ==================== NAVEGAÇÃO ====================
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
    
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.toggle('active', nav.dataset.view === viewName);
    });
}

function refreshHomeData() {
    updateSummaryCards();
    renderSchedule();
    renderNextEvent();
    renderNextTasks();
    renderNotificationsDynamic();
}

// ==================== DOMContentLoaded ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    
    if (usuarioLogado) {
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = usuarioLogado.nome.split(' ')[0];
    }
    
    updateNotificationBadge();
    refreshHomeData();
    
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
    
    // Edição de Horário
    document.getElementById('toggle-edit-mode')?.addEventListener('click', openEditModal);
    
    document.getElementById('btn-back')?.addEventListener('click', closeEditModal);
    document.getElementById('btn-save')?.addEventListener('click', closeEditModal);
    
    document.getElementById('btn-add-time')?.addEventListener('click', addNewTimeSlot);
    document.getElementById('btn-cancel-time')?.addEventListener('click', () => {
        document.getElementById('new-time-input').value = '11:00';
    });
    
    // Modal de Matéria
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
    
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
});