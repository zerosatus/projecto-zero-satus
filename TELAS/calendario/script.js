// ===== VARIÁVEIS GLOBAIS =====
let events = [];
let currentDate = new Date();
let selectedDate = new Date();
let currentView = 'month';
let usuarioAtual = null;

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const weekDaysFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// DOM Elements
const calendarDays = document.getElementById('calendarDays');
const currentMonthEl = document.getElementById('currentMonth');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const selectedDayEl = document.getElementById('selectedDay');
const eventsListEl = document.getElementById('eventsList');
const newEventBtn = document.getElementById('newEventBtn');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const weekdaysHeader = document.querySelector('.weekdays');

// Modal Elements
const eventModal = document.getElementById('eventModal');
const modalClose = document.getElementById('modalClose');
const btnCancel = document.getElementById('btnCancel');
const eventForm = document.getElementById('eventForm');
const typeBtns = document.querySelectorAll('.type-btn');
const eventTypeInput = document.getElementById('eventType');

// ===== VERIFICAÇÃO DE LOGIN E INICIALIZAÇÃO =====
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    
    if (!usuario) {
        // Redirecionar para login se não estiver logado
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        // Atualizar nome do usuário na interface
        atualizarNomeUsuario();
        
        console.log('Usuário carregado:', usuarioAtual.nome);
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
    
    // Inicializar calendário
    carregarEventos();
    initCalendar();
});

