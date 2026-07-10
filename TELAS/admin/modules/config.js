// ==========================================
// config.js - CONFIGURAÇÃO INICIAL
// ==========================================

console.log('[Config] 🔧 Inicializando configurações...');

// ==========================================
// SUPABASE
// ==========================================
const SUPABASE_URL = 'https://yqxtfnnjjpoitbmtcxjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0';

// ==========================================
// INICIALIZAR SUPABASE CLIENT
// ==========================================
let supabaseClient = null;

try {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Config] ✅ Supabase inicializado a partir do window.supabase');
    } else {
        console.warn('[Config] ⚠️ window.supabase não encontrado, tentando carregar global...');
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[Config] ✅ Supabase inicializado manualmente');
        } else {
            console.error('[Config] ❌ Supabase não disponível');
        }
    }
} catch (err) {
    console.error('[Config] ❌ Erro ao inicializar Supabase:', err);
}

// ==========================================
// EXPORTAR PARA USO GLOBAL
// ==========================================
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = supabaseClient;

// ==========================================
// DISPARAR EVENTO QUANDO O SUPABASE ESTIVER PRONTO
// ==========================================
if (supabaseClient) {
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('supabaseReady'));
        console.log('[Config] 📡 Evento supabaseReady disparado');
    }, 100);
} else {
    // Tentar novamente após 1 segundo
    setTimeout(() => {
        if (!window.supabaseClient) {
            try {
                if (typeof supabase !== 'undefined' && supabase.createClient) {
                    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    console.log('[Config] ✅ Supabase inicializado na segunda tentativa');
                    window.dispatchEvent(new CustomEvent('supabaseReady'));
                }
            } catch (e) {
                console.error('[Config] ❌ Falha na segunda tentativa:', e);
            }
        }
    }, 1000);
}

console.log('[Config] ✅ config.js carregado!');
console.log('[Config] 📡 supabaseClient:', !!supabaseClient);