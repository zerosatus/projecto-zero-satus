<<<<<<< HEAD
// ============================================
// modules/dashboard.js - DASHBOARD MODERNO
// ============================================
class DashboardModule {
    constructor(app) {
        this.app = app;
        this.name = 'dashboard';
        this.editingSubject = null;
        this.selectedSubjectColor = '#6366f1';
        this.days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        this.isSaving = false;
        this._fraseAtual = '';
        this._listenersAtivos = false;
        console.log('[Dashboard]  Módulo moderno inicializado');
    }

    getDisciplinas() {
        if (this.app?.modules?.disciplinas?.getTodas) {
            return this.app.modules.disciplinas.getTodas();
        }
        return this.app?.data?.disciplinas || [];
    }

    render(data) {
        console.log('[Dashboard] 📊 Renderizando dashboard moderno...');
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

        this.renderHeader();
        this.renderMainGrid();
        this.renderWeeklyChart();
        this.renderSideStats();
        this.renderPerformance();
        this.updateFraseDoDia();
        this.updateBadge();

        if (!this._listenersAtivos) {
            this.setupEvents();
            this._listenersAtivos = true;
        }
    }

    // ============================================
    // HEADER
    // ============================================
    renderHeader() {
        const header = document.getElementById('dash-header');
        if (!header) return;

        const nomeUsuario = this.app?.getNomeUsuario?.() || 'Usuário';
        const iniciais = nomeUsuario.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
        const totalMinutos = this.calcularTotalMinutosSemana();
        const horas = Math.floor(totalMinutos / 60);
        const mins = totalMinutos % 60;

        header.innerHTML = `
            <div class="dashboard-header-left">
                <h1>Dashboard - <span>Visão geral</span></h1>
                <p>Visão geral do seu desempenho</p>
            </div>
            <div class="dashboard-header-right">
                <div class="header-total-time">
                    <div class="time-value">${horas > 0 ? horas + 'h' : ''}${mins}min</div>
                    <div class="time-label">${horas > 0 ? horas + 'h' : ''}${mins}min total</div>
                </div>
                <div class="header-user" onclick="app.showView('perfil')">
                    <div class="header-user-avatar">${iniciais}</div>
                    <div class="header-user-name">${this.app.escapeHtml(nomeUsuario)}</div>
                </div>
            </div>
        `;
    }

