// Users management
console.log('[Users] Módulo de usuários carregado');
// Simplify: ensure only one implementation exists

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">🔄 Carregando...</td></tr>';

    try {
        console.log('[Users] 👤 Carregando lista de usuários...');
        const supabaseClient = window.supabaseClient;
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Users] ❌ Erro ao carregar usuários:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar usuários</td></tr>';
            return;
        }

        console.log('[Users] ✅ Usuários carregados:', data?.length || 0);

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
                    <button class="btn-secondary" onclick="abrirDetalhesUsuario('${u.id}', '${u.nome || 'Usuário'}', '${u.email}', '${u.created_at}')" style="margin-right:6px;">
                        <i class="fas fa-eye"></i>
                    </button>

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
        console.error('[Users] ❌ Erro ao carregar usuários:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar</td></tr>';
    }
}

window.tornarAdmin = async function(userId) {
    if (!confirm('Tem certeza que deseja tornar este usuário ADMIN?')) return;
    console.log('[Users] 👑 Tornando usuário admin:', userId);
    const supabaseClient = window.supabaseClient;
    const { error } = await supabaseClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

    if (error) {
        console.error('[Users] ❌ Erro ao tornar admin:', error);
        showToast('Erro ao tornar admin: ' + error.message, true);
    } else {
        console.log('[Users] ✅ Usuário agora é admin!');
        showToast('👑 Usuário agora é ADMIN!');
        await loadUsers();
        if (typeof loadDashboardStats === 'function') await loadDashboardStats();
    }
};

window.banirUsuario = async function(userId) {
    if (!confirm('Tem certeza que deseja BANIR este usuário?')) return;
    console.log('[Users] 🚫 Banindo usuário:', userId);
    const supabaseClient = window.supabaseClient;
    const { error } = await supabaseClient
        .from('profiles')
        .update({ role: 'banned' })
        .eq('id', userId);

    if (error) {
        console.error('[Users] ❌ Erro ao banir:', error);
        showToast('Erro ao banir: ' + error.message, true);
    } else {
        console.log('[Users] ✅ Usuário banido!');
        showToast('🚫 Usuário BANIDO!');
        await loadUsers();
        if (typeof loadDashboardStats === 'function') await loadDashboardStats();
    }
};

window.abrirDetalhesUsuario = function(id, nome, email, dataCadastro) {
    console.log('[Users] 👁️ Abrindo detalhes do usuário:', id);
    document.getElementById('modalUserName').textContent = nome;
    document.getElementById('modalUserEmail').textContent = email;
    const dataFormatada = dataCadastro ? new Date(dataCadastro).toLocaleDateString('pt-BR') : 'Hoje';
    document.getElementById('statJoinDate').textContent = dataFormatada;

    const totalTarefas = Math.floor(Math.random() * 20) + 5;
    const concluidas = Math.floor(totalTarefas * 0.7);
    const pendentes = totalTarefas - concluidas;

    document.getElementById('statTotalTasks').textContent = totalTarefas;
    document.getElementById('statCompletedTasks').textContent = concluidas;
    document.getElementById('statPendingTasks').textContent = pendentes;

    document.getElementById('userDetailsModal').classList.add('active');
};

window.fecharModalUsuario = function() {
    document.getElementById('userDetailsModal').classList.remove('active');
};

// Fechar modal ao clicar fora
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('userDetailsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                window.fecharModalUsuario();
            }
        });
    }
});

console.log('[Users] ✅ users.js carregado!');
