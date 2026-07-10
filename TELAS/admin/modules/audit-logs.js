// Audit logs (mock)
console.log('[Audit] Módulo de logs carregado');

const mockAuditLogs = [
    {
        id: '1',
        type: 'admin',
        action: 'Usuário tornado ADMIN',
        description: 'O administrador Jose Samisson tornou Maria Santos como ADMIN',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Maria Santos',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        ip: '192.168.1.100'
    },
    {
        id: '2',
        type: 'security',
        action: 'Tentativa de login falha',
        description: 'Tentativa de login falhou para o email admin@zerosatus.com',
        user: 'Sistema',
        userEmail: 'system@zerosatus.com',
        target: 'admin@zerosatus.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        ip: '192.168.1.105'
    },
    {
        id: '3',
        type: 'post',
        action: 'Post criado',
        description: 'Novo post criado: "Como Organizar seus Estudos"',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Como Organizar seus Estudos',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        ip: '192.168.1.100'
    },
    {
        id: '4',
        type: 'user',
        action: 'Usuário banido',
        description: 'O administrador Jose Samisson baniu o usuário Carlos Mendes',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Carlos Mendes',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        ip: '192.168.1.100'
    },
    {
        id: '5',
        type: 'admin',
        action: 'Acesso ao painel admin',
        description: 'Jose Samisson acessou o painel administrativo',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Painel Admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        ip: '192.168.1.100'
    }
];

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
}

