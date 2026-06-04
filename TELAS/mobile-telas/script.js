// mobile-telas/script.js - VERSÃO OTIMIZADA COM PRÉ-CARREGAMENTO

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

// ===== INICIALIZAÇÃO RÁPIDA COM FASTINIT =====
window.fastInit('Mobile', {
    onInit: async () => {
        console.log('[Mobile] 🚀 Inicialização rápida...');
        
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (!usuarioSalvo) {
            window.location.href = '../../login/index.html';
            return false;
        }
        
        usuarioLogado = JSON.parse(usuarioSalvo);
        
        // Carregar dados instantâneos do preload
        const cachedNotes = window.getFastData('notes', []);
        const cachedTasks = window.getFastData('tasks', []);
        const cachedEvents = window.getFastData('calendarEvents', []);
        const cachedSchedule = window.getFastData('weeklySchedule', {});
        const cachedSlots = window.getFastData('timeSlots', []);
        const cachedNotif = window.getFastData('notifications', []);
        
        // Atribuir dados (já prontos!)
        notes = cachedNotes;
        tasks = cachedTasks;
        calendarEvents = cachedEvents;
        weeklySchedule = cachedSchedule;
        timeSlots = cachedSlots.length ? cachedSlots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
        notifications = cachedNotif;
        
        // Garantir estrutura mínima
        days.forEach(day => {
            if (!weeklySchedule[day]) weeklySchedule[day] = [];
        });
        
        // Atualizar UI imediatamente
        const headerName = document.getElementById('header-name');
        if (headerName && usuarioLogado.nome) {
            headerName.textContent = usuarioLogado.nome.split(' ')[0];
        }
        
        // Iniciar escuta em tempo real (opcional, em background)
        setTimeout(() => {
            if (window.CacheManager && window.CacheManager.startRealtimeSync) {
                window.CacheManager.startRealtimeSync();
            }
        }, 500);
        
        console.log('[Mobile] ✅ Dados carregados:', {
            notes: notes.length,
            tasks: tasks.length,
            events: calendarEvents.length
        });
        
        return true;
    },
    onRender: () => {
        console.log('[Mobile] 🎨 Renderizando interface...');
        renderizarHorario();
        renderizarProximoEvento();
        renderizarProximasTarefas();
        renderizarNotificacoes();
        atualizarCards();
        atualizarBadgeNotificacoes();
        atualizarAvatarMobile();
    }
});

// ===== FUNÇÕES EXISTENTES (MANTIDAS, MAS OTIMIZADAS) =====

