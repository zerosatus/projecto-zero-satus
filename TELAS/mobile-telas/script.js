// ==================== NOTIFICAÇÕES ====================

// Dados das notificações
let notifications = [
    {
        id: 1,
        type: 'aula',
        title: 'Aula de Matemática',
        message: 'Lembrete: Aula de Matemática às 14h hoje',
        time: '2026-03-05 08:00',
        read: false
    },
    {
        id: 2,
        type: 'tarefa',
        title: 'Tarefa Pendente',
        message: 'Lista de Exercícios de Física para entregar amanhã',
        time: '2026-03-05 07:30',
        read: false
    },
    {
        id: 3,
        type: 'lembrete',
        title: 'Prova de História',
        message: 'Sua prova de História será na próxima segunda-feira',
        time: '2026-03-04 18:00',
        read: false
    },
    {
        id: 4,
        type: 'aviso',
        title: 'Nota Publicada',
        message: 'Sua nota do trabalho de Geografia foi publicada: 9.5',
        time: '2026-03-04 15:00',
        read: true
    },
    {
        id: 5,
        type: 'aula',
        title: 'Horário Alterado',
        message: 'A aula de Química de amanhã foi remanejada para 10h',
        time: '2026-03-04 12:00',
        read: false
    },
    {
        id: 6,
        type: 'tarefa',
        title: 'Nova Tarefa',
        message: 'Professor adicionou nova tarefa: Resumo Cap. 5',
        time: '2026-03-03 16:00',
        read: true
    },
    {
        id: 7,
        type: 'lembrete',
        title: 'Grupo de Estudos',
        message: 'Grupo de Estudos de Física hoje às 14h',
        time: '2026-03-03 10:00',
        read: false
    },
    {
        id: 8,
        type: 'aviso',
        title: 'Matrícula Aberta',
        message: 'Período de matrículas para o próximo semestre está aberto',
        time: '2026-03-02 09:00',
        read: true
    }
];

// Função para atualizar badge
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // Salvar no localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Função para formatar tempo
function formatNotificationTime(timeString) {
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return notifTime.toLocaleDateString('pt-BR');
}