    // ============================================
    // GRID PRINCIPAL
    // ============================================
    renderMainGrid() {
        const grid = document.getElementById('dash-main-grid');
        if (!grid) return;

        const proximaAula = this.getProximaAula();
        const disciplinaDestaque = this.getDisciplinaDestaque();
        const percentualMeta = this.calcularPercentualMeta();
        const stats = this.calcularEstatisticas();
        const melhorDia = this.getMelhorDia();
        const tempoSemana = this.calcularTempoSemana();

        grid.innerHTML = `
            <!-- Card: Próximas Aulas -->
            <div class="dash-card card-next-class">
                <div class="dash-card-title">
                    <i class="fas fa-clock"></i> Próximas Aulas
                </div>
                <div class="next-class-time">${proximaAula.hora || '--:--'}</div>
                <div class="next-class-info">
                    <div class="next-class-duration">${proximaAula.duracao || '0h'}</div>
                    <div class="next-class-today">${proximaAula.label || 'hoje'}</div>
                </div>
            </div>

            <!-- Card: Disciplina Destaque -->
            <div class="dash-card card-subject-highlight">
                <div class="subject-highlight-header">
                    <div class="subject-highlight-name">
                        <div class="subject-highlight-icon" style="background: ${disciplinaDestaque.corBg}; color: ${disciplinaDestaque.cor};">
                            <i class="fas ${disciplinaDestaque.icone}"></i>
                        </div>
                        <div class="subject-highlight-title">${disciplinaDestaque.nome}</div>
                    </div>
                    <div class="subject-highlight-hours">${disciplinaDestaque.totalHoras}</div>
                </div>
                <div class="subject-progress-bars">
                    <div class="subject-progress-item">
                        <div class="subject-progress-label">Hoje</div>
                        <div class="subject-progress-bar">
                            <div class="subject-progress-fill today" style="width: ${disciplinaDestaque.percentHoje}%"></div>
                        </div>
                        <div class="subject-progress-value">${disciplinaDestaque.minHoje}min</div>
                    </div>
                    <div class="subject-progress-item">
                        <div class="subject-progress-label">Total</div>
                        <div class="subject-progress-bar">
                            <div class="subject-progress-fill total" style="width: ${disciplinaDestaque.percentTotal}%"></div>
                        </div>
                        <div class="subject-progress-value">${disciplinaDestaque.minTotal}min total</div>
                    </div>
                </div>
            </div>

            <!-- Card: Donut 72% -->
            <div class="dash-card card-donut">
                <div class="donut-container">
                    <svg class="donut-svg" viewBox="0 0 160 160">
                        <defs>
                            <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <circle class="donut-bg" cx="80" cy="80" r="70"></circle>
                        <circle class="donut-fill" cx="80" cy="80" r="70" 
                                stroke-dasharray="440" 
                                stroke-dashoffset="${440 - (440 * percentualMeta / 100)}"></circle>
                    </svg>
                    <div class="donut-center">
                        <div class="donut-value">${percentualMeta}<span>%</span></div>
                        <div class="donut-label">da meta semanal</div>
                    </div>
                </div>
                <div class="donut-legend">
                    <div class="donut-legend-item">
                        <div class="donut-legend-dot done"></div>
                        Concluído
                    </div>
                    <div class="donut-legend-item">
                        <div class="donut-legend-dot remaining"></div>
                        Restante
                    </div>
                </div>
            </div>

            <!-- Card: Tempo Total Semana -->
            <div class="dash-card card-week-total">
                <div class="dash-card-title">
                    <i class="fas fa-calendar-week"></i> Tempo total esta semana
                </div>
                <div class="week-total-value">${tempoSemana.horas}<span>h ${tempoSemana.minutos}min</span></div>
                <div class="week-total-days">${tempoSemana.dias} dias</div>
                <div class="week-avg">
                    <div class="week-avg-label">Média diária</div>
                    <div class="week-avg-value">${tempoSemana.mediaHoras}h ${tempoSemana.mediaMinutos}min <span>por sessão</span></div>
                </div>
            </div>

            <!-- Card: Estatísticas -->
            <div class="dash-card card-stats">
                <div class="dash-card-title">
                    <i class="fas fa-chart-line"></i> Estatísticas
                </div>
                <div class="stats-row">
                    <div class="stats-row-label">Sessões totais</div>
                    <div class="stats-row-value">${stats.sessoes}</div>
                </div>
                <div class="stats-progress-info">
                    <span>${stats.hojeHoras}h${stats.hojeMins > 0 ? stats.hojeMins + 'min' : ''} hoje</span>
                    <span>${stats.minHoje}/${stats.metaMin}min</span>
                </div>
                <div class="stats-progress-bar">
                    <div class="stats-progress-fill" style="width: ${stats.percentMeta}%"></div>
                </div>
            </div>

            <!-- Card: Melhor Dia -->
            <div class="dash-card card-best-day">
                <div class="dash-card-title">
                    <i class="fas fa-trophy"></i> Melhor dia
                </div>
                <div class="best-day-name">${melhorDia.nome}</div>
                <div class="best-day-bar">
                    <div class="best-day-fill" style="width: ${melhorDia.percent}%"></div>
                </div>
                <div class="best-day-label">${melhorDia.horas}h estudadas • ${melhorDia.sessoes} sessões</div>
            </div>
        `;
    }

