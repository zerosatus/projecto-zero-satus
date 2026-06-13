// sync-helper.js - Helper de sincronização OTIMIZADO

(function() {
    let isInitialized = false;
    let lastCloudLoad = 0;
    const CLOUD_LOAD_COOLDOWN = 2000;
    
    window.initSync = async function() {
        if (isInitialized) {
            console.log('[Sync] Já inicializado');
            return true;
        }
        
        console.log('[Sync] Inicializando sistema de sincronização...');
        
        // Aguardar Supabase carregar
        if (!window.DatabaseService) {
            console.log('[Sync] Aguardando DatabaseService...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
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
        
        if (usuario && (usuario.id || usuario.email)) {
            window.CacheManager.currentUserId = usuario.id || usuario.email;
            console.log('[Sync] Usuário identificado:', window.CacheManager.currentUserId);
            
            // Carregar dados da nuvem
            const loaded = await window.CacheManager.loadFromCloud(true);
            
            // Iniciar realtime sync
            setTimeout(() => {
                if (window.CacheManager && window.CacheManager.startRealtimeSync) {
                    window.CacheManager.startRealtimeSync();
                }
            }, 1000);
            
            isInitialized = true;
            return loaded;
        }
        
        return false;
    };
    
    // Forçar recarga de todos os dados
    window.refreshAllData = function() {
        console.log('[Sync] 🔄 Recarregando dados da UI...');
        
        const pathname = window.location.pathname;
        
        // Disparar evento genérico
        window.dispatchEvent(new CustomEvent('forceRefresh'));
        
        // Atualizações específicas por página
        if (pathname.includes('/inicio/') || pathname.includes('/mobile-telas/')) {
            if (typeof atualizarFraseDoDiaMobile === 'function') atualizarFraseDoDiaMobile();
            if (typeof atualizarFraseDoDiaDesktop === 'function') atualizarFraseDoDiaDesktop();
            if (typeof atualizarEstatisticasMini === 'function') atualizarEstatisticasMini();
            if (typeof atualizarHorarioDesktop === 'function') atualizarHorarioDesktop();
            if (typeof renderizarHorario === 'function') renderizarHorario();
        }
        
        if (pathname.includes('/tarefas/')) {
            if (typeof renderizarTarefas === 'function') renderizarTarefas();
            if (typeof atualizarEstatisticas === 'function') atualizarEstatisticas();
            if (typeof renderizarDisciplinas === 'function') renderizarDisciplinas();
        }
        
        if (pathname.includes('/calendario/')) {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderEvents === 'function') renderEvents();
        }
        
        if (pathname.includes('/anotacoes/') || pathname.includes('/notas/')) {
            if (typeof renderNotes === 'function') renderNotes();
            if (typeof carregarAnotacoes === 'function') carregarAnotacoes();
        }
        
        if (pathname.includes('/perfil/')) {
            if (typeof loadProfileData === 'function') loadProfileData();
            if (typeof carregarFotoPerfil === 'function') carregarFotoPerfil();
        }
    };
    
    // Escutar evento de nuvem
    let cloudLoadTimeout = null;
    window.addEventListener('cloudDataLoaded', () => {
        if (cloudLoadTimeout) clearTimeout(cloudLoadTimeout);
        cloudLoadTimeout = setTimeout(() => {
            console.log('[Sync] Cloud data loaded, atualizando UI');
            window.refreshAllData();
            cloudLoadTimeout = null;
        }, 300);
    });
    
    // Logout seguro
    window.safeLogout = async function() {
        if (window.CacheManager) await window.CacheManager.logout();
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    };
    
    console.log('[Sync] Helper carregado');
})();