async function atualizarAvatarMobile(photoUrl = null) {
    const profileIcon = document.getElementById('notification-bell');
    if (!profileIcon) return;
    
    if (photoUrl && photoUrl.startsWith('data:')) {
        profileIcon.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        return;
    }
    
    if (window.CacheManager && usuarioLogado) {
        const cachedPhotoUrl = await window.CacheManager.getProfilePhotoUrl();
        if (cachedPhotoUrl && cachedPhotoUrl.startsWith('data:')) {
            profileIcon.innerHTML = `<img src="${cachedPhotoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else if (usuarioLogado.nome) {
            const iniciais = usuarioLogado.nome.charAt(0).toUpperCase();
            profileIcon.innerHTML = `<span style="font-weight:bold;">${iniciais}</span>`;
        }
    } else if (usuarioLogado && usuarioLogado.nome) {
        const iniciais = usuarioLogado.nome.charAt(0).toUpperCase();
        profileIcon.innerHTML = `<span style="font-weight:bold;">${iniciais}</span>`;
    }
}

// ===== FUNÇÕES DE RENDERIZAÇÃO (OTIMIZADAS) =====

function renderizarHorario() {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    
    if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) {
        grid.innerHTML = '<div style="grid-column:span 6;text-align:center;padding:40px;">Carregando horário...</div>';
        return;
    }
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);
    
    const slots = timeSlots.length ? timeSlots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
    
    slots.forEach(time => {
        html += `<div class="time-slot">${time}</div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem && classItem.materia) {
                html += `<div class="class-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color || '#6366f1'}">
                        ${escapeHtml(classItem.materia)}<br><small>${classItem.horaInicio}</small>
                    </div>
                </div>`;
            } else {
                html += `<div class="class-cell"><div class="class-block empty">+</div></div>`;
            }
        });
    });
    
    grid.innerHTML = html;
    
    // Event listeners (delegados para performance)
    document.querySelectorAll('.class-cell .class-block:not(.empty)').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const cellDiv = cell.closest('.class-cell');
            const rowIndex = Array.from(cellDiv.parentElement.children).indexOf(cellDiv);
            const slotsList = timeSlots.length ? timeSlots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
            const timeIndex = Math.floor((rowIndex - 1) / 6);
            const dayIndex = (rowIndex - 1) % 6;
            
            if (timeIndex >= 0 && dayIndex >= 0 && dayIndex < days.length) {
                const timeSlot = slotsList[timeIndex];
                const day = days[dayIndex];
                const subject = weeklySchedule[day]?.find(c => c.horaInicio === timeSlot);
                openSubjectModal(subject, day, timeSlot);
            }
        });
    });
    
    document.querySelectorAll('.class-cell .class-block.empty').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const cellDiv = cell.closest('.class-cell');
            const rowIndex = Array.from(cellDiv.parentElement.children).indexOf(cellDiv);
            const slotsList = timeSlots.length ? timeSlots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
            const timeIndex = Math.floor((rowIndex - 1) / 6);
            const dayIndex = (rowIndex - 1) % 6;
            
            if (timeIndex >= 0 && dayIndex >= 0 && dayIndex < days.length) {
                const timeSlot = slotsList[timeIndex];
                const day = days[dayIndex];
                openSubjectModal(null, day, timeSlot);
            }
        });
    });
}

