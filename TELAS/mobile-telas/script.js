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
    console.log('[Mobile] Inicializando...');
    
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
        console.log('[Mobile] Usuário:', usuarioLogado.nome);
        
        // Atualizar nome no header
        const headerName = document.getElementById('header-name');
        if (headerName) {
            headerName.textContent = usuarioLogado.nome.split(' ')[0];
        }
        
        // Carregar dados
        await carregarTodosDados();
        
        // Sincronizar com nuvem
        await sincronizarComNuvem();
        
        // Inicializar componentes
        renderizarHorario();
        renderizarProximoEvento();
        renderizarProximasTarefas();
        renderizarNotificacoes();
        atualizarCards();
        
    } catch(e) {
        console.error('[Mobile] Erro:', e);
    }
}

// ===== CARREGAR DADOS =====
async function carregarTodosDados() {
    if (!usuarioLogado) return;
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    
    // Tentar carregar do CacheManager primeiro
    if (window.CacheManager) {
        notifications = window.CacheManager.get('notifications', []);
        weeklySchedule = window.CacheManager.get('weeklySchedule', {});
        timeSlots = window.CacheManager.get('timeSlots', ['08:00', '09:30', '11:00', '14:00', '15:30']);
        calendarEvents = window.CacheManager.get('calendarEvents', []);
        tasks = window.CacheManager.get('tasks', []);
        notes = window.CacheManager.get('notes', []);
    }
    
    // Se não tiver dados, carregar do localStorage antigo
    if (!notifications.length) {
        const notifSalvas = localStorage.getItem(`${userId}_notifications`);
        if (notifSalvas) notifications = JSON.parse(notifSalvas);
    }
    
    if (Object.keys(weeklySchedule).length === 0) {
        const scheduleSalvo = localStorage.getItem(`${userId}_weeklySchedule`);
        if (scheduleSalvo) weeklySchedule = JSON.parse(scheduleSalvo);
    }
    
    if (!timeSlots.length) {
        const slotsSalvos = localStorage.getItem(`${userId}_timeSlots`);
        if (slotsSalvos) timeSlots = JSON.parse(slotsSalvos);
    }
    
    if (!calendarEvents.length) {
        const eventosSalvos = localStorage.getItem(`${userId}_calendarEvents`);
        if (eventosSalvos) calendarEvents = JSON.parse(eventosSalvos);
    }
    
    if (!tasks.length) {
        const tasksSalvas = localStorage.getItem(`${userId}_tasks`);
        if (tasksSalvas) tasks = JSON.parse(tasksSalvas);
    }
    
    if (!notes.length) {
        const notesSalvas = localStorage.getItem(`${userId}_notes`);
        if (notesSalvas) notes = JSON.parse(notesSalvas);
    }
    
    // Garantir estrutura do horário
    days.forEach(day => {
        if (!weeklySchedule[day]) weeklySchedule[day] = [];
    });
    
    console.log('[Mobile] Dados carregados:', {
        notifications: notifications.length,
        schedule: Object.keys(weeklySchedule).length,
        events: calendarEvents.length,
        tasks: tasks.length,
        notes: notes.length
    });
}

// ===== SALVAR DADOS =====
function salvarTodosDados() {
    if (!usuarioLogado) return;
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    
    // Salvar no localStorage antigo (fallback)
    localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
    localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedule));
    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlots));
    localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(calendarEvents));
    localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
    localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
    
    // Salvar no CacheManager (que sincroniza com nuvem)
    if (window.CacheManager) {
        window.CacheManager.set('notifications', notifications, true);
        window.CacheManager.set('weeklySchedule', weeklySchedule, true);
        window.CacheManager.set('timeSlots', timeSlots, true);
        window.CacheManager.set('calendarEvents', calendarEvents, true);
        window.CacheManager.set('tasks', tasks, true);
        window.CacheManager.set('notes', notes, true);
    }
    
    console.log('[Mobile] Dados salvos');
}

// ===== SINCRONIZAR COM NUVEM =====
async function sincronizarComNuvem() {
    if (!window.CacheManager || !usuarioLogado) return;
    
    console.log('[Mobile] Sincronizando com nuvem...');
    
    try {
        window.CacheManager.currentUserId = usuarioLogado.uid || usuarioLogado.email;
        const dadosCarregados = await window.CacheManager.loadFromCloud(true);
        
        if (dadosCarregados) {
            console.log('[Mobile] ✅ Dados da nuvem carregados');
            // Recarregar dados após sync
            await carregarTodosDados();
            atualizarInterface();
        } else {
            // Se não há dados na nuvem, enviar os locais
            console.log('[Mobile] Enviando dados locais para nuvem...');
            salvarTodosDados();
        }
    } catch (error) {
        console.error('[Mobile] Erro na sincronização:', error);
    }
}

// ===== ATUALIZAR INTERFACE =====
function atualizarInterface() {
    renderizarHorario();
    renderizarProximoEvento();
    renderizarProximasTarefas();
    renderizarNotificacoes();
    atualizarCards();
    atualizarBadgeNotificacoes();
}

