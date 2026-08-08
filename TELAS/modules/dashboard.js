// ============================================
// modules/dashboard.js - DASHBOARD
// ============================================

class DashboardModule {
    constructor(app) {
        this.app = app;
        this.name = 'dashboard';
        this.days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        console.log('[Dashboard] 📊 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Dashboard] 📊 Renderizando...');
        
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.calendarEvents = data.calendarEvents || [];
        this.weeklySchedule = data.weeklySchedule || {};
        this.timeSlots = data.timeSlots || [];
        this.notifications = data.notifications || [];
        this.disciplinas = data.disciplinas || [];
        this.profile = data.profile || {};
        
        // Garantir dias da semana
        this.days.forEach(day => {
            if (!this.weeklySchedule[day]) this.weeklySchedule[day] = [];
        });
        
        if (this.timeSlots.length === 0) {
            this.timeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30'];
        }
        
        this.renderDashboard();
        this.renderSchedule();
        this.renderSubjects();
        this.renderNotifications();
        this.updateFraseDoDia();
        this.updateBadge();
        this.setupEvents();
    }
    
    renderDashboard() {
        // Cards
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
        this.tasks.forEach(t => {
            if (t.subject || t.disciplina) disciplinas.add((t.subject || t.disciplina).toLowerCase());
        });
        
        const pendentes = this.tasks.filter(t => !t.completed).length;
        const horasEstudo = this.tasks.filter(t => t.completed).length * 1.5;
        
        document.getElementById('statTarefas').textContent = this.tasks.length;
        document.getElementById('statConclusao').textContent = 
            this.tasks.length > 0 ? Math.round((this.tasks.filter(t => t.completed).length / this.tasks.length) * 100) + '%' : '0%';
        document.getElementById('statHoras').textContent = Math.floor(horasEstudo) + 'h';
        
        const progresso = this.tasks.length > 0 ? Math.round((this.tasks.filter(t => t.completed).length / this.tasks.length) * 100) : 0;
        document.getElementById('progressValue').textContent = progresso + '%';
        document.getElementById('progressFill').style.width = progresso + '%';
        
        // Dashboard page stats
        document.getElementById('disciplinasCount').textContent = disciplinas.size || 0;
        document.getElementById('pendentesCount').textContent = pendentes;
        document.getElementById('horasCount').textContent = Math.floor(horasEstudo);
        
        const media = this.tasks.filter(t => t.nota).reduce((acc, t) => acc + t.nota, 0) / (this.tasks.filter(t => t.nota).length || 1);
        document.getElementById('mediaCount').textContent = media.toFixed(1);
        
        // Atividades
        this.renderActivities();
    }
    
    renderActivities() {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        const atividades = [];
        this.tasks.slice(0, 3).forEach(t => {
            atividades.push({
                titulo: t.title || t.nome || 'Tarefa',
                descricao: t.completed ? 'Concluída' : 'Pendente',
                icone: 'fa-tasks',
                cor: t.completed ? 'green' : 'orange'
            });
        });
        
        if (atividades.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">Nenhuma atividade recente</p>';
            return;
        }
        
        container.innerHTML = atividades.map(a => `
            <div class="activity-item">
                <div class="activity-icon ${a.cor}"><i class="fas ${a.icone}"></i></div>
                <div class="activity-text">
                    <h4>${this.app.escapeHtml(a.titulo)}</h4>
                    <p>${a.descricao}</p>
                </div>
            </div>
        `).join('');
    }
    
