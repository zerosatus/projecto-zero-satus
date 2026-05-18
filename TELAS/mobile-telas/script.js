// Página Principal - Dashboard (CORRIGIDO)
let notifications = [];
let weeklySchedule = {};
let timeSlots = [];
let calendarEvents = [];
let tasks = [];
let notes = [];
let usuarioLogado = null;
let editingSubject = null;
let selectedSubjectColor = '#6366f1';
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
let syncInProgress = false;

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
    if (!modal) { callback(false); return; }
    
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
    
    document.getElementById('confirm-ok').addEventListener('click', handleConfirm);
    document.getElementById('confirm-cancel').addEventListener('click', handleCancel);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadUserData() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) return;
    try {
        const user = JSON.parse(usuarioSalvo);
        if (!usuarioLogado) usuarioLogado = {};
        usuarioLogado.nome = user.nome || user.displayName || user.email?.split('@')[0] || 'Usuário';
        usuarioLogado.email = user.email;
        usuarioLogado.uid = user.uid;
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = usuarioLogado.nome.split(' ')[0];
    } catch(e) { console.error('Erro ao carregar usuário:', e); }
}

async function loadFromCloud() {
    if (syncInProgress) return;
    syncInProgress = true;
    try {
        showToast('Sincronizando dados da nuvem...', 'info', 2000);
        const loaded = await window.CacheManager.loadFromCloud();
        if (loaded) {
            notifications = window.getCached('notifications', []);
            weeklySchedule = window.getCached('weeklySchedule', {});
            timeSlots = window.getCached('timeSlots', []);
            calendarEvents = window.getCached('calendarEvents', []);
            tasks = window.getCached('tasks', []);
            notes = window.getCached('notes', []);
            days.forEach(day => { if (!weeklySchedule[day]) weeklySchedule[day] = []; });
            refreshHomeData();
            showToast('Dados sincronizados!', 'success');
        }
    } catch (error) {
        console.error('Erro ao sincronizar:', error);
    } finally {
        syncInProgress = false;
    }
}

async function forceSync() {
    if (!usuarioLogado || !usuarioLogado.uid) { showToast('Faça login primeiro!', 'error'); return; }
    if (syncInProgress) { showToast('Sincronização já em andamento...', 'info'); return; }
    syncInProgress = true;
    try {
        showToast('Enviando dados para a nuvem...', 'info');
        const allData = {
            usuarioLogado, notifications, weeklySchedule, timeSlots, calendarEvents, tasks, notes
        };
        if (window.FirebaseSync) {
            const result = await window.FirebaseSync.syncAllDataToCloud(usuarioLogado.uid, allData);
            showToast(result ? '✅ Dados sincronizados com sucesso!' : '❌ Erro ao sincronizar dados', result ? 'success' : 'error');
        } else { showToast('Firebase não disponível', 'error'); }
    } catch (error) {
        console.error('Erro na sincronização:', error);
        showToast('Erro ao sincronizar dados', 'error');
    } finally { syncInProgress = false; }
}
window.forceSync = forceSync;

function saveAllData() {
    if (!usuarioLogado || !usuarioLogado.uid) return;
    window.setCached('usuarioLogado', usuarioLogado);
    window.setCached('notifications', notifications);
    window.setCached('weeklySchedule', weeklySchedule);
    window.setCached('timeSlots', timeSlots);
    window.setCached('calendarEvents', calendarEvents);
    window.setCached('tasks', tasks);
    window.setCached('notes', notes);
}

