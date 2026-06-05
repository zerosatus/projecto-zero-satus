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
            
            const loaded = await window.CacheManager.loadFromCloud(true);
            
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
        console.log('[Sync] 📡 cloudDataLoaded recebido, atualizando UI...');
        setTimeout(() => {
            window.forcarRecargaHorarioDesktop();
            if (window.refreshAllData) window.refreshAllData();
        }, 100);
    });
    
    // Função para forçar recarga do horário no Desktop
    window.forcarRecargaHorarioDesktop = function() {
        console.log('[Sync] 🔄 Forçando recarga do horário no Desktop...');
        
        if (!window.CacheManager) return;
        
        const weeklySchedule = window.CacheManager.get('weeklySchedule', {});
        const timeSlots = window.CacheManager.get('timeSlots', ['08:00', '09:30', '11:00', '14:00', '15:30']);
        
        if (weeklySchedule && Object.keys(weeklySchedule).length > 0) {
            atualizarTabelaHorarioDesktopForce(weeklySchedule, timeSlots);
        }
        
        if (typeof window.atualizarListaDisciplinas === 'function') {
            window.atualizarListaDisciplinas();
        }
        if (typeof window.atualizarEstatisticasMini === 'function') {
            window.atualizarEstatisticasMini();
        }
    };
    
    function atualizarTabelaHorarioDesktopForce(weeklySchedule, timeSlots) {
        const scheduleTable = document.querySelector('.schedule-table tbody');
        if (!scheduleTable) {
            console.log('[Sync] Tabela de horário não encontrada, tentando novamente em 1s...');
            setTimeout(() => {
                const table = document.querySelector('.schedule-table tbody');
                if (table) atualizarTabelaHorarioDesktopForce(weeklySchedule, timeSlots);
            }, 1000);
            return;
        }
        
        const diasChave = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        const slots = timeSlots && timeSlots.length ? timeSlots : ['08:00', '09:30', '11:00', '14:00', '15:30'];
        
        let html = '';
        slots.forEach(time => {
            html += '<tr>';
            html += `<td class="time-slot">${time}</td>`;
            diasChave.forEach(day => {
                const aula = weeklySchedule[day]?.find(a => a.horaInicio === time);
                if (aula && aula.materia) {
                    const cor = aula.color || getCorByMateria(aula.materia);
                    html += `<td class="subject" style="background-color: ${cor}20; color: ${cor}; border-left: 3px solid ${cor};">
                        ${aula.materia}
                    </td>`;
                } else {
                    html += '<td class="empty-cell">-</td>';
                }
            });
            html += '</tr>';
        });
        
        scheduleTable.innerHTML = html;
        console.log('[Sync] ✅ Horário do Desktop atualizado com sucesso!');
    }
    
    function getCorByMateria(materia) {
        const cores = {
            'matemática': '#9b59b6', 'matematica': '#9b59b6',
            'português': '#3498db', 'portugues': '#3498db',
            'história': '#e74c3c', 'historia': '#e74c3c',
            'física': '#e67e22', 'fisica': '#e67e22',
            'química': '#2ecc71', 'quimica': '#2ecc71',
            'biologia': '#f1c40f', 'geografia': '#1abc9c',
            'inglês': '#34495e', 'ingles': '#34495e',
            'redação': '#00bcd4', 'redacao': '#00bcd4'
        };
        const lowerMateria = materia?.toLowerCase()?.trim() || '';
        return cores[lowerMateria] || '#95a5a6';
    }
    
    window.atualizarTabelaHorarioDesktop = atualizarTabelaHorarioDesktopForce;
    
    // Função para forçar recarregamento de todos os dados
    window.refreshAllData = function() {
        console.log('[Sync] 🔄 Recarregando dados da UI...');
        
        const pathname = window.location.pathname;
        
        if (pathname.includes('/inicio/')) {
            if (typeof atualizarEstatisticasMini === 'function') atualizarEstatisticasMini();
            if (typeof atualizarCards === 'function') atualizarCards();
            if (typeof carregarDados === 'function') carregarDados();
            if (typeof atualizarHorarioDesktop === 'function') atualizarHorarioDesktop();
            window.forcarRecargaHorarioDesktop();
        }
        
        if (pathname.includes('/mobile-telas/')) {
            if (typeof atualizarCards === 'function') atualizarCards();
            if (typeof renderizarHorario === 'function') renderizarHorario();
            if (typeof renderizarProximoEvento === 'function') renderizarProximoEvento();
            if (typeof renderizarProximasTarefas === 'function') renderizarProximasTarefas();
            if (typeof renderizarNotificacoes === 'function') renderizarNotificacoes();
            if (typeof atualizarBadgeNotificacoes === 'function') atualizarBadgeNotificacoes();
        }
        
        if (pathname.includes('/tarefas/')) {
            if (typeof renderTasks === 'function') renderTasks();
            if (typeof atualizarEstatisticas === 'function') atualizarEstatisticas();
            if (typeof atualizarContadores === 'function') atualizarContadores();
            if (typeof renderizarDisciplinas === 'function') renderizarDisciplinas();
        }
        
        if (pathname.includes('/calendario/')) {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderEvents === 'function') renderEvents();
            if (typeof carregarEventos === 'function') carregarEventos();
        }
        
        if (pathname.includes('/anotacoes/') || pathname.includes('/notas/')) {
            if (typeof renderNotes === 'function') renderNotes();
            if (typeof carregarAnotacoes === 'function') carregarAnotacoes();
        }
        
        if (pathname.includes('/perfil/')) {
            if (typeof loadProfileData === 'function') loadProfileData();
            if (typeof carregarDados === 'function') carregarDados();
        }
        
        window.dispatchEvent(new CustomEvent('dataRefreshed'));
        console.log('[Sync] UI atualizada');
    };
    
    window.safeLogout = async function() {
        if (window.CacheManager) {
            await window.CacheManager.logout();
        }
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    };
    
    window.addEventListener('forceRefresh', () => {
        console.log('[Sync] Refresh forçado manualmente');
        window.refreshAllData();
        window.forcarRecargaHorarioDesktop();
    });
    
    console.log('[Sync] Helper carregado com suporte a tempo real');
})();

