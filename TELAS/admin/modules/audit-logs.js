// ==========================================
// audit-logs.js - LOGS DE AUDITORIA
// ==========================================

console.log('[AuditLogs] 📋 Carregando módulo de logs de auditoria...');

// ==========================================
// DADOS ESTÁTICOS (MOCK)
// ==========================================
const mockAuditLogs = [
    {
        id: '1',
        type: 'admin',
        action: 'Usuário tornado ADMIN',
        description: 'O administrador tornou um usuário como ADMIN',
        user: 'Sistema',
        userEmail: 'system@zerosatus.com',
        target: 'Usuário',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        ip: '192.168.1.100'
    },
    {
        id: '2',
        type: 'security',
        action: 'Tentativa de login falha',
        description: 'Tentativa de login falhou para um email não autorizado',
        user: 'Sistema',
        userEmail: 'system@zerosatus.com',
        target: 'Email desconhecido',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        ip: '192.168.1.105'
    },
    {
        id: '3',
        type: 'post',
        action: 'Post criado',
        description: 'Novo post criado no blog',
        user: 'Administrador',
        userEmail: 'admin@zerosatus.com',
        target: 'Novo Post',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        ip: '192.168.1.100'
    },
    {
        id: '4',
        type: 'user',
        action: 'Usuário banido',
        description: 'Um usuário foi banido da plataforma',
        user: 'Administrador',
        userEmail: 'admin@zerosatus.com',
        target: 'Usuário Banido',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        ip: '192.168.1.100'
    },
    {
        id: '5',
        type: 'admin',
        action: 'Acesso ao painel admin',
        description: 'Administrador acessou o painel administrativo',
        user: 'Administrador',
        userEmail: 'admin@zerosatus.com',
        target: 'Painel Admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        ip: '192.168.1.100'
    }
];

// ==========================================
// CARREGAR LOGS DE AUDITORIA
// ==========================================
function loadAuditLogs() {
    console.log('[AuditLogs] 📋 Carregando logs de auditoria...');
    
    const filter = document.getElementById('logFilter')?.value || 'all';
    const timelineContainer = document.getElementById('logsTimeline');
    
    if (!timelineContainer) return;

    // Filtrar logs
    let filteredLogs = mockAuditLogs;
    if (filter !== 'all') {
        filteredLogs = mockAuditLogs.filter(log => log.type === filter);
    }
    
    // Ordenar por data (mais recente primeiro)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Atualizar estatísticas
    const elTotal = document.getElementById('totalLogs');
    const elWarnings = document.getElementById('warningLogs');
    const elSecurity = document.getElementById('securityLogs');
    const elToday = document.getElementById('todayLogs');
    
    if (elTotal) elTotal.textContent = mockAuditLogs.length;
    if (elWarnings) elWarnings.textContent = mockAuditLogs.filter(l => l.type === 'post' || l.type === 'user').length;
    if (elSecurity) elSecurity.textContent = mockAuditLogs.filter(l => l.type === 'security').length;
    if (elToday) elToday.textContent = mockAuditLogs.filter(l => {
        const logDate = new Date(l.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
    }).length;
    
    // Renderizar timeline
    if (filteredLogs.length === 0) {
        timelineContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Nenhum log encontrado para este filtro</p>
            </div>
        `;
        return;
    }
    
    timelineContainer.innerHTML = `
        <div class="timeline">
            ${filteredLogs.map(log => `
                <div class="timeline-item ${log.type}">
                    <div class="timeline-header">
                        <h4 class="timeline-title">
                            ${getLogIcon(log.type)} ${log.action}
                        </h4>
                        <div class="timeline-time">
                            <i class="fas fa-clock"></i>
                            ${formatLogTime(log.timestamp)}
                        </div>
                    </div>
                    <p class="timeline-description">${log.description}</p>
                    <div class="timeline-meta">
                        <span class="timeline-badge ${log.type}">${getLogTypeLabel(log.type)}</span>
                        <div class="timeline-user">
                            <i class="fas fa-user"></i>
                            ${log.user} (${log.userEmail})
                        </div>
                        <div class="timeline-user">
                            <i class="fas fa-network-wired"></i>
                            IP: ${log.ip}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    console.log('[AuditLogs] ✅ Logs carregados:', filteredLogs.length);
}

// ==========================================
// HELPERS
// ==========================================
function getLogIcon(type) {
    const icons = {
        user: '<i class="fas fa-user" style="color: #10b981;"></i>',
        admin: '<i class="fas fa-user-shield" style="color: var(--primary);"></i>',
        security: '<i class="fas fa-shield-alt" style="color: #ef4444;"></i>',
        post: '<i class="fas fa-newspaper" style="color: #f59e0b;"></i>'
    };
    return icons[type] || '<i class="fas fa-info-circle"></i>';
}

function getLogTypeLabel(type) {
    const labels = {
        user: 'Usuário',
        admin: 'Admin',
        security: 'Segurança',
        post: 'Post'
    };
    return labels[type] || type;
}

function formatLogTime(timestamp) {
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
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return timestamp;
    }
}

// ==========================================
// EXPORTAR LOGS
// ==========================================
window.exportLogs = function() {
    console.log('[AuditLogs] 📥 Exportando logs...');
    
    const headers = ['ID', 'Tipo', 'Ação', 'Descrição', 'Usuário', 'Email', 'Alvo', 'Timestamp', 'IP'];
    const rows = mockAuditLogs.map(log => [
        log.id,
        log.type,
        log.action,
        `"${log.description.replace(/"/g, '""')}"`,
        log.user,
        log.userEmail,
        log.target,
        log.timestamp,
        log.ip
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
};

// ==========================================
// ATUALIZAR QUANDO MUDAR FILTRO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const logFilter = document.getElementById('logFilter');
    if (logFilter) {
        logFilter.addEventListener('change', loadAuditLogs);
    }
});

console.log('[AuditLogs] ✅ audit-logs.js carregado!');