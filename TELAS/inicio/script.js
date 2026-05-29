// ===== VARIÁVEIS GLOBAIS =====
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
let weeklySchedule = {};
let timeSlots = [];
let dadosCarregados = false;

// ===== VERIFICAÇÃO DE LOGIN =====
window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        // Inicializar CacheManager
        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = usuarioAtual.uid || usuarioAtual.email;
            
            console.log('[Inicio] Carregando dados da nuvem...');
            await window.CacheManager.loadFromCloud(true);
            carregarDadosDoCache();
        } else {
            carregarDadosDoLocalStorage();
        }
        
        // Se não tem dados, criar padrão
        if (tarefas.length === 0 && anotacoes.length === 0 && eventos.length === 0 && Object.keys(weeklySchedule).length === 0) {
            await criarDadosPadrao();
        }
        
        atualizarMiniPerfil();
        atualizarEstatisticasMini();
        
        // Inicializar componentes
        new Calendar();
        new CircularProgress();
        new StudyChart();
        new StudyTimer();
        
        // Escutar mudanças em tempo real
        window.addEventListener('cloudDataLoaded', (event) => {
            console.log('[Inicio] Cloud data loaded, atualizando UI');
            carregarDadosDoCache();
            atualizarEstatisticasMini();
            if (window.calendarInstance) window.calendarInstance.renderCalendar();
        });
        
        // Escutar mudanças no localStorage
        window.addEventListener('storage', (e) => {
            if (e.key && (e.key.includes('weeklySchedule') || e.key.includes('timeSlots'))) {
                console.log('[Inicio] Horário atualizado em outra aba');
                carregarDadosDoLocalStorage();
                atualizarEstatisticasMini();
            }
        });
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ===== CARREGAR DADOS DO CACHE MANAGER =====
function carregarDadosDoCache() {
    if (window.CacheManager) {
        tarefas = window.CacheManager.get('tasks', []);
        anotacoes = window.CacheManager.get('notes', []);
        eventos = window.CacheManager.get('calendarEvents', []);
        weeklySchedule = window.CacheManager.get('weeklySchedule', {});
        timeSlots = window.CacheManager.get('timeSlots', ['08:00', '09:30', '11:00', '14:00', '15:30']);
        
        // Garantir estrutura do horário
        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        dias.forEach(dia => {
            if (!weeklySchedule[dia]) weeklySchedule[dia] = [];
        });
        
        console.log('[Inicio] Dados do cache:', {
            tarefas: tarefas.length,
            anotacoes: anotacoes.length,
            eventos: eventos.length,
            horario: Object.keys(weeklySchedule).length
        });
    }
}

// ===== CARREGAR DADOS DO LOCALSTORAGE (FALLBACK) =====
function carregarDadosDoLocalStorage() {
    const userId = usuarioAtual?.uid || usuarioAtual?.email;
    
    if (userId) {
        const tarefasSalvas = localStorage.getItem(`${userId}_tasks`);
        const anotacoesSalvas = localStorage.getItem(`${userId}_notes`);
        const eventosSalvas = localStorage.getItem(`${userId}_calendarEvents`);
        const scheduleSalvo = localStorage.getItem(`${userId}_weeklySchedule`);
        const slotsSalvos = localStorage.getItem(`${userId}_timeSlots`);
        
        tarefas = tarefasSalvas ? JSON.parse(tarefasSalvas) : [];
        anotacoes = anotacoesSalvas ? JSON.parse(anotacoesSalvas) : [];
        eventos = eventosSalvas ? JSON.parse(eventosSalvas) : [];
        weeklySchedule = scheduleSalvo ? JSON.parse(scheduleSalvo) : {};
        timeSlots = slotsSalvos ? JSON.parse(slotsSalvos) : ['08:00', '09:30', '11:00', '14:00', '15:30'];
        
        // Garantir estrutura do horário
        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        dias.forEach(dia => {
            if (!weeklySchedule[dia]) weeklySchedule[dia] = [];
        });
        
        console.log('[Inicio] Dados do localStorage:', {
            tarefas: tarefas.length,
            horario: Object.keys(weeklySchedule).length
        });
    }
}

// ===== CRIAR DADOS PADRÃO =====
async function criarDadosPadrao() {
    const userId = usuarioAtual?.uid || usuarioAtual?.email;
    
    const weeklySchedulePadrao = {
        'Seg': [],
        'Ter': [],
        'Qua': [],
        'Qui': [],
        'Sex': []
    };
    
    const timeSlotsPadrao = ['08:00', '09:30', '11:00', '14:00', '15:30'];
    const tarefasPadrao = [];
    const anotacoesPadrao = [];
    const eventosPadrao = [];
    
    if (userId) {
        localStorage.setItem(`${userId}_tasks`, JSON.stringify(tarefasPadrao));
        localStorage.setItem(`${userId}_notes`, JSON.stringify(anotacoesPadrao));
        localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(eventosPadrao));
        localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedulePadrao));
        localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlotsPadrao));
    }
    
    if (window.CacheManager) {
        window.CacheManager.set('tasks', tarefasPadrao, true);
        window.CacheManager.set('notes', anotacoesPadrao, true);
        window.CacheManager.set('calendarEvents', eventosPadrao, true);
        window.CacheManager.set('weeklySchedule', weeklySchedulePadrao, true);
        window.CacheManager.set('timeSlots', timeSlotsPadrao, true);
    }
    
    tarefas = tarefasPadrao;
    anotacoes = anotacoesPadrao;
    eventos = eventosPadrao;
    weeklySchedule = weeklySchedulePadrao;
    timeSlots = timeSlotsPadrao;
    
    console.log('[Inicio] Dados padrão criados');
}

