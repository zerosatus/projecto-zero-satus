// ==================== VARIÁVEIS GLOBAIS ====================
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
let notifications = [];
let weeklySchedule = {};
let timeSlots = ['08:00', '09:00', '10:00', '14:00'];
let currentView = 'home';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date();
let currentFilter = 'todos';

// ==================== VERIFICAÇÃO DE LOGIN E CARREGAMENTO ====================
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
        inicializarComponentes();
        configurarEventListeners();
        initNotificationSystem();
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ==================== CARREGAR TODOS OS DADOS ====================
function carregarTodosDados() {
    carregarHorarioSemanal();
    carregarTarefas();
    carregarAnotacoes();
    carregarEventos();
    carregarNotificacoes();
    atualizarCardsResumo();
}

function carregarHorarioSemanal() {
    const horarioKey = `horario_${usuarioAtual?.email}`;
    const horarioSalvo = localStorage.getItem(horarioKey);
    
    if (horarioSalvo) {
        weeklySchedule = JSON.parse(horarioSalvo);
    } else {
        weeklySchedule = {
            'Seg': [
                { id: '1', hora: '08:00', materia: 'Matemática', color: '#6366f1', professor: 'Prof. Silva' },
                { id: '2', hora: '09:00', materia: 'Química', color: '#10b981', professor: 'Prof. Santos' },
                { id: '3', hora: '14:00', materia: 'Matemática', color: '#6366f1', professor: 'Prof. Silva' }
            ],
            'Ter': [
                { id: '4', hora: '08:00', materia: 'Português', color: '#ec4899', professor: 'Prof. Oliveira' },
                { id: '5', hora: '09:00', materia: 'Biologia', color: '#3b82f6', professor: 'Prof. Lima' },
                { id: '6', hora: '10:00', materia: 'Redação', color: '#2563eb', professor: 'Prof. Oliveira' }
            ],
            'Qua': [
                { id: '7', hora: '08:00', materia: 'Física', color: '#ef4444', professor: 'Prof. Souza' },
                { id: '8', hora: '09:00', materia: 'Inglês', color: '#8b5cf6', professor: 'Prof. Mendes' },
                { id: '9', hora: '14:00', materia: 'Química', color: '#10b981', professor: 'Prof. Santos' }
            ],
            'Qui': [
                { id: '10', hora: '08:00', materia: 'História', color: '#f59e0b', professor: 'Prof. Pereira' },
                { id: '11', hora: '10:00', materia: 'Física', color: '#ef4444', professor: 'Prof. Souza' }
            ],
            'Sex': [
                { id: '12', hora: '08:00', materia: 'História', color: '#f59e0b', professor: 'Prof. Pereira' },
                { id: '13', hora: '09:00', materia: 'Geografia', color: '#a855f7', professor: 'Prof. Costa' }
            ]
        };
    }
    
    atualizarTimeSlots();
}

function atualizarTimeSlots() {
    const horarios = new Set();
    Object.values(weeklySchedule).forEach(dia => {
        dia.forEach(aula => {
            horarios.add(aula.hora);
        });
    });
    timeSlots = Array.from(horarios).sort();
}

