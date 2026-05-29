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
        // SÓ EXECUTAR NA PÁGINA INICIAL
        const pathname = window.location.pathname;
        const isHomePage = pathname.includes('/inicio/') || 
                          pathname.endsWith('/index.html') || 
                          pathname === '/' ||
                          pathname === '/inicio' ||
                          pathname === '/index.html';
        
        if (!isHomePage) {
            // Não é página inicial, não precisa tentar sincronizar tabela
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
            } else {
                console.log('[Sync] Nenhum horário encontrado no CacheManager');
            }
        }
    };
    
    // Função para atualizar a tabela de horário do Desktop (inicio/index.html)
    function atualizarTabelaHorarioDesktop(weeklySchedule, timeSlots) {
        console.log('[Sync] Verificando se há tabela para atualizar...');
        
        // Mapeamento de dias da semana (ordem da tabela)
        const diasTabela = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        const diasChave = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        
        // Tentar encontrar a tabela de horário no Desktop com diferentes seletores
        let scheduleTable = null;
        
        // Tenta diferentes seletores
        const seletores = [
            '.schedule-table tbody',
            'table.schedule-table tbody',
            '.schedule-panel table tbody',
            '.schedule-table',
            '#schedule-table tbody',
            'table:has(.schedule-panel) tbody'
        ];
        
        for (const seletor of seletores) {
            try {
                scheduleTable = document.querySelector(seletor);
                if (scheduleTable) {
                    console.log('[Sync] Tabela encontrada com seletor:', seletor);
                    break;
                }
            } catch(e) {}
        }
        
        if (!scheduleTable) {
            console.log('[Sync] Tabela de horário não encontrada nesta página (esperado em /inicio/)');
            return;
        }
        
        // Se não tem dados, não faz nada
        if (!weeklySchedule || Object.keys(weeklySchedule).length === 0) {
            console.log('[Sync] Nenhum dado de horário para sincronizar');
            return;
        }
        
        console.log('[Sync] 📅 Atualizando tabela de horário do Desktop');
        
        // Verificar se scheduleTable é tbody ou table
        let tbody = scheduleTable;
        if (scheduleTable.tagName === 'TABLE') {
            tbody = scheduleTable.querySelector('tbody');
            if (!tbody) {
                console.log('[Sync] Tabela não tem tbody, criando um...');
                tbody = document.createElement('tbody');
                const rows = scheduleTable.querySelectorAll('tr');
                rows.forEach(row => tbody.appendChild(row));
                scheduleTable.appendChild(tbody);
            }
        }
        
        const rows = tbody.querySelectorAll('tr');
        console.log('[Sync] Encontradas', rows.length, 'linhas na tabela');
        
        if (rows.length === 0) {
            console.log('[Sync] Nenhuma linha encontrada na tabela');
            return;
        }
        
        // Mapeamento de horários (usando as linhas existentes)
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return;
            
            const timeCell = cells[0];
            const timeSlot = timeCell ? timeCell.textContent.trim() : null;
            
            if (!timeSlot) return;
            
            console.log(`[Sync] Processando linha ${rowIndex + 1}: horário ${timeSlot}`);
            
            // Para cada dia da semana (células 1 a 5)
            for (let i = 0; i < diasChave.length && i + 1 < cells.length; i++) {
                const diaChave = diasChave[i];
                const cell = cells[i + 1]; // +1 porque a primeira célula é o horário
                
                if (cell) {
                    // Procurar aula neste dia e horário
                    const aula = weeklySchedule[diaChave]?.find(a => a.horaInicio === timeSlot);
                    
                    if (aula) {
                        // Atualizar célula com a aula
                        const materiaClass = getMateriaClass(aula.materia);
                        cell.className = `subject ${materiaClass}`;
                        cell.textContent = aula.materia;
                        console.log(`[Sync] ✅ Atualizada: ${diasTabela[i]} ${timeSlot} -> ${aula.materia}`);
                    } else if (cell.textContent && cell.textContent !== '—' && cell.textContent !== '') {
                        console.log(`[Sync] ℹ️ Mantendo valor existente em ${diasTabela[i]} ${timeSlot}: ${cell.textContent}`);
                    }
                }
            }
        });
        
        console.log('[Sync] Tabela de horário atualizada com sucesso!');
        
        // Disparar evento para outras funções que precisam saber da atualização
        window.dispatchEvent(new CustomEvent('scheduleUpdated', { detail: weeklySchedule }));
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
            'redacao': 'redacao',
            'educação física': 'educacao-fisica',
            'artes': 'artes',
            'filosofia': 'filosofia',
            'sociologia': 'sociologia',
            'quimica': 'quimica',
            'fisica': 'fisica'
        };
        
        const lowerMateria = materia?.toLowerCase()?.trim() || '';
        
        // Verificar correspondência exata ou parcial
        for (const [key, value] of Object.entries(mapa)) {
            if (lowerMateria === key || lowerMateria.includes(key)) {
                return value;
            }
        }
        
        return 'outros';
    }
    
    // Executar sincronização periódica (apenas na página inicial, com intervalo maior)
    let ultimaSincronizacao = 0;
    const INTERVALO_SINCRONIZACAO = 10000; // 10 segundos
    
    function sincronizarSeNecessario() {
        const agora = Date.now();
        if (agora - ultimaSincronizacao >= INTERVALO_SINCRONIZACAO) {
            ultimaSincronizacao = agora;
            window.syncScheduleToDesktop();
        }
    }
    
    // Executar ao carregar a página (com delay)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.syncScheduleToDesktop();
                // Iniciar intervalo apenas se for página inicial
                const pathname = window.location.pathname;
                const isHomePage = pathname.includes('/inicio/') || 
                                  pathname.endsWith('/index.html') || 
                                  pathname === '/' ||
                                  pathname === '/inicio';
                if (isHomePage) {
                    setInterval(sincronizarSeNecessario, INTERVALO_SINCRONIZACAO);
                }
            }, 1500);
        });
    } else {
        setTimeout(() => {
            window.syncScheduleToDesktop();
            const pathname = window.location.pathname;
            const isHomePage = pathname.includes('/inicio/') || 
                              pathname.endsWith('/index.html') || 
                              pathname === '/' ||
                              pathname === '/inicio';
            if (isHomePage) {
                setInterval(sincronizarSeNecessario, INTERVALO_SINCRONIZACAO);
            }
        }, 1500);
    }
    
    console.log('[Sync] Ponte PC-Mobile instalada');
})();