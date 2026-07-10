// ==========================================
// dashboard.js - DASHBOARD E ESTATÍSTICAS
// ==========================================

console.log('[Dashboard] 📊 Carregando dashboard...');

// ==========================================
// CARREGAR ESTATÍSTICAS DO DASHBOARD
// ==========================================
async function loadDashboardStats() {
    console.log('[Dashboard] 📊 Carregando estatísticas...');
    
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.error('[Dashboard] ❌ supabaseClient não encontrado');
        mostrarErroEstatisticas();
        return;
    }

    try {
        // 🔥 Verificar sessão primeiro
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            console.warn('[Dashboard] ⚠️ Sem sessão');
            mostrarErroEstatisticas();
            return;
        }

        console.log('[Dashboard] 🔍 Buscando estatísticas...');

        // Usar a função SQL get_admin_stats
        const { data, error } = await supabaseClient.rpc('get_admin_stats');

        if (error) {
            console.error('[Dashboard] ❌ Erro ao carregar estatísticas:', error);
            
            // Se for erro de permissão (RLS), usar fallback
            if (error.code === 'PGRST301' || 
                error.message?.includes('permission denied') || 
                error.message?.includes('permission denied for function') ||
                (error.message?.includes('function') && error.message?.includes('not found'))) {
                console.log('[Dashboard] 🔄 Usando fallback para estatísticas básicas...');
                await carregarStatsBasicos();
                return;
            }
            
            mostrarErroEstatisticas();
            return;
        }

        if (data && data.length > 0) {
            const stats = data[0];
            
            // Atualizar elementos
            atualizarElemento('countUsers', stats.total_usuarios);
            atualizarElemento('countPosts', stats.total_posts);
            atualizarElemento('countComments', stats.total_comentarios);
            atualizarElemento('countActiveTasks', stats.total_rascunhos);
            atualizarElemento('countNewUsers', stats.novos_usuarios_7dias);
            atualizarElemento('countBannedUsers', stats.total_banidos);
            atualizarElemento('countDraftPosts', stats.total_rascunhos);
            atualizarElemento('countActiveToday', stats.ativos_hoje);
            
            console.log('[Dashboard] ✅ Estatísticas carregadas:', stats);
        } else {
            console.warn('[Dashboard] ⚠️ Nenhum dado retornado, usando fallback');
            await carregarStatsBasicos();
        }

        // Carregar atividades recentes
        await loadRecentActivities();

    } catch (error) {
        console.error('[Dashboard] ❌ Erro ao carregar estatísticas:', error);
        mostrarErroEstatisticas();
    }
}

// ==========================================
// CARREGAR STATS BÁSICOS (FALLBACK)
// ==========================================
async function carregarStatsBasicos() {
    console.log('[Dashboard] 📊 Carregando stats básicos (fallback)...');
    
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        mostrarErroEstatisticas();
        return;
    }
    
    try {
        // Contar usuários
        const { count: usersCount, error: usersError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        if (usersError) {
            console.warn('[Dashboard] ⚠️ Erro ao contar usuários:', usersError);
        }
        
        // Contar posts (tasks)
        const { count: postsCount, error: postsError } = await supabaseClient
            .from('tasks')
            .select('*', { count: 'exact', head: true });
        
        if (postsError) {
            console.warn('[Dashboard] ⚠️ Erro ao contar posts:', postsError);
        }
        
        // Contar comentários (notifications)
        const { count: commentsCount, error: commentsError } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true });
        
        if (commentsError) {
            console.warn('[Dashboard] ⚠️ Erro ao contar comentários:', commentsError);
        }
        
        // Contar tarefas ativas
        const { count: tasksCount, error: tasksError } = await supabaseClient
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('completed', false);
        
        if (tasksError) {
            console.warn('[Dashboard] ⚠️ Erro ao contar tarefas ativas:', tasksError);
        }
        
        // Atualizar elementos com os dados básicos
        atualizarElemento('countUsers', usersCount || 0);
        atualizarElemento('countPosts', postsCount || 0);
        atualizarElemento('countComments', commentsCount || 0);
        atualizarElemento('countActiveTasks', tasksCount || 0);
        atualizarElemento('countNewUsers', '📊');
        atualizarElemento('countBannedUsers', '📊');
        atualizarElemento('countDraftPosts', '📊');
        atualizarElemento('countActiveToday', '📊');
        
        console.log('[Dashboard] ✅ Stats básicos carregados:', {
            users: usersCount || 0,
            posts: postsCount || 0,
            comments: commentsCount || 0,
            tasks: tasksCount || 0
        });
        
    } catch (e) {
        console.warn('[Dashboard] ⚠️ Erro no fallback:', e);
        mostrarErroEstatisticas();
    }
}

