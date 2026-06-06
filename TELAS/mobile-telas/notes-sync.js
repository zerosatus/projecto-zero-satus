// notes-sync.js - Sincronização dedicada para anotações (VERSÃO OTIMIZADA)

(function() {
    console.log('[NotesSync] Iniciando módulo de sincronização de anotações...');
    
    let ultimaSincronizacao = 0;
    let syncInProgress = false;
    const INTERVALO_SINCRONIZACAO = 5000; // 5 segundos (aumentado para reduzir notificações)
    
    // Função para sincronizar anotações entre abas (apenas se necessário)
    function sincronizarAnotacoes() {
        if (syncInProgress) return;
        if (!window.CacheManager) return;
        
        const agora = Date.now();
        if (agora - ultimaSincronizacao < INTERVALO_SINCRONIZACAO) return;
        
        syncInProgress = true;
        
        const notes = window.CacheManager.get('notes', null);
        if (notes !== null && Array.isArray(notes) && notes.length > 0) {
            // Verificar se realmente mudou antes de disparar evento
            const storedNotes = window._lastSyncedNotes || [];
            if (JSON.stringify(storedNotes) !== JSON.stringify(notes)) {
                window._lastSyncedNotes = notes;
                ultimaSincronizacao = agora;
                
                // Disparar evento apenas se houve mudança real
                window.dispatchEvent(new CustomEvent('notesUpdated', { 
                    detail: { notes: notes, source: 'periodic' } 
                }));
                console.log('[NotesSync] Mudança detectada, sincronizando...');
            }
        }
        
        setTimeout(() => { syncInProgress = false; }, 100);
    }
    
    // Executar sincronização periódica (menos frequente)
    setInterval(sincronizarAnotacoes, INTERVALO_SINCRONIZACAO);
    
    // Sincronizar quando a página ganhar foco
    window.addEventListener('focus', () => {
        console.log('[NotesSync] Página em foco, sincronizando...');
        setTimeout(sincronizarAnotacoes, 500);
    });
    
    // Sincronização inicial única
    setTimeout(sincronizarAnotacoes, 2000);
    
    // Escutar mudanças no localStorage (apenas para abas)
    let storageSyncTimeout = null;
    window.addEventListener('storage', (e) => {
        if (e.key && (e.key.includes('notes') || e.key.includes('_notes'))) {
            if (storageSyncTimeout) clearTimeout(storageSyncTimeout);
            storageSyncTimeout = setTimeout(() => {
                console.log('[NotesSync] Storage event detectado:', e.key);
                sincronizarAnotacoes();
            }, 300);
        }
    });
    
    console.log('[NotesSync] Módulo carregado (modo otimizado)');
})();