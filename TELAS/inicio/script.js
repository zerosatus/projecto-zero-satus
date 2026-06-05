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
        
        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = usuarioAtual.uid || usuarioAtual.email;
            console.log('[Inicio] Carregando dados da nuvem...');
            await window.CacheManager.loadFromCloud(true);
            carregarDadosDoCache();
        } else {
            carregarDadosDoLocalStorage();
        }
        
        if (tarefas.length === 0 && anotacoes.length === 0 && eventos.length === 0 && Object.keys(weeklySchedule).length === 0) {
            await criarDadosVazios();
        }
        
        await carregarFotoPerfilDesktop();
        iniciarEscutaFotoDesktop();
        
        atualizarMiniPerfil();
        atualizarEstatisticasMini();
        
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
            if (window.calendarInstance) window.calendarInstance.renderCalendar();
            carregarFotoPerfilDesktop();
        });
        
        window.addEventListener('profilePhotoUpdated', (event) => {
            if (event.detail && event.detail.photoUrl) {
                console.log('[Inicio] Foto atualizada em tempo real!');
                atualizarAvatarDesktop(event.detail.photoUrl);
            }
        });
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ========== FUNÇÕES DE FOTO DE PERFIL PARA DESKTOP ==========

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
    } else {
        if (usuarioAtual.avatar && usuarioAtual.avatar.startsWith('data:')) {
            if (miniAvatar) miniAvatar.src = usuarioAtual.avatar;
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
    
    const userId = usuarioAtual.uid || usuarioAtual.email;
    
    if (window.FirebaseStorage && window.FirebaseStorage.listenProfilePhoto) {
        profilePhotoUnsubscribe = window.FirebaseStorage.listenProfilePhoto(userId, (photoUrl) => {
            if (photoUrl && photoUrl.startsWith('data:')) {
                console.log('[Inicio Desktop] Foto atualizada em tempo real!');
                atualizarAvatarDesktop(photoUrl);
            }
        });
    }
}

function pararEscutaFotoDesktop() {
    if (profilePhotoUnsubscribe) {
        profilePhotoUnsubscribe();
        profilePhotoUnsubscribe = null;
    }
}

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
        
        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        dias.forEach(dia => {
            if (!weeklySchedule[dia]) weeklySchedule[dia] = [];
        });
    }
}

