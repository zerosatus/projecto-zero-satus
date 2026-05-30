// ===== VARIÁVEIS GLOBAIS =====
let usuarioLogado = null;
let notifications = [];
let weeklySchedule = {};
let timeSlots = [];
let calendarEvents = [];
let tasks = [];
let notes = [];
let editingSubject = null;
let selectedSubjectColor = '#6366f1';
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

// ===== INICIALIZAÇÃO =====
async function inicializar() {
    console.log('[Mobile] 🚀 Inicializando aplicação...');
    
    // Inicializar CacheManager
    if (window.CacheManager) {
        window.CacheManager.init();
        console.log('[Mobile] CacheManager inicializado');
    }
    
    // Carregar usuário
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    try {
        usuarioLogado = JSON.parse(usuarioSalvo);
        console.log('[Mobile] 👤 Usuário:', usuarioLogado.nome);
        console.log('[Mobile] 📧 Email:', usuarioLogado.email);
        
        // ✅ DEFINIR USER ID NO CACHEMANAGER (CRÍTICO!)
        const userId = usuarioLogado.uid || usuarioLogado.email;
        if (window.CacheManager) {
            window.CacheManager.setCurrentUser(userId);
            console.log('[Mobile] ✅ CacheManager configurado para:', userId);
        }
        
        // Atualizar nome no header
        const headerName = document.getElementById('header-name');
        if (headerName) {
            headerName.textContent = usuarioLogado.nome.split(' ')[0];
        }
        
        // ✅ PRIMEIRO: Tentar carregar dados da nuvem
        const dadosDaNuvem = await carregarDadosDaNuvem();
        
        if (!dadosDaNuvem) {
            // Se não tem dados na nuvem, usar dados locais (se existirem)
            console.log('[Mobile] ℹ️ Nenhum dado na nuvem, usando dados locais');
            await carregarTodosDados();
            
            // Se houver dados locais, enviar para nuvem
            if (tasks.length > 0 || notes.length > 0 || calendarEvents.length > 0) {
                console.log('[Mobile] 📤 Enviando dados locais para nuvem...');
                await salvarTodosDados();
            }
        }
        
        // ✅ SEGUNDO: Renderizar interface
        renderizarHorario();
        renderizarProximoEvento();
        renderizarProximasTarefas();
        renderizarNotificacoes();
        atualizarCards();
        atualizarBadgeNotificacoes();
        
        // ✅ TERCEIRO: Iniciar escuta em tempo real
        if (window.initSync) {
            await window.initSync();
            console.log('[Mobile] ✅ Sincronização em tempo real ativada');
        }
        
        // Escutar eventos de refresh
        window.addEventListener('dataRefreshed', () => {
            console.log('[Mobile] DataRefreshed detectado, atualizando UI');
            atualizarInterface();
        });
        
        window.addEventListener('cloudDataLoaded', (event) => {
            console.log('[Mobile] CloudDataLoaded detectado, atualizando UI');
            atualizarInterface();
        });
        
        console.log('[Mobile] ✅ Aplicação inicializada com sucesso!');
        
    } catch(e) {
        console.error('[Mobile] ❌ Erro na inicialização:', e);
    }
}

// ===== CARREGAR DADOS DA NUVEM PRIMEIRO =====
async function carregarDadosDaNuvem() {
    if (!window.CacheManager || !usuarioLogado) {
        console.log('[Mobile] CacheManager ou usuário não disponível');
        return false;
    }
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    console.log('[Mobile] 🔍 Buscando dados na nuvem para:', userId);
    
    try {
        // Tentar carregar da nuvem com timeout
        const dadosCarregados = await Promise.race([
            window.CacheManager.loadFromCloud(true),
            new Promise(resolve => setTimeout(() => resolve(null), 5000))
        ]);
        
        if (dadosCarregados === true) {
            console.log('[Mobile] ✅ Dados carregados da nuvem com sucesso!');
            await carregarTodosDados();
            return true;
        } else if (dadosCarregados === false) {
            console.log('[Mobile] ℹ️ Nenhum dado encontrado na nuvem');
            return false;
        } else {
            console.log('[Mobile] ⏰ Timeout carregando da nuvem, usando dados locais');
            return false;
        }
    } catch (error) {
        console.error('[Mobile] ❌ Erro ao carregar da nuvem:', error);
        return false;
    }
}

