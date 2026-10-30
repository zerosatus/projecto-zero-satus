// ============================================
// modules/calendario.js - CALENDÁRIO (CORRIGIDO FINAL)
// ⭐ SINCRONIZADO COM AS CLASSES DO index.html
// ============================================

class CalendarioModule {
    constructor(app) {
        this.app = app;
        this.name = 'calendario';
        this.currentDate = new Date();
        this.selectedDay = this.currentDate.getDate();
        this.editingEventId = null;
        this.selectedEventType = 'aula';
        this.selectedEventColor = '#8b5cf6';
        this.isSaving = false;
        this._isSubmitting = false;
        this._eventsSetup = false;
        
        console.log('[Calendario] 📅 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Calendario] 📅 Renderizando...');
        
        this.calendarEvents = data.calendarEvents || [];
        this.notifications = data.notifications || [];
        this.disciplinas = data.disciplinas || [];
        
        this.renderCalendar();
        this.renderEvents();
        
        if (!this._eventsSetup) {
            this.setupEvents();
            this._eventsSetup = true;
        }
        
        this.updateBadge();
    }

    getDisciplinas() {
        if (this.app?.modules?.disciplinas?.getTodas) {
            return this.app.modules.disciplinas.getTodas();
        }
        return this.disciplinas || [];
    }

