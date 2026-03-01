document.addEventListener('DOMContentLoaded', () => {
    
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

    toggleBtn.addEventListener('click', () => {
        editModal.classList.add('active');
        renderEditSchedule();
    });

    btnBack.addEventListener('click', () => {
        editModal.classList.remove('active');
        renderSchedule();
    });

    btnSave.addEventListener('click', () => {
        editModal.classList.remove('active');
        renderSchedule();
    });

    btnAddTime.addEventListener('click', () => {
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

    btnCancelTime.addEventListener('click', () => {
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

    const events = {
        1: [
            { title: 'Aula de Matemática', time: '08:00 - 09:30', type: 'aula' },
            { title: 'Grupo de Estudos', time: '14:00 - 16:00', type: 'trabalho' }
        ],
        5: [{ title: 'Prova de Física', time: '10:00', type: 'aula' }],
        15: [{ title: 'Entregar Trabalho', time: '23:59', type: 'trabalho' }]
    };

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
        const dayEvents = events[selectedDay] || [];
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

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
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

    btnAddTask.addEventListener('click', () => {
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

    notesSearchInput.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });

    btnAddNote.addEventListener('click', () => {
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

    // ==================== PERFIL ====================
    const profileView = document.getElementById('profile-view');
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const text = item.querySelector('span').textContent;
            
            if (item.classList.contains('logout')) {
                if (confirm('Deseja realmente sair da conta?')) {
                    alert('Logout realizado!');
                }
                return;
            }
            
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
                homeView.classList.remove('hidden');
                calendarView.classList.add('hidden');
                tasksViewNav.classList.add('hidden');
                notesViewNav.classList.add('hidden');
                profileViewNav.classList.add('hidden');
                homeOnlySections.forEach(section => section.style.display = 'block');
            } else if (view === 'calendar') {
                homeView.classList.add('hidden');
                calendarView.classList.remove('hidden');
                tasksViewNav.classList.add('hidden');
                notesViewNav.classList.add('hidden');
                profileViewNav.classList.add('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderCalendar();
            } else if (view === 'tasks') {
                homeView.classList.add('hidden');
                calendarView.classList.add('hidden');
                tasksViewNav.classList.remove('hidden');
                notesViewNav.classList.add('hidden');
                profileViewNav.classList.add('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderTasks();
            } else if (view === 'notes') {
                homeView.classList.add('hidden');
                calendarView.classList.add('hidden');
                tasksViewNav.classList.add('hidden');
                notesViewNav.classList.remove('hidden');
                profileViewNav.classList.add('hidden');
                homeOnlySections.forEach(section => section.style.display = 'none');
                renderNotes();
            } else if (view === 'profile') {
                homeView.classList.add('hidden');
                calendarView.classList.add('hidden');
                tasksViewNav.classList.add('hidden');
                notesViewNav.classList.add('hidden');
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