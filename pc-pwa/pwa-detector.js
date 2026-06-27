// pc-pwa/pwa-detector.js
// Detector de instalação PWA - APENAS PC

const PwaDetector = {
    /**
     * Verifica se o app está instalado como PWA no PC
     * @returns {boolean} true se instalado, false caso contrário
     */
    isPwaInstalled() {
        // 🔥 VERIFICAÇÃO PRINCIPAL - Display Mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('[PWA] ✅ App instalado (standalone mode)');
            return true;
        }

        // 🔥 VERIFICAÇÃO PARA WINDOWS - Chrome/Edge PWA
        if (window.navigator.standalone === true) {
            console.log('[PWA] ✅ App instalado (navigator.standalone)');
            return true;
        }

        // 🔥 VERIFICAÇÃO PARA WINDOWS - Electron/PWA
        if (window.navigator.userAgent.includes('PWA') || 
            window.navigator.userAgent.includes('WebApp')) {
            console.log('[PWA] ✅ App instalado (UserAgent)');
            return true;
        }

        // 🔥 VERIFICAÇÃO - URL do manifest (se carregou via PWA)
        if (document.referrer.includes('manifest.json') ||
            document.querySelector('link[rel="manifest"]')?.getAttribute('href') === '/manifest.json') {
            console.log('[PWA] ✅ App instalado (manifest referrer)');
            return true;
        }

        // 🔥 VERIFICAÇÃO - Session Storage (definido na instalação)
        if (sessionStorage.getItem('pwa_installed') === 'true') {
            console.log('[PWA] ✅ App instalado (sessionStorage)');
            return true;
        }

        console.log('[PWA] ❌ App NÃO instalado (modo navegador)');
        return false;
    },

    /**
     * Verifica se o dispositivo é um PC (desktop)
     * @returns {boolean} true se for PC
     */
    isDesktop() {
        const ua = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
        return !isMobile && !isTablet;
    },

    /**
     * Verifica se o app pode usar funcionalidades PWA
     * @returns {boolean} true se PWA instalado no PC
     */
    canUsePwaFeatures() {
        return this.isDesktop() && this.isPwaInstalled();
    },

    /**
     * Obtém informações do ambiente PWA
     * @returns {object} informações do ambiente
     */
    getEnvironmentInfo() {
        return {
            isPwaInstalled: this.isPwaInstalled(),
            isDesktop: this.isDesktop(),
            canUsePwaFeatures: this.canUsePwaFeatures(),
            displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
    }
};

// 🔥 EXPORTA GLOBALMENTE
window.PwaDetector = PwaDetector;

// 🔥 LISTENER PARA MUDANÇAS DE DISPLAY MODE
window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
    if (evt.matches) {
        console.log('[PWA] App entrou em modo standalone (instalado)');
        sessionStorage.setItem('pwa_installed', 'true');
        window.dispatchEvent(new CustomEvent('pwaInstalled'));
    } else {
        console.log('[PWA] App saiu do modo standalone');
        sessionStorage.removeItem('pwa_installed');
        window.dispatchEvent(new CustomEvent('pwaUninstalled'));
    }
});

console.log('🖥️ PwaDetector carregado - APENAS PC');