// ===== ATUALIZAR NOME DO USUÁRIO =====
function atualizarNomeUsuario() {
    if (!usuarioAtual) return;
    
    const titulo = document.querySelector('.header h1');
    const userName = document.getElementById('userName');
    
    if (titulo) {
        titulo.textContent = `Bem-vindo, ${usuarioAtual.nome}!`;
    }
    
    if (userName) {
        userName.textContent = usuarioAtual.nome;
    }
    
    // Atualizar avatar se existir
    const userAvatar = document.querySelector('.user-profile img');
    if (userAvatar) {
        // Gerar avatar com iniciais se não tiver imagem
        const iniciais = usuarioAtual.nome
            .split(' ')
            .map(palavra => palavra.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
        
        // Se não tiver imagem, criar um placeholder com iniciais
        if (!userAvatar.src.includes('pravatar')) {
            userAvatar.src = `https://ui-avatars.com/api/?name=${iniciais}&background=7c3aed&color=fff&size=32`;
        }
    }
}

// ===== CARREGAR EVENTOS DO LOCALSTORAGE =====
function carregarEventos() {
    if (!usuarioAtual) return;
    
    const storageKey = `eventos_${usuarioAtual.email}`;
    const eventosSalvos = localStorage.getItem(storageKey);
    
    if (eventosSalvos) {
        events = JSON.parse(eventosSalvos);
    } else {
        // Eventos padrão para primeiro acesso
        events = [
            { 
                id: gerarId(),
                day: 28, 
                month: 7, // Agosto (0-index)
                year: 2025, 
                title: 'Prova de Matemática', 
                type: 'prova', 
                time: '11:00',
                endTime: '12:30',
                description: 'Prova sobre equações do segundo grau',
                repeat: 'nao'
            },
            { 
                id: gerarId(),
                day: 29, 
                month: 7, 
                year: 2025, 
                title: 'Trabalho de História', 
                type: 'trabalho', 
                time: '11:15',
                endTime: '12:15',
                description: 'Entrega do trabalho sobre Revolução Industrial',
                repeat: 'nao'
            },
            { 
                id: gerarId(),
                day: 30, 
                month: 7, 
                year: 2025, 
                title: 'Apresentação de Biologia', 
                type: 'apresentacao', 
                time: '15:00',
                endTime: '16:30',
                description: 'Apresentação sobre biodiversidade',
                repeat: 'nao'
            },
            { 
                id: gerarId(),
                day: 26, 
                month: 7, 
                year: 2025, 
                title: 'Reunião de Pais', 
                type: 'reuniao', 
                time: '09:00',
                endTime: '10:00',
                description: 'Reunião bimestral',
                repeat: 'nao'
            },
            { 
                id: gerarId(),
                day: 27, 
                month: 7, 
                year: 2025, 
                title: 'Aula de Física', 
                type: 'aula', 
                time: '15:00',
                endTime: '16:40',
                description: 'Aula sobre cinemática',
                repeat: 'semanal'
            },
            { 
                id: gerarId(),
                day: 5, 
                month: 7, 
                year: 2025, 
                title: 'Trabalho em Grupo', 
                type: 'trabalho', 
                time: '14:00',
                endTime: '15:30',
                description: 'Reunião do grupo para trabalho de Geografia',
                repeat: 'nao'
            },
            { 
                id: gerarId(),
                day: 12, 
                month: 7, 
                year: 2025, 
                title: 'Prova de História', 
                type: 'prova', 
                time: '10:00',
                endTime: '11:30',
                description: 'Prova sobre Idade Média',
                repeat: 'nao'
            },
        ];
        salvarEventos();
    }
}

// ===== SALVAR EVENTOS NO LOCALSTORAGE =====
function salvarEventos() {
    if (!usuarioAtual) return;
    
    const storageKey = `eventos_${usuarioAtual.email}`;
    localStorage.setItem(storageKey, JSON.stringify(events));
}

// ===== GERAR ID ÚNICO =====
function gerarId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Deseja sair?')) {
        // Salvar antes de sair
        salvarEventos();
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

// ===== MENU ATIVO =====
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// Initialize calendar
function initCalendar() {
    // Set default dates
    currentDate = new Date();
    selectedDate = new Date();
    
    renderCalendar();
    setupEventListeners();
    renderEventsForSelectedDay();
}

// Clear calendar container
function clearCalendar() {
    calendarDays.innerHTML = '';
    calendarDays.className = 'days';
    calendarDays.style.display = '';
    calendarDays.style.gridTemplateColumns = '';
}

// Main render function
function renderCalendar() {
    clearCalendar();
    
    if (currentView === 'month') {
        renderMonthView();
    } else if (currentView === 'week') {
        renderWeekView();
    } else if (currentView === 'day') {
        renderDayView();
    }
}

// Month View
function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    weekdaysHeader.style.display = 'grid';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayEl = createDayElement(daysInPrevMonth - i, true);
        calendarDays.appendChild(dayEl);
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dayEl = createDayElement(day, false, isToday);
        
        const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year);
        dayEvents.sort((a, b) => a.time.localeCompare(b.time));
        
        dayEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = `event ${event.type}`;
            eventEl.textContent = `${event.time} ${event.title}`;
            eventEl.title = event.description || event.title;
            dayEl.appendChild(eventEl);
        });
        
        dayEl.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedDate = new Date(year, month, day);
            selectedDayEl.textContent = day;
            renderEventsForSelectedDay();
            document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
            dayEl.classList.add('selected');
        });
        
        if (day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
            dayEl.classList.add('selected');
        }
        
        calendarDays.appendChild(dayEl);
    }
    
    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createDayElement(day, true);
        calendarDays.appendChild(dayEl);
    }
}

