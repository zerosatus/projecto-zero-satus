// sync-helper.js - Helper de sincronização (VERSÃO OTIMIZADA)

(function() {
    let isInitialized = false;
    let lastCloudLoad = 0;
    const CLOUD_LOAD_COOLDOWN = 3000; // 3 segundos
    
    // =====================================================
    // FUNÇÃO PRINCIPAL DE SINCRONIZAÇÃO
    // =====================================================
    window.initSync = async function() {
        if (isInitialized) {
            console.log('[Sync] Já inicializado');
            return true;
        }
        
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
            }, 2000);
            
            isInitialized = true;
            return loaded;
        }
        
        return false;
    };
    
    // =====================================================
    // ESCUTAR EVENTOS DE NUVEM (COM COOLDOWN)
    // =====================================================
    let cloudLoadTimeout = null;
    
    window.addEventListener('cloudDataLoaded', (event) => {
        const now = Date.now();
        if (now - lastCloudLoad < CLOUD_LOAD_COOLDOWN) {
            console.log('[Sync] Ignorando cloudDataLoaded (cooldown)');
            return;
        }
        
        if (cloudLoadTimeout) clearTimeout(cloudLoadTimeout);
        
        cloudLoadTimeout = setTimeout(() => {
            lastCloudLoad = Date.now();
            console.log('[Sync] 📡 Processando cloudDataLoaded...');
            
            // Atualizar apenas se necessário
            window.forcarRecargaHorarioDesktop();
            if (window.refreshAllData) window.refreshAllData();
            
            cloudLoadTimeout = null;
        }, 200);
    });
    
    window.addEventListener('profilePhotoUpdated', (event) => {
        console.log('[Sync] 📸 Foto de perfil atualizada');
        if (typeof window.atualizarAvatarMobile === 'function') {
            window.atualizarAvatarMobile(event.detail?.photoUrl);
        }
    });
    
    // =====================================================
    // FORÇAR RECARGA DO HORÁRIO
    // =====================================================
    let horarioRefreshTimeout = null;
    
    window.forcarRecargaHorarioDesktop = function() {
        if (horarioRefreshTimeout) return;
        
        horarioRefreshTimeout = setTimeout(() => {
            console.log('[Sync] 🔄 Recarregando horário...');
            
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
            
            horarioRefreshTimeout = null;
        }, 100);
    };
    
    function atualizarTabelaHorarioDesktopForce(weeklySchedule, timeSlots) {
        const scheduleTable = document.querySelector('.schedule-table tbody');
        if (!scheduleTable) return;
        
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
    
    // =====================================================
    // RECARREGAR TODOS OS DADOS DA UI (APENAS UMA VEZ)
    // =====================================================
    let refreshTimeout = null;
    
    window.refreshAllData = function() {
        if (refreshTimeout) return;
        
        refreshTimeout = setTimeout(() => {
            console.log('[Sync] 🔄 Recarregando dados da UI...');
            
            const pathname = window.location.pathname;
            
            if (pathname.includes('/inicio/')) {
                if (typeof atualizarEstatisticasMini === 'function') atualizarEstatisticasMini();
                if (typeof atualizarCards === 'function') atualizarCards();
                if (typeof carregarDados === 'function') carregarDados();
                if (typeof atualizarHorarioDesktop === 'function') atualizarHorarioDesktop();
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
                if (typeof carregarFotoPerfil === 'function') carregarFotoPerfil();
            }
            
            window.dispatchEvent(new CustomEvent('dataRefreshed'));
            refreshTimeout = null;
        }, 150);
    };
    
    // =====================================================
    // LOGOUT SEGURO
    // =====================================================
    window.safeLogout = async function() {
        if (window.CacheManager) {
            await window.CacheManager.logout();
        }
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    };
    
    // =====================================================
    // EVENTOS GLOBAIS (COM PREVENÇÃO DE DUPLICAÇÃO)
    // =====================================================
    let forceRefreshTimeout = null;
    
    window.addEventListener('forceRefresh', () => {
        if (forceRefreshTimeout) return;
        forceRefreshTimeout = setTimeout(() => {
            console.log('[Sync] ForceRefresh recebido');
            window.refreshAllData();
            window.forcarRecargaHorarioDesktop();
            forceRefreshTimeout = null;
        }, 100);
    });
    
    let storageTimeout = null;
    window.addEventListener('storage', (e) => {
        if (e.key && (e.key.includes('weeklySchedule') || e.key.includes('timeSlots'))) {
            if (storageTimeout) clearTimeout(storageTimeout);
            storageTimeout = setTimeout(() => {
                console.log('[Sync] Storage event:', e.key);
                window.forcarRecargaHorarioDesktop();
                window.refreshAllData();
                storageTimeout = null;
            }, 200);
        }
    });
    
    console.log('[Sync] Helper carregado (modo otimizado)');
})();