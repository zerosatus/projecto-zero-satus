// mobile-telas/shared-data.js
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
        'biologia': 'biologia', 'geografia': 'geografia',
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
        'aula': '#6366f1', 'prova': '#ef4444', 'tarefa': '#10b981',
        'trabalho': '#f59e0b', 'reuniao': '#8b5cf6', 'outro': '#8b5cf6'
    };
    return cores[type] || '#8b5cf6';
}

window.saveUserData = (data) => window.setCached('usuarioLogado', data);
window.saveNotifications = (data) => window.setCached('notifications', data);
window.saveTasks = (data) => window.setCached('tasks', data);
window.saveNotes = (data) => window.setCached('notes', data);
window.saveCalendarEvents = (data) => window.setCached('calendarEvents', data);
window.saveWeeklySchedule = (data) => window.setCached('weeklySchedule', data);
window.saveTimeSlots = (data) => window.setCached('timeSlots', data);
window.saveNotificacoesSettings = (data) => window.setCached('notificacoesSettings', data);
window.saveAppearanceSettings = (data) => window.setCached('appearanceSettings', data);