// =====================================================
// PONTE DE SINCRONIZAÇÃO PC <-> MOBILE
// =====================================================

(function() {
    window.syncScheduleToDesktop = function() {
        const pathname = window.location.pathname;
        const isHomePage = pathname.includes('/inicio/') || 
                          pathname.endsWith('/index.html') || 
                          pathname === '/' ||
                          pathname === '/inicio';
        
        if (!isHomePage) return;
        
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
                if (typeof window.forcarRecargaHorarioDesktop === 'function') {
                    window.forcarRecargaHorarioDesktop();
                }
            }
        }
    };
    
    window.syncAllDataToDesktop = function() {
        const pathname = window.location.pathname;
        const isDesktop = pathname.includes('/inicio/') || 
                         pathname.includes('/dashboard/') ||
                         pathname.includes('/tarefas/') ||
                         pathname.includes('/anotacoes/') ||
                         pathname.includes('/calendario/') ||
                         pathname === '/' ||
                         pathname === '/inicio';
        
        if (!isDesktop) return;
        
        console.log('[Sync] 🔄 Sincronizando todos os dados para Desktop...');
        
        if (!window.CacheManager) return;
        
        const tasks = window.CacheManager.get('tasks', []);
        const notes = window.CacheManager.get('notes', []);
        const calendarEvents = window.CacheManager.get('calendarEvents', []);
        const weeklySchedule = window.CacheManager.get('weeklySchedule', {});
        
        console.log('[Sync] Dados sincronizados:', {
            tasks: tasks.length,
            notes: notes.length,
            events: calendarEvents.length,
            schedule: Object.keys(weeklySchedule).length
        });
        
        if (typeof window.carregarTarefas === 'function') {
            window.carregarTarefas();
        }
        
        if (typeof window.carregarAnotacoes === 'function') {
            window.carregarAnotacoes();
        }
        
        if (typeof window.renderizarDisciplinas === 'function') {
            setTimeout(() => window.renderizarDisciplinas(), 100);
        }
        
        if (weeklySchedule && Object.keys(weeklySchedule).length > 0) {
            if (typeof window.forcarRecargaHorarioDesktop === 'function') {
                window.forcarRecargaHorarioDesktop();
            }
        }
    };
    
    // Executar sincronização periódica mais frequente
    setInterval(() => {
        window.syncScheduleToDesktop();
        window.syncAllDataToDesktop();
    }, 3000);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.syncScheduleToDesktop();
                window.syncAllDataToDesktop();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            window.syncScheduleToDesktop();
            window.syncAllDataToDesktop();
        }, 1000);
    }
    
    // Escutar mudanças no storage (quando outra aba salva dados)
    window.addEventListener('storage', (e) => {
        if (e.key && (e.key.includes('weeklySchedule') || e.key.includes('timeSlots'))) {
            console.log('[Sync] Storage event detectado:', e.key);
            setTimeout(() => {
                if (typeof window.forcarRecargaHorarioDesktop === 'function') {
                    window.forcarRecargaHorarioDesktop();
                }
                if (window.refreshAllData) window.refreshAllData();
            }, 100);
        }
    });
    
    console.log('[Sync] Ponte PC-Mobile instalada com sincronização completa');
})();