function carregarTarefas() {
    if (!usuarioAtual) return;
    const storageKey = `tarefas_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(storageKey);
    
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
    } else {
        tarefas = [
            { id: Date.now() + 1, nome: 'Lista de Exercícios', disciplina: 'matematica', prazo: '2026-03-15', concluida: false, prioridade: 'alta' },
            { id: Date.now() + 2, nome: 'Redação Dissertativa', disciplina: 'portugues', prazo: '2026-03-18', concluida: false, prioridade: 'media' },
            { id: Date.now() + 3, nome: 'Relatório de Química', disciplina: 'quimica', prazo: '2026-03-20', concluida: true, prioridade: 'baixa' },
            { id: Date.now() + 4, nome: 'Estudo para Prova', disciplina: 'fisica', prazo: '2026-03-22', concluida: false, prioridade: 'alta' },
            { id: Date.now() + 5, nome: 'Resumo de História', disciplina: 'historia', prazo: '2026-03-25', concluida: false, prioridade: 'media' }
        ];
        localStorage.setItem(storageKey, JSON.stringify(tarefas));
    }
}

function carregarAnotacoes() {
    if (!usuarioAtual) return;
    const storageKey = `anotacoes_${usuarioAtual.email}`;
    const anotacoesSalvas = localStorage.getItem(storageKey);
    
    if (anotacoesSalvas) {
        anotacoes = JSON.parse(anotacoesSalvas);
    } else {
        anotacoes = [
            { id: Date.now() + 1, titulo: 'Fórmulas de Física', materia: 'Física', dataModificacao: new Date().toISOString(), conteudo: 'E = mc²\nF = ma\nv = v₀ + at', cor: 'fisica' },
            { id: Date.now() + 2, titulo: 'Verbos em Inglês', materia: 'Inglês', dataModificacao: new Date().toISOString(), conteudo: 'Simple Present, Past Participle...', cor: 'ingles' },
            { id: Date.now() + 3, titulo: 'Tabela Periódica', materia: 'Química', dataModificacao: new Date().toISOString(), conteudo: 'Hidrogênio, Hélio, Lítio...', cor: 'quimica' },
            { id: Date.now() + 4, titulo: 'Revolução Francesa', materia: 'História', dataModificacao: new Date().toISOString(), conteudo: '1789 - Queda da Bastilha', cor: 'historia' }
        ];
        localStorage.setItem(storageKey, JSON.stringify(anotacoes));
    }
}

function carregarEventos() {
    if (!usuarioAtual) return;
    const storageKey = `eventos_${usuarioAtual.email}`;
    const eventosSalvos = localStorage.getItem(storageKey);
    
    if (eventosSalvos) {
        eventos = JSON.parse(eventosSalvos);
    } else {
        const hoje = new Date();
        eventos = [
            { id: Date.now() + 1, title: 'Aula de Matemática', day: hoje.getDate(), month: hoje.getMonth(), year: hoje.getFullYear(), time: '08:00', endTime: '09:30', type: 'aula', color: '#6366f1' },
            { id: Date.now() + 2, title: 'Prova de Física', day: hoje.getDate() + 2, month: hoje.getMonth(), year: hoje.getFullYear(), time: '14:00', endTime: '16:00', type: 'prova', color: '#ef4444' },
            { id: Date.now() + 3, title: 'Entrega de Trabalho', day: hoje.getDate() + 5, month: hoje.getMonth(), year: hoje.getFullYear(), time: '23:59', endTime: '23:59', type: 'tarefa', color: '#f59e0b' }
        ];
        localStorage.setItem(storageKey, JSON.stringify(eventos));
    }
}

function carregarNotificacoes() {
    if (!usuarioAtual) return;
    
    const notifKey = `notificacoes_${usuarioAtual.email}`;
    const notifSalvas = localStorage.getItem(notifKey);
    
    if (notifSalvas) {
        notifications = JSON.parse(notifSalvas);
    } else {
        notifications = gerarNotificacoesIniciais();
        localStorage.setItem(notifKey, JSON.stringify(notifications));
    }
    
    atualizarBadgeNotificacoes();
}

function gerarNotificacoesIniciais() {
    const notificacoes = [];
    
    tarefas.filter(t => !t.concluida).slice(0, 3).forEach(t => {
        notificacoes.push({
            id: Date.now() + Math.random(),
            type: 'tarefa',
            title: 'Tarefa Pendente',
            message: t.nome,
            time: new Date().toISOString(),
            read: false
        });
    });
    
    const hoje = new Date();
    eventos.filter(e => e.day === hoje.getDate() && e.month === hoje.getMonth()).forEach(e => {
        notificacoes.push({
            id: Date.now() + Math.random(),
            type: 'aula',
            title: 'Evento Hoje',
            message: e.title,
            time: new Date().toISOString(),
            read: false
        });
    });
    
    return notificacoes;
}

// ==================== FUNÇÕES DE RENDERIZAÇÃO ====================

function renderSchedule() {
    const scheduleGrid = document.getElementById('schedule-grid');
    if (!scheduleGrid) return;
    
    const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    let html = '<div class="time-slot"></div>';
    
    dias.forEach(dia => {
        html += `<div class="day-header">${dia}</div>`;
    });
    
    timeSlots.forEach(hora => {
        html += `<div class="time-slot">${hora}</div>`;
        
        dias.forEach(dia => {
            const aulas = weeklySchedule[dia]?.filter(a => a.hora === hora) || [];
            
            if (aulas.length > 0) {
                aulas.forEach(aula => {
                    const materiaClass = aula.materia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    html += `<div class="class-cell">
                        <div class="class-block ${materiaClass}" style="background-color: ${aula.color}20; color: ${aula.color}; border-left: 3px solid ${aula.color};">
                            ${aula.materia}
                        </div>
                    </div>`;
                });
            } else {
                html += `<div class="class-cell">
                    <div class="class-block empty">-</div>
                </div>`;
            }
        });
    });
    
    scheduleGrid.innerHTML = html;
}

function renderEditSchedule() {
    const editGrid = document.getElementById('edit-schedule-grid');
    if (!editGrid) return;
    
    const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    let html = '<div class="time-slot"></div>';
    
    dias.forEach(dia => {
        html += `<div class="day-header">${dia}<br><small>${dia}</small></div>`;
    });
    
    timeSlots.forEach(hora => {
        html += `<div class="time-slot">${hora}</div>`;
        
        dias.forEach(dia => {
            const aulas = weeklySchedule[dia]?.filter(a => a.hora === hora) || [];
            
            html += `<div class="edit-cell" data-dia="${dia}" data-hora="${hora}">`;
            
            if (aulas.length > 0) {
                aulas.forEach(aula => {
                    html += `<div class="class-block" style="background-color: ${aula.color}20; color: ${aula.color}; border-left: 3px solid ${aula.color};" onclick="editSubject('${dia}', '${hora}', '${aula.id}')">
                        ${aula.materia}
                        <button class="btn-delete-row" onclick="event.stopPropagation(); deleteSubject('${dia}', '${hora}', '${aula.id}')">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>`;
                });
            } else {
                html += `<button class="btn-add" onclick="openSubjectModal('${dia}', '${hora}')">
                    <ion-icon name="add-outline"></ion-icon>
                </button>`;
            }
            
            html += `</div>`;
        });
    });
    
    editGrid.innerHTML = html;
}

function renderClasses() {
    const classesList = document.getElementById('classes-list');
    if (!classesList) return;
    
    const hoje = new Date();
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const diaSemana = diasSemana[hoje.getDay()];
    const diaMap = { 'Seg': 'Seg', 'Ter': 'Ter', 'Qua': 'Qua', 'Qui': 'Qui', 'Sex': 'Sex' };
    const diaKey = diaMap[diaSemana];
    
    if (!diaKey || !weeklySchedule[diaKey]) {
        classesList.innerHTML = '<div class="list-item">Nenhuma aula hoje</div>';
        return;
    }
    
    const aulasHoje = weeklySchedule[diaKey].sort((a, b) => a.hora.localeCompare(b.hora));
    
    let html = '';
    aulasHoje.forEach(aula => {
        const materiaClass = aula.materia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        html += `
            <div class="list-item">
                <div class="item-icon ${materiaClass}" style="background-color: ${aula.color}20; color: ${aula.color};">
                    <ion-icon name="book-outline"></ion-icon>
                </div>
                <div class="item-info">
                    <div class="item-title">${aula.materia}</div>
                    <div class="item-subtitle">${aula.hora} • ${aula.professor || 'Professor'}</div>
                </div>
                <ion-icon name="chevron-forward-outline" class="item-arrow"></ion-icon>
            </div>
        `;
    });
    
    classesList.innerHTML = html || '<div class="list-item">Nenhuma aula hoje</div>';
}

function renderNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) return;
    
    const naoLidas = notifications.filter(n => !n.read).slice(0, 3);
    
    if (naoLidas.length === 0) {
        notificationsList.innerHTML = '<div class="list-item">Nenhuma notificação</div>';
        return;
    }
    
    let html = '';
    naoLidas.forEach(notif => {
        html += `
            <div class="list-item notification-item ${notif.type}" onclick="openNotificationsModal()">
                <div class="item-icon notification ${notif.type}">
                    <ion-icon name="${getNotificationIcon(notif.type)}"></ion-icon>
                </div>
                <div class="item-info">
                    <div class="item-title">${notif.title}</div>
                    <div class="item-subtitle">${notif.message}</div>
                </div>
                <ion-icon name="chevron-forward-outline" class="item-arrow"></ion-icon>
            </div>
        `;
    });
    
    notificationsList.innerHTML = html;
}

function renderNotificationsModal(filter = 'all') {
    const container = document.getElementById('notifications-list-modal');
    if (!container) return;
    
    let filtered = [...notifications];
    
    switch(filter) {
        case 'unread':
            filtered = filtered.filter(n => !n.read);
            break;
        case 'aulas':
            filtered = filtered.filter(n => n.type === 'aula');
            break;
        case 'tarefas':
            filtered = filtered.filter(n => n.type === 'tarefa');
            break;
    }
    
    filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <ion-icon name="notifications-off-outline"></ion-icon>
                <p>Nenhuma notificação</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach(notif => {
        html += `
            <div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" onclick="markAsRead('${notif.id}')">
                <div class="notification-icon ${notif.type}">
                    <ion-icon name="${getNotificationIcon(notif.type)}"></ion-icon>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">
                        <ion-icon name="time-outline"></ion-icon>
                        ${formatarTempoRelativo(notif.time)}
                    </div>
                </div>
                <div class="notification-actions">
                    <button class="notification-action-btn" onclick="event.stopPropagation(); deleteNotification('${notif.id}')">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderCalendar() {
    const monthYear = document.getElementById('current-month-year');
    const daysContainer = document.getElementById('calendar-days');
    if (!monthYear || !daysContainer) return;
    
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    monthYear.textContent = `${months[currentMonth]} de ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = '';
    
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    for (let d = 1; d <= lastDate; d++) {
        const isToday = d === new Date().getDate() && 
                       currentMonth === new Date().getMonth() && 
                       currentYear === new Date().getFullYear();
        
        const isSelected = d === selectedDate.getDate() && 
                          currentMonth === selectedDate.getMonth() && 
                          currentYear === selectedDate.getFullYear();
        
        const hasEvent = eventos.some(e => e.day === d && e.month === currentMonth && e.year === currentYear);
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}"
                 onclick="selectDay(${d})">
                ${d}
            </div>
        `;
    }
    
    daysContainer.innerHTML = html;
    renderEvents();
}

function renderEvents() {
    const eventsDate = document.getElementById('events-date');
    const eventsList = document.getElementById('events-list');
    if (!eventsDate || !eventsList) return;
    
    const day = selectedDate.getDate();
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    
    eventsDate.textContent = `Eventos do dia ${day}`;
    
    const eventosDia = eventos.filter(e => e.day === day && e.month === month && e.year === year);
    
    if (eventosDia.length === 0) {
        eventsList.innerHTML = '<div class="list-item">Nenhum evento para este dia</div>';
        return;
    }
    
    let html = '';
    eventosDia.sort((a, b) => a.time.localeCompare(b.time));
    
    eventosDia.forEach(evento => {
        html += `
            <div class="event-item" onclick="openEventModal('${evento.id}')">
                <div class="event-icon ${evento.type}" style="border-left-color: ${evento.color};">
                    <ion-icon name="${getEventIcon(evento.type)}"></ion-icon>
                </div>
                <div class="event-info">
                    <div class="event-title">${evento.title}</div>
                    <div class="event-time">${evento.time} - ${evento.endTime || evento.time}</div>
                </div>
                <ion-icon name="chevron-forward-outline" class="event-arrow"></ion-icon>
            </div>
        `;
    });
    
    eventsList.innerHTML = html;
}

