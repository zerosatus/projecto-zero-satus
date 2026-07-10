// ==========================================
// auth.js - AUTENTICAÇÃO E VERIFICAÇÃO ADMIN
// ==========================================

console.log('[Auth] 🔐 Módulo de autenticação carregado');

// ==========================================
// VARIÁVEIS
// ==========================================
let authVerificado = false;
let tentativasFalhas = 0;
const MAX_TENTATIVAS = 3;

// ==========================================
// VERIFICAR ADMIN - VERSÃO CORRIGIDA
// ==========================================
async function verificarAdmin() {
    console.log('[Auth] 🔍 Verificando autenticação...');
    
    if (authVerificado) {
        console.log('[Auth] ✅ Já verificado');
        return true;
    }

    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.error('[Auth] ❌ supabaseClient não encontrado');
        return false;
    }

    try {
        // 1. Obter sessão atual
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            console.error('[Auth] ❌ Erro ao buscar sessão:', sessionError);
            return false;
        }

        if (!session) {
            console.log('[Auth] ❌ Sem sessão');
            // Verificar se tem no localStorage
            const usuarioSalvo = localStorage.getItem('usuarioLogado');
            if (usuarioSalvo) {
                try {
                    const parsed = JSON.parse(usuarioSalvo);
                    if (parsed.role === 'admin') {
                        console.log('[Auth] 🔄 Recuperando sessão do localStorage...');
                        // Tentar restaurar a sessão
                        const { data: { session: newSession } } = await supabaseClient.auth.getSession();
                        if (!newSession) {
                            // Tentar atualizar a sessão
                            await supabaseClient.auth.refreshSession();
                            const { data: { session: refreshedSession } } = await supabaseClient.auth.getSession();
                            if (refreshedSession) {
                                console.log('[Auth] ✅ Sessão restaurada por refresh');
                                return await verificarAdmin();
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[Auth] ⚠️ Erro ao verificar localStorage:', e);
                }
            }
            
            redirecionarLogin();
            return false;
        }

        const user = session.user;
        console.log('[Auth] 👤 Usuário logado:', user.email);

        // 2. Buscar perfil do usuário
        let profile = null;
        let profileError = null;
        
        try {
            const result = await supabaseClient
                .from('profiles')
                .select('role, nome, email, avatar_url')
                .eq('id', user.id)
                .single();
            
            profile = result.data;
            profileError = result.error;
        } catch (e) {
            console.error('[Auth] ❌ Erro na consulta:', e);
            profileError = e;
        }

        if (profileError) {
            console.error('[Auth] ❌ Erro ao buscar perfil:', profileError);
            
            // Se erro 404, criar perfil
            if (profileError.code === 'PGRST116') {
                console.log('[Auth] 🔄 Criando perfil para usuário...');
                await criarPerfilUsuario(user);
                // Tentar buscar novamente
                try {
                    const result = await supabaseClient
                        .from('profiles')
                        .select('role, nome, email, avatar_url')
                        .eq('id', user.id)
                        .single();
                    
                    profile = result.data;
                    profileError = result.error;
                } catch (e) {
                    console.error('[Auth] ❌ Erro ao buscar perfil após criação:', e);
                }
                
                if (profileError || !profile) {
                    console.error('[Auth] ❌ Falha ao criar perfil');
                    await supabaseClient.auth.signOut();
                    redirecionarLogin();
                    return false;
                }
                
                // Se não for admin, tornar admin
                if (profile.role !== 'admin') {
                    console.log('[Auth] 🔄 Tornando usuário ADMIN...');
                    await tornarAdminPorEmail(user.email);
                    // Atualizar profile
                    const result = await supabaseClient
                        .from('profiles')
                        .select('role, nome, email, avatar_url')
                        .eq('id', user.id)
                        .single();
                    profile = result.data;
                }
            } else {
                await supabaseClient.auth.signOut();
                redirecionarLogin();
                return false;
            }
        }

        // 3. Verificar se é admin
        if (!profile || profile.role !== 'admin') {
            console.log('[Auth] ❌ Acesso negado - não é admin. Role:', profile?.role);
            
            // Se o usuário existe mas não é admin, tentar tornar admin
            console.log('[Auth] 🔄 Tentando tornar usuário ADMIN...');
            await tornarAdminPorEmail(user.email);
            
            // Buscar novamente
            const result = await supabaseClient
                .from('profiles')
                .select('role, nome, email, avatar_url')
                .eq('id', user.id)
                .single();
            
            if (result.data && result.data.role === 'admin') {
                console.log('[Auth] ✅ Usuário agora é ADMIN!');
                profile = result.data;
            } else {
                await supabaseClient.auth.signOut();
                redirecionarLogin();
                return false;
            }
        }

        console.log('[Auth] ✅ Usuário é ADMIN:', profile.nome);
        
        // 4. Atualizar interface
        atualizarInterfaceAdmin(profile, user);
        authVerificado = true;
        
        // 5. Disparar evento
        window.dispatchEvent(new CustomEvent('adminVerificado', { 
            detail: { user, profile } 
        }));
        
        return true;

    } catch (error) {
        console.error('[Auth] ❌ Erro na verificação:', error);
        tentativasFalhas++;
        
        if (tentativasFalhas >= MAX_TENTATIVAS) {
            console.error('[Auth] ❌ Máximo de tentativas atingido');
            await supabaseClient.auth.signOut();
            redirecionarLogin();
            return false;
        }
        
        return false;
    }
}

// ==========================================
// FUNÇÃO PARA TORNAR ADMIN POR EMAIL
// ==========================================
async function tornarAdminPorEmail(email) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) return;
        
        // Buscar o usuário no auth
        const { data: { users } } = await supabaseClient.auth.admin.listUsers();
        const user = users?.find(u => u.email === email);
        
        if (!user) {
            console.error('[Auth] ❌ Usuário não encontrado no auth');
            return;
        }
        
        // Atualizar ou inserir perfil como admin
        const { error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                nome: user.user_metadata?.full_name || email.split('@')[0],
                role: 'admin',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        
        if (error) {
            console.error('[Auth] ❌ Erro ao tornar admin:', error);
        } else {
            console.log('[Auth] ✅ Usuário tornado ADMIN:', email);
        }
    } catch (error) {
        console.error('[Auth] ❌ Erro ao tornar admin:', error);
    }
}