function loadAllData() {
    try {
        usuarioLogado = window.getCached('usuarioLogado', null);
        // ⚠️ NÃO REDIRECIONAR AQUI - apenas carregar dados ou criar dados padrão
        if (!usuarioLogado || !usuarioLogado.email) {
            console.log('⚠️ Usuário não encontrado no cache, usando dados padrão');
            // Criar dados padrão temporários para evitar loop
            usuarioLogado = {
                nome: 'Usuário',
                email: 'usuario@temp.com',
                uid: 'temp_' + Date.now()
            };
        }
        loadUserData();
        notifications = window.getCached('notifications', []);
        weeklySchedule = window.getCached('weeklySchedule', {});
        timeSlots = window.getCached('timeSlots', ['08:00', '09:30', '11:00', '14:00', '15:30']);
        calendarEvents = window.getCached('calendarEvents', []);
        tasks = window.getCached('tasks', []);
        notes = window.getCached('notes', []);
        days.forEach(day => { if (!weeklySchedule[day]) weeklySchedule[day] = []; });
        console.log('✅ Dados carregados localmente');
        refreshHomeData();
    } catch (error) { console.error('❌ Erro ao carregar dados:', error); }
}

function updateSummaryCards() {
    const materias = new Set();
    Object.values(weeklySchedule).forEach(day => {
        day.forEach(c => { if (c.materia) materias.add(c.materia.toLowerCase()); });
    });
    const disciplinas = materias.size;
    const concluidas = tasks.filter(t => t.completed).length;
    const pendentes = tasks.filter(t => !t.completed).length;
    const cardDisciplinas = document.getElementById('card-disciplinas');
    const cardConcluidas = document.getElementById('card-concluidas');
    const cardPendentes = document.getElementById('card-pendentes');
    if (cardDisciplinas) cardDisciplinas.textContent = disciplinas;
    if (cardConcluidas) cardConcluidas.textContent = concluidas;
    if (cardPendentes) cardPendentes.textContent = pendentes;
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function renderNotificationsModal(filter = 'all') {
    const list = document.getElementById('notifications-list-modal');
    if (!list) return;
    let filtered = [...notifications];
    if (filter === 'unread') filtered = notifications.filter(n => !n.read);
    else if (filter === 'aulas') filtered = notifications.filter(n => n.type === 'aula');
    else if (filter === 'tarefas') filtered = notifications.filter(n => n.type === 'tarefa');
    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)">Nenhuma notificação</div>';
        return;
    }
    let html = '';
    filtered.forEach(notif => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                <ion-icon name="${iconMap[notif.type] || 'notifications'}-outline"></ion-icon>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                <div class="notification-time">${formatTime(notif.time)}</div>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function formatTime(timeString) {
    if (!timeString) return '';
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMins = Math.floor((now - notifTime) / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    return notifTime.toLocaleDateString('pt-BR');
}

function renderNotificationsDynamic() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    const unreadNotifications = notifications.filter(n => !n.read).slice(0, 3);
    if (unreadNotifications.length === 0) {
        list.innerHTML = '<div class="list-item"><div class="item-icon notification"><ion-icon name="checkmark-circle-outline"></ion-icon></div><div class="item-info"><div class="item-title">Tudo em dia!</div><div class="item-subtitle">Nenhuma notificação pendente ✨</div></div></div>';
        return;
    }
    let html = '';
    unreadNotifications.forEach(item => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="list-item" data-id="${item.id}">
            <div class="item-icon" style="background-color: var(--accent-purple); color: white">
                <ion-icon name="${iconMap[item.type] || 'notifications'}-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(item.title)}</div>
                <div class="item-subtitle">${escapeHtml(item.message)}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    list.innerHTML = html;
}

function renderNextEvent() {
    const container = document.getElementById('next-event-container');
    if (!container) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sortedEvents = [...calendarEvents]
        .filter(e => e.date && e.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);
    if (sortedEvents.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="calendar-outline"></ion-icon></div><div class="item-info"><div class="item-title">Sem eventos próximos</div><div class="item-subtitle">Adicione um evento no calendário 📅</div></div></div>';
        return;
    }
    let html = '';
    sortedEvents.forEach(event => {
        const [year, month, day] = event.date.split('-');
        const dateFormatted = `${day}/${month}`;
        html += `<div class="list-item" data-id="${event.id}">
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

function renderNextTasks() {
    const container = document.getElementById('next-tasks-container');
    if (!container) return;
    const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 3);
    if (upcomingTasks.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="checkmark-circle-outline"></ion-icon></div><div class="item-info"><div class="item-title">Tudo em dia!</div><div class="item-subtitle">Nenhuma tarefa pendente ✨</div></div></div>';
        return;
    }
    let html = '';
    upcomingTasks.forEach(task => {
        html += `<div class="list-item" data-id="${task.id}">
            <div class="item-icon" style="background-color: ${task.color}20; color: ${task.color}">
                <ion-icon name="checkbox-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(task.title)}</div>
                <div class="item-subtitle">${escapeHtml(task.subject || 'Geral')} • ${task.date}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderSchedule() {
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
}

function openEditModal() {
    const editModal = document.getElementById('edit-modal');
    if (editModal) { editModal.classList.add('active'); renderEditSchedule(); }
}

function closeEditModal() {
    const editModal = document.getElementById('edit-modal');
    if (editModal) { editModal.classList.remove('active'); renderSchedule(); updateSummaryCards(); }
}

function renderEditSchedule() {
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
                    <div class="class-block subject-custom" style="background-color: ${classItem.color}">
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
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const time = btn.dataset.time;
            showConfirm(`Remover horário ${time}?`, 'Excluir Horário', (confirmed) => {
                if (confirmed) {
                    timeSlots = timeSlots.filter(t => t !== time);
                    days.forEach(day => {
                        if (weeklySchedule[day]) weeklySchedule[day] = weeklySchedule[day].filter(c => c.horaInicio !== time);
                    });
                    saveAllData();
                    renderEditSchedule();
                    showToast('Horário removido!', 'success');
                }
            });
        });
    });
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => openSubjectModal(null, btn.dataset.day, btn.dataset.time));
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
    if (!name) { showToast('Preencha o nome da matéria!', 'error'); return; }
    if (!startTime || !endTime) { showToast('Defina início e término!', 'error'); return; }
    if (endTime <= startTime) { showToast('Término deve ser depois do início!', 'error'); return; }
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
    saveAllData();
    updateSummaryCards();
    document.getElementById('subject-modal').classList.remove('active');
    showToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
    const editModal = document.getElementById('edit-modal');
    if (editModal && editModal.classList.contains('active')) { renderEditSchedule(); } else { renderSchedule(); }
}

