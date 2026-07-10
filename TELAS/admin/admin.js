// ==========================================
// admin.js - INICIALIZAÇÃO DO PAINEL ADMIN
// ==========================================

console.log('[Admin] 🚀 Iniciando admin.js...');

// ==========================================
// VARIÁVEL GLOBAL PARA CONTROLAR INICIALIZAÇÃO
// ==========================================
let adminInicializado = false;

// ==========================================
// FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
// ==========================================
async function inicializarAdmin() {
    if (adminInicializado) {
        console.log('[Admin] ⏳ Admin já inicializado');
        return;
    }

    console.log('[Admin] 📋 Inicializando painel admin...');

    try {
        // 1. Verificar autenticação
        if (typeof window.verificarAdmin === 'function') {
            await window.verificarAdmin();
        } else {
            console.error('[Admin] ❌ verificarAdmin não encontrado');
            mostrarErro('Erro ao carregar módulo de autenticação');
            return;
        }

        // 2. Configurar navegação (já é feito pelo navigation.js)
        // 3. Carregar dados iniciais
        await carregarDadosIniciais();

        adminInicializado = true;
        console.log('[Admin] ✅ Admin inicializado com sucesso!');

    } catch (error) {
        console.error('[Admin] ❌ Erro ao inicializar:', error);
        mostrarErro('Erro ao inicializar painel admin: ' + error.message);
    }
}

// ==========================================
// CARREGAR DADOS INICIAIS
// ==========================================
async function carregarDadosIniciais() {
    console.log('[Admin] 📊 Carregando dados iniciais...');

    // Dashboard
    if (typeof loadDashboardStats === 'function') {
        try {
            await loadDashboardStats();
            console.log('[Admin] ✅ Dashboard carregado');
        } catch (e) {
            console.warn('[Admin] ⚠️ Erro ao carregar dashboard:', e);
        }
    }

    // Usuários
    if (typeof loadUsers === 'function') {
        try {
            await loadUsers();
            console.log('[Admin] ✅ Usuários carregados');
        } catch (e) {
            console.warn('[Admin] ⚠️ Erro ao carregar usuários:', e);
        }
    }

    // Posts
    if (typeof loadPosts === 'function') {
        try {
            await loadPosts();
            console.log('[Admin] ✅ Posts carregados');
        } catch (e) {
            console.warn('[Admin] ⚠️ Erro ao carregar posts:', e);
        }
    }

    // Comentários
    if (typeof loadComments === 'function') {
        try {
            await loadComments();
            console.log('[Admin] ✅ Comentários carregados');
        } catch (e) {
            console.warn('[Admin] ⚠️ Erro ao carregar comentários:', e);
        }
    }

    // Notificações (apenas se a seção estiver visível)
    if (typeof loadNotifications === 'function') {
        try {
            await loadNotifications();
            console.log('[Admin] ✅ Notificações carregadas');
        } catch (e) {
            console.warn('[Admin] ⚠️ Erro ao carregar notificações:', e);
        }
    }

    // Logs
    if (typeof loadAuditLogs === 'function') {
        try {
            await loadAuditLogs();
            console.log('[Admin] ✅ Logs carregados');
        } catch (e) {
            console.warn('[Admin] ⚠️ Erro ao carregar logs:', e);
        }
    }

    // Relatórios
    if (typeof loadReports === 'function') {
        try {
            await loadReports();
            console.log('[Admin] ✅ Relatórios carregados');
        } catch (e) {
            console.warn('[Admin] ⚠️ Erro ao carregar relatórios:', e);
        }
    }

    // Atualizar status do sistema
    atualizarStatusSistema();

    console.log('[Admin] ✅ Todos os dados iniciais carregados!');
}

// ==========================================
// ATUALIZAR STATUS DO SISTEMA
// ==========================================
function atualizarStatusSistema() {
    const statusEl = document.getElementById('lastSyncStatus');
    if (statusEl) {
        const agora = new Date();
        statusEl.textContent = `Última sincronização: ${agora.toLocaleTimeString('pt-BR')}`;
    }
}

// ==========================================
// MOSTRAR ERRO NA INTERFACE
// ==========================================
function mostrarErro(mensagem) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = '❌ ' + mensagem;
        toast.className = 'toast error';
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    } else {
        alert('❌ ' + mensagem);
    }
}

