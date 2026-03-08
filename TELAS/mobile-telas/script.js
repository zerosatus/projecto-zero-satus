// ==================== VARIÁVEIS GLOBAIS ====================
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
let notifications = [];
let weeklySchedule = {};
let timeSlots = [];
let tasks = [];
let notes = [];
let calendarEvents = [];

// ==================== VERIFICAÇÃO DE LOGIN ====================
document.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        carregarTodosDados();
        atualizarInterfaceUsuario();
        
        // Inicializar componentes
        renderSchedule();
        renderClasses();
        renderNotifications();
        renderCalendar();
        renderTasks();
        renderNotes();
        
        // Configurar listeners
        setupEventListeners();
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ==================== CARREGAR TODOS OS DADOS ====================
function carregarTodosDados() {
    if (!usuarioAtual) return;
    
    const email = usuarioAtual.email;
    
    // Carregar tarefas
    const tarefasKey = `tarefas_${email}`;
    const tarefasSalvas = localStorage.getItem(tarefasKey);
    tarefas = tarefasSalvas ? JSON.parse(tarefasSalvas) : [];
    
    // Carregar anotações
    const anotacoesKey = `anotacoes_${email}`;
    const anotacoesSalvas = localStorage.getItem(anotacoesKey);
    anotacoes = anotacoesSalvas ? JSON.parse(anotacoesSalvas) : [];
    
    // Carregar eventos
    const eventosKey = `eventos_${email}`;
    const eventosSalvas = localStorage.getItem(eventosKey);
    eventos = eventosSalvas ? JSON.parse(eventosSalvas) : [];
    
    // Converter eventos para formato do calendário mobile
    converterEventosParaCalendario();
    
    // Carregar notificações
    const notificacoesKey = `notificacoes_${email}`;
    const notificacoesSalvas = localStorage.getItem(notificacoesKey);
    notifications = notificacoesSalvas ? JSON.parse(notificacoesSalvas) : gerarNotificacoesIniciais();
    
    // Carregar horário semanal
    const horarioKey = `horario_${email}`;
    const horarioSalvo = localStorage.getItem(horarioKey);
    if (horarioSalvo) {
        const horarioData = JSON.parse(horarioSalvo);
        weeklySchedule = horarioData.weeklySchedule || {};
        timeSlots = horarioData.timeSlots || ['08:00', '09:00', '10:00', '14:00'];
    } else {
        weeklySchedule = {
            'Seg': [
                { hora: '08:00', materia: 'Matemática', color: '#6366f1', professor: '' },
                { hora: '09:00', materia: 'Química', color: '#10b981', professor: '' },
                { hora: '14:00', materia: 'Matemática', color: '#6366f1', professor: '' }
            ],
            'Ter': [
                { hora: '08:00', materia: 'Português', color: '#ec4899', professor: '' },
                { hora: '09:00', materia: 'Biologia', color: '#3b82f6', professor: '' },
                { hora: '10:00', materia: 'Redação', color: '#2563eb', professor: '' }
            ],
            'Qua': [
                { hora: '08:00', materia: 'Física', color: '#ef4444', professor: '' },
                { hora: '09:00', materia: 'Inglês', color: '#8b5cf6', professor: '' },
                { hora: '14:00', materia: 'Química', color: '#10b981', professor: '' }
            ],
            'Qui': [
                { hora: '08:00', materia: 'História', color: '#f59e0b', professor: '' },
                { hora: '10:00', materia: 'Física', color: '#ef4444', professor: '' }
            ],
            'Sex': [
                { hora: '08:00', materia: 'História', color: '#f59e0b', professor: '' },
                { hora: '09:00', materia: 'Geografia', color: '#a855f7', professor: '' }
            ]
        };
        timeSlots = ['08:00', '09:00', '10:00', '14:00'];
    }
    
    // Carregar tarefas (formato mobile)
    const tasksKey = `tasks_${email}`;
    const tasksSalvas = localStorage.getItem(tasksKey);
    tasks = tasksSalvas ? JSON.parse(tasksSalvas) : converterTarefasParaMobile();
    
    // Carregar anotações (formato mobile)
    const notesKey = `notes_${email}`;
    const notesSalvas = localStorage.getItem(notesKey);
    notes = notesSalvas ? JSON.parse(notesSalvas) : converterAnotacoesParaMobile();
    
    // Atualizar badges
    atualizarBadges();
}