// ===== ATUALIZAR MINI PERFIL =====
function atualizarMiniPerfil() {
    if (!usuarioAtual) return;
    
    document.getElementById('miniName').textContent = usuarioAtual.nome || 'Usuário';
    document.getElementById('miniEmail').textContent = usuarioAtual.email || '';
    
    const iniciais = usuarioAtual.nome
        ? usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
        : 'U';
    const miniAvatar = document.getElementById('miniAvatar');
    if (miniAvatar) {
        miniAvatar.src = `https://ui-avatars.com/api/?name=${iniciais}&background=9333ea&color=fff&size=70`;
    }
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticasMini() {
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.completed).length;
    const percentualConclusao = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
    
    const horasEstudo = calcularHorasEstudo();
    const progressoSemanal = calcularProgressoSemanal();
    
    animateValue('statTarefas', 0, totalTarefas, 1000);
    animateValue('statConclusao', 0, percentualConclusao, 1000, '%');
    animateValue('statHoras', 0, horasEstudo, 1000, 'h');
    
    setTimeout(() => {
        const progressFill = document.getElementById('progressFill');
        const progressValue = document.getElementById('progressValue');
        if (progressFill) progressFill.style.width = progressoSemanal + '%';
        if (progressValue) progressValue.textContent = progressoSemanal + '%';
    }, 500);
    
    setTimeout(() => {
        const circularProgress = document.querySelector('.progress-ring-fill');
        if (circularProgress) {
            const radius = circularProgress.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (progressoSemanal / 100) * circumference;
            circularProgress.style.strokeDashoffset = offset;
        }
        const percentageEl = document.querySelector('.percentage');
        if (percentageEl) percentageEl.textContent = progressoSemanal + '%';
    }, 800);
}

function calcularHorasEstudo() {
    let horas = 0;
    horas += eventos.filter(e => e.type === 'aula').length * 2;
    horas += tarefas.filter(t => t.completed).length * 1.5;
    return horas || 0;
}

function calcularProgressoSemanal() {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    
    const eventosSemana = eventos.filter(e => {
        if (!e.date) return false;
        const dataEvento = new Date(e.date);
        return dataEvento >= inicioSemana && dataEvento <= fimSemana;
    });
    
    const tarefasSemana = tarefas.filter(t => {
        if (!t.date || t.completed) return false;
        const dataPrazo = new Date(t.date);
        return dataPrazo >= inicioSemana && dataPrazo <= fimSemana;
    });
    
    const totalItens = eventosSemana.length + tarefasSemana.length;
    if (totalItens === 0) return 0;
    
    const itensConcluidos = tarefas.filter(t => t.completed && t.date && new Date(t.date) >= inicioSemana && new Date(t.date) <= fimSemana).length;
    const progresso = Math.min(100, Math.round((itensConcluidos / totalItens) * 100));
    return progresso || 0;
}

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
// CALENDÁRIO
// ============================================
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.today = new Date();
        window.calendarInstance = this;
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
        
        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarDates = document.getElementById('calendarDates');
        if (!calendarDates) return;
        
        calendarDates.innerHTML = '';
        
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'date-cell empty';
            calendarDates.appendChild(emptyCell);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell';
            dateCell.textContent = day;
            
            if (year === this.today.getFullYear() && month === this.today.getMonth() && day === this.today.getDate()) {
                dateCell.classList.add('today');
            }
            
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const temEvento = eventos.some(e => e.date === dateStr);
            
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
        this.data = this.gerarDadosSemana();
        this.init();
    }
    
    gerarDadosSemana() {
        const dados = [];
        for (let i = 0; i < 7; i++) {
            dados.push(Math.floor(Math.random() * 4) + 1);
        }
        return dados;
    }
    
    init() {
        this.drawChart();
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
        
        const points = this.data.map((val, index) => {
            const x = padding + (index / (this.data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
            return `${x},${y}`;
        });
        
        const areaPoints = [
            `${padding},${height - padding}`,
            ...points,
            `${width - padding},${height - padding}`
        ].join(' ');
        
        const area = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        area.setAttribute('points', areaPoints);
        area.setAttribute('fill', 'rgba(147, 51, 234, 0.2)');
        svg.appendChild(area);
        
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
            this.carregarTimerSalvo();
        }
    }
    
    carregarTimerSalvo() {
        const timerKey = `timer_${usuarioAtual?.email}`;
        const timerSalvo = localStorage.getItem(timerKey);
        
        if (timerSalvo) {
            const timerData = JSON.parse(timerSalvo);
            const hoje = new Date().toDateString();
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
        if (window.CacheManager) window.CacheManager.logout();
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