// ===== CARREGAR TODOS OS DADOS =====
async function carregarTodosDados() {
    if (!usuarioLogado) return;
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    
    // Tentar carregar do CacheManager primeiro
    if (window.CacheManager) {
        const cachedNotes = window.CacheManager.get('notes', null);
        const cachedTasks = window.CacheManager.get('tasks', null);
        const cachedEvents = window.CacheManager.get('calendarEvents', null);
        const cachedSchedule = window.CacheManager.get('weeklySchedule', null);
        const cachedSlots = window.CacheManager.get('timeSlots', null);
        const cachedNotif = window.CacheManager.get('notifications', null);
        
        if (cachedNotes !== null) notes = cachedNotes;
        if (cachedTasks !== null) tasks = cachedTasks;
        if (cachedEvents !== null) calendarEvents = cachedEvents;
        if (cachedSchedule !== null) weeklySchedule = cachedSchedule;
        if (cachedSlots !== null) timeSlots = cachedSlots;
        if (cachedNotif !== null) notifications = cachedNotif;
    }
    
    // Fallback para localStorage antigo (apenas se CacheManager não tiver dados)
    if (!notes.length && !tasks.length && !calendarEvents.length) {
        const notifSalvas = localStorage.getItem(`${userId}_notifications`);
        if (notifSalvas) notifications = JSON.parse(notifSalvas);
        
        const scheduleSalvo = localStorage.getItem(`${userId}_weeklySchedule`);
        if (scheduleSalvo) weeklySchedule = JSON.parse(scheduleSalvo);
        
        const slotsSalvos = localStorage.getItem(`${userId}_timeSlots`);
        if (slotsSalvos) timeSlots = JSON.parse(slotsSalvos);
        
        const eventosSalvos = localStorage.getItem(`${userId}_calendarEvents`);
        if (eventosSalvos) calendarEvents = JSON.parse(eventosSalvos);
        
        const tasksSalvas = localStorage.getItem(`${userId}_tasks`);
        if (tasksSalvas) tasks = JSON.parse(tasksSalvas);
        
        const notesSalvas = localStorage.getItem(`${userId}_notes`);
        if (notesSalvas) notes = JSON.parse(notesSalvas);
    }
    
    // Garantir valores padrão
    if (!timeSlots.length) timeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30'];
    if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) {
        weeklySchedule = { 'Seg': [], 'Ter': [], 'Qua': [], 'Qui': [], 'Sex': [] };
    }
    
    // Garantir estrutura do horário
    days.forEach(day => {
        if (!weeklySchedule[day]) weeklySchedule[day] = [];
    });
    
    console.log('[Mobile] 📦 Dados carregados:', {
        notifications: notifications.length,
        schedule: Object.keys(weeklySchedule).length,
        timeSlots: timeSlots.length,
        events: calendarEvents.length,
        tasks: tasks.length,
        notes: notes.length
    });
}

// ===== SALVAR TODOS OS DADOS =====
async function salvarTodosDados() {
    if (!usuarioLogado) return;
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    
    // Salvar no localStorage (fallback)
    localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
    localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedule));
    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlots));
    localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(calendarEvents));
    localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
    localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
    
    // Salvar no CacheManager (que sincroniza com nuvem)
    if (window.CacheManager && window.CacheManager.isUserLoggedIn()) {
        window.CacheManager.set('notifications', notifications, true);
        window.CacheManager.set('weeklySchedule', weeklySchedule, true);
        window.CacheManager.set('timeSlots', timeSlots, true);
        window.CacheManager.set('calendarEvents', calendarEvents, true);
        window.CacheManager.set('tasks', tasks, true);
        window.CacheManager.set('notes', notes, true);
        console.log('[Mobile] ✅ Dados salvos e enviados para nuvem');
    } else {
        console.log('[Mobile] ⚠️ CacheManager não disponível, salvando apenas local');
        // Tentar novamente em 2 segundos
        setTimeout(() => {
            if (window.CacheManager && window.CacheManager.isUserLoggedIn()) {
                salvarTodosDados();
            }
        }, 2000);
    }
}