// ==========================================
// ATUALIZAR ELEMENTO
// ==========================================
function atualizarElemento(id, valor) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = valor !== undefined && valor !== null ? valor : '-';
    }
}

// ==========================================
// MOSTRAR ERRO
// ==========================================
function mostrarErroEstatisticas() {
    const ids = ['countUsers', 'countPosts', 'countComments', 'countActiveTasks', 
                 'countNewUsers', 'countBannedUsers', 'countDraftPosts', 'countActiveToday'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '❌';
    });
}

// ==========================================
// CARREGAR ATIVIDADES RECENTES - CORRIGIDA
// ==========================================
async function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;

    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--danger);">
                <i class="fas fa-exclamation-circle"></i> Erro ao carregar atividades
            </div>
        `;
        return;
    }

    try {
        // Tentar usar a função RPC
        let data = null;
        let error = null;
        
        try {
            const result = await supabaseClient.rpc('get_recent_activities', {
                limit_count: 10
            });
            data = result.data;
            error = result.error;
        } catch (e) {
            console.warn('[Dashboard] ⚠️ RPC falhou, usando fallback:', e);
        }

        // Se RPC falhou, buscar dados diretamente
        if (error || !data || data.length === 0) {
            console.log('[Dashboard] 🔄 Buscando atividades diretamente...');
            data = await buscarAtividadesDiretamente(supabaseClient);
        }

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <i class="fas fa-inbox"></i> Nenhuma atividade recente
                    <br>
                    <small style="font-size: 12px;">Cadastre usuários ou crie posts para ver atividades aqui.</small>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.tipo || 'user'}">
                    <i class="fas ${activity.icone || 'fa-circle'}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.titulo || 'Atividade'}</div>
                    <div style="color: var(--text-muted); font-size: 13px;">${activity.descricao || ''}</div>
                    <div class="activity-time">
                        <i class="fas fa-user"></i> ${activity.usuario || 'Sistema'} 
                        <i class="fas fa-clock" style="margin-left: 10px;"></i> ${formatarDataRelativa(activity.data || new Date())}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('[Dashboard] ❌ Erro:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i> Erro ao carregar atividades
            </div>
        `;
    }
}

