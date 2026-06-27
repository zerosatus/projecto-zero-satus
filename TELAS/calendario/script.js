let events = [];
let currentDate = new Date();
let selectedDate = new Date();
let currentView = 'month';
let usuarioAtual = null;

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const weekDaysFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Cores do tema (para usar em inline styles)
const themeColors = {
    bgCard: '#1a1d2e',
    bgPrimary: '#0f0f1e',
    border: '#2a2d45',
    textSecondary: '#9ca3af',
    purpleLight: 'rgba(147, 51, 234, 0.15)',
    purplePrimary: '#9333ea',
    white: '#ffffff'
};

const calendarDays = document.getElementById('calendarDays');
const currentMonthEl = document.getElementById('currentMonth');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const selectedDayEl = document.getElementById('selectedDay');
const eventsListEl = document.getElementById('eventsList');
const newEventBtn = document.getElementById('newEventBtn');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const weekdaysHeader = document.querySelector('.weekdays');
const eventModal = document.getElementById('eventModal');
const modalClose = document.getElementById('modalClose');
const btnCancel = document.getElementById('btnCancel');
const eventForm = document.getElementById('eventForm');
const typeBtns = document.querySelectorAll('.type-btn');
const eventTypeInput = document.getElementById('eventType');

window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        atualizarNomeUsuario();
        
        if (window.initSync) {
            await window.initSync();
        }
        
        carregarEventos();
        initCalendar();
        
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[Calendario] Dados atualizados do Firebase');
            carregarEventos();
            renderCalendar();
            renderEventsForSelectedDay();
        });
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

function atualizarNomeUsuario() {
    if (!usuarioAtual) return;
    const titulo = document.querySelector('.header h1');
    const userName = document.getElementById('userName');
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    if (titulo && userNameDisplay) titulo.innerHTML = `Bem-vindo, <span id="userNameDisplay">${usuarioAtual.nome}</span>!`;
    if (userName) userName.textContent = usuarioAtual.nome;
    
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        const iniciais = usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
        userAvatar.src = `https://ui-avatars.com/api/?name=${iniciais}&background=9333ea&color=fff&size=32`;
    }
}

function carregarEventos() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('calendarEvents', null);
        if (cached !== null) {
            events = cached;
            console.log('[Calendario] Carregado do CacheManager:', events.length);
            return;
        }
    }

    const storageKey = `eventos_${usuarioAtual.email}`;
    const eventosSalvos = localStorage.getItem(storageKey);

    if (eventosSalvos) {
        events = JSON.parse(eventosSalvos);
    } else {
        events = [];
        salvarEventos();
    }
}

function salvarEventos() {
    if (!usuarioAtual) return;
    const storageKey = `eventos_${usuarioAtual.email}`;
    localStorage.setItem(storageKey, JSON.stringify(events));
    if (window.CacheManager) window.CacheManager.set('calendarEvents', events, true);
}

function gerarId() { 
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9); 
}

function logout() {
    if (confirm('Deseja sair?')) {
        salvarEventos();
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) window.CacheManager.logout();
        window.location.href = '../login/index.html';
    }
}

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

function initCalendar() {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();
    setupEventListeners();
    renderEventsForSelectedDay();
}

function clearCalendar() {
    if (calendarDays) {
        calendarDays.innerHTML = '';
        calendarDays.className = 'days';
        calendarDays.style.display = '';
        calendarDays.style.gridTemplateColumns = '';
    }
}

function renderCalendar() {
    clearCalendar();
    if (currentView === 'month') renderMonthView();
    else if (currentView === 'week') renderWeekView();
    else if (currentView === 'day') renderDayView();
}

