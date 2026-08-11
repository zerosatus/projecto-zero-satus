// ============================================
// modules/inicio.js - INÍCIO (DASHBOARD RESUMIDO) - CORRIGIDO
// ============================================

class InicioModule {
    constructor(app) {
        this.app = app;
        this.name = 'inicio';
        this.days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        this.currentDate = new Date();
        this.today = new Date();
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.isTimerActive = false;
        this.timeSlots = [];
        this.weeklySchedule = {};
        this.editingSubject = null;
        this.selectedSubjectColor = '#9333ea';
        this.disciplinaEditando = null;
        
        console.log('[Inicio] 🏠 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Inicio] 🏠 Renderizando...');
        
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.calendarEvents = data.calendarEvents || [];
        this.weeklySchedule = data.weeklySchedule || {};
        this.timeSlots = data.timeSlots || [];
        this.notifications = data.notifications || [];
        this.disciplinas = data.disciplinas || [];
        this.profile = data.profile || {};
        
        this.days.forEach(day => {
            if (!this.weeklySchedule[day]) this.weeklySchedule[day] = [];
        });
        
        if (this.timeSlots.length === 0) {
            this.timeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30'];
        }
        
        // EXPOR FUNÇÕES GLOBALMENTE
        this.exporFuncoesGlobais();
        
        if (window.DisciplinaManager) {
            window.DisciplinaManager.init(this.profile.email || this.app.user?.email);
        }
        
        this.renderProfile();
        this.renderStats();
        this.renderProgress();
        this.renderCalendar();
        this.renderNextClass();
        this.renderNextTask();
        this.renderNotifications();
        this.renderSchedule();
        this.renderStudyHours();
        this.renderSubjects();
        this.renderPhrase();
        this.setupEvents();
        this.updateBadge();
        this.loadTimerState();
        this.carregarDadosDoCache();
    }
    
    // ============================================
    // EXPOR FUNÇÕES GLOBAIS
    // ============================================
    exporFuncoesGlobais() {
        const self = this;
        
        // Funções do horário
        window.fecharModalHorario = function() { self.fecharModalHorario(); };
        window.abrirModalHorario = function() { self.abrirModalHorario(); };
        window.renderizarGradeEdicao = function() { self.renderizarGradeEdicao(); };
        window.adicionarHorario = function() { self.adicionarHorario(); };
        window.removerHorario = function(time) { self.removerHorario(time); };
        window.removerAula = function(day, time) { self.removerAula(day, time); };
        
        // Funções da matéria
        window.fecharModalMateria = function() { self.fecharModalMateria(); };
        window.abrirModalMateria = function(day, time) { self.abrirModalMateria(day, time); };
        window.editarMateria = function(day, time) { self.editarMateria(day, time); };
        window.salvarMateria = function(e) { self.salvarMateria(e); };
        window.selecionarCor = function(el) { self.selecionarCor(el); };
        
        // Funções das disciplinas
        window.fecharModalDisciplinas = function() { self.fecharModalDisciplinas(); };
        window.abrirModalDisciplinas = function() { self.abrirModalDisciplinas(); };
        window.limparFormDisciplina = function() { self.limparFormDisciplina(); };
        window.salvarDisciplina = function() { self.salvarDisciplina(); };
        window.editarDisciplina = function(id) { self.editarDisciplina(id); };
        window.confirmarExcluirDisciplina = function(id) { self.confirmarExcluirDisciplina(id); };
        window.renderizarListaDisciplinas = function() { self.renderizarListaDisciplinas(); };
        
        console.log('[Inicio] 🌐 Funções globais expostas');
    }
    