// ==========================================
// BUSCAR ATIVIDADES DIRETAMENTE (FALLBACK)
// ==========================================
async function buscarAtividadesDiretamente(supabaseClient) {
    const atividades = [];
    const limit = 10;

    try {
        // Buscar novos usuários
        const { data: users, error: usersError } = await supabaseClient
            .from('profiles')
            .select('nome, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (usersError) {
            console.warn('[Dashboard] ⚠️ Erro ao buscar usuários:', usersError);
        }

        if (users && users.length > 0) {
            users.forEach(u => {
                atividades.push({
                    tipo: 'user',
                    titulo: 'Novo usuário',
                    descricao: (u.nome || 'Usuário') + ' se cadastrou',
                    usuario: u.nome || 'Sistema',
                    data: u.created_at,
                    icone: 'fa-user-plus',
                    cor: '#9333ea'
                });
            });
        }

        // Buscar novos posts (tasks)
        const { data: posts, error: postsError } = await supabaseClient
            .from('tasks')
            .select('title, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(5);

        if (postsError) {
            console.warn('[Dashboard] ⚠️ Erro ao buscar posts:', postsError);
        }

        if (posts && posts.length > 0) {
            for (const p of posts) {
                let nome = 'Sistema';
                if (p.user_id) {
                    try {
                        const { data: profile } = await supabaseClient
                            .from('profiles')
                            .select('nome')
                            .eq('id', p.user_id)
                            .single();
                        if (profile) nome = profile.nome || 'Sistema';
                    } catch (e) {
                        // Ignorar erro ao buscar perfil
                    }
                }
                atividades.push({
                    tipo: 'post',
                    titulo: 'Novo post',
                    descricao: (p.title || 'Sem título') + ' foi criado',
                    usuario: nome,
                    data: p.created_at,
                    icone: 'fa-newspaper',
                    cor: '#10b981'
                });
            }
        }

        // Buscar novos comentários (notifications)
        const { data: comments, error: commentsError } = await supabaseClient
            .from('notifications')
            .select('title, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(5);

        if (commentsError) {
            console.warn('[Dashboard] ⚠️ Erro ao buscar comentários:', commentsError);
        }

        if (comments && comments.length > 0) {
            for (const c of comments) {
                let nome = 'Sistema';
                if (c.user_id) {
                    try {
                        const { data: profile } = await supabaseClient
                            .from('profiles')
                            .select('nome')
                            .eq('id', c.user_id)
                            .single();
                        if (profile) nome = profile.nome || 'Sistema';
                    } catch (e) {
                        // Ignorar erro ao buscar perfil
                    }
                }
                atividades.push({
                    tipo: 'comment',
                    titulo: 'Novo comentário',
                    descricao: (c.title || 'Anônimo') + ' comentou',
                    usuario: nome,
                    data: c.created_at,
                    icone: 'fa-comment',
                    cor: '#f59e0b'
                });
            }
        }

        // Buscar usuários banidos
        const { data: banned, error: bannedError } = await supabaseClient
            .from('profiles')
            .select('nome, updated_at')
            .eq('role', 'banned')
            .order('updated_at', { ascending: false })
            .limit(3);

        if (bannedError) {
            console.warn('[Dashboard] ⚠️ Erro ao buscar banidos:', bannedError);
        }

        if (banned && banned.length > 0) {
            banned.forEach(b => {
                atividades.push({
                    tipo: 'alert',
                    titulo: 'Usuário banido',
                    descricao: (b.nome || 'Usuário') + ' foi banido',
                    usuario: 'Sistema',
                    data: b.updated_at,
                    icone: 'fa-ban',
                    cor: '#ef4444'
                });
            });
        }

        // Ordenar por data e limitar
        atividades.sort((a, b) => new Date(b.data) - new Date(a.data));
        return atividades.slice(0, limit);

    } catch (error) {
        console.error('[Dashboard] ❌ Erro no fallback:', error);
        return [];
    }
}

// ==========================================
// FORMATAR DATA RELATIVA
// ==========================================
function formatarDataRelativa(data) {
    if (!data) return 'Data desconhecida';
    try {
        const date = new Date(data);
        if (isNaN(date.getTime())) return 'Data inválida';
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return data;
    }
}

// ==========================================
// ATUALIZAR STATUS DO SISTEMA
// ==========================================
function atualizarStatusSistema() {
    const statusEl = document.getElementById('lastSyncStatus');
    if (statusEl) {
        const now = new Date();
        statusEl.textContent = `Última sincronização: ${now.toLocaleTimeString('pt-BR')}`;
    }
}

// ==========================================
// EXPORTAR FUNÇÕES
// ==========================================
window.loadDashboardStats = loadDashboardStats;
window.loadRecentActivities = loadRecentActivities;
window.buscarAtividadesDiretamente = buscarAtividadesDiretamente;
window.formatarDataRelativa = formatarDataRelativa;

console.log('[Dashboard] ✅ dashboard.js carregado!');