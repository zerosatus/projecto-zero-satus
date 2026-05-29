// ===== VARIÁVEIS GLOBAIS =====
let events = [];
let currentDate = new Date();
let selectedDate = new Date();
let currentView = 'month';
let usuarioAtual = null;

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const weekDaysFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

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
        
        // Iniciar sincronização
        if (window.initSync) {
            await window.initSync();
        }
        
        carregarEventos();
        initCalendar();
        
        // Escutar mudanças do Firebase
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
    if (titulo) titulo.textContent = `Bem-vindo, ${usuarioAtual.nome}!`;
    if (userName) userName.textContent = usuarioAtual.nome;
    
    const userAvatar = document.querySelector('.user-profile img');
    if (userAvatar) {
        const iniciais = usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
        if (!userAvatar.src.includes('pravatar')) {
            userAvatar.src = `https://ui-avatars.com/api/?name=${iniciais}&background=7c3aed&color=fff&size=32`;
        }
    }
}

function carregarEventos() {
    if (!usuarioAtual) return;
    
    // Tentar do CacheManager primeiro
    if (window.CacheManager) {
        const cached = window.CacheManager.get('calendarEvents', null);
        if (cached) {
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
        // Dados de EXEMPLO para primeiro acesso
        const today = new Date();
        events = [
            { id: gerarId(), day: today.getDate(), month: today.getMonth(), year: today.getFullYear(), title: 'Aula de Matemática', type: 'aula', time: '08:00', endTime: '09:40', description: 'Equações do segundo grau', repeat: 'semanal' },
            { id: gerarId(), day: today.getDate() + 2, month: today.getMonth(), year: today.getFullYear(), title: 'Prova de Física', type: 'prova', time: '10:00', endTime: '11:30', description: 'Cinemática e Dinâmica', repeat: 'nao' },
            { id: gerarId(), day: today.getDate() + 5, month: today.getMonth(), year: today.getFullYear(), title: 'Entrega de Trabalho', type: 'trabalho', time: '23:59', endTime: '23:59', description: 'Trabalho de História', repeat: 'nao' }
        ];
        salvarEventos();
    }
}

function salvarEventos() {
    if (!usuarioAtual) return;
    const storageKey = `eventos_${usuarioAtual.email}`;
    localStorage.setItem(storageKey, JSON.stringify(events));
    if (window.CacheManager) window.CacheManager.set('calendarEvents', events, true);
}

function gerarId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 9); }