function addNewTimeSlot() {
    const newTime = document.getElementById('new-time-input')?.value;
    if (!newTime) { showToast('Selecione um horário!', 'error'); return; }
    if (timeSlots.includes(newTime)) { showToast('Este horário já existe!', 'error'); return; }
    timeSlots.push(newTime);
    timeSlots.sort();
    saveAllData();
    document.getElementById('new-time-input').value = '11:00';
    renderEditSchedule();
    showToast('Horário adicionado!', 'success');
}

function switchView(viewName) {
    console.log('Mudando para:', viewName);
    if (viewName === 'home') {
        notifications = window.getCached('notifications', window.getDefaultNotifications());
        weeklySchedule = window.getCached('weeklySchedule', window.getDefaultWeeklySchedule());
        timeSlots = window.getCached('timeSlots', window.getDefaultTimeSlots());
        calendarEvents = window.getCached('calendarEvents', window.getDefaultCalendarEvents());
        tasks = window.getCached('tasks', window.getDefaultTasks());
        notes = window.getCached('notes', window.getDefaultNotes());
        days.forEach(day => { if (!weeklySchedule[day]) weeklySchedule[day] = []; });
        refreshHomeData();
    } else if (viewName === 'calendar') {
        window.location.href = 'calendario/index.html';
    } else if (viewName === 'tasks') {
        window.location.href = 'tarefas/index.html';
    } else if (viewName === 'notes') {
        window.location.href = 'notas/index.html';
    } else if (viewName === 'profile') {
        window.location.href = 'perfil/index.html';
    }
}

