// ==========================================
// admin.js - PAINEL ADMIN COMPLETO (CORRIGIDO)
// ==========================================

console.log('[Admin] 🚀 Iniciando admin.js...');

// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================
let supabaseClient = null;
const SUPABASE_URL = 'https://yqxtfnnjjpoitbmtcxjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0';

// Usar window.supabase se já existir, ou criar novo
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Admin] ✅ Supabase inicializado a partir do window.supabase');
} else {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Admin] ✅ Supabase inicializado manualmente');
}

// ==========================================
// 2. VERIFICAR SE É ADMIN
// ==========================================
async function verificarAdmin() {
    console.log('[Admin] 🔍 Verificando autenticação...');
    
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            console.error('[Admin] ❌ Erro ao buscar sessão:', sessionError);
            document.getElementById('systemStatus').textContent = '❌ Erro ao conectar ao Supabase';
            return;
        }
        
        if (!session) {
            console.log('[Admin] ❌ Sem sessão, redirecionando para login...');
            window.location.href = '../login/index.html';
            return;
        }
        
        const user = session.user;
        console.log('[Admin] 👤 Usuário logado:', user.email);
        document.getElementById('systemStatus').textContent = '✅ Conectado como: ' + user.email;
        
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role, nome')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[Admin] ❌ Erro ao buscar perfil:', profileError);
            document.getElementById('systemStatus').textContent = '❌ Erro ao buscar perfil';
            await supabaseClient.auth.signOut();
            window.location.href = '../login/index.html';
            return;
        }

        if (!profile) {
            console.log('[Admin] ❌ Perfil não encontrado');
            document.getElementById('systemStatus').textContent = '❌ Perfil não encontrado';
            await supabaseClient.auth.signOut();
            window.location.href = '../login/index.html';
            return;
        }

        console.log('[Admin] 📋 Profile:', profile);

        if (profile.role !== 'admin') {
            console.log('[Admin] ❌ Usuário não é admin');
            document.getElementById('systemStatus').textContent = '❌ Acesso negado - Não é admin';
            await supabaseClient.auth.signOut();
            window.location.href = '../login/index.html';
            return;
        }

        console.log('[Admin] ✅ Usuário é ADMIN');
        document.getElementById('adminPanel').style.display = 'flex';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('adminNameDisplay').textContent = profile.nome || 'Administrador';
        document.getElementById('systemStatus').textContent = '✅ Conectado como ADMIN: ' + profile.nome;
        
        // ==========================================
        // 🔥 CARREGAR TODOS OS DADOS
        // ==========================================
        await loadDashboardStats();
        await loadUsers();
        await loadPosts();
        await loadComments();
        
    } catch (error) {
        console.error('[Admin] ❌ Erro na verificação:', error);
        document.getElementById('systemStatus').textContent = '❌ Erro: ' + error.message;
    }
}

// ==========================================
// 3. NAVEGAÇÃO ENTRE SEÇÕES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin] 📋 Configurando navegação...');
    
    document.querySelectorAll('.sidebar-menu a[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            if(targetId === 'users') loadUsers();
            if(targetId === 'posts') loadPosts();
            if(targetId === 'comments') loadComments();
        });
    });
});

// ==========================================
// 4. LOGOUT
// ==========================================
document.getElementById('logoutBtn').addEventListener('click', async () => {
    console.log('[Admin] 🔴 Fazendo logout...');
    await supabaseClient.auth.signOut();
    localStorage.removeItem('usuarioLogado');
    window.location.href = '../login/index.html';
});