// Função para renderizar notificações
function renderNotificationsModal(filter = 'all') {
    const list = document.getElementById('notifications-list-modal');
    
    let filtered = notifications;
    
    if (filter === 'unread') {
        filtered = notifications.filter(n => !n.read);
    } else if (filter === 'aulas') {
        filtered = notifications.filter(n => n.type === 'aula');
    } else if (filter === 'tarefas') {
        filtered = notifications.filter(n => n.type === 'tarefa');
    }
    
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-notifications">
                <ion-icon name="notifications-off-outline"></ion-icon>
                <p>Nenhuma notificação</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por mais recente
    filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    let html = '';
    filtered.forEach(notif => {
        const iconMap = {
            'aula': 'book',
            'tarefa': 'checkbox',
            'lembrete': 'time',
            'aviso': 'warning'
        };
        
        html += `
            <div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notification-icon ${notif.type}">
                    <ion-icon name="${iconMap[notif.type]}-outline"></ion-icon>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">
                        <ion-icon name="time-outline"></ion-icon>
                        ${formatNotificationTime(notif.time)}
                    </div>
                </div>
                <div class="notification-actions">
                    ${!notif.read ? `
                        <button class="notification-action-btn btn-mark-single" data-id="${notif.id}">
                            <ion-icon name="checkmark-outline"></ion-icon>
                        </button>
                    ` : ''}
                    <button class="notification-action-btn btn-delete-single" data-id="${notif.id}">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    
    // Adicionar eventos
    document.querySelectorAll('.notification-item-modal').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.notification-action-btn')) return;
            const id = parseInt(item.dataset.id);
            markAsRead(id);
        });
    });
    
    document.querySelectorAll('.btn-mark-single').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            markAsRead(id);
        });
    });
    
    document.querySelectorAll('.btn-delete-single').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteNotification(id);
        });
    });
}

// Marcar como lida
function markAsRead(id) {
    const index = notifications.findIndex(n => n.id === id);
    if (index > -1) {
        notifications[index].read = true;
        updateNotificationBadge();
        renderNotificationsModal();
    }
}

// Marcar todas como lidas
function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationsModal();
}

// Excluir notificação
function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    updateNotificationBadge();
    renderNotificationsModal();
}

// Limpar todas
function clearAllNotifications() {
    if (confirm('Limpar todas as notificações?')) {
        notifications = [];
        updateNotificationBadge();
        renderNotificationsModal();
    }
}

// Carregar notificações salvas
function loadNotifications() {
    const saved = localStorage.getItem('notifications');
    if (saved) {
        notifications = JSON.parse(saved);
    }
    updateNotificationBadge();
}
document.addEventListener('DOMContentLoaded', () => {
    // ==================== NOTIFICAÇÕES - EVENTOS ====================

const notificationBell = document.getElementById('notification-bell');
const notificationsModal = document.getElementById('notifications-modal');
const btnCloseNotifications = document.getElementById('btn-close-notifications');
const btnMarkRead = document.getElementById('btn-mark-read');
const btnClearAll = document.getElementById('btn-clear-all');
const notificationTabs = document.querySelectorAll('.notification-tab');

// Carregar notificações ao iniciar
loadNotifications();

// Abrir modal de notificações
if (notificationBell) {
    notificationBell.addEventListener('click', () => {
        notificationsModal.classList.add('active');
        renderNotificationsModal();
    });
}

// Fechar modal
if (btnCloseNotifications) {
    btnCloseNotifications.addEventListener('click', () => {
        notificationsModal.classList.remove('active');
    });
}

// Fechar ao clicar fora
notificationsModal?.addEventListener('click', (e) => {
    if (e.target === notificationsModal) {
        notificationsModal.classList.remove('active');
    }
});

// Marcar todas como lidas
if (btnMarkRead) {
    btnMarkRead.addEventListener('click', markAllAsRead);
}

// Limpar todas
if (btnClearAll) {
    btnClearAll.addEventListener('click', clearAllNotifications);
}

// Tabs de filtro
notificationTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        notificationTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderNotificationsModal(tab.dataset.type);
    });
});
    // ==================== VERIFICAÇÃO DE LOGIN E CARREGAMENTO DO USUÁRIO ====================
    const usuario = localStorage.getItem('usuarioLogado');
    
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    let userData = null;
    try {
        userData = JSON.parse(usuario);
        console.log('Usuário logado:', userData);
        
        // Atualizar saudação com o nome do usuário
        const greetingName = document.querySelector('.greeting h1');
        const profileName = document.querySelector('.profile-name');
        const profileEmail = document.querySelector('.profile-email');
        const profileAvatar = document.querySelector('.profile-avatar span');
        
        if (userData.nome) {
            // Extrair primeiro nome para saudação
            const primeiroNome = userData.nome.split(' ')[0];
            if (greetingName) greetingName.textContent = primeiroNome;
            
            // Nome completo no perfil
            if (profileName) profileName.textContent = userData.nome;
            
            // Iniciais para avatar
            if (profileAvatar) {
                const iniciais = userData.nome
                    .split(' ')
                    .map(palavra => palavra.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                profileAvatar.textContent = iniciais;
            }
        }
        
        if (userData.email && profileEmail) {
            profileEmail.textContent = userData.email;
        }
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
        window.location.href = '../login/index.html';
        return;
    }
    
    // ==================== LOGOUT ====================
    function logout() {
        if (confirm('Deseja realmente sair?')) {
            localStorage.removeItem('usuarioLogado');
            window.location.href = '../login/index.html';
        }
    }
    
    // Adicionar evento de logout ao item do menu
    const logoutItem = document.querySelector('.menu-item.logout');
    if (logoutItem) {
        logoutItem.addEventListener('click', logout);
    }
    
    // ==================== HORÁRIO ====================
    let weeklySchedule = {
        'Seg': [
            { hora: '08:00', materia: 'matematica' },
            { hora: '09:00', materia: 'quimica' },
            { hora: '14:00', materia: 'matematica' }
        ],
        'Ter': [
            { hora: '08:00', materia: 'portugues' },
            { hora: '09:00', materia: 'biologia' },
            { hora: '10:00', materia: 'redacao' }
        ],
        'Qua': [
            { hora: '08:00', materia: 'fisica' },
            { hora: '09:00', materia: 'ingles' },
            { hora: '14:00', materia: 'quimica' }
        ],
        'Qui': [
            { hora: '08:00', materia: 'historia' },
            { hora: '10:00', materia: 'fisica' }
        ],
        'Sex': [
            { hora: '08:00', materia: 'historia' },
            { hora: '09:00', materia: 'geografia' }
        ]
    };

    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    let timeSlots = ['08:00', '09:00', '10:00', '14:00'];

    const subjectMap = {
        'matematica': 'matematica', 'mat': 'matematica',
        'portugues': 'portugues', 'port': 'portugues',
        'fisica': 'fisica', 'fis': 'fisica',
        'historia': 'historia', 'hist': 'historia',
        'quimica': 'quimica', 'quim': 'quimica',
        'biologia': 'biologia', 'bio': 'biologia',
        'ingles': 'ingles', 'ing': 'ingles',
        'geografia': 'geografia', 'geo': 'geografia',
        'redacao': 'redacao', 'red': 'redacao'
    };

    const namesMap = {
        'matematica': 'Matemática', 'portugues': 'Português', 'fisica': 'Física',
        'historia': 'História', 'quimica': 'Química', 'biologia': 'Biologia',
        'ingles': 'Inglês', 'geografia': 'Geografia', 'redacao': 'Redação'
    };

    const editModal = document.getElementById('edit-modal');
    const btnBack = document.getElementById('btn-back');
    const btnSave = document.getElementById('btn-save');
    const btnAddTime = document.getElementById('btn-add-time');
    const btnCancelTime = document.getElementById('btn-cancel-time');
    const newTimeInput = document.getElementById('new-time-input');
    const toggleBtn = document.getElementById('toggle-edit-mode');

    function renderSchedule() {
        const grid = document.getElementById('schedule-grid');
        if (!grid) return;
        
        let html = '<div class="day-header">Hora</div>';
        days.forEach(day => html += `<div class="day-header">${day}</div>`);

        timeSlots.forEach(time => {
            html += `<div class="time-slot">${time}</div>`;
            days.forEach(day => {
                const classItem = weeklySchedule[day]?.find(c => c.hora === time);
                if (classItem) {
                    html += `<div class="class-cell"><div class="class-block ${classItem.materia}">${namesMap[classItem.materia]}</div></div>`;
                } else {
                    html += `<div class="class-cell"><div class="class-block empty">+</div></div>`;
                }
            });
        });
        grid.innerHTML = html;
    }

    function renderEditSchedule() {
        const grid = document.getElementById('edit-schedule-grid');
        if (!grid) return;
        
        let html = '<div class="day-header">Hora</div>';
        days.forEach(day => html += `<div class="day-header">${day}</div>`);

        timeSlots.forEach(time => {
            html += `<div class="time-slot">${time} <button class="btn-delete-row" data-time="${time}"><ion-icon name="trash-outline"></ion-icon></button></div>`;
            days.forEach(day => {
                const classItem = weeklySchedule[day]?.find(c => c.hora === time);
                if (classItem) {
                    html += `<div class="edit-cell"><div class="class-block ${classItem.materia}" data-day="${day}" data-time="${time}">${namesMap[classItem.materia]}</div></div>`;
                } else {
                    html += `<div class="edit-cell"><button class="btn-add" data-day="${day}" data-time="${time}">+</button></div>`;
                }
            });
        });
        grid.innerHTML = html;
        attachEditEvents();
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            editModal.classList.add('active');
            renderEditSchedule();
        });
    }

    btnBack?.addEventListener('click', () => {
        editModal.classList.remove('active');
        renderSchedule();
    });

    btnSave?.addEventListener('click', () => {
        editModal.classList.remove('active');
        renderSchedule();
    });

    btnAddTime?.addEventListener('click', () => {
        const newTime = newTimeInput.value;
        if (newTime && !timeSlots.includes(newTime)) {
            timeSlots.push(newTime);
            timeSlots.sort();
            renderEditSchedule();
            newTimeInput.value = '11:00';
        } else {
            alert('Horário já existe ou inválido!');
        }
    });

    btnCancelTime?.addEventListener('click', () => {
        newTimeInput.value = '11:00';
    });

    function attachEditEvents() {
        document.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const time = btn.dataset.time;
                if (confirm(`Remover horário ${time}?`)) {
                    timeSlots = timeSlots.filter(t => t !== time);
                    days.forEach(day => {
                        if (weeklySchedule[day]) {
                            weeklySchedule[day] = weeklySchedule[day].filter(c => c.hora !== time);
                        }
                    });
                    renderEditSchedule();
                }
            });
        });

        document.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', () => {
                const day = btn.dataset.day;
                const time = btn.dataset.time;
                const subject = prompt('Digite a matéria:');
                if (subject && subject.trim() !== '') {
                    const subjectLower = subject.toLowerCase().trim();
                    let foundClass = null;
                    for (const key in subjectMap) {
                        if (subjectLower.includes(key)) {
                            foundClass = subjectMap[key];
                            break;
                        }
                    }
                    const finalClass = foundClass || 'matematica';
                    if (!weeklySchedule[day]) weeklySchedule[day] = [];
                    weeklySchedule[day].push({ hora: time, materia: finalClass });
                    renderEditSchedule();
                }
            });
        });

        document.querySelectorAll('.edit-cell .class-block').forEach(block => {
            block.addEventListener('click', () => {
                const day = block.dataset.day;
                const time = block.dataset.time;
                const currentMateria = weeklySchedule[day]?.find(c => c.hora === time)?.materia;
                const newName = prompt('Editar matéria:', namesMap[currentMateria]);
                if (newName && newName.trim() !== '') {
                    const subjectLower = newName.toLowerCase().trim();
                    let foundClass = null;
                    for (const key in subjectMap) {
                        if (subjectLower.includes(key)) {
                            foundClass = subjectMap[key];
                            break;
                        }
                    }
                    const finalClass = foundClass || 'matematica';
                    const classItem = weeklySchedule[day]?.find(c => c.hora === time);
                    if (classItem) {
                        classItem.materia = finalClass;
                    }
                    renderEditSchedule();
                }
            });
        });
    }

    // ==================== PRÓXIMAS AULAS ====================
    const nextClasses = [
        { title: 'Matemática', subtitle: 'Hoje - 14h', icon: 'matematica' },
        { title: 'Entregar Redação', subtitle: 'Amanhã - 23:59', icon: 'portugues' },
        { title: 'Lab. de Química', subtitle: 'Sexta - 10h', icon: 'quimica' },
        { title: 'Prova de História', subtitle: 'Segunda - 08h', icon: 'historia' }
    ];

    function renderClasses() {
        const list = document.getElementById('classes-list');
        if (!list) return;
        
        let html = '';
        nextClasses.forEach(item => {
            html += `<div class="list-item">
                <div class="item-icon ${item.icon}"><ion-icon name="book-outline"></ion-icon></div>
                <div class="item-info">
                    <div class="item-title">${item.title}</div>
                    <div class="item-subtitle">${item.subtitle}</div>
                </div>
                <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
            </div>`;
        });
        list.innerHTML = html;
    }

    // ==================== NOTIFICAÇÕES ====================
    const notifications = [
        { title: 'Lembrete de leitura', subtitle: 'Capítulo 5 - Literatura Brasileira', icon: 'notification', type: 'lembrete' },
        { title: 'Guilherme entrou em...', subtitle: 'Grupo de Estudos - Física', icon: 'notification', type: 'guilherme' },
        { title: 'Tarefa aprovada', subtitle: 'Trabalho de Geografia - Nota 9.5', icon: 'notification', type: 'aprovada' }
    ];

    function renderNotifications() {
        const list = document.getElementById('notifications-list');
        if (!list) return;
        
        let html = '';
        notifications.forEach(item => {
            html += `<div class="list-item notification-item ${item.type}">
                <div class="item-icon ${item.icon}"><ion-icon name="${item.type === 'aprovada' ? 'checkmark-circle' : 'notifications'}-outline"></ion-icon></div>
                <div class="item-info">
                    <div class="item-title">${item.title}</div>
                    <div class="item-subtitle">${item.subtitle}</div>
                </div>
                <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
            </div>`;
        });
        list.innerHTML = html;
    }

    // ==================== CALENDÁRIO ====================
    let currentDate = new Date(2026, 2, 1);
    let selectedDay = 1;

    const calendarDays = document.getElementById('calendar-days');
    const currentMonthYear = document.getElementById('current-month-year');
    const eventsDate = document.getElementById('events-date');
    const eventsList = document.getElementById('events-list');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    const events = {
        1: [
            { title: 'Aula de Matemática', time: '08:00 - 09:30', type: 'aula' },
            { title: 'Grupo de Estudos', time: '14:00 - 16:00', type: 'trabalho' }
        ],
        5: [{ title: 'Prova de Física', time: '10:00', type: 'aula' }],
        15: [{ title: 'Entregar Trabalho', time: '23:59', type: 'trabalho' }]
    };

    function renderCalendar() {
        if (!calendarDays || !currentMonthYear || !eventsDate) return;
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        currentMonthYear.textContent = `${monthNames[month]} de ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let html = '';
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = day === selectedDay;
            const hasEvent = events[day] ? 'has-event' : '';
            html += `<div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent}" data-day="${day}">${day}</div>`;
        }
        
        calendarDays.innerHTML = html;
        
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', () => {
                selectedDay = parseInt(day.dataset.day);
                eventsDate.textContent = `Eventos do dia ${selectedDay}`;
                renderEvents();
                renderCalendar();
            });
        });
        
        renderEvents();
    }

    function renderEvents() {
        if (!eventsList || !eventsDate) return;
        
        const dayEvents = events[selectedDay] || [];
        eventsDate.textContent = `Eventos do dia ${selectedDay}`;
        
        if (dayEvents.length === 0) {
            eventsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhum evento neste dia</p>';
            return;
        }
        let html = '';
        dayEvents.forEach(event => {
            html += `<div class="event-item">
                <div class="event-icon ${event.type}"><ion-icon name="${event.type === 'aula' ? 'book' : 'document'}-outline"></ion-icon></div>
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">${event.time}</div>
                </div>
                <div class="event-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
            </div>`;
        });
        eventsList.innerHTML = html;
    }
    // ADICIONE NA SEÇÃO DO CALENDÁRIO, APÓS renderEvents():

