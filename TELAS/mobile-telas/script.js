// --- script.js ---

document.addEventListener('DOMContentLoaded', () => {
    
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

    // Elementos do DOM
    const editModal = document.getElementById('edit-modal');
    const btnBack = document.getElementById('btn-back');
    const btnSave = document.getElementById('btn-save');
    const btnAddTime = document.getElementById('btn-add-time');
    const btnCancelTime = document.getElementById('btn-cancel-time');
    const newTimeInput = document.getElementById('new-time-input');
    const toggleBtn = document.getElementById('toggle-edit-mode');

    // Renderiza grade principal (visualização)
    function renderSchedule() {
        const grid = document.getElementById('schedule-grid');
        
        let html = '<div class="day-header">Hora</div>';
        days.forEach(day => html += `<div class="day-header">${day}</div>`);

        timeSlots.forEach(time => {
            html += `<div class="time-slot">${time}</div>`;
            days.forEach(day => {
                const classItem = weeklySchedule[day]?.find(c => c.hora === time);
                if (classItem) {
                    html += `
                        <div class="class-cell">
                            <div class="class-block ${classItem.materia}">${namesMap[classItem.materia]}</div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="class-cell">
                            <div class="class-block empty">+</div>
                        </div>
                    `;
                }
            });
        });

        grid.innerHTML = html;
    }

    // Renderiza grade de edição (modal)
    function renderEditSchedule() {
        const grid = document.getElementById('edit-schedule-grid');
        
        let html = '<div class="day-header">Hora</div>';
        days.forEach(day => html += `<div class="day-header">${day}</div>`);

        timeSlots.forEach(time => {
            html += `<div class="time-slot">${time} <button class="btn-delete-row" data-time="${time}"><ion-icon name="trash-outline"></ion-icon></button></div>`;
            days.forEach(day => {
                const classItem = weeklySchedule[day]?.find(c => c.hora === time);
                
                if (classItem) {
                    html += `
                        <div class="edit-cell">
                            <div class="class-block ${classItem.materia}" data-day="${day}" data-time="${time}">
                                ${namesMap[classItem.materia]}
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="edit-cell">
                            <button class="btn-add" data-day="${day}" data-time="${time}">+</button>
                        </div>
                    `;
                }
            });
        });

        grid.innerHTML = html;
        attachEditEvents();
    }

    // Abrir modal de edição
    toggleBtn.addEventListener('click', () => {
        editModal.classList.add('active');
        renderEditSchedule();
    });

    // Fechar modal (voltar)
    btnBack.addEventListener('click', () => {
        editModal.classList.remove('active');
        renderSchedule();
    });

    // Salvar e fechar
    btnSave.addEventListener('click', () => {
        editModal.classList.remove('active');
        renderSchedule();
    });

    // Adicionar novo horário
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

    // Cancelar adição
    btnCancelTime.addEventListener('click', () => {
        newTimeInput.value = '11:00';
    });

    // Eventos de edição
    function attachEditEvents() {
        // Deletar linha de horário
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

        // Adicionar matéria
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

        // Editar matéria existente
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

    // Próximas Aulas
    const nextClasses = [
        { title: 'Matemática', subtitle: 'Hoje - 14h', icon: 'matematica' },
        { title: 'Entregar Redação', subtitle: 'Amanhã - 23:59', icon: 'portugues' },
        { title: 'Lab. de Química', subtitle: 'Sexta - 10h', icon: 'quimica' },
        { title: 'Prova de História', subtitle: 'Segunda - 08h', icon: 'historia' }
    ];

    // Notificações
    const notifications = [
        { title: 'Lembrete de leitura', subtitle: 'Capítulo 5 - Literatura Brasileira', icon: 'notification', type: 'lembrete' },
        { title: 'Guilherme entrou em...', subtitle: 'Grupo de Estudos - Física', icon: 'notification', type: 'guilherme' },
        { title: 'Tarefa aprovada', subtitle: 'Trabalho de Geografia - Nota 9.5', icon: 'notification', type: 'aprovada' }
    ];

    function renderClasses() {
        const list = document.getElementById('classes-list');
        let html = '';
        nextClasses.forEach(item => {
            html += `
                <div class="list-item">
                    <div class="item-icon ${item.icon}">
                        <ion-icon name="book-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">${item.title}</div>
                        <div class="item-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="item-arrow">
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    }

    function renderNotifications() {
        const list = document.getElementById('notifications-list');
        let html = '';
        notifications.forEach(item => {
            html += `
                <div class="list-item notification-item ${item.type}">
                    <div class="item-icon ${item.icon}">
                        <ion-icon name="${item.type === 'aprovada' ? 'checkmark-circle' : 'notifications'}-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">${item.title}</div>
                        <div class="item-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="item-arrow">
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    }

    // Inicialização
    renderSchedule();
    renderClasses();
    renderNotifications();
});