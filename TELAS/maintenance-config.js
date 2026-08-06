// maintenance-config.js - Configuração do modo manutenção

const MAINTENANCE_CONFIG = {
    // ⭐ ATIVAR/DESATIVAR MANUTENÇÃO
    enabled: false,  // TRUE = manutenção ativa, FALSE = sistema normal
    
    // ⭐ MENSAGENS EXIBIDAS
    messages: {
        title: '🛠️ Em Manutenção',
        subtitle: 'Estamos melhorando sua experiência!',
        description: 'Estamos realizando uma atualização no sistema para trazer novas funcionalidades e melhorias. Volte em breve!',
        estimatedTime: '⏱️ Tempo estimado: 30 minutos',
        contact: '📧 Para dúvidas: suporte@zerosatus.com',
        social: '📱 Siga-nos: @zerosatus'
    },
    
    // ⭐ CONFIGURAÇÕES TÉCNICAS
    settings: {
        checkInterval: 30000,     // Verificar a cada 30s (ms)
        forceCheck: true,          // Forçar verificação a cada acesso
        allowAdminAccess: true,    // Permitir acesso admin mesmo em manutenção
        redirectDelay: 2000        // Delay antes de redirecionar (ms)
    },
    
    // ⭐ URLS DE REDIRECIONAMENTO
    urls: {
        admin: 'admin/index.html',
        maintenance: 'maintenance.html',
        login: 'login/index.html',
        home: 'inicio/index.html'
    }
};

// ⭐ FUNÇÃO PARA VERIFICAR MANUTENÇÃO
function isMaintenanceMode() {
    // Verificar se admin forçou manutenção via localStorage
    const adminOverride = localStorage.getItem('maintenance_override');
    if (adminOverride === 'true') {
        return true;
    }
    if (adminOverride === 'false') {
        return false;
    }
    
    // Verificar se config marcou manutenção
    return MAINTENANCE_CONFIG.enabled === true;
}

// ⭐ FUNÇÃO PARA ATIVAR/DESATIVAR MANUTENÇÃO (USO ADMIN)
function setMaintenanceMode(enabled, message = null) {
    MAINTENANCE_CONFIG.enabled = enabled;
    
    if (message) {
        MAINTENANCE_CONFIG.messages.description = message;
    }
    
    // Salvar no localStorage para persistência entre páginas
    localStorage.setItem('maintenance_mode', JSON.stringify({
        enabled: enabled,
        message: message || '',
        timestamp: new Date().toISOString()
    }));
    
    console.log(`[Maintenance] Modo: ${enabled ? 'ATIVADO' : 'DESATIVADO'}`);
    
    // Recarregar para aplicar
    if (window.location.pathname !== '/maintenance.html') {
        setTimeout(() => {
            if (enabled) {
                window.location.href = 'maintenance.html';
            } else {
                window.location.reload();
            }
        }, 500);
    }
}

// ⭐ EXPORTAR PARA USO GLOBAL
window.MAINTENANCE_CONFIG = MAINTENANCE_CONFIG;
window.isMaintenanceMode = isMaintenanceMode;
window.setMaintenanceMode = setMaintenanceMode;

console.log('[Maintenance] Configuração carregada!');
console.log('[Maintenance] Status:', MAINTENANCE_CONFIG.enabled ? '🔴 ATIVADO' : '🟢 NORMAL');