// ==================== EVENTOS DO CALENDÁRIO ====================
let selectedEventType = 'aula';
let selectedEventColor = '#8b5cf6';
let editingEventId = null;

// Armazenar eventos (pode vir do localStorage depois)
let calendarEvents = [
    { id: 1, title: 'Aula de Matemática', date: '2026-03-01', start: '08:00', end: '09:30', type: 'aula', color: '#6366f1' },
    { id: 2, title: 'Grupo de Estudos', date: '2026-03-01', start: '14:00', end: '16:00', type: 'tarefa', color: '#10b981' }
];

const eventModal = document.getElementById('event-modal');
const btnNewEvent = document.getElementById('btn-new-event');
const btnCloseEvent = document.getElementById('btn-close-event');
const btnSaveEvent = document.getElementById('btn-save-event');
const eventTitle = document.getElementById('event-title');
const eventDate = document.getElementById('event-date');
const eventStart = document.getElementById('event-start');
const eventEnd = document.getElementById('event-end');
const typeBtns = document.querySelectorAll('.type-btn');
const colorOptions = document.querySelectorAll('.color-option');

// Abrir modal de novo evento
if (btnNewEvent) {
    btnNewEvent.addEventListener('click', () => {
        editingEventId = null;
        eventTitle.value = '';
        eventDate.value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
        eventStart.value = '08:00';
        eventEnd.value = '09:00';
        selectedEventType = 'aula';
        selectedEventColor = '#8b5cf6';
        updateTypeButtons();
        updateColorOptions();
        eventModal.classList.add('active');
    });
}

