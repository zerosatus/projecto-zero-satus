// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://yqxtfnnjjpoitbmtcxjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. VERIFICAR SE É ADMIN (SEM LOGIN DUPLICADO)
// ==========================================
async function verificarAdmin() {
    console.log('[Admin] Verificando autenticação...');
    
    // Verificar sessão do Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        console.log('[Admin] ❌ Sem sessão, redirecionando para login...');
        window.location.href = '../login/index.html';
        return;
    }
    
    const user = session.user;
    console.log('[Admin] Usuário logado:', user.email);
    
    // Verificar se é admin
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

    console.log('[Admin] Profile:', profile);

    if (profile.role !== 'admin') {
        console.log('[Admin] ❌ Usuário não é admin');
        await supabase.auth.signOut();
        window.location.href = '../login/index.html';
        return;
    }

    // ✅ É admin! Mostrar painel
    console.log('[Admin] ✅ Usuário é ADMIN');
    document.getElementById('adminPanel').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('adminNameDisplay').textContent = profile.nome || 'Administrador';
    
    loadDashboardStats();
    loadUsers();
    loadPosts();
    loadComments();
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
// 5. FUNÇÕES DE DADOS
// ==========================================
async function loadDashboardStats() {
    try {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: postCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
        const { count: commentCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
        
        document.getElementById('countUsers').textContent = userCount || 0;
        document.getElementById('countPosts').textContent = postCount || 0;
        document.getElementById('countComments').textContent = commentCount || 0;
    } catch (error) {
        console.error('[Admin] Erro ao carregar stats:', error);
    }
}

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

    try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

        if (error) {
            tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(u => `
            <tr>
                <td>${u.nome || '-'}</td>
                <td>${u.email}</td>
                <td>
                    <span style="color: ${u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)'}">
                        ${u.role || 'user'}
                    </span>
                </td>
                <td>
                    ${u.role === 'admin' ? 
                        '<button class="btn-secondary" disabled>Admin</button>' :
                        `<button class="btn-primary" onclick="tornarAdmin('${u.id}')">Tornar Admin</button>`
                    }
                    <button class="btn-danger" onclick="banirUsuario('${u.id}')">Banir</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('[Admin] Erro ao carregar usuários:', error);
        tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar.</td></tr>';
    }
}

async function loadPosts() {
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

    try {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });

        if (error) {
            tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(post => `
            <tr>
                <td>${post.title || 'Sem título'}</td>
                <td><span style="color: ${post.completed ? 'var(--success)' : 'var(--text-muted)'}">${post.completed ? 'Publicado' : 'Rascunho'}</span></td>
                <td>${new Date(post.created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button class="btn-secondary" onclick="editarPost('${post.id}')">Editar</button>
                    <button class="btn-danger" onclick="deletarPost('${post.id}')">Deletar</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('[Admin] Erro ao carregar posts:', error);
        tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar.</td></tr>';
    }
}

async function loadComments() {
    const tbody = document.getElementById('commentsTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

    try {
        const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });

        if (error) {
            tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(comment => `
            <tr>
                <td>${comment.title || 'Anônimo'}</td>
                <td>${comment.message || 'Sem mensagem'}</td>
                <td><span style="color: ${comment.read ? 'var(--success)' : 'var(--text-muted)'}">${comment.read ? 'Lido' : 'Não lido'}</span></td>
                <td>
                    <button class="btn-secondary" onclick="marcarLido('${comment.id}')">Marcar Lido</button>
                    <button class="btn-danger" onclick="deletarComentario('${comment.id}')">Deletar</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('[Admin] Erro ao carregar comentários:', error);
        tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar.</td></tr>';
    }
}

// ==========================================
// 6. FUNÇÕES DE ADMIN
// ==========================================
window.tornarAdmin = async function(userId) {
    if (!confirm('Tem certeza que deseja tornar este usuário admin?')) return;
    
    const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);
    
    if (error) {
        showToast('Erro ao tornar admin: ' + error.message, true);
    } else {
        showToast('Usuário agora é admin!');
        loadUsers();
    }
};

window.banirUsuario = async function(userId) {
    if (!confirm('Tem certeza que deseja banir este usuário?')) return;
    
    const { error } = await supabase
        .from('profiles')
        .update({ role: 'banned' })
        .eq('id', userId);
    
    if (error) {
        showToast('Erro ao banir: ' + error.message, true);
    } else {
        showToast('Usuário banido!');
        loadUsers();
    }
};

// ==========================================
// 7. MODAL DE POST
// ==========================================
const modal = document.getElementById('postModal');
document.getElementById('btnNewPost').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Novo Post';
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
        showToast('Título é obrigatório!', true);
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
            const { error } = await supabase.from('tasks').update(postData).eq('id', id);
            if (error) throw error;
            showToast('Post atualizado!');
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('tasks').insert({
                ...postData,
                user_id: user.id,
                created_at: new Date().toISOString()
            });
            if (error) throw error;
            showToast('Post criado!');
        }
        modal.classList.remove('active');
        loadPosts();
    } catch (error) {
        showToast('Erro: ' + error.message, true);
    }
});

window.editarPost = async function(id) {
    try {
        const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
        if (error) throw error;
        
        document.getElementById('modalTitle').textContent = 'Editar Post';
        document.getElementById('postId').value = data.id;
        document.getElementById('postTitle').value = data.title;
        document.getElementById('postSlug').value = data.slug || '';
        document.getElementById('postContent').value = data.content || '';
        document.getElementById('postPublished').checked = data.completed || false;
        modal.classList.add('active');
    } catch (error) {
        showToast('Erro ao carregar post: ' + error.message, true);
    }
};

window.deletarPost = async function(id) {
    if (!confirm('Tem certeza?')) return;
    try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
        showToast('Post deletado!');
        loadPosts();
    } catch (error) {
        showToast('Erro: ' + error.message, true);
    }
};

window.marcarLido = async function(id) {
    try {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
        if (error) throw error;
        showToast('Marcado como lido!');
        loadComments();
    } catch (error) {
        showToast('Erro: ' + error.message, true);
    }
};

window.deletarComentario = async function(id) {
    if (!confirm('Tem certeza?')) return;
    try {
        const { error } = await supabase.from('notifications').delete().eq('id', id);
        if (error) throw error;
        showToast('Comentário deletado!');
        loadComments();
    } catch (error) {
        showToast('Erro: ' + error.message, true);
    }
};

// ==========================================
// 8. TOAST
// ==========================================
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = isError ? 'toast error' : 'toast';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ==========================================
// 9. INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin] Inicializando...');
    verificarAdmin();
});