// Dados compartilhados entre as telas - COM SISTEMA DE RECARGA AUTOMÁTICA

// Usuário padrão (temporário, será substituído pelo login)
let cachedUser = null;

function getDefaultUser() {
    // Primeiro tenta do CacheManager
    if (window.CacheManager) {
        const cached = window.CacheManager.get('usuarioLogado', null);
        if (cached && cached.email) return cached;
    }
    
    // Depois tenta do localStorage direto
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        try {
            return JSON.parse(usuarioSalvo);
        } catch(e) {}
    }
    return null;
}

function getDefaultNotifications() {
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notifications', null);
        if (cached) return cached;
    }
    return [];
}

function getDefaultTasks() {
    if (window.CacheManager) {
        const cached = window.CacheManager.get('tasks', null);
        if (cached) return cached;
    }
    return [];
}

function getDefaultNotes() {
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notes', null);
        if (cached) return cached;
    }
    return [];
}

function getDefaultCalendarEvents() {
    if (window.CacheManager) {
        const cached = window.CacheManager.get('calendarEvents', null);
        if (cached) return cached;
    }
    return [];
}

function getDefaultWeeklySchedule() {
    if (window.CacheManager) {
        const cached = window.CacheManager.get('weeklySchedule', null);
        if (cached) return cached;
    }
    return {
        'Seg': [],
        'Ter': [],
        'Qua': [],
        'Qui': [],
        'Sex': []
    };
}

function getDefaultTimeSlots() {
    if (window.CacheManager) {
        const cached = window.CacheManager.get('timeSlots', null);
        if (cached) return cached;
    }
    return ['08:00', '09:30', '11:00', '14:00', '15:30'];
}

function getDefaultNotificacoesSettings() {
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notificacoesSettings', null);
        if (cached) return cached;
    }
    return { push: true, email: false, aulas: true, tarefas: true };
}

function getDefaultAppearanceSettings() {
    if (window.CacheManager) {
        const cached = window.CacheManager.get('appearanceSettings', null);
        if (cached) return cached;
    }
    return { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
}

// Função para forçar recarregamento de dados da nuvem em todas as abas
async function syncAllDataFromCloud() {
    if (window.CacheManager) {
        const result = await window.CacheManager.forceSync();
        if (result) {
            console.log('✅ Sincronização manual concluída');
            // Disparar evento para recarregar UI
            window.dispatchEvent(new CustomEvent('manualSyncComplete'));
        }
        return result;
    }
    return false;
}

// Função para recarregar a página atual (útil para atualizações críticas)
function reloadPageAfterSync() {
    console.log('🔄 Recarregando página após sincronização...');
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// Função para carregar dados da nuvem após login
async function loadCloudDataAfterLogin() {
    if (window.CacheManager) {
        await window.CacheManager.afterLogin();
    }
}

// Exportar para uso global
window.getDefaultUser = getDefaultUser;
window.getDefaultNotifications = getDefaultNotifications;
window.getDefaultTasks = getDefaultTasks;
window.getDefaultNotes = getDefaultNotes;
window.getDefaultCalendarEvents = getDefaultCalendarEvents;
window.getDefaultWeeklySchedule = getDefaultWeeklySchedule;
window.getDefaultTimeSlots = getDefaultTimeSlots;
window.getDefaultNotificacoesSettings = getDefaultNotificacoesSettings;
window.getDefaultAppearanceSettings = getDefaultAppearanceSettings;
window.syncAllDataFromCloud = syncAllDataFromCloud;
window.reloadPageAfterSync = reloadPageAfterSync;
window.loadCloudDataAfterLogin = loadCloudDataAfterLogin;

console.log('[SharedData] Módulo carregado');