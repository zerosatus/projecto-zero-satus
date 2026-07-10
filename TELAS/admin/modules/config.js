// Configuração do Supabase (gera `supabaseClient` global)
console.log('[Config] Inicializando supabaseClient...');

const SUPABASE_URL = 'https://yqxtfnnjjpoitbmtcxjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0';

try {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Config] ✅ Supabase inicializado a partir do window.supabase');
    } else {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Config] ✅ Supabase inicializado manualmente');
    }
} catch (err) {
    console.error('[Config] ❌ Erro ao inicializar Supabase:', err);
}

console.log('[Config] ✅ config.js carregado!');
