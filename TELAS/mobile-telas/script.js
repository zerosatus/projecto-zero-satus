// Página Principal - Dashboard (com suporte a Realtime DB)

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
    
    document.getElementById('confirm-ok').onclick = handleConfirm;
    document.getElementById('confirm-cancel').onclick = handleCancel;
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
        
        if (!usuarioLogado) {
            usuarioLogado = {};
        }
        
        usuarioLogado.nome = user.nome || user.displayName || user.email?.split('@')[0] || 'Usuário';
        usuarioLogado.email = user.email;
        usuarioLogado.uid = user.uid;
        
        const headerName = document.getElementById('header-name');
        if (headerName) {
            headerName.textContent = usuarioLogado.nome.split(' ')[0];
        }
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
}

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
        
        if (!usuarioLogado || !usuarioLogado.email) {
            window.location.href = '../../login/index.html';
            return;
        }
        
        loadUserData();
        
        notifications = window.getCached('notifications', []);
        weeklySchedule = window.getCached('weeklySchedule', {});
        timeSlots = window.getCached('timeSlots', ['08:00', '09:30', '11:00', '14:00', '15:30']);
        calendarEvents = window.getCached('calendarEvents', []);
        tasks = window.getCached('tasks', []);
        notes = window.getCached('notes', []);
        
        days.forEach(day => {
            if (!weeklySchedule[day]) weeklySchedule[day] = [];
        });
        
        console.log('📦 Dados carregados localmente - Tarefas:', tasks.length, 'Notas:', notes.length);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

async function syncFromCloud() {
    if (syncInProgress) return;
    syncInProgress = true;
    
    try {
        console.log('☁️ Sincronizando dados da nuvem...');
        const loaded = await window.CacheManager.loadFromCloud();
        if (loaded) {
            // Recarregar todos os dados após sync
            const newTasks = window.getCached('tasks', []);
            const newNotes = window.getCached('notes', []);
            const newEvents = window.getCached('calendarEvents', []);
            const newSchedule = window.getCached('weeklySchedule', {});
            
            let hasChanges = false;
            
            if (JSON.stringify(newTasks) !== JSON.stringify(tasks)) {
                tasks = newTasks;
                hasChanges = true;
            }
            if (JSON.stringify(newNotes) !== JSON.stringify(notes)) {
                notes = newNotes;
                hasChanges = true;
            }
            if (JSON.stringify(newEvents) !== JSON.stringify(calendarEvents)) {
                calendarEvents = newEvents;
                hasChanges = true;
            }
            if (JSON.stringify(newSchedule) !== JSON.stringify(weeklySchedule)) {
                weeklySchedule = newSchedule;
                hasChanges = true;
            }
            
            if (hasChanges) {
                console.log('✅ Dados atualizados da nuvem!');
                refreshHomeData();
                showToast('Dados sincronizados!', 'success');
            }
        }
    } catch (error) {
        console.error('Erro ao sincronizar:', error);
    } finally {
        syncInProgress = false;
    }
}

function setupCacheListeners() {
    if (!window.CacheManager) return;
    
    window.CacheManager.addListener('tasks', (newTasks) => {
        if (newTasks && JSON.stringify(newTasks) !== JSON.stringify(tasks)) {
            console.log('🔄 Tarefas atualizadas em outra aba!');
            tasks = newTasks;
            refreshHomeData();
        }
    });
    
    window.CacheManager.addListener('notes', (newNotes) => {
        if (newNotes && JSON.stringify(newNotes) !== JSON.stringify(notes)) {
            console.log('🔄 Notas atualizadas em outra aba!');
            notes = newNotes;
            refreshHomeData();
        }
    });
    
    window.CacheManager.addListener('calendarEvents', (newEvents) => {
        if (newEvents && JSON.stringify(newEvents) !== JSON.stringify(calendarEvents)) {
            console.log('🔄 Eventos atualizados em outra aba!');
            calendarEvents = newEvents;
            refreshHomeData();
        }
    });
    
    window.addEventListener('cloudDataLoaded', (event) => {
        console.log('☁️ Dados carregados da nuvem!');
        const cloudData = event.detail;
        if (cloudData) {
            if (cloudData.tasks && JSON.stringify(cloudData.tasks) !== JSON.stringify(tasks)) {
                tasks = cloudData.tasks;
            }
            if (cloudData.notes && JSON.stringify(cloudData.notes) !== JSON.stringify(notes)) {
                notes = cloudData.notes;
            }
            if (cloudData.calendarEvents && JSON.stringify(cloudData.calendarEvents) !== JSON.stringify(calendarEvents)) {
                calendarEvents = cloudData.calendarEvents;
            }
            refreshHomeData();
        }
    });
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
        .filter(e => e.date >= todayStr)
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
                <div class="item-subtitle">${escapeHtml(task.subject)} • ${task.date}</div>
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

function switchView(viewName) {
    if (viewName === 'home') {
        refreshHomeData();
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando página Inicial...');
    
    if (window.CacheManager) {
        window.CacheManager.init();
        console.log('✅ CacheManager inicializado');
    }
    
    loadAllData();
    setupCacheListeners();
    
    updateNotificationBadge();
    refreshHomeData();
    
    // Sincronizar da nuvem após carregar
    setTimeout(() => {
        syncFromCloud();
    }, 1000);
    
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            const modal = document.getElementById('notifications-modal');
            if (modal) {
                modal.classList.add('active');
                renderNotificationsModal();
            }
        });
    }
    
    const notificationBellLink = document.getElementById('notification-bell-link');
    if (notificationBellLink) {
        notificationBellLink.addEventListener('click', () => {
            const modal = document.getElementById('notifications-modal');
            if (modal) {
                modal.classList.add('active');
                renderNotificationsModal();
            }
        });
    }
    
    const closeNotificationsBtn = document.getElementById('btn-close-notifications');
    if (closeNotificationsBtn) {
        closeNotificationsBtn.addEventListener('click', () => {
            document.getElementById('notifications-modal').classList.remove('active');
        });
    }
    
    const markReadBtn = document.getElementById('btn-mark-read');
    if (markReadBtn) markReadBtn.addEventListener('click', markAllAsRead);
    
    const clearAllBtn = document.getElementById('btn-clear-all');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllNotifications);
    
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (view) switchView(view);
        });
    });
    
    const focusBtn = document.getElementById('focus-mode-btn');
    if (focusBtn) {
        focusBtn.addEventListener('click', () => {
            window.location.href = '../modo-foco/index.html';
        });
    }
    
    // Botão de sincronização manual
    const addSyncButton = () => {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.getElementById('manual-sync-btn')) {
            const syncBtn = document.createElement('button');
            syncBtn.id = 'manual-sync-btn';
            syncBtn.className = 'icon-btn';
            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            syncBtn.title = 'Sincronizar com nuvem';
            syncBtn.onclick = async () => {
                syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                await syncFromCloud();
                setTimeout(() => {
                    syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                }, 1000);
            };
            headerActions.prepend(syncBtn);
        }
    };
    
    setTimeout(addSyncButton, 1000);
    
    console.log('✅ Página Inicial inicializada com sucesso!');
});