// Fechar modal
if (btnCloseEvent) {
    btnCloseEvent.addEventListener('click', () => {
        eventModal.classList.remove('active');
    });
}

// Selecionar tipo de evento
typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedEventType = btn.dataset.type;
    });
});

// Selecionar cor
colorOptions.forEach(option => {
    option.addEventListener('click', () => {
        colorOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        selectedEventColor = option.dataset.color;
    });
});

// Salvar evento
if (btnSaveEvent) {
    btnSaveEvent.addEventListener('click', () => {
        const title = eventTitle.value.trim();
        const date = eventDate.value;
        const start = eventStart.value;
        const end = eventEnd.value;

        if (!title || !date) {
            alert('Preencha título e data!');
            return;
        }

        if (editingEventId) {
            // Editar evento existente
            const eventIndex = calendarEvents.findIndex(e => e.id === editingEventId);
            if (eventIndex > -1) {
                calendarEvents[eventIndex] = {
                    ...calendarEvents[eventIndex],
                    title,
                    date,
                    start,
                    end,
                    type: selectedEventType,
                    color: selectedEventColor
                };
            }
        } else {
            // Criar novo evento
            calendarEvents.push({
                id: Date.now(),
                title,
                date,
                start,
                end,
                type: selectedEventType,
                color: selectedEventColor
            });
        }

        eventModal.classList.remove('active');
        renderEvents();
        renderCalendar();
    });
}

// Atualizar botões de tipo
function updateTypeButtons() {
    typeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === selectedEventType);
    });
}

// Atualizar opções de cor
function updateColorOptions() {
    colorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedEventColor);
    });
}

// SUBSTITUA A FUNÇÃO renderEvents() POR ESTA:
function renderEvents() {
    const dayEvents = calendarEvents.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getDate() === selectedDay && 
               eventDate.getMonth() === currentDate.getMonth() && 
               eventDate.getFullYear() === currentDate.getFullYear();
    });

    if (dayEvents.length === 0) {
        eventsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhum evento neste dia</p>';
        return;
    }

    let html = '';
    dayEvents.forEach(event => {
        const iconMap = {
            'aula': 'book',
            'prova': 'document',
            'tarefa': 'checkbox',
            'outro': 'calendar'
        };

        html += `
            <div class="event-item ${event.type}" data-id="${event.id}" style="border-left-color: ${event.color}">
                <div class="event-icon" style="background-color: ${event.color}20; color: ${event.color}">
                    <ion-icon name="${iconMap[event.type]}-outline"></ion-icon>
                </div>
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">${event.start} - ${event.end}</div>
                </div>
                <div class="event-actions">
                    <ion-icon name="create-outline" class="edit-event" data-id="${event.id}" style="margin-right: 10px;"></ion-icon>
                    <ion-icon name="trash-outline" class="delete-event" data-id="${event.id}"></ion-icon>
                </div>
            </div>
        `;
    });

    eventsList.innerHTML = html;

    // Adicionar eventos de editar/excluir
    document.querySelectorAll('.edit-event').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventId = parseInt(icon.dataset.id);
            const event = calendarEvents.find(ev => ev.id === eventId);
            if (event) {
                editingEventId = event.id;
                eventTitle.value = event.title;
                eventDate.value = event.date;
                eventStart.value = event.start;
                eventEnd.value = event.end;
                selectedEventType = event.type;
                selectedEventColor = event.color;
                updateTypeButtons();
                updateColorOptions();
                eventModal.classList.add('active');
            }
        });
    });

    document.querySelectorAll('.delete-event').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventId = parseInt(icon.dataset.id);
            if (confirm('Excluir este evento?')) {
                calendarEvents = calendarEvents.filter(ev => ev.id !== eventId);
                renderEvents();
                renderCalendar();
            }
        });
    });
}

    prevMonthBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // ==================== TAREFAS ====================
    let currentTaskFilter = 'todos';

    const tasksView = document.getElementById('tasks-view');
    const tasksList = document.getElementById('tasks-list');
    const btnAddTask = document.getElementById('btn-add-task');
    const filterBtns = document.querySelectorAll('.filter-btn');

    const tasks = [
        { id: 1, title: 'Entregar Redação', subject: 'Português', date: 'Amanhã - 23:59', color: 'portugues', completed: false },
        { id: 2, title: 'Lista de Exercícios', subject: 'Matemática', date: 'Hoje', color: 'matematica', completed: false },
        { id: 3, title: 'Resumo Cap. 5', subject: 'História', date: 'Ontem', color: 'historia', completed: true },
        { id: 4, title: 'Trabalho de Biologia', subject: 'Biologia', date: '15/03', color: 'biologia', completed: false },
        { id: 5, title: 'Prova de Inglês', subject: 'Inglês', date: '20/03', color: 'ingles', completed: false },
        { id: 6, title: 'Mapa Mental - Física', subject: 'Física', date: '25/03', color: 'fisica', completed: false }
    ];

    function renderTasks() {
        if (!tasksList) return;
        
        let filteredTasks = tasks;
        
        if (currentTaskFilter === 'pendentes') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (currentTaskFilter === 'concluidas') {
            filteredTasks = tasks.filter(t => t.completed);
        }
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Nenhuma tarefa encontrada</p>';
            return;
        }
        
        let html = '';
        filteredTasks.forEach(task => {
            html += `
                <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-color ${task.color}"></div>
                    <div class="task-info">
                        <div class="task-title">${task.title}</div>
                        <div class="task-subject">${task.subject}</div>
                        <div class="task-date">
                            <ion-icon name="calendar-outline"></ion-icon> ${task.date}
                        </div>
                    </div>
                    <div class="task-check ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                        ${task.completed ? '<ion-icon name="checkmark-outline"></ion-icon>' : ''}
                    </div>
                    <div class="task-arrow">
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </div>
                </div>
            `;
        });
        
        tasksList.innerHTML = html;
        
        document.querySelectorAll('.task-check').forEach(check => {
            check.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(check.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = !task.completed;
                    renderTasks();
                }
            });
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTaskFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    btnAddTask?.addEventListener('click', () => {
        const title = prompt('Nome da tarefa:');
        if (title) {
            const subject = prompt('Matéria:');
            const date = prompt('Data de entrega:');
            if (subject && date) {
                tasks.unshift({
                    id: Date.now(),
                    title: title,
                    subject: subject,
                    date: date,
                    color: 'matematica',
                    completed: false
                });
                renderTasks();
            }
        }
    });
    // ADICIONE NA SEÇÃO DE TAREFAS:

