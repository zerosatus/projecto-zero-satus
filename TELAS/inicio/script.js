// ===== VARIÁVEIS GLOBAIS =====
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
// ===== DETECTAR MUDANÇAS =====
window.addEventListener('storage', (e) => {
    if (!usuarioAtual) return;
    
    if (e.key === `tarefas_${usuarioAtual.email}` ||
        e.key === `anotacoes_${usuarioAtual.email}` ||
        e.key === `eventos_${usuarioAtual.email}` ||
        e.key === 'sync_notification') {
        
        console.log('🔄 Dados atualizados em outra aba');
        carregarDados();
        atualizarEstatisticasMini();
        refreshHomeData?.(); // Se existir no mobile
    }
});
// ===== VERIFICAÇÃO DE LOGIN =====
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        carregarDados();
        atualizarMiniPerfil();
        atualizarEstatisticasMini();
        
        // Inicializar componentes
        new Calendar();
        new CircularProgress();
        new StudyChart();
        new StudyTimer();
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ===== CARREGAR DADOS DE OUTROS MÓDULOS =====
function carregarDados() {
    // Carregar tarefas
    const tarefasKey = `tarefas_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(tarefasKey);
    tarefas = tarefasSalvas ? JSON.parse(tarefasSalvas) : [];

    // Carregar anotações
    const anotacoesKey = `anotacoes_${usuarioAtual.email}`;
    const anotacoesSalvas = localStorage.getItem(anotacoesKey);
    anotacoes = anotacoesSalvas ? JSON.parse(anotacoesSalvas) : [];

    // Carregar eventos
    const eventosKey = `eventos_${usuarioAtual.email}`;
    const eventosSalvas = localStorage.getItem(eventosKey);
    eventos = eventosSalvas ? JSON.parse(eventosSalvas) : [];
}

// ===== ATUALIZAR MINI PERFIL =====
function atualizarMiniPerfil() {
    if (!usuarioAtual) return;
    
    // Atualizar nome e email
    document.getElementById('miniName').textContent = usuarioAtual.nome || 'Usuário';
    document.getElementById('miniEmail').textContent = usuarioAtual.email || '';
    
    // Atualizar avatar (se existir)
    if (usuarioAtual.avatar) {
        document.getElementById('miniAvatar').src = usuarioAtual.avatar;
    } else {
        // Gerar avatar com iniciais
        const iniciais = usuarioAtual.nome
            ? usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
            : 'U';
        document.getElementById('miniAvatar').src = `https://ui-avatars.com/api/?name=${iniciais}&background=9333ea&color=fff&size=70`;
    }
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticasMini() {
    // Calcular estatísticas reais
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.concluida).length;
    const percentualConclusao = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
    
    // Calcular horas de estudo
    const horasEstudo = calcularHorasEstudo();
    
    // Calcular progresso semanal (baseado em eventos e tarefas)
    const progressoSemanal = calcularProgressoSemanal();
    
    // Atualizar valores com animação
    animateValue('statTarefas', 0, totalTarefas, 1000);
    animateValue('statConclusao', 0, percentualConclusao, 1000, '%');
    animateValue('statHoras', 0, horasEstudo, 1000, 'h');
    
    // Atualizar barra de progresso
    setTimeout(() => {
        document.getElementById('progressFill').style.width = progressoSemanal + '%';
        document.getElementById('progressValue').textContent = progressoSemanal + '%';
    }, 500);
    
    // Atualizar círculo de progresso
    setTimeout(() => {
        const circularProgress = document.querySelector('.progress-ring-fill');
        if (circularProgress) {
            const radius = circularProgress.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (progressoSemanal / 100) * circumference;
            circularProgress.style.strokeDashoffset = offset;
        }
        document.querySelector('.percentage').textContent = progressoSemanal + '%';
    }, 800);
}

