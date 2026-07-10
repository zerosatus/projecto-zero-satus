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
// FUNÇÃO AUXILIAR: BUSCAR EMAIL POR ID
// ==========================================
async function getEmailById(userId) {
    console.log('[Users] 🔍 Buscando email para userId:', userId);
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.error('[Users] ❌ Supabase não inicializado');
            return null;
        }

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[Users] ❌ Erro ao buscar email:', error);
            return null;
        }

        console.log('[Users] ✅ Email encontrado:', data?.email);
        return data?.email || null;
    } catch (error) {
        console.error('[Users] ❌ Erro ao buscar email:', error);
        return null;
    }
}

// ==========================================
// TORNAR ADMIN - CORRIGIDO COM LOGS
// ==========================================
window.tornarAdmin = async function(userId) {
    console.log('[Users] 👑 Iniciando tornarAdmin para:', userId);
    
    if (!confirm('Tem certeza que deseja tornar este usuário ADMIN?')) {
        console.log('[Users] ❌ Cancelado pelo usuário');
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.error('[Users] ❌ Supabase não inicializado');
            showToast('❌ Supabase não inicializado', true);
            return;
        }

        // Buscar email
        const email = await getEmailById(userId);
        if (!email) {
            console.error('[Users] ❌ Email não encontrado');
            showToast('❌ Email do usuário não encontrado', true);
            return;
        }

        console.log('[Users] 📧 Email encontrado:', email);

        // Chamar RPC
        console.log('[Users] 📡 Chamando RPC tornar_admin para:', email);
        const { data, error } = await supabaseClient.rpc('tornar_admin', {
            email_usuario: email
        });

        if (error) {
            console.error('[Users] ❌ Erro RPC tornar_admin:', error);
            showToast('❌ Erro ao tornar admin: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resposta RPC:', data);
        showToast(data || '👑 Usuário agora é ADMIN!');
        
        // Recarregar lista
        await loadUsers();
        await loadDashboardStats();
        
    } catch (error) {
        console.error('[Users] ❌ Erro ao tornar admin:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// TORNAR USER - CORRIGIDO COM LOGS
// ==========================================
window.tornarUser = async function(userId) {
    console.log('[Users] 👤 Iniciando tornarUser para:', userId);
    
    if (!confirm('Tem certeza que deseja remover os privilégios de ADMIN deste usuário?')) {
        console.log('[Users] ❌ Cancelado pelo usuário');
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.error('[Users] ❌ Supabase não inicializado');
            showToast('❌ Supabase não inicializado', true);
            return;
        }

        const email = await getEmailById(userId);
        if (!email) {
            console.error('[Users] ❌ Email não encontrado');
            showToast('❌ Email do usuário não encontrado', true);
            return;
        }

        console.log('[Users] 📧 Email encontrado:', email);
        console.log('[Users] 📡 Chamando RPC tornar_user para:', email);
        
        const { data, error } = await supabaseClient.rpc('tornar_user', {
            email_usuario: email
        });

        if (error) {
            console.error('[Users] ❌ Erro RPC tornar_user:', error);
            showToast('❌ Erro ao tornar user: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resposta RPC:', data);
        showToast(data || '✅ Usuário agora é USER!');
        
        await loadUsers();
        await loadDashboardStats();
        
    } catch (error) {
        console.error('[Users] ❌ Erro ao tornar user:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// BANIR USUÁRIO - CORRIGIDO COM LOGS
// ==========================================
window.banirUsuario = async function(userId) {
    console.log('[Users] 🚫 Iniciando banirUsuario para:', userId);
    
    if (!confirm('Tem certeza que deseja BANIR este usuário?')) {
        console.log('[Users] ❌ Cancelado pelo usuário');
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.error('[Users] ❌ Supabase não inicializado');
            showToast('❌ Supabase não inicializado', true);
            return;
        }

        const email = await getEmailById(userId);
        if (!email) {
            console.error('[Users] ❌ Email não encontrado');
            showToast('❌ Email do usuário não encontrado', true);
            return;
        }

        console.log('[Users] 📧 Email encontrado:', email);
        console.log('[Users] 📡 Chamando RPC banir_usuario para:', email);
        
        const { data, error } = await supabaseClient.rpc('banir_usuario', {
            email_usuario: email
        });

        if (error) {
            console.error('[Users] ❌ Erro RPC banir_usuario:', error);
            showToast('❌ Erro ao banir: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resposta RPC:', data);
        showToast(data || '🚫 Usuário BANIDO!');
        
        await loadUsers();
        await loadDashboardStats();
        
    } catch (error) {
        console.error('[Users] ❌ Erro ao banir:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// DESBANIR USUÁRIO - CORRIGIDO COM LOGS
// ==========================================
window.desbanirUsuario = async function(userId) {
    console.log('[Users] ✅ Iniciando desbanirUsuario para:', userId);
    
    if (!confirm('Tem certeza que deseja DESBANIR este usuário?')) {
        console.log('[Users] ❌ Cancelado pelo usuário');
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.error('[Users] ❌ Supabase não inicializado');
            showToast('❌ Supabase não inicializado', true);
            return;
        }

        const email = await getEmailById(userId);
        if (!email) {
            console.error('[Users] ❌ Email não encontrado');
            showToast('❌ Email do usuário não encontrado', true);
            return;
        }

        console.log('[Users] 📧 Email encontrado:', email);
        console.log('[Users] 📡 Chamando RPC desbanir_usuario para:', email);
        
        const { data, error } = await supabaseClient.rpc('desbanir_usuario', {
            email_usuario: email
        });

        if (error) {
            console.error('[Users] ❌ Erro RPC desbanir_usuario:', error);
            showToast('❌ Erro ao desbanir: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resposta RPC:', data);
        showToast(data || '✅ Usuário DESBANIDO!');
        
        await loadUsers();
        await loadDashboardStats();
        
    } catch (error) {
        console.error('[Users] ❌ Erro ao desbanir:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
};

// ==========================================
// DELETAR USUÁRIO - CORRIGIDO COM LOGS
// ==========================================
window.deletarUsuario = async function(userId) {
    console.log('[Users] 🗑️ Iniciando deletarUsuario para:', userId);
    
    if (!confirm('⚠️ ATENÇÃO: Isso irá DELETAR permanentemente todos os dados deste usuário! Continuar?')) {
        console.log('[Users] ❌ Cancelado pelo usuário');
        return;
    }
    if (!confirm('Tem certeza absoluta?')) {
        console.log('[Users] ❌ Cancelado pelo usuário');
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.error('[Users] ❌ Supabase não inicializado');
            showToast('❌ Supabase não inicializado', true);
            return;
        }

        const email = await getEmailById(userId);
        if (!email) {
            console.error('[Users] ❌ Email não encontrado');
            showToast('❌ Email do usuário não encontrado', true);
            return;
        }

        console.log('[Users] 📧 Email encontrado:', email);
        console.log('[Users] 📡 Chamando RPC deletar_usuario para:', email);
        
        const { data, error } = await supabaseClient.rpc('deletar_usuario', {
            email_usuario: email
        });

        if (error) {
            console.error('[Users] ❌ Erro RPC deletar_usuario:', error);
            showToast('❌ Erro ao deletar: ' + error.message, true);
            return;
        }

        console.log('[Users] ✅ Resposta RPC:', data);
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