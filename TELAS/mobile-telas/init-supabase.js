// ==========================================
// init-supabase.js - INICIALIZAÇÃO INDEPENDENTE
// ==========================================

(function() {
    console.log('[Init] Inicializando Supabase...');
    
    const SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";
    
    function init() {
        try {
            if (typeof supabase === 'undefined') {
                console.warn('[Init] Supabase library not loaded yet');
                return false;
            }
            
            if (!window.supabaseClient) {
                window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('[Init] ✅ Cliente criado');
            }
            
            // Inicializar AuthService se não existir
            if (!window.AuthService) {
                window.AuthService = {
                    loginWithGoogle: function() {
                        console.log('[Auth] Login com Google');
                        return window.supabaseClient.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                                redirectTo: window.location.origin + window.location.pathname
                            }
                        });
                    },
                    // ... outros métodos
                };
            }
            
            window.dispatchEvent(new CustomEvent('supabaseReady'));
            console.log('[Init] ✅ Evento supabaseReady disparado');
            return true;
            
        } catch (error) {
            console.error('[Init] ❌ Erro:', error);
            return false;
        }
    }
    
    // Tenta inicializar imediatamente
    if (!init()) {
        // Tenta novamente após 500ms
        setTimeout(() => {
            if (!init()) {
                // Tenta novamente após 1s
                setTimeout(() => {
                    init();
                }, 1000);
            }
        }, 500);
    }
})();