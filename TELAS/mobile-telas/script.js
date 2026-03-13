// ==================== DADOS GLOBAIS ====================
let notifications = [];
let weeklySchedule = {};
let timeSlots = [];
let calendarEvents = [];
let tasks = [];
let notes = [];
let notificacoesSettings = {};
let appearanceSettings = {};
let usuarioLogado = null;

// ==================== FUNÇÕES GLOBAIS ====================

// ✅ Modal de Confirmação Customizado
function showConfirm(message, title = 'Confirmar', callback) {
    const modal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const btnOk = document.getElementById('confirm-ok');
    const btnCancel = document.getElementById('confirm-cancel');
    
    if (!modal) {
        console.warn('Modal de confirmação não encontrado');
        callback?.(false);
        return;
    }
    
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    modal.classList.add('active');
    
    const newBtnOk = btnOk.cloneNode(true);
    const newBtnCancel = btnCancel.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');
    
    okBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        callback?.(true);
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        callback?.(false);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            callback?.(false);
        }
    }, { once: true });
}

// ✅ Animação de Salvamento no Botão
function showSavingAnimation(button, callback) {
    if (!button) {
        callback?.();
        return;
    }
    
    const originalText = button.textContent;
    const originalDisabled = button.disabled;
    
    button.classList.add('btn-saving');
    button.disabled = true;
    button.textContent = 'Salvando...';
    
    setTimeout(() => {
        button.classList.remove('btn-saving');
        button.disabled = originalDisabled;
        button.textContent = originalText;
        callback?.();
    }, 800);
}

