document.addEventListener('DOMContentLoaded', () => {
    
    // ==================== VERIFICAR LOGIN ====================
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    // Atualizar nome do usuário
    if (usuarioLogado) {
        const headerName = document.getElementById('header-name');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileInitial = document.getElementById('profile-initial');
        
        if (headerName) headerName.textContent = usuarioLogado.nome.split(' ')[0];
        if (profileName) profileName.textContent = usuarioLogado.nome;
        if (profileEmail) profileEmail.textContent = usuarioLogado.email;
        if (profileInitial) profileInitial.textContent = usuarioLogado.nome.charAt(0).toUpperCase();
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

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            editModal.classList.remove('active');
            renderSchedule();
        });
    }

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            editModal.classList.remove('active');
            renderSchedule();
        });
    }

    if (btnAddTime) {
        btnAddTime.addEventListener('click', () => {
            const newTime = newTimeInput.value;
            if (newTime && !timeSlots.includes(newTime)) {
                timeSlots.push(newTime);
                timeSlots.sort();
                renderEditSchedule();
                newTimeInput.value = '11:00';
                showToast('Horário adicionado!', 'success');
            } else {
                showToast('Horário já existe ou inválido!', 'error');
            }
        });
    }

    if (btnCancelTime) {
        btnCancelTime.addEventListener('click', () => {
            newTimeInput.value = '11:00';
        });
    }

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
                    showToast('Horário removido!', 'success');
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
                    showToast('Matéria adicionada!', 'success');
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
                    showToast('Matéria atualizada!', 'success');
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

    let calendarEvents = [
        { id: 1, title: 'Aula de Matemática', date: '2026-03-01', start: '08:00', end: '09:30', type: 'aula', color: '#6366f1' },
        { id: 2, title: 'Grupo de Estudos', date: '2026-03-01', start: '14:00', end: '16:00', type: 'tarefa', color: '#10b981' }
    ];

    function renderCalendar() {
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
                eventsDate.textContent = `Eventos do dia ${selectedDay}`;
                renderEvents();
                renderCalendar();
            });
        });
        
        renderEvents();
    }

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
                    showToast('Evento excluído!', 'success');
                }
            });
        });
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // ==================== EVENTOS MODAL ====================
    let selectedEventType = 'aula';
    let selectedEventColor = '#8b5cf6';
    let editingEventId = null;

    const eventModal = document.getElementById('event-modal');
    const btnNewEvent = document.getElementById('btn-new-event');
    const btnCloseEvent = document.querySelector('[data-modal="event-modal"]');
    const btnSaveEvent = document.getElementById('btn-save-event');
    const eventTitle = document.getElementById('event-title');
    const eventDateInput = document.getElementById('event-date');
    const eventStart = document.getElementById('event-start');
    const eventEnd = document.getElementById('event-end');
    const typeBtns = document.querySelectorAll('.event-types .type-btn');
    const colorOptions = document.querySelectorAll('#event-modal .color-option');

    if (btnNewEvent) {
        btnNewEvent.addEventListener('click', () => {
            editingEventId = null;
            eventTitle.value = '';
            eventDateInput.value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
            eventStart.value = '08:00';
            eventEnd.value = '09:00';
            selectedEventType = 'aula';
            selectedEventColor = '#8b5cf6';
            updateTypeButtons();
            updateColorOptions();
            eventModal.classList.add('active');
        });
    }

    if (btnCloseEvent) {
        btnCloseEvent.addEventListener('click', () => {
            eventModal.classList.remove('active');
        });
    }

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedEventType = btn.dataset.type;
        });
    });

    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedEventColor = option.dataset.color;
        });
    });

    function updateTypeButtons() {
        typeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === selectedEventType);
        });
    }

    function updateColorOptions() {
        colorOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.color === selectedEventColor);
        });
    }

    if (btnSaveEvent) {
        btnSaveEvent.addEventListener('click', () => {
            const title = eventTitle.value.trim();
            const date = eventDateInput.value;
            const start = eventStart.value;
            const end = eventEnd.value;

            if (!title || !date) {
                showToast('Preencha título e data!', 'error');
                return;
            }

            if (editingEventId) {
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
                showToast('Evento atualizado!', 'success');
            } else {
                calendarEvents.push({
                    id: Date.now(),
                    title,
                    date,
                    start,
                    end,
                    type: selectedEventType,
                    color: selectedEventColor
                });
                showToast('Evento criado!', 'success');
            }

            eventModal.classList.remove('active');
            renderEvents();
            renderCalendar();
        });
    }

    // ==================== TAREFAS ====================
    let currentTaskFilter = 'todos';
    let editingTaskId = null;
    let selectedTaskType = 'matematica';
    let selectedTaskPriority = 'baixa';
    let selectedTaskColor = '#6366f1';

    const tasksView = document.getElementById('tasks-view');
    const tasksList = document.getElementById('tasks-list');
    const btnAddTask = document.getElementById('btn-add-task');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const taskModal = document.getElementById('task-modal');
    const taskModalTitle = document.getElementById('task-modal-title');
    const btnCloseTask = document.querySelector('[data-modal="task-modal"]');
    const btnSaveTask = document.getElementById('btn-save-task');
    const taskTitleInput = document.getElementById('task-title');
    const taskSubjectInput = document.getElementById('task-subject');
    const taskDateInput = document.getElementById('task-date');
    const taskTypeBtns = document.querySelectorAll('.task-types .type-btn');
    const taskPriorityBtns = document.querySelectorAll('.priority-btn');
    const taskColorOptions = document.querySelectorAll('#task-modal .color-option');

    let tasks = [
        { id: 1, title: 'Entregar Redação', subject: 'Português', date: 'Amanhã - 23:59', color: 'portugues', completed: false },
        { id: 2, title: 'Lista de Exercícios', subject: 'Matemática', date: 'Hoje', color: 'matematica', completed: false },
        { id: 3, title: 'Resumo Cap. 5', subject: 'História', date: 'Ontem', color: 'historia', completed: true },
        { id: 4, title: 'Trabalho de Biologia', subject: 'Biologia', date: '15/03', color: 'biologia', completed: false },
        { id: 5, title: 'Prova de Inglês', subject: 'Inglês', date: '20/03', color: 'ingles', completed: false },
        { id: 6, title: 'Mapa Mental - Física', subject: 'Física', date: '25/03', color: 'fisica', completed: false }
    ];

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

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTaskFilter = btn.dataset.filter;
            renderTasks();
        });
    });

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

    if (btnCloseTask) {
        btnCloseTask.addEventListener('click', () => {
            taskModal.classList.remove('active');
        });
    }

    taskTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            taskTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTaskType = btn.dataset.type;
        });
    });

    taskPriorityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            taskPriorityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTaskPriority = btn.dataset.priority;
        });
    });

    taskColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            taskColorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedTaskColor = option.dataset.color;
        });
    });

    function updateTaskTypeButtons() {
        taskTypeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === selectedTaskType);
        });
    }

    function updateTaskPriorityButtons() {
        taskPriorityBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === selectedTaskPriority);
        });
    }

    function updateTaskColorOptions() {
        taskColorOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.color === selectedTaskColor);
        });
    }

    if (btnSaveTask) {
        btnSaveTask.addEventListener('click', () => {
            const title = taskTitleInput.value.trim();
            const subject = taskSubjectInput.value.trim();
            const date = taskDateInput.value;

            if (!title) {
                showToast('Preencha o título!', 'error');
                return;
            }

            if (editingTaskId) {
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
                showToast('Tarefa atualizada!', 'success');
            } else {
                tasks.unshift({
                    id: Date.now(),
                    title,
                    subject: subject || 'Geral',
                    date: date || 'Sem data',
                    color: selectedTaskColor,
                    priority: selectedTaskPriority,
                    completed: false
                });
                showToast('Tarefa criada!', 'success');
            }

            taskModal.classList.remove('active');
            renderTasks();
        });
    }

    // ==================== ANOTAÇÕES ====================
    let editingNoteId = null;
    let selectedNoteColor = 'fisica';

    const notesView = document.getElementById('notes-view');
    const notesGrid = document.getElementById('notes-grid');
    const btnAddNote = document.getElementById('btn-add-note');
    const notesSearchInput = document.getElementById('notes-search-input');
    const noteModal = document.getElementById('note-modal');
    const noteModalTitle = document.getElementById('note-modal-title');
    const btnCloseNote = document.querySelector('[data-modal="note-modal"]');
    const btnSaveNote = document.getElementById('btn-save-note');
    const noteTitleInput = document.getElementById('note-title');
    const noteSubjectInput = document.getElementById('note-subject');
    const noteContentInput = document.getElementById('note-content');
    const noteColorOptions = document.querySelectorAll('#note-modal .color-option');

    let notes = [
        { id: 1, title: 'Fórmulas de Física', subject: 'Física • Mecânica', date: '10/03', color: 'fisica' },
        { id: 2, title: 'Vocabulário Inglês', subject: 'Inglês • Unit 4', date: '12/03', color: 'ingles' },
        { id: 3, title: 'Figuras de Linguagem', subject: 'Português', date: '14/03', color: 'portugues' },
        { id: 4, title: 'Reações Químicas', subject: 'Química • Orgânica', date: '15/03', color: 'quimica' },
        { id: 5, title: 'Resumo Revolução Francesa', subject: 'História', date: '16/03', color: 'historia' },
        { id: 6, title: 'Geometria Plana', subject: 'Matemática', date: '18/03', color: 'matematica' }
    ];

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

        document.querySelectorAll('.delete-note').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = parseInt(icon.dataset.id);
                if (confirm('Excluir esta anotação?')) {
                    notes = notes.filter(n => n.id !== noteId);
                    renderNotes();
                    showToast('Anotação excluída!', 'success');
                }
            });
        });
    }

    if (notesSearchInput) {
        notesSearchInput.addEventListener('input', (e) => {
            renderNotes(e.target.value);
        });
    }

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

    if (btnCloseNote) {
        btnCloseNote.addEventListener('click', () => {
            noteModal.classList.remove('active');
        });
    }

    noteColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            noteColorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedNoteColor = option.dataset.color;
        });
    });

    function updateNoteColorOptions() {
        noteColorOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.color === selectedNoteColor);
        });
    }

    if (btnSaveNote) {
        btnSaveNote.addEventListener('click', () => {
            const title = noteTitleInput.value.trim();
            const subject = noteSubjectInput.value.trim();
            const content = noteContentInput.value.trim();

            if (!title) {
                showToast('Preencha o título!', 'error');
                return;
            }

            if (editingNoteId) {
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
                showToast('Anotação atualizada!', 'success');
            } else {
                notes.unshift({
                    id: Date.now(),
                    title,
                    subject: subject || 'Geral',
                    content: content || '',
                    color: selectedNoteColor,
                    date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                });
                showToast('Anotação criada!', 'success');
            }

            noteModal.classList.remove('active');
            renderNotes();
        });
    }

    // ==================== PERFIL ====================
    const profileMenuItems = document.querySelectorAll('.profile-menu .menu-item:not(.logout)');
    let selectedTheme = 'dark';
    let selectedAccent = '#8b5cf6';

    function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

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

    // Botões de voltar dos modais
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) {
                closeModal(modalId);
            }
        });
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

        if (!nome || !email) {
            showToast('Preencha nome e e-mail!', 'error');
            return;
        }

        const usuario = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
        usuario.nome = nome;
        usuario.email = email;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        
        document.querySelector('.greeting h1').textContent = nome.split(' ')[0];
        document.querySelector('.profile-name').textContent = nome;
        document.querySelector('.profile-email').textContent = email;
        
        closeModal('dados-modal');
        showToast('Dados atualizados!', 'success');
    });

    document.getElementById('btn-save-senha')?.addEventListener('click', () => {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

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

        closeModal('seguranca-modal');
        showToast('Senha alterada!', 'success');
        
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    });

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
        showToast('Notificações salvas!', 'success');
    });

    function loadAparencia() {
        const appearance = JSON.parse(localStorage.getItem('appearanceSettings')) || {
            theme: 'dark',
            accent: '#8b5cf6',
            fontSize: 14
        };
        
        selectedTheme = appearance.theme;
        selectedAccent = appearance.accent;
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === selectedTheme);
        });
        
        document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
            option.classList.toggle('active', option.dataset.accent === selectedAccent);
        });
        
        document.getElementById('font-size-slider').value = appearance.fontSize;
    }

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTheme = btn.dataset.theme;
        });
    });

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
        document.documentElement.style.setProperty('--accent-purple', selectedAccent);
        
        closeModal('aparencia-modal');
        showToast('Aparência salva!', 'success');
    });

    function toggleFaq(element) {
        element.classList.toggle('active');
    }

    document.getElementById('btn-contato')?.addEventListener('click', () => {
        window.open('https://wa.me/5500000000000', '_blank');
    });

    document.getElementById('btn-termos')?.addEventListener('click', () => {
        showToast('Termos de Uso em desenvolvimento!', 'info');
    });

    document.getElementById('btn-privacidade')?.addEventListener('click', () => {
        showToast('Política de Privacidade em desenvolvimento!', 'info');
    });

    document.getElementById('btn-avaliar')?.addEventListener('click', () => {
        showToast('Obrigado por avaliar! ⭐⭐⭐⭐⭐', 'success');
    });

    document.querySelector('.menu-item.logout')?.addEventListener('click', () => {
        if (confirm('Deseja realmente sair da conta?')) {
            localStorage.removeItem('usuarioLogado');
            window.location.href = '../login/index.html';
        }
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
            
            homeView.classList.add('hidden');
            calendarView.classList.add('hidden');
            tasksViewNav.classList.add('hidden');
            notesViewNav.classList.add('hidden');
            profileViewNav.classList.add('hidden');
            
            if (view === 'home') {
                homeView.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'block');
            } else if (view === 'calendar') {
                calendarView.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderCalendar();
            } else if (view === 'tasks') {
                tasksViewNav.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderTasks();
            } else if (view === 'notes') {
                notesViewNav.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderNotes();
            } else if (view === 'profile') {
                profileViewNav.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
            }
        });
    });

    // ==================== INICIALIZAÇÃO ====================
    renderSchedule();
    renderClasses();
    renderNotifications();
    renderCalendar();
    renderTasks();
    renderNotes();
});