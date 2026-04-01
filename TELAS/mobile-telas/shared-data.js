// Dados compartilhados entre as telas

function getDefaultUser() {
    return {
        id: 1,
        nome: 'João Aluno',
        email: 'joao@aluno.com',
        senha: '123456'
    };
}

function getDefaultNotifications() {
    const now = new Date();
    return [
        { id: Date.now(), type: 'aula', title: 'Aula de Matemática', message: 'Lembrete: Aula às 14h hoje', time: now.toISOString(), read: false },
        { id: Date.now() + 1, type: 'tarefa', title: 'Tarefa Pendente', message: 'Lista de Exercícios para amanhã', time: new Date(now.getTime() + 3600000).toISOString(), read: false },
        { id: Date.now() + 2, type: 'lembrete', title: 'Prova de História', message: 'Sua prova será na próxima segunda', time: new Date(now.getTime() + 86400000).toISOString(), read: false }
    ];
}

function getDefaultTasks() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date) => {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    
    return [
        { id: Date.now(), title: 'Entregar Redação', subject: 'Português', date: formatDate(tomorrow), color: '#ec4899', completed: false, priority: 'alta' },
        { id: Date.now() + 1, title: 'Lista de Exercícios', subject: 'Matemática', date: formatDate(today), color: '#6366f1', completed: false, priority: 'media' }
    ];
}

function getDefaultNotes() {
    return [
        { id: Date.now(), title: 'Fórmulas de Física', content: 'F = m * a\nE = m * c²\nv = Δs/Δt', date: new Date().toISOString() },
        { id: Date.now() + 1, title: 'Vocabulário Inglês', content: 'Apple - Maçã\nBook - Livro\nCar - Carro', date: new Date().toISOString() }
    ];
}

function getDefaultCalendarEvents() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    return [
        { id: Date.now(), title: 'Aula de Física', date: formatDate(today), start: '08:00', end: '09:30', type: 'aula', color: '#6366f1' },
        { id: Date.now() + 1, title: 'Prova de Matemática', date: formatDate(tomorrow), start: '10:00', end: '11:30', type: 'prova', color: '#ef4444' }
    ];
}

function getDefaultWeeklySchedule() {
    return {
        'Seg': [
            { horaInicio: '08:00', horaFim: '09:30', materia: 'Matemática', color: '#6366f1', professor: 'Prof. Carlos' },
            { horaInicio: '09:30', horaFim: '11:00', materia: 'Química', color: '#10b981', professor: 'Prof. Ana' }
        ],
        'Ter': [
            { horaInicio: '08:00', horaFim: '09:30', materia: 'Português', color: '#ec4899', professor: 'Prof. Beatriz' },
            { horaInicio: '09:30', horaFim: '11:00', materia: 'Biologia', color: '#3b82f6', professor: 'Prof. Diego' }
        ],
        'Qua': [
            { horaInicio: '08:00', horaFim: '09:30', materia: 'Física', color: '#ef4444', professor: 'Prof. Eduardo' },
            { horaInicio: '09:30', horaFim: '11:00', materia: 'Inglês', color: '#8b5cf6', professor: 'Prof. Fernanda' }
        ],
        'Qui': [
            { horaInicio: '08:00', horaFim: '10:00', materia: 'História', color: '#f59e0b', professor: 'Prof. Gabriel' }
        ],
        'Sex': [
            { horaInicio: '08:00', horaFim: '09:30', materia: 'Geografia', color: '#a855f7', professor: 'Prof. Helena' },
            { horaInicio: '09:30', horaFim: '11:00', materia: 'Filosofia', color: '#6b7280', professor: 'Prof. Igor' }
        ]
    };
}

function getDefaultTimeSlots() {
    return ['08:00', '09:30', '11:00', '14:00', '15:30'];
}

function getDefaultNotificacoesSettings() {
    return { push: true, email: false, aulas: true, tarefas: true };
}

function getDefaultAppearanceSettings() {
    return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
}

// Exportar funções globais
window.getDefaultUser = getDefaultUser;
window.getDefaultNotifications = getDefaultNotifications;
window.getDefaultTasks = getDefaultTasks;
window.getDefaultNotes = getDefaultNotes;
window.getDefaultCalendarEvents = getDefaultCalendarEvents;
window.getDefaultWeeklySchedule = getDefaultWeeklySchedule;
window.getDefaultTimeSlots = getDefaultTimeSlots;
window.getDefaultNotificacoesSettings = getDefaultNotificacoesSettings;
window.getDefaultAppearanceSettings = getDefaultAppearanceSettings;