function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;
    
    let filtered = [...tarefas];
    
    switch(currentFilter) {
        case 'pendentes':
            filtered = filtered.filter(t => !t.concluida);
            break;
        case 'concluidas':
            filtered = filtered.filter(t => t.concluida);
            break;
    }
    
    filtered.sort((a, b) => {
        if (a.concluida === b.concluida) {
            return new Date(a.prazo) - new Date(b.prazo);
        }
        return a.concluida ? 1 : -1;
    });
    
    if (filtered.length === 0) {
        tasksList.innerHTML = '<div class="list-item">Nenhuma tarefa encontrada</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(tarefa => {
        const cor = getCorDisciplina(tarefa.disciplina);
        const materiaClass = tarefa.disciplina;
        
        html += `
            <div class="task-item ${tarefa.concluida ? 'completed' : ''} prioridade-${tarefa.prioridade || 'media'}" 
                 onclick="toggleTaskComplete('${tarefa.id}')">
                <div class="task-color ${materiaClass}" style="background-color: ${cor};"></div>
                <div class="task-info">
                    <div class="task-title">${tarefa.nome}</div>
                    <div class="task-subject">${getTextoDisciplina(tarefa.disciplina)}</div>
                    <div class="task-date">
                        <ion-icon name="calendar-outline"></ion-icon>
                        ${formatarData(tarefa.prazo)}
                    </div>
                </div>
                <div class="task-check ${tarefa.concluida ? 'checked' : ''}" onclick="event.stopPropagation(); toggleTaskComplete('${tarefa.id}')">
                    ${tarefa.concluida ? '<ion-icon name="checkmark-outline"></ion-icon>' : ''}
                </div>
                <ion-icon name="chevron-forward-outline" class="task-arrow" onclick="event.stopPropagation(); openTaskModal('${tarefa.id}')"></ion-icon>
            </div>
        `;
    });
    
    tasksList.innerHTML = html;
}

function renderNotes() {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) return;
    
    const searchTerm = document.getElementById('notes-search-input')?.value.toLowerCase() || '';
    
    let filtered = anotacoes;
    if (searchTerm) {
        filtered = filtered.filter(n => 
            n.titulo.toLowerCase().includes(searchTerm) || 
            (n.conteudo && n.conteudo.toLowerCase().includes(searchTerm)) ||
            (n.materia && n.materia.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filtered.length === 0) {
        notesGrid.innerHTML = '<div class="list-item" style="grid-column: span 2;">Nenhuma anotação encontrada</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(nota => {
        html += `
            <div class="note-card ${nota.cor || 'matematica'}" onclick="openNoteModal('${nota.id}')">
                <div>
                    <div class="note-title">${nota.titulo}</div>
                    <div class="note-subject">${nota.materia || 'Geral'}</div>
                </div>
                <div class="note-date">${formatarDataRelativa(nota.dataModificacao)}</div>
            </div>
        `;
    });
    
    notesGrid.innerHTML = html;
}

// ==================== FUNÇÕES DE MODAIS ====================

function openEditModal() {
    document.getElementById('edit-modal').classList.add('active');
    renderEditSchedule();
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    renderSchedule();
}

function openSubjectModal(dia, hora) {
    window.currentEditingCell = { dia, hora };
    document.getElementById('subject-modal-title').textContent = 'Adicionar Matéria';
    document.getElementById('subject-name-input').value = '';
    document.getElementById('subject-teacher-input').value = '';
    document.getElementById('subject-start-input').value = hora;
    document.getElementById('subject-end-input').value = adicionarHora(hora, 1);
    document.getElementById('subject-day-input').value = dia;
    
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector('.color-option[data-color="#6366f1"]').classList.add('active');
    
    document.getElementById('subject-modal').classList.add('active');
}

function editSubject(dia, hora, id) {
    const aula = weeklySchedule[dia]?.find(a => a.id === id);
    if (!aula) return;
    
    window.currentEditingCell = { dia, hora, id };
    document.getElementById('subject-modal-title').textContent = 'Editar Matéria';
    document.getElementById('subject-name-input').value = aula.materia;
    document.getElementById('subject-teacher-input').value = aula.professor || '';
    document.getElementById('subject-start-input').value = aula.hora;
    document.getElementById('subject-end-input').value = adicionarHora(aula.hora, 1);
    document.getElementById('subject-day-input').value = dia;
    
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    const corOption = Array.from(document.querySelectorAll('.color-option')).find(opt => 
        opt.dataset.color === aula.color
    );
    if (corOption) corOption.classList.add('active');
    
    document.getElementById('subject-modal').classList.add('active');
}

function deleteSubject(dia, hora, id) {
    if (confirm('Remover esta matéria?')) {
        weeklySchedule[dia] = weeklySchedule[dia].filter(a => a.id !== id);
        salvarHorario();
        renderEditSchedule();
        renderSchedule();
        renderClasses();
    }
    event.stopPropagation();
}

function saveSubject() {
    const nome = document.getElementById('subject-name-input').value;
    const professor = document.getElementById('subject-teacher-input').value;
    const hora = document.getElementById('subject-start-input').value;
    const dia = document.getElementById('subject-day-input').value;
    const cor = document.querySelector('.color-option.active')?.dataset.color || '#6366f1';
    
    if (!nome) {
        alert('Digite o nome da matéria');
        return;
    }
    
    if (!weeklySchedule[dia]) {
        weeklySchedule[dia] = [];
    }
    
    if (window.currentEditingCell?.id) {
        const index = weeklySchedule[dia].findIndex(a => a.id === window.currentEditingCell.id);
        if (index !== -1) {
            weeklySchedule[dia][index] = {
                ...weeklySchedule[dia][index],
                materia: nome,
                professor: professor,
                hora: hora,
                color: cor
            };
        }
    } else {
        const novaAula = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            hora: hora,
            materia: nome,
            color: cor,
            professor: professor
        };
        weeklySchedule[dia].push(novaAula);
    }
    
    weeklySchedule[dia].sort((a, b) => a.hora.localeCompare(b.hora));
    
    salvarHorario();
    atualizarTimeSlots();
    closeSubjectModal();
    renderEditSchedule();
    renderSchedule();
    renderClasses();
}

function closeSubjectModal() {
    document.getElementById('subject-modal').classList.remove('active');
    window.currentEditingCell = null;
}

function openNotificationsModal() {
    document.getElementById('notifications-modal').classList.add('active');
    renderNotificationsModal('all');
    
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.type === 'all') tab.classList.add('active');
    });
}

function closeNotificationsModal() {
    document.getElementById('notifications-modal').classList.remove('active');
}

function openEventModal(id = null) {
    if (id) {
        const evento = eventos.find(e => e.id == id);
        if (evento) {
            document.getElementById('event-title').value = evento.title;
            document.getElementById('event-date').value = `${evento.year}-${String(evento.month+1).padStart(2,'0')}-${String(evento.day).padStart(2,'0')}`;
            document.getElementById('event-start').value = evento.time;
            document.getElementById('event-end').value = evento.endTime || '';
            
            document.querySelectorAll('.event-types .type-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type === evento.type) btn.classList.add('active');
            });
            
            document.querySelectorAll('.event-modal .color-option').forEach(opt => opt.classList.remove('active'));
            const corOption = Array.from(document.querySelectorAll('.event-modal .color-option')).find(opt => 
                opt.dataset.color === evento.color
            );
            if (corOption) corOption.classList.add('active');
            
            window.currentEventId = id;
        }
    } else {
        document.getElementById('event-title').value = '';
        document.getElementById('event-date').value = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
        document.getElementById('event-start').value = '08:00';
        document.getElementById('event-end').value = '09:00';
        
        document.querySelectorAll('.event-types .type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === 'aula') btn.classList.add('active');
        });
        
        document.querySelectorAll('.event-modal .color-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector('.event-modal .color-option[data-color="#8b5cf6"]').classList.add('active');
        
        window.currentEventId = null;
    }
    
    document.getElementById('event-modal').classList.add('active');
}

function saveEvent() {
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const start = document.getElementById('event-start').value;
    const end = document.getElementById('event-end').value;
    const type = document.querySelector('.event-types .type-btn.active')?.dataset.type || 'aula';
    const color = document.querySelector('.event-modal .color-option.active')?.dataset.color || '#8b5cf6';
    
    if (!title || !date) {
        alert('Preencha os campos obrigatórios');
        return;
    }
    
    const [year, month, day] = date.split('-').map(Number);
    
    if (window.currentEventId) {
        const index = eventos.findIndex(e => e.id == window.currentEventId);
        if (index !== -1) {
            eventos[index] = {
                ...eventos[index],
                title,
                day,
                month: month - 1,
                year,
                time: start,
                endTime: end,
                type,
                color
            };
        }
    } else {
        eventos.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            title,
            day,
            month: month - 1,
            year,
            time: start,
            endTime: end,
            type,
            color
        });
    }
    
    salvarEventos();
    closeEventModal();
    renderCalendar();
}

