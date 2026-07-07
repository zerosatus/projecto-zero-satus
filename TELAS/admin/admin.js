// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://yqxtfnnjjpoitbmtcxjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. VERIFICAR SE É ADMIN
// ==========================================
async function verificarAdmin() {
    console.log('[Admin] 🔍 Verificando autenticação...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        console.log('[Admin] ❌ Sem sessão, redirecionando para login...');
        window.location.href = '../login/index.html';
        return;
    }
    
    const user = session.user;
    console.log('[Admin] 👤 Usuário logado:', user.email);
    
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, nome')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.log('[Admin] ❌ Perfil não encontrado');
        await supabase.auth.signOut();
        window.location.href = '../login/index.html';
        return;
    }

    console.log('[Admin] 📋 Profile:', profile);

    if (profile.role !== 'admin') {
        console.log('[Admin] ❌ Usuário não é admin');
        await supabase.auth.signOut();
        window.location.href = '../login/index.html';
        return;
    }

    console.log('[Admin] ✅ Usuário é ADMIN');
    document.getElementById('adminPanel').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('adminNameDisplay').textContent = profile.nome || 'Administrador';
    
    // ==========================================
    // 🔥 CARREGAR TODOS OS DADOS
    // ==========================================
    await loadDashboardStats();
    await loadUsers();
    await loadPosts();
    await loadComments();
}

// ==========================================
// 3. NAVEGAÇÃO ENTRE SEÇÕES
// ==========================================
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

// ==========================================
// 4. LOGOUT
// ==========================================
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('usuarioLogado');
    window.location.href = '../login/index.html';
});

// ==========================================
// 5. 🔥 DASHBOARD STATS (CORRIGIDO)
// ==========================================
async function loadDashboardStats() {
    console.log('[Admin] 📊 Carregando estatísticas do dashboard...');
    
    try {
        // 🔥 CONTAR USUÁRIOS
        console.log('[Admin] Contando usuários...');
        const { count: userCount, error: userError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        if (userError) {
            console.error('[Admin] ❌ Erro ao contar usuários:', userError);
        } else {
            console.log('[Admin] ✅ Usuários encontrados:', userCount);
            document.getElementById('countUsers').textContent = userCount || 0;
        }

        // 🔥 CONTAR POSTS (tarefas)
        console.log('[Admin] Contando posts...');
        const { count: postCount, error: postError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true });
        
        if (postError) {
            console.error('[Admin] ❌ Erro ao contar posts:', postError);
        } else {
            console.log('[Admin] ✅ Posts encontrados:', postCount);
            document.getElementById('countPosts').textContent = postCount || 0;
        }

        // 🔥 CONTAR COMENTÁRIOS (notificações)
        console.log('[Admin] Contando comentários...');
        const { count: commentCount, error: commentError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true });
        
        if (commentError) {
            console.error('[Admin] ❌ Erro ao contar comentários:', commentError);
        } else {
            console.log('[Admin] ✅ Comentários encontrados:', commentCount);
            document.getElementById('countComments').textContent = commentCount || 0;
        }

        console.log('[Admin] 📊 Estatísticas carregadas com sucesso!');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar estatísticas:', error);
        // Mostrar erro no dashboard
        document.getElementById('countUsers').textContent = '❌';
        document.getElementById('countPosts').textContent = '❌';
        document.getElementById('countComments').textContent = '❌';
    }
}

// ==========================================
// 6. 🔥 USERS (CORRIGIDO)
// ==========================================
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Admin] 👤 Carregando lista de usuários...');
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Admin] ❌ Erro ao carregar usuários:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;">❌ Erro ao carregar usuários</td></tr>';
            return;
        }

        console.log('[Admin] ✅ Usuários carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Nenhum usuário encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(u => `
            <tr>
                <td><strong>${u.nome || '-'}</strong></td>
                <td>${u.email}</td>
                <td>
                    <span style="
                        background: ${u.role === 'admin' ? 'rgba(147,51,234,0.2)' : 'rgba(148,163,184,0.2)'};
                        color: ${u.role === 'admin' ? '#9333ea' : '#94a3b8'};
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                    ">
                        ${u.role || 'user'}
                    </span>
                </td>
                <td>
                    ${u.role === 'admin' ? 
                        '<button class="btn-secondary" disabled style="opacity:0.5;">Admin</button>' :
                        `<button class="btn-primary" onclick="tornarAdmin('${u.id}')" style="margin-right:6px;">
                            <i class="fas fa-crown"></i> Admin
                        </button>`
                    }
                    <button class="btn-danger" onclick="banirUsuario('${u.id}')">
                        <i class="fas fa-ban"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar usuários:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;">❌ Erro ao carregar</td></tr>';
    }
}

