// Calendar data
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const weekDaysFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Sample events
let events = [
    { day: 28, month: 8, year: 2025, title: 'Prova de Mat', type: 'prova', time: '11:00' },
    { day: 29, month: 8, year: 2025, title: 'Trabalho de...', type: 'trabalho', time: '11:15' },
    { day: 30, month: 8, year: 2025, title: 'Apresentaç...', type: 'apresentacao', time: '15:00' },
    { day: 26, month: 8, year: 2025, title: 'Reunião de...', type: 'reuniao', time: '09:00' },
    { day: 27, month: 8, year: 2025, title: 'Aula de Física', type: 'aula', time: '15:00' },
    { day: 5, month: 8, year: 2025, title: 'Trabalho em...', type: 'trabalho', time: '14:00' },
    { day: 12, month: 8, year: 2025, title: 'Prova de Hist', type: 'prova', time: '10:00' },
];

let currentDate = new Date(2025, 8, 1);
let selectedDate = new Date(2025, 8, 27);
let currentView = 'month';

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

// ===== VERIFICAÇÃO DE LOGIN =====
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        // Para teste, comentar a linha abaixo se não tiver login
        // window.location.href = '../login/index.html';
        return;
    }
    try {
        const userData = JSON.parse(usuario);
        const titulo = document.querySelector('.header h1');
        const userName = document.getElementById('userName');
        if (titulo && userData.nome) titulo.textContent = `Bem-vindo, ${userData.nome}!`;
        if (userName && userData.nome) userName.textContent = userData.nome;
    } catch(e) {}
    
    // Initialize calendar after login check
    initCalendar();
});

// ===== LOGOUT =====
function logout() {
    if (confirm('Deseja sair?')) {
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
            
            hourEvents.forEach((event, index) => {
                const eventEl = document.createElement('div');
                eventEl.textContent = `${event.time} ${event.title}`;
                eventEl.style.position = 'absolute';
                eventEl.style.left = '2px';
                eventEl.style.right = '2px';
                eventEl.style.top = `${index * 35 + 2}px`;
                eventEl.style.padding = '0.25rem 0.5rem';
                eventEl.style.borderRadius = '4px';
                eventEl.style.fontSize = '0.75rem';
                eventEl.style.color = 'white';
                eventEl.style.fontWeight = '500';
                eventEl.style.overflow = 'hidden';
                eventEl.style.zIndex = '10';
                
                const colors = { 'prova': '#ef4444', 'trabalho': '#eab308', 'apresentacao': '#3b82f6', 'reuniao': '#8b5cf6', 'aula': '#10b981' };
                eventEl.style.backgroundColor = colors[event.type] || '#7c3aed';
                
                cell.appendChild(eventEl);
            });
            
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedDate = dayDate;
                selectedDayEl.textContent = dayDate.getDate();
                renderEventsForSelectedDay();
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
            eventEl.style.padding = '0.75rem';
            eventEl.style.borderRadius = '8px';
            eventEl.style.marginBottom = '0.5rem';
            eventEl.style.color = 'white';
            eventEl.style.fontSize = '0.875rem';
            eventEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            
            const colors = { 'prova': '#ef4444', 'trabalho': '#eab308', 'apresentacao': '#3b82f6', 'reuniao': '#8b5cf6', 'aula': '#10b981' };
            eventEl.style.backgroundColor = colors[event.type] || '#7c3aed';
            
            timeContent.appendChild(eventEl);
        });
        
        timeSlot.appendChild(timeLabel);
        timeSlot.appendChild(timeContent);
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
    
    if (dayEvents.length === 0) {
        eventsListEl.innerHTML = '<p style="color: #6b7280; padding: 1rem;">Nenhum evento para este dia</p>';
        return;
    }
    
    eventsListEl.innerHTML = '';
    dayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        
        const colors = { 'prova': '#ef4444', 'trabalho': '#eab308', 'apresentacao': '#3b82f6', 'reuniao': '#8b5cf6', 'aula': '#10b981' };
        eventItem.style.borderLeftColor = colors[event.type] || '#7c3aed';
        
        eventItem.innerHTML = `
            <div class="event-color" style="background-color: ${colors[event.type] || '#7c3aed'};"></div>
            <div class="event-info">
                <h4>${event.title}</h4>
                <p>${event.time}</p>
            </div>
        `;
        
        eventsListEl.appendChild(eventItem);
    });
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
    });
    
    // Modal: Open
    newEventBtn.addEventListener('click', () => {
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        document.getElementById('eventDate').value = dateStr;
        document.getElementById('eventStart').value = '09:00';
        document.getElementById('eventEnd').value = '10:00';
        
        eventForm.reset();
        document.getElementById('eventType').value = 'aula';
        typeBtns.forEach(btn => btn.classList.remove('active'));
        typeBtns[0].classList.add('active');
        
        eventModal.classList.add('active');
        document.body.style.overflow = 'hidden';
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
        
        const title = document.getElementById('eventTitle').value;
        const description = document.getElementById('eventDescription').value;
        const date = document.getElementById('eventDate').value;
        const start = document.getElementById('eventStart').value;
        const type = document.getElementById('eventType').value;
        const repeat = document.getElementById('eventRepeat').value;
        
        const eventDate = new Date(date);
        
        const newEvent = {
            day: eventDate.getDate(),
            month: eventDate.getMonth(),
            year: eventDate.getFullYear(),
            title: title,
            type: type,
            time: start,
            description: description,
            repeat: repeat
        };
        
        events.push(newEvent);
        
        if (repeat !== 'nao') {
            const repeatCount = repeat === 'diario' ? 7 : repeat === 'semanal' ? 4 : 12;
            for (let i = 1; i <= repeatCount; i++) {
                const repeatDate = new Date(eventDate);
                if (repeat === 'diario') repeatDate.setDate(repeatDate.getDate() + i);
                else if (repeat === 'semanal') repeatDate.setDate(repeatDate.getDate() + (i * 7));
                else if (repeat === 'mensal') repeatDate.setMonth(repeatDate.getMonth() + i);
                
                events.push({ ...newEvent, day: repeatDate.getDate(), month: repeatDate.getMonth(), year: repeatDate.getFullYear() });
            }
        }
        
        closeModal();
        renderCalendar();
        renderEventsForSelectedDay();
        alert('Evento criado com sucesso!');
    });
    
    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && eventModal.classList.contains('active')) closeModal();
    });
}