function refreshHomeData() {
    updateSummaryCards();
    renderSchedule();
    renderNextEvent();
    renderNextTasks();
    renderNotificationsDynamic();
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationsModal();
    window.setCached('notifications', notifications);
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            window.setCached('notifications', notifications);
            showToast('Notificações limpas!', 'success');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard inicializando...');
    if (window.CacheManager) { window.CacheManager.init(); console.log('✅ CacheManager inicializado'); }
    else { console.error('❌ CacheManager não encontrado!'); }
    
    loadAllData();
    
    if (usuarioLogado) {
        const nomeExibicao = usuarioLogado.nome || usuarioLogado.displayName || usuarioLogado.email?.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
    }
    
    updateNotificationBadge();
    refreshHomeData();
    
    document.getElementById('notification-bell')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.add('active');
        renderNotificationsModal();
    });
    document.getElementById('notification-bell-link')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.add('active');
        renderNotificationsModal();
    });
    document.getElementById('btn-close-notifications')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.remove('active');
    });
    document.getElementById('btn-mark-read')?.addEventListener('click', markAllAsRead);
    document.getElementById('btn-clear-all')?.addEventListener('click', clearAllNotifications);
    
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });
    
    document.getElementById('toggle-edit-mode')?.addEventListener('click', openEditModal);
    document.getElementById('btn-back')?.addEventListener('click', closeEditModal);
    document.getElementById('btn-save')?.addEventListener('click', closeEditModal);
    document.getElementById('btn-add-time')?.addEventListener('click', addNewTimeSlot);
    document.getElementById('btn-cancel-time')?.addEventListener('click', () => {
        document.getElementById('new-time-input').value = '11:00';
    });
    document.querySelector('[data-modal="subject-modal"]')?.addEventListener('click', () => {
        document.getElementById('subject-modal').classList.remove('active');
    });
    document.getElementById('btn-save-subject')?.addEventListener('click', saveSubject);
    
    document.querySelectorAll('#subject-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#subject-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedSubjectColor = option.dataset.color;
        });
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
    
    document.getElementById('focus-mode-btn')?.addEventListener('click', () => {
        window.location.href = 'modo-foco/index.html';
    });
    
    // Botão de logout na interface mobile
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            window.location.href = '../login/index.html';
        });
    }
    
    console.log('✅ Inicialização concluída');
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        console.log('🔄 Página restaurada do cache, recarregando dados...');
        loadAllData();
    }
});

// Botão de logout mobile
const logoutMobileBtn = document.getElementById('logout-btn');
if (logoutMobileBtn) {
    logoutMobileBtn.addEventListener('click', () => {
        if (confirm('Deseja realmente sair da sua conta?')) {
            localStorage.removeItem('usuarioLogado');
            // Limpar também o cache do usuário
            if (window.CacheManager) {
                window.CacheManager.clearAllCache();
            }
            window.location.href = '../login/index.html';
        }
    });
}




// =====================================================
// NOTIFICAÇÕES NATIVAS PARA ANDROID
// =====================================================

// Detectar se está rodando dentro do app Android
function isAndroidApp() {
    return typeof Android !== 'undefined';
}

