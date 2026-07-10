// ==========================================
// users.js - GERENCIAMENTO DE USUÁRIOS
// ==========================================

console.log('[Users] 👤 Carregando módulo de usuários...');

// ==========================================
// CARREGAR USUÁRIOS
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

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            console.warn('[Users] ⚠️ Sem sessão, redirecionando para login...');
            window.location.replace('../login/index.html');
            return;
        }

        console.log('[Users] 🔍 Buscando usuários...');

        // Buscar usuários da tabela profiles
        const { data: users, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Users] ❌ Erro ao carregar usuários:', error);
            
            if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center;color:#f59e0b;padding:20px;">
                            ⚠️ Erro de permissão. Verifique se você é administrador.
                            <br>
                            <button class="btn-secondary" onclick="loadUsers()" style="margin-top:10px;">
                                <i class="fas fa-sync"></i> Tentar novamente
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }
            throw error;
        }

        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                        <br>
                        Nenhum usuário encontrado
                    </td>
                </tr>
            `;
            return;
        }

        // Renderizar usuários
        let html = '';
        for (const u of users) {
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
                    <td><strong>${u.nome || u.email?.split('@')[0] || '-'}</strong></td>
                    <td>${u.email || '-'}</td>
                    <td>
                        <span style="background: ${roleBg}; color: ${roleColor}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                            ${roleLabel.toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <button class="btn-secondary" onclick="abrirDetalhesUsuario('${u.id}', '${u.nome || u.email?.split('@')[0] || 'Usuário'}', '${u.email}', '${u.created_at}')" style="margin-right:6px;" title="Ver detalhes">
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
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">
                    ❌ Erro ao carregar usuários: ${error.message}
                    <br>
                    <button class="btn-secondary" onclick="loadUsers()" style="margin-top:10px;">
                        <i class="fas fa-sync"></i> Tentar novamente
                    </button>
                </td>
            </tr>
        `;
    }
}

// ==========================================
// TORNAR ADMIN - CORRIGIDO
// ==========================================
window.tornarAdmin = async function(userId) {
    if (!confirm('Tem certeza que deseja tornar este usuário ADMIN?')) return;
    
    console.log('[Users] 👑 Tornando admin:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        // Buscar email do usuário
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[Users] ❌ Erro ao buscar perfil:', profileError);
            showToast('❌ Usuário não encontrado', true);
            return;
        }

        // Usar a função RPC tornar_admin
        const { data, error } = await supabaseClient.rpc('tornar_admin', {
            email_usuario: profile.email
        });

        if (error) {
            console.error('[Users] ❌ Erro ao tornar admin:', error);
            showToast('❌ Erro: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resultado:', data);
        showToast(data || '👑 Usuário agora é ADMIN!');
        await loadUsers();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Users] ❌ Erro ao tornar admin:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// TORNAR USER - CORRIGIDO
// ==========================================
window.tornarUser = async function(userId) {
    if (!confirm('Tem certeza que deseja remover os privilégios de ADMIN deste usuário?')) return;
    
    console.log('[Users] 👤 Removendo admin:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[Users] ❌ Erro ao buscar perfil:', profileError);
            showToast('❌ Usuário não encontrado', true);
            return;
        }

        const { data, error } = await supabaseClient.rpc('tornar_user', {
            email_usuario: profile.email
        });

        if (error) {
            console.error('[Users] ❌ Erro ao tornar user:', error);
            showToast('❌ Erro: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resultado:', data);
        showToast(data || '✅ Usuário agora é USER!');
        await loadUsers();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Users] ❌ Erro:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// BANIR USUÁRIO - CORRIGIDO
// ==========================================
window.banirUsuario = async function(userId) {
    if (!confirm('Tem certeza que deseja BANIR este usuário?')) return;
    
    console.log('[Users] 🚫 Banindo usuário:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[Users] ❌ Erro ao buscar perfil:', profileError);
            showToast('❌ Usuário não encontrado', true);
            return;
        }

        const { data, error } = await supabaseClient.rpc('banir_usuario', {
            email_usuario: profile.email
        });

        if (error) {
            console.error('[Users] ❌ Erro ao banir:', error);
            showToast('❌ Erro: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resultado:', data);
        showToast(data || '🚫 Usuário BANIDO!');
        await loadUsers();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Users] ❌ Erro ao banir:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// DESBANIR USUÁRIO - CORRIGIDO
// ==========================================
window.desbanirUsuario = async function(userId) {
    if (!confirm('Tem certeza que deseja DESBANIR este usuário?')) return;
    
    console.log('[Users] ✅ Desbanindo usuário:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[Users] ❌ Erro ao buscar perfil:', profileError);
            showToast('❌ Usuário não encontrado', true);
            return;
        }

        const { data, error } = await supabaseClient.rpc('desbanir_usuario', {
            email_usuario: profile.email
        });

        if (error) {
            console.error('[Users] ❌ Erro ao desbanir:', error);
            showToast('❌ Erro: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resultado:', data);
        showToast(data || '✅ Usuário DESBANIDO!');
        await loadUsers();
        await loadDashboardStats();
    } catch (error) {
        console.error('[Users] ❌ Erro ao desbanir:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// DELETAR USUÁRIO - CORRIGIDO
// ==========================================
window.deletarUsuario = async function(userId) {
    if (!confirm('⚠️ ATENÇÃO: Isso irá DELETAR permanentemente todos os dados deste usuário! Continuar?')) return;
    if (!confirm('Tem certeza absoluta?')) return;
    
    console.log('[Users] 🗑️ Deletando usuário:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[Users] ❌ Erro ao buscar perfil:', profileError);
            showToast('❌ Usuário não encontrado', true);
            return;
        }

        if (!profile || !profile.email) {
            showToast('❌ Usuário não encontrado', true);
            return;
        }

        const { data, error } = await supabaseClient.rpc('deletar_usuario', {
            email_usuario: profile.email
        });

        if (error) {
            console.error('[Users] ❌ Erro ao deletar:', error);
            showToast('❌ Erro: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resultado:', data);
        showToast(data || '🗑️ Usuário e todos os dados DELETADOS!');
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
    
    document.getElementById('modalUserName').textContent = nome || 'Usuário';
    document.getElementById('modalUserEmail').textContent = email || 'Sem email';
    
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
            } else {
                document.getElementById('statTotalTasks').textContent = '0';
                document.getElementById('statCompletedTasks').textContent = '0';
                document.getElementById('statPendingTasks').textContent = '0';
            }
        }
    } catch (error) {
        console.warn('[Users] ⚠️ Erro ao buscar tarefas:', error);
        document.getElementById('statTotalTasks').textContent = '?';
        document.getElementById('statCompletedTasks').textContent = '?';
        document.getElementById('statPendingTasks').textContent = '?';
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