// Auth: verificarAdmin + logout
console.log('[Auth] Módulo de autenticação carregado');

async function verificarAdmin() {
    console.log('[Auth] 🔍 Verificando autenticação...');
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.error('[Auth] ❌ supabaseClient não encontrado');
        document.getElementById('systemStatus').textContent = '❌ Supabase não inicializado';
        return;
    }

    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) {
            console.error('[Auth] ❌ Erro ao buscar sessão:', sessionError);
            document.getElementById('systemStatus').textContent = '❌ Erro ao conectar ao Supabase';
            return;
        }

        if (!session) {
            console.log('[Auth] ❌ Sem sessão, redirecionando para login...');
            window.location.href = '../login/index.html';
            return;
        }

        const user = session.user;
        console.log('[Auth] 👤 Usuário logado:', user.email);
        document.getElementById('systemStatus').textContent = '✅ Conectado como: ' + user.email;

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role, nome')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[Auth] ❌ Erro ao buscar perfil:', profileError);
            document.getElementById('systemStatus').textContent = '❌ Erro ao buscar perfil';
            await supabaseClient.auth.signOut();
            window.location.href = '../login/index.html';
            return;
        }

        if (!profile || profile.role !== 'admin') {
            console.log('[Auth] ❌ Acesso negado - não é admin');
            document.getElementById('systemStatus').textContent = '❌ Acesso negado - Não é admin';
            await supabaseClient.auth.signOut();
            window.location.href = '../login/index.html';
            return;
        }

        console.log('[Auth] ✅ Usuário é ADMIN');
        document.getElementById('adminPanel').style.display = 'flex';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('adminNameDisplay').textContent = profile.nome || 'Administrador';
        document.getElementById('systemStatus').textContent = '✅ Conectado como ADMIN: ' + profile.nome;

        // Carregar dados principais (se as funções existirem)
        if (typeof loadDashboardStats === 'function') await loadDashboardStats();
        if (typeof loadUsers === 'function') await loadUsers();
        if (typeof loadPosts === 'function') await loadPosts();
        if (typeof loadComments === 'function') await loadComments();

    } catch (error) {
        console.error('[Auth] ❌ Erro na verificação:', error);
        document.getElementById('systemStatus').textContent = '❌ Erro: ' + (error.message || error);
    }
}

window.verificarAdmin = verificarAdmin;

window.logout = async function() {
    console.log('[Auth] 🔴 Fazendo logout...');
    const supabaseClient = window.supabaseClient;
    if (supabaseClient) await supabaseClient.auth.signOut();
    localStorage.removeItem('usuarioLogado');
    window.location.href = '../login/index.html';
};

// Event listeners próprios do módulo
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
