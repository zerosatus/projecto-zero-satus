// ========== VERIFICAR LOGIN ==========
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    const userData = JSON.parse(usuario);
    const titulo = document.querySelector('h1, h2');
    if (titulo && userData.nome) {
        titulo.textContent = `Bem-vindo, ${userData.nome}!`;
    }
});

// ========== LOGOUT ==========
function logout() {
    if (confirm('Deseja sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

// ========== MENU ATIVO ==========
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// ============================================
// CALENDÁRIO
// ============================================
class Calendar {
    constructor() {
        this.currentDate = new Date(2025, 8, 1);
        this.today = new Date();
        this.events = {
            '2025-09-10': 'Aula de Matemática',
            '2025-09-15': 'Entregar Redação',
            '2025-09-20': 'Prova de Física',
            '2025-09-25': 'Trabalho de História'
        };
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
        
        for (let i = 0; i < firstDay; i++) {
            calendarDates.appendChild(document.createElement('div'));
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell';
            dateCell.textContent = day;
            
            if (year === this.today.getFullYear() && month === this.today.getMonth() && day === this.today.getDate()) {
                dateCell.classList.add('today');
            }
            
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (this.events[dateKey]) {
                dateCell.classList.add('has-event');
                dateCell.title = this.events[dateKey];
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
        setTimeout(() => {
            this.setProgress(75);
        }, 300);
    }
    
    setProgress(percent) {
        const offset = this.circumference - (percent / 100) * this.circumference;
        this.circle.style.strokeDashoffset = offset;
        document.querySelector('.percentage').textContent = `${percent}%`;
    }
}

// ============================================
// GRÁFICO DE ESTUDO
// ============================================
class StudyChart {
    constructor() {
        this.chartContainer = document.getElementById('studyChart');
        if (!this.chartContainer) return;
        this.data = [3, 5, 4, 6, 5, 7, 6];
        this.init();
    }
    
    init() { this.drawChart(); }
    
    drawChart() {
        const width = this.chartContainer.offsetWidth || 200;
        const height = this.chartContainer.offsetHeight || 80;
        const padding = 10;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        const maxVal = Math.max(...this.data);
        const minVal = Math.min(...this.data);
        const range = maxVal - minVal || 1;
        
        const points = this.data.map((val, index) => {
            const x = padding + (index / (this.data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(' ');
        
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', points);
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('stroke', '#9333ea');
        polyline.setAttribute('stroke-width', '3');
        polyline.setAttribute('stroke-linecap', 'round');
        
        svg.appendChild(polyline);
        this.chartContainer.innerHTML = '';
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
        }
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
        this.btnStart.style.backgroundColor = '#e74c3c';
        this.interval = setInterval(() => {
            this.seconds++;
            this.updateDisplay();
        }, 1000);
    }
    
    pauseTimer() {
        this.isActive = false;
        clearInterval(this.interval);
        this.btnStart.innerHTML = '<i class="fas fa-play"></i> Continuar Sessão';
        this.btnStart.style.backgroundColor = '';
    }
    
    updateDisplay() {
        const h = Math.floor(this.seconds / 3600);
        const m = Math.floor((this.seconds % 3600) / 60);
        const s = this.seconds % 60;
        this.btnStart.innerHTML = `<i class="fas fa-pause"></i> ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
    new CircularProgress();
    new StudyChart();
    new StudyTimer();
});
// ===== ATUALIZAR DADOS DO MINI PERFIL =====
function atualizarMiniPerfil() {
    const usuario = localStorage.getItem('usuarioLogado');
    if (usuario) {
        try {
            const userData = JSON.parse(usuario);
            
            // Atualizar nome e email
            if (userData.nome) {
                document.getElementById('miniName').textContent = userData.nome;
            }
            if (userData.email) {
                document.getElementById('miniEmail').textContent = userData.email;
            }
            
            // Atualizar avatar se existir
            if (userData.avatar) {
                document.getElementById('miniAvatar').src = userData.avatar;
            }
        } catch (e) {
            console.error('Erro ao carregar mini perfil:', e);
        }
    }
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticasMini() {
    // Simular dados - em produção, viriam do backend/localStorage
    const stats = {
        tarefas: 156,
        conclusao: 89,
        horasEstudo: 45,
        progressoSemanal: 75
    };
    
    // Atualizar valores com animação
    animateValue('statTarefas', 0, stats.tarefas, 1000);
    animateValue('statConclusao', 0, stats.conclusao, 1000, '%');
    animateValue('statHoras', 0, stats.horasEstudo, 1000, 'h');
    
    // Atualizar barra de progresso
    setTimeout(() => {
        document.getElementById('progressFill').style.width = stats.progressoSemanal + '%';
        document.getElementById('progressValue').textContent = stats.progressoSemanal + '%';
    }, 500);
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

// ===== CHAMAR FUNÇÕES AO CARREGAR =====
window.addEventListener('DOMContentLoaded', () => {
    atualizarMiniPerfil();
    atualizarEstatisticasMini();
    
    // ... resto do código existente
});