function renderizarProximasTarefas() {
    const container = document.getElementById('next-tasks-container');
    if (!container) return;
    
    const tarefasPendentes = (tasks || []).filter(t => !t.completed).slice(0, 3);
    
    if (tarefasPendentes.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="checkmark-circle-outline"></ion-icon></div><div class="item-info"><div class="item-title">Tudo em dia!</div><div class="item-subtitle">Nenhuma tarefa pendente ✨</div></div></div>';
        return;
    }
    
    let html = '';
    tarefasPendentes.forEach(task => {
        html += `<div class="list-item" data-id="${task.id}" onclick="window.location.href='./tarefas/index.html'">
            <div class="item-icon" style="background-color: ${task.color || '#8b5cf6'}20; color: ${task.color || '#8b5cf6'}">
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

function renderizarProximoEvento() {
    const container = document.getElementById('next-event-container');
    if (!container) return;
    
    if (!calendarEvents || calendarEvents.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="calendar-outline"></ion-icon></div><div class="item-info"><div class="item-title">Sem eventos próximos</div><div class="item-subtitle">Adicione um evento no calendário 📅</div></div></div>';
        return;
    }
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const eventosFuturos = calendarEvents
        .filter(e => e.date && e.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);
    
    if (eventosFuturos.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="calendar-outline"></ion-icon></div><div class="item-info"><div class="item-title">Sem eventos futuros</div><div class="item-subtitle">Todos os eventos estão no passado</div></div></div>';
        return;
    }
    
    let html = '';
    eventosFuturos.forEach(event => {
        const [year, month, day] = event.date.split('-');
        const dateFormatted = `${day}/${month}`;
        html += `<div class="list-item" data-id="${event.id}" onclick="window.location.href='./calendario/index.html'">
            <div class="item-icon" style="background-color: ${event.color || '#8b5cf6'}20; color: ${event.color || '#8b5cf6'}">
                <ion-icon name="calendar-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(event.title)}</div>
                <div class="item-subtitle">${dateFormatted} • ${event.start || '--:--'}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderizarNotificacoes() {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    const notificacoesNaoLidas = (notifications || []).filter(n => !n.read).slice(0, 3);
    
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

function atualizarCards() {
    const materias = new Set();
    if (weeklySchedule) {
        Object.values(weeklySchedule).forEach(day => {
            if (Array.isArray(day)) {
                day.forEach(c => { if (c && c.materia) materias.add(c.materia.toLowerCase()); });
            }
        });
    }
    
    const concluidas = (tasks || []).filter(t => t.completed).length;
    const pendentes = (tasks || []).filter(t => !t.completed).length;
    
    const cardDisciplinas = document.getElementById('card-disciplinas');
    const cardConcluidas = document.getElementById('card-concluidas');
    const cardPendentes = document.getElementById('card-pendentes');
    
    if (cardDisciplinas) cardDisciplinas.textContent = materias.size || 0;
    if (cardConcluidas) cardConcluidas.textContent = concluidas;
    if (cardPendentes) cardPendentes.textContent = pendentes;
}

function atualizarBadgeNotificacoes() {
    const badge = document.getElementById('notification-badge');
    const naoLidas = (notifications || []).filter(n => !n.read).length;
    if (badge) {
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== FUNÇÕES DE MODAL =====

function openSubjectModal(subject, day, time) {
    editingSubject = subject;
    const modal = document.getElementById('subject-modal');
    if (!modal) return;
    
    if (subject) {
        document.getElementById('subject-modal-title').textContent = 'Editar Matéria';
        document.getElementById('subject-name-input').value = subject.materia || '';
        document.getElementById('subject-teacher-input').value = subject.professor || '';
        document.getElementById('subject-start-input').value = subject.horaInicio || '';
        document.getElementById('subject-end-input').value = subject.horaFim || '';
        document.getElementById('subject-day-input').value = day;
        selectedSubjectColor = subject.color || '#6366f1';
    } else {
        document.getElementById('subject-modal-title').textContent = 'Adicionar Matéria';
        document.getElementById('subject-name-input').value = '';
        document.getElementById('subject-teacher-input').value = '';
        document.getElementById('subject-start-input').value = time;
        document.getElementById('subject-end-input').value = '';
        document.getElementById('subject-day-input').value = day;
        selectedSubjectColor = '#6366f1';
    }
    
    document.querySelectorAll('#subject-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedSubjectColor);
    });
    
    modal.classList.add('active');
}

async function salvarMateria() {
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
    
    await salvarTodosDados();
    
    document.getElementById('subject-modal').classList.remove('active');
    showToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
    
    if (document.getElementById('edit-modal').classList.contains('active')) {
        renderizarEditSchedule();
    } else {
        renderizarHorario();
    }
    atualizarCards();
    editingSubject = null;
}

async function salvarTodosDados() {
    if (!usuarioLogado) return;
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    
    // Salvar localmente
    localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedule));
    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlots));
    localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
    localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
    localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(calendarEvents));
    localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
    
    // Salvar via CacheManager (em background, não bloqueia)
    if (window.CacheManager && window.CacheManager.isUserLoggedIn()) {
        window.CacheManager.set('weeklySchedule', weeklySchedule || {}, true);
        window.CacheManager.set('timeSlots', timeSlots || [], true);
        window.CacheManager.set('tasks', tasks || [], true);
        window.CacheManager.set('notes', notes || [], true);
        window.CacheManager.set('calendarEvents', calendarEvents || [], true);
        window.CacheManager.set('notifications', notifications || [], true);
    }
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

function renderizarEditSchedule() {
    const grid = document.getElementById('edit-schedule-grid');
    if (!grid) return;
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);
    
    const slots = timeSlots.length ? timeSlots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
    
    slots.forEach(time => {
        html += `<div class="time-slot">${time}</div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem) {
                html += `<div class="edit-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color || '#6366f1'}">${escapeHtml(classItem.materia)}</div>
                </div>`;
            } else {
                html += `<div class="edit-cell"><button class="btn-add">+</button></div>`;
            }
        });
    });
    grid.innerHTML = html;
}

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

// ===== EVENTOS E NAVEGAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    // Configurar event listeners (não bloqueia o fastInit)
    
    const toggleEdit = document.getElementById('toggle-edit-mode');
    if (toggleEdit) {
        toggleEdit.addEventListener('click', () => {
            document.getElementById('edit-modal').classList.add('active');
            renderizarEditSchedule();
        });
    }
    
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            document.getElementById('edit-modal').classList.remove('active');
        });
    }
    
    const btnSave = document.getElementById('btn-save');
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            document.getElementById('edit-modal').classList.remove('active');
            renderizarHorario();
            salvarTodosDados();
        });
    }
    
    const btnAddTime = document.getElementById('btn-add-time');
    if (btnAddTime) {
        btnAddTime.addEventListener('click', () => {
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
    }
    
    const btnCancelTime = document.getElementById('btn-cancel-time');
    if (btnCancelTime) {
        btnCancelTime.addEventListener('click', () => {
            document.getElementById('new-time-input').value = '11:00';
        });
    }
    
    const btnSaveSubject = document.getElementById('btn-save-subject');
    if (btnSaveSubject) {
        btnSaveSubject.addEventListener('click', salvarMateria);
    }
    
    const closeSubjectModal = document.querySelector('[data-modal="subject-modal"]');
    if (closeSubjectModal) {
        closeSubjectModal.addEventListener('click', () => {
            document.getElementById('subject-modal').classList.remove('active');
            editingSubject = null;
        });
    }
    
    document.querySelectorAll('#subject-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#subject-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedSubjectColor = option.dataset.color;
        });
    });
    
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            const modal = document.getElementById('notifications-modal');
            if (modal) {
                modal.classList.add('active');
                renderizarNotificacoesModal();
            }
        });
    }
    
    const notificationLink = document.getElementById('notification-bell-link');
    if (notificationLink) {
        notificationLink.addEventListener('click', () => {
            const modal = document.getElementById('notifications-modal');
            if (modal) {
                modal.classList.add('active');
                renderizarNotificacoesModal();
            }
        });
    }
    
    const closeNotifBtn = document.getElementById('btn-close-notifications');
    if (closeNotifBtn) {
        closeNotifBtn.addEventListener('click', () => {
            document.getElementById('notifications-modal').classList.remove('active');
        });
    }
    
    const markReadBtn = document.getElementById('btn-mark-read');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', marcarTodasComoLidas);
    }
    
    const clearAllBtn = document.getElementById('btn-clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', limparTodasNotificacoes);
    }
    
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
            if (view === 'calendar') {
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

// ===== NOTIFICAÇÕES NATIVAS =====
function isAndroidApp() {
    return typeof Android !== 'undefined';
}

function sendNativeNotification(title, message, type) {
    if (isAndroidApp()) {
        try {
            Android.showNotification(title, message, type);
        } catch(e) {}
    }
}

function checkPendingTasks() {
    const localTasks = tasks.length ? tasks : (window.getCached ? window.getCached('tasks', []) : []);
    const today = new Date().toISOString().split('T')[0];
    localTasks.forEach(task => {
        if (!task.completed && task.date === today) {
            sendNativeNotification('📋 Tarefa Hoje', task.title, 'tarefa');
        }
    });
}

function checkUpcomingClasses() {
    const schedule = weeklySchedule;
    const now = new Date();
    const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = daysMap[now.getDay()];
    const currentTotal = now.getHours() * 60 + now.getMinutes();
    
    (schedule[today] || []).forEach(cls => {
        if (cls.horaInicio) {
            const [h, m] = cls.horaInicio.split(':').map(Number);
            const minutesUntil = (h * 60 + m) - currentTotal;
            if (minutesUntil <= 15 && minutesUntil > 0) {
                sendNativeNotification('📚 Aula em Breve', cls.materia, 'aula');
            }
        }
    });
}

// Executar verificações em background
setTimeout(() => { checkPendingTasks(); checkUpcomingClasses(); }, 3000);
setInterval(() => { checkPendingTasks(); checkUpcomingClasses(); }, 15 * 60 * 1000);

console.log('%c📱 Mobile Otimizado - Pré-carregamento Ativo', 'color: #10b981; font-size: 16px; font-weight: bold;');