// ✅ Toast Aprimorado
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container não encontrado');
        return;
    }
    
    const existingToast = container.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'checkmark-circle',
        error: 'close-circle',
        info: 'information-circle',
        warning: 'warning'
    };
    
    toast.innerHTML = `
        <ion-icon name="${icons[type] || icons.info}-outline"></ion-icon>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== SINCRONIZAÇÃO PC-MOBILE ====================

// Função para carregar dados do PC
function carregarDadosDoPC() {
    if (!usuarioLogado) return;
    
    console.log('🔄 Sincronizando com PC...');
    
    // Carregar TAREFAS do formato PC
    const tarefasPC = JSON.parse(localStorage.getItem(`tarefas_${usuarioLogado.email}`)) || [];
    
    // Converter para formato mobile
    const tarefasMobile = tarefasPC.map(tarefaPC => ({
        id: tarefaPC.id,
        title: tarefaPC.nome,
        subject: getTextoDisciplina(tarefaPC.disciplina),
        date: tarefaPC.prazo || '',
        color: getCorDisciplina(tarefaPC.disciplina),
        completed: tarefaPC.concluida || false,
        priority: tarefaPC.prioridade || 'media'
    }));
    
    // Mesclar tarefas (manter as existentes, adicionar novas)
    tarefasMobile.forEach(tm => {
        const existe = tasks.some(t => t.id === tm.id);
        if (!existe) {
            tasks.push(tm);
        }
    });
    
    // Carregar ANOTAÇÕES do formato PC
    const anotacoesPC = JSON.parse(localStorage.getItem(`anotacoes_${usuarioLogado.email}`)) || [];
    
    // Converter para formato mobile
    const anotacoesMobile = anotacoesPC.map(anotacaoPC => {
        let cor = 'fisica';
        if (anotacaoPC.tags && anotacaoPC.tags.length > 0) {
            const tag = anotacaoPC.tags[0].toLowerCase();
            if (tag.includes('fís') || tag.includes('fisica')) cor = 'fisica';
            else if (tag.includes('ing') || tag.includes('ingles')) cor = 'ingles';
            else if (tag.includes('port') || tag.includes('portugues')) cor = 'portugues';
            else if (tag.includes('quím') || tag.includes('quimica')) cor = 'quimica';
            else if (tag.includes('mat') || tag.includes('matematica')) cor = 'matematica';
            else if (tag.includes('hist') || tag.includes('historia')) cor = 'historia';
        }
        
        return {
            id: anotacaoPC.id,
            title: anotacaoPC.titulo,
            subject: anotacaoPC.disciplina || 'Geral',
            content: stripHtml(anotacaoPC.conteudo).substring(0, 100),
            date: new Date(anotacaoPC.dataModificacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            color: cor
        };
    });
    
    // Mesclar anotações
    anotacoesMobile.forEach(am => {
        const existe = notes.some(n => n.id === am.id);
        if (!existe) {
            notes.push(am);
        }
    });
    
    // Carregar EVENTOS do formato PC
    const eventosPC = JSON.parse(localStorage.getItem(`eventos_${usuarioLogado.email}`)) || [];
    
    // Converter para formato mobile
    const eventosMobile = eventosPC.map(eventoPC => ({
        id: eventoPC.id,
        title: eventoPC.title,
        description: eventoPC.description || '',
        date: `${eventoPC.year}-${String(eventoPC.month + 1).padStart(2, '0')}-${String(eventoPC.day).padStart(2, '0')}`,
        start: eventoPC.time,
        end: eventoPC.endTime || '',
        type: eventoPC.type || 'outro',
        color: eventoPC.color || getEventColor(eventoPC.type)
    }));
    
    // Mesclar eventos
    eventosMobile.forEach(em => {
        const existe = calendarEvents.some(e => e.id === em.id);
        if (!existe) {
            calendarEvents.push(em);
        }
    });
    
    saveAllData();
    console.log('✅ Sincronização concluída!');
}

// Função para salvar no formato PC
function salvarNoFormatoPC(tipo, dadosMobile) {
    if (!usuarioLogado) return;
    
    console.log(`💾 Salvando ${tipo} no formato PC...`);
    
    if (tipo === 'tarefa') {
        const tarefasPC = JSON.parse(localStorage.getItem(`tarefas_${usuarioLogado.email}`)) || [];
        const index = tarefasPC.findIndex(t => t.id == dadosMobile.id);
        
        const disciplina = getDisciplinaFromText(dadosMobile.subject);
        
        const tarefaPC = {
            id: dadosMobile.id,
            nome: dadosMobile.title,
            descricao: tarefasPC[index]?.descricao || '',
            prioridade: dadosMobile.priority || 'media',
            prazo: dadosMobile.date || '',
            disciplina: disciplina,
            subtasks: tarefasPC[index]?.subtasks || [],
            favorita: tarefasPC[index]?.favorita || false,
            concluida: dadosMobile.completed || false,
            dataCriacao: tarefasPC[index]?.dataCriacao || new Date().toISOString(),
            dataConclusao: dadosMobile.completed ? new Date().toISOString() : null
        };
        
        if (index >= 0) {
            tarefasPC[index] = tarefaPC;
        } else {
            tarefasPC.push(tarefaPC);
        }
        
        localStorage.setItem(`tarefas_${usuarioLogado.email}`, JSON.stringify(tarefasPC));
    }
    
    else if (tipo === 'anotacao') {
        const anotacoesPC = JSON.parse(localStorage.getItem(`anotacoes_${usuarioLogado.email}`)) || [];
        const index = anotacoesPC.findIndex(a => a.id == dadosMobile.id);
        
        const anotacaoPC = {
            id: dadosMobile.id,
            titulo: dadosMobile.title,
            conteudo: anotacoesPC[index]?.conteudo || `<p>${dadosMobile.content || ''}</p>`,
            disciplina: dadosMobile.subject || 'Geral',
            tags: [dadosMobile.color],
            dataModificacao: new Date().toISOString(),
            dataCriacao: anotacoesPC[index]?.dataCriacao || new Date().toISOString(),
            favorita: anotacoesPC[index]?.favorita || false
        };
        
        if (index >= 0) {
            anotacoesPC[index] = anotacaoPC;
        } else {
            anotacoesPC.push(anotacaoPC);
        }
        
        localStorage.setItem(`anotacoes_${usuarioLogado.email}`, JSON.stringify(anotacoesPC));
    }
    
    else if (tipo === 'evento') {
        const eventosPC = JSON.parse(localStorage.getItem(`eventos_${usuarioLogado.email}`)) || [];
        const index = eventosPC.findIndex(e => e.id == dadosMobile.id);
        
        const [ano, mes, dia] = dadosMobile.date.split('-').map(Number);
        
        const eventoPC = {
            id: dadosMobile.id,
            title: dadosMobile.title,
            description: dadosMobile.description || '',
            type: dadosMobile.type || 'outro',
            day: dia,
            month: mes - 1,
            year: ano,
            time: dadosMobile.start,
            endTime: dadosMobile.end || '',
            repeat: eventosPC[index]?.repeat || 'nao',
            reminder: eventosPC[index]?.reminder || false,
            color: dadosMobile.color || '#8b5cf6'
        };
        
        if (index >= 0) {
            eventosPC[index] = eventoPC;
        } else {
            eventosPC.push(eventoPC);
        }
        
        localStorage.setItem(`eventos_${usuarioLogado.email}`, JSON.stringify(eventosPC));
    }
}

// Funções auxiliares para conversão
function stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

function getTextoDisciplina(disciplina) {
    const textos = {
        matematica: 'Matemática', portugues: 'Português', historia: 'História',
        fisica: 'Física', quimica: 'Química', biologia: 'Biologia',
        geografia: 'Geografia', ingles: 'Inglês', outros: 'Outros'
    };
    return textos[disciplina] || disciplina;
}

function getCorDisciplina(disciplina) {
    const cores = {
        matematica: '#6366f1', portugues: '#ec4899', historia: '#f59e0b',
        fisica: '#ef4444', quimica: '#10b981', biologia: '#3b82f6',
        geografia: '#a855f7', ingles: '#8b5cf6', outros: '#6b7280'
    };
    return cores[disciplina] || '#6b7280';
}

function getDisciplinaFromText(text) {
    const mapa = {
        'matemática': 'matematica', 'matematica': 'matematica',
        'português': 'portugues', 'portugues': 'portugues',
        'história': 'historia', 'historia': 'historia',
        'física': 'fisica', 'fisica': 'fisica',
        'química': 'quimica', 'quimica': 'quimica',
        'biologia': 'biologia',
        'geografia': 'geografia',
        'inglês': 'ingles', 'ingles': 'ingles'
    };
    
    const lower = text.toLowerCase();
    for (let [key, value] of Object.entries(mapa)) {
        if (lower.includes(key)) return value;
    }
    return 'outros';
}

function getEventColor(type) {
    const cores = {
        'aula': '#6366f1',
        'prova': '#ef4444',
        'tarefa': '#10b981',
        'trabalho': '#f59e0b',
        'reuniao': '#8b5cf6',
        'outro': '#8b5cf6'
    };
    return cores[type] || '#8b5cf6';
}

// ==================== DADOS PADRÃO ====================

function saveAllData() {
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
    localStorage.setItem('timeSlots', JSON.stringify(timeSlots));
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('notificacoesSettings', JSON.stringify(notificacoesSettings));
    localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
}

function loadAllData() {
    usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || null;
    notifications = JSON.parse(localStorage.getItem('notifications')) || getDefaultNotifications();
    weeklySchedule = JSON.parse(localStorage.getItem('weeklySchedule')) || getDefaultSchedule();
    timeSlots = JSON.parse(localStorage.getItem('timeSlots')) || ['08:00', '09:00', '10:00', '14:00'];
    calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    tasks = JSON.parse(localStorage.getItem('tasks')) || getDefaultTasks();
    notes = JSON.parse(localStorage.getItem('notes')) || getDefaultNotes();
    notificacoesSettings = JSON.parse(localStorage.getItem('notificacoesSettings')) || { push: true, email: false, aulas: true, tarefas: true };
    appearanceSettings = JSON.parse(localStorage.getItem('appearanceSettings')) || { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
}

function getDefaultNotifications() {
    return [
        { id: 1, type: 'aula', title: 'Aula de Matemática', message: 'Lembrete: Aula de Matemática às 14h hoje', time: new Date().toISOString(), read: false },
        { id: 2, type: 'tarefa', title: 'Tarefa Pendente', message: 'Lista de Exercícios de Física para entregar amanhã', time: new Date().toISOString(), read: false },
        { id: 3, type: 'lembrete', title: 'Prova de História', message: 'Sua prova de História será na próxima segunda-feira', time: new Date().toISOString(), read: false }
    ];
}

function getDefaultSchedule() {
    return {
        'Seg': [
            { hora: '08:00', materia: 'Matemática', color: '#6366f1', professor: '' },
            { hora: '09:00', materia: 'Química', color: '#10b981', professor: '' },
            { hora: '14:00', materia: 'Matemática', color: '#6366f1', professor: '' }
        ],
        'Ter': [
            { hora: '08:00', materia: 'Português', color: '#ec4899', professor: '' },
            { hora: '09:00', materia: 'Biologia', color: '#3b82f6', professor: '' },
            { hora: '10:00', materia: 'Redação', color: '#2563eb', professor: '' }
        ],
        'Qua': [
            { hora: '08:00', materia: 'Física', color: '#ef4444', professor: '' },
            { hora: '09:00', materia: 'Inglês', color: '#8b5cf6', professor: '' },
            { hora: '14:00', materia: 'Química', color: '#10b981', professor: '' }
        ],
        'Qui': [
            { hora: '08:00', materia: 'História', color: '#f59e0b', professor: '' },
            { hora: '10:00', materia: 'Física', color: '#ef4444', professor: '' }
        ],
        'Sex': [
            { hora: '08:00', materia: 'História', color: '#f59e0b', professor: '' },
            { hora: '09:00', materia: 'Geografia', color: '#a855f7', professor: '' }
        ]
    };
}

function getDefaultTasks() {
    return [
        { id: 1, title: 'Entregar Redação', subject: 'Português', date: getTomorrowDate(), color: '#ec4899', completed: false, priority: 'alta' },
        { id: 2, title: 'Lista de Exercícios', subject: 'Matemática', date: getTodayDate(), color: '#6366f1', completed: false, priority: 'media' },
        { id: 3, title: 'Resumo Cap. 5', subject: 'História', date: getYesterdayDate(), color: '#f59e0b', completed: true, priority: 'baixa' }
    ];
}

function getDefaultNotes() {
    return [
        { id: 1, title: 'Fórmulas de Física', subject: 'Física • Mecânica', content: '', date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), color: 'fisica' },
        { id: 2, title: 'Vocabulário Inglês', subject: 'Inglês • Unit 4', content: '', date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), color: 'ingles' }
    ];
}

// ==================== SISTEMA AUTOMÁTICO DE AULAS E TAREFAS ====================

function getTodayDate() {
    const today = new Date();
    return today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getDayKey() {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const todayIndex = new Date().getDay();
    return weekDays[todayIndex];
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getNextClasses() {
    const todayKey = getDayKey();
    const currentTime = getCurrentTime();
    
    if (!weeklySchedule[todayKey]) return [];
    
    const todayClasses = weeklySchedule[todayKey]
        .filter(classItem => classItem.hora >= currentTime)
        .sort((a, b) => a.hora.localeCompare(b.hora));
    
    return todayClasses.slice(0, 4);
}

function getNextCalendarEvent() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today;
    }).sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.start);
        const dateB = new Date(b.date + 'T' + b.start);
        return dateA - dateB;
    });
    
    return futureEvents.slice(0, 3);
}

function getUpcomingTasks() {
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();
    
    const upcomingTasks = tasks.filter(task => {
        if (task.completed) return false;
        return task.date === today || task.date === tomorrow || task.date.includes('Hoje') || task.date.includes('Amanhã');
    }).sort((a, b) => {
        if (a.date.includes('Hoje')) return -1;
        if (b.date.includes('Hoje')) return 1;
        if (a.date.includes('Amanhã')) return -1;
        if (b.date.includes('Amanhã')) return 1;
        return 0;
    });
    
    return upcomingTasks.slice(0, 3);
}

function createAutomaticNotifications() {
    const nextClasses = getNextClasses();
    const upcomingTasks = getUpcomingTasks();
    const now = new Date().toISOString();
    
    nextClasses.slice(0, 2).forEach((classItem, index) => {
        const exists = notifications.some(n => 
            n.type === 'aula' && 
            n.message.includes(classItem.materia) &&
            n.message.includes('hoje')
        );
        
        if (!exists && index === 0) {
            notifications.unshift({
                id: Date.now() + index,
                type: 'aula',
                title: `Aula de ${classItem.materia}`,
                message: `Lembrete: ${classItem.materia} às ${classItem.hora} hoje`,
                time: now,
                read: false
            });
        }
    });
    
    upcomingTasks.slice(0, 2).forEach((task, index) => {
        const exists = notifications.some(n => n.type === 'tarefa' && n.title === task.title);
        
        if (!exists) {
            const urgency = task.date.includes('Hoje') ? 'HOJE' : 'amanhã';
            notifications.unshift({
                id: Date.now() + 10 + index,
                type: 'tarefa',
                title: `Tarefa: ${task.title}`,
                message: `Entrega ${urgency}: ${task.subject}`,
                time: now,
                read: false
            });
        }
    });
    
    saveAllData();
    updateNotificationBadge();
}

// ==================== CARDS DINÂMICOS DA HOME ====================

function updateSummaryCards() {
    const disciplinas = countDisciplines();
    const { concluidas, pendentes } = countTasks();
    
    const cardDisciplinas = document.querySelector('.card:nth-child(1) .card-number');
    const cardConcluidas = document.querySelector('.card:nth-child(2) .card-number');
    const cardPendentes = document.querySelector('.card:nth-child(3) .card-number');
    
    if (cardDisciplinas) cardDisciplinas.textContent = disciplinas;
    if (cardConcluidas) cardConcluidas.textContent = concluidas;
    if (cardPendentes) cardPendentes.textContent = pendentes;
}

function countDisciplines() {
    const materias = new Set();
    Object.values(weeklySchedule).forEach(day => {
        day.forEach(classItem => {
            if (classItem.materia) {
                materias.add(classItem.materia.toLowerCase());
            }
        });
    });
    return materias.size || 0;
}

function countTasks() {
    const concluidas = tasks.filter(t => t.completed).length;
    const pendentes = tasks.filter(t => !t.completed).length;
    return { concluidas, pendentes };
}

// ==================== NOTIFICAÇÕES ====================

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    saveAllData();
}

function formatNotificationTime(timeString) {
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return notifTime.toLocaleDateString('pt-BR');
}

function renderNotificationsModal(filter = 'all') {
    const list = document.getElementById('notifications-list-modal');
    let filtered = notifications;

    if (filter === 'unread') {
        filtered = notifications.filter(n => !n.read);
    } else if (filter === 'aulas') {
        filtered = notifications.filter(n => n.type === 'aula');
    } else if (filter === 'tarefas') {
        filtered = notifications.filter(n => n.type === 'tarefa');
    }

    if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-notifications"><ion-icon name="notifications-off-outline"></ion-icon><p>Nenhuma notificação</p></div>`;
        return;
    }

    filtered.sort((a, b) => new Date(b.time) - new Date(a.time));

    let html = '';
    filtered.forEach(notif => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time', 'aviso': 'warning' };
        html += `
            <div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notification-icon ${notif.type}">
                    <ion-icon name="${iconMap[notif.type]}-outline"></ion-icon>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">
                        <ion-icon name="time-outline"></ion-icon>
                        ${formatNotificationTime(notif.time)}
                    </div>
                </div>
                <div class="notification-actions">
                    ${!notif.read ? `<button class="notification-action-btn btn-mark-single" data-id="${notif.id}"><ion-icon name="checkmark-outline"></ion-icon></button>` : ''}
                    <button class="notification-action-btn btn-delete-single" data-id="${notif.id}"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;

    document.querySelectorAll('.notification-item-modal').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.notification-action-btn')) return;
            const id = parseInt(item.dataset.id);
            markAsRead(id);
        });
    });

    document.querySelectorAll('.btn-mark-single').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            markAsRead(id);
        });
    });

    document.querySelectorAll('.btn-delete-single').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteNotification(id);
        });
    });
}

function markAsRead(id) {
    const index = notifications.findIndex(n => n.id === id);
    if (index > -1) {
        notifications[index].read = true;
        updateNotificationBadge();
        renderNotificationsModal();
    }
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationsModal();
}

function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    updateNotificationBadge();
    renderNotificationsModal();
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            showToast('Notificações limpas!', 'success');
        }
    });
}

// ==================== HORÁRIO ====================

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
let selectedSubjectColor = '#6366f1';
let editingSubject = null;

function renderSchedule() {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    
    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);

    timeSlots.forEach(time => {
        html += `<div class="time-slot">${time}</div>`;
        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.hora === time);
            if (classItem) {
                html += `
                    <div class="class-cell editable-subject" data-day="${day}" data-time="${time}">
                        <div class="class-block subject-custom" style="background-color: ${classItem.color}">
                            ${classItem.materia}
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="class-cell add-subject-btn" data-day="${day}" data-time="${time}">
                        <div class="class-block empty">+</div>
                    </div>
                `;
            }
        });
    });

    grid.innerHTML = html;
    attachSubjectEvents();
}

function attachSubjectEvents() {
    document.querySelectorAll('.add-subject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.dataset.day;
            const time = btn.dataset.time;
            openSubjectModal(null, day, time);
        });
    });

    document.querySelectorAll('.editable-subject').forEach(cell => {
        cell.addEventListener('click', () => {
            const day = cell.dataset.day;
            const time = cell.dataset.time;
            const subject = weeklySchedule[day]?.find(c => c.hora === time);
            if (subject) {
                openSubjectModal(subject, day, time);
            }
        });
    });
}

function openSubjectModal(subject, day, time) {
    const subjectModal = document.getElementById('subject-modal');
    const subjectModalTitle = document.getElementById('subject-modal-title');
    const subjectNameInput = document.getElementById('subject-name-input');
    const subjectTeacherInput = document.getElementById('subject-teacher-input');
    const subjectStartInput = document.getElementById('subject-start-input');
    const subjectDayInput = document.getElementById('subject-day-input');
    
    if (!subjectModal) return;
    
    editingSubject = subject;
    
    if (subjectDayInput) subjectDayInput.value = day;
    
    if (subject) {
        subjectModalTitle.textContent = 'Editar Matéria';
        if (subjectNameInput) subjectNameInput.value = subject.materia;
        if (subjectTeacherInput) subjectTeacherInput.value = subject.professor || '';
        if (subjectStartInput) subjectStartInput.value = subject.hora;
        selectedSubjectColor = subject.color;
    } else {
        subjectModalTitle.textContent = 'Adicionar Matéria';
        if (subjectNameInput) subjectNameInput.value = '';
        if (subjectTeacherInput) subjectTeacherInput.value = '';
        if (subjectStartInput) subjectStartInput.value = time;
        selectedSubjectColor = '#6366f1';
    }
    
    updateSubjectColorOptions();
    subjectModal.classList.add('active');
}

function updateSubjectColorOptions() {
    const subjectColorOptions = document.querySelectorAll('#subject-modal .color-option');
    subjectColorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedSubjectColor);
    });
}

function renderClassesDynamic() {
    const list = document.getElementById('classes-list');
    if (!list) return;
    
    const nextClasses = getNextClasses();
    
    if (nextClasses.length === 0) {
        list.innerHTML = `
            <div class="list-item">
                <div class="item-icon matematica"><ion-icon name="book-outline"></ion-icon></div>
                <div class="item-info">
                    <div class="item-title">Sem aulas hoje</div>
                    <div class="item-subtitle">Aproveite o dia! 🎉</div>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    nextClasses.forEach(item => {
        html += `
            <div class="list-item">
                <div class="item-icon" style="background-color: ${item.color}20; color: ${item.color}">
                    <ion-icon name="book-outline"></ion-icon>
                </div>
                <div class="item-info">
                    <div class="item-title">${item.materia}</div>
                    <div class="item-subtitle">Hoje - ${item.hora}${item.professor ? ` • ${item.professor}` : ''}</div>
                </div>
                <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

function renderNextEvent() {
    const container = document.getElementById('next-event-container');
    if (!container) return;
    
    const nextEvents = getNextCalendarEvent();
    
    if (nextEvents.length === 0) {
        container.innerHTML = `
            <div class="list-item">
                <div class="item-icon matematica"><ion-icon name="calendar-outline"></ion-icon></div>
                <div class="item-info">
                    <div class="item-title">Sem eventos próximos</div>
                    <div class="item-subtitle">Adicione um evento no calendário 📅</div>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    nextEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const dateFormatted = eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        html += `
            <div class="list-item">
                <div class="item-icon" style="background-color: ${event.color}20; color: ${event.color}">
                    <ion-icon name="calendar-outline"></ion-icon>
                </div>
                <div class="item-info">
                    <div class="item-title">${event.title}</div>
                    <div class="item-subtitle">${dateFormatted} • ${event.start}</div>
                </div>
                <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderNextTasks() {
    const container = document.getElementById('next-tasks-container');
    if (!container) return;
    
    const upcomingTasks = getUpcomingTasks();
    
    if (upcomingTasks.length === 0) {
        container.innerHTML = `
            <div class="list-item">
                <div class="item-icon matematica"><ion-icon name="checkmark-circle-outline"></ion-icon></div>
                <div class="item-info">
                    <div class="item-title">Tudo em dia!</div>
                    <div class="item-subtitle">Nenhuma tarefa pendente ✨</div>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    upcomingTasks.forEach(task => {
        html += `
            <div class="list-item">
                <div class="item-icon" style="background-color: ${task.color}20; color: ${task.color}">
                    <ion-icon name="checkbox-outline"></ion-icon>
                </div>
                <div class="item-info">
                    <div class="item-title">${task.title}</div>
                    <div class="item-subtitle">${task.subject} • ${task.date}</div>
                </div>
                <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderNotificationsDynamic() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    
    const unreadNotifications = notifications
        .filter(n => !n.read)
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 3);
    
    if (unreadNotifications.length === 0) {
        list.innerHTML = `
            <div class="list-item">
                <div class="item-icon notification"><ion-icon name="checkmark-circle-outline"></ion-icon></div>
                <div class="item-info">
                    <div class="item-title">Tudo em dia!</div>
                    <div class="item-subtitle">Nenhuma notificação pendente ✨</div>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    unreadNotifications.forEach(item => {
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time', 'aviso': 'warning' };
        html += `
            <div class="list-item notification-item">
                <div class="item-icon" style="background-color: var(--accent-purple); color: white">
                    <ion-icon name="${iconMap[item.type] || 'notifications'}-outline"></ion-icon>
                </div>
                <div class="item-info">
                    <div class="item-title">${item.title}</div>
                    <div class="item-subtitle">${item.message}</div>
                </div>
                <div class="item-arrow"><ion-icon name="chevron-forward-outline"></ion-icon></div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

function refreshHomeData() {
    createAutomaticNotifications();
    updateSummaryCards();
    renderClassesDynamic();
    renderNextEvent();
    renderNextTasks();
    renderNotificationsDynamic();
    renderSchedule();
}

// ==================== CALENDÁRIO ====================

let currentDate = new Date(2026, 2, 1);
let selectedDay = 1;
let selectedEventType = 'aula';
let selectedEventColor = '#8b5cf6';
let editingEventId = null;

function renderCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthYear = document.getElementById('current-month-year');
    
    if (!calendarDays) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    if (currentMonthYear) currentMonthYear.textContent = `${monthNames[month]} de ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
        const isSelected = day === selectedDay;
        const hasEvent = calendarEvents.some(e => {
            const eventDate = new Date(e.date);
            return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
        });
        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}" data-day="${day}">${day}</div>`;
    }
    
    calendarDays.innerHTML = html;
    
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', () => {
            selectedDay = parseInt(day.dataset.day);
            const eventsDate = document.getElementById('events-date');
            if (eventsDate) eventsDate.textContent = `Eventos do dia ${selectedDay}`;
            renderEvents();
            renderCalendar();
        });
    });
    
    renderEvents();
}

function renderEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    const dayEvents = calendarEvents.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getDate() === selectedDay && 
               eventDate.getMonth() === currentDate.getMonth() && 
               eventDate.getFullYear() === currentDate.getFullYear();
    });

    if (dayEvents.length === 0) {
        eventsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhum evento neste dia</p>';
        return;
    }

    let html = '';
    dayEvents.forEach(event => {
        const iconMap = { 'aula': 'book', 'prova': 'document', 'tarefa': 'checkbox', 'trabalho': 'briefcase', 'reuniao': 'people', 'outro': 'calendar' };
        html += `
            <div class="event-item ${event.type}" data-id="${event.id}" style="border-left-color: ${event.color}">
                <div class="event-icon" style="background-color: ${event.color}20; color: ${event.color}">
                    <ion-icon name="${iconMap[event.type] || 'calendar'}-outline"></ion-icon>
                </div>
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">${event.start} - ${event.end}</div>
                </div>
                <div class="event-actions">
                    <ion-icon name="create-outline" class="edit-event" data-id="${event.id}" style="margin-right: 10px;"></ion-icon>
                    <ion-icon name="trash-outline" class="delete-event" data-id="${event.id}"></ion-icon>
                </div>
            </div>
        `;
    });

    eventsList.innerHTML = html;

    document.querySelectorAll('.edit-event').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventId = icon.dataset.id;
            const event = calendarEvents.find(ev => ev.id == eventId);
            if (event) {
                openEventModal(event);
            }
        });
    });

    document.querySelectorAll('.delete-event').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventId = icon.dataset.id;
            showConfirm('Excluir este evento?', 'Excluir Evento', (confirmed) => {
                if (confirmed) {
                    calendarEvents = calendarEvents.filter(ev => ev.id != eventId);
                    saveAllData();
                    salvarNoFormatoPC('evento', { id: eventId }); // Sincronizar exclusão
                    renderEvents();
                    renderCalendar();
                    showToast('Evento excluído!', 'success');
                }
            });
        });
    });
}

