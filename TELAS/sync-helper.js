// sync-helper.js - Helper de sincronização para todas as páginas
(function() {
    // Função principal de sincronização
    window.initSync = async function() {
        console.log('[Sync] Inicializando sistema de sincronização...');
        
        if (!window.CacheManager) {
            console.error('[Sync] CacheManager não encontrado!');
            return false;
        }
        
        window.CacheManager.init();
        
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (!usuarioSalvo) {
            console.log('[Sync] Nenhum usuário logado');
            return false;
        }
        
        let usuario;
        try {
            usuario = JSON.parse(usuarioSalvo);
        } catch(e) {
            console.error('[Sync] Erro ao parsear usuário');
            return false;
        }
        
        if (usuario && (usuario.uid || usuario.email)) {
            window.CacheManager.currentUserId = usuario.uid || usuario.email;
            console.log('[Sync] Usuário identificado:', window.CacheManager.currentUserId);
            await window.CacheManager.loadFromCloud();
            return true;
        }
        
        return false;
    };
    
    // Escutar mudanças de dados em tempo real
    window.addEventListener('cloudDataLoaded', (event) => {
        console.log('[Sync] Dados da nuvem recebidos, atualizando interface...');
        if (window.refreshAllData) {
            window.refreshAllData();
        }
    });
    
    // Função para forçar recarregamento de todos os dados
    window.refreshAllData = function() {
        if (window.location.pathname.includes('/inicio/')) {
            if (typeof refreshHomeData === 'function') refreshHomeData();
            if (typeof atualizarEstatisticasMini === 'function') atualizarEstatisticasMini();
        }
        if (window.location.pathname.includes('/tarefas/')) {
            if (typeof renderTasks === 'function') renderTasks();
            if (typeof atualizarEstatisticas === 'function') atualizarEstatisticas();
        }
        if (window.location.pathname.includes('/calendario/')) {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderEvents === 'function') renderEvents();
        }
        if (window.location.pathname.includes('/anotacoes/')) {
            if (typeof renderNotes === 'function') renderNotes();
        }
        console.log('[Sync] UI atualizada');
    };
    
    console.log('[Sync] Helper carregado');
})();