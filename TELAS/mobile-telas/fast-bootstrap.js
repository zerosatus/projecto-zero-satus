// fast-bootstrap.js - Bootstrap ultrarrápido para páginas
(function() {
    // Cache de componentes já carregados
    const loadedComponents = new Set();
    
    window.fastInit = async function(pageName, callbacks) {
        console.log(`[${pageName}] 🚀 Inicialização rápida...`);
        const startTime = performance.now();
        
        // 1. Verificar login (rápido)
        const usuario = localStorage.getItem('usuarioLogado');
        if (!usuario) {
            window.location.href = '../login/index.html';
            return false;
        }
        
        // 2. Aguardar pré-carregamento (já em background)
        if (window.PreloadSystem && !window.PreloadSystem.isReady()) {
            await window.PreloadSystem.preloadAllData();
        }
        
        // 3. Usar CacheManager já inicializado
        if (window.CacheManager && !window.CacheManager.isInitialized) {
            window.CacheManager.init();
        }
        
        // 4. Executar callbacks da página
        if (callbacks.onInit) await callbacks.onInit();
        if (callbacks.onRender) callbacks.onRender();
        
        const endTime = performance.now();
        console.log(`[${pageName}] ✅ Pronto em ${(endTime - startTime).toFixed(0)}ms`);
        
        return true;
    };
    
    // Função para carregar dados instantâneos do cache
    window.getFastData = function(type, defaultValue = null) {
        // Prioridade: PreloadSystem > CacheManager > localStorage
        if (window.PreloadSystem && window.PreloadSystem.isReady()) {
            const cached = window.PreloadSystem.getCachedData(type);
            if (cached !== null) return cached;
        }
        
        if (window.CacheManager) {
            return window.CacheManager.get(type, defaultValue);
        }
        
        return defaultValue;
    };
    
    console.log('[FastBootstrap] Sistema de bootstrap rápido ativado');
})();