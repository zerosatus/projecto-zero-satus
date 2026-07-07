// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://yqxtfnnjjpoitbmtcxjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. NAVEGAÇÃO ENTRE SEÇÕES
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
// 3. AUTENTICAÇÃO E LOGIN
// ==========================================
const loginBtn = document.getElementById('btnLogin');
const logoutBtn = document.getElementById('logoutBtn');

loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');

    errorMsg.textContent = '';

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        errorMsg.textContent = 'Erro: ' + error.message;
    } else {
        checkAdminRole(data.user);
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('usuarioLogado');
    window.location.href = '../login/index.html';
});

// ==========================================
// 🔥 VERIFICAR SE É ADMIN
// ==========================================
async function checkAdminRole(user) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, nome')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        document.getElementById('loginError').textContent = 'Perfil não encontrado.';
        supabase.auth.signOut();
        return;
    }

    if (profile.role !== 'admin') {
        document.getElementById('loginError').textContent = 'Acesso negado. Você não é admin.';
        supabase.auth.signOut();
        return;
    }

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('adminNameDisplay').textContent = profile.nome || 'Administrador';
    
    loadDashboardStats();
}

// Verifica sessão ao carregar a página
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        checkAdminRole(session.user);
    }
});

// ==========================================
// 4. FUNÇÕES DE DADOS
// ==========================================
async function loadDashboardStats() {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: postCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
    const { count: commentCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
    
    document.getElementById('countUsers').textContent = userCount || 0;
    document.getElementById('countPosts').textContent = postCount || 0;
    document.getElementById('countComments').textContent = commentCount || 0;
}

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

    const { data, error } = await supabase.from('profiles').select('*');

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
}

// ==========================================
// 🔥 FUNÇÕES DE ADMIN
// ==========================================
async function tornarAdmin(userId) {
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
}

async function banirUsuario(userId) {
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
}

window.tornarAdmin = tornarAdmin;
window.banirUsuario = banirUsuario;

async function loadPosts() {
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

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
}

async function loadComments() {
    const tbody = document.getElementById('commentsTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

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
}

// ==========================================
// 5. MODAL DE POST
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

    if (id) {
        const { error } = await supabase.from('tasks').update(postData).eq('id', id);
        if (error) {
            showToast('Erro ao atualizar: ' + error.message, true);
        } else {
            showToast('Post atualizado!');
            modal.classList.remove('active');
            loadPosts();
        }
    } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('tasks').insert({
            ...postData,
            user_id: user.id,
            created_at: new Date().toISOString()
        });
        if (error) {
            showToast('Erro ao criar: ' + error.message, true);
        } else {
            showToast('Post criado!');
            modal.classList.remove('active');
            loadPosts();
        }
    }
});

async function editarPost(id) {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (error) {
        showToast('Erro ao carregar post', true);
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Editar Post';
    document.getElementById('postId').value = data.id;
    document.getElementById('postTitle').value = data.title;
    document.getElementById('postSlug').value = data.slug || '';
    document.getElementById('postContent').value = data.content || '';
    document.getElementById('postPublished').checked = data.completed || false;
    modal.classList.add('active');
}

window.editarPost = editarPost;

async function deletarPost(id) {
    if (!confirm('Tem certeza?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
        showToast('Erro ao deletar: ' + error.message, true);
    } else {
        showToast('Post deletado!');
        loadPosts();
    }
}

window.deletarPost = deletarPost;

async function marcarLido(id) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) {
        showToast('Erro: ' + error.message, true);
    } else {
        showToast('Marcado como lido!');
        loadComments();
    }
}

window.marcarLido = marcarLido;

async function deletarComentario(id) {
    if (!confirm('Tem certeza?')) return;
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
        showToast('Erro ao deletar: ' + error.message, true);
    } else {
        showToast('Comentário deletado!');
        loadComments();
    }
}

window.deletarComentario = deletarComentario;

// ==========================================
// 6. TOAST
// ==========================================
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = isError ? 'toast error' : 'toast';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}