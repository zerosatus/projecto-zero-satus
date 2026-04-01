// Dados compartilhados entre as telas - SEM DADOS DE EXEMPLO

function getDefaultUser() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        try {
            return JSON.parse(usuarioSalvo);
        } catch(e) {}
    }
    return null;
}

function getDefaultNotifications() {
    return [];
}

function getDefaultTasks() {
    return [];
}

function getDefaultNotes() {
    return [];
}

function getDefaultCalendarEvents() {
    return [];
}

function getDefaultWeeklySchedule() {
    return {
        'Seg': [],
        'Ter': [],
        'Qua': [],
        'Qui': [],
        'Sex': []
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

window.getDefaultUser = getDefaultUser;
window.getDefaultNotifications = getDefaultNotifications;
window.getDefaultTasks = getDefaultTasks;
window.getDefaultNotes = getDefaultNotes;
window.getDefaultCalendarEvents = getDefaultCalendarEvents;
window.getDefaultWeeklySchedule = getDefaultWeeklySchedule;
window.getDefaultTimeSlots = getDefaultTimeSlots;
window.getDefaultNotificacoesSettings = getDefaultNotificacoesSettings;
window.getDefaultAppearanceSettings = getDefaultAppearanceSettings;
