// supabase-config.js - Configuração do Supabase
const SUPABASE_CONFIG = {
    url: "https://yqxtfnnjjpoitbmtcxjd.supabase.co",
    anonKey: "sb_publishable_CnZEwvltWwOT0H2t0-HXqA_WO-zWL2n" 
};

// Inicializar Supabase
if (typeof supabaseClient === 'undefined' && typeof createClient !== 'undefined') {
    window.supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('[Supabase] ✅ Cliente inicializado');
}

// Exportar para uso global
window.supabaseConfig = SUPABASE_CONFIG;