function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (currentMonthEl) currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    if (weekdaysHeader) weekdaysHeader.style.display = 'grid';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarDays.appendChild(createDayElement(daysInPrevMonth - i, true));
    }

    // Dias do mês atual
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dayEl = createDayElement(day, false, isToday);
        
        const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year)
            .sort((a, b) => a.time.localeCompare(b.time));
        
        dayEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = `event ${event.type}`;
            eventEl.textContent = `${event.time} ${event.title}`;
            dayEl.appendChild(eventEl);
        });
        
        dayEl.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedDate = new Date(year, month, day);
            if (selectedDayEl) selectedDayEl.textContent = day;
            renderEventsForSelectedDay();
            document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
            dayEl.classList.add('selected');
        });
        
        if (day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
            dayEl.classList.add('selected');
        }
        
        calendarDays.appendChild(dayEl);
    }

    // Dias do próximo mês
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        calendarDays.appendChild(createDayElement(day, true));
    }
}

function renderWeekView() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    if (currentMonthEl) currentMonthEl.textContent = `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
    if (weekdaysHeader) weekdaysHeader.style.display = 'none';
    
    calendarDays.classList.add('week-view');
    calendarDays.style.display = 'grid';
    calendarDays.style.gridTemplateColumns = '70px repeat(7, 1fr)';
    
    const today = new Date();
    
    // Canto superior esquerdo
    const cornerCell = document.createElement('div');
    cornerCell.style.backgroundColor = themeColors.bgPrimary;
    cornerCell.style.borderRight = `1px solid ${themeColors.border}`;
    cornerCell.style.borderBottom = `1px solid ${themeColors.border}`;
    calendarDays.appendChild(cornerCell);

    // Cabeçalho dos dias
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const isToday = dayDate.getDate() === today.getDate() && dayDate.getMonth() === today.getMonth() && dayDate.getFullYear() === today.getFullYear();
        
        const headerCell = document.createElement('div');
        headerCell.className = `week-header-cell ${isToday ? 'today' : ''}`;
        headerCell.innerHTML = `<div style="font-size:0.75rem;color:${themeColors.textSecondary};">${weekDays[i]}</div><div style="font-size:1.5rem;font-weight:600;margin-top:0.25rem;color:${themeColors.white};">${dayDate.getDate()}</div>`;
        headerCell.style.backgroundColor = isToday ? themeColors.purpleLight : themeColors.bgPrimary;
        headerCell.style.borderRight = `1px solid ${themeColors.border}`;
        headerCell.style.borderBottom = `1px solid ${themeColors.border}`;
        headerCell.style.padding = '1rem 0.5rem';
        headerCell.style.textAlign = 'center';
        calendarDays.appendChild(headerCell);
    }

    // Horas do dia
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
            cell.style.borderRight = `1px solid ${themeColors.border}`;
            cell.style.borderBottom = `1px solid ${themeColors.border}`;
            cell.style.height = '80px';
            cell.style.position = 'relative';
            cell.style.cursor = 'pointer';
            cell.style.backgroundColor = themeColors.bgCard;
            
            const hourEvents = events.filter(e => {
                const eventDate = new Date(e.year, e.month, e.day);
                const eventHour = parseInt(e.time.split(':')[0]);
                return eventDate.getTime() === dayDate.getTime() && eventHour === hour;
            }).sort((a, b) => a.time.localeCompare(b.time));
            
            hourEvents.forEach((event, index) => {
                const eventEl = document.createElement('div');
                eventEl.className = `week-event ${event.type}`;
                eventEl.textContent = `${event.time} ${event.title}`;
                eventEl.style.position = 'absolute';
                eventEl.style.left = '2px';
                eventEl.style.right = '2px';
                eventEl.style.top = `${index * 28 + 2}px`;
                cell.appendChild(eventEl);
            });
            
            cell.addEventListener('click', (e) => {
                if (e.target === cell || e.target.classList.contains('week-hour-cell')) {
                    e.stopPropagation();
                    selectedDate = dayDate;
                    if (selectedDayEl) selectedDayEl.textContent = dayDate.getDate();
                    renderEventsForSelectedDay();
                    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                    abrirModalComData(dayDate, hourStr);
                }
            });
            calendarDays.appendChild(cell);
        }
    }
}

function renderDayView() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    
    if (currentMonthEl) currentMonthEl.textContent = `${weekDaysFull[selectedDate.getDay()]}, ${day} de ${monthNames[month]} de ${year}`;
    if (weekdaysHeader) weekdaysHeader.style.display = 'none';
    
    calendarDays.classList.add('day-view');
    calendarDays.style.display = 'flex';
    calendarDays.style.flexDirection = 'column';
    
    const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year)
        .sort((a, b) => a.time.localeCompare(b.time));

    for (let hour = 0; hour < 24; hour++) {
        const hourEvents = dayEvents.filter(e => parseInt(e.time.split(':')[0]) === hour);
        
        const timeSlot = document.createElement('div');
        timeSlot.className = 'day-time-slot';
        timeSlot.style.display = 'flex';
        timeSlot.style.borderBottom = `1px solid ${themeColors.border}`;
        timeSlot.style.minHeight = '80px';
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'day-time-label';
        timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
        timeLabel.style.width = '80px';
        timeLabel.style.padding = '0.5rem 1rem';
        timeLabel.style.fontSize = '0.875rem';
        timeLabel.style.color = themeColors.textSecondary;
        timeLabel.style.fontWeight = '500';
        timeLabel.style.borderRight = `1px solid ${themeColors.border}`;
        timeLabel.style.textAlign = 'right';
        timeLabel.style.backgroundColor = themeColors.bgPrimary;
        
        const timeContent = document.createElement('div');
        timeContent.className = 'day-time-content';
        timeContent.style.flex = '1';
        timeContent.style.padding = '0.5rem';
        timeContent.style.backgroundColor = themeColors.bgCard;
        
        hourEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = `day-event ${event.type}`;
            eventEl.innerHTML = `<strong>${event.time}</strong> ${event.title}`;
            timeContent.appendChild(eventEl);
        });
        
        timeSlot.appendChild(timeLabel);
        timeSlot.appendChild(timeContent);
        timeSlot.addEventListener('click', () => abrirModalComData(selectedDate, `${hour.toString().padStart(2, '0')}:00`));
        calendarDays.appendChild(timeSlot);
    }
}

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

function renderEventsForSelectedDay() {
    if (!eventsListEl) return;
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    
    const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year)
        .sort((a, b) => a.time.localeCompare(b.time));
    
    if (dayEvents.length === 0) {
        eventsListEl.innerHTML = `<p style="color: ${themeColors.textSecondary}; padding: 1rem; text-align: center;">Nenhum evento para este dia</p>`;
        return;
    }

    eventsListEl.innerHTML = '';
    dayEvents.forEach(event => {
        const colors = { 
            'prova': '#ef4444', 
            'trabalho': '#eab308', 
            'apresentacao': '#3b82f6', 
            'reuniao': '#8b5cf6', 
            'aula': '#10b981', 
            'outro': '#9333ea' 
        };
        
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.style.borderLeftColor = colors[event.type] || '#9333ea';
        eventItem.innerHTML = `
            <div class="event-color" style="background-color: ${colors[event.type] || '#9333ea'};"></div>
            <div class="event-info" style="flex: 1;">
                <h4>${event.title}</h4>
                <p>${event.time} - ${event.endTime || ''} ${event.description ? '• ' + event.description : ''}</p>
            </div>
            <button class="delete-event" data-id="${event.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.5rem;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        eventItem.querySelector('.delete-event').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Deseja excluir este evento?')) {
                events = events.filter(ev => ev.id !== event.id);
                salvarEventos();
                renderCalendar();
                renderEventsForSelectedDay();
                mostrarNotificacao('Evento excluído com sucesso!');
            }
        });
        
        eventsListEl.appendChild(eventItem);
    });
}