// Week View
function renderWeekView() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    currentMonthEl.textContent = `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
    weekdaysHeader.style.display = 'none';
    
    calendarDays.classList.add('week-view');
    calendarDays.style.display = 'grid';
    calendarDays.style.gridTemplateColumns = '70px repeat(7, 1fr)';
    
    const today = new Date();
    
    // Empty corner cell
    const cornerCell = document.createElement('div');
    cornerCell.style.backgroundColor = '#f9fafb';
    cornerCell.style.borderRight = '1px solid #e5e7eb';
    cornerCell.style.borderBottom = '1px solid #e5e7eb';
    calendarDays.appendChild(cornerCell);
    
    // Day headers
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        
        const isToday = dayDate.getDate() === today.getDate() && 
                       dayDate.getMonth() === today.getMonth() && 
                       dayDate.getFullYear() === today.getFullYear();
        
        const headerCell = document.createElement('div');
        headerCell.className = `week-header-cell ${isToday ? 'today' : ''}`;
        headerCell.innerHTML = `
            <div style="font-size: 0.75rem; color: #6b7280;">${weekDays[i]}</div>
            <div style="font-size: 1.5rem; font-weight: 600; margin-top: 0.25rem;">${dayDate.getDate()}</div>
        `;
        headerCell.style.backgroundColor = isToday ? '#ede9fe' : '#f9fafb';
        headerCell.style.borderRight = '1px solid #e5e7eb';
        headerCell.style.borderBottom = '1px solid #e5e7eb';
        headerCell.style.padding = '1rem 0.5rem';
        headerCell.style.textAlign = 'center';
        calendarDays.appendChild(headerCell);
    }
    
    // Time slots (24 hours)
    for (let hour = 0; hour < 24; hour++) {
        const timeCell = document.createElement('div');
        timeCell.className = 'time-label-cell';
        timeCell.textContent = `${hour.toString().padStart(2, '0')}:00`;
        calendarDays.appendChild(timeCell);
        
        for (let day = 0; day < 7; day++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + day);
            
            const cell = document.createElement('div');
            cell.className = 'week-hour-cell';
            cell.style.borderRight = '1px solid #e5e7eb';
            cell.style.borderBottom = '1px solid #e5e7eb';
            cell.style.height = '80px';
            cell.style.position = 'relative';
            cell.style.cursor = 'pointer';
            cell.style.backgroundColor = 'white';
            
            const hourEvents = events.filter(e => {
                const eventDate = new Date(e.year, e.month, e.day);
                const eventHour = parseInt(e.time.split(':')[0]);
                return eventDate.getTime() === dayDate.getTime() && eventHour === hour;
            });
            
            hourEvents.sort((a, b) => a.time.localeCompare(b.time));
            
            hourEvents.forEach((event, index) => {
                const eventEl = document.createElement('div');
                eventEl.className = `week-event ${event.type}`;
                eventEl.textContent = `${event.time} ${event.title}`;
                eventEl.title = event.description || event.title;
                eventEl.style.position = 'absolute';
                eventEl.style.left = '2px';
                eventEl.style.right = '2px';
                eventEl.style.top = `${index * 28 + 2}px`;
                eventEl.style.padding = '0.25rem 0.5rem';
                eventEl.style.borderRadius = '4px';
                eventEl.style.fontSize = '0.75rem';
                eventEl.style.color = 'white';
                eventEl.style.fontWeight = '500';
                eventEl.style.overflow = 'hidden';
                eventEl.style.zIndex = '10';
                cell.appendChild(eventEl);
            });
            
            cell.addEventListener('click', (e) => {
                if (e.target === cell || e.target.classList.contains('week-hour-cell')) {
                    e.stopPropagation();
                    selectedDate = dayDate;
                    selectedDayEl.textContent = dayDate.getDate();
                    renderEventsForSelectedDay();
                    
                    // Abrir modal para criar evento neste horário
                    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                    abrirModalComData(dayDate, hourStr);
                }
            });
            
            calendarDays.appendChild(cell);
        }
    }
}

// Day View
function renderDayView() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    
    currentMonthEl.textContent = `${weekDaysFull[selectedDate.getDay()]}, ${day} de ${monthNames[month]} de ${year}`;
    weekdaysHeader.style.display = 'none';
    
    calendarDays.classList.add('day-view');
    calendarDays.style.display = 'flex';
    calendarDays.style.flexDirection = 'column';
    
    const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year);
    dayEvents.sort((a, b) => a.time.localeCompare(b.time));
    
    for (let hour = 0; hour < 24; hour++) {
        const hourEvents = dayEvents.filter(e => parseInt(e.time.split(':')[0]) === hour);
        
        const timeSlot = document.createElement('div');
        timeSlot.className = 'day-time-slot';
        timeSlot.style.display = 'flex';
        timeSlot.style.borderBottom = '1px solid #e5e7eb';
        timeSlot.style.minHeight = '80px';
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'day-time-label';
        timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
        timeLabel.style.width = '80px';
        timeLabel.style.padding = '0.5rem 1rem';
        timeLabel.style.fontSize = '0.875rem';
        timeLabel.style.color = '#6b7280';
        timeLabel.style.fontWeight = '500';
        timeLabel.style.borderRight = '1px solid #e5e7eb';
        timeLabel.style.textAlign = 'right';
        timeLabel.style.flexShrink = '0';
        
        const timeContent = document.createElement('div');
        timeContent.className = 'day-time-content';
        timeContent.style.flex = '1';
        timeContent.style.padding = '0.5rem';
        timeContent.style.position = 'relative';
        
        hourEvents.forEach((event) => {
            const eventEl = document.createElement('div');
            eventEl.className = `day-event ${event.type}`;
            eventEl.innerHTML = `<strong>${event.time}</strong> ${event.title}`;
            eventEl.title = event.description || event.title;
            eventEl.style.padding = '0.75rem';
            eventEl.style.borderRadius = '8px';
            eventEl.style.marginBottom = '0.5rem';
            eventEl.style.color = 'white';
            eventEl.style.fontSize = '0.875rem';
            eventEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            timeContent.appendChild(eventEl);
        });
        
        timeSlot.appendChild(timeLabel);
        timeSlot.appendChild(timeContent);
        
        timeSlot.addEventListener('click', () => {
            const hourStr = `${hour.toString().padStart(2, '0')}:00`;
            abrirModalComData(selectedDate, hourStr);
        });
        
        calendarDays.appendChild(timeSlot);
    }
}

// Helper function
function createDayElement(day, isOtherMonth, isToday = false) {
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    if (isOtherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayEl.appendChild(dayNumber);
    
    return dayEl;
}

// Render events list
function renderEventsForSelectedDay() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    
    const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year);
    dayEvents.sort((a, b) => a.time.localeCompare(b.time));
    
    if (dayEvents.length === 0) {
        eventsListEl.innerHTML = '<p style="color: #6b7280; padding: 1rem; text-align: center;">Nenhum evento para este dia</p>';
        return;
    }
    
    eventsListEl.innerHTML = '';
    dayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.style.cursor = 'pointer';
        
        const colors = { 'prova': '#ef4444', 'trabalho': '#eab308', 'apresentacao': '#3b82f6', 'reuniao': '#8b5cf6', 'aula': '#10b981', 'outro': '#7c3aed' };
        eventItem.style.borderLeftColor = colors[event.type] || '#7c3aed';
        
        eventItem.innerHTML = `
            <div class="event-color" style="background-color: ${colors[event.type] || '#7c3aed'};"></div>
            <div class="event-info" style="flex: 1;">
                <h4>${event.title}</h4>
                <p>${event.time} - ${event.endTime || ''} ${event.description ? '• ' + event.description : ''}</p>
            </div>
            <button class="delete-event" onclick="excluirEvento('${event.id}', event)" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.5rem;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        eventsListEl.appendChild(eventItem);
    });
}