    renderSchedule() {
        const tbody = document.getElementById('scheduleTableBody');
        if (!tbody) return;
        
        const slots = this.timeSlots;
        if (slots.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">Nenhum horário cadastrado</td></tr>';
            return;
        }
        
        let html = '';
        slots.forEach(time => {
            html += '<tr><td class="time-slot">' + time + '</td>';
            this.days.forEach(day => {
                const aula = (this.weeklySchedule[day] || []).find(a => a.horaInicio === time);
                if (aula && aula.materia) {
                    const cor = aula.color || '#8b5cf6';
                    html += `<td><span class="subject" style="background:${cor}20;color:${cor};border-left:3px solid ${cor};padding:4px 10px;border-radius:4px;">${this.app.escapeHtml(aula.materia)}</span></td>`;
                } else {
                    html += '<td class="empty-cell">-</td>';
                }
            });
            html += '</tr>';
        });
        
        tbody.innerHTML = html;
    }
    
    renderSubjects() {
        const grid = document.getElementById('subjectsGrid');
        if (!grid) return;
        
        const disciplinasMap = new Map();
        this.tasks.forEach(t => {
            const disc = t.subject || t.disciplina;
            if (disc) {
                const key = disc.toLowerCase();
                if (!disciplinasMap.has(key)) {
                    disciplinasMap.set(key, { nome: disc, count: 0 });
                }
                if (!t.completed) {
                    disciplinasMap.get(key).count++;
                }
            }
        });
        
        if (disciplinasMap.size === 0) {
            grid.innerHTML = '<p style="grid-column:span 2;text-align:center;padding:20px;color:#888;">Nenhuma disciplina em uso</p>';
            return;
        }
        
        const cores = ['#8b5cf6', '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#eab308'];
        let i = 0;
        let html = '';
        for (const [key, disc] of disciplinasMap) {
            const cor = cores[i % cores.length];
            html += `
                <div class="subject-card" style="background:${cor}20;border-left:3px solid ${cor};padding:8px 12px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:${cor};font-weight:600;">${this.app.escapeHtml(disc.nome)}</span>
                    <span style="background:var(--bg-color);padding:2px 8px;border-radius:10px;font-size:12px;">${disc.count}</span>
                </div>
            `;
            i++;
        }
        grid.innerHTML = html;
    }
    
    renderNotifications() {
        const container = document.getElementById('notificacoesRecentes');
        if (!container) return;
        
        const recentes = (this.notifications || []).slice(0, 3);
        
        if (recentes.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:20px;color:var(--text-secondary);">
                    <i class="fas fa-bell-slash" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                    Nenhuma notificação recente
                </div>
            `;
            return;
        }
        
        const cores = { info: 'purple', aula: 'blue', tarefa: 'green' };
        const icones = { info: 'fa-bell', aula: 'fa-book', tarefa: 'fa-tasks' };
        
        container.innerHTML = recentes.map(n => `
            <div class="notification-item ${cores[n.type] || 'purple'}" onclick="app.openNotifications()">
                <i class="fas ${icones[n.type] || 'fa-bell'}"></i>
                <span>${this.app.escapeHtml(n.title || 'Notificação')}</span>
                <span style="margin-left:auto;font-size:11px;color:var(--text-secondary);">${this.app.formatTimeAgo(n.time)}</span>
            </div>
        `).join('');
    }
    
    updateFraseDoDia() {
        const el = document.getElementById('fraseDoDiaText');
        if (el && window.FrasesDoDia) {
            el.textContent = window.FrasesDoDia.getFraseDoDia();
        } else if (el) {
            el.textContent = 'A persistência leva à perfeição. Continue firme nos estudos!';
        }
    }
    
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        if (badge) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }
    
    setupEvents() {
        // Editar horário
        document.getElementById('btnEditSchedule')?.addEventListener('click', () => {
            alert('Editar horário (em breve)');
        });
        
        // Gerenciar disciplinas
        document.getElementById('btnGerenciarDisciplinas')?.addEventListener('click', () => {
            alert('Gerenciar disciplinas (em breve)');
        });
        
        // Iniciar estudo
        document.getElementById('startStudy')?.addEventListener('click', () => {
            alert('Sessão de estudo iniciada!');
        });
    }
}

console.log('[Dashboard] ✅ Módulo carregado!');