function openEventModal(event) {
    const eventModal = document.getElementById('event-modal');
    const eventTitle = document.getElementById('event-title');
    const eventDateInput = document.getElementById('event-date');
    const eventStart = document.getElementById('event-start');
    const eventEnd = document.getElementById('event-end');
    
    if (!eventModal) return;
    
    editingEventId = event ? event.id : null;
    
    if (event) {
        if (eventTitle) eventTitle.value = event.title;
        if (eventDateInput) eventDateInput.value = event.date;
        if (eventStart) eventStart.value = event.start;
        if (eventEnd) eventEnd.value = event.end;
        selectedEventType = event.type;
        selectedEventColor = event.color;
    } else {
        if (eventTitle) eventTitle.value = '';
        if (eventDateInput) eventDateInput.value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
        if (eventStart) eventStart.value = '08:00';
        if (eventEnd) eventEnd.value = '09:00';
        selectedEventType = 'aula';
        selectedEventColor = '#8b5cf6';
    }
    
    updateTypeButtons();
    updateColorOptions();
    eventModal.classList.add('active');
}

function updateTypeButtons() {
    const typeBtns = document.querySelectorAll('.event-types .type-btn');
    typeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === selectedEventType);
    });
}

function updateColorOptions() {
    const colorOptions = document.querySelectorAll('#event-modal .color-option');
    colorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedEventColor);
    });
}