function loadAuditLogs() {
    console.log('[Audit] 📋 Carregando logs de auditoria...');
    const filter = document.getElementById('logFilter')?.value || 'all';
    const timelineContainer = document.getElementById('logsTimeline');
    let filteredLogs = mockAuditLogs;
    if (filter !== 'all') filteredLogs = mockAuditLogs.filter(log => log.type === filter);
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    document.getElementById('totalLogs').textContent = mockAuditLogs.length;
    document.getElementById('warningLogs').textContent = mockAuditLogs.filter(l => l.type === 'post' || l.type === 'user').length;
    document.getElementById('securityLogs').textContent = mockAuditLogs.filter(l => l.type === 'security').length;
    document.getElementById('todayLogs').textContent = mockAuditLogs.filter(l => {
        const logDate = new Date(l.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
    }).length;

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

    console.log('[Audit] ✅ Logs carregados:', filteredLogs.length);
}

window.exportLogs = function() {
    console.log('[Audit] 📥 Exportando logs...');
    const csvContent = [
        ['ID', 'Tipo', 'Ação', 'Descrição', 'Usuário', 'Email', 'Alvo', 'Timestamp', 'IP'].join(','),
        ...mockAuditLogs.map(log => [
            log.id,
            log.type,
            log.action,
            `"${log.description.replace(/"/g, '""')}"`,
            log.user,
            log.userEmail,
            log.target,
            log.timestamp,
            log.ip
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs-auditoria-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Logs exportados com sucesso!');
};

document.addEventListener('DOMContentLoaded', () => {
    const filter = document.getElementById('logFilter');
    if (filter) filter.addEventListener('change', loadAuditLogs);
});
// ==========================================
// audit-logs.js - LOGS DE AUDITORIA
// ==========================================

console.log('[AuditLogs] 📋 Carregando módulo de logs de auditoria...');

// ==========================================
// DADOS ESTÁTICOS
// ==========================================
const mockAuditLogs = [
    {
        id: '1',
        type: 'admin',
        action: 'Usuário tornado ADMIN',
        description: 'O administrador Jose Samisson tornou Maria Santos como ADMIN',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Maria Santos',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min atrás
        ip: '192.168.1.100'
    },
    {
        id: '2',
        type: 'security',
        action: 'Tentativa de login falha',
        description: 'Tentativa de login falhou para o email admin@zerosatus.com',
        user: 'Sistema',
        userEmail: 'system@zerosatus.com',
        target: 'admin@zerosatus.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min atrás
        ip: '192.168.1.105'
    },
    {
        id: '3',
        type: 'post',
        action: 'Post criado',
        description: 'Novo post criado: "Como Organizar seus Estudos"',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Como Organizar seus Estudos',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
        ip: '192.168.1.100'
    },
    {
        id: '4',
        type: 'user',
        action: 'Usuário banido',
        description: 'O administrador Jose Samisson baniu o usuário Carlos Mendes',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Carlos Mendes',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 horas atrás
        ip: '192.168.1.100'
    },
    {
        id: '5',
        type: 'admin',
        action: 'Acesso ao painel admin',
        description: 'Jose Samisson acessou o painel administrativo',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Painel Admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 horas atrás
        ip: '192.168.1.100'
    },
    {
        id: '6',
        type: 'post',
        action: 'Post editado',
        description: 'Post "5 Dicas para Provas" foi atualizado',
        user: 'Maria Santos',
        userEmail: 'maria@email.com',
        target: '5 Dicas para Provas',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 horas atrás
        ip: '192.168.1.110'
    },
    {
        id: '7',
        type: 'security',
        action: 'Senha alterada',
        description: 'O usuário Pedro Costa alterou sua senha',
        user: 'Pedro Costa',
        userEmail: 'pedro@email.com',
        target: 'Alteração de Senha',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 horas atrás
        ip: '192.168.1.115'
    },
    {
        id: '8',
        type: 'user',
        action: 'Novo usuário registrado',
        description: 'Novo usuário registrado: Ana Oliveira',
        user: 'Sistema',
        userEmail: 'system@zerosatus.com',
        target: 'Ana Oliveira',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
        ip: '192.168.1.120'
    },
    {
        id: '9',
        type: 'post',
        action: 'Post deletado',
        description: 'Post "Teste" foi permanentemente deletado',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Teste',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 dias atrás
        ip: '192.168.1.100'
    },
    {
        id: '10',
        type: 'admin',
        action: 'Configurações alteradas',
        description: 'Configurações do sistema foram atualizadas',
        user: 'Jose Samisson',
        userEmail: 'josesamissson200614@gmail.com',
        target: 'Configurações',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 dias atrás
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
    
    // Filtrar logs
    let filteredLogs = mockAuditLogs;
    if (filter !== 'all') {
        filteredLogs = mockAuditLogs.filter(log => log.type === filter);
    }
    
    // Ordenar por data (mais recente primeiro)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Atualizar estatísticas
    document.getElementById('totalLogs').textContent = mockAuditLogs.length;
    document.getElementById('warningLogs').textContent = mockAuditLogs.filter(l => l.type === 'post' || l.type === 'user').length;
    document.getElementById('securityLogs').textContent = mockAuditLogs.filter(l => l.type === 'security').length;
    document.getElementById('todayLogs').textContent = mockAuditLogs.filter(l => {
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
// EXPORTAR LOGS
// ==========================================
window.exportLogs = function() {
    console.log('[AuditLogs] 📥 Exportando logs...');
    
    const csvContent = [
        ['ID', 'Tipo', 'Ação', 'Descrição', 'Usuário', 'Email', 'Alvo', 'Timestamp', 'IP'].join(','),
        ...mockAuditLogs.map(log => [
            log.id,
            log.type,
            log.action,
            `"${log.description.replace(/"/g, '""')}"`,
            log.user,
            log.userEmail,
            log.target,
            log.timestamp,
            log.ip
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs-auditoria-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('📥 Logs exportados com sucesso!');
};

// Atualizar logs quando mudar o filtro
document.addEventListener('DOMContentLoaded', () => {
    const logFilter = document.getElementById('logFilter');
    if (logFilter) {
        logFilter.addEventListener('change', loadAuditLogs);
    }
});

console.log('[AuditLogs] ✅ audit-logs.js carregado!');
