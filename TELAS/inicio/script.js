// inicio/script.js - COMPLETO E CORRIGIDO

let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
let weeklySchedule = {};
let timeSlots = [];
let profilePhotoUnsubscribe = null;

window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        // 🔥 CRÍTICO: Inicializar sincronização ANTES de carregar dados
        if (window.initSync) {
            console.log('[Inicio] Inicializando sync...');
            await window.initSync();
        } else {
            console.warn('[Inicio] initSync não disponível!');
        }
        
        // Carregar dados do CacheManager (já sincronizado)
        carregarDadosDoCache();
        
        if (tarefas.length === 0 && anotacoes.length === 0 && eventos.length === 0 && Object.keys(weeklySchedule).length === 0) {
            await criarDadosVazios();
        }
        
        await carregarFotoPerfilDesktop();
        iniciarEscutaFotoDesktop();
        
        atualizarMiniPerfil();
        atualizarEstatisticasMini();
        atualizarFraseDoDiaDesktop();
        
        new Calendar();
        new CircularProgress();
        new StudyChart();
        new StudyTimer();
        
        if (typeof window.renderizarDisciplinas === 'undefined') {
            window.renderizarDisciplinas = function() {
                atualizarListaDisciplinas();
            };
        }
        
        window.addEventListener('cloudDataLoaded', (event) => {
            console.log('[Inicio] Cloud data loaded, atualizando UI');
            carregarDadosDoCache();
            atualizarEstatisticasMini();
            atualizarHorarioDesktop();
            atualizarListaDisciplinas();
            atualizarFraseDoDiaDesktop();
            if (window.calendarInstance) window.calendarInstance.renderCalendar();
            carregarFotoPerfilDesktop();
        });
        
        window.addEventListener('profilePhotoUpdated', (event) => {
            if (event.detail && event.detail.photoUrl) {
                console.log('[Inicio] Foto atualizada em tempo real!');
                atualizarAvatarDesktop(event.detail.photoUrl);
            }
        });
        
        // Iniciar escuta do cache
        iniciarEscutaCacheDesktop();
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

function carregarDadosDoCache() {
    if (window.CacheManager) {
        tarefas = window.CacheManager.get('tasks', []);
        anotacoes = window.CacheManager.get('notes', []);
        eventos = window.CacheManager.get('calendarEvents', []);
        weeklySchedule = window.CacheManager.get('weeklySchedule', {});
        timeSlots = window.CacheManager.get('timeSlots', ['08:00', '09:30', '11:00', '14:00', '15:30']);
        
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
        
        atualizarHorarioDesktop();
        atualizarProximasAulas();
        atualizarProximasTarefas();
        atualizarListaDisciplinas();
    }
}

async function criarDadosVazios() {
    const weeklyScheduleVazio = { 'Seg': [], 'Ter': [], 'Qua': [], 'Qui': [], 'Sex': [] };
    const timeSlotsPadrao = ['08:00', '09:30', '11:00', '14:00', '15:30'];
    const tarefasVazias = [];
    const anotacoesVazias = [];
    const eventosVazios = [];
    
    if (window.CacheManager) {
        window.CacheManager.set('tasks', tarefasVazias, true);
        window.CacheManager.set('notes', anotacoesVazias, true);
        window.CacheManager.set('calendarEvents', eventosVazios, true);
        window.CacheManager.set('weeklySchedule', weeklyScheduleVazio, true);
        window.CacheManager.set('timeSlots', timeSlotsPadrao, true);
    }
    
    tarefas = tarefasVazias;
    anotacoes = anotacoesVazias;
    eventos = eventosVazios;
    weeklySchedule = weeklyScheduleVazio;
    timeSlots = timeSlotsPadrao;
    
    console.log('[Inicio] Estrutura vazia criada');
}

function atualizarFraseDoDiaDesktop() {
    const fraseElement = document.querySelector('.focus-content p');
    if (fraseElement && window.FrasesDoDia) {
        const frase = window.FrasesDoDia.getFraseDoDia();
        fraseElement.textContent = frase;
        console.log('[Inicio Desktop] Frase do dia atualizada');
    } else if (fraseElement) {
        fraseElement.textContent = 'Não espere o momento perfeito. Aproveite o que tem e faça acontecer!';
    }
}