function abrirModalComData(data, horaInicio = '09:00') {
    if (!eventModal) return;
    
    const dateStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    
    const eventDateInput = document.getElementById('eventDate');
    const eventStartInput = document.getElementById('eventStart');
    const eventEndInput = document.getElementById('eventEnd');
    
    if (eventDateInput) eventDateInput.value = dateStr;
    if (eventStartInput) eventStartInput.value = horaInicio;
    
    const [hour, minute] = horaInicio.split(':').map(Number);
    const endHour = (hour + 1) % 24;
    if (eventEndInput) eventEndInput.value = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    eventForm?.reset();
    
    const eventTitleInput = document.getElementById('eventTitle');
    const eventDescriptionInput = document.getElementById('eventDescription');
    if (eventTitleInput) eventTitleInput.value = '';
    if (eventDescriptionInput) eventDescriptionInput.value = '';
    if (eventDateInput) eventDateInput.value = dateStr;
    if (eventStartInput) eventStartInput.value = horaInicio;
    if (eventEndInput) eventEndInput.value = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    if (eventTypeInput) eventTypeInput.value = 'aula';
    
    const eventRepeatSelect = document.getElementById('eventRepeat');
    if (eventRepeatSelect) eventRepeatSelect.value = 'nao';
    
    const eventReminderCheck = document.getElementById('eventReminder');
    if (eventReminderCheck) eventReminderCheck.checked = false;
    
    typeBtns.forEach(btn => btn.classList.remove('active'));
    if (typeBtns[0]) typeBtns[0].classList.add('active');
    
    eventModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function setupEventListeners() {
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderCalendar();
        });
    });
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
            else if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
            else { selectedDate.setDate(selectedDate.getDate() - 1); currentDate = new Date(selectedDate); }
            renderCalendar();
            renderEventsForSelectedDay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
            else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + 7);
            else { selectedDate.setDate(selectedDate.getDate() + 1); currentDate = new Date(selectedDate); }
            renderCalendar();
            renderEventsForSelectedDay();
        });
    }

    if (newEventBtn) newEventBtn.addEventListener('click', () => abrirModalComData(selectedDate));

    function closeModal() { 
        if (eventModal) eventModal.classList.remove('active'); 
        document.body.style.overflow = ''; 
    }
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (eventModal) eventModal.addEventListener('click', (e) => { if (e.target === eventModal) closeModal(); });

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (eventTypeInput) eventTypeInput.value = btn.dataset.type;
        });
    });

    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const titleInput = document.getElementById('eventTitle');
            const descriptionInput = document.getElementById('eventDescription');
            const dateInput = document.getElementById('eventDate');
            const startInput = document.getElementById('eventStart');
            const endInput = document.getElementById('eventEnd');
            const repeatSelect = document.getElementById('eventRepeat');
            const reminderCheck = document.getElementById('eventReminder');
            
            const title = titleInput?.value.trim() || '';
            const description = descriptionInput?.value.trim() || '';
            const date = dateInput?.value || '';
            const start = startInput?.value || '';
            const end = endInput?.value || '';
            const type = eventTypeInput?.value || 'aula';
            const repeat = repeatSelect?.value || 'nao';
            const reminder = reminderCheck?.checked || false;
            
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
                title, 
                type, 
                time: start, 
                endTime: end, 
                description, 
                repeat, 
                reminder, 
                dataCriacao: new Date().toISOString() 
            };
            
            events.push(novoEvento);
            
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
    }

    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape' && eventModal?.classList.contains('active')) closeModal(); 
    });
}

function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed; 
        bottom: 20px; 
        right: 20px; 
        padding: 16px 24px; 
        background: linear-gradient(135deg, ${tipo === 'success' ? '#10b981, #059669' : '#ef4444, #dc2626'}); 
        color: white; 
        border-radius: 12px; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
        z-index: 2000; 
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
    `;
    document.body.appendChild(notificacao);
    
    setTimeout(() => { 
        notificacao.style.animation = 'slideInRight 0.3s ease-out reverse'; 
        setTimeout(() => notificacao.remove(), 300); 
    }, 3000);
}

console.log('%c📅 Calendário - Tema Roxo Escuro', 'color: #9333ea; font-size: 20px; font-weight: bold;');