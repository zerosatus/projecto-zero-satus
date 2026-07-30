// ============================================
// modules/calendario.js - CALENDÁRIO CORRIGIDO
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
        
        console.log('[Calendario] 📅 Módulo inicializado');
    }
    
    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[Calendario] 📅 Renderizando...');
        
        this.calendarEvents = data.calendarEvents || [];
        this.notifications = data.notifications || [];
        
        this.renderCalendar();
        this.renderEvents();
        this.setupEvents();
        this.updateBadge();
    }
    
    // ============================================
    // SALVAR DADOS
    // ============================================
    async salvarDados() {
        if (this.isSaving || !this.app) return;
        this.isSaving = true;
        
        try {
            this.app.data.calendarEvents = this.calendarEvents;
            await this.app.saveAllData();
            console.log('[Calendario] ✅ Dados salvos:', this.calendarEvents.length);
        } catch (error) {
            console.error('[Calendario] ❌ Erro ao salvar:', error);
        }
        
        setTimeout(() => { this.isSaving = false; }, 500);
    }
    
    // ============================================
    // RENDER CALENDÁRIO (MAIS COMPACTO)
    // ============================================
    renderCalendar() {
        const calendarDays = document.getElementById('calendar-days');
        const currentMonthYear = document.getElementById('current-month-year');
        if (!calendarDays) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        currentMonthYear.textContent = `${monthNames[month]} de ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
        const currentDay = today.getDate();
        
        let html = '';
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && day === currentDay;
            const isSelected = day === this.selectedDay;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEvent = this.calendarEvents.some(e => e.date === dateStr);
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}" 
                     data-day="${day}" data-date="${dateStr}">
                    ${day}
                </div>
            `;
        }
        calendarDays.innerHTML = html;
        
        // Eventos de clique nos dias
        calendarDays.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', () => {
                this.selectedDay = parseInt(day.dataset.day);
                const dateStr = day.dataset.date;
                document.getElementById('events-date').textContent = `Eventos do dia ${this.selectedDay}`;
                this.renderEvents();
                this.renderCalendar();
            });
        });
        
        // Navegação
        document.getElementById('prev-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.selectedDay = 1;
            this.renderCalendar();
            this.renderEvents();
        });
        
        document.getElementById('next-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.selectedDay = 1;
            this.renderCalendar();
            this.renderEvents();
        });
    }
    
    // ============================================
    // RENDER EVENTOS (COM SCROLL)
    // ============================================
    renderEvents() {
        const eventsList = document.getElementById('events-list');
        if (!eventsList) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(this.selectedDay).padStart(2, '0')}`;
        
        const dayEvents = this.calendarEvents.filter(e => e.date === selectedDateStr);
        
        if (dayEvents.length === 0) {
            eventsList.innerHTML = `
                <div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:0.85rem;">
                    <ion-icon name="calendar-outline" style="font-size:1.5rem;opacity:0.4;display:block;margin-bottom:6px;"></ion-icon>
                    Nenhum evento neste dia
                </div>
            `;
            return;
        }
        
        let html = '';
        dayEvents.forEach(event => {
            const iconMap = { 'aula': 'book', 'prova': 'document', 'tarefa': 'checkbox', 'outro': 'calendar' };
            html += `
                <div class="event-item" data-id="${event.id}" style="border-left: 3px solid ${event.color};">
                    <div class="event-icon ${event.type}" style="background-color: ${event.color}20; color: ${event.color}">
                        <ion-icon name="${iconMap[event.type] || 'calendar'}-outline"></ion-icon>
                    </div>
                    <div class="event-info">
                        <div class="event-title">${this.app.escapeHtml(event.title)}</div>
                        <div class="event-time">${event.start || '--:--'} - ${event.end || '--:--'}</div>
                    </div>
                    <div class="event-actions">
                        <ion-icon name="create-outline" class="edit-event" data-id="${event.id}"></ion-icon>
                        <ion-icon name="trash-outline" class="delete-event" data-id="${event.id}"></ion-icon>
                    </div>
                </div>
            `;
        });
        eventsList.innerHTML = html;
        
        // Eventos de edição e exclusão
        eventsList.querySelectorAll('.edit-event').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = icon.dataset.id;
                const event = this.calendarEvents.find(ev => ev.id == eventId);
                if (event) this.openEventModal(event);
            });
        });
        
        eventsList.querySelectorAll('.delete-event').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = icon.dataset.id;
                this.deleteEvent(eventId);
            });
        });
    }
    
    // ============================================
    // DELETAR EVENTO
    // ============================================
    deleteEvent(eventId) {
        if (!confirm('Excluir este evento?')) return;
        
        this.calendarEvents = this.calendarEvents.filter(ev => ev.id != eventId);
        this.salvarDados();
        this.renderEvents();
        this.renderCalendar();
        this.updateBadge();
        
        if (typeof showToast === 'function') {
            showToast('🗑️ Evento excluído!', 'success');
        }
    }
    
    // ============================================
    // MODAL DE EVENTO
    // ============================================
    openEventModal(event) {
        const modal = document.getElementById('event-modal');
        if (!modal) return;
        
        this.editingEventId = event ? event.id : null;
        const year = this.currentDate.getFullYear();
        const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(this.selectedDay).padStart(2, '0');
        
        if (event) {
            document.getElementById('event-modal-title').textContent = '✏️ Editar Evento';
            document.getElementById('event-title').value = event.title || '';
            document.getElementById('event-date').value = event.date || '';
            document.getElementById('event-start').value = event.start || '08:00';
            document.getElementById('event-end').value = event.end || '09:00';
            this.selectedEventType = event.type || 'aula';
            this.selectedEventColor = event.color || '#8b5cf6';
        } else {
            document.getElementById('event-modal-title').textContent = '📝 Novo Evento';
            document.getElementById('event-title').value = '';
            document.getElementById('event-date').value = `${year}-${month}-${day}`;
            document.getElementById('event-start').value = '08:00';
            document.getElementById('event-end').value = '09:00';
            this.selectedEventType = 'aula';
            this.selectedEventColor = '#8b5cf6';
        }
        
        // Atualizar seleção de tipo
        document.querySelectorAll('#event-modal .type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === this.selectedEventType);
        });
        
        // Atualizar seleção de cor
        document.querySelectorAll('#event-modal .color-option').forEach(option => {
            option.classList.toggle('active', option.dataset.color === this.selectedEventColor);
        });
        
        modal.classList.add('active');
        
        // Foco no título
        setTimeout(() => {
            document.getElementById('event-title')?.focus();
        }, 300);
    }
    
    closeEventModal() {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.remove('active');
        this.editingEventId = null;
        this._isSubmitting = false;
    }
    
    // ============================================
    // SALVAR EVENTO (PREVINE DUPLICAÇÃO)
    // ============================================
    async saveEvent() {
        if (this._isSubmitting) {
            console.log('[Calendario] ⏳ Já está salvando, aguarde...');
            return;
        }
        
        const title = document.getElementById('event-title')?.value?.trim();
        const date = document.getElementById('event-date')?.value;
        const start = document.getElementById('event-start')?.value;
        const end = document.getElementById('event-end')?.value;
        
        if (!title || !date) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Preencha título e data!', 'error');
            }
            return;
        }
        
        this._isSubmitting = true;
        
        try {
            if (this.editingEventId) {
                // Editar evento existente
                const index = this.calendarEvents.findIndex(e => e.id == this.editingEventId);
                if (index > -1) {
                    this.calendarEvents[index] = {
                        ...this.calendarEvents[index],
                        title,
                        date,
                        start: start || this.calendarEvents[index].start || '08:00',
                        end: end || this.calendarEvents[index].end || '09:00',
                        type: this.selectedEventType,
                        color: this.selectedEventColor
                    };
                }
            } else {
                // Criar novo evento (verificar duplicação)
                const existe = this.calendarEvents.some(e => 
                    e.title === title && 
                    e.date === date &&
                    e.start === start &&
                    e.end === end
                );
                
                if (!existe) {
                    this.calendarEvents.push({
                        id: Date.now(),
                        title,
                        date,
                        start: start || '08:00',
                        end: end || '09:00',
                        type: this.selectedEventType,
                        color: this.selectedEventColor
                    });
                } else {
                    console.log('[Calendario] ⚠️ Evento já existe, ignorando duplicação');
                    if (typeof showToast === 'function') {
                        showToast('⚠️ Evento já existe!', 'info');
                    }
                    this.closeEventModal();
                    return;
                }
            }
            
            await this.salvarDados();
            this.closeEventModal();
            this.renderEvents();
            this.renderCalendar();
            this.updateBadge();
            
            if (typeof showToast === 'function') {
                showToast(this.editingEventId ? '✅ Evento atualizado!' : '✅ Evento criado!', 'success');
            }
            
        } catch (error) {
            console.error('[Calendario] ❌ Erro ao salvar:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Erro ao salvar evento', 'error');
            }
        } finally {
            this._isSubmitting = false;
        }
    }
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        // Botão novo evento
        document.getElementById('btn-new-event')?.addEventListener('click', () => {
            this.openEventModal(null);
        });
        
        // Fechar modal
        const modal = document.getElementById('event-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('.btn-back') || e.target.closest('.btn-close')) {
                    this.closeEventModal();
                }
            });
        }
        
        // Seleção de tipo de evento
        document.querySelectorAll('#event-modal .type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#event-modal .type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedEventType = btn.dataset.type;
            });
        });
        
        // Seleção de cor
        document.querySelectorAll('#event-modal .color-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('#event-modal .color-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.selectedEventColor = option.dataset.color;
            });
        });
        
        // Botão salvar
        const saveBtn = document.getElementById('btn-save-event');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveEvent();
            });
        }
        
        // Enter para salvar
        document.getElementById('event-title')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveEvent();
            }
        });
    }
}

console.log('[Calendario] ✅ Módulo carregado (corrigido)!');