// ==========================================
// FUNÇÃO PARA RECARREGAR TODOS OS DADOS
// ==========================================
window.recarregarTodosDados = async function() {
    console.log('[Admin] 🔄 Recarregando todos os dados...');
    
    const btn = document.querySelector('[onclick="recarregarTodosDados()"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recarregando...';
    }

    try {
        await carregarDadosIniciais();
        if (typeof showToast === 'function') {
            showToast('✅ Todos os dados foram recarregados!');
        }
    } catch (error) {
        console.error('[Admin] ❌ Erro ao recarregar:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erro ao recarregar dados: ' + error.message, true);
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync"></i> Recarregar Tudo';
        }
    }
};

// ==========================================
// FUNÇÃO PARA LOGOUT
// ==========================================
window.logoutAdmin = async function() {
    console.log('[Admin] 🔴 Realizando logout...');
    
    if (!confirm('Tem certeza que deseja sair?')) return;

    try {
        const supabaseClient = window.supabaseClient;
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }

        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('userPhotoURL');

        if (window.CacheManager) {
            window.CacheManager.logout();
        }

        adminInicializado = false;
        window.location.href = '../login/index.html';

    } catch (error) {
        console.error('[Admin] ❌ Erro no logout:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erro ao sair: ' + error.message, true);
        }
    }
};

// ==========================================
// CONFIGURAR BOTÃO DE LOGOUT
// ==========================================
function configurarLogout() {
    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        // Remover listeners antigos para evitar duplicação
        const novoBtn = btnLogout.cloneNode(true);
        btnLogout.parentNode.replaceChild(novoBtn, btnLogout);
        
        novoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.logoutAdmin();
        });
        console.log('[Admin] ✅ Botão de logout configurado');
    }
}

// ==========================================
// CONFIGURAR BOTÃO DE RECARREGAR (opcional)
// ==========================================
function configurarBotaoRecarregar() {
    // Verificar se já existe um botão de recarregar
    let btnRecarregar = document.getElementById('btnRecarregarDados');
    
    if (!btnRecarregar) {
        // Criar botão se não existir
        const header = document.querySelector('.section-header');
        if (header) {
            btnRecarregar = document.createElement('button');
            btnRecarregar.id = 'btnRecarregarDados';
            btnRecarregar.className = 'btn-secondary';
            btnRecarregar.innerHTML = '<i class="fas fa-sync"></i> Recarregar Tudo';
            btnRecarregar.onclick = window.recarregarTodosDados;
            header.appendChild(btnRecarregar);
            console.log('[Admin] ✅ Botão de recarregar criado');
        }
    }
}

// ==========================================
// CONFIGURAR TELEMETRIA (opcional)
// ==========================================
function configurarTelemetria() {
    // Verificar conexão com Supabase
    setInterval(() => {
        const supabaseClient = window.supabaseClient;
        const statusEl = document.getElementById('lastSyncStatus');
        
        if (statusEl) {
            if (supabaseClient) {
                statusEl.textContent = `✅ Conectado • ${new Date().toLocaleTimeString('pt-BR')}`;
                statusEl.style.color = '#10b981';
            } else {
                statusEl.textContent = '❌ Desconectado';
                statusEl.style.color = '#ef4444';
            }
        }
    }, 30000); // Atualizar a cada 30 segundos
}

// ==========================================
// INICIALIZAR QUANDO O DOM ESTIVER PRONTO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin] 📋 DOM carregado, preparando inicialização...');

    // Configurar botão de logout
    configurarLogout();

    // Configurar botão de recarregar
    setTimeout(configurarBotaoRecarregar, 500);

    // Configurar telemetria
    configurarTelemetria();

    // Inicializar admin após um pequeno delay para garantir que todos os módulos carregaram
    setTimeout(() => {
        inicializarAdmin();
    }, 300);
});

// ==========================================
// RECARREGAR QUANDO A PÁGINA VOLTAR A TER FOCO
// ==========================================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && adminInicializado) {
        console.log('[Admin] 🔄 Página voltou ao foco, recarregando dados...');
        setTimeout(() => {
            carregarDadosIniciais();
        }, 500);
    }
});

// ==========================================
// EXPORTA FUNÇÕES GLOBAIS
// ==========================================
window.inicializarAdmin = inicializarAdmin;
window.carregarDadosIniciais = carregarDadosIniciais;
window.atualizarStatusSistema = atualizarStatusSistema;
window.mostrarErro = mostrarErro;

console.log('[Admin] ✅ admin.js completamente carregado!');
console.log('[Admin] 📌 Funções disponíveis:');
console.log('   - inicializarAdmin()');
console.log('   - carregarDadosIniciais()');
console.log('   - recarregarTodosDados()');
console.log('   - logoutAdmin()');