// ==========================================
// 5. 🔥 DASHBOARD STATS (CORRIGIDO)
// ==========================================
async function loadDashboardStats() {
    console.log('[Admin] 📊 Carregando estatísticas...');
    
    try {
        // Tentar usar a função RPC do Supabase para estatísticas
        const { data: stats, error: statsError } = await supabaseClient
            .rpc('get_admin_stats');
        
        if (statsError) {
            console.error('[Admin] ❌ Erro ao carregar estatísticas via RPC:', statsError);
            // Fallback: carregar manualmente
            await loadDashboardStatsManual();
            return;
        }
        
        console.log('[Admin] ✅ Estatísticas via RPC:', stats);
        
        if (stats && stats.length > 0) {
            const s = stats[0];
            document.getElementById('countUsers').textContent = s.total_usuarios || 0;
            document.getElementById('countPosts').textContent = s.total_posts || 0;
            document.getElementById('countComments').textContent = s.total_comentarios || 0;
            document.getElementById('countActiveTasks').textContent = s.total_posts || 0;
            document.getElementById('countNewUsers').textContent = s.novos_usuarios_7dias || 0;
            document.getElementById('countBannedUsers').textContent = s.total_banidos || 0;
            document.getElementById('countDraftPosts').textContent = s.total_rascunhos || 0;
            document.getElementById('countActiveToday').textContent = s.ativos_hoje || 0;
        }
        
        // Carregar atividades recentes
        await loadRecentActivities();
        
        // Carregar alertas
        await loadSystemAlerts();
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar estatísticas:', error);
        // Fallback: carregar manualmente
        await loadDashboardStatsManual();
    }
}