// ==================== MODAL DE TAREFA ====================
let editingTaskId = null;
let selectedTaskType = 'matematica';
let selectedTaskPriority = 'baixa';
let selectedTaskColor = '#6366f1';

const taskModal = document.getElementById('task-modal');
const taskModalTitle = document.getElementById('task-modal-title');
const btnCloseTask = document.getElementById('btn-close-task');
const btnSaveTask = document.getElementById('btn-save-task');
const taskTitleInput = document.getElementById('task-title');
const taskSubjectInput = document.getElementById('task-subject');
const taskDateInput = document.getElementById('task-date');
const taskTypeBtns = document.querySelectorAll('.task-types .type-btn');
const taskPriorityBtns = document.querySelectorAll('.priority-btn');
const taskColorOptions = document.querySelectorAll('.task-modal .color-option');

// Abrir modal de nova tarefa
if (btnAddTask) {
    btnAddTask.addEventListener('click', () => {
        editingTaskId = null;
        taskModalTitle.textContent = 'Nova Tarefa';
        taskTitleInput.value = '';
        taskSubjectInput.value = '';
        taskDateInput.value = '';
        selectedTaskType = 'matematica';
        selectedTaskPriority = 'baixa';
        selectedTaskColor = '#6366f1';
        updateTaskTypeButtons();
        updateTaskPriorityButtons();
        updateTaskColorOptions();
        taskModal.classList.add('active');
    });
}

// Fechar modal
if (btnCloseTask) {
    btnCloseTask.addEventListener('click', () => {
        taskModal.classList.remove('active');
    });
}

// Selecionar tipo
taskTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        taskTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTaskType = btn.dataset.type;
    });
});

// Selecionar prioridade
taskPriorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        taskPriorityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTaskPriority = btn.dataset.priority;
    });
});

// Selecionar cor
taskColorOptions.forEach(option => {
    option.addEventListener('click', () => {
        taskColorOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        selectedTaskColor = option.dataset.color;
    });
});

// Salvar tarefa
if (btnSaveTask) {
    btnSaveTask.addEventListener('click', () => {
        const title = taskTitleInput.value.trim();
        const subject = taskSubjectInput.value.trim();
        const date = taskDateInput.value;

        if (!title) {
            alert('Preencha o título!');
            return;
        }

        if (editingTaskId) {
            // Editar tarefa existente
            const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
            if (taskIndex > -1) {
                tasks[taskIndex] = {
                    ...tasks[taskIndex],
                    title,
                    subject: subject || tasks[taskIndex].subject,
                    date: date || tasks[taskIndex].date,
                    color: selectedTaskColor,
                    priority: selectedTaskPriority
                };
            }
        } else {
            // Criar nova tarefa
            tasks.unshift({
                id: Date.now(),
                title,
                subject: subject || 'Geral',
                date: date || 'Sem data',
                color: selectedTaskColor,
                priority: selectedTaskPriority,
                completed: false
            });
        }

        taskModal.classList.remove('active');
        renderTasks();
    });
}

// Atualizar botões de tipo
function updateTaskTypeButtons() {
    taskTypeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === selectedTaskType);
    });
}

// Atualizar botões de prioridade
function updateTaskPriorityButtons() {
    taskPriorityBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === selectedTaskPriority);
    });
}

// Atualizar opções de cor
function updateTaskColorOptions() {
    taskColorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedTaskColor);
    });
}

// MODIFIQUE A FUNÇÃO renderTasks() PARA USAR A COR E PRIORIDADE:
function renderTasks() {
    let filteredTasks = tasks;
    
    if (currentTaskFilter === 'pendentes') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentTaskFilter === 'concluidas') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Nenhuma tarefa encontrada</p>';
        return;
    }
    
    let html = '';
    filteredTasks.forEach(task => {
        html += `
            <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority ? 'prioridade-' + task.priority : ''}" 
                 data-id="${task.id}" 
                 style="${task.color ? 'border-left-color: ' + task.color : ''}">
                <div class="task-color" style="${task.color ? 'background-color: ' + task.color : ''}"></div>
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-subject">${task.subject}</div>
                    <div class="task-date">
                        <ion-icon name="calendar-outline"></ion-icon> ${task.date}
                    </div>
                </div>
                <div class="task-check ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                    ${task.completed ? '<ion-icon name="checkmark-outline"></ion-icon>' : ''}
                </div>
                <div class="task-arrow" data-id="${task.id}">
                    <ion-icon name="chevron-forward-outline"></ion-icon>
                </div>
            </div>
        `;
    });
    
    tasksList.innerHTML = html;
    
    // Adicionar eventos
    document.querySelectorAll('.task-check').forEach(check => {
        check.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = parseInt(check.dataset.id);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                renderTasks();
            }
        });
    });

    // Editar tarefa ao clicar
    document.querySelectorAll('.task-arrow').forEach(arrow => {
        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = parseInt(arrow.dataset.id);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                editingTaskId = task.id;
                taskModalTitle.textContent = 'Editar Tarefa';
                taskTitleInput.value = task.title;
                taskSubjectInput.value = task.subject;
                taskDateInput.value = task.date;
                selectedTaskType = 'outro';
                selectedTaskPriority = task.priority || 'baixa';
                selectedTaskColor = task.color || '#6366f1';
                updateTaskTypeButtons();
                updateTaskPriorityButtons();
                updateTaskColorOptions();
                taskModal.classList.add('active');
            }
        });
    });
}

    // ==================== ANOTAÇÕES ====================
    const notesView = document.getElementById('notes-view');
    const notesGrid = document.getElementById('notes-grid');
    const btnAddNote = document.getElementById('btn-add-note');
    const notesSearchInput = document.getElementById('notes-search-input');

    const notes = [
        { id: 1, title: 'Fórmulas de Física', subject: 'Física • Mecânica', date: '10/03', color: 'fisica' },
        { id: 2, title: 'Vocabulário Inglês', subject: 'Inglês • Unit 4', date: '12/03', color: 'ingles' },
        { id: 3, title: 'Figuras de Linguagem', subject: 'Português', date: '14/03', color: 'portugues' },
        { id: 4, title: 'Reações Químicas', subject: 'Química • Orgânica', date: '15/03', color: 'quimica' },
        { id: 5, title: 'Resumo Revolução Francesa', subject: 'História', date: '16/03', color: 'historia' },
        { id: 6, title: 'Geometria Plana', subject: 'Matemática', date: '18/03', color: 'matematica' }
    ];

    function renderNotes(searchTerm = '') {
        if (!notesGrid) return;
        
        let filteredNotes = notes;
        
        if (searchTerm) {
            filteredNotes = notes.filter(note => 
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.subject.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (filteredNotes.length === 0) {
            notesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px; grid-column: 1/-1;">Nenhuma anotação encontrada</p>';
            return;
        }
        
        let html = '';
        filteredNotes.forEach(note => {
            html += `
                <div class="note-card ${note.color}" data-id="${note.id}">
                    <div>
                        <div class="note-title">${note.title}</div>
                        <div class="note-subject">${note.subject}</div>
                    </div>
                    <div class="note-date">${note.date}</div>
                </div>
            `;
        });
        
        notesGrid.innerHTML = html;
    }

    notesSearchInput?.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });

    btnAddNote?.addEventListener('click', () => {
        const title = prompt('Título da anotação:');
        if (title) {
            const subject = prompt('Matéria:');
            if (subject) {
                notes.unshift({
                    id: Date.now(),
                    title: title,
                    subject: subject,
                    date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    color: 'matematica'
                });
                renderNotes();
            }
        }
    });
    // ADICIONE NA SEÇÃO DE ANOTAÇÕES:

