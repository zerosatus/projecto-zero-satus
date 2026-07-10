// ==========================================
// ui.js - HELPERS DE INTERFACE
// ==========================================

console.log('[UI] 🎨 Inicializando helpers de UI...');

// ==========================================
// TOAST - NOTIFICAÇÕES VISUAIS
// ==========================================
window.showToast = function(msg, isError = false) {
    console.log('[UI] 📢 Toast:', msg);
    
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('[UI] ⚠️ Elemento #toast não encontrado');
        // Fallback: alert se não tiver toast
        if (isError) {
            alert('❌ ' + msg);
        } else {
            console.log('✅ ' + msg);
        }
        return;
    }
    
    toast.textContent = msg;
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.style.display = 'block';
    toast.style.opacity = '1';
    
    // Limpar timeout anterior
    if (window._toastTimeout) {
        clearTimeout(window._toastTimeout);
    }
    
    window._toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 3500);
};

// ==========================================
// FORMATAR DATA
// ==========================================
window.formatDate = function(dateInput) {
    if (!dateInput) return '-';
    
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return dateInput;
        return d.toLocaleDateString('pt-BR');
    } catch (e) {
        return dateInput;
    }
};

// ==========================================
// FORMATAR DATA E HORA
// ==========================================
window.formatDateTime = function(dateInput) {
    if (!dateInput) return '-';
    
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return dateInput;
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (e) {
        return dateInput;
    }
};

// ==========================================
// FORMATAR TEMPO RELATIVO
// ==========================================
window.formatRelativeTime = function(dateInput) {
    if (!dateInput) return 'Data desconhecida';
    
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return dateInput;
        
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
        return dateInput;
    }
};

// ==========================================
// VALIDAR EMAIL
// ==========================================
window.isValidEmail = function(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// ==========================================
// GERAR SLUG
// ==========================================
window.generateSlug = function(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// ==========================================
// TRUNCAR TEXTO
// ==========================================
window.truncateText = function(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// ==========================================
// ESCAPAR HTML
// ==========================================
window.escapeHtml = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// ==========================================
// COPIAR PARA ÁREA DE TRANSFERÊNCIA
// ==========================================
window.copyToClipboard = function(text) {
    if (!text) return false;
    
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                window.showToast('✅ Copiado para área de transferência!');
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
        return true;
    } catch (e) {
        console.error('[UI] ❌ Erro ao copiar:', e);
        return false;
    }
};

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        window.showToast('✅ Copiado para área de transferência!');
    } catch (e) {
        window.showToast('❌ Erro ao copiar', true);
    }
    document.body.removeChild(textarea);
};

// ==========================================
// DETECTAR DISPOSITIVO MÓVEL
// ==========================================
window.isMobile = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth <= 768;
};

// ==========================================
// CARREGAR IMAGEM COM FALLBACK
// ==========================================
window.loadImageWithFallback = function(imgElement, fallbackSrc) {
    if (!imgElement) return;
    
    const originalSrc = imgElement.src;
    imgElement.onerror = function() {
        if (fallbackSrc) {
            imgElement.src = fallbackSrc;
        } else {
            imgElement.style.display = 'none';
        }
    };
};

// ==========================================
// SCROLL PARA ELEMENTO
// ==========================================
window.scrollToElement = function(elementId, offset = 0) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetPosition = rect.top + scrollTop - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
};

// ==========================================
// CONFIGURAR FECHAMENTO DE MODAIS
// ==========================================
window.setupModalClose = function(modalId, closeSelector = '.close-modal') {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Fechar com botão X
    const closeBtns = modal.querySelectorAll(closeSelector);
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });
    
    // Fechar clicando fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            modal.classList.remove('active');
        }
    });
};

// ==========================================
// INICIALIZAR UI
// ==========================================
function initUI() {
    console.log('[UI] 🔧 Configurando UI...');
    
    // Configurar fechamento de modais
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        const modalId = modal.id;
        if (modalId) {
            window.setupModalClose(modalId);
        }
    });
    
    console.log('[UI] ✅ UI configurada!');
}

// Inicializar quando o DOM carregar
if (document.readyState === 'complete') {
    initUI();
} else {
    document.addEventListener('DOMContentLoaded', initUI);
}

// ==========================================
// EXPORTAR FUNÇÕES
// ==========================================
console.log('[UI] ✅ ui.js completamente carregado!');
console.log('[UI] 📌 Funções disponíveis:');
console.log('   - showToast(msg, isError)');
console.log('   - formatDate(date)');
console.log('   - formatDateTime(date)');
console.log('   - formatRelativeTime(date)');
console.log('   - isValidEmail(email)');
console.log('   - generateSlug(text)');
console.log('   - truncateText(text, maxLength)');
console.log('   - escapeHtml(text)');
console.log('   - copyToClipboard(text)');
console.log('   - isMobile()');
console.log('   - scrollToElement(elementId, offset)');
console.log('   - setupModalClose(modalId, closeSelector)');