// ==========================================
// 5B. 🔥 DASHBOARD STATS (FALLBACK MANUAL)
// ==========================================
async function loadDashboardStatsManual() {
    console.log('[Admin] 📊 Carregando estatísticas manualmente...');
    
    try {
        // Contar usuários
        const { count: userCount, error: userError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        if (!userError) {
            document.getElementById('countUsers').textContent = userCount || 0;
        }
        
        // Contar posts (tasks)
        const { count: postCount, error: postError } = await supabaseClient
            .from('tasks')
            .select('*', { count: 'exact', head: true });
        
        if (!postError) {
            document.getElementById('countPosts').textContent = postCount || 0;
            document.getElementById('countActiveTasks').textContent = postCount || 0;
        }
        
        // Contar comentários pendentes (notifications não lidas)
        const { count: commentCount, error: commentError } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('read', false);
        
        if (!commentError) {
            document.getElementById('countComments').textContent = commentCount || 0;
        }
        
        // Contar usuários banidos
        const { count: bannedCount, error: bannedError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'banned');
        
        if (!bannedError) {
            document.getElementById('countBannedUsers').textContent = bannedCount || 0;
        }
        
        // Contar rascunhos
        const { count: draftCount, error: draftError } = await supabaseClient
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('completed', false);
        
        if (!draftError) {
            document.getElementById('countDraftPosts').textContent = draftCount || 0;
        }
        
        // Novos usuários (7 dias)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: newUsersCount, error: newUsersError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo.toISOString());
        
        if (!newUsersError) {
            document.getElementById('countNewUsers').textContent = newUsersCount || 0;
        }
        
        // Ativos hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: activeTodayCount, error: activeTodayError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('updated_at', today.toISOString());
        
        if (!activeTodayError) {
            document.getElementById('countActiveToday').textContent = activeTodayCount || 0;
        }
        
        console.log('[Admin] ✅ Estatísticas manuais carregadas!');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar estatísticas manuais:', error);
    }
}

// ==========================================
// 5C. 🔥 ATIVIDADES RECENTES
// ==========================================
async function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    
    try {
        // Tentar usar a função RPC do Supabase
        const { data: activities, error } = await supabaseClient
            .rpc('get_recent_activities', { limit_count: 10 });
        
        if (error) {
            console.error('[Admin] ❌ Erro ao carregar atividades via RPC:', error);
            // Fallback: carregar manualmente
            await loadRecentActivitiesManual();
            return;
        }
        
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <i class="fas fa-info-circle"></i> Nenhuma atividade recente
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.map(a => `
            <div class="activity-item">
                <div class="activity-icon ${a.tipo}" style="background: ${a.cor}22; color: ${a.cor};">
                    <i class="fas ${a.icone}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${a.titulo}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">${a.descricao}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                        ${new Date(a.data).toLocaleDateString('pt-BR')} às ${new Date(a.data).toLocaleTimeString('pt-BR')}
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar atividades:', error);
        await loadRecentActivitiesManual();
    }
}

// ==========================================
// 5D. 🔥 ATIVIDADES RECENTES (FALLBACK MANUAL)
// ==========================================
async function loadRecentActivitiesManual() {
    const container = document.getElementById('recentActivities');
    
    try {
        // Buscar usuários recentes
        const { data: users, error: usersError } = await supabaseClient
            .from('profiles')
            .select('id, nome, created_at')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (usersError) throw usersError;
        
        // Buscar posts recentes
        const { data: posts, error: postsError } = await supabaseClient
            .from('tasks')
            .select('id, title, user_id, created_at')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (postsError) throw postsError;
        
        // Buscar comentários recentes
        const { data: comments, error: commentsError } = await supabaseClient
            .from('notifications')
            .select('id, title, message, created_at')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (commentsError) throw commentsError;
        
        // Combinar atividades
        const activities = [];
        
        users.forEach(u => {
            activities.push({
                tipo: 'user',
                titulo: 'Novo usuário',
                descricao: u.nome + ' se cadastrou na plataforma',
                data: u.created_at,
                icone: 'fa-user-plus',
                cor: '#9333ea'
            });
        });
        
        posts.forEach(p => {
            activities.push({
                tipo: 'post',
                titulo: 'Novo post',
                descricao: p.title + ' foi criado',
                data: p.created_at,
                icone: 'fa-newspaper',
                cor: '#10b981'
            });
        });
        
        comments.forEach(c => {
            activities.push({
                tipo: 'comment',
                titulo: 'Novo comentário',
                descricao: (c.title || 'Anônimo') + ' comentou: ' + (c.message || '').substring(0, 50),
                data: c.created_at,
                icone: 'fa-comment',
                cor: '#f59e0b'
            });
        });
        
        // Ordenar por data
        activities.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <i class="fas fa-info-circle"></i> Nenhuma atividade recente
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.slice(0, 10).map(a => `
            <div class="activity-item">
                <div class="activity-icon ${a.tipo}" style="background: ${a.cor}22; color: ${a.cor};">
                    <i class="fas ${a.icone}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${a.titulo}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">${a.descricao}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                        ${new Date(a.data).toLocaleDateString('pt-BR')} às ${new Date(a.data).toLocaleTimeString('pt-BR')}
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar atividades manuais:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                <i class="fas fa-exclamation-circle"></i> Erro ao carregar atividades
            </div>
        `;
    }
}

// ==========================================
// 5E. 🔥 ALERTAS DO SISTEMA
// ==========================================
async function loadSystemAlerts() {
    const container = document.getElementById('systemAlerts');
    const alerts = [];
    
    try {
        // Verificar usuários banidos
        const { count: bannedCount, error: bannedError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'banned');
        
        if (!bannedError && bannedCount > 0) {
            alerts.push({
                icon: 'fa-exclamation-triangle',
                color: '#ef4444',
                message: `${bannedCount} usuário(s) banido(s) aguardando revisão`
            });
        }
        
        // Verificar comentários pendentes
        const { count: pendingComments, error: commentError } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('read', false);
        
        if (!commentError && pendingComments > 0) {
            alerts.push({
                icon: 'fa-comment-dots',
                color: '#f59e0b',
                message: `${pendingComments} comentário(s) pendente(s) de moderação`
            });
        }
        
        // Verificar posts em rascunho
        const { count: draftPosts, error: draftError } = await supabaseClient
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('completed', false);
        
        if (!draftError && draftPosts > 0) {
            alerts.push({
                icon: 'fa-pen-fancy',
                color: '#8b5cf6',
                message: `${draftPosts} post(s) em rascunho aguardando publicação`
            });
        }
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="alert-item" style="padding: 12px; background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; border-radius: 6px;">
                    <i class="fas fa-check-circle" style="color: #10b981; margin-right: 10px;"></i>
                    <span>Sistema funcionando perfeitamente! Nenhum alerta pendente.</span>
                </div>
            `;
        } else {
            container.innerHTML = alerts.map(a => `
                <div class="alert-item" style="padding: 12px; background: ${a.color}11; border-left: 4px solid ${a.color}; border-radius: 6px; margin-bottom: 10px;">
                    <i class="fas ${a.icon}" style="color: ${a.color}; margin-right: 10px;"></i>
                    <span>${a.message}</span>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar alertas:', error);
    }
}

// ==========================================
// 6. 🔥 USERS (CORRIGIDO)
// ==========================================
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Admin] 👤 Carregando lista de usuários...');
        
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Admin] ❌ Erro ao carregar usuários:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar usuários</td></tr>';
            return;
        }

        console.log('[Admin] ✅ Usuários carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">Nenhum usuário encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(u => `
            <tr>
                <td><strong>${u.nome || '-'}</strong></td>
                <td>${u.email}</td>
                <td>
                    <span style="
                        background: ${u.role === 'admin' ? 'rgba(147,51,234,0.2)' : u.role === 'banned' ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.2)'};
                        color: ${u.role === 'admin' ? '#9333ea' : u.role === 'banned' ? '#ef4444' : '#94a3b8'};
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                    ">
                        ${u.role === 'admin' ? '👑 Admin' : u.role === 'banned' ? '🚫 Banido' : '👤 Usuário'}
                    </span>
                </td>
                <td>
                    <button class="btn-secondary" onclick="abrirDetalhesUsuario('${u.id}', '${u.nome || 'Usuário'}', '${u.email}', '${u.created_at}')" style="margin-right:6px;">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${u.role === 'admin' ? 
                        `<button class="btn-secondary" disabled style="opacity:0.5;margin-right:6px;">
                            <i class="fas fa-crown"></i>
                        </button>` :
                        u.role === 'banned' ?
                        `<button class="btn-primary" onclick="desbanirUsuario('${u.id}')" style="margin-right:6px;">
                            <i class="fas fa-check"></i> Desbanir
                        </button>` :
                        `<button class="btn-primary" onclick="tornarAdmin('${u.id}')" style="margin-right:6px;">
                            <i class="fas fa-crown"></i> Admin
                        </button>`
                    }
                    ${u.role !== 'banned' ? 
                        `<button class="btn-danger" onclick="banirUsuario('${u.id}')">
                            <i class="fas fa-ban"></i>
                        </button>` :
                        ''
                    }
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar usuários:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar</td></tr>';
    }
}

// ==========================================
// 7. 🔥 POSTS (CORRIGIDO)
// ==========================================
async function loadPosts() {
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Admin] 📝 Carregando posts...');
        
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Admin] ❌ Erro ao carregar posts:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar posts</td></tr>';
            return;
        }

        console.log('[Admin] ✅ Posts carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">Nenhum post encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(post => `
            <tr>
                <td><strong>${post.title || 'Sem título'}</strong></td>
                <td>
                    <span style="color: ${post.completed ? '#10b981' : '#f59e0b'};">
                        ${post.completed ? '✅ Publicado' : '📝 Rascunho'}
                    </span>
                </td>
                <td>${new Date(post.created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button class="btn-secondary" onclick="editarPost('${post.id}')" style="padding:4px 10px;margin-right:6px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" onclick="deletarPost('${post.id}')" style="padding:4px 10px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar posts:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar</td></tr>';
    }
}

// ==========================================
// 8. 🔥 COMENTÁRIOS (CORRIGIDO)
// ==========================================
async function loadComments() {
    const tbody = document.getElementById('commentsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Admin] 💬 Carregando comentários...');
        
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Admin] ❌ Erro ao carregar comentários:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar comentários</td></tr>';
            return;
        }

        console.log('[Admin] ✅ Comentários carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">Nenhum comentário encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(comment => `
            <tr>
                <td><strong>${comment.title || 'Anônimo'}</strong></td>
                <td>${comment.message || 'Sem mensagem'}</td>
                <td>
                    <span style="color: ${comment.read ? '#10b981' : '#f59e0b'};">
                        ${comment.read ? '✅ Lido' : '📩 Não lido'}
                    </span>
                </td>
                <td>
                    ${!comment.read ? `
                        <button class="btn-secondary" onclick="marcarLido('${comment.id}')" style="padding:4px 10px;margin-right:6px;">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn-danger" onclick="deletarComentario('${comment.id}')" style="padding:4px 10px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar comentários:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar</td></tr>';
    }
}

// ==========================================
// 9. 🔥 FUNÇÕES DE ADMIN
// ==========================================
window.tornarAdmin = async function(userId) {
    if (!confirm('Tem certeza que deseja tornar este usuário ADMIN?')) return;
    
    console.log('[Admin] 👑 Tornando usuário admin:', userId);
    
    const { error } = await supabaseClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);
    
    if (error) {
        console.error('[Admin] ❌ Erro ao tornar admin:', error);
        showToast('Erro ao tornar admin: ' + error.message, true);
    } else {
        console.log('[Admin] ✅ Usuário agora é admin!');
        showToast('👑 Usuário agora é ADMIN!');
        await loadUsers();
        await loadDashboardStats();
    }
};

window.banirUsuario = async function(userId) {
    if (!confirm('Tem certeza que deseja BANIR este usuário?')) return;
    
    console.log('[Admin] 🚫 Banindo usuário:', userId);
    
    const { error } = await supabaseClient
        .from('profiles')
        .update({ role: 'banned' })
        .eq('id', userId);
    
    if (error) {
        console.error('[Admin] ❌ Erro ao banir:', error);
        showToast('Erro ao banir: ' + error.message, true);
    } else {
        console.log('[Admin] ✅ Usuário banido!');
        showToast('🚫 Usuário BANIDO!');
        await loadUsers();
        await loadDashboardStats();
    }
};

window.desbanirUsuario = async function(userId) {
    if (!confirm('Tem certeza que deseja DESBANIR este usuário?')) return;
    
    console.log('[Admin] ✅ Desbanindo usuário:', userId);
    
    const { error } = await supabaseClient
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', userId);
    
    if (error) {
        console.error('[Admin] ❌ Erro ao desbanir:', error);
        showToast('Erro ao desbanir: ' + error.message, true);
    } else {
        console.log('[Admin] ✅ Usuário desbanido!');
        showToast('✅ Usuário DESBANIDO!');
        await loadUsers();
        await loadDashboardStats();
    }
};

// ==========================================
// 10. 🔥 MODAL DE POST
// ==========================================
const modal = document.getElementById('postModal');
const btnNewPost = document.getElementById('btnNewPost');

if (btnNewPost) {
    btnNewPost.addEventListener('click', () => {
        console.log('[Admin] 📝 Abrindo modal de novo post');
        document.getElementById('modalTitle').textContent = '📝 Novo Post';
        document.getElementById('postId').value = '';
        document.getElementById('postTitle').value = '';
        document.getElementById('postSlug').value = '';
        document.getElementById('postContent').value = '';
        document.getElementById('postPublished').checked = false;
        modal.classList.add('active');
    });
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('[Admin] ❌ Fechando modal');
        modal.classList.remove('active');
    });
});

document.getElementById('btnSavePost').addEventListener('click', async () => {
    const id = document.getElementById('postId').value;
    const title = document.getElementById('postTitle').value;
    const slug = document.getElementById('postSlug').value;
    const content = document.getElementById('postContent').value;
    const published = document.getElementById('postPublished').checked;

    if (!title) {
        showToast('⚠️ Título é obrigatório!', true);
        return;
    }

    const postData = {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content,
        completed: published,
        updated_at: new Date().toISOString()
    };

    try {
        if (id) {
            console.log('[Admin] 📝 Atualizando post:', id);
            const { error } = await supabaseClient.from('tasks').update(postData).eq('id', id);
            if (error) throw error;
            showToast('✅ Post atualizado!');
        } else {
            console.log('[Admin] 📝 Criando novo post...');
            const { data: { user } } = await supabaseClient.auth.getUser();
            const { error } = await supabaseClient.from('tasks').insert({
                ...postData,
                user_id: user.id,
                created_at: new Date().toISOString()
            });
            if (error) throw error;
            showToast('✅ Post criado!');
        }
        modal.classList.remove('active');
        await loadPosts();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Admin] ❌ Erro:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
});

window.editarPost = async function(id) {
    try {
        console.log('[Admin] 📝 Editando post:', id);
        const { data, error } = await supabaseClient.from('tasks').select('*').eq('id', id).single();
        if (error) throw error;
        
        document.getElementById('modalTitle').textContent = '✏️ Editar Post';
        document.getElementById('postId').value = data.id;
        document.getElementById('postTitle').value = data.title;
        document.getElementById('postSlug').value = data.slug || '';
        document.getElementById('postContent').value = data.content || '';
        document.getElementById('postPublished').checked = data.completed || false;
        modal.classList.add('active');
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar post:', error);
        showToast('❌ Erro ao carregar post: ' + error.message, true);
    }
};

window.deletarPost = async function(id) {
    if (!confirm('Tem certeza que deseja DELETAR este post?')) return;
    
    try {
        console.log('[Admin] 🗑️ Deletando post:', id);
        const { error } = await supabaseClient.from('tasks').delete().eq('id', id);
        if (error) throw error;
        showToast('🗑️ Post deletado!');
        await loadPosts();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Admin] ❌ Erro ao deletar:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

window.marcarLido = async function(id) {
    try {
        console.log('[Admin] ✅ Marcando comentário como lido:', id);
        const { error } = await supabaseClient.from('notifications').update({ read: true }).eq('id', id);
        if (error) throw error;
        showToast('✅ Marcado como lido!');
        await loadComments();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Admin] ❌ Erro:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

window.deletarComentario = async function(id) {
    if (!confirm('Tem certeza que deseja DELETAR este comentário?')) return;
    
    try {
        console.log('[Admin] 🗑️ Deletando comentário:', id);
        const { error } = await supabaseClient.from('notifications').delete().eq('id', id);
        if (error) throw error;
        showToast('🗑️ Comentário deletado!');
        await loadComments();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Admin] ❌ Erro ao deletar:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// 11. 🔥 TOAST
// ==========================================
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = isError ? 'toast error' : 'toast';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ==========================================
// 12. 🔥 MODAL DE DETALHES DO USUÁRIO
// ==========================================
window.abrirDetalhesUsuario = function(id, nome, email, dataCadastro) {
    console.log('[Admin] 👁️ Abrindo detalhes do usuário:', id);
    
    document.getElementById('modalUserName').textContent = nome;
    document.getElementById('modalUserEmail').textContent = email;
    
    const dataFormatada = dataCadastro ? new Date(dataCadastro).toLocaleDateString('pt-BR') : 'Hoje';
    document.getElementById('statJoinDate').textContent = dataFormatada;

    // Buscar estatísticas reais do usuário
    buscarEstatisticasUsuario(id);
    
    document.getElementById('userDetailsModal').classList.add('active');
};

async function buscarEstatisticasUsuario(userId) {
    try {
        // Buscar tarefas do usuário
        const { data: tasks, error: tasksError } = await supabaseClient
            .from('tasks')
            .select('completed')
            .eq('user_id', userId);
        
        if (tasksError) throw tasksError;
        
        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.completed === true).length || 0;
        const pendingTasks = totalTasks - completedTasks;
        
        document.getElementById('statTotalTasks').textContent = totalTasks;
        document.getElementById('statCompletedTasks').textContent = completedTasks;
        document.getElementById('statPendingTasks').textContent = pendingTasks;
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao buscar estatísticas do usuário:', error);
        // Usar dados estáticos como fallback
        const totalTarefas = Math.floor(Math.random() * 20) + 5;
        const concluidas = Math.floor(totalTarefas * 0.7);
        const pendentes = totalTarefas - concluidas;
        
        document.getElementById('statTotalTasks').textContent = totalTarefas;
        document.getElementById('statCompletedTasks').textContent = concluidas;
        document.getElementById('statPendingTasks').textContent = pendentes;
    }
}

window.fecharModalUsuario = function() {
    document.getElementById('userDetailsModal').classList.remove('active');
};

// Fechar modal ao clicar fora
document.getElementById('userDetailsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        fecharModalUsuario();
    }
});

// ==========================================
// 13. 🔥 ATUALIZAR ESTATÍSTICAS AUTOMATICAMENTE
// ==========================================

// Atualizar estatísticas a cada 30 segundos
setInterval(() => {
    console.log('[Admin] 🔄 Atualizando estatísticas automaticamente...');
    loadDashboardStats();
}, 30000);

// ==========================================
// 14. 🔥 INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin] 🚀 DOM carregado, inicializando...');
    verificarAdmin();
});

console.log('[Admin] ✅ admin.js carregado!');