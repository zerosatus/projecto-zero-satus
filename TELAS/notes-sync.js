// notes-sync.js - Sincronização dedicada para anotações (VERSÃO CORRIGIDA)
(function() {
    console.log('[NotesSync] Iniciando módulo de sincronização de anotações...');
    
    let ultimaSincronizacao = 0;
    let syncInProgress = false;
    const INTERVALO_SINCRONIZACAO = 3000;
    let _lastNotes = [];
    
    function sincronizarAnotacoes() {
        if (syncInProgress) return;
        if (!window.CacheManager) return;
        
        const agora = Date.now();
        if (agora - ultimaSincronizacao < INTERVALO_SINCRONIZACAO) return;
        
        syncInProgress = true;
        
        try {
            const notes = window.CacheManager.get('notes', null);
            if (notes !== null && Array.isArray(notes)) {
                // Verificar se realmente mudou
                const currentNotesStr = JSON.stringify(notes);
                const lastNotesStr = JSON.stringify(_lastNotes);
                
                if (currentNotesStr !== lastNotesStr) {
                    _lastNotes = notes;
                    ultimaSincronizacao = agora;
                    
                    // Salvar no localStorage com a chave correta
                    const userId = window.CacheManager.getCurrentUserId();
                    if (userId) {
                        const storageKey = `${userId}_notes`;
                        localStorage.setItem(storageKey, JSON.stringify(notes));
                        
                        // Salvar também com a chave antiga para compatibilidade
                        const usuario = localStorage.getItem('usuarioLogado');
                        if (usuario) {
                            try {
                                const user = JSON.parse(usuario);
                                if (user.email) {
                                    localStorage.setItem(`notes_${user.email}`, JSON.stringify(notes));
                                }
                            } catch(e) {}
                        }
                    }
                    
                    // Disparar evento para todas as abas
                    window.dispatchEvent(new CustomEvent('notesUpdated', { 
                        detail: { notes: notes, source: 'periodic' } 
                    }));
                    window.dispatchEvent(new CustomEvent('dataUpdated', { 
                        detail: { key: 'notes', value: notes } 
                    }));
                    
                    console.log(`[NotesSync] ✅ Sincronizado: ${notes.length} anotações`);
                }
            }
        } catch (error) {
            console.error('[NotesSync] Erro na sincronização:', error);
        }
        
        setTimeout(() => { syncInProgress = false; }, 100);
    }
    
    // Sincronizar quando a página ganhar foco
    window.addEventListener('focus', () => {
        console.log('[NotesSync] Página em foco, sincronizando...');
        setTimeout(sincronizarAnotacoes, 500);
    });
    
    // Escutar evento do CacheManager
    if (window.CacheManager) {
        window.CacheManager.addListener('notes', (data) => {
            console.log('[NotesSync] CacheManager notificou mudança nas notas');
            if (data && Array.isArray(data)) {
                _lastNotes = data;
                sincronizarAnotacoes();
            }
        });
    }
    
    // Escutar eventos de outras abas
    window.addEventListener('notesUpdated', (event) => {
        if (event.detail && event.detail.notes) {
            console.log('[NotesSync] Evento notesUpdated recebido');
            _lastNotes = event.detail.notes;
        }
    });
    
    // Sincronização inicial
    setTimeout(sincronizarAnotacoes, 1000);
    
    // Sincronização periódica (menos frequente)
    setInterval(sincronizarAnotacoes, INTERVALO_SINCRONIZACAO);
    
    console.log('[NotesSync] Módulo carregado (versão corrigida)');
})();