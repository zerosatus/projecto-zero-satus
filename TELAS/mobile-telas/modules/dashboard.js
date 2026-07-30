// ============================================
// modules/dashboard.js - DASHBOARD
// ============================================

class DashboardModule {
    constructor(app) {
        this.app = app;
        this.name = 'dashboard';
        console.log('[Dashboard] 📊 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Dashboard] 📊 Renderizando...');
        this.renderCards(data);
        this.renderSchedule(data);
        this.renderNextEvents(data);
        this.renderNextTasks(data);
        this.renderNotifications(data);
        this.updateFraseDoDia();
        this.app.updateBadge();
    }
    
    renderCards(data) {
        // Verificar se os dados existem
        if (!data || !data.tasks) {
            console.warn('[Dashboard] Dados não disponíveis');
            return;
        }
        
        // Contar disciplinas únicas
        const disciplinas = new Set();
        if (data.weeklySchedule) {
            Object.values(data.weeklySchedule).forEach(day => {
                if (Array.isArray(day)) {
                    day.forEach(c => {
                        if (c && c.materia) disciplinas.add(c.materia.toLowerCase());
                    });
                }
            });
        }
        
        const concluidas = data.tasks.filter(t => t.completed).length;
        const pendentes = data.tasks.filter(t => !t.completed).length;
        
        document.getElementById('card-disciplinas').textContent = disciplinas.size || 0;
        document.getElementById('card-concluidas').textContent = concluidas || 0;
        document.getElementById('card-pendentes').textContent = pendentes || 0;
    }
    
    renderSchedule(data) {
        const grid = document.getElementById('schedule-grid');
        if (!grid) return;
        
        const schedule = data.weeklySchedule || {};
        const slots = data.timeSlots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        
        let html = '<div class="day-header">Hora</div>';
        days.forEach(day => html += `<div class="day-header">${day}</div>`);
        
        slots.forEach(time => {
            html += `<div class="time-slot">${time}</div>`;
            days.forEach(day => {
                const classItem = (schedule[day] || []).find(c => c.horaInicio === time);
                if (classItem && classItem.materia) {
                    html += `<div class="class-cell">
                        <div class="class-block subject-custom" style="background-color: ${classItem.color || '#6366f1'}">
                            ${this.app.escapeHtml(classItem.materia)}
                        </div>
                    </div>`;
                } else {
                    html += `<div class="class-cell"><div class="class-block empty">+</div></div>`;
                }
            });
        });
        
        grid.innerHTML = html;
    }
    
    renderNextEvents(data) {
        const container = document.getElementById('next-event-container');
        if (!container) return;
        
        const events = data.calendarEvents || [];
        const today = new Date().toISOString().split('T')[0];
        
        const proximos = events
            .filter(e => e.date && e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3);
        
        if (proximos.length === 0) {
            container.innerHTML = `
                <div class="list-item">
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
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    renderNextTasks(data) {
        const container = document.getElementById('next-tasks-container');
        if (!container) return;
        
        const pendentes = data.tasks.filter(t => !t.completed).slice(0, 3);
        
        if (pendentes.length === 0) {
            container.innerHTML = `
                <div class="list-item">
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
                        <div class="item-title">${this.app.escapeHtml(task.title)}</div>
                        <div class="item-subtitle">${this.app.escapeHtml(task.subject || 'Geral')}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    // ============================================
    // NOTIFICAÇÕES CORRIGIDAS
    // ============================================
    renderNotifications(data) {
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        const notifications = data.notifications || [];
        const naoLidas = notifications.filter(n => !n.read);
        
        console.log('[Dashboard] Notificações:', notifications.length, 'Não lidas:', naoLidas.length);
        
        // CASO 1: NENHUMA NOTIFICAÇÃO
        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="list-item">
                    <div class="item-icon notification" style="background-color: #8b5cf6; color: white">
                        <ion-icon name="notifications-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">Sem notificações</div>
                        <div class="item-subtitle">Nenhuma notificação recebida ainda</div>
                    </div>
                </div>
            `;
            return;
        }
        
        // CASO 2: TODAS LIDAS
        if (naoLidas.length === 0) {
            container.innerHTML = `
                <div class="list-item">
                    <div class="item-icon notification" style="background-color: #10b981; color: white">
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">Todas lidas! ✅</div>
                        <div class="item-subtitle">${notifications.length} notificações lidas</div>
                    </div>
                </div>
            `;
            return;
        }
        
        // CASO 3: TEM NOTIFICAÇÕES NÃO LIDAS
        let html = '';
        const mostrar = naoLidas.slice(0, 3);
        mostrar.forEach(notif => {
            html += `
                <div class="list-item" onclick="app.openNotifications()">
                    <div class="item-icon notification" style="background-color: #ef4444; color: white">
                        <ion-icon name="notifications-outline"></ion-icon>
                    </div>
                    <div class="item-info">
                        <div class="item-title">${this.app.escapeHtml(notif.title || 'Notificação')}</div>
                        <div class="item-subtitle">${this.app.escapeHtml((notif.message || '').substring(0, 50))}${(notif.message || '').length > 50 ? '...' : ''}</div>
                    </div>
                    <span style="font-size:10px;color:var(--accent-red);background:rgba(239,68,68,0.15);padding:2px 8px;border-radius:10px;">Nova</span>
                </div>
            `;
        });
        
        // SE TIVER MAIS, MOSTRAR CONTADOR
        if (naoLidas.length > 3) {
            html += `
                <div class="list-item" onclick="app.openNotifications()" style="justify-content:center;border-style:dashed;border-color:var(--accent-purple);">
                    <span style="color:var(--accent-purple);font-size:13px;">+ ${naoLidas.length - 3} notificações não lidas</span>
                    <ion-icon name="chevron-forward-outline" style="color:var(--accent-purple);"></ion-icon>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
    
    updateFraseDoDia() {
        const el = document.getElementById('fraseDoDiaText');
        if (!el) return;
        
        if (window.FrasesDoDia && typeof window.FrasesDoDia.getFraseDoDia === 'function') {
            el.textContent = window.FrasesDoDia.getFraseDoDia();
        } else {
            // Fallback com frases padrão
            const frases = [
                '💡 A persistência leva à perfeição. Continue firme nos estudos!',
                '🎯 Cada dia é uma nova oportunidade para aprender.',
                '✨ Você é capaz de alcançar seus objetivos!',
                '📚 O conhecimento é a melhor herança.',
                '🚀 Concentração total = sucesso garantido!'
            ];
            const frase = frases[Math.floor(Math.random() * frases.length)];
            el.textContent = frase;
        }
    }
}

console.log('[Dashboard] ✅ Módulo carregado!');