function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
    window.currentEventId = null;
}

function openTaskModal(id = null) {
    if (id) {
        const tarefa = tarefas.find(t => t.id == id);
        if (tarefa) {
            document.getElementById('task-title').value = tarefa.nome;
            document.getElementById('task-subject').value = getTextoDisciplina(tarefa.disciplina);
            document.getElementById('task-date').value = tarefa.prazo || '';
            
            document.querySelectorAll('.task-types .type-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type === tarefa.disciplina) btn.classList.add('active');
            });
            
            document.querySelectorAll('.priority-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.priority === tarefa.prioridade) btn.classList.add('active');
            });
            
            document.querySelectorAll('.task-modal .color-option').forEach(opt => opt.classList.remove('active'));
            const cor = getCorDisciplina(tarefa.disciplina);
            const corOption = Array.from(document.querySelectorAll('.task-modal .color-option')).find(opt => 
                opt.dataset.color === cor
            );
            if (corOption) corOption.classList.add('active');
            
            window.currentTaskId = id;
        }
    } else {
        document.getElementById('task-title').value = '';
        document.getElementById('task-subject').value = '';
        document.getElementById('task-date').value = '';
        
        document.querySelectorAll('.task-types .type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === 'matematica') btn.classList.add('active');
        });
        
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.priority === 'media') btn.classList.add('active');
        });
        
        document.querySelectorAll('.task-modal .color-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector('.task-modal .color-option[data-color="#6366f1"]').classList.add('active');
        
        window.currentTaskId = null;
    }
    
    document.getElementById('task-modal-title').textContent = id ? 'Editar Tarefa' : 'Nova Tarefa';
    document.getElementById('task-modal').classList.add('active');
}

function saveTask() {
    const title = document.getElementById('task-title').value;
    const subject = document.getElementById('task-subject').value;
    const date = document.getElementById('task-date').value;
    const type = document.querySelector('.task-types .type-btn.active')?.dataset.type || 'matematica';
    const priority = document.querySelector('.priority-btn.active')?.dataset.priority || 'media';
    
    if (!title) {
        alert('Digite o título da tarefa');
        return;
    }
    
    if (window.currentTaskId) {
        const index = tarefas.findIndex(t => t.id == window.currentTaskId);
        if (index !== -1) {
            tarefas[index] = {
                ...tarefas[index],
                nome: title,
                disciplina: type,
                prazo: date,
                prioridade: priority
            };
        }
    } else {
        tarefas.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            nome: title,
            disciplina: type,
            prazo: date,
            concluida: false,
            prioridade: priority
        });
    }
    
    salvarTarefas();
    closeTaskModal();
    renderTasks();
    atualizarCardsResumo();
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
    window.currentTaskId = null;
}

function openNoteModal(id = null) {
    if (id) {
        const nota = anotacoes.find(n => n.id == id);
        if (nota) {
            document.getElementById('note-title').value = nota.titulo;
            document.getElementById('note-subject').value = nota.materia || '';
            document.getElementById('note-content').value = nota.conteudo || '';
            
            document.querySelectorAll('.note-modal .color-option').forEach(opt => opt.classList.remove('active'));
            const corOption = Array.from(document.querySelectorAll('.note-modal .color-option')).find(opt => 
                opt.dataset.color === nota.cor
            );
            if (corOption) corOption.classList.add('active');
            
            window.currentNoteId = id;
        }
    } else {
        document.getElementById('note-title').value = '';
        document.getElementById('note-subject').value = '';
        document.getElementById('note-content').value = '';
        
        document.querySelectorAll('.note-modal .color-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector('.note-modal .color-option[data-color="fisica"]').classList.add('active');
        
        window.currentNoteId = null;
    }
    
    document.getElementById('note-modal-title').textContent = id ? 'Editar Anotação' : 'Nova Anotação';
    document.getElementById('note-modal').classList.add('active');
}

function saveNote() {
    const title = document.getElementById('note-title').value;
    const subject = document.getElementById('note-subject').value;
    const content = document.getElementById('note-content').value;
    const cor = document.querySelector('.note-modal .color-option.active')?.dataset.color || 'fisica';
    
    if (!title) {
        alert('Digite o título da anotação');
        return;
    }
    
    if (window.currentNoteId) {
        const index = anotacoes.findIndex(n => n.id == window.currentNoteId);
        if (index !== -1) {
            anotacoes[index] = {
                ...anotacoes[index],
                titulo: title,
                materia: subject,
                conteudo: content,
                cor: cor,
                dataModificacao: new Date().toISOString()
            };
        }
    } else {
        anotacoes.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            titulo: title,
            materia: subject,
            conteudo: content,
            cor: cor,
            dataModificacao: new Date().toISOString()
        });
    }
    
    salvarAnotacoes();
    closeNoteModal();
    renderNotes();
}

function closeNoteModal() {
    document.getElementById('note-modal').classList.remove('active');
    window.currentNoteId = null;
}

function openProfileModal(modalId) {
    if (modalId === 'dados-modal') {
        document.getElementById('profile-name-input').value = usuarioAtual.nome || '';
        document.getElementById('profile-email-input').value = usuarioAtual.email || '';
        document.getElementById('profile-phone-input').value = usuarioAtual.telefone || '';
        document.getElementById('profile-birth-input').value = usuarioAtual.nascimento || '';
    }
    
    document.getElementById(modalId).classList.add('active');
}

function closeProfileModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function saveProfileData() {
    usuarioAtual.nome = document.getElementById('profile-name-input').value;
    usuarioAtual.telefone = document.getElementById('profile-phone-input').value;
    usuarioAtual.nascimento = document.getElementById('profile-birth-input').value;
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    atualizarInterfaceUsuario();
    closeProfileModal('dados-modal');
    alert('Dados salvos com sucesso!');
}

function savePassword() {
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (!current || !newPass || !confirm) {
        alert('Preencha todos os campos');
        return;
    }
    
    if (newPass !== confirm) {
        alert('As senhas não conferem');
        return;
    }
    
    if (newPass.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    alert('Senha alterada com sucesso!');
    closeProfileModal('seguranca-modal');
    
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

function saveAppearance() {
    const theme = document.querySelector('.theme-btn.active')?.dataset.theme || 'dark';
    const accent = document.querySelector('.aparencia-modal .color-option.active')?.dataset.accent || '#8b5cf6';
    const fontSize = document.getElementById('font-size-slider').value;
    
    usuarioAtual.aparencia = { theme, accent, fontSize };
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    
    aplicarTema(theme, accent, fontSize);
    
    closeProfileModal('aparencia-modal');
    alert('Aparência atualizada!');
}

function aplicarTema(theme, accent, fontSize) {
    if (theme === 'light') {
        document.documentElement.style.setProperty('--bg-color', '#f5f7fa');
        document.documentElement.style.setProperty('--card-bg', '#ffffff');
        document.documentElement.style.setProperty('--text-primary', '#1a1d24');
        document.documentElement.style.setProperty('--text-secondary', '#6b7280');
        document.documentElement.style.setProperty('--border-color', '#e5e7eb');
        document.documentElement.style.setProperty('--nav-bg', '#ffffff');
    } else {
        document.documentElement.style.setProperty('--bg-color', '#0f1115');
        document.documentElement.style.setProperty('--card-bg', '#1a1d24');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', '#9ca3af');
        document.documentElement.style.setProperty('--border-color', '#2d3748');
        document.documentElement.style.setProperty('--nav-bg', '#1a1d24');
    }
    
    document.documentElement.style.setProperty('--accent-purple', accent);
    document.documentElement.style.fontSize = fontSize + 'px';
}

// ==================== FUNÇÕES DE AÇÃO ====================

function selectDay(day) {
    selectedDate = new Date(currentYear, currentMonth, day);
    renderCalendar();
}

function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function toggleTaskComplete(id) {
    const tarefa = tarefas.find(t => t.id == id);
    if (tarefa) {
        tarefa.concluida = !tarefa.concluida;
        salvarTarefas();
        renderTasks();
        atualizarCardsResumo();
    }
}

function markAsRead(id) {
    const index = notifications.findIndex(n => n.id == id);
    if (index > -1 && !notifications[index].read) {
        notifications[index].read = true;
        salvarNotificacoes();
        atualizarBadgeNotificacoes();
        renderNotifications();
        renderNotificationsModal(document.querySelector('.notification-tab.active')?.dataset.type || 'all');
    }
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    salvarNotificacoes();
    atualizarBadgeNotificacoes();
    renderNotifications();
    renderNotificationsModal(document.querySelector('.notification-tab.active')?.dataset.type || 'all');
}

function deleteNotification(id) {
    notifications = notifications.filter(n => n.id != id);
    salvarNotificacoes();
    atualizarBadgeNotificacoes();
    renderNotifications();
    renderNotificationsModal(document.querySelector('.notification-tab.active')?.dataset.type || 'all');
}

function clearAllNotifications() {
    if (confirm('Limpar todas as notificações?')) {
        notifications = [];
        salvarNotificacoes();
        atualizarBadgeNotificacoes();
        renderNotifications();
        renderNotificationsModal('all');
    }
}

function filterTasks(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) btn.classList.add('active');
    });
    
    renderTasks();
}