// ==================== TAREFAS ====================

let currentTaskFilter = 'todos';
let editingTaskId = null;
let selectedTaskType = 'matematica';
let selectedTaskPriority = 'baixa';
let selectedTaskColor = '#6366f1';

function updateTaskTypeButtons() {
    const taskTypeBtns = document.querySelectorAll('.task-types .type-btn');
    taskTypeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === selectedTaskType);
    });
}

function updateTaskPriorityButtons() {
    const taskPriorityBtns = document.querySelectorAll('.priority-btn');
    taskPriorityBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === selectedTaskPriority);
    });
}

function updateTaskColorOptions() {
    const taskColorOptions = document.querySelectorAll('#task-modal .color-option');
    taskColorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedTaskColor);
    });
}

function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;
    
    let filteredTasks = tasks;
    
    if (currentTaskFilter === 'pendentes') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentTaskFilter === 'concluidas') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Nenhuma tarefa encontrada</p>';
        return;
    }
    
    let html = '';
    filteredTasks.forEach(task => {
        html += `
            <div class="task-item ${task.completed ? 'completed' : ''} prioridade-${task.priority || 'baixa'}" data-id="${task.id}" style="border-left-color: ${task.color}">
                <div class="task-color" style="background-color: ${task.color};"></div>
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-subject">${task.subject}</div>
                    <div class="task-date"><ion-icon name="calendar-outline"></ion-icon> ${task.date}</div>
                </div>
                <div class="task-check ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                    ${task.completed ? '<ion-icon name="checkmark-outline"></ion-icon>' : ''}
                </div>
                <div class="task-arrow" data-id="${task.id}"><ion-icon name="chevron-forward-outline"></ion-icon></div>
            </div>
        `;
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
                salvarNoFormatoPC('tarefa', task);
                updateSummaryCards();
                renderTasks();
            }
        });
    });

    document.querySelectorAll('.task-arrow').forEach(arrow => {
        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = arrow.dataset.id;
            const task = tasks.find(t => t.id == taskId);
            if (task) {
                openTaskModal(task);
            }
        });
    });
}

function openTaskModal(task) {
    const taskModal = document.getElementById('task-modal');
    const taskModalTitle = document.getElementById('task-modal-title');
    const taskTitleInput = document.getElementById('task-title');
    const taskSubjectInput = document.getElementById('task-subject');
    const taskDateInput = document.getElementById('task-date');
    
    if (!taskModal) return;
    
    editingTaskId = task ? task.id : null;
    
    if (task) {
        taskModalTitle.textContent = 'Editar Tarefa';
        if (taskTitleInput) taskTitleInput.value = task.title;
        if (taskSubjectInput) taskSubjectInput.value = task.subject;
        if (taskDateInput) taskDateInput.value = task.date;
        selectedTaskColor = task.color || '#6366f1';
        selectedTaskPriority = task.priority || 'baixa';
    } else {
        taskModalTitle.textContent = 'Nova Tarefa';
        if (taskTitleInput) taskTitleInput.value = '';
        if (taskSubjectInput) taskSubjectInput.value = '';
        if (taskDateInput) taskDateInput.value = '';
        selectedTaskType = 'matematica';
        selectedTaskPriority = 'baixa';
        selectedTaskColor = '#6366f1';
    }
    
    updateTaskTypeButtons();
    updateTaskPriorityButtons();
    updateTaskColorOptions();
    taskModal.classList.add('active');
}

// ==================== ANOTAÇÕES ====================

let editingNoteId = null;
let selectedNoteColor = 'fisica';

function updateNoteColorOptions() {
    const noteColorOptions = document.querySelectorAll('#note-modal .color-option');
    noteColorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === selectedNoteColor);
    });
}

function renderNotes(searchTerm = '') {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) return;
    
    let filteredNotes = notes;
    
    if (searchTerm) {
        filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px; grid-column: 1/-1;">Nenhuma anotação encontrada</p>';
        return;
    }
    
    let html = '';
    filteredNotes.forEach(note => {
        html += `
            <div class="note-card ${note.color || 'matematica'}" data-id="${note.id}">
                <div>
                    <div class="note-title">${note.title}</div>
                    <div class="note-subject">${note.subject}</div>
                </div>
                <div class="note-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <div class="note-date">${note.date}</div>
                    <div class="note-actions">
                        <ion-icon name="create-outline" class="edit-note" data-id="${note.id}" style="margin-right: 10px; cursor: pointer;"></ion-icon>
                        <ion-icon name="trash-outline" class="delete-note" data-id="${note.id}" style="cursor: pointer;"></ion-icon>
                    </div>
                </div>
            </div>
        `;
    });
    
    notesGrid.innerHTML = html;

    document.querySelectorAll('.edit-note').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = icon.dataset.id;
            const note = notes.find(n => n.id == noteId);
            if (note) {
                openNoteModal(note);
            }
        });
    });

    document.querySelectorAll('.delete-note').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = icon.dataset.id;
            showConfirm('Excluir esta anotação?', 'Excluir Anotação', (confirmed) => {
                if (confirmed) {
                    notes = notes.filter(n => n.id != noteId);
                    saveAllData();
                    salvarNoFormatoPC('anotacao', { id: noteId });
                    updateSummaryCards();
                    renderNotes();
                    showToast('Anotação excluída!', 'success');
                }
            });
        });
    });
}

function openNoteModal(note) {
    const noteModal = document.getElementById('note-modal');
    const noteModalTitle = document.getElementById('note-modal-title');
    const noteTitleInput = document.getElementById('note-title');
    const noteSubjectInput = document.getElementById('note-subject');
    const noteContentInput = document.getElementById('note-content');
    
    if (!noteModal) return;
    
    editingNoteId = note ? note.id : null;
    
    if (note) {
        noteModalTitle.textContent = 'Editar Anotação';
        if (noteTitleInput) noteTitleInput.value = note.title;
        if (noteSubjectInput) noteSubjectInput.value = note.subject;
        if (noteContentInput) noteContentInput.value = note.content || '';
        selectedNoteColor = note.color || 'matematica';
    } else {
        noteModalTitle.textContent = 'Nova Anotação';
        if (noteTitleInput) noteTitleInput.value = '';
        if (noteSubjectInput) noteSubjectInput.value = '';
        if (noteContentInput) noteContentInput.value = '';
        selectedNoteColor = 'fisica';
    }
    
    updateNoteColorOptions();
    noteModal.classList.add('active');
}

// ==================== PERFIL ====================

let selectedTheme = 'dark';
let selectedAccent = '#8b5cf6';

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function loadProfileData() {
    if (usuarioLogado) {
        const nameInput = document.getElementById('profile-name-input');
        const emailInput = document.getElementById('profile-email-input');
        const avatarPreview = document.getElementById('avatar-preview');
        if (nameInput) nameInput.value = usuarioLogado.nome || '';
        if (emailInput) emailInput.value = usuarioLogado.email || '';
        if (avatarPreview) avatarPreview.textContent = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
    }
}