// ===== ATUALIZAR INTERFACE =====
function atualizarInterface() {
    console.log('[Mobile] 🔄 Atualizando interface...');
    renderizarHorario();
    renderizarProximoEvento();
    renderizarProximasTarefas();
    renderizarNotificacoes();
    atualizarCards();
    atualizarBadgeNotificacoes();
}

// ===== RENDERIZAR HORÁRIO =====
function renderizarHorario() {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);
    
    timeSlots.forEach(time => {
        html += `<div class="time-slot">${time}</div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem) {
                html += `<div class="class-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color}">
                        ${escapeHtml(classItem.materia)}<br><small>${classItem.horaInicio}</small>
                    </div>
                </div>`;
            } else {
                html += `<div class="class-cell"><div class="class-block empty">+</div></div>`;
            }
        });
    });
    
    grid.innerHTML = html;
    
    // Adicionar event listeners
    document.querySelectorAll('.class-cell .class-block:not(.empty)').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const cellDiv = cell.closest('.class-cell');
            const rowIndex = Array.from(cellDiv.parentElement.children).indexOf(cellDiv);
            const timeIndex = Math.floor((rowIndex - 1) / 6);
            const dayIndex = (rowIndex - 1) % 6;
            
            if (timeIndex >= 0 && dayIndex >= 0 && dayIndex < days.length) {
                const time = timeSlots[timeIndex];
                const day = days[dayIndex];
                const subject = weeklySchedule[day]?.find(c => c.horaInicio === time);
                if (subject) openSubjectModal(subject, day, time);
            }
        });
    });
    
    document.querySelectorAll('.class-cell .class-block.empty').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const cellDiv = cell.closest('.class-cell');
            const rowIndex = Array.from(cellDiv.parentElement.children).indexOf(cellDiv);
            const timeIndex = Math.floor((rowIndex - 1) / 6);
            const dayIndex = (rowIndex - 1) % 6;
            
            if (timeIndex >= 0 && dayIndex >= 0 && dayIndex < days.length) {
                const time = timeSlots[timeIndex];
                const day = days[dayIndex];
                openSubjectModal(null, day, time);
            }
        });
    });
}

// ===== RENDERIZAR PRÓXIMO EVENTO =====
function renderizarProximoEvento() {
    const container = document.getElementById('next-event-container');
    if (!container) return;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const eventosFuturos = calendarEvents
        .filter(e => e.date && e.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);
    
    if (eventosFuturos.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="calendar-outline"></ion-icon></div><div class="item-info"><div class="item-title">Sem eventos próximos</div><div class="item-subtitle">Adicione um evento no calendário 📅</div></div></div>';
        return;
    }
    
    let html = '';
    eventosFuturos.forEach(event => {
        const [year, month, day] = event.date.split('-');
        const dateFormatted = `${day}/${month}`;
        html += `<div class="list-item" data-id="${event.id}" onclick="window.location.href='../calendario/index.html'">
            <div class="item-icon" style="background-color: ${event.color}20; color: ${event.color}">
                <ion-icon name="calendar-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(event.title)}</div>
                <div class="item-subtitle">${dateFormatted} • ${event.start}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    container.innerHTML = html;
}

// ===== RENDERIZAR PRÓXIMAS TAREFAS =====
function renderizarProximasTarefas() {
    const container = document.getElementById('next-tasks-container');
    if (!container) return;
    
    const tarefasPendentes = tasks.filter(t => !t.completed).slice(0, 3);
    
    if (tarefasPendentes.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="checkmark-circle-outline"></ion-icon></div><div class="item-info"><div class="item-title">Tudo em dia!</div><div class="item-subtitle">Nenhuma tarefa pendente ✨</div></div></div>';
        return;
    }
    
    let html = '';
    tarefasPendentes.forEach(task => {
        html += `<div class="list-item" data-id="${task.id}" onclick="window.location.href='../tarefas/index.html'">
            <div class="item-icon" style="background-color: ${task.color}20; color: ${task.color}">
                <ion-icon name="checkbox-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(task.title)}</div>
                <div class="item-subtitle">${escapeHtml(task.subject || 'Geral')} • ${task.date || 'Sem data'}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    container.innerHTML = html;
}

// ===== RENDERIZAR NOTIFICAÇÕES =====
function renderizarNotificacoes() {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    const notificacoesNaoLidas = notifications.filter(n => !n.read).slice(0, 3);
    
    if (notificacoesNaoLidas.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon notification"><ion-icon name="checkmark-circle-outline"></ion-icon></div><div class="item-info"><div class="item-title">Tudo em dia!</div><div class="item-subtitle">Nenhuma notificação pendente ✨</div></div></div>';
        return;
    }
    
    let html = '';
    notificacoesNaoLidas.forEach(notif => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="list-item" data-id="${notif.id}">
            <div class="item-icon notification" style="background-color: #8b5cf6; color: white">
                <ion-icon name="${iconMap[notif.type] || 'notifications'}-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(notif.title)}</div>
                <div class="item-subtitle">${escapeHtml(notif.message)}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    container.innerHTML = html;
}

// ===== FUNÇÕES AUXILIARES =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
    toast.innerHTML = `<ion-icon name="${icons[type]}-outline"></ion-icon> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function atualizarBadgeNotificacoes() {
    const badge = document.getElementById('notification-badge');
    const naoLidas = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
}

function atualizarCards() {
    const materias = new Set();
    Object.values(weeklySchedule).forEach(day => {
        day.forEach(c => { if (c.materia) materias.add(c.materia.toLowerCase()); });
    });
    
    const concluidas = tasks.filter(t => t.completed).length;
    const pendentes = tasks.filter(t => !t.completed).length;
    
    const cardDisciplinas = document.getElementById('card-disciplinas');
    const cardConcluidas = document.getElementById('card-concluidas');
    const cardPendentes = document.getElementById('card-pendentes');
    
    if (cardDisciplinas) cardDisciplinas.textContent = materias.size || 0;
    if (cardConcluidas) cardConcluidas.textContent = concluidas;
    if (cardPendentes) cardPendentes.textContent = pendentes;
}

// ===== RENDERIZAR NOTIFICAÇÕES MODAL =====
function renderizarNotificacoesModal(filter = 'all') {
    const container = document.getElementById('notifications-list-modal');
    if (!container) return;
    
    let filtradas = [...notifications];
    if (filter === 'unread') filtradas = notifications.filter(n => !n.read);
    else if (filter === 'aulas') filtradas = notifications.filter(n => n.type === 'aula');
    else if (filter === 'tarefas') filtradas = notifications.filter(n => n.type === 'tarefa');
    
    if (filtradas.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)">Nenhuma notificação</div>';
        return;
    }
    
    let html = '';
    filtradas.forEach(notif => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                <ion-icon name="${iconMap[notif.type] || 'notifications'}-outline"></ion-icon>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                <div class="notification-time">${formatarTempoAtras(notif.time)}</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function formatarTempoAtras(timeString) {
    if (!timeString) return '';
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMins = Math.floor((now - notifTime) / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    return notifTime.toLocaleDateString('pt-BR');
}

function marcarTodasComoLidas() {
    notifications.forEach(n => n.read = true);
    salvarTodosDados();
    atualizarBadgeNotificacoes();
    renderizarNotificacoes();
    renderizarNotificacoesModal();
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function limparTodasNotificacoes() {
    if (confirm('Limpar todas as notificações?')) {
        notifications = [];
        salvarTodosDados();
        atualizarBadgeNotificacoes();
        renderizarNotificacoes();
        renderizarNotificacoesModal();
        showToast('Notificações limpas!', 'success');
    }
}

function renderizarEditSchedule() {
    const grid = document.getElementById('edit-schedule-grid');
    if (!grid) return;
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);
    
    timeSlots.forEach(time => {
        html += `<div class="time-slot">${time}</div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem) {
                html += `<div class="edit-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color}">${escapeHtml(classItem.materia)}</div>
                </div>`;
            } else {
                html += `<div class="edit-cell"><button class="btn-add">+</button></div>`;
            }
        });
    });
    grid.innerHTML = html;
}

function openSubjectModal(subject, day, time) {
    console.log('Abrir modal para:', subject, day, time);
}

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', () => {
    inicializar();
    
    // Eventos dos botões
    document.getElementById('toggle-edit-mode')?.addEventListener('click', () => {
        document.getElementById('edit-modal').classList.add('active');
        renderizarEditSchedule();
    });
    
    document.getElementById('btn-back')?.addEventListener('click', () => {
        document.getElementById('edit-modal').classList.remove('active');
    });
    
    document.getElementById('btn-save')?.addEventListener('click', () => {
        document.getElementById('edit-modal').classList.remove('active');
        renderizarHorario();
    });
    
    document.getElementById('btn-add-time')?.addEventListener('click', () => {
        const newTime = document.getElementById('new-time-input')?.value;
        if (newTime && !timeSlots.includes(newTime)) {
            timeSlots.push(newTime);
            timeSlots.sort();
            salvarTodosDados();
            renderizarEditSchedule();
            showToast('Horário adicionado!', 'success');
        } else if (timeSlots.includes(newTime)) {
            showToast('Este horário já existe!', 'error');
        } else {
            showToast('Selecione um horário!', 'error');
        }
    });
    
    document.getElementById('btn-cancel-time')?.addEventListener('click', () => {
        document.getElementById('new-time-input').value = '11:00';
    });
    
    document.getElementById('btn-save-subject')?.addEventListener('click', () => {
        const name = document.getElementById('subject-name-input')?.value.trim();
        const startTime = document.getElementById('subject-start-input')?.value;
        const endTime = document.getElementById('subject-end-input')?.value;
        const day = document.getElementById('subject-day-input')?.value;
        
        if (!name) {
            showToast('Preencha o nome da matéria!', 'error');
            return;
        }
        if (!startTime || !endTime) {
            showToast('Defina início e término!', 'error');
            return;
        }
        
        if (!weeklySchedule[day]) weeklySchedule[day] = [];
        
        if (editingSubject) {
            const oldStart = editingSubject.horaInicio;
            weeklySchedule[day] = weeklySchedule[day].filter(c => !(c.materia === editingSubject.materia && c.horaInicio === oldStart));
        }
        
        if (!timeSlots.includes(startTime)) {
            timeSlots.push(startTime);
            timeSlots.sort();
        }
        
        weeklySchedule[day].push({
            materia: name,
            professor: document.getElementById('subject-teacher-input')?.value.trim() || '',
            color: selectedSubjectColor,
            horaInicio: startTime,
            horaFim: endTime
        });
        
        weeklySchedule[day].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        salvarTodosDados();
        document.getElementById('subject-modal').classList.remove('active');
        showToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
        
        if (document.getElementById('edit-modal').classList.contains('active')) {
            renderizarEditSchedule();
        } else {
            renderizarHorario();
        }
        atualizarCards();
        editingSubject = null;
    });
    
    document.querySelector('[data-modal="subject-modal"]')?.addEventListener('click', () => {
        document.getElementById('subject-modal').classList.remove('active');
        editingSubject = null;
    });
    
    document.querySelectorAll('#subject-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#subject-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedSubjectColor = option.dataset.color;
        });
    });
    
    document.getElementById('notification-bell')?.addEventListener('click', () => {
        const modal = document.getElementById('notifications-modal');
        if (modal) {
            modal.classList.add('active');
            renderizarNotificacoesModal();
        }
    });
    
    document.getElementById('notification-bell-link')?.addEventListener('click', () => {
        const modal = document.getElementById('notifications-modal');
        if (modal) {
            modal.classList.add('active');
            renderizarNotificacoesModal();
        }
    });
    
    document.getElementById('btn-close-notifications')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.remove('active');
    });
    
    document.getElementById('btn-mark-read')?.addEventListener('click', marcarTodasComoLidas);
    document.getElementById('btn-clear-all')?.addEventListener('click', limparTodasNotificacoes);
    
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderizarNotificacoesModal(tab.dataset.type);
        });
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (view === 'home') {
                // já está na home
            } else if (view === 'calendar') {
                window.location.href = './calendario/index.html';
            } else if (view === 'tasks') {
                window.location.href = './tarefas/index.html';
            } else if (view === 'notes') {
                window.location.href = './notas/index.html';
            } else if (view === 'profile') {
                window.location.href = './perfil/index.html';
            }
        });
    });
});

console.log('%c📱 Mobile - Versão Sincronizada', 'color: #10b981; font-size: 16px; font-weight: bold;');
console.log('%c✅ Sincronização entre dispositivos ATIVADA!', 'color: #8b5cf6; font-size: 14px;');