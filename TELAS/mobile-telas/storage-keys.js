// mobile-telas/storage-keys.js
// PADRONIZAÇÃO DE CHAVES - Mobile e Desktop usam o mesmo formato!

const STORAGE_KEYS = {
    tasks: (userId) => `${userId}_tasks`,
    notes: (userId) => `${userId}_notes`,
    calendarEvents: (userId) => `${userId}_calendarEvents`,
    weeklySchedule: (userId) => `${userId}_weeklySchedule`,
    timeSlots: (userId) => `${userId}_timeSlots`,
    notifications: (userId) => `${userId}_notifications`,
    disciplinas: (userId) => `${userId}_disciplinas`,
    profile: (userId) => `${userId}_profile`,
    settings: (userId) => `${userId}_settings`
};

// ⭐ FUNÇÃO PARA OBTER O userId SEMPRE DA MESMA FORMA
function getCurrentUserId() {
    try {
        const usuario = localStorage.getItem('usuarioLogado');
        if (!usuario) return null;
        const user = JSON.parse(usuario);
        return user.id || user.uid || null;
    } catch(e) {
        return null;
    }
}

// ⭐ FUNÇÕES PADRONIZADAS PARA SALVAR E CARREGAR
function salvarDadosPadrao(key, value) {
    const userId = getCurrentUserId();
    if (!userId) return false;
    const storageKey = STORAGE_KEYS[key](userId);
    localStorage.setItem(storageKey, JSON.stringify(value));
    return true;
}

function carregarDadosPadrao(key) {
    const userId = getCurrentUserId();
    if (!userId) return null;
    const storageKey = STORAGE_KEYS[key](userId);
    const data = localStorage.getItem(storageKey);
    if (data) {
        try {
            return JSON.parse(data);
        } catch(e) {
            return null;
        }
    }
    return null;
}

// ⭐ MIGRAÇÃO DE DADOS DO FORMATO ANTIGO (email) PARA O NOVO (userId)
function migrarDadosAntigos() {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) return;
    
    try {
        const user = JSON.parse(usuario);
        const userId = user.id || user.uid;
        if (!userId) return;
        
        const oldKeys = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
        
        for (const key of oldKeys) {
            // Tentar migrar do formato antigo (com email)
            const oldKey = `${key}_${user.email}`;
            const oldData = localStorage.getItem(oldKey);
            if (oldData) {
                const newKey = STORAGE_KEYS[key](userId);
                // Só migrar se não existir dados novos
                if (!localStorage.getItem(newKey)) {
                    localStorage.setItem(newKey, oldData);
                    console.log(`[Storage] ✅ Migrado ${key} do formato antigo`);
                }
                // Não remove o antigo para não perder dados
            }
        }
    } catch(e) {
        console.warn('[Storage] Erro ao migrar dados:', e);
    }
}

// Executar migração automaticamente
setTimeout(migrarDadosAntigos, 500);

console.log('[Storage] 📁 Sistema de chaves padronizado carregado!');