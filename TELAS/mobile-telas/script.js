// ==================== VARIÁVEIS GLOBAIS ====================
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
let notifications = [];

// ==================== VERIFICAÇÃO DE LOGIN E CARREGAMENTO ====================
document.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        carregarTodosDados();
        atualizarInterfaceUsuario();
        inicializarComponentes();
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ==================== CARREGAR TODOS OS DADOS ====================
function carregarTodosDados() {
    carregarTarefas();
    carregarAnotacoes();
    carregarEventos();
    carregarNotificacoes();
    carregarHorarioSemanal();
    atualizarCardsResumo();
}

function carregarTarefas() {
    if (!usuarioAtual) return;
    const storageKey = `tarefas_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(storageKey);
    tarefas = tarefasSalvas ? JSON.parse(tarefasSalvas) : [];
    
    // Atualizar tasks do módulo mobile
    window.tasks = tarefas.map(t => ({
        id: t.id,
        title: t.nome,
        subject: getTextoDisciplina(t.disciplina),
        date: t.prazo || 'Sem data',
        color: getCorDisciplina(t.disciplina).replace('#', ''),
        completed: t.concluida || false,
        priority: t.prioridade || 'media'
    }));
}

function carregarAnotacoes() {
    if (!usuarioAtual) return;
    const storageKey = `anotacoes_${usuarioAtual.email}`;
    const anotacoesSalvas = localStorage.getItem(storageKey);
    anotacoes = anotacoesSalvas ? JSON.parse(anotacoesSalvas) : [];
    
    // Atualizar notes do módulo mobile
    window.notes = anotacoes.map(a => ({
        id: a.id,
        title: a.titulo,
        subject: a.materia || 'Geral',
        date: formatarDataRelativa(new Date(a.dataModificacao)),
        color: a.cor || 'matematica',
        content: a.conteudo || ''
    }));
}

function carregarEventos() {
    if (!usuarioAtual) return;
    const storageKey = `eventos_${usuarioAtual.email}`;
    const eventosSalvas = localStorage.getItem(storageKey);
    eventos = eventosSalvas ? JSON.parse(eventosSalvas) : [];
    
    // Atualizar calendarEvents do módulo mobile
    window.calendarEvents = eventos.map(e => ({
        id: e.id,
        title: e.title,
        date: `${e.year}-${String(e.month+1).padStart(2,'0')}-${String(e.day).padStart(2,'0')}`,
        start: e.time,
        end: e.endTime || adicionarHora(e.time, 1),
        type: e.type,
        color: getCorTipoEvento(e.type)
    }));
}

function carregarNotificacoes() {
    if (!usuarioAtual) return;
    
    // Carregar notificações salvas ou gerar novas baseadas nos dados
    const notifKey = `notificacoes_${usuarioAtual.email}`;
    const notifSalvas = localStorage.getItem(notifKey);
    
    if (notifSalvas) {
        notifications = JSON.parse(notifSalvas);
    } else {
        notifications = gerarNotificacoesIniciais();
        localStorage.setItem(notifKey, JSON.stringify(notifications));
    }
    
    window.notifications = notifications;
    atualizarBadgeNotificacoes();
}

function carregarHorarioSemanal() {
    const horarioKey = `horario_${usuarioAtual?.email}`;
    const horarioSalvo = localStorage.getItem(horarioKey);
    
    if (horarioSalvo) {
        window.weeklySchedule = JSON.parse(horarioSalvo);
    } else {
        // Horário padrão
        window.weeklySchedule = {
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
    
    window.timeSlots = ['08:00', '09:00', '10:00', '14:00'];
}

// ==================== ATUALIZAR INTERFACE ====================
function atualizarInterfaceUsuario() {
    if (!usuarioAtual) return;
    
    const headerName = document.getElementById('header-name');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileInitial = document.getElementById('profile-initial');
    
    if (headerName) headerName.textContent = usuarioAtual.nome.split(' ')[0];
    if (profileName) profileName.textContent = usuarioAtual.nome;
    if (profileEmail) profileEmail.textContent = usuarioAtual.email;
    if (profileInitial) profileInitial.textContent = usuarioAtual.nome.charAt(0).toUpperCase();
    
    // Atualizar avatar se existir
    if (usuarioAtual.avatar) {
        const avatarPreview = document.getElementById('avatar-preview');
        const profileAvatar = document.querySelector('.profile-avatar');
        if (avatarPreview) {
            avatarPreview.innerHTML = `<img src="${usuarioAtual.avatar}" style="width:100%;height:100%;object-fit:cover;">`;
        }
        if (profileAvatar && profileAvatar.querySelector('span')) {
            profileAvatar.querySelector('span').style.display = 'none';
            profileAvatar.innerHTML = `<img src="${usuarioAtual.avatar}" style="width:100%;height:100%;object-fit:cover;">`;
        }
    }
}

function atualizarCardsResumo() {
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.concluida).length;
    const tarefasPendentes = totalTarefas - tarefasConcluidas;
    
    // Contar disciplinas únicas
    const disciplinas = new Set(tarefas.map(t => t.disciplina).filter(Boolean));
    
    document.querySelector('.card:nth-child(1) .card-number').textContent = disciplinas.size || 12;
    document.querySelector('.card:nth-child(2) .card-number').textContent = tarefasConcluidas;
    document.querySelector('.card:nth-child(3) .card-number').textContent = tarefasPendentes;
}

function atualizarBadgeNotificacoes() {
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
}

// ==================== FUNÇÕES AUXILIARES ====================
function getTextoDisciplina(disciplina) {
    const textos = {
        matematica: 'Matemática', portugues: 'Português', historia: 'História',
        fisica: 'Física', quimica: 'Química', biologia: 'Biologia',
        geografia: 'Geografia', ingles: 'Inglês', outros: 'Outros'
    };
    return textos[disciplina] || disciplina || 'Geral';
}

function getCorDisciplina(disciplina) {
    const cores = {
        matematica: '#6366f1', portugues: '#ec4899', historia: '#f59e0b',
        fisica: '#ef4444', quimica: '#10b981', biologia: '#3b82f6',
        geografia: '#a855f7', ingles: '#8b5cf6', outros: '#6b7280'
    };
    return cores[disciplina] || '#6366f1';
}

function getCorTipoEvento(tipo) {
    const cores = {
        aula: '#6366f1', prova: '#ef4444', trabalho: '#f59e0b',
        apresentacao: '#ec4899', reuniao: '#8b5cf6', outro: '#10b981'
    };
    return cores[tipo] || '#8b5cf6';
}

function adicionarHora(hora, horas) {
    const [h, m] = hora.split(':').map(Number);
    return `${String((h + horas) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatarDataRelativa(data) {
    const agora = new Date();
    const diffMs = agora - data;
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffDias === 0) return 'Hoje';
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    return data.toLocaleDateString('pt-BR');
}

function gerarNotificacoesIniciais() {
    const notificacoes = [];
    
    // Notificações de tarefas pendentes
    tarefas.filter(t => !t.concluida).slice(0, 3).forEach(t => {
        notificacoes.push({
            id: Date.now() + Math.random(),
            type: 'tarefa',
            title: 'Tarefa Pendente',
            message: t.nome,
            time: new Date().toISOString(),
            read: false
        });
    });
    
    // Notificações de eventos hoje
    const hoje = new Date();
    eventos.filter(e => e.day === hoje.getDate() && e.month === hoje.getMonth()).forEach(e => {
        notificacoes.push({
            id: Date.now() + Math.random(),
            type: 'aula',
            title: 'Evento Hoje',
            message: e.title,
            time: new Date().toISOString(),
            read: false
        });
    });
    
    return notificacoes;
}

function salvarTodosDados() {
    if (!usuarioAtual) return;
    
    // Salvar tarefas
    localStorage.setItem(`tarefas_${usuarioAtual.email}`, JSON.stringify(tarefas));
    
    // Salvar anotações
    localStorage.setItem(`anotacoes_${usuarioAtual.email}`, JSON.stringify(anotacoes));
    
    // Salvar eventos
    localStorage.setItem(`eventos_${usuarioAtual.email}`, JSON.stringify(eventos));
    
    // Salvar notificações
    localStorage.setItem(`notificacoes_${usuarioAtual.email}`, JSON.stringify(notifications));
    
    // Salvar horário
    if (window.weeklySchedule) {
        localStorage.setItem(`horario_${usuarioAtual.email}`, JSON.stringify(window.weeklySchedule));
    }
}

// ==================== INICIALIZAR COMPONENTES ====================
function inicializarComponentes() {
    // Inicializar todas as funções existentes do script.js
    if (typeof renderSchedule === 'function') renderSchedule();
    if (typeof renderClasses === 'function') renderClasses();
    if (typeof renderNotifications === 'function') renderNotifications();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderTasks === 'function') renderTasks();
    if (typeof renderNotes === 'function') renderNotes();
    
    // Configurar eventos de salvamento automático
    configurarAutoSave();
}

function configurarAutoSave() {
    // Salvar dados periodicamente
    setInterval(() => {
        salvarTodosDados();
    }, 30000); // A cada 30 segundos
    
    // Salvar ao fechar a página
    window.addEventListener('beforeunload', () => {
        salvarTodosDados();
    });
}

// ==================== SOBRESCREVER FUNÇÕES EXISTENTES ====================
// (Mantendo as funções originais mas adicionando sincronização)

// Salvar horário
const originalSaveSchedule = window.saveSchedule || function() {};
window.saveSchedule = function() {
    if (typeof originalSaveSchedule === 'function') originalSaveSchedule();
    if (usuarioAtual && window.weeklySchedule) {
        localStorage.setItem(`horario_${usuarioAtual.email}`, JSON.stringify(window.weeklySchedule));
    }
};

// Salvar tarefas
const originalSaveTasks = window.saveTasks || function() {};
window.saveTasks = function() {
    if (typeof originalSaveTasks === 'function') originalSaveTasks();
    
    // Atualizar tarefas principais
    if (usuarioAtual && window.tasks) {
        tarefas = window.tasks.map(t => ({
            id: t.id,
            nome: t.title,
            disciplina: getDisciplinaFromCor(t.color),
            prazo: t.date,
            concluida: t.completed,
            prioridade: t.priority || 'media'
        }));
        localStorage.setItem(`tarefas_${usuarioAtual.email}`, JSON.stringify(tarefas));
    }
};

// Salvar anotações
const originalSaveNotes = window.saveNotes || function() {};
window.saveNotes = function() {
    if (typeof originalSaveNotes === 'function') originalSaveNotes();
    
    if (usuarioAtual && window.notes) {
        anotacoes = window.notes.map(n => ({
            id: n.id,
            titulo: n.title,
            materia: n.subject,
            dataModificacao: new Date().toISOString(),
            conteudo: n.content || '',
            cor: n.color
        }));
        localStorage.setItem(`anotacoes_${usuarioAtual.email}`, JSON.stringify(anotacoes));
    }
};

// Salvar eventos
const originalSaveCalendarEvents = window.saveCalendarEvents || function() {};
window.saveCalendarEvents = function() {
    if (typeof originalSaveCalendarEvents === 'function') originalSaveCalendarEvents();
    
    if (usuarioAtual && window.calendarEvents) {
        eventos = window.calendarEvents.map(e => {
            const [year, month, day] = e.date.split('-').map(Number);
            return {
                id: e.id,
                title: e.title,
                day: day,
                month: month - 1,
                year: year,
                time: e.start,
                endTime: e.end,
                type: e.type,
                color: e.color
            };
        });
        localStorage.setItem(`eventos_${usuarioAtual.email}`, JSON.stringify(eventos));
    }
};

// Salvar notificações
function salvarNotificacoes() {
    if (usuarioAtual) {
        localStorage.setItem(`notificacoes_${usuarioAtual.email}`, JSON.stringify(notifications));
    }
}

// Marcar notificação como lida (sobrescrever)
const originalMarkAsRead = window.markAsRead || function() {};
window.markAsRead = function(id) {
    if (typeof originalMarkAsRead === 'function') originalMarkAsRead(id);
    
    const index = notifications.findIndex(n => n.id === id);
    if (index > -1) {
        notifications[index].read = true;
        salvarNotificacoes();
        atualizarBadgeNotificacoes();
    }
};

// Marcar todas como lidas (sobrescrever)
const originalMarkAllAsRead = window.markAllAsRead || function() {};
window.markAllAsRead = function() {
    if (typeof originalMarkAllAsRead === 'function') originalMarkAllAsRead();
    
    notifications.forEach(n => n.read = true);
    salvarNotificacoes();
    atualizarBadgeNotificacoes();
};

// Excluir notificação (sobrescrever)
const originalDeleteNotification = window.deleteNotification || function() {};
window.deleteNotification = function(id) {
    if (typeof originalDeleteNotification === 'function') originalDeleteNotification(id);
    
    notifications = notifications.filter(n => n.id !== id);
    salvarNotificacoes();
    atualizarBadgeNotificacoes();
};

// Limpar todas (sobrescrever)
const originalClearAllNotifications = window.clearAllNotifications || function() {};
window.clearAllNotifications = function() {
    if (typeof originalClearAllNotifications === 'function') originalClearAllNotifications();
    
    notifications = [];
    salvarNotificacoes();
    atualizarBadgeNotificacoes();
};

// ==================== FUNÇÃO AUXILIAR ====================
function getDisciplinaFromCor(corHex) {
    const mapa = {
        '#6366f1': 'matematica',
        '#ec4899': 'portugues',
        '#f59e0b': 'historia',
        '#ef4444': 'fisica',
        '#10b981': 'quimica',
        '#3b82f6': 'biologia',
        '#a855f7': 'geografia',
        '#8b5cf6': 'ingles',
        '#6b7280': 'outros'
    };
    
    // Tentar encontrar no mapa, senão retornar 'outros'
    for (let [hex, disciplina] of Object.entries(mapa)) {
        if (corHex.includes(hex)) return disciplina;
    }
    return 'outros';
}

// ==================== EXPOR FUNÇÕES PARA USO GLOBAL ====================
window.salvarTodosDados = salvarTodosDados;
window.atualizarCardsResumo = atualizarCardsResumo;
window.carregarTodosDados = carregarTodosDados;

console.log('%c📱 App Mobile Sincronizado', 'color: #8b5cf6; font-size: 20px; font-weight: bold;');
console.log('%cDados integrados com outros módulos!', 'color: #10b981; font-size: 14px;');