function searchNotes() {
    renderNotes();
}

function logout() {
    if (confirm('Deseja sair da sua conta?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

function toggleFaq(element) {
    element.classList.toggle('active');
}

function addNewTime() {
    const newTime = document.getElementById('new-time-input').value;
    if (!newTime) return;
    
    if (!timeSlots.includes(newTime)) {
        timeSlots.push(newTime);
        timeSlots.sort();
        renderEditSchedule();
    }
    
    document.getElementById('new-time-input').value = '';
}

function cancelNewTime() {
    document.getElementById('new-time-input').value = '11:00';
}

// ==================== FUNÇÕES DE SALVAMENTO ====================

function salvarHorario() {
    if (usuarioAtual) {
        localStorage.setItem(`horario_${usuarioAtual.email}`, JSON.stringify(weeklySchedule));
    }
}

function salvarTarefas() {
    if (usuarioAtual) {
        localStorage.setItem(`tarefas_${usuarioAtual.email}`, JSON.stringify(tarefas));
    }
}

function salvarAnotacoes() {
    if (usuarioAtual) {
        localStorage.setItem(`anotacoes_${usuarioAtual.email}`, JSON.stringify(anotacoes));
    }
}

function salvarEventos() {
    if (usuarioAtual) {
        localStorage.setItem(`eventos_${usuarioAtual.email}`, JSON.stringify(eventos));
    }
}

function salvarNotificacoes() {
    if (usuarioAtual) {
        localStorage.setItem(`notificacoes_${usuarioAtual.email}`, JSON.stringify(notifications));
    }
}

function salvarTodosDados() {
    salvarHorario();
    salvarTarefas();
    salvarAnotacoes();
    salvarEventos();
    salvarNotificacoes();
}

// ==================== FUNÇÕES AUXILIARES ====================

function getTextoDisciplina(disciplina) {
    const textos = {
        matematica: 'Matemática', portugues: 'Português', historia: 'História',
        fisica: 'Física', quimica: 'Química', biologia: 'Biologia',
        geografia: 'Geografia', ingles: 'Inglês', outros: 'Outros'
    };
    return textos[disciplina] || disciplina || 'Geral';
}

function getCorDisciplina(disciplina) {
    const cores = {
        matematica: '#6366f1', portugues: '#ec4899', historia: '#f59e0b',
        fisica: '#ef4444', quimica: '#10b981', biologia: '#3b82f6',
        geografia: '#a855f7', ingles: '#8b5cf6', outros: '#6b7280'
    };
    return cores[disciplina] || '#6366f1';
}

function getNotificationIcon(type) {
    const icons = {
        aula: 'school-outline',
        tarefa: 'checkbox-outline',
        lembrete: 'alarm-outline',
        aviso: 'warning-outline'
    };
    return icons[type] || 'notifications-outline';
}

function getEventIcon(type) {
    const icons = {
        aula: 'school-outline',
        prova: 'document-text-outline',
        tarefa: 'checkbox-outline',
        trabalho: 'briefcase-outline',
        apresentacao: 'videocam-outline',
        reuniao: 'people-outline',
        outro: 'calendar-outline'
    };
    return icons[type] || 'calendar-outline';
}

function adicionarHora(hora, horas) {
    const [h, m] = hora.split(':').map(Number);
    return `${String((h + horas) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatarData(data) {
    if (!data) return 'Sem data';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

function formatarDataRelativa(data) {
    if (!data) return 'Desconhecido';
    const agora = new Date();
    const dataObj = new Date(data);
    const diffMs = agora - dataObj;
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffDias === 0) return 'Hoje';
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    return dataObj.toLocaleDateString('pt-BR');
}

function formatarTempoRelativo(timestamp) {
    const agora = new Date();
    const data = new Date(timestamp);
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)} h atrás`;
    return formatarDataRelativa(timestamp);
}

function atualizarBadgeNotificacoes() {
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
}

function atualizarCardsResumo() {
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.concluida).length;
    const tarefasPendentes = totalTarefas - tarefasConcluidas;
    
    const disciplinas = new Set(tarefas.map(t => t.disciplina).filter(Boolean));
    
    document.querySelector('.card:nth-child(1) .card-number').textContent = disciplinas.size || 12;
    document.querySelector('.card:nth-child(2) .card-number').textContent = tarefasConcluidas;
    document.querySelector('.card:nth-child(3) .card-number').textContent = tarefasPendentes;
}

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
    
    if (usuarioAtual.avatar) {
        const avatarPreview = document.getElementById('avatar-preview');
        const profileAvatar = document.querySelector('.profile-avatar');
        if (avatarPreview) {
            avatarPreview.innerHTML = `<img src="${usuarioAtual.avatar}" style="width:100%;height:100%;object-fit:cover;">`;
        }
        if (profileAvatar && profileAvatar.querySelector('span')) {
            profileAvatar.querySelector('span').style.display = 'none';
            profileAvatar.innerHTML = `<img src="${usuarioAtual.avatar}" style="width:100%;height:100%;object-fit:cover;">`;
        }
    }
    
    if (usuarioAtual.aparencia) {
        aplicarTema(
            usuarioAtual.aparencia.theme || 'dark',
            usuarioAtual.aparencia.accent || '#8b5cf6',
            usuarioAtual.aparencia.fontSize || 14
        );
    }
}

// ==================== CONFIGURAÇÃO DE EVENT LISTENERS ====================

function configurarEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const view = item.dataset.view;
            if (!view) return;
            
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            document.querySelectorAll('#home-view, #calendar-view, #tasks-view, #notes-view, #profile-view').forEach(v => {
                v.classList.add('hidden');
            });
            
            document.getElementById(`${view}-view`).classList.remove('hidden');
            
            if (view === 'home') {
                renderSchedule();
                renderClasses();
                renderNotifications();
            } else if (view === 'calendar') {
                renderCalendar();
            } else if (view === 'tasks') {
                renderTasks();
            } else if (view === 'notes') {
                renderNotes();
            }
        });
    });
    
    const toggleEdit = document.getElementById('toggle-edit-mode');
    if (toggleEdit) {
        toggleEdit.addEventListener('click', openEditModal);
    }
    
    const btnBack = document.getElementById('btn-back');
    if (btnBack) btnBack.addEventListener('click', closeEditModal);
    
    const btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.addEventListener('click', closeEditModal);
    
    const btnAddTime = document.getElementById('btn-add-time');
    if (btnAddTime) btnAddTime.addEventListener('click', addNewTime);
    
    const btnCancelTime = document.getElementById('btn-cancel-time');
    if (btnCancelTime) btnCancelTime.addEventListener('click', cancelNewTime);
    
    const btnSaveSubject = document.getElementById('btn-save-subject');
    if (btnSaveSubject) btnSaveSubject.addEventListener('click', saveSubject);
    
    document.querySelectorAll('[data-modal="subject-modal"]').forEach(btn => {
        btn.addEventListener('click', closeSubjectModal);
    });
    
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', openNotificationsModal);
    }
    
    const btnCloseNotifications = document.getElementById('btn-close-notifications');
    if (btnCloseNotifications) {
        btnCloseNotifications.addEventListener('click', closeNotificationsModal);
    }
    
    const btnMarkRead = document.getElementById('btn-mark-read');
    if (btnMarkRead) {
        btnMarkRead.addEventListener('click', markAllAsRead);
    }
    
    const btnClearAll = document.getElementById('btn-clear-all');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', clearAllNotifications);
    }
    
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });
    
    const prevMonth = document.getElementById('prev-month');
    if (prevMonth) prevMonth.addEventListener('click', () => changeMonth(-1));
    
    const nextMonth = document.getElementById('next-month');
    if (nextMonth) nextMonth.addEventListener('click', () => changeMonth(1));
    
    const btnNewEvent = document.getElementById('btn-new-event');
    if (btnNewEvent) btnNewEvent.addEventListener('click', () => openEventModal());
    
    const btnSaveEvent = document.getElementById('btn-save-event');
    if (btnSaveEvent) btnSaveEvent.addEventListener('click', saveEvent);
    
    document.querySelectorAll('[data-modal="event-modal"]').forEach(btn => {
        btn.addEventListener('click', closeEventModal);
    });
    
    document.querySelectorAll('.event-types .type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.event-types .type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    const btnAddTask = document.getElementById('btn-add-task');
    if (btnAddTask) btnAddTask.addEventListener('click', () => openTaskModal());
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterTasks(btn.dataset.filter);
        });
    });
    
    const btnSaveTask = document.getElementById('btn-save-task');
    if (btnSaveTask) btnSaveTask.addEventListener('click', saveTask);
    
    document.querySelectorAll('[data-modal="task-modal"]').forEach(btn => {
        btn.addEventListener('click', closeTaskModal);
    });
    
    document.querySelectorAll('.task-types .type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.task-types .type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    const btnAddNote = document.getElementById('btn-add-note');
    if (btnAddNote) btnAddNote.addEventListener('click', () => openNoteModal());
    
    const notesSearch = document.getElementById('notes-search-input');
    if (notesSearch) {
        notesSearch.addEventListener('input', searchNotes);
    }
    
    const btnSaveNote = document.getElementById('btn-save-note');
    if (btnSaveNote) btnSaveNote.addEventListener('click', saveNote);
    
    document.querySelectorAll('[data-modal="note-modal"]').forEach(btn => {
        btn.addEventListener('click', closeNoteModal);
    });
    
    document.querySelectorAll('.menu-item[data-action]').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            
            if (action === 'logout') {
                logout();
            } else if (action === 'dados') {
                openProfileModal('dados-modal');
            } else if (action === 'seguranca') {
                openProfileModal('seguranca-modal');
            } else if (action === 'notificacoes') {
                openProfileModal('notificacoes-modal');
            } else if (action === 'aparencia') {
                openProfileModal('aparencia-modal');
            } else if (action === 'ajuda') {
                openProfileModal('ajuda-modal');
            }
        });
    });
    
    document.querySelectorAll('[data-modal="dados-modal"]').forEach(btn => {
        btn.addEventListener('click', () => closeProfileModal('dados-modal'));
    });
    
    document.querySelectorAll('[data-modal="seguranca-modal"]').forEach(btn => {
        btn.addEventListener('click', () => closeProfileModal('seguranca-modal'));
    });
    
    document.querySelectorAll('[data-modal="notificacoes-modal"]').forEach(btn => {
        btn.addEventListener('click', () => closeProfileModal('notificacoes-modal'));
    });
    
    document.querySelectorAll('[data-modal="aparencia-modal"]').forEach(btn => {
        btn.addEventListener('click', () => closeProfileModal('aparencia-modal'));
    });
    
    document.querySelectorAll('[data-modal="ajuda-modal"]').forEach(btn => {
        btn.addEventListener('click', () => closeProfileModal('ajuda-modal'));
    });
    
    const btnSaveDados = document.getElementById('btn-save-dados');
    if (btnSaveDados) btnSaveDados.addEventListener('click', saveProfileData);
    
    const btnSaveSenha = document.getElementById('btn-save-senha');
    if (btnSaveSenha) btnSaveSenha.addEventListener('click', savePassword);
    
    const btnSaveNotificacoes = document.getElementById('btn-save-notificacoes');
    if (btnSaveNotificacoes) {
        btnSaveNotificacoes.addEventListener('click', saveNotificationSettings);
    }
    
    const btnSaveAparencia = document.getElementById('btn-save-aparencia');
    if (btnSaveAparencia) btnSaveAparencia.addEventListener('click', saveAppearance);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const container = opt.closest('.color-options');
            if (container) {
                container.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
            }
            opt.classList.add('active');
        });
    });
    
    const fontSizeSlider = document.getElementById('font-size-slider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
            document.documentElement.style.fontSize = e.target.value + 'px';
        });
    }
    
    const btnContato = document.getElementById('btn-contato');
    if (btnContato) {
        btnContato.addEventListener('click', () => {
            alert('Para suporte, envie um e-mail para: suporte@painelaluno.com');
        });
    }
    
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const avatarInput = document.getElementById('avatar-input');
    
    if (btnChangeAvatar && avatarInput) {
        btnChangeAvatar.addEventListener('click', () => {
            avatarInput.click();
        });
        
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    usuarioAtual.avatar = event.target.result;
                    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
                    atualizarInterfaceUsuario();
                    
                    const avatarPreview = document.getElementById('avatar-preview');
                    if (avatarPreview) {
                        avatarPreview.innerHTML = `<img src="${event.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    setInterval(() => {
        salvarTodosDados();
    }, 30000);
    
    window.addEventListener('beforeunload', () => {
        salvarTodosDados();
    });
}

function inicializarComponentes() {
    renderSchedule();
    renderClasses();
    renderNotifications();
    renderCalendar();
    renderTasks();
    renderNotes();
}

// ==================== SISTEMA DE NOTIFICAÇÕES COMPLETO ====================

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Este navegador não suporta notificações');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        console.log('Permissão já concedida');
        return true;
    }
    
    if (Notification.permission === 'denied') {
        console.log('Permissão negada');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
        return false;
    }
}

async function dispararNotificacaoLocal(options) {
    if (Notification.permission !== 'granted') {
        console.log('Permissão negada');
        return false;
    }
    
    const config = await localDB.getConfigNotificacoes();
    
    if (options.data?.type === 'aula' && !config.aulas) return false;
    if (options.data?.type === 'tarefa' && !config.tarefas) return false;
    if (options.data?.type === 'lembrete' && !config.lembrete_estudo) return false;
    
    const defaultOptions = {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: `notif-${Date.now()}`,
        requireInteraction: false,
        silent: false,
        actions: [
            { action: 'open', title: 'Ver detalhes' },
            { action: 'close', title: 'Fechar' }
        ]
    };
    
    const notificationOptions = { ...defaultOptions, ...options };
    
    try {
        const notification = new Notification(options.title, notificationOptions);
        
        await localDB.salvarNotificacao({
            tag: notificationOptions.tag,
            titulo: options.title,
            mensagem: options.body,
            data: options.data
        });
        
        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            
            if (options.data?.type) {
                switch(options.data.type) {
                    case 'tarefa':
                        document.querySelector('[data-view="tasks"]').click();
                        break;
                    case 'evento':
                    case 'aula':
                        document.querySelector('[data-view="calendar"]').click();
                        break;
                    case 'lembrete':
                        document.querySelector('[data-view="tasks"]').click();
                        break;
                }
            }
            
            notification.close();
        };
        
        return true;
    } catch (error) {
        console.error('Erro ao disparar notificação:', error);
        return false;
    }
}

async function verificarEAgendarNotificacoes() {
    console.log('Verificando notificações...');
    
    if (!usuarioAtual) return;
    
    const config = await localDB.getConfigNotificacoes();
    
    if (config.tarefas) {
        await verificarTarefasParaNotificacao();
    }
    
    if (config.aulas) {
        await verificarEventosParaNotificacao();
    }
    
    if (config.lembrete_estudo) {
        await verificarLembreteEstudo();
    }
    
    await atualizarBadgeNotificacoesDB();
}

async function verificarTarefasParaNotificacao() {
    const agora = new Date();
    
    for (const tarefa of tarefas) {
        if (tarefa.concluida || !tarefa.prazo) continue;
        
        const prazo = new Date(tarefa.prazo);
        const diffHoras = (prazo - agora) / (1000 * 60 * 60);
        
        const notificacoes = await localDB.getData('notificacoes') || [];
        const notifRecente = notificacoes.some(n => 
            n.data?.id === tarefa.id && 
            (Date.now() - n.timestamp) < 12 * 3600000
        );
        
        if (notifRecente) continue;
        
        if (diffHoras <= 24 && diffHoras > 23) {
            await dispararNotificacaoLocal({
                title: '⏰ Tarefa próxima do prazo!',
                body: `"${tarefa.nome}" vence amanhã (${formatarData(tarefa.prazo)})`,
                tag: `tarefa-${tarefa.id}-24h`,
                data: { type: 'tarefa', id: tarefa.id }
            });
        }
        
        if (diffHoras <= 1 && diffHoras > 0.5) {
            await dispararNotificacaoLocal({
                title: '⚠️ Tarefa vence hoje!',
                body: `"${tarefa.nome}" vence em ${Math.ceil(diffHoras * 60)} minutos`,
                tag: `tarefa-${tarefa.id}-1h`,
                data: { type: 'tarefa', id: tarefa.id }
            });
        }
        
        if (diffHoras < 0 && diffHoras > -24) {
            await dispararNotificacaoLocal({
                title: '🚨 Tarefa atrasada!',
                body: `"${tarefa.nome}" está atrasada há ${Math.abs(Math.floor(diffHoras))} horas`,
                tag: `tarefa-${tarefa.id}-atrasada`,
                data: { type: 'tarefa', id: tarefa.id }
            });
        }
    }
}

async function verificarEventosParaNotificacao() {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const config = await localDB.getConfigNotificacoes();
    
    for (const evento of eventos) {
        const dataEvento = new Date(evento.year, evento.month, evento.day);
        
        if (dataEvento.toDateString() === hoje.toDateString()) {
            const [hora, minuto] = evento.time.split(':').map(Number);
            const dataHoraEvento = new Date(dataEvento);
            dataHoraEvento.setHours(hora, minuto, 0);
            
            const diffMinutos = (dataHoraEvento - agora) / (1000 * 60);
            
            const notificacoes = await localDB.getData('notificacoes') || [];
            const notifRecente = notificacoes.some(n => 
                n.data?.id === evento.id && 
                (Date.now() - n.timestamp) < 3600000
            );
            
            if (notifRecente) continue;
            
            if (diffMinutos <= config.antecedencia && diffMinutos > config.antecedencia - 5) {
                await dispararNotificacaoLocal({
                    title: `📅 ${evento.title}`,
                    body: `Começa em ${config.antecedencia} minutos (${evento.time})`,
                    tag: `evento-${evento.id}`,
                    data: { type: 'evento', id: evento.id }
                });
            }
        }
    }
}

async function verificarLembreteEstudo() {
    const pendentes = tarefas.filter(t => !t.concluida).length;
    if (pendentes === 0) return;
    
    const notificacoes = await localDB.getData('notificacoes') || [];
    const ultimoLembrete = notificacoes
        .filter(n => n.data?.type === 'lembrete')
        .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (ultimoLembrete && (Date.now() - ultimoLembrete.timestamp) < 4 * 3600000) {
        return;
    }
    
    const horas = [8, 12, 16, 20];
    const horaAtual = new Date().getHours();
    
    if (horas.includes(horaAtual)) {
        await dispararNotificacaoLocal({
            title: '📚 Hora de estudar!',
            body: `Você tem ${pendentes} tarefas pendentes. Que tal começar agora?`,
            tag: `lembrete-${Date.now()}`,
            data: { type: 'lembrete' }
        });
    }
}

async function atualizarBadgeNotificacoesDB() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    const naoLidas = await localDB.getNotificacoesNaoLidas();
    const total = naoLidas.length;
    
    if (total > 0) {
        badge.textContent = total > 9 ? '9+' : total;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

async function marcarNotificacaoComoLida(id) {
    await localDB.marcarComoLida(id);
    await atualizarBadgeNotificacoesDB();
    
    if (document.getElementById('notifications-modal').classList.contains('active')) {
        carregarNotificacoesModal();
    }
}

async function marcarTodasNotificacoesComoLidas() {
    await localDB.marcarTodasComoLidas();
    await atualizarBadgeNotificacoesDB();
    
    if (document.getElementById('notifications-modal').classList.contains('active')) {
        carregarNotificacoesModal();
    }
}

async function carregarNotificacoesModal(filter = 'all') {
    const container = document.getElementById('notifications-list-modal');
    if (!container) return;
    
    let todas = await localDB.getData('notificacoes') || [];
    todas.sort((a, b) => b.timestamp - a.timestamp);
    
    let filtradas = todas;
    if (filter === 'unread') {
        filtradas = todas.filter(n => !n.lida);
    } else if (filter === 'aulas') {
        filtradas = todas.filter(n => n.data?.type === 'aula' || n.data?.type === 'evento');
    } else if (filter === 'tarefas') {
        filtradas = todas.filter(n => n.data?.type === 'tarefa');
    }
    
    if (filtradas.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <ion-icon name="notifications-off-outline"></ion-icon>
                <p>Nenhuma notificação</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filtradas.forEach(notif => {
        const tipo = notif.data?.type || 'notificacao';
        const icone = getNotificationIcon(tipo);
        
        html += `
            <div class="notification-item-modal ${notif.lida ? 'read' : 'unread'}" onclick="marcarNotificacaoComoLida('${notif.id}')">
                <div class="notification-icon ${tipo}">
                    <ion-icon name="${icone}"></ion-icon>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.titulo}</div>
                    <div class="notification-message">${notif.mensagem}</div>
                    <div class="notification-time">
                        <ion-icon name="time-outline"></ion-icon>
                        ${formatarTempoRelativo(notif.timestamp)}
                    </div>
                </div>
                <div class="notification-actions">
                    <button class="notification-action-btn" onclick="event.stopPropagation(); excluirNotificacao('${notif.id}')">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function excluirNotificacao(id) {
    await localDB.deleteData('notificacoes', id);
    await atualizarBadgeNotificacoesDB();
    
    if (document.getElementById('notifications-modal').classList.contains('active')) {
        const tabAtiva = document.querySelector('.notification-tab.active')?.dataset.type || 'all';
        carregarNotificacoesModal(tabAtiva);
    }
    
    renderNotifications();
}

async function limparTodasNotificacoes() {
    if (confirm('Limpar todas as notificações?')) {
        await localDB.clearStore('notificacoes');
        await atualizarBadgeNotificacoesDB();
        
        if (document.getElementById('notifications-modal').classList.contains('active')) {
            carregarNotificacoesModal('all');
        }
        
        renderNotifications();
    }
}

async function testNotification() {
    const permitido = await requestNotificationPermission();
    
    if (!permitido) {
        alert('Permissão para notificações não concedida');
        return;
    }
    
    await dispararNotificacaoLocal({
        title: '🔔 Teste de Notificação',
        body: 'Se você está vendo isso, as notificações funcionam!',
        tag: `test-${Date.now()}`,
        data: { type: 'test' }
    });
}

async function updateNotificationStatus() {
    const statusEl = document.getElementById('notification-status');
    if (!statusEl) return;
    
    const indicator = statusEl.querySelector('.status-indicator');
    const text = statusEl.querySelector('.status-text');
    
    if (!('Notification' in window)) {
        indicator.className = 'status-indicator denied';
        text.textContent = 'Não suportado';
        return;
    }
    
    switch(Notification.permission) {
        case 'granted':
            indicator.className = 'status-indicator granted';
            text.textContent = 'Notificações ativadas ✓';
            break;
        case 'denied':
            indicator.className = 'status-indicator denied';
            text.textContent = 'Notificações bloqueadas';
            break;
        default:
            indicator.className = 'status-indicator default';
            text.textContent = 'Clique para ativar notificações';
    }
}

async function saveNotificationSettings() {
    const push = document.getElementById('toggle-push').checked;
    const email = document.getElementById('toggle-email').checked;
    const aulas = document.getElementById('toggle-aulas').checked;
    const tarefas = document.getElementById('toggle-tarefas').checked;
    const lembrete = document.getElementById('toggle-lembrete')?.checked ?? true;
    const antecedencia = parseInt(document.getElementById('notif-antecedencia')?.value || '30');
    
    const config = { push, email, aulas, tarefas, lembrete_estudo: lembrete, antecedencia };
    
    await localDB.salvarConfigNotificacoes(config);
    
    usuarioAtual.notificacoes = config;
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    
    closeProfileModal('notificacoes-modal');
    alert('Configurações salvas!');
    
    if (push) {
        await requestNotificationPermission();
    }
}

async function initNotificationSystem() {
    console.log('Inicializando sistema de notificações...');
    
    const config = await localDB.getConfigNotificacoes();
    
    if (config.push) {
        setTimeout(async () => {
            await requestNotificationPermission();
        }, 3000);
    }
    
    setInterval(async () => {
        if (navigator.onLine) {
            await verificarEAgendarNotificacoes();
        }
    }, 15 * 60 * 1000);
    
    setTimeout(async () => {
        await verificarEAgendarNotificacoes();
    }, 5000);
    
    document.addEventListener('click', () => {
        localStorage.setItem('ultimaAtividade', Date.now().toString());
    });
}

// Sobrescrever funções de salvamento
const originalSaveTarefas = salvarTarefas;
salvarTarefas = function() {
    originalSaveTarefas();
    verificarEAgendarNotificacoes();
};

const originalSaveEventos = salvarEventos;
salvarEventos = function() {
    originalSaveEventos();
    verificarEAgendarNotificacoes();
};

// Adicionar listeners para botões de notificação
document.addEventListener('DOMContentLoaded', () => {
    const btnTest = document.getElementById('btn-test-notification');
    if (btnTest) {
        btnTest.addEventListener('click', testNotification);
    }
    
    const notificacoesModal = document.getElementById('notificacoes-modal');
    if (notificacoesModal) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (notificacoesModal.classList.contains('active')) {
                        updateNotificationStatus();
                        
                        setTimeout(async () => {
                            const config = await localDB.getConfigNotificacoes();
                            document.getElementById('toggle-push').checked = config.push;
                            document.getElementById('toggle-aulas').checked = config.aulas;
                            document.getElementById('toggle-tarefas').checked = config.tarefas;
                            if (document.getElementById('toggle-lembrete')) {
                                document.getElementById('toggle-lembrete').checked = config.lembrete_estudo;
                            }
                            if (document.getElementById('notif-antecedencia')) {
                                document.getElementById('notif-antecedencia').value = config.antecedencia;
                            }
                        }, 100);
                    }
                }
            });
        });
        
        observer.observe(notificacoesModal, { attributes: true });
    }
});