// ===== EXCLUIR EVENTO =====
function excluirEvento(eventId, event) {
    event.stopPropagation();
    
    if (confirm('Deseja excluir este evento?')) {
        events = events.filter(e => e.id !== eventId);
        salvarEventos();
        renderCalendar();
        renderEventsForSelectedDay();
        mostrarNotificacao('Evento excluído com sucesso!');
    }
}

// ===== ABRIR MODAL COM DATA PREENCHIDA =====
function abrirModalComData(data, horaInicio = '09:00') {
    const dateStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    document.getElementById('eventDate').value = dateStr;
    document.getElementById('eventStart').value = horaInicio;
    
    // Calcular hora de término (1 hora depois)
    const [hour, minute] = horaInicio.split(':').map(Number);
    const endHour = (hour + 1) % 24;
    document.getElementById('eventEnd').value = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    eventForm.reset();
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDescription').value = '';
    document.getElementById('eventDate').value = dateStr;
    document.getElementById('eventStart').value = horaInicio;
    document.getElementById('eventEnd').value = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    document.getElementById('eventType').value = 'aula';
    document.getElementById('eventRepeat').value = 'nao';
    document.getElementById('eventReminder').checked = false;
    
    typeBtns.forEach(btn => btn.classList.remove('active'));
    typeBtns[0].classList.add('active');
    
    eventModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Setup event listeners
function setupEventListeners() {
    // View toggle
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderCalendar();
        });
    });
    
    // Previous
    prevBtn.addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() - 7);
        } else {
            selectedDate.setDate(selectedDate.getDate() - 1);
            currentDate = new Date(selectedDate);
        }
        renderCalendar();
        renderEventsForSelectedDay();
    });
    
    // Next
    nextBtn.addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else {
            selectedDate.setDate(selectedDate.getDate() + 1);
            currentDate = new Date(selectedDate);
        }
        renderCalendar();
        renderEventsForSelectedDay();
    });
    
    // Modal: Open
    newEventBtn.addEventListener('click', () => {
        abrirModalComData(selectedDate);
    });
    
    // Modal: Close
    function closeModal() {
        eventModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    modalClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) closeModal();
    });
    
    // Type buttons
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            eventTypeInput.value = btn.dataset.type;
        });
    });
    
    // Form submission
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('eventTitle').value.trim();
        const description = document.getElementById('eventDescription').value.trim();
        const date = document.getElementById('eventDate').value;
        const start = document.getElementById('eventStart').value;
        const end = document.getElementById('eventEnd').value;
        const type = document.getElementById('eventType').value;
        const repeat = document.getElementById('eventRepeat').value;
        const reminder = document.getElementById('eventReminder').checked;
        
        if (!title) {
            alert('Por favor, preencha o título do evento.');
            return;
        }
        
        const eventDate = new Date(date + 'T12:00:00');
        
        const novoEvento = {
            id: gerarId(),
            day: eventDate.getDate(),
            month: eventDate.getMonth(),
            year: eventDate.getFullYear(),
            title: title,
            type: type,
            time: start,
            endTime: end,
            description: description,
            repeat: repeat,
            reminder: reminder,
            dataCriacao: new Date().toISOString()
        };
        
        events.push(novoEvento);
        
        // Criar eventos recorrentes
        if (repeat !== 'nao') {
            const repeatCount = repeat === 'diario' ? 6 : repeat === 'semanal' ? 3 : 11;
            for (let i = 1; i <= repeatCount; i++) {
                const repeatDate = new Date(eventDate);
                if (repeat === 'diario') repeatDate.setDate(repeatDate.getDate() + i);
                else if (repeat === 'semanal') repeatDate.setDate(repeatDate.getDate() + (i * 7));
                else if (repeat === 'mensal') repeatDate.setMonth(repeatDate.getMonth() + i);
                
                events.push({
                    ...novoEvento,
                    id: gerarId(),
                    day: repeatDate.getDate(),
                    month: repeatDate.getMonth(),
                    year: repeatDate.getFullYear()
                });
            }
        }
        
        salvarEventos();
        closeModal();
        renderCalendar();
        renderEventsForSelectedDay();
        mostrarNotificacao('Evento criado com sucesso!');
    });
    
    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && eventModal.classList.contains('active')) closeModal();
    });
}

