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
let authTimeout = null;

// ==========================================
// VERIFICAR ADMIN - VERSÃO CORRIGIDA
// ==========================================
async function verificarAdmin() {
    console.log('[Auth] 🔍 Verificando autenticação...');
    
    // Evitar múltiplas verificações simultâneas
    if (authVerificado) {
        console.log('[Auth] ✅ Já verificado anteriormente');
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
            console.log('[Auth] ❌ Sem sessão, redirecionando para login...');
            redirecionarLogin();
            return false;
        }

        const user = session.user;
        console.log('[Auth] 👤 Usuário logado:', user.email);

        // 2. Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role, nome, email, avatar_url')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[Auth] ❌ Erro ao buscar perfil:', profileError);
            
            // Se erro 404, criar perfil
            if (profileError.code === 'PGRST116') {
                console.log('[Auth] 🔄 Criando perfil para usuário...');
                await criarPerfilUsuario(user);
                // Tentar buscar novamente
                const { data: newProfile, error: newError } = await supabaseClient
                    .from('profiles')
                    .select('role, nome, email, avatar_url')
                    .eq('id', user.id)
                    .single();
                    
                if (newError || !newProfile) {
                    console.error('[Auth] ❌ Falha ao criar perfil');
                    await supabaseClient.auth.signOut();
                    redirecionarLogin();
                    return false;
                }
                
                // Verificar role do novo perfil
                if (newProfile.role !== 'admin') {
                    console.log('[Auth] ❌ Acesso negado - não é admin');
                    await supabaseClient.auth.signOut();
                    redirecionarLogin();
                    return false;
                }
                
                // Atualizar UI com novo perfil
                atualizarInterfaceAdmin(newProfile, user);
                authVerificado = true;
                return true;
            }
            
            await supabaseClient.auth.signOut();
            redirecionarLogin();
            return false;
        }

        // 3. Verificar se é admin
        if (!profile || profile.role !== 'admin') {
            console.log('[Auth] ❌ Acesso negado - não é admin. Role:', profile?.role);
            await supabaseClient.auth.signOut();
            redirecionarLogin();
            return false;
        }

        console.log('[Auth] ✅ Usuário é ADMIN:', profile.nome);
        
        // 4. Atualizar interface
        atualizarInterfaceAdmin(profile, user);
        authVerificado = true;
        
        // 5. Disparar evento de admin verificado
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
// CRIAR PERFIL USUÁRIO
// ==========================================
async function criarPerfilUsuario(user) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) return;
        
        const nome = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
        const avatarUrl = user.user_metadata?.avatar_url || null;
        
        const { error } = await supabaseClient
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email,
                nome: nome,
                role: 'user',
                avatar_url: avatarUrl,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            
        if (error) {
            console.error('[Auth] ❌ Erro ao criar perfil:', error);
            throw error;
        }
        
        console.log('[Auth] ✅ Perfil criado para:', user.email);
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
    
    // Limpar dados
    authVerificado = false;
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('userPhotoURL');
    
    if (window.CacheManager) {
        window.CacheManager.logout();
    }
    
    // Redirecionar - USAR REPLACE PARA NÃO PERMITIR VOLTAR
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
        // Remover listeners antigos
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
// RESTAURAR SESSÃO (para quando voltar à página)
// ==========================================
async function restaurarSessao() {
    console.log('[Auth] 🔄 Restaurando sessão...');
    
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        console.log('[Auth] ❌ Nenhum usuário salvo');
        return false;
    }
    
    try {
        const usuario = JSON.parse(usuarioSalvo);
        
        // Verificar se ainda é admin
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.error('[Auth] ❌ Supabase não disponível');
            return false;
        }
        
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            console.log('[Auth] ❌ Sessão expirada');
            localStorage.removeItem('usuarioLogado');
            return false;
        }
        
        // Verificar se o perfil ainda existe
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role, nome')
            .eq('id', session.user.id)
            .single();
            
        if (!profile || profile.role !== 'admin') {
            console.log('[Auth] ❌ Não é mais admin');
            localStorage.removeItem('usuarioLogado');
            await supabaseClient.auth.signOut();
            return false;
        }
        
        // Restaurar interface
        atualizarInterfaceAdmin(profile, session.user);
        authVerificado = true;
        
        console.log('[Auth] ✅ Sessão restaurada');
        return true;
        
    } catch (error) {
        console.error('[Auth] ❌ Erro ao restaurar sessão:', error);
        return false;
    }
}

// ==========================================
// EXPORTAR FUNÇÕES
// ==========================================
window.verificarAdmin = verificarAdmin;
window.logoutAdmin = window.logoutAdmin;
window.restaurarSessao = restaurarSessao;
window.authVerificado = () => authVerificado;

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Auth] 📋 DOM carregado, configurando...');
    
    // Configurar botão de logout
    configurarLogout();
    
    // Tentar restaurar sessão primeiro
    const restaurado = await restaurarSessao();
    if (restaurado) {
        console.log('[Auth] ✅ Sessão restaurada com sucesso!');
        // Disparar evento de admin verificado
        window.dispatchEvent(new CustomEvent('adminVerificado'));
        return;
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