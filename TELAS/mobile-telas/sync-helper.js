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
            
            // VERIFICAR SE FirebaseSync ESTÁ DISPONÍVEL ANTES DE USAR
            if (window.FirebaseSync && typeof window.FirebaseSync.loadAllUserDataFromCloud === 'function') {
                // Carregar da nuvem
                await window.CacheManager.loadFromCloud(true);
                
                // Iniciar escuta em tempo real
                setTimeout(() => {
                    if (window.CacheManager && window.CacheManager.startRealtimeSync) {
                        window.CacheManager.startRealtimeSync();
                    }
                }, 1000);
            } else {
                console.log('[Sync] FirebaseSync não disponível, usando apenas localStorage');
                // Aguardar Firebase ficar disponível
                let tentativas = 0;
                const maxTentativas = 20; // 10 segundos max
                const checkFirebase = setInterval(async () => {
                    tentativas++;
                    if (window.FirebaseSync && typeof window.FirebaseSync.loadAllUserDataFromCloud === 'function') {
                        console.log('[Sync] FirebaseSync detectado, carregando dados...');
                        clearInterval(checkFirebase);
                        await window.CacheManager.loadFromCloud(true);
                        if (window.CacheManager.startRealtimeSync) {
                            window.CacheManager.startRealtimeSync();
                        }
                    } else if (tentativas >= maxTentativas) {
                        console.log('[Sync] FirebaseSync não detectado após timeout');
                        clearInterval(checkFirebase);
                    }
                }, 500);
            }
            
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
    
    // Escutar mudanças no localStorage de outras abas
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('sync_')) {
            try {
                const data = JSON.parse(e.newValue);
                console.log('[Sync] Mudança detectada em outra aba:', data.key);
                if (window.refreshAllData) {
                    setTimeout(() => window.refreshAllData(), 100);
                }
            } catch(e) {}
        }
    });
    
    // Função para forçar recarregamento de todos os dados
    window.refreshAllData = function() {
        console.log('[Sync] 🔄 Recarregando dados da UI...');
        
        const pathname = window.location.pathname;
        
        // Página Início (Desktop)
        if (pathname.includes('/inicio/')) {
            if (typeof atualizarEstatisticasMini === 'function') atualizarEstatisticasMini();
            if (typeof atualizarCards === 'function') atualizarCards();
            if (typeof carregarDados === 'function') carregarDados();
        }
        
        // Página Mobile
        if (pathname.includes('/mobile-telas/')) {
            if (typeof atualizarCards === 'function') atualizarCards();
            if (typeof renderizarHorario === 'function') renderizarHorario();
            if (typeof renderizarProximoEvento === 'function') renderizarProximoEvento();
            if (typeof renderizarProximasTarefas === 'function') renderizarProximasTarefas();
            if (typeof renderizarNotificacoes === 'function') renderizarNotificacoes();
            if (typeof atualizarBadgeNotificacoes === 'function') atualizarBadgeNotificacoes();
        }
        
        // Página Tarefas
        if (pathname.includes('/tarefas/')) {
            if (typeof renderTasks === 'function') renderTasks();
            if (typeof atualizarEstatisticas === 'function') atualizarEstatisticas();
            if (typeof atualizarContadores === 'function') atualizarContadores();
        }
        
        // Página Calendário (Desktop)
        if (pathname.includes('/calendario/') && !pathname.includes('/mobile-telas/')) {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderEvents === 'function') renderEvents();
            if (typeof carregarEventos === 'function') carregarEventos();
        }
        
        // Página Calendário (Mobile)
        if (pathname.includes('/calendario/') && pathname.includes('/mobile-telas/')) {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderEvents === 'function') renderEvents();
        }
        
        // Página Anotações
        if (pathname.includes('/anotacoes/') || pathname.includes('/notas/')) {
            if (typeof renderNotes === 'function') renderNotes();
            if (typeof carregarAnotacoes === 'function') carregarAnotacoes();
        }
        
        // Página Perfil
        if (pathname.includes('/perfil/')) {
            if (typeof loadProfileData === 'function') loadProfileData();
            if (typeof carregarDados === 'function') carregarDados();
        }
        
        // Disparar evento personalizado para outras telas
        window.dispatchEvent(new CustomEvent('dataRefreshed'));
        
        console.log('[Sync] UI atualizada');
    };
    
    // Função para logout seguro
    window.safeLogout = async function() {
        if (window.CacheManager) {
            await window.CacheManager.logout();
        }
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    };
    
    // Escutar evento de refresh manual
    window.addEventListener('forceRefresh', () => {
        console.log('[Sync] Refresh forçado manualmente');
        window.refreshAllData();
    });
    
    console.log('[Sync] Helper carregado com suporte a tempo real');
})();