// mobile-telas/script.js - VERSÃO CORRIGIDA COM CACHEMANAGER

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
let syncInProgress = false;
let _isLoading = false;

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
// FRASE DO DIA
// ============================================
function atualizarFraseDoDiaMobile() {
    const fraseElement = document.getElementById('fraseDoDiaTextMobile');
    if (fraseElement && window.FrasesDoDia) {
        fraseElement.textContent = window.FrasesDoDia.getFraseDoDia();
    } else if (fraseElement) {
        fraseElement.textContent = 'A persistência leva à perfeição. Continue firme nos estudos!';
    }
}

// ============================================
// AVATAR
// ============================================
async function atualizarAvatarMobile(photoUrl = null) {
    const profileIcon = document.getElementById('notification-bell');
    if (!profileIcon) return;

    if (photoUrl && photoUrl.startsWith('data:')) {
        profileIcon.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        return;
    }

    if (window.CacheManager && usuarioLogado) {
        try {
            const cachedPhotoUrl = await window.CacheManager.getProfilePhotoUrl();
            if (cachedPhotoUrl && cachedPhotoUrl.startsWith('data:')) {
                profileIcon.innerHTML = `<img src="${cachedPhotoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                return;
            }
        } catch(e) {}
    }

    const iniciais = usuarioLogado?.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
    profileIcon.innerHTML = `<span style="font-weight:bold;">${iniciais}</span>`;
}

// ============================================
// ✅ FUNÇÃO CORRIGIDA: CARREGAR DADOS
// ============================================
async function carregarTodosDados() {
    if (_isLoading) return;
    if (!usuarioLogado || !window.CacheManager) return;

    _isLoading = true;
    console.log('[Mobile] 📂 Carregando dados...');

    try {
        // Garantir que o CacheManager está com o userId correto
        if (window.CacheManager.currentUserId !== usuarioLogado.id) {
            window.CacheManager.currentUserId = usuarioLogado.id;
        }

        // ✅ CARREGAR DO CACHEMANAGER (que já tem os dados da nuvem)
        notes = window.CacheManager.get('notes', []);
        tasks = window.CacheManager.get('tasks', []);
        calendarEvents = window.CacheManager.get('calendarEvents', []);
        weeklySchedule = window.CacheManager.get('weeklySchedule', {});
        timeSlots = window.CacheManager.get('timeSlots', []);
        notifications = window.CacheManager.get('notifications', []);

        // Garantir que todos os dias existem
        days.forEach(day => {
            if (!weeklySchedule[day]) weeklySchedule[day] = [];
        });

        if (timeSlots.length === 0) {
            timeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30'];
        }

        // ✅ ATUALIZAR LOCALSTORAGE COM OS DADOS DO CACHE
        const userId = usuarioLogado.id;
        if (notes.length > 0) localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
        if (tasks.length > 0) localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
        if (calendarEvents.length > 0) localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(calendarEvents));
        if (Object.keys(weeklySchedule).length > 0) localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedule));
        if (timeSlots.length > 0) localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlots));
        if (notifications.length > 0) localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));

        console.log('[Mobile] ✅ Dados carregados:', { 
            notes: notes.length, 
            tasks: tasks.length,
            events: calendarEvents.length
        });
        
        renderizarTudo();

    } catch (error) {
        console.error('[Mobile] Erro ao carregar:', error);
    } finally {
        _isLoading = false;
    }
}

// ============================================
// ✅ FUNÇÃO CORRIGIDA: SALVAR DADOS
// ============================================
async function salvarTodosDados() {
    if (!usuarioLogado || !window.CacheManager || syncInProgress) return false;

    syncInProgress = true;
    console.log('[Mobile] 💾 Salvando...');

    try {
        if (window.CacheManager.currentUserId !== usuarioLogado.id) {
            window.CacheManager.currentUserId = usuarioLogado.id;
        }

        // ✅ SALVAR NO CACHEMANAGER (ENVIA PARA SUPABASE)
        if (typeof notes !== 'undefined') {
            window.CacheManager.set('notes', notes, true);
            console.log('[Mobile] ✅ Notes salvo no CacheManager:', notes.length);
        }
        if (typeof tasks !== 'undefined') {
            window.CacheManager.set('tasks', tasks, true);
            console.log('[Mobile] ✅ Tasks salvo no CacheManager:', tasks.length);
        }
        if (typeof calendarEvents !== 'undefined') {
            window.CacheManager.set('calendarEvents', calendarEvents, true);
            console.log('[Mobile] ✅ CalendarEvents salvo no CacheManager:', calendarEvents.length);
        }
        if (typeof weeklySchedule !== 'undefined') {
            window.CacheManager.set('weeklySchedule', weeklySchedule, true);
        }
        if (typeof timeSlots !== 'undefined') {
            window.CacheManager.set('timeSlots', timeSlots, true);
        }
        if (typeof notifications !== 'undefined') {
            window.CacheManager.set('notifications', notifications, true);
        }

        // ✅ Backup local também (com UUID)
        const userId = usuarioLogado.id;
        if (typeof notes !== 'undefined') localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
        if (typeof tasks !== 'undefined') localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
        if (typeof calendarEvents !== 'undefined') localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(calendarEvents));
        if (typeof weeklySchedule !== 'undefined') localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedule));
        if (typeof timeSlots !== 'undefined') localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlots));
        if (typeof notifications !== 'undefined') localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));

        // ✅ Disparar eventos para outras abas
        window.dispatchEvent(new CustomEvent('dataUpdated', { 
            detail: { key: 'all', value: { notes, tasks, calendarEvents } } 
        }));
        window.dispatchEvent(new CustomEvent('cloudDataLoaded'));

        console.log('[Mobile] ✅ Dados salvos com sucesso!');
        return true;

    } catch (error) {
        console.error('[Mobile] Erro ao salvar:', error);
        return false;
    } finally {
        setTimeout(() => { syncInProgress = false; }, 500);
    }
}

// ============================================
// RENDERIZAR TUDO
// ============================================
function renderizarTudo() {
    renderizarHorario();
    renderizarProximoEvento();
    renderizarProximasTarefas();
    renderizarNotificacoes();
    atualizarCards();
    atualizarBadgeNotificacoes();
    atualizarFraseDoDiaMobile();
}

// ============================================
// HORÁRIO
// ============================================
function renderizarHorario() {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;

    if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) {
        grid.innerHTML = '<div style="grid-column:span 6;text-align:center;padding:40px;color:var(--text-secondary);">Nenhum horário cadastrado</div>';
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
}

// ============================================
// PROXIMAS TAREFAS
// ============================================
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
        html += `<div class="list-item" data-id="${task.id}">
            <div class="item-icon" style="background-color: ${task.color || '#8b5cf6'}20; color: ${task.color || '#8b5cf6'}">
                <ion-icon name="checkbox-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(task.title || task.nome)}</div>
                <div class="item-subtitle">${escapeHtml(task.subject || task.disciplina || 'Geral')}</div>
            </div>
            <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    container.innerHTML = html;
}

// ============================================
// PROXIMO EVENTO
// ============================================
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
        container.innerHTML = '<div class="list-item"><div class="item-icon"><ion-icon name="calendar-outline"></ion-icon></div><div class="item-info"><div class="item-title">Sem eventos futuros</div></div></div>';
        return;
    }

    let html = '';
    eventosFuturos.forEach(event => {
        const [year, month, day] = event.date.split('-');
        const dateFormatted = `${day}/${month}`;
        html += `<div class="list-item" data-id="${event.id}">
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

// ============================================
// NOTIFICAÇÕES
// ============================================
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
        html += `<div class="list-item" data-id="${notif.id}">
            <div class="item-icon notification" style="background-color: #8b5cf6; color: white">
                <ion-icon name="notifications-outline"></ion-icon>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(notif.title)}</div>
                <div class="item-subtitle">${escapeHtml(notif.message)}</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
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
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type || 'info'}">
                <ion-icon name="notifications-outline"></ion-icon>
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
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            salvarTodosDados();
            atualizarBadgeNotificacoes();
            renderizarNotificacoes();
            renderizarNotificacoesModal();
            showToast('Notificações limpas!', 'success');
        }
    });
}

