// mobile-telas/calendario/script.js - VERSÃO SUPABASE APENAS

let notifications = [];
let calendarEvents = [];
let usuarioLogado = null;
let currentDate = new Date();
let selectedDay = currentDate.getDate();
let selectedEventType = 'aula';
let selectedEventColor = '#8b5cf6';
let editingEventId = null;
let isSaving = false;

// ============================================
// TOAST & CONFIRM
// ============================================
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

// ============================================
// SALVAR DADOS
// ============================================
async function salvarTodosDados() {
    if (!usuarioLogado || !window.CacheManager || isSaving) return false;
    isSaving = true;
    
    try {
        window.CacheManager.set('calendarEvents', calendarEvents, true);
        window.CacheManager.set('notifications', notifications, true);
        
        const userId = usuarioLogado.id;
        localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(calendarEvents));
        localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
        
        console.log('[Calendario Mobile] ✅ Dados salvos:', calendarEvents.length);
        return true;
    } catch (error) {
        console.error('[Calendario Mobile] Erro ao salvar:', error);
        return false;
    } finally {
        setTimeout(() => { isSaving = false; }, 500);
    }
}

// ============================================
// CARREGAR DADOS
// ============================================
async function carregarDados() {
    if (!usuarioLogado || !window.CacheManager) return;
    
    try {
        if (window.CacheManager.currentUserId !== usuarioLogado.id) {
            window.CacheManager.currentUserId = usuarioLogado.id;
        }
        
        const cachedEvents = window.CacheManager.get('calendarEvents', null);
        const cachedNotif = window.CacheManager.get('notifications', null);
        
        if (cachedEvents !== null && Array.isArray(cachedEvents)) {
            calendarEvents = cachedEvents;
            console.log('[Calendario Mobile] Carregados do CacheManager:', calendarEvents.length);
        } else {
            const userId = usuarioLogado.id;
            const eventsSalvos = localStorage.getItem(`${userId}_calendarEvents`);
            if (eventsSalvos) {
                calendarEvents = JSON.parse(eventsSalvos);
                console.log('[Calendario Mobile] Carregados do localStorage:', calendarEvents.length);
            }
        }
        
        if (cachedNotif !== null && Array.isArray(cachedNotif)) {
            notifications = cachedNotif;
        } else {
            const userId = usuarioLogado.id;
            const notifSalvas = localStorage.getItem(`${userId}_notifications`);
            if (notifSalvas) {
                notifications = JSON.parse(notifSalvas);
            }
        }
        
        renderCalendar();
        updateNotificationBadge();
        
    } catch (error) {
        console.error('[Calendario Mobile] Erro ao carregar dados:', error);
    }
}

// ============================================
// NOTIFICAÇÕES
// ============================================
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function formatTimeAgo(timeString) {
    if (!timeString) return '';
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMins = Math.floor((now - notifTime) / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    return notifTime.toLocaleDateString('pt-BR');
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
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type || 'info'}">
                <ion-icon name="notifications-outline"></ion-icon>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                <div class="notification-time">${formatTimeAgo(notif.time)}</div>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationsModal();
    salvarTodosDados();
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            salvarTodosDados();
            showToast('Notificações limpas!', 'success');
        }
    });
}

// ============================================
// CALENDÁRIO
// ============================================
function renderCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthYear = document.getElementById('current-month-year');
    if (!calendarDays) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    currentMonthYear.textContent = `${monthNames[month]} de ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
    const currentDay = today.getDate();
    
    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day empty"></div>';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === currentDay;
        const isSelected = day === selectedDay;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEvent = calendarEvents.some(e => e.date === dateStr);
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}" data-day="${day}">${day}</div>`;
    }
    calendarDays.innerHTML = html;
    
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', () => {
            selectedDay = parseInt(day.dataset.day);
            document.getElementById('events-date').textContent = `Eventos do dia ${selectedDay}`;
            renderEvents();
            renderCalendar();
        });
    });
    
    renderEvents();
}

function renderEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    const dayEvents = calendarEvents.filter(e => e.date === selectedDateStr);
    
    if (dayEvents.length === 0) {
        eventsList.innerHTML = '<div class="list-item" style="text-align:center;color:var(--text-secondary)">Nenhum evento neste dia</div>';
        return;
    }
    
    let html = '';
    dayEvents.forEach(event => {
        const iconMap = { 'aula': 'book', 'prova': 'document', 'tarefa': 'checkbox', 'outro': 'calendar' };
        html += `<div class="event-item" data-id="${event.id}" style="border-left-color: ${event.color}">
            <div class="event-icon" style="background-color: ${event.color}20; color: ${event.color}">
                <ion-icon name="${iconMap[event.type] || 'calendar'}-outline"></ion-icon>
            </div>
            <div class="event-info">
                <div class="event-title">${escapeHtml(event.title)}</div>
                <div class="event-time">${event.start} - ${event.end}</div>
            </div>
            <div class="event-actions">
                <ion-icon name="create-outline" class="edit-event" data-id="${event.id}"></ion-icon>
                <ion-icon name="trash-outline" class="delete-event" data-id="${event.id}"></ion-icon>
            </div>
        </div>`;
    });
    eventsList.innerHTML = html;
    
    document.querySelectorAll('.edit-event').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const event = calendarEvents.find(ev => ev.id == icon.dataset.id);
            if (event) openEventModal(event);
        });
    });
    
    document.querySelectorAll('.delete-event').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirm('Excluir este evento?', 'Excluir Evento', async (confirmed) => {
                if (confirmed) {
                    calendarEvents = calendarEvents.filter(ev => ev.id != icon.dataset.id);
                    await salvarTodosDados();
                    renderEvents();
                    renderCalendar();
                    showToast('Evento excluído!', 'success');
                }
            });
        });
    });
}

