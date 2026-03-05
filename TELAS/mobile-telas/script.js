// ==================== FUNÇÕES GLOBAIS ====================

// Toast Notifications
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    const iconMap = {
        'success': 'checkmark-circle',
        'error': 'close-circle',
        'warning': 'warning',
        'info': 'information-circle'
    };
    
    toast.innerHTML = `
        <ion-icon name="${iconMap[type]}-outline" class="toast-icon"></ion-icon>
        <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    toast.offsetHeight;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== DOMContentLoaded ====================

document.addEventListener('DOMContentLoaded', () => {
    
    // ==================== VERIFICAR LOGIN ====================
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
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
    let weeklySchedule = JSON.parse(localStorage.getItem('weeklySchedule')) || {
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

    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    let timeSlots = JSON.parse(localStorage.getItem('timeSlots')) || ['08:00', '09:00', '10:00', '14:00'];

    // ==================== ELEMENTOS DO HORÁRIO ====================
    const editModal = document.getElementById('edit-modal');
    const btnBack = document.getElementById('btn-back');
    const btnSave = document.getElementById('btn-save');
    const btnAddTime = document.getElementById('btn-add-time');
    const btnCancelTime = document.getElementById('btn-cancel-time');
    const newTimeInput = document.getElementById('new-time-input');
    const toggleBtn = document.getElementById('toggle-edit-mode');
    
    const subjectModal = document.getElementById('subject-modal');
    const subjectModalTitle = document.getElementById('subject-modal-title');
    const btnCloseSubject = document.querySelector('[data-modal="subject-modal"]');
    const btnSaveSubject = document.getElementById('btn-save-subject');
    const subjectNameInput = document.getElementById('subject-name-input');
    const subjectTeacherInput = document.getElementById('subject-teacher-input');
    const subjectStartInput = document.getElementById('subject-start-input');
    const subjectDayInput = document.getElementById('subject-day-input');
    const subjectColorOptions = document.querySelectorAll('#subject-modal .color-option');

    let selectedSubjectColor = '#6366f1';
    let editingSubject = null;

    function saveSchedule() {
        localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
        localStorage.setItem('timeSlots', JSON.stringify(timeSlots));
    }

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
                    html += `
                        <div class="class-cell editable-subject" data-day="${day}" data-time="${time}">
                            <div class="class-block subject-custom" style="background-color: ${classItem.color}">
                                ${classItem.materia}
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="class-cell add-subject-btn" data-day="${day}" data-time="${time}">
                            <div class="class-block empty">+</div>
                        </div>
                    `;
                }
            });
        });

        grid.innerHTML = html;
        attachSubjectEvents();
    }

    function attachSubjectEvents() {
        document.querySelectorAll('.add-subject-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const day = btn.dataset.day;
                const time = btn.dataset.time;
                openSubjectModal(null, day, time);
            });
        });

        document.querySelectorAll('.editable-subject').forEach(cell => {
            cell.addEventListener('click', () => {
                const day = cell.dataset.day;
                const time = cell.dataset.time;
                const subject = weeklySchedule[day]?.find(c => c.hora === time);
                if (subject) {
                    openSubjectModal(subject, day, time);
                }
            });
        });
    }

    function openSubjectModal(subject, day, time) {
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
        subjectColorOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.color === selectedSubjectColor);
        });
    }

    subjectColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            subjectColorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedSubjectColor = option.dataset.color;
        });
    });

    if (btnCloseSubject) {
        btnCloseSubject.addEventListener('click', () => {
            subjectModal.classList.remove('active');
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

            saveSchedule();
            showToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
            subjectModal.classList.remove('active');
            renderSchedule();
        });
    }

    // Modal de editar horário
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
        });
    }

    if (btnAddTime) {
        btnAddTime.addEventListener('click', () => {
            const newTime = newTimeInput?.value;
            if (newTime && !timeSlots.includes(newTime)) {
                timeSlots.push(newTime);
                timeSlots.sort();
                saveSchedule();
                if (editModal) renderEditSchedule();
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
                    html += `<div class="edit-cell"><div class="class-block subject-custom" style="background-color: ${classItem.color}">${classItem.materia}</div></div>`;
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
                if (confirm(`Remover horário ${time}?`)) {
                    timeSlots = timeSlots.filter(t => t !== time);
                    days.forEach(day => {
                        if (weeklySchedule[day]) {
                            weeklySchedule[day] = weeklySchedule[day].filter(c => c.hora !== time);
                        }
                    });
                    saveSchedule();
                    renderEditSchedule();
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

    // ==================== PRÓXIMAS AULAS ====================
    function renderClasses() {
        const list = document.getElementById('classes-list');
        if (!list) return;
        
        const nextClasses = [
            { title: 'Matemática', subtitle: 'Hoje - 14h', icon: 'matematica' },
            { title: 'Entregar Redação', subtitle: 'Amanhã - 23:59', icon: 'portugues' },
            { title: 'Lab. de Química', subtitle: 'Sexta - 10h', icon: 'quimica' },
            { title: 'Prova de História', subtitle: 'Segunda - 08h', icon: 'historia' }
        ];
        
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
    function renderNotifications() {
        const list = document.getElementById('notifications-list');
        if (!list) return;
        
        const notifications = [
            { title: 'Lembrete de leitura', subtitle: 'Capítulo 5 - Literatura Brasileira', icon: 'notification', type: 'lembrete' },
            { title: 'Guilherme entrou em...', subtitle: 'Grupo de Estudos - Física', icon: 'notification', type: 'guilherme' },
            { title: 'Tarefa aprovada', subtitle: 'Trabalho de Geografia - Nota 9.5', icon: 'notification', type: 'aprovada' }
        ];
        
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

    let calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || [
        { id: 1, title: 'Aula de Matemática', date: '2026-03-01', start: '08:00', end: '09:30', type: 'aula', color: '#6366f1' },
        { id: 2, title: 'Grupo de Estudos', date: '2026-03-01', start: '14:00', end: '16:00', type: 'tarefa', color: '#10b981' }
    ];

    function saveCalendarEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
    }

    function renderCalendar() {
        if (!calendarDays) return;
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        if (currentMonthYear) currentMonthYear.textContent = `${monthNames[month]} de ${year}`;
        
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

        document.querySelectorAll('.edit-event').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = parseInt(icon.dataset.id);
                const event = calendarEvents.find(ev => ev.id === eventId);
                if (event && eventModal && eventTitle && eventDateInput && eventStart && eventEnd) {
                    editingEventId = event.id;
                    eventTitle.value = event.title;
                    eventDateInput.value = event.date;
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
                    saveCalendarEvents();
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

    if (btnNewEvent) {
        btnNewEvent.addEventListener('click', () => {
            editingEventId = null;
            if (eventTitle) eventTitle.value = '';
            if (eventDateInput) eventDateInput.value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
            if (eventStart) eventStart.value = '08:00';
            if (eventEnd) eventEnd.value = '09:00';
            selectedEventType = 'aula';
            selectedEventColor = '#8b5cf6';
            updateTypeButtons();
            updateColorOptions();
            if (eventModal) eventModal.classList.add('active');
        });
    }

    if (btnCloseEvent) {
        btnCloseEvent.addEventListener('click', () => {
            if (eventModal) eventModal.classList.remove('active');
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

    if (btnSaveEvent) {
        btnSaveEvent.addEventListener('click', () => {
            const title = eventTitle?.value.trim();
            const date = eventDateInput?.value;
            const start = eventStart?.value;
            const end = eventEnd?.value;

            if (!title || !date) {
                showToast('Preencha título e data!', 'error');
                return;
            }

            if (editingEventId) {
                const eventIndex = calendarEvents.findIndex(e => e.id === editingEventId);
                if (eventIndex > -1) {
                    calendarEvents[eventIndex] = { ...calendarEvents[eventIndex], title, date, start, end, type: selectedEventType, color: selectedEventColor };
                }
                saveCalendarEvents();
                showToast('Evento atualizado!', 'success');
            } else {
                calendarEvents.push({ id: Date.now(), title, date, start, end, type: selectedEventType, color: selectedEventColor });
                saveCalendarEvents();
                showToast('Evento criado!', 'success');
            }

            if (eventModal) eventModal.classList.remove('active');
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

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [
        { id: 1, title: 'Entregar Redação', subject: 'Português', date: 'Amanhã - 23:59', color: 'portugues', completed: false },
        { id: 2, title: 'Lista de Exercícios', subject: 'Matemática', date: 'Hoje', color: 'matematica', completed: false },
        { id: 3, title: 'Resumo Cap. 5', subject: 'História', date: 'Ontem', color: 'historia', completed: true }
    ];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

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
                <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" style="${task.color ? 'border-left-color: ' + task.color : ''}">
                    <div class="task-color" style="${task.color ? 'background-color: ' + task.color : ''}"></div>
                    <div class="task-info">
                        <div class="task-title">${task.title}</div>
                        <div class="task-subject">${task.subject}</div>
                        <div class="task-date"><ion-icon name="calendar-outline"></ion-icon> ${task.date}</div>
                    </div>
                    <div class="task-check ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                        ${task.completed ? '<ion-icon name="checkmark-outline"></ion-icon>' : ''}
                    </div>
                    <div class="task-arrow" data-id="${task.id}"><ion-icon name="chevron-forward-outline"></ion-icon></div>
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
                    saveTasks();
                    renderTasks();
                }
            });
        });

        document.querySelectorAll('.task-arrow').forEach(arrow => {
            arrow.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(arrow.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task && taskModal) {
                    editingTaskId = task.id;
                    taskModalTitle.textContent = 'Editar Tarefa';
                    if (taskTitleInput) taskTitleInput.value = task.title;
                    if (taskSubjectInput) taskSubjectInput.value = task.subject;
                    if (taskDateInput) taskDateInput.value = task.date;
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
            if (taskTitleInput) taskTitleInput.value = '';
            if (taskSubjectInput) taskSubjectInput.value = '';
            if (taskDateInput) taskDateInput.value = '';
            selectedTaskType = 'matematica';
            selectedTaskPriority = 'baixa';
            selectedTaskColor = '#6366f1';
            updateTaskTypeButtons();
            updateTaskPriorityButtons();
            updateTaskColorOptions();
            if (taskModal) taskModal.classList.add('active');
        });
    }

    if (btnCloseTask) {
        btnCloseTask.addEventListener('click', () => {
            if (taskModal) taskModal.classList.remove('active');
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

    if (btnSaveTask) {
        btnSaveTask.addEventListener('click', () => {
            const title = taskTitleInput?.value.trim();
            const subject = taskSubjectInput?.value.trim();
            const date = taskDateInput?.value;

            if (!title) {
                showToast('Preencha o título!', 'error');
                return;
            }

            if (editingTaskId) {
                const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
                if (taskIndex > -1) {
                    tasks[taskIndex] = { ...tasks[taskIndex], title, subject: subject || tasks[taskIndex].subject, date: date || tasks[taskIndex].date, color: selectedTaskColor, priority: selectedTaskPriority };
                }
                saveTasks();
                showToast('Tarefa atualizada!', 'success');
            } else {
                tasks.unshift({ id: Date.now(), title, subject: subject || 'Geral', date: date || 'Sem data', color: selectedTaskColor, priority: selectedTaskPriority, completed: false });
                saveTasks();
                showToast('Tarefa criada!', 'success');
            }

            if (taskModal) taskModal.classList.remove('active');
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

    let notes = JSON.parse(localStorage.getItem('notes')) || [
        { id: 1, title: 'Fórmulas de Física', subject: 'Física • Mecânica', date: '10/03', color: 'fisica' },
        { id: 2, title: 'Vocabulário Inglês', subject: 'Inglês • Unit 4', date: '12/03', color: 'ingles' }
    ];

    function saveNotes() {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function updateNoteColorOptions() {
        noteColorOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.color === selectedNoteColor);
        });
    }

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
                if (note && noteModal) {
                    editingNoteId = note.id;
                    noteModalTitle.textContent = 'Editar Anotação';
                    if (noteTitleInput) noteTitleInput.value = note.title;
                    if (noteSubjectInput) noteSubjectInput.value = note.subject;
                    if (noteContentInput) noteContentInput.value = note.content || '';
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
                    saveNotes();
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
            if (noteTitleInput) noteTitleInput.value = '';
            if (noteSubjectInput) noteSubjectInput.value = '';
            if (noteContentInput) noteContentInput.value = '';
            selectedNoteColor = 'fisica';
            updateNoteColorOptions();
            if (noteModal) noteModal.classList.add('active');
        });
    }

    if (btnCloseNote) {
        btnCloseNote.addEventListener('click', () => {
            if (noteModal) noteModal.classList.remove('active');
        });
    }

    noteColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            noteColorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedNoteColor = option.dataset.color;
        });
    });

    if (btnSaveNote) {
        btnSaveNote.addEventListener('click', () => {
            const title = noteTitleInput?.value.trim();
            const subject = noteSubjectInput?.value.trim();
            const content = noteContentInput?.value.trim();

            if (!title) {
                showToast('Preencha o título!', 'error');
                return;
            }

            if (editingNoteId) {
                const noteIndex = notes.findIndex(n => n.id === editingNoteId);
                if (noteIndex > -1) {
                    notes[noteIndex] = { ...notes[noteIndex], title, subject: subject || notes[noteIndex].subject, content: content || notes[noteIndex].content, color: selectedNoteColor };
                }
                saveNotes();
                showToast('Anotação atualizada!', 'success');
            } else {
                notes.unshift({ id: Date.now(), title, subject: subject || 'Geral', content: content || '', color: selectedNoteColor, date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) });
                saveNotes();
                showToast('Anotação criada!', 'success');
            }

            if (noteModal) noteModal.classList.remove('active');
            renderNotes();
        });
    }

    // ==================== PERFIL ====================
    const profileMenuItems = document.querySelectorAll('.profile-menu .menu-item:not(.logout)');
    let selectedTheme = 'dark';
    let selectedAccent = '#8b5cf6';

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

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
                loadNotificacoes();
            } else if (action === 'aparencia') {
                document.getElementById('aparencia-modal')?.classList.add('active');
                loadAparencia();
            } else if (action === 'ajuda') {
                document.getElementById('ajuda-modal')?.classList.add('active');
            }
        });
    });

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) closeModal(modalId);
        });
    });

    function loadProfileData() {
        const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (usuario) {
            const nameInput = document.getElementById('profile-name-input');
            const emailInput = document.getElementById('profile-email-input');
            const avatarPreview = document.getElementById('avatar-preview');
            if (nameInput) nameInput.value = usuario.nome || '';
            if (emailInput) emailInput.value = usuario.email || '';
            if (avatarPreview) avatarPreview.textContent = usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U';
        }
    }

    document.getElementById('btn-save-dados')?.addEventListener('click', () => {
        const nome = document.getElementById('profile-name-input')?.value.trim();
        const email = document.getElementById('profile-email-input')?.value.trim();

        if (!nome || !email) {
            showToast('Preencha nome e e-mail!', 'error');
            return;
        }

        const usuario = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
        usuario.nome = nome;
        usuario.email = email;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        
        const headerName = document.querySelector('.greeting h1');
        const profileName = document.querySelector('.profile-name');
        const profileEmail = document.querySelector('.profile-email');
        if (headerName) headerName.textContent = nome.split(' ')[0];
        if (profileName) profileName.textContent = nome;
        if (profileEmail) profileEmail.textContent = email;
        
        closeModal('dados-modal');
        showToast('Dados atualizados!', 'success');
    });

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

        closeModal('seguranca-modal');
        showToast('Senha alterada!', 'success');
        
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    });

    function loadNotificacoes() {
        const settings = JSON.parse(localStorage.getItem('notificacoesSettings')) || { push: true, email: false, aulas: true, tarefas: true };
        const push = document.getElementById('toggle-push');
        const email = document.getElementById('toggle-email');
        const aulas = document.getElementById('toggle-aulas');
        const tarefas = document.getElementById('toggle-tarefas');
        if (push) push.checked = settings.push;
        if (email) email.checked = settings.email;
        if (aulas) aulas.checked = settings.aulas;
        if (tarefas) tarefas.checked = settings.tarefas;
    }

    document.getElementById('btn-save-notificacoes')?.addEventListener('click', () => {
        const settings = {
            push: document.getElementById('toggle-push')?.checked,
            email: document.getElementById('toggle-email')?.checked,
            aulas: document.getElementById('toggle-aulas')?.checked,
            tarefas: document.getElementById('toggle-tarefas')?.checked
        };
        localStorage.setItem('notificacoesSettings', JSON.stringify(settings));
        closeModal('notificacoes-modal');
        showToast('Notificações salvas!', 'success');
    });

    function loadAparencia() {
        const appearance = JSON.parse(localStorage.getItem('appearanceSettings')) || { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
        selectedTheme = appearance.theme;
        selectedAccent = appearance.accent;
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === selectedTheme);
        });
        
        document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
            option.classList.toggle('active', option.dataset.accent === selectedAccent);
        });
        
        const slider = document.getElementById('font-size-slider');
        if (slider) slider.value = appearance.fontSize;
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
            fontSize: document.getElementById('font-size-slider')?.value || 14
        };
        localStorage.setItem('appearanceSettings', JSON.stringify(appearance));
        document.documentElement.style.setProperty('--accent-purple', selectedAccent);
        closeModal('aparencia-modal');
        showToast('Aparência salva!', 'success');
    });

    window.toggleFaq = function(element) {
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
            
            if (homeView) homeView.classList.add('hidden');
            if (calendarView) calendarView.classList.add('hidden');
            if (tasksViewNav) tasksViewNav.classList.add('hidden');
            if (notesViewNav) notesViewNav.classList.add('hidden');
            if (profileViewNav) profileViewNav.classList.add('hidden');
            
            if (view === 'home') {
                if (homeView) homeView.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'block');
            } else if (view === 'calendar') {
                if (calendarView) calendarView.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderCalendar();
            } else if (view === 'tasks') {
                if (tasksViewNav) tasksViewNav.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderTasks();
            } else if (view === 'notes') {
                if (notesViewNav) notesViewNav.classList.remove('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderNotes();
            } else if (view === 'profile') {
                if (profileViewNav) profileViewNav.classList.remove('hidden');
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