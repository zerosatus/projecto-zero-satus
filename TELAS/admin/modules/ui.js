// UI helpers e showToast
console.log('[UI] Inicializando helpers de UI...');

window.showToast = function(msg, isError = false) {
    console.log('[UI] showToast:', msg);
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = isError ? 'toast error' : 'toast';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
};

// Pequenos helpers reutilizáveis
window.formatDate = function(dateInput) {
    try {
        const d = new Date(dateInput);
        return d.toLocaleDateString('pt-BR');
    } catch (e) {
        return dateInput;
    }
};
console.log('[UI] ✅ ui.js carregado!');
