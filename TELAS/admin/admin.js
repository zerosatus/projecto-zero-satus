// admin.js - inicializador mínimo
console.log('[Admin] admin.js inicial (apenas inicializador)');

document.addEventListener('DOMContentLoaded', () => {
    // Apenas chamar verificarAdmin (exportado por modules/auth.js)
    if (typeof window.verificarAdmin === 'function') {
        window.verificarAdmin();
    } else {
        console.error('[Admin] ❌ verificarAdmin não encontrado. Verifique se modules/auth.js foi carregado.');
    }
});