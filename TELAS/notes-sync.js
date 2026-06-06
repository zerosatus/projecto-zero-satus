// notes-sync.js - Sincronização dedicada para anotações

(function() {
    console.log('[NotesSync] Iniciando módulo de sincronização de anotações...');
    
    let ultimaSincronizacao = 0;
    const INTERVALO_SINCRONIZACAO = 3000; // 3 segundos
    
    // Função para sincronizar anotações entre abas
    function sincronizarAnotacoes() {
        if (!window.CacheManager) return;
        
        const agora = Date.now();
        if (agora - ultimaSincronizacao < INTERVALO_SINCRONIZACAO) return;
        ultimaSincronizacao = agora;
        
        const notes = window.CacheManager.get('notes', null);
        if (notes !== null && Array.isArray(notes)) {
            // Disparar evento para atualizar todas as abas
            window.dispatchEvent(new CustomEvent('notesUpdated', { detail: { notes: notes } }));
        }
    }
    
    // Executar sincronização periódica
    setInterval(sincronizarAnotacoes, 2000);
    
    // Sincronizar quando a página ganhar foco
    window.addEventListener('focus', () => {
        console.log('[NotesSync] Página em foco, sincronizando...');
        setTimeout(sincronizarAnotacoes, 200);
    });
    
    // Sincronização inicial
    setTimeout(sincronizarAnotacoes, 500);
    
    // Também escutar mudanças no localStorage
    window.addEventListener('storage', (e) => {
        if (e.key && (e.key.includes('notes') || e.key.includes('_notes'))) {
            console.log('[NotesSync] Storage event detectado:', e.key);
            setTimeout(sincronizarAnotacoes, 100);
        }
    });
    
    console.log('[NotesSync] Módulo carregado!');
})();