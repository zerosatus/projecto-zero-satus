// mobile-telas/tarefas/script.js - VERSÃO CORRIGIDA COM CACHEMANAGER

let notifications = [];
let tasks = [];
let usuarioLogado = null;
let currentTaskFilter = 'todos';
let editingTaskId = null;
let selectedTaskPriority = 'media';
let selectedTaskColor = '#6366f1';
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
// ✅ FUNÇÃO CORRIGIDA: SALVAR DADOS
// ============================================
async function salvarTodosDados() {
    if (!usuarioLogado || !window.CacheManager || isSaving) return false;
    isSaving = true;
    
    try {
        // ✅ SALVAR NO CACHEMANAGER (ENVIA PARA SUPABASE)
        if (window.CacheManager.currentUserId !== usuarioLogado.id) {
            window.CacheManager.currentUserId = usuarioLogado.id;
        }
        
        window.CacheManager.set('tasks', tasks, true);
        window.CacheManager.set('notifications', notifications, true);
        
        console.log('[Tarefas Mobile] ✅ Salvo no CacheManager:', tasks.length);
        
        // ✅ Backup local com UUID
        const userId = usuarioLogado.id;
        localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
        localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
        
        // ✅ Disparar eventos para outras abas
        window.dispatchEvent(new CustomEvent('tasksUpdated', { detail: tasks }));
        window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key: 'tasks', value: tasks } }));
        
        return true;
    } catch (error) {
        console.error('[Tarefas Mobile] Erro ao salvar:', error);
        return false;
    } finally {
        setTimeout(() => { isSaving = false; }, 500);
    }
}