// ==================== EXPOR FUNÇÕES GLOBAIS ====================
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.openSubjectModal = openSubjectModal;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
window.saveSubject = saveSubject;
window.closeSubjectModal = closeSubjectModal;
window.openNotificationsModal = openNotificationsModal;
window.closeNotificationsModal = closeNotificationsModal;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.deleteNotification = deleteNotification;
window.clearAllNotifications = clearAllNotifications;
window.selectDay = selectDay;
window.openEventModal = openEventModal;
window.saveEvent = saveEvent;
window.closeEventModal = closeEventModal;
window.openTaskModal = openTaskModal;
window.saveTask = saveTask;
window.closeTaskModal = closeTaskModal;
window.toggleTaskComplete = toggleTaskComplete;
window.openNoteModal = openNoteModal;
window.saveNote = saveNote;
window.closeNoteModal = closeNoteModal;
window.filterTasks = filterTasks;
window.searchNotes = searchNotes;
window.logout = logout;
window.toggleFaq = toggleFaq;
window.addNewTime = addNewTime;
window.cancelNewTime = cancelNewTime;
window.salvarTodosDados = salvarTodosDados;
window.atualizarCardsResumo = atualizarCardsResumo;
window.carregarTodosDados = carregarTodosDados;
window.marcarNotificacaoComoLida = marcarNotificacaoComoLida;
window.marcarTodasNotificacoesComoLidas = marcarTodasNotificacoesComoLidas;
window.excluirNotificacao = excluirNotificacao;
window.limparTodasNotificacoes = limparTodasNotificacoes;
window.testNotification = testNotification;
window.saveNotificationSettings = saveNotificationSettings;