// ========== FUNÇÕES DE FOTO DE PERFIL ==========

async function carregarFotoPerfilDesktop() {
    if (!usuarioAtual) return;
    
    const miniAvatar = document.getElementById('miniAvatar');
    
    if (window.CacheManager) {
        const photoUrl = await window.CacheManager.getProfilePhotoUrl();
        
        if (photoUrl && photoUrl.startsWith('data:')) {
            if (miniAvatar) miniAvatar.src = photoUrl;
            usuarioAtual.profilePhotoUrl = photoUrl;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        } else {
            const iniciais = usuarioAtual.nome ? 
                usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : 'U';
            const defaultAvatar = `https://ui-avatars.com/api/?name=${iniciais}&background=9333ea&color=fff&size=70`;
            if (miniAvatar) miniAvatar.src = defaultAvatar;
        }
    }
}

function atualizarAvatarDesktop(photoUrl) {
    const miniAvatar = document.getElementById('miniAvatar');
    if (miniAvatar && photoUrl && photoUrl.startsWith('data:')) {
        miniAvatar.src = photoUrl;
    }
    if (usuarioAtual) {
        usuarioAtual.profilePhotoUrl = photoUrl;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    }
}

function iniciarEscutaFotoDesktop() {
    if (!usuarioAtual) return;
    // Implementar se necessário
}

function pararEscutaFotoDesktop() {
    if (profilePhotoUnsubscribe) {
        profilePhotoUnsubscribe();
        profilePhotoUnsubscribe = null;
    }
}

// ========== FUNÇÕES DA UI ==========

function atualizarMiniPerfil() {
    if (!usuarioAtual) return;
    const miniName = document.getElementById('miniName');
    const miniEmail = document.getElementById('miniEmail');
    if (miniName) miniName.textContent = usuarioAtual.nome || 'Usuário';
    if (miniEmail) miniEmail.textContent = usuarioAtual.email || '';
}

function atualizarEstatisticasMini() {
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.completed).length;
    const percentualConclusao = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
    
    let horasEstudo = 0;
    horasEstudo += eventos.filter(e => e.type === 'aula').length * 2;
    horasEstudo += tarefasConcluidas * 1.5;
    
    const progressoSemanal = Math.min(100, Math.round((tarefasConcluidas / (totalTarefas || 1)) * 100));
    
    const statTarefas = document.getElementById('statTarefas');
    const statConclusao = document.getElementById('statConclusao');
    const statHoras = document.getElementById('statHoras');
    const progressFill = document.getElementById('progressFill');
    const progressValue = document.getElementById('progressValue');
    const percentageEl = document.querySelector('.percentage');
    
    if (statTarefas) statTarefas.textContent = totalTarefas;
    if (statConclusao) statConclusao.textContent = percentualConclusao + '%';
    if (statHoras) statHoras.textContent = horasEstudo + 'h';
    if (progressFill) progressFill.style.width = progressoSemanal + '%';
    if (progressValue) progressValue.textContent = progressoSemanal + '%';
    if (percentageEl) percentageEl.textContent = progressoSemanal + '%';
    
    const totalHoursEl = document.getElementById('totalHours');
    if (totalHoursEl) totalHoursEl.textContent = horasEstudo + 'h';
    
    const circularProgress = document.querySelector('.progress-ring-fill');
    if (circularProgress) {
        const radius = circularProgress.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progressoSemanal / 100) * circumference;
        circularProgress.style.strokeDashoffset = offset;
    }
}

