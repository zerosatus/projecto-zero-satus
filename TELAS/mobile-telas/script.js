// mobile-telas/script.js - VERSÃO COMPLETA CORRIGIDA

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

// ===== FUNÇÃO DA FRASE DO DIA =====
function atualizarFraseDoDiaMobile() {
    const fraseElement = document.getElementById('fraseDoDiaTextMobile');
    if (fraseElement && window.FrasesDoDia) {
        const frase = window.FrasesDoDia.getFraseDoDia();
        fraseElement.textContent = frase;
        console.log('[Mobile] Frase do dia atualizada:', frase.substring(0, 40) + '...');
    } else if (fraseElement) {
        fraseElement.textContent = 'A persistência leva à perfeição. Continue firme nos estudos!';
    }
}

// ===== FUNÇÃO PARA ATUALIZAR AVATAR =====
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

// ===== FUNÇÃO PRINCIPAL DE CARREGAMENTO =====
async function carregarTodosDados() {
    if (!usuarioLogado) return;
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    console.log('[Mobile] Carregando dados do usuário:', userId);
    
    try {
        // TENTAR CARREGAR DO CACHEMANAGER PRIMEIRO
        if (window.CacheManager) {
            console.log('[Mobile] 📦 Carregando do CacheManager...');
            
            const cachedNotes = window.CacheManager.get('notes', null);
            const cachedTasks = window.CacheManager.get('tasks', null);
            const cachedEvents = window.CacheManager.get('calendarEvents', null);
            const cachedSchedule = window.CacheManager.get('weeklySchedule', null);
            const cachedSlots = window.CacheManager.get('timeSlots', null);
            const cachedNotif = window.CacheManager.get('notifications', null);
            
            if (cachedNotes !== null && Array.isArray(cachedNotes)) notes = cachedNotes;
            if (cachedTasks !== null && Array.isArray(cachedTasks)) tasks = cachedTasks;
            if (cachedEvents !== null && Array.isArray(cachedEvents)) calendarEvents = cachedEvents;
            if (cachedSchedule !== null) weeklySchedule = cachedSchedule;
            if (cachedSlots !== null && Array.isArray(cachedSlots)) timeSlots = cachedSlots;
            if (cachedNotif !== null && Array.isArray(cachedNotif)) notifications = cachedNotif;
            
            console.log('[Mobile] ✅ Dados do CacheManager carregados');
        }
        
        // FALLBACK PARA LOCALSTORAGE
        if (notes.length === 0) {
            const notesSalvas = localStorage.getItem(`${userId}_notes`);
            if (notesSalvas) {
                notes = JSON.parse(notesSalvas);
                console.log('[Mobile] Notes do localStorage:', notes.length);
            }
        }
        
        if (tasks.length === 0) {
            const tasksSalvas = localStorage.getItem(`${userId}_tasks`);
            if (tasksSalvas) {
                tasks = JSON.parse(tasksSalvas);
                console.log('[Mobile] Tasks do localStorage:', tasks.length);
            }
        }
        
        if (calendarEvents.length === 0) {
            const eventosSalvos = localStorage.getItem(`${userId}_calendarEvents`);
            if (eventosSalvos) {
                calendarEvents = JSON.parse(eventosSalvos);
                console.log('[Mobile] Events do localStorage:', calendarEvents.length);
            }
        }
        
        if (Object.keys(weeklySchedule).length === 0) {
            const scheduleSalvo = localStorage.getItem(`${userId}_weeklySchedule`);
            if (scheduleSalvo) {
                weeklySchedule = JSON.parse(scheduleSalvo);
                console.log('[Mobile] Schedule do localStorage');
            }
        }
        
        if (timeSlots.length === 0) {
            const slotsSalvos = localStorage.getItem(`${userId}_timeSlots`);
            if (slotsSalvos) {
                timeSlots = JSON.parse(slotsSalvos);
                console.log('[Mobile] TimeSlots do localStorage:', timeSlots.length);
            }
        }
        
        if (notifications.length === 0) {
            const notifSalvas = localStorage.getItem(`${userId}_notifications`);
            if (notifSalvas) {
                notifications = JSON.parse(notifSalvas);
                console.log('[Mobile] Notifications do localStorage:', notifications.length);
            }
        }
        
    } catch (error) {
        console.error('[Mobile] Erro ao carregar dados:', error);
    }
    
    // GARANTIR ESTRUTURAS PADRÃO
    if (timeSlots.length === 0) timeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30'];
    
    days.forEach(day => {
        if (!weeklySchedule[day]) weeklySchedule[day] = [];
    });
    
    console.log('[Mobile] 📊 Dados carregados:', {
        notes: notes.length,
        tasks: tasks.length,
        events: calendarEvents.length,
        schedule: Object.keys(weeklySchedule).length,
        timeSlots: timeSlots.length,
        notifications: notifications.length
    });
}