// ===== RENDERIZAR HORÁRIO SEMANAL =====
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
    
    // Adicionar eventos de clique
    document.querySelectorAll('.class-cell .class-block:not(.empty)').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            // Encontrar a matéria e abrir edição
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

// ===== RENDERIZAR NOTIFICAÇÕES MODAL =====
function renderizarNotificacoesModal(filtro = 'all') {
    const container = document.getElementById('notifications-list-modal');
    if (!container) return;
    
    let filtradas = [...notifications];
    if (filtro === 'unread') filtradas = notifications.filter(n => !n.read);
    else if (filtro === 'aulas') filtradas = notifications.filter(n => n.type === 'aula');
    else if (filtro === 'tarefas') filtradas = notifications.filter(n => n.type === 'tarefa');
    
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

// ===== FUNÇÃO PARA MARCAR TODAS COMO LIDAS =====
function marcarTodasComoLidas() {
    notifications.forEach(n => n.read = true);
    salvarTodosDados();
    atualizarBadgeNotificacoes();
    renderizarNotificacoes();
    renderizarNotificacoesModal();
    showToast('Todas notificações marcadas como lidas!', 'success');
}

// ===== FUNÇÃO PARA LIMPAR TODAS NOTIFICAÇÕES =====
function limparTodasNotificacoes() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmado) => {
        if (confirmado) {
            notifications = [];
            salvarTodosDados();
            atualizarBadgeNotificacoes();
            renderizarNotificacoes();
            renderizarNotificacoesModal();
            showToast('Notificações limpas!', 'success');
        }
    });
}

// ===== ATUALIZAR BADGE DE NOTIFICAÇÕES =====
function atualizarBadgeNotificacoes() {
    const badge = document.getElementById('notification-badge');
    const naoLidas = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
}

// ===== ADICIONAR NOTIFICAÇÃO =====
function adicionarNotificacao(titulo, mensagem, tipo = 'info') {
    const novaNotificacao = {
        id: Date.now(),
        title: titulo,
        message: mensagem,
        type: tipo,
        read: false,
        time: new Date().toISOString()
    };
    
    notifications.unshift(novaNotificacao);
    salvarTodosDados();
    atualizarBadgeNotificacoes();
    renderizarNotificacoes();
    
    // Notificação nativa se for app Android
    if (typeof Android !== 'undefined') {
        try {
            Android.showNotification(titulo, mensagem, tipo);
        } catch(e) {}
    }
    
    return novaNotificacao;
}

// ===== ATUALIZAR CARDS =====
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
    
    if (cardDisciplinas) cardDisciplinas.textContent = materias.size;
    if (cardConcluidas) cardConcluidas.textContent = concluidas;
    if (cardPendentes) cardPendentes.textContent = pendentes;
}

// ===== ABRIR MODAL DE EDIÇÃO =====
function openEditModal() {
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        editModal.classList.add('active');
        renderizarEditSchedule();
    }
}

function closeEditModal() {
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        editModal.classList.remove('active');
        renderizarHorario();
        atualizarCards();
    }
}