// ==================== CONVERTER EVENTOS PARA CALENDÁRIO ====================
function converterEventosParaCalendario() {
    calendarEvents = eventos.map(evento => ({
        id: evento.id || Date.now() + Math.random(),
        title: evento.title,
        date: `${evento.year}-${String(evento.month + 1).padStart(2, '0')}-${String(evento.day).padStart(2, '0')}`,
        start: evento.time || '08:00',
        end: evento.endTime || '09:00',
        type: evento.type || 'outro',
        color: evento.color || getCorPorTipo(evento.type)
    }));
}

function getCorPorTipo(tipo) {
    const cores = {
        'prova': '#ef4444',
        'trabalho': '#f59e0b',
        'apresentacao': '#3b82f6',
        'reuniao': '#8b5cf6',
        'aula': '#10b981'
    };
    return cores[tipo] || '#8b5cf6';
}

// ==================== CONVERTER TAREFAS PARA FORMATO MOBILE ====================
function converterTarefasParaMobile() {
    return tarefas.map(tarefa => {
        const corMap = {
            'matematica': '#6366f1',
            'portugues': '#ec4899',
            'fisica': '#ef4444',
            'quimica': '#10b981',
            'biologia': '#3b82f6',
            'historia': '#f59e0b',
            'geografia': '#a855f7',
            'ingles': '#8b5cf6'
        };
        
        return {
            id: tarefa.id || Date.now() + Math.random(),
            title: tarefa.nome,
            subject: getNomeDisciplina(tarefa.disciplina),
            date: tarefa.prazo || 'Sem data',
            color: corMap[tarefa.disciplina] || '#6366f1',
            completed: tarefa.concluida || false,
            priority: tarefa.prioridade || 'media'
        };
    });
}

function getNomeDisciplina(disciplina) {
    const nomes = {
        'matematica': 'Matemática',
        'portugues': 'Português',
        'historia': 'História',
        'fisica': 'Física',
        'quimica': 'Química',
        'biologia': 'Biologia',
        'geografia': 'Geografia',
        'ingles': 'Inglês'
    };
    return nomes[disciplina] || disciplina || 'Geral';
}

// ==================== CONVERTER ANOTAÇÕES PARA FORMATO MOBILE ====================
function converterAnotacoesParaMobile() {
    return anotacoes.map(anotacao => {
        const data = new Date(anotacao.dataModificacao || Date.now());
        return {
            id: anotacao.id || Date.now() + Math.random(),
            title: anotacao.titulo,
            subject: 'Geral',
            content: anotacao.conteudo ? anotacao.conteudo.replace(/<[^>]*>/g, '').substring(0, 100) : '',
            color: 'matematica',
            date: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        };
    });
}

// ==================== GERAR NOTIFICAÇÕES INICIAIS ====================
function gerarNotificacoesIniciais() {
    return [
        {
            id: 1,
            type: 'aula',
            title: 'Aula de Matemática',
            message: 'Lembrete: Aula de Matemática às 14h hoje',
            time: new Date().toISOString(),
            read: false
        },
        {
            id: 2,
            type: 'tarefa',
            title: 'Tarefa Pendente',
            message: 'Lista de Exercícios de Física para entregar amanhã',
            time: new Date(Date.now() - 3600000).toISOString(),
            read: false
        }
    ];
}

// ==================== ATUALIZAR INTERFACE DO USUÁRIO ====================
function atualizarInterfaceUsuario() {
    if (!usuarioAtual) return;
    
    const headerName = document.getElementById('header-name');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileInitial = document.getElementById('profile-initial');
    
    if (headerName) headerName.textContent = usuarioAtual.nome.split(' ')[0];
    if (profileName) profileName.textContent = usuarioAtual.nome;
    if (profileEmail) profileEmail.textContent = usuarioAtual.email;
    if (profileInitial) profileInitial.textContent = usuarioAtual.nome.charAt(0).toUpperCase();
    
    // Atualizar avatar se existir
    const profileAvatar = document.querySelector('.profile-avatar');
    if (profileAvatar && usuarioAtual.avatar) {
        profileAvatar.innerHTML = `<img src="${usuarioAtual.avatar}" alt="Avatar">`;
    }
}

// ==================== ATUALIZAR BADGES ====================
function atualizarBadges() {
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
    
    // Atualizar cards de resumo
    const totalTarefas = tasks.length;
    const tarefasConcluidas = tasks.filter(t => t.completed).length;
    const tarefasPendentes = totalTarefas - tarefasConcluidas;
    
    const cardTarefas = document.querySelector('.card .card-number');
    if (cardTarefas) {
        const cards = document.querySelectorAll('.card .card-number');
        if (cards.length >= 3) {
            cards[0].textContent = totalTarefas;
            cards[1].textContent = tarefasConcluidas;
            cards[2].textContent = tarefasPendentes;
        }
    }
}