// ===== MOSTRAR NOTIFICAÇÃO =====
function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 16px 24px; background-color: ${tipo === 'success' ? '#00b894' : '#d63031'};
        color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 2000; animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(notificacao);
    setTimeout(() => {
        notificacao.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// Adicionar estilo para notificações
if (!document.querySelector('#calendar-styles')) {
    const style = document.createElement('style');
    style.id = 'calendar-styles';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .delete-event:hover {
            opacity: 0.8;
            transform: scale(1.1);
        }
        .event-item {
            transition: all 0.3s;
        }
        .event-item:hover {
            background-color: #f3f4f6;
        }
    `;
    document.head.appendChild(style);
}

console.log('%c📅 Calendário', 'color: #7c3aed; font-size: 20px; font-weight: bold;');
console.log('%cSistema carregado com sucesso!', 'color: #00b894; font-size: 14px;');


// ===== NOTIFICAR OUTRAS ABAS SOBRE MUDANÇAS =====
function notificarSincronizacao() {
    localStorage.setItem('sync_notification', Date.now().toString());
}

// Modificar a função salvarEventos
function salvarEventos() {
    if (!usuarioAtual) return;
    
    const storageKey = `eventos_${usuarioAtual.email}`;
    localStorage.setItem(storageKey, JSON.stringify(events));
    
    // NOTIFICAR OUTRAS ABAS
    notificarSincronizacao();
}