function renderizarEditSchedule() {
    const grid = document.getElementById('edit-schedule-grid');
    if (!grid) return;
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);
    
    timeSlots.forEach(time => {
        html += `<div class="time-slot">
            ${time}
            <button class="btn-delete-row" data-time="${time}">
                <ion-icon name="trash-outline"></ion-icon>
            </button>
        </div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem) {
                html += `<div class="edit-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color}" data-day="${day}" data-time="${time}">
                        ${escapeHtml(classItem.materia)}<br><small>${classItem.horaInicio}</small>
                    </div>
                </div>`;
            } else {
                html += `<div class="edit-cell">
                    <button class="btn-add" data-day="${day}" data-time="${time}">+</button>
                </div>`;
            }
        });
    });
    
    grid.innerHTML = html;
    
    // Eventos de deleção de horário
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const time = btn.dataset.time;
            showConfirm(`Remover horário ${time}?`, 'Excluir Horário', (confirmado) => {
                if (confirmado) {
                    timeSlots = timeSlots.filter(t => t !== time);
                    days.forEach(day => {
                        if (weeklySchedule[day]) {
                            weeklySchedule[day] = weeklySchedule[day].filter(c => c.horaInicio !== time);
                        }
                    });
                    salvarTodosDados();
                    renderizarEditSchedule();
                    showToast('Horário removido!', 'success');
                }
            });
        });
    });
    
    // Eventos de edição de matéria
    document.querySelectorAll('.edit-cell .class-block').forEach(block => {
        block.addEventListener('click', (e) => {
            e.stopPropagation();
            const day = block.dataset.day;
            const time = block.dataset.time;
            const subject = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (subject) openSubjectModal(subject, day, time);
        });
    });
    
    // Eventos de adição
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.dataset.day;
            const time = btn.dataset.time;
            openSubjectModal(null, day, time);
        });
    });
}

function openSubjectModal(subject, day, time) {
    const modal = document.getElementById('subject-modal');
    const title = document.getElementById('subject-modal-title');
    const nameInput = document.getElementById('subject-name-input');
    const teacherInput = document.getElementById('subject-teacher-input');
    const startInput = document.getElementById('subject-start-input');
    const endInput = document.getElementById('subject-end-input');
    const dayInput = document.getElementById('subject-day-input');
    
    if (!modal) return;
    
    editingSubject = subject;
    if (dayInput) dayInput.value = day;
    
    if (subject) {
        title.textContent = 'Editar Matéria';
        if (nameInput) nameInput.value = subject.materia;
        if (teacherInput) teacherInput.value = subject.professor || '';
        if (startInput) startInput.value = subject.horaInicio;
        if (endInput) endInput.value = subject.horaFim || '';
        selectedSubjectColor = subject.color;
    } else {
        title.textContent = 'Adicionar Matéria';
        if (nameInput) nameInput.value = '';
        if (teacherInput) teacherInput.value = '';
        if (startInput) startInput.value = time;
        if (endInput) endInput.value = '';
        selectedSubjectColor = '#6366f1';
    }
    
    document.querySelectorAll('#subject-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedSubjectColor);
    });
    
    modal.classList.add('active');
}

function saveSubject() {
    const name = document.getElementById('subject-name-input')?.value.trim();
    const teacher = document.getElementById('subject-teacher-input')?.value.trim();
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
    if (endTime <= startTime) {
        showToast('Término deve ser depois do início!', 'error');
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
        professor: teacher,
        color: selectedSubjectColor,
        horaInicio: startTime,
        horaFim: endTime
    });
    
    weeklySchedule[day].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    
    salvarTodosDados();
    
    document.getElementById('subject-modal').classList.remove('active');
    showToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
    
    const editModal = document.getElementById('edit-modal');
    if (editModal && editModal.classList.contains('active')) {
        renderizarEditSchedule();
    } else {
        renderizarHorario();
    }
    atualizarCards();
}

function addNewTimeSlot() {
    const newTime = document.getElementById('new-time-input')?.value;
    if (!newTime) {
        showToast('Selecione um horário!', 'error');
        return;
    }
    if (timeSlots.includes(newTime)) {
        showToast('Este horário já existe!', 'error');
        return;
    }
    
    timeSlots.push(newTime);
    timeSlots.sort();
    salvarTodosDados();
    document.getElementById('new-time-input').value = '11:00';
    renderizarEditSchedule();
    showToast('Horário adicionado!', 'success');
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

function showConfirm(message, title, callback) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) {
        callback(confirm(message));
        return;
    }
    
    document.getElementById('confirm-title').textContent = title || 'Confirmar';
    document.getElementById('confirm-message').textContent = message;
    modal.classList.add('active');
    
    const handleConfirm = () => {
        modal.classList.remove('active');
        callback(true);
        cleanup();
    };
    
    const handleCancel = () => {
        modal.classList.remove('active');
        callback(false);
        cleanup();
    };
    
    const cleanup = () => {
        document.getElementById('confirm-ok').removeEventListener('click', handleConfirm);
        document.getElementById('confirm-cancel').removeEventListener('click', handleCancel);
    };
    
    document.getElementById('confirm-ok').onclick = handleConfirm;
    document.getElementById('confirm-cancel').onclick = handleCancel;
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

// ===== SWITCH VIEW =====
function switchView(viewName) {
    if (viewName === 'home') {
        // Já está na home
    } else if (viewName === 'calendar') {
        window.location.href = '../calendario/index.html';
    } else if (viewName === 'tasks') {
        window.location.href = '../tarefas/index.html';
    } else if (viewName === 'notes') {
        window.location.href = '../notas/index.html';
    } else if (viewName === 'profile') {
        window.location.href = '../perfil/index.html';
    }
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Deseja realmente sair da sua conta?')) {
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) {
            window.CacheManager.clearAllCache();
        }
        window.location.href = '../../login/index.html';
    }
}

// ===== EVENTOS =====
document.addEventListener('DOMContentLoaded', () => {
    inicializar();
    
    // Botões
    document.getElementById('toggle-edit-mode')?.addEventListener('click', openEditModal);
    document.getElementById('btn-back')?.addEventListener('click', closeEditModal);
    document.getElementById('btn-save')?.addEventListener('click', closeEditModal);
    document.getElementById('btn-add-time')?.addEventListener('click', addNewTimeSlot);
    document.getElementById('btn-cancel-time')?.addEventListener('click', () => {
        document.getElementById('new-time-input').value = '11:00';
    });
    document.getElementById('btn-save-subject')?.addEventListener('click', saveSubject);
    
    // Fechar modal de matéria
    document.querySelector('[data-modal="subject-modal"]')?.addEventListener('click', () => {
        document.getElementById('subject-modal').classList.remove('active');
    });
    
    // Cores no modal de matéria
    document.querySelectorAll('#subject-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#subject-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedSubjectColor = option.dataset.color;
        });
    });
    
    // Notificações
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
    
    // Tabs de notificações
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderizarNotificacoesModal(tab.dataset.type);
        });
    });
    
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
});

console.log('%c📱 Mobile - Painel do Aluno', 'color: #8b5cf6; font-size: 20px; font-weight: bold;');
console.log('%cSistema carregado com sucesso!', 'color: #10b981; font-size: 14px;');