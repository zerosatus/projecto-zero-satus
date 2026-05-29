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



// =====================================================
// PONTE DE SINCRONIZAÇÃO PC <-> MOBILE
// Mantém o Desktop funcionando como está, mas sincroniza dados
// =====================================================

(function() {
    // Função para carregar horário do Mobile para o Desktop
    window.syncScheduleToDesktop = function() {
        console.log('[Sync] 🔄 Sincronizando horário para Desktop...');
        
        const usuario = localStorage.getItem('usuarioLogado');
        if (!usuario) return;
        
        let usuarioObj;
        try {
            usuarioObj = JSON.parse(usuario);
        } catch(e) { return; }
        
        const userId = usuarioObj.uid || usuarioObj.email;
        
        // Tentar carregar weeklySchedule do CacheManager
        if (window.CacheManager) {
            const weeklySchedule = window.CacheManager.get('weeklySchedule', null);
            const timeSlots = window.CacheManager.get('timeSlots', null);
            
            if (weeklySchedule) {
                console.log('[Sync] ✅ Horário carregado do CacheManager:', weeklySchedule);
                
                // Salvar no formato que o Desktop entende
                localStorage.setItem(`${userId}_weeklySchedule`, JSON.stringify(weeklySchedule));
                if (timeSlots) {
                    localStorage.setItem(`${userId}_timeSlots`, JSON.stringify(timeSlots));
                }
                
                // Atualizar tabela do Desktop se existir
                atualizarTabelaHorarioDesktop(weeklySchedule, timeSlots);
            }
        }
    };
    
    // Função para atualizar a tabela de horário do Desktop (inicio/index.html)
    function atualizarTabelaHorarioDesktop(weeklySchedule, timeSlots) {
        // Mapeamento de dias
        const diasMap = {
            'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5
        };
        
        const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        
        // Tentar encontrar a tabela de horário no Desktop
        const scheduleTable = document.querySelector('.schedule-table tbody');
        if (!scheduleTable) {
            console.log('[Sync] Tabela de horário não encontrada nesta página');
            return;
        }
        
        // Se não tem dados, não faz nada
        if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) return;
        
        console.log('[Sync] 📅 Atualizando tabela de horário do Desktop');
        
        // Para cada linha da tabela (cada horário)
        const rows = scheduleTable.querySelectorAll('tr');
        rows.forEach(row => {
            const timeCell = row.querySelector('td:first-child');
            if (!timeCell) return;
            
            const timeSlot = timeCell.textContent.trim();
            
            // Para cada dia da semana (colunas 1 a 5)
            for (let i = 0; i < diasSemana.length; i++) {
                const dia = diasSemana[i];
                const cell = row.children[i + 1]; // +1 porque a primeira coluna é o horário
                
                if (cell) {
                    // Procurar aula neste dia e horário
                    const aula = weeklySchedule[dia]?.find(a => a.horaInicio === timeSlot);
                    
                    if (aula) {
                        // Atualizar célula com a aula
                        cell.className = `subject ${getMateriaClass(aula.materia)}`;
                        cell.textContent = aula.materia;
                    } else if (cell.textContent !== '—' && cell.textContent !== '') {
                        // Se não tem aula e não está vazio, mantém como estava
                        // Não altera
                    }
                }
            }
        });
    }
    
    // Função auxiliar para mapear matéria para classe CSS
    function getMateriaClass(materia) {
        const mapa = {
            'matemática': 'matematica',
            'matematica': 'matematica',
            'português': 'portugues',
            'portugues': 'portugues',
            'física': 'fisica',
            'fisica': 'fisica',
            'química': 'quimica',
            'quimica': 'quimica',
            'história': 'historia',
            'historia': 'historia',
            'geografia': 'geografia',
            'biologia': 'biologia',
            'inglês': 'ingles',
            'ingles': 'ingles',
            'redação': 'redacao',
            'redacao': 'redacao'
        };
        
        const lowerMateria = materia?.toLowerCase() || '';
        return mapa[lowerMateria] || 'outros';
    }
    
    // Executar sincronização periódica
    setInterval(() => {
        window.syncScheduleToDesktop();
    }, 5000);
    
    // Executar ao carregar a página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(window.syncScheduleToDesktop, 1000);
        });
    } else {
        setTimeout(window.syncScheduleToDesktop, 1000);
    }
    
    console.log('[Sync] Ponte PC-Mobile instalada');
})();