// ==================== SALVAR DADOS ====================
function salvarHorario() {
    if (!usuarioAtual) return;
    const horarioKey = `horario_${usuarioAtual.email}`;
    localStorage.setItem(horarioKey, JSON.stringify({ weeklySchedule, timeSlots }));
}

function salvarNotificacoes() {
    if (!usuarioAtual) return;
    const notificacoesKey = `notificacoes_${usuarioAtual.email}`;
    localStorage.setItem(notificacoesKey, JSON.stringify(notifications));
}

function salvarTasks() {
    if (!usuarioAtual) return;
    const tasksKey = `tasks_${usuarioAtual.email}`;
    localStorage.setItem(tasksKey, JSON.stringify(tasks));
    
    // Sincronizar com tarefas principais
    sincronizarTarefasPrincipais();
}

function salvarNotes() {
    if (!usuarioAtual) return;
    const notesKey = `notes_${usuarioAtual.email}`;
    localStorage.setItem(notesKey, JSON.stringify(notes));
    
    // Sincronizar com anotações principais
    sincronizarAnotacoesPrincipais();
}

function salvarCalendarEvents() {
    if (!usuarioAtual) return;
    const eventosKey = `eventos_${usuarioAtual.email}`;
    localStorage.setItem(eventosKey, JSON.stringify(eventos));
}

// ==================== SINCRONIZAR COM MÓDULOS PRINCIPAIS ====================
function sincronizarTarefasPrincipais() {
    const tarefasPrincipais = tasks.map(task => ({
        id: task.id,
        nome: task.title,
        disciplina: getDisciplinaFromColor(task.color),
        prioridade: task.priority || 'media',
        prazo: task.date !== 'Sem data' ? task.date : '',
        concluida: task.completed,
        dataCriacao: new Date().toISOString()
    }));
    
    if (!usuarioAtual) return;
    const tarefasKey = `tarefas_${usuarioAtual.email}`;
    localStorage.setItem(tarefasKey, JSON.stringify(tarefasPrincipais));
}

function sincronizarAnotacoesPrincipais() {
    const anotacoesPrincipais = notes.map(note => ({
        id: note.id,
        titulo: note.title,
        conteudo: `<p>${note.content || ''}</p>`,
        dataModificacao: new Date().toISOString(),
        dataCriacao: new Date().toISOString()
    }));
    
    if (!usuarioAtual) return;
    const anotacoesKey = `anotacoes_${usuarioAtual.email}`;
    localStorage.setItem(anotacoesKey, JSON.stringify(anotacoesPrincipais));
}

function getDisciplinaFromColor(color) {
    const mapa = {
        '#6366f1': 'matematica',
        '#ec4899': 'portugues',
        '#ef4444': 'fisica',
        '#10b981': 'quimica',
        '#3b82f6': 'biologia',
        '#f59e0b': 'historia',
        '#a855f7': 'geografia',
        '#8b5cf6': 'ingles'
    };
    return mapa[color] || 'outros';
}

// ==================== FUNÇÕES DE NOTIFICAÇÃO ====================
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

function renderNotificationsModal(filter = 'all') {
    const list = document.getElementById('notifications-list-modal');
    if (!list) return;
    
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
    
    // Eventos
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

function markAsRead(id) {
    const index = notifications.findIndex(n => n.id === id);
    if (index > -1) {
        notifications[index].read = true;
        salvarNotificacoes();
        atualizarBadges();
        renderNotificationsModal();
    }
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    salvarNotificacoes();
    atualizarBadges();
    renderNotificationsModal();
}

function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    salvarNotificacoes();
    atualizarBadges();
    renderNotificationsModal();
}

function clearAllNotifications() {
    if (confirm('Limpar todas as notificações?')) {
        notifications = [];
        salvarNotificacoes();
        atualizarBadges();
        renderNotificationsModal();
    }
}