// ==========================================
// CRIAR PERFIL USUÁRIO
// ==========================================
async function criarPerfilUsuario(user) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) return;
        
        const nome = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
        const avatarUrl = user.user_metadata?.avatar_url || null;
        
        // Verificar se é o admin principal
        const isAdminEmail = user.email === 'projectozerosatus@gmail.com';
        
        const { error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                nome: nome,
                role: isAdminEmail ? 'admin' : 'user',
                avatar_url: avatarUrl,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            
        if (error) {
            console.error('[Auth] ❌ Erro ao criar perfil:', error);
            throw error;
        }
        
        console.log('[Auth] ✅ Perfil criado para:', user.email, 'Role:', isAdminEmail ? 'admin' : 'user');
    } catch (error) {
        console.error('[Auth] ❌ Erro ao criar perfil:', error);
        throw error;
    }
}

// ==========================================
// ATUALIZAR INTERFACE DO ADMIN
// ==========================================
function atualizarInterfaceAdmin(profile, user) {
    console.log('[Auth] 📋 Atualizando interface admin...');
    
    const adminPanel = document.getElementById('adminPanel');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminName = document.getElementById('adminNameDisplay');
    
    if (adminPanel) {
        adminPanel.style.display = 'flex';
        console.log('[Auth] ✅ Painel admin exibido');
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = 'block';
        console.log('[Auth] ✅ Botão logout exibido');
    }
    
    if (adminName) {
        adminName.textContent = profile.nome || 'Administrador';
        console.log('[Auth] ✅ Nome admin definido:', adminName.textContent);
    }
    
    // Atualizar badge na sidebar
    const adminBadge = document.querySelector('.badge-admin');
    if (adminBadge) {
        adminBadge.textContent = 'ADMIN';
    }
    
    // Salvar dados do admin no localStorage
    try {
        const adminData = {
            id: user.id,
            email: user.email,
            nome: profile.nome,
            role: profile.role,
            avatar_url: profile.avatar_url || user.user_metadata?.avatar_url,
            logado: true
        };
        localStorage.setItem('usuarioLogado', JSON.stringify(adminData));
        console.log('[Auth] ✅ Dados admin salvos no localStorage');
    } catch (e) {
        console.warn('[Auth] ⚠️ Erro ao salvar dados:', e);
    }
}