// ===== FUNÇÃO PARA SALVAR DADOS =====
async function salvarTodosDados() {
    if (!usuarioLogado) {
        console.error('[Mobile] Usuário não logado');
        return false;
    }
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    
    console.log('[Mobile] 💾 Salvando dados...');
    
    // SALVAR NO LOCALSTORAGE
    localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedule));
    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlots));
    localStorage.setItem(`${userId}_tasks`, JSON.stringify(tasks));
    localStorage.setItem(`${userId}_notes`, JSON.stringify(notes));
    localStorage.setItem(`${userId}_calendarEvents`, JSON.stringify(calendarEvents));
    localStorage.setItem(`${userId}_notifications`, JSON.stringify(notifications));
    
    // SALVAR NO CACHEMANAGER (SINCRONIZA COM FIRESTORE)
    if (window.CacheManager) {
        window.CacheManager.set('weeklySchedule', weeklySchedule || {}, true);
        window.CacheManager.set('timeSlots', timeSlots || [], true);
        window.CacheManager.set('tasks', tasks || [], true);
        window.CacheManager.set('notes', notes || [], true);
        window.CacheManager.set('calendarEvents', calendarEvents || [], true);
        window.CacheManager.set('notifications', notifications || [], true);
        
        console.log('[Mobile] ✅ Dados salvos e sincronizados!');
        return true;
    }
    
    return false;
}

// ===== RENDERIZAR HORÁRIO =====
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
    
    // EVENTOS DE CLIQUE
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