// ==================== FUNÇÕES DE HORÁRIO ====================
function renderSchedule() {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);

    timeSlots.sort().forEach(time => {
        html += `<div class="time-slot">${time}</div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.hora === time);
            if (classItem) {
                html += `
                    <div class="class-cell">
                        <div class="class-block subject-custom" style="background-color: ${classItem.color}">
                            ${classItem.materia}
                        </div>
                    </div>
                `;
            } else {
                html += `<div class="class-cell"></div>`;
            }
        });
    });

    grid.innerHTML = html;
}

function renderEditSchedule() {
    const grid = document.getElementById('edit-schedule-grid');
    if (!grid) return;
    
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);

    timeSlots.sort().forEach(time => {
        html += `<div class="time-slot">${time} 
            <button class="btn-delete-row" data-time="${time}">
                <ion-icon name="trash-outline"></ion-icon>
            </button>
        </div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.hora === time);
            if (classItem) {
                html += `<div class="edit-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color}">
                        ${classItem.materia}
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
    
    // Eventos
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
                salvarHorario();
                renderEditSchedule();
                renderSchedule();
                showToast('Horário removido!', 'success');
            }
        });
    });

    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.dataset.day;
            const time = btn.dataset.time;
            openSubjectModal(null, day, time);
        });
    });
}

// ==================== FUNÇÕES DE CALENDÁRIO ====================
let currentDate = new Date();
let selectedDay = currentDate.getDate();

function renderCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthYear = document.getElementById('current-month-year');
    const eventsDate = document.getElementById('events-date');
    
    if (!calendarDays) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    if (currentMonthYear) currentMonthYear.textContent = `${monthNames[month]} de ${year}`;
    if (eventsDate) eventsDate.textContent = `Eventos do dia ${selectedDay}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
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
            if (eventsDate) eventsDate.textContent = `Eventos do dia ${selectedDay}`;
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
        eventsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhum evento neste dia</p>';
        return;
    }

    let html = '';
    dayEvents.forEach(event => {
        const iconMap = { 'aula': 'book', 'prova': 'document', 'tarefa': 'checkbox', 'outro': 'calendar' };
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

    document.querySelectorAll('.delete-event').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventId = parseInt(icon.dataset.id);
            if (confirm('Excluir este evento?')) {
                calendarEvents = calendarEvents.filter(ev => ev.id !== eventId);
                eventos = eventos.filter(ev => ev.id !== eventId);
                salvarCalendarEvents();
                renderEvents();
                renderCalendar();
                showToast('Evento excluído!', 'success');
            }
        });
    });
}

// ==================== FUNÇÕES DE TAREFAS ====================
let currentTaskFilter = 'todos';

function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
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
        const prioridadeClass = task.priority === 'alta' ? 'prioridade-alta' : 
                                task.priority === 'media' ? 'prioridade-media' : 'prioridade-baixa';
        
        html += `
            <div class="task-item ${task.completed ? 'completed' : ''} ${prioridadeClass}" data-id="${task.id}">
                <div class="task-color" style="background-color: ${task.color}"></div>
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-subject">${task.subject}</div>
                    <div class="task-date"><ion-icon name="calendar-outline"></ion-icon> ${task.date}</div>
                </div>
                <div class="task-check ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                    ${task.completed ? '<ion-icon name="checkmark-outline"></ion-icon>' : ''}
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
                salvarTasks();
                atualizarBadges();
                renderTasks();
                
                // Criar notificação
                if (task.completed) {
                    addNotification('tarefa', 'Tarefa Concluída', `Tarefa "${task.title}" marcada como concluída`);
                }
            }
        });
    });
}

// ==================== FUNÇÕES DE ANOTAÇÕES ====================
function renderNotes(searchTerm = '') {
    const notesGrid = document.getElementById('notes-grid');
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
            <div class="note-card ${note.color || 'matematica'}" data-id="${note.id}">
                <div>
                    <div class="note-title">${note.title}</div>
                    <div class="note-subject">${note.subject}</div>
                </div>
                <div class="note-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <div class="note-date">${note.date}</div>
                    <div class="note-actions">
                        <ion-icon name="trash-outline" class="delete-note" data-id="${note.id}" style="cursor: pointer;"></ion-icon>
                    </div>
                </div>
            </div>
        `;
    });
    
    notesGrid.innerHTML = html;

    document.querySelectorAll('.delete-note').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = parseInt(icon.dataset.id);
            if (confirm('Excluir esta anotação?')) {
                notes = notes.filter(n => n.id !== noteId);
                salvarNotes();
                renderNotes();
                showToast('Anotação excluída!', 'success');
            }
        });
    });
}

// ==================== FUNÇÕES DOS MODAIS ====================
let editingSubject = null;
let selectedSubjectColor = '#6366f1';