    // ============================================
    // DISCIPLINA MANAGER
    // ============================================
    getDisciplinaManager() {
        if (!window.DisciplinaManager) {
            window.DisciplinaManager = {
                disciplinas: [],
                storageKey: null,
                init(email) {
                    this.storageKey = `disciplinas_${email}`;
                    this.carregar();
                },
                carregar() {
                    const cached = localStorage.getItem(this.storageKey);
                    if (cached) {
                        try { this.disciplinas = JSON.parse(cached); } catch(e) { this.disciplinas = []; }
                    }
                },
                salvar() {
                    localStorage.setItem(this.storageKey, JSON.stringify(this.disciplinas));
                    if (window.CacheManager) {
                        window.CacheManager.set('disciplinas', this.disciplinas, true);
                    }
                },
                getAll() { return [...this.disciplinas]; },
                getById(id) { return this.disciplinas.find(d => d.id === id); },
                add(nome, cor, icone = 'fa-book') {
                    const id = this.normalizar(nome);
                    if (this.disciplinas.find(d => d.id === id)) {
                        return { success: false, message: 'Disciplina já existe!' };
                    }
                    const nova = { id, nome, cor, icone };
                    this.disciplinas.push(nova);
                    this.salvar();
                    return { success: true, disciplina: nova };
                },
                update(id, nome, cor, icone) {
                    const index = this.disciplinas.findIndex(d => d.id === id);
                    if (index === -1) return { success: false, message: 'Disciplina não encontrada!' };
                    this.disciplinas[index] = { ...this.disciplinas[index], nome, cor, icone };
                    this.salvar();
                    return { success: true };
                },
                delete(id) {
                    const index = this.disciplinas.findIndex(d => d.id === id);
                    if (index === -1) return { success: false, message: 'Disciplina não encontrada!' };
                    this.disciplinas.splice(index, 1);
                    this.salvar();
                    return { success: true };
                },
                estaEmUso(id) {
                    const tasks = this.app?.data?.tasks || [];
                    const schedule = this.app?.data?.weeklySchedule || {};
                    return tasks.some(t => (t.disciplina || t.subject) === id) ||
                           Object.values(schedule).some(day =>
                               day.some(c => c.materia && this.normalizar(c.materia) === id)
                           );
                },
                normalizar(texto) {
                    return texto.toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '_');
                }
            };
            const profile = this.profile || this.app.user || {};
            window.DisciplinaManager.init(profile.email);
        }
        return window.DisciplinaManager;
    }
    
    // ============================================
    // CARREGAR DADOS DO CACHE
    // ============================================
    carregarDadosDoCache() {
        if (window.CacheManager) {
            const schedule = window.CacheManager.get('weeklySchedule', {});
            const slots = window.CacheManager.get('timeSlots', []);
            if (schedule && Object.keys(schedule).length > 0) {
                this.weeklySchedule = schedule;
                this.timeSlots = slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
                this.renderSchedule();
                this.renderNextClass();
                this.renderSubjects();
            }
        }
    }
    
    // ============================================
    // PROFILE
    // ============================================
    renderProfile() {
        const profile = this.profile || this.app.user || {};
        const nome = profile.nome || profile.displayName || 'Usuário';
        const email = profile.email || '';
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        const miniName = document.getElementById('miniName');
        const miniEmail = document.getElementById('miniEmail');
        
        if (userNameDisplay) userNameDisplay.textContent = nome;
        if (miniName) miniName.textContent = nome;
        if (miniEmail) miniEmail.textContent = email;
        
        const miniAvatar = document.getElementById('miniAvatar');
        if (miniAvatar) {
            if (profile.profilePhotoUrl && profile.profilePhotoUrl.startsWith('data:')) {
                miniAvatar.src = profile.profilePhotoUrl;
            } else {
                const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
                miniAvatar.src = `https://ui-avatars.com/api/?name=${iniciais || 'U'}&background=9333ea&color=fff&size=70`;
            }
        }
        
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
            userAvatar.textContent = iniciais || 'U';
        }
        
        const userName = document.getElementById('userName');
        if (userName) userName.textContent = nome;
    }
    
    // ============================================
    // STATS
    // ============================================
    renderStats() {
        const total = this.tasks.length;
        const concluidas = this.tasks.filter(t => t.completed).length;
        const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;
        const horasEstudo = concluidas * 1.5 + this.calendarEvents.filter(e => e.type === 'aula').length * 2;
        
        const statTarefas = document.getElementById('statTarefas');
        const statConclusao = document.getElementById('statConclusao');
        const statHoras = document.getElementById('statHoras');
        const totalHours = document.getElementById('totalHours');
        
        if (statTarefas) statTarefas.textContent = total;
        if (statConclusao) statConclusao.textContent = percentual + '%';
        if (statHoras) statHoras.textContent = Math.floor(horasEstudo) + 'h';
        if (totalHours) totalHours.textContent = Math.floor(horasEstudo) + 'h';
    }
    
    // ============================================
    // PROGRESS
    // ============================================
    renderProgress() {
        const total = this.tasks.length;
        const concluidas = this.tasks.filter(t => t.completed).length;
        const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;
        
        const progressValue = document.getElementById('progressValue');
        const progressFill = document.getElementById('progressFill');
        
        if (progressValue) progressValue.textContent = progresso + '%';
        if (progressFill) progressFill.style.width = progresso + '%';
        
        const percentageEl = document.querySelector('.percentage');
        if (percentageEl) percentageEl.textContent = progresso + '%';
        
        const circularFill = document.querySelector('.progress-ring-fill');
        if (circularFill) {
            const radius = circularFill.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (progresso / 100) * circumference;
            circularFill.style.strokeDashoffset = offset;
        }
    }
    
    // ============================================
    // CALENDAR WIDGET
    // ============================================
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarDates = document.getElementById('calendarDates');
        
        if (!calendarDates) return;
        calendarDates.innerHTML = '';
        
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'date-cell empty';
            calendarDates.appendChild(empty);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell';
            dateCell.textContent = day;
            
            if (year === this.today.getFullYear() && month === this.today.getMonth() && day === this.today.getDate()) {
                dateCell.classList.add('today');
            }
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEvent = this.calendarEvents.some(e => e.date === dateStr);
            if (hasEvent) {
                const dot = document.createElement('span');
                dot.className = 'event-dot';
                dateCell.appendChild(dot);
            }
            
            calendarDates.appendChild(dateCell);
        }
    }
    
    // ============================================
    // NEXT CLASS & TASK
    // ============================================
    renderNextClass() {
        const el = document.getElementById('nextClassInfo');
        if (!el) return;
        
        const agora = new Date();
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const hoje = diasSemana[agora.getDay()];
        const horaAtual = agora.getHours() + ':' + String(agora.getMinutes()).padStart(2, '0');
        
        let proximaAula = null;
        
        if (this.weeklySchedule[hoje]) {
            proximaAula = this.weeklySchedule[hoje].find(a => a.horaInicio > horaAtual);
        }
        
        if (!proximaAula) {
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            const hojeIndex = dias.indexOf(hoje);
            for (let i = 1; i <= 5; i++) {
                const nextDay = dias[(hojeIndex + i) % 5];
                if (this.weeklySchedule[nextDay] && this.weeklySchedule[nextDay].length > 0) {
                    proximaAula = this.weeklySchedule[nextDay][0];
                    proximaAula.dia = nextDay;
                    break;
                }
            }
        }
        
        if (proximaAula) {
            const diaTexto = proximaAula.dia ? proximaAula.dia : 'hoje';
            el.textContent = `${proximaAula.materia} - ${diaTexto} às ${proximaAula.horaInicio}`;
        } else {
            el.textContent = 'Nenhuma aula cadastrada';
        }
    }
    
    renderNextTask() {
        const el = document.getElementById('nextTaskInfo');
        if (!el) return;
        
        const pendentes = this.tasks.filter(t => !t.completed);
        if (pendentes.length > 0) {
            const task = pendentes[0];
            el.textContent = `${task.title || task.nome || 'Tarefa'} - Pendente`;
        } else {
            el.textContent = 'Nenhuma tarefa pendente';
        }
    }
    
    // ============================================
    // NOTIFICATIONS
    // ============================================
    renderNotifications() {
        const container = document.getElementById('notificacoesRecentes');
        if (!container) return;
        
        let notificacoes = this.notifications || [];
        
        if (notificacoes.length === 0 && window.CacheManager) {
            const cached = window.CacheManager.get('notifications', null);
            if (cached && cached.length > 0) {
                notificacoes = cached;
            }
        }
        
        notificacoes.sort((a, b) => {
            const dateA = new Date(a.time || a.created_at || 0);
            const dateB = new Date(b.time || b.created_at || 0);
            return dateB - dateA;
        });
        
        const recentes = notificacoes.slice(0, 3);
        
        if (recentes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    <i class="fas fa-bell-slash" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                    Nenhuma notificação recente
                </div>
            `;
            return;
        }
        
        const icones = {
            'info': 'fa-bell',
            'aula': 'fa-book',
            'tarefa': 'fa-tasks',
            'warning': 'fa-exclamation-triangle',
            'success': 'fa-check-circle'
        };
        
        const cores = {
            'info': 'purple',
            'aula': 'blue',
            'tarefa': 'green',
            'warning': 'orange',
            'success': 'purple'
        };
        
        container.innerHTML = recentes.map(notif => `
            <div class="notification-item ${cores[notif.type] || 'purple'}" onclick="app.openNotifications()">
                <i class="fas ${icones[notif.type] || 'fa-bell'}"></i>
                <span>${this.app.escapeHtml(notif.title || 'Notificação')}</span>
                <span style="margin-left: auto; font-size: 11px; color: var(--text-secondary);">
                    ${this.formatTimeAgo(notif.time || notif.created_at)}
                </span>
            </div>
        `).join('');
    }
    
    // ============================================
    // SCHEDULE
    // ============================================
    renderSchedule() {
        const tbody = document.getElementById('scheduleTableBody');
        if (!tbody) return;
        
        const slots = this.timeSlots;
        
        if (slots.length === 0 || this.days.every(day => !this.weeklySchedule[day] || this.weeklySchedule[day].length === 0)) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhum horário cadastrado</td></tr>';
            return;
        }
        
        let html = '';
        slots.forEach(time => {
            html += '<tr>';
            html += `<td class="time-slot">${time}</td>`;
            this.days.forEach(day => {
                const aula = (this.weeklySchedule[day] || []).find(a => a.horaInicio === time);
                if (aula && aula.materia) {
                    const cor = aula.color || '#8b5cf6';
                    html += `<td>
                        <span class="subject" style="background:${cor}20;color:${cor};border-left:3px solid ${cor};padding:4px 10px;border-radius:4px;">
                            ${this.app.escapeHtml(aula.materia)}
                        </span>
                    </td>`;
                } else {
                    html += '<td class="empty-cell">-</td>';
                }
            });
            html += '</tr>';
        });
        
        tbody.innerHTML = html;
    }
    
    // ============================================
    // STUDY HOURS
    // ============================================
    renderStudyHours() {
        const chartContainer = document.getElementById('studyChart');
        if (!chartContainer) return;
        
        let canvas = document.getElementById('studyCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'studyCanvas';
            canvas.width = 200;
            canvas.height = 80;
            chartContainer.appendChild(canvas);
        }
        
        this.drawChart(canvas);
    }
    
    drawChart(canvas) {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth || 200;
        const height = canvas.offsetHeight || 80;
        canvas.width = width;
        canvas.height = height;
        
        ctx.clearRect(0, 0, width, height);
        
        const dados = [2, 4, 3, 5, 4, 6, 3];
        const maxVal = Math.max(...dados, 5);
        const larguraBarra = (width - 40) / dados.length - 4;
        
        if (!CanvasRenderingContext2D.prototype.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
                if (r > w/2) r = w/2;
                if (r > h/2) r = h/2;
                this.moveTo(x + r, y);
                this.lineTo(x + w - r, y);
                this.quadraticCurveTo(x + w, y, x + w, y + r);
                this.lineTo(x + w, y + h - r);
                this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                this.lineTo(x + r, y + h);
                this.quadraticCurveTo(x, y + h, x, y + h - r);
                this.lineTo(x, y + r);
                this.quadraticCurveTo(x, y, x + r, y);
                return this;
            };
        }
        
        for (let i = 0; i < dados.length; i++) {
            const altura = (dados[i] / maxVal) * (height - 40);
            const x = 20 + i * (larguraBarra + 4);
            const y = height - 20 - altura;
            
            const gradiente = ctx.createLinearGradient(x, y, x, height - 20);
            gradiente.addColorStop(0, '#9333ea');
            gradiente.addColorStop(1, 'rgba(147, 51, 234, 0.3)');
            
            ctx.fillStyle = gradiente;
            ctx.beginPath();
            ctx.roundRect(x, y, larguraBarra, altura, 4);
            ctx.fill();
        }
    }
    
    // ============================================
    // SUBJECTS
    // ============================================
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
        
        Object.values(this.weeklySchedule).forEach(day => {
            if (Array.isArray(day)) {
                day.forEach(c => {
                    if (c && c.materia) {
                        const key = c.materia.toLowerCase();
                        if (!disciplinasMap.has(key)) {
                            disciplinasMap.set(key, { nome: c.materia, count: 0 });
                        }
                    }
                });
            }
        });
        
        if (disciplinasMap.size === 0) {
            grid.innerHTML = '<p style="grid-column: span 2; text-align: center; padding: 20px; color: #888;">Nenhuma disciplina em uso</p>';
            return;
        }
        
        const cores = ['#8b5cf6', '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#eab308', '#ec4899', '#14b8a6'];
        let i = 0;
        let html = '';
        
        for (const [key, disc] of disciplinasMap) {
            const cor = cores[i % cores.length];
            const icone = this.getIconeDisciplina(key);
            html += `
                <div class="subject-card" style="background:${cor}20;border-left:3px solid ${cor};">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <i class="fas ${icone}" style="color:${cor};font-size:16px;"></i>
                        <span style="color:${cor};font-weight:600;">${this.app.escapeHtml(disc.nome)}</span>
                    </div>
                    ${disc.count > 0 ? `<span style="background:var(--bg-color);padding:2px 8px;border-radius:10px;font-size:12px;color:var(--text-secondary);">${disc.count}</span>` : ''}
                </div>
            `;
            i++;
        }
        
        grid.innerHTML = html;
    }
    
    getIconeDisciplina(disciplina) {
        const icones = {
            'matematica': 'fa-square-root-variable',
            'portugues': 'fa-language',
            'historia': 'fa-landmark',
            'fisica': 'fa-atom',
            'quimica': 'fa-flask',
            'biologia': 'fa-dna',
            'geografia': 'fa-globe-americas',
            'ingles': 'fa-language',
            'programacao': 'fa-laptop-code',
            'arte': 'fa-palette',
            'musica': 'fa-music'
        };
        return icones[disciplina] || 'fa-book';
    }
    
    // ============================================
    // PHRASE OF THE DAY
    // ============================================
    renderPhrase() {
        const el = document.getElementById('fraseDoDiaText');
        if (!el) return;
        
        if (window.FrasesDoDia) {
            el.textContent = window.FrasesDoDia.getFraseDoDia();
        } else {
            el.textContent = 'A persistência leva à perfeição. Continue firme nos estudos!';
        }
    }
    
    // ============================================
    // TIMER
    // ============================================
    loadTimerState() {
        if (!this.app.user) return;
        const timerKey = `timer_${this.app.user.email}`;
        const timerSalvo = localStorage.getItem(timerKey);
        if (timerSalvo) {
            try {
                const timerData = JSON.parse(timerSalvo);
                const hoje = new Date().toDateString();
                if (timerData.data === hoje) {
                    this.timerSeconds = timerData.segundos || 0;
                    if (timerData.ativo) {
                        this.startTimer();
                    }
                    this.updateTimerDisplay();
                }
            } catch(e) {}
        }
    }
    
    startTimer() {
        if (this.timerInterval) return;
        this.isTimerActive = true;
        this.timerInterval = setInterval(() => {
            this.timerSeconds++;
            this.updateTimerDisplay();
            this.saveTimerState();
        }, 1000);
    }
    
    pauseTimer() {
        this.isTimerActive = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.saveTimerState();
    }
    
    toggleTimer() {
        if (this.isTimerActive) {
            this.pauseTimer();
            const btn = document.getElementById('startStudy');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-play"></i> Continuar Sessão';
                btn.style.background = '';
            }
        } else {
            this.startTimer();
            const btn = document.getElementById('startStudy');
            if (btn) {
                btn.innerHTML = this.formatTimerDisplay();
                btn.style.background = 'var(--danger)';
            }
        }
    }
    
    updateTimerDisplay() {
        const btn = document.getElementById('startStudy');
        if (btn && this.isTimerActive) {
            btn.innerHTML = this.formatTimerDisplay();
        }
    }
    
    formatTimerDisplay() {
        const h = Math.floor(this.timerSeconds / 3600);
        const m = Math.floor((this.timerSeconds % 3600) / 60);
        const s = this.timerSeconds % 60;
        return `<i class="fas fa-pause"></i> ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    
    saveTimerState() {
        if (!this.app.user) return;
        const timerKey = `timer_${this.app.user.email}`;
        localStorage.setItem(timerKey, JSON.stringify({
            segundos: this.timerSeconds,
            data: new Date().toDateString(),
            ativo: this.isTimerActive
        }));
    }
    
    // ============================================
    // MODAIS DE HORÁRIO
    // ============================================
    abrirModalHorario() {
        this.renderizarGradeEdicao();
        this.atualizarDatalistDisciplinas();
        const modal = document.getElementById('editScheduleModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    fecharModalHorario() {
        const modal = document.getElementById('editScheduleModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    renderizarGradeEdicao() {
        const grid = document.getElementById('editScheduleGrid');
        if (!grid) return;
        
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        let html = '<div class="day-header">Hora</div>';
        days.forEach(day => html += `<div class="day-header">${day}</div>`);
        
        const slots = this.timeSlots.length ? this.timeSlots : [];
        
        if (slots.length === 0) {
            html += `<div class="edit-cell" style="grid-column: span 6; padding: 40px; text-align: center; color: var(--text-secondary);">
                Nenhum horário cadastrado. Adicione um horário abaixo.
            </div>`;
            grid.innerHTML = html;
            return;
        }
        
        slots.forEach(time => {
            html += `<div class="time-slot-with-delete">
                <span class="time-slot-text">${time}</span>
                <button class="btn-delete-time" onclick="removerHorario('${time}')" title="Remover horário">
                    <i class="fas fa-trash"></i>
                </button>
            </div>`;
            
            days.forEach(day => {
                const classItem = this.weeklySchedule[day]?.find(c => c.horaInicio === time);
                if (classItem && classItem.materia) {
                    html += `<div class="edit-cell">
                        <div class="class-block subject-custom" style="background-color: ${classItem.color || '#9333ea'}" onclick="editarMateria('${day}', '${time}')">
                            ${this.app.escapeHtml(classItem.materia)}
                            <button class="btn-delete-class" onclick="event.stopPropagation(); removerAula('${day}', '${time}')" title="Remover aula">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>`;
                } else {
                    html += `<div class="edit-cell">
                        <button class="btn-add" onclick="abrirModalMateria('${day}', '${time}')" title="Adicionar matéria">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>`;
                }
            });
        });
        
        grid.innerHTML = html;
    }
    
    atualizarDatalistDisciplinas() {
        const datalist = document.getElementById('disciplinasList');
        if (!datalist) return;
        
        datalist.innerHTML = '';
        const manager = this.getDisciplinaManager();
        const disciplinas = manager.getAll();
        disciplinas.forEach(d => {
            const option = document.createElement('option');
            option.value = d.nome;
            datalist.appendChild(option);
        });
    }
    
    abrirModalMateria(day, time) {
        this.editingSubject = null;
        this.selectedSubjectColor = '#9333ea';
        
        document.getElementById('subjectModalTitle').textContent = 'Adicionar Matéria';
        document.getElementById('subjectNameInput').value = '';
        document.getElementById('subjectTeacherInput').value = '';
        document.getElementById('subjectStartInput').value = time;
        document.getElementById('subjectEndInput').value = '';
        document.getElementById('subjectDayInput').value = day;
        
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector('.color-option[data-color="#9333ea"]')?.classList.add('active');
        
        const modal = document.getElementById('subjectModal');
        if (modal) modal.classList.add('active');
    }
    
    editarMateria(day, time) {
        const aula = this.weeklySchedule[day]?.find(c => c.horaInicio === time);
        if (!aula) return;
        
        this.editingSubject = { ...aula, day, time };
        this.selectedSubjectColor = aula.color || '#9333ea';
        
        document.getElementById('subjectModalTitle').textContent = 'Editar Matéria';
        document.getElementById('subjectNameInput').value = aula.materia || '';
        document.getElementById('subjectTeacherInput').value = aula.professor || '';
        document.getElementById('subjectStartInput').value = aula.horaInicio || '';
        document.getElementById('subjectEndInput').value = aula.horaFim || '';
        document.getElementById('subjectDayInput').value = day;
        
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === this.selectedSubjectColor);
        });
        
        const modal = document.getElementById('subjectModal');
        if (modal) modal.classList.add('active');
    }
    
    fecharModalMateria() {
        const modal = document.getElementById('subjectModal');
        if (modal) modal.classList.remove('active');
        this.editingSubject = null;
    }
    
    selecionarCor(element) {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
        element.classList.add('active');
        this.selectedSubjectColor = element.dataset.color;
    }
    
    salvarMateria(event) {
        event.preventDefault();
        
        const name = document.getElementById('subjectNameInput').value.trim();
        const startTime = document.getElementById('subjectStartInput').value;
        const endTime = document.getElementById('subjectEndInput').value;
        const day = document.getElementById('subjectDayInput').value;
        
        if (!name) {
            this.showToast('Preencha o nome da matéria!', 'error');
            return;
        }
        if (!startTime || !endTime) {
            this.showToast('Defina início e término!', 'error');
            return;
        }
        
        if (!this.weeklySchedule[day]) this.weeklySchedule[day] = [];
        
        if (this.editingSubject) {
            const oldStart = this.editingSubject.horaInicio;
            this.weeklySchedule[day] = this.weeklySchedule[day].filter(c => !(c.materia === this.editingSubject.materia && c.horaInicio === oldStart));
        }
        
        if (!this.timeSlots.includes(startTime)) {
            this.timeSlots.push(startTime);
            this.timeSlots.sort();
        }
        
        this.weeklySchedule[day].push({
            materia: name,
            professor: document.getElementById('subjectTeacherInput').value.trim() || '',
            color: this.selectedSubjectColor,
            horaInicio: startTime,
            horaFim: endTime
        });
        
        this.weeklySchedule[day].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        
        this.app.data.weeklySchedule = this.weeklySchedule;
        this.app.data.timeSlots = this.timeSlots;
        this.app.saveAllData();
        
        this.fecharModalMateria();
        this.renderizarGradeEdicao();
        this.renderSchedule();
        this.renderSubjects();
        this.renderNextClass();
        this.showToast(this.editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
    }
    
    removerHorario(timeSlot) {
        let hasClasses = false;
        for (const day of this.days) {
            if (this.weeklySchedule[day]?.some(cls => cls.horaInicio === timeSlot)) {
                hasClasses = true;
                break;
            }
        }
        
        if (hasClasses) {
            if (!confirm(`O horário ${timeSlot} possui aulas. Remover mesmo assim?`)) {
                return;
            }
        }
        
        const index = this.timeSlots.indexOf(timeSlot);
        if (index !== -1) this.timeSlots.splice(index, 1);
        
        for (const day of this.days) {
            if (this.weeklySchedule[day]) {
                this.weeklySchedule[day] = this.weeklySchedule[day].filter(cls => cls.horaInicio !== timeSlot);
            }
        }
        
        this.timeSlots.sort();
        
        this.app.data.weeklySchedule = this.weeklySchedule;
        this.app.data.timeSlots = this.timeSlots;
        this.app.saveAllData();
        
        this.renderizarGradeEdicao();
        this.renderSchedule();
        this.showToast(`Horário ${timeSlot} removido!`, 'success');
    }
    
    removerAula(day, timeSlot) {
        if (!confirm(`Remover aula de ${day} às ${timeSlot}?`)) {
            return;
        }
        
        if (this.weeklySchedule[day]) {
            this.weeklySchedule[day] = this.weeklySchedule[day].filter(cls => cls.horaInicio !== timeSlot);
            
            this.app.data.weeklySchedule = this.weeklySchedule;
            this.app.saveAllData();
            
            this.renderizarGradeEdicao();
            this.renderSchedule();
            this.renderSubjects();
            this.showToast('Aula removida!', 'success');
        }
    }
    
    adicionarHorario() {
        const newTime = document.getElementById('newTimeInput').value;
        if (newTime && !this.timeSlots.includes(newTime)) {
            this.timeSlots.push(newTime);
            this.timeSlots.sort();
            this.app.data.timeSlots = this.timeSlots;
            this.app.saveAllData();
            this.renderizarGradeEdicao();
            this.renderSchedule();
            this.showToast('Horário adicionado!', 'success');
        } else if (this.timeSlots.includes(newTime)) {
            this.showToast('Este horário já existe!', 'error');
        } else {
            this.showToast('Selecione um horário!', 'error');
        }
    }
    
    // ============================================
    // MODAL DE DISCIPLINAS
    // ============================================
    abrirModalDisciplinas() {
        this.disciplinaEditando = null;
        this.renderizarListaDisciplinas();
        this.limparFormDisciplina();
        const modal = document.getElementById('modalDisciplinas');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    fecharModalDisciplinas() {
        const modal = document.getElementById('modalDisciplinas');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.disciplinaEditando = null;
    }
    
    renderizarListaDisciplinas() {
        const container = document.getElementById('listaDisciplinas');
        if (!container) return;
        
        const manager = this.getDisciplinaManager();
        const disciplinas = manager.getAll();
        
        if (disciplinas.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Nenhuma disciplina cadastrada.</p>';
            return;
        }
        
        let html = '';
        disciplinas.forEach(d => {
            const emUso = manager.estaEmUso(d.id);
            html += `
                <div class="disciplina-card" data-id="${d.id}">
                    <div class="disciplina-info">
                        <div class="disciplina-color" style="background-color: ${d.cor};">
                            <i class="fas ${d.icone || 'fa-book'}"></i>
                        </div>
                        <div class="disciplina-text">
                            <strong>${this.app.escapeHtml(d.nome)}</strong>
                            <span class="disciplina-id">${d.id}</span>
                            ${emUso ? '<span class="badge-uso">Em uso</span>' : ''}
                        </div>
                    </div>
                    <div class="disciplina-actions">
                        <button class="btn-edit-disc" onclick="editarDisciplina('${d.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete-disc" onclick="confirmarExcluirDisciplina('${d.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    editarDisciplina(id) {
        const manager = this.getDisciplinaManager();
        const disc = manager.getById(id);
        if (!disc) return;
        
        this.disciplinaEditando = disc;
        document.getElementById('modalDiscTitle').textContent = 'Editar Disciplina';
        document.getElementById('discNome').value = disc.nome;
        document.getElementById('discCor').value = disc.cor;
        document.getElementById('colorHexDisplay').textContent = disc.cor;
        document.getElementById('discIcone').value = disc.icone || 'fa-book';
        document.getElementById('btnSalvarDisc').textContent = 'Salvar Alterações';
        
        window.scrollTo({ top: document.getElementById('formDisciplina').offsetTop, behavior: 'smooth' });
    }
    
    confirmarExcluirDisciplina(id) {
        const manager = this.getDisciplinaManager();
        const disc = manager.getById(id);
        if (!disc) return;
        
        const emUso = manager.estaEmUso(id);
        let msg = `Deseja excluir a disciplina "${disc.nome}"?`;
        if (emUso) {
            msg += '\n\n⚠️ ATENÇÃO: Esta disciplina está sendo usada em tarefas ou horários.';
        }
        
        if (confirm(msg)) {
            const resultado = manager.delete(id);
            if (resultado.success) {
                this.renderizarListaDisciplinas();
                this.renderSubjects();
                this.showToast('Disciplina excluída!', 'success');
            } else {
                this.showToast(resultado.message, 'error');
            }
        }
    }
    
    limparFormDisciplina() {
        document.getElementById('modalDiscTitle').textContent = 'Nova Disciplina';
        document.getElementById('discNome').value = '';
        document.getElementById('discCor').value = '#9333ea';
        document.getElementById('colorHexDisplay').textContent = '#9333ea';
        document.getElementById('discIcone').value = 'fa-book';
        document.getElementById('btnSalvarDisc').textContent = 'Criar Disciplina';
        this.disciplinaEditando = null;
    }
    
    salvarDisciplina() {
        const nome = document.getElementById('discNome').value.trim();
        const cor = document.getElementById('discCor').value;
        const icone = document.getElementById('discIcone').value;
        
        if (!nome) {
            this.showToast('Preencha o nome da disciplina!', 'error');
            return;
        }
        
        const manager = this.getDisciplinaManager();
        let resultado;
        if (this.disciplinaEditando) {
            resultado = manager.update(this.disciplinaEditando.id, nome, cor, icone);
        } else {
            resultado = manager.add(nome, cor, icone);
        }
        
        if (resultado.success) {
            this.limparFormDisciplina();
            this.renderizarListaDisciplinas();
            this.renderSubjects();
            this.showToast(this.disciplinaEditando ? 'Disciplina atualizada!' : 'Disciplina criada!', 'success');
        } else {
            this.showToast(resultado.message, 'error');
        }
    }
    
    // ============================================
    // HELPERS
    // ============================================
    formatTimeAgo(timeString) {
        if (!timeString) return '';
        try {
            const now = new Date();
            const notifTime = new Date(timeString);
            if (isNaN(notifTime.getTime())) return '';
            const diffMins = Math.floor((now - notifTime) / 60000);
            
            if (diffMins < 1) return 'Agora';
            if (diffMins < 60) return `Há ${diffMins} min`;
            if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
            return notifTime.toLocaleDateString('pt-BR');
        } catch(e) {
            return '';
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
    
    showToast(mensagem, tipo = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
            toastMessage.textContent = mensagem;
            toast.className = 'toast show';
            toast.style.background = tipo === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                   tipo === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                   tipo === 'info' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
                                   'linear-gradient(135deg, #10b981, #059669)';
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
    
    // ============================================
    // EVENTS
    // ============================================
    setupEvents() {
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        
        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
        
        document.getElementById('btnEditSchedule')?.addEventListener('click', () => {
            this.abrirModalHorario();
        });
        
        document.getElementById('btnGerenciarDisciplinas')?.addEventListener('click', () => {
            this.abrirModalDisciplinas();
        });
        
        document.getElementById('startStudy')?.addEventListener('click', () => {
            this.toggleTimer();
        });
        
        document.getElementById('bellBtn')?.addEventListener('click', () => {
            this.app.openNotifications();
        });
        
        document.getElementById('editScheduleModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.fecharModalHorario();
        });
        
        document.getElementById('subjectModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.fecharModalMateria();
        });
        
        document.getElementById('modalDisciplinas')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.fecharModalDisciplinas();
        });
        
        document.getElementById('formDisciplina')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarDisciplina();
        });
        
        document.getElementById('discCor')?.addEventListener('input', function() {
            document.getElementById('colorHexDisplay').textContent = this.value;
        });
        
        window.addEventListener('cloudDataLoaded', () => {
            this.tasks = this.app.data.tasks || [];
            this.notes = this.app.data.notes || [];
            this.calendarEvents = this.app.data.calendarEvents || [];
            this.weeklySchedule = this.app.data.weeklySchedule || {};
            this.timeSlots = this.app.data.timeSlots || [];
            this.notifications = this.app.data.notifications || [];
            this.disciplinas = this.app.data.disciplinas || [];
            this.profile = this.app.data.profile || {};
            
            this.renderStats();
            this.renderProgress();
            this.renderCalendar();
            this.renderNextClass();
            this.renderNextTask();
            this.renderNotifications();
            this.renderSchedule();
            this.renderStudyHours();
            this.renderSubjects();
            this.renderPhrase();
            this.updateBadge();
        });
        
        window.addEventListener('profilePhotoUpdated', (event) => {
            if (event.detail && event.detail.photoUrl) {
                const miniAvatar = document.getElementById('miniAvatar');
                if (miniAvatar) miniAvatar.src = event.detail.photoUrl;
            }
        });
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const canvas = document.getElementById('studyCanvas');
                if (canvas) this.drawChart(canvas);
            }, 300);
        });
    }
}

console.log('[Inicio] ✅ Módulo carregado!');