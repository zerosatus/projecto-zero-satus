// notes-sync.js - Sincronização dedicada para anotações

(function() {
    console.log('[NotesSync] Iniciando módulo de sincronização de anotações...');
    
    let ultimaSincronizacao = 0;
    const INTERVALO_SINCRONIZACAO = 5000; // 5 segundos
    
    // Função para sincronizar anotações entre abas
    function sincronizarAnotacoes() {
        if (!window.CacheManager) return;
        
        const agora = Date.now();
        if (agora - ultimaSincronizacao < INTERVALO_SINCRONIZACAO) return;
        ultimaSincronizacao = agora;
        
        const notes = window.CacheManager.get('notes', null);
        if (notes !== null) {
            // Verificar se há mudanças nas anotações
            const notesStorage = localStorage.getItem('_last_notes_hash');
            const novoHash = JSON.stringify(notes).length;
            
            if (notesStorage !== String(novoHash)) {
                console.log('[NotesSync] Mudanças detectadas nas anotações, atualizando UI...');
                localStorage.setItem('_last_notes_hash', String(novoHash));
                window.dispatchEvent(new CustomEvent('notesUpdated', { detail: { notes } }));
            }
        }
    }
    
    // Executar sincronização periódica
    setInterval(sincronizarAnotacoes, 3000);
    
    // Sincronizar quando a página ganhar foco
    window.addEventListener('focus', () => {
        console.log('[NotesSync] Página em foco, sincronizando...');
        setTimeout(sincronizarAnotacoes, 500);
    });
    
    // Sincronização inicial
    setTimeout(sincronizarAnotacoes, 1000);
    
    console.log('[NotesSync] Módulo carregado!');
})();