function loadNotificacoes() {
    const push = document.getElementById('toggle-push');
    const email = document.getElementById('toggle-email');
    const aulas = document.getElementById('toggle-aulas');
    const tarefas = document.getElementById('toggle-tarefas');
    if (push) push.checked = notificacoesSettings.push;
    if (email) email.checked = notificacoesSettings.email;
    if (aulas) aulas.checked = notificacoesSettings.aulas;
    if (tarefas) tarefas.checked = notificacoesSettings.tarefas;
}

function loadAparencia() {
    selectedTheme = appearanceSettings.theme;
    selectedAccent = appearanceSettings.accent;
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === selectedTheme);
    });
    
    document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.accent === selectedAccent);
    });
    
    const slider = document.getElementById('font-size-slider');
    if (slider) slider.value = appearanceSettings.fontSize;
}

window.toggleFaq = function(element) {
    element.classList.toggle('active');
}

// ==================== NAVEGAÇÃO ENTRE VIEWS ====================

function switchView(viewName) {
    const homeView = document.getElementById('home-view');
    const calendarView = document.getElementById('calendar-view');
    const tasksViewNav = document.getElementById('tasks-view');
    const notesViewNav = document.getElementById('notes-view');
    const profileViewNav = document.getElementById('profile-view');
    const homeOnlySections = document.querySelectorAll('.home-only');
    
    if (homeView) homeView.classList.add('hidden');
    if (calendarView) calendarView.classList.add('hidden');
    if (tasksViewNav) tasksViewNav.classList.add('hidden');
    if (notesViewNav) notesViewNav.classList.add('hidden');
    if (profileViewNav) profileViewNav.classList.add('hidden');
    
    if (viewName === 'home') {
        if (homeView) homeView.classList.remove('hidden');
        homeOnlySections.forEach(section => section.style.display = 'block');
        refreshHomeData();
    } else if (viewName === 'calendar') {
        if (calendarView) calendarView.classList.remove('hidden');
        homeOnlySections.forEach(section => section.style.display = 'none');
        renderCalendar();
    } else if (viewName === 'tasks') {
        if (tasksViewNav) tasksViewNav.classList.remove('hidden');
        homeOnlySections.forEach(section => section.style.display = 'none');
        renderTasks();
    } else if (viewName === 'notes') {
        if (notesViewNav) notesViewNav.classList.remove('hidden');
        homeOnlySections.forEach(section => section.style.display = 'none');
        renderNotes();
    } else if (viewName === 'profile') {
        if (profileViewNav) profileViewNav.classList.remove('hidden');
        homeOnlySections.forEach(section => section.style.display = 'none');
    }
    
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.toggle('active', nav.dataset.view === viewName);
    });
}