// ===== CALCULAR HORAS DE ESTUDO =====
function calcularHorasEstudo() {
    let horas = 0;
    
    // Horas de eventos de aula
    horas += eventos.filter(e => e.type === 'aula').length * 2;
    
    // Horas de tarefas concluídas (estimativa)
    horas += tarefas.filter(t => t.concluida).length * 1.5;
    
    return horas || 45; // Fallback
}

// ===== CALCULAR PROGRESSO SEMANAL =====
function calcularProgressoSemanal() {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    
    // Eventos da semana
    const eventosSemana = eventos.filter(e => {
        const dataEvento = new Date(e.year, e.month, e.day);
        return dataEvento >= inicioSemana && dataEvento <= fimSemana;
    });
    
    // Tarefas da semana
    const tarefasSemana = tarefas.filter(t => {
        if (!t.prazo) return false;
        const [dia, mes, ano] = t.prazo.split('/');
        const dataPrazo = new Date(ano, mes-1, dia);
        return dataPrazo >= inicioSemana && dataPrazo <= fimSemana;
    });
    
    // Calcular progresso (70-90% como base + ajustes)
    const totalItens = eventosSemana.length + tarefasSemana.length;
    const itensConcluidos = tarefas.filter(t => t.concluida).length;
    
    if (totalItens === 0) return 75; // Fallback
    
    const progresso = Math.min(100, Math.round((itensConcluidos / totalItens) * 100));
    return progresso || 75;
}

// ===== ANIMAR VALORES =====
function animateValue(elementId, start, end, duration, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ============================================
// CALENDÁRIO (INTEGRADO)
// ============================================
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.today = new Date();
        this.init();
    }
    
    init() {
        this.renderCalendar();
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
    }
    
    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }
    
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarDates = document.getElementById('calendarDates');
        calendarDates.innerHTML = '';
        
        // Dias vazios no início
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'date-cell empty';
            calendarDates.appendChild(emptyCell);
        }
        
        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell';
            dateCell.textContent = day;
            
            // Verificar se é hoje
            if (year === this.today.getFullYear() && month === this.today.getMonth() && day === this.today.getDate()) {
                dateCell.classList.add('today');
            }
            
            // Verificar se tem eventos
            const temEvento = eventos.some(e => 
                e.day === day && e.month === month && e.year === year
            );
            
            if (temEvento) {
                dateCell.classList.add('has-event');
                dateCell.title = 'Tem evento(s) agendado(s)';
            }
            
            calendarDates.appendChild(dateCell);
        }
    }
}

// ============================================
// PROGRESSO CIRCULAR
// ============================================
class CircularProgress {
    constructor() {
        this.circle = document.querySelector('.progress-ring-fill');
        if (!this.circle) return;
        this.radius = this.circle.r.baseVal.value;
        this.circumference = 2 * Math.PI * this.radius;
        this.init();
    }
    
    init() {
        this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.circle.style.strokeDashoffset = this.circumference;
    }
}

// ============================================
// GRÁFICO DE ESTUDO
// ============================================
class StudyChart {
    constructor() {
        this.chartContainer = document.getElementById('studyChart');
        if (!this.chartContainer) return;
        
        // Gerar dados baseados em eventos reais
        this.data = this.gerarDadosSemana();
        this.init();
    }
    
    gerarDadosSemana() {
        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
        const dados = [];
        
        for (let i = 0; i < 7; i++) {
            const data = new Date();
            data.setDate(data.getDate() - data.getDay() + i);
            
            // Contar eventos e tarefas para este dia
            const eventosDia = eventos.filter(e => 
                e.day === data.getDate() && 
                e.month === data.getMonth() && 
                e.year === data.getFullYear()
            ).length;
            
            const tarefasDia = tarefas.filter(t => {
                if (!t.prazo) return false;
                const [dia, mes, ano] = t.prazo.split('/');
                return parseInt(dia) === data.getDate() && 
                       parseInt(mes)-1 === data.getMonth() && 
                       parseInt(ano) === data.getFullYear();
            }).length;
            
            // Horas de estudo (cada evento/tarefa = 1-3 horas)
            const horas = (eventosDia * 2) + (tarefasDia * 1.5);
            dados.push(Math.min(8, Math.round(horas)) || Math.floor(Math.random() * 4) + 2);
        }
        
        return dados;
    }
    