async function criarDadosVazios() {
    const userId = usuarioAtual?.uid || usuarioAtual?.email;
    
    const weeklyScheduleVazio = { 'Seg': [], 'Ter': [], 'Qua': [], 'Qui': [], 'Sex': [] };
    const timeSlotsPadrao = ['08:00', '09:30', '11:00', '14:00', '15:30'];
    const tarefasVazias = [];
    const anotacoesVazias = [];
    const eventosVazios = [];
    
    if (userId) {
        localStorage.setItem(`${userId}_tasks`, JSON.stringify(tarefasVazias));
        localStorage.setItem(`${userId}_notes`, JSON.stringify(anotacoesVazias));
        localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(eventosVazios));
        localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklyScheduleVazio));
        localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlotsPadrao));
    }
    
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
    
    const progressoSemanal = calcularProgressoSemanal();
    
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
    
    const totalItens = eventosSemana.length;
    if (totalItens === 0) return 0;
    
    return 0;
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
    
    console.log('[Inicio] Lista de disciplinas atualizada:', disciplinas.length);
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
                const materiaClass = getMateriaClass(aula.materia);
                const cor = aula.color || getCorByMateria(aula.materia);
                html += `<td class="subject ${materiaClass}" style="background-color: ${cor}20; color: ${cor}; border-left: 3px solid ${cor};">
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

function getMateriaClass(materia) {
    const mapa = {
        'matemática': 'matematica', 'matematica': 'matematica',
        'português': 'portugues', 'portugues': 'portugues',
        'física': 'fisica', 'fisica': 'fisica',
        'química': 'quimica', 'quimica': 'quimica',
        'história': 'historia', 'historia': 'historia',
        'geografia': 'geografia', 'biologia': 'biologia',
        'inglês': 'ingles', 'ingles': 'ingles',
        'redação': 'redacao', 'redacao': 'redacao'
    };
    const lowerMateria = materia?.toLowerCase()?.trim() || '';
    return mapa[lowerMateria] || 'outros';
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

console.log('%c🏠 Painel Inicial', 'color: #9333ea; font-size: 20px; font-weight: bold;');

// ===== ESCUTAR MUDANÇAS EM TEMPO REAL DO CACHE =====
// NÃO declarar variáveis que já existem (usuarioLogado, tarefas, anotacoes, eventos, weeklySchedule, timeSlots)

function iniciarEscutaCacheDesktop() {
    if (!window.CacheManager) {
        console.log('[Desktop] Aguardando CacheManager...');
        setTimeout(iniciarEscutaCacheDesktop, 1000);
        return;
    }
    
    console.log('[Desktop] Iniciando escuta de cache...');
    
    window.CacheManager.addListener('weeklySchedule', (newSchedule) => {
        if (newSchedule && Object.keys(newSchedule).length > 0) {
            console.log('[Desktop] Horário atualizado em tempo real!');
            // Usar a variável global existente
            window.weeklySchedule = newSchedule;
            if (typeof atualizarHorarioDesktop === 'function') {
                atualizarHorarioDesktop();
            }
            if (typeof atualizarListaDisciplinas === 'function') {
                atualizarListaDisciplinas();
            }
            if (typeof window.forcarRecargaHorarioDesktop === 'function') {
                window.forcarRecargaHorarioDesktop();
            }
        }
    });
    
    window.CacheManager.addListener('timeSlots', (newSlots) => {
        if (newSlots && newSlots.length) {
            console.log('[Desktop] Horários atualizados em tempo real!');
            window.timeSlots = newSlots;
            if (typeof atualizarHorarioDesktop === 'function') {
                atualizarHorarioDesktop();
            }
            if (typeof window.forcarRecargaHorarioDesktop === 'function') {
                window.forcarRecargaHorarioDesktop();
            }
        }
    });
    
    window.CacheManager.addListener('tasks', (newTasks) => {
        if (newTasks) {
            console.log('[Desktop] Tarefas atualizadas em tempo real!');
            window.tarefas = newTasks;
            if (typeof atualizarEstatisticasMini === 'function') {
                atualizarEstatisticasMini();
            }
            if (typeof atualizarProximasTarefas === 'function') {
                atualizarProximasTarefas();
            }
        }
    });
    
    window.CacheManager.addListener('notes', (newNotes) => {
        if (newNotes) {
            console.log('[Desktop] Anotações atualizadas em tempo real!');
            window.anotacoes = newNotes;
        }
    });
    
    window.CacheManager.addListener('calendarEvents', (newEvents) => {
        if (newEvents) {
            console.log('[Desktop] Eventos atualizados em tempo real!');
            window.eventos = newEvents;
            if (window.calendarInstance && typeof window.calendarInstance.renderCalendar === 'function') {
                window.calendarInstance.renderCalendar();
            }
        }
    });
    
    console.log('[Desktop] Escuta de cache iniciada com sucesso');
}

// Escutar evento de força de refresh
window.addEventListener('forceRefresh', () => {
    console.log('[Desktop] ForceRefresh recebido, recarregando dados...');
    setTimeout(() => {
        if (window.CacheManager) {
            const newSchedule = window.CacheManager.get('weeklySchedule', {});
            const newSlots = window.CacheManager.get('timeSlots', []);
            if (newSchedule && Object.keys(newSchedule).length > 0) {
                window.weeklySchedule = newSchedule;
                window.timeSlots = newSlots;
                if (typeof atualizarHorarioDesktop === 'function') {
                    atualizarHorarioDesktop();
                }
                if (typeof window.forcarRecargaHorarioDesktop === 'function') {
                    window.forcarRecargaHorarioDesktop();
                }
            }
            if (typeof atualizarEstatisticasMini === 'function') {
                atualizarEstatisticasMini();
            }
            if (typeof atualizarListaDisciplinas === 'function') {
                atualizarListaDisciplinas();
            }
        }
    }, 100);
});

// Escutar mudanças no storage (quando outra aba salva dados)
window.addEventListener('storage', (e) => {
    if (e.key && (e.key.includes('weeklySchedule') || e.key.includes('timeSlots'))) {
        console.log('[Desktop] Storage event detectado:', e.key);
        setTimeout(() => {
            if (window.CacheManager) {
                const newSchedule = window.CacheManager.get('weeklySchedule', {});
                const newSlots = window.CacheManager.get('timeSlots', []);
                if (newSchedule && Object.keys(newSchedule).length > 0) {
                    window.weeklySchedule = newSchedule;
                    window.timeSlots = newSlots;
                    if (typeof atualizarHorarioDesktop === 'function') {
                        atualizarHorarioDesktop();
                    }
                }
            }
            if (typeof window.forcarRecargaHorarioDesktop === 'function') {
                window.forcarRecargaHorarioDesktop();
            }
            if (window.refreshAllData) window.refreshAllData();
        }, 100);
    }
});

// Iniciar escuta após o carregamento da página
setTimeout(iniciarEscutaCacheDesktop, 2000);

console.log('%c🖥️ Desktop com sincronização em tempo real', 'color: #9333ea; font-size: 16px; font-weight: bold;');