    popularSelectDisciplinas(disciplinaSelecionada = null) {
        const select = document.getElementById('eventDisciplina');
        if (!select) return;
        
        const disciplinas = this.getDisciplinas();
        
        select.innerHTML = '<option value="">— Sem disciplina —</option>';
        
        disciplinas.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.nome;
            opt.textContent = d.nome;
            select.appendChild(opt);
        });
        
        select.value = disciplinaSelecionada || '';
    }
    
    async salvarDados() {
        if (this.isSaving || !this.app) return;
        this.isSaving = true;
        
        try {
            this.app.data.calendarEvents = this.calendarEvents;
            await this.app.saveAllData();
        } catch (error) {
            console.error('[Calendario] ❌ Erro:', error);
        }
        
        setTimeout(() => { this.isSaving = false; }, 500);
    }
    
    renderCalendar() {
        // ⭐ IDs corretos do teu index.html
        const calendarDays = document.getElementById('calendarDays');
        const currentMonthYear = document.getElementById('currentMonthCal');
        if (!calendarDays) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        if (currentMonthYear) currentMonthYear.textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
        const currentDay = today.getDate();
        
        let html = '';
        
        // Células vazias do início do mês
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="day other-month" style="visibility: hidden;"></div>';
        }
        
        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && day === currentDay;
            const isSelected = day === this.selectedDay;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Verifica eventos do dia
            const dayEvents = this.calendarEvents.filter(e => e.date === dateStr);
            let eventsHTML = '';
            
            dayEvents.slice(0, 3).forEach(ev => {
                let cor = ev.color || '#8b5cf6';
                if (ev.disciplina) {
                    const c = this.app?.modules?.disciplinas?.getCor(ev.disciplina);
                    if (c) cor = c;
                }
                eventsHTML += `<div class="event" style="background-color: ${cor};">${this.app.escapeHtml(ev.title)}</div>`;
            });
            
            if (dayEvents.length > 3) {
                eventsHTML += `<div style="font-size:0.6rem;color:var(--text-secondary);text-align:right;">+${dayEvents.length - 3}</div>`;
            }
            
            // ⭐ Usar as classes 'day', 'today', 'selected' do CSS
            html += `
                <div class="day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-day="${day}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    ${eventsHTML}
                </div>
            `;
        }
        calendarDays.innerHTML = html;
        
        // ⭐ Adicionar evento de clique nos dias
        calendarDays.querySelectorAll('.day').forEach(day => {
            day.addEventListener('click', () => {
                this.selectedDay = parseInt(day.dataset.day);
                
                // Atualiza o título da secção de eventos
                const spanDia = document.getElementById('selectedDay');
                if (spanDia) spanDia.textContent = this.selectedDay;
                
                this.renderEvents();
                this.renderCalendar();
            });
        });
    }
    
    renderEvents() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(this.selectedDay).padStart(2, '0')}`;
        
        const dayEvents = this.calendarEvents.filter(e => e.date === selectedDateStr);
        
        if (dayEvents.length === 0) {
            eventsList.innerHTML = `
                <div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:0.85rem;">
                    <i class="fas fa-calendar" style="font-size:1.5rem;opacity:0.4;display:block;margin-bottom:6px;"></i>
                    Nenhum evento neste dia
                </div>
            `;
            return;
        }
        
        let html = '';
        dayEvents.forEach(event => {
            const iconMap = { 'aula': 'book', 'prova': 'file-alt', 'tarefa': 'tasks', 'trabalho': 'briefcase', 'apresentacao': 'chalkboard-teacher', 'reuniao': 'users', 'outro': 'calendar' };
            
            let corFinal = event.color || '#8b5cf6';
            let iconeFinal = iconMap[event.type] || 'calendar';
            
            if (event.disciplina) {
                const corDisc = this.app?.modules?.disciplinas?.getCor(event.disciplina);
                const iconeDisc = this.app?.modules?.disciplinas?.getIcone(event.disciplina);
                if (corDisc) corFinal = corDisc;
                if (iconeDisc) iconeFinal = iconeDisc.replace('fa-', ''); 
            }

            html += `
                <div class="event-item" data-id="${event.id}" style="border-left: 3px solid ${corFinal};">
                    <div class="event-icon" style="background-color: ${corFinal}20; color: ${corFinal}; display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:8px;">
                        <i class="fas fa-${iconeFinal}"></i>
                    </div>
                    <div class="event-info" style="flex:1;">
                        <div class="event-title" style="font-weight:600;font-size:0.9rem;">${this.app.escapeHtml(event.title)}</div>
                        <div class="event-time" style="font-size:0.75rem;color:var(--text-secondary);">${event.start || '--:--'} ${event.end ? '- ' + event.end : ''}</div>
                        ${event.disciplina ? `<div style="font-size:0.7rem;color:${corFinal};margin-top:4px;"><i class="fas fa-book"></i> ${this.app.escapeHtml(event.disciplina)}</div>` : ''}
                    </div>
                    <div class="event-actions" style="display:flex;gap:8px;">
                        <button class="edit-event" data-id="${event.id}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;"><i class="fas fa-edit"></i></button>
                        <button class="delete-event" data-id="${event.id}" style="background:none;border:none;color:var(--danger);cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        eventsList.innerHTML = html;
        
        eventsList.querySelectorAll('.edit-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const event = this.calendarEvents.find(ev => ev.id == btn.dataset.id);
                if (event) this.openEventModal(event);
            });
        });
        
        eventsList.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteEvent(btn.dataset.id);
            });
        });
    }
    
    deleteEvent(eventId) {
        if (!confirm('Excluir este evento?')) return;
        
        this.calendarEvents = this.calendarEvents.filter(ev => ev.id != eventId);
        this.salvarDados();
        this.renderEvents();
        this.renderCalendar();
        this.updateBadge();
        
        if (typeof showToast === 'function') showToast('🗑️ Evento excluído!', 'success');
    }
    
    openEventModal(event = null) {
        const modal = document.getElementById('eventModal');
        if (!modal) return;
        
        this.editingEventId = event ? event.id : null;
        const year = this.currentDate.getFullYear();
        const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(this.selectedDay).padStart(2, '0');
        
        if (event) {
            document.getElementById('modalEventTitle').textContent = '✏️ Editar Evento';
            document.getElementById('eventTitle').value = event.title || '';
            document.getElementById('eventDate').value = event.date || '';
            document.getElementById('eventStart').value = event.start || '08:00';
            document.getElementById('eventEnd').value = event.end || '09:00';
            this.selectedEventType = event.type || 'aula';
            this.selectedEventColor = event.color || '#8b5cf6';
            
            this.popularSelectDisciplinas(event.disciplina || '');
        } else {
            document.getElementById('modalEventTitle').textContent = '📝 Novo Evento';
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventDate').value = `${year}-${month}-${day}`;
            document.getElementById('eventStart').value = '08:00';
            document.getElementById('eventEnd').value = '09:00';
            this.selectedEventType = 'aula';
            this.selectedEventColor = '#8b5cf6';
            
            this.popularSelectDisciplinas('');
        }
        
        document.querySelectorAll('#eventModal .type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === this.selectedEventType);
        });
        
        modal.classList.add('active');
        setTimeout(() => document.getElementById('eventTitle')?.focus(), 300);
    }
    
    closeEventModal() {
        const modal = document.getElementById('eventModal');
        if (modal) modal.classList.remove('active');
        this.editingEventId = null;
        this._isSubmitting = false;
    }
    
    async saveEvent(e) {
        if (e) e.preventDefault();

        if (this._isSubmitting) return;
        
        const title = document.getElementById('eventTitle')?.value?.trim();
        const date = document.getElementById('eventDate')?.value;
        const start = document.getElementById('eventStart')?.value;
        const end = document.getElementById('eventEnd')?.value;
        const disciplina = document.getElementById('eventDisciplina')?.value || '';
        
        if (!title || !date) {
            if (typeof showToast === 'function') showToast('⚠️ Preencha título e data!', 'error');
            return;
        }
        
        this._isSubmitting = true;
        const isEditing = !!this.editingEventId;
        
        try {
            if (this.editingEventId) {
                const index = this.calendarEvents.findIndex(e => e.id == this.editingEventId);
                if (index > -1) {
                    this.calendarEvents[index] = {
                        ...this.calendarEvents[index],
                        title, date,
                        start: start || '08:00',
                        end: end || '09:00',
                        type: this.selectedEventType,
                        color: this.selectedEventColor,
                        disciplina: disciplina
                    };
                }
            } else {
                const existe = this.calendarEvents.some(ev => 
                    ev.title === title && ev.date === date && ev.start === start && ev.end === end
                );
                
                if (!existe) {
                    this.calendarEvents.push({
                        id: Date.now().toString(),
                        title, date,
                        start: start || '08:00',
                        end: end || '09:00',
                        type: this.selectedEventType,
                        color: this.selectedEventColor,
                        disciplina: disciplina
                    });
                } else {
                    if (typeof showToast === 'function') showToast('⚠️ Evento já existe!', 'info');
                    this.closeEventModal();
                    this._isSubmitting = false;
                    return;
                }
            }
            
            await this.salvarDados();
            this.closeEventModal();
            this.renderEvents();
            this.renderCalendar();
            this.updateBadge();
            
            if (typeof showToast === 'function') {
                showToast(isEditing ? '✅ Evento atualizado!' : '✅ Evento criado!', 'success');
            }
        } catch (error) {
            console.error('[Calendario] ❌ Erro:', error);
            if (typeof showToast === 'function') showToast('❌ Erro ao salvar', 'error');
        } finally {
            setTimeout(() => { this._isSubmitting = false; }, 500);
        }
    }
    
    updateBadge() {
        const badge = document.getElementById('notificationBadge3') || document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
    
    setupEvents() {
        // ⭐ IDs do index.html: prevBtn / nextBtn
        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.selectedDay = 1;
                this.renderCalendar();
                this.renderEvents();
            });
        }
        
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.selectedDay = 1;
                this.renderCalendar();
                this.renderEvents();
            });
        }
        
        // ⭐ IDs do index.html: newEventBtn
        const btnNew = document.getElementById('newEventBtn');
        if (btnNew) {
            btnNew.addEventListener('click', () => this.openEventModal(null));
        }
        
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('#modalClose') || e.target.closest('#btnCancel')) {
                    this.closeEventModal();
                }
            });
        }
        
        document.querySelectorAll('#eventModal .type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('#eventModal .type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedEventType = btn.dataset.type;
            });
        });
        
        const form = document.getElementById('eventForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveEvent(e));
        }
        
        window.addEventListener('disciplinasUpdated', () => {
            const viewAtiva = document.getElementById('view-calendario')?.classList.contains('active');
            if (viewAtiva) this.renderCalendar();
            this.renderEvents();
            
            const modalAberto = document.getElementById('eventModal')?.classList.contains('active');
            if (modalAberto) {
                const select = document.getElementById('eventDisciplina');
                const valorAtual = select?.value || '';
                this.popularSelectDisciplinas(valorAtual);
            }
        });
        
        window.addEventListener('cloudDataLoaded', () => {
            const viewAtiva = document.getElementById('view-calendario')?.classList.contains('active');
            if (!viewAtiva || this.isSaving) return;
            
            this.calendarEvents = this.app.data.calendarEvents || [];
            this.renderCalendar();
            this.renderEvents();
        });
    }
}

console.log('[Calendario] ✅ Módulo carregado!');