// ==================== MODAL DE ANOTAÇÃO ====================
let editingNoteId = null;
let selectedNoteColor = 'fisica';

const noteModal = document.getElementById('note-modal');
const noteModalTitle = document.getElementById('note-modal-title');
const btnCloseNote = document.getElementById('btn-close-note');
const btnSaveNote = document.getElementById('btn-save-note');
const noteTitleInput = document.getElementById('note-title');
const noteSubjectInput = document.getElementById('note-subject');
const noteContentInput = document.getElementById('note-content');
const noteColorOptions = document.querySelectorAll('.note-modal .color-option');

// Abrir modal de nova anotação
if (btnAddNote) {
    btnAddNote.addEventListener('click', () => {
        editingNoteId = null;
        noteModalTitle.textContent = 'Nova Anotação';
        noteTitleInput.value = '';
        noteSubjectInput.value = '';
        noteContentInput.value = '';
        selectedNoteColor = 'fisica';
        updateNoteColorOptions();
        noteModal.classList.add('active');
    });
}

// Fechar modal
if (btnCloseNote) {
    btnCloseNote.addEventListener('click', () => {
        noteModal.classList.remove('active');
    });
}

// Selecionar cor
noteColorOptions.forEach(option => {
    option.addEventListener('click', () => {
        noteColorOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        selectedNoteColor = option.dataset.color;
    });
});

// Salvar anotação
if (btnSaveNote) {
    btnSaveNote.addEventListener('click', () => {
        const title = noteTitleInput.value.trim();
        const subject = noteSubjectInput.value.trim();
        const content = noteContentInput.value.trim();

        if (!title) {
            alert('Preencha o título!');
            return;
        }

        if (editingNoteId) {
            // Editar anotação existente
            const noteIndex = notes.findIndex(n => n.id === editingNoteId);
            if (noteIndex > -1) {
                notes[noteIndex] = {
                    ...notes[noteIndex],
                    title,
                    subject: subject || notes[noteIndex].subject,
                    content: content || notes[noteIndex].content,
                    color: selectedNoteColor
                };
            }
        } else {
            // Criar nova anotação
            notes.unshift({
                id: Date.now(),
                title,
                subject: subject || 'Geral',
                content: content || '',
                color: selectedNoteColor,
                date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            });
        }

        noteModal.classList.remove('active');
        renderNotes();
    });
}

// Atualizar opções de cor
function updateNoteColorOptions() {
    noteColorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedNoteColor);
    });
}

