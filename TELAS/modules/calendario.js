// ============================================
// modules/calendario.js - CALENDÁRIO SPA
// ============================================

class CalendarioModule {
    constructor(app) {
        this.app = app;
        this.name = 'calendario';
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.currentView = 'month';
        this.events = [];
        this.editingEventId = null;
        this.selectedEventType = 'aula';
        
        this.monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        this.weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        this.weekDaysFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
                             'Quinta-feira', 'Sexta-feira', 'Sábado'];
        
        console.log('[Calendario] 📅 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Calendario] 📅 Renderizando...');
        
        this.events = data.calendarEvents || [];
        this.notifications = data.notifications || [];
        this.profile = data.profile || {};
        
        // Atualizar nome do usuário
        this.atualizarNomeUsuario();
        
        this.renderCalendar();
        this.renderEventsForSelectedDay();
        this.updateBadge();
        this.setupEvents();
    }
    
    // ============================================
    // ATUALIZAR NOME DO USUÁRIO
    // ============================================
    atualizarNomeUsuario() {
        const profile = this.profile || this.app.user || {};
        const nome = profile.nome || profile.displayName || 'Usuário';
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = nome;
        }
        
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = nome;
        }
    }
    
    // ============================================
    // RENDER CALENDÁRIO
    // ============================================
    renderCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        const currentMonthEl = document.getElementById('currentMonth');
        if (!calendarDays) return;
        
        calendarDays.className = 'days';
        
        if (this.currentView === 'month') this.renderMonthView(calendarDays, currentMonthEl);
        else if (this.currentView === 'week') this.renderWeekView(calendarDays, currentMonthEl);
        else if (this.currentView === 'day') this.renderDayView(calendarDays, currentMonthEl);
    }
    
    // ============================================
    // VIEW MÊS
    // ============================================
    renderMonthView(calendarDays, currentMonthEl) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        if (currentMonthEl) currentMonthEl.textContent = `${this.monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const today = new Date();
        
        calendarDays.innerHTML = '';
        calendarDays.style.display = 'grid';
        calendarDays.style.gridTemplateColumns = 'repeat(7, 1fr)';
        
        // Dias do mês anterior
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayEl = this.createDayElement(daysInPrevMonth - i, true);
            calendarDays.appendChild(dayEl);
        }
        
        // Dias do mês atual
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dayEl = this.createDayElement(day, false, isToday);
            
            const dayEvents = this.events.filter(e => 
                e.day === day && e.month === month && e.year === year
            ).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
            
            dayEvents.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `event ${event.type || 'outro'}`;
                eventEl.textContent = `${event.time || '--:--'} ${event.title}`;
                dayEl.appendChild(eventEl);
            });
            
            dayEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedDate = new Date(year, month, day);
                document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
                dayEl.classList.add('selected');
                this.renderEventsForSelectedDay();
            });
            
            if (day === this.selectedDate.getDate() && month === this.selectedDate.getMonth() && 
                year === this.selectedDate.getFullYear()) {
                dayEl.classList.add('selected');
            }
            
            calendarDays.appendChild(dayEl);
        }
        
        // Dias do próximo mês
        const totalCells = firstDay + daysInMonth;
        const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            calendarDays.appendChild(this.createDayElement(day, true));
        }
    }
    
    createDayElement(day, isOtherMonth, isToday = false) {
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
    
    // ============================================
    // VIEW SEMANA
    // ============================================
    renderWeekView(calendarDays, currentMonthEl) {
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        if (currentMonthEl) {
            currentMonthEl.textContent = `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${this.monthNames[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
        }
        
        calendarDays.innerHTML = '';
        calendarDays.className = 'days week-view';
        calendarDays.style.display = 'grid';
        calendarDays.style.gridTemplateColumns = '70px repeat(7, 1fr)';
        calendarDays.style.minHeight = '600px';
        calendarDays.style.maxHeight = '700px';
        calendarDays.style.overflowY = 'auto';
        
        const today = new Date();
        
        // Canto superior esquerdo
        const cornerCell = document.createElement('div');
        cornerCell.style.cssText = `
            background: var(--bg-color);
            border-right: 1px solid var(--border-color);
            border-bottom: 1px solid var(--border-color);
            padding: 0.5rem;
        `;
        calendarDays.appendChild(cornerCell);
        
        // Cabeçalho dos dias
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const isToday = dayDate.getDate() === today.getDate() && 
                           dayDate.getMonth() === today.getMonth() && 
                           dayDate.getFullYear() === today.getFullYear();
            
            const headerCell = document.createElement('div');
            headerCell.className = `week-header-cell ${isToday ? 'today' : ''}`;
            headerCell.innerHTML = `
                <div style="font-size:0.75rem;color:var(--text-secondary);">${this.weekDays[i]}</div>
                <div style="font-size:1.5rem;font-weight:600;margin-top:0.25rem;color:var(--text-primary);">${dayDate.getDate()}</div>
            `;
            headerCell.style.cssText = `
                background: ${isToday ? 'var(--purple-light)' : 'var(--bg-color)'};
                border-right: 1px solid var(--border-color);
                border-bottom: 1px solid var(--border-color);
                padding: 1rem 0.5rem;
                text-align: center;
            `;
            calendarDays.appendChild(headerCell);
        }
        
        // Horas
        for (let hour = 0; hour < 24; hour++) {
            const timeCell = document.createElement('div');
            timeCell.className = 'time-label-cell';
            timeCell.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeCell.style.cssText = `
                background: var(--bg-color);
                border-right: 1px solid var(--border-color);
                border-bottom: 1px solid var(--border-color);
                padding: 0.5rem;
                font-size: 0.75rem;
                color: var(--text-secondary);
                text-align: center;
                height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            calendarDays.appendChild(timeCell);
            
            for (let day = 0; day < 7; day++) {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + day);
                
                const cell = document.createElement('div');
                cell.className = 'week-hour-cell';
                cell.style.cssText = `
                    border-right: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                    height: 80px;
                    position: relative;
                    cursor: pointer;
                    background: var(--card-bg);
                `;
                
                const hourEvents = this.events.filter(e => {
                    const eventDate = new Date(e.year, e.month, e.day);
                    const eventHour = parseInt((e.time || '00:00').split(':')[0]);
                    return eventDate.getTime() === dayDate.getTime() && eventHour === hour;
                });
                
                let topOffset = 2;
                hourEvents.forEach(event => {
                    const eventEl = document.createElement('div');
                    eventEl.className = `week-event ${event.type || 'outro'}`;
                    eventEl.textContent = `${event.time || '--:--'} ${event.title}`;
                    eventEl.style.cssText = `
                        position: absolute;
                        left: 2px;
                        right: 2px;
                        top: ${topOffset}px;
                        padding: 0.25rem 0.5rem;
                        border-radius: 4px;
                        font-size: 0.7rem;
                        color: white;
                        font-weight: 500;
                        overflow: hidden;
                        z-index: 10;
                        background: ${this.getEventColor(event.type)};
                    `;
                    cell.appendChild(eventEl);
                    topOffset += 26;
                });
                
                cell.addEventListener('click', () => {
                    this.selectedDate = dayDate;
                    this.renderEventsForSelectedDay();
                    this.openEventModal(null, `${hour.toString().padStart(2, '0')}:00`);
                });
                
                calendarDays.appendChild(cell);
            }
        }
    }
    
    // ============================================
    // VIEW DIA
    // ============================================
    renderDayView(calendarDays, currentMonthEl) {
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        const day = this.selectedDate.getDate();
        
        if (currentMonthEl) {
            currentMonthEl.textContent = `${this.weekDaysFull[this.selectedDate.getDay()]}, ${day} de ${this.monthNames[month]} de ${year}`;
        }
        
        calendarDays.innerHTML = '';
        calendarDays.className = 'days day-view';
        calendarDays.style.display = 'flex';
        calendarDays.style.flexDirection = 'column';
        
        const dayEvents = this.events.filter(e => 
            e.day === day && e.month === month && e.year === year
        ).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
        
        for (let hour = 0; hour < 24; hour++) {
            const hourEvents = dayEvents.filter(e => parseInt((e.time || '00:00').split(':')[0]) === hour);
            
            const timeSlot = document.createElement('div');
            timeSlot.className = 'day-time-slot';
            timeSlot.style.cssText = `
                display: flex;
                border-bottom: 1px solid var(--border-color);
                min-height: 80px;
                cursor: pointer;
            `;
            
            const timeLabel = document.createElement('div');
            timeLabel.className = 'day-time-label';
            timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeLabel.style.cssText = `
                width: 80px;
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
                color: var(--text-secondary);
                font-weight: 500;
                border-right: 1px solid var(--border-color);
                text-align: right;
                flex-shrink: 0;
                background: var(--bg-color);
            `;
            
            const timeContent = document.createElement('div');
            timeContent.className = 'day-time-content';
            timeContent.style.cssText = `
                flex: 1;
                padding: 0.5rem;
                background: var(--card-bg);
            `;
            
            hourEvents.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `day-event ${event.type || 'outro'}`;
                eventEl.innerHTML = `<strong>${event.time || '--:--'}</strong> ${event.title}`;
                eventEl.style.cssText = `
                    padding: 0.75rem;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    color: white;
                    font-size: 0.875rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    background: ${this.getEventColor(event.type)};
                `;
                timeContent.appendChild(eventEl);
            });
            
            timeSlot.appendChild(timeLabel);
            timeSlot.appendChild(timeContent);
            
            timeSlot.addEventListener('click', () => {
                this.openEventModal(null, `${hour.toString().padStart(2, '0')}:00`);
            });
            
            calendarDays.appendChild(timeSlot);
        }
    }
    
    getEventColor(type) {
        const colors = {
            'prova': '#ef4444',
            'trabalho': '#eab308',
            'apresentacao': '#3b82f6',
            'reuniao': '#8b5cf6',
            'aula': '#10b981',
            'outro': '#9333ea'
        };
        return colors[type] || '#9333ea';
    }
    
    // ============================================
    // RENDER EVENTOS DO DIA
    // ============================================
    renderEventsForSelectedDay() {
        const eventsListEl = document.getElementById('eventsList');
        const selectedDayEl = document.getElementById('selectedDay');
        if (!eventsListEl) return;
        
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        const day = this.selectedDate.getDate();
        
        if (selectedDayEl) selectedDayEl.textContent = day;
        
        const dayEvents = this.events.filter(e => 
            e.day === day && e.month === month && e.year === year
        ).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
        
        if (dayEvents.length === 0) {
            eventsListEl.innerHTML = `
                <p style="color: var(--text-secondary); padding: 1rem; text-align: center;">
                    Nenhum evento para este dia
                </p>
            `;
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
                <div class="event-info">
                    <h4>${this.app.escapeHtml(event.title)}</h4>
                    <p>${event.time || '--:--'} - ${event.endTime || ''} ${event.description ? '• ' + this.app.escapeHtml(event.description) : ''}</p>
                </div>
                <button class="delete-event" data-id="${event.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            eventItem.querySelector('.delete-event').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteEvent(event.id);
            });
            
            eventsListEl.appendChild(eventItem);
        });
    }
    
    // ============================================
    // CRUD EVENTOS
    // ============================================
    gerarId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    saveEvent(eventData) {
        if (this.editingEventId) {
            const index = this.events.findIndex(e => e.id === this.editingEventId);
            if (index > -1) {
                this.events[index] = { ...this.events[index], ...eventData };
            }
        } else {
            this.events.push({
                id: this.gerarId(),
                ...eventData,
                dataCriacao: new Date().toISOString()
            });
        }
        
        this.app.data.calendarEvents = this.events;
        this.app.saveAllData();
        this.closeEventModal();
        this.renderCalendar();
        this.renderEventsForSelectedDay();
        this.updateBadge();
        this.showToast(this.editingEventId ? 'Evento atualizado!' : 'Evento criado!', 'success');
        this.editingEventId = null;
    }
    
    deleteEvent(id) {
        if (!confirm('Deseja excluir este evento?')) return;
        
        this.events = this.events.filter(e => e.id !== id);
        this.app.data.calendarEvents = this.events;
        this.app.saveAllData();
        this.renderCalendar();
        this.renderEventsForSelectedDay();
        this.showToast('Evento excluído!', 'success');
    }
    
    // ============================================
    // MODAL DE EVENTO
    // ============================================
    openEventModal(event = null, startTime = null) {
        const modal = document.getElementById('eventModal');
        if (!modal) return;
        
        this.editingEventId = event ? event.id : null;
        const year = this.selectedDate.getFullYear();
        const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(this.selectedDate.getDate()).padStart(2, '0');
        
        const titleInput = document.getElementById('eventTitle');
        const descriptionInput = document.getElementById('eventDescription');
        const dateInput = document.getElementById('eventDate');
        const startInput = document.getElementById('eventStart');
        const endInput = document.getElementById('eventEnd');
        const typeInput = document.getElementById('eventType');
        const repeatSelect = document.getElementById('eventRepeat');
        const reminderCheck = document.getElementById('eventReminder');
        
        if (titleInput) titleInput.value = event ? event.title : '';
        if (descriptionInput) descriptionInput.value = event ? event.description || '' : '';
        if (dateInput) dateInput.value = event ? event.date : `${year}-${month}-${day}`;
        if (startInput) startInput.value = event ? event.time : (startTime || '08:00');
        if (endInput) endInput.value = event ? event.endTime || '' : '';
        if (typeInput) typeInput.value = event ? event.type : 'aula';
        if (repeatSelect) repeatSelect.value = event ? event.repeat || 'nao' : 'nao';
        if (reminderCheck) reminderCheck.checked = event ? event.reminder || false : false;
        
        this.selectedEventType = event ? event.type : 'aula';
        
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === this.selectedEventType);
        });
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeEventModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.editingEventId = null;
    }
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        if (badge) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }
    
    // ============================================
    // TOAST
    // ============================================
    showToast(mensagem, tipo = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
            toastMessage.textContent = mensagem;
            toast.className = 'toast show';
            toast.style.background = tipo === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                   tipo === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                   'linear-gradient(135deg, #10b981, #059669)';
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        // Navegação
        document.getElementById('prevBtn')?.addEventListener('click', () => {
            if (this.currentView === 'month') {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            } else if (this.currentView === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() - 7);
            } else {
                this.selectedDate.setDate(this.selectedDate.getDate() - 1);
                this.currentDate = new Date(this.selectedDate);
            }
            this.renderCalendar();
            this.renderEventsForSelectedDay();
        });
        
        document.getElementById('nextBtn')?.addEventListener('click', () => {
            if (this.currentView === 'month') {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            } else if (this.currentView === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() + 7);
            } else {
                this.selectedDate.setDate(this.selectedDate.getDate() + 1);
                this.currentDate = new Date(this.selectedDate);
            }
            this.renderCalendar();
            this.renderEventsForSelectedDay();
        });
        
        // View toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.renderCalendar();
            });
        });
        
        // Novo evento
        document.getElementById('newEventBtn')?.addEventListener('click', () => {
            this.openEventModal();
        });
        
        // Fechar modal
        document.getElementById('modalClose')?.addEventListener('click', () => this.closeEventModal());
        document.getElementById('btnCancel')?.addEventListener('click', () => this.closeEventModal());
        document.getElementById('eventModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeEventModal();
        });
        
        // Tipo de evento
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedEventType = btn.dataset.type;
                document.getElementById('eventType').value = btn.dataset.type;
            });
        });
        
        // Form submit
        document.getElementById('eventForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('eventTitle').value.trim();
            const description = document.getElementById('eventDescription').value.trim();
            const date = document.getElementById('eventDate').value;
            const start = document.getElementById('eventStart').value;
            const end = document.getElementById('eventEnd').value;
            const type = document.getElementById('eventType').value;
            const repeat = document.getElementById('eventRepeat').value;
            const reminder = document.getElementById('eventReminder').checked;
            
            if (!title || !date) {
                this.showToast('Preencha título e data!', 'error');
                return;
            }
            
            const eventDate = new Date(date + 'T12:00:00');
            const novoEvento = {
                title,
                description,
                date,
                day: eventDate.getDate(),
                month: eventDate.getMonth(),
                year: eventDate.getFullYear(),
                time: start,
                endTime: end,
                type,
                repeat,
                reminder,
                color: this.getEventColor(type)
            };
            
            this.saveEvent(novoEvento);
        });
        
        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEventModal();
            }
        });
        
        // Atualizar dados
        window.addEventListener('cloudDataLoaded', () => {
            this.events = this.app.data.calendarEvents || [];
            this.notifications = this.app.data.notifications || [];
            this.profile = this.app.data.profile || {};
            this.atualizarNomeUsuario();
            this.renderCalendar();
            this.renderEventsForSelectedDay();
            this.updateBadge();
        });
    }
}

console.log('[Calendario] ✅ Módulo carregado!');