// Dashboard stats
console.log('[Dashboard] Módulo de estatísticas carregado');
async function loadDashboardStats() {
    console.log('[Dashboard] 📊 Carregando estatísticas...');
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.error('[Dashboard] ❌ supabaseClient não encontrado');
        return;
    }

    try {
        const { count: userCount, error: userError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (userError) {
            console.error('[Dashboard] ❌ Erro ao contar usuários:', userError);
            document.getElementById('countUsers').textContent = '❌';
        } else {
            console.log('[Dashboard] ✅ Usuários:', userCount);
            document.getElementById('countUsers').textContent = userCount || 0;
        }

        const { count: postCount, error: postError } = await supabaseClient
            .from('tasks')
            .select('*', { count: 'exact', head: true });

        if (postError) {
            console.error('[Dashboard] ❌ Erro ao contar posts:', postError);
            document.getElementById('countPosts').textContent = '❌';
        } else {
            console.log('[Dashboard] ✅ Posts:', postCount);
            document.getElementById('countPosts').textContent = postCount || 0;
        }

        const { count: commentCount, error: commentError } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true });

        if (commentError) {
            console.error('[Dashboard] ❌ Erro ao contar comentários:', commentError);
            document.getElementById('countComments').textContent = '❌';
        } else {
            console.log('[Dashboard] ✅ Comentários:', commentCount);
            document.getElementById('countComments').textContent = commentCount || 0;
        }

        console.log('[Dashboard] 📊 Estatísticas carregadas!');
    } catch (error) {
        console.error('[Dashboard] ❌ Erro ao carregar estatísticas:', error);
        document.getElementById('countUsers').textContent = '❌';
        document.getElementById('countPosts').textContent = '❌';
        document.getElementById('countComments').textContent = '❌';
    }
}
// ==========================================
// dashboard.js - CARREGAMENTO DE ESTATÍSTICAS
// ==========================================

console.log('[Dashboard] 📊 Carregando dashboard...');

// ==========================================
// DASHBOARD STATS
// ==========================================
async function loadDashboardStats() {
    console.log('[Dashboard] 📊 Carregando estatísticas...');
    
    try {
        // Contar usuários
        const { count: userCount, error: userError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        if (userError) {
            console.error('[Dashboard] ❌ Erro ao contar usuários:', userError);
            document.getElementById('countUsers').textContent = '❌';
        } else {
            console.log('[Dashboard] ✅ Usuários:', userCount);
            document.getElementById('countUsers').textContent = userCount || 0;
        }

        // Contar posts (tasks)
        const { count: postCount, error: postError } = await supabaseClient
            .from('tasks')
            .select('*', { count: 'exact', head: true });
        
        if (postError) {
            console.error('[Dashboard] ❌ Erro ao contar posts:', postError);
            document.getElementById('countPosts').textContent = '❌';
        } else {
            console.log('[Dashboard] ✅ Posts:', postCount);
            document.getElementById('countPosts').textContent = postCount || 0;
        }

        // Contar comentários (notifications)
        const { count: commentCount, error: commentError } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true });
        
        if (commentError) {
            console.error('[Dashboard] ❌ Erro ao contar comentários:', commentError);
            document.getElementById('countComments').textContent = '❌';
        } else {
            console.log('[Dashboard] ✅ Comentários:', commentCount);
            document.getElementById('countComments').textContent = commentCount || 0;
        }

        console.log('[Dashboard] 📊 Estatísticas carregadas!');
        
    } catch (error) {
        console.error('[Dashboard] ❌ Erro ao carregar estatísticas:', error);
        document.getElementById('countUsers').textContent = '❌';
        document.getElementById('countPosts').textContent = '❌';
        document.getElementById('countComments').textContent = '❌';
    }
}

console.log('[Dashboard] ✅ dashboard.js carregado!');