console.log('%c📱 App Mobile Sincronizado', 'color: #8b5cf6; font-size: 20px; font-weight: bold;');
console.log('%cTodas as funcionalidades ativadas com persistência!', 'color: #10b981; font-size: 14px;');


// ==================== CORREÇÃO DA SOLICITAÇÃO DE PERMISSÃO ====================

// Função corrigida para solicitar permissão ao clicar no status
async function requestPermissionOnClick() {
    const statusEl = document.getElementById('notification-status');
    if (!statusEl) return;
    
    statusEl.style.cursor = 'pointer';
    statusEl.title = 'Clique para solicitar permissão';
    
    statusEl.addEventListener('click', async () => {
        const permitido = await requestNotificationPermission();
        if (permitido) {
            updateNotificationStatus();
            alert('✅ Permissão concedida! Agora você pode testar as notificações.');
        } else {
            alert('❌ Permissão negada. Você não receberá notificações.');
        }
    });
}

// Sobrescrever a função testNotification para solicitar permissão automaticamente
async function testNotificationCorrigido() {
    // Verificar permissão atual
    if (Notification.permission !== 'granted') {
        const confirmar = confirm('Para testar notificações, precisamos de sua permissão. Deseja permitir agora?');
        
        if (confirmar) {
            const permitido = await requestNotificationPermission();
            if (!permitido) {
                alert('Permissão negada. Não é possível testar a notificação.');
                return;
            }
        } else {
            return;
        }
    }
    
    // Se chegou aqui, tem permissão
    await dispararNotificacaoLocal({
        title: '🔔 Teste de Notificação',
        body: 'Se você está vendo isso, as notificações funcionam!',
        tag: `test-${Date.now()}`,
        data: { type: 'test' }
    });
}

