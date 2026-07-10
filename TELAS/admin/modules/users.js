// ==========================================
// users.js - GERENCIAMENTO DE USUÁRIOS
// ==========================================

console.log('[Users] 👤 Carregando módulo de usuários...');

// ==========================================
// CARREGAR USUÁRIOS - COM TRATAMENTO DE ERRO RLS
// ==========================================
async function loadUsers() {
    console.log('[Users] 🔍 Carregando usuários...');
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
        console.error('[Users] ❌ Tabela de usuários não encontrada');
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Carregando...</td></tr>';

    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            throw new Error('Supabase não inicializado');
        }

        // 🔥 IMPORTANTE: Verificar se o usuário está autenticado
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            console.warn('[Users] ⚠️ Sem sessão, redirecionando para login...');
            window.location.replace('../login/index.html');
            return;
        }

        console.log('[Users] 🔍 Buscando usuários...');

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        // 🔥 Se der erro de RLS, mostrar mensagem amigável
        if (error) {
            console.error('[Users] ❌ Erro ao carregar usuários:', error);
            
            // Se for erro de permissão (RLS)
            if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('permission denied for relation')) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center;color:#f59e0b;padding:20px;">
                            ⚠️ Erro de permissão. Verifique se você é administrador.
                            <br>
                            <small style="color: var(--text-muted);">Tente recarregar a página ou verifique as políticas RLS do Supabase.</small>
                            <br>
                            <button class="btn-secondary" onclick="loadUsers()" style="margin-top:10px;">
                                <i class="fas fa-sync"></i> Tentar novamente
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar usuários: ${error.message}</td></tr>`;
            return;
        }

        console.log('[Users] ✅ Usuários carregados:', data?.length || 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">Nenhum usuário encontrado</td></tr>';
            return;
        }

        // Renderizar usuários
        let html = '';
        for (const u of data) {
            const isAdmin = u.role === 'admin';
            const isBanned = u.role === 'banned';
            
            let roleColor = '#94a3b8';
            let roleBg = 'rgba(148,163,184,0.2)';
            let roleLabel = u.role || 'user';
            
            if (isAdmin) {
                roleColor = '#9333ea';
                roleBg = 'rgba(147,51,234,0.2)';
            } else if (isBanned) {
                roleColor = '#ef4444';
                roleBg = 'rgba(239,68,68,0.2)';
            }

            html += `
                <tr>
                    <td><strong>${u.nome || '-'}</strong></td>
                    <td>${u.email}</td>
                    <td>
                        <span style="background: ${roleBg}; color: ${roleColor}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                            ${roleLabel.toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <button class="btn-secondary" onclick="abrirDetalhesUsuario('${u.id}', '${u.nome || 'Usuário'}', '${u.email}', '${u.created_at}')" style="margin-right:6px;" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>

                        ${!isAdmin ? `
                            <button class="btn-primary" onclick="tornarAdmin('${u.id}')" style="margin-right:6px;" title="Tornar Admin">
                                <i class="fas fa-crown"></i>
                            </button>
                        ` : `
                            <button class="btn-secondary" onclick="tornarUser('${u.id}')" style="margin-right:6px;" title="Remover Admin">
                                <i class="fas fa-user"></i>
                            </button>
                        `}

                        ${!isAdmin && !isBanned ? `
                            <button class="btn-danger" onclick="banirUsuario('${u.id}')" title="Banir">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : ''}

                        ${isBanned ? `
                            <button class="btn-primary" onclick="desbanirUsuario('${u.id}')" style="margin-right:6px;" title="Desbanir">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}

                        ${!isAdmin ? `
                            <button class="btn-danger" onclick="deletarUsuario('${u.id}')" title="Deletar Conta">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }
        tbody.innerHTML = html;

    } catch (error) {
        console.error('[Users] ❌ Erro ao carregar usuários:', error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">❌ Erro ao carregar: ${error.message}</td></tr>`;
    }
}