// ============================================
// CARDS
// ============================================
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

// ============================================
// CONFIGURAR EVENTOS
// ============================================
function configurarEventos() {
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

    const closeNotifBtn = document.getElementById('btn-close-notifications');
    if (closeNotifBtn) {
        closeNotifBtn.addEventListener('click', () => {
            document.getElementById('notifications-modal').classList.remove('active');
        });
    }

    const markReadBtn = document.getElementById('btn-mark-read');
    if (markReadBtn) markReadBtn.addEventListener('click', marcarTodasComoLidas);

    const clearAllBtn = document.getElementById('btn-clear-all');
    if (clearAllBtn) clearAllBtn.addEventListener('click', limparTodasNotificacoes);

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
            if (view === 'home') window.location.href = './index.html';
            else if (view === 'calendar') window.location.href = './calendario/index.html';
            else if (view === 'tasks') window.location.href = './tarefas/index.html';
            else if (view === 'notes') window.location.href = './notas/index.html';
            else if (view === 'profile') window.location.href = './perfil/index.html';
        });
    });
}

// ============================================
// LISTENERS GLOBAIS
// ============================================
function configurarListeners() {
    window.addEventListener('cloudDataLoaded', async () => {
        console.log('[Mobile] 📡 Dados da nuvem carregados!');
        await carregarTodosDados();
        renderizarTudo();
        if (!document.querySelector('.toast')) {
            showToast('🔄 Dados sincronizados!', 'success');
        }
    });

    window.addEventListener('syncReady', () => {
        console.log('[Mobile] 📡 Sync pronto!');
        carregarTodosDados();
        renderizarTudo();
    });

    // ✅ ESCUTAR EVENTOS DE DADOS ATUALIZADOS
    window.addEventListener('tasksUpdated', (event) => {
        if (event.detail && !syncInProgress) {
            tasks = event.detail;
            renderizarTudo();
            console.log('[Mobile] Tasks atualizadas via evento');
        }
    });

    window.addEventListener('notesUpdated', (event) => {
        if (event.detail && event.detail.notes && !syncInProgress) {
            notes = event.detail.notes;
            renderizarTudo();
            console.log('[Mobile] Notes atualizadas via evento');
        }
    });

    window.addEventListener('calendarEventsUpdated', (event) => {
        if (event.detail && !syncInProgress) {
            calendarEvents = event.detail;
            renderizarTudo();
            console.log('[Mobile] CalendarEvents atualizados via evento');
        }
    });

    window.addEventListener('weeklyScheduleUpdated', (event) => {
        if (event.detail && !syncInProgress) {
            weeklySchedule = event.detail;
            renderizarTudo();
            console.log('[Mobile] WeeklySchedule atualizado via evento');
        }
    });

    window.addEventListener('dataUpdated', (event) => {
        if (event.detail && event.detail.key && !syncInProgress) {
            console.log(`[Mobile] Dados ${event.detail.key} atualizados via evento`);
            carregarTodosDados();
            renderizarTudo();
        }
    });

    window.addEventListener('profilePhotoUpdated', async (event) => {
        if (event.detail && event.detail.photoUrl) {
            await atualizarAvatarMobile(event.detail.photoUrl);
        }
    });

    window.addEventListener('forceRefresh', () => {
        console.log('[Mobile] 🔄 ForceRefresh recebido');
        carregarTodosDados();
        renderizarTudo();
    });

    // ✅ ESCUTAR MUDANÇAS NO localStorage (outras abas)
    window.addEventListener('storage', (e) => {
        if (e.key && (e.key.includes('_tasks') || 
            e.key.includes('_notes') || 
            e.key.includes('_calendarEvents') ||
            e.key.includes('_weeklySchedule'))) {
            console.log('[Mobile] Mudança detectada em outra aba:', e.key);
            carregarTodosDados();
            renderizarTudo();
        }
    });
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 Iniciando Mobile...');

    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        window.location.href = '../../login/index.html';
        return;
    }

    try {
        usuarioLogado = JSON.parse(usuarioSalvo);
        console.log('[Mobile] Usuário:', usuarioLogado.id);
    } catch(e) {
        console.error('[Mobile] Erro ao parsear usuário:', e);
        window.location.href = '../../login/index.html';
        return;
    }

    // Inicializar CacheManager
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuarioLogado.id;
        console.log('[Mobile] CacheManager inicializado');
    }

    // Inicializar Sync
    if (window.initSync && !window._mobileSyncInit) {
        window._mobileSyncInit = true;
        try {
            await window.initSync({ force: false });
            console.log('[Mobile] Sync inicializado ✅');
        } catch(e) {
            console.warn('[Mobile] Erro no sync:', e);
        }
    }

    // Carregar dados
    await carregarTodosDados();

    // Atualizar UI
    const headerName = document.getElementById('header-name');
    if (headerName && usuarioLogado.nome) {
        headerName.textContent = usuarioLogado.nome.split(' ')[0];
    }

    await atualizarAvatarMobile();
    configurarEventos();
    configurarListeners();

    console.log('✅ Mobile inicializado!');
});

console.log('📱 Mobile - Sincronização com Supabase ativa!');