// Enviar notificação nativa para o Android
function sendNativeNotification(title, message, type) {
    console.log('[NativeNotif] Tentando enviar:', title);
    
    if (isAndroidApp()) {
        try {
            Android.showNotification(title, message, type);
            console.log('[NativeNotif] ✅ Notificação enviada para Android');
            return true;
        } catch(e) {
            console.error('[NativeNotif] Erro ao enviar:', e);
        }
    } else {
        // Fallback: usar notificação do navegador (PC/Web)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '/favicon.png' });
            console.log('[NativeNotif] Notificação do navegador enviada');
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
    return false;
}

// Verificar tarefas pendentes e enviar notificações
async function checkPendingTasks() {
    console.log('[NativeNotif] Verificando tarefas pendentes...');
    
    try {
        // Buscar tarefas do localStorage
        let tasks = [];
        const cachedTasks = window.getCached ? window.getCached('tasks', []) : [];
        tasks = cachedTasks;
        
        if (!tasks || tasks.length === 0) {
            console.log('[NativeNotif] Nenhuma tarefa encontrada');
            return;
        }
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        let pendingTasks = [];
        
        tasks.forEach(task => {
            if (!task.completed) {
                pendingTasks.push(task);
                
                // Verificar tarefas que vencem hoje
                if (task.date === todayStr) {
                    sendNativeNotification(
                        '📋 Tarefa Vence Hoje!',
                        `${task.title} - ${task.subject || 'Geral'}`,
                        'tarefa'
                    );
                }
                // Verificar tarefas que vencem amanhã
                else if (task.date === tomorrowStr) {
                    sendNativeNotification(
                        '⏰ Tarefa Vence Amanhã',
                        `${task.title} - ${task.subject || 'Geral'}`,
                        'tarefa'
                    );
                }
            }
        });
        
        // Salvar tarefas pendentes no Android
        if (isAndroidApp() && pendingTasks.length > 0) {
            try {
                Android.saveTasks(JSON.stringify(pendingTasks));
                console.log('[NativeNotif] Tarefas salvas no Android:', pendingTasks.length);
            } catch(e) {}
        }
        
        console.log('[NativeNotif] Total de tarefas pendentes:', pendingTasks.length);
        
    } catch (error) {
        console.error('[NativeNotif] Erro ao verificar tarefas:', error);
    }
}

// Verificar horários de aula e enviar notificações
async function checkUpcomingClasses() {
    console.log('[NativeNotif] Verificando horários de aula...');
    
    try {
        // Buscar horário semanal
        let weeklySchedule = {};
        if (window.getCached) {
            weeklySchedule = window.getCached('weeklySchedule', {});
        }
        
        if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) {
            console.log('[NativeNotif] Nenhum horário encontrado');
            return;
        }
        
        const now = new Date();
        const daysMap = {
            'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sáb': 6
        };
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const todayName = dayNames[now.getDay()];
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        
        const todayClasses = weeklySchedule[todayName] || [];
        console.log('[NativeNotif] Aulas de hoje:', todayClasses.length);
        
        let upcomingClasses = [];
        
        todayClasses.forEach(classItem => {
            if (classItem.horaInicio) {
                const [classHour, classMinute] = classItem.horaInicio.split(':').map(Number);
                const classTotalMinutes = classHour * 60 + classMinute;
                const minutesUntilClass = classTotalMinutes - currentTotalMinutes;
                
                // Notificar 15 minutos antes da aula
                if (minutesUntilClass <= 15 && minutesUntilClass > 0) {
                    sendNativeNotification(
                        '📚 Aula em Breve!',
                        `${classItem.materia} começa em ${minutesUntilClass} minutos`,
                        'aula'
                    );
                    upcomingClasses.push(classItem);
                }
                // Notificar 1 hora antes
                else if (minutesUntilClass <= 60 && minutesUntilClass > 15 && minutesUntilClass % 30 === 0) {
                    const hours = Math.floor(minutesUntilClass / 60);
                    const mins = minutesUntilClass % 60;
                    let timeMsg = '';
                    if (hours > 0) timeMsg = `${hours}h`;
                    if (mins > 0) timeMsg += `${mins}min`;
                    
                    sendNativeNotification(
                        '📖 Lembrete de Aula',
                        `${classItem.materia} começa em ${timeMsg}`,
                        'aula'
                    );
                }
            }
        });
        
        // Salvar aulas do dia no Android
        if (isAndroidApp() && todayClasses.length > 0) {
            try {
                Android.saveClasses(JSON.stringify(todayClasses));
                console.log('[NativeNotif] Aulas salvas no Android:', todayClasses.length);
            } catch(e) {}
        }
        
    } catch (error) {
        console.error('[NativeNotif] Erro ao verificar aulas:', error);
    }
}