// Substituir a função testNotification original
window.testNotification = testNotificationCorrigido;

// Adicionar listener para o status também
document.addEventListener('DOMContentLoaded', () => {
    // Chamar a função para tornar o status clicável
    setTimeout(requestPermissionOnClick, 1000);
    
    // Também tornar o botão de testar mais robusto
    const btnTest = document.getElementById('btn-test-notification');
    if (btnTest) {
        // Remover listener antigo se houver
        btnTest.replaceWith(btnTest.cloneNode(true));
        
        // Adicionar novo listener
        const newBtnTest = document.getElementById('btn-test-notification');
        if (newBtnTest) {
            newBtnTest.addEventListener('click', testNotificationCorrigido);
        }
    }
});

// Função para atualizar o texto do status e torná-lo interativo
async function updateNotificationStatusInterativo() {
    const statusEl = document.getElementById('notification-status');
    if (!statusEl) return;
    
    const indicator = statusEl.querySelector('.status-indicator');
    const text = statusEl.querySelector('.status-text');
    
    if (!('Notification' in window)) {
        indicator.className = 'status-indicator denied';
        text.textContent = 'Não suportado';
        return;
    }
    
    switch(Notification.permission) {
        case 'granted':
            indicator.className = 'status-indicator granted';
            text.textContent = 'Notificações ativadas ✓ (clique para testar)';
            break;
        case 'denied':
            indicator.className = 'status-indicator denied';
            text.textContent = 'Notificações bloqueadas - clique para abrir configurações';
            statusEl.addEventListener('click', () => {
                alert('Para ativar, vá nas configurações do navegador e permita notificações para este site.');
            });
            break;
        default:
            indicator.className = 'status-indicator default';
            text.textContent = 'Clique aqui para ativar notificações';
            statusEl.style.cursor = 'pointer';
            statusEl.addEventListener('click', async () => {
                const permitido = await requestNotificationPermission();
                if (permitido) {
                    updateNotificationStatusInterativo();
                    alert('✅ Permissão concedida!');
                }
            });
    }
}

// Substituir a função updateNotificationStatus original
window.updateNotificationStatus = updateNotificationStatusInterativo;

// Executar quando o modal abrir
document.addEventListener('DOMContentLoaded', () => {
    const notificacoesModal = document.getElementById('notificacoes-modal');
    if (notificacoesModal) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (notificacoesModal.classList.contains('active')) {
                        updateNotificationStatusInterativo();
                    }
                }
            });
        });
        
        observer.observe(notificacoesModal, { attributes: true });
    }
});