function logout() {
    if (confirm('Deseja sair?')) {
        salvarEventos();
        localStorage.removeItem('usuarioLogado');
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
    calendarDays.innerHTML = '';
    calendarDays.className = 'days';
    calendarDays.style.display = '';
    calendarDays.style.gridTemplateColumns = '';
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
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    weekdaysHeader.style.display = 'grid';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarDays.appendChild(createDayElement(daysInPrevMonth - i, true));
    }
    
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dayEl = createDayElement(day, false, isToday);
        const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year).sort((a, b) => a.time.localeCompare(b.time));
        
        dayEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = `event ${event.type}`;
            eventEl.textContent = `${event.time} ${event.title}`;
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
        
        if (day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) dayEl.classList.add('selected');
        calendarDays.appendChild(dayEl);
    }
    
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) calendarDays.appendChild(createDayElement(day, true));
}

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
    const cornerCell = document.createElement('div');
    cornerCell.style.backgroundColor = '#f9fafb';
    cornerCell.style.borderRight = '1px solid #e5e7eb';
    cornerCell.style.borderBottom = '1px solid #e5e7eb';
    calendarDays.appendChild(cornerCell);
    
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const isToday = dayDate.getDate() === today.getDate() && dayDate.getMonth() === today.getMonth() && dayDate.getFullYear() === today.getFullYear();
        const headerCell = document.createElement('div');
        headerCell.className = `week-header-cell ${isToday ? 'today' : ''}`;
        headerCell.innerHTML = `<div style="font-size:0.75rem;color:#6b7280;">${weekDays[i]}</div><div style="font-size:1.5rem;font-weight:600;margin-top:0.25rem;">${dayDate.getDate()}</div>`;
        headerCell.style.backgroundColor = isToday ? '#ede9fe' : '#f9fafb';
        headerCell.style.borderRight = '1px solid #e5e7eb';
        headerCell.style.borderBottom = '1px solid #e5e7eb';
        headerCell.style.padding = '1rem 0.5rem';
        headerCell.style.textAlign = 'center';
        calendarDays.appendChild(headerCell);
    }
    
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
            }).sort((a, b) => a.time.localeCompare(b.time));
            
            hourEvents.forEach((event, index) => {
                const eventEl = document.createElement('div');
                eventEl.className = `week-event ${event.type}`;
                eventEl.textContent = `${event.time} ${event.title}`;
                eventEl.style.position = 'absolute';
                eventEl.style.left = '2px';
                eventEl.style.right = '2px';
                eventEl.style.top = `${index * 28 + 2}px`;
                eventEl.style.padding = '0.25rem 0.5rem';
                eventEl.style.borderRadius = '4px';
                eventEl.style.fontSize = '0.75rem';
                eventEl.style.color = 'white';
                cell.appendChild(eventEl);
            });
            
            cell.addEventListener('click', (e) => {
                if (e.target === cell || e.target.classList.contains('week-hour-cell')) {
                    e.stopPropagation();
                    selectedDate = dayDate;
                    selectedDayEl.textContent = dayDate.getDate();
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
    currentMonthEl.textContent = `${weekDaysFull[selectedDate.getDay()]}, ${day} de ${monthNames[month]} de ${year}`;
    weekdaysHeader.style.display = 'none';
    calendarDays.classList.add('day-view');
    calendarDays.style.display = 'flex';
    calendarDays.style.flexDirection = 'column';
    
    const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year).sort((a, b) => a.time.localeCompare(b.time));
    
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
        
        const timeContent = document.createElement('div');
        timeContent.className = 'day-time-content';
        timeContent.style.flex = '1';
        timeContent.style.padding = '0.5rem';
        
        hourEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = `day-event ${event.type}`;
            eventEl.innerHTML = `<strong>${event.time}</strong> ${event.title}`;
            eventEl.style.padding = '0.75rem';
            eventEl.style.borderRadius = '8px';
            eventEl.style.marginBottom = '0.5rem';
            eventEl.style.color = 'white';
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
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year).sort((a, b) => a.time.localeCompare(b.time));
    
    if (dayEvents.length === 0) {
        eventsListEl.innerHTML = '<p style="color: #6b7280; padding: 1rem; text-align: center;">Nenhum evento para este dia</p>';
        return;
    }
    
    eventsListEl.innerHTML = '';
    dayEvents.forEach(event => {
        const colors = { 'prova': '#ef4444', 'trabalho': '#eab308', 'apresentacao': '#3b82f6', 'reuniao': '#8b5cf6', 'aula': '#10b981', 'outro': '#7c3aed' };
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.style.borderLeftColor = colors[event.type] || '#7c3aed';
        eventItem.innerHTML = `
            <div class="event-color" style="background-color: ${colors[event.type] || '#7c3aed'};"></div>
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
                events = events.filter(e => e.id !== event.id);
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
    const dateStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    document.getElementById('eventDate').value = dateStr;
    document.getElementById('eventStart').value = horaInicio;
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

function setupEventListeners() {
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderCalendar();
        });
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
        else { selectedDate.setDate(selectedDate.getDate() - 1); currentDate = new Date(selectedDate); }
        renderCalendar();
        renderEventsForSelectedDay();
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + 7);
        else { selectedDate.setDate(selectedDate.getDate() + 1); currentDate = new Date(selectedDate); }
        renderCalendar();
        renderEventsForSelectedDay();
    });
    
    newEventBtn.addEventListener('click', () => abrirModalComData(selectedDate));
    
    function closeModal() { eventModal.classList.remove('active'); document.body.style.overflow = ''; }
    modalClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    eventModal.addEventListener('click', (e) => { if (e.target === eventModal) closeModal(); });
    
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            eventTypeInput.value = btn.dataset.type;
        });
    });
    
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
        
        if (!title) { alert('Por favor, preencha o título do evento.'); return; }
        
        const eventDate = new Date(date + 'T12:00:00');
        const novoEvento = { id: gerarId(), day: eventDate.getDate(), month: eventDate.getMonth(), year: eventDate.getFullYear(), title, type, time: start, endTime: end, description, repeat, reminder, dataCriacao: new Date().toISOString() };
        events.push(novoEvento);
        
        if (repeat !== 'nao') {
            const repeatCount = repeat === 'diario' ? 6 : repeat === 'semanal' ? 3 : 11;
            for (let i = 1; i <= repeatCount; i++) {
                const repeatDate = new Date(eventDate);
                if (repeat === 'diario') repeatDate.setDate(repeatDate.getDate() + i);
                else if (repeat === 'semanal') repeatDate.setDate(repeatDate.getDate() + (i * 7));
                else if (repeat === 'mensal') repeatDate.setMonth(repeatDate.getMonth() + i);
                events.push({ ...novoEvento, id: gerarId(), day: repeatDate.getDate(), month: repeatDate.getMonth(), year: repeatDate.getFullYear() });
            }
        }
        
        salvarEventos();
        closeModal();
        renderCalendar();
        renderEventsForSelectedDay();
        mostrarNotificacao('Evento criado com sucesso!');
    });
    
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && eventModal.classList.contains('active')) closeModal(); });
}

function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; background-color: ${tipo === 'success' ? '#00b894' : '#d63031'}; color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 2000; animation: slideInRight 0.3s ease-out;`;
    document.body.appendChild(notificacao);
    setTimeout(() => { notificacao.style.animation = 'slideInRight 0.3s ease-out reverse'; setTimeout(() => notificacao.remove(), 300); }, 3000);
}

console.log('%c📅 Calendário', 'color: #7c3aed; font-size: 20px; font-weight: bold;');