function atualizarListaDisciplinas() {
    const subjectsGrid = document.getElementById('subjectsGrid');
    if (!subjectsGrid) return;
    
    const disciplinasSet = new Set();
    
    tarefas.forEach(t => {
        const disc = t.disciplina || t.subject;
        if (disc && disc !== 'outros') {
            disciplinasSet.add(disc.toLowerCase());
        }
    });
    
    if (weeklySchedule) {
        Object.values(weeklySchedule).forEach(day => {
            if (Array.isArray(day)) {
                day.forEach(c => {
                    if (c && c.materia) {
                        disciplinasSet.add(c.materia.toLowerCase());
                    }
                });
            }
        });
    }
    
    const disciplinas = Array.from(disciplinasSet);
    
    if (disciplinas.length === 0) {
        subjectsGrid.innerHTML = '<p style="grid-column: span 2; text-align: center; padding: 20px; color: #888;">Nenhuma disciplina cadastrada</p>';
        return;
    }
    
    const cores = {
        'matemática': '#9b59b6', 'matematica': '#9b59b6',
        'português': '#3498db', 'portugues': '#3498db',
        'história': '#e74c3c', 'historia': '#e74c3c',
        'física': '#e67e22', 'fisica': '#e67e22',
        'química': '#2ecc71', 'quimica': '#2ecc71',
        'biologia': '#f1c40f', 'geografia': '#1abc9c',
        'inglês': '#34495e', 'ingles': '#34495e'
    };
    
    let html = '';
    disciplinas.forEach(disciplina => {
        const cor = cores[disciplina] || '#95a5a6';
        const nomeExibicao = disciplina.charAt(0).toUpperCase() + disciplina.slice(1);
        html += `<div class="subject-card" style="background: ${cor}20; border-left: 3px solid ${cor}; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
            <span style="color: ${cor}; font-weight: 600;">${nomeExibicao}</span>
        </div>`;
    });
    
    subjectsGrid.innerHTML = html;
    subjectsGrid.style.display = 'grid';
    subjectsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    subjectsGrid.style.gap = '10px';
}

function atualizarHorarioDesktop() {
    const scheduleTableBody = document.getElementById('scheduleTableBody');
    if (!scheduleTableBody) return;
    
    const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    const slots = timeSlots.length ? timeSlots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
    
    if (slots.length === 0 || diasSemana.every(day => !weeklySchedule[day] || weeklySchedule[day].length === 0)) {
        scheduleTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhum horário cadastrado</td></tr>';
        return;
    }
    
    let html = '';
    slots.forEach(time => {
        html += '<tr>';
        html += `<td class="time-slot">${time}</td>`;
        diasSemana.forEach(day => {
            const aula = weeklySchedule[day]?.find(a => a.horaInicio === time);
            if (aula && aula.materia) {
                const cor = aula.color || getCorByMateria(aula.materia);
                html += `<td class="subject" style="background-color: ${cor}20; color: ${cor}; border-left: 3px solid ${cor};">
                    ${aula.materia}
                </td>`;
            } else {
                html += '<td class="empty-cell"></td>';
            }
        });
        html += '</tr>';
    });
    
    scheduleTableBody.innerHTML = html;
}

function getCorByMateria(materia) {
    const cores = {
        'matemática': '#9b59b6', 'matematica': '#9b59b6',
        'português': '#3498db', 'portugues': '#3498db',
        'história': '#e74c3c', 'historia': '#e74c3c',
        'física': '#e67e22', 'fisica': '#e67e22',
        'química': '#2ecc71', 'quimica': '#2ecc71',
        'biologia': '#f1c40f', 'geografia': '#1abc9c',
        'inglês': '#34495e', 'ingles': '#34495e'
    };
    const lowerMateria = materia?.toLowerCase()?.trim() || '';
    return cores[lowerMateria] || '#95a5a6';
}

function atualizarProximasAulas() {
    const nextClassInfo = document.getElementById('nextClassInfo');
    if (!nextClassInfo) return;
    
    const agora = new Date();
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hoje = diasSemana[agora.getDay()];
    const horaAtual = agora.getHours() + ':' + String(agora.getMinutes()).padStart(2, '0');
    
    let proximaAula = null;
    
    if (weeklySchedule[hoje]) {
        proximaAula = weeklySchedule[hoje].find(a => a.horaInicio > horaAtual);
    }
    
    if (!proximaAula) {
        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        const hojeIndex = dias.indexOf(hoje);
        for (let i = 1; i <= 5; i++) {
            const nextDay = dias[(hojeIndex + i) % 5];
            if (weeklySchedule[nextDay] && weeklySchedule[nextDay].length > 0) {
                proximaAula = weeklySchedule[nextDay][0];
                proximaAula.dia = nextDay;
                break;
            }
        }
    }
    
    if (proximaAula) {
        const diaTexto = proximaAula.dia ? proximaAula.dia : 'hoje';
        nextClassInfo.textContent = `${proximaAula.materia} - ${diaTexto} às ${proximaAula.horaInicio}`;
    } else {
        nextClassInfo.textContent = 'Nenhuma aula cadastrada';
    }
}

