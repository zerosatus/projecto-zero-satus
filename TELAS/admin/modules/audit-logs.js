// ==========================================
// audit-logs.js - LOGS DE AUDITORIA REAIS
// ==========================================

console.log('[AuditLogs] 📋 Carregando módulo de logs de auditoria...');

let auditLogsCache = [];
let logsFilter = 'all';

// ==========================================
// CARREGAR LOGS DO SUPABASE
// ==========================================
async function loadAuditLogs() {
    console.log('[AuditLogs] 📋 Carregando logs de auditoria...');
    
    const filter = document.getElementById('logFilter')?.value || 'all';
    logsFilter = filter;
    
    const timelineContainer = document.getElementById('logsTimeline');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
            <p style="margin-top: 15px;">Carregando logs...</p>
        </div>
    `;

    try {
        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase não inicializado');
        }

        // Buscar logs do Supabase
        let query = client
            .from('audit_logs')
            .select('*, profiles(nome)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (filter !== 'all') {
            query = query.eq('tipo', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[AuditLogs] ❌ Erro:', error);
            throw error;
        }

        auditLogsCache = data || [];
        console.log(`[AuditLogs] ✅ ${auditLogsCache.length} logs carregados`);

        // Atualizar estatísticas
        await updateLogStats();

        // Renderizar timeline
        renderTimeline(auditLogsCache);

    } catch (error) {
        console.error('[AuditLogs] ❌ Erro ao carregar logs:', error);
        timelineContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
                <p style="margin-top: 15px;">Erro ao carregar logs: ${error.message}</p>
                <button class="btn-secondary" onclick="loadAuditLogs()" style="margin-top: 10px;">
                    <i class="fas fa-sync"></i> Tentar novamente
                </button>
            </div>
        `;
    }
}

// ==========================================
// ATUALIZAR ESTATÍSTICAS
// ==========================================
async function updateLogStats() {
    try {
        const client = window.supabaseClient;
        if (!client) return;

        const { data, error } = await client.rpc('get_logs_stats');

        if (error) {
            console.error('[AuditLogs] ❌ Erro stats:', error);
            return;
        }

        if (data && data.length > 0) {
            const stats = data[0];
            document.getElementById('totalLogs').textContent = stats.total_logs || 0;
            document.getElementById('warningLogs').textContent = stats.logs_seguranca || 0;
            document.getElementById('securityLogs').textContent = stats.logs_seguranca || 0;
            document.getElementById('todayLogs').textContent = stats.logs_hoje || 0;
        }
    } catch (error) {
        console.error('[AuditLogs] ❌ Erro stats:', error);
    }
}

// ==========================================
// RENDERIZAR TIMELINE
// ==========================================
function renderTimeline(logs) {
    const container = document.getElementById('logsTimeline');
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Nenhum log encontrado</p>
            </div>
        `;
        return;
    }

    let html = '<div class="timeline">';
    
    logs.forEach(log => {
        const logType = log.tipo || 'system';
        const logIcon = getLogIcon(logType);
        const typeLabel = getLogTypeLabel(logType);
        const nomeUsuario = log.profiles?.nome || log.user_email || 'Sistema';
        
        html += `
            <div class="timeline-item ${logType}">
                <div class="timeline-header">
                    <h4 class="timeline-title">
                        ${logIcon} ${log.acao || 'Ação'}
                    </h4>
                    <div class="timeline-time">
                        <i class="fas fa-clock"></i>
                        ${formatLogTime(log.created_at)}
                    </div>
                </div>
                <p class="timeline-description">${log.descricao || 'Sem descrição'}</p>
                <div class="timeline-meta">
                    <span class="timeline-badge ${logType}">${typeLabel}</span>
                    <div class="timeline-user">
                        <i class="fas fa-user"></i>
                        ${nomeUsuario}
                    </div>
                    ${log.ip ? `
                        <div class="timeline-user">
                            <i class="fas fa-network-wired"></i>
                            IP: ${log.ip}
                        </div>
                    ` : ''}
                    ${log.user_agent ? `
                        <div class="timeline-user" style="font-size: 10px; color: var(--text-muted);">
                            <i class="fas fa-laptop"></i>
                            ${log.user_agent.substring(0, 50)}${log.user_agent.length > 50 ? '...' : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ==========================================
// HELPERS
// ==========================================
function getLogIcon(type) {
    const icons = {
        user: '<i class="fas fa-user" style="color: #10b981;"></i>',
        admin: '<i class="fas fa-user-shield" style="color: var(--primary);"></i>',
        security: '<i class="fas fa-shield-alt" style="color: #ef4444;"></i>',
        post: '<i class="fas fa-newspaper" style="color: #f59e0b;"></i>',
        system: '<i class="fas fa-cog" style="color: #3b82f6;"></i>'
    };
    return icons[type] || '<i class="fas fa-info-circle"></i>';
}

function getLogTypeLabel(type) {
    const labels = {
        user: '👤 Usuário',
        admin: '👑 Admin',
        security: '🔒 Segurança',
        post: '📝 Post',
        system: '⚙️ Sistema'
    };
    return labels[type] || type;
}

function formatLogTime(timestamp) {
    if (!timestamp) return 'Data desconhecida';
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return timestamp;
    }
}

// ==========================================
// EXPORTAR LOGS
// ==========================================
window.exportLogs = async function() {
    console.log('[AuditLogs] 📥 Exportando logs...');
    
    try {
        const client = window.supabaseClient;
        if (!client) {
            showToast('❌ Supabase não inicializado', true);
            return;
        }

        let query = client
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        if (logsFilter !== 'all') {
            query = query.eq('tipo', logsFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
            showToast('⚠️ Nenhum log para exportar', true);
            return;
        }

        const headers = ['ID', 'Usuário', 'Email', 'Ação', 'Descrição', 'Tipo', 'IP', 'User Agent', 'Data'];
        const rows = data.map(log => [
            log.id,
            log.user_id || 'Sistema',
            log.user_email || '',
            `"${(log.acao || '').replace(/"/g, '""')}"`,
            `"${(log.descricao || '').replace(/"/g, '""')}"`,
            log.tipo || '',
            log.ip || '',
            `"${(log.user_agent || '').replace(/"/g, '""')}"`,
            log.created_at || ''
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `logs-auditoria-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('📥 Logs exportados com sucesso!');

    } catch (error) {
        console.error('[AuditLogs] ❌ Erro:', error);
        showToast('❌ Erro ao exportar: ' + error.message, true);
    }
};

// ==========================================
// FUNÇÃO PARA REGISTRAR LOG (CHAMADA DO FRONTEND)
// ==========================================
window.registrarLog = async function(acao, descricao, tipo = 'system', detalhes = {}) {
    try {
        const client = window.supabaseClient;
        if (!client) return false;

        // Buscar usuário atual
        const { data: { user } } = await client.auth.getUser();
        const userId = user?.id || null;

        const { data, error } = await client.rpc('registrar_log', {
            p_user_id: userId,
            p_acao: acao,
            p_descricao: descricao,
            p_tipo: tipo,
            p_detalhes: detalhes
        });

        if (error) {
            console.error('[AuditLogs] ❌ Erro ao registrar log:', error);
            return false;
        }

        console.log('[AuditLogs] ✅ Log registrado:', acao);
        return true;

    } catch (error) {
        console.error('[AuditLogs] ❌ Erro:', error);
        return false;
    }
};

// ==========================================
// EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const logFilter = document.getElementById('logFilter');
    if (logFilter) {
        logFilter.addEventListener('change', loadAuditLogs);
    }
});

console.log('[AuditLogs] ✅ audit-logs.js carregado!');