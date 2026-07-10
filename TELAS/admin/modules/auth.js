// ==========================================
// auth.js - AUTENTICAÇÃO E VERIFICAÇÃO ADMIN
// ==========================================

console.log('[Auth] 🔐 Módulo de autenticação carregado');

// ==========================================
// VERIFICAR ADMIN
// ==========================================
async function verificarAdmin() {
    console.log('[Auth] 🔍 Verificando autenticação...');
    
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.error('[Auth] ❌ supabaseClient não encontrado');
        return;
    }

    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            console.error('[Auth] ❌ Erro ao buscar sessão:', sessionError);
            return;
        }

        if (!session) {
            console.log('[Auth] ❌ Sem sessão, redirecionando para login...');
            window.location.href = '../login/index.html';
            return;
        }

        const user = session.user;
        console.log('[Auth] 👤 Usuário logado:', user.email);

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role, nome')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[Auth] ❌ Erro ao buscar perfil:', profileError);
            await supabaseClient.auth.signOut();
            window.location.href = '../login/index.html';
            return;
        }

        if (!profile || profile.role !== 'admin') {
            console.log('[Auth] ❌ Acesso negado - não é admin');
            await supabaseClient.auth.signOut();
            window.location.href = '../login/index.html';
            return;
        }

        console.log('[Auth] ✅ Usuário é ADMIN');
        
        const adminPanel = document.getElementById('adminPanel');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminName = document.getElementById('adminNameDisplay');
        
        if (adminPanel) adminPanel.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (adminName) adminName.textContent = profile.nome || 'Administrador';

        // Carregar dados
        if (typeof loadDashboardStats === 'function') await loadDashboardStats();
        if (typeof loadUsers === 'function') await loadUsers();
        if (typeof loadPosts === 'function') await loadPosts();
        if (typeof loadComments === 'function') await loadComments();
        if (typeof loadNotifications === 'function') await loadNotifications();

    } catch (error) {
        console.error('[Auth] ❌ Erro na verificação:', error);
    }
}

// ==========================================
// LOGOUT
// ==========================================
window.logout = async function() {
    console.log('[Auth] 🔴 Fazendo logout...');
    
    const supabaseClient = window.supabaseClient;
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    
    localStorage.removeItem('usuarioLogado');
    window.location.href = '../login/index.html';
};

// ==========================================
// EXPORTAR FUNÇÕES
// ==========================================
window.verificarAdmin = verificarAdmin;

// ==========================================
// CONFIGURAR LOGOUT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('logoutBtn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.logout();
        });
    }
});

console.log('[Auth] ✅ auth.js carregado!');