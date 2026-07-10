// Comments moderation
console.log('[Comments] Módulo de comentários carregado');
async function loadComments() {
    const tbody = document.getElementById('commentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Comments] 💬 Carregando comentários...');
        const supabaseClient = window.supabaseClient;
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Comments] ❌ Erro ao carregar comentários:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar comentários</td></tr>';
            return;
        }

        console.log('[Comments] ✅ Comentários carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">Nenhum comentário encontrado</td></tr>';
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
        console.error('[Comments] ❌ Erro ao carregar comentários:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar</td></tr>';
    }
}

window.marcarLido = async function(id) {
    try {
        console.log('[Comments] ✅ Marcando comentário como lido:', id);
        const supabaseClient = window.supabaseClient;
        const { error } = await supabaseClient.from('notifications').update({ read: true }).eq('id', id);
        if (error) throw error;
        showToast('✅ Marcado como lido!');
        await loadComments();
        if (typeof loadDashboardStats === 'function') await loadDashboardStats();
    } catch (error) {
        console.error('[Comments] ❌ Erro:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

window.deletarComentario = async function(id) {
    if (!confirm('Tem certeza que deseja DELETAR este comentário?')) return;
    try {
        console.log('[Comments] 🗑️ Deletando comentário:', id);
        const supabaseClient = window.supabaseClient;
        const { error } = await supabaseClient.from('notifications').delete().eq('id', id);
        if (error) throw error;
        showToast('🗑️ Comentário deletado!');
        await loadComments();
        if (typeof loadDashboardStats === 'function') await loadDashboardStats();
    } catch (error) {
        console.error('[Comments] ❌ Erro ao deletar:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};
// ==========================================
// comments.js - GERENCIAMENTO DE COMENTÁRIOS
// ==========================================

console.log('[Comments] 💬 Carregando módulo de comentários...');

// ==========================================
// CARREGAR COMENTÁRIOS
// ==========================================
async function loadComments() {
    const tbody = document.getElementById('commentsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Comments] 💬 Carregando comentários...');
        
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Comments] ❌ Erro ao carregar comentários:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar comentários</td></tr>';
            return;
        }

        console.log('[Comments] ✅ Comentários carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">Nenhum comentário encontrado</td></tr>';
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
        console.error('[Comments] ❌ Erro ao carregar comentários:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar</td></tr>';
    }
}

// ==========================================
// MARCAR COMO LIDO
// ==========================================
window.marcarLido = async function(id) {
    try {
        console.log('[Comments] ✅ Marcando comentário como lido:', id);
        const { error } = await supabaseClient.from('notifications').update({ read: true }).eq('id', id);
        if (error) throw error;
        showToast('✅ Marcado como lido!');
        await loadComments();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Comments] ❌ Erro:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// DELETAR COMENTÁRIO
// ==========================================
window.deletarComentario = async function(id) {
    if (!confirm('Tem certeza que deseja DELETAR este comentário?')) return;
    
    try {
        console.log('[Comments] 🗑️ Deletando comentário:', id);
        const { error } = await supabaseClient.from('notifications').delete().eq('id', id);
        if (error) throw error;
        showToast('🗑️ Comentário deletado!');
        await loadComments();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Comments] ❌ Erro ao deletar:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

console.log('[Comments] ✅ comments.js carregado!');
