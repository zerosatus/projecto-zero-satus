// Posts (blog) management + modal
console.log('[Posts] Módulo de posts carregado');
async function loadPosts() {
    const tbody = document.getElementById('postsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Posts] 📝 Carregando posts...');
        const supabaseClient = window.supabaseClient;
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Posts] ❌ Erro ao carregar posts:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar posts</td></tr>';
            return;
        }

        console.log('[Posts] ✅ Posts carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">Nenhum post encontrado</td></tr>';
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
        console.error('[Posts] ❌ Erro ao carregar posts:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar</td></tr>';
    }
}
// ==========================================
// posts.js - GERENCIAMENTO DE POSTS
// ==========================================

console.log('[Posts] 📝 Carregando módulo de posts...');

// ==========================================
// CARREGAR POSTS
// ==========================================
async function loadPosts() {
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Posts] 📝 Carregando posts...');
        
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Posts] ❌ Erro ao carregar posts:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar posts</td></tr>';
            return;
        }

        console.log('[Posts] ✅ Posts carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">Nenhum post encontrado</td></tr>';
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
        console.error('[Posts] ❌ Erro ao carregar posts:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar</td></tr>';
    }
}

// ==========================================
// EDITAR POST
// ==========================================
window.editarPost = async function(id) {
    try {
        console.log('[Posts] 📝 Editando post:', id);
        const { data, error } = await supabaseClient.from('tasks').select('*').eq('id', id).single();
        if (error) throw error;
        
        document.getElementById('modalTitle').textContent = '✏️ Editar Post';
        document.getElementById('postId').value = data.id;
        document.getElementById('postTitle').value = data.title;
        document.getElementById('postSlug').value = data.slug || '';
        document.getElementById('postContent').value = data.content || '';
        document.getElementById('postPublished').checked = data.completed || false;
        document.getElementById('postModal').classList.add('active');
    } catch (error) {
        console.error('[Posts] ❌ Erro ao carregar post:', error);
        showToast('❌ Erro ao carregar post: ' + error.message, true);
    }
};

// ==========================================
// DELETAR POST
// ==========================================
window.deletarPost = async function(id) {
    if (!confirm('Tem certeza que deseja DELETAR este post?')) return;
    
    try {
        console.log('[Posts] 🗑️ Deletando post:', id);
        const { error } = await supabaseClient.from('tasks').delete().eq('id', id);
        if (error) throw error;
        showToast('🗑️ Post deletado!');
        await loadPosts();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Posts] ❌ Erro ao deletar:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// MODAL DE POST
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('postModal');
    const btnNewPost = document.getElementById('btnNewPost');

    if (btnNewPost) {
        btnNewPost.addEventListener('click', () => {
            console.log('[Posts] 📝 Abrindo modal de novo post');
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
            console.log('[Posts] ❌ Fechando modal');
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
                console.log('[Posts] 📝 Atualizando post:', id);
                const { error } = await supabaseClient.from('tasks').update(postData).eq('id', id);
                if (error) throw error;
                showToast('✅ Post atualizado!');
            } else {
                console.log('[Posts] 📝 Criando novo post...');
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
            console.error('[Posts] ❌ Erro:', error);
            showToast('❌ Erro: ' + error.message, true);
        }
    });
});

console.log('[Posts] ✅ posts.js carregado!');