// ===== RENDERIZAR EDIÇÃO DE HORÁRIO =====
function renderizarEditSchedule() {
    const grid = document.getElementById('edit-schedule-grid');
    if (!grid) return;
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);
    
    const slots = timeSlots.length ? timeSlots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
    
    slots.forEach(time => {
        html += `<div class="time-slot-with-delete">
                    <span class="time-slot-text">${time}</span>
                    <button class="btn-delete-time" data-time="${time}" title="Remover este horário">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>`;
        
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem && classItem.materia) {
                html += `<div class="edit-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color || '#6366f1'}">
                        ${escapeHtml(classItem.materia)}
                        <button class="btn-delete-class" data-day="${day}" data-time="${time}" title="Remover esta aula">
                            <ion-icon name="close-circle-outline"></ion-icon>
                        </button>
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
    
    document.querySelectorAll('.btn-delete-time').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const timeSlot = btn.dataset.time;
            removerHorario(timeSlot);
        });
    });
    
    document.querySelectorAll('.btn-delete-class').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const day = btn.dataset.day;
            const time = btn.dataset.time;
            removerAula(day, time);
        });
    });
    
    document.querySelectorAll('.edit-cell .btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const day = btn.dataset.day;
            const time = btn.dataset.time;
            openSubjectModal(null, day, time);
        });
    });
}

// ===== FUNÇÕES DE REMOÇÃO =====
function removerHorario(timeSlot) {
    let hasClasses = false;
    
    for (const day of days) {
        if (weeklySchedule[day]?.some(cls => cls.horaInicio === timeSlot)) {
            hasClasses = true;
            break;
        }
    }
    
    if (hasClasses) {
        showConfirm(
            `O horário ${timeSlot} possui aulas agendadas. Excluir mesmo assim? As aulas serão removidas.`,
            'Remover Horário',
            (confirmed) => {
                if (confirmed) {
                    executarRemocaoHorario(timeSlot);
                }
            }
        );
    } else {
        executarRemocaoHorario(timeSlot);
    }
}

async function executarRemocaoHorario(timeSlot) {
    console.log('[Mobile] Removendo horário:', timeSlot);
    
    const index = timeSlots.indexOf(timeSlot);
    if (index !== -1) {
        timeSlots.splice(index, 1);
    }
    
    for (const day of days) {
        if (weeklySchedule[day]) {
            weeklySchedule[day] = weeklySchedule[day].filter(cls => cls.horaInicio !== timeSlot);
        }
    }
    
    timeSlots.sort();
    
    await salvarTodosDados();
    
    if (document.getElementById('edit-modal').classList.contains('active')) {
        renderizarEditSchedule();
    } else {
        renderizarHorario();
    }
    
    showToast(`Horário ${timeSlot} removido!`, 'success');
}

function removerAula(day, timeSlot) {
    showConfirm(`Remover aula de ${day} às ${timeSlot}?`, 'Remover Aula', async (confirmed) => {
        if (confirmed) {
            if (weeklySchedule[day]) {
                weeklySchedule[day] = weeklySchedule[day].filter(cls => cls.horaInicio !== timeSlot);
                await salvarTodosDados();
                
                if (document.getElementById('edit-modal').classList.contains('active')) {
                    renderizarEditSchedule();
                } else {
                    renderizarHorario();
                }
                showToast('Aula removida!', 'success');
            }
        }
    });
}

// ===== RENDERIZAR PRÓXIMAS TAREFAS =====
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

// ===== RENDERIZAR PRÓXIMO EVENTO =====
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

// ===== RENDERIZAR NOTIFICAÇÕES =====
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

// ===== ATUALIZAR CARDS =====
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

// ===== ATUALIZAR BADGE NOTIFICAÇÕES =====
function atualizarBadgeNotificacoes() {
    const badge = document.getElementById('notification-badge');
    const naoLidas = (notifications || []).filter(n => !n.read).length;
    if (badge) {
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
}

// ===== FUNÇÃO ESCAPE HTML =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== ABRIR MODAL DE MATÉRIA =====
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

// ===== SALVAR MATÉRIA =====
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

// ===== TOAST =====
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

// ===== CONFIRM =====
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

// ===== CONFIGURAR EVENTOS =====
function configurarEventos() {
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
        btnAddTime.addEventListener('click', async () => {
            const newTime = document.getElementById('new-time-input')?.value;
            if (newTime && !timeSlots.includes(newTime)) {
                timeSlots.push(newTime);
                timeSlots.sort();
                await salvarTodosDados();
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
}

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

// ===== INICIALIZAÇÃO PRINCIPAL =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Mobile] 🚀 Inicializando...');
    
    // INICIAR CACHEMANAGER
    if (window.CacheManager) {
        window.CacheManager.init();
    }
    
    // OBTER USUÁRIO
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    usuarioLogado = JSON.parse(usuarioSalvo);
    console.log('[Mobile] Usuário logado:', usuarioLogado.email);
    
    // CONFIGURAR USER ID NO CACHEMANAGER
    if (window.CacheManager) {
        window.CacheManager.currentUserId = usuarioLogado.uid || usuarioLogado.email;
        
        // TENTAR CARREGAR DA NUVEM
        await window.CacheManager.loadFromCloud(true);
        
        // INICIAR SINCRONIZAÇÃO EM TEMPO REAL
        if (window.CacheManager.startRealtimeSync) {
            window.CacheManager.startRealtimeSync();
        }
    }
    
    // CARREGAR DADOS
    await carregarTodosDados();
    
    // ATUALIZAR NOME NA TELA
    const headerName = document.getElementById('header-name');
    if (headerName && usuarioLogado.nome) {
        headerName.textContent = usuarioLogado.nome.split(' ')[0];
    }
    
    // RENDERIZAR INTERFACE
    renderizarHorario();
    renderizarProximoEvento();
    renderizarProximasTarefas();
    renderizarNotificacoes();
    atualizarCards();
    atualizarBadgeNotificacoes();
    await atualizarAvatarMobile();
    atualizarFraseDoDiaMobile();
    
    // ESCUTAR EVENTOS DE SINCRONIZAÇÃO
    window.addEventListener('cloudDataLoaded', async () => {
        console.log('[Mobile] 📡 cloudDataLoaded - Recarregando dados...');
        await carregarTodosDados();
        renderizarHorario();
        renderizarProximoEvento();
        renderizarProximasTarefas();
        renderizarNotificacoes();
        atualizarCards();
        atualizarBadgeNotificacoes();
        atualizarFraseDoDiaMobile();
        showToast('Dados sincronizados!', 'success');
    });
    
    // ESCUTAR ATUALIZAÇÕES DE PERFIL
    window.addEventListener('profilePhotoUpdated', async (event) => {
        if (event.detail && event.detail.photoUrl) {
            await atualizarAvatarMobile(event.detail.photoUrl);
        }
    });
    
    // CONFIGURAR EVENTOS DA INTERFACE
    configurarEventos();
    
    console.log('[Mobile] ✅ Inicialização concluída!');
    console.log('[Mobile] 📊 Dados finais:', {
        notes: notes.length,
        tasks: tasks.length,
        events: calendarEvents.length,
        schedule: Object.keys(weeklySchedule).length,
        notifications: notifications.length
    });
});

// INICIAR VERIFICAÇÕES PERIÓDICAS
setTimeout(() => { checkPendingTasks(); checkUpcomingClasses(); }, 3000);
setInterval(() => { checkPendingTasks(); checkUpcomingClasses(); }, 15 * 60 * 1000);

console.log('%c📱 Mobile Otimizado - Sincronização Completa!', 'color: #10b981; font-size: 16px; font-weight: bold;');