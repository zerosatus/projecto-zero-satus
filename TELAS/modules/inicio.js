// ============================================
// modules/inicio.js - INÍCIO (CORRIGIDO)
// ⭐ Chips de disciplinas no modal Matéria
// ⭐ Listener disciplinasUpdated atualiza chips
// ⭐ Integração com dados reais de studySessions
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
        this._renderingSubjects = false;
        this.studySessions = []; // ⭐ ADICIONAR
        
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
        this.studySessions = data.studySessions || window.CacheManager.get('studySessions', []); // ⭐ ADICIONADO CONFORME SOLICITADO
        
        this.days.forEach(day => {
            if (!this.weeklySchedule[day]) this.weeklySchedule[day] = [];
        });
        
        if (this.timeSlots.length === 0) {
            this.timeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30'];
        }
        
        this.exporFuncoesGlobais();
        
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
        // ⭐ Chamada this.carregarDadosDoCache() removida daqui para evitar overwrite dos dados do app.js
    }
    
    exporFuncoesGlobais() {
        const self = this;
        
        window.fecharModalHorario = function() { self.fecharModalHorario(); };
        window.abrirModalHorario = function() { self.abrirModalHorario(); };
        window.renderizarGradeEdicao = function() { self.renderizarGradeEdicao(); };
        window.adicionarHorario = function() { self.adicionarHorario(); };
        window.removerHorario = function(time) { self.removerHorario(time); };
        window.removerAula = function(day, time) { self.removerAula(day, time); };
        
        window.fecharModalMateria = function() { self.fecharModalMateria(); };
        window.abrirModalMateria = function(day, time) { self.abrirModalMateria(day, time); };
        window.editarMateria = function(day, time) { self.editarMateria(day, time); };
        window.salvarMateria = function(e) { self.salvarMateria(e); };
        window.selecionarCor = function(el) { self.selecionarCor(el); };
        
        window.abrirModalDisciplinas = function() {
            console.log('[Inicio] 🌐 Delegando para DisciplinasModule...');
            if (window.app?.modules?.disciplinas) {
                window.app.modules.disciplinas.abrirModal();
            } else {
                console.warn('[Inicio] ⚠️ DisciplinasModule não disponível!');
            }
        };
        window.fecharModalDisciplinas = function() {
            if (window.app?.modules?.disciplinas) {
                window.app.modules.disciplinas.fecharModal();
            }
        };
    }
    
    getDisciplinas() {
        if (this.app?.modules?.disciplinas?.getTodas) {
            return this.app.modules.disciplinas.getTodas();
        }
        return this.disciplinas || [];
    }
    
    carregarDadosDoCache() {
        if (!window.CacheManager) return;
        
        const schedule = window.CacheManager.get('weeklySchedule', {});
        const slots = window.CacheManager.get('timeSlots', []);
        const sessions = window.CacheManager.get('studySessions', []);
        
        if (Object.keys(this.weeklySchedule).length === 0 && schedule && Object.keys(schedule).length > 0) {
            this.weeklySchedule = schedule;
            this.timeSlots = slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
            this.renderSchedule();
            this.renderNextClass();
            this.renderSubjects();
        }
        
        if (this.studySessions.length === 0 && sessions && sessions.length > 0) {
            this.studySessions = sessions;
            this.renderStats();
            this.renderProgress();
            this.renderStudyHours();
        }
    }
    
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
    
    renderStats() {
        const total = this.tasks.length;
        const concluidas = this.tasks.filter(t => t.completed).length;
        const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;
        
        // ⭐ Horas do MÊS atual baseadas em studySessions reais
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        let segundosMes = 0;
        
        for (const s of (this.studySessions || [])) {
            const inicio = new Date(s.inicio);
            if (inicio >= inicioMes) {
                segundosMes += (s.duracaoSegundos || s.duracao_segundos || 0);
            }
        }
        const horasEstudo = segundosMes / 3600;
        
        const statTarefas = document.getElementById('statTarefas');
        const statConclusao = document.getElementById('statConclusao');
        const statHoras = document.getElementById('statHoras');
        const totalHours = document.getElementById('totalHours');
        
        if (statTarefas) statTarefas.textContent = total;
        if (statConclusao) statConclusao.textContent = percentual + '%';
        if (statHoras) statHoras.textContent = horasEstudo.toFixed(1) + 'h';
        if (totalHours) totalHours.textContent = horasEstudo.toFixed(1) + 'h';
    }
    
    renderProgress() {
        // ⭐ Progresso semanal baseado em sessões de estudo vs meta semanal
        const studySessions = this.studySessions || [];
        const agora = new Date();
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay()); // Domingo
        inicioSemana.setHours(0, 0, 0, 0);
        
        let segundosSemana = 0;
        for (const s of studySessions) {
            const inicio = new Date(s.inicio);
            if (inicio >= inicioSemana) {
                segundosSemana += (s.duracaoSegundos || s.duracao_segundos || 0);
            }
        }
        
        const metaSemanalSegundos = 7 * 4 * 3600; // 4h/dia × 7 = 28h
        const progresso = Math.min(100, Math.round((segundosSemana / metaSemanalSegundos) * 100));
        
        const progressValue = document.getElementById('progressValue');
        const progressFill = document.getElementById('progressFill');
        
        if (progressValue) progressValue.textContent = progresso + '%';
        if (progressFill) progressFill.style.width = progresso + '%';
    }
    
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
    
    renderNotifications() {
        const container = document.getElementById('notificacoesRecentes');
        if (!container) return;
        
        let notificacoes = this.notifications || [];
        if (notificacoes.length === 0 && window.CacheManager) {
            const cached = window.CacheManager.get('notifications', null);
            if (cached && cached.length > 0) notificacoes = cached;
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
        
        const icones = { 'info': 'fa-bell', 'aula': 'fa-book', 'tarefa': 'fa-tasks', 'warning': 'fa-exclamation-triangle', 'success': 'fa-check-circle' };
        const cores = { 'info': 'purple', 'aula': 'blue', 'tarefa': 'green', 'warning': 'orange', 'success': 'purple' };
        
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
        
        // ⭐ Calcular horas dos últimos 7 dias (REAL)
        const agora = new Date();
        const dadosReais = [];
        for (let i = 6; i >= 0; i--) {
            const dia = new Date(agora);
            dia.setDate(agora.getDate() - i);
            dia.setHours(0, 0, 0, 0);
            
            const diaFim = new Date(dia);
            diaFim.setDate(dia.getDate() + 1);
            
            let segundos = 0;
            for (const s of (this.studySessions || [])) {
                const inicio = new Date(s.inicio);
                if (inicio >= dia && inicio < diaFim) {
                    segundos += (s.duracaoSegundos || s.duracao_segundos || 0);
                }
            }
            dadosReais.push(segundos / 3600); // em horas
        }
        
        this.drawChart(canvas, dadosReais);
    }
    
    drawChart(canvas, dados = [2, 4, 3, 5, 4, 6, 3]) {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth || 200;
        const height = canvas.offsetHeight || 80;
        canvas.width = width;
        canvas.height = height;
        
        ctx.clearRect(0, 0, width, height);
        
        const maxVal = Math.max(...dados, 1); // ⭐ Evitar divisão por 0
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
            ctx.roundRect(x, y, Math.max(larguraBarra, 1), Math.max(altura, 1), 4);
            ctx.fill();
        }
    }
    
    renderSubjects() {
        if (this._renderingSubjects) return;
        this._renderingSubjects = true;
        
        try {
            const grid = document.getElementById('subjectsGrid');
            if (!grid) return;
            
            const disciplinasMap = new Map();
            const todasDisciplinas = this.getDisciplinas();
            
            const obterNomeReal = (valor) => {
                if (!valor) return null;
                const disc = todasDisciplinas.find(d => 
                    d.id === valor || 
                    d.nome.toLowerCase() === valor.toLowerCase()
                );
                return disc ? disc.nome : valor;
            };

            const registarDisciplina = (nomeReal, corForcada = null, iconeForcado = null, isTask = false) => {
                if (!nomeReal) return;
                const key = nomeReal.toLowerCase();
                
                if (!disciplinasMap.has(key)) {
                    const discOficial = todasDisciplinas.find(d => d.nome.toLowerCase() === key);
                    
                    disciplinasMap.set(key, {
                        nome: discOficial ? discOficial.nome : nomeReal,
                        count: 0,
                        cor: discOficial ? discOficial.cor : (corForcada || this.app.modules?.disciplinas?.getCor(nomeReal) || '#8b5cf6'),
                        icone: discOficial ? discOficial.icone : (iconeForcado || this.app.modules?.disciplinas?.getIcone(nomeReal) || 'fa-book')
                    });
                }
                
                if (isTask && !disciplinasMap.get(key).countTaskAdded) {
                    disciplinasMap.get(key).count++;
                    disciplinasMap.get(key).countTaskAdded = true;
                }
            };
            
            todasDisciplinas.forEach(d => {
                registarDisciplina(d.nome);
            });
            
            this.tasks.forEach(t => {
                const discValue = t.subject || t.disciplina;
                if (discValue) {
                    const nomeReal = obterNomeReal(discValue);
                    if (nomeReal) {
                        registarDisciplina(nomeReal, null, null, !t.completed);
                    }
                }
            });
            
            Object.values(this.weeklySchedule).forEach(day => {
                if (Array.isArray(day)) {
                    day.forEach(c => {
                        if (c && c.materia) {
                            const nomeReal = obterNomeReal(c.materia);
                            registarDisciplina(nomeReal, c.color);
                        }
                    });
                }
            });
            
            if (disciplinasMap.size === 0) {
                grid.innerHTML = '<p style="grid-column: span 2; text-align: center; padding: 20px; color: #888;">Nenhuma disciplina em uso</p>';
                return;
            }
            
            let html = '';
            for (const [key, disc] of disciplinasMap) {
                const cor = disc.cor || '#8b5cf6';
                const icone = disc.icone || 'fa-book';
                
                html += `
                    <div class="subject-card" style="background:${cor}20;border-left:3px solid ${cor};">
                        <div style="display:flex;align-items:center;gap:10px;overflow:hidden;">
                            <i class="fas ${icone}" style="color:${cor};font-size:16px;flex-shrink:0;"></i>
                            <span style="color:${cor};font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${this.app.escapeHtml(disc.nome)}">
                                ${this.app.escapeHtml(disc.nome)}
                            </span>
                        </div>
                        ${disc.count > 0 ? `<span style="background:var(--bg-color);padding:2px 8px;border-radius:10px;font-size:12px;color:var(--text-secondary);flex-shrink:0;">${disc.count}</span>` : ''}
                    </div>
                `;
            }
            
            grid.innerHTML = html;
            
        } finally {
            setTimeout(() => { this._renderingSubjects = false; }, 100);
        }
    }
    
    renderPhrase() {
        const el = document.getElementById('fraseDoDiaText');
        if (!el) return;
        
        if (window.FrasesDoDia) {
            el.textContent = window.FrasesDoDia.getFraseDoDia();
        } else {
            el.textContent = 'A persistência leva à perfeição. Continue firme nos estudos!';
        }
    }
    
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
                    if (timerData.ativo) this.startTimer();
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
        if (btn && this.isTimerActive) btn.innerHTML = this.formatTimerDisplay();
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
    
    abrirModalHorario() {
        this.renderizarGradeEdicao();
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
    
    abrirModalMateria(day, time) {
        this.editingSubject = null;
        this.selectedSubjectColor = '#9333ea';
        
        document.getElementById('subjectModalTitle').textContent = 'Adicionar Matéria';
        document.getElementById('subjectNameInput').value = '';
        document.getElementById('subjectTeacherInput').value = '';
        document.getElementById('subjectStartInput').value = time;
        document.getElementById('subjectEndInput').value = '';
        document.getElementById('subjectDayInput').value = day;
        
        document.querySelectorAll('#subjectModal .color-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector('#subjectModal .color-option[data-color="#9333ea"]')?.classList.add('active');
        
        this.renderizarChipsDisciplinas();
        
        const modal = document.getElementById('subjectModal');
        if (modal) modal.classList.add('active');
    }
    
    renderizarChipsDisciplinas() {
        const container = document.getElementById('subjectDisciplinasChips');
        if (!container) {
            console.warn('[Inicio] ⚠️ #subjectDisciplinasChips não encontrado');
            return;
        }
        
        const disciplinas = this.getDisciplinas();
        const nomeAtual = document.getElementById('subjectNameInput')?.value?.trim() || '';
        
        if (disciplinas.length === 0) {
            container.innerHTML = `
                <div class="chips-empty">
                    Nenhuma disciplina cadastrada. 
                    <a href="#" onclick="event.preventDefault(); app.modules.inicio.abrirModalDisciplinasGlobal();" 
                       style="color: var(--primary-color); text-decoration: underline; font-weight: 600;">
                        Criar disciplina
                    </a>
                </div>
            `;
            return;
        }
        
        let html = '';
        disciplinas.forEach(d => {
            const isActive = nomeAtual && d.nome.toLowerCase() === nomeAtual.toLowerCase();
            const cor = d.cor || '#8b5cf6';
            const icone = d.icone || 'fa-book';
            
            html += `
                <div class="disciplina-chip ${isActive ? 'active' : ''}" 
                     data-nome="${this.app.escapeHtml(d.nome)}"
                     data-cor="${cor}"
                     style="${isActive ? `border-color: ${cor}; background:${cor}20;` : ''}">
                    <i class="fas ${icone}" style="color: ${cor};"></i>
                    <span>${this.app.escapeHtml(d.nome)}</span>
                </div>
            `;
        });
        
        html += `
            <div class="disciplina-chip chip-nova" 
                 onclick="event.stopPropagation(); app.modules.inicio.abrirModalDisciplinasGlobal();"
                 title="Criar nova disciplina">
                <i class="fas fa-plus"></i>
                <span>Nova disciplina</span>
            </div>
        `;
        
        container.innerHTML = html;
        
        container.querySelectorAll('.disciplina-chip:not(.chip-nova)').forEach(chip => {
            chip.addEventListener('click', () => {
                const nomeInput = document.getElementById('subjectNameInput');
                if (!nomeInput) return;
                
                const nome = chip.dataset.nome;
                const cor = chip.dataset.cor;
                
                nomeInput.value = nome;
                this.selecionarCorPorHex(cor);
                
                container.querySelectorAll('.disciplina-chip').forEach(c => {
                    c.classList.remove('active');
                    c.style.borderColor = '';
                    c.style.background = '';
                });
                chip.classList.add('active');
                chip.style.borderColor = cor;
                chip.style.background = `${cor}20`;
                
                nomeInput.focus();
            });
        });
    }
    
    selecionarCorPorHex(hex) {
        const corOptions = document.querySelectorAll('#subjectModal .color-option');
        let encontrou = false;
        
        corOptions.forEach(opt => {
            opt.classList.remove('active');
            if (opt.dataset.color && opt.dataset.color.toLowerCase() === hex.toLowerCase()) {
                opt.classList.add('active');
                this.selectedSubjectColor = hex;
                encontrou = true;
            }
        });
        
        if (!encontrou) {
            this.selectedSubjectColor = hex;
        }
    }
    
    abrirModalDisciplinasGlobal() {
        console.log('[Inicio] 🌐 Abrindo modal global de disciplinas...');
        
        const subjectModal = document.getElementById('subjectModal');
        const subjectEstavaAberto = subjectModal?.classList.contains('active');
        if (subjectEstavaAberto) {
            subjectModal.classList.remove('active');
        }
        
        if (this.app?.modules?.disciplinas) {
            this.app.modules.disciplinas.abrirModal();
            
            const checkInterval = setInterval(() => {
                const modalDisc = document.getElementById('modalDisciplinas');
                if (!modalDisc?.classList.contains('active')) {
                    clearInterval(checkInterval);
                    if (subjectEstavaAberto) {
                        setTimeout(() => {
                            subjectModal?.classList.add('active');
                            this.renderizarChipsDisciplinas();
                        }, 200);
                    }
                }
            }, 300);
        } else {
            console.error('[Inicio] ❌ DisciplinasModule não disponível!');
            this.showToast('Módulo de disciplinas não disponível', 'error');
        }
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
        
        document.querySelectorAll('#subjectModal .color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === this.selectedSubjectColor);
        });
        
        this.renderizarChipsDisciplinas();
        
        const modal = document.getElementById('subjectModal');
        if (modal) modal.classList.add('active');
    }
    
    fecharModalMateria() {
        const modal = document.getElementById('subjectModal');
        if (modal) modal.classList.remove('active');
        this.editingSubject = null;
    }
    
    selecionarCor(element) {
        document.querySelectorAll('#subjectModal .color-option').forEach(opt => opt.classList.remove('active'));
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
            if (!confirm(`O horário ${timeSlot} possui aulas. Remover mesmo assim?`)) return;
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
        if (!confirm(`Remover aula de ${day} às ${timeSlot}?`)) return;
        
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
        
        const btnGerenciar = document.getElementById('btnGerenciarDisciplinas');
        if (btnGerenciar) {
            const novoBtn = btnGerenciar.cloneNode(true);
            btnGerenciar.parentNode.replaceChild(novoBtn, btnGerenciar);
            
            novoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Inicio] 🎯 Botão "Gerenciar Disciplinas" clicado!');
                
                if (this.app?.modules?.disciplinas) {
                    this.app.modules.disciplinas.abrirModal();
                } else {
                    console.error('[Inicio] ❌ DisciplinasModule não disponível!');
                    this.showToast('Módulo de disciplinas não disponível', 'error');
                }
            });
        }
        
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
        
        const subjectNameInput = document.getElementById('subjectNameInput');
        if (subjectNameInput && !subjectNameInput._inicioListener) {
            subjectNameInput._inicioListener = true;
            subjectNameInput.addEventListener('input', () => {
                const nome = subjectNameInput.value.trim().toLowerCase();
                const chips = document.querySelectorAll('#subjectDisciplinasChips .disciplina-chip:not(.chip-nova)');
                
                chips.forEach(chip => {
                    const chipNome = chip.dataset.nome?.toLowerCase() || '';
                    const cor = chip.dataset.cor || '#8b5cf6';
                    
                    if (nome && chipNome === nome) {
                        chip.classList.add('active');
                        chip.style.borderColor = cor;
                        chip.style.background = `${cor}20`;
                    } else {
                        chip.classList.remove('active');
                        chip.style.borderColor = '';
                        chip.style.background = '';
                    }
                });
            });
        }
        
        if (!window._inicioDisciplinasListener) {
            window._inicioDisciplinasListener = true;
            let _debounceTimer = null;
            window.addEventListener('disciplinasUpdated', () => {
                if (_debounceTimer) clearTimeout(_debounceTimer);
                _debounceTimer = setTimeout(() => {
                    const viewAtiva = document.getElementById('view-inicio')?.classList.contains('active');
                    if (!viewAtiva) return;
                    
                    console.log('[Inicio] 📚 Disciplinas atualizadas (debounced)');
                    if (window.app?.modules?.inicio) {
                        window.app.modules.inicio.renderSubjects();
                    }
                    
                    const subjectModalAberto = document.getElementById('subjectModal')?.classList.contains('active');
                    if (subjectModalAberto && window.app?.modules?.inicio) {
                        window.app.modules.inicio.renderizarChipsDisciplinas();
                    }
                }, 300);
            });
        }
        
        // ⭐ CLOUD DATA LOADED - COM SUPORTE A studySessions
        if (!window._inicioCloudListener) {
            window._inicioCloudListener = true;
            let _cloudDebounce = null;
            window.addEventListener('cloudDataLoaded', () => {
                if (_cloudDebounce) clearTimeout(_cloudDebounce);
                _cloudDebounce = setTimeout(() => {
                    console.log('[Inicio] ☁️ Cloud data loaded (debounced)');
                    if (!window.app?.modules?.inicio) return;
                    
                    const viewAtiva = document.getElementById('view-inicio')?.classList.contains('active');
                    if (!viewAtiva) return;
                    
                    const inicio = window.app.modules.inicio;
                    inicio.tasks = window.app.data.tasks || [];
                    inicio.notes = window.app.data.notes || [];
                    inicio.calendarEvents = window.app.data.calendarEvents || [];
                    inicio.weeklySchedule = window.app.data.weeklySchedule || {};
                    inicio.timeSlots = window.app.data.timeSlots || [];
                    inicio.notifications = window.app.data.notifications || [];
                    inicio.disciplinas = window.app.data.disciplinas || [];
                    inicio.profile = window.app.data.profile || {};
                    inicio.studySessions = window.app.data.studySessions || []; // ⭐ ADICIONAR
                    
                    inicio.renderStats();
                    inicio.renderProgress();
                    inicio.renderCalendar();
                    inicio.renderNextClass();
                    inicio.renderNextTask();
                    inicio.renderNotifications();
                    inicio.renderSchedule();
                    inicio.renderStudyHours();
                    inicio.renderSubjects();
                    inicio.renderPhrase();
                    inicio.updateBadge();
                }, 500);
            });
        }
        
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
                if (canvas) this.renderStudyHours();
            }, 300);
        });
    }
}

console.log('[Inicio] ✅ Módulo carregado!');