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
            
            // Carregar dados da nuvem
            const loaded = await window.CacheManager.loadFromCloud(true);
            
            // Iniciar escuta em tempo real
            setTimeout(() => {
                if (window.CacheManager && window.CacheManager.startRealtimeSync) {
                    window.CacheManager.startRealtimeSync();
                }
            }, 1000);
            
            return loaded;
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
        
        // Página Calendário
        if (pathname.includes('/calendario/')) {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderEvents === 'function') renderEvents();
            if (typeof carregarEventos === 'function') carregarEventos();
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
        
        // Disparar evento personalizado
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

// =====================================================
// PONTE DE SINCRONIZAÇÃO PC <-> MOBILE
// =====================================================

(function() {
    // Função para carregar horário do Mobile para o Desktop
    window.syncScheduleToDesktop = function() {
        const pathname = window.location.pathname;
        const isHomePage = pathname.includes('/inicio/') || 
                          pathname.endsWith('/index.html') || 
                          pathname === '/' ||
                          pathname === '/inicio';
        
        if (!isHomePage) {
            return;
        }
        
        console.log('[Sync] 🔄 Sincronizando horário para Desktop...');
        
        const usuario = localStorage.getItem('usuarioLogado');
        if (!usuario) return;
        
        let usuarioObj;
        try {
            usuarioObj = JSON.parse(usuario);
        } catch(e) { return; }
        
        const userId = usuarioObj.uid || usuarioObj.email;
        
        if (window.CacheManager) {
            const weeklySchedule = window.CacheManager.get('weeklySchedule', null);
            const timeSlots = window.CacheManager.get('timeSlots', null);
            
            if (weeklySchedule) {
                console.log('[Sync] ✅ Horário carregado do CacheManager');
                localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedule));
                if (timeSlots) {
                    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlots));
                }
                atualizarTabelaHorarioDesktop(weeklySchedule);
            }
        }
    };
    
    function atualizarTabelaHorarioDesktop(weeklySchedule) {
        const scheduleTable = document.querySelector('.schedule-table tbody');
        if (!scheduleTable) return;
        
        const diasChave = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        const rows = scheduleTable.querySelectorAll('tr');
        
        rows.forEach(row => {
            const timeCell = row.querySelector('td:first-child');
            if (!timeCell) return;
            const timeSlot = timeCell.textContent.trim();
            
            for (let i = 0; i < diasChave.length; i++) {
                const diaChave = diasChave[i];
                const cell = row.children[i + 1];
                if (cell) {
                    const aula = weeklySchedule[diaChave]?.find(a => a.horaInicio === timeSlot);
                    if (aula) {
                        cell.className = `subject ${getMateriaClass(aula.materia)}`;
                        cell.textContent = aula.materia;
                    }
                }
            }
        });
    }
    
    function getMateriaClass(materia) {
        const mapa = {
            'matemática': 'matematica', 'matematica': 'matematica',
            'português': 'portugues', 'portugues': 'portugues',
            'física': 'fisica', 'fisica': 'fisica',
            'química': 'quimica', 'quimica': 'quimica',
            'história': 'historia', 'historia': 'historia',
            'geografia': 'geografia', 'biologia': 'biologia',
            'inglês': 'ingles', 'ingles': 'ingles',
            'redação': 'redacao', 'redacao': 'redacao'
        };
        const lowerMateria = materia?.toLowerCase()?.trim() || '';
        return mapa[lowerMateria] || 'outros';
    }
    
    // Executar sincronização periódica
    setInterval(() => {
        window.syncScheduleToDesktop();
    }, 10000);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(window.syncScheduleToDesktop, 2000);
        });
    } else {
        setTimeout(window.syncScheduleToDesktop, 2000);
    }
    
    console.log('[Sync] Ponte PC-Mobile instalada');
})();