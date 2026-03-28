// ==================== DADOS GLOBAIS ====================
let notifications = [];
let calendarEvents = [];
let usuarioLogado = null;
let currentDate = new Date(2026, 2, 1);
let selectedDay = 1;
let selectedEventType = 'aula';
let selectedEventColor = '#8b5cf6';
let editingEventId = null;

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
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
}

function loadAllData() {
    usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || null;
    notifications = JSON.parse(localStorage.getItem('notifications')) || getDefaultNotifications();
    calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || [];
}

function getDefaultNotifications() {
    return [
        { id: 1, type: 'aula', title: 'Aula de Matemática', message: 'Lembrete: Aula às 14h hoje', time: new Date().toISOString(), read: false },
        { id: 2, type: 'tarefa', title: 'Tarefa Pendente', message: 'Lista de Exercícios para amanhã', time: new Date().toISOString(), read: false },
        { id: 3, type: 'lembrete', title: 'Prova de História', message: 'Sua prova será na próxima segunda', time: new Date().toISOString(), read: false }
    ];
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

// ==================== CALENDÁRIO ====================
function renderCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthYear = document.getElementById('current-month-year');
    if (!calendarDays) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    currentMonthYear.textContent = `${monthNames[month]} de ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day empty"></div>';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
        const isSelected = day === selectedDay;
        const hasEvent = calendarEvents.some(e => {
            const eventDate = new Date(e.date);
            return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
        });
        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}" data-day="${day}">${day}</div>`;
    }
    calendarDays.innerHTML = html;
    
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', () => {
            selectedDay = parseInt(day.dataset.day);
            document.getElementById('events-date').textContent = `Eventos do dia ${selectedDay}`;
            renderEvents();
            renderCalendar();
        });
    });
    renderEvents();
}

function renderEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    const dayEvents = calendarEvents.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getDate() === selectedDay &&
            eventDate.getMonth() === currentDate.getMonth() &&
            eventDate.getFullYear() === currentDate.getFullYear();
    });
    
    if (dayEvents.length === 0) {
        eventsList.innerHTML = '<div class="list-item" style="text-align:center;color:var(--text-secondary)">Nenhum evento neste dia</div>';
        return;
    }
    
    let html = '';
    dayEvents.forEach(event => {
        const iconMap = { 'aula': 'book', 'prova': 'document', 'tarefa': 'checkbox', 'outro': 'calendar' };
        html += `<div class="event-item ${event.type}" data-id="${event.id}" style="border-left-color: ${event.color}">
            <div class="event-icon" style="background-color: ${event.color}20; color: ${event.color}">
                <ion-icon name="${iconMap[event.type] || 'calendar'}-outline"></ion-icon>
            </div>
            <div class="event-info">
                <div class="event-title">${event.title}</div>
                <div class="event-time">${event.start} - ${event.end}</div>
            </div>
            <div class="event-actions">
                <ion-icon name="create-outline" class="edit-event" data-id="${event.id}"></ion-icon>
                <ion-icon name="trash-outline" class="delete-event" data-id="${event.id}"></ion-icon>
            </div>
        </div>`;
    });
    eventsList.innerHTML = html;
    
    document.querySelectorAll('.edit-event').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const event = calendarEvents.find(ev => ev.id == icon.dataset.id);
            if (event) openEventModal(event);
        });
    });
    
    document.querySelectorAll('.delete-event').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirm('Excluir este evento?', 'Excluir Evento', (confirmed) => {
                if (confirmed) {
                    calendarEvents = calendarEvents.filter(ev => ev.id != icon.dataset.id);
                    saveAllData();
                    renderEvents();
                    renderCalendar();
                    showToast('Evento excluído!', 'success');
                }
            });
        });
    });
}

function openEventModal(event) {
    const eventModal = document.getElementById('event-modal');
    if (!eventModal) return;
    
    editingEventId = event ? event.id : null;
    
    if (event) {
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-date').value = event.date;
        document.getElementById('event-start').value = event.start;
        document.getElementById('event-end').value = event.end;
        selectedEventType = event.type;
        selectedEventColor = event.color;
    } else {
        document.getElementById('event-title').value = '';
        document.getElementById('event-date').value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
        document.getElementById('event-start').value = '08:00';
        document.getElementById('event-end').value = '09:00';
        selectedEventType = 'aula';
        selectedEventColor = '#8b5cf6';
    }
    
    updateTypeButtons();
    updateColorOptions();
    eventModal.classList.add('active');
}

function updateTypeButtons() {
    document.querySelectorAll('.event-types .type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === selectedEventType);
    });
}

function updateColorOptions() {
    document.querySelectorAll('#event-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedEventColor);
    });
}

// ==================== NAVEGAÇÃO ====================
function switchView(viewName) {
    if (viewName === 'home') window.location.href = '../index.html';
    else if (viewName === 'calendar') renderCalendar();
    else if (viewName === 'tasks') window.location.href = '../tarefas/index.html';
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
    renderCalendar();
    
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
    
    // Calendário
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('btn-new-event')?.addEventListener('click', () => openEventModal(null));
    
    document.querySelector('[data-modal="event-modal"]')?.addEventListener('click', () => {
        document.getElementById('event-modal').classList.remove('active');
    });
    
    document.querySelectorAll('.event-types .type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.event-types .type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedEventType = btn.dataset.type;
        });
    });
    
    document.querySelectorAll('#event-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#event-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedEventColor = option.dataset.color;
        });
    });
    
    document.getElementById('btn-save-event')?.addEventListener('click', () => {
        const title = document.getElementById('event-title')?.value.trim();
        const date = document.getElementById('event-date')?.value;
        const start = document.getElementById('event-start')?.value;
        const end = document.getElementById('event-end')?.value;
        
        if (!title || !date) {
            showToast('Preencha título e data!', 'error');
            return;
        }
        
        if (editingEventId) {
            const index = calendarEvents.findIndex(e => e.id == editingEventId);
            if (index > -1) {
                calendarEvents[index] = { ...calendarEvents[index], title, date, start, end, type: selectedEventType, color: selectedEventColor };
            }
        } else {
            calendarEvents.push({ id: Date.now(), title, date, start, end, type: selectedEventType, color: selectedEventColor });
        }
        
        saveAllData();
        showToast(editingEventId ? 'Evento atualizado!' : 'Evento criado!', 'success');
        document.getElementById('event-modal').classList.remove('active');
        renderEvents();
        renderCalendar();
    });
    
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
});