// MODIFIQUE A FUNÇÃO renderNotes() PARA USAR A COR E ABRIR EDIÇÃO:
function renderNotes(searchTerm = '') {
    let filteredNotes = notes;
    
    if (searchTerm) {
        filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px; grid-column: 1/-1;">Nenhuma anotação encontrada</p>';
        return;
    }
    
    let html = '';
    filteredNotes.forEach(note => {
        html += `
            <div class="note-card ${note.color || 'matematica'}" data-id="${note.id}">
                <div>
                    <div class="note-title">${note.title}</div>
                    <div class="note-subject">${note.subject}</div>
                    ${note.content ? `<div class="note-content" style="margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</div>` : ''}
                </div>
                <div class="note-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <div class="note-date">${note.date}</div>
                    <div class="note-actions">
                        <ion-icon name="create-outline" class="edit-note" data-id="${note.id}" style="margin-right: 10px; cursor: pointer;"></ion-icon>
                        <ion-icon name="trash-outline" class="delete-note" data-id="${note.id}" style="cursor: pointer;"></ion-icon>
                    </div>
                </div>
            </div>
        `;
    });
    
    notesGrid.innerHTML = html;

    // Editar anotação
    document.querySelectorAll('.edit-note').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = parseInt(icon.dataset.id);
            const note = notes.find(n => n.id === noteId);
            if (note) {
                editingNoteId = note.id;
                noteModalTitle.textContent = 'Editar Anotação';
                noteTitleInput.value = note.title;
                noteSubjectInput.value = note.subject;
                noteContentInput.value = note.content || '';
                selectedNoteColor = note.color || 'matematica';
                updateNoteColorOptions();
                noteModal.classList.add('active');
            }
        });
    });

    // Excluir anotação
    document.querySelectorAll('.delete-note').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = parseInt(icon.dataset.id);
            if (confirm('Excluir esta anotação?')) {
                notes = notes.filter(n => n.id !== noteId);
                renderNotes();
            }
        });
    });

    // Abrir anotação completa ao clicar no card
    document.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-note') || e.target.classList.contains('delete-note')) return;
            const noteId = parseInt(card.dataset.id);
            const note = notes.find(n => n.id === noteId);
            if (note) {
                alert(`${note.title}\n\n${note.subject}\n\n${note.content || 'Sem conteúdo'}`);
            }
        });
    });
}

    // ==================== PERFIL ====================
    const profileView = document.getElementById('profile-view');
    const menuItems = document.querySelectorAll('.menu-item:not(.logout)');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const text = item.querySelector('span').textContent;
            alert(`Abrindo: ${text}`);
        });
    });

    // ==================== NAVEGAÇÃO ====================
    const navItems = document.querySelectorAll('.nav-item');
    const homeView = document.getElementById('home-view');
    const calendarView = document.getElementById('calendar-view');
    const tasksViewNav = document.getElementById('tasks-view');
    const notesViewNav = document.getElementById('notes-view');
    const profileViewNav = document.getElementById('profile-view');
    const homeOnlySections = document.querySelectorAll('.home-only');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const view = item.dataset.view;
            
            if (view === 'home') {
                homeView?.classList.remove('hidden');
                calendarView?.classList.add('hidden');
                tasksViewNav?.classList.add('hidden');
                notesViewNav?.classList.add('hidden');
                profileViewNav?.classList.add('hidden');
                homeOnlySections.forEach(section => {
                    if (section) section.style.display = 'block';
                });
            } else if (view === 'calendar') {
                homeView?.classList.add('hidden');
                calendarView?.classList.remove('hidden');
                tasksViewNav?.classList.add('hidden');
                notesViewNav?.classList.add('hidden');
                profileViewNav?.classList.add('hidden');
                homeOnlySections.forEach(section => {
                    if (section) section.style.display = 'none';
                });
                renderCalendar();
            } else if (view === 'tasks') {
                homeView?.classList.add('hidden');
                calendarView?.classList.add('hidden');
                tasksViewNav?.classList.remove('hidden');
                notesViewNav?.classList.add('hidden');
                profileViewNav?.classList.add('hidden');
                homeOnlySections.forEach(section => {
                    if (section) section.style.display = 'none';
                });
                renderTasks();
            } else if (view === 'notes') {
                homeView?.classList.add('hidden');
                calendarView?.classList.add('hidden');
                tasksViewNav?.classList.add('hidden');
                notesViewNav?.classList.remove('hidden');
                profileViewNav?.classList.add('hidden');
                homeOnlySections.forEach(section => {
                    if (section) section.style.display = 'none';
                });
                renderNotes();
            } else if (view === 'profile') {
                homeView?.classList.add('hidden');
                calendarView?.classList.add('hidden');
                tasksViewNav?.classList.add('hidden');
                notesViewNav?.classList.add('hidden');
                profileViewNav?.classList.remove('hidden');
                homeOnlySections.forEach(section => {
                    if (section) section.style.display = 'none';
                });
            }
        });
    });
    // ==================== PERFIL - TODAS AS FUNÇÕES ====================
// ==================== PERFIL - CORRIGIR BOTÃO DE VOLTAR ====================

// FUNÇÃO GLOBAL PARA FECHAR MODAIS (FORA DO DOMContentLoaded)
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
};

// DENTRO DO DOMContentLoaded, ADICIONE:

// ==================== BOTÕES DE VOLTAR DOS MODAIS ====================
document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        if (modalId) {
            closeModal(modalId);
        }
    });
});

// ==================== ABRIR MODAIS DO PERFIL ====================
const profileMenuItems = document.querySelectorAll('.profile-menu .menu-item:not(.logout)');

profileMenuItems.forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        
        if (action === 'dados') {
            document.getElementById('dados-modal').classList.add('active');
            loadProfileData();
        } else if (action === 'seguranca') {
            document.getElementById('seguranca-modal').classList.add('active');
        } else if (action === 'notificacoes') {
            document.getElementById('notificacoes-modal').classList.add('active');
            loadNotificacoes();
        } else if (action === 'aparencia') {
            document.getElementById('aparencia-modal').classList.add('active');
            loadAparencia();
        } else if (action === 'ajuda') {
            document.getElementById('ajuda-modal').classList.add('active');
        }
    });
});

// ==================== RESTO DO CÓDIGO DO PERFIL ====================
// ... (mantenha o resto do código que já fizemos)



// ==================== DADOS PESSOAIS ====================
// ==================== DADOS PESSOAIS - COM FOTO ====================

// Elementos do avatar
const btnChangeAvatar = document.getElementById('btn-change-avatar');
const avatarInput = document.getElementById('avatar-input');
const avatarPreview = document.getElementById('avatar-preview');
const profileAvatar = document.querySelector('.profile-avatar');

// Carregar dados do perfil (INCLUINDO FOTO)
function loadProfileData() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (usuario) {
        document.getElementById('profile-name-input').value = usuario.nome || '';
        document.getElementById('profile-email-input').value = usuario.email || '';
        document.getElementById('profile-phone-input').value = usuario.phone || '';
        document.getElementById('profile-birth-input').value = usuario.birth || '';
        
        // Carregar foto se existir
        if (usuario.avatar) {
            avatarPreview.innerHTML = `<img src="${usuario.avatar}" alt="Avatar">`;
            if (profileAvatar) {
                profileAvatar.innerHTML = `<img src="${usuario.avatar}" alt="Avatar">`;
            }
        } else {
            const initial = usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U';
            avatarPreview.innerHTML = `<span>${initial}</span>`;
            if (profileAvatar) {
                profileAvatar.innerHTML = `<span>${initial}</span>`;
            }
        }
    }
}

// Clicar no botão de câmera
if (btnChangeAvatar) {
    btnChangeAvatar.addEventListener('click', () => {
        avatarInput.click();
    });
}

// Quando selecionar uma imagem
if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (file) {
            // Verificar se é imagem
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione uma imagem!');
                return;
            }
            
            // Verificar tamanho (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB!');
                return;
            }
            
            // Converter para Base64
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Image = event.target.result;
                
                // Atualizar preview
                avatarPreview.innerHTML = `<img src="${base64Image}" alt="Avatar">`;
                
                // Salvar no localStorage
                const usuario = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
                usuario.avatar = base64Image;
                localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
                
                // Atualizar avatar no perfil principal
                if (profileAvatar) {
                    profileAvatar.innerHTML = `<img src="${base64Image}" alt="Avatar">`;
                }
                
                alert('Foto de perfil atualizada!');
            };
            reader.readAsDataURL(file);
        }
        
        // Limpar input para permitir selecionar a mesma imagem novamente
        avatarInput.value = '';
    });
}

// Atualizar nome no avatar quando salvar dados
document.getElementById('btn-save-dados')?.addEventListener('click', () => {
    const nome = document.getElementById('profile-name-input').value.trim();
    const email = document.getElementById('profile-email-input').value.trim();
    const phone = document.getElementById('profile-phone-input').value.trim();
    const birth = document.getElementById('profile-birth-input').value;

    if (!nome || !email) {
        alert('Preencha nome e e-mail!');
        return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
    usuario.nome = nome;
    usuario.email = email;
    usuario.phone = phone;
    usuario.birth = birth;
    
    // Manter o avatar se já existir
    if (!usuario.avatar && nome) {
        const initial = nome.charAt(0).toUpperCase();
        avatarPreview.innerHTML = `<span>${initial}</span>`;
        if (profileAvatar) {
            profileAvatar.innerHTML = `<span>${initial}</span>`;
        }
    }
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    
    // Atualizar nome no header e perfil
    document.querySelector('.greeting h1').textContent = nome.split(' ')[0];
    document.querySelector('.profile-name').textContent = nome;
    document.querySelector('.profile-email').textContent = email;
    
    closeModal('dados-modal');
    alert('Dados atualizados com sucesso!');
});
function loadProfileData() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (usuario) {
        document.getElementById('profile-name-input').value = usuario.nome || '';
        document.getElementById('profile-email-input').value = usuario.email || '';
        document.getElementById('avatar-preview').textContent = usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U';
    }
}

document.getElementById('btn-save-dados')?.addEventListener('click', () => {
    const nome = document.getElementById('profile-name-input').value.trim();
    const email = document.getElementById('profile-email-input').value.trim();
    const phone = document.getElementById('profile-phone-input').value.trim();
    const birth = document.getElementById('profile-birth-input').value;

    if (!nome || !email) {
        alert('Preencha nome e e-mail!');
        return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
    usuario.nome = nome;
    usuario.email = email;
    usuario.phone = phone;
    usuario.birth = birth;
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    
    // Atualizar nome no header e perfil
    document.querySelector('.greeting h1').textContent = nome.split(' ')[0];
    document.querySelector('.profile-name').textContent = nome;
    document.querySelector('.profile-email').textContent = email;
    document.getElementById('avatar-preview').textContent = nome.charAt(0).toUpperCase();
    
    closeModal('dados-modal');
    alert('Dados atualizados com sucesso!');
});

// ==================== SEGURANÇA ====================
document.getElementById('btn-save-senha')?.addEventListener('click', () => {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Preencha todos os campos!');
        return;
    }

    if (newPassword.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
    }

    // Aqui você integraria com Firebase para mudar a senha
    alert('Senha alterada com sucesso!');
    closeModal('seguranca-modal');
    
    // Limpar campos
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
});

// ==================== NOTIFICAÇÕES ====================
function loadNotificacoes() {
    const settings = JSON.parse(localStorage.getItem('notificacoesSettings')) || {
        push: true,
        email: false,
        aulas: true,
        tarefas: true
    };
    
    document.getElementById('toggle-push').checked = settings.push;
    document.getElementById('toggle-email').checked = settings.email;
    document.getElementById('toggle-aulas').checked = settings.aulas;
    document.getElementById('toggle-tarefas').checked = settings.tarefas;
}

document.getElementById('btn-save-notificacoes')?.addEventListener('click', () => {
    const settings = {
        push: document.getElementById('toggle-push').checked,
        email: document.getElementById('toggle-email').checked,
        aulas: document.getElementById('toggle-aulas').checked,
        tarefas: document.getElementById('toggle-tarefas').checked
    };
    
    localStorage.setItem('notificacoesSettings', JSON.stringify(settings));
    closeModal('notificacoes-modal');
    alert('Notificações salvas!');
});

// ==================== APARÊNCIA ====================
function loadAparencia() {
    const appearance = JSON.parse(localStorage.getItem('appearanceSettings')) || {
        theme: 'dark',
        accent: '#8b5cf6',
        fontSize: 14
    };
    
    selectedTheme = appearance.theme;
    selectedAccent = appearance.accent;
    
    // Atualizar botões de tema
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === selectedTheme);
    });
    
    // Atualizar cores
    document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.accent === selectedAccent);
    });
    
    // Atualizar slider
    document.getElementById('font-size-slider').value = appearance.fontSize;
}

// Selecionar tema
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTheme = btn.dataset.theme;
    });
});

// Selecionar cor de destaque
document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('#aparencia-modal .color-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        selectedAccent = option.dataset.accent;
    });
});

document.getElementById('btn-save-aparencia')?.addEventListener('click', () => {
    const appearance = {
        theme: selectedTheme,
        accent: selectedAccent,
        fontSize: document.getElementById('font-size-slider').value
    };
    
    localStorage.setItem('appearanceSettings', JSON.stringify(appearance));
    
    // Aplicar cor de destaque
    document.documentElement.style.setProperty('--accent-purple', selectedAccent);
    
    closeModal('aparencia-modal');
    alert('Aparência salva!');
});

// ==================== AJUDA ====================
function toggleFaq(element) {
    element.classList.toggle('active');
}

document.getElementById('btn-contato')?.addEventListener('click', () => {
    window.open('https://wa.me/5500000000000', '_blank');
});

document.getElementById('btn-termos')?.addEventListener('click', () => {
    alert('Termos de Uso\n\n1. Aceite os termos...\n2. Use o app responsavelmente...');
});

document.getElementById('btn-privacidade')?.addEventListener('click', () => {
    alert('Política de Privacidade\n\nSeus dados estão seguros...');
});

document.getElementById('btn-avaliar')?.addEventListener('click', () => {
    alert('Obrigado por avaliar! ⭐⭐⭐⭐⭐');
});

// ==================== LOGOUT ====================
document.querySelector('.menu-item.logout')?.addEventListener('click', () => {
    if (confirm('Deseja realmente sair da conta?')) {
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('notificacoesSettings');
        localStorage.removeItem('appearanceSettings');
        
        // Se usar Firebase:
        // firebase.auth().signOut();
        
        window.location.href = '../login/index.html';
    }
});

// ==================== CARREGAR CONFIGURAÇÕES SALVAS ====================
function loadSavedSettings() {
    const appearance = JSON.parse(localStorage.getItem('appearanceSettings'));
    if (appearance) {
        if (appearance.accent) {
            document.documentElement.style.setProperty('--accent-purple', appearance.accent);
        }
        if (appearance.fontSize) {
            document.documentElement.style.setProperty('font-size', appearance.fontSize + 'px');
        }
    }
}

// Carregar configurações ao iniciar
loadSavedSettings();

    // ==================== INICIALIZAÇÃO ====================
    renderSchedule();
    renderClasses();
    renderNotifications();
    renderCalendar();
    renderTasks();
    renderNotes();
});