function openSubjectModal(subject, day, time) {
    const subjectModal = document.getElementById('subject-modal');
    const subjectModalTitle = document.getElementById('subject-modal-title');
    const subjectNameInput = document.getElementById('subject-name-input');
    const subjectTeacherInput = document.getElementById('subject-teacher-input');
    const subjectStartInput = document.getElementById('subject-start-input');
    const subjectDayInput = document.getElementById('subject-day-input');
    
    if (!subjectModal) return;
    
    editingSubject = subject;
    
    if (subjectDayInput) subjectDayInput.value = day;
    
    if (subject) {
        subjectModalTitle.textContent = 'Editar Matéria';
        if (subjectNameInput) subjectNameInput.value = subject.materia;
        if (subjectTeacherInput) subjectTeacherInput.value = subject.professor || '';
        if (subjectStartInput) subjectStartInput.value = subject.hora;
        selectedSubjectColor = subject.color;
    } else {
        subjectModalTitle.textContent = 'Adicionar Matéria';
        if (subjectNameInput) subjectNameInput.value = '';
        if (subjectTeacherInput) subjectTeacherInput.value = '';
        if (subjectStartInput) subjectStartInput.value = time;
        selectedSubjectColor = '#6366f1';
    }
    
    updateSubjectColorOptions();
    subjectModal.classList.add('active');
}

function updateSubjectColorOptions() {
    const subjectColorOptions = document.querySelectorAll('#subject-modal .color-option');
    subjectColorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedSubjectColor);
    });
}

