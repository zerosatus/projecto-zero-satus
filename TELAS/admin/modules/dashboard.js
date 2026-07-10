// ==========================================
// dashboard.js - DASHBOARD E ESTATÍSTICAS
// ==========================================

console.log('[Dashboard] 📊 Carregando dashboard...');

// ==========================================
// CARREGAR ESTATÍSTICAS DO DASHBOARD
// ==========================================
async function loadDashboardStats() {
    console.log('[Dashboard] 📊 Carregando estatísticas...');
    
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.error('[Dashboard] ❌ supabaseClient não encontrado');
        return;
    }

    try {
        // Usar a função SQL get_admin_stats
        const { data, error } = await supabaseClient.rpc('get_admin_stats');

        if (error) {
            console.error('[Dashboard] ❌ Erro ao carregar estatísticas:', error);
            mostrarErroEstatisticas();
            return;
        }

        if (data && data.length > 0) {
            const stats = data[0];
            
            // Atualizar elementos
            atualizarElemento('countUsers', stats.total_usuarios);
            atualizarElemento('countPosts', stats.total_posts);
            atualizarElemento('countComments', stats.total_comentarios);
            atualizarElemento('countActiveTasks', stats.total_rascunhos);
            atualizarElemento('countNewUsers', stats.novos_usuarios_7dias);
            atualizarElemento('countBannedUsers', stats.total_banidos);
            atualizarElemento('countDraftPosts', stats.total_rascunhos);
            atualizarElemento('countActiveToday', stats.ativos_hoje);
            
            console.log('[Dashboard] ✅ Estatísticas carregadas:', stats);
        }

        // Carregar atividades recentes
        await loadRecentActivities();

    } catch (error) {
        console.error('[Dashboard] ❌ Erro ao carregar estatísticas:', error);
        mostrarErroEstatisticas();
    }
}

// ==========================================
// ATUALIZAR ELEMENTO
// ==========================================
function atualizarElemento(id, valor) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = valor !== undefined && valor !== null ? valor : '-';
    }
}

// ==========================================
// MOSTRAR ERRO
// ==========================================
function mostrarErroEstatisticas() {
    const ids = ['countUsers', 'countPosts', 'countComments', 'countActiveTasks', 
                 'countNewUsers', 'countBannedUsers', 'countDraftPosts', 'countActiveToday'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '❌';
    });
}

// ==========================================
// CARREGAR ATIVIDADES RECENTES
// ==========================================
async function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;

    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--danger);">
                <i class="fas fa-exclamation-circle"></i> Erro ao carregar atividades
            </div>
        `;
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_recent_activities', {
            limit_count: 10
        });

        if (error) {
            console.error('[Dashboard] ❌ Erro ao carregar atividades:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <i class="fas fa-exclamation-circle"></i> Erro ao carregar atividades
                </div>
            `;
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <i class="fas fa-inbox"></i> Nenhuma atividade recente
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.tipo}">
                    <i class="fas ${activity.icone || 'fa-circle'}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.titulo || 'Atividade'}</div>
                    <div style="color: var(--text-muted); font-size: 13px;">${activity.descricao || ''}</div>
                    <div class="activity-time">
                        <i class="fas fa-user"></i> ${activity.usuario || 'Sistema'} 
                        <i class="fas fa-clock" style="margin-left: 10px;"></i> ${formatarDataRelativa(activity.data)}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('[Dashboard] ❌ Erro:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i> Erro ao carregar atividades
            </div>
        `;
    }
}

// ==========================================
// FORMATAR DATA RELATIVA
// ==========================================
function formatarDataRelativa(data) {
    if (!data) return 'Data desconhecida';
    try {
        const date = new Date(data);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return data;
    }
}

// ==========================================
// ATUALIZAR STATUS DO SISTEMA
// ==========================================
function atualizarStatusSistema() {
    const statusEl = document.getElementById('lastSyncStatus');
    if (statusEl) {
        const now = new Date();
        statusEl.textContent = `Última sincronização: ${now.toLocaleTimeString('pt-BR')}`;
    }
}

// ==========================================
// EXPORTAR FUNÇÕES
// ==========================================
window.loadDashboardStats = loadDashboardStats;
window.loadRecentActivities = loadRecentActivities;
window.formatarDataRelativa = formatarDataRelativa;

console.log('[Dashboard] ✅ dashboard.js carregado!');