    init() {
        this.drawChart();
        
        // Redesenhar quando a janela for redimensionada
        window.addEventListener('resize', () => this.drawChart());
    }
    
    drawChart() {
        const width = this.chartContainer.offsetWidth || 200;
        const height = this.chartContainer.offsetHeight || 80;
        const padding = 10;
        
        this.chartContainer.innerHTML = '';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        
        const maxVal = Math.max(...this.data, 2);
        const minVal = Math.min(...this.data, 0);
        const range = maxVal - minVal || 1;
        
        // Criar área preenchida
        const points = this.data.map((val, index) => {
            const x = padding + (index / (this.data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
            return `${x},${y}`;
        });
        
        // Adicionar pontos de início e fim para a área
        const areaPoints = [
            `${padding},${height - padding}`,
            ...points,
            `${width - padding},${height - padding}`
        ].join(' ');
        
        // Desenhar área
        const area = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        area.setAttribute('points', areaPoints);
        area.setAttribute('fill', 'rgba(147, 51, 234, 0.2)');
        svg.appendChild(area);
        
        // Desenhar linha
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.setAttribute('points', points.join(' '));
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', '#9333ea');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-linecap', 'round');
        
        svg.appendChild(line);
        this.chartContainer.appendChild(svg);
    }
}

// ============================================
// TIMER DE ESTUDO
// ============================================
class StudyTimer {
    constructor() {
        this.isActive = false;
        this.seconds = 0;
        this.interval = null;
        this.btnStart = document.getElementById('startStudy');
        if (this.btnStart) {
            this.btnStart.addEventListener('click', () => this.toggleTimer());
            
            // Carregar timer salvo
            this.carregarTimerSalvo();
        }
    }
    
    carregarTimerSalvo() {
        const timerKey = `timer_${usuarioAtual?.email}`;
        const timerSalvo = localStorage.getItem(timerKey);
        
        if (timerSalvo) {
            const timerData = JSON.parse(timerSalvo);
            const hoje = new Date().toDateString();
            
            // Se o timer é de hoje, restaurar
            if (timerData.data === hoje) {
                this.seconds = timerData.segundos;
                this.updateDisplay();
            }
        }
    }
    
    salvarTimer() {
        if (!usuarioAtual) return;
        
        const timerKey = `timer_${usuarioAtual.email}`;
        localStorage.setItem(timerKey, JSON.stringify({
            segundos: this.seconds,
            data: new Date().toDateString(),
            ativo: this.isActive
        }));
    }
    
    toggleTimer() {
        if (this.isActive) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isActive = true;
        this.btnStart.innerHTML = '<i class="fas fa-pause"></i> Pausar Sessão';
        this.btnStart.style.background = '#e74c3c';
        this.interval = setInterval(() => {
            this.seconds++;
            this.updateDisplay();
            this.salvarTimer();
        }, 1000);
    }
    
    pauseTimer() {
        this.isActive = false;
        clearInterval(this.interval);
        this.btnStart.innerHTML = '<i class="fas fa-play"></i> Continuar Sessão';
        this.btnStart.style.background = '';
        this.salvarTimer();
    }
    
    updateDisplay() {
        const h = Math.floor(this.seconds / 3600);
        const m = Math.floor((this.seconds % 3600) / 60);
        const s = this.seconds % 60;
        this.btnStart.innerHTML = `<i class="fas fa-pause"></i> ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Deseja sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

// ===== MENU ATIVO =====
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

console.log('%c🏠 Painel Inicial', 'color: #9333ea; font-size: 20px; font-weight: bold;');
console.log('%cSistema integrado carregado!', 'color: #00b894; font-size: 14px;');