function atualizarProximasTarefas() {
    const nextTaskInfo = document.getElementById('nextTaskInfo');
    if (!nextTaskInfo) return;
    
    const tarefasPendentes = tarefas.filter(t => !t.completed);
    if (tarefasPendentes.length > 0) {
        nextTaskInfo.textContent = `${tarefasPendentes[0].title || tarefasPendentes[0].nome} - Pendente`;
    } else {
        nextTaskInfo.textContent = 'Nenhuma tarefa pendente';
    }
}

// ========== CLASSES ==========

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
            
            calendarDates.appendChild(dateCell);
        }
    }
}

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

class StudyChart {
    constructor() {
        this.chartContainer = document.getElementById('studyChart');
        if (!this.chartContainer) return;
        this.init();
    }
    
    init() {
        this.chartContainer.innerHTML = '<canvas id="studyCanvas" width="200" height="80" style="width:100%;height:100%"></canvas>';
        this.drawChart();
        window.addEventListener('resize', () => this.drawChart());
    }
    
    drawChart() {
        const canvas = document.getElementById('studyCanvas');
        if (!canvas) return;
        
        canvas.width = canvas.offsetWidth || 200;
        canvas.height = canvas.offsetHeight || 80;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const dados = [2, 4, 3, 5, 4, 6, 3];
        const maxVal = Math.max(...dados, 5);
        const larguraBarra = (canvas.width - 40) / dados.length - 4;
        
        for (let i = 0; i < dados.length; i++) {
            const altura = (dados[i] / maxVal) * (canvas.height - 40);
            const x = 20 + i * (larguraBarra + 4);
            const y = canvas.height - 20 - altura;
            
            ctx.fillStyle = '#9333ea';
            ctx.fillRect(x, y, larguraBarra, altura);
        }
    }
}

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

// ========== ESCUTA DE CACHE ==========

function iniciarEscutaCacheDesktop() {
    if (!window.CacheManager) {
        setTimeout(iniciarEscutaCacheDesktop, 1000);
        return;
    }
    
    window.CacheManager.addListener('weeklySchedule', (newSchedule) => {
        if (newSchedule && Object.keys(newSchedule).length > 0) {
            weeklySchedule = newSchedule;
            atualizarHorarioDesktop();
            atualizarListaDisciplinas();
        }
    });
    
    window.CacheManager.addListener('timeSlots', (newSlots) => {
        if (newSlots && newSlots.length) {
            timeSlots = newSlots;
            atualizarHorarioDesktop();
        }
    });
    
    window.CacheManager.addListener('tasks', (newTasks) => {
        if (newTasks) {
            tarefas = newTasks;
            atualizarEstatisticasMini();
            atualizarProximasTarefas();
            atualizarListaDisciplinas();
        }
    });
    
    window.CacheManager.addListener('notes', (newNotes) => {
        if (newNotes) anotacoes = newNotes;
    });
    
    window.CacheManager.addListener('calendarEvents', (newEvents) => {
        if (newEvents) {
            eventos = newEvents;
            if (window.calendarInstance) window.calendarInstance.renderCalendar();
        }
    });
}

function logout() {
    if (confirm('Deseja sair?')) {
        pararEscutaFotoDesktop();
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) window.CacheManager.logout();
        window.location.href = '../login/index.html';
    }
}

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

window.addEventListener('forceRefresh', () => {
    setTimeout(() => {
        if (window.CacheManager) {
            const newSchedule = window.CacheManager.get('weeklySchedule', {});
            const newSlots = window.CacheManager.get('timeSlots', []);
            if (newSchedule && Object.keys(newSchedule).length > 0) {
                weeklySchedule = newSchedule;
                timeSlots = newSlots;
                atualizarHorarioDesktop();
            }
            atualizarEstatisticasMini();
            atualizarListaDisciplinas();
            atualizarFraseDoDiaDesktop();
        }
    }, 100);
});

console.log('%c🏠 Painel Inicial - Sincronização Corrigida!', 'color: #9333ea; font-size: 20px; font-weight: bold;');