// ==================== DOMContentLoaded ====================
document.addEventListener('DOMContentLoaded', () => {
    // ✅ CARREGAR TODOS OS DADOS PRIMEIRO
    loadAllData();
    
    // ✅ SINCRONIZAR COM PC AO INICIAR
    carregarDadosDoPC();
    
    // ✅ CRIAR NOTIFICAÇÕES AUTOMÁTICAS
    createAutomaticNotifications();
    
    // ==================== ATUALIZAR DADOS DO USUÁRIO ====================
    if (usuarioLogado) {
        const headerName = document.getElementById('header-name');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileInitial = document.getElementById('profile-initial');
        
        if (headerName) headerName.textContent = usuarioLogado.nome.split(' ')[0];
        if (profileName) profileName.textContent = usuarioLogado.nome;
        if (profileEmail) profileEmail.textContent = usuarioLogado.email;
        if (profileInitial) profileInitial.textContent = usuarioLogado.nome.charAt(0).toUpperCase();
    }
    
    // ==================== BOTÃO DE SINCRONIZAÇÃO ====================
    // Adicionar botão de sincronização no header
    const header = document.querySelector('header');
    if (header) {
        const syncBtn = document.createElement('div');
        syncBtn.className = 'profile-icon';
        syncBtn.id = 'sync-btn';
        syncBtn.style.marginRight = '10px';
        syncBtn.innerHTML = '<ion-icon name="sync-outline"></ion-icon>';
        
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
            header.insertBefore(syncBtn, notificationBell);
        } else {
            header.appendChild(syncBtn);
        }
        
        syncBtn.addEventListener('click', () => {
            syncBtn.classList.add('syncing');
            showToast('Sincronizando com PC...', 'info');
            
            carregarDadosDoPC();
            refreshHomeData();
            renderTasks();
            renderNotes();
            renderCalendar();
            
            setTimeout(() => {
                syncBtn.classList.remove('syncing');
                showToast('Sincronizado com sucesso!', 'success');
            }, 1000);
        });
    }
    
    // Adicionar estilo para animação de sincronização
    const style = document.createElement('style');
    style.textContent = `
        #sync-btn.syncing ion-icon {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // ==================== NOTIFICAÇÕES ====================
    const notificationBell = document.getElementById('notification-bell');
    const notificationsModal = document.getElementById('notifications-modal');
    const btnCloseNotifications = document.getElementById('btn-close-notifications');
    const btnMarkRead = document.getElementById('btn-mark-read');
    const btnClearAll = document.getElementById('btn-clear-all');
    const notificationTabs = document.querySelectorAll('.notification-tab');
    
    updateNotificationBadge();

    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            notificationsModal.classList.add('active');
            renderNotificationsModal();
        });
    }

    if (btnCloseNotifications) {
        btnCloseNotifications.addEventListener('click', () => {
            notificationsModal.classList.remove('active');
        });
    }

    notificationsModal?.addEventListener('click', (e) => {
        if (e.target === notificationsModal) {
            notificationsModal.classList.remove('active');
        }
    });

    if (btnMarkRead) {
        btnMarkRead.addEventListener('click', markAllAsRead);
    }

    if (btnClearAll) {
        btnClearAll.addEventListener('click', clearAllNotifications);
    }

    notificationTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            notificationTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });
    
    // ==================== HORÁRIO ====================
    const editModal = document.getElementById('edit-modal');
    const btnBack = document.getElementById('btn-back');
    const btnSave = document.getElementById('btn-save');
    const btnAddTime = document.getElementById('btn-add-time');
    const btnCancelTime = document.getElementById('btn-cancel-time');
    const newTimeInput = document.getElementById('new-time-input');
    const toggleBtn = document.getElementById('toggle-edit-mode');
    const subjectModal = document.getElementById('subject-modal');
    const btnCloseSubject = document.querySelector('[data-modal="subject-modal"]');
    const btnSaveSubject = document.getElementById('btn-save-subject');
    const subjectNameInput = document.getElementById('subject-name-input');
    const subjectTeacherInput = document.getElementById('subject-teacher-input');
    const subjectStartInput = document.getElementById('subject-start-input');
    const subjectDayInput = document.getElementById('subject-day-input');
    const subjectColorOptions = document.querySelectorAll('#subject-modal .color-option');

    subjectColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            subjectColorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedSubjectColor = option.dataset.color;
        });
    });

    if (btnCloseSubject) {
        btnCloseSubject.addEventListener('click', () => {
            subjectModal.classList.remove('active');
        });
    }

    if (btnSaveSubject) {
        btnSaveSubject.addEventListener('click', () => {
            const name = subjectNameInput?.value.trim();
            const teacher = subjectTeacherInput?.value.trim();
            const startTime = subjectStartInput?.value;
            const day = subjectDayInput?.value;

            if (!name) {
                showToast('Preencha o nome da matéria!', 'error');
                return;
            }

            if (!startTime || !day) {
                showToast('Selecione horário e dia!', 'error');
                return;
            }

            if (weeklySchedule[day]) {
                weeklySchedule[day] = weeklySchedule[day].filter(c => c.hora !== startTime);
            } else {
                weeklySchedule[day] = [];
            }

            weeklySchedule[day].push({
                hora: startTime,
                materia: name,
                color: selectedSubjectColor,
                professor: teacher
            });

            weeklySchedule[day].sort((a, b) => a.hora.localeCompare(b.hora));

            if (!timeSlots.includes(startTime)) {
                timeSlots.push(startTime);
                timeSlots.sort();
            }

            showSavingAnimation(btnSaveSubject, () => {
                saveAllData();
                updateSummaryCards();
                showToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
                subjectModal.classList.remove('active');
                renderSchedule();
            });
        }); 
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (editModal) {
                editModal.classList.add('active');
                renderEditSchedule();
            }
        });
    }

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            if (editModal) editModal.classList.remove('active');
            renderSchedule();
        });
    }

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            if (editModal) editModal.classList.remove('active');
            renderSchedule();
        });
    }

    if (btnAddTime) {
        btnAddTime.addEventListener('click', () => {
            const newTime = newTimeInput?.value;
            if (newTime && !timeSlots.includes(newTime)) {
                timeSlots.push(newTime);
                timeSlots.sort();
                saveAllData();
                if (editModal) renderEditSchedule();
                if (newTimeInput) newTimeInput.value = '11:00';
                showToast('Horário adicionado!', 'success');
            } else {
                showToast('Horário já existe ou inválido!', 'error');
            }
        });
    }

    if (btnCancelTime) {
        btnCancelTime.addEventListener('click', () => {
            if (newTimeInput) newTimeInput.value = '11:00';
        });
    }

    function renderEditSchedule() {
        const grid = document.getElementById('edit-schedule-grid');
        if (!grid) return;
        
        let html = '<div class="day-header">Hora</div>';
        days.forEach(day => html += `<div class="day-header">${day}</div>`);

        timeSlots.forEach(time => {
            html += `<div class="time-slot">${time}<button class="btn-delete-row" data-time="${time}"><ion-icon name="trash-outline"></ion-icon></button></div>`;
            days.forEach(day => {
                const classItem = weeklySchedule[day]?.find(c => c.hora === time);
                if (classItem) {
                    html += `<div class="edit-cell"><div class="class-block subject-custom" style="background-color: ${classItem.color}">${classItem.materia}</div></div>`;
                } else {
                    html += `<div class="edit-cell"><button class="btn-add" data-day="${day}" data-time="${time}">+</button></div>`;
                }
            });
        });
        grid.innerHTML = html;
        attachEditEvents();
    }

    function attachEditEvents() {
        document.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const time = btn.dataset.time;
                showConfirm(`Remover horário ${time}?`, 'Excluir Horário', (confirmed) => {
                    if (confirmed) {
                        timeSlots = timeSlots.filter(t => t !== time);
                        days.forEach(day => {
                            if (weeklySchedule[day]) {
                                weeklySchedule[day] = weeklySchedule[day].filter(c => c.hora !== time);
                            }
                        });
                        saveAllData();
                        updateSummaryCards();
                        renderEditSchedule();
                        showToast('Horário removido!', 'success');
                    }
                });
            });
        });

        document.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', () => {
                const day = btn.dataset.day;
                const time = btn.dataset.time;
                openSubjectModal(null, day, time);
            });
        });
    }

    // ==================== CALENDÁRIO ====================
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthYear = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const eventModal = document.getElementById('event-modal');
    const btnNewEvent = document.getElementById('btn-new-event');
    const btnCloseEvent = document.querySelector('[data-modal="event-modal"]');
    const btnSaveEvent = document.getElementById('btn-save-event');
    const eventTitle = document.getElementById('event-title');
    const eventDateInput = document.getElementById('event-date');
    const eventStart = document.getElementById('event-start');
    const eventEnd = document.getElementById('event-end');
    const typeBtns = document.querySelectorAll('.event-types .type-btn');
    const colorOptions = document.querySelectorAll('#event-modal .color-option');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    if (btnNewEvent) {
        btnNewEvent.addEventListener('click', () => {
            openEventModal(null);
        });
    }

    if (btnCloseEvent) {
        btnCloseEvent.addEventListener('click', () => {
            if (eventModal) eventModal.classList.remove('active');
        });
    }

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedEventType = btn.dataset.type;
        });
    });

    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedEventColor = option.dataset.color;
        });
    });

    if (btnSaveEvent) {
        btnSaveEvent.addEventListener('click', () => {
            const title = eventTitle?.value.trim();
            const date = eventDateInput?.value;
            const start = eventStart?.value;
            const end = eventEnd?.value;

            if (!title || !date) {
                showToast('Preencha título e data!', 'error');
                return;
            }

            showSavingAnimation(btnSaveEvent, () => {
                if (editingEventId) {
                    const eventIndex = calendarEvents.findIndex(e => e.id == editingEventId);
                    if (eventIndex > -1) {
                        calendarEvents[eventIndex] = { 
                            ...calendarEvents[eventIndex], 
                            title, 
                            date, 
                            start, 
                            end, 
                            type: selectedEventType, 
                            color: selectedEventColor 
                        };
                        
                        salvarNoFormatoPC('evento', calendarEvents[eventIndex]);
                    }
                } else {
                    const novoEvento = { 
                        id: Date.now(), 
                        title, 
                        date, 
                        start, 
                        end, 
                        type: selectedEventType, 
                        color: selectedEventColor 
                    };
                    calendarEvents.push(novoEvento);
                    salvarNoFormatoPC('evento', novoEvento);
                }
                
                saveAllData();
                showToast(editingEventId ? 'Evento atualizado!' : 'Evento criado!', 'success');
                
                if (eventModal) eventModal.classList.remove('active');
                renderEvents();
                renderCalendar();
                refreshHomeData();
            });
        });
    }

    // ==================== TAREFAS ====================
    const tasksList = document.getElementById('tasks-list');
    const btnAddTask = document.getElementById('btn-add-task');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const taskModal = document.getElementById('task-modal');
    const taskModalTitle = document.getElementById('task-modal-title');
    const btnCloseTask = document.querySelector('[data-modal="task-modal"]');
    const btnSaveTask = document.getElementById('btn-save-task');
    const taskTitleInput = document.getElementById('task-title');
    const taskSubjectInput = document.getElementById('task-subject');
    const taskDateInput = document.getElementById('task-date');
    const taskTypeBtns = document.querySelectorAll('.task-types .type-btn');
    const taskPriorityBtns = document.querySelectorAll('.priority-btn');
    const taskColorOptions = document.querySelectorAll('#task-modal .color-option');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTaskFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    if (btnAddTask) {
        btnAddTask.addEventListener('click', () => {
            openTaskModal(null);
        });
    }

    if (btnCloseTask) {
        btnCloseTask.addEventListener('click', () => {
            if (taskModal) taskModal.classList.remove('active');
        });
    }

    taskTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            taskTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTaskType = btn.dataset.type;
        });
    });

    taskPriorityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            taskPriorityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTaskPriority = btn.dataset.priority;
        });
    });

    taskColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            taskColorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedTaskColor = option.dataset.color;
        });
    });

    if (btnSaveTask) {
        btnSaveTask.addEventListener('click', () => {
            const title = taskTitleInput?.value.trim();
            const subject = taskSubjectInput?.value.trim();
            const date = taskDateInput?.value;

            if (!title) {
                showToast('Preencha o título!', 'error');
                return;
            }

            showSavingAnimation(btnSaveTask, () => {
                if (editingTaskId) {
                    const taskIndex = tasks.findIndex(t => t.id == editingTaskId);
                    if (taskIndex > -1) {
                        tasks[taskIndex] = { 
                            ...tasks[taskIndex], 
                            title, 
                            subject: subject || tasks[taskIndex].subject, 
                            date: date || tasks[taskIndex].date, 
                            color: selectedTaskColor, 
                            priority: selectedTaskPriority,
                            completed: tasks[taskIndex].completed 
                        };
                        
                        salvarNoFormatoPC('tarefa', tasks[taskIndex]);
                    }
                } else {
                    const novaTarefa = { 
                        id: Date.now(), 
                        title, 
                        subject: subject || 'Geral', 
                        date: date || 'Sem data', 
                        color: selectedTaskColor, 
                        priority: selectedTaskPriority, 
                        completed: false 
                    };
                    tasks.unshift(novaTarefa);
                    salvarNoFormatoPC('tarefa', novaTarefa);
                }
                
                saveAllData();
                updateSummaryCards();
                showToast(editingTaskId ? 'Tarefa atualizada!' : 'Tarefa criada!', 'success');
                
                if (taskModal) taskModal.classList.remove('active');
                renderTasks();
                refreshHomeData();
            });
        });
    }

    // ==================== ANOTAÇÕES ====================
    const notesGrid = document.getElementById('notes-grid');
    const btnAddNote = document.getElementById('btn-add-note');
    const notesSearchInput = document.getElementById('notes-search-input');
    const noteModal = document.getElementById('note-modal');
    const noteModalTitle = document.getElementById('note-modal-title');
    const btnCloseNote = document.querySelector('[data-modal="note-modal"]');
    const btnSaveNote = document.getElementById('btn-save-note');
    const noteTitleInput = document.getElementById('note-title');
    const noteSubjectInput = document.getElementById('note-subject');
    const noteContentInput = document.getElementById('note-content');
    const noteColorOptions = document.querySelectorAll('#note-modal .color-option');

    if (notesSearchInput) {
        notesSearchInput.addEventListener('input', (e) => {
            renderNotes(e.target.value);
        });
    }

    if (btnAddNote) {
        btnAddNote.addEventListener('click', () => {
            openNoteModal(null);
        });
    }

    if (btnCloseNote) {
        btnCloseNote.addEventListener('click', () => {
            if (noteModal) noteModal.classList.remove('active');
        });
    }

    noteColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            noteColorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedNoteColor = option.dataset.color;
        });
    });

    if (btnSaveNote) {
        btnSaveNote.addEventListener('click', () => {
            const title = noteTitleInput?.value.trim();
            const subject = noteSubjectInput?.value.trim();
            const content = noteContentInput?.value.trim();

            if (!title) {
                showToast('Preencha o título!', 'error');
                return;
            }

            showSavingAnimation(btnSaveNote, () => {
                if (editingNoteId) {
                    const noteIndex = notes.findIndex(n => n.id == editingNoteId);
                    if (noteIndex > -1) {
                        notes[noteIndex] = { 
                            ...notes[noteIndex], 
                            title, 
                            subject: subject || notes[noteIndex].subject, 
                            content: content || notes[noteIndex].content, 
                            color: selectedNoteColor 
                        };
                        
                        salvarNoFormatoPC('anotacao', notes[noteIndex]);
                    }
                } else {
                    const novaAnotacao = { 
                        id: Date.now(), 
                        title, 
                        subject: subject || 'Geral', 
                        content: content || '', 
                        color: selectedNoteColor, 
                        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) 
                    };
                    notes.unshift(novaAnotacao);
                    salvarNoFormatoPC('anotacao', novaAnotacao);
                }
                
                saveAllData();
                updateSummaryCards();
                showToast(editingNoteId ? 'Anotação atualizada!' : 'Anotação criada!', 'success');
                
                if (noteModal) noteModal.classList.remove('active');
                renderNotes();
            });
        });
    }

    // ==================== PERFIL ====================
    const profileMenuItems = document.querySelectorAll('.profile-menu .menu-item:not(.logout)');

    profileMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'dados') {
                document.getElementById('dados-modal')?.classList.add('active');
                loadProfileData();
            } else if (action === 'seguranca') {
                document.getElementById('seguranca-modal')?.classList.add('active');
            } else if (action === 'notificacoes') {
                document.getElementById('notificacoes-modal')?.classList.add('active');
                loadNotificacoes();
            } else if (action === 'aparencia') {
                document.getElementById('aparencia-modal')?.classList.add('active');
                loadAparencia();
            } else if (action === 'ajuda') {
                document.getElementById('ajuda-modal')?.classList.add('active');
            }
        });
    });

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) closeModal(modalId);
        });
    });

    document.getElementById('btn-save-dados')?.addEventListener('click', () => {
        const nome = document.getElementById('profile-name-input')?.value.trim();
        const email = document.getElementById('profile-email-input')?.value.trim();

        if (!nome || !email) {
            showToast('Preencha nome e e-mail!', 'error');
            return;
        }

        usuarioLogado.nome = nome;
        usuarioLogado.email = email;
        saveAllData();
        
        const headerName = document.querySelector('.greeting h1');
        const profileName = document.querySelector('.profile-name');
        const profileEmail = document.querySelector('.profile-email');
        if (headerName) headerName.textContent = nome.split(' ')[0];
        if (profileName) profileName.textContent = nome;
        if (profileEmail) profileEmail.textContent = email;
        
        closeModal('dados-modal');
        showToast('Dados atualizados!', 'success');
    });

    document.getElementById('btn-save-senha')?.addEventListener('click', () => {
        const newPassword = document.getElementById('new-password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;

        if (!newPassword || !confirmPassword) {
            showToast('Preencha todos os campos!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Senha deve ter 6+ caracteres!', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Senhas não coincidem!', 'error');
            return;
        }

        closeModal('seguranca-modal');
        showToast('Senha alterada!', 'success');
        
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    });

    document.getElementById('btn-save-notificacoes')?.addEventListener('click', () => {
        notificacoesSettings = {
            push: document.getElementById('toggle-push')?.checked,
            email: document.getElementById('toggle-email')?.checked,
            aulas: document.getElementById('toggle-aulas')?.checked,
            tarefas: document.getElementById('toggle-tarefas')?.checked
        };
        saveAllData();
        closeModal('notificacoes-modal');
        showToast('Notificações salvas!', 'success');
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTheme = btn.dataset.theme;
        });
    });

    document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#aparencia-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedAccent = option.dataset.accent;
        });
    });

    document.getElementById('btn-save-aparencia')?.addEventListener('click', () => {
        appearanceSettings = {
            theme: selectedTheme,
            accent: selectedAccent,
            fontSize: document.getElementById('font-size-slider')?.value || 14
        };
        saveAllData();
        document.documentElement.style.setProperty('--accent-purple', selectedAccent);
        closeModal('aparencia-modal');
        showToast('Aparência salva!', 'success');
    });

    document.getElementById('btn-contato')?.addEventListener('click', () => {
        window.open('https://wa.me/5500000000000', '_blank');
    });

    document.getElementById('btn-termos')?.addEventListener('click', () => {
        showToast('Termos de Uso em desenvolvimento!', 'info');
    });

    document.getElementById('btn-privacidade')?.addEventListener('click', () => {
        showToast('Política de Privacidade em desenvolvimento!', 'info');
    });

    document.getElementById('btn-avaliar')?.addEventListener('click', () => {
        showToast('Obrigado por avaliar! ⭐⭐⭐⭐⭐', 'success');
    });

    document.querySelector('.menu-item.logout')?.addEventListener('click', () => {
        showConfirm('Deseja realmente sair da conta?', 'Sair', (confirmed) => {
            if (confirmed) {
                localStorage.removeItem('usuarioLogado');
                window.location.href = '../login/index.html';
            }
        });
    });

    // ==================== NAVEGAÇÃO ====================
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // ==================== INICIALIZAÇÃO ====================
    refreshHomeData();
    updateNotificationBadge();
});