// ==========================================
// TORNAR ADMIN
// ==========================================
window.tornarAdmin = async function(userId) {
    if (!confirm('Tem certeza que deseja tornar este usuário ADMIN?')) return;
    
    console.log('[Users] 👑 Tornando admin:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: 'admin', updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) throw error;

        showToast('👑 Usuário agora é ADMIN!');
        await loadUsers();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Users] ❌ Erro ao tornar admin:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// TORNAR USER
// ==========================================
window.tornarUser = async function(userId) {
    if (!confirm('Tem certeza que deseja remover os privilégios de ADMIN deste usuário?')) return;
    
    console.log('[Users] 👤 Removendo admin:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: 'user', updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) throw error;

        showToast('✅ Usuário agora é USER!');
        await loadUsers();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Users] ❌ Erro:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// BANIR USUÁRIO
// ==========================================
window.banirUsuario = async function(userId) {
    if (!confirm('Tem certeza que deseja BANIR este usuário?')) return;
    
    console.log('[Users] 🚫 Banindo usuário:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: 'banned', updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) throw error;

        showToast('🚫 Usuário BANIDO!');
        await loadUsers();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Users] ❌ Erro ao banir:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// DESBANIR USUÁRIO
// ==========================================
window.desbanirUsuario = async function(userId) {
    if (!confirm('Tem certeza que deseja DESBANIR este usuário?')) return;
    
    console.log('[Users] ✅ Desbanindo usuário:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: 'user', updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) throw error;

        showToast('✅ Usuário DESBANIDO!');
        await loadUsers();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Users] ❌ Erro ao desbanir:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// DELETAR USUÁRIO
// ==========================================
window.deletarUsuario = async function(userId) {
    if (!confirm('⚠️ ATENÇÃO: Isso irá DELETAR permanentemente todos os dados deste usuário! Continuar?')) return;
    if (!confirm('Tem certeza absoluta?')) return;
    
    console.log('[Users] 🗑️ Deletando usuário:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        // Buscar email do usuário
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        if (!profile || !profile.email) {
            throw new Error('Usuário não encontrado');
        }

        const { error } = await supabaseClient.rpc('deletar_usuario', {
            email_usuario: profile.email
        });

        if (error) throw error;

        showToast('🗑️ Usuário e todos os dados DELETADOS!');
        await loadUsers();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Users] ❌ Erro ao deletar:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// ABRIR DETALHES DO USUÁRIO
// ==========================================
window.abrirDetalhesUsuario = async function(id, nome, email, dataCadastro) {
    console.log('[Users] 👁️ Abrindo detalhes do usuário:', id);
    
    document.getElementById('modalUserName').textContent = nome;
    document.getElementById('modalUserEmail').textContent = email;
    
    const dataFormatada = dataCadastro ? new Date(dataCadastro).toLocaleDateString('pt-BR') : 'Hoje';
    document.getElementById('statJoinDate').textContent = dataFormatada;

    try {
        const supabaseClient = window.supabaseClient;
        if (supabaseClient) {
            const { data: tasks, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .eq('user_id', id);

            if (!error && tasks) {
                const total = tasks.length;
                const concluidas = tasks.filter(t => t.completed === true).length;
                const pendentes = total - concluidas;

                document.getElementById('statTotalTasks').textContent = total;
                document.getElementById('statCompletedTasks').textContent = concluidas;
                document.getElementById('statPendingTasks').textContent = pendentes;
            }
        }
    } catch (error) {
        console.warn('[Users] ⚠️ Erro ao buscar tarefas:', error);
    }

    document.getElementById('userDetailsModal').classList.add('active');
};

// ==========================================
// FECHAR MODAL DO USUÁRIO
// ==========================================
window.fecharModalUsuario = function() {
    console.log('[Users] ❌ Fechando modal de usuário');
    document.getElementById('userDetailsModal').classList.remove('active');
};

// ==========================================
// FECHAR MODAL CLICANDO FORA
// ==========================================
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