// ==================== FUNÇÕES DE NOTIFICAÇÃO TOAST ====================
function showToast(mensagem, tipo = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#8b5cf6'};
        color: white;
        padding: 12px 24px;
        border-radius: 30px;
        font-size: 0.9rem;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease-out;
    `;
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function addNotification(type, title, message) {
    const newNotification = {
        id: Date.now(),
        type: type,
        title: title,
        message: message,
        time: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(newNotification);
    salvarNotificacoes();
    atualizarBadges();
}

// ==================== SETUP DE EVENT LISTENERS ====================
function setupEventListeners() {
    // Navegação
    const navItems = document.querySelectorAll('.nav-item');
    const homeView = document.getElementById('home-view');
    const calendarView = document.getElementById('calendar-view');
    const tasksView = document.getElementById('tasks-view');
    const notesView = document.getElementById('notes-view');
    const profileView = document.getElementById('profile-view');
    const homeOnlySections = document.querySelectorAll('.home-only');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const view = item.dataset.view;
            
            if (homeView) homeView.classList.add('hidden');
            if (calendarView) calendarView.classList.add('hidden');
            if (tasksView) tasksView.classList.add('hidden');
            if (notesView) notesView.classList.add('hidden');
            if (profileView) profileView.classList.add('hidden');
            
            if (view === 'home') {
                if (homeView) homeView.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'block');
            } else if (view === 'calendar') {
                if (calendarView) calendarView.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderCalendar();
            } else if (view === 'tasks') {
                if (tasksView) tasksView.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderTasks();
            } else if (view === 'notes') {
                if (notesView) notesView.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderNotes();
            } else if (view === 'profile') {
                if (profileView) profileView.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
            }
        });
    });

    // Notificações
    const notificationBell = document.getElementById('notification-bell');
    const notificationsModal = document.getElementById('notifications-modal');
    const btnCloseNotifications = document.getElementById('btn-close-notifications');
    const btnMarkRead = document.getElementById('btn-mark-read');
    const btnClearAll = document.getElementById('btn-clear-all');
    const notificationTabs = document.querySelectorAll('.notification-tab');

    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            notificationsModal.classList.add('active');
            renderNotificationsModal('all');
        });
    }

    if (btnCloseNotifications) {
        btnCloseNotifications.addEventListener('click', () => {
            notificationsModal.classList.remove('active');
        });
    }

    notificationsModal?.addEventListener('click', (e) => {
        if (e.target === notificationsModal) {
            notificationsModal.classList.remove('active');
        }
    });

    if (btnMarkRead) {
        btnMarkRead.addEventListener('click', markAllAsRead);
    }

    if (btnClearAll) {
        btnClearAll.addEventListener('click', clearAllNotifications);
    }

    notificationTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            notificationTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });

    // Editar horário
    const toggleBtn = document.getElementById('toggle-edit-mode');
    const editModal = document.getElementById('edit-modal');
    const btnBack = document.getElementById('btn-back');
    const btnSave = document.getElementById('btn-save');
    const btnAddTime = document.getElementById('btn-add-time');
    const btnCancelTime = document.getElementById('btn-cancel-time');
    const newTimeInput = document.getElementById('new-time-input');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (editModal) {
                editModal.classList.add('active');
                renderEditSchedule();
            }
        });
    }

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            if (editModal) editModal.classList.remove('active');
            renderSchedule();
        });
    }

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            if (editModal) editModal.classList.remove('active');
            renderSchedule();
            showToast('Horário salvo!', 'success');
        });
    }

    if (btnAddTime) {
        btnAddTime.addEventListener('click', () => {
            const newTime = newTimeInput?.value;
            if (newTime && !timeSlots.includes(newTime)) {
                timeSlots.push(newTime);
                timeSlots.sort();
                salvarHorario();
                renderEditSchedule();
                if (newTimeInput) newTimeInput.value = '11:00';
                showToast('Horário adicionado!', 'success');
            } else {
                showToast('Horário já existe ou inválido!', 'error');
            }
        });
    }

    if (btnCancelTime) {
        btnCancelTime.addEventListener('click', () => {
            if (newTimeInput) newTimeInput.value = '11:00';
        });
    }

    // Modal de matéria
    const btnCloseSubject = document.querySelector('[data-modal="subject-modal"]');
    const btnSaveSubject = document.getElementById('btn-save-subject');
    const subjectNameInput = document.getElementById('subject-name-input');
    const subjectTeacherInput = document.getElementById('subject-teacher-input');
    const subjectStartInput = document.getElementById('subject-start-input');
    const subjectDayInput = document.getElementById('subject-day-input');
    const subjectColorOptions = document.querySelectorAll('#subject-modal .color-option');

    subjectColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            subjectColorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedSubjectColor = option.dataset.color;
        });
    });

    if (btnCloseSubject) {
        btnCloseSubject.addEventListener('click', () => {
            document.getElementById('subject-modal').classList.remove('active');
        });
    }

    if (btnSaveSubject) {
        btnSaveSubject.addEventListener('click', () => {
            const name = subjectNameInput?.value.trim();
            const teacher = subjectTeacherInput?.value.trim();
            const startTime = subjectStartInput?.value;
            const day = subjectDayInput?.value;

            if (!name) {
                showToast('Preencha o nome da matéria!', 'error');
                return;
            }

            if (!startTime || !day) {
                showToast('Selecione horário e dia!', 'error');
                return;
            }

            if (weeklySchedule[day]) {
                weeklySchedule[day] = weeklySchedule[day].filter(c => c.hora !== startTime);
            } else {
                weeklySchedule[day] = [];
            }

            weeklySchedule[day].push({
                hora: startTime,
                materia: name,
                color: selectedSubjectColor,
                professor: teacher
            });

            weeklySchedule[day].sort((a, b) => a.hora.localeCompare(b.hora));

            if (!timeSlots.includes(startTime)) {
                timeSlots.push(startTime);
                timeSlots.sort();
            }

            salvarHorario();
            showToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
            document.getElementById('subject-modal').classList.remove('active');
            renderSchedule();
            renderEditSchedule();
        });
    }

    // Navegação do calendário
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            selectedDay = 1;
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            selectedDay = 1;
            renderCalendar();
        });
    }

    // Botão novo evento
    const btnNewEvent = document.getElementById('btn-new-event');
    const eventModal = document.getElementById('event-modal');
    const btnCloseEvent = document.querySelector('[data-modal="event-modal"]');
    
    if (btnNewEvent) {
        btnNewEvent.addEventListener('click', () => {
            const eventModal = document.getElementById('event-modal');
            const eventTitle = document.getElementById('event-title');
            const eventDateInput = document.getElementById('event-date');
            
            if (eventModal) {
                if (eventTitle) eventTitle.value = '';
                if (eventDateInput) {
                    eventDateInput.value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                }
                eventModal.classList.add('active');
            }
        });
    }

    if (btnCloseEvent) {
        btnCloseEvent.addEventListener('click', () => {
            document.getElementById('event-modal').classList.remove('active');
        });
    }

    // Salvar evento
    const btnSaveEvent = document.getElementById('btn-save-event');
    if (btnSaveEvent) {
        btnSaveEvent.addEventListener('click', () => {
            const eventTitle = document.getElementById('event-title');
            const eventDateInput = document.getElementById('event-date');
            const eventStart = document.getElementById('event-start');
            const eventEnd = document.getElementById('event-end');
            
            const title = eventTitle?.value.trim();
            const date = eventDateInput?.value;
            const start = eventStart?.value;
            const end = eventEnd?.value;

            if (!title || !date) {
                showToast('Preencha título e data!', 'error');
                return;
            }

            const newEvent = {
                id: Date.now(),
                title: title,
                date: date,
                start: start || '08:00',
                end: end || '09:00',
                type: 'outro',
                color: '#8b5cf6'
            };

            calendarEvents.push(newEvent);
            
            // Converter para formato principal
            const eventDate = new Date(date);
            const novoEventoPrincipal = {
                id: newEvent.id,
                day: eventDate.getDate(),
                month: eventDate.getMonth(),
                year: eventDate.getFullYear(),
                title: title,
                type: 'outro',
                time: start || '08:00',
                endTime: end || '09:00',
                description: '',
                repeat: 'nao'
            };
            
            eventos.push(novoEventoPrincipal);
            salvarCalendarEvents();

            document.getElementById('event-modal').classList.remove('active');
            renderEvents();
            renderCalendar();
            showToast('Evento criado!', 'success');
            
            addNotification('evento', 'Novo Evento', `Evento "${title}" criado para ${date}`);
        });
    }

    // Filtros de tarefas
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTaskFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Botão adicionar tarefa
    const btnAddTask = document.getElementById('btn-add-task');
    const taskModal = document.getElementById('task-modal');
    const btnCloseTask = document.querySelector('[data-modal="task-modal"]');
    
    if (btnAddTask) {
        btnAddTask.addEventListener('click', () => {
            const taskModal = document.getElementById('task-modal');
            const taskModalTitle = document.getElementById('task-modal-title');
            const taskTitleInput = document.getElementById('task-title');
            
            if (taskModal) {
                taskModalTitle.textContent = 'Nova Tarefa';
                if (taskTitleInput) taskTitleInput.value = '';
                taskModal.classList.add('active');
            }
        });
    }

    if (btnCloseTask) {
        btnCloseTask.addEventListener('click', () => {
            document.getElementById('task-modal').classList.remove('active');
        });
    }

    // Salvar tarefa
    const btnSaveTask = document.getElementById('btn-save-task');
    if (btnSaveTask) {
        btnSaveTask.addEventListener('click', () => {
            const taskTitleInput = document.getElementById('task-title');
            const taskSubjectInput = document.getElementById('task-subject');
            const taskDateInput = document.getElementById('task-date');
            
            const title = taskTitleInput?.value.trim();

            if (!title) {
                showToast('Preencha o título!', 'error');
                return;
            }

            const newTask = {
                id: Date.now(),
                title: title,
                subject: taskSubjectInput?.value.trim() || 'Geral',
                date: taskDateInput?.value || 'Sem data',
                color: '#6366f1',
                completed: false,
                priority: 'media'
            };

            tasks.unshift(newTask);
            salvarTasks();

            document.getElementById('task-modal').classList.remove('active');
            renderTasks();
            atualizarBadges();
            showToast('Tarefa criada!', 'success');
            
            addNotification('tarefa', 'Nova Tarefa', `Tarefa "${title}" foi adicionada`);
        });
    }

    // Busca de anotações
    const notesSearchInput = document.getElementById('notes-search-input');
    if (notesSearchInput) {
        notesSearchInput.addEventListener('input', (e) => {
            renderNotes(e.target.value);
        });
    }

    // Botão adicionar anotação
    const btnAddNote = document.getElementById('btn-add-note');
    const noteModal = document.getElementById('note-modal');
    const btnCloseNote = document.querySelector('[data-modal="note-modal"]');
    
    if (btnAddNote) {
        btnAddNote.addEventListener('click', () => {
            const noteModal = document.getElementById('note-modal');
            const noteModalTitle = document.getElementById('note-modal-title');
            const noteTitleInput = document.getElementById('note-title');
            
            if (noteModal) {
                noteModalTitle.textContent = 'Nova Anotação';
                if (noteTitleInput) noteTitleInput.value = '';
                noteModal.classList.add('active');
            }
        });
    }

    if (btnCloseNote) {
        btnCloseNote.addEventListener('click', () => {
            document.getElementById('note-modal').classList.remove('active');
        });
    }

    // Salvar anotação
    const btnSaveNote = document.getElementById('btn-save-note');
    if (btnSaveNote) {
        btnSaveNote.addEventListener('click', () => {
            const noteTitleInput = document.getElementById('note-title');
            const noteSubjectInput = document.getElementById('note-subject');
            
            const title = noteTitleInput?.value.trim();

            if (!title) {
                showToast('Preencha o título!', 'error');
                return;
            }

            const newNote = {
                id: Date.now(),
                title: title,
                subject: noteSubjectInput?.value.trim() || 'Geral',
                content: '',
                color: 'matematica',
                date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            };

            notes.unshift(newNote);
            salvarNotes();

            document.getElementById('note-modal').classList.remove('active');
            renderNotes();
            showToast('Anotação criada!', 'success');
        });
    }

    // Perfil - menus
    const profileMenuItems = document.querySelectorAll('.profile-menu .menu-item:not(.logout)');
    
    profileMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'dados') {
                document.getElementById('dados-modal')?.classList.add('active');
                loadProfileData();
            } else if (action === 'seguranca') {
                document.getElementById('seguranca-modal')?.classList.add('active');
            } else if (action === 'notificacoes') {
                document.getElementById('notificacoes-modal')?.classList.add('active');
            } else if (action === 'aparencia') {
                document.getElementById('aparencia-modal')?.classList.add('active');
            } else if (action === 'ajuda') {
                document.getElementById('ajuda-modal')?.classList.add('active');
            }
        });
    });

    // Botões voltar dos modais
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) {
                document.getElementById(modalId)?.classList.remove('active');
            }
        });
    });

    // Salvar dados pessoais
    document.getElementById('btn-save-dados')?.addEventListener('click', () => {
        const nome = document.getElementById('profile-name-input')?.value.trim();
        const email = document.getElementById('profile-email-input')?.value.trim();

        if (!nome || !email) {
            showToast('Preencha nome e e-mail!', 'error');
            return;
        }

        usuarioAtual.nome = nome;
        usuarioAtual.email = email;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        
        atualizarInterfaceUsuario();
        
        document.getElementById('dados-modal')?.classList.remove('active');
        showToast('Dados atualizados!', 'success');
    });

    // Salvar senha
    document.getElementById('btn-save-senha')?.addEventListener('click', () => {
        const newPassword = document.getElementById('new-password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;

        if (!newPassword || !confirmPassword) {
            showToast('Preencha todos os campos!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Senha deve ter 6+ caracteres!', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Senhas não coincidem!', 'error');
            return;
        }

        usuarioAtual.senha = newPassword;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        
        document.getElementById('seguranca-modal')?.classList.remove('active');
        showToast('Senha alterada!', 'success');
        
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    });

    // Salvar notificações
    document.getElementById('btn-save-notificacoes')?.addEventListener('click', () => {
        const settings = {
            push: document.getElementById('toggle-push')?.checked || false,
            email: document.getElementById('toggle-email')?.checked || false,
            aulas: document.getElementById('toggle-aulas')?.checked || false,
            tarefas: document.getElementById('toggle-tarefas')?.checked || false
        };
        
        if (usuarioAtual) {
            usuarioAtual.notificacoes = settings;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        }
        
        document.getElementById('notificacoes-modal')?.classList.remove('active');
        showToast('Notificações salvas!', 'success');
    });

    // Salvar aparência
    document.getElementById('btn-save-aparencia')?.addEventListener('click', () => {
        const themeBtns = document.querySelectorAll('.theme-btn');
        let selectedTheme = 'dark';
        themeBtns.forEach(btn => {
            if (btn.classList.contains('active')) selectedTheme = btn.dataset.theme;
        });
        
        const accentOptions = document.querySelectorAll('#aparencia-modal .color-option');
        let selectedAccent = '#8b5cf6';
        accentOptions.forEach(opt => {
            if (opt.classList.contains('active')) selectedAccent = opt.dataset.accent;
        });
        
        const fontSize = document.getElementById('font-size-slider')?.value || 14;
        
        if (usuarioAtual) {
            usuarioAtual.aparencia = {
                theme: selectedTheme,
                accent: selectedAccent,
                fontSize: fontSize
            };
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        }
        
        document.getElementById('aparencia-modal')?.classList.remove('active');
        showToast('Aparência salva!', 'success');
    });

    // Logout
    document.querySelector('.menu-item.logout')?.addEventListener('click', () => {
        if (confirm('Deseja realmente sair da conta?')) {
            localStorage.removeItem('usuarioLogado');
            window.location.href = '../login/index.html';
        }
    });

    // FAQ
    window.toggleFaq = function(element) {
        element.classList.toggle('active');
    };

    // Contato
    document.getElementById('btn-contato')?.addEventListener('click', () => {
        window.open('https://wa.me/5500000000000', '_blank');
    });
}

function loadProfileData() {
    if (!usuarioAtual) return;
    
    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const phoneInput = document.getElementById('profile-phone-input');
    const birthInput = document.getElementById('profile-birth-input');
    const avatarPreview = document.getElementById('avatar-preview');
    
    if (nameInput) nameInput.value = usuarioAtual.nome || '';
    if (emailInput) emailInput.value = usuarioAtual.email || '';
    if (phoneInput) phoneInput.value = usuarioAtual.telefone || '';
    if (birthInput) birthInput.value = usuarioAtual.nascimento || '';
    if (avatarPreview) avatarPreview.textContent = usuarioAtual.nome ? usuarioAtual.nome.charAt(0).toUpperCase() : 'U';
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { transform: translate(-50%, 100px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideDown {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, 100px); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('%c📱 Mobile App Sincronizado', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');
console.log('%cDados integrados com os módulos principais!', 'color: #10b981; font-size: 14px;');