// Verificar eventos do calendário
async function checkCalendarEvents() {
    console.log('[NativeNotif] Verificando eventos do calendário...');
    
    try {
        let calendarEvents = [];
        if (window.getCached) {
            calendarEvents = window.getCached('calendarEvents', []);
        }
        
        if (!calendarEvents || calendarEvents.length === 0) return;
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        calendarEvents.forEach(event => {
            if (event.date === todayStr) {
                sendNativeNotification(
                    '📅 Evento Hoje',
                    `${event.title} - ${event.start || 'Hoje'}`,
                    'geral'
                );
            } else if (event.date === tomorrowStr) {
                sendNativeNotification(
                    '📅 Evento Amanhã',
                    `${event.title} - ${event.start || 'Amanhã'}`,
                    'geral'
                );
            }
        });
        
    } catch (error) {
        console.error('[NativeNotif] Erro ao verificar eventos:', error);
    }
}

// Função principal de verificação
function runNotificationChecks() {
    console.log('[NativeNotif] ===== INICIANDO VERIFICAÇÃO =====');
    checkPendingTasks();
    checkUpcomingClasses();
    checkCalendarEvents();
    console.log('[NativeNotif] ===== VERIFICAÇÃO CONCLUÍDA =====');
}

// Inicializar sistema de notificações
function initNativeNotifications() {
    console.log('[NativeNotif] Inicializando sistema de notificações...');
    
    if (isAndroidApp()) {
        console.log('[NativeNotif] ✅ Rodando dentro do app Android');
        // Notificar Android que o app está pronto
        try {
            Android.log('App web carregado com sucesso');
        } catch(e) {}
    } else {
        console.log('[NativeNotif] Rodando no navegador/web');
        // Solicitar permissão para notificações do navegador
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            setTimeout(() => {
                Notification.requestPermission();
            }, 3000);
        }
    }
    
    // Executar verificação inicial
    setTimeout(runNotificationChecks, 2000);
    
    // Configurar verificações periódicas
    // A cada 15 minutos
    setInterval(runNotificationChecks, 15 * 60 * 1000);
    
    // A cada 1 minuto verificar apenas aulas próximas (mais frequente)
    setInterval(() => {
        checkUpcomingClasses();
    }, 60 * 1000);
}

// Salvar dados no Android quando alterar
function setupAutoSaveForNotifications() {
    // Interceptar saves para sincronizar com Android
    const originalSetCached = window.setCached;
    if (originalSetCached) {
        window.setCached = function(key, value, notify) {
            const result = originalSetCached(key, value, notify);
            
            // Quando tarefas ou horários mudam, notificar Android
            if (isAndroidApp() && (key === 'tasks' || key === 'weeklySchedule')) {
                if (key === 'tasks') {
                    const pendingTasks = (value || []).filter(t => !t.completed);
                    try {
                        Android.saveTasks(JSON.stringify(pendingTasks));
                    } catch(e) {}
                }
                if (key === 'weeklySchedule') {
                    const now = new Date();
                    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                    const today = days[now.getDay()];
                    const todayClasses = (value || {})[today] || [];
                    try {
                        Android.saveClasses(JSON.stringify(todayClasses));
                    } catch(e) {}
                }
            }
            
            return result;
        };
    }
}

// Expor funções globalmente
window.isAndroidApp = isAndroidApp;
window.sendNativeNotification = sendNativeNotification;
window.checkPendingTasks = checkPendingTasks;
window.checkUpcomingClasses = checkUpcomingClasses;
window.checkCalendarEvents = checkCalendarEvents;
window.runNotificationChecks = runNotificationChecks;

// Inicializar quando o documento estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initNativeNotifications();
        setupAutoSaveForNotifications();
    });
} else {
    initNativeNotifications();
    setupAutoSaveForNotifications();
}

console.log('[NativeNotif] ✅ Sistema de notificações nativas carregado!');