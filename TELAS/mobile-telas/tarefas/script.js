// tarefas/script.js - VERSÃO DEFINITIVAMENTE CORRIGIDA

let notifications = [];
let tasks = [];
let usuarioLogado = null;
let currentTaskFilter = 'todos';
let editingTaskId = null;
let selectedTaskPriority = 'media';
let selectedTaskColor = '#6366f1';
let _tarefasCarregando = false;
let _tarefasInicializado = false;

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
function saveAllData() {
    if (!usuarioLogado) return;

    const userId = usuarioLogado.id;

    try {
        localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
        localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));

        if (window.CacheManager) {
            if (!window.CacheManager.currentUserId || window.CacheManager.currentUserId !== userId) {
                window.CacheManager.currentUserId = userId;
            }
            window.CacheManager.set('tasks', tasks, true);
            window.CacheManager.set('notifications', notifications, true);
        }

        console.log('[Tarefas] 💾 Dados salvos:', tasks.length, 'tarefas');
    } catch (error) {
        console.error('[Tarefas] Erro ao salvar:', error);
    }
}

// ============================================
// CARREGAR DADOS (CORRIGIDO)
// ============================================
function loadAllData() {
    if (!usuarioLogado) {
        console.warn('[Tarefas] Usuário não logado');
        return;
    }

    const userId = usuarioLogado.id;
    console.log('[Tarefas] 📂 Carregando dados para:', userId);

    let tasksCarregadas = null;
    let notifCarregadas = null;

    // ✅ TENTAR CARREGAR DO CACHE MANAGER PRIMEIRO
    if (window.CacheManager) {
        try {
            // Garantir que o userId está correto no CacheManager
            if (window.CacheManager.currentUserId !== userId) {
                window.CacheManager.currentUserId = userId;
            }

            const cachedTasks = window.CacheManager.get('tasks', null);
            const cachedNotif = window.CacheManager.get('notifications', null);

            if (cachedTasks !== null && Array.isArray(cachedTasks)) {
                tasksCarregadas = cachedTasks;
                console.log('[Tarefas] ✅ Carregadas do CacheManager:', tasksCarregadas.length);
            }
            if (cachedNotif !== null && Array.isArray(cachedNotif)) {
                notifCarregadas = cachedNotif;
            }
        } catch(e) {
            console.warn('[Tarefas] Erro ao ler CacheManager:', e);
        }
    }

    // ✅ FALLBACK: localStorage
    if (!tasksCarregadas || tasksCarregadas.length === 0) {
        try {
            const tasksSalvas = localStorage.getItem(`${userId}_tasks`);
            if (tasksSalvas) {
                tasksCarregadas = JSON.parse(tasksSalvas);
                console.log('[Tarefas] 📦 Carregadas do localStorage:', tasksCarregadas.length);
            }
        } catch(e) {
            console.warn('[Tarefas] Erro ao ler localStorage:', e);
        }
    }

    if (!notifCarregadas || notifCarregadas.length === 0) {
        try {
            const notifSalvas = localStorage.getItem(`${userId}_notifications`);
            if (notifSalvas) {
                notifCarregadas = JSON.parse(notifSalvas);
            }
        } catch(e) {
            console.warn('[Tarefas] Erro ao ler notificações:', e);
        }
    }

    // ✅ ATRIBUIR OS DADOS
    if (tasksCarregadas && Array.isArray(tasksCarregadas)) {
        tasks = tasksCarregadas;
    } else {
        tasks = [];
    }

    if (notifCarregadas && Array.isArray(notifCarregadas)) {
        notifications = notifCarregadas;
    } else {
        notifications = [];
    }

    // ✅ SE NÃO TIVER DADOS, CRIAR EXEMPLO
    if (tasks.length === 0) {
        console.log('[Tarefas] Nenhuma tarefa encontrada, criando exemplo...');
        tasks = [
            {
                id: Date.now(),
                title: 'Exemplo de Tarefa',
                subject: 'Geral',
                date: new Date().toLocaleDateString('pt-BR'),
                color: '#8b5cf6',
                priority: 'media',
                completed: false
            }
        ];
        saveAllData();
    }

    console.log('[Tarefas] 📊 Total de tarefas carregadas:', tasks.length);
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
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                <ion-icon name="${iconMap[notif.type] || 'notifications'}-outline"></ion-icon>
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
    if (window.CacheManager) window.CacheManager.set('notifications', notifications, true);
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            if (window.CacheManager) window.CacheManager.set('notifications', notifications, true);
            showToast('Notificações limpas!', 'success');
        }
    });
}

// ============================================
// RENDERIZAR TAREFAS
// ============================================
function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;

    let filteredTasks = [...tasks];
    if (currentTaskFilter === 'pendentes') filteredTasks = tasks.filter(t => !t.completed);
    else if (currentTaskFilter === 'concluidas') filteredTasks = tasks.filter(t => t.completed);

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)">Nenhuma tarefa encontrada</div>';
        return;
    }

    let html = '';
    filteredTasks.forEach(task => {
        const priorityClass = task.priority || 'media';
        html += `<div class="task-item ${task.completed ? 'completed' : ''} prioridade-${priorityClass}" data-id="${task.id}">
            <div class="task-color" style="background-color: ${task.color || '#8b5cf6'}; width: 4px; height: 40px; border-radius: 2px;"></div>
            <div class="task-info">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-subject">${escapeHtml(task.subject || 'Geral')}</div>
                <div class="task-date"><ion-icon name="calendar-outline"></ion-icon> ${task.date || 'Sem data'}</div>
            </div>
            <div class="task-check ${task.completed ? 'checked' : ''}" data-id="${task.id}">${task.completed ? '<ion-icon name="checkmark-outline"></ion-icon>' : ''}</div>
            <div class="task-arrow" data-id="${task.id}"><ion-icon name="chevron-forward-outline"></ion-icon></div>
        </div>`;
    });
    tasksList.innerHTML = html;

    document.querySelectorAll('.task-check').forEach(check => {
        check.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = check.dataset.id;
            const task = tasks.find(t => t.id == taskId);
            if (task) {
                task.completed = !task.completed;
                saveAllData();
                renderTasks();
                showToast(task.completed ? 'Tarefa concluída!' : 'Tarefa reaberta!', 'success');
            }
        });
    });

    document.querySelectorAll('.task-arrow').forEach(arrow => {
        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = arrow.dataset.id;
            const task = tasks.find(t => t.id == taskId);
            if (task) openTaskModal(task);
        });
    });
}

// ============================================
// MODAL DE TAREFA
// ============================================
function openTaskModal(task) {
    const modal = document.getElementById('task-modal');
    if (!modal) return;

    editingTaskId = task ? task.id : null;

    if (task) {
        document.getElementById('task-modal-title').textContent = 'Editar Tarefa';
        document.getElementById('task-title').value = task.title || '';
        document.getElementById('task-subject').value = task.subject || '';
        document.getElementById('task-date').value = task.date || '';
        selectedTaskColor = task.color || '#8b5cf6';
        selectedTaskPriority = task.priority || 'media';
    } else {
        document.getElementById('task-modal-title').textContent = 'Nova Tarefa';
        document.getElementById('task-title').value = '';
        document.getElementById('task-subject').value = '';
        document.getElementById('task-date').value = '';
        selectedTaskPriority = 'media';
        selectedTaskColor = '#8b5cf6';
    }

    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === selectedTaskPriority);
    });

    document.querySelectorAll('#task-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedTaskColor);
    });

    modal.classList.add('active');
}

function switchView(viewName) {
    if (viewName === 'home') window.location.href = '../index.html';
    else if (viewName === 'calendar') window.location.href = '../calendario/index.html';
    else if (viewName === 'tasks') renderTasks();
    else if (viewName === 'notes') window.location.href = '../notas/index.html';
    else if (viewName === 'profile') window.location.href = '../perfil/index.html';
}

// ============================================
// INICIALIZAR TAREFAS (FUNÇÃO PRINCIPAL)
// ============================================
async function inicializarTarefas() {
    // PREVENIR CARREGAMENTO MÚLTIPLO
    if (_tarefasCarregando) {
        console.log('[Tarefas] ⏳ Já está carregando...');
        return;
    }
    if (_tarefasInicializado) {
        console.log('[Tarefas] ✅ Já inicializado');
        return;
    }

    _tarefasCarregando = true;
    console.log('[Tarefas] 🚀 Iniciando...');

    try {
        // 1️⃣ VERIFICAR USUÁRIO
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (!usuarioSalvo) {
            console.error('[Tarefas] Usuário não logado');
            window.location.href = '../../login/index.html';
            return;
        }

        try {
            usuarioLogado = JSON.parse(usuarioSalvo);
        } catch(e) {
            console.error('[Tarefas] Erro ao parsear usuário:', e);
            window.location.href = '../../login/index.html';
            return;
        }

        console.log('[Tarefas] 👤 Usuário:', usuarioLogado.id);

        // 2️⃣ INICIALIZAR CACHE MANAGER
        if (window.CacheManager) {
            if (!window.CacheManager.isInitialized) {
                window.CacheManager.init();
            }
            window.CacheManager.currentUserId = usuarioLogado.id;
            console.log('[Tarefas] ✅ CacheManager inicializado');
        } else {
            console.warn('[Tarefas] ⚠️ CacheManager não disponível');
        }

        // 3️⃣ INICIALIZAR SYNC (AGUARDANDO)
        if (window.initSync && !window._tasksSyncInit) {
            window._tasksSyncInit = true;
            console.log('[Tarefas] 🔄 Inicializando sync...');
            try {
                await window.initSync({ force: false });
                console.log('[Tarefas] ✅ Sync inicializado');
            } catch(e) {
                console.warn('[Tarefas] ⚠️ Erro no sync:', e);
            }
        }

        // 4️⃣ CARREGAR DADOS
        loadAllData();

        // 5️⃣ ATUALIZAR UI
        if (usuarioLogado) {
            const nomeExibicao = usuarioLogado.nome || usuarioLogado.displayName || usuarioLogado.email?.split('@')[0] || 'Usuário';
            const headerName = document.getElementById('header-name');
            if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
        }

        updateNotificationBadge();
        renderTasks();

        _tarefasInicializado = true;
        console.log('[Tarefas] ✅ Inicializado com sucesso!');

    } catch (error) {
        console.error('[Tarefas] ❌ Erro ao inicializar:', error);
        showToast('Erro ao carregar tarefas', 'error');
    } finally {
        _tarefasCarregando = false;
    }
}

// ============================================
// CONFIGURAR EVENTOS DA UI
// ============================================
function configurarEventosTarefas() {
    // Notificações
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

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTaskFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Adicionar tarefa
    document.getElementById('btn-add-task')?.addEventListener('click', () => openTaskModal(null));
    document.querySelector('[data-modal="task-modal"]')?.addEventListener('click', () => {
        document.getElementById('task-modal').classList.remove('active');
    });

    // Prioridades
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTaskPriority = btn.dataset.priority;
        });
    });

    // Cores
    document.querySelectorAll('#task-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#task-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedTaskColor = option.dataset.color;
        });
    });

    // Salvar tarefa
    document.getElementById('btn-save-task')?.addEventListener('click', () => {
        const title = document.getElementById('task-title')?.value.trim();
        const subject = document.getElementById('task-subject')?.value.trim();
        const date = document.getElementById('task-date')?.value;

        if (!title) {
            showToast('Preencha o título!', 'error');
            return;
        }

        if (editingTaskId) {
            const index = tasks.findIndex(t => t.id == editingTaskId);
            if (index > -1) {
                tasks[index] = {
                    ...tasks[index],
                    title,
                    subject: subject || tasks[index].subject || 'Geral',
                    date: date || tasks[index].date,
                    color: selectedTaskColor,
                    priority: selectedTaskPriority
                };
            }
        } else {
            tasks.unshift({
                id: Date.now(),
                title,
                subject: subject || 'Geral',
                date: date || new Date().toLocaleDateString('pt-BR'),
                color: selectedTaskColor,
                priority: selectedTaskPriority,
                completed: false
            });
        }

        saveAllData();
        showToast(editingTaskId ? 'Tarefa atualizada!' : 'Tarefa criada!', 'success');
        document.getElementById('task-modal').classList.remove('active');
        renderTasks();
    });

    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
}

// ============================================
// LISTENERS GLOBAIS
// ============================================
function configurarListenersTarefas() {
    // Quando o sync ficar pronto
    window.addEventListener('syncReady', () => {
        console.log('[Tarefas] 📡 Sync pronto, recarregando dados...');
        if (usuarioLogado) {
            loadAllData();
            renderTasks();
            updateNotificationBadge();
            showToast('🔄 Dados sincronizados!', 'success');
        }
    });

    // Quando dados da nuvem chegarem
    window.addEventListener('cloudDataLoaded', () => {
        console.log('[Tarefas] ☁️ Dados da nuvem carregados...');
        if (usuarioLogado) {
            loadAllData();
            renderTasks();
            updateNotificationBadge();
        }
    });

    // Forçar refresh
    window.addEventListener('forceRefresh', () => {
        console.log('[Tarefas] 🔄 ForceRefresh recebido');
        if (usuarioLogado) {
            loadAllData();
            renderTasks();
            updateNotificationBadge();
        }
    });
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // PREVENIR INICIALIZAÇÃO MÚLTIPLA
    if (window._tasksLoaded) {
        console.log('[Tarefas] ⏳ Já carregado');
        return;
    }
    window._tasksLoaded = true;

    console.log('[Tarefas] 📋 DOM carregado, inicializando...');

    // Inicializar
    inicializarTarefas();
    configurarEventosTarefas();
    configurarListenersTarefas();

    // Se o CacheManager já estiver pronto, carregar dados
    if (window.CacheManager && window.CacheManager.isInitialized) {
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (usuarioSalvo) {
            try {
                usuarioLogado = JSON.parse(usuarioSalvo);
                if (usuarioLogado && usuarioLogado.id) {
                    loadAllData();
                    renderTasks();
                    updateNotificationBadge();
                }
            } catch(e) {}
        }
    }
});

// =====================================================
// NOTIFICAÇÕES NATIVAS PARA ANDROID
// =====================================================

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
    if (tasks && tasks.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const todayFormatted = new Date().toLocaleDateString('pt-BR');
        tasks.forEach(task => {
            if (!task.completed && (task.date === today || task.date === todayFormatted)) {
                sendNativeNotification('📋 Tarefa Hoje', task.title, 'tarefa');
            }
        });
    }
}

function checkUpcomingClasses() {
    if (window.CacheManager) {
        const schedule = window.CacheManager.get('weeklySchedule', {});
        const now = new Date();
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const today = days[now.getDay()];
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
}

// Executar verificações
setTimeout(() => {
    checkPendingTasks();
    checkUpcomingClasses();
}, 3000);

setInterval(() => {
    checkPendingTasks();
    checkUpcomingClasses();
}, 15 * 60 * 1000);

console.log('%c📋 Tarefas - Versão Definitiva Corrigida!', 'color: #f59e0b; font-size: 16px; font-weight: bold;');