// ==========================================
// 7. 🔥 POSTS (CORRIGIDO)
// ==========================================
async function loadPosts() {
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Admin] 📝 Carregando posts...');
        
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Admin] ❌ Erro ao carregar posts:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;">❌ Erro ao carregar posts</td></tr>';
            return;
        }

        console.log('[Admin] ✅ Posts carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Nenhum post encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(post => `
            <tr>
                <td><strong>${post.title || 'Sem título'}</strong></td>
                <td>
                    <span style="color: ${post.completed ? '#10b981' : '#f59e0b'}">
                        ${post.completed ? '✅ Publicado' : '📝 Rascunho'}
                    </span>
                </td>
                <td>${new Date(post.created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button class="btn-secondary" onclick="editarPost('${post.id}')" style="margin-right:6px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" onclick="deletarPost('${post.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar posts:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;">❌ Erro ao carregar</td></tr>';
    }
}

// ==========================================
// 8. 🔥 COMENTÁRIOS (CORRIGIDO)
// ==========================================
async function loadComments() {
    const tbody = document.getElementById('commentsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Admin] 💬 Carregando comentários...');
        
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Admin] ❌ Erro ao carregar comentários:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;">❌ Erro ao carregar comentários</td></tr>';
            return;
        }

        console.log('[Admin] ✅ Comentários carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Nenhum comentário encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(comment => `
            <tr>
                <td><strong>${comment.title || 'Anônimo'}</strong></td>
                <td>${comment.message || 'Sem mensagem'}</td>
                <td>
                    <span style="color: ${comment.read ? '#10b981' : '#f59e0b'}">
                        ${comment.read ? '✅ Lido' : '📩 Não lido'}
                    </span>
                </td>
                <td>
                    ${!comment.read ? `
                        <button class="btn-secondary" onclick="marcarLido('${comment.id}')" style="margin-right:6px;">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn-danger" onclick="deletarComentario('${comment.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar comentários:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;">❌ Erro ao carregar</td></tr>';
    }
}

// ==========================================
// 9. 🔥 FUNÇÕES DE ADMIN
// ==========================================
window.tornarAdmin = async function(userId) {
    if (!confirm('Tem certeza que deseja tornar este usuário ADMIN?')) return;
    
    console.log('[Admin] 👑 Tornando usuário admin:', userId);
    
    const { error } = await supabase
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
    
    const { error } = await supabase
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

// ==========================================
// 10. 🔥 MODAL DE POST
// ==========================================
const modal = document.getElementById('postModal');
document.getElementById('btnNewPost').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = '📝 Novo Post';
    document.getElementById('postId').value = '';
    document.getElementById('postTitle').value = '';
    document.getElementById('postSlug').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postPublished').checked = false;
    modal.classList.add('active');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
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
            const { error } = await supabase.from('tasks').update(postData).eq('id', id);
            if (error) throw error;
            showToast('✅ Post atualizado!');
        } else {
            console.log('[Admin] 📝 Criando novo post...');
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('tasks').insert({
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
        const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
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
        const { error } = await supabase.from('tasks').delete().eq('id', id);
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
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
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
        const { error } = await supabase.from('notifications').delete().eq('id', id);
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
    toast.textContent = msg;
    toast.className = isError ? 'toast error' : 'toast';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ==========================================
// 12. 🔥 INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin] 🚀 Inicializando painel admin...');
    verificarAdmin();
});

console.log('[Admin] ✅ admin.js carregado!');