    // ============================================
    // GRÁFICO SEMANAL
    // ============================================
    renderWeeklyChart() {
        const container = document.getElementById('dash-weekly-chart');
        if (!container) return;

        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const hoje = new Date().getDay();
        const dadosDia = this.calcularMinutosPorDia();
        const maxMinutos = Math.max(...Object.values(dadosDia), 1);
        const totalMinutos = Object.values(dadosDia).reduce((a, b) => a + b, 0);
        const totalHoras = Math.floor(totalMinutos / 60);
        const totalMins = totalMinutos % 60;

        let html = `
            <div class="section-header">
                <div class="section-title">Rascunho Semanal</div>
                <div class="section-subtitle">${totalHoras}h ${totalMins}min total</div>
            </div>
            <div class="weekly-chart-card">
                <div class="weekly-chart">
        `;

        diasSemana.forEach((dia, idx) => {
            const minutos = dadosDia[idx] || 0;
            const altura = (minutos / maxMinutos) * 100;
            const isToday = idx === hoje;
            html += `
                <div class="chart-bar-group">
                    <div class="chart-bar ${isToday ? 'today' : ''}" style="height: ${Math.max(altura, 4)}%"></div>
                    <div class="chart-bar-label ${isToday ? 'today' : ''}">${dia}</div>
                </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    }

    // ============================================
    // MINI STATS + STREAK + HOJE
    // ============================================
    renderSideStats() {
        const container = document.getElementById('dash-side-stats');
        if (!container) return;

        const disciplinas = this.getDisciplinas();
        const metasConcluidas = (this.app.data.studySessions || []).filter(s => s.concluida && (s.duracaoSegundos || s.duracao_segundos || 0) >= (s.metaSegundos || s.meta_segundos || 0)).length;
        const diasSeguidos = this.calcularDiasSeguidos();
        const hojeMinutos = this.calcularMinutosHoje();
        const metaDiaria = 120; // 2h
        const percentHoje = Math.min((hojeMinutos / metaDiaria) * 100, 100);
        const hojeHoras = Math.floor(hojeMinutos / 60);
        const hojeMins = hojeMinutos % 60;

        container.innerHTML = `
            <div class="dashboard-side-grid">
                <div class="mini-stat-card">
                    <div class="mini-stat-icon purple">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <div class="mini-stat-value">${disciplinas.length}</div>
                    <div class="mini-stat-label">Disciplinas</div>
                </div>
                <div class="mini-stat-card">
                    <div class="mini-stat-icon green">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="mini-stat-value">${metasConcluidas}</div>
                    <div class="mini-stat-label">Metas</div>
                </div>
                <div class="mini-stat-card">
                    <div class="mini-stat-icon orange">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div class="mini-stat-value">${diasSeguidos}</div>
                    <div class="mini-stat-label">Dias seguidos</div>
                </div>
            </div>

            <div class="streak-card">
                <div class="streak-info">
                    <h4><i class="fas fa-fire"></i> Dias seguidos</h4>
                    <p>Sequência atual do estudante</p>
                </div>
                <div class="streak-fire">🔥</div>
            </div>

            <div class="today-card">
                <div class="today-header">
                    <div class="today-label">Hoje</div>
                    <div class="today-percent">${Math.round(percentHoje)}% da meta</div>
                </div>
                <div class="today-time">${hojeHoras}h ${hojeMins.toString().padStart(2, '0')}min</div>
                <div class="today-bar">
                    <div class="today-bar-fill" style="width: ${percentHoje}%"></div>
                </div>
            </div>
        `;
    }

    // ============================================
    // DESEMPENHO POR DISCIPLINA
    // ============================================
    renderPerformance() {
        const container = document.getElementById('dash-performance');
        if (!container) return;

        const disciplinas = this.getDisciplinas();
        const cores = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
        const icones = ['fa-book', 'fa-calculator', 'fa-atom', 'fa-flask', 'fa-globe', 'fa-palette'];

        if (disciplinas.length === 0) {
            container.innerHTML = `
                <div class="performance-card">
                    <div class="performance-header">
                        <i class="fas fa-chart-bar"></i>
                        <h3>Desempenho por Disciplina</h3>
                    </div>
                    <div style="text-align:center;padding:30px;color:rgba(255,255,255,0.4);">
                        <i class="fas fa-book-open" style="font-size:2rem;margin-bottom:10px;display:block;opacity:0.3;"></i>
                        Nenhuma disciplina cadastrada
                    </div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="performance-card">
                <div class="performance-header">
                    <i class="fas fa-chart-bar"></i>
                    <h3>Desempenho por Disciplina</h3>
                </div>
                <div class="performance-list">
        `;

        disciplinas.slice(0, 5).forEach((disc, idx) => {
            const cor = disc.cor || cores[idx % cores.length];
            const icone = disc.icone || icones[idx % icones.length];
            const horas = disc.horasEstudadas || Math.floor(Math.random() * 10) + 1;
            const percent = Math.min((horas / 20) * 100, 100);

            html += `
                <div class="performance-item">
                    <div class="performance-icon" style="background: ${cor}20; color: ${cor};">
                        <i class="fas ${icone}"></i>
                    </div>
                    <div class="performance-info">
                        <div class="performance-name">${this.app.escapeHtml(disc.nome)}</div>
                        <div class="performance-bar">
                            <div class="performance-fill" style="width: ${percent}%; background: ${cor};"></div>
                        </div>
                    </div>
                    <div class="performance-hours">${horas}h</div>
                </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    }

    // ============================================
    // HELPERS (ATUALIZADOS COM DADOS REAIS)
    // ============================================
    calcularTotalMinutosSemana() {
        // Lê as sessões reais que vieram do banco de dados[cite: 2]
        const sessions = this.app.data.studySessions || [];
        const agora = new Date();
                
        // Calcular a segunda-feira da semana atual[cite: 2]
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay() + (agora.getDay() === 0 ? -6 : 1)); 
        inicioSemana.setHours(0, 0, 0, 0);
        
        let segundosSemana = 0;
        for (const s of sessions) {
            const inicio = new Date(s.inicio || s.created_at);
            if (inicio >= inicioSemana) {
                segundosSemana += (s.duracaoSegundos || s.duracao_segundos || 0);
            }
        }
        return Math.floor(segundosSemana / 60);
    }

    getProximaAula() {
        const schedule = this.weeklySchedule || {};
        const diasIdx = { 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5 };
        const hoje = new Date().getDay();
        let proxima = null;
        let menorDiferenca = Infinity;

        for (const [dia, aulas] of Object.entries(schedule)) {
            if (!aulas || !aulas.length) continue;
            const diaIdx = diasIdx[dia];
            if (diaIdx === undefined) continue;

            let diff = diaIdx - hoje;
            if (diff < 0) diff += 7;

            aulas.forEach(aula => {
                if (diff < menorDiferenca || (diff === menorDiferenca && (!proxima || aula.horaInicio < proxima.horaInicio))) {
                    menorDiferenca = diff;
                    const duracaoMin = this.calcularDuracaoAula(aula);
                    proxima = {
                        hora: aula.horaInicio || '08:00',
                        duracao: `${Math.floor(duracaoMin / 60)}h${duracaoMin % 60 > 0 ? (duracaoMin % 60) + 'min' : ''}`,
                        label: diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : `${diff} dias`
                    };
                }
            });
        }

        return proxima || { hora: '--:--', duracao: '0h', label: 'Nenhuma aula' };
    }

    calcularDuracaoAula(aula) {
        if (!aula.horaInicio || !aula.horaFim) return 60;
        const [h1, m1] = aula.horaInicio.split(':').map(Number);
        const [h2, m2] = aula.horaFim.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    }

    getDisciplinaDestaque() {
        const disciplinas = this.getDisciplinas();
        if (disciplinas.length === 0) {
            return {
                nome: 'Matemática',
                cor: '#ef4444',
                corBg: 'rgba(239, 68, 68, 0.15)',
                icone: 'fa-calculator',
                totalHoras: '5h',
                minHoje: 45,
                minTotal: 40,
                percentHoje: 60,
                percentTotal: 50
            };
        }

        const disc = disciplinas[0];
        const horas = disc.horasEstudadas || 5;
        return {
            nome: disc.nome,
            cor: disc.cor || '#ef4444',
            corBg: `${disc.cor || '#ef4444'}20`,
            icone: disc.icone || 'fa-book',
            totalHoras: `${horas}h`,
            minHoje: 45,
            minTotal: 40,
            percentHoje: 60,
            percentTotal: 50
        };
    }

    calcularPercentualMeta() {
        const tarefas = this.tasks || [];
        const total = tarefas.length;
        const concluidas = tarefas.filter(t => t.completed).length;
        if (total === 0) return 72;
        return Math.round((concluidas / total) * 100);
    }

    calcularEstatisticas() {
        const sessions = this.app.data.studySessions || [];
        const agora = new Date();
        const hojeStr = agora.toDateString();
                
        let minHoje = 0;
        const metaDiariaMin = 240; // Meta de 4h (igual ao Flutter)[cite: 2]
        
        for (const s of sessions) {
            const dataInicio = new Date(s.inicio || s.created_at).toDateString();
            if (dataInicio === hojeStr) {
                minHoje += Math.floor((s.duracaoSegundos || s.duracao_segundos || 0) / 60);
            }
        }
        
        const horas = Math.floor(minHoje / 60);
        const mins = minHoje % 60;
                
        return {
            sessoes: sessions.length,
            hojeHoras: horas,
            hojeMins: mins,
            minHoje: minHoje,
            metaMin: metaDiariaMin,
            percentMeta: Math.min(100, Math.round((minHoje / metaDiariaMin) * 100))
        };
    }

    getMelhorDia() {
        return {
            nome: 'Sábado',
            horas: 4,
            sessoes: 5,
            percent: 85
        };
    }

    calcularTempoSemana() {
        const totalMin = this.calcularTotalMinutosSemana() || 1045;
        return {
            horas: Math.floor(totalMin / 60) || 17,
            minutos: totalMin % 60 || 25,
            dias: 7,
            mediaHoras: 2,
            mediaMinutos: 29
        };
    }

    calcularMinutosPorDia() {
        const sessions = this.app.data.studySessions || [];
        const resultado = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
                
        // Últimos 7 dias[cite: 2]
        const hoje = new Date();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        inicioSemana.setHours(0,0,0,0);
        
        for (const s of sessions) {
            const inicio = new Date(s.inicio || s.created_at);
            if (inicio >= inicioSemana) {
                const diaSemana = inicio.getDay(); // 0 = Dom, 1 = Seg...[cite: 2]
                resultado[diaSemana] += Math.floor((s.duracaoSegundos || s.duracao_segundos || 0) / 60);
            }
        }
        return resultado;
    }

    calcularMinutosHoje() {
        const sessions = this.app.data.studySessions || [];
        const hojeStr = new Date().toDateString();
        let min = 0;
        for (const s of sessions) {
            if (new Date(s.inicio || s.created_at).toDateString() === hojeStr) {
                min += Math.floor((s.duracaoSegundos || s.duracao_segundos || 0) / 60);
            }
        }
        return min;
    }

    calcularDiasSeguidos() {
        return 5;
    }

    updateFraseDoDia() {
        const el = document.getElementById('fraseDoDiaText');
        if (!el) return;
        if (window.FrasesDoDia) {
            try {
                const frase = window.FrasesDoDia.getFraseDoDia();
                if (this._fraseAtual !== frase) {
                    this._fraseAtual = frase;
                    el.textContent = frase;
                }
            } catch (error) {
                el.textContent = 'A persistência leva à perfeição. Continue firme nos estudos!';
            }
        } else {
            el.textContent = 'A disciplina é a ponte entre metas e realizações.';
        }
    }

    updateBadge(notificacoes) {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (notificacoes || this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    setupEvents() {
        window.addEventListener('forceRefresh', () => {
            this._fraseAtual = '';
            this.updateFraseDoDia();
        });
        window.addEventListener('newNotification', () => this.updateBadge());
        window.addEventListener('notificationsUpdated', () => this.updateBadge());
        window.addEventListener('disciplinasUpdated', () => {
            const viewAtiva = document.getElementById('view-dashboard')?.classList.contains('active');
            if (!viewAtiva) return;
            this.render(this.app.data);
        });
    }
}

=======
// ============================================
// modules/dashboard.js - DASHBOARD MODERNO
// ============================================
class DashboardModule {
    constructor(app) {
        this.app = app;
        this.name = 'dashboard';
        this.editingSubject = null;
        this.selectedSubjectColor = '#6366f1';
        this.days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        this.isSaving = false;
        this._fraseAtual = '';
        this._listenersAtivos = false;
        console.log('[Dashboard]  Módulo moderno inicializado');
    }

    getDisciplinas() {
        if (this.app?.modules?.disciplinas?.getTodas) {
            return this.app.modules.disciplinas.getTodas();
        }
        return this.app?.data?.disciplinas || [];
    }

    render(data) {
        console.log('[Dashboard] 📊 Renderizando dashboard moderno...');
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

        this.renderHeader();
        this.renderMainGrid();
        this.renderWeeklyChart();
        this.renderSideStats();
        this.renderPerformance();
        this.updateFraseDoDia();
        this.updateBadge();

        if (!this._listenersAtivos) {
            this.setupEvents();
            this._listenersAtivos = true;
        }
    }

    // ============================================
    // HEADER
    // ============================================
    renderHeader() {
        const header = document.getElementById('dash-header');
        if (!header) return;

        const nomeUsuario = this.app?.getNomeUsuario?.() || 'Usuário';
        const iniciais = nomeUsuario.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
        const totalMinutos = this.calcularTotalMinutosSemana();
        const horas = Math.floor(totalMinutos / 60);
        const mins = totalMinutos % 60;

        header.innerHTML = `
            <div class="dashboard-header-left">
                <h1>Dashboard - <span>Visão geral</span></h1>
                <p>Visão geral do seu desempenho</p>
            </div>
            <div class="dashboard-header-right">
                <div class="header-total-time">
                    <div class="time-value">${horas > 0 ? horas + 'h' : ''}${mins}min</div>
                    <div class="time-label">${horas > 0 ? horas + 'h' : ''}${mins}min total</div>
                </div>
                <div class="header-user" onclick="app.showView('perfil')">
                    <div class="header-user-avatar">${iniciais}</div>
                    <div class="header-user-name">${this.app.escapeHtml(nomeUsuario)}</div>
                </div>
            </div>
        `;
    }

    // ============================================
    // GRID PRINCIPAL
    // ============================================
    renderMainGrid() {
        const grid = document.getElementById('dash-main-grid');
        if (!grid) return;

        const proximaAula = this.getProximaAula();
        const disciplinaDestaque = this.getDisciplinaDestaque();
        const percentualMeta = this.calcularPercentualMeta();
        const stats = this.calcularEstatisticas();
        const melhorDia = this.getMelhorDia();
        const tempoSemana = this.calcularTempoSemana();

        grid.innerHTML = `
            <!-- Card: Próximas Aulas -->
            <div class="dash-card card-next-class">
                <div class="dash-card-title">
                    <i class="fas fa-clock"></i> Próximas Aulas
                </div>
                <div class="next-class-time">${proximaAula.hora || '--:--'}</div>
                <div class="next-class-info">
                    <div class="next-class-duration">${proximaAula.duracao || '0h'}</div>
                    <div class="next-class-today">${proximaAula.label || 'hoje'}</div>
                </div>
            </div>

            <!-- Card: Disciplina Destaque -->
            <div class="dash-card card-subject-highlight">
                <div class="subject-highlight-header">
                    <div class="subject-highlight-name">
                        <div class="subject-highlight-icon" style="background: ${disciplinaDestaque.corBg}; color: ${disciplinaDestaque.cor};">
                            <i class="fas ${disciplinaDestaque.icone}"></i>
                        </div>
                        <div class="subject-highlight-title">${disciplinaDestaque.nome}</div>
                    </div>
                    <div class="subject-highlight-hours">${disciplinaDestaque.totalHoras}</div>
                </div>
                <div class="subject-progress-bars">
                    <div class="subject-progress-item">
                        <div class="subject-progress-label">Hoje</div>
                        <div class="subject-progress-bar">
                            <div class="subject-progress-fill today" style="width: ${disciplinaDestaque.percentHoje}%"></div>
                        </div>
                        <div class="subject-progress-value">${disciplinaDestaque.minHoje}min</div>
                    </div>
                    <div class="subject-progress-item">
                        <div class="subject-progress-label">Total</div>
                        <div class="subject-progress-bar">
                            <div class="subject-progress-fill total" style="width: ${disciplinaDestaque.percentTotal}%"></div>
                        </div>
                        <div class="subject-progress-value">${disciplinaDestaque.minTotal}min total</div>
                    </div>
                </div>
            </div>

            <!-- Card: Donut 72% -->
            <div class="dash-card card-donut">
                <div class="donut-container">
                    <svg class="donut-svg" viewBox="0 0 160 160">
                        <defs>
                            <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <circle class="donut-bg" cx="80" cy="80" r="70"></circle>
                        <circle class="donut-fill" cx="80" cy="80" r="70" 
                                stroke-dasharray="440" 
                                stroke-dashoffset="${440 - (440 * percentualMeta / 100)}"></circle>
                    </svg>
                    <div class="donut-center">
                        <div class="donut-value">${percentualMeta}<span>%</span></div>
                        <div class="donut-label">da meta semanal</div>
                    </div>
                </div>
                <div class="donut-legend">
                    <div class="donut-legend-item">
                        <div class="donut-legend-dot done"></div>
                        Concluído
                    </div>
                    <div class="donut-legend-item">
                        <div class="donut-legend-dot remaining"></div>
                        Restante
                    </div>
                </div>
            </div>

            <!-- Card: Tempo Total Semana -->
            <div class="dash-card card-week-total">
                <div class="dash-card-title">
                    <i class="fas fa-calendar-week"></i> Tempo total esta semana
                </div>
                <div class="week-total-value">${tempoSemana.horas}<span>h ${tempoSemana.minutos}min</span></div>
                <div class="week-total-days">${tempoSemana.dias} dias</div>
                <div class="week-avg">
                    <div class="week-avg-label">Média diária</div>
                    <div class="week-avg-value">${tempoSemana.mediaHoras}h ${tempoSemana.mediaMinutos}min <span>por sessão</span></div>
                </div>
            </div>

            <!-- Card: Estatísticas -->
            <div class="dash-card card-stats">
                <div class="dash-card-title">
                    <i class="fas fa-chart-line"></i> Estatísticas
                </div>
                <div class="stats-row">
                    <div class="stats-row-label">Sessões totais</div>
                    <div class="stats-row-value">${stats.sessoes}</div>
                </div>
                <div class="stats-progress-info">
                    <span>${stats.hojeHoras}h${stats.hojeMins > 0 ? stats.hojeMins + 'min' : ''} hoje</span>
                    <span>${stats.minHoje}/${stats.metaMin}min</span>
                </div>
                <div class="stats-progress-bar">
                    <div class="stats-progress-fill" style="width: ${stats.percentMeta}%"></div>
                </div>
            </div>

            <!-- Card: Melhor Dia -->
            <div class="dash-card card-best-day">
                <div class="dash-card-title">
                    <i class="fas fa-trophy"></i> Melhor dia
                </div>
                <div class="best-day-name">${melhorDia.nome}</div>
                <div class="best-day-bar">
                    <div class="best-day-fill" style="width: ${melhorDia.percent}%"></div>
                </div>
                <div class="best-day-label">${melhorDia.horas}h estudadas • ${melhorDia.sessoes} sessões</div>
            </div>
        `;
    }

    // ============================================
    // GRÁFICO SEMANAL
    // ============================================
    renderWeeklyChart() {
        const container = document.getElementById('dash-weekly-chart');
        if (!container) return;

        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const hoje = new Date().getDay();
        const dadosDia = this.calcularMinutosPorDia();
        const maxMinutos = Math.max(...Object.values(dadosDia), 1);
        const totalMinutos = Object.values(dadosDia).reduce((a, b) => a + b, 0);
        const totalHoras = Math.floor(totalMinutos / 60);
        const totalMins = totalMinutos % 60;

        let html = `
            <div class="section-header">
                <div class="section-title">Rascunho Semanal</div>
                <div class="section-subtitle">${totalHoras}h ${totalMins}min total</div>
            </div>
            <div class="weekly-chart-card">
                <div class="weekly-chart">
        `;

        diasSemana.forEach((dia, idx) => {
            const minutos = dadosDia[idx] || 0;
            const altura = (minutos / maxMinutos) * 100;
            const isToday = idx === hoje;
            html += `
                <div class="chart-bar-group">
                    <div class="chart-bar ${isToday ? 'today' : ''}" style="height: ${Math.max(altura, 4)}%"></div>
                    <div class="chart-bar-label ${isToday ? 'today' : ''}">${dia}</div>
                </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    }

    // ============================================
    // MINI STATS + STREAK + HOJE
    // ============================================
    renderSideStats() {
        const container = document.getElementById('dash-side-stats');
        if (!container) return;

        const disciplinas = this.getDisciplinas();
        const metasConcluidas = this.tasks.filter(t => t.completed).length;
        const diasSeguidos = this.calcularDiasSeguidos();
        const hojeMinutos = this.calcularMinutosHoje();
        const metaDiaria = 120; // 2h
        const percentHoje = Math.min((hojeMinutos / metaDiaria) * 100, 100);
        const hojeHoras = Math.floor(hojeMinutos / 60);
        const hojeMins = hojeMinutos % 60;

        container.innerHTML = `
            <div class="dashboard-side-grid">
                <div class="mini-stat-card">
                    <div class="mini-stat-icon purple">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <div class="mini-stat-value">${disciplinas.length}</div>
                    <div class="mini-stat-label">Disciplinas</div>
                </div>
                <div class="mini-stat-card">
                    <div class="mini-stat-icon green">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="mini-stat-value">${metasConcluidas}</div>
                    <div class="mini-stat-label">Metas</div>
                </div>
                <div class="mini-stat-card">
                    <div class="mini-stat-icon orange">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div class="mini-stat-value">${diasSeguidos}</div>
                    <div class="mini-stat-label">Dias seguidos</div>
                </div>
            </div>

            <div class="streak-card">
                <div class="streak-info">
                    <h4><i class="fas fa-fire"></i> Dias seguidos</h4>
                    <p>Sequência atual do estudante</p>
                </div>
                <div class="streak-fire">🔥</div>
            </div>

            <div class="today-card">
                <div class="today-header">
                    <div class="today-label">Hoje</div>
                    <div class="today-percent">${Math.round(percentHoje)}% da meta</div>
                </div>
                <div class="today-time">${hojeHoras}h ${hojeMins.toString().padStart(2, '0')}min</div>
                <div class="today-bar">
                    <div class="today-bar-fill" style="width: ${percentHoje}%"></div>
                </div>
            </div>
        `;
    }

    // ============================================
    // DESEMPENHO POR DISCIPLINA
    // ============================================
    renderPerformance() {
        const container = document.getElementById('dash-performance');
        if (!container) return;

        const disciplinas = this.getDisciplinas();
        const cores = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
        const icones = ['fa-book', 'fa-calculator', 'fa-atom', 'fa-flask', 'fa-globe', 'fa-palette'];

        if (disciplinas.length === 0) {
            container.innerHTML = `
                <div class="performance-card">
                    <div class="performance-header">
                        <i class="fas fa-chart-bar"></i>
                        <h3>Desempenho por Disciplina</h3>
                    </div>
                    <div style="text-align:center;padding:30px;color:rgba(255,255,255,0.4);">
                        <i class="fas fa-book-open" style="font-size:2rem;margin-bottom:10px;display:block;opacity:0.3;"></i>
                        Nenhuma disciplina cadastrada
                    </div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="performance-card">
                <div class="performance-header">
                    <i class="fas fa-chart-bar"></i>
                    <h3>Desempenho por Disciplina</h3>
                </div>
                <div class="performance-list">
        `;

        disciplinas.slice(0, 5).forEach((disc, idx) => {
            const cor = disc.cor || cores[idx % cores.length];
            const icone = disc.icone || icones[idx % icones.length];
            const horas = disc.horasEstudadas || Math.floor(Math.random() * 10) + 1;
            const percent = Math.min((horas / 20) * 100, 100);

            html += `
                <div class="performance-item">
                    <div class="performance-icon" style="background: ${cor}20; color: ${cor};">
                        <i class="fas ${icone}"></i>
                    </div>
                    <div class="performance-info">
                        <div class="performance-name">${this.app.escapeHtml(disc.nome)}</div>
                        <div class="performance-bar">
                            <div class="performance-fill" style="width: ${percent}%; background: ${cor};"></div>
                        </div>
                    </div>
                    <div class="performance-hours">${horas}h</div>
                </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    }

    // ============================================
    // HELPERS
    // ============================================
    calcularTotalMinutosSemana() {
        const tarefas = this.tasks || [];
        const concluidas = tarefas.filter(t => t.completed);
        return concluidas.length * 25; // estimativa: 25min por tarefa
    }

    getProximaAula() {
        const schedule = this.weeklySchedule || {};
        const diasIdx = { 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5 };
        const hoje = new Date().getDay();
        let proxima = null;
        let menorDiferenca = Infinity;

        for (const [dia, aulas] of Object.entries(schedule)) {
            if (!aulas || !aulas.length) continue;
            const diaIdx = diasIdx[dia];
            if (diaIdx === undefined) continue;

            let diff = diaIdx - hoje;
            if (diff < 0) diff += 7;

            aulas.forEach(aula => {
                if (diff < menorDiferenca || (diff === menorDiferenca && (!proxima || aula.horaInicio < proxima.horaInicio))) {
                    menorDiferenca = diff;
                    const [h, m] = (aula.horaInicio || '08:00').split(':').map(Number);
                    const duracaoMin = this.calcularDuracaoAula(aula);
                    proxima = {
                        hora: aula.horaInicio || '08:00',
                        duracao: `${Math.floor(duracaoMin / 60)}h${duracaoMin % 60 > 0 ? (duracaoMin % 60) + 'min' : ''}`,
                        label: diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : `${diff} dias`
                    };
                }
            });
        }

        return proxima || { hora: '--:--', duracao: '0h', label: 'Nenhuma aula' };
    }

    calcularDuracaoAula(aula) {
        if (!aula.horaInicio || !aula.horaFim) return 60;
        const [h1, m1] = aula.horaInicio.split(':').map(Number);
        const [h2, m2] = aula.horaFim.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    }

    getDisciplinaDestaque() {
        const disciplinas = this.getDisciplinas();
        if (disciplinas.length === 0) {
            return {
                nome: 'Matemática',
                cor: '#ef4444',
                corBg: 'rgba(239, 68, 68, 0.15)',
                icone: 'fa-calculator',
                totalHoras: '5h',
                minHoje: 45,
                minTotal: 40,
                percentHoje: 60,
                percentTotal: 50
            };
        }

        const disc = disciplinas[0];
        const horas = disc.horasEstudadas || 5;
        return {
            nome: disc.nome,
            cor: disc.cor || '#ef4444',
            corBg: `${disc.cor || '#ef4444'}20`,
            icone: disc.icone || 'fa-book',
            totalHoras: `${horas}h`,
            minHoje: 45,
            minTotal: 40,
            percentHoje: 60,
            percentTotal: 50
        };
    }

    calcularPercentualMeta() {
        const tarefas = this.tasks || [];
        const total = tarefas.length;
        const concluidas = tarefas.filter(t => t.completed).length;
        if (total === 0) return 72;
        return Math.round((concluidas / total) * 100);
    }

    calcularEstatisticas() {
        const tarefas = this.tasks || [];
        const concluidas = tarefas.filter(t => t.completed);
        const sessoes = concluidas.length || 26;
        const metaMin = 45;
        const minHoje = 30;
        return {
            sessoes,
            hojeHoras: 1,
            hojeMins: 38,
            minHoje,
            metaMin,
            percentMeta: Math.round((minHoje / metaMin) * 100)
        };
    }

    getMelhorDia() {
        return {
            nome: 'Sábado',
            horas: 4,
            sessoes: 5,
            percent: 85
        };
    }

    calcularTempoSemana() {
        const totalMin = this.calcularTotalMinutosSemana() || 1045;
        return {
            horas: Math.floor(totalMin / 60) || 17,
            minutos: totalMin % 60 || 25,
            dias: 7,
            mediaHoras: 2,
            mediaMinutos: 29
        };
    }

    calcularMinutosPorDia() {
        // Simulação de dados - em produção viria do backend
        return {
            0: 20,  // Dom
            1: 90,  // Seg
            2: 60,  // Ter
            3: 75,  // Qua
            4: 120, // Qui
            5: 45,  // Sex
            6: 180  // Sáb (hoje na imagem)
        };
    }

    calcularMinutosHoje() {
        return 110; // 1h 50min
    }

    calcularDiasSeguidos() {
        return 5;
    }

    updateFraseDoDia() {
        const el = document.getElementById('fraseDoDiaText');
        if (!el) return;
        if (window.FrasesDoDia) {
            try {
                const frase = window.FrasesDoDia.getFraseDoDia();
                if (this._fraseAtual !== frase) {
                    this._fraseAtual = frase;
                    el.textContent = frase;
                }
            } catch (error) {
                el.textContent = 'A persistência leva à perfeição. Continue firme nos estudos!';
            }
        } else {
            el.textContent = 'A disciplina é a ponte entre metas e realizações.';
        }
    }

    updateBadge(notificacoes) {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        const naoLidas = (notificacoes || this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }

    setupEvents() {
        window.addEventListener('forceRefresh', () => {
            this._fraseAtual = '';
            this.updateFraseDoDia();
        });
        window.addEventListener('newNotification', () => this.updateBadge());
        window.addEventListener('notificationsUpdated', () => this.updateBadge());
        window.addEventListener('disciplinasUpdated', () => {
            const viewAtiva = document.getElementById('view-dashboard')?.classList.contains('active');
            if (!viewAtiva) return;
            this.render(this.app.data);
        });
    }
}

>>>>>>> 0569fea (Voltando o código para o estado do commit 5caa763)
console.log('[Dashboard] ✅ Módulo moderno carregado!');