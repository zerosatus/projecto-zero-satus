// ============================================
// modules/dashboard.js - DASHBOARD COMPLETO (COM SYNC FORÇADO)
// ============================================

class DashboardModule {
    constructor(app) {
        this.app = app;
        this.name = 'dashboard';
        this.editingSubject = null;
        this.selectedSubjectColor = '#6366f1';
        this.days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        this.isSaving = false;
        
        console.log('[Dashboard] 📊 Módulo inicializado');
    }
    
    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[Dashboard] 📊 Renderizando...');
        
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.calendarEvents = data.calendarEvents || [];
        this.weeklySchedule = data.weeklySchedule || {};
        this.timeSlots = data.timeSlots || [];
        this.notifications = data.notifications || [];
        this.disciplinas = data.disciplinas || [];
        
        this.days.forEach(day => {
            if (!this.weeklySchedule[day]) this.weeklySchedule[day] = [];
        });
        
        if (this.timeSlots.length === 0) {
            this.timeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30'];
        }
        
        this.renderCards();
        this.renderSchedule();
        this.renderNextEvents();
        this.renderNextTasks();
        this.renderNotifications();
        this.updateFraseDoDia();
        this.updateBadge();
        this.setupEvents();
    }
    
    // ============================================
    // RENDER CARDS
    // ============================================
    renderCards() {
        const disciplinas = new Set();
        if (this.weeklySchedule) {
            Object.values(this.weeklySchedule).forEach(day => {
                if (Array.isArray(day)) {
                    day.forEach(c => {
                        if (c && c.materia) disciplinas.add(c.materia.toLowerCase());
                    });
                }
            });
        }
        
        const concluidas = this.tasks.filter(t => t.completed).length;
        const pendentes = this.tasks.filter(t => !t.completed).length;
        
        document.getElementById('card-disciplinas').textContent = disciplinas.size || 0;
        document.getElementById('card-concluidas').textContent = concluidas;
        document.getElementById('card-pendentes').textContent = pendentes;
    }
    
    // ============================================
    // RENDER HORÁRIO
    // ============================================
    renderSchedule() {
        const grid = document.getElementById('schedule-grid');
        if (!grid) return;
        
        const schedule = this.weeklySchedule || {};
        const slots = this.timeSlots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
        const days = this.days;
        
        if (Object.keys(schedule).length === 0 || !slots.length) {
            grid.innerHTML = `
                <div style="grid-column:span 6;text-align:center;padding:40px;color:var(--text-secondary);">
                    <ion-icon name="calendar-outline" style="font-size:2rem;display:block;margin-bottom:10px;opacity:0.5;"></ion-icon>
                    Nenhum horário cadastrado
                    <br>
                    <button onclick="app.modules.dashboard.openEditModal()" style="margin-top:10px;background:var(--accent-purple);border:none;color:white;padding:8px 20px;border-radius:20px;cursor:pointer;font-size:0.8rem;">
                        <ion-icon name="add-outline"></ion-icon> Adicionar
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '<div class="day-header">Hora</div>';
        days.forEach(day => html += `<div class="day-header">${day}</div>`);
        
        slots.forEach(time => {
            html += `<div class="time-slot">${time}</div>`;
            days.forEach(day => {
                const classItem = (schedule[day] || []).find(c => c.horaInicio === time);
                if (classItem && classItem.materia) {
                    html += `
                        <div class="class-cell">
                            <div class="class-block subject-custom" style="background-color: ${classItem.color || '#6366f1'}">
                                ${this.app.escapeHtml(classItem.materia)}
                                ${classItem.professor ? `<br><small style="font-size:0.55rem;opacity:0.8;">${this.app.escapeHtml(classItem.professor)}</small>` : ''}
                            </div>
                        </div>
                    `;
                } else {
                    html += `<div class="class-cell"><div class="class-block empty">+</div></div>`;
                }
            });
        });
        
        grid.innerHTML = html;
    }
    
    // ============================================
    // RENDER PRÓXIMO EVENTO
    // ============================================
    renderNextEvents() {
        const container = document.getElementById('next-event-container');
        if (!container) return;
        
        const events = this.calendarEvents || [];
        const today = new Date().toISOString().split('T')[0];
        
        const proximos = events
            .filter(e => e.date && e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3);
        
        if (proximos.length === 0) {
            container.innerHTML = `
                <div class="list-item" onclick="app.showView('calendario')">
                    <div class="item-icon"><ion-icon name="calendar-outline"></ion-icon></div>
                    <div class="item-info">
                        <div class="item-title">Sem eventos próximos</div>
                        <div class="item-subtitle">Adicione um evento no calendário 📅</div>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        proximos.forEach(event => {
            const date = new Date(event.date);
            const dateStr = date.toLocaleDateString('pt-BR');
            html += `
                <div class="list-item" onclick="app.showView('calendario')">
                    <div class="item-icon" style="background-color: ${event.color || '#8b5cf6'}20; color: ${event.color || '#8b5cf6'}">
                        <ion-icon name="calendar-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">${this.app.escapeHtml(event.title)}</div>
                        <div class="item-subtitle">${dateStr} • ${event.start || '--:--'}</div>
                    </div>
                    <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    // ============================================
    // RENDER TAREFAS PRÓXIMAS
    // ============================================
    renderNextTasks() {
        const container = document.getElementById('next-tasks-container');
        if (!container) return;
        
        const pendentes = this.tasks.filter(t => !t.completed).slice(0, 3);
        
        if (pendentes.length === 0) {
            container.innerHTML = `
                <div class="list-item" onclick="app.showView('tarefas')">
                    <div class="item-icon"><ion-icon name="checkmark-circle-outline"></ion-icon></div>
                    <div class="item-info">
                        <div class="item-title">Tudo em dia!</div>
                        <div class="item-subtitle">Nenhuma tarefa pendente ✨</div>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        pendentes.forEach(task => {
            html += `
                <div class="list-item" onclick="app.showView('tarefas')">
                    <div class="item-icon" style="background-color: ${task.color || '#8b5cf6'}20; color: ${task.color || '#8b5cf6'}">
                        <ion-icon name="checkbox-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">${this.app.escapeHtml(task.title || task.nome)}</div>
                        <div class="item-subtitle">${this.app.escapeHtml(task.subject || task.disciplina || 'Geral')}</div>
                    </div>
                    <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    // ============================================
    // RENDER NOTIFICAÇÕES
    // ============================================
    renderNotifications() {
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        const naoLidas = this.notifications.filter(n => !n.read).slice(0, 3);
        
        if (naoLidas.length === 0) {
            container.innerHTML = `
                <div class="list-item" onclick="app.openNotifications()">
                    <div class="item-icon notification"><ion-icon name="checkmark-circle-outline"></ion-icon></div>
                    <div class="item-info">
                        <div class="item-title">Tudo em dia!</div>
                        <div class="item-subtitle">Nenhuma notificação pendente ✨</div>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        naoLidas.forEach(notif => {
            html += `
                <div class="list-item" onclick="app.openNotifications()">
                    <div class="item-icon notification" style="background-color: #8b5cf6; color: white">
                        <ion-icon name="notifications-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">${this.app.escapeHtml(notif.title)}</div>
                        <div class="item-subtitle">${this.app.escapeHtml(notif.message)}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    // ============================================
    // FRASE DO DIA
    // ============================================
    updateFraseDoDia() {
        const el = document.getElementById('fraseDoDiaText');
        if (el && window.FrasesDoDia) {
            el.textContent = window.FrasesDoDia.getFraseDoDia();
        } else if (el) {
            el.textContent = 'A persistência leva à perfeição. Continue firme nos estudos!';
        }
    }
    
    // ============================================
    // BADGE
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        
        const naoLidas = this.notifications.filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
    
    // ============================================
    // MODAL DE EDIÇÃO DE HORÁRIO
    // ============================================
    openEditModal() {
        const modal = document.getElementById('edit-modal');
        if (!modal) return;
        
        this.renderEditSchedule();
        modal.classList.add('active');
    }
    
    closeEditModal() {
        const modal = document.getElementById('edit-modal');
        if (modal) modal.classList.remove('active');
    }
    
    renderEditSchedule() {
        const grid = document.getElementById('edit-schedule-grid');
        if (!grid) return;
        
        const schedule = this.weeklySchedule || {};
        const slots = this.timeSlots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
        const days = this.days;
        
        let html = '<div class="day-header">Hora</div>';
        days.forEach(day => html += `<div class="day-header">${day}</div>`);
        
        slots.forEach((time, index) => {
            html += `
                <div class="time-slot-with-delete">
                    <span class="time-slot-text">${time}</span>
                    <button class="btn-delete-time" onclick="app.modules.dashboard.deleteTimeSlot('${time}')" title="Remover horário">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            `;
            
            days.forEach(day => {
                const classItem = (schedule[day] || []).find(c => c.horaInicio === time);
                if (classItem && classItem.materia) {
                    html += `
                        <div class="edit-cell">
                            <div class="class-block" style="background-color: ${classItem.color || '#6366f1'};">
                                ${this.app.escapeHtml(classItem.materia)}
                                ${classItem.professor ? `<br><small>${this.app.escapeHtml(classItem.professor)}</small>` : ''}
                                <button class="btn-delete-class" onclick="app.modules.dashboard.deleteSubject('${day}','${time}')">
                                    <ion-icon name="close-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="edit-cell">
                            <button class="btn-add" onclick="app.modules.dashboard.openSubjectModal('${day}','${time}')">
                                <ion-icon name="add-outline"></ion-icon>
                            </button>
                        </div>
                    `;
                }
            });
        });
        
        grid.innerHTML = html;
    }
    
    // ============================================
    // GERENCIAR HORÁRIOS
    // ============================================
    deleteTimeSlot(time) {
        if (!confirm(`Remover o horário ${time}? Isso removerá todas as aulas neste horário.`)) return;
        
        this.timeSlots = this.timeSlots.filter(t => t !== time);
        
        this.days.forEach(day => {
            this.weeklySchedule[day] = (this.weeklySchedule[day] || []).filter(c => c.horaInicio !== time);
        });
        
        this.saveSchedule();
        this.renderEditSchedule();
        this.renderSchedule();
        
        if (typeof showToast === 'function') {
            showToast('🗑️ Horário removido!', 'success');
        }
    }
    
    // ============================================
    // MODAL DE MATÉRIA
    // ============================================
    openSubjectModal(day, time) {
        this.editingSubject = { day, time };
        this.selectedSubjectColor = '#6366f1';
        
        const modal = document.getElementById('subject-modal');
        if (!modal) return;
        
        document.getElementById('subject-modal-title').textContent = '📝 Adicionar Matéria';
        document.getElementById('subject-name-input').value = '';
        document.getElementById('subject-teacher-input').value = '';
        document.getElementById('subject-start-input').value = time || '08:00';
        document.getElementById('subject-end-input').value = '09:00';
        document.getElementById('subject-day-input').value = day || 'Seg';
        
        document.querySelectorAll('#subject-modal .color-option').forEach(opt => {
            opt.classList.remove('active');
        });
        document.querySelector('#subject-modal .color-option[data-color="#6366f1"]')?.classList.add('active');
        this.selectedSubjectColor = '#6366f1';
        
        modal.classList.add('active');
    }
    
    closeSubjectModal() {
        const modal = document.getElementById('subject-modal');
        if (modal) modal.classList.remove('active');
        this.editingSubject = null;
    }
    
    // ============================================
    // SALVAR MATÉRIA
    // ============================================
    async saveSubject() {
        const name = document.getElementById('subject-name-input')?.value?.trim();
        const teacher = document.getElementById('subject-teacher-input')?.value?.trim();
        const start = document.getElementById('subject-start-input')?.value;
        const end = document.getElementById('subject-end-input')?.value;
        const day = document.getElementById('subject-day-input')?.value;
        
        if (!name) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Digite o nome da matéria!', 'error');
            }
            return;
        }
        
        if (!start || !day) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Preencha todos os campos!', 'error');
            }
            return;
        }
        
        if (!this.weeklySchedule[day]) this.weeklySchedule[day] = [];
        
        this.weeklySchedule[day] = this.weeklySchedule[day].filter(c => c.horaInicio !== start);
        
        this.weeklySchedule[day].push({
            materia: name,
            professor: teacher || '',
            horaInicio: start,
            horaFim: end || '09:00',
            color: this.selectedSubjectColor
        });
        
        if (!this.timeSlots.includes(start)) {
            this.timeSlots.push(start);
            this.timeSlots.sort();
        }
        
        await this.saveSchedule();
        this.closeSubjectModal();
        this.renderEditSchedule();
        this.renderSchedule();
        this.renderCards();
        
        if (typeof showToast === 'function') {
            showToast('✅ Matéria adicionada!', 'success');
        }
    }
    
    // ============================================
    // DELETAR MATÉRIA
    // ============================================
    deleteSubject(day, time) {
        if (!confirm('Remover esta matéria?')) return;
        
        if (!this.weeklySchedule[day]) return;
        this.weeklySchedule[day] = this.weeklySchedule[day].filter(c => c.horaInicio !== time);
        
        this.saveSchedule();
        this.renderEditSchedule();
        this.renderSchedule();
        this.renderCards();
        
        if (typeof showToast === 'function') {
            showToast('🗑️ Matéria removida!', 'success');
        }
    }
    
    // ============================================
    // SALVAR HORÁRIO (COM SYNC FORÇADO)
    // ============================================
    async saveSchedule() {
        this.app.data.weeklySchedule = this.weeklySchedule;
        this.app.data.timeSlots = this.timeSlots;
        await this.app.saveAllData();
        
        // ⭐ FORÇAR SINCRONIZAÇÃO IMEDIATA
        if (window.CacheManager && window.CacheManager.forceSync) {
            setTimeout(() => {
                window.CacheManager.forceSync().catch(() => {});
            }, 500);
        }
        
        // ⭐ DISPARAR EVENTO PARA ATUALIZAR OUTRAS TELAS
        window.dispatchEvent(new CustomEvent('scheduleUpdated', { 
            detail: { 
                weeklySchedule: this.weeklySchedule, 
                timeSlots: this.timeSlots 
            } 
        }));
        
        console.log('[Dashboard] ✅ Horário salvo e sincronizado');
    }
    
    // ============================================
    // ADICIONAR NOVO HORÁRIO
    // ============================================
    addNewTimeSlot() {
        const input = document.getElementById('new-time-input');
        if (!input) return;
        
        const time = input.value;
        if (!time) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Selecione um horário!', 'error');
            }
            return;
        }
        
        if (this.timeSlots.includes(time)) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Este horário já existe!', 'error');
            }
            return;
        }
        
        this.timeSlots.push(time);
        this.timeSlots.sort();
        
        this.saveSchedule();
        this.renderEditSchedule();
        this.renderSchedule();
        
        if (typeof showToast === 'function') {
            showToast('✅ Horário adicionado!', 'success');
        }
    }
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        document.getElementById('toggle-edit-mode')?.addEventListener('click', () => {
            this.openEditModal();
        });
        
        document.getElementById('btn-back')?.addEventListener('click', () => {
            this.closeEditModal();
        });
        
        document.getElementById('btn-save')?.addEventListener('click', () => {
            this.closeEditModal();
            if (typeof showToast === 'function') {
                showToast('✅ Horário atualizado!', 'success');
            }
        });
        
        document.getElementById('edit-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeEditModal();
            }
        });
        
        document.querySelectorAll('[data-modal="subject-modal"]').forEach(el => {
            el.addEventListener('click', () => {
                this.closeSubjectModal();
            });
        });
        
        document.getElementById('subject-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeSubjectModal();
            }
        });
        
        document.getElementById('btn-save-subject')?.addEventListener('click', () => {
            this.saveSubject();
        });
        
        document.getElementById('btn-add-time')?.addEventListener('click', () => {
            this.addNewTimeSlot();
        });
        
        document.getElementById('btn-cancel-time')?.addEventListener('click', () => {
            document.getElementById('new-time-input').value = '';
        });
        
        document.getElementById('new-time-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addNewTimeSlot();
            }
        });
        
        document.getElementById('subject-name-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveSubject();
            }
        });
        
        document.querySelectorAll('#subject-modal .color-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('#subject-modal .color-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.selectedSubjectColor = option.dataset.color;
            });
        });
    }
}

console.log('[Dashboard] ✅ Módulo carregado!');