// ==========================================
// REDIRECIONAR PARA LOGIN
// ==========================================
function redirecionarLogin() {
    console.log('[Auth] 🔄 Redirecionando para login...');
    
    authVerificado = false;
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('userPhotoURL');
    
    if (window.CacheManager) {
        window.CacheManager.logout();
    }
    
    setTimeout(() => {
        window.location.replace('../login/index.html');
    }, 300);
}

// ==========================================
// LOGOUT
// ==========================================
window.logoutAdmin = async function() {
    console.log('[Auth] 🔴 Fazendo logout...');
    
    if (!confirm('Tem certeza que deseja sair?')) return;

    try {
        const supabaseClient = window.supabaseClient;
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }

        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('userPhotoURL');
        authVerificado = false;

        if (window.CacheManager) {
            window.CacheManager.logout();
        }

        window.location.replace('../login/index.html');

    } catch (error) {
        console.error('[Auth] ❌ Erro no logout:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erro ao sair: ' + error.message, true);
        }
    }
};

// ==========================================
// CONFIGURAR BOTÃO DE LOGOUT
// ==========================================
function configurarLogout() {
    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        const novoBtn = btnLogout.cloneNode(true);
        btnLogout.parentNode.replaceChild(novoBtn, btnLogout);
        
        novoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.logoutAdmin();
        });
        console.log('[Auth] ✅ Botão de logout configurado');
    }
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Auth] 📋 DOM carregado, configurando...');
    
    configurarLogout();
    
    // Tentar restaurar sessão do localStorage primeiro
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        try {
            const parsed = JSON.parse(usuarioSalvo);
            if (parsed.role === 'admin' && parsed.logado === true) {
                console.log('[Auth] 🔄 Restaurando admin do localStorage...');
                
                // Verificar se a sessão existe
                const supabaseClient = window.supabaseClient;
                if (supabaseClient) {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (session) {
                        console.log('[Auth] ✅ Sessão válida, restaurando...');
                        // Atualizar interface com os dados salvos
                        const profile = {
                            nome: parsed.nome,
                            role: parsed.role,
                            email: parsed.email,
                            avatar_url: parsed.avatar_url
                        };
                        atualizarInterfaceAdmin(profile, session.user);
                        authVerificado = true;
                        window.dispatchEvent(new CustomEvent('adminVerificado'));
                        return;
                    } else {
                        console.log('[Auth] ⚠️ Sessão expirada, tentando refresh...');
                        await supabaseClient.auth.refreshSession();
                        const { data: { session: refreshed } } = await supabaseClient.auth.getSession();
                        if (refreshed) {
                            console.log('[Auth] ✅ Sessão restaurada por refresh');
                            const profile = {
                                nome: parsed.nome,
                                role: parsed.role,
                                email: parsed.email,
                                avatar_url: parsed.avatar_url
                            };
                            atualizarInterfaceAdmin(profile, refreshed.user);
                            authVerificado = true;
                            window.dispatchEvent(new CustomEvent('adminVerificado'));
                            return;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[Auth] ⚠️ Erro ao restaurar:', e);
        }
    }
    
    // Se não restaurou, verificar normalmente
    setTimeout(async () => {
        await verificarAdmin();
    }, 500);
});

// ==========================================
// MONITORAR VISIBILIDADE
// ==========================================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !authVerificado) {
        console.log('[Auth] 🔄 Página visível novamente, verificando...');
        setTimeout(async () => {
            await verificarAdmin();
        }, 500);
    }
});

console.log('[Auth] ✅ auth.js carregado!');