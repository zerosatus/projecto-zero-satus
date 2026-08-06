// maintenance-check.js - Verificador automático de manutenção

(function() {
    'use strict';

    // ⭐ EXCLUIR PÁGINAS QUE NÃO DEVEM SER REDIRECIONADAS
    const EXCLUDED_PAGES = [
        'maintenance.html',
        'login/index.html',
        'admin/index.html',
        'admin/maintenance-control.html'
    ];

    function isExcludedPage() {
        const path = window.location.pathname;
        return EXCLUDED_PAGES.some(page => path.includes(page));
    }

    function isAdminUser() {
        try {
            const usuario = localStorage.getItem('usuarioLogado');
            if (!usuario) return false;
            const user = JSON.parse(usuario);
            return user.role === 'admin' || user.email === 'projectozerosatus@gmail.com';
        } catch(e) {
            return false;
        }
    }

    function checkMaintenance() {
        // Se já estiver na página de manutenção, não fazer nada
        if (window.location.pathname.includes('maintenance.html')) {
            return;
        }

        // Se for página excluída, não redirecionar
        if (isExcludedPage()) {
            console.log('[Maintenance Check] ⏭️ Página excluída, ignorando');
            return;
        }

        // Admin pode acessar mesmo em manutenção (se configurado)
        if (isAdminUser()) {
            const config = window.MAINTENANCE_CONFIG || {};
            if (config.settings?.allowAdminAccess !== false) {
                console.log('[Maintenance Check] 👑 Admin acessando, permitido');
                return;
            }
        }

        // Verificar se manutenção está ativa
        let maintenanceActive = false;

        // 1. Verificar config global
        if (window.MAINTENANCE_CONFIG && window.MAINTENANCE_CONFIG.enabled === true) {
            maintenanceActive = true;
        }

        // 2. Verificar localStorage (admin override)
        try {
            const override = localStorage.getItem('maintenance_override');
            if (override === 'true') {
                maintenanceActive = true;
            } else if (override === 'false') {
                maintenanceActive = false;
            }
        } catch(e) {}

        // 3. Verificar modo salvo
        try {
            const saved = localStorage.getItem('maintenance_mode');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.enabled === true) {
                    maintenanceActive = true;
                }
            }
        } catch(e) {}

        // Se manutenção ativa, redirecionar
        if (maintenanceActive) {
            console.log('[Maintenance Check] 🔴 Manutenção ativa, redirecionando...');
            
            const config = window.MAINTENANCE_CONFIG || {};
            const delay = config.settings?.redirectDelay || 1000;
            
            setTimeout(() => {
                window.location.href = 'maintenance.html';
            }, delay);
        } else {
            console.log('[Maintenance Check] 🟢 Sistema normal');
        }
    }

    // ⭐ EXECUTAR IMEDIATAMENTE
    checkMaintenance();

    // ⭐ TAMBÉM EXECUTAR QUANDO A PÁGINA GANHAR FOCO
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(checkMaintenance, 300);
        }
    });

    // ⭐ ESCUTAR MUDANÇAS NO LOCALSTORAGE (outras abas)
    window.addEventListener('storage', (e) => {
        if (e.key === 'maintenance_mode' || e.key === 'maintenance_override') {
            console.log('[Maintenance Check] 📡 Mudança detectada, verificando...');
            setTimeout(checkMaintenance, 200);
        }
    });

    console.log('[Maintenance Check] ✅ Verificador carregado');
})();