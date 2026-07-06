// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================
// ️ IMPORTANTE: Substitua pelos seus dados do Supabase depois!
const SUPABASE_URL = 'SUA_URL_DO_SUPABASE_AQUI';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. NAVEGAÇÃO ENTRE SEÇÕES
// ==========================================
document.querySelectorAll('.sidebar-menu a[data-target]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active de todos
        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        
        // Adiciona active no clicado
        link.classList.add('active');
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        // Carrega dados específicos se necessário
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
    window.location.reload();
});

async function checkAdminRole(user) {
    // Verifica na tabela 'profiles' se o usuário é admin
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
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

    // Se for admin, mostra o painel
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('adminNameDisplay').textContent = profile.full_name || 'Administrador';
    
    loadDashboardStats();
}

// Verifica sessão ao carregar a página
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        checkAdminRole(session.user);
    }
});

// ==========================================
// 4. FUNÇÕES DE DADOS (DASHBOARD, TABELAS)
// ==========================================
async function loadDashboardStats() {
    // Exemplo simples de contagem (ajustar conforme as tabelas do Supabase)
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    document.getElementById('countUsers').textContent = userCount || 0;
    document.getElementById('countPosts').textContent = '0'; // Implementar depois
    document.getElementById('countComments').textContent = '0'; // Implementar depois
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
            <td>${u.full_name || '-'}</td>
            <td>${u.email}</td>
            <td><span style="color: ${u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)'}">${u.role}</span></td>
            <td>
                <button class="btn-danger" onclick="alert('Função de banir em desenvolvimento')">Banir</button>
            </td>
        </tr>
    `).join('');
}

// Funções placeholder para Posts e Comentários (serão completadas após criar as tabelas)
async function loadPosts() {
    document.getElementById('postsTableBody').innerHTML = '<tr><td colspan="4">Nenhum post ainda.</td></tr>';
}

async function loadComments() {
    document.getElementById('commentsTableBody').innerHTML = '<tr><td colspan="4">Nenhum comentário ainda.</td></tr>';
}

// ==========================================
// 5. UTILITÁRIOS (TOAST E MODAL)
// ==========================================
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = isError ? 'toast error' : 'toast';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Lógica do Modal de Post
const modal = document.getElementById('postModal');
document.getElementById('btnNewPost').addEventListener('click', () => modal.classList.add('active'));
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
});