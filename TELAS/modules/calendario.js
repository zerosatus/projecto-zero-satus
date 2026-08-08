// ============================================
// modules/calendario.js - CALENDÁRIO
// ============================================

class CalendarioModule {
    constructor(app) {
        this.app = app;
        this.name = 'calendario';
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.currentView = 'month';
        this.editingEventId = null;
        this.selectedEventType = 'aula';
        this.selectedEventColor = '#8b5cf6';
        
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
        
        this.renderCalendar();
        this.renderEvents();
        this.setupEvents();
        this.updateBadge();
    }
    
    // ============================================
    // RENDER CALENDÁRIO
    // ============================================
    renderCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        const currentMonthEl = document.getElementById('currentMonth');
        if (!calendarDays) return;
        
        if (this.currentView === 'month') this.renderMonthView(calendarDays, currentMonthEl);
        else if (this.currentView === 'week') this.renderWeekView(calendarDays, currentMonthEl);
        else if (this.currentView === 'day') this.renderDayView(calendarDays, currentMonthEl);
    }
    
    renderMonthView(calendarDays, currentMonthEl) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        if (currentMonthEl) currentMonthEl.textContent = `${this.monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        // Limpar
        calendarDays.innerHTML = '';
        calendarDays.className = 'days';
        
        // Dias do mês anterior
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            calendarDays.appendChild(this.createDayElement(daysInPrevMonth - i, true));
        }
        
        // Dias do mês atual
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dayEl = this.createDayElement(day, false, isToday);
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = this.events.filter(e => e.date === dateStr || 
                (e.day === day && e.month === month && e.year === year));
            
            dayEvents.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `event ${event.type || 'outro'}`;
                eventEl.textContent = `${event.start || '--:--'} ${event.title}`;
                dayEl.appendChild(eventEl);
            });
            
            dayEl.addEventListener('click', () => {
                this.selectedDate = new Date(year, month, day);
                this.renderEvents();
                document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
                dayEl.classList.add('selected');
                document.getElementById('selectedDay').textContent = day;
            });
            
            if (this.selectedDate.getDate() === day && this.selectedDate.getMonth() === month && 
                this.selectedDate.getFullYear() === year) {
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
    
    renderWeekView(calendarDays, currentMonthEl) {
        // Implementação simplificada
        calendarDays.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);">Visualização Semana (em breve)</div>';
    }
    
    renderDayView(calendarDays, currentMonthEl) {
        // Implementação simplificada
        calendarDays.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);">Visualização Dia (em breve)</div>';
    }
    
    // ============================================
    // RENDER EVENTOS
    // ============================================
    renderEvents() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;
        
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        const day = this.selectedDate.getDate();
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = this.events.filter(e => e.date === dateStr || 
            (e.day === day && e.month === month && e.year === year));
        
        document.getElementById('selectedDay').textContent = day;
        
        if (dayEvents.length === 0) {
            eventsList.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;text-align:center;">Nenhum evento para este dia</p>';
            return;
        }
        
        const colors = { 
            'prova': '#ef4444', 'trabalho': '#eab308', 'apresentacao': '#3b82f6', 
            'reuniao': '#8b5cf6', 'aula': '#10b981', 'outro': '#9333ea' 
        };
        
        eventsList.innerHTML = dayEvents.map(event => `
            <div class="event-item" style="border-left-color: ${colors[event.type] || '#9333ea'};">
                <div class="event-color" style="background-color: ${colors[event.type] || '#9333ea'};"></div>
                <div class="event-info">
                    <h4>${this.app.escapeHtml(event.title)}</h4>
                    <p>${event.start || '--:--'} - ${event.end || '--:--'} ${event.description ? '• ' + this.app.escapeHtml(event.description) : ''}</p>
                </div>
                <button class="delete-event" data-id="${event.id}"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
        
        // Eventos de deleção
        eventsList.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (confirm('Deseja excluir este evento?')) {
                    this.events = this.events.filter(ev => ev.id !== id);
                    this.app.data.calendarEvents = this.events;
                    this.app.saveAllData();
                    this.renderEvents();
                    this.renderCalendar();
                    if (typeof showToast === 'function') {
                        showToast('Evento excluído!', 'success');
                    }
                }
            });
        });
    }
    
    // ============================================
    // MODAL DE EVENTO
    // ============================================
    openEventModal(event = null) {
        const modal = document.getElementById('eventModal');
        if (!modal) return;
        
        this.editingEventId = event ? event.id : null;
        const year = this.selectedDate.getFullYear();
        const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(this.selectedDate.getDate()).padStart(2, '0');
        
        document.getElementById('eventTitle').value = event ? event.title : '';
        document.getElementById('eventDate').value = event ? event.date : `${year}-${month}-${day}`;
        document.getElementById('eventStart').value = event ? event.start : '08:00';
        document.getElementById('eventEnd').value = event ? event.end : '09:00';
        document.getElementById('eventType').value = event ? event.type : 'aula';
        document.getElementById('eventRepeat').value = event ? event.repeat || 'nao' : 'nao';
        document.getElementById('eventReminder').checked = event ? event.reminder || false : false;
        
        this.selectedEventType = event ? event.type : 'aula';
        this.selectedEventColor = event ? event.color : '#8b5cf6';
        
        // Atualizar tipos
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === this.selectedEventType);
        });
        
        // Atualizar cores
        document.querySelectorAll('#eventModal .color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === this.selectedEventColor);
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
    
    saveEvent(eventData) {
        if (this.editingEventId) {
            const index = this.events.findIndex(e => e.id === this.editingEventId);
            if (index > -1) {
                this.events[index] = { ...this.events[index], ...eventData };
            }
        } else {
            this.events.push({
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                ...eventData,
                dataCriacao: new Date().toISOString()
            });
        }
        
        this.app.data.calendarEvents = this.events;
        this.app.saveAllData();
        this.closeEventModal();
        this.renderEvents();
        this.renderCalendar();
        this.updateBadge();
        
        if (typeof showToast === 'function') {
            showToast(this.editingEventId ? 'Evento atualizado!' : 'Evento criado!', 'success');
        }
    }
    
    deleteEvent(id) {
        if (confirm('Deseja excluir este evento?')) {
            this.events = this.events.filter(e => e.id !== id);
            this.app.data.calendarEvents = this.events;
            this.app.saveAllData();
            this.renderEvents();
            this.renderCalendar();
            if (typeof showToast === 'function') {
                showToast('Evento excluído!', 'success');
            }
        }
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
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        // Navegação
        document.getElementById('prevBtn')?.addEventListener('click', () => {
            if (this.currentView === 'month') this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            else if (this.currentView === 'week') this.currentDate.setDate(this.currentDate.getDate() - 7);
            else this.selectedDate.setDate(this.selectedDate.getDate() - 1);
            this.renderCalendar();
            this.renderEvents();
        });
        
        document.getElementById('nextBtn')?.addEventListener('click', () => {
            if (this.currentView === 'month') this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            else if (this.currentView === 'week') this.currentDate.setDate(this.currentDate.getDate() + 7);
            else this.selectedDate.setDate(this.selectedDate.getDate() + 1);
            this.renderCalendar();
            this.renderEvents();
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
        
        // Modal close
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
        
        // Cores
        document.querySelectorAll('#eventModal .color-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('#eventModal .color-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.selectedEventColor = opt.dataset.color;
            });
        });
        
        // Form submit
        document.getElementById('eventForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('eventTitle').value.trim();
            const date = document.getElementById('eventDate').value;
            const start = document.getElementById('eventStart').value;
            const end = document.getElementById('eventEnd').value;
            const type = document.getElementById('eventType').value;
            const repeat = document.getElementById('eventRepeat').value;
            const reminder = document.getElementById('eventReminder').checked;
            
            if (!title || !date) {
                alert('Preencha título e data!');
                return;
            }
            
            this.saveEvent({
                title,
                date,
                start,
                end,
                type,
                repeat,
                reminder,
                color: this.selectedEventColor
            });
        });
    }
}

console.log('[Calendario] ✅ Módulo carregado!');