function openEventModal(event) {
    const modal = document.getElementById('event-modal');
    if (!modal) return;
    
    editingEventId = event ? event.id : null;
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    
    if (event) {
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-date').value = event.date;
        document.getElementById('event-start').value = event.start;
        document.getElementById('event-end').value = event.end;
        selectedEventType = event.type;
        selectedEventColor = event.color;
    } else {
        document.getElementById('event-title').value = '';
        document.getElementById('event-date').value = `${year}-${month}-${day}`;
        document.getElementById('event-start').value = '08:00';
        document.getElementById('event-end').value = '09:00';
        selectedEventType = 'aula';
        selectedEventColor = '#8b5cf6';
    }
    
    document.querySelectorAll('.event-types .type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === selectedEventType);
    });
    
    document.querySelectorAll('#event-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedEventColor);
    });
    
    modal.classList.add('active');
}

// ============================================
// AVATAR
// ============================================
async function carregarFotoPerfilMobile() {
    if (!usuarioLogado) return;
    
    const profileIcon = document.getElementById('notification-bell');
    if (!profileIcon) return;
    
    if (window.CacheManager) {
        const photoUrl = await window.CacheManager.getProfilePhotoUrl();
        if (photoUrl && photoUrl.startsWith('data:')) {
            profileIcon.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            return;
        }
    }
    
    const iniciais = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
    profileIcon.innerHTML = `<span style="font-weight:bold;">${iniciais}</span>`;
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📅 Iniciando calendário mobile com Supabase...');
    
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    try {
        usuarioLogado = JSON.parse(usuarioSalvo);
        console.log('[Calendario Mobile] Usuário:', usuarioLogado.id);
    } catch(e) {
        console.error('[Calendario Mobile] Erro ao parsear usuário:', e);
        window.location.href = '../../login/index.html';
        return;
    }
    
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuarioLogado.id;
        console.log('[Calendario Mobile] CacheManager inicializado');
    }
    
    if (window.initSync && !window._calendarioMobileSyncInit) {
        window._calendarioMobileSyncInit = true;
        try {
            await window.initSync({ force: false });
            console.log('[Calendario Mobile] Sync inicializado ✅');
        } catch(e) {
            console.warn('[Calendario Mobile] Erro no sync:', e);
        }
    }
    
    await carregarDados();
    
    const headerName = document.getElementById('header-name');
    if (headerName && usuarioLogado.nome) {
        headerName.textContent = usuarioLogado.nome.split(' ')[0];
    }
    
    await carregarFotoPerfilMobile();
    updateNotificationBadge();
    
    // Eventos
    document.getElementById('notification-bell')?.addEventListener('click', () => {
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
    
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        selectedDay = 1;
        renderCalendar();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        selectedDay = 1;
        renderCalendar();
    });
    
    document.getElementById('btn-new-event')?.addEventListener('click', () => openEventModal(null));
    document.querySelector('[data-modal="event-modal"]')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget || e.target.closest('.btn-back, .btn-close')) {
            document.getElementById('event-modal').classList.remove('active');
        }
    });
    
    document.querySelectorAll('.event-types .type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.event-types .type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedEventType = btn.dataset.type;
        });
    });
    
    document.querySelectorAll('#event-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#event-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedEventColor = option.dataset.color;
        });
    });
    
    document.getElementById('btn-save-event')?.addEventListener('click', async () => {
        const title = document.getElementById('event-title')?.value.trim();
        const date = document.getElementById('event-date')?.value;
        const start = document.getElementById('event-start')?.value;
        const end = document.getElementById('event-end')?.value;
        
        if (!title || !date) {
            showToast('Preencha título e data!', 'error');
            return;
        }
        
        if (editingEventId) {
            const index = calendarEvents.findIndex(e => e.id == editingEventId);
            if (index > -1) {
                calendarEvents[index] = {
                    ...calendarEvents[index],
                    title,
                    date,
                    start,
                    end,
                    type: selectedEventType,
                    color: selectedEventColor
                };
            }
        } else {
            calendarEvents.push({
                id: Date.now(),
                title,
                date,
                start,
                end,
                type: selectedEventType,
                color: selectedEventColor
            });
        }
        
        await salvarTodosDados();
        showToast(editingEventId ? 'Evento atualizado!' : 'Evento criado!', 'success');
        document.getElementById('event-modal').classList.remove('active');
        renderEvents();
        renderCalendar();
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (view === 'home') window.location.href = '../index.html';
            else if (view === 'calendar') renderCalendar();
            else if (view === 'tasks') window.location.href = '../tarefas/index.html';
            else if (view === 'notes') window.location.href = '../notas/index.html';
            else if (view === 'profile') window.location.href = '../perfil/index.html';
        });
    });
    
    // Listeners globais
    window.addEventListener('cloudDataLoaded', async () => {
        console.log('[Calendario Mobile] 📡 Dados da nuvem carregados!');
        await carregarDados();
        renderCalendar();
        updateNotificationBadge();
        showToast('🔄 Calendário sincronizado!', 'success');
    });
    
    window.addEventListener('syncReady', () => {
        console.log('[Calendario Mobile] 📡 Sync pronto, recarregando dados...');
        carregarDados();
        renderCalendar();
        updateNotificationBadge();
    });
    
    window.addEventListener('profilePhotoUpdated', async (event) => {
        if (event.detail && event.detail.photoUrl) {
            const profileIcon = document.getElementById('notification-bell');
            if (profileIcon) {
                profileIcon.innerHTML = `<img src="${event.detail.photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
        }
    });
    
    console.log('✅ Calendário mobile com Supabase inicializado!');
});

console.log('%c📅 Calendário Mobile - Supabase Apenas!', 'color: #6366f1; font-size: 16px; font-weight: bold;');