// ============================================
// ✅ FUNÇÃO CORRIGIDA: CARREGAR DADOS
// ============================================
async function carregarDados() {
    if (!usuarioLogado || !window.CacheManager) return;
    
    try {
        if (window.CacheManager.currentUserId !== usuarioLogado.id) {
            window.CacheManager.currentUserId = usuarioLogado.id;
        }
        
        // ✅ PRIORIDADE: CacheManager
        const cachedTasks = window.CacheManager.get('tasks', null);
        const cachedNotif = window.CacheManager.get('notifications', null);
        
        if (cachedTasks !== null && Array.isArray(cachedTasks)) {
            tasks = cachedTasks;
            console.log('[Tarefas Mobile] Carregado do CacheManager:', tasks.length);
        } else {
            // Fallback para localStorage com UUID
            const userId = usuarioLogado.id;
            const tasksSalvas = localStorage.getItem(`${userId}_tasks`);
            if (tasksSalvas) {
                tasks = JSON.parse(tasksSalvas);
                console.log('[Tarefas Mobile] Carregado do localStorage:', tasks.length);
            } else {
                tasks = [];
            }
        }
        
        if (cachedNotif !== null && Array.isArray(cachedNotif)) {
            notifications = cachedNotif;
        } else {
            const userId = usuarioLogado.id;
            const notifSalvas = localStorage.getItem(`${userId}_notifications`);
            if (notifSalvas) {
                notifications = JSON.parse(notifSalvas);
            } else {
                notifications = [];
            }
        }
        
        // ✅ Se não tiver tarefas, criar um exemplo
        if (tasks.length === 0) {
            tasks = [{
                id: Date.now(),
                title: 'Exemplo de Tarefa',
                subject: 'Geral',
                date: new Date().toLocaleDateString('pt-BR'),
                color: '#8b5cf6',
                priority: 'media',
                completed: false
            }];
            await salvarTodosDados();
        }
        
        renderTasks();
        updateNotificationBadge();
        
    } catch (error) {
        console.error('[Tarefas Mobile] Erro ao carregar dados:', error);
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
                salvarTodosDados();
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

function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.remove('active');
    editingTaskId = null;
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
    console.log('📋 Iniciando tarefas mobile com Supabase...');
    
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    try {
        usuarioLogado = JSON.parse(usuarioSalvo);
        console.log('[Tarefas Mobile] Usuário:', usuarioLogado.id);
    } catch(e) {
        console.error('[Tarefas Mobile] Erro ao parsear usuário:', e);
        window.location.href = '../../login/index.html';
        return;
    }
    
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuarioLogado.id;
        console.log('[Tarefas Mobile] CacheManager inicializado');
    }
    
    if (window.initSync && !window._tasksMobileSyncInit) {
        window._tasksMobileSyncInit = true;
        try {
            await window.initSync({ force: false });
            console.log('[Tarefas Mobile] Sync inicializado ✅');
        } catch(e) {
            console.warn('[Tarefas Mobile] Erro no sync:', e);
        }
    }
    
    await carregarDados();
    
    const headerName = document.getElementById('header-name');
    if (headerName && usuarioLogado.nome) {
        headerName.textContent = usuarioLogado.nome.split(' ')[0];
    }
    
    await carregarFotoPerfilMobile();
    
    // Configurar eventos
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
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTaskFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    document.getElementById('btn-add-task')?.addEventListener('click', () => openTaskModal(null));
    document.querySelector('[data-modal="task-modal"]')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeTaskModal();
    });
    
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTaskPriority = btn.dataset.priority;
        });
    });
    
    document.querySelectorAll('#task-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#task-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedTaskColor = option.dataset.color;
        });
    });
    
    document.getElementById('btn-save-task')?.addEventListener('click', async () => {
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
        
        await salvarTodosDados();
        showToast(editingTaskId ? 'Tarefa atualizada!' : 'Tarefa criada!', 'success');
        closeTaskModal();
        renderTasks();
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (view === 'home') window.location.href = '../index.html';
            else if (view === 'calendar') window.location.href = '../calendario/index.html';
            else if (view === 'tasks') renderTasks();
            else if (view === 'notes') window.location.href = '../notas/index.html';
            else if (view === 'profile') window.location.href = '../perfil/index.html';
        });
    });
    
    // ✅ LISTENERS GLOBAIS
    window.addEventListener('cloudDataLoaded', async () => {
        console.log('[Tarefas Mobile] 📡 Dados da nuvem carregados!');
        await carregarDados();
        renderTasks();
        showToast('🔄 Tarefas sincronizadas!', 'success');
    });
    
    window.addEventListener('tasksUpdated', (event) => {
        if (event.detail && !isSaving) {
            console.log('[Tarefas Mobile] Evento tasksUpdated recebido');
            tasks = event.detail;
            renderTasks();
            updateNotificationBadge();
        }
    });
    
    window.addEventListener('dataUpdated', (event) => {
        if (event.detail && event.detail.key === 'tasks' && !isSaving) {
            console.log('[Tarefas Mobile] DataUpdated recebido para tasks');
            tasks = event.detail.value;
            renderTasks();
            updateNotificationBadge();
        }
    });
    
    window.addEventListener('syncReady', () => {
        console.log('[Tarefas Mobile] 📡 Sync pronto, recarregando dados...');
        carregarDados();
        renderTasks();
    });
    
    window.addEventListener('profilePhotoUpdated', async (event) => {
        if (event.detail && event.detail.photoUrl) {
            const profileIcon = document.getElementById('notification-bell');
            if (profileIcon) {
                profileIcon.innerHTML = `<img src="${event.detail.photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
        }
    });
    
    // ✅ ESCUTAR MUDANÇAS NO localStorage (outras abas)
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.includes('_tasks')) {
            console.log('[Tarefas Mobile] Mudança detectada em outra aba:', e.key);
            carregarDados();
            renderTasks();
            updateNotificationBadge();
        }
    });
    
    console.log('✅ Tarefas mobile com Supabase inicializadas!');
});

console.log('%c📋 Tarefas Mobile - Supabase Apenas